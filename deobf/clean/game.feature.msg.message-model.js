/**
 * @module game.feature.msg.message-model
 *
 * Central message/dialog model. Manages the visual novel-style
 * conversation system: showing messages, choices, board messages,
 * side messages, private messages, and person management. Tracks
 * message blocking state, auto-script timers, and integration
 * with the voice acting system.
 */
ig.module("game.feature.msg.message-model").requires("impact.base.game", "impact.feature.storage.storage", "game.feature.model.base-model", "impact.feature.interact.interact", "impact.feature.interact.button-interact").defines(function() {
    var buttonInteract = new ig.ButtonInteractEntry;
    sc.MessageModel = ig.GameAddon.extend({
        observers: [],
        sideMessages: [], sideMessageStack: [], sideMessageDelayedStack: [],
        sideMessageQueuing: false, displayedSideMessages: 0,
        currentPeople: {}, stashedPeople: [], blocking: false,
        currentChoiceOptions: null, lastSelectedChoice: null,
        autoContinue: false, autoScript: false, autoScriptTimer: 0, loaded: false,
        screenInteract: null, privateMode: 0, boardVisible: false, boardSide: null,
        menuMode: false, bottomGap: 0,
        init: function() {
            this.parent("MessageModel");
            ig.storage.register(this);
            this.screenInteract = new sc.ScreenInteractEntry(this);
            ig.vars.registerVarAccessor("msg", this, "VarMsgEditor")
        },
        isBlocking: function() {return this.blocking},
        clearBlocking: function() {ig.interact.removeEntry(this.screenInteract); this.blocking = false},
        clearDreamMessage: function() {sc.Model.notifyObserver(this, sc.MESSAGE_EVENT.DREAM_MSG_CLOSE)},
        onSkipClearBlocking: function() {if (this.privateMode == 1) this.privateMode = 2; this.clearBlocking()},
        ringPrivateMessage: function(skipSounds) {
            this.privateMode = 1;
            if (!ig.system.skipMode) {this.blocking = true; ig.interact.addEntry(this.screenInteract); ig.interact.setBlockDelay(0.1)}
            sc.Model.notifyObserver(this, sc.MESSAGE_EVENT.RING_PRIVATE, skipSounds)
        },
        isPrivateRing: function() {return this.privateMode == 2 || this.privateMode == 1},
        isPrivateActive: function() {return this.privateMode == 3},
        startPrivateMessage: function() {
            if (this.privateMode != 3) {this.clearAll(); this.privateMode = 3; this.blocking = true; sc.Model.notifyObserver(this, sc.MESSAGE_EVENT.START_PRIVATE)}
        },
        endPrivateMessage: function(skipSounds) {
            if (this.privateMode != 0) {
                var dropped = true;
                if (this.privateMode == 3) {dropped = false; this.clearAll(); this.clearBoardMsg()}
                this.privateMode = 0; this.blocking = true;
                sc.Model.notifyObserver(this, dropped ? sc.MESSAGE_EVENT.DROP_PRIVATE : sc.MESSAGE_EVENT.END_PRIVATE, skipSounds)
            }
        },
        setMenuMode: function(state) {
            if (this.menuMode != state) {
                (this.menuMode = state) ? ig.interact.addEntry(buttonInteract) : ig.interact.removeEntry(buttonInteract);
                sc.Model.notifyObserver(this, sc.MESSAGE_EVENT.MENU_MODE_CHANGE, this.menuMode);
                sc.model.stopSkip()
            }
        },
        setBottomGap: function(gap) {if (gap != this.bottomGap) {this.bottomGap = gap; sc.Model.notifyObserver(this, sc.MESSAGE_EVENT.BOTTOM_GAP_CHANGE, gap)}},
        isMenuMode: function() {return this.menuMode},
        showMessage: function(name, text, autoContinue) {
            this.boardSide || this.clearBoardMsg();
            this._checkActivePerson(name);
            this.blocking = true;
            if (this.autoScript && !autoContinue) {this.autoScriptTimer = this.getMessageTime(text); this.autoContinue = false}
            else this.autoContinue = autoContinue;
            ig.interact.addEntry(this.screenInteract);
            ig.interact.setBlockDelay(0.1);
            sc.Model.notifyObserver(this, sc.MESSAGE_EVENT.NEW_MESSAGE, {name: name, text: text});
            var person = this.currentPeople[name];
            if (person) {sc.voiceActing.play(person.charExpression, text); this.showSideMessage(person.charExpression, text, true)}
        },
        getMessageTime: function(text) {
            var parsed = ig.TextParser.parse(text.toString(), []);
            return Math.max(0.8, parsed.length / 20 * 0.9 + 0.65)
        },
        showOffScreenMessage: function(leftSide, text, autoContinue) {
            this.boardSide || this.clearBoardMsg();
            this.blocking = true; this.autoContinue = autoContinue;
            ig.interact.addEntry(this.screenInteract); ig.interact.setBlockDelay(0.1);
            sc.Model.notifyObserver(this, sc.MESSAGE_EVENT.NEW_MESSAGE, {name: null, text: text, left: leftSide})
        },
        showBoardMessage: function(text, center, side, autoContinue) {
            sc.model.clearTopMessage();
            !this.boardVisible && !side && this.stashPersons();
            this.blocking = true; ig.interact.addEntry(this.screenInteract); ig.interact.setBlockDelay(0.1);
            this.boardVisible = true; this.boardSide = side; this.autoContinue = autoContinue;
            sc.Model.notifyObserver(this, sc.MESSAGE_EVENT.NEW_BOARD_MESSAGE, {text: text, center: center, side: side})
        },
        hasBoardMessage: function() {return this.boardVisible},
        showChoice: function(name, options, columns, forceWidth) {
            this.boardSide || this.clearBoardMsg();
            if (ig.langEdit)
                for (var idx = options.length; idx--;) ig.langEdit.submitRecent("Choice " + idx, options[idx].label);
            this._checkActivePerson(name);
            this.blocking = true; this.currentChoiceOptions = options;
            sc.model.stopSkip();
            sc.Model.notifyObserver(this, sc.MESSAGE_EVENT.SHOW_CHOICE, {name: name, options: options, columns: columns, forceWidth: forceWidth})
        },
        _isSideMessageDelayed: function() {
            return sc.model.isLevelUp() || sc.quests.hasQuestSolvedDialogs() || !sc.model.isCombatActive() && !sc.model.isCombatCooldown() && !sc.model.isCutscene() && (sc.model.player.hasLevelUp() || sc.quests.hasSolvedQuestsStacked())
        },
        showSideMessage: function(charExpression, message, isMain) {
            var sideMsg = {charExpression: charExpression.clone(), message: ig.LangLabel.bakeVars(message), main: isMain || false};
            !isMain && this._isSideMessageDelayed() ? this.sideMessageDelayedStack.push(sideMsg) : this._showSideMessage(sideMsg)
        },
        _showSideMessage: function(sideMsg) {
            this.sideMessageQueuing || this.clearSideMessages();
            this.sideMessageQueuing = true;
            this.sideMessageStack.push(sideMsg);
            sideMsg.main ? this.getNextSideMessage() : sc.Model.notifyObserver(this, sc.MESSAGE_EVENT.NEW_SIDE_MESSAGE)
        },
        selectChoice: function(index) {this.lastSelectedChoice = index; this.currentChoiceOptions = null; this.clearBlocking()},
        clearSideMessages: function() {
            for (this.recentlyClearedSideMsg = this.sideMessageStack.length; this.sideMessageStack.length > 0;) {
                var entry = this.sideMessageStack.shift(); this.sideMessages.push(entry)
            }
            for (; this.sideMessages.length > 50;) this.sideMessages.shift().charExpression.decreaseRef();
            sc.Model.notifyObserver(this, sc.MESSAGE_EVENT.CLEARED_SIDE_MESSAGE)
        },
        addPerson: function(charExpression, side, order, displayName) {
            this.boardSide || this.clearBoardMsg();
            var name = charExpression.character.name;
            if (this.currentPeople[name]) {
                this.currentPeople[name].side = side; this.currentPeople[name].order = order;
                this.currentPeople[name].charExpression = charExpression; this.currentPeople[name].displayName = displayName || null;
                sc.Model.notifyObserver(this, sc.MESSAGE_EVENT.PERSON_CHANGED, name)
            } else {
                this.currentPeople[name] = {charExpression: charExpression, side: side, order: order, displayName: displayName || null};
                sc.Model.notifyObserver(this, sc.MESSAGE_EVENT.PERSON_ADDED, name)
            }
        },
        setExpression: function(name, charExpression) {
            if (this.currentPeople[name]) {this.currentPeople[name].charExpression = charExpression; sc.Model.notifyObserver(this, sc.MESSAGE_EVENT.EXPRESSION_CHANGED, name)}
        },
        removePerson: function(name) {
            this.boardSide || this.clearBoardMsg();
            if (this.currentPeople[name]) {delete this.currentPeople[name]; sc.Model.notifyObserver(this, sc.MESSAGE_EVENT.PERSON_REMOVED, name)}
        },
        clearSide: function(side) {
            for (var name in this.currentPeople) (!side || this.currentPeople[name].side == side) && delete this.currentPeople[name];
            side == sc.MESSAGE_SIDES_OR_ALL.ALL && this.clearBoardMsg();
            sc.Model.notifyObserver(this, sc.MESSAGE_EVENT.CLEARED, side)
        },
        clearAll: function() {this.clearSide(sc.MESSAGE_SIDES_OR_ALL.ALL)},
        clearBoardMsg: function() {
            if (this.boardVisible) {this.boardVisible = false; this.boardSide = null; sc.Model.notifyObserver(this, sc.MESSAGE_EVENT.CLEAR_BOARD_MESSAGE, null); this.showStashedPersons()}
        },
        onSceneEnd: function(skipSounds) {this.clearAll(); this.clearBoardMsg(); ig.interact.setBlockDelay(0.3); this.privateMode && this.endPrivateMessage(skipSounds)},
        stashPersons: function() {
            this.stashedPeople.length = 0;
            for (var name in this.currentPeople) {
                var p = this.currentPeople[name];
                this.stashedPeople.push({charExpression: p.charExpression, side: p.side, order: p.order, displayName: p.displayName})
            }
            this.clearAll()
        },
        showStashedPersons: function() {
            if (this.stashedPeople.length != 0) {
                this.clearAll();
                for (var idx = 0; idx < this.stashedPeople.length; ++idx) {
                    var p = this.stashedPeople[idx]; this.addPerson(p.charExpression, p.side, p.order, p.displayName)
                }
                this.stashedPeople.length = 0
            }
        },
        hasPerson: function() {for (var name in this.currentPeople) return true; return false},
        clear: function() {
            this.onSceneEnd(true);
            for (var idx = this.sideMessages.length; idx--;) this.sideMessages[idx].charExpression.decreaseRef();
            this.sideMessages = []; this.clearSideMessages()
        },
        getCharExpression: function(name) {return this.currentPeople[name] ? this.currentPeople[name].charExpression : null},
        getCharacter: function(name) {return this.currentPeople[name] ? this.currentPeople[name].charExpression.character : null},
        getExpression: function(name) {return this.currentPeople[name] ? this.currentPeople[name].charExpression.expression : null},
        getSide: function(name) {return this.currentPeople[name] ? this.currentPeople[name].side : 0},
        getOrder: function(name) {return this.currentPeople[name] ? this.currentPeople[name].order : 0},
        getDisplayName: function(name) {return this.currentPeople[name] ? this.currentPeople[name].displayName : null},
        getNextSideMessage: function() {
            var entry = this.sideMessageStack.shift();
            this.sideMessages.push(entry);
            this.sideMessages.length > 50 && this.sideMessages.shift().charExpression.decreaseRef();
            return entry
        },
        hasStackedSideMessages: function() {return this.sideMessageStack.length > 0},
        isSideMessageVisible: function() {return this.displayedSideMessages > 0},
        onInteraction: function() {
            if (this.privateMode == 1) {this.privateMode = 2; this.clearBlocking()}
            else sc.Model.notifyObserver(this, sc.MESSAGE_EVENT.MESSAGE_INTERACT, null)
        },
        onLevelLoadStart: function() {sc.model.message.clearSideMessages()},
        onLevelLoaded: function() {if (this.loaded) {sc.Model.notifyObserver(this, sc.MESSAGE_EVENT.SIDE_MESSAGES_LOADED); this.loaded = false}},
        onReset: function() {this.currentChoiceOptions = null; this.autoScript = false; this.autoScriptTimer = 0; this.clear(); this.setBottomGap(0)},
        onPreUpdate: function() {
            if (this.sideMessageDelayedStack.length > 0 && !this._isSideMessageDelayed())
                for (; this.sideMessageDelayedStack.length > 0;) {var msg = this.sideMessageDelayedStack.shift(); this._showSideMessage(msg)}
            if (this.autoScript && this.autoScriptTimer && !ig.game.paused) {
                this.autoScriptTimer = this.autoScriptTimer - ig.system.actualTick;
                if (this.autoScriptTimer <= 0) {this.autoScriptTimer = 0; this.clearBlocking()}
            }
            this.sideMessageQueuing = false
        },
        onStorageSave: function(data) {
            var msg = {}; msg.autoScript = this.autoScript;
            msg.sideMessages = this._convertSideMessagesToJson(this.sideMessages);
            msg.sideMessageStack = this._convertSideMessagesToJson(this.sideMessageStack);
            msg.displayedSideMessages = this.displayedSideMessages;
            data.message = msg
        },
        _convertSideMessagesToJson: function(messages) {
            for (var result = [], idx = 0; idx < messages.length; ++idx) {
                var entry = messages[idx];
                result.push({"char": entry.charExpression.character.name, expression: entry.charExpression.expression, message: entry.message ? entry.message.data || entry.message : "", main: entry.main})
            }
            return result
        },
        onStoragePreLoad: function(data) {
            this.loaded = true;
            var msg = data.message;
            this.sideMessages = this._convertJsonToSideMessage(msg.sideMessages || []);
            this.sideMessageStack = this._convertJsonToSideMessage(msg.sideMessageStack || []);
            this.displayedSideMessages = msg.displayedSideMessages;
            this.autoScript = msg.autoScript || false
        },
        _convertJsonToSideMessage: function(json) {
            for (var result = [], idx = 0; idx < json.length; ++idx) {
                var entry = json[idx];
                if (entry["char"]) {
                    var text = entry.message;
                    text && typeof text !== "string" && (text = new ig.LangLabel(text));
                    result.push({charExpression: new sc.CharacterExpression(entry["char"], entry.expression), message: text, main: entry.main || false})
                }
            }
            return result
        },
        hasChoice: function() {return !!this.currentChoiceOptions},
        _checkActivePerson: function(name) {
            if (!this.currentPeople[name]) throw Error("Character of name '" + name + "' is currently not in conversation!");
        },
        onVarAccess: function(path, args) {
            if (args[0] == "msg") {
                var query = args[1];
                return query == "hasSideMsg" ? this.hasStackedSideMessages() : query == "isSideMsgVisible" ? this.isSideMessageVisible() : query == "stackCount" ? this.sideMessageStack.length : query == "recentlyClearedSideMsg" ? this.recentlyClearedSideMsg : null
            }
        }
    });
    sc.MESSAGE_EVENT = {};
    sc.MESSAGE_EVENT.PERSON_ADDED = 0; sc.MESSAGE_EVENT.PERSON_REMOVED = 1;
    sc.MESSAGE_EVENT.PERSON_CHANGED = 2; sc.MESSAGE_EVENT.EXPRESSION_CHANGED = 3;
    sc.MESSAGE_EVENT.NEW_MESSAGE = 4; sc.MESSAGE_EVENT.NEW_SIDE_MESSAGE = 5;
    sc.MESSAGE_EVENT.CLEARED = 6; sc.MESSAGE_EVENT.CLEARED_SIDE_MESSAGE = 7;
    sc.MESSAGE_EVENT.SHOW_CHOICE = 8; sc.MESSAGE_EVENT.SIDE_MESSAGES_LOADED = 9;
    sc.MESSAGE_EVENT.MESSAGE_INTERACT = 10; sc.MESSAGE_EVENT.RING_PRIVATE = 11;
    sc.MESSAGE_EVENT.START_PRIVATE = 12; sc.MESSAGE_EVENT.END_PRIVATE = 13;
    sc.MESSAGE_EVENT.DROP_PRIVATE = 14; sc.MESSAGE_EVENT.NEW_BOARD_MESSAGE = 15;
    sc.MESSAGE_EVENT.CLEAR_BOARD_MESSAGE = 16; sc.MESSAGE_EVENT.MENU_MODE_CHANGE = 17;
    sc.MESSAGE_EVENT.BOTTOM_GAP_CHANGE = 18; sc.MESSAGE_EVENT.DREAM_MSG_CLOSE = 19;
    sc.MESSAGE_SIDES = {RIGHT: 1, LEFT: 2};
    sc.MESSAGE_SIDES_OR_ALL = {RIGHT: 1, LEFT: 2, ALL: 0};
    ig.addGameAddon(function() {return sc.message = new sc.MessageModel})
});
ig.baked = !0;
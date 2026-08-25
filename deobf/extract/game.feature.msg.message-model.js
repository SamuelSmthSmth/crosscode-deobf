ig.module("game.feature.msg.message-model").requires("impact.base.game", "impact.feature.storage.storage", "game.feature.model.base-model", "impact.feature.interact.interact", "impact.feature.interact.button-interact").defines(function() {
    var b = new ig.ButtonInteractEntry;
    sc.MessageModel = ig.GameAddon.extend({
        observers: [],
        sideMessages: [],
        sideMessageStack: [],
        sideMessageDelayedStack: [],
        sideMessageQueuing: false,
        displayedSideMessages: 0,
        currentPeople: {},
        stashedPeople: [],
        blocking: false,
        currentChoiceOptions: null,
        lastSelectedChoice: null,
        autoContinue: false,
        autoScript: false,
        autoScriptTimer: 0,
        loaded: false,
        screenInteract: null,
        privateMode: 0,
        boardVisible: false,
        boardSide: null,
        menuMode: false,
        bottomGap: 0,
        init: function() {
            this.parent("MessageModel");
            ig.storage.register(this);
            this.screenInteract = new sc.ScreenInteractEntry(this);
            ig.vars.registerVarAccessor("msg", this, "VarMsgEditor")
        },
        isBlocking: function() {
            return this.blocking
        },
        clearBlocking: function() {
            ig.interact.removeEntry(this.screenInteract);
            this.blocking = false
        },
        clearDreamMessage: function() {
            sc.Model.notifyObserver(this,
                sc.MESSAGE_EVENT.DREAM_MSG_CLOSE)
        },
        onSkipClearBlocking: function() {
            if (this.privateMode == 1) this.privateMode = 2;
            this.clearBlocking()
        },
        ringPrivateMessage: function(a) {
            this.privateMode = 1;
            if (!ig.system.skipMode) {
                this.blocking = true;
                ig.interact.addEntry(this.screenInteract);
                ig.interact.setBlockDelay(0.1)
            }
            sc.Model.notifyObserver(this, sc.MESSAGE_EVENT.RING_PRIVATE, a)
        },
        isPrivateRing: function() {
            return this.privateMode == 2 || this.privateMode == 1
        },
        isPrivateActive: function() {
            return this.privateMode == 3
        },
        startPrivateMessage: function() {
            if (this.privateMode !=
                3) {
                this.clearAll();
                this.privateMode = 3;
                this.blocking = true;
                sc.Model.notifyObserver(this, sc.MESSAGE_EVENT.START_PRIVATE)
            }
        },
        endPrivateMessage: function(a) {
            if (this.privateMode != 0) {
                var b = true;
                if (this.privateMode == 3) {
                    b = false;
                    this.clearAll();
                    this.clearBoardMsg()
                }
                this.privateMode = 0;
                this.blocking = true;
                sc.Model.notifyObserver(this, b ? sc.MESSAGE_EVENT.DROP_PRIVATE : sc.MESSAGE_EVENT.END_PRIVATE, a)
            }
        },
        setMenuMode: function(a) {
            if (this.menuMode != a) {
                (this.menuMode = a) ? ig.interact.addEntry(b): ig.interact.removeEntry(b);
                sc.Model.notifyObserver(this, sc.MESSAGE_EVENT.MENU_MODE_CHANGE, this.menuMode);
                sc.model.stopSkip()
            }
        },
        setBottomGap: function(a) {
            if (a != this.bottomGap) {
                this.bottomGap = a;
                sc.Model.notifyObserver(this, sc.MESSAGE_EVENT.BOTTOM_GAP_CHANGE, a)
            }
        },
        isMenuMode: function() {
            return this.menuMode
        },
        showMessage: function(a, b, c) {
            this.boardSide || this.clearBoardMsg();
            this._checkActivePerson(a);
            this.blocking = true;
            if (this.autoScript && !c) {
                this.autoScriptTimer = this.getMessageTime(b);
                this.autoContinue = false
            } else this.autoContinue =
                c;
            ig.interact.addEntry(this.screenInteract);
            ig.interact.setBlockDelay(0.1);
            sc.Model.notifyObserver(this, sc.MESSAGE_EVENT.NEW_MESSAGE, {
                name: a,
                text: b
            });
            if (a = this.currentPeople[a]) {
                sc.voiceActing.play(a.charExpression, b);
                this.showSideMessage(a.charExpression, b, true)
            }
        },
        getMessageTime: function(a) {
            a = ig.TextParser.parse(a.toString(), []);
            return Math.max(0.8, a.length / 20 * 0.9 + 0.65)
        },
        showOffScreenMessage: function(a, b, c) {
            this.boardSide || this.clearBoardMsg();
            this.blocking = true;
            this.autoContinue = c;
            ig.interact.addEntry(this.screenInteract);
            ig.interact.setBlockDelay(0.1);
            sc.Model.notifyObserver(this, sc.MESSAGE_EVENT.NEW_MESSAGE, {
                name: null,
                text: b,
                left: a
            })
        },
        showBoardMessage: function(a, b, c, e) {
            sc.model.clearTopMessage();
            !this.boardVisible && !c && this.stashPersons();
            this.blocking = true;
            ig.interact.addEntry(this.screenInteract);
            ig.interact.setBlockDelay(0.1);
            this.boardVisible = true;
            this.boardSide = c;
            this.autoContinue = e;
            sc.Model.notifyObserver(this, sc.MESSAGE_EVENT.NEW_BOARD_MESSAGE, {
                text: a,
                center: b,
                side: c
            })
        },
        hasBoardMessage: function() {
            return this.boardVisible
        },
        showChoice: function(a, b, c, e) {
            this.boardSide || this.clearBoardMsg();
            if (ig.langEdit)
                for (var f = b.length; f--;) ig.langEdit.submitRecent("Choice " + f, b[f].label);
            this._checkActivePerson(a);
            this.blocking = true;
            this.currentChoiceOptions = b;
            sc.model.stopSkip();
            sc.Model.notifyObserver(this, sc.MESSAGE_EVENT.SHOW_CHOICE, {
                name: a,
                options: b,
                columns: c,
                forceWidth: e
            })
        },
        _isSideMessageDelayed: function() {
            return sc.model.isLevelUp() || sc.quests.hasQuestSolvedDialogs() || !sc.model.isCombatActive() && !sc.model.isCombatCooldown() &&
                !sc.model.isCutscene() && (sc.model.player.hasLevelUp() || sc.quests.hasSolvedQuestsStacked())
        },
        showSideMessage: function(a, b, c) {
            a = {
                charExpression: a.clone(),
                message: ig.LangLabel.bakeVars(b),
                main: c || false
            };
            !c && this._isSideMessageDelayed() ? this.sideMessageDelayedStack.push(a) : this._showSideMessage(a)
        },
        _showSideMessage: function(a) {
            this.sideMessageQueuing || this.clearSideMessages();
            this.sideMessageQueuing = true;
            this.sideMessageStack.push(a);
            a.main ? this.getNextSideMessage() : sc.Model.notifyObserver(this, sc.MESSAGE_EVENT.NEW_SIDE_MESSAGE)
        },
        selectChoice: function(a) {
            this.lastSelectedChoice = a;
            this.currentChoiceOptions = null;
            this.clearBlocking()
        },
        clearSideMessages: function() {
            for (this.recentlyClearedSideMsg = this.sideMessageStack.length; this.sideMessageStack.length > 0;) {
                var a = this.sideMessageStack.shift();
                this.sideMessages.push(a)
            }
            for (; this.sideMessages.length > 50;) this.sideMessages.shift().charExpression.decreaseRef();
            sc.Model.notifyObserver(this, sc.MESSAGE_EVENT.CLEARED_SIDE_MESSAGE)
        },
        addPerson: function(a, b, c, e) {
            this.boardSide || this.clearBoardMsg();
            var f = a.character.name;
            if (this.currentPeople[f]) {
                this.currentPeople[f].side = b;
                this.currentPeople[f].order = c;
                this.currentPeople[f].charExpression = a;
                this.currentPeople[f].displayName = e || null;
                sc.Model.notifyObserver(this, sc.MESSAGE_EVENT.PERSON_CHANGED, f)
            } else {
                this.currentPeople[f] = {
                    charExpression: a,
                    side: b,
                    order: c,
                    displayName: e || null
                };
                sc.Model.notifyObserver(this, sc.MESSAGE_EVENT.PERSON_ADDED, f)
            }
        },
        setExpression: function(a, b) {
            if (this.currentPeople[a]) {
                this.currentPeople[a].charExpression = b;
                sc.Model.notifyObserver(this,
                    sc.MESSAGE_EVENT.EXPRESSION_CHANGED, a)
            }
        },
        removePerson: function(a) {
            this.boardSide || this.clearBoardMsg();
            if (this.currentPeople[a]) {
                delete this.currentPeople[a];
                sc.Model.notifyObserver(this, sc.MESSAGE_EVENT.PERSON_REMOVED, a)
            }
        },
        clearSide: function(a) {
            for (var b in this.currentPeople)(!a || this.currentPeople[b].side == a) && delete this.currentPeople[b];
            a == sc.MESSAGE_SIDES_OR_ALL.ALL && this.clearBoardMsg();
            sc.Model.notifyObserver(this, sc.MESSAGE_EVENT.CLEARED, a)
        },
        clearAll: function() {
            this.clearSide(sc.MESSAGE_SIDES_OR_ALL.ALL)
        },
        clearBoardMsg: function() {
            if (this.boardVisible) {
                this.boardVisible = false;
                this.boardSide = null;
                sc.Model.notifyObserver(this, sc.MESSAGE_EVENT.CLEAR_BOARD_MESSAGE, null);
                this.showStashedPersons()
            }
        },
        onSceneEnd: function(a) {
            this.clearAll();
            this.clearBoardMsg();
            ig.interact.setBlockDelay(0.3);
            this.privateMode && this.endPrivateMessage(a)
        },
        stashPersons: function() {
            this.stashedPeople.length = 0;
            for (var a in this.currentPeople) {
                var b = this.currentPeople[a];
                this.stashedPeople.push({
                    charExpression: b.charExpression,
                    side: b.side,
                    order: b.order,
                    displayName: b.displayName
                })
            }
            this.clearAll()
        },
        showStashedPersons: function() {
            if (this.stashedPeople.length != 0) {
                this.clearAll();
                for (var a = 0; a < this.stashedPeople.length; ++a) {
                    var b = this.stashedPeople[a];
                    this.addPerson(b.charExpression, b.side, b.order, b.displayName)
                }
                this.stashedPeople.length = 0
            }
        },
        hasPerson: function() {
            for (var a in this.currentPeople) return true;
            return false
        },
        clear: function() {
            this.onSceneEnd(true);
            for (var a = this.sideMessages.length; a--;) this.sideMessages[a].charExpression.decreaseRef();
            this.sideMessages = [];
            this.clearSideMessages()
        },
        getCharExpression: function(a) {
            return this.currentPeople[a] ? this.currentPeople[a].charExpression : null
        },
        getCharacter: function(a) {
            return this.currentPeople[a] ? this.currentPeople[a].charExpression.character : null
        },
        getExpression: function(a) {
            return this.currentPeople[a] ? this.currentPeople[a].charExpression.expression : null
        },
        getSide: function(a) {
            return this.currentPeople[a] ? this.currentPeople[a].side : 0
        },
        getOrder: function(a) {
            return this.currentPeople[a] ? this.currentPeople[a].order :
                0
        },
        getDisplayName: function(a) {
            return this.currentPeople[a] ? this.currentPeople[a].displayName : null
        },
        getNextSideMessage: function() {
            var a = this.sideMessageStack.shift();
            this.sideMessages.push(a);
            this.sideMessages.length > 50 && this.sideMessages.shift().charExpression.decreaseRef();
            return a
        },
        hasStackedSideMessages: function() {
            return this.sideMessageStack.length > 0
        },
        isSideMessageVisible: function() {
            return this.displayedSideMessages > 0
        },
        onInteraction: function() {
            if (this.privateMode == 1) {
                this.privateMode = 2;
                this.clearBlocking()
            } else sc.Model.notifyObserver(this,
                sc.MESSAGE_EVENT.MESSAGE_INTERACT, null)
        },
        onLevelLoadStart: function() {
            sc.model.message.clearSideMessages()
        },
        onLevelLoaded: function() {
            if (this.loaded) {
                sc.Model.notifyObserver(this, sc.MESSAGE_EVENT.SIDE_MESSAGES_LOADED);
                this.loaded = false
            }
        },
        onReset: function() {
            this.currentChoiceOptions = null;
            this.autoScript = false;
            this.autoScriptTimer = 0;
            this.clear();
            this.setBottomGap(0)
        },
        onPreUpdate: function() {
            if (this.sideMessageDelayedStack.length > 0 && !this._isSideMessageDelayed())
                for (; this.sideMessageDelayedStack.length >
                    0;) {
                    var a = this.sideMessageDelayedStack.shift();
                    this._showSideMessage(a)
                }
            if (this.autoScript && this.autoScriptTimer && !ig.game.paused) {
                this.autoScriptTimer = this.autoScriptTimer - ig.system.actualTick;
                if (this.autoScriptTimer <= 0) {
                    this.autoScriptTimer = 0;
                    this.clearBlocking()
                }
            }
            this.sideMessageQueuing = false
        },
        onStorageSave: function(a) {
            var b = {};
            b.autoScript = this.autoScript;
            b.sideMessages = this._convertSideMessagesToJson(this.sideMessages);
            b.sideMessageStack = this._convertSideMessagesToJson(this.sideMessageStack);
            b.displayedSideMessages = this.displayedSideMessages;
            a.message = b
        },
        _convertSideMessagesToJson: function(a) {
            for (var b = [], c = 0; c < a.length; ++c) {
                var e = a[c];
                b.push({
                    "char": e.charExpression.character.name,
                    expression: e.charExpression.expression,
                    message: e.message ? e.message.data || e.message : "",
                    main: e.main
                })
            }
            return b
        },
        onStoragePreLoad: function(a) {
            this.loaded = true;
            a = a.message;
            this.sideMessages = this._convertJsonToSideMessage(a.sideMessages || []);
            this.sideMessageStack = this._convertJsonToSideMessage(a.sideMessageStack || []);
            this.displayedSideMessages = a.displayedSideMessages;
            this.autoScript = a.autoScript || false
        },
        _convertJsonToSideMessage: function(a) {
            for (var b = [], c = 0; c < a.length; ++c) {
                var e = a[c];
                if (e["char"]) {
                    var f = e.message;
                    f && typeof f !== "string" && (f = new ig.LangLabel(f));
                    b.push({
                        charExpression: new sc.CharacterExpression(e["char"], e.expression),
                        message: f,
                        main: e.main || false
                    })
                }
            }
            return b
        },
        hasChoice: function() {
            return !!this.currentChoiceOptions
        },
        _checkActivePerson: function(a) {
            if (!this.currentPeople[[a]]) throw Error("Character of name '" +
                a + '" is currently not in conversation!');
        },
        onVarAccess: function(a, b) {
            if (b[0] == "msg") {
                var c = b[1];
                return c == "hasSideMsg" ? this.hasStackedSideMessages() : c == "isSideMsgVisible" ? this.isSideMessageVisible() : c == "stackCount" ? this.sideMessageStack.length : c == "recentlyClearedSideMsg" ? this.recentlyClearedSideMsg : null
            }
        }
    });
    sc.MESSAGE_EVENT = {};
    sc.MESSAGE_EVENT.PERSON_ADDED = 0;
    sc.MESSAGE_EVENT.PERSON_REMOVED = 1;
    sc.MESSAGE_EVENT.PERSON_CHANGED = 2;
    sc.MESSAGE_EVENT.EXPRESSION_CHANGED = 3;
    sc.MESSAGE_EVENT.NEW_MESSAGE = 4;
    sc.MESSAGE_EVENT.NEW_SIDE_MESSAGE =
        5;
    sc.MESSAGE_EVENT.CLEARED = 6;
    sc.MESSAGE_EVENT.CLEARED_SIDE_MESSAGE = 7;
    sc.MESSAGE_EVENT.SHOW_CHOICE = 8;
    sc.MESSAGE_EVENT.SIDE_MESSAGES_LOADED = 9;
    sc.MESSAGE_EVENT.MESSAGE_INTERACT = 10;
    sc.MESSAGE_EVENT.RING_PRIVATE = 11;
    sc.MESSAGE_EVENT.START_PRIVATE = 12;
    sc.MESSAGE_EVENT.END_PRIVATE = 13;
    sc.MESSAGE_EVENT.DROP_PRIVATE = 14;
    sc.MESSAGE_EVENT.NEW_BOARD_MESSAGE = 15;
    sc.MESSAGE_EVENT.CLEAR_BOARD_MESSAGE = 16;
    sc.MESSAGE_EVENT.MENU_MODE_CHANGE = 17;
    sc.MESSAGE_EVENT.BOTTOM_GAP_CHANGE = 18;
    sc.MESSAGE_EVENT.DREAM_MSG_CLOSE = 19;
    sc.MESSAGE_SIDES = {
        RIGHT: 1,
        LEFT: 2
    };
    sc.MESSAGE_SIDES_OR_ALL = {
        RIGHT: 1,
        LEFT: 2,
        ALL: 0
    };
    ig.addGameAddon(function() {
        return sc.message = new sc.MessageModel
    })
});
ig.baked = !0;

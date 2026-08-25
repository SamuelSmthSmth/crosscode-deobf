/**
 * @module game.feature.msg.msg-steps
 *
 * Event and action steps for the message/dialog system. Includes
 * steps for showing messages (normal, offscreen, side, board, dream,
 * center), managing conversation participants, displaying choices,
 * private messages, tutorial dialogs, modal choices, tutorial markers,
 * demo highscore/time displays, get-item messages, and auto-script
 * configuration.
 */
ig.module("game.feature.msg.msg-steps").requires("impact.base.action", "impact.base.event", "game.feature.msg.message-model", "game.feature.character.character", "game.feature.gui.widget.demo-stats", "game.feature.gui.widget.demo-highscore", "game.feature.msg.gui.dream-msg").defines(function() {
    ig.EVENT_STEP.SHOW_MSG = ig.EventStepBase.extend({
        person: null, charExpression: null, message: null, autoContinue: false, hiCount: 0,
        _wm: new ig.Config({attributes: {person: {_type: "PersonExpression", _info: "Talking person"}, message: {_type: "LangLabel", _info: "Message to display", _large: true}, autoContinue: {_type: "Boolean", _info: "Automatically continue after message"}}, label: function() {return "<em>" + wmPrint("PersonExpression", this.person) + "</em>: <i>" + wmPrint("LangLabel", this.message) + "</i>" + (this.autoContinue ? ", <i>autoContinue</i>" : "")}}),
        init: function(settings) {
            this.person = settings.person.person;
            this.charExpression = new sc.CharacterExpression(settings.person.person, settings.person.expression);
            this.message = new ig.LangLabel(settings.message);
            this.autoContinue = settings.autoContinue || false;
            ig.langEdit && ig.langEdit.submitMap("MSG " + this.person, this.message);
            if (this.person == "main.lea" && settings.message && settings.message.en_US) this.hiCount = (this.hiCount = settings.message.en_US.match(/hi[.!?]/gi)) ? this.hiCount.length : 0
        },
        clearCached: function() {this.charExpression.decreaseRef()},
        start: function() {
            this.hiCount && sc.stats.addMap("misc", "hiCount", this.hiCount || 0);
            sc.model.message.setExpression(this.person, this.charExpression);
            sc.model.message.showMessage(this.person, this.message, this.autoContinue || this._nextStep && this._nextStep instanceof ig.EVENT_STEP.SHOW_CHOICE);
            ig.langEdit && ig.langEdit.submitRecent("MSG " + this.person, this.message)
        },
        run: function() {return !sc.model.message.isBlocking()}
    });
    ig.LANG_CONTEXT.SHOW_MSG = function(step) {
        var result = "MSG[";
        step.person && (result = result + (step.person.person + ">" + step.person.expression));
        return result + "]"
    };
    ig.EVENT_STEP.RING_PRIVATE_MSG = ig.EventStepBase.extend({
        outgoing: false,
        _wm: new ig.Config({attributes: {outgoing: {_type: "Boolean", _info: "If true: this is an outgoing call"}}}),
        init: function(settings) {this.outgoing = settings.outgoing},
        start: function() {sc.model.message.ringPrivateMessage(this.outgoing)},
        run: function() {return !sc.model.message.isBlocking()}
    });
    ig.EVENT_STEP.START_PRIVATE_MSG = ig.EventStepBase.extend({
        _wm: new ig.Config({attributes: {}}), init: function() {},
        start: function() {sc.model.message.isPrivateRing() ? sc.model.message.startPrivateMessage() : sc.model.message.ringPrivateMessage()},
        run: function() {if (!sc.model.message.isBlocking()) {if (!sc.model.message.isPrivateRing()) return true; sc.model.message.startPrivateMessage()} return false}
    });
    ig.EVENT_STEP.END_PRIVATE_MSG = ig.EventStepBase.extend({
        _wm: new ig.Config({attributes: {skipSounds: {_type: "Boolean", _info: "If true: skip sounds"}}}),
        init: function(settings) {this.skipSounds = settings.skipSounds || false},
        start: function() {sc.model.message.endPrivateMessage(this.skipSounds)},
        run: function() {return !sc.model.message.isBlocking()}
    });
    ig.EVENT_STEP.SHOW_OFFSCREEN_MSG = ig.EventStepBase.extend({
        leftSide: null, message: null, autoContinue: false,
        _wm: new ig.Config({attributes: {side: {_type: "String", _info: "Side to display message at.", _select: sc.MESSAGE_SIDES}, message: {_type: "LangLabel", _info: "Message to display", _large: true}, autoContinue: {_type: "Boolean", _info: "Automaticallt continue after message"}}, width: 400, label: function() {return "<em>OFFSCREEN (" + (this.side == "LEFT" ? "left" : "right") + ")</em>: <i>" + wmPrint("LangLabel", this.message) + "</i>" + (this.autoContinue ? ", <i>autoContinue</i>" : "")}}),
        init: function(settings) {this.leftSide = settings.side == "LEFT"; this.message = new ig.LangLabel(settings.message); this.autoContinue = settings.autoContinue || false; ig.langEdit && ig.langEdit.submitMap("MSG Offscreen", this.message)},
        start: function() {sc.model.message.showOffScreenMessage(this.leftSide, this.message, this.autoContinue || this._nextStep && this._nextStep instanceof ig.EVENT_STEP.SHOW_CHOICE); ig.langEdit && ig.langEdit.submitRecent("MSG Offscreen", this.message)},
        run: function() {return !sc.model.message.isBlocking()}
    });
    ig.EVENT_STEP.SHOW_CHOICE = ig.EventStepBase.extend({
        person: null, charExpression: null, columns: null, forceWidth: 0, options: [], branches: {},
        _wm: new ig.Config({attributes: {person: {_type: "PersonExpression", _info: "Talking person"}, options: {_type: "ChoiceOptions", _info: "List of options", _noLabel: true}, columns: {_type: "Integer", _info: "Number of buttons columns.", _optional: true, _default: 2}, forceWidth: {_type: "Integer", _info: "Override the default button width. NOTE: Buttons still get matched when a text is to large.", _optional: true}}, branchLabel: function(branch) {return branch == "_end" ? "END_SHOW_CHOICE" : this.options[branch] ? "Choice: " + wmPrint("LangLabel", this.options[branch].label) : "???"}}),
        init: function(settings) {
            this.person = settings.person && settings.person.person;
            if ((this.columns = settings.columns) && this.columns < 1) this.columns = 1;
            this.forceWidth = settings.forceWidth || 0;
            if (settings.person) this.charExpression = new sc.CharacterExpression(settings.person.person, settings.person.expression);
            var opts = settings.options || [];
            for (var idx = 0; idx < opts.length; ++idx) {
                this.options[idx] = {label: new ig.LangLabel(opts[idx].label), activeCondition: new ig.VarCondition(opts[idx].activeCondition), showCondition: new ig.VarCondition(opts[idx].showCondition), stretch: opts[idx].stretch || false, center: opts[idx].center || false};
                ig.langEdit && ig.langEdit.submitMap("Choice " + idx, this.options[idx].label)
            }
        },
        clearCached: function() {this.charExpression && this.charExpression.decreaseRef()},
        start: function() {this.charExpression && sc.model.message.setExpression(this.person, this.charExpression); sc.model.message.showChoice(this.person, this.options, this.columns, this.forceWidth)},
        run: function() {return !sc.model.message.isBlocking()},
        getBranchNames: function() {for (var names = [], idx = 0; idx < this.options.length; ++idx) names.push(idx); return names},
        getNext: function() {return this.branches[sc.model.message.lastSelectedChoice] || this._nextStep}
    });
    ig.EVENT_STEP.ADD_MSG_PERSON = ig.EventStepBase.extend({
        charExpression: null, side: 0, order: 0, clearSide: false, name: null,
        _wm: new ig.Config({attributes: {person: {_type: "PersonExpression", _info: "Person + Expression to add"}, name: {_type: "LangLabel", _info: "Name to display under portrait if any", _optional: true}, side: {_type: "String", _info: "Side to display Person at.", _select: sc.MESSAGE_SIDES}, order: {_type: "Number", _info: "Determines the order in which people are displayed on one side. LOWER values are in FRONT"}, clearSide: {_type: "Boolean", _info: "Clear the side before adding the person"}}}),
        init: function(settings) {this.charExpression = new sc.CharacterExpression(settings.person.person, settings.person.expression); this.side = sc.MESSAGE_SIDES[settings.side]; this.order = settings.order; this.clearSide = settings.clearSide; if (settings.name) this.name = new ig.LangLabel(settings.name)},
        clearCached: function() {this.charExpression.decreaseRef()},
        start: function() {this.clearSide && sc.model.message.clearSide(this.side); sc.model.message.addPerson(this.charExpression, this.side, this.order, this.name)}
    });
    ig.EVENT_STEP.REMOVE_MSG_PERSON = ig.EventStepBase.extend({
        person: null, _wm: new ig.Config({attributes: {person: {_type: "Character", _info: "Person to remove"}}}),
        init: function(settings) {this.person = settings.person}, start: function() {sc.model.message.removePerson(this.person)}
    });
    ig.EVENT_STEP.SET_MSG_EXPRESSION = ig.EventStepBase.extend({
        person: null, charExpression: null,
        _wm: new ig.Config({attributes: {person: {_type: "PersonExpression", _info: "Person + Expression to change"}}}),
        init: function(settings) {this.person = settings.person.person; this.charExpression = new sc.CharacterExpression(settings.person.person, settings.person.expression)},
        clearCached: function() {this.charExpression.decreaseRef()}, start: function() {sc.model.message.setExpression(this.person, this.charExpression)}
    });
    ig.EVENT_STEP.CLEAR_MSG = ig.EventStepBase.extend({
        side: null, _wm: new ig.Config({attributes: {side: {_type: "String", _info: "Side to clear", _select: sc.MESSAGE_SIDES_OR_ALL, _default: "ALL"}}}),
        init: function(settings) {this.side = sc.MESSAGE_SIDES_OR_ALL[settings.side]}, start: function() {sc.model.message.clearSide(this.side)}
    });
    ig.EVENT_STEP.SHOW_CENTER_MSG = ig.EventStepBase.extend({
        titleText: null, text: null, overMenu: null,
        _wm: new ig.Config({attributes: {titleText: {_type: "LangLabel", _info: "Title of Box"}, text: {_type: "LangLabel", _info: "Message in Box", _large: true}, overMenu: {_type: "Boolean", _info: "Show over menu", _optional: true}}, width: 500}),
        init: function(settings) {this.titleText = new ig.LangLabel(settings.titleText); this.text = new ig.LangLabel(settings.text); this.overMenu = settings.overMenu || false; ig.langEdit && ig.langEdit.submitMap("Center MSG Title", this.titleText); ig.langEdit && ig.langEdit.submitMap("Center MSG Content", this.text)},
        start: function(eventData) {
            eventData.done = false;
            var gui = new sc.CenterMsgBoxGui(this.titleText.toString() + "\n" + this.text.toString(), {maxWidth: 300, speed: ig.TextBlock.SPEED.FASTEST}, "black", 0.9, function() {eventData.done = true}, this.overMenu);
            ig.gui.addGuiElement(gui); ig.langEdit && ig.langEdit.submitRecent("Center MSG Title", this.titleText); ig.langEdit && ig.langEdit.submitRecent("Center MSG Content", this.text)
        },
        run: function(eventData) {return eventData.done}
    });
    ig.EVENT_STEP.SHOW_DREAM_MSG = ig.EventStepBase.extend({
        titleText: null, text: null, time: 0,
        _wm: new ig.Config({attributes: {text: {_type: "LangLabel", _info: "Message in Box", _large: true}, entity: {_type: "Entity", _info: "Entity the dream text will be displayed above or below. Text will be centered on screen if not specified", _optional: true}, posType: {_type: "String", _info: "Whether to display text above or below entity.", _select: sc.DREAM_TEXT_POS_TYPE, _default: "TOP"}, offset: {_type: "Vec2", _info: "Offset added to position"}, time: {_type: "Number", _info: "If set the message will stay on for the given amount of time", _optional: true}, smallFont: {_type: "Boolean", _info: "If true: use small font", _optional: true}}, width: 500}),
        init: function(settings) {this.text = new ig.LangLabel(settings.text); ig.langEdit && ig.langEdit.submitMap("Dream Text", this.text); this.entity = settings.entity; this.posType = sc.DREAM_TEXT_POS_TYPE[settings.posType] || sc.DREAM_TEXT_POS_TYPE.TOP; this.offset = settings.offset; this.time = settings.time || 0; this.smallFont = settings.smallFont || false},
        start: function(eventData, entity) {
            eventData.timer = 0;
            var target = ig.Event.getEntity(this.entity, entity);
            var gui = new sc.DreamMsgGui(target, this.posType, this.offset, this.text.toString(), this.time, {maxWidth: 400, speed: ig.TextBlock.SPEED.SLOW, textAlign: ig.Font.ALIGN.CENTER, font: this.smallFont ? sc.fontsystem.smallFont : sc.fontsystem.font}, function() {eventData.timer = 0.2});
            ig.gui.addGuiElement(gui); ig.langEdit && ig.langEdit.submitRecent("Dream Text", this.text)
        },
        run: function(eventData) {if (eventData.timer) {eventData.timer = eventData.timer - ig.system.tick; if (eventData.timer <= 0) return true} return false}
    });
    ig.ACTION_STEP.SHOW_DREAM_MSG = ig.ActionStepBase.extend({
        text: null, time: 0,
        _wm: new ig.Config({attributes: {text: {_type: "LangLabel", _info: "Message in Box", _large: true}, entity: {_type: "Entity", _info: "Entity the dream text will be displayed above or below. If not defined, will be displayed above action entity", _optional: true}, posType: {_type: "String", _info: "Whether to display text above or below entity.", _select: sc.DREAM_TEXT_POS_TYPE, _default: "TOP"}, offset: {_type: "Vec2", _info: "Offset added to position"}, time: {_type: "Number", _info: "If set the message will stay on for the given amount of time"}}, width: 500}),
        init: function(settings) {this.text = new ig.LangLabel(settings.text); ig.langEdit && ig.langEdit.submitMap("Dream Text", this.text); this.entity = settings.entity; this.posType = sc.DREAM_TEXT_POS_TYPE[settings.posType] || sc.DREAM_TEXT_POS_TYPE.TOP; this.offset = settings.offset; this.time = settings.time || 1},
        start: function(actionEntity) {
            var target = ig.Event.getEntity(this.entity) || actionEntity;
            var gui = new sc.DreamMsgGui(target, this.posType, this.offset, this.text.toString(), this.time, {maxWidth: 140, speed: ig.TextBlock.SPEED.SLOW, textAlign: ig.Font.ALIGN.CENTER, font: sc.fontsystem.smallFont}, null, true);
            gui.hook.zIndex = -30; ig.gui.addGuiElement(gui); ig.langEdit && ig.langEdit.submitRecent("Dream Text", this.text);
            actionEntity.addActionAttached(gui); actionEntity.stepTimer = actionEntity.stepTimer + this.time
        },
        run: function(actionEntity) {return actionEntity.stepTimer <= 0}
    });
    ig.ACTION_STEP.CLEAR_DREAM_MSG = ig.ActionStepBase.extend({
        _wm: new ig.Config({attributes: {}, width: 500}), init: function() {},
        start: function() {sc.model.message.clearDreamMessage()}
    });
    sc.TUTORIAL_START_TYPE = {
        TUTORIAL: {skippable: true, title: "sc.gui.bigChoice.tutorial.title", yes: "sc.gui.bigChoice.tutorial.yes", no: "sc.gui.bigChoice.tutorial.no"},
        GENERIC: {title: "sc.gui.bigChoice.generic.title", yes: "sc.gui.bigChoice.generic.yes", no: "sc.gui.bigChoice.generic.no"}
    };
    ig.EVENT_STEP.SHOW_TUTORIAL_START = ig.EventStepBase.extend({
        msgType: null, title: null, content: null, imageSrc: null, branches: {},
        _wm: new ig.Config({attributes: {msgType: {_type: "String", _info: "Type of Message", _select: sc.TUTORIAL_START_TYPE, _default: "TUTORIAL"}, title: {_type: "LangLabel", _info: "Title of Toturial"}, content: {_type: "LangLabel", _info: "Content of Tutorial", _large: true}, image: {_type: "Image", _info: "Image to be shown over content text", _optional: true}}, branchLabel: function(branch) {switch (branch) {case "acceptStep": return "on Accept"; case "cancelStep": return "on Cancel"; case "_end": return "Tutorial End"} return "???"}, width: 500}),
        init: function(settings) {this.msgType = sc.TUTORIAL_START_TYPE[settings.msgType] || sc.TUTORIAL_START_TYPE.TUTORIAL; this.title = new ig.LangLabel(settings.title); this.content = new ig.LangLabel(settings.content); this.imageSrc = settings.image; ig.langEdit && ig.langEdit.submitMap("Tutorial MSG Title", this.title); ig.langEdit && ig.langEdit.submitMap("Tutorial MSG Content", this.content)},
        start: function(eventData) {
            if (this.msgType.skippable && sc.options.get("skip-tutorials")) {eventData.done = true; eventData.accept = false}
            else {
                eventData.done = false; eventData.accept = false;
                var gui = new sc.TutorialStartGui(this.msgType, this.title.toString(), this.content.toString(), this.imageSrc, function(accepted) {eventData.done = true; eventData.accept = accepted});
                ig.gui.addGuiElement(gui); ig.langEdit && ig.langEdit.submitRecent("Tutorial MSG Title", this.title); ig.langEdit && ig.langEdit.submitRecent("Tutorial MSG Content", this.content)
            }
        },
        run: function(eventData) {return eventData.done},
        getBranchNames: function() {return ["acceptStep", "cancelStep"]},
        getNext: function(eventData) {return eventData.accept ? this.branches.acceptStep ? this.branches.acceptStep : this._nextStep : this.branches.cancelStep ? this.branches.cancelStep : this._nextStep}
    });
    ig.EVENT_STEP.SHOW_MODAL_CHOICE = ig.EventStepBase.extend({
        text: null, options: [], branches: {},
        _wm: new ig.Config({attributes: {text: {_type: "LangLabel", _info: "Text of modal dialog"}, options: {_type: "ModalChoiceOptions", _info: "All the options of the modal dialog"}}, branchLabel: function(branch) {return branch == "_end" ? "END_MODAL_DIALOG_CHOICE" : this.options[branch] ? "Choice: " + wmPrint("LangLabel", this.options[branch].label) : "???"}}),
        init: function(settings) {this.text = new ig.LangLabel(settings.text); var opts = settings.options || []; for (var idx = 0; idx < opts.length; ++idx) {this.options[idx] = new ig.LangLabel(opts[idx].label); ig.langEdit && ig.langEdit.submitMap("Modal Choice " + idx, this.options[idx])}},
        start: function(eventData) {
            eventData.done = false; eventData.choice = null; sc.model.stopSkip(); sc.model.skipBlock = true;
            sc.Dialogs.showChoiceDialog(this.text.toString(), sc.DIALOG_INFO_ICON.NONE, this.options, function(result) {sc.model.skipBlock = false; eventData.done = true; eventData.choice = result.data})
        },
        run: function(eventData) {return eventData.done},
        getBranchNames: function() {for (var names = [], idx = 0; idx < this.options.length; ++idx) names.push(idx); return names},
        getNext: function(eventData) {return this.branches[eventData.choice] || this._nextStep}
    });
    ig.EVENT_STEP.SHOW_TUTORIAL_MSG = ig.EventStepBase.extend({
        pos: null, size: null, text: null, direction: null, connectPos: 0,
        _wm: new ig.Config({attributes: {text: {_type: "LangLabel", _info: "Tutorial Text description", _large: true}, pos: {_type: "Vec2", _info: "Marker Square position"}, size: {_type: "Vec2", _info: "Marker Square size"}, direction: {_type: "String", _info: "Direction to show text relative to marker square.", _select: sc.TUT_BOX_POINTING_DIR}, connectPos: {_type: "Number", _info: "Point where text line touches marker box. Between 0 to 1. 0= left corner, 1=right corner.", _default: 0.5}, stopTime: {_type: "Boolean", _info: "If true: Stop time while displaying the message"}}, width: 500}),
        init: function(settings) {this.text = new ig.LangLabel(settings.text); this.pos = settings.pos; this.size = settings.size; this.direction = sc.TUT_BOX_POINTING_DIR[settings.direction] || sc.TUT_BOX_POINTING_DIR.TOP_LEFT; this.connectPos = settings.connectPos || 0; this.stopTime = settings.stopTime || false},
        start: function(eventData) {eventData.done = false; var gui = new sc.TutorialMarkerGui(this.pos.x, this.pos.y, this.size.x, this.size.y, this.text.toString(), this.direction, this.connectPos, this.stopTime, function() {eventData.done = true}); ig.gui.addGuiElement(gui)},
        run: function(eventData) {return eventData.done}
    });
    var targetFns = {
        PLAYER: function(out) {ig.game.playerEntity.getAlignedPos(ig.ENTITY_ALIGN.CENTER, out)},
        CROSSHAIR: function(out) {var crosshair = ig.game.playerEntity.gui.crosshair; crosshair && crosshair.getAlignedPos(ig.ENTITY_ALIGN.CENTER, out)},
        ENEMY: function(out) {
            for (var shown = ig.game.shownEntities, idx = shown.length, found = null; idx--;) {var ent = shown[idx]; if (ent instanceof ig.ENTITY.Enemy && ig.EntityTools.isInScreen(ent, -16)) {found = ent; break}}
            found = found || ig.game.playerEntity; found.getAlignedPos(ig.ENTITY_ALIGN.CENTER, out)
        }
    };
    var worldPos = Vec3.create();
    var screenPos = Vec2.create();
    ig.EVENT_STEP.SHOW_TUTORIAL_PLAYER_MSG = ig.EventStepBase.extend({
        pos: null, size: null, text: null, direction: null, connectPos: 0,
        _wm: new ig.Config({attributes: {text: {_type: "LangLabel", _info: "Tutorial Text description", _large: true}, targetType: {_type: "String", _info: "Marker Square position", _select: targetFns}, size: {_type: "Vec2", _info: "Marker Square size"}, stopTime: {_type: "Boolean", _info: "If true: Stop time while displaying the message"}}, width: 500}),
        init: function(settings) {this.text = new ig.LangLabel(settings.text); this.targetType = targetFns[settings.targetType] || targetFns.PLAYER; this.size = settings.size; this.stopTime = settings.stopTime || false},
        start: function(eventData) {
            eventData.done = false; var textStr = this.text.toString();
            this.targetType(worldPos);
            var screenPos2 = ig.system.getScreenFromMapPos(screenPos, worldPos.x, worldPos.y - worldPos.z);
            var dir = 0;
            dir = screenPos2.x < ig.system.width / 2 ? screenPos2.y < ig.system.height / 2 ? sc.TUT_BOX_POINTING_DIR.BOTTOM_RIGHT : sc.TUT_BOX_POINTING_DIR.TOP_RIGHT : screenPos2.y < ig.system.height / 2 ? sc.TUT_BOX_POINTING_DIR.BOTTOM_LEFT : sc.TUT_BOX_POINTING_DIR.TOP_LEFT;
            screenPos2.x = screenPos2.x - this.size.x / 2; screenPos2.y = screenPos2.y - this.size.y / 2;
            screenPos2.x = Math.round(screenPos2.x); screenPos2.y = Math.round(screenPos2.y);
            var gui = new sc.TutorialMarkerGui(screenPos2.x, screenPos2.y, this.size.x, this.size.y, textStr, dir, 0.5, this.stopTime, function() {eventData.done = true});
            ig.gui.addGuiElement(gui)
        },
        run: function(eventData) {return eventData.done}
    });
    ig.EVENT_STEP.SHOW_DEMO_HIGHSCORE = ig.EventStepBase.extend({
        observatory: false,
        _wm: new ig.Config({attributes: {observatory: {_type: "Boolean", _info: "True if this is for the observatory challenge.", _default: false}}}),
        init: function(settings) {this.observatory = settings.observatory || false},
        start: function(eventData) {eventData.done = false; var gui = new sc.DemoHighscore(function() {eventData.done = true}, this.observatory); ig.gui.addGuiElement(gui)},
        run: function(eventData) {return eventData.done}
    });
    ig.EVENT_STEP.SHOW_DEMO_TIME = ig.EventStepBase.extend({
        observatory: false,
        _wm: new ig.Config({attributes: {observatory: {_type: "Boolean", _info: "True if this is for the observatory challenge.", _default: false}}}),
        init: function(settings) {this.observatory = settings.observatory || false},
        start: function(eventData) {eventData.done = false; var gui = new sc.DemoLastTime(function() {eventData.done = true}, this.observatory); ig.gui.addGuiElement(gui)},
        run: function(eventData) {return eventData.done}
    });
    ig.EVENT_STEP.SHOW_GET_MSG = ig.EventStepBase.extend({
        text: null, track: null, wordLearned: false,
        _wm: new ig.Config({attributes: {msgType: {_type: "String", _info: "Type of get message", _select: ["ACTIVATED", "OBTAINED", "REMOVED", "ENEMY", "EXTENDED", "WORD", "FRIENDSHIP", "PARTY", "USED", "HAND_OVER", "RESET"]}, object: {_type: "LangLabel", _info: "Object of get message"}}, width: 500}),
        init: function(settings) {
            var msgType = settings.msgType;
            if (msgType) {if (msgType == "WORD") this.wordLearned = true; if (ig.lang) {msgType = ig.lang.get("sc.gui.get-msg." + msgType); var objectText = (new ig.LangLabel(settings.object)).toString(); this.text = ig.lang.grammarReplace(msgType, objectText, "\\i[<]" + objectText + "\\i[>]")}}
            else this.text = "UNKNOWN MSG TYPE";
            this.track = ig.bgm.loadTrack("ability-got")
        },
        clearCached: function() {this.track.clearCached()},
        start: function(eventData) {
            eventData.done = false; this.wordLearned && sc.stats.addMap("misc", "words", 1);
            var gui = new sc.CenterMsgBoxGui(this.text, {maxWidth: 300, textAlign: ig.Font.ALIGN.CENTER, speed: ig.TextBlock.SPEED.FASTEST}, "white", 0.3, function() {eventData.done = true});
            gui.setBoxOffset(0, -64); ig.gui.addGuiElement(gui); ig.bgm.inbetween(this.track, 1, ig.BGM_SWITCH_MODE.MEDIUM)
        },
        run: function(eventData) {return eventData.done}
    });
    ig.EVENT_STEP.SHOW_SIDE_MSG = ig.EventStepBase.extend({
        charExpression: null, message: null, hiCount: 0,
        _wm: new ig.Config({attributes: {person: {_type: "PersonExpression", _info: "Person + Exporession of message"}, message: {_type: "LangLabel", _info: "Message to display", _large: true}}, label: function() {return "<b>SHOW_SIDE_MSG</b> <em>" + wmPrint("PersonExpression", this.person) + "</em>: <i>" + wmPrint("LangLabel", this.message) + "</i>"}}),
        init: function(settings) {this.charExpression = new sc.CharacterExpression(settings.person.person, settings.person.expression); this.message = new ig.LangLabel(settings.message); ig.langEdit && ig.langEdit.submitMap("Side MSG " + this.charExpression.character.name, this.message); if (this.charExpression.character.name == "main.lea" && settings.message && settings.message.en_US) this.hiCount = (this.hiCount = settings.message.en_US.match(/hi[.!?]/gi)) ? this.hiCount.length : 0},
        clearCached: function() {this.charExpression.decreaseRef()},
        start: function() {this.hiCount && sc.stats.addMap("misc", "hiCount", this.hiCount || 0); ig.langEdit && ig.langEdit.submitRecent("Side MSG " + this.charExpression.character.name, this.message); sc.model.message.showSideMessage(this.charExpression, this.message)}
    });
    ig.LANG_CONTEXT.SHOW_SIDE_MSG = function(step) {var result = "SIDE MSG["; step.person && (result = result + (step.person.person + ">" + step.person.expression)); return result + "]"};
    ig.EVENT_STEP.CLEAR_SIDE_MSG = ig.EventStepBase.extend({_wm: new ig.Config({attributes: {}}), init: function() {}, start: function() {sc.model.message.clearSideMessages()}});
    ig.EVENT_STEP.SHOW_BOARD_MSG = ig.EventStepBase.extend({
        text: null, title: null, center: null,
        _wm: new ig.Config({attributes: {text: {_type: "LangLabel", _info: "Text to display.", _large: true}, center: {_type: "Boolean", _info: "Center the text."}, side: {_type: "String", _info: "If defined: moved board message to side of screen, allowing to display persons in parallel", _select: sc.MESSAGE_SIDES, _optional: true}, autoContinue: {_type: "Boolean", _info: "Automatically continue after message"}}, width: 600}),
        init: function(settings) {this.text = new ig.LangLabel(settings.text); this.center = settings.center; this.side = sc.MESSAGE_SIDES[settings.side] || null; this.autoContinue = settings.autoContinue || false; ig.langEdit && ig.langEdit.submitMap("BOARD MSG TEXT", this.text)},
        start: function() {sc.model.message.showBoardMessage(this.text, this.center, this.side, this.autoContinue); ig.langEdit && ig.langEdit.submitRecent("BOARD MSG TEXT", this.text)},
        run: function() {return !sc.model.message.isBlocking()}
    });
    ig.LANG_CONTEXT.SHOW_BOARD_MSG = function() {return "BOARD_MSG"};
    ig.EVENT_STEP.CLEAR_BOARD_MSG = ig.EventStepBase.extend({_wm: new ig.Config({attributes: {}}), init: function() {}, start: function() {sc.model.message.clearBoardMsg()}});
    ig.EVENT_STEP.SET_AUTO_SCRIPT = ig.EventStepBase.extend({
        value: null,
        _wm: new ig.Config({attributes: {value: {_type: "Boolean", _info: "If true: enable auto script (will automatically continue messages"}}}),
        init: function(settings) {this.value = settings.value},
        start: function() {sc.model.message.autoScript = this.value}
    })
});
ig.baked = !0;
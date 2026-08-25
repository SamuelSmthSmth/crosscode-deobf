ig.module("game.feature.quick-menu.quick-menu-model").requires("impact.base.game", "impact.feature.interact.button-interact", "impact.feature.database.database", "game.feature.model.base-model").defines(function() {
    sc.QUICK_MENU_STATE = {};
    sc.QUICK_MENU_STATE.NONE = 0;
    sc.QUICK_MENU_STATE.ITEMS = 1;
    sc.QUICK_MENU_STATE.CHECK = 2;
    sc.QUICK_MENU_STATE.PARTY = 3;
    sc.QUICK_MENU_STATE.MAP = 4;
    sc.QuickMenuModel = ig.GameAddon.extend({
        observers: [],
        buttonInteract: null,
        activeState: false,
        currentState: sc.QUICK_MENU_STATE.NONE,
        previousState: sc.QUICK_MENU_STATE.NONE,
        visible: false,
        cursorMoved: false,
        cursor: Vec2.createC(0, 0),
        analFocus: null,
        itemIndex: 0,
        infoText: null,
        buffText: null,
        buffID: null,
        skipActiveState: false,
        names: [],
        gamepadActive: false,
        lastDevice: 0,
        itemsBlocked: false,
        init: function() {
            this.parent("QuickMenuModel");
            this.buttonInteract = new ig.ButtonInteractEntry;
            window.wm && ig.database.register("names", "NPCNamesList", "NPC Names");
            this.names = ig.database.get("names")
        },
        enterQuickMenu: function() {
            ig.interact.addEntry(this.buttonInteract);
            this.visible = true
        },
        exitQuickMenu: function() {
            ig.interact.removeEntry(this.buttonInteract);
            this.visible = false;
            this.previousState = this.currentState = sc.QUICK_MENU_STATE.NONE;
            this.itemIndex = 0;
            this.cursorMoved = false;
            this.analFocus = null;
            this.cursor.x = 0;
            this.cursor.y = 0;
            this.skipActiveState ? this.skipActiveState = false : this.activeState = false;
            sc.Model.notifyObserver(this, sc.QUICK_MODEL_EVENT.EXIT_MENU)
        },
        enterItems: function() {
            this._switchStates(sc.QUICK_MENU_STATE.ITEMS)
        },
        enterParty: function() {
            this._switchStates(sc.QUICK_MENU_STATE.PARTY)
        },
        enterCheck: function() {
            this._switchStates(sc.QUICK_MENU_STATE.CHECK)
        },
        enterNone: function() {
            this._switchStates(sc.QUICK_MENU_STATE.NONE)
        },
        setInfoText: function(b, a) {
            this.infoText = b;
            sc.Model.notifyObserver(this, sc.QUICK_MODEL_EVENT.INFO_TEXT_CHANGED, a)
        },
        setBuffText: function(b, a, d) {
            this.buffText = b;
            this.buffID = d >= 0 ? d : null;
            sc.Model.notifyObserver(this, sc.QUICK_MODEL_EVENT.BUFF_TEXT_CHANGED, a)
        },
        setItemBlock: function(b) {
            this.itemsBlocked = b || false
        },
        toggleInputMode: function() {
            sc.Model.notifyObserver(this, sc.QUICK_MODEL_EVENT.INPUT_MODEL_TOGGLED)
        },
        resetCursor: function() {
            this.cursorMoved =
                false;
            if (this.analFocus) this.analFocus.focus = false;
            this.analFocus = null
        },
        focusEntity: function(b, a, d, c) {
            if (this.analFocus == d) {
                if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                    this.cursor.x = b;
                    this.cursor.y = a;
                    sc.Model.notifyObserver(this, sc.QUICK_MODEL_EVENT.ENSURE_FOCUS)
                }
            } else {
                this.cursor.x = b;
                this.cursor.y = a;
                this.analFocus && this.analFocus.focus && this.analFocus.focusLost();
                (this.analFocus = d) && !this.analFocus.focus && this.analFocus.focusGained();
                sc.Model.notifyObserver(this, sc.QUICK_MODEL_EVENT.FOCUS_NODE,
                    c)
            }
        },
        unfocusEntity: function(b) {
            if (this.analFocus == b) {
                this.analFocus && this.analFocus.focusLost();
                this.analFocus = null;
                sc.Model.notifyObserver(this, sc.QUICK_MODEL_EVENT.UNFOCUS)
            }
        },
        isDeviceSynced: function() {
            return this.lastDevice == ig.input.currentDevice
        },
        _switchStates: function(b) {
            if (this.currentState != b) {
                this.previousState = this.currentState;
                this.currentState = b;
                sc.Model.notifyObserver(this, sc.QUICK_MODEL_EVENT.SWITCH_STATE)
            }
        },
        isQuickNone: function() {
            return this.currentState == sc.QUICK_MENU_STATE.NONE
        },
        isQuickItems: function() {
            return this.currentState ==
                sc.QUICK_MENU_STATE.ITEMS
        },
        isQuickParty: function() {
            return this.currentState == sc.QUICK_MENU_STATE.PARTY
        },
        isQuickCheck: function() {
            return this.currentState == sc.QUICK_MENU_STATE.CHECK
        }
    });
    sc.QUICK_MODEL_EVENT = {};
    sc.QUICK_MODEL_EVENT.EXIT_MENU = 0;
    sc.QUICK_MODEL_EVENT.SWITCH_STATE = 1;
    sc.QUICK_MODEL_EVENT.INFO_TEXT_CHANGED = 2;
    sc.QUICK_MODEL_EVENT.BUFF_TEXT_CHANGED = 3;
    sc.QUICK_MODEL_EVENT.INPUT_MODEL_TOGGLED = 4;
    sc.QUICK_MODEL_EVENT.FOCUS_NODE = 5;
    sc.QUICK_MODEL_EVENT.UNFOCUS = 6;
    sc.QUICK_MODEL_EVENT.ENSURE_FOCUS = 7;
    ig.addGameAddon(function() {
        return sc.quickmodel = new sc.QuickMenuModel
    })
});
ig.baked = !0;

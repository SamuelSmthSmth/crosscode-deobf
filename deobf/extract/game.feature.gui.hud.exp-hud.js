ig.module("game.feature.gui.hud.exp-hud").requires("impact.feature.gui.gui", "game.feature.gui.base.numbers").defines(function() {
    sc.ExpEntryGui = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/status-gui.png"),
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_IN_OUT
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    offsetX: 16
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_IN_OUT
            },
            MERGE: {
                state: {
                    alpha: 0,
                    offsetX: -32
                },
                time: 0.3,
                timeFunction: KEY_SPLINES.EASE_IN_OUT
            }
        },
        number: null,
        exp: 0,
        withLabel: false,
        init: function(b,
            a) {
            this.parent();
            this.withLabel = b;
            this.number = new sc.NumberGui(0, {
                size: sc.NUMBER_SIZE.TINY,
                transitionTime: 0.3
            });
            this.number.setPos(b ? 36 : 13, 1);
            this.addChildGui(this.number);
            this.setExp(a || 0);
            this.hook.size.y = 7
        },
        setExp: function(b) {
            this.number.setNumber(b);
            this.hook.size.x = this.number.hook.size.x + (this.withLabel ? 36 : 13) + 6;
            this.exp = b
        },
        updateDrawables: function(b) {
            var a = this.withLabel ? 36 : 13,
                d = this.hook.size.y;
            b.addGfx(this.gfx, 0, 0, this.withLabel ? 0 : 40, 32, a, d);
            b.addColor("black", a, 0, this.hook.size.x - 6 - a, d);
            b.addGfx(this.gfx, this.hook.size.x - 6, 0, 53, 32, 6, d)
        }
    });
    sc.ExpMenuGui = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/status-gui.png"),
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE
            },
            HIDDEN: {
                state: {
                    alpha: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        _expNumber: null,
        init: function() {
            this.parent();
            this.hook.size.x = 88;
            this.hook.size.y = 7;
            sc.Model.addObserver(sc.model, this);
            sc.Model.addObserver(sc.model.player, this);
            sc.Model.addObserver(sc.model.menu, this);
            this._expNumber = new sc.NumberGui(1E3, {
                signed: true,
                size: sc.NUMBER_SIZE.TINY
            });
            this._expNumber.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this._expNumber.setPos(35, 1);
            this._expNumber.setNumber(sc.model.player.exp, true);
            this.addChildGui(this._expNumber);
            this.doStateTransition("HIDDEN", true)
        },
        updateDrawables: function(b) {
            b.addGfx(this.gfx, 0, 0, 0, 182, 88, 7)
        },
        modelChanged: function(b, a) {
            if (b == sc.model) {
                if (a == sc.GAME_MODEL_MSG.SUB_STATE_CHANGED) {
                    var d = b.isMenu();
                    this._expNumber.setNumber(sc.model.player.exp);
                    this.doStateTransition(d ? "DEFAULT" :
                        "HIDDEN")
                }
            } else if (b == sc.menu && (a == sc.MENU_EVENT.ENTER_MENU || a == sc.MENU_EVENT.LEAVE_MENU)) switch (b.currentMenu) {
                case sc.MENU_SUBMENU.START:
                    this.doStateTransition("DEFAULT");
                    break;
                case sc.MENU_SUBMENU.EQUIPMENT:
                    this.doStateTransition("HIDDEN")
            }
        }
    });
    sc.ExpHudGui = ig.GuiElementBase.extend({
        baseEntry: null,
        menuEntry: null,
        timer: 0,
        expSum: 0,
        expAddEntries: [],
        init: function() {
            this.parent();
            this.baseEntry = new sc.ExpEntryGui(true);
            this.baseEntry.doStateTransition("HIDDEN", true);
            this.addChildGui(this.baseEntry);
            this.menuEntry = new sc.ExpMenuGui;
            this.addChildGui(this.menuEntry);
            sc.Model.addObserver(sc.model, this);
            sc.Model.addObserver(sc.model.player, this)
        },
        update: function() {
            if (this.timer > 0) {
                this.timer = this.timer - ig.system.actualTick;
                if (this.timer <= 0)
                    if (this.expAddEntries.length > 0) {
                        this.mergeExpEntry();
                        this.timer = this.expAddEntries.length ? 1 : 5
                    } else {
                        this.expSum = 0;
                        this.baseEntry.doStateTransition("HIDDEN")
                    }
            }
        },
        addExp: function(b) {
            if (this.expSum) {
                b = new sc.ExpEntryGui(false, b);
                b.doStateTransition("HIDDEN", true);
                b.doStateTransition("DEFAULT");
                this.expAddEntries.push(b);
                this.insertChildGui(b, Math.max(this.hook.children.length - 2, 0));
                this.timer = 2
            } else {
                this.expSum = b;
                this.baseEntry.doStateTransition("DEFAULT");
                this.baseEntry.setExp(b);
                this.timer = 5
            }
            this.expAddEntries.length > 3 ? this.mergeExpEntry() : this.reorder()
        },
        mergeExpEntry: function() {
            var b = this.expAddEntries.shift();
            this.expSum = this.expSum + b.exp;
            this.baseEntry.setExp(this.expSum);
            b.doStateTransition("MERGE", false, true);
            this.reorder()
        },
        mergeAllEntries: function() {
            for (; this.expAddEntries.length >
                0;) this.mergeExpEntry()
        },
        reorder: function() {
            for (var b = this.baseEntry.hook.size.x, a = 0; a < this.expAddEntries.length; ++a) {
                b = b + -3;
                this.expAddEntries[a].doPosTranstition(b, 0, 0.3, KEY_SPLINES.EASE_IN_OUT);
                b = b + this.expAddEntries[a].hook.size.x
            }
        },
        modelChanged: function(b, a, d) {
            if (b == sc.model.player)
                if (a == sc.PLAYER_MSG.EXP_CHANGE) this.addExp(d);
                else {
                    if (a == sc.PLAYER_MSG.RESET_PLAYER) {
                        this.mergeAllEntries();
                        this.timer = this.expSum = 0;
                        this.baseEntry.setExp(0);
                        this.menuEntry._expNumber.setNumber(0);
                        this.baseEntry.doStateTransition("HIDDEN")
                    }
                }
            else if (b ==
                sc.model && a == sc.GAME_MODEL_MSG.SUB_STATE_CHANGED && b.isMenu()) {
                this.mergeAllEntries();
                this.expSum = 0;
                this.baseEntry.doStateTransition("HIDDEN")
            }
        }
    })
});
ig.baked = !0;

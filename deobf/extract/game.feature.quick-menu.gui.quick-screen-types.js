ig.module("game.feature.quick-menu.gui.quick-screen-types").requires("impact.base.image", "impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.interact.gui.focus-gui", "game.feature.gui.base.numbers", "game.feature.combat.combat", "game.feature.quick-menu.gui.quick-misc").defines(function() {
    var b = Vec2.createC(0, 0);
    sc.QUICK_MENU_TYPES = {};
    sc.ANALYSIS_COLORS = {
        RED: 0,
        BLUE: 1,
        GREEN: 2,
        ORANGE: 3,
        YELLOW: 4,
        GREY: 5,
        PURPLE: 6
    };
    sc.SHOW_TYPE = {
        DEFAULT: 0,
        INSTANT: 1
    };
    sc.QuickMenuTypesBase = ig.FocusGui.extend({
        gfx: new ig.Image("media/gui/menu.png"),
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
        type: null,
        entity: null,
        screen: null,
        focusable: true,
        showType: sc.SHOW_TYPE.DEFAULT,
        color: sc.ANALYSIS_COLORS.GREY,
        typeIcon: null,
        _fadeTimer: 0,
        init: function(a, b, c) {
            this.parent(true, false);
            this.type = a || null;
            this.entity = b.entity;
            this.screen = c;
            this.screen.registerType(a);
            this.hook.setMouseRecord(true);
            this.typeIcon = new ig.ImageGui(this.gfx, 504 + this.color * 14, 144, 13, 13);
            this.typeIcon.setAlign(ig.GUI_ALIGN.X_CENTER,
                ig.GUI_ALIGN.Y_CENTER);
            this.typeIcon.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.1,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0
                    },
                    time: 0.1,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.addChildGui(this.typeIcon);
            this.typeIcon.doStateTransition("HIDDEN", true);
            this.setSize(16, 16);
            this.doStateTransition("HIDDEN", true)
        },
        update: function() {
            this.hasTransition() && this.hook.currentStateName == "HIDDEN" && this.alignGuiPosition();
            if (this.focusable && this._fadeTimer < 0.5) {
                this._fadeTimer = this._fadeTimer + ig.system.actualTick;
                if (this._fadeTimer >= 0.5) this._fadeTimer = 0
            }
        },
        updateDrawables: function(a) {
            var b = this._fadeTimer / 0.5;
            a.addTransform().setPivot(8, 8).setScale(0.8 + b, 0.8 + b);
            a.addGfx(this.gfx, 0, 0, 504, 120, 15, 15).setAlpha(this.typeIcon.hook.currentState.alpha * (1 - b));
            a.undoTransform()
        },
        setSize: function(a, b) {
            this.parent(a, b)
        },
        isMouseOver: function() {
            if (sc.quickmodel.isQuickCheck() && !ig.interact.isBlocked() && this.focusable && sc.quickmodel.isDeviceSynced()) {
                if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                    if (sc.quickmodel.cursorMoved) {
                        sc.quickmodel.analFocus ==
                            this && this.screen.hide(this.type);
                        sc.quickmodel.unfocusEntity(this);
                        return false
                    }
                    var a = this.hook;
                    if (Math.floor(Vec2.distanceC(sc.quickmodel.cursor.x, sc.quickmodel.cursor.y, a.pos.x + Math.floor(a.size.x / 2), a.pos.y + Math.floor(a.size.y / 2))) <= 10) {
                        a = this.hook;
                        sc.quickmodel.focusEntity(a.pos.x + Math.floor(a.size.x / 2), a.pos.y + Math.floor(a.size.y / 2), this, true);
                        sc.quickmodel.analFocus == this && this.screen.show(this.type, this);
                        return false
                    }
                    sc.quickmodel.analFocus == this && this.screen.hide(this.type);
                    sc.quickmodel.unfocusEntity(this);
                    return false
                }
                if (ig.input.currentDevice == ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE) {
                    var b = Math.floor(sc.control.getMouseX()),
                        c = Math.floor(sc.control.getMouseY()),
                        a = this.hook;
                    if (b = b >= a.pos.x && b <= a.pos.x + a.size.x && c >= a.pos.y && c <= a.pos.y + a.size.y) {
                        if (sc.quickmodel.analFocus && sc.quickmodel.analFocus != this) {
                            sc.quickmodel.unfocusEntity(sc.quickmodel.analFocus);
                            this.screen.hide(this.type)
                        }
                        sc.quickmodel.focusEntity(a.pos.x + Math.floor(a.size.x / 2), a.pos.y + Math.floor(a.size.y / 2), this);
                        this.screen.show(this.type, this)
                    } else {
                        sc.quickmodel.analFocus ==
                            this && this.screen.hide(this.type);
                        sc.quickmodel.unfocusEntity(this)
                    }
                    return b
                }
                return false
            }
        },
        focusGained: function() {
            this.parent()
        },
        focusLost: function() {
            this.parent()
        },
        setIconColor: function(a) {
            this.color = a || 0;
            this.typeIcon.offsetX = 504 + this.color * 14
        },
        show: function(a) {
            this.doStateTransition("DEFAULT", a);
            this.showType == sc.SHOW_TYPE.INSTANT && this.typeIcon.doStateTransition("DEFAULT")
        },
        hide: function(a) {
            this.doStateTransition("HIDDEN", a);
            this.showType == sc.SHOW_TYPE.INSTANT && this.typeIcon.doStateTransition("HIDDEN")
        },
        alignGuiPosition: function(a, d) {
            if (this.entity) {
                var c = this.hook,
                    e = this.entity.coll;
                ig.system.getScreenFromMapPos(b, Math.round(e.pos.x + e.size.x / 2), Math.round(e.pos.y - e.pos.z - e.size.z / 2 + e.size.y / 2));
                if (b.x < 7) b.x = 7;
                if (b.x > ig.system.width - 6) b.x = ig.system.width - 6;
                if (b.y < 3) b.y = 3;
                if (b.y > ig.system.height - 10) b.y = ig.system.height - 10;
                c.pos.x = b.x - c.size.x / 2 + (a | 0);
                c.pos.y = b.y - c.size.y / 2 + (d | 0) + 4
            }
        },
        onAnalysisEnter: function() {
            this._fadeTimer = -0.1;
            this.showType == sc.SHOW_TYPE.DEFAULT && this.typeIcon.doStateTransition("DEFAULT");
            this.typeIcon.doStateTransition("DEFAULT")
        },
        onAnalysisExit: function() {
            this.showType == sc.SHOW_TYPE.DEFAULT && this.typeIcon.doStateTransition("HIDDEN");
            sc.quickmodel.analFocus == this && this.screen.hide(this.type)
        }
    });
    sc.QUICK_MENU_TYPES.Analyzable = sc.QuickMenuTypesBase.extend({
        nameGui: null,
        displayNameAllTime: false,
        init: function(a, b, c) {
            this.parent(a, b, c);
            this.setIconColor(b.color);
            this.showType = b.showType || 0;
            if (a = ig.LangLabel.getText(b.text)) {
                b.visible && ((new ig.VarCondition(b.visible)).evaluate() || (a = "???"));
                this.nameGui = new sc.QuickArrowBox(a, true, 200);
                this.nameGui.setPivot(this.nameGui.hook.size.x / 2, 0);
                this.nameGui.hook.transitions = {
                    DEFAULT: {
                        state: {},
                        time: 0.1,
                        timeFunction: KEY_SPLINES.EASE
                    },
                    HIDDEN: {
                        state: {
                            alpha: 0,
                            scaleX: 0.3,
                            offsetY: 8
                        },
                        time: 0.2,
                        timeFunction: KEY_SPLINES.LINEAR
                    }
                };
                this.nameGui.doStateTransition("HIDDEN", true);
                this.screen.addSubGui(this.nameGui)
            } else this.focusable = false
        },
        onAnalysisEnter: function() {
            if (this.nameGui) {
                this.nameGui.setPosition(this.hook, this.entity);
                this.parent()
            }
        },
        onAnalysisExit: function() {
            if (this.nameGui) {
                this.parent();
                this.nameGui.doStateTransition("HIDDEN")
            }
        },
        focusGained: function() {
            this.nameGui && this.nameGui.doStateTransition("DEFAULT")
        },
        focusLost: function() {
            this.nameGui && this.nameGui.doStateTransition("HIDDEN")
        },
        alignGuiPosition: function() {
            this.parent();
            this.nameGui && this.nameGui.setPosition(this.hook, this.entity)
        }
    });
    sc.QUICK_MENU_TYPES.NPC = sc.QuickMenuTypesBase.extend({
        color: sc.ANALYSIS_COLORS.BLUE,
        nameGui: null,
        displayNameAllTime: false,
        init: function(a, b, c) {
            this.parent(a, b, c);
            a = null;
            b = this.entity;
            if (b.displayName) a =
                ig.LangLabel.getText(b.displayName);
            else if (b.character.data.name) a = ig.LangLabel.getText(b.character.data.name, true);
            else if (b.displayNameRandom) a = b.displayNameRandom;
            a == "MISSING LABEL" && (a = null);
            if (b.npcStates[b.activeStateIdx]) switch (b.npcStates[b.activeStateIdx].npcEventType) {
                case sc.NPC_EVENT_TYPE.TRADE:
                    this.color = sc.ANALYSIS_COLORS.GREEN;
                    a = a ? ig.lang.get("sc.gui.trade.trader") + ": " + a : ig.lang.get("sc.gui.trade.trader");
                    break;
                case sc.NPC_EVENT_TYPE.SHOP:
                    this.color = sc.ANALYSIS_COLORS.GREEN;
                    a = a ? ig.lang.get("sc.gui.trade.shop") +
                        ": " + a : ig.lang.get("sc.gui.trade.shop");
                    break;
                case sc.NPC_EVENT_TYPE.QUEST:
                    this.showType = sc.SHOW_TYPE.INSTANT;
                    this.color = sc.ANALYSIS_COLORS.PURPLE;
                    a = a ? ig.lang.get("sc.gui.trade.quest") + ": " + a : ig.lang.get("sc.gui.trade.quest")
            }
            this.setIconColor(this.color);
            if (a) {
                b.displayTrigger && ((new ig.VarCondition(b.displayTrigger)).evaluate() || (a = "???"));
                this.nameGui = new sc.QuickArrowBox(a);
                this.nameGui.setPivot(this.nameGui.hook.size.x / 2, 0);
                this.nameGui.hook.transitions = {
                    DEFAULT: {
                        state: {},
                        time: 0.1,
                        timeFunction: KEY_SPLINES.EASE
                    },
                    HIDDEN: {
                        state: {
                            alpha: 0,
                            scaleX: 0.3,
                            offsetY: 8
                        },
                        time: 0.2,
                        timeFunction: KEY_SPLINES.LINEAR
                    }
                };
                this.nameGui.doStateTransition("HIDDEN", true);
                this.screen.addSubGui(this.nameGui)
            } else this.focusable = false
        },
        onAnalysisEnter: function() {
            if (this.nameGui) {
                this.nameGui.setPosition(this.hook, this.entity);
                this.parent()
            }
        },
        onAnalysisExit: function() {
            if (this.nameGui) {
                this.parent();
                this.nameGui.doStateTransition("HIDDEN")
            }
        },
        focusGained: function() {
            this.nameGui && this.nameGui.doStateTransition("DEFAULT")
        },
        focusLost: function() {
            this.nameGui &&
                this.nameGui.doStateTransition("HIDDEN")
        },
        alignGuiPosition: function() {
            this.parent();
            this.nameGui && this.nameGui.setPosition(this.hook, this.entity)
        }
    });
    sc.QUICK_MENU_TYPES.Enemy = sc.QuickMenuTypesBase.extend({
        color: sc.ANALYSIS_COLORS.RED,
        level: null,
        init: function(a, b, c) {
            this.parent(a, b, c);
            this.level = new sc.QuickBorderArrowLevelBox(this.entity.enemyName, this.entity);
            this.level.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.addChildGui(this.level)
        },
        alignGuiPosition: function() {
            this.parent();
            var a =
                this.entity.coll.size.z / 2 + this.entity.coll.size.y / 2,
                a = this.entity.dmgZFocus ? a - this.entity.dmgZFocus : this.entity.cameraZFocus ? a - (this.entity.cameraZFocus + 48) : a - (this.entity.coll.size.z + this.entity.coll.size.y + 8);
            this.level.setPos(0, a)
        }
    })
});
ig.baked = !0;

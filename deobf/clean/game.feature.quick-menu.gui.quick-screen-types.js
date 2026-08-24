ig.module("game.feature.quick-menu.gui.quick-screen-types").requires("impact.base.image", "impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.interact.gui.focus-gui", "game.feature.gui.base.numbers", "game.feature.combat.combat", "game.feature.quick-menu.gui.quick-misc").defines(function() {
    var tempVec = Vec2.createC(0, 0);
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
        init: function(type, entityData, screen) {
            this.parent(true, false);
            this.type = type || null;
            this.entity = entityData.entity;
            this.screen = screen;
            this.screen.registerType(type);
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
        updateDrawables: function(drawables) {
            var fadeProgress = this._fadeTimer / 0.5;
            drawables.addTransform().setPivot(8, 8).setScale(0.8 + fadeProgress, 0.8 + fadeProgress);
            drawables.addGfx(this.gfx, 0, 0, 504, 120, 15, 15).setAlpha(this.typeIcon.hook.currentState.alpha * (1 - fadeProgress));
            drawables.undoTransform()
        },
        setSize: function(width, height) {
            this.parent(width, height)
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
                    var hook = this.hook;
                    if (Math.floor(Vec2.distanceC(sc.quickmodel.cursor.x, sc.quickmodel.cursor.y, hook.pos.x + Math.floor(hook.size.x / 2), hook.pos.y + Math.floor(hook.size.y / 2))) <= 10) {
                        hook = this.hook;
                        sc.quickmodel.focusEntity(hook.pos.x + Math.floor(hook.size.x / 2), hook.pos.y + Math.floor(hook.size.y / 2), this, true);
                        sc.quickmodel.analFocus == this && this.screen.show(this.type, this);
                        return false
                    }
                    sc.quickmodel.analFocus == this && this.screen.hide(this.type);
                    sc.quickmodel.unfocusEntity(this);
                    return false
                }
                if (ig.input.currentDevice == ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE) {
                    var mouseX = Math.floor(sc.control.getMouseX()),
                        mouseY = Math.floor(sc.control.getMouseY()),
                        hook = this.hook;
                    if (mouseX = mouseX >= hook.pos.x && mouseX <= hook.pos.x + hook.size.x && mouseY >= hook.pos.y && mouseY <= hook.pos.y + hook.size.y) {
                        if (sc.quickmodel.analFocus && sc.quickmodel.analFocus != this) {
                            sc.quickmodel.unfocusEntity(sc.quickmodel.analFocus);
                            this.screen.hide(this.type)
                        }
                        sc.quickmodel.focusEntity(hook.pos.x + Math.floor(hook.size.x / 2), hook.pos.y + Math.floor(hook.size.y / 2), this);
                        this.screen.show(this.type, this)
                    } else {
                        sc.quickmodel.analFocus ==
                            this && this.screen.hide(this.type);
                        sc.quickmodel.unfocusEntity(this)
                    }
                    return mouseX
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
        setIconColor: function(color) {
            this.color = color || 0;
            this.typeIcon.offsetX = 504 + this.color * 14
        },
        show: function(instant) {
            this.doStateTransition("DEFAULT", instant);
            this.showType == sc.SHOW_TYPE.INSTANT && this.typeIcon.doStateTransition("DEFAULT")
        },
        hide: function(instant) {
            this.doStateTransition("HIDDEN", instant);
            this.showType == sc.SHOW_TYPE.INSTANT && this.typeIcon.doStateTransition("HIDDEN")
        },
        alignGuiPosition: function(offsetX, offsetY) {
            if (this.entity) {
                var hook = this.hook,
                    coll = this.entity.coll;
                ig.system.getScreenFromMapPos(tempVec, Math.round(coll.pos.x + coll.size.x / 2), Math.round(coll.pos.y - coll.pos.z - coll.size.z / 2 + coll.size.y / 2));
                if (tempVec.x < 7) tempVec.x = 7;
                if (tempVec.x > ig.system.width - 6) tempVec.x = ig.system.width - 6;
                if (tempVec.y < 3) tempVec.y = 3;
                if (tempVec.y > ig.system.height - 10) tempVec.y = ig.system.height - 10;
                hook.pos.x = tempVec.x - hook.size.x / 2 + (offsetX | 0);
                hook.pos.y = tempVec.y - hook.size.y / 2 + (offsetY | 0) + 4
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
        init: function(type, entityData, screen) {
            this.parent(type, entityData, screen);
            this.setIconColor(entityData.color);
            this.showType = entityData.showType || 0;
            if (type = ig.LangLabel.getText(entityData.text)) {
                entityData.visible && ((new ig.VarCondition(entityData.visible)).evaluate() || (type = "???"));
                this.nameGui = new sc.QuickArrowBox(type, true, 200);
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
        init: function(type, entityData, screen) {
            this.parent(type, entityData, screen);
            type = null;
            entityData = this.entity;
            if (entityData.displayName) type =
                ig.LangLabel.getText(entityData.displayName);
            else if (entityData.character.data.name) type = ig.LangLabel.getText(entityData.character.data.name, true);
            else if (entityData.displayNameRandom) type = entityData.displayNameRandom;
            type == "MISSING LABEL" && (type = null);
            if (entityData.npcStates[entityData.activeStateIdx]) switch (entityData.npcStates[entityData.activeStateIdx].npcEventType) {
                case sc.NPC_EVENT_TYPE.TRADE:
                    this.color = sc.ANALYSIS_COLORS.GREEN;
                    type = type ? ig.lang.get("sc.gui.trade.trader") + ": " + type : ig.lang.get("sc.gui.trade.trader");
                    break;
                case sc.NPC_EVENT_TYPE.SHOP:
                    this.color = sc.ANALYSIS_COLORS.GREEN;
                    type = type ? ig.lang.get("sc.gui.trade.shop") +
                        ": " + type : ig.lang.get("sc.gui.trade.shop");
                    break;
                case sc.NPC_EVENT_TYPE.QUEST:
                    this.showType = sc.SHOW_TYPE.INSTANT;
                    this.color = sc.ANALYSIS_COLORS.PURPLE;
                    type = type ? ig.lang.get("sc.gui.trade.quest") + ": " + type : ig.lang.get("sc.gui.trade.quest")
            }
            this.setIconColor(this.color);
            if (type) {
                entityData.displayTrigger && ((new ig.VarCondition(entityData.displayTrigger)).evaluate() || (type = "???"));
                this.nameGui = new sc.QuickArrowBox(type);
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
        init: function(type, entityData, screen) {
            this.parent(type, entityData, screen);
            this.level = new sc.QuickBorderArrowLevelBox(this.entity.enemyName, this.entity);
            this.level.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.addChildGui(this.level)
        },
        alignGuiPosition: function() {
            this.parent();
            var offset =
                this.entity.coll.size.z / 2 + this.entity.coll.size.y / 2,
                offset = this.entity.dmgZFocus ? offset - this.entity.dmgZFocus : this.entity.cameraZFocus ? offset - (this.entity.cameraZFocus + 48) : offset - (this.entity.coll.size.z + this.entity.coll.size.y + 8);
            this.level.setPos(0, offset)
        }
    })
});
ig.baked = !0;

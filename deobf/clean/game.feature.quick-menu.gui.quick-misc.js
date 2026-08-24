ig.module("game.feature.quick-menu.gui.quick-misc").requires("impact.base.image", "impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.gui.base.numbers", "game.feature.combat.combat", "game.feature.menu.gui.enemies.enemy-pages", "game.feature.quick-menu.gui.quick-item-menu").defines(function() {
    var tempVec = Vec2.createC(0, 0),
        defaultElemFactors = [1, 1, 1, 1],
        hideCondition = null;
    sc.QuickMenuBuffsGui = ig.BoxGui.extend({
        ninepatch: new ig.NinePatch("media/gui/menu.png", {
            width: 8,
            height: 8,
            left: 8,
            top: 8,
            right: 8,
            bottom: 8,
            offsets: {
                "default": {
                    x: 456,
                    y: 304
                },
                flipped: {
                    x: 456,
                    y: 304
                }
            }
        }),
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    offsetX: -65
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        init: function() {
            this.parent(50, 40);
            this.setPos(2, 23);
            this.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.doStateTransition("HIDDEN", true)
        },
        show: function(buffID, instant) {
            if (buffID) {
                this.removeAllChildren();
                for (var stats = sc.inventory.getItem(sc.quickmodel.buffID).stats, i = stats.length, maxWidth = 50, offsetY = 1; i--;) {
                    var settings = sc.STAT_CHANGE_SETTINGS[stats[i]];
                    if (settings.type.key != "heal") {
                        settings = new sc.QuickBuffEntry(settings);
                        settings.setPos(1, offsetY);
                        maxWidth = Math.max(maxWidth, settings.hook.size.x);
                        offsetY = offsetY + settings.hook.size.y;
                        this.addChildGui(settings)
                    }
                }
                this.hook.size.x = maxWidth + 4;
                this.hook.size.y = Math.max(16, offsetY);
                this.doStateTransition("DEFAULT")
            } else this.doStateTransition("HIDDEN", false, false, null, instant)
        },
        hide: function(instant) {
            this.doStateTransition("HIDDEN", instant)
        }
    });
    sc.QuickBuffEntry = ig.GuiElementBase.extend({
        icon: null,
        description: null,
        init: function(settings) {
            this.parent();
            this.icon = new sc.TextGui("\\i[" + settings.icon + "]\\i[" + settings.grade + "]", {
                font: sc.fontsystem.tinyFont
            });
            this.icon.setPos(2, 2);
            this.addChildGui(this.icon);
            var text = this.getStatName(settings.type, settings.change),
                text = settings.negative ? text + (" \\c[1]- " + -1 * this.getStatValue(settings.type, settings.value, settings.change) + "%\\c[0]") : text + (" \\c[2]+ " + this.getStatValue(settings.type, settings.value, settings.change) + "%\\c[0]");
            this.statName = new sc.TextGui(text, {
                font: sc.fontsystem.smallFont
            });
            this.statName.setPos(19, 0);
            this.addChildGui(this.statName);
            this.setSize(this.statName.hook.size.x + 21, 14)
        },
        getStatName: function(type, changeType, isDescription) {
            var key = "param";
            if (changeType == sc.STAT_CHANGE_TYPE.STATS)
                if (type.key == "elemFactor") switch (type.index) {
                    case 0:
                        key =
                            "heat";
                        break;
                    case 1:
                        key = "cold";
                        break;
                    case 2:
                        key = "shock";
                        break;
                    case 3:
                        key = "wave"
                } else type.key == "hp" ? key = "maxhp" : type.key == "attack" ? key = "atk" : type.key == "defense" ? key = "def" : type.key == "focus" && (key = "foc");
                else if (changeType == sc.STAT_CHANGE_TYPE.MODIFIER) key = (!isDescription ? "modifier." : "") + type.key;
            else if (changeType == sc.STAT_CHANGE_TYPE.HEAL) return "ERROR ERROR";
            return ig.lang.get("sc.gui.menu.equip." + (isDescription ? "descriptions." : "") + key)
        },
        getStatValue: function(type, value, changeType) {
            changeType == sc.STAT_CHANGE_TYPE.STATS && (value = type.key == "elemFactor" ? (value - 1) * -1 : value - 1);
            return Math.round(value * 100)
        }
    });
    sc.QuickLocationBox =
        ig.BoxGui.extend({
            ninepatch: new ig.NinePatch("media/gui/menu.png", {
                width: 5,
                height: 5,
                left: 5,
                top: 5,
                right: 5,
                bottom: 5,
                offsets: {
                    "default": {
                        x: 100,
                        y: 425
                    }
                }
            }),
            transitions: {
                HIDDEN: {
                    state: {
                        alpha: 0,
                        scaleY: 0.2
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                }
            },
            location: null,
            hasTemp: false,
            init: function() {
                this.parent(188, 20, true);
                this.location = new sc.TextGui("Autumn's Rise - Entrance");
                this.location.setPos(26, 1);
                this.addChildGui(this.location);
                this.doStateTransition("HIDDEN",
                    true)
            },
            updateDrawables: function(drawables) {
                this.parent(drawables);
                drawables.addGfx(this.ninepatch.gfx, 9, 1, 418, 33, 12, 18)
            },
            show: function(isTemp) {
                this.updateLocationName();
                if (isTemp) {
                    this.hasTemp = true;
                    this.doStateTransition("DEFAULT", false, false, function() {
                        this.doStateTransition("HIDDEN", false, false, function() {
                            this.hasTemp = false
                        }.bind(this), 2)
                    }.bind(this), 0.2)
                } else {
                    this.hasTemp = false;
                    this.hook.stateCallback = null;
                    this.doStateTransition("DEFAULT")
                }
            },
            hide: function(instant) {
                this.hasTemp || this.doStateTransition("HIDDEN", instant)
            },
            forceHide: function() {
                this.hasTemp =
                    false;
                this.hook.stateCallback = null;
                this.doStateTransition("HIDDEN", false)
            },
            onCutsceneStart: function() {
                if (this.hasTemp && this.hook.currentStateName === "DEFAULT" && this.hook.anim.timer < 0) {
                    this.hasTemp = false;
                    this.doStateTransition("HIDDEN", true)
                }
            },
            updateLocationName: function() {
                this.location.setText(sc.map.getCurrentAreaName() + " - " + sc.map.getCurrentMapName());
                this.setSize(this.location.hook.size.x + 30, 20);
                this.hook.pivot.y = this.hook.size.y
            }
        });
    sc.QuickFocusScreen = ig.GuiElementBase.extend({
        boxes: {},
        subGuis: [],
        prevType: null,
        init: function() {
            this.parent()
        },
        registerType: function(type) {
            if (sc.QUICK_INFO_BOXES[type] && !this.boxes[type]) {
                var box = new sc.QUICK_INFO_BOXES[type];
                this.boxes[type] = box;
                this.addChildGui(box)
            }
        },
        addSubGui: function(gui) {
            if (gui) {
                this.subGuis.push(gui);
                this.insertChildGui(gui, 1)
            }
        },
        show: function(type, entity, instant) {
            if (this.prevType != type) {
                this.prevType && this.hide(this.prevType);
                this.prevType = type
            }(type = this.boxes[type]) && !type.active && type.show(entity, instant)
        },
        hide: function(type) {
            var box = this.boxes[type];
            box && box.active && this.boxes[type].hide()
        },
        resetSubGuis: function() {
            for (var i =
                    this.subGuis.length; i--;) this.subGuis[i].remove();
            this.subGuis.length = 0
        },
        reset: function() {
            for (var type in this.boxes) this.boxes[type].hide(true)
        }
    });
    sc.QUICK_INFO_BOXES = {};
    sc.QUICK_INFO_BOXES.Enemy = ig.BoxGui.extend({
        ninepatch: new ig.NinePatch("media/gui/menu.png", {
            width: 8,
            height: 8,
            left: 8,
            top: 8,
            right: 8,
            bottom: 8,
            offsets: {
                "default": {
                    x: 432,
                    y: 304
                },
                flipped: {
                    x: 456,
                    y: 304
                }
            }
        }),
        transitions: {
            HIDDEN: {
                state: {
                    alpha: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE
            }
        },
        title: null,
        arrow: null,
        baseHp: null,
        baseAttack: null,
        baseDefense: null,
        baseFocus: null,
        resistance: null,
        anchor: null,
        enemy: null,
        active: false,
        init: function() {
            this.parent(127, 140);
            this.title = new sc.TextGui("", {
                font: sc.fontsystem.smallFont
            });
            this.title.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.title.setPos(0, 2);
            this.addChildGui(this.title);
            var offsetY = 21;
            this.baseHp = this.createStatusLine("maxhp", 0, 4, offsetY);
            offsetY = offsetY + 14;
            this.baseAttack = this.createStatusLine("atk", 1, 4, offsetY);
            offsetY = offsetY + 14;
            this.baseDefense = this.createStatusLine("def",
                2, 4, offsetY);
            offsetY = offsetY + 14;
            this.baseFocus = this.createStatusLine("foc", 3, 4, offsetY);
            offsetY = offsetY + 18;
            this.resistance = new sc.EnemyResistence;
            this.resistance.setPos(4, offsetY);
            this.addChildGui(this.resistance);
            this.arrow = new sc.QuickItemArrow;
            this.addChildGui(this.arrow);
            this.doStateTransition("HIDDEN", true)
        },
        updateDrawables: function(drawables) {
            this.parent(drawables);
            drawables.addColor("#CCCCCC", 3, this.title.hook.size.y + 1 + (this.tiny ? 5 : 0), 121, 1)
        },
        show: function(anchor) {
            this.alignToBase(anchor.hook);
            this.setData(anchor.entity.enemyName, anchor.entity);
            this.doStateTransition("DEFAULT");
            this.active = true
        },
        hide: function(instant) {
            this.doStateTransition("HIDDEN", instant);
            this.active = false
        },
        setData: function(enemyName, entity) {
            var enemyData = sc.combat.enemyDataList[enemyName];
            this.title.setFont(sc.fontsystem.smallFont);
            this.title.setText(sc.combat.getEnemyName(enemyName));
            if (this.title.hook.size.x >= 121) {
                this.title.setFont(sc.fontsystem.tinyFont);
                this.title.setPos(0, 6);
                this.tiny = true
            } else {
                this.tiny = false;
                this.title.setPos(0, 2)
            }
            this.resistance.hide();
            hideCondition || (hideCondition = new ig.VarCondition);
            hideCondition.setCondition(enemyData.hideStats || "false");
            if (hideCondition.evaluate()) {
                this.baseHp.number.scramble =
                    true;
                this.baseAttack.number.scramble = true;
                this.baseDefense.number.scramble = true;
                this.baseFocus.number.scramble = true;
                this.baseHp.setNumber(9999, true);
                this.baseAttack.setNumber(999, true);
                this.baseDefense.setNumber(999, true);
                this.baseFocus.setNumber(999, true)
            } else {
                this.baseHp.number.scramble = false;
                this.baseAttack.number.scramble = false;
                this.baseDefense.number.scramble = false;
                this.baseFocus.number.scramble = false;
                if (entity.params) {
                    this.baseHp.setNumber(entity.params.getStat("hp"), true);
                    this.baseAttack.setNumber(entity.params.getStat("attack"),
                        true);
                    this.baseDefense.setNumber(entity.params.getStat("defense"), true);
                    this.baseFocus.setNumber(entity.params.getStat("focus"), true);
                    this.resistance.setResistance(entity.params.getStat("elemFactor") || defaultElemFactors, true)
                }
            }
        },
        createStatusLine: function(key, color, x, y) {
            key = new sc.EnemyBaseParamLine(ig.lang.get("sc.gui.menu.equip." + key), color);
            key.setPos(x, y);
            this.addChildGui(key);
            return key
        },
        alignToBase: function(anchor) {
            var hook = this.hook,
                isHidden = hook.currentState.alpha == 0;
            tempVec.x = anchor.pos.x + Math.floor(anchor.size.x / 2);
            tempVec.y = anchor.pos.y + Math.floor(anchor.size.y / 2);
            anchor = tempVec.y + -46;
            tempVec.y = Math.max(10,
                Math.min(ig.system.height - 140 - 10, tempVec.y + -46));
            if (isHidden) hook.pos.y = tempVec.y;
            var arrowOffset = 38 + (anchor - tempVec.y);
            if (tempVec.x + 173 < ig.system.width) {
                this.currentTileOffset = "default";
                if (isHidden) hook.pos.x = tempVec.x + 20 + 10;
                hook.doPosTranstition(tempVec.x + 20, tempVec.y, 0.2, KEY_SPLINES.EASE);
                this.arrow.setPosition(-10, Math.max(7, Math.min(125, arrowOffset)), false)
            } else {
                this.currentTileOffset = "flipped";
                if (isHidden) hook.pos.x = tempVec.x - hook.size.x - 20 - 10 - 1;
                hook.doPosTranstition(tempVec.x - hook.size.x - 20 - 1, tempVec.y, 0.2, KEY_SPLINES.EASE);
                this.arrow.setPosition(hook.size.x + 1, Math.max(7, Math.min(125, 38 + (anchor - tempVec.y))), true)
            }
            this.arrow.bottomAnchor =
                false;
            this.arrow.flipY = false;
            if (arrowOffset < 7) {
                this.arrow.bottomAnchor = true;
                this.arrow.flipY = true
            } else if (arrowOffset > 125) this.arrow.bottomAnchor = true
        }
    });
    sc.QuickArrowBox = ig.GuiElementBase.extend({
        ninepatch: new ig.NinePatch("media/gui/menu.png", {
            width: 4,
            height: 4,
            left: 4,
            top: 4,
            right: 4,
            bottom: 4,
            offsets: {
                "default": {
                    x: 480,
                    y: 126
                }
            }
        }),
        name: null,
        arrowOff: Vec2.createC(0, 0),
        init: function(text, hasBorder, maxWidth) {
            this.parent();
            this.name = new sc.TextGui(text, {
                font: sc.fontsystem.tinyFont,
                maxWidth: maxWidth || 0
            });
            this.name.setPos(4, 1);
            this.addChildGui(this.name);
            this.setSize(this.name.hook.size.x + 7, hasBorder ? this.name.hook.size.y + 1 : 9)
        },
        updateDrawables: function(drawables) {
            this.ninepatch.draw(drawables, this.hook.size.x, this.hook.size.y, "default");
            drawables.addGfx(this.ninepatch.gfx, this.hook.size.x / 2 - 1.5 - this.arrowOff.x, this.arrowOff.y < 0 ? -2 : this.hook.size.y - 1, 480, 122, 3, 3, false, this.arrowOff.y < 0 ? true : false)
        },
        setPosition: function(anchor, entity) {
            var screenCoords = anchor.screenCoords;
            if (screenCoords) {
                var hook = this.hook;
                tempVec.x = screenCoords.x + anchor.size.x / 2 - hook.size.x / 2;
                tempVec.y = screenCoords.y - (entity.coll.size.y + 14);
                if (tempVec.x < 0) {
                    tempVec.x = tempVec.x * -1;
                    tempVec.x = tempVec.x + 1;
                    this.arrowOff.x = Math.max(4,
                        Math.min(hook.size.x - 4, tempVec.x))
                } else if (tempVec.x + hook.size.x > ig.system.width) {
                    tempVec.x = ig.system.width - (tempVec.x + hook.size.x + 1);
                    this.arrowOff.x = -Math.max(4, Math.min(hook.size.x - 4, -tempVec.x))
                } else {
                    tempVec.x = 0;
                    this.arrowOff.x = 0
                }
                if (tempVec.y < 0) {
                    this.arrowOff.y = -1;
                    tempVec.y = entity.coll.size.y + 6;
                    this.setStateValue("HIDDEN", "offsetY", -8)
                } else {
                    tempVec.y = -(entity.coll.size.y + 14);
                    this.arrowOff.y = 0;
                    this.setStateValue("HIDDEN", "offsetY", 8)
                }
                this.setPos(this.getCenter(anchor) + tempVec.x, anchor.pos.y + tempVec.y)
            }
        },
        getCenter: function(anchor) {
            return anchor.pos.x + anchor.size.x / 2 - this.hook.size.x / 2
        }
    });
    sc.QuickBorderArrowLevelBox =
        ig.GuiElementBase.extend({
            ninepatch: new ig.NinePatch("media/gui/menu.png", {
                width: 4,
                height: 0,
                left: 4,
                top: 9,
                right: 4,
                bottom: 0,
                offsets: {
                    "default": {
                        x: 480,
                        y: 112
                    }
                }
            }),
            levelNumber: null,
            displayColor: 0,
            sizeTransition: null,
            nameVisible: false,
            init: function(enemyName, entity) {
                this.parent();
                this.setSize(32, 9);
                var level = (entity && entity.level.override ? entity.level.override : sc.combat.getEnemyLevel(enemyName)) || 1;
                this.displayColor = this.getLevelColor(level);
                this.levelNumber = new sc.NumberGui(99, {
                    leadingZeros: 2,
                    size: sc.NUMBER_SIZE.TINY,
                    color: this.displayColor
                });
                this.levelNumber.setAlign(ig.GUI_ALIGN.X_RIGHT,
                    ig.GUI_ALIGN.Y_TOP);
                this.levelNumber.setPos(4, 2);
                this.addChildGui(this.levelNumber);
                this.levelNumber.setNumber(level)
            },
            update: function() {
                if (this.sizeTransition) {
                    this.sizeTransition.timer = this.sizeTransition.timer + ig.system.actualTick;
                    var progress = Math.min(1, Math.max(0, this.sizeTransition.timer) / this.sizeTransition.time),
                        progress = this.sizeTransition.timeFunction.get(progress);
                    this.hook.size.x = Math.round(this.sizeTransition.startWidth * (1 - progress) + this.sizeTransition.width * progress);
                    this.hook.size.y = Math.round(this.sizeTransition.startHeight *
                        (1 - progress) + this.sizeTransition.height * progress);
                    if (progress == 1) this.sizeTransition = null
                }
            },
            updateDrawables: function(drawables) {
                this.ninepatch.draw(drawables, this.hook.size.x, this.hook.size.y, "default");
                drawables.addGfx(this.ninepatch.gfx, this.hook.size.x / 2 - 1.5, this.hook.size.y - 1, 480, 122, 3, 3);
                drawables.addGfx(this.ninepatch.gfx, this.hook.size.x - 27, 2, 493, 112 + this.displayColor * 6, 9, 5)
            },
            doSizeTransition: function(width, height, time, timeFunction, delay) {
                if (time) this.sizeTransition = {
                    startWidth: this.hook.size.x,
                    width: width || 0,
                    startHeight: this.hook.size.y,
                    height: height || 0,
                    time: time,
                    timeFunction: timeFunction || KEY_SPLINES.EASE,
                    timer: 0 - (delay || 0)
                };
                else {
                    this.hook.size.x = width;
                    this.hook.size.y = height
                }
            },
            getLevelColor: function(level) {
                var player = sc.model.player,
                    playerLevel = player.level,
                    playerLevel = (0.8 * player.getAvgEquipLevel() + 0.2 * playerLevel) / level,
                    level = 1 - playerLevel;
                return level >= 0.25 ? sc.GUI_NUMBER_COLOR.RED : level >= 0.15 ? sc.GUI_NUMBER_COLOR.ORANGE : level <= -0.2 ? sc.GUI_NUMBER_COLOR.GREEN : sc.GUI_NUMBER_COLOR.WHITE
            }
        })
});
ig.baked = !0;

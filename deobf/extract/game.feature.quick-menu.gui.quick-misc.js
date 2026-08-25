ig.module("game.feature.quick-menu.gui.quick-misc").requires("impact.base.image", "impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.gui.base.numbers", "game.feature.combat.combat", "game.feature.menu.gui.enemies.enemy-pages", "game.feature.quick-menu.gui.quick-item-menu").defines(function() {
    var b = Vec2.createC(0, 0),
        a = [1, 1, 1, 1],
        d = null;
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
        show: function(a, b) {
            if (a) {
                this.removeAllChildren();
                for (var d = sc.inventory.getItem(sc.quickmodel.buffID).stats, g = d.length, h = 50, i = 1; g--;) {
                    var j = sc.STAT_CHANGE_SETTINGS[d[g]];
                    if (j.type.key != "heal") {
                        j = new sc.QuickBuffEntry(j);
                        j.setPos(1, i);
                        h = Math.max(h, j.hook.size.x);
                        i = i + j.hook.size.y;
                        this.addChildGui(j)
                    }
                }
                this.hook.size.x = h + 4;
                this.hook.size.y = Math.max(16, i);
                this.doStateTransition("DEFAULT")
            } else this.doStateTransition("HIDDEN", false, false, null, b)
        },
        hide: function(a) {
            this.doStateTransition("HIDDEN", a)
        }
    });
    sc.QuickBuffEntry = ig.GuiElementBase.extend({
        icon: null,
        description: null,
        init: function(a) {
            this.parent();
            this.icon = new sc.TextGui("\\i[" + a.icon + "]\\i[" + a.grade + "]", {
                font: sc.fontsystem.tinyFont
            });
            this.icon.setPos(2, 2);
            this.addChildGui(this.icon);
            var b = this.getStatName(a.type, a.change),
                b = a.negative ? b + (" \\c[1]- " + -1 * this.getStatValue(a.type, a.value, a.change) + "%\\c[0]") : b + (" \\c[2]+ " + this.getStatValue(a.type, a.value, a.change) + "%\\c[0]");
            this.statName = new sc.TextGui(b, {
                font: sc.fontsystem.smallFont
            });
            this.statName.setPos(19, 0);
            this.addChildGui(this.statName);
            this.setSize(this.statName.hook.size.x + 21, 14)
        },
        getStatName: function(a, b, d) {
            var g = "param";
            if (b == sc.STAT_CHANGE_TYPE.STATS)
                if (a.key == "elemFactor") switch (a.index) {
                    case 0:
                        g =
                            "heat";
                        break;
                    case 1:
                        g = "cold";
                        break;
                    case 2:
                        g = "shock";
                        break;
                    case 3:
                        g = "wave"
                } else a.key == "hp" ? g = "maxhp" : a.key == "attack" ? g = "atk" : a.key == "defense" ? g = "def" : a.key == "focus" && (g = "foc");
                else if (b == sc.STAT_CHANGE_TYPE.MODIFIER) g = (!d ? "modifier." : "") + a.key;
            else if (b == sc.STAT_CHANGE_TYPE.HEAL) return "ERROR ERROR";
            return ig.lang.get("sc.gui.menu.equip." + (d ? "descriptions." : "") + g)
        },
        getStatValue: function(a, b, d) {
            d == sc.STAT_CHANGE_TYPE.STATS && (b = a.key == "elemFactor" ? (b - 1) * -1 : b - 1);
            return Math.round(b * 100)
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
            updateDrawables: function(a) {
                this.parent(a);
                a.addGfx(this.ninepatch.gfx, 9, 1, 418, 33, 12, 18)
            },
            show: function(a) {
                this.updateLocationName();
                if (a) {
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
            hide: function(a) {
                this.hasTemp || this.doStateTransition("HIDDEN", a)
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
        registerType: function(a) {
            if (sc.QUICK_INFO_BOXES[a] && !this.boxes[a]) {
                var b = new sc.QUICK_INFO_BOXES[a];
                this.boxes[a] = b;
                this.addChildGui(b)
            }
        },
        addSubGui: function(a) {
            if (a) {
                this.subGuis.push(a);
                this.insertChildGui(a, 1)
            }
        },
        show: function(a, b, d) {
            if (this.prevType != a) {
                this.prevType && this.hide(this.prevType);
                this.prevType = a
            }(a = this.boxes[a]) && !a.active && a.show(b, d)
        },
        hide: function(a) {
            var b = this.boxes[a];
            b && b.active && this.boxes[a].hide()
        },
        resetSubGuis: function() {
            for (var a =
                    this.subGuis.length; a--;) this.subGuis[a].remove();
            this.subGuis.length = 0
        },
        reset: function() {
            for (var a in this.boxes) this.boxes[a].hide(true)
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
            var a = 21;
            this.baseHp = this.createStatusLine("maxhp", 0, 4, a);
            a = a + 14;
            this.baseAttack = this.createStatusLine("atk", 1, 4, a);
            a = a + 14;
            this.baseDefense = this.createStatusLine("def",
                2, 4, a);
            a = a + 14;
            this.baseFocus = this.createStatusLine("foc", 3, 4, a);
            a = a + 18;
            this.resistance = new sc.EnemyResistence;
            this.resistance.setPos(4, a);
            this.addChildGui(this.resistance);
            this.arrow = new sc.QuickItemArrow;
            this.addChildGui(this.arrow);
            this.doStateTransition("HIDDEN", true)
        },
        updateDrawables: function(a) {
            this.parent(a);
            a.addColor("#CCCCCC", 3, this.title.hook.size.y + 1 + (this.tiny ? 5 : 0), 121, 1)
        },
        show: function(a) {
            this.alignToBase(a.hook);
            this.setData(a.entity.enemyName, a.entity);
            this.doStateTransition("DEFAULT");
            this.active = true
        },
        hide: function(a) {
            this.doStateTransition("HIDDEN", a);
            this.active = false
        },
        setData: function(b, e) {
            var f = sc.combat.enemyDataList[b];
            this.title.setFont(sc.fontsystem.smallFont);
            this.title.setText(sc.combat.getEnemyName(b));
            if (this.title.hook.size.x >= 121) {
                this.title.setFont(sc.fontsystem.tinyFont);
                this.title.setPos(0, 6);
                this.tiny = true
            } else {
                this.tiny = false;
                this.title.setPos(0, 2)
            }
            this.resistance.hide();
            d || (d = new ig.VarCondition);
            d.setCondition(f.hideStats || "false");
            if (d.evaluate()) {
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
                if (e.params) {
                    this.baseHp.setNumber(e.params.getStat("hp"), true);
                    this.baseAttack.setNumber(e.params.getStat("attack"),
                        true);
                    this.baseDefense.setNumber(e.params.getStat("defense"), true);
                    this.baseFocus.setNumber(e.params.getStat("focus"), true);
                    this.resistance.setResistance(e.params.getStat("elemFactor") || a, true)
                }
            }
        },
        createStatusLine: function(a, b, d, g) {
            a = new sc.EnemyBaseParamLine(ig.lang.get("sc.gui.menu.equip." + a), b);
            a.setPos(d, g);
            this.addChildGui(a);
            return a
        },
        alignToBase: function(a) {
            var d = this.hook,
                f = d.currentState.alpha == 0;
            b.x = a.pos.x + Math.floor(a.size.x / 2);
            b.y = a.pos.y + Math.floor(a.size.y / 2);
            a = b.y + -46;
            b.y = Math.max(10,
                Math.min(ig.system.height - 140 - 10, b.y + -46));
            if (f) d.pos.y = b.y;
            var g = 38 + (a - b.y);
            if (b.x + 173 < ig.system.width) {
                this.currentTileOffset = "default";
                if (f) d.pos.x = b.x + 20 + 10;
                d.doPosTranstition(b.x + 20, b.y, 0.2, KEY_SPLINES.EASE);
                this.arrow.setPosition(-10, Math.max(7, Math.min(125, g)), false)
            } else {
                this.currentTileOffset = "flipped";
                if (f) d.pos.x = b.x - d.size.x - 20 - 10 - 1;
                d.doPosTranstition(b.x - d.size.x - 20 - 1, b.y, 0.2, KEY_SPLINES.EASE);
                this.arrow.setPosition(d.size.x + 1, Math.max(7, Math.min(125, 38 + (a - b.y))), true)
            }
            this.arrow.bottomAnchor =
                false;
            this.arrow.flipY = false;
            if (g < 7) {
                this.arrow.bottomAnchor = true;
                this.arrow.flipY = true
            } else if (g > 125) this.arrow.bottomAnchor = true
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
        init: function(a, b, d) {
            this.parent();
            this.name = new sc.TextGui(a, {
                font: sc.fontsystem.tinyFont,
                maxWidth: d || 0
            });
            this.name.setPos(4, 1);
            this.addChildGui(this.name);
            this.setSize(this.name.hook.size.x + 7, b ? this.name.hook.size.y + 1 : 9)
        },
        updateDrawables: function(a) {
            this.ninepatch.draw(a, this.hook.size.x, this.hook.size.y, "default");
            a.addGfx(this.ninepatch.gfx, this.hook.size.x / 2 - 1.5 - this.arrowOff.x, this.arrowOff.y < 0 ? -2 : this.hook.size.y - 1, 480, 122, 3, 3, false, this.arrowOff.y < 0 ? true : false)
        },
        setPosition: function(a, d) {
            var f = a.screenCoords;
            if (f) {
                var g = this.hook;
                b.x = f.x + a.size.x / 2 - g.size.x / 2;
                b.y = f.y - (d.coll.size.y + 14);
                if (b.x < 0) {
                    b.x = b.x * -1;
                    b.x = b.x + 1;
                    this.arrowOff.x = Math.max(4,
                        Math.min(g.size.x - 4, b.x))
                } else if (b.x + g.size.x > ig.system.width) {
                    b.x = ig.system.width - (b.x + g.size.x + 1);
                    this.arrowOff.x = -Math.max(4, Math.min(g.size.x - 4, -b.x))
                } else {
                    b.x = 0;
                    this.arrowOff.x = 0
                }
                if (b.y < 0) {
                    this.arrowOff.y = -1;
                    b.y = d.coll.size.y + 6;
                    this.setStateValue("HIDDEN", "offsetY", -8)
                } else {
                    b.y = -(d.coll.size.y + 14);
                    this.arrowOff.y = 0;
                    this.setStateValue("HIDDEN", "offsetY", 8)
                }
                this.setPos(this.getCenter(a) + b.x, a.pos.y + b.y)
            }
        },
        getCenter: function(a) {
            return a.pos.x + a.size.x / 2 - this.hook.size.x / 2
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
            init: function(a, b) {
                this.parent();
                this.setSize(32, 9);
                var d = (b && b.level.override ? b.level.override : sc.combat.getEnemyLevel(a)) || 1;
                this.displayColor = this.getLevelColor(d);
                this.levelNumber = new sc.NumberGui(99, {
                    leadingZeros: 2,
                    size: sc.NUMBER_SIZE.TINY,
                    color: this.displayColor
                });
                this.levelNumber.setAlign(ig.GUI_ALIGN.X_RIGHT,
                    ig.GUI_ALIGN.Y_TOP);
                this.levelNumber.setPos(4, 2);
                this.addChildGui(this.levelNumber);
                this.levelNumber.setNumber(d)
            },
            update: function() {
                if (this.sizeTransition) {
                    this.sizeTransition.timer = this.sizeTransition.timer + ig.system.actualTick;
                    var a = Math.min(1, Math.max(0, this.sizeTransition.timer) / this.sizeTransition.time),
                        a = this.sizeTransition.timeFunction.get(a);
                    this.hook.size.x = Math.round(this.sizeTransition.startWidth * (1 - a) + this.sizeTransition.width * a);
                    this.hook.size.y = Math.round(this.sizeTransition.startHeight *
                        (1 - a) + this.sizeTransition.height * a);
                    if (a == 1) this.sizeTransition = null
                }
            },
            updateDrawables: function(a) {
                this.ninepatch.draw(a, this.hook.size.x, this.hook.size.y, "default");
                a.addGfx(this.ninepatch.gfx, this.hook.size.x / 2 - 1.5, this.hook.size.y - 1, 480, 122, 3, 3);
                a.addGfx(this.ninepatch.gfx, this.hook.size.x - 27, 2, 493, 112 + this.displayColor * 6, 9, 5)
            },
            doSizeTransition: function(a, b, d, g, h) {
                if (d) this.sizeTransition = {
                    startWidth: this.hook.size.x,
                    width: a || 0,
                    startHeight: this.hook.size.y,
                    height: b || 0,
                    time: d,
                    timeFunction: g || KEY_SPLINES.EASE,
                    timer: 0 - (h || 0)
                };
                else {
                    this.hook.size.x = a;
                    this.hook.size.y = b
                }
            },
            getLevelColor: function(a) {
                var b = sc.model.player,
                    d = b.level,
                    d = (0.8 * b.getAvgEquipLevel() + 0.2 * d) / a,
                    a = 1 - d;
                return a >= 0.25 ? sc.GUI_NUMBER_COLOR.RED : a >= 0.15 ? sc.GUI_NUMBER_COLOR.ORANGE : a <= -0.2 ? sc.GUI_NUMBER_COLOR.GREEN : sc.GUI_NUMBER_COLOR.WHITE
            }
        })
});
ig.baked = !0;

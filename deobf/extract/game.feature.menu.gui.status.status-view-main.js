ig.module("game.feature.menu.gui.status.status-view-main").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.menu-misc").defines(function() {
    function b(a, b) {
        return Math.round(-(b[a] - 1) * 100) / 100
    }
    sc.StatusViewMain = ig.GuiElementBase.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        params: null,
        equip: null,
        init: function() {
            this.parent();
            this.setSize(ig.system.width,
                ig.system.height);
            this.params = new sc.StatusViewMainParameters;
            this.addChildGui(this.params);
            this.equip = new sc.StatusViewMainEquipment;
            this.addChildGui(this.equip);
            this.hide(true)
        },
        show: function() {
            this.params.show();
            this.equip.show()
        },
        hide: function(a) {
            this.params.hide(a);
            this.equip.hide(a)
        },
        updatePage: function() {
            this.params.updateValues()
        }
    });
    sc.StatusViewMainEquipment = sc.MenuPanel.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    offsetX: -190
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        bodyparts: {},
        init: function() {
            this.parent(sc.MenuPanelType.TOP_LEFT_EDGE);
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.setSize(165, 135);
            this.setPos(25, 59);
            var a = 5,
                a = a + (this.createEntry("head", 0, a) + 3),
                a = a + (this.createEntry("rightarm", 0, a) + 3),
                a = a + (this.createEntry("leftarm", 0, a) + 3),
                a = a + (this.createEntry("torso", 0, a) + 3);
            this.createEntry("feet", 0, a);
            this.doStateTransition("HIDDEN", true)
        },
        show: function() {
            this.updateValues();
            this.doStateTransition("DEFAULT")
        },
        hide: function() {
            this.doStateTransition("HIDDEN")
        },
        updateValues: function() {
            for (var a in this.bodyparts) this.bodyparts[a].setItem(this.getEquipID(a))
        },
        createEntry: function(a, b, c) {
            var e = new sc.StatusViewMainEquipment.Entry(a);
            e.setPos(b, c);
            this.addChildGui(e);
            this.bodyparts[a] = e;
            return e.hook.size.y
        },
        getEquipID: function(a) {
            var b = sc.model.player;
            switch (a) {
                case "head":
                    return b.equip.head;
                case "rightarm":
                    return b.equip.rightArm;
                case "leftarm":
                    return b.equip.leftArm;
                case "torso":
                    return b.equip.torso;
                case "feet":
                    return b.equip.feet
            }
        }
    });
    sc.StatusViewMainEquipment.Entry = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        textGui: null,
        itemGui: null,
        bodypart: null,
        init: function(a) {
            this.parent();
            this.setSize(165, 23);
            this.bodypart = a || "head";
            this.textGui = new sc.TextGui(ig.lang.get("sc.gui.menu.equip." + a), {
                font: sc.fontsystem.tinyFont
            });
            this.textGui.setPos(4, 0);
            this.addChildGui(this.textGui);
            this.itemGui = new sc.TextGui("\\i[item-default]Generic Equipment");
            this.itemGui.setPos(13, 7);
            this.addChildGui(this.itemGui)
        },
        updateDrawables: function(a) {
            a.addGfx(this.gfx,
                0, 7, 0, 403, 165, 1)
        },
        setItem: function(a) {
            if (a < 0) {
                this.itemGui.setText("--------------------");
                this.itemGui.setDrawCallback(null)
            } else {
                var b = sc.inventory.getItemLevel(a);
                this.itemGui.setText(sc.inventory.getItemNameWithIcon(a));
                this.itemGui.level = b;
                this.itemGui.isScalable = sc.inventory.isScalable(a);
                this.itemGui.numberGfx = this.gfx;
                this.itemGui.setDrawCallback(function(a, b) {
                    sc.MenuHelper.drawLevel(this.level, a, b, this.numberGfx, this.isScalable)
                }.bind(this.itemGui))
            }
        }
    });
    sc.StatusViewMainParameters = sc.MenuPanel.extend({
        menuGfx: new ig.Image("media/gui/menu.png"),
        statusGfx: new ig.Image("media/gui/status-gui.png"),
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    offsetX: -151
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        level: null,
        hpBar: null,
        spBar: null,
        expBar: null,
        baseParams: {
            hp: null,
            atk: null,
            def: null,
            foc: null,
            fire: null,
            cold: null,
            shock: null,
            wave: null
        },
        skinGfx: null,
        bounds: null,
        init: function() {
            this.parent(sc.MenuPanelType.TOP_RIGHT_EDGE);
            this.setSize(126, 215);
            this.setPos(25, 59);
            this.level = new sc.NumberGui(99, {
                size: sc.NUMBER_SIZE.LARGE
            });
            this.level.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.level.setPos(3, 2);
            this.addChildGui(this.level);
            this.hpBar = new sc.ItemStatusDefaultBar("HP", sc.MENU_BAR_TYPE.HP);
            this.hpBar.setPos(0, 39);
            this.addChildGui(this.hpBar);
            this.hpBar.updateValues(true);
            this.hpBar.annotation = {
                size: {
                    x: this.hpBar.hook.size.x + 2,
                    y: this.hpBar.hook.size.y + 2
                },
                offset: {
                    x: -1,
                    y: -1
                },
                content: {
                    title: "sc.gui.menu.help.item.titles.hp",
                    description: "sc.gui.menu.help.item.description.hp"
                },
                index: {
                    x: 0
                }
            };
            this.spBar = new sc.ItemStatusDefaultBar("SP",
                sc.MENU_BAR_TYPE.SP);
            this.spBar.setPos(0, 57);
            this.addChildGui(this.spBar);
            this.spBar.updateValues(true);
            this.spBar.annotation = {
                size: {
                    x: this.spBar.hook.size.x + 2,
                    y: this.spBar.hook.size.y + 2
                },
                offset: {
                    x: -1,
                    y: -1
                },
                content: {
                    title: "sc.gui.menu.help.item.titles.sp",
                    description: "sc.gui.menu.help.item.description.sp"
                },
                index: {
                    x: 0
                }
            };
            this.expBar = new sc.ItemStatusDefaultBar("EXP", sc.MENU_BAR_TYPE.EXP);
            this.expBar.setPos(0, 77);
            this.addChildGui(this.expBar);
            this.expBar.updateValues(true);
            this.expBar.annotation = {
                size: {
                    x: this.expBar.hook.size.x +
                        2,
                    y: this.expBar.hook.size.y + 2
                },
                offset: {
                    x: -1,
                    y: -1
                },
                content: {
                    title: "sc.gui.menu.help.item.titles.exp",
                    description: "sc.gui.menu.help.item.description.exp"
                },
                index: {
                    x: 0
                }
            };
            var a = 97;
            this.baseParams.hp = this.createStatusDisplay(0, a, "maxhp", 0, 0, false, 9999);
            a = a + 14;
            this.baseParams.atk = this.createStatusDisplay(0, a, "atk", 0, 1, false, 999);
            a = a + 14;
            this.baseParams.def = this.createStatusDisplay(0, a, "def", 0, 2, false, 999);
            a = a + 14;
            this.baseParams.foc = this.createStatusDisplay(0, a, "foc", 0, 3, false, 999);
            a = a + 18;
            this.baseParams.fire =
                this.createStatusDisplay(0, a, "res", 1, 4, true, 999);
            a = a + 14;
            this.baseParams.cold = this.createStatusDisplay(0, a, "res", 2, 5, true, 999);
            a = a + 14;
            this.baseParams.shock = this.createStatusDisplay(0, a, "res", 3, 6, true, 999);
            this.baseParams.wave = this.createStatusDisplay(0, a + 14, "res", 4, 7, true, 999);
            this.doStateTransition("HIDDEN", true)
        },
        updateDrawables: function(a) {
            this.parent(a);
            a.addGfx(this.menuGfx, 0, 0, 280, 472, 126, 35);
            this.skinGfx && this.bounds ? a.addGfx(this.skinGfx, 0, 0, this.bounds.x, this.bounds.y, this.bounds.w, this.bounds.h) :
                a.addGfx(this.menuGfx, 0, 0, 211, 26, 60, 34);
            a.addGfx(this.statusGfx, 64, 5, 104, 32 + sc.model.player.currentElementMode * 24, 24, 24)
        },
        show: function() {
            this.updateValues(true);
            this.checkSkin();
            this.doStateTransition("DEFAULT")
        },
        hide: function(a) {
            this.doStateTransition("HIDDEN", a)
        },
        checkSkin: function() {
            var a = sc.playerSkins.getCurrentSkin("Appearance");
            if (a && a.loaded) {
                this.skinGfx = a.guiImage;
                this.bounds = a.guiImageBounds ? a.guiImageBounds.face || null : null
            } else this.bounds = this.skinGfx = null
        },
        createStatusDisplay: function(a,
            b, c, e, f, g, h) {
            f = new sc.SimpleStatusDisplay(ig.lang.get("sc.gui.menu.equip." + c), e, f, g, h, true, 126);
            f.changeValueGui.numTransitionTime = 0.2;
            if (!g) {
                f.changeValueGui.showPlus = false;
                f.stayWhite = true
            }
            f.setPos(a, b);
            if (c == "res") {
                e == 1 && (c = "heat");
                e == 2 && (c = "cold");
                e == 3 && (c = "shock");
                e == 4 && (c = "wave")
            }
            f.annotation = {
                type: "INFO",
                content: {
                    title: "sc.gui.menu.equip." + c,
                    description: "sc.gui.menu.equip.descriptions." + c
                },
                offset: {
                    x: -1,
                    y: -1
                },
                index: {
                    x: 0
                }
            };
            this.addChildGui(f);
            return f
        },
        updateValues: function(a) {
            this.level.setNumber(sc.model.player.level);
            this.hpBar.updateValues(a);
            this.expBar.updateValues(a);
            this.spBar.updateValues(a);
            var d = sc.model.player,
                c = d.getCurrentElementMode(),
                e = d.elementConfigs[sc.menu.statusElement],
                c = e.getParam("hp") - (c.getParam("hp") - d.params.currentHp);
            this.hpBar.updateValues(a, d, c, e.getParam("hp"));
            this.baseParams.hp.setChangeValue(e.getParam("hp") || 0, a);
            this.baseParams.atk.setChangeValue(e.getParam("attack") || 0, a);
            this.baseParams.def.setChangeValue(e.getParam("defense") || 0, a);
            this.baseParams.foc.setChangeValue(e.getParam("focus") ||
                0, a);
            d = e.getParam("elemFactor");
            this.baseParams.fire.setChangeValue(b(0, d), a, true);
            this.baseParams.cold.setChangeValue(b(1, d), a, true);
            this.baseParams.shock.setChangeValue(b(2, d), a, true);
            this.baseParams.wave.setChangeValue(b(3, d), a, true)
        }
    })
});
ig.baked = !0;

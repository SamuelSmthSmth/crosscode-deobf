ig.module("game.feature.menu.gui.equip.equip-status").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.gui.plug-in", "game.feature.menu.gui.menu-misc").defines(function() {
    var b = {
        params: {
            elemFactor: [1, 1, 1, 1]
        },
        properties: {}
    };
    sc.EquipStatusContainer = ig.GuiElementBase.extend({
        compareMode: false,
        compareOffHand: false,
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
        allModifiers: {},
        modifiers: {},
        statusPanel: null,
        modPanel: null,
        modMore: null,
        arrow: null,
        arrow2: null,
        gfx: new ig.Image("media/gui/menu.png"),
        mode: true,
        init: function() {
            this.parent();
            this.setSize(169, 264);
            this.setPos(sc.options.hdMode ? 25 : 2, 28);
            this.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: -(169 + (sc.options.hdMode ? 25 : 3))
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            var a = new sc.MenuPanel(sc.MenuPanelType.TOP_RIGHT_EDGE);
            a.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        scaleY: 0
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            a.setSize(169, 121);
            a.setPivot(0, 0);
            this.addChildGui(a);
            this.statusPanel = a;
            this.modMore = new sc.TextGui(ig.lang.get("sc.gui.menu.equip.moreMod"));
            this.modMore.hook.transitions = {
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
            };
            this.modMore.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_BOTTOM);
            this.modMore.setPos(0, 0);
            this.modMore.doStateTransition("DEFAULT", true);
            var b = 5,
                c = sc.model.player.equipParams;
            this.baseParams.hp = this._createStatusDisplay(0, b, "maxhp", 0, 0, false, 9999, c.hp, void 0, a);
            b = b + 14;
            this.baseParams.atk = this._createStatusDisplay(0, b, "atk", 0, 1, false, 999, c.attack, void 0, a);
            b = b + 14;
            this.baseParams.def = this._createStatusDisplay(0, b, "def", 0, 2, false, 999, c.defense, void 0, a);
            b = b + 14;
            this.baseParams.foc = this._createStatusDisplay(0, b, "foc", 0, 3, false, 999, c.focus, void 0, a);
            b = b + 16;
            this.baseParams.fire = this._createStatusDisplay(0, b, "res", 1, 4, true, 999, c.elemFactor[0], void 0,
                a);
            b = b + 14;
            this.baseParams.cold = this._createStatusDisplay(0, b, "res", 2, 5, true, 999, c.elemFactor[1], void 0, a);
            b = b + 14;
            this.baseParams.shock = this._createStatusDisplay(0, b, "res", 3, 6, true, 999, c.elemFactor[2], void 0, a);
            this.baseParams.wave = this._createStatusDisplay(0, b + 14, "res", 4, 7, true, 999, c.elemFactor[3], void 0, a);
            a = new sc.HeaderMenuPanel(ig.lang.get("sc.gui.menu.equip.modifiers"), sc.MenuPanelType.TOP_RIGHT_EDGE);
            a.setPos(0, 125);
            a.setPivot(0, 0);
            a.setSize(169, 139);
            this.addChildGui(a);
            this.modPanel = a;
            for (var e in sc.MODIFIERS) {
                b =
                    sc.MODIFIERS[e];
                b = this._createStatusDisplay(0, 0, "modifier." + e, 5, b.icon, true, sc.MAX_MOD_VAL, 1, b.noPercent || false, a, e, b.order);
                b.doStateTransition("HIDDEN", true);
                this.allModifiers[e] = b
            }
            this._setCurrentModifiers();
            a = new ig.ColorGui("#7E7E7E", 169, 1);
            a.setPos(0, 247);
            this.addChildGui(a);
            a = new ig.ImageGui(this.gfx, 528, 224, 13, 8);
            a.setPos(3, 252);
            this.addChildGui(a);
            this.arrow = a;
            a = new ig.ImageGui(this.gfx, 528, 224, 13, 8);
            a.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            a.setPos(3, 252);
            this.addChildGui(a);
            this.arrow2 = a;
            a = new ig.ColorGui("#2C2D2D", 169, 1);
            a.setPos(0, 264);
            this.addChildGui(a);
            this.addChildGui(this.modMore);
            this.doStateTransition("HIDDEN", true)
        },
        showMenu: function() {
            this._setCurrentValues();
            this.doStateTransition("DEFAULT")
        },
        toggleViewMode: function(a) {
            if (this.mode = !this.mode) {
                this.modMore.setText(ig.lang.get("sc.gui.menu.equip.moreMod"));
                this.arrow.offsetX = 528;
                this.arrow2.offsetX = 528;
                this.updateStatusView(a);
                this.statusPanel.doStateTransition("DEFAULT", false, false, function() {}.bind(this));
                this.modPanel.doPosTranstition(0, 125, 0.2, KEY_SPLINES.LINEAR);
                this.modPanel.doSizeTransition(169, 139, 0.2)
            } else {
                this.arrow.offsetX = 512;
                this.arrow2.offsetX = 512;
                this.modMore.setText(ig.lang.get("sc.gui.menu.equip.lessMod"));
                this.statusPanel.doStateTransition("HIDDEN", false, false, function() {
                    this.updateStatusView(a)
                }.bind(this));
                this.modPanel.doPosTranstition(0, 0, 0.2, KEY_SPLINES.LINEAR);
                this.modPanel.doSizeTransition(169, 264, 0.2)
            }
        },
        updateStatusView: function(a) {
            a ? a.data && a.data.id != void 0 ? this._setParameters(a.data.id,
                !this.mode) : this.mode ? this._resetChangeValue() : this._setCurrentModifiers() : this.mode ? this._resetChangeValue() : this._setCurrentModifiers()
        },
        updateModText: function(a) {
            if (this.mode) {
                var b = "";
                if (a > (this.mode ? 7 : 100)) b = " [" + (a - 7) + " " + ig.lang.get("sc.gui.menu.equip.hidden") + "]";
                this.modMore.setText(ig.lang.get("sc.gui.menu.equip.moreMod") + b)
            }
        },
        _createStatusDisplay: function(a, b, c, e, f, g, h, i, j, k, l, o) {
            g = new sc.SimpleStatusDisplay(ig.lang.get("sc.gui.menu.equip." + c), e, f, g, h, null, null, j);
            g.setPos(a, b);
            g.setCurrentValue(i);
            if (c == "res") {
                e == 1 && (c = "heat");
                e == 2 && (c = "cold");
                e == 3 && (c = "shock");
                e == 4 && (c = "wave")
            }
            l || (l = c);
            g.annotation = {
                type: "INFO",
                content: {
                    title: "sc.gui.menu.equip." + c,
                    description: "sc.gui.menu.equip.descriptions." + l
                },
                offset: {
                    x: -1,
                    y: -1
                },
                index: {
                    x: 0,
                    y: o != void 0 ? o + 8 : f
                }
            };
            k ? k.addChildGui(g) : this.addChildGui(g);
            return g
        },
        _setParameters: function(a, d) {
            this._resetChangeValue(d);
            d && this._setCurrentModifiers();
            if (!(a != -1E3 && a < 0)) {
                var c = null,
                    e = a != -1E3 ? sc.inventory.getItem(a) : b;
                if (this.compareMode) switch (e.equipType) {
                    case sc.ITEMS_EQUIP_TYPES.HEAD:
                        c =
                            sc.model.player.equip.head;
                        break;
                    case sc.ITEMS_EQUIP_TYPES.ARM:
                        c = this.compareOffHand ? sc.model.player.equip.leftArm : sc.model.player.equip.rightArm;
                        break;
                    case sc.ITEMS_EQUIP_TYPES.TORSO:
                        c = sc.model.player.equip.torso;
                        break;
                    case sc.ITEMS_EQUIP_TYPES.FEET:
                        c = sc.model.player.equip.feet
                } else switch (sc.menu.currentBodyPart) {
                    case sc.MENU_EQUIP_BODYPART.NONE:
                        return;
                    case sc.MENU_EQUIP_BODYPART.HEAD:
                        c = sc.model.player.equip.head;
                        break;
                    case sc.MENU_EQUIP_BODYPART.RIGHT_ARM:
                        c = sc.model.player.equip.rightArm;
                        break;
                    case sc.MENU_EQUIP_BODYPART.LEFT_ARM:
                        c = sc.model.player.equip.leftArm;
                        break;
                    case sc.MENU_EQUIP_BODYPART.TORSO:
                        c = sc.model.player.equip.torso;
                        break;
                    case sc.MENU_EQUIP_BODYPART.FEET:
                        c = sc.model.player.equip.feet
                }
                var f = e.params,
                    e = e.properties,
                    g = null,
                    g = this._calculateDifference(c, "hp", f.hp || 0);
                this.baseParams.hp.setChangeValue(g);
                g = this._calculateDifference(c, "attack", f.attack || 0);
                this.baseParams.atk.setChangeValue(g);
                g = this._calculateDifference(c, "defense", f.defense || 0);
                this.baseParams.def.setChangeValue(g);
                g = this._calculateDifference(c, "focus", f.focus || 0);
                this.baseParams.foc.setChangeValue(g);
                g = this._calculateDifference(c, "elemFactor", f.elemFactor ? f.elemFactor[0] : 1, 0);
                this.baseParams.fire.setChangeValue(g);
                g = this._calculateDifference(c, "elemFactor", f.elemFactor ? f.elemFactor[1] : 1, 1);
                this.baseParams.cold.setChangeValue(g);
                g = this._calculateDifference(c, "elemFactor", f.elemFactor ? f.elemFactor[2] : 1, 2);
                this.baseParams.shock.setChangeValue(g);
                g = this._calculateDifference(c, "elemFactor", f.elemFactor ? f.elemFactor[3] :
                    1, 3);
                this.baseParams.wave.setChangeValue(g);
                var f = 11,
                    g = sc.model.player.equipModifiers,
                    h = 0,
                    i;
                for (i in this.allModifiers)
                    if (e[i] != void 0) {
                        if (h < (this.mode ? 7 : 100)) {
                            this.allModifiers[i].doStateTransition("DEFAULT", true);
                            this.allModifiers[i].setChangeValue(this._calculateDifferenceModifier(c, i, e[i]));
                            this.allModifiers[i].setPos(0, f);
                            f = f + 16
                        } else this.allModifiers[i].doStateTransition("HIDDEN", true);
                        h++
                    } else if (g[i] != void 0) {
                    if (h < (this.mode ? 7 : 100)) {
                        this.allModifiers[i].doStateTransition("DEFAULT", true);
                        this.allModifiers[i].setChangeValue(this._calculateDifferenceModifier(c,
                            i, 1));
                        this.allModifiers[i].setPos(0, f);
                        f = f + 16
                    } else this.allModifiers[i].doStateTransition("HIDDEN", true);
                    h++
                } else this.allModifiers[i].doStateTransition("HIDDEN", true);
                this.updateModText(h)
            }
        },
        _calculateDifferenceModifier: function(a, b, c, e) {
            if (a < 0) return c = (Math.round(c * 100) - 100) / 100;
            if (e) {
                b = a[b] || 1;
                return c = (Math.round(b * 100) - Math.round(c * 100)) / 100
            }
            a = sc.inventory.getItem(a).properties;
            b = a[b] != void 0 ? a[b] : 1;
            return c = (Math.round(c * 100) - Math.round(b * 100)) / 100
        },
        _calculateDifference: function(a, b, c, e) {
            if (a <
                0) {
                e != void 0 && (c = (Math.round(c * 100) - 100) / 100);
                return c
            }
            if ((a = sc.inventory.getItem(a)) && a.params && a.params[b]) {
                var f = 0;
                if (e != void 0) {
                    f = a.params[b][e] || 0;
                    c = (Math.round(c * 100) - Math.round(f * 100)) / 100
                } else {
                    f = a.params[b] || 0;
                    c = c - f
                }
            } else e != void 0 && (c = (Math.round(c * 100) - 100) / 100);
            return c
        },
        _resetChangeValue: function(a) {
            for (var b in this.baseParams) this.baseParams[b].setChangeValue(0);
            b = 11;
            var c = sc.model.player.equipModifiers,
                e = 0,
                f;
            for (f in this.allModifiers) {
                this.allModifiers[f].setChangeValue(0);
                if (c[f] ==
                    void 0) {
                    this.allModifiers[f].setCurrentValue(1, true);
                    this.allModifiers[f].doStateTransition("HIDDEN", true)
                } else {
                    if (e < (this.mode ? 7 : 100)) {
                        a && this.allModifiers[f].hook.currentStateName == "HIDDEN" && this.allModifiers[f].setCurrentValue(1, true);
                        this.allModifiers[f].setPos(0, b);
                        this.allModifiers[f].doStateTransition("DEFAULT", true);
                        b = b + 16
                    } else {
                        this.allModifiers[f].setCurrentValue(1, true);
                        this.allModifiers[f].doStateTransition("HIDDEN", true)
                    }
                    e++
                }
            }
            this.updateModText(e)
        },
        _setCurrentValues: function() {
            var a = sc.model.player.equipParams;
            this.baseParams.hp.setCurrentValue(a.hp);
            this.baseParams.atk.setCurrentValue(a.attack);
            this.baseParams.def.setCurrentValue(a.defense);
            this.baseParams.foc.setCurrentValue(a.focus);
            this.baseParams.fire.setCurrentValue(a.elemFactor[0]);
            this.baseParams.cold.setCurrentValue(a.elemFactor[1]);
            this.baseParams.shock.setCurrentValue(a.elemFactor[2]);
            this.baseParams.wave.setCurrentValue(a.elemFactor[3]);
            this._setCurrentModifiers()
        },
        _setCurrentModifiers: function() {
            var a = sc.model.player.equipModifiers,
                b = 11,
                c =
                0,
                e;
            for (e in this.allModifiers)
                if (a[e] != void 0) {
                    if (c < (this.mode ? 7 : 100)) {
                        this.allModifiers[e].doStateTransition("DEFAULT", true);
                        this.allModifiers[e].setCurrentValue(a[e]);
                        this.allModifiers[e].setPos(0, b);
                        b = b + 16
                    }
                    c++
                } this.updateModText(c)
        },
        modelChanged: function(a, b, c) {
            a == sc.menu && (b == sc.MENU_EVENT.ITEM_INFO_CHANGED ? this._setParameters(c) : b == sc.MENU_EVENT.INFO_TEXT_CHANGED ? sc.menu.infoText == "" && this._resetChangeValue() : b == sc.MENU_EVENT.EQUIP_CHANGED ? this._setCurrentValues() : b == sc.MENU_EVENT.SELECTED_BODYPART ?
                this._resetChangeValue() : b == sc.MENU_EVENT.ITEM_RESET_INFO ? this._resetChangeValue() : b == sc.MENU_EVENT.EQUIP_ENSURE_CURRENT_VALUES && this._setCurrentValues())
        }
    })
});
ig.baked = !0;

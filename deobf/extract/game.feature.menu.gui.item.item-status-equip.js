ig.module("game.feature.menu.gui.item.item-status-equip").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.menu-misc").defines(function() {
    sc.ItemStatusEquip = sc.MenuPanel.extend({
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
        gfx: new ig.Image("media/gui/menu.png"),
        init: function() {
            this.parent(sc.MenuPanelType.TOP_RIGHT_EDGE);
            this.setSize(126, 121);
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
                        offsetX: -(126 + (sc.options.hdMode ? 25 : 3))
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            var b = 5;
            this.baseParams.hp = this._createStatusDisplay(0, b, "maxhp", 0, 0, false, 9999);
            b = b + 14;
            this.baseParams.atk = this._createStatusDisplay(0, b, "atk", 0, 1, false, 999);
            b = b + 14;
            this.baseParams.def = this._createStatusDisplay(0, b, "def", 0, 2, false, 999);
            b = b + 14;
            this.baseParams.foc = this._createStatusDisplay(0, b, "foc", 0, 3, false, 999);
            b = b + 16;
            this.baseParams.fire = this._createStatusDisplay(0,
                b, "res", 1, 4, true, 999);
            b = b + 14;
            this.baseParams.cold = this._createStatusDisplay(0, b, "res", 2, 5, true, 999);
            b = b + 14;
            this.baseParams.shock = this._createStatusDisplay(0, b, "res", 3, 6, true, 999);
            this.baseParams.wave = this._createStatusDisplay(0, b + 14, "res", 4, 7, true, 999);
            this.doStateTransition("HIDDEN", true)
        },
        addObservers: function() {
            sc.Model.addObserver(sc.menu, this)
        },
        removeObservers: function() {
            sc.Model.removeObserver(sc.menu, this)
        },
        showMenu: function() {
            this._resetParameters();
            sc.menu.isItemEquipTab() && this.doStateTransition("DEFAULT")
        },
        exitMenu: function() {
            this.doStateTransition("HIDDEN")
        },
        modelChanged: function(b, a, d) {
            b == sc.menu && (a == sc.MENU_EVENT.ITEM_INFO_CHANGED ? this._setParameters(d) : a == sc.MENU_EVENT.INFO_TEXT_CHANGED ? sc.menu.infoText == "" && this._resetParameters() : a == sc.MENU_EVENT.ITEM_CHANGED_TAB ? sc.menu.isItemEquipTab() ? this.doStateTransition("DEFAULT") : this.doStateTransition("HIDDEN") : a == sc.MENU_EVENT.ITEM_RESET_INFO && this._resetParameters())
        },
        _setParameters: function(b) {
            this._resetParameters();
            if (!(b < 0) && sc.menu.isItemEquipTab())
                if (b =
                    sc.inventory.getItem(b).params) {
                    this.baseParams.hp.setChangeValue(b.hp || 0);
                    this.baseParams.atk.setChangeValue(b.attack || 0);
                    this.baseParams.def.setChangeValue(b.defense || 0);
                    this.baseParams.foc.setChangeValue(b.focus || 0);
                    if (b.elemFactor) {
                        this.baseParams.fire.setChangeValue(Math.round((b.elemFactor[0] || 1) * 100 - 100) / 100);
                        this.baseParams.cold.setChangeValue(Math.round((b.elemFactor[1] || 1) * 100 - 100) / 100);
                        this.baseParams.shock.setChangeValue(Math.round((b.elemFactor[2] || 1) * 100 - 100) / 100);
                        this.baseParams.wave.setChangeValue(Math.round((b.elemFactor[3] ||
                            1) * 100 - 100) / 100)
                    }
                }
        },
        _resetParameters: function() {
            for (var b in this.baseParams) this.baseParams[b].setChangeValue(0)
        },
        _createStatusDisplay: function(b, a, d, c, e, f, g) {
            f = new sc.SimpleStatusDisplay(ig.lang.get("sc.gui.menu.equip." + d), c, e, f, g, true, 126);
            f.setPos(b, a);
            if (d == "res") {
                c == 1 && (d = "heat");
                c == 2 && (d = "cold");
                c == 3 && (d = "shock");
                c == 4 && (d = "wave")
            }
            f.annotation = {
                type: "INFO",
                content: {
                    title: "sc.gui.menu.equip." + d,
                    description: "sc.gui.menu.equip.descriptions." + d
                },
                offset: {
                    x: -1,
                    y: -1
                },
                index: {
                    x: 0,
                    y: e
                }
            };
            this.addChildGui(f);
            return f
        }
    });
    sc.ItemEquipModifier = sc.HeaderMenuPanel.extend({
        modifierText: null,
        modifierPool: {},
        init: function() {
            this.parent(ig.lang.get("sc.gui.menu.equip.modifiers"), sc.MenuPanelType.TOP_RIGHT_EDGE);
            this.setSize(126, 139);
            this.setPos(sc.options.hdMode ? 25 : 2, 153);
            this.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: -(126 + (sc.options.hdMode ? 25 : 3))
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            for (var b in sc.MODIFIERS) {
                var a = sc.MODIFIERS[b],
                    a =
                    this._createStatusDisplay(0, 0, "modifier." + b, 5, a.icon, true, sc.MAX_MOD_VAL, a.noPercent || false, b, a.order);
                a.doStateTransition("HIDDEN", true);
                this.modifierPool[b] = a
            }
            this.doStateTransition("HIDDEN", true)
        },
        addObservers: function() {
            sc.Model.addObserver(sc.menu, this)
        },
        removeObservers: function() {
            sc.Model.removeObserver(sc.menu, this)
        },
        showMenu: function() {
            this._resetParameters();
            sc.menu.isItemEquipTab() && this.doStateTransition("DEFAULT")
        },
        exitMenu: function() {
            this.doStateTransition("HIDDEN")
        },
        modelChanged: function(b,
            a, d) {
            b == sc.menu && (a == sc.MENU_EVENT.ITEM_INFO_CHANGED ? this._setParameters(d) : a == sc.MENU_EVENT.INFO_TEXT_CHANGED ? sc.menu.infoText == "" && this._resetParameters() : a == sc.MENU_EVENT.ITEM_CHANGED_TAB && (sc.menu.isItemEquipTab() ? this.doStateTransition("DEFAULT") : this.doStateTransition("HIDDEN")))
        },
        _setParameters: function(b) {
            this._resetParameters();
            if (!(b < 0) && sc.menu.isItemEquipTab())
                if (b = sc.inventory.getItem(b).properties) {
                    var a = 12,
                        d;
                    for (d in this.modifierPool)
                        if (b[d] != void 0) {
                            this.modifierPool[d].doStateTransition("DEFAULT",
                                true);
                            this.modifierPool[d].setChangeValue(Math.round((b[d] || 0) * 100 - 100) / 100);
                            this.modifierPool[d].setPos(0, a);
                            a = a + 16
                        }
                }
        },
        _resetParameters: function() {
            for (var b in this.modifierPool) {
                this.modifierPool[b].setChangeValue(0);
                this.modifierPool[b].doStateTransition("HIDDEN", true)
            }
        },
        _createStatusDisplay: function(b, a, d, c, e, f, g, h, i, j) {
            d = new sc.SimpleStatusDisplay(ig.lang.get("sc.gui.menu.equip." + d), c, e, f, g, true, 126, h);
            d.setPos(b, a);
            d.annotation = {
                type: "INFO",
                content: {
                    title: "sc.gui.menu.equip.modifier." + i,
                    description: "sc.gui.menu.equip.descriptions." +
                        i
                },
                offset: {
                    x: -1,
                    y: -1
                },
                index: {
                    x: 0,
                    y: j + 8
                }
            };
            this.addChildGui(d);
            return d
        }
    })
});
ig.baked = !0;

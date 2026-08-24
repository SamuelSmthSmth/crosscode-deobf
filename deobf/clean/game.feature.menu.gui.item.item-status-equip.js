/**
 * game.feature.menu.gui.item.item-status-equip
 * ============================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.item.item-status-equip")`.
 *
 * The left status panel of the item menu's equip tab: `sc.ItemStatusEquip`
 * shows the base params (HP/ATK/DEF/FOC + element resistances) with change
 * values previewing the hovered item; `sc.ItemEquipModifier` shows the
 * hovered item's active modifiers below it.
 */
ig.module("game.feature.menu.gui.item.item-status-equip")
    .requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.menu-misc")
    .defines(function () {

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

        init: function () {
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
            var posY = 5;
            this.baseParams.hp = this._createStatusDisplay(0, posY, "maxhp", 0, 0, false, 9999);
            posY = posY + 14;
            this.baseParams.atk = this._createStatusDisplay(0, posY, "atk", 0, 1, false, 999);
            posY = posY + 14;
            this.baseParams.def = this._createStatusDisplay(0, posY, "def", 0, 2, false, 999);
            posY = posY + 14;
            this.baseParams.foc = this._createStatusDisplay(0, posY, "foc", 0, 3, false, 999);
            posY = posY + 16;
            this.baseParams.fire = this._createStatusDisplay(0, posY, "res", 1, 4, true, 999);
            posY = posY + 14;
            this.baseParams.cold = this._createStatusDisplay(0, posY, "res", 2, 5, true, 999);
            posY = posY + 14;
            this.baseParams.shock = this._createStatusDisplay(0, posY, "res", 3, 6, true, 999);
            this.baseParams.wave = this._createStatusDisplay(0, posY + 14, "res", 4, 7, true, 999);
            this.doStateTransition("HIDDEN", true)
        },

        addObservers: function () {
            sc.Model.addObserver(sc.menu, this)
        },

        removeObservers: function () {
            sc.Model.removeObserver(sc.menu, this)
        },

        showMenu: function () {
            this._resetParameters();
            sc.menu.isItemEquipTab() && this.doStateTransition("DEFAULT")
        },

        exitMenu: function () {
            this.doStateTransition("HIDDEN")
        },

        modelChanged: function (menu, event, data) {
            if (menu == sc.menu) {
                if (event == sc.MENU_EVENT.ITEM_INFO_CHANGED) {
                    this._setParameters(data)
                } else if (event == sc.MENU_EVENT.INFO_TEXT_CHANGED) {
                    sc.menu.infoText == "" && this._resetParameters()
                } else if (event == sc.MENU_EVENT.ITEM_CHANGED_TAB) {
                    sc.menu.isItemEquipTab() ? this.doStateTransition("DEFAULT") : this.doStateTransition("HIDDEN")
                } else if (event == sc.MENU_EVENT.ITEM_RESET_INFO) {
                    this._resetParameters()
                }
            }
        },

        _setParameters: function (itemID) {
            this._resetParameters();
            if (!(itemID < 0) && sc.menu.isItemEquipTab()) {
                if (itemID = sc.inventory.getItem(itemID).params) {
                    this.baseParams.hp.setChangeValue(itemID.hp || 0);
                    this.baseParams.atk.setChangeValue(itemID.attack || 0);
                    this.baseParams.def.setChangeValue(itemID.defense || 0);
                    this.baseParams.foc.setChangeValue(itemID.focus || 0);
                    if (itemID.elemFactor) {
                        this.baseParams.fire.setChangeValue(Math.round((itemID.elemFactor[0] || 1) * 100 - 100) / 100);
                        this.baseParams.cold.setChangeValue(Math.round((itemID.elemFactor[1] || 1) * 100 - 100) / 100);
                        this.baseParams.shock.setChangeValue(Math.round((itemID.elemFactor[2] || 1) * 100 - 100) / 100);
                        this.baseParams.wave.setChangeValue(Math.round((itemID.elemFactor[3] || 1) * 100 - 100) / 100)
                    }
                }
            }
        },

        _resetParameters: function () {
            for (var key in this.baseParams) {
                this.baseParams[key].setChangeValue(0)
            }
        },

        _createStatusDisplay: function (x, y, key, type, icon, isPercent, maxValue) {
            var display = new sc.SimpleStatusDisplay(ig.lang.get("sc.gui.menu.equip." + key), type, icon, isPercent, maxValue, true, 126);
            display.setPos(x, y);
            if (key == "res") {
                type == 1 && (key = "heat");
                type == 2 && (key = "cold");
                type == 3 && (key = "shock");
                type == 4 && (key = "wave")
            }
            display.annotation = {
                type: "INFO",
                content: {
                    title: "sc.gui.menu.equip." + key,
                    description: "sc.gui.menu.equip.descriptions." + key
                },
                offset: {
                    x: -1,
                    y: -1
                },
                index: {
                    x: 0,
                    y: icon
                }
            };
            this.addChildGui(display);
            return display
        }
    });

    sc.ItemEquipModifier = sc.HeaderMenuPanel.extend({
        modifierText: null,
        modifierPool: {},

        init: function () {
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
            for (var modifier in sc.MODIFIERS) {
                var modData = sc.MODIFIERS[modifier],
                    display = this._createStatusDisplay(0, 0, "modifier." + modifier, 5, modData.icon, true, sc.MAX_MOD_VAL, modData.noPercent || false, modifier, modData.order);
                display.doStateTransition("HIDDEN", true);
                this.modifierPool[modifier] = display
            }
            this.doStateTransition("HIDDEN", true)
        },

        addObservers: function () {
            sc.Model.addObserver(sc.menu, this)
        },

        removeObservers: function () {
            sc.Model.removeObserver(sc.menu, this)
        },

        showMenu: function () {
            this._resetParameters();
            sc.menu.isItemEquipTab() && this.doStateTransition("DEFAULT")
        },

        exitMenu: function () {
            this.doStateTransition("HIDDEN")
        },

        modelChanged: function (menu, event, data) {
            if (menu == sc.menu) {
                if (event == sc.MENU_EVENT.ITEM_INFO_CHANGED) {
                    this._setParameters(data)
                } else if (event == sc.MENU_EVENT.INFO_TEXT_CHANGED) {
                    sc.menu.infoText == "" && this._resetParameters()
                } else if (event == sc.MENU_EVENT.ITEM_CHANGED_TAB) {
                    sc.menu.isItemEquipTab() ? this.doStateTransition("DEFAULT") : this.doStateTransition("HIDDEN")
                }
            }
        },

        _setParameters: function (itemID) {
            this._resetParameters();
            if (!(itemID < 0) && sc.menu.isItemEquipTab()) {
                if (itemID = sc.inventory.getItem(itemID).properties) {
                    var posY = 12;
                    for (var modifier in this.modifierPool) {
                        if (itemID[modifier] != void 0) {
                            this.modifierPool[modifier].doStateTransition("DEFAULT", true);
                            this.modifierPool[modifier].setChangeValue(Math.round((itemID[modifier] || 0) * 100 - 100) / 100);
                            this.modifierPool[modifier].setPos(0, posY);
                            posY = posY + 16
                        }
                    }
                }
            }
        },

        _resetParameters: function () {
            for (var modifier in this.modifierPool) {
                this.modifierPool[modifier].setChangeValue(0);
                this.modifierPool[modifier].doStateTransition("HIDDEN", true)
            }
        },

        _createStatusDisplay: function (x, y, key, type, icon, isPercent, maxValue, noPercent, modifier, order) {
            var display = new sc.SimpleStatusDisplay(ig.lang.get("sc.gui.menu.equip." + key), type, icon, isPercent, maxValue, true, 126, noPercent);
            display.setPos(x, y);
            display.annotation = {
                type: "INFO",
                content: {
                    title: "sc.gui.menu.equip.modifier." + modifier,
                    description: "sc.gui.menu.equip.descriptions." + modifier
                },
                offset: {
                    x: -1,
                    y: -1
                },
                index: {
                    x: 0,
                    y: order + 8
                }
            };
            this.addChildGui(display);
            return display
        }
    })
});
ig.baked = !0;

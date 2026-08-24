/**
 * game.feature.menu.gui.equip.equip-status
 * ========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.equip.equip-status")`.
 *
 * `sc.EquipStatusContainer`: the left status panel of the equip menu.
 * Shows the base params (HP, ATK, DEF, FOC, element resistances) and the
 * active modifiers, with change values previewing the item currently
 * hovered in the list (difference vs. the equipped item, or vs. nothing
 * when unequipping). `toggleViewMode` switches between a compact status
 * view and the full modifier list; `updateModText` shows how many
 * modifiers are hidden behind "more mods".
 */
ig.module("game.feature.menu.gui.equip.equip-status")
    .requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.gui.plug-in", "game.feature.menu.gui.menu-misc")
    .defines(function () {

    var UNEQUIP_ITEM = {
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

        init: function () {
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
            var panel = new sc.MenuPanel(sc.MenuPanelType.TOP_RIGHT_EDGE);
            panel.hook.transitions = {
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
            panel.setSize(169, 121);
            panel.setPivot(0, 0);
            this.addChildGui(panel);
            this.statusPanel = panel;
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
            var posY = 5,
                equipParams = sc.model.player.equipParams;
            this.baseParams.hp = this._createStatusDisplay(0, posY, "maxhp", 0, 0, false, 9999, equipParams.hp, void 0, panel);
            posY = posY + 14;
            this.baseParams.atk = this._createStatusDisplay(0, posY, "atk", 0, 1, false, 999, equipParams.attack, void 0, panel);
            posY = posY + 14;
            this.baseParams.def = this._createStatusDisplay(0, posY, "def", 0, 2, false, 999, equipParams.defense, void 0, panel);
            posY = posY + 14;
            this.baseParams.foc = this._createStatusDisplay(0, posY, "foc", 0, 3, false, 999, equipParams.focus, void 0, panel);
            posY = posY + 16;
            this.baseParams.fire = this._createStatusDisplay(0, posY, "res", 1, 4, true, 999, equipParams.elemFactor[0], void 0, panel);
            posY = posY + 14;
            this.baseParams.cold = this._createStatusDisplay(0, posY, "res", 2, 5, true, 999, equipParams.elemFactor[1], void 0, panel);
            posY = posY + 14;
            this.baseParams.shock = this._createStatusDisplay(0, posY, "res", 3, 6, true, 999, equipParams.elemFactor[2], void 0, panel);
            this.baseParams.wave = this._createStatusDisplay(0, posY + 14, "res", 4, 7, true, 999, equipParams.elemFactor[3], void 0, panel);
            panel = new sc.HeaderMenuPanel(ig.lang.get("sc.gui.menu.equip.modifiers"), sc.MenuPanelType.TOP_RIGHT_EDGE);
            panel.setPos(0, 125);
            panel.setPivot(0, 0);
            panel.setSize(169, 139);
            this.addChildGui(panel);
            this.modPanel = panel;
            for (var modifier in sc.MODIFIERS) {
                var modData = sc.MODIFIERS[modifier];
                var display = this._createStatusDisplay(0, 0, "modifier." + modifier, 5, modData.icon, true, sc.MAX_MOD_VAL, 1, modData.noPercent || false, panel, modifier, modData.order);
                display.doStateTransition("HIDDEN", true);
                this.allModifiers[modifier] = display
            }
            this._setCurrentModifiers();
            panel = new ig.ColorGui("#7E7E7E", 169, 1);
            panel.setPos(0, 247);
            this.addChildGui(panel);
            panel = new ig.ImageGui(this.gfx, 528, 224, 13, 8);
            panel.setPos(3, 252);
            this.addChildGui(panel);
            this.arrow = panel;
            panel = new ig.ImageGui(this.gfx, 528, 224, 13, 8);
            panel.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            panel.setPos(3, 252);
            this.addChildGui(panel);
            this.arrow2 = panel;
            panel = new ig.ColorGui("#2C2D2D", 169, 1);
            panel.setPos(0, 264);
            this.addChildGui(panel);
            this.addChildGui(this.modMore);
            this.doStateTransition("HIDDEN", true)
        },

        showMenu: function () {
            this._setCurrentValues();
            this.doStateTransition("DEFAULT")
        },

        toggleViewMode: function (focusGui) {
            if (this.mode = !this.mode) {
                this.modMore.setText(ig.lang.get("sc.gui.menu.equip.moreMod"));
                this.arrow.offsetX = 528;
                this.arrow2.offsetX = 528;
                this.updateStatusView(focusGui);
                this.statusPanel.doStateTransition("DEFAULT", false, false, function () {}.bind(this));
                this.modPanel.doPosTranstition(0, 125, 0.2, KEY_SPLINES.LINEAR);
                this.modPanel.doSizeTransition(169, 139, 0.2)
            } else {
                this.arrow.offsetX = 512;
                this.arrow2.offsetX = 512;
                this.modMore.setText(ig.lang.get("sc.gui.menu.equip.lessMod"));
                this.statusPanel.doStateTransition("HIDDEN", false, false, function () {
                    this.updateStatusView(focusGui)
                }.bind(this));
                this.modPanel.doPosTranstition(0, 0, 0.2, KEY_SPLINES.LINEAR);
                this.modPanel.doSizeTransition(169, 264, 0.2)
            }
        },

        updateStatusView: function (focusGui) {
            if (focusGui) {
                if (focusGui.data && focusGui.data.id != void 0) this._setParameters(focusGui.data.id, !this.mode);
                else if (this.mode) this._resetChangeValue();
                else this._setCurrentModifiers()
            } else if (this.mode) this._resetChangeValue();
            else this._setCurrentModifiers()
        },

        updateModText: function (count) {
            if (this.mode) {
                var extra = "";
                if (count > (this.mode ? 7 : 100)) extra = " [" + (count - 7) + " " + ig.lang.get("sc.gui.menu.equip.hidden") + "]";
                this.modMore.setText(ig.lang.get("sc.gui.menu.equip.moreMod") + extra)
            }
        },

        _createStatusDisplay: function (posX, posY, label, iconID, lineID, usePercent, maxValue, value, noPercentMode, parentGui, modifierKey, order) {
            var display = new sc.SimpleStatusDisplay(ig.lang.get("sc.gui.menu.equip." + label), lineID, iconID, usePercent, maxValue, null, null, noPercentMode);
            display.setPos(posX, posY);
            display.setCurrentValue(value);
            if (label == "res") {
                if (iconID == 1) label = "heat";
                if (iconID == 2) label = "cold";
                if (iconID == 3) label = "shock";
                if (iconID == 4) label = "wave"
            }
            if (!modifierKey) modifierKey = label;
            display.annotation = {
                type: "INFO",
                content: {
                    title: "sc.gui.menu.equip." + label,
                    description: "sc.gui.menu.equip.descriptions." + modifierKey
                },
                offset: {
                    x: -1,
                    y: -1
                },
                index: {
                    x: 0,
                    y: order != void 0 ? order + 8 : lineID
                }
            };
            if (parentGui) parentGui.addChildGui(display);
            else this.addChildGui(display);
            return display
        },

        _setParameters: function (itemId, showDiff) {
            this._resetChangeValue(showDiff);
            if (showDiff) this._setCurrentModifiers();
            if (!(itemId != -1E3 && itemId < 0)) {
                var equipped = null,
                    item = itemId != -1E3 ? sc.inventory.getItem(itemId) : UNEQUIP_ITEM;
                if (this.compareMode)
                    switch (item.equipType) {
                        case sc.ITEMS_EQUIP_TYPES.HEAD:
                            equipped = sc.model.player.equip.head;
                            break;
                        case sc.ITEMS_EQUIP_TYPES.ARM:
                            equipped = this.compareOffHand ? sc.model.player.equip.leftArm : sc.model.player.equip.rightArm;
                            break;
                        case sc.ITEMS_EQUIP_TYPES.TORSO:
                            equipped = sc.model.player.equip.torso;
                            break;
                        case sc.ITEMS_EQUIP_TYPES.FEET:
                            equipped = sc.model.player.equip.feet
                    }
                else
                    switch (sc.menu.currentBodyPart) {
                        case sc.MENU_EQUIP_BODYPART.NONE:
                            return;
                        case sc.MENU_EQUIP_BODYPART.HEAD:
                            equipped = sc.model.player.equip.head;
                            break;
                        case sc.MENU_EQUIP_BODYPART.RIGHT_ARM:
                            equipped = sc.model.player.equip.rightArm;
                            break;
                        case sc.MENU_EQUIP_BODYPART.LEFT_ARM:
                            equipped = sc.model.player.equip.leftArm;
                            break;
                        case sc.MENU_EQUIP_BODYPART.TORSO:
                            equipped = sc.model.player.equip.torso;
                            break;
                        case sc.MENU_EQUIP_BODYPART.FEET:
                            equipped = sc.model.player.equip.feet
                    }
                var params = item.params,
                    properties = item.properties,
                    diff = null,
                    diff = this._calculateDifference(equipped, "hp", params.hp || 0);
                this.baseParams.hp.setChangeValue(diff);
                diff = this._calculateDifference(equipped, "attack", params.attack || 0);
                this.baseParams.atk.setChangeValue(diff);
                diff = this._calculateDifference(equipped, "defense", params.defense || 0);
                this.baseParams.def.setChangeValue(diff);
                diff = this._calculateDifference(equipped, "focus", params.focus || 0);
                this.baseParams.foc.setChangeValue(diff);
                diff = this._calculateDifference(equipped, "elemFactor", params.elemFactor ? params.elemFactor[0] : 1, 0);
                this.baseParams.fire.setChangeValue(diff);
                diff = this._calculateDifference(equipped, "elemFactor", params.elemFactor ? params.elemFactor[1] : 1, 1);
                this.baseParams.cold.setChangeValue(diff);
                diff = this._calculateDifference(equipped, "elemFactor", params.elemFactor ? params.elemFactor[2] : 1, 2);
                this.baseParams.shock.setChangeValue(diff);
                diff = this._calculateDifference(equipped, "elemFactor", params.elemFactor ? params.elemFactor[3] : 1, 3);
                this.baseParams.wave.setChangeValue(diff);
                var posY = 11,
                    equipModifiers = sc.model.player.equipModifiers,
                    count = 0,
                    modifier;
                for (modifier in this.allModifiers)
                    if (properties[modifier] != void 0) {
                        if (count < (this.mode ? 7 : 100)) {
                            this.allModifiers[modifier].doStateTransition("DEFAULT", true);
                            this.allModifiers[modifier].setChangeValue(this._calculateDifferenceModifier(equipped, modifier, properties[modifier]));
                            this.allModifiers[modifier].setPos(0, posY);
                            posY = posY + 16
                        } else this.allModifiers[modifier].doStateTransition("HIDDEN", true);
                        count++
                    } else if (equipModifiers[modifier] != void 0) {
                        if (count < (this.mode ? 7 : 100)) {
                            this.allModifiers[modifier].doStateTransition("DEFAULT", true);
                            this.allModifiers[modifier].setChangeValue(this._calculateDifferenceModifier(equipped, modifier, 1));
                            this.allModifiers[modifier].setPos(0, posY);
                            posY = posY + 16
                        } else this.allModifiers[modifier].doStateTransition("HIDDEN", true);
                        count++
                    } else this.allModifiers[modifier].doStateTransition("HIDDEN", true);
                this.updateModText(count)
            }
        },

        _calculateDifferenceModifier: function (equippedId, modifier, value, noEquipped) {
            if (equippedId < 0) return value = (Math.round(value * 100) - 100) / 100;
            if (noEquipped) {
                var mod = equippedId[modifier] || 1;
                return value = (Math.round(mod * 100) - Math.round(value * 100)) / 100
            }
            var props = sc.inventory.getItem(equippedId).properties;
            mod = props[modifier] != void 0 ? props[modifier] : 1;
            return value = (Math.round(value * 100) - Math.round(mod * 100)) / 100
        },

        _calculateDifference: function (equippedId, param, value, elemIndex) {
            if (equippedId < 0) {
                if (elemIndex != void 0) value = (Math.round(value * 100) - 100) / 100;
                return value
            }
            if ((equippedId = sc.inventory.getItem(equippedId)) && equippedId.params && equippedId.params[param]) {
                var base = 0;
                if (elemIndex != void 0) {
                    base = equippedId.params[param][elemIndex] || 0;
                    value = (Math.round(value * 100) - Math.round(base * 100)) / 100
                } else {
                    base = equippedId.params[param] || 0;
                    value = value - base
                }
            } else if (elemIndex != void 0) value = (Math.round(value * 100) - 100) / 100;
            return value
        },

        _resetChangeValue: function (skipSounds) {
            for (var param in this.baseParams) this.baseParams[param].setChangeValue(0);
            var posY = 11,
                equipModifiers = sc.model.player.equipModifiers,
                count = 0,
                modifier;
            for (modifier in this.allModifiers) {
                this.allModifiers[modifier].setChangeValue(0);
                if (equipModifiers[modifier] == void 0) {
                    this.allModifiers[modifier].setCurrentValue(1, true);
                    this.allModifiers[modifier].doStateTransition("HIDDEN", true)
                } else {
                    if (count < (this.mode ? 7 : 100)) {
                        if (skipSounds && this.allModifiers[modifier].hook.currentStateName == "HIDDEN") this.allModifiers[modifier].setCurrentValue(1, true);
                        this.allModifiers[modifier].setPos(0, posY);
                        this.allModifiers[modifier].doStateTransition("DEFAULT", true);
                        posY = posY + 16
                    } else {
                        this.allModifiers[modifier].setCurrentValue(1, true);
                        this.allModifiers[modifier].doStateTransition("HIDDEN", true)
                    }
                    count++
                }
            }
            this.updateModText(count)
        },

        _setCurrentValues: function () {
            var equipParams = sc.model.player.equipParams;
            this.baseParams.hp.setCurrentValue(equipParams.hp);
            this.baseParams.atk.setCurrentValue(equipParams.attack);
            this.baseParams.def.setCurrentValue(equipParams.defense);
            this.baseParams.foc.setCurrentValue(equipParams.focus);
            this.baseParams.fire.setCurrentValue(equipParams.elemFactor[0]);
            this.baseParams.cold.setCurrentValue(equipParams.elemFactor[1]);
            this.baseParams.shock.setCurrentValue(equipParams.elemFactor[2]);
            this.baseParams.wave.setCurrentValue(equipParams.elemFactor[3]);
            this._setCurrentModifiers()
        },

        _setCurrentModifiers: function () {
            var equipModifiers = sc.model.player.equipModifiers,
                posY = 11,
                count = 0,
                modifier;
            for (modifier in this.allModifiers)
                if (equipModifiers[modifier] != void 0) {
                    if (count < (this.mode ? 7 : 100)) {
                        this.allModifiers[modifier].doStateTransition("DEFAULT", true);
                        this.allModifiers[modifier].setCurrentValue(equipModifiers[modifier]);
                        this.allModifiers[modifier].setPos(0, posY);
                        posY = posY + 16
                    }
                    count++
                }
            this.updateModText(count)
        },

        modelChanged: function (model, msg, params) {
            if (model == sc.menu) {
                if (msg == sc.MENU_EVENT.ITEM_INFO_CHANGED) this._setParameters(params);
                else if (msg == sc.MENU_EVENT.INFO_TEXT_CHANGED) {
                    if (sc.menu.infoText == "") this._resetChangeValue()
                } else if (msg == sc.MENU_EVENT.EQUIP_CHANGED) this._setCurrentValues();
                else if (msg == sc.MENU_EVENT.SELECTED_BODYPART) this._resetChangeValue();
                else if (msg == sc.MENU_EVENT.ITEM_RESET_INFO) this._resetChangeValue();
                else if (msg == sc.MENU_EVENT.EQUIP_ENSURE_CURRENT_VALUES) this._setCurrentValues()
            }
        }
    })
});
ig.baked = !0;

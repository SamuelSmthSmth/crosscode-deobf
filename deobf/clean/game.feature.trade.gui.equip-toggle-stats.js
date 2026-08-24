ig.module("game.feature.trade.gui.equip-toggle-stats").requires("impact.base.image", "impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.menu-misc", "game.feature.trade.trade-model").defines(function() {
    sc.TradeToggleStats = ig.BoxGui.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    offsetX: -10
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
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
                    y: 280
                },
                changes: {
                    x: 480,
                    y: 280
                }
            }
        }),
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
        modifierPool: {},
        compareText: null,
        compareItem: null,
        compareHelpText: null,
        titleOffset: 8,
        lineOffset: 4,
        level: 0,
        isScalable: false,
        init: function(titleOffset, lineOffset) {
            this.parent(176, 266);
            this.setPos(21, 27);
            this.hook.localAlpha = 0.9;
            this.titleOffset = titleOffset == void 0 ? 8 : titleOffset;
            this.lineOffset = lineOffset == void 0 ? 4 : lineOffset;
            this._createContent();
            this.doStateTransition("HIDDEN", true)
        },
        updateDrawables: function(drawables) {
            this.parent(drawables);
            drawables.addColor("#7E7E7E", 2, 12, this.hook.size.x - 4, 1);
            drawables.addColor("#7E7E7E", 2, 38, this.hook.size.x - 4, 1);
            drawables.addColor("#7E7E7E", 2, 162, this.hook.size.x - 4, 1)
        },
        showMenu: function() {
            sc.Model.removeObserver(sc.trade, this);
            sc.Model.addObserver(sc.trade, this)
        },
        hideMenu: function() {
            sc.Model.removeObserver(sc.trade, this);
            this.doStateTransition("HIDDEN")
        },
        _setEquipID: function(delay) {
            if (sc.trade.equipID < 0) {
                this.hasTransition() && this.hook.currentStateName == "DEFAULT" && (delay = 0);
                this.doStateTransition("HIDDEN", false, false, null, delay ||
                    0)
            } else {
                this._setParameters(sc.trade.equipID);
                this.doStateTransition("DEFAULT")
            }
        },
        _getBodyPartIcon: function(equipType) {
            switch (equipType) {
                case "HEAD":
                    return "item-helm";
                case "ARM":
                    return "item-sword";
                case "TORSO":
                    return "item-belt";
                case "FEET":
                    return "item-shoe"
            }
        },
        _setParameters: function(equipID) {
            this._resetParameters();
            var compareID = null,
                item = sc.inventory.getItem(equipID),
                compareItem = null;
            this.level = 0;
            this.isScalable = false;
            this.compareItem.setPos(this.titleOffset - 2 + this.compareHelpText.hook.size.x, 13);
            var compareText = ig.lang.get("sc.gui.trade.compare") + " ";
            if (sc.trade.compareMode ==
                sc.TRADE_COMPARE_MODE.BASE_STATS) {
                compareID = -1;
                compareText = compareText + ig.lang.get("sc.gui.trade.compareBASE");
                this.compareItem.setText("-----------------");
                this.level = 0
            } else {
                switch (item.equipType) {
                    case sc.ITEMS_EQUIP_TYPES.HEAD:
                        compareID = sc.model.player.equip.head;
                        compareText = compareText + ig.lang.get("sc.gui.trade.compareHEAD");
                        break;
                    case sc.ITEMS_EQUIP_TYPES.ARM:
                        if (sc.trade.compareMode == sc.TRADE_COMPARE_MODE.OFF_HAND) {
                            compareID = sc.model.player.equip.leftArm;
                            compareText = compareText + ig.lang.get("sc.gui.trade.compareARMLeft")
                        } else {
                            compareID = sc.model.player.equip.rightArm;
                            compareText = compareText + ig.lang.get("sc.gui.trade.compareARMRight")
                        }
                        break;
                    case sc.ITEMS_EQUIP_TYPES.TORSO:
                        compareID = sc.model.player.equip.torso;
                        compareText = compareText + ig.lang.get("sc.gui.trade.compareTORSO");
                        break;
                    case sc.ITEMS_EQUIP_TYPES.FEET:
                        compareID = sc.model.player.equip.feet;
                        compareText = compareText + ig.lang.get("sc.gui.trade.compareFEET")
                }
                if (compareID >= 0) {
                    compareItem = sc.inventory.getItem(compareID);
                    if (compareItem.type == sc.ITEMS_TYPES.EQUIP) {
                        this.level = compareItem.level || 1;
                        this.isScalable = compareItem.isScalable || false
                    }
                    var itemText;
                    itemText = "" + ("\\i[" + (compareItem.icon + sc.inventory.getRaritySuffix(compareItem.rarity || 0) || "item-default") + "]");
                    itemText = itemText + ig.LangLabel.getText(compareItem.name);
                    this.compareItem.setText(itemText)
                } else {
                    this.compareItem.setText("\\i[" +
                        this._getBodyPartIcon(item.equipType) + "]-----------------");
                    this.level = 0
                }
            }
            this.compareText.setText(compareText);
            this.level > 0 ? this.compareItem.setDrawCallback(function(drawables, offset) {
                sc.MenuHelper.drawLevel(this.level, drawables, offset, this.ninepatch.gfx, this.isScalable)
            }.bind(this)) : this.compareItem.setDrawCallback(null);
            compareText = item.params;
            itemText = this._calculateDifference(compareID, "hp", compareText.hp || 0);
            this.baseParams.hp.setChangeValue(itemText);
            itemText = this._calculateDifference(compareID, "attack", compareText.attack || 0);
            this.baseParams.atk.setChangeValue(itemText);
            itemText = this._calculateDifference(compareID, "defense",
                compareText.defense || 0);
            this.baseParams.def.setChangeValue(itemText);
            itemText = this._calculateDifference(compareID, "focus", compareText.focus || 0);
            this.baseParams.foc.setChangeValue(itemText);
            itemText = this._calculateDifference(compareID, "elemFactor", compareText.elemFactor ? compareText.elemFactor[0] : 1, 0);
            this.baseParams.fire.setChangeValue(itemText);
            itemText = this._calculateDifference(compareID, "elemFactor", compareText.elemFactor ? compareText.elemFactor[1] : 1, 1);
            this.baseParams.cold.setChangeValue(itemText);
            itemText = this._calculateDifference(compareID, "elemFactor", compareText.elemFactor ? compareText.elemFactor[2] : 1, 2);
            this.baseParams.shock.setChangeValue(itemText);
            itemText = this._calculateDifference(compareID,
                "elemFactor", compareText.elemFactor ? compareText.elemFactor[3] : 1, 3);
            this.baseParams.wave.setChangeValue(itemText);
            if (item = item.properties) {
                var compareProps = compareItem ? compareItem.properties || {} : {},
                    offsetY = 166,
                    key;
                for (key in this.modifierPool)
                    if (item[key] != void 0) {
                        this.modifierPool[key].doStateTransition("DEFAULT", true);
                        if (compareProps[key]) {
                            this.modifierPool[key].setChangeValue(this._calculateDifferenceModifier(compareID, key, item[key]));
                            this.modifierPool[key].setCurrentValue(compareProps[key], true)
                        } else this.modifierPool[key].setChangeValue(Math.round((item[key] || 0) * 100 - 100) / 100);
                        this.modifierPool[key].setPos(this.lineOffset, offsetY);
                        offsetY = offsetY + 16
                    } else if (compareProps[key] != void 0) {
                    this.modifierPool[key].doStateTransition("DEFAULT", true);
                    this.modifierPool[key].setChangeValue(this._calculateDifferenceModifier(compareID, key, 1));
                    this.modifierPool[key].setCurrentValue(compareProps[key], true);
                    this.modifierPool[key].setPos(this.lineOffset, offsetY);
                    offsetY = offsetY + 16
                } else this.modifierPool[key].doStateTransition("HIDDEN", true)
            }
        },
        _setBaseStats: function() {
            var params = null,
                params = sc.trade.compareMode == sc.TRADE_COMPARE_MODE.BASE_STATS ? sc.model.player.baseParams : sc.model.player.equipParams;
            this.baseParams.hp.setCurrentValue(params.hp);
            this.baseParams.atk.setCurrentValue(params.attack);
            this.baseParams.def.setCurrentValue(params.defense);
            this.baseParams.foc.setCurrentValue(params.focus);
            this.baseParams.fire.setCurrentValue(params.elemFactor[0]);
            this.baseParams.cold.setCurrentValue(params.elemFactor[1]);
            this.baseParams.shock.setCurrentValue(params.elemFactor[2]);
            this.baseParams.wave.setCurrentValue(params.elemFactor[3])
        },
        _resetParameters: function() {
            for (var key in this.baseParams) this.baseParams[key].setChangeValue(0);
            this._setBaseStats();
            for (var modifier in this.modifierPool) {
                this.modifierPool[modifier].setChangeValue(0);
                this.modifierPool[modifier].doStateTransition("HIDDEN", true)
            }
        },
        _setCompareParameters: function(equipID) {
            this._resetChangeValue();
            equipID < 0 || sc.inventory.getItem(equipID)
        },
        _calculateDifference: function(compareID, stat, value, elemIndex) {
            if (compareID < 0) {
                elemIndex != void 0 && (value = (Math.round(value * 100) - 100) / 100);
                return value
            }
            if ((compareID = sc.inventory.getItem(compareID)) && compareID.params && compareID.params[stat]) {
                var current = 0;
                if (elemIndex != void 0) {
                    current = compareID.params[stat][elemIndex] || 0;
                    value = (Math.round(value * 100) - Math.floor(current * 100)) / 100
                } else {
                    current = compareID.params[stat] || 0;
                    value = value - current
                }
            } else elemIndex != void 0 && (value = (Math.round(value * 100) - 100) / 100);
            return value
        },
        _calculateDifferenceModifier: function(compareID,
            stat, value, fromProps) {
            if (compareID < 0) return value = (Math.round(value * 100) - 100) / 100;
            if (fromProps) {
                stat = compareID[stat] || 1;
                return value = (Math.round(stat * 100) - Math.round(value * 100)) / 100
            }
            compareID = sc.inventory.getItem(compareID).properties;
            stat = compareID[stat] != void 0 ? compareID[stat] : 1;
            return value = (Math.round(value * 100) - Math.round(stat * 100)) / 100
        },
        _createContent: function() {
            var offsetX = this.lineOffset,
                offsetY = 5;
            this.compareText = new sc.TextGui(ig.lang.get("sc.gui.trade.compare"), {
                font: sc.fontsystem.tinyFont
            });
            this.compareText.setPos(this.titleOffset, offsetY);
            this.addChildGui(this.compareText);
            this.compareHelpText = new sc.TextGui("\\i[help4]");
            this.compareHelpText.setPos(this.titleOffset - 2, offsetY + 8);
            this.addChildGui(this.compareHelpText);
            this.compareItem = new sc.TextGui("");
            this.compareItem.setPos(this.titleOffset - 2 + this.compareHelpText.hook.size.x, offsetY + 8);
            this.addChildGui(this.compareItem);
            var offsetY = offsetY + 26,
                label = new sc.TextGui(ig.lang.get("sc.gui.trade.stats"), {
                    font: sc.fontsystem.tinyFont
                });
            label.setPos(this.titleOffset, offsetY);
            this.addChildGui(label);
            offsetY = 41;
            label = sc.model.player.equipParams;
            this.baseParams.hp = this._createStatusDisplay(offsetX, offsetY, "maxhp", 0, 0, false, 9999, label.hp);
            offsetY = offsetY +
                14;
            this.baseParams.atk = this._createStatusDisplay(offsetX, offsetY, "atk", 0, 1, false, 999, label.attack);
            offsetY = offsetY + 14;
            this.baseParams.def = this._createStatusDisplay(offsetX, offsetY, "def", 0, 2, false, 999, label.defense);
            offsetY = offsetY + 14;
            this.baseParams.foc = this._createStatusDisplay(offsetX, offsetY, "foc", 0, 3, false, 999, label.focus);
            offsetY = offsetY + 16;
            this.baseParams.fire = this._createStatusDisplay(offsetX, offsetY, "res", 1, 4, true, 999, label.elemFactor[0], 0);
            offsetY = offsetY + 14;
            this.baseParams.cold = this._createStatusDisplay(offsetX, offsetY, "res", 2, 5, true, 999, label.elemFactor[1], 1);
            offsetY = offsetY + 14;
            this.baseParams.shock = this._createStatusDisplay(offsetX,
                offsetY, "res", 3, 6, true, 999, label.elemFactor[2], 2);
            offsetY = offsetY + 14;
            this.baseParams.wave = this._createStatusDisplay(offsetX, offsetY, "res", 4, 7, true, 999, label.elemFactor[3], 3);
            offsetY = offsetY + 14;
            label = new sc.TextGui(ig.lang.get("sc.gui.trade.modifier"), {
                font: sc.fontsystem.tinyFont
            });
            label.setPos(this.titleOffset, offsetY);
            this.addChildGui(label);
            for (var key in sc.MODIFIERS) {
                offsetX = sc.MODIFIERS[key];
                offsetX = this._createStatusDisplay(this.lineOffset, 0, "modifier." + key, 5, offsetX.icon, true, sc.MAX_MOD_VAL, 1, void 0, offsetX.noPercent || false, key, offsetX.order);
                offsetX.doStateTransition("HIDDEN", true);
                this.modifierPool[key] =
                    offsetX
            }
        },
        _createStatusDisplay: function(posX, posY, key, color, icon, isPercent, maxVal, value, elemIndex, noPercent, modifierKey, order) {
            isPercent = new sc.SimpleStatusDisplay(ig.lang.get("sc.gui.menu.equip." + key), color, icon, isPercent, maxVal, null, 0, noPercent);
            isPercent.setPos(posX, posY);
            isPercent.setCurrentValue(value, true);
            if (key == "res") {
                color == 1 && (key = "heat");
                color == 2 && (key = "cold");
                color == 3 && (key = "shock");
                color == 4 && (key = "wave")
            }
            modifierKey || (modifierKey = key);
            isPercent.annotation = {
                type: "INFO",
                content: {
                    title: "sc.gui.menu.equip." + key,
                    description: "sc.gui.menu.equip.descriptions." + modifierKey
                },
                offset: {
                    x: -1,
                    y: -1
                },
                index: {
                    x: 0,
                    y: order + 8 || color
                }
            };
            this.addChildGui(isPercent);
            return isPercent
        },
        modelChanged: function(model, msg, data) {
            model == sc.trade && (msg ==
                sc.TRADE_MODEL_EVENT.EQUIP_ID_CHANGED ? this._setEquipID(data ? 0.5 : 0) : msg == sc.TRADE_MODEL_EVENT.COMPARE_MODE_CHANGED && this._setEquipID(0))
        }
    })
});
ig.baked = !0;

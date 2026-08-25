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
        init: function(b, a) {
            this.parent(176, 266);
            this.setPos(21, 27);
            this.hook.localAlpha = 0.9;
            this.titleOffset = b == void 0 ? 8 : b;
            this.lineOffset = a == void 0 ? 4 : a;
            this._createContent();
            this.doStateTransition("HIDDEN", true)
        },
        updateDrawables: function(b) {
            this.parent(b);
            b.addColor("#7E7E7E", 2, 12, this.hook.size.x - 4, 1);
            b.addColor("#7E7E7E", 2, 38, this.hook.size.x - 4, 1);
            b.addColor("#7E7E7E", 2, 162, this.hook.size.x - 4, 1)
        },
        showMenu: function() {
            sc.Model.removeObserver(sc.trade, this);
            sc.Model.addObserver(sc.trade, this)
        },
        hideMenu: function() {
            sc.Model.removeObserver(sc.trade, this);
            this.doStateTransition("HIDDEN")
        },
        _setEquipID: function(b) {
            if (sc.trade.equipID < 0) {
                this.hasTransition() && this.hook.currentStateName == "DEFAULT" && (b = 0);
                this.doStateTransition("HIDDEN", false, false, null, b ||
                    0)
            } else {
                this._setParameters(sc.trade.equipID);
                this.doStateTransition("DEFAULT")
            }
        },
        _getBodyPartIcon: function(b) {
            switch (b) {
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
        _setParameters: function(b) {
            this._resetParameters();
            var a = null,
                d = sc.inventory.getItem(b),
                b = null;
            this.level = 0;
            this.isScalable = false;
            this.compareItem.setPos(this.titleOffset - 2 + this.compareHelpText.hook.size.x, 13);
            var c = ig.lang.get("sc.gui.trade.compare") + " ";
            if (sc.trade.compareMode ==
                sc.TRADE_COMPARE_MODE.BASE_STATS) {
                a = -1;
                c = c + ig.lang.get("sc.gui.trade.compareBASE");
                this.compareItem.setText("-----------------");
                this.level = 0
            } else {
                switch (d.equipType) {
                    case sc.ITEMS_EQUIP_TYPES.HEAD:
                        a = sc.model.player.equip.head;
                        c = c + ig.lang.get("sc.gui.trade.compareHEAD");
                        break;
                    case sc.ITEMS_EQUIP_TYPES.ARM:
                        if (sc.trade.compareMode == sc.TRADE_COMPARE_MODE.OFF_HAND) {
                            a = sc.model.player.equip.leftArm;
                            c = c + ig.lang.get("sc.gui.trade.compareARMLeft")
                        } else {
                            a = sc.model.player.equip.rightArm;
                            c = c + ig.lang.get("sc.gui.trade.compareARMRight")
                        }
                        break;
                    case sc.ITEMS_EQUIP_TYPES.TORSO:
                        a = sc.model.player.equip.torso;
                        c = c + ig.lang.get("sc.gui.trade.compareTORSO");
                        break;
                    case sc.ITEMS_EQUIP_TYPES.FEET:
                        a = sc.model.player.equip.feet;
                        c = c + ig.lang.get("sc.gui.trade.compareFEET")
                }
                if (a >= 0) {
                    b = sc.inventory.getItem(a);
                    if (b.type == sc.ITEMS_TYPES.EQUIP) {
                        this.level = b.level || 1;
                        this.isScalable = b.isScalable || false
                    }
                    var e;
                    e = "" + ("\\i[" + (b.icon + sc.inventory.getRaritySuffix(b.rarity || 0) || "item-default") + "]");
                    e = e + ig.LangLabel.getText(b.name);
                    this.compareItem.setText(e)
                } else {
                    this.compareItem.setText("\\i[" +
                        this._getBodyPartIcon(d.equipType) + "]-----------------");
                    this.level = 0
                }
            }
            this.compareText.setText(c);
            this.level > 0 ? this.compareItem.setDrawCallback(function(a, b) {
                sc.MenuHelper.drawLevel(this.level, a, b, this.ninepatch.gfx, this.isScalable)
            }.bind(this)) : this.compareItem.setDrawCallback(null);
            c = d.params;
            e = this._calculateDifference(a, "hp", c.hp || 0);
            this.baseParams.hp.setChangeValue(e);
            e = this._calculateDifference(a, "attack", c.attack || 0);
            this.baseParams.atk.setChangeValue(e);
            e = this._calculateDifference(a, "defense",
                c.defense || 0);
            this.baseParams.def.setChangeValue(e);
            e = this._calculateDifference(a, "focus", c.focus || 0);
            this.baseParams.foc.setChangeValue(e);
            e = this._calculateDifference(a, "elemFactor", c.elemFactor ? c.elemFactor[0] : 1, 0);
            this.baseParams.fire.setChangeValue(e);
            e = this._calculateDifference(a, "elemFactor", c.elemFactor ? c.elemFactor[1] : 1, 1);
            this.baseParams.cold.setChangeValue(e);
            e = this._calculateDifference(a, "elemFactor", c.elemFactor ? c.elemFactor[2] : 1, 2);
            this.baseParams.shock.setChangeValue(e);
            e = this._calculateDifference(a,
                "elemFactor", c.elemFactor ? c.elemFactor[3] : 1, 3);
            this.baseParams.wave.setChangeValue(e);
            if (d = d.properties) {
                var b = b ? b.properties || {} : {},
                    c = 166,
                    f;
                for (f in this.modifierPool)
                    if (d[f] != void 0) {
                        this.modifierPool[f].doStateTransition("DEFAULT", true);
                        if (b[f]) {
                            this.modifierPool[f].setChangeValue(this._calculateDifferenceModifier(a, f, d[f]));
                            this.modifierPool[f].setCurrentValue(b[f], true)
                        } else this.modifierPool[f].setChangeValue(Math.round((d[f] || 0) * 100 - 100) / 100);
                        this.modifierPool[f].setPos(this.lineOffset, c);
                        c = c + 16
                    } else if (b[f] != void 0) {
                    this.modifierPool[f].doStateTransition("DEFAULT", true);
                    this.modifierPool[f].setChangeValue(this._calculateDifferenceModifier(a, f, 1));
                    this.modifierPool[f].setCurrentValue(b[f], true);
                    this.modifierPool[f].setPos(this.lineOffset, c);
                    c = c + 16
                } else this.modifierPool[f].doStateTransition("HIDDEN", true)
            }
        },
        _setBaseStats: function() {
            var b = null,
                b = sc.trade.compareMode == sc.TRADE_COMPARE_MODE.BASE_STATS ? sc.model.player.baseParams : sc.model.player.equipParams;
            this.baseParams.hp.setCurrentValue(b.hp);
            this.baseParams.atk.setCurrentValue(b.attack);
            this.baseParams.def.setCurrentValue(b.defense);
            this.baseParams.foc.setCurrentValue(b.focus);
            this.baseParams.fire.setCurrentValue(b.elemFactor[0]);
            this.baseParams.cold.setCurrentValue(b.elemFactor[1]);
            this.baseParams.shock.setCurrentValue(b.elemFactor[2]);
            this.baseParams.wave.setCurrentValue(b.elemFactor[3])
        },
        _resetParameters: function() {
            for (var b in this.baseParams) this.baseParams[b].setChangeValue(0);
            this._setBaseStats();
            for (var a in this.modifierPool) {
                this.modifierPool[a].setChangeValue(0);
                this.modifierPool[a].doStateTransition("HIDDEN", true)
            }
        },
        _setCompareParameters: function(b) {
            this._resetChangeValue();
            b < 0 || sc.inventory.getItem(b)
        },
        _calculateDifference: function(b, a, d, c) {
            if (b < 0) {
                c != void 0 && (d = (Math.round(d * 100) - 100) / 100);
                return d
            }
            if ((b = sc.inventory.getItem(b)) && b.params && b.params[a]) {
                var e = 0;
                if (c != void 0) {
                    e = b.params[a][c] || 0;
                    d = (Math.round(d * 100) - Math.floor(e * 100)) / 100
                } else {
                    e = b.params[a] || 0;
                    d = d - e
                }
            } else c != void 0 && (d = (Math.round(d * 100) - 100) / 100);
            return d
        },
        _calculateDifferenceModifier: function(b,
            a, d, c) {
            if (b < 0) return d = (Math.round(d * 100) - 100) / 100;
            if (c) {
                a = b[a] || 1;
                return d = (Math.round(a * 100) - Math.round(d * 100)) / 100
            }
            b = sc.inventory.getItem(b).properties;
            a = b[a] != void 0 ? b[a] : 1;
            return d = (Math.round(d * 100) - Math.round(a * 100)) / 100
        },
        _createContent: function() {
            var b = this.lineOffset,
                a = 5;
            this.compareText = new sc.TextGui(ig.lang.get("sc.gui.trade.compare"), {
                font: sc.fontsystem.tinyFont
            });
            this.compareText.setPos(this.titleOffset, a);
            this.addChildGui(this.compareText);
            this.compareHelpText = new sc.TextGui("\\i[help4]");
            this.compareHelpText.setPos(this.titleOffset - 2, a + 8);
            this.addChildGui(this.compareHelpText);
            this.compareItem = new sc.TextGui("");
            this.compareItem.setPos(this.titleOffset - 2 + this.compareHelpText.hook.size.x, a + 8);
            this.addChildGui(this.compareItem);
            var a = a + 26,
                d = new sc.TextGui(ig.lang.get("sc.gui.trade.stats"), {
                    font: sc.fontsystem.tinyFont
                });
            d.setPos(this.titleOffset, a);
            this.addChildGui(d);
            a = 41;
            d = sc.model.player.equipParams;
            this.baseParams.hp = this._createStatusDisplay(b, a, "maxhp", 0, 0, false, 9999, d.hp);
            a = a +
                14;
            this.baseParams.atk = this._createStatusDisplay(b, a, "atk", 0, 1, false, 999, d.attack);
            a = a + 14;
            this.baseParams.def = this._createStatusDisplay(b, a, "def", 0, 2, false, 999, d.defense);
            a = a + 14;
            this.baseParams.foc = this._createStatusDisplay(b, a, "foc", 0, 3, false, 999, d.focus);
            a = a + 16;
            this.baseParams.fire = this._createStatusDisplay(b, a, "res", 1, 4, true, 999, d.elemFactor[0], 0);
            a = a + 14;
            this.baseParams.cold = this._createStatusDisplay(b, a, "res", 2, 5, true, 999, d.elemFactor[1], 1);
            a = a + 14;
            this.baseParams.shock = this._createStatusDisplay(b,
                a, "res", 3, 6, true, 999, d.elemFactor[2], 2);
            a = a + 14;
            this.baseParams.wave = this._createStatusDisplay(b, a, "res", 4, 7, true, 999, d.elemFactor[3], 3);
            a = a + 14;
            d = new sc.TextGui(ig.lang.get("sc.gui.trade.modifier"), {
                font: sc.fontsystem.tinyFont
            });
            d.setPos(this.titleOffset, a);
            this.addChildGui(d);
            for (var c in sc.MODIFIERS) {
                b = sc.MODIFIERS[c];
                b = this._createStatusDisplay(this.lineOffset, 0, "modifier." + c, 5, b.icon, true, sc.MAX_MOD_VAL, 1, void 0, b.noPercent || false, c, b.order);
                b.doStateTransition("HIDDEN", true);
                this.modifierPool[c] =
                    b
            }
        },
        _createStatusDisplay: function(b, a, d, c, e, f, g, h, i, j, k, l) {
            f = new sc.SimpleStatusDisplay(ig.lang.get("sc.gui.menu.equip." + d), c, e, f, g, null, 0, j);
            f.setPos(b, a);
            f.setCurrentValue(h, true);
            if (d == "res") {
                c == 1 && (d = "heat");
                c == 2 && (d = "cold");
                c == 3 && (d = "shock");
                c == 4 && (d = "wave")
            }
            k || (k = d);
            f.annotation = {
                type: "INFO",
                content: {
                    title: "sc.gui.menu.equip." + d,
                    description: "sc.gui.menu.equip.descriptions." + k
                },
                offset: {
                    x: -1,
                    y: -1
                },
                index: {
                    x: 0,
                    y: l + 8 || e
                }
            };
            this.addChildGui(f);
            return f
        },
        modelChanged: function(b, a, d) {
            b == sc.trade && (a ==
                sc.TRADE_MODEL_EVENT.EQUIP_ID_CHANGED ? this._setEquipID(d ? 0.5 : 0) : a == sc.TRADE_MODEL_EVENT.COMPARE_MODE_CHANGED && this._setEquipID(0))
        }
    })
});
ig.baked = !0;

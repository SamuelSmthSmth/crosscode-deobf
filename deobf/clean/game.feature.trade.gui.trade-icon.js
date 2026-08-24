ig.module("game.feature.trade.gui.trade-icon").requires("impact.feature.gui.gui", "impact.feature.gui.base.box", "impact.feature.gui.base.basic-gui", "game.feature.interact.map-interact").defines(function() {
    sc.TradeIconGui = ig.BoxGui.extend({
        transitions: {
            DEFAULT: {
                state: {
                    alpha: 1,
                    offsetY: 8
                },
                time: 0.1,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            HIDDEN: {
                state: {
                    scaleX: 0.4,
                    scaleY: 0.5,
                    alpha: 0,
                    offsetY: 8
                },
                time: 0.1,
                timeFunction: KEY_SPLINES.EASE_OUT
            }
        },
        ninepatch: new ig.NinePatch("media/gui/message.png", {
            width: 4,
            height: 4,
            left: 6,
            top: 6,
            right: 6,
            bottom: 6,
            offsets: {
                "default": {
                    x: 0,
                    y: 112
                }
            }
        }),
        numberGfx: new ig.Image("media/gui/menu.png"),
        tradeInfo: null,
        tradeIcon: null,
        lineGui: null,
        entries: [],
        init: function(trader) {
            this.parent(138, 40);
            this.hook.localAlpha = 0.6;
            this.hook.pos.y = 7;
            this.tradeInfo = sc.trade.getTrader(trader);
            this._createContent();
            this.doStateTransition("HIDDEN", true)
        },
        setIconState: function(state) {
            if (state == sc.INTERACT_ENTRY_STATE.FOCUS) {
                this._updateTexts();
                this.doStateTransition("DEFAULT")
            } else this.doStateTransition("HIDDEN")
        },
        isActive: function(state) {
            return state ==
                sc.INTERACT_ENTRY_STATE.FOCUS
        },
        _createContent: function() {
            this._createStatic();
            for (var offsetY = 14, maxWidth = -1, options = this.tradeInfo.options, nameGui = null, require = null, itemName = null, item = null, inventory = sc.inventory, i = 0; i < options.length; i++)
                for (var gets = options[i].get, j = 0; j < gets.length; j++) {
                    var item = inventory.getItem(gets[j].id),
                        itemName = "\\i[" + (item.icon + sc.inventory.getRaritySuffix(item.rarity || 0) || "item-default") + "]" + ig.LangLabel.getText(item.name),
                        level = 0;
                    item.type == sc.ITEMS_TYPES.EQUIP && (level = item.level || 1);
                    nameGui = new sc.TextGui(itemName);
                    nameGui.tradeName = itemName;
                    nameGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
                    nameGui.setPos(0,
                        offsetY);
                    nameGui.level = level;
                    nameGui.isScalable = item.isScalable;
                    nameGui.numberGfx = this.numberGfx;
                    level > 0 && nameGui.setDrawCallback(function(drawables, offset) {
                        sc.MenuHelper.drawLevel(this.level, drawables, offset, this.numberGfx, this.isScalable)
                    }.bind(nameGui));
                    this.addChildGui(nameGui);
                    this.entries.push({
                        gui: nameGui,
                        require: options[i].require
                    });
                    offsetY = offsetY + (nameGui.hook.size.y - 2);
                    if (maxWidth < nameGui.hook.size.x) maxWidth = nameGui.hook.size.x
                }
            this.setSize(Math.min(maxWidth + 21, 138), offsetY + 6);
            this.setPivot(this.hook.size.x / 2, this.hook.size.y)
        },
        _createStatic: function() {
            var label = new sc.TextGui(ig.lang.get("sc.gui.trade.tradeOffer"), {
                font: sc.fontsystem.tinyFont
            });
            label.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            label.setPos(0, 4);
            this.addChildGui(label);
            this.lineGui = new ig.ColorGui("#ccc", label.hook.size.x + 10, 1);
            this.lineGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.lineGui.setPos(0, 12);
            this.addChildGui(this.lineGui)
        },
        _updateTexts: function() {
            for (var i = this.entries.length; i--;) {
                var entry = this.entries[i].gui;
                this._hasMissingItem(this.entries[i].require) ? entry.setText("\\c[4]" + entry.tradeName + "\\c[0]") : entry.setText(entry.tradeName)
            }
        },
        _hasMissingItem: function(require) {
            for (var i =
                    require.length; i--;)
                if (sc.model.player.getItemAmountWithEquip(require[i].id) < require[i].amount) return true
        },
        remove: function() {
            this.doStateTransition("HIDDEN", false, true)
        }
    })
});
ig.baked = !0;

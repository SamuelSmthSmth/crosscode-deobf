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
        init: function(b) {
            this.parent(138, 40);
            this.hook.localAlpha = 0.6;
            this.hook.pos.y = 7;
            this.tradeInfo = sc.trade.getTrader(b);
            this._createContent();
            this.doStateTransition("HIDDEN", true)
        },
        setIconState: function(b) {
            if (b == sc.INTERACT_ENTRY_STATE.FOCUS) {
                this._updateTexts();
                this.doStateTransition("DEFAULT")
            } else this.doStateTransition("HIDDEN")
        },
        isActive: function(b) {
            return b ==
                sc.INTERACT_ENTRY_STATE.FOCUS
        },
        _createContent: function() {
            this._createStatic();
            for (var b = 14, a = -1, d = this.tradeInfo.options, c = null, e = null, f = null, g = null, h = sc.inventory, i = 0; i < d.length; i++)
                for (var e = d[i].get, j = 0; j < e.length; j++) {
                    var g = h.getItem(e[j].id),
                        f = "\\i[" + (g.icon + sc.inventory.getRaritySuffix(g.rarity || 0) || "item-default") + "]" + ig.LangLabel.getText(g.name),
                        k = 0;
                    g.type == sc.ITEMS_TYPES.EQUIP && (k = g.level || 1);
                    c = new sc.TextGui(f);
                    c.tradeName = f;
                    c.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
                    c.setPos(0,
                        b);
                    c.level = k;
                    c.isScalable = g.isScalable;
                    c.numberGfx = this.numberGfx;
                    k > 0 && c.setDrawCallback(function(a, b) {
                        sc.MenuHelper.drawLevel(this.level, a, b, this.numberGfx, this.isScalable)
                    }.bind(c));
                    this.addChildGui(c);
                    this.entries.push({
                        gui: c,
                        require: d[i].require
                    });
                    b = b + (c.hook.size.y - 2);
                    if (a < c.hook.size.x) a = c.hook.size.x
                }
            this.setSize(Math.min(a + 21, 138), b + 6);
            this.setPivot(this.hook.size.x / 2, this.hook.size.y)
        },
        _createStatic: function() {
            var b = new sc.TextGui(ig.lang.get("sc.gui.trade.tradeOffer"), {
                font: sc.fontsystem.tinyFont
            });
            b.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            b.setPos(0, 4);
            this.addChildGui(b);
            this.lineGui = new ig.ColorGui("#ccc", b.hook.size.x + 10, 1);
            this.lineGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.lineGui.setPos(0, 12);
            this.addChildGui(this.lineGui)
        },
        _updateTexts: function() {
            for (var b = this.entries.length; b--;) {
                var a = this.entries[b].gui;
                this._hasMissingItem(this.entries[b].require) ? a.setText("\\c[4]" + a.tradeName + "\\c[0]") : a.setText(a.tradeName)
            }
        },
        _hasMissingItem: function(b) {
            for (var a =
                    b.length; a--;)
                if (sc.model.player.getItemAmountWithEquip(b[a].id) < b[a].amount) return true
        },
        remove: function() {
            this.doStateTransition("HIDDEN", false, true)
        }
    })
});
ig.baked = !0;

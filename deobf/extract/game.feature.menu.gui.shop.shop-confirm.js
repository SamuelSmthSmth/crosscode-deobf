ig.module("game.feature.menu.gui.shop.shop-confirm").requires("impact.base.image", "impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.gui.base.box", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.menu-misc", "game.feature.gui.widget.modal-dialog", "game.feature.menu.gui.shop.shop-misc").defines(function() {
    sc.ShopConfirmDialog = sc.ModalButtonInteract.extend({
        confirmCallback: null,
        cancelCallback: null,
        list: null,
        listContent: null,
        notifyRaritySell: false,
        keepOpen: true,
        init: function(b,
            a) {
            this.parent(ig.lang.get("sc.gui.shop.confirmBuy"), null, [ig.lang.get("sc.gui.shop.buy"), ig.lang.get("sc.gui.shop.cancel")], this.onDialogCallback.bind(this));
            this.msgBox.centerBox.hook.localAlpha = 1;
            this.textGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.confirmCallback = b || null;
            this.cancelCallback = a || null;
            var d = this.content.hook.size.y,
                c = this.textGui.hook.size.y + 1;
            this.listContent = new ig.GuiElementBase;
            this.list = new sc.ScrollPane(sc.ScrollType.Y_ONLY);
            this.list.setContent(this.listContent);
            this.list.setSize(250, 121);
            this.list.setPos(0, c);
            this.content.addChildGui(this.list);
            this.content.setSize(250, 121 + d);
            this.msgBox.setPos(0, -12);
            this.msgBox.resize();
            this.buttons[0].submitSound = sc.BUTTON_SOUND.shop_cash
        },
        update: function() {
            this.parent();
            this.buttonInteract.isActive() && this.buttongroup.isActive() && (sc.control.menuScrollUp() ? this.list.scrollY(-17) : sc.control.menuScrollDown() && this.list.scrollY(17))
        },
        show: function() {
            if (sc.menu.shopSellMode) {
                this.textGui.setText(ig.lang.get("sc.gui.shop.confirmSell"));
                this.buttons[0].setText(ig.lang.get("sc.gui.shop.sell"), true)
            } else {
                this.textGui.setText(ig.lang.get("sc.gui.shop.confirmBuy"));
                this.buttons[0].setText(ig.lang.get("sc.gui.shop.buy"), true)
            }
            this.createList();
            this.parent()
        },
        createList: function() {
            this.listContent.removeAllChildren();
            this.list.box.doScrollTransition(0, 0, 0);
            this.list.recalculateScrollBars();
            var b = sc.menu.shopCart;
            sc.ShopHelper.sortList(b, sc.SORT_TYPE.ORDER);
            var a = sc.inventory,
                d = null,
                c = d = null,
                e = 0;
            this.notifyRaritySell = false;
            for (var f = 0; f <
                b.length; f++) {
                d = a.getItem(b[f].id);
                c = "\\i[" + (d.icon + sc.inventory.getRaritySuffix(d.rarity || 0) || "item-default") + "]" + ig.LangLabel.getText(d.name);
                if (d.rarity >= sc.ITEMS_RARITY.LEGENDARY && sc.menu.shopSellMode) this.notifyRaritySell = true;
                d = new sc.ShopConfirmEntry(c, b[f].amount, b[f].price);
                d.setPos(0, e);
                e = e + d.hook.size.y;
                this.listContent.addChildGui(d)
            }
            this.buttons[0].submitSound = this.notifyRaritySell ? null : sc.BUTTON_SOUND.shop_cash;
            this.listContent.hook.size.y = e;
            this.list.recalculateScrollBars(true)
        },
        onDialogCallback: function(b) {
            if (b.data ==
                0)
                if (this.notifyRaritySell) {
                    sc.BUTTON_SOUND.submit.play();
                    sc.Dialogs.showYesNoDialog(ig.lang.get("sc.gui.dialogs.sellRare"), sc.DIALOG_INFO_ICON.WARNING, function(a) {
                        this.hide();
                        if (a.data == 0) {
                            sc.BUTTON_SOUND.shop_cash.play();
                            this.confirmCallback && this.confirmCallback()
                        } else {
                            sc.BUTTON_SOUND.submit.play();
                            this.cancelCallback && this.cancelCallback()
                        }
                    }.bind(this), true)
                } else {
                    this.hide();
                    this.confirmCallback && this.confirmCallback()
                }
            else {
                this.hide();
                this.cancelCallback && this.cancelCallback()
            }
        }
    });
    sc.ShopConfirmEntry =
        ig.GuiElementBase.extend({
            gfx: new ig.Image("media/gui/menu.png"),
            item: null,
            amount: null,
            price: null,
            init: function(b, a, d) {
                this.parent();
                this.setSize(246, 17);
                this.item = new sc.TextGui(b);
                this.item.setPos(0, 0);
                this.addChildGui(this.item);
                this.amount = new sc.NumberGui(99, {
                    size: sc.NUMBER_SIZE.TEXT
                });
                this.amount.setPos(145, 4);
                this.amount.setNumber(a, true);
                this.addChildGui(this.amount);
                this.price = new sc.NumberGui(9999999, {
                    size: sc.NUMBER_SIZE.TEXT
                });
                this.price.setPos(174, 4);
                this.price.setNumber(d * a, true);
                this.addChildGui(this.price)
            },
            updateDrawables: function(b) {
                this.parent(b);
                b.addGfx(this.gfx, 132, 6, 560, 416, 8, 8);
                b.addGfx(this.gfx, 164, 7, 568, 416, 8, 8);
                sc.menu.shopCoinMode ? b.addGfx(this.gfx, 232, 4, 500, 224, 12, 12) : b.addGfx(this.gfx, 232, 4, 488, 32, 12, 10)
            }
        })
});
ig.baked = !0;

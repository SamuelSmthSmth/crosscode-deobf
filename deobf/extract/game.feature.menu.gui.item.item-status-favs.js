ig.module("game.feature.menu.gui.item.item-status-favs").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.menu-misc", "game.feature.player.player-model").defines(function() {
    sc.FavoriteElementGui = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        text: null,
        id: -1,
        init: function() {
            this.parent();
            this.setSize(19, 19);
            this.text = new sc.TextGui("");
            this.text.setPos(2, 1);
            this.addChildGui(this.text)
        },
        setItem: function(b) {
            this.id = b || -1;
            if (this.id >= 0) {
                b = sc.inventory.getItem(this.id);
                this.text.setText("\\i[" + b.icon + sc.inventory.getRaritySuffix(b.rarity) + "]")
            } else this.text.setText("")
        },
        updateDrawables: function(b) {
            this.id >= 0 ? b.addGfx(this.gfx, 0, 0, 213, 480, 19, 19) : b.addGfx(this.gfx, 0, 0, 192, 480, 19, 19)
        }
    });
    sc.ItemStatusFavorites = sc.HeaderMenuPanel.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        line: new ig.Image("media/gui/basic.png"),
        maxFavs: null,
        currentFavs: null,
        _favs: [],
        init: function() {
            this.parent(ig.lang.get("sc.gui.menu.item.favs"), sc.MenuPanelType.TOP_RIGHT_EDGE);
            this.setSize(126,
                63);
            this.setPos(sc.options.hdMode ? 25 : 2, 214);
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
            var b = sc.model.player,
                a = {
                    size: sc.NUMBER_SIZE.TINY,
                    color: sc.GUI_NUMBER_COLOR.GREY
                };
            this.maxFavs = new sc.NumberGui(12, a);
            this.maxFavs.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.maxFavs.setPos(6, 2);
            this.maxFavs.setNumber(sc.ITEM_MAX_FAVS);
            this.addChildGui(this.maxFavs);
            this.currentFavs = new sc.NumberGui(12, a);
            this.currentFavs.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.currentFavs.setPos(24, 2);
            this.currentFavs.setNumber(b.itemFavs.length);
            this.addChildGui(this.currentFavs);
            b = new ig.ImageGui(this.line, 208, 18, 5, 5);
            b.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            b.setPos(18, 2);
            this.addChildGui(b);
            for (var a = 4, d = 15, c = 0; c < sc.ITEM_MAX_FAVS; c++) {
                b = new sc.FavoriteElementGui;
                b.setPos(a, d);
                a = a + 20;
                if ((c + 1) % 6 == 0) {
                    a = 5;
                    d = d + 23
                }
                this._favs.push(b);
                this.addChildGui(b);
                var e = c % 6,
                    f = Math.floor(c / 6) + 4;
                b.annotation = {
                    size: {
                        x: 12,
                        y: 12
                    },
                    offset: {
                        x: 3,
                        y: 4
                    },
                    content: {
                        id: c,
                        title: function(a) {
                            a = sc.model.player.itemFavs[a.id];
                            return a >= -1 ? sc.inventory.getItemName(a) : ig.lang.get("sc.gui.menu.help.item.titles.favs")
                        }.bind(this),
                        description: function(a) {
                            a = sc.model.player.itemFavs[a.id];
                            return a >= -1 ? sc.inventory.getItemDescription(a) : ig.lang.get("sc.gui.menu.help.item.description.favs")
                        }.bind(this)
                    },
                    index: {
                        x: e,
                        y: f
                    }
                }
            }
            this.doStateTransition("HIDDEN", true)
        },
        addObservers: function() {
            sc.Model.addObserver(sc.menu,
                this);
            sc.Model.addObserver(sc.model.player, this)
        },
        removeObservers: function() {
            sc.Model.removeObserver(sc.menu, this);
            sc.Model.removeObserver(sc.model.player, this)
        },
        showMenu: function() {
            if (sc.menu.getCurrentTabType() == sc.ITEMS_TYPES.CONS) {
                this.updateFavorites();
                this.doStateTransition("DEFAULT")
            }
        },
        exitMenu: function() {
            this.doStateTransition("HIDDEN")
        },
        updateFavorites: function() {
            var b = sc.model.player.itemFavs;
            this.currentFavs.setNumber(b.length, true);
            for (var a = 0; a < this._favs.length; a++) this._favs[a].setItem(b[a])
        },
        modelChanged: function(b, a) {
            b == sc.menu ? a == sc.MENU_EVENT.ITEM_CHANGED_TAB && (sc.menu.getCurrentTabType() == sc.ITEMS_TYPES.CONS ? this.doStateTransition("DEFAULT") : this.doStateTransition("HIDDEN")) : b == sc.model.player && a == sc.PLAYER_MSG.ITEM_FAVORITES_CHANGED && this.updateFavorites()
        }
    })
});
ig.baked = !0;

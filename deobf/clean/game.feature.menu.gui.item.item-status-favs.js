/**
 * game.feature.menu.gui.item.item-status-favs
 * ===========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.item.item-status-favs")`.
 *
 * `sc.ItemStatusFavorites`: the favorites panel of the item menu — a grid of
 * `sc.FavoriteElementGui` slots that show the icons of the player's favorite
 * consumables, plus the used/max counter. `sc.FavoriteElementGui` renders a
 * single favorite slot (empty or with the item icon).
 */
ig.module("game.feature.menu.gui.item.item-status-favs")
    .requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.menu-misc", "game.feature.player.player-model")
    .defines(function () {

    sc.FavoriteElementGui = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        text: null,
        id: -1,

        init: function () {
            this.parent();
            this.setSize(19, 19);
            this.text = new sc.TextGui("");
            this.text.setPos(2, 1);
            this.addChildGui(this.text)
        },

        setItem: function (itemID) {
            this.id = itemID || -1;
            if (this.id >= 0) {
                var item = sc.inventory.getItem(this.id);
                this.text.setText("\\i[" + item.icon + sc.inventory.getRaritySuffix(item.rarity) + "]")
            } else {
                this.text.setText("")
            }
        },

        updateDrawables: function (drawables) {
            this.id >= 0 ? drawables.addGfx(this.gfx, 0, 0, 213, 480, 19, 19) : drawables.addGfx(this.gfx, 0, 0, 192, 480, 19, 19)
        }
    });

    sc.ItemStatusFavorites = sc.HeaderMenuPanel.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        line: new ig.Image("media/gui/basic.png"),
        maxFavs: null,
        currentFavs: null,
        _favs: [],

        init: function () {
            this.parent(ig.lang.get("sc.gui.menu.item.favs"), sc.MenuPanelType.TOP_RIGHT_EDGE);
            this.setSize(126, 63);
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
            var player = sc.model.player,
                numberOptions = {
                    size: sc.NUMBER_SIZE.TINY,
                    color: sc.GUI_NUMBER_COLOR.GREY
                };
            this.maxFavs = new sc.NumberGui(12, numberOptions);
            this.maxFavs.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.maxFavs.setPos(6, 2);
            this.maxFavs.setNumber(sc.ITEM_MAX_FAVS);
            this.addChildGui(this.maxFavs);
            this.currentFavs = new sc.NumberGui(12, numberOptions);
            this.currentFavs.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.currentFavs.setPos(24, 2);
            this.currentFavs.setNumber(player.itemFavs.length);
            this.addChildGui(this.currentFavs);
            player = new ig.ImageGui(this.line, 208, 18, 5, 5);
            player.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            player.setPos(18, 2);
            this.addChildGui(player);
            for (var posX = 4, posY = 15, index = 0; index < sc.ITEM_MAX_FAVS; index++) {
                player = new sc.FavoriteElementGui;
                player.setPos(posX, posY);
                posX = posX + 20;
                if ((index + 1) % 6 == 0) {
                    posX = 5;
                    posY = posY + 23
                }
                this._favs.push(player);
                this.addChildGui(player);
                var gridX = index % 6,
                    gridY = Math.floor(index / 6) + 4;
                player.annotation = {
                    size: {
                        x: 12,
                        y: 12
                    },
                    offset: {
                        x: 3,
                        y: 4
                    },
                    content: {
                        id: index,
                        title: function (annotation) {
                            annotation = sc.model.player.itemFavs[annotation.id];
                            return annotation >= -1 ? sc.inventory.getItemName(annotation) : ig.lang.get("sc.gui.menu.help.item.titles.favs")
                        }.bind(this),
                        description: function (annotation) {
                            annotation = sc.model.player.itemFavs[annotation.id];
                            return annotation >= -1 ? sc.inventory.getItemDescription(annotation) : ig.lang.get("sc.gui.menu.help.item.description.favs")
                        }.bind(this)
                    },
                    index: {
                        x: gridX,
                        y: gridY
                    }
                }
            }
            this.doStateTransition("HIDDEN", true)
        },

        addObservers: function () {
            sc.Model.addObserver(sc.menu, this);
            sc.Model.addObserver(sc.model.player, this)
        },

        removeObservers: function () {
            sc.Model.removeObserver(sc.menu, this);
            sc.Model.removeObserver(sc.model.player, this)
        },

        showMenu: function () {
            if (sc.menu.getCurrentTabType() == sc.ITEMS_TYPES.CONS) {
                this.updateFavorites();
                this.doStateTransition("DEFAULT")
            }
        },

        exitMenu: function () {
            this.doStateTransition("HIDDEN")
        },

        updateFavorites: function () {
            var favs = sc.model.player.itemFavs;
            this.currentFavs.setNumber(favs.length, true);
            for (var index = 0; index < this._favs.length; index++) {
                this._favs[index].setItem(favs[index])
            }
        },

        modelChanged: function (model, event) {
            model == sc.menu ? event == sc.MENU_EVENT.ITEM_CHANGED_TAB && (sc.menu.getCurrentTabType() == sc.ITEMS_TYPES.CONS ? this.doStateTransition("DEFAULT") : this.doStateTransition("HIDDEN")) : model == sc.model.player && event == sc.PLAYER_MSG.ITEM_FAVORITES_CHANGED && this.updateFavorites()
        }
    })
});
ig.baked = !0;

/**
 * game.feature.menu.gui.item.item-status-buffs
 * ============================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.item.item-status-buffs")`.
 *
 * `sc.ItemStatusBuffs`: the consumable buffs panel of the item menu — shows
 * the current/max buff count and one `sc.ItemStatusDefaultBar` per active
 * consumable buff. `sc.ItemBuffHelp` is the small "how buffs work" hint next
 * to the list, shown when the buff-help option is enabled.
 */
ig.module("game.feature.menu.gui.item.item-status-buffs")
    .requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.item.item-status-default")
    .defines(function () {

    sc.ItemStatusBuffs = sc.HeaderMenuPanel.extend({
        gfx: new ig.Image("media/gui/basic.png"),
        maxBuffs: null,
        currentBuffs: null,
        _removeStartIndex: 3,

        init: function () {
            this.parent(ig.lang.get("sc.gui.menu.item.buff"), sc.MenuPanelType.TOP_RIGHT_EDGE);
            this.setSize(126, 83);
            this.setPos(sc.options.hdMode ? 25 : 2, 127);
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
            var params = sc.model.player.params,
                numberOptions = {
                    size: sc.NUMBER_SIZE.TINY,
                    color: sc.GUI_NUMBER_COLOR.GREY
                };
            this.maxBuffs = new sc.NumberGui(4, numberOptions);
            this.maxBuffs.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.maxBuffs.setPos(6, 2);
            this.maxBuffs.setNumber(params.getMaxBuffs());
            this.addChildGui(this.maxBuffs);
            this.currentBuffs = new sc.NumberGui(4, numberOptions);
            this.currentBuffs.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.currentBuffs.setPos(20, 2);
            this.currentBuffs.setNumber(params.currentItemBuffs);
            this.addChildGui(this.currentBuffs);
            params = new ig.ImageGui(this.gfx, 208, 18, 5, 5);
            params.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            params.setPos(14, 2);
            this.addChildGui(params);
            this.doStateTransition("HIDDEN", true)
        },

        addObservers: function () {
            sc.Model.addObserver(sc.menu, this);
            sc.Model.addObserver(sc.model.player.params, this)
        },

        removeObservers: function () {
            sc.Model.removeObserver(sc.menu, this);
            sc.Model.removeObserver(sc.model.player.params, this)
        },

        showMenu: function () {
            this._createBuffs();
            this.maxBuffs.setNumber(sc.model.player.params.getMaxBuffs());
            sc.menu.getCurrentTabType() == sc.ITEMS_TYPES.CONS && this.doStateTransition("DEFAULT")
        },

        exitMenu: function () {
            this.doStateTransition("HIDDEN")
        },

        modelChanged: function (model, event) {
            if (model == sc.menu) {
                event == sc.MENU_EVENT.ITEM_CHANGED_TAB && (sc.menu.getCurrentTabType() == sc.ITEMS_TYPES.CONS ? this.doStateTransition("DEFAULT") : this.doStateTransition("HIDDEN"))
            } else if (model == sc.model.player.params && event == sc.COMBAT_PARAM_MSG.STATS_CHANGED) {
                this.maxBuffs.setNumber(model.getMaxBuffs());
                this.currentBuffs.setNumber(model.currentItemBuffs);
                this._createBuffs()
            }
        },

        _createBuffs: function () {
            for (var oldBars = this.hook.children.slice(this._removeStartIndex, this.hook.children.length - this._removeStartIndex), index = oldBars.length; index--;) {
                oldBars[index].onDetach();
                oldBars[index].removeAfterTransition = false
            }
            for (var buffs = sc.model.player.params.buffs, buff = null, bar = null, posY = 12, index = 0; index < buffs.length; index++) {
                if (buff = sc.inventory.getItem(buffs[index].itemID)) {
                    bar = new sc.ItemStatusDefaultBar(ig.LangLabel.getText(buff.name), sc.MENU_BAR_TYPE.BUFF, buffs[index]);
                    bar.setPos(0, posY);
                    bar.updateValues(true);
                    posY = posY + 18;
                    this.addChildGui(bar)
                }
            }
        }
    });

    sc.ItemBuffHelp = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
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

        init: function () {
            this.parent();
            this.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.setPos(25, 37);
            var gfx = new ig.ImageGui(this.gfx, 480, 336, 10, 9);
            gfx.setPos(0, 6);
            this.addChildGui(gfx);
            gfx = new sc.TextGui("\\i[help]");
            gfx.setPos(12, 0);
            this.addChildGui(gfx);
            gfx = new sc.TextGui(ig.lang.get("sc.gui.menu.item.buffHelp"), {
                font: sc.fontsystem.smallFont
            });
            gfx.setPos(26, 2);
            this.addChildGui(gfx);
            this.doStateTransition("HIDDEN", true)
        },

        addObservers: function () {
            sc.Model.addObserver(sc.menu, this)
        },

        removeObservers: function () {
            sc.Model.removeObserver(sc.menu, this)
        },

        showMenu: function () {
            this.store = false;
            sc.options.get("buff-help") && this.doStateTransition("DEFAULT")
        },

        exitMenu: function (store) {
            if (store && this.hook.currentStateName == "DEFAULT") {
                this.store = true
            }
            this.doStateTransition("HIDDEN")
        },

        modelChanged: function (menu, event, delay) {
            if (menu == sc.menu) {
                if (event == sc.MENU_EVENT.ITEM_CHANGED_TAB) {
                    this.doStateTransition("HIDDEN")
                } else if (event == sc.MENU_EVENT.SET_BUFF_INFO) {
                    if (sc.menu.getCurrentTabType() == sc.ITEMS_TYPES.CONS && sc.options.get("buff-help")) {
                        delay = delay || false;
                        sc.menu.buffText ? this.doStateTransition("DEFAULT") : this.doStateTransition("HIDDEN", false, false, null, delay ? 0.5 : 0)
                    } else {
                        this.doStateTransition("HIDDEN")
                    }
                }
            }
        }
    })
});
ig.baked = !0;

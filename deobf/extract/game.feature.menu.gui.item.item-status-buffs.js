ig.module("game.feature.menu.gui.item.item-status-buffs").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.item.item-status-default").defines(function() {
    sc.ItemStatusBuffs = sc.HeaderMenuPanel.extend({
        gfx: new ig.Image("media/gui/basic.png"),
        maxBuffs: null,
        currentBuffs: null,
        _removeStartIndex: 3,
        init: function() {
            this.parent(ig.lang.get("sc.gui.menu.item.buff"), sc.MenuPanelType.TOP_RIGHT_EDGE);
            this.setSize(126, 83);
            this.setPos(sc.options.hdMode ? 25 :
                2, 127);
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
            var b = sc.model.player.params,
                a = {
                    size: sc.NUMBER_SIZE.TINY,
                    color: sc.GUI_NUMBER_COLOR.GREY
                };
            this.maxBuffs = new sc.NumberGui(4, a);
            this.maxBuffs.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.maxBuffs.setPos(6, 2);
            this.maxBuffs.setNumber(b.getMaxBuffs());
            this.addChildGui(this.maxBuffs);
            this.currentBuffs =
                new sc.NumberGui(4, a);
            this.currentBuffs.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.currentBuffs.setPos(20, 2);
            this.currentBuffs.setNumber(b.currentItemBuffs);
            this.addChildGui(this.currentBuffs);
            b = new ig.ImageGui(this.gfx, 208, 18, 5, 5);
            b.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            b.setPos(14, 2);
            this.addChildGui(b);
            this.doStateTransition("HIDDEN", true)
        },
        addObservers: function() {
            sc.Model.addObserver(sc.menu, this);
            sc.Model.addObserver(sc.model.player.params, this)
        },
        removeObservers: function() {
            sc.Model.removeObserver(sc.menu,
                this);
            sc.Model.removeObserver(sc.model.player.params, this)
        },
        showMenu: function() {
            this._createBuffs();
            this.maxBuffs.setNumber(sc.model.player.params.getMaxBuffs());
            sc.menu.getCurrentTabType() == sc.ITEMS_TYPES.CONS && this.doStateTransition("DEFAULT")
        },
        exitMenu: function() {
            this.doStateTransition("HIDDEN")
        },
        modelChanged: function(b, a) {
            if (b == sc.menu) a == sc.MENU_EVENT.ITEM_CHANGED_TAB && (sc.menu.getCurrentTabType() == sc.ITEMS_TYPES.CONS ? this.doStateTransition("DEFAULT") : this.doStateTransition("HIDDEN"));
            else if (b ==
                sc.model.player.params && a == sc.COMBAT_PARAM_MSG.STATS_CHANGED) {
                this.maxBuffs.setNumber(b.getMaxBuffs());
                this.currentBuffs.setNumber(b.currentItemBuffs);
                this._createBuffs()
            }
        },
        _createBuffs: function() {
            for (var b = this.hook.children.slice(this._removeStartIndex, this.hook.children.length - this._removeStartIndex), a = b.length; a--;) {
                b[a].onDetach();
                b[a].removeAfterTransition = false
            }
            for (var b = sc.model.player.params.buffs, d = null, d = null, c = 12, a = 0; a < b.length; a++)
                if (d = sc.inventory.getItem(b[a].itemID)) {
                    d = new sc.ItemStatusDefaultBar(ig.LangLabel.getText(d.name),
                        sc.MENU_BAR_TYPE.BUFF, b[a]);
                    d.setPos(0, c);
                    d.updateValues(true);
                    c = c + 18;
                    this.addChildGui(d)
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
        init: function() {
            this.parent();
            this.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.setPos(25, 37);
            var b = new ig.ImageGui(this.gfx, 480, 336, 10, 9);
            b.setPos(0, 6);
            this.addChildGui(b);
            b = new sc.TextGui("\\i[help]");
            b.setPos(12, 0);
            this.addChildGui(b);
            b = new sc.TextGui(ig.lang.get("sc.gui.menu.item.buffHelp"), {
                font: sc.fontsystem.smallFont
            });
            b.setPos(26, 2);
            this.addChildGui(b);
            this.doStateTransition("HIDDEN", true)
        },
        addObservers: function() {
            sc.Model.addObserver(sc.menu, this)
        },
        removeObservers: function() {
            sc.Model.removeObserver(sc.menu, this)
        },
        showMenu: function() {
            this.store = false;
            sc.options.get("buff-help") && this.doStateTransition("DEFAULT")
        },
        exitMenu: function(b) {
            if (b && this.hook.currentStateName ==
                "DEFAULT") this.store = true;
            this.doStateTransition("HIDDEN")
        },
        modelChanged: function(b, a, d) {
            if (b == sc.menu)
                if (a == sc.MENU_EVENT.ITEM_CHANGED_TAB) this.doStateTransition("HIDDEN");
                else if (a == sc.MENU_EVENT.SET_BUFF_INFO)
                if (sc.menu.getCurrentTabType() == sc.ITEMS_TYPES.CONS && sc.options.get("buff-help")) {
                    d = d || false;
                    sc.menu.buffText ? this.doStateTransition("DEFAULT") : this.doStateTransition("HIDDEN", false, false, null, d ? 0.5 : 0)
                } else this.doStateTransition("HIDDEN")
        }
    })
});
ig.baked = !0;

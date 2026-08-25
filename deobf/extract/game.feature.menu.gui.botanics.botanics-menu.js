ig.module("game.feature.menu.gui.botanics.botanics-menu").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.base-menu", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.botanics.botanics-list", "game.feature.menu.gui.botanics.botanics-misc").defines(function() {
    sc.BotanicsMenu = sc.ListInfoMenu.extend({
        detail: null,
        init: function() {
            this.parent(new sc.BotanicsListBox);
            this.sortMenu.addButton("auto", sc.BOTANICS_SORT_TYPE.ORDER, 0);
            this.sortMenu.addButton("botanics",
                sc.BOTANICS_SORT_TYPE.FOUND, 1);
            this.sortMenu.addButton("botanicsName", sc.BOTANICS_SORT_TYPE.NAME, 2);
            this.list.setPos(0, 0);
            this.doStateTransition("DEFAULT")
        },
        showMenu: function() {
            sc.menu.setSynopInfo(null, false);
            this.parent();
            this.updateSortMenuButton(this.list.getCurrentSortText())
        },
        exitMenu: function() {
            this.parent();
            sc.menu.tradeToggle = false;
            ig.cleanCache()
        },
        createHelpGui: function() {
            if (!this.helpGui) {
                this.helpGui = new sc.HelpScreen(this, ig.lang.get("sc.gui.menu.help-texts.botanics.title"), ig.lang.get("sc.gui.menu.help-texts.botanics.pages"),
                    function() {
                        this.commitHotKeysToTopBar(true)
                    }.bind(this), true);
                this.helpGui.hook.zIndex = 15E4;
                this.helpGui.hook.pauseGui = true
            }
        },
        modelChanged: function(b, a, d) {
            if (b == sc.menu)
                if (a == sc.MENU_EVENT.SORT_LIST) this.updateSortMenuButton(d.text);
                else if (a == sc.MENU_EVENT.SYNO_CHANGED_TAB) {
                this.sortMenu.active && this.sortMenu.hideSortMenu();
                this.updateSortMenuButton(this.list.getCurrentSortText())
            } else a == sc.MENU_EVENT.SYNOP_SET_INFO && sc.menu.tradeToggle && sc.menu.synopInfo && this.setTradeInfo()
        }
    })
});
ig.baked = !0;

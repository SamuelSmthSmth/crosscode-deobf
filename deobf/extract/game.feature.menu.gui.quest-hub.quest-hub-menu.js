ig.module("game.feature.menu.gui.quest-hub.quest-hub-menu").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.base-menu", "game.feature.menu.gui.quest-hub.quest-hub-list").defines(function() {
    sc.QuestHubMenu = sc.ListInfoMenu.extend({
        helpGui: null,
        completion: null,
        available: null,
        init: function() {
            this.parent(new sc.QuestHubList);
            this.list.hook.pos.x = 0;
            this.list.bg.hook.pos.y = this.list.bg.hook.pos.y - 5;
            this.list.bg.hook.size.y = this.list.bg.hook.size.y + 5;
            this.completion =
                new sc.QuestHubCompletion;
            this.addChildGui(this.completion);
            this.available = new sc.QuestHubAvailable;
            this.addChildGui(this.available);
            this.sortMenu.addButton("auto", sc.QUEST_SORT_TYPE.ORDER, 0);
            this.sortMenu.addButton("name", sc.QUEST_SORT_TYPE.NAME, 1);
            this.sortMenu.addButton("questLevel", sc.QUEST_SORT_TYPE.LEVEL, 2);
            this.doStateTransition("DEFAULT")
        },
        showMenu: function() {
            this.parent();
            this.list && this.updateSortMenuButton(this.list.getCurrentSortText());
            this.completion.show();
            this.available.show()
        },
        exitMenu: function() {
            this.parent();
            this.completion.hide();
            this.available.hide();
            sc.menu.moveLeaSprite(0, 0, sc.MENU_LEA_STATE.LARGE)
        },
        createHelpGui: function() {
            if (!this.helpGui) {
                this.helpGui = new sc.HelpScreen(this, ig.lang.get("sc.gui.menu.help-texts.questHub.title"), ig.lang.get("sc.gui.menu.help-texts.questHub.pages"), function() {
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
            }
        }
    })
});
ig.baked = !0;

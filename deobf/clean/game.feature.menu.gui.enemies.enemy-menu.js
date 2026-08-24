/**
 * game.feature.menu.gui.enemies.enemy-menu
 * ========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.enemies.enemy-menu")`.
 *
 * `sc.EnemyMenu`: the enemy codex submenu (`sc.ListInfoMenu`) — the
 * enemy list with its info box and the sort menu (order / name / level /
 * area).
 */
ig.module("game.feature.menu.gui.enemies.enemy-menu")
    .requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.enemies.enemy-list", "game.feature.menu.gui.enemies.enemy-misc")
    .defines(function () {

    sc.EnemyMenu = sc.ListInfoMenu.extend({
        init: function () {
            this.parent(new sc.EnemyListBox, new sc.EnemyInfoBox);
            this.sortMenu.addButton("auto", sc.COMBAT_ENEMY_SORT_TYPE.ORDER, 0);
            this.sortMenu.addButton("name", sc.COMBAT_ENEMY_SORT_TYPE.NAME, 1);
            this.sortMenu.addButton("enemyLevel", sc.COMBAT_ENEMY_SORT_TYPE.LEVEL, 2);
            this.sortMenu.addButton("area", sc.COMBAT_ENEMY_SORT_TYPE.AREA, 3);
            this.doStateTransition("DEFAULT")
        },

        showMenu: function () {
            sc.menu.setSynopInfo(null, false);
            this.parent();
            this.updateSortMenuButton(this.list.getCurrentSortText());
            this.info.setCategory(this.list.getCurrentTabKey())
        },

        exitMenu: function () {
            this.parent();
            ig.cleanCache()
        },

        createHelpGui: function () {
            if (!this.helpGui) {
                this.helpGui = new sc.HelpScreen(this, ig.lang.get("sc.gui.menu.help-texts.enemy.title"), ig.lang.get("sc.gui.menu.help-texts.enemy.pages"), function () {
                    this.commitHotKeysToTopBar(true)
                }.bind(this), true);
                this.helpGui.hook.zIndex = 15E4;
                this.helpGui.hook.pauseGui = true
            }
        },

        modelChanged: function (model, event, data) {
            if (model == sc.menu)
                if (event == sc.MENU_EVENT.SORT_LIST) this.updateSortMenuButton(data.text);
                else if (event == sc.MENU_EVENT.SYNO_CHANGED_TAB) {
                this.sortMenu.active && this.sortMenu.hideSortMenu();
                this.info.setCategory(this.list.getCurrentTabKey());
                this.updateSortMenuButton(this.list.getCurrentSortText())
            } else event != sc.MENU_EVENT.SYNOP_SWITCH_PAGE && event == sc.MENU_EVENT.SYNOP_SET_INFO && this.info.setEnemy(sc.menu.synopInfo)
        }
    })
});
ig.baked = !0;

/**
 * game.feature.menu.gui.enemies.enemy-list
 * ========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.enemies.enemy-list")`.
 *
 * `sc.EnemyListBox`: the enemy codex list — animals / mecha / avatars /
 * abstract / boss tabs with sorting (order / name / level / area) and
 * kill-unlock / booster-level display logic.
 */
ig.module("game.feature.menu.gui.enemies.enemy-list")
    .requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.gui.base.text", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.list-boxes", "game.feature.menu.gui.tab-box")
    .defines(function () {

    ig.perf.fullEnemyFibula = false;

    sc.EnemyListBox = sc.ListTabbedPane.extend({
        submitSound: null,
        favSound: null,
        errorSound: null,
        enemies: null,

        init: function () {
            this.parent(true);
            this.setSize(264, 262);
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.setPivot(264, 262);
            this.setPanelSize(264, 243);
            this.favSound = this.submitSound = sc.BUTTON_SOUND.submit;
            this.errorSound = sc.BUTTON_SOUND.denied;
            this.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: -132
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN_EASE: {
                    state: {
                        alpha: 0,
                        offsetX: -132
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                }
            };
            this.enemies = ig.database.get("enemies");
            var lvlLabel = new sc.TextGui(ig.lang.get("sc.gui.status-hud.lvl"), {
                font: sc.fontsystem.tinyFont
            });
            lvlLabel.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            lvlLabel.setPos(7, -8);
            this.bg.addChildGui(lvlLabel);
            this.addTab("animals", 0, {
                type: sc.ENEMY_CATEGORY.ANIMALS
            });
            this.addTab("mecha", 1, {
                type: sc.ENEMY_CATEGORY.MECHA
            });
            this.addTab("avatars", 2, {
                type: sc.ENEMY_CATEGORY.PLAYERS
            });
            this.addTab("abstract", 3, {
                type: sc.ENEMY_CATEGORY.ABSTRACT
            });
            this.addTab("boss", 4, {
                type: sc.ENEMY_CATEGORY.BOSS
            })
        },

        addObservers: function () {
            sc.Model.addObserver(sc.menu, this)
        },

        removeObservers: function () {
            sc.Model.removeObserver(sc.menu, this)
        },

        show: function () {
            this.parent();
            this.setTab(this.currentTabIndex || 0, true, {
                skipSounds: true
            });
            ig.interact.setBlockDelay(0.2);
            this.doStateTransition("DEFAULT")
        },

        hide: function () {
            this.parent();
            this.doStateTransition("HIDDEN")
        },

        getCurrentSortText: function () {
            var sortType = null,
                sortType = this.tabContent[this.currentTabIndex] ? this.tabContent[this.currentTabIndex].sort || sc.COMBAT_ENEMY_SORT_TYPE.ORDER : sc.COMBAT_ENEMY_SORT_TYPE.ORDER,
                key = "auto";
            switch (sortType) {
                case sc.COMBAT_ENEMY_SORT_TYPE.ORDER:
                    key = "auto";
                    break;
                case sc.COMBAT_ENEMY_SORT_TYPE.NAME:
                    key = "name";
                    break;
                case sc.COMBAT_ENEMY_SORT_TYPE.LEVEL:
                    key = "enemyLevel";
                    break;
                case sc.COMBAT_ENEMY_SORT_TYPE.AREA:
                    key = "area"
            }
            return ig.lang.get("sc.gui.menu.sort." + key)
        },

        onLeftRightPress: function (button, index, direction) {
            this.submitSound.play();
            sc.menu.switchSynopsisPage(direction == 1 ? 1 : -1);
            return {
                skipSounds: true
            }
        },

        onTabChanged: function (index) {
            sc.menu.setSynoTab(index);
            (ig.input.mouseGuiActive || this.currentGroup.isEmpty()) && sc.menu.setSynopInfo(null, true)
        },

        onTabButtonCreation: function (name, index, data) {
            var button = new sc.ItemTabbedBox.TabButton(ig.lang.get("sc.gui.menu.enemy.tabs." + name), "enemy-" + name, 105);
            button.textChild.setPos(7, 1);
            button.setPos(0, 2);
            button.setData({
                type: data.type
            });
            this.addChildGui(button);
            return button
        },

        onTabPressed: function (button, isPressed) {
            if (!isPressed) {
                this.submitSound.play();
                this.setTab(this.getButtonIndex(button));
                for (var i = this.tabArray.length; i--;)
                    if (button == this.tabArray[i]) {
                        sc.menu.setSynoTab(i);
                        break
                    }
                sc.menu.setSynopInfo(null, true);
                return false
            }
        },

        onTabSelected: function () {
            ig.input.mouseGuiActive && sc.menu.setSynopInfo(null, true)
        },

        onTabMouseFocusLost: function () {
            sc.menu.setSynopInfo(null, true)
        },

        onCreateListEntries: function (list, buttongroup, tabType, sortType) {
            var entry = null,
                enemy = null,
                label = entry = null,
                icon = null,
                enemyList = this.getEnemyList(tabType, sortType);
            list.clear();
            buttongroup.clear();
            for (var i = 0; i < enemyList.length; i++) {
                entry = enemyList[i];
                enemy = this.enemies[entry];
                if ((ig.perf.fullEnemyFibula || sc.stats.getMap("combat", "kill" + entry)) && enemy.track && (!enemy.extension || ig.extensions.hasExtension(enemy.extension))) {
                    var boosterActive = sc.map.getAreaItemToggleState(sc.AREA_ITEM_TYPE.BOOSTER, enemy.area),
                        icon = tabType == sc.ENEMY_CATEGORY.BOSS ? "\\i[enemy-" + this.getEnemyCategoryKey(enemy.category) + "-boss]" : "\\i[enemy-" + this.getCurrentTabKey() + (enemy.boss ? "-boss" : "") + "]",
                        level = boosterActive && sc.combat.canShowBoostedEntry(entry, enemy.boss) ? enemy.boostedLevel || sc.MIN_BOOSTER_LEVEL : enemy.level,
                        text = "",
                        text = text + (icon + ig.LangLabel.getText(enemy.name)),
                        entryButton = new sc.EnemyEntryButton(text, entry, level || 1);
                    list.addButton(entryButton)
                }
            }
        },

        onListEntrySelected: function (entry) {
            if (entry.key) {
                sc.menu.setSynopInfo(entry.key);
                sc.menu.setInfoText(null, true)
            } else {
                sc.menu.setSynopInfo(entry.key);
                entry.data && (entry.data instanceof Object || sc.menu.setInfoText(entry.data))
            }
        },

        onListMouseFocusLost: function () {
            sc.menu.setSynopInfo(null, true);
            sc.menu.setInfoText(null, true)
        },

        getEnemyList: function (category, sortType) {
            var list = [],
                enemies = this.enemies;
            for (var key in enemies) {
                var enemy = enemies[key];
                category == sc.ENEMY_CATEGORY.BOSS ? enemy.boss && list.push(key) : sc.ENEMY_CATEGORY[enemy.category || "ABSTRACT"] == category && list.push(key)
            }
            sortType != void 0 && this.sortLoreList(list, sortType);
            return list
        },

        sortLoreList: function (list, sortType) {
            switch (sortType) {
                case sc.COMBAT_ENEMY_SORT_TYPE.ORDER:
                    list.sort(function (a, b) {
                        var aOrder = this.enemies[a].order,
                            bOrder = this.enemies[b].order;
                        return aOrder - bOrder
                    }.bind(this));
                    break;
                case sc.COMBAT_ENEMY_SORT_TYPE.NAME:
                    list.sort(function (a, b) {
                        var aName = ig.LangLabel.getText(this.enemies[a].name),
                            bName = ig.LangLabel.getText(this.enemies[b].name);
                        return aName.localeCompare(bName)
                    }.bind(this));
                    break;
                case sc.COMBAT_ENEMY_SORT_TYPE.LEVEL:
                    list.sort(function (a, b) {
                        var aEnemy = this.enemies[a],
                            bEnemy = this.enemies[b];
                        return (aEnemy.level || 1) == (bEnemy.level || 1) ? aEnemy.order - bEnemy.order : (aEnemy.level || 1) - (bEnemy.level || 1)
                    }.bind(this));
                    break;
                case sc.COMBAT_ENEMY_SORT_TYPE.AREA:
                    list.sort(function (a, b) {
                        var aEnemy = this.enemies[a],
                            bEnemy = this.enemies[b];
                        return aEnemy.area == bEnemy.area ? aEnemy.order - bEnemy.order : sc.map.getAreaName(aEnemy.area).toString().localeCompare(sc.map.getAreaName(bEnemy.area).toString())
                    }.bind(this))
            }
        },

        getEnemyCategoryKey: function (category) {
            switch (sc.ENEMY_CATEGORY[category]) {
                case sc.ENEMY_CATEGORY.ANIMALS:
                    return "animals";
                case sc.ENEMY_CATEGORY.MECHA:
                    return "mecha";
                case sc.ENEMY_CATEGORY.PLAYERS:
                    return "avatars";
                case sc.ENEMY_CATEGORY.ABSTRACT:
                    return "abstract"
            }
        },

        modelChanged: function (model, event, data) {
            if (model == sc.menu && event == sc.MENU_EVENT.SORT_LIST) {
                sc.menu.setSynopInfo(null, true);
                sc.menu.setInfoText(null, true);
                this.sort(data.data.sortType)
            }
        }
    })
});
ig.baked = !0;

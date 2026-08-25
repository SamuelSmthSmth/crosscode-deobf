ig.module("game.feature.menu.gui.trophy.trophy-menu").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.base-menu", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.trophy.trophy-list").defines(function() {
    sc.TrophyMenu = sc.ListInfoMenu.extend({
        hotkeyStats: null,
        helpGui: null,
        sectionLeft: null,
        sectionRight: null,
        points: null,
        completion: null,
        init: function() {
            this.parent(new sc.TrophyList);
            if (this.list) {
                this.list.hook.pos.x = 0;
                this.list.bg.hook.pos.y = this.list.bg.hook.pos.y -
                    5;
                this.list.bg.hook.size.x = 300;
                this.list.bg.hook.size.y = this.list.bg.hook.size.y + 5
            }
            this.points = new sc.TrophyTotalPoints;
            this.addChildGui(this.points);
            this.completion = new sc.TrophyCompletion;
            this.addChildGui(this.completion);
            this.hotkeyStats = new sc.ButtonGui("\\i[help2]" + ig.lang.get("sc.gui.menu.trophies.toggleStats"), void 0, true, sc.BUTTON_TYPE.SMALL);
            this.hotkeyStats.keepMouseFocus = true;
            this.hotkeyStats.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                },
                HIDDEN: {
                    state: {
                        offsetY: -this.hotkeyStats.hook.size.y
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.hotkeyStats.onButtonPress = this.onStatsButtonPressed.bind(this);
            this.sortMenu.addButton("auto", sc.TROPHY_SORT_TYPES.ORDER, 0);
            this.sortMenu.addButton("featLock", sc.TROPHY_SORT_TYPES.UNLOCKED, 1);
            this.sortMenu.addButton("featName", sc.TROPHY_SORT_TYPES.NAME, 2);
            this.sortMenu.addButton("featPoints", sc.TROPHY_SORT_TYPES.POINTS, 3);
            this.doStateTransition("DEFAULT")
        },
        showMenu: function() {
            this.parent();
            sc.trophies.validateFeatPoints();
            this.list && this.updateSortMenuButton(this.list.getCurrentSortText());
            this.points.show();
            this.completion.show()
        },
        exitMenu: function() {
            sc.menu.buttonInteract.removeGlobalButton(this.hotkeyStats);
            this.parent();
            this.points.hide();
            this.completion.hide();
            sc.menu.moveLeaSprite(0, 0, sc.MENU_LEA_STATE.LARGE)
        },
        onAddHotkeys: function(b) {
            sc.menu.buttonInteract.addGlobalButton(this.hotkeyHelp, this.onHotkeyHelpCheck.bind(this));
            sc.menu.buttonInteract.addGlobalButton(this.hotkeySort, this.onHotkeySortCheck.bind(this));
            sc.menu.buttonInteract.addGlobalButton(this.hotkeyStats, this.onHotkeyStatsCheck.bind(this));
            this.commitHotKeysToTopBar(b)
        },
        commitHotKeysToTopBar: function(b) {
            sc.menu.addHotkey(function() {
                return this.hotkeyStats
            }.bind(this));
            sc.menu.addHotkey(function() {
                return this.hotkeySort
            }.bind(this));
            sc.menu.addHotkey(function() {
                return this.hotkeyHelp
            }.bind(this));
            sc.menu.commitHotkeys(b)
        },
        onHotkeyStatsCheck: function() {
            return sc.control.menuHotkeyHelp2()
        },
        onStatsButtonPressed: function() {
            this.list && this.list.toggleProgress()
        },
        createHelpGui: function() {
            if (!this.helpGui) {
                this.helpGui = new sc.HelpScreen(this,
                    ig.lang.get("sc.gui.menu.help-texts.feat.title"), ig.lang.get("sc.gui.menu.help-texts.feat.pages"),
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
            }
        }
    })
});
ig.baked = !0;

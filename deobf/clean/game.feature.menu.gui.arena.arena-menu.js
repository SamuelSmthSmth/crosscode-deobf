/**
 * game.feature.menu.gui.arena.arena-menu
 * ======================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.arena.arena-menu")`.
 *
 * `sc.ArenaMenu`: the arena submenu (`sc.ListInfoMenu`) — the cup list
 * with its info box and total-points panel, plus the per-cup round list
 * view with the summary (overview) hotkey.
 */
ig.module("game.feature.menu.gui.arena.arena-menu")
    .requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.base-menu", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.arena.arena-list", "game.feature.menu.gui.menu-misc")
    .defines(function () {

    sc.ArenaMenu = sc.ListInfoMenu.extend({
        hotkeyOverview: null,
        helpGui: null,
        roundList: null,
        points: null,
        overview: null,

        init: function () {
            this.parent(new sc.ArenaCupList, new sc.ArenaInfoBox);
            this.points = new sc.ArenaTotalPoints;
            this.addChildGui(this.points);
            this.roundList = new sc.ArenaRoundList;
            this.roundList.setPos(8, 29);
            this.roundList.doStateTransition("HIDDEN", true);
            this.addChildGui(this.roundList);
            this.hotkeyOverview = new sc.ButtonGui("\\i[help2]" + ig.lang.get("sc.gui.arena.buttons.names.summary"), void 0, true, sc.BUTTON_TYPE.SMALL);
            this.hotkeyOverview.startHidden = true;
            this.hotkeyOverview.submitSound = null;
            this.hotkeyOverview.blockedSound = null;
            this.hotkeyOverview.keepMouseFocus = true;
            this.hotkeyOverview.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                },
                HIDDEN: {
                    state: {
                        offsetY: -this.hotkeyOverview.hook.size.y
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.hotkeyOverview.onButtonPress = this.onOverviewButtonPressed.bind(this);
            this.sortMenu.addButton("auto", sc.ARENA_SORT_TYPES.ORDER, 0);
            this.doStateTransition("DEFAULT")
        },

        showMenu: function () {
            this.parent();
            sc.arena._validateCoins();
            this.list && this.updateSortMenuButton(this.list.getCurrentSortText());
            this.info && this.info.setCategory(this.list.getCurrentTabKey());
            this.points.show();
            this.hotkeyOverview.doStateTransition("HIDDEN", true);
            this.hotkeyOverview.setActive(false)
        },

        exitMenu: function () {
            sc.menu.buttonInteract.removeGlobalButton(this.hotkeyOverview);
            this.info.page == 1 && this.exitRoundMenu();
            this.parent();
            this.points.hide();
            sc.menu.moveLeaSprite(0, 0, sc.MENU_LEA_STATE.LARGE)
        },

        onAddHotkeys: function (commitToTopBar) {
            sc.menu.buttonInteract.addGlobalButton(this.hotkeyHelp, this.onHotkeyHelpCheck.bind(this));
            sc.menu.buttonInteract.addGlobalButton(this.hotkeySort, this.onHotkeySortCheck.bind(this));
            sc.menu.buttonInteract.addGlobalButton(this.hotkeyOverview, this.onHotkeyOverviewCheck.bind(this));
            this.commitHotKeysToTopBar(commitToTopBar)
        },

        commitHotKeysToTopBar: function (commitToTopBar) {
            this.hotkeyOverview.startHidden = !this.roundList.active;
            sc.menu.addHotkey(function () {
                return this.hotkeyOverview
            }.bind(this));
            sc.menu.addHotkey(function () {
                return this.hotkeySort
            }.bind(this));
            sc.menu.addHotkey(function () {
                return this.hotkeyHelp
            }.bind(this));
            sc.menu.commitHotkeys(commitToTopBar)
        },

        enterRoundMenu: function (key) {
            sc.menu.pushBackCallback(function () {
                sc.menu.popBackCallback();
                this.exitRoundMenu()
            }.bind(this));
            this.roundList.addObservers();
            this.info.switchPage(1);
            sc.menu.setInfoText(null, true);
            this.hotkeySort.setActive(false);
            this.list.removeObservers();
            this.list.doStateTransition("HIDDEN");
            this.hotkeyOverview.setActive(true);
            this.hotkeyOverview.doStateTransition("DEFAULT");
            this.roundList.show(key)
        },

        exitRoundMenu: function () {
            this.roundList.hide();
            this.roundList.removeObservers();
            this.info.switchPage(0);
            if (this.roundList.currentCup && !ig.input.mouseGuiActive) {
                this.info.key = "-1s";
                this.info.setInfo(this.roundList.currentCup)
            } else {
                this.info.key = "-1s";
                this.info.setInfo()
            }
            this.hotkeySort.setActive(true);
            this.hotkeyOverview.setActive(false);
            this.hotkeyOverview.doStateTransition("HIDDEN");
            this.list.addObservers();
            this.list.doStateTransition("DEFAULT")
        },

        onHotkeyOverviewCheck: function () {
            return ig.interact.isBlocked() ? false : sc.control.menuHotkeyHelp2()
        },

        onOverviewButtonPressed: function () {
            if (this.hotkeyOverview.active) {
                sc.BUTTON_SOUND.submit.play();
                this.overview = new sc.ArenaCupOverview(this.roundList.currentCup, function () {
                    this.overview = null
                }.bind(this), true);
                ig.gui.addGuiElement(this.overview);
                this.overview.show()
            }
        },

        createHelpGui: function () {
            if (!this.helpGui) {
                this.helpGui = new sc.HelpScreen(this, ig.lang.get("sc.gui.menu.help-texts.feat.title"), ig.lang.get("sc.gui.menu.help-texts.feat.pages"), function () {
                    this.commitHotKeysToTopBar(true)
                }.bind(this), false);
                this.helpGui.hook.zIndex = 15E4;
                this.helpGui.hook.pauseGui = true
            }
        },

        modelChanged: function (model, event, data) {
            if (model == sc.menu)
                if (event == sc.MENU_EVENT.SORT_LIST) this.updateSortMenuButton(data.text);
                else if (event == sc.MENU_EVENT.SYNO_CHANGED_TAB) {
                this.sortMenu.active && this.sortMenu.hideSortMenu();
                this.info && this.info.setCategory(this.list.getCurrentTabKey());
                this.updateSortMenuButton(this.list.getCurrentSortText())
            } else event == sc.MENU_EVENT.SYNOP_BUTTON_PRESS ? this.enterRoundMenu(data.key) : event == sc.MENU_EVENT.SYNOP_SET_INFO && (sc.menu.synopInfo ? this.info && this.info.setInfo(sc.menu.synopInfo.key, sc.menu.synopInfo.round) : this.info && this.info.setInfo())
        }
    })
});
ig.baked = !0;

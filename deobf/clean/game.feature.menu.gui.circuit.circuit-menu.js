/**
 * game.feature.menu.gui.circuit.circuit-menu
 * ==========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.circuit.circuit-menu")`.
 *
 * `sc.CircuitMenu`: the Circuit submenu (skill tree). Hosts the overview of
 * all skill trees, the tree detail container, the node menu, the cross-points
 * overview and the swap-branches view, plus the two top-bar hotkeys (help and
 * swap branches). Routes menu events between the overview/detail/swap states.
 */
ig.module("game.feature.menu.gui.circuit.circuit-menu")
    .requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.circuit.circuit-misc", "game.feature.menu.gui.circuit.circuit-detail-elements", "game.feature.menu.gui.circuit.circuit-detail", "game.feature.menu.gui.circuit.circuit-swap-branches", "game.feature.menu.gui.circuit.circuit-overview")
    .defines(function () {

    sc.CircuitMenu = sc.BaseMenu.extend({
        overview: null,
        points: null,
        detail: null,
        info: null,
        node: null,
        swap: null,
        bg: null,
        swapInfo: null,
        hotkeySwap: null,
        hotkeyHelp: null,
        helpGui: null,

        init: function () {
            this.parent();
            this.hook.size.x = ig.system.width;
            this.hook.size.y = ig.system.height;
            this.bg = new ig.ColorGui("black", ig.system.width, ig.system.height);
            this.bg.hook.transitions = {
                DEFAULT: {
                    state: {
                        alpha: 0.2
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.bg.doStateTransition("HIDDEN", true);
            this.addChildGui(this.bg);
            this.overview = new sc.CircuitOverviewMenu;
            this.addChildGui(this.overview);
            this.detail = new sc.CircuitTreeDetailContainer;
            this.addChildGui(new sc.DummyContainer(this.detail));
            this.info = new sc.CircuitInfoBox(this.detail.hook);
            this.addChildGui(this.info);
            this.points = new sc.CrossPointsOverview;
            this.addChildGui(this.points);
            this.node = new sc.CircuitNodeMenu(this.detail.hook);
            this.node.setPos(100, 100);
            this.addChildGui(this.node);
            this.swap = new sc.CircuitSwapBranches;
            this.addChildGui(this.swap);
            this.swapInfo = new sc.CircuitSwapBranchesInfoBox(this.swap.buttonGroup);
            this.addChildGui(this.swapInfo);
            this.hotkeyHelp = new sc.ButtonGui("\\i[help]" + ig.lang.get("sc.gui.menu.hotkeys.help"), void 0, true, sc.BUTTON_TYPE.SMALL);
            this.hotkeyHelp.keepMouseFocus = true;
            this.hotkeyHelp.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                },
                HIDDEN: {
                    state: {
                        offsetY: -this.hotkeyHelp.hook.size.y
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.hotkeyHelp.onButtonPress = this._onHelpButtonPressed.bind(this);
            this.hotkeySwap = new sc.ButtonGui("\\i[help2]" + ig.lang.get("sc.gui.menu.hotkeys.swap-branches"), void 0, true, sc.BUTTON_TYPE.SMALL);
            this.hotkeySwap.keepMouseFocus = true;
            this.hotkeySwap.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                },
                HIDDEN: {
                    state: {
                        offsetY: -this.hotkeySwap.hook.size.y
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.hotkeySwap.onButtonPress = this._onSwapButtonPressed.bind(this);
            this.doStateTransition("DEFAULT", true)
        },

        _onBackButtonPress: function () {
            sc.menu.popBackCallback();
            sc.menu.popMenu()
        },

        _onHelpButtonCheck: function () {
            return sc.control.menuHotkeyHelp()
        },

        _onHelpButtonPressed: function () {
            sc.menu.removeHotkeys();
            this.createHelpGui();
            ig.gui.addGuiElement(this.helpGui);
            this.helpGui.openMenu()
        },

        createHelpGui: function () {
            if (!this.helpGui) {
                this.helpGui = new sc.HelpScreen(this, ig.lang.get("sc.gui.menu.help-texts.circuit.title"), ig.lang.get("sc.gui.menu.help-texts.circuit.pages"), function () {
                    this.commitHotKeysToTopBar(true)
                }.bind(this), true);
                this.helpGui.hook.zIndex = 15E4;
                this.helpGui.hook.pauseGui = true
            }
        },

        _onSwapButtonCheck: function () {
            return sc.control.menuHotkeyHelp2()
        },

        _onSwapButtonPressed: function () {
            var skillState = sc.menu.skillState;
            if (skillState == sc.MENU_SKILL_STATE.SWAP_BRANCHES) {
                this.hotkeySwap.setText("\\i[help2]" + ig.lang.get("sc.gui.menu.hotkeys.swap-branches"));
                sc.menu.updateHotkeys();
                sc.menu.leaveSwapBranches()
            } else {
                if (skillState != sc.MENU_SKILL_STATE.OVERVIEW) {
                    if (skillState == sc.MENU_SKILL_STATE.NODE_MENU) {
                        sc.menu.exitNodeMenu();
                        skillState = sc.MENU_SKILL_STATE.DETAIL_VIEW
                    }
                    ig.interact.setBlockDelay(0.2);
                    this.detail.trees[sc.menu.currentSkillTree]._onBackButtonPress()
                }
                sc.menu.enterSwapBranches(skillState);
                this.overview.updateAllBuffers();
                this.hotkeySwap.setText("\\i[help2]" + ig.lang.get("sc.gui.menu.hotkeys.swap-exit"));
                sc.menu.updateHotkeys();
                this.bg.doStateTransition("DEFAULT")
            }
        },

        _addHotKeys: function (commitToTopBar) {
            sc.menu.buttonInteract.addGlobalButton(this.hotkeyHelp, this._onHelpButtonCheck.bind(this));
            sc.menu.buttonInteract.addGlobalButton(this.hotkeySwap, this._onSwapButtonCheck.bind(this));
            this.commitHotKeysToTopBar(commitToTopBar)
        },

        commitHotKeysToTopBar: function (commit) {
            sc.menu.addHotkey(function () {
                return this.hotkeySwap
            }.bind(this));
            sc.menu.addHotkey(function () {
                return this.hotkeyHelp
            }.bind(this));
            sc.menu.commitHotkeys(commit)
        },

        addObservers: function () {
            sc.Model.addObserver(sc.model.menu, this);
            this.overview.addObservers();
            this.points.addObservers();
            this.info.addObservers();
            this.node.addObservers();
            this.detail.addObservers();
            this.swap.addObservers();
            this.swapInfo.addObservers()
        },

        removeObservers: function () {
            sc.Model.removeObserver(sc.model.menu, this);
            this.overview.removeObservers();
            this.points.removeObservers();
            this.info.removeObservers();
            this.node.removeObservers();
            this.detail.removeObservers();
            this.swap.removeObservers();
            this.swapInfo.removeObservers()
        },

        showMenu: function () {
            this.addObservers();
            sc.menu.pushBackCallback(this._onBackButtonPress.bind(this));
            sc.menu.moveLeaSprite(0, 0, sc.MENU_LEA_STATE.HIDDEN);
            ig.interact.setBlockDelay(0.2);
            this._addHotKeys();
            this.overview.showMenu();
            this.points.showMenu()
        },

        hideMenu: function () {
            sc.menu.moveLeaSprite(0, 0, sc.MENU_LEA_STATE.LARGE);
            this.exitMenu()
        },

        exitMenu: function () {
            this.removeObservers();
            sc.menu.buttonInteract.removeGlobalButton(this.hotkeyHelp);
            sc.menu.buttonInteract.removeGlobalButton(this.hotkeySwap);
            this.helpGui = null;
            if (sc.menu.currentSkillTree == -1) {
                this.overview.exitMenu();
                this.points.exitMenu();
                this.swapInfo.hideMenu()
            } else {
                this.overview.exitMenu(true);
                this.detail.exitMenu();
                this.points.removeHotkeys()
            }
        },

        modelChanged: function (menu, event) {
            if (menu == sc.menu) {
                if (event == sc.MENU_EVENT.SKILL_TREE_SELECT) {
                    if (menu.previousSkillTree != menu.currentSkillTree) {
                        menu.currentSkillTree == -1 ? this.overview.leaveDetailView() : this.overview.enterDetailView();
                        this.detail.switchElementTree(menu.currentSkillTree, menu.previousSkillTree)
                    }
                } else if (event == sc.MENU_EVENT.SKILL_LEAVE_SWAP_BRANCHES) {
                    this.hotkeySwap.setText("\\i[help2]" + ig.lang.get("sc.gui.menu.hotkeys.swap-branches"));
                    sc.menu.updateHotkeys();
                    this.overview.updateAllBuffers();
                    this.bg.doStateTransition("HIDDEN")
                }
            }
        }
    })
});
ig.baked = !0;

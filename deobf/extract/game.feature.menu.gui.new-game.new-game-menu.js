ig.module("game.feature.menu.gui.new-game.new-game-menu").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.base-menu", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.new-game.new-game-misc", "game.feature.menu.gui.new-game.new-game-list").defines(function() {
    sc.NewGamePlusMenu = sc.ListInfoMenu.extend({
        points: null,
        button: null,
        init: function() {
            this.parent(new sc.NewGameList, null, true);
            this.points = new sc.NewGameCart;
            this.addChildGui(this.points);
            this.button =
                new sc.ButtonGui("\\i[help2]" + ig.lang.get("sc.gui.menu.new-game.start"), 160);
            this.button.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: -160
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.button.keepMouseFocus = true;
            this.button.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.button.setPos(10, 30);
            this.button.doStateTransition("HIDDEN", true);
            this.button.onButtonPress = this.onBeginButtonPressed.bind(this);
            this.button.setActive(false);
            this.addChildGui(this.button);
            this.doStateTransition("DEFAULT")
        },
        showMenu: function() {
            this.points.show();
            this.button.doStateTransition("DEFAULT");
            sc.menu.buttonInteract.addGlobalButton(this.button, this.onHotkeyBeginCheck.bind(this));
            this.parent();
            if (sc.menu.previousMenu == sc.MENU_SUBMENU.SAVE) {
                this.points.updateCost(true);
                sc.menu.popBackCallback()
            } else sc.menu.newGameViewMode && this.points.updateCost(true)
        },
        exitMenu: function() {
            this.parent();
            sc.menu.buttonInteract.removeGlobalButton(this.button);
            this.points.hide();
            this.button.doStateTransition("HIDDEN")
        },
        onPostDirectEnter: function() {
            if (!localStorage.getItem("ccNewGamePlusTutorial")) {
                localStorage.setItem("ccNewGamePlusTutorial", "true");
                ig.interact.setBlockDelay(0.4);
                sc.Cutscene.startMenuEvent(sc.commonEvents.events["tutorial-newgame"].event, {})
            }
        },
        onHotkeyBeginCheck: function() {
            return sc.control.menuHotkeyHelp2()
        },
        onBeginButtonPressed: function() {
            sc.newgame.requiresSaveFile() ? sc.Dialogs.showDialog(ig.lang.get("sc.gui.menu.new-game.saveFileInfo"), sc.DIALOG_INFO_ICON.INFO,
                true,
                function() {
                    sc.menu.loadClearFilesOnly = true;
                    sc.menu.loadMode = true;
                    sc.menu.pushMenu(sc.MENU_SUBMENU.SAVE)
                }.bind(this)) : sc.Dialogs.showYesNoDialog(ig.lang.get("sc.gui.menu.new-game.confirmOptions"), sc.DIALOG_INFO_ICON.QUESTION, function(b) {
                if (b.data == 0) {
                    sc.newgame.setActive(true);
                    sc.model.enterRunning()
                }
            }.bind(this))
        },
        createHelpGui: function() {
            if (!this.helpGui) {
                this.helpGui = new sc.HelpScreen(this, ig.lang.get("sc.gui.menu.help-texts.newgame.title"), ig.lang.get("sc.gui.menu.help-texts.newgame.pages"),
                    function() {
                        this.commitHotKeysToTopBar(true)
                    }.bind(this), true);
                this.helpGui.hook.zIndex = 15E4;
                this.helpGui.hook.pauseGui = true
            }
        },
        modelChanged: function(b, a) {
            if (b == sc.menu && a == sc.MENU_EVENT.SYNOP_BUTTON_PRESS) {
                this.points.updateCost();
                this.button.setActive(sc.newgame.hasAnyOptions())
            }
        }
    })
});
ig.baked = !0;

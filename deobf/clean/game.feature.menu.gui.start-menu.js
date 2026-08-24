/**
 * game.feature.menu.gui.start-menu
 * ================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.start-menu")`.
 *
 * `sc.StartMenu`: the main menu's hub screen — eight buttons (quests,
 * skills, equipment, items, social, status, synopsis, save) stacked down
 * the right side with a large rhombus backdrop. Buttons slide in with
 * staggered transitions, are disabled (shown as "???") until their menu is
 * unlocked via player cores, and the synopsis button shows a "new unlock"
 * overlay when lore/trophy entries are new. `sc.StartMenu.LargeRhombus` is
 * the decorative background sprite.
 */
ig.module("game.feature.menu.gui.start-menu")
    .requires("impact.feature.gui.gui", "game.feature.menu.gui.base-menu", "game.feature.menu.gui.main-menu", "game.feature.menu.gui.menu-misc")
    .defines(function () {

    var BUTTON_POSITIONS = [{
        x: 4,
        y: 43
    }, {
        x: 12,
        y: 73
    }, {
        x: 20,
        y: 103
    }, {
        x: 28,
        y: 133
    }, {
        x: 28,
        y: 163
    }, {
        x: 20,
        y: 193
    }, {
        x: 12,
        y: 223
    }, {
        x: 4,
        y: 253
    }];

    sc.StartMenu = sc.BaseMenu.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        buttons: {
            quest: null,
            skills: null,
            equipment: null,
            items: null,
            status: null,
            social: null,
            synopsis: null,
            save: null
        },
        largeRhombus: null,
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.1,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0
                },
                time: 0.1,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        buttonGroup: null,

        init: function () {
            this.parent();
            this.hook.size.x = ig.system.width;
            this.hook.size.y = ig.system.height;
            this.buttonGroup = new sc.ButtonGroup;
            this.buttons.quest = this._createButton("quests", 0, function () {
                sc.menu.pushMenu(sc.MENU_SUBMENU.QUESTS)
            }.bind(this));
            this.buttons.skills = this._createButton("skills", 1, function () {
                    sc.menu.pushMenu(sc.MENU_SUBMENU.SKILLS)
                }.bind(this),
                sc.model.player.getCore("MENU_CIRCUIT"));
            this.buttons.equipment = this._createButton("equipment", 2, function () {
                sc.menu.pushMenu(sc.MENU_SUBMENU.EQUIPMENT)
            }.bind(this));
            this.buttons.items = this._createButton("items", 3, function () {
                sc.menu.pushMenu(sc.MENU_SUBMENU.ITEMS)
            }.bind(this));
            this.buttons.social = this._createButton("social", 4, function () {
                sc.menu.pushMenu(sc.MENU_SUBMENU.SOCIAL)
            }.bind(this), sc.model.player.getCore("MENU_SOCIAL"));
            this.buttons.status = this._createButton("status", 5, function () {
                sc.menu.pushMenu(sc.MENU_SUBMENU.STATUS)
            }.bind(this));
            this.buttons.synopsis = this._createButton("synopsis", 6, function () {
                sc.menu.pushMenu(sc.MENU_SUBMENU.SYNOPSIS)
            }.bind(this), false, true);
            this.buttons.save = this._createButton("save", 7, function () {
                sc.menu.pushMenu(sc.MENU_SUBMENU.SAVE)
            }.bind(this));
            this.buttons.social.setActive(false);
            var rhombus = new sc.StartMenu.LargeRhombus;
            rhombus.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_CENTER);
            this.largeRhombus = rhombus;
            this.addChildGui(this.largeRhombus);
            for (var key in this.buttons) this.addChildGui(this.buttons[key]);
            this.buttonGroup.addFocusGui(this.buttons.quest, 0, 0);
            this.buttonGroup.addFocusGui(this.buttons.skills, 0, 1);
            this.buttonGroup.addFocusGui(this.buttons.equipment, 0, 2);
            this.buttonGroup.addFocusGui(this.buttons.items, 0, 3);
            this.buttonGroup.addFocusGui(this.buttons.social, 0, 4);
            this.buttonGroup.addFocusGui(this.buttons.status, 0, 5);
            this.buttonGroup.addFocusGui(this.buttons.synopsis, 0, 6);
            this.buttonGroup.addFocusGui(this.buttons.save, 0, 7);
            this.buttonGroup.addSelectionCallback(function (button) {
                if (button.active || button == this.buttons.save) sc.menu.setInfoText(button.data);
                else sc.menu.setInfoText("???")
            }.bind(this));
            this.buttonGroup.setMouseFocusLostCallback(function () {
                sc.menu.setInfoText("", true)
            });
            this.doStateTransition("DEFAULT")
        },

        showMenu: function () {
            if (sc.model.player.getCore(sc.PLAYER_CORE.MENU_SYNOPSIS)) {
                this.buttons.synopsis.setText(ig.lang.get("sc.gui.menu.menu-titles.synopsis"), true);
                this.buttons.synopsis.setActive(true);
                if ((sc.menu.hasNewUnlock(sc.MENU_SUBMENU.LORE) || sc.menu.hasNewUnlock(sc.MENU_SUBMENU.TROPHY)) && sc.model.player.hasItem(135)) this.buttons.synopsis.activateNewOverlay();
                else this.buttons.synopsis.deactivateNewOverlay()
            } else {
                this.buttons.synopsis.deactivateNewOverlay();
                this.buttons.synopsis.setText("???", true);
                this.buttons.synopsis.setActive(false)
            }
            if (sc.model.player.getCore(sc.PLAYER_CORE.MENU_CIRCUIT)) {
                this.buttons.skills.setText(ig.lang.get("sc.gui.menu.menu-titles.skills"), true);
                this.buttons.skills.setActive(true)
            } else {
                this.buttons.skills.setText("???", true);
                this.buttons.skills.setActive(false)
            }
            if (sc.model.player.getCore(sc.PLAYER_CORE.MENU_SOCIAL)) {
                this.buttons.social.setText(ig.lang.get("sc.gui.menu.menu-titles.social"), true);
                this.buttons.social.setActive(true)
            } else {
                this.buttons.social.setText("???", true);
                this.buttons.social.setActive(false)
            }
            if (!sc.model.isSaveAllowed() && !sc.autoControl.isActive()) {
                this.buttons.save.setActive(false);
                this.buttons.social.setActive(false)
            } else this.buttons.save.setActive(true);
            this.buttons.quest.doStateTransition("DEFAULT");
            this.buttons.skills.doStateTransition("DEFAULT", false, false, null, 0.016);
            this.buttons.equipment.doStateTransition("DEFAULT", false, false, null, 0.032);
            this.buttons.items.doStateTransition("DEFAULT", false, false, null, 0.048);
            this.buttons.social.doStateTransition("DEFAULT", false, false, null, 0.048);
            this.buttons.status.doStateTransition("DEFAULT", false, false, null, 0.032);
            this.buttons.synopsis.doStateTransition("DEFAULT", false, false, null, 0.016);
            this.buttons.save.doStateTransition("DEFAULT");
            this.largeRhombus.doStateTransition("DEFAULT", false, false, null, 0.016);
            sc.menu.buttonInteract.pushButtonGroup(this.buttonGroup)
        },

        hideMenu: function () {
            var button = null,
                key;
            for (key in this.buttons) {
                if (button = this.buttons[key]) button.doStateTransition("HIDDEN")
            }
            this.largeRhombus.doStateTransition("HIDDEN");
            sc.menu.buttonInteract.removeButtonGroup(this.buttonGroup)
        },

        exitMenu: function () {
            this.hideMenu(null)
        },

        resetButtonFocus: function () {
            this.buttonGroup.setCurrentFocus(0, 0)
        },

        _createButton: function (key, index, onPress, unlocked, useNewUnlockButton) {
            var button = null,
                button = useNewUnlockButton ? new sc.NewUnlockButton(unlocked ? "???" : ig.lang.get("sc.gui.menu.menu-titles." + key), sc.BUTTON_MENU_WIDTH) : new sc.ButtonGui(unlocked ? "???" : ig.lang.get("sc.gui.menu.menu-titles." + key), sc.BUTTON_MENU_WIDTH);
            button.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            button.setPos(BUTTON_POSITIONS[index].x, BUTTON_POSITIONS[index].y);
            button.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                },
                HIDDEN: {
                    state: {
                        offsetX: -(sc.BUTTON_MENU_WIDTH + BUTTON_POSITIONS[index].x)
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            button.setData(ig.lang.get("sc.gui.menu.description." + key));
            button.onButtonPress = onPress;
            button.doStateTransition("HIDDEN", true);
            return button
        }
    });

    sc.StartMenu.LargeRhombus = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        transitions: {
            DEFAULT: {
                state: {
                    alpha: 0.5
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE
            },
            HIDDEN: {
                state: {
                    offsetX: -141,
                    alpha: 0.5
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },

        init: function () {
            this.parent();
            this.hook.size.x = 141;
            this.hook.size.y = 279
        },

        updateDrawables: function (ctx) {
            ctx.addGfx(this.gfx, 0, 0, 32, 0, 141, 279)
        }
    })
});
ig.baked = !0;

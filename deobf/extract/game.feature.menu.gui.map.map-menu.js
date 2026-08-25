ig.module("game.feature.menu.gui.map.map-menu").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.map.map-misc", "game.feature.menu.gui.map.map-stamp", "game.feature.menu.gui.map.map-area", "game.feature.menu.gui.map.map-worldmap").defines(function() {
    sc.MapMenu = sc.BaseMenu.extend({
        hotkeyHelp: null,
        hotkeyWorldmap: null,
        hotkeyCenter: null,
        area: null,
        floorButtons: null,
        emptyMap: null,
        chestDisplay: null,
        stampDisplay: null,
        worldmap: null,
        curArea: null,
        stamps: null,
        helpGui: null,
        init: function() {
            this.parent();
            this.hook.size.x = ig.system.width;
            this.hook.size.y = ig.system.height;
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
            this.hotkeyHelp.onButtonPress = this.onHelpButtonPressed.bind(this);
            this.hotkeyCenter = new sc.ButtonGui("\\i[help3]" + ig.lang.get("sc.gui.menu.hotkeys.center-map"), void 0, true, sc.BUTTON_TYPE.SMALL);
            this.hotkeyCenter.submitSound = null;
            this.hotkeyCenter.keepMouseFocus = true;
            this.hotkeyCenter.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                },
                HIDDEN: {
                    state: {
                        offsetY: -this.hotkeyCenter.hook.size.y
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.hotkeyCenter.onButtonPress = this.onCenterButtonPressed.bind(this);
            this.hotkeyWorldmap = new sc.ButtonGui("\\i[help2]" +
                ig.lang.get("sc.gui.menu.hotkeys.worldmap"), void 0, true, sc.BUTTON_TYPE.SMALL);
            this.hotkeyWorldmap.keepMouseFocus = true;
            this.hotkeyWorldmap.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                },
                HIDDEN: {
                    state: {
                        offsetY: -this.hotkeyWorldmap.hook.size.y
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.hotkeyWorldmap.onButtonPress = this.onWorldmapButtonPressed.bind(this);
            this.area = new sc.MapAreaContainer;
            this.addChildGui(new sc.DummyContainer(this.area));
            this.worldmap = new sc.MapWorldMap;
            this.addChildGui(this.worldmap);
            this.floorButtons = new sc.MapFloorButtonContainer;
            this.addChildGui(this.floorButtons);
            this.chestDisplay = new sc.MapChestDisplay;
            this.addChildGui(this.chestDisplay);
            this.stampDisplay = new sc.MapStampDisplay;
            this.addChildGui(this.stampDisplay);
            this.curArea = new sc.CurrentAreaDisplay;
            this.addChildGui(this.curArea);
            this.emptyMap = new sc.TextGui("???");
            this.emptyMap.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.emptyMap.hook.transitions = {
                DEFAULT: {
                    state: {},
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
            this.emptyMap.doStateTransition("HIDDEN", true);
            this.addChildGui(this.emptyMap);
            this.stamps = new sc.StampEditMenu;
            this.addChildGui(this.stamps);
            this.doStateTransition("DEFAULT")
        },
        addObservers: function() {
            sc.Model.addObserver(sc.menu, this);
            this.area.addObservers();
            this.floorButtons.addObservers();
            this.worldmap.addObservers();
            this.curArea.addObservers()
        },
        removeObservers: function() {
            sc.Model.removeObserver(sc.menu,
                this);
            this.area.removeObservers();
            this.floorButtons.removeObservers();
            this.worldmap.removeObservers();
            this.curArea.removeObservers()
        },
        showMenu: function() {
            this.addObservers();
            sc.menu.pushBackCallback(this.onBackButtonPress.bind(this));
            sc.menu.moveLeaSprite(0, 0, sc.MENU_LEA_STATE.HIDDEN);
            ig.interact.setBlockDelay(0.2);
            this.onAddHotkeys();
            sc.map.getCurrentArea() || this.emptyMap.doStateTransition("DEFAULT");
            this.worldmap.doStateTransition("HIDDEN", true);
            this.area.showMenu();
            this.floorButtons.showMenu();
            this.curArea.showMenu();
            this.chestDisplay.doStateTransition("DEFAULT");
            this.stampDisplay.doStateTransition("DEFAULT")
        },
        hideMenu: function() {
            this.removeObservers();
            sc.menu.moveLeaSprite(0, 0, sc.MENU_LEA_STATE.LARGE);
            this.exitMenu()
        },
        exitMenu: function() {
            sc.menu.buttonInteract.removeGlobalButton(this.hotkeyHelp);
            sc.menu.buttonInteract.removeGlobalButton(this.hotkeyCenter);
            sc.menu.buttonInteract.removeGlobalButton(this.hotkeyWorldmap);
            sc.menu.mapWorldFirstVisit = false;
            this.helpGui = null;
            this.emptyMap.doStateTransition("HIDDEN");
            this.area.exitMenu();
            this.floorButtons.exitMenu();
            this.curArea.exitMenu();
            this.worldmap.hide();
            this.chestDisplay.doStateTransition("HIDDEN");
            this.stampDisplay.doStateTransition("HIDDEN");
            this.stamps.hide()
        },
        onHotkeyHelpCheck: function() {
            return sc.control.menuHotkeyHelp()
        },
        onHelpButtonPressed: function() {
            sc.menu.removeHotkeys();
            this.createHelpGui();
            ig.gui.addGuiElement(this.helpGui);
            this.helpGui.openMenu()
        },
        onHotkeyCenterCheck: function() {
            return sc.control.menuHotkeyHelp3()
        },
        onHotkeyWorldmapCheck: function() {
            return sc.control.menuHotkeyHelp2()
        },
        onCenterButtonPressed: function(b) {
            if (b) this.area.addStamp();
            else {
                sc.BUTTON_SOUND.submit.play();
                b = ig.lang.get("sc.gui.menu.map-menu.popupTitle") + "\n\n" + ig.lang.get("sc.gui.menu.map-menu.popupDesc");
                b = new sc.CenterMsgBoxGui(b, {
                    maxWidth: 300,
                    speed: ig.TextBlock.SPEED.IMMEDIATE
                }, "black", 0.9);
                b.hook.zIndex = 15E4;
                b.hook.pauseGui = true;
                ig.gui.addGuiElement(b)
            }
        },
        onWorldmapButtonPressed: function() {
            if (sc.menu.mapWorldmapActive) {
                sc.menu.setInfoText("", true);
                sc.menu.exitWorldMap()
            } else sc.menu.enterWorldMap()
        },
        createHelpGui: function() {
            if (!this.helpGui) {
                this.helpGui =
                    new sc.HelpScreen(this, ig.lang.get("sc.gui.menu.help-texts.map.title"), ig.lang.get("sc.gui.menu.help-texts.map.pages"), function() {
                        this.commitHotKeysToTopBar(true)
                    }.bind(this), true);
                this.helpGui.hook.zIndex = 15E4;
                this.helpGui.hook.pauseGui = true
            }
        },
        onAddHotkeys: function(b) {
            sc.menu.buttonInteract.addGlobalButton(this.hotkeyHelp, this.onHotkeyHelpCheck.bind(this));
            sc.menu.buttonInteract.addGlobalButton(this.hotkeyCenter, this.onHotkeyCenterCheck.bind(this));
            sc.menu.buttonInteract.addGlobalButton(this.hotkeyWorldmap,
                this.onHotkeyWorldmapCheck.bind(this));
            this.commitHotKeysToTopBar(b)
        },
        commitHotKeysToTopBar: function(b) {
            sc.menu.addHotkey(function() {
                return this.hotkeyWorldmap
            }.bind(this));
            sc.menu.addHotkey(function() {
                return this.hotkeyCenter
            }.bind(this));
            sc.menu.addHotkey(function() {
                return this.hotkeyHelp
            }.bind(this));
            sc.menu.commitHotkeys(b)
        },
        onBackButtonPress: function() {
            sc.menu.popBackCallback();
            sc.menu.popMenu()
        },
        modelChanged: function(b, a, d) {
            if (b == sc.menu)
                if (a == sc.MENU_EVENT.MAP_WORLDMAP_STATE) {
                    this.stamps.hide(true);
                    if (d) {
                        this.hotkeyCenter.setActive(false);
                        this.chestDisplay.doStateTransition("HIDDEN");
                        this.stampDisplay.doStateTransition("HIDDEN")
                    } else {
                        this.hotkeyCenter.setActive(true);
                        this.chestDisplay.doStateTransition("DEFAULT");
                        this.stampDisplay.doStateTransition("DEFAULT")
                    }
                } else if (a == sc.MENU_EVENT.MAP_AREA_LOAD_DONE) {
                this.hotkeyCenter.setActive(true);
                this.chestDisplay.update();
                this.stampDisplay.update();
                this.chestDisplay.doStateTransition("DEFAULT");
                this.stampDisplay.doStateTransition("DEFAULT")
            } else if (a ==
                sc.MENU_EVENT.MAP_OPEN_STAMPS) {
                this.stamps.hide(true);
                this.stamps.show(d)
            }
        }
    })
});
ig.baked = !0;

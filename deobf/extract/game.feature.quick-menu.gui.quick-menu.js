ig.module("game.feature.quick-menu.gui.quick-menu").requires("impact.base.image", "impact.feature.gui.gui", "game.feature.quick-menu.gui.quick-screen", "game.feature.quick-menu.gui.circle-menu", "game.feature.quick-menu.gui.quick-item-menu", "game.feature.quick-menu.gui.quick-party", "game.feature.menu.gui.menu-misc").defines(function() {
    sc.QuickMenu = ig.GuiElementBase.extend({
        ringmenu: null,
        items: null,
        analysis: null,
        party: null,
        location: null,
        info: null,
        buffInfo: null,
        buffStats: null,
        backButton: null,
        init: function() {
            this.parent();
            this.setSize(ig.system.width, ig.system.height);
            this.setPivot(ig.system.width / 2, ig.system.height / 2);
            this.hook.zIndex = 1180;
            this.hook.pauseGui = true;
            sc.Model.addObserver(sc.model, this);
            sc.Model.addObserver(sc.map, this);
            sc.Model.addObserver(sc.quickmodel, this);
            sc.Model.addObserver(sc.message, this);
            this.analysis = new sc.QuickMenuAnalysis;
            this.addChildGui(this.analysis);
            this.ringmenu = new sc.QuickRingMenu;
            this.addChildGui(this.ringmenu);
            this.items = new sc.QuickItemMenu(this.ringmenu, this.ringmenu.items);
            this.addChildGui(this.items);
            this.party = new sc.QuickPartyStrategyMenu(this.ringmenu, this.ringmenu.items);
            this.addChildGui(this.party);
            this.info = new sc.InfoBar;
            this.info.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.addChildGui(this.info);
            this.buffInfo = new sc.BuffInfo;
            this.info.addChildGui(this.buffInfo);
            this.buffStats = new sc.QuickMenuBuffsGui;
            this.addChildGui(this.buffStats);
            this.location = new sc.QuickLocationBox;
            this.location.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.location.setPos(0, 16);
            this.addChildGui(this.location);
            this.doStateTransition("DEFAULT")
        },
        _checkBackButtonInput: function() {
            return sc.control.menuBack()
        },
        _enterMenu: function() {
            sc.quickmodel.enterQuickMenu();
            sc.mapInteract.forceHide();
            sc.model.clearTopMessage();
            this.buffInfo.setText("");
            this.buffStats.hide(true);
            this.ringmenu.enter();
            this.analysis.show();
            sc.options.get("quick-location") != sc.QUICK_LOCATION_OPTION.NONE && !sc.arena.active && this.location.show();
            ig.interact.setBlockDelay(0.2)
        },
        _exitMenu: function() {
            sc.quickmodel.buttonInteract.clearAllButtons();
            this.ringmenu.exit();
            this.analysis.hide();
            this.info.doStateTransition("HIDDEN");
            sc.quickmodel.exitQuickMenu();
            ig.interact.setBlockDelay(0.2);
            this.location.hide();
            this.buffStats.hide();
            sc.mapInteract.forceShow()
        },
        _setInfoBarAndLocation: function() {
            sc.quickmodel.isQuickItems() || sc.quickmodel.isQuickParty() ? this.info.doStateTransition("DEFAULT") : this.info.doStateTransition("HIDDEN");
            if (sc.quickmodel.isQuickCheck() || sc.quickmodel.isQuickItems() || sc.quickmodel.isQuickParty()) this.location.hide();
            else if (sc.options.get("quick-location") !=
                sc.QUICK_LOCATION_OPTION.NONE) {
                this.location.doPosTranstition(0, 10, 0.2, KEY_SPLINES.LINEAR);
                sc.arena.active || this.location.show()
            }
        },
        modelChanged: function(b, a, d) {
            if (b == sc.model) {
                b.isCutscene() && this.location.forceHide();
                if (a == sc.GAME_MODEL_MSG.SUB_STATE_CHANGED) {
                    sc.model.isPaused() && this.location.forceHide();
                    sc.model.isQuickMenu() ? this._enterMenu() : this._exitMenu()
                }
            } else if (b == sc.quickmodel)
                if (a == sc.QUICK_MODEL_EVENT.SWITCH_STATE) {
                    this._setInfoBarAndLocation();
                    this.buffStats.hide();
                    this.buffInfo.setText("")
                } else if (a ==
                sc.QUICK_MODEL_EVENT.INFO_TEXT_CHANGED) this.info.setText(sc.quickmodel.infoText, d ? 0.5 : 0);
            else {
                if (a == sc.QUICK_MODEL_EVENT.BUFF_TEXT_CHANGED) {
                    d = d || false;
                    this.buffInfo.setText(sc.quickmodel.buffText, d ? 0.5 : 0);
                    this.buffStats.show(sc.quickmodel.buffID, d ? 0.5 : 0)
                }
            } else b == sc.map ? a == sc.MAP_EVENT.MAP_ENTERED && sc.options.get("quick-location") == sc.QUICK_LOCATION_OPTION.MAP && !sc.model.isCutscene() && sc.model.player.getCore(sc.PLAYER_CORE.QUICK_MENU) && (sc.arena.active || this.location.show(true)) : b == sc.message && a ==
                sc.MESSAGE_EVENT.NEW_SIDE_MESSAGE && this.location.forceHide()
        }
    })
});
ig.baked = !0;

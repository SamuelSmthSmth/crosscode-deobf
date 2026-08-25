ig.module("game.feature.menu.gui.new-game.new-game-list").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.gui.base.box", "game.feature.gui.base.text", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.list-boxes", "game.feature.menu.gui.new-game.new-game-misc").defines(function() {
    sc.NewGameList = ig.GuiElementBase.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    offsetX: -184
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        gfx: new ig.Image("media/gui/menu.png"),
        sets: [],
        list: null,
        buttongroup: null,
        toggleOnSound: null,
        toggleOffSound: null,
        _curElement: -1,
        init: function() {
            this.parent();
            this.setSize(368, 263);
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.toggleOnSound = sc.BUTTON_SOUND.toggle_on;
            this.toggleOffSound = sc.BUTTON_SOUND.toggle_off;
            var b = new sc.MenuPanel;
            b.setSize(368, 263);
            b.setPos(0, 0);
            this.addChildGui(b);
            this.list = new sc.MultiColumnItemListBox(1, 182, sc.LIST_COLUMNS.TWO, 1);
            this.list.setPos(0, 5);
            this.list.setSize(368,
                251);
            this.list.setSelectState("HIDDEN", true);
            this.list.list.onGetHeightAtIndex = this.onGetHeightAtIndex.bind(this);
            this.addChildGui(this.list);
            for (b = this.list.quantities.length; b--;) {
                this.list.quantities[b].setText(ig.lang.get("sc.gui.shop.cost"));
                this.list.quantities[b].hook.pos.x = this.list.quantities[b].hook.pos.x + 2
            }
            this.buttongroup = this.list.buttonGroup();
            this.buttongroup.setMouseFocusLostCallback(function() {
                sc.menu.setInfoText("", true);
                sc.menu.setBuffText("", true);
                this._curElement = null
            }.bind(this));
            this.buttongroup.addSelectionCallback(function(a) {
                if (a.data) {
                    this._curElement = a;
                    sc.menu.setInfoText(a.data.description ? a.data.description : a.data);
                    a.data.id && sc.menu.setItemInfo(a.data.id)
                }
            }.bind(this));
            this.buttongroup.addPressCallback(this.onItemButtonPressed.bind(this));
            this.createListEntries();
            this.doStateTransition("HIDDEN", true)
        },
        createListEntries: function() {
            this.buttongroup.clear();
            this.list.clear(true);
            this.sets.length = 0;
            this.list.list.columns = 1;
            this.list.list.paddingTop = 1;
            var b = 0,
                a = {
                    counter: 0
                },
                d = 0,
                c;
            for (c in sc.NEW_GAME_SETS) {
                a.counter = 0;
                var e = new sc.NewGameToggleSet(c, this.list, b, d, a);
                this.list.addButton(e, true);
                b = b + Math.ceil(a.counter / 2);
                this.sets[d] = e;
                d++
            }
            this.list.list.paddingTop = 1;
            this.list.list.columns = 2;
            this.buttongroup.fillEmptySpace()
        },
        updateEntries: function(b) {
            for (var a = sc.trophies.getTotalPoints(), d = sc.newgame.getCost(), c = sc.trophies.getTotalPoints() - sc.newgame.getCost(), e = this.sets.length; e--;) this.sets[e].updateActiveState(a, d, c);
            b || sc.menu.setSynopPressed()
        },
        addObservers: function() {
            sc.Model.addObserver(sc.menu,
                this)
        },
        removeObservers: function() {
            sc.Model.removeObserver(sc.menu, this)
        },
        show: function() {
            ig.interact.setBlockDelay(0.2);
            sc.menu.newGameViewMode || this.updateEntries(true);
            this.list.activate();
            this.doStateTransition("DEFAULT")
        },
        hide: function() {
            this.list.deactivate();
            sc.menu.setInfoText("", false);
            sc.menu.setBuffText("", false);
            this.doStateTransition("HIDDEN")
        },
        onGetHeightAtIndex: function(b, a) {
            var d = this.buttongroup.getYElementAt(a);
            d || (d = this.buttongroup.getElementAt(this.buttongroup.current.x - 1, a));
            var c = 0;
            a >= 0 && d && (c = c + (d.setGui.hook.pos.y + d.hook.pos.y + d.hook.size.y));
            return c
        },
        onItemButtonPressed: function(b) {
            if (!sc.menu.newGameViewMode) {
                var a = sc.newgame.toggle(b.data.id, b.setKey);
                a ? this.toggleOnSound.play() : this.toggleOffSound.play();
                a ? b.setGui.updateTogglesStates(b) : b.setGui.updateTogglesStates();
                this.updateEntries()
            }
        },
        isNonMouseMenuInput: function() {
            return sc.control.menuConfirm() || sc.control.rightDown() || sc.control.leftDown() || sc.control.downDown() || sc.control.upDown() || sc.control.menuCircleLeft() ||
                sc.control.menuCircleRight()
        },
        modelChanged: function() {}
    })
});
ig.baked = !0;

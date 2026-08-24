/**
 * game.feature.menu.gui.new-game.new-game-list
 * ============================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.new-game.new-game-list")`.
 *
 * `sc.NewGameList`: the New Game+ option list — one `sc.NewGameToggleSet`
 * row per set in `sc.NEW_GAME_SETS`, laid out in a two-column
 * `sc.MultiColumnItemListBox` with per-row height lookup, cost/owned
 * columns and toggle press handling.
 */
ig.module("game.feature.menu.gui.new-game.new-game-list")
    .requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.gui.base.box", "game.feature.gui.base.text", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.list-boxes", "game.feature.menu.gui.new-game.new-game-misc")
    .defines(function () {

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

        init: function () {
            this.parent();
            this.setSize(368, 263);
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.toggleOnSound = sc.BUTTON_SOUND.toggle_on;
            this.toggleOffSound = sc.BUTTON_SOUND.toggle_off;
            var panel = new sc.MenuPanel;
            panel.setSize(368, 263);
            panel.setPos(0, 0);
            this.addChildGui(panel);
            this.list = new sc.MultiColumnItemListBox(1, 182, sc.LIST_COLUMNS.TWO, 1);
            this.list.setPos(0, 5);
            this.list.setSize(368, 251);
            this.list.setSelectState("HIDDEN", true);
            this.list.list.onGetHeightAtIndex = this.onGetHeightAtIndex.bind(this);
            this.addChildGui(this.list);
            for (var i = this.list.quantities.length; i--;) {
                this.list.quantities[i].setText(ig.lang.get("sc.gui.shop.cost"));
                this.list.quantities[i].hook.pos.x = this.list.quantities[i].hook.pos.x + 2
            }
            this.buttongroup = this.list.buttonGroup();
            this.buttongroup.setMouseFocusLostCallback(function () {
                sc.menu.setInfoText("", true);
                sc.menu.setBuffText("", true);
                this._curElement = null
            }.bind(this));
            this.buttongroup.addSelectionCallback(function (button) {
                if (button.data) {
                    this._curElement = button;
                    sc.menu.setInfoText(button.data.description ? button.data.description : button.data);
                    button.data.id && sc.menu.setItemInfo(button.data.id)
                }
            }.bind(this));
            this.buttongroup.addPressCallback(this.onItemButtonPressed.bind(this));
            this.createListEntries();
            this.doStateTransition("HIDDEN", true)
        },

        createListEntries: function () {
            this.buttongroup.clear();
            this.list.clear(true);
            this.sets.length = 0;
            this.list.list.columns = 1;
            this.list.list.paddingTop = 1;
            var row = 0,
                counter = {
                    counter: 0
                },
                setIndex = 0;
            for (var key in sc.NEW_GAME_SETS) {
                counter.counter = 0;
                var set = new sc.NewGameToggleSet(key, this.list, row, setIndex, counter);
                this.list.addButton(set, true);
                row = row + Math.ceil(counter.counter / 2);
                this.sets[setIndex] = set;
                setIndex++
            }
            this.list.list.paddingTop = 1;
            this.list.list.columns = 2;
            this.buttongroup.fillEmptySpace()
        },

        updateEntries: function (skipEvent) {
            for (var totalPoints = sc.trophies.getTotalPoints(), cost = sc.newgame.getCost(), rest = sc.trophies.getTotalPoints() - sc.newgame.getCost(), i = this.sets.length; i--;) this.sets[i].updateActiveState(totalPoints, cost, rest);
            skipEvent || sc.menu.setSynopPressed()
        },

        addObservers: function () {
            sc.Model.addObserver(sc.menu, this)
        },

        removeObservers: function () {
            sc.Model.removeObserver(sc.menu, this)
        },

        show: function () {
            ig.interact.setBlockDelay(0.2);
            sc.menu.newGameViewMode || this.updateEntries(true);
            this.list.activate();
            this.doStateTransition("DEFAULT")
        },

        hide: function () {
            this.list.deactivate();
            sc.menu.setInfoText("", false);
            sc.menu.setBuffText("", false);
            this.doStateTransition("HIDDEN")
        },

        onGetHeightAtIndex: function (x, y) {
            var element = this.buttongroup.getYElementAt(y);
            element || (element = this.buttongroup.getElementAt(this.buttongroup.current.x - 1, y));
            var height = 0;
            y >= 0 && element && (height = height + (element.setGui.hook.pos.y + element.hook.pos.y + element.hook.size.y));
            return height
        },

        onItemButtonPressed: function (button) {
            if (!sc.menu.newGameViewMode) {
                var toggled = sc.newgame.toggle(button.data.id, button.setKey);
                toggled ? this.toggleOnSound.play() : this.toggleOffSound.play();
                toggled ? button.setGui.updateTogglesStates(button) : button.setGui.updateTogglesStates();
                this.updateEntries()
            }
        },

        isNonMouseMenuInput: function () {
            return sc.control.menuConfirm() || sc.control.rightDown() || sc.control.leftDown() || sc.control.downDown() || sc.control.upDown() || sc.control.menuCircleLeft() || sc.control.menuCircleRight()
        },

        modelChanged: function () {}
    })
});
ig.baked = !0;

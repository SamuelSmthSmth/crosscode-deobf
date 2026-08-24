/**
 * game.feature.menu.gui.item.item-sort-menu
 * =========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.item.item-sort-menu")`.
 *
 * `sc.SortMenu`: a small popup box listing the sort options of the item
 * list (auto/name/amount/rarity). `sc.ItemSortMenu` wires it up with the
 * four sort buttons and applies the chosen sort to the item list.
 */
ig.module("game.feature.menu.gui.item.item-sort-menu")
    .requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.gui.base.box")
    .defines(function () {

    sc.SortMenu = ig.BoxGui.extend({
        ninepatch: new ig.NinePatch("media/gui/menu.png", {
            width: 8,
            height: 8,
            left: 8,
            top: 8,
            right: 8,
            bottom: 8,
            offsets: {
                "default": {
                    x: 480,
                    y: 304
                }
            }
        }),
        transitions: {
            HIDDEN: {
                state: {
                    alpha: 0,
                    scaleX: 0.2,
                    scaleY: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE
            }
        },
        buttongroup: null,
        buttons: [],
        active: false,
        yPosition: 3,
        callback: null,
        backCallback: null,
        currentSortingText: null,

        init: function (callback, backCallback, width) {
            width = width || 102;
            this.parent(width, 85);
            this.setPivot(width, 0);
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.callback = callback;
            this.backCallback = backCallback;
            this.hook.zIndex = 1500;
            this.hook.pauseGui = true;
            this.hook.screenBlocking = true;
            this.buttongroup = new sc.ButtonGroup(false, ig.BUTTON_GROUP_SELECT_TYPE.VERTICAL);
            this.buttongroup.addPressCallback(function (button) {
                this.currentSortingText = button.name;
                this.callback && this.callback(button)
            }.bind(this));
            this.buttongroup.addSelectionCallback(function (button) {
                button.data && button.data.description && sc.menu.setInfoText(button.data.description ? button.data.description : button.data)
            }.bind(this));
            this.buttongroup.setMouseFocusLostCallback(function () {
                sc.menu.setInfoText("", true)
            }.bind(this));
            this.doStateTransition("HIDDEN", true)
        },

        addButton: function (sortKey, sortType, index) {
            this.yPosition = this._createButton(sortKey, sortType, this.yPosition, index);
            this.hook.size.y = this.yPosition + 2
        },

        setButtonKey: function (buttonIndex, sortKey) {
            this.buttons[buttonIndex].setText(ig.lang.get("sc.gui.menu.sort." + sortKey), true);
            this.buttons[buttonIndex].data.description = ig.lang.get("sc.gui.menu.sort.des." + sortKey)
        },

        showSortMenu: function (button) {
            this.showSortMenuAt(button.hook.pos.x, button.hook.size.y)
        },

        showSortMenuAt: function (x, y) {
            if (!this.active) {
                sc.menu.pushBackCallback(this.onBackButtonPress.bind(this));
                sc.menu.buttonInteract.pushButtonGroup(this.buttongroup);
                this.setPos(x, y);
                this.active = true;
                this.doStateTransition("DEFAULT")
            }
        },

        hideSortMenu: function () {
            if (this.active) {
                sc.menu.popBackCallback();
                sc.menu.buttonInteract.removeButtonGroup(this.buttongroup);
                this.active = false;
                this.doStateTransition("HIDDEN", false, true)
            }
        },

        onBackButtonPress: function () {
            this.hideSortMenu();
            this.backCallback && this.backCallback()
        },

        _createButton: function (sortKey, sortType, y, index) {
            var button = new sc.ButtonGui(ig.lang.get("sc.gui.menu.sort." + sortKey), this.hook.size.x - 6, true, sc.BUTTON_TYPE.ITEM);
            button.textChild.setPos(0, 0);
            button.textChild.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            button.setData({
                sortType: sortType,
                description: ig.lang.get("sc.gui.menu.sort.des." + sortKey),
                name: button.text
            });
            button.setPos(3, y);
            this.buttongroup.addFocusGui(button, 0, index);
            if (this.buttons.length == 0) {
                this.currentSortingText = button.text
            }
            this.buttons[index] = button;
            this.addChildGui(button);
            return y = y + button.hook.size.y
        }
    });

    sc.ItemSortMenu = sc.SortMenu.extend({
        init: function () {
            this.parent(this.onButtonPress.bind(this));
            this.addButton("auto", sc.SORT_TYPE.ORDER, 0);
            this.addButton("name", sc.SORT_TYPE.NAME, 1);
            this.addButton("amount", sc.SORT_TYPE.AMOUNT, 2);
            this.addButton("rarity", sc.SORT_TYPE.RARITY, 3)
        },

        onButtonPress: function (button) {
            if (button.data) {
                this.hideSortMenu();
                sc.menu.sortList(button)
            }
        }
    })
});
ig.baked = !0;

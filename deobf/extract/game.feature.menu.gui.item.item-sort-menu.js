ig.module("game.feature.menu.gui.item.item-sort-menu").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.gui.base.box").defines(function() {
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
        init: function(b, a, d) {
            d = d || 102;
            this.parent(d, 85);
            this.setPivot(d, 0);
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.callback = b;
            this.backCallback = a;
            this.hook.zIndex = 1500;
            this.hook.pauseGui = true;
            this.hook.screenBlocking = true;
            this.buttongroup = new sc.ButtonGroup(false, ig.BUTTON_GROUP_SELECT_TYPE.VERTICAL);
            this.buttongroup.addPressCallback(function(a) {
                this.currentSortingText = a.name;
                this.callback && this.callback(a)
            }.bind(this));
            this.buttongroup.addSelectionCallback(function(a) {
                a.data && a.data.description && sc.menu.setInfoText(a.data.description ? a.data.description : a.data)
            }.bind(this));
            this.buttongroup.setMouseFocusLostCallback(function() {
                sc.menu.setInfoText("", true)
            }.bind(this));
            this.doStateTransition("HIDDEN", true)
        },
        addButton: function(b, a, d) {
            this.yPosition = this._createButton(b, a, this.yPosition, d);
            this.hook.size.y = this.yPosition + 2
        },
        setButtonKey: function(b, a) {
            this.buttons[b].setText(ig.lang.get("sc.gui.menu.sort." + a), true);
            this.buttons[b].data.description = ig.lang.get("sc.gui.menu.sort.des." + a)
        },
        showSortMenu: function(b) {
            this.showSortMenuAt(b.hook.pos.x, b.hook.size.y)
        },
        showSortMenuAt: function(b, a) {
            if (!this.active) {
                sc.menu.pushBackCallback(this.onBackButtonPress.bind(this));
                sc.menu.buttonInteract.pushButtonGroup(this.buttongroup);
                this.setPos(b, a);
                this.active = true;
                this.doStateTransition("DEFAULT")
            }
        },
        hideSortMenu: function() {
            if (this.active) {
                sc.menu.popBackCallback();
                sc.menu.buttonInteract.removeButtonGroup(this.buttongroup);
                this.active = false;
                this.doStateTransition("HIDDEN", false, true)
            }
        },
        onBackButtonPress: function() {
            this.hideSortMenu();
            this.backCallback && this.backCallback()
        },
        _createButton: function(b, a, d, c) {
            var e = new sc.ButtonGui(ig.lang.get("sc.gui.menu.sort." + b), this.hook.size.x - 6, true, sc.BUTTON_TYPE.ITEM);
            e.textChild.setPos(0, 0);
            e.textChild.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            e.setData({
                sortType: a,
                description: ig.lang.get("sc.gui.menu.sort.des." + b),
                name: e.text
            });
            e.setPos(3, d);
            this.buttongroup.addFocusGui(e,
                0, c);
            if (this.buttons.length == 0) this.currentSortingText = e.text;
            this.buttons[c] = e;
            this.addChildGui(e);
            return d = d + e.hook.size.y
        }
    });
    sc.ItemSortMenu = sc.SortMenu.extend({
        init: function() {
            this.parent(this.onButtonPress.bind(this));
            this.addButton("auto", sc.SORT_TYPE.ORDER, 0);
            this.addButton("name", sc.SORT_TYPE.NAME, 1);
            this.addButton("amount", sc.SORT_TYPE.AMOUNT, 2);
            this.addButton("rarity", sc.SORT_TYPE.RARITY, 3)
        },
        onButtonPress: function(b) {
            if (b.data) {
                this.hideSortMenu();
                sc.menu.sortList(b)
            }
        }
    })
});
ig.baked = !0;

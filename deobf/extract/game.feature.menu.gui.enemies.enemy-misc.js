ig.module("game.feature.menu.gui.enemies.enemy-misc").requires("impact.feature.gui.base.box", "impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.enemies.enemy-pages").defines(function() {
    sc.EnemyInfoBox = ig.BoxGui.extend({
        gfx: new ig.Image("media/gui/basic.png"),
        ninepatch: new ig.NinePatch("media/gui/menu.png", {
            width: 2,
            height: 8,
            left: 27,
            top: 21,
            right: 27,
            bottom: 3,
            offsets: {
                "default": {
                    x: 520,
                    y: 0
                }
            }
        }),
        title: null,
        level: null,
        category: null,
        display: null,
        rightButton: null,
        leftButton: null,
        pagesNumberContainer: null,
        currentPage: null,
        maxPages: null,
        pages: [],
        enemy: null,
        page: -1,
        key: "-1s",
        init: function() {
            this.parent(281, 265);
            this.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
            this.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: -(this.hook.size.x / 2)
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.annotation = [];
            this.annotation[0] = {
                content: {
                    title: "sc.gui.menu.help.enemy.titles.type",
                    description: "sc.gui.menu.help.enemy.description.type"
                },
                offset: {
                    x: 4,
                    y: 2
                },
                size: {
                    x: 20,
                    y: 19
                },
                index: {
                    x: 0,
                    y: 0
                }
            };
            this.annotation[1] = {
                content: {
                    title: "sc.gui.menu.help.enemy.titles.level",
                    description: "sc.gui.menu.help.enemy.description.level"
                },
                offset: {
                    x: 257,
                    y: 2
                },
                size: {
                    x: 21,
                    y: 19
                },
                index: {
                    x: 1,
                    y: 0
                }
            };
            this.title = new sc.TextGui("");
            this.title.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.title.setPos(0, 4);
            this.addChildGui(this.title);
            this.category = new sc.TextGui("");
            this.category.setPos(7, 3);
            this.addChildGui(this.category);
            this.level = new sc.NumberGui(99, {
                leadingZeros: 2
            });
            this.level.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.level.setPos(5, 11);
            this.addChildGui(this.level);
            var b = new sc.EnemyPageGeneralInfo;
            b.setPos(6, 24);
            this.addChildGui(b);
            this.pages.push(b);
            b = new sc.EnemyPageMetaInfo;
            b.setPos(6, 24);
            this.addChildGui(b);
            this.pages.push(b);
            b = new ig.ColorGui("#545454", 277, 22);
            b.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_BOTTOM);
            b.setPos(0, 2);
            this.addChildGui(b);
            b = new sc.TextGui("lvl", {
                font: sc.fontsystem.tinyFont
            });
            b.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            b.setPos(6, 3);
            this.addChildGui(b);
            this.rightButton = new sc.ButtonGui("\\i[page-right]", 32, true, sc.BUTTON_TYPE.SMALL);
            this.rightButton.onButtonPress = this.onRightButtonPressed.bind(this);
            this.rightButton.textChild.setPos(1, 0);
            this.rightButton.keepMouseFocus = true;
            this.rightButton.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: 5
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.rightButton.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
            this.rightButton.setPos(2,
                2);
            this.addChildGui(this.rightButton);
            this.leftButton = new sc.ButtonGui("\\i[page-left]", 32, true, sc.BUTTON_TYPE.SMALL);
            this.leftButton.onButtonPress = this.onLeftButtonPressed.bind(this);
            this.leftButton.textChild.setPos(1, 0);
            this.leftButton.keepMouseFocus = true;
            this.leftButton.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: 5
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.leftButton.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.leftButton.setPos(2,
                2);
            this.addChildGui(this.leftButton);
            this.rightButton.doStateTransition("HIDDEN", true);
            this.leftButton.doStateTransition("HIDDEN", true);
            this.pagesNumberContainer = new ig.GuiElementBase;
            this.pagesNumberContainer.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_BOTTOM);
            this.pagesNumberContainer.setPos(0, 7);
            this.pagesNumberContainer.setSize(60, 8);
            this.pagesNumberContainer.hook.transitions = {
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
            b = new ig.ImageGui(this.gfx, 96, 0, 8, 8);
            b.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.pagesNumberContainer.addChildGui(b);
            this.currentPage = new sc.NumberGui(99);
            this.currentPage.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.currentPage.setPos(36, 0);
            this.pagesNumberContainer.addChildGui(this.currentPage);
            this.maxPages = new sc.NumberGui(null);
            this.maxPages.setNumber(this.pages.length, true);
            this.maxPages.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
            this.maxPages.setPos(36, 0);
            this.pagesNumberContainer.addChildGui(this.maxPages);
            this.addChildGui(this.pagesNumberContainer);
            this.setEnemy()
        },
        show: function() {
            for (var b = this.pages.length; b--;) this.page == b && this.enemy ? this.pages[b].doStateTransition("DEFAULT", true) : this.pages[b].doStateTransition("HIDDEN", true);
            this.doStateTransition("DEFAULT")
        },
        hide: function() {
            this.pages[0].display.setEnemy(null, true);
            this.page = -1;
            this.key = "-1s";
            this.doStateTransition("HIDDEN");
            sc.menu.buttonInteract.removeGlobalButton(this.rightButton);
            sc.menu.buttonInteract.removeGlobalButton(this.leftButton)
        },
        onRightButtonCheck: function() {
            return sc.control.rightPressed()
        },
        onLeftButtonCheck: function() {
            return sc.control.leftPressed()
        },
        onRightButtonPressed: function() {
            this.switchPage(1)
        },
        onLeftButtonPressed: function() {
            this.switchPage(-1)
        },
        setPage: function(b) {
            if (b != this.page) {
                this.page >= 0 && this.pages[this.page].doStateTransition("HIDDEN", true);
                this.page = b || 0;
                this.pages[this.page].doStateTransition("HIDDEN", true);
                this.pages[this.page].doStateTransition("DEFAULT", true);
                if (this.pages.length == 0) {
                    this.rightButton.doStateTransition("HIDDEN");
                    this.leftButton.doStateTransition("HIDDEN");
                    sc.menu.buttonInteract.removeGlobalButton(this.rightButton);
                    sc.menu.buttonInteract.removeGlobalButton(this.leftButton)
                }
                this.currentPage.setNumber(this.page + 1);
                if (this.pages.length == 1) {
                    this.rightButton.doStateTransition("HIDDEN", true);
                    this.leftButton.doStateTransition("HIDDEN", true);
                    sc.menu.buttonInteract.removeGlobalButton(this.rightButton);
                    sc.menu.buttonInteract.removeGlobalButton(this.leftButton)
                } else if (this.page == this.pages.length - 1) {
                    this.rightButton.doStateTransition("HIDDEN",
                        true);
                    sc.menu.buttonInteract.removeGlobalButton(this.rightButton);
                    this.leftButton.doStateTransition("DEFAULT", true);
                    sc.menu.buttonInteract.addGlobalButton(this.leftButton, this.onLeftButtonCheck.bind(this), true)
                } else {
                    if (this.page == 0) {
                        this.leftButton.doStateTransition("HIDDEN", true);
                        sc.menu.buttonInteract.removeGlobalButton(this.leftButton)
                    } else {
                        this.leftButton.doStateTransition("DEFAULT", true);
                        sc.menu.buttonInteract.addGlobalButton(this.leftButton, this.onLeftButtonCheck.bind(this), true)
                    }
                    this.rightButton.doStateTransition("DEFAULT",
                        true);
                    sc.menu.buttonInteract.addGlobalButton(this.rightButton, this.onRightButtonCheck.bind(this), true)
                }
            }
        },
        switchPage: function(b) {
            if (this.key && this.pages.length != 1) {
                var a = this.page,
                    a = a + b;
                a >= this.pages.length && (a = this.pages.length - 1);
                a < 0 && (a = 0);
                a != this.page && this.setPage(a)
            }
        },
        setCategory: function(b) {
            this.category.setText("\\i[enemy-" + b + "]")
        },
        setEnemy: function(b) {
            if (this.key != b) {
                var a = (this.enemy = (this.key = b) ? ig.database.get("enemies")[b] : null) ? sc.map.getAreaItemToggleState(sc.AREA_ITEM_TYPE.BOOSTER,
                        this.enemy.area) : false,
                    d = 1;
                if (this.enemy) {
                    d = a ? this.enemy.boostedLevel || sc.MIN_BOOSTER_LEVEL : this.enemy.level || 1;
                    this.title.setText(ig.LangLabel.getText(this.enemy.name));
                    this.level.setNumber(d)
                } else {
                    this.level.setNumber(0);
                    this.title.setText(ig.lang.get("sc.gui.menu.enemy.noEnemy"))
                }
                for (d = this.pages.length; d--;) this.pages[d].setData(b, this.enemy, this.page == -1 ? false : this.page != d, a);
                if (this.key) {
                    this.setPage(this.page == -1 ? 0 : this.page);
                    this.pagesNumberContainer.doStateTransition("DEFAULT", true)
                } else {
                    this.page >=
                        0 && this.pages[this.page].doStateTransition("HIDDEN", true);
                    this.page = -1;
                    this.pagesNumberContainer.doStateTransition("HIDDEN", true);
                    this.rightButton.doStateTransition("HIDDEN", true);
                    this.leftButton.doStateTransition("HIDDEN", true);
                    sc.menu.buttonInteract.removeGlobalButton(this.rightButton);
                    sc.menu.buttonInteract.removeGlobalButton(this.leftButton)
                }
            }
        }
    });
    sc.EnemyEntryButton = sc.ListBoxButton.extend({
        key: null,
        level: null,
        init: function(b, a, d) {
            this.parent(b, 236, 25);
            this.key = a || null;
            this.blockedSound = this.button.submitSound =
                null;
            if (d >= 0) {
                this.level = new sc.NumberGui(99);
                this.level.setNumber(d, true);
                this.level.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
                this.level.setPos(5, 7);
                this.addChildGui(this.level)
            }
        }
    })
});
ig.baked = !0;

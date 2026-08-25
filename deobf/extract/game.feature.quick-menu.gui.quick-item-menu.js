ig.module("game.feature.quick-menu.gui.quick-item-menu").requires("impact.base.image", "impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.interact.button-group", "game.feature.menu.gui.list-boxes", "game.feature.menu.gui.menu-misc").defines(function() {
    var b = Vec2.createC(0, 0);
    Vec2.createC(0, 0);
    sc.QuickItemArrow = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        transitions: {
            HIDDEN: {
                state: {
                    alpha: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        flipX: false,
        flipY: false,
        bottomAnchor: false,
        init: function() {
            this.parent();
            this.setSize(9, 15);
            this.doStateTransition("DEFAULT")
        },
        setPosition: function(a, b, c, e, f) {
            this.setPos(a, b);
            this.flipX = c || false;
            this.flipY = e || false;
            this.bottomAnchor = f || false
        },
        updateDrawables: function(a) {
            a.addGfx(this.gfx, 0, 0, this.bottomAnchor ? 444 : 434, 337, 9, 15, this.flipX, this.flipY)
        }
    });
    sc.QuickItemMenu = ig.BoxGui.extend({
        gfx: new ig.Image("media/gui/basic.png"),
        ninepatch: new ig.NinePatch("media/gui/menu.png", {
            width: 8,
            height: 8,
            left: 8,
            top: 8,
            right: 8,
            bottom: 8,
            offsets: {
                "default": {
                    x: 432,
                    y: 304
                },
                flipped: {
                    x: 456,
                    y: 304
                }
            }
        }),
        transitions: {
            HIDDEN: {
                state: {
                    alpha: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        base: null,
        anchor: null,
        list: null,
        arrow: null,
        buttongroup: null,
        _hidden: true,
        init: function(a, b) {
            this.parent(175, 147);
            this.base = a.hook;
            this.anchor = b.hook;
            this.buttongroup = new sc.ButtonGroup(false, ig.BUTTON_GROUP_SELECT_TYPE.VERTICAL);
            this.buttongroup.addSelectionCallback(this.onSelection.bind(this));
            this.buttongroup.addPressCallback(this.onPress.bind(this));
            this.buttongroup.setMouseFocusLostCallback(function() {
                sc.quickmodel.setInfoText("", true);
                sc.quickmodel.setBuffText("", true)
            }.bind(this));
            sc.Model.addObserver(sc.quickmodel, this);
            this.list = new sc.ButtonListBox(1, 0, 20);
            this.list.buttonInteract = sc.quickmodel.buttonInteract;
            this.list.setPos(2, 13);
            this.list.setSize(171, 123);
            this.list.setButtonGroup(this.buttongroup);
            this.list.showBottomBar = false;
            this.addChildGui(this.list);
            var c = new sc.TextGui(ig.lang.get("sc.gui.menu.select"), {
                speed: ig.TextBlock.SPEED.IMMEDIATE,
                font: sc.fontsystem.tinyFont
            });
            c.setPos(8, 6);
            this.addChildGui(c);
            c = new sc.TextGui(ig.lang.get("sc.gui.menu.quantity"), {
                speed: ig.TextBlock.SPEED.IMMEDIATE,
                font: sc.fontsystem.tinyFont
            });
            c.setPos(6, 6);
            c.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.addChildGui(c);
            var c = sc.model.player.params,
                e = {
                    size: sc.NUMBER_SIZE.TINY,
                    color: sc.GUI_NUMBER_COLOR.GREY
                };
            this.maxBuffs = new sc.NumberGui(4, e);
            this.maxBuffs.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
            this.maxBuffs.setPos(6,
                3);
            this.maxBuffs.setNumber(c.getMaxBuffs());
            this.addChildGui(this.maxBuffs);
            this.currentBuffs = new sc.NumberGui(4, e);
            this.currentBuffs.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
            this.currentBuffs.setPos(20, 3);
            this.currentBuffs.setNumber(c.currentItemBuffs);
            this.addChildGui(this.currentBuffs);
            c = new ig.ImageGui(this.gfx, 208, 18, 5, 5);
            c.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
            c.setPos(14, 4);
            this.addChildGui(c);
            c = new sc.TextGui(ig.lang.get("sc.gui.menu.item.buff") + ":", {
                font: sc.fontsystem.tinyFont
            });
            c.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
            c.setPos(28, 2);
            this.addChildGui(c);
            this.arrow = new sc.QuickItemArrow;
            this.addChildGui(this.arrow);
            this.doStateTransition("HIDDEN", true)
        },
        update: function() {
            if (this.isVisible() && (this.buttongroup.isActive() && !ig.interact.isBlocked()) && sc.control.menuBack()) {
                sc.BUTTON_SOUND.back.play();
                sc.quickmodel.enterNone()
            }
        },
        updateDrawables: function(a) {
            this.parent(a);
            a.addColor("#7E7E7E", 2, 135, 171, 1)
        },
        updateList: function(a) {
            var b = this.list.getScrollY(),
                c = this.buttongroup.current.y;
            if (!sc.options.get("quick-cursor")) c = b = 0;
            this.buttongroup.clear();
            this.list.clear(true);
            for (var e = sc.model.player, f = e.getItemSubList(sc.ITEMS_TYPES.CONS, sc.SORT_TYPE.ORDER, true), g = null, h = g = null, i = null, j = 0, k = 0, l = 0; l < f.length; l++) {
                k = e.items[f[l]] || 0;
                j++;
                i = sc.inventory.getItem(f[l]);
                new ig.LangLabel(i.name);
                g = "\\i[" + (i.icon + sc.inventory.getRaritySuffix(i.rarity || 0) || "item-default") + "]" + ig.LangLabel.getText(i.name);
                h = ig.LangLabel.getText(i.description);
                g = new sc.ItemBoxButton(g, 142, 26, k || 1, f[l], h, void 0,
                    void 0);
                i.isBuff && sc.model.player.params.hasMaxBuffs() && g.setActive(false);
                e.isFavorite(f[l]) && this.addFavoriteOverlay(g);
                this.list.addButton(g)
            }
            this.list._prevIndex = c;
            c = Math.min(c, Math.max(0, j - 1));
            ig.input.mouseGuiActive ? this.buttongroup.setCurrentFocus(0, c) : this.buttongroup.focusCurrentButton(0, c, false, a);
            this.list.scrollToY(b, true)
        },
        show: function() {
            if (this._hidden) {
                this._hidden = false;
                this.updateList(true);
                var a = this.hook;
                b.x = this.base.pos.x + this.anchor.pos.x + Math.floor(this.anchor.size.x / 2);
                b.y =
                    this.base.pos.y + this.anchor.pos.y + Math.floor(this.anchor.size.y / 2);
                var d = b.y + -46;
                b.y = Math.max(10, Math.min(ig.system.height - 137 - 10 - 22 - 70, b.y + -46));
                a.pos.y = b.y;
                if (b.x + 240 < ig.system.width) {
                    this.currentTileOffset = "default";
                    a.pos.x = b.x + 27 + 30;
                    a.doPosTranstition(b.x + 27, b.y, 0.2, KEY_SPLINES.EASE_OUT);
                    this.arrow.setPosition(-10, 42 + (d - b.y), false)
                } else {
                    this.currentTileOffset = "flipped";
                    a.pos.x = b.x - a.size.x - 27 - 30 - 1;
                    a.doPosTranstition(b.x - a.size.x - 27 - 1, b.y, 0.2, KEY_SPLINES.EASE_OUT);
                    this.arrow.setPosition(a.size.x +
                        1, 42 + (d - b.y), true)
                }
                a = sc.model.player.params;
                this.maxBuffs.setNumber(a.getMaxBuffs());
                this.currentBuffs.setNumber(a.currentItemBuffs);
                ig.interact.setBlockDelay(0.2);
                this.list.activate(sc.quickmodel.buttonInteract);
                this.doStateTransition("DEFAULT")
            }
        },
        hide: function() {
            if (!this._hidden) {
                this._hidden = true;
                this.list.deactivate(sc.quickmodel.buttonInteract);
                sc.quickmodel.setBuffText("", true);
                this.doStateTransition("HIDDEN")
            }
        },
        addFavoriteOverlay: function(a) {
            var b = new ig.ImageGui(this.ninepatch.gfx, 256, 480,
                19, 17);
            b.setPos(0, 0);
            a.addChildGui(b)
        },
        onSelection: function(a) {
            sc.quickmodel.setInfoText(a.data.description);
            a.data.id && (sc.inventory.isBuffID(a.data.id) ? sc.quickmodel.setBuffText(sc.inventory.getBuffString(a.data.id), null, a.data.id) : sc.quickmodel.setBuffText("", false))
        },
        onPress: function(a) {
            if (a.data && (!sc.inventory.isBuffID(a.data.id) || !sc.model.player.params.hasMaxBuffs())) {
                ig.game.playerEntity.useItem(a.data.id);
                sc.quickmodel.skipActiveState = true;
                sc.model.enterRunning()
            }
        },
        modelChanged: function(a,
            b) {
            a == sc.quickmodel && (b == sc.QUICK_MODEL_EVENT.SWITCH_STATE ? sc.quickmodel.isQuickItems() ? this.show() : this.hide() : b == sc.QUICK_MODEL_EVENT.EXIT_MENU && this.hide())
        }
    })
});
ig.baked = !0;

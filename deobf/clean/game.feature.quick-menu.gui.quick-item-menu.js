ig.module("game.feature.quick-menu.gui.quick-item-menu").requires("impact.base.image", "impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.interact.button-group", "game.feature.menu.gui.list-boxes", "game.feature.menu.gui.menu-misc").defines(function() {
    var tempVec = Vec2.createC(0, 0);
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
        setPosition: function(x, y, flipX, flipY, bottomAnchor) {
            this.setPos(x, y);
            this.flipX = flipX || false;
            this.flipY = flipY || false;
            this.bottomAnchor = bottomAnchor || false
        },
        updateDrawables: function(drawables) {
            drawables.addGfx(this.gfx, 0, 0, this.bottomAnchor ? 444 : 434, 337, 9, 15, this.flipX, this.flipY)
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
        init: function(base, anchor) {
            this.parent(175, 147);
            this.base = base.hook;
            this.anchor = anchor.hook;
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
            var label = new sc.TextGui(ig.lang.get("sc.gui.menu.select"), {
                speed: ig.TextBlock.SPEED.IMMEDIATE,
                font: sc.fontsystem.tinyFont
            });
            label.setPos(8, 6);
            this.addChildGui(label);
            label = new sc.TextGui(ig.lang.get("sc.gui.menu.quantity"), {
                speed: ig.TextBlock.SPEED.IMMEDIATE,
                font: sc.fontsystem.tinyFont
            });
            label.setPos(6, 6);
            label.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.addChildGui(label);
            var params = sc.model.player.params,
                numberStyle = {
                    size: sc.NUMBER_SIZE.TINY,
                    color: sc.GUI_NUMBER_COLOR.GREY
                };
            this.maxBuffs = new sc.NumberGui(4, numberStyle);
            this.maxBuffs.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
            this.maxBuffs.setPos(6,
                3);
            this.maxBuffs.setNumber(params.getMaxBuffs());
            this.addChildGui(this.maxBuffs);
            this.currentBuffs = new sc.NumberGui(4, numberStyle);
            this.currentBuffs.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
            this.currentBuffs.setPos(20, 3);
            this.currentBuffs.setNumber(params.currentItemBuffs);
            this.addChildGui(this.currentBuffs);
            label = new ig.ImageGui(this.gfx, 208, 18, 5, 5);
            label.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
            label.setPos(14, 4);
            this.addChildGui(label);
            label = new sc.TextGui(ig.lang.get("sc.gui.menu.item.buff") + ":", {
                font: sc.fontsystem.tinyFont
            });
            label.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
            label.setPos(28, 2);
            this.addChildGui(label);
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
        updateDrawables: function(drawables) {
            this.parent(drawables);
            drawables.addColor("#7E7E7E", 2, 135, 171, 1)
        },
        updateList: function(focus) {
            var scrollY = this.list.getScrollY(),
                currentIndex = this.buttongroup.current.y;
            if (!sc.options.get("quick-cursor")) currentIndex = scrollY = 0;
            this.buttongroup.clear();
            this.list.clear(true);
            for (var player = sc.model.player, itemIds = player.getItemSubList(sc.ITEMS_TYPES.CONS, sc.SORT_TYPE.ORDER, true), itemId = null, nameText = itemId = null, item = null, count = 0, maxIndex = 0, i = 0; i < itemIds.length; i++) {
                maxIndex = player.items[itemIds[i]] || 0;
                count++;
                item = sc.inventory.getItem(itemIds[i]);
                new ig.LangLabel(item.name);
                nameText = "\\i[" + (item.icon + sc.inventory.getRaritySuffix(item.rarity || 0) || "item-default") + "]" + ig.LangLabel.getText(item.name);
                itemId = ig.LangLabel.getText(item.description);
                nameText = new sc.ItemBoxButton(nameText, 142, 26, maxIndex || 1, itemIds[i], itemId, void 0,
                    void 0);
                item.isBuff && sc.model.player.params.hasMaxBuffs() && nameText.setActive(false);
                player.isFavorite(itemIds[i]) && this.addFavoriteOverlay(nameText);
                this.list.addButton(nameText)
            }
            this.list._prevIndex = currentIndex;
            currentIndex = Math.min(currentIndex, Math.max(0, count - 1));
            ig.input.mouseGuiActive ? this.buttongroup.setCurrentFocus(0, currentIndex) : this.buttongroup.focusCurrentButton(0, currentIndex, false, focus);
            this.list.scrollToY(scrollY, true)
        },
        show: function() {
            if (this._hidden) {
                this._hidden = false;
                this.updateList(true);
                var hook = this.hook;
                tempVec.x = this.base.pos.x + this.anchor.pos.x + Math.floor(this.anchor.size.x / 2);
                tempVec.y =
                    this.base.pos.y + this.anchor.pos.y + Math.floor(this.anchor.size.y / 2);
                var anchorY = tempVec.y + -46;
                tempVec.y = Math.max(10, Math.min(ig.system.height - 137 - 10 - 22 - 70, tempVec.y + -46));
                hook.pos.y = tempVec.y;
                if (tempVec.x + 240 < ig.system.width) {
                    this.currentTileOffset = "default";
                    hook.pos.x = tempVec.x + 27 + 30;
                    hook.doPosTranstition(tempVec.x + 27, tempVec.y, 0.2, KEY_SPLINES.EASE_OUT);
                    this.arrow.setPosition(-10, 42 + (anchorY - tempVec.y), false)
                } else {
                    this.currentTileOffset = "flipped";
                    hook.pos.x = tempVec.x - hook.size.x - 27 - 30 - 1;
                    hook.doPosTranstition(tempVec.x - hook.size.x - 27 - 1, tempVec.y, 0.2, KEY_SPLINES.EASE_OUT);
                    this.arrow.setPosition(hook.size.x +
                        1, 42 + (anchorY - tempVec.y), true)
                }
                hook = sc.model.player.params;
                this.maxBuffs.setNumber(hook.getMaxBuffs());
                this.currentBuffs.setNumber(hook.currentItemBuffs);
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
        addFavoriteOverlay: function(button) {
            var overlay = new ig.ImageGui(this.ninepatch.gfx, 256, 480,
                19, 17);
            overlay.setPos(0, 0);
            button.addChildGui(overlay)
        },
        onSelection: function(button) {
            sc.quickmodel.setInfoText(button.data.description);
            button.data.id && (sc.inventory.isBuffID(button.data.id) ? sc.quickmodel.setBuffText(sc.inventory.getBuffString(button.data.id), null, button.data.id) : sc.quickmodel.setBuffText("", false))
        },
        onPress: function(button) {
            if (button.data && (!sc.inventory.isBuffID(button.data.id) || !sc.model.player.params.hasMaxBuffs())) {
                ig.game.playerEntity.useItem(button.data.id);
                sc.quickmodel.skipActiveState = true;
                sc.model.enterRunning()
            }
        },
        modelChanged: function(model,
            msg) {
            model == sc.quickmodel && (msg == sc.QUICK_MODEL_EVENT.SWITCH_STATE ? sc.quickmodel.isQuickItems() ? this.show() : this.hide() : msg == sc.QUICK_MODEL_EVENT.EXIT_MENU && this.hide())
        }
    })
});
ig.baked = !0;

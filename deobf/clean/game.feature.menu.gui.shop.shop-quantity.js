/**
 * game.feature.menu.gui.shop.shop-quantity
 * ========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.shop.shop-quantity")`.
 *
 * The quantity selector for the shop cart:
 *  - `sc.ShopQuantitySelect`: the +1/−1/+10/−10 stepper popup — clamps to
 *    the affordable/stackable max, live cost (or profit) readout, submit /
 *    back handling and a press-repeater for held directions.
 *  - `sc.ShopQuanityButton` (sic): one circular direction button (+1/−1/
 *    +10/−10) with highlight and diamond-shaped mouse-over test.
 *  - `sc.ShopSlopLine`: the sloped underline used under the quantity and
 *    cost labels.
 */
ig.module("game.feature.menu.gui.shop.shop-quantity")
    .requires("impact.base.image", "impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.gui.base.box", "impact.feature.interact.gui.focus-gui")
    .defines(function () {

    var DIR_UP = {
            x: 584,
            y: 352,
            number: 1,
            insetY: 2,
            numberOffX: -2
        },
        DIR_DOWN = {
            x: 584,
            y: 352,
            number: -1,
            insetY: -2,
            numberOffX: -2,
            numberOffY: 1,
            flipY: true
        },
        DIR_RIGHT = {
            x: 621,
            y: 352,
            number: 10,
            insetX: -2,
            numberOffX: 3
        },
        DIR_LEFT = {
            x: 621,
            y: 352,
            number: -10,
            insetX: 2,
            numberOffX: -3,
            flipX: true
        };

    sc.ShopQuantitySelect = ig.BoxGui.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    scaleX: 0.2,
                    scaleY: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        ninepatch: new ig.NinePatch("media/gui/menu.png", {
            width: 6,
            height: 6,
            left: 9,
            top: 9,
            right: 9,
            bottom: 9,
            offsets: {
                "default": {
                    x: 480,
                    y: 304
                }
            }
        }),
        buttongroup: null,
        quantityText: null,
        costText: null,
        buttonUp: null,
        buttonDown: null,
        buttonLeft: null,
        buttonRight: null,
        quantity: null,
        cost: null,
        submit: null,
        quantityLine: null,
        itemCostLine: null,
        active: false,
        submitCallback: null,
        cancelCallback: null,
        _number: 0,
        _max: 99,
        _button: null,
        _amp: 0,
        _ampTimer: 0,
        _ampDir: null,
        repeater: null,

        init: function (submitCallback, cancelCallback) {
            this.parent();
            this.setSize(247, 83);
            this.setPivot(0, 0);
            this.hook.zIndex = 1500;
            this.hook.pauseGui = true;
            this.hook.screenBlocking = true;
            this.submitCallback = submitCallback || null;
            this.cancelCallback = cancelCallback || null;
            this.buttongroup = new sc.ButtonGroup;
            this.buttongroup.isNonMouseMenuInput = function () {
                return sc.control.menuConfirm()
            }.bind(this);
            this.quantityText = new sc.TextGui(ig.lang.get("sc.gui.shop.quantity"), {
                font: sc.fontsystem.tinyFont
            });
            this.quantityText.setPos(10, 11);
            this.addChildGui(this.quantityText);
            this.costText = new sc.TextGui(ig.lang.get("sc.gui.shop.cost"), {
                font: sc.fontsystem.tinyFont
            });
            this.costText.setPos(147, 11);
            this.addChildGui(this.costText);
            this.cost = new sc.NumberGui(9999999, {
                transitionTime: 0.1,
                signed: true
            });
            this.cost.setPos(174, 10);
            this.addChildGui(this.cost);
            this.quantityLine = new sc.ShopSlopLine(91, false);
            this.quantityLine.setPos(9, 18);
            this.quantityLine.show(true);
            this.addChildGui(this.quantityLine);
            this.itemCostLine = new sc.ShopSlopLine(91, true);
            this.itemCostLine.setPos(142, 18);
            this.itemCostLine.show(true);
            this.addChildGui(this.itemCostLine);
            this.quantity = new sc.NumberGui(99, {
                transitionTime: 0.1,
                leadingZeros: 2
            });
            this.quantity.setPos(116, 38);
            this.addChildGui(this.quantity);
            this.buttonUp = this.addDirectionButton(DIR_UP, 106, 4);
            this.buttonDown = this.addDirectionButton(DIR_DOWN, 106, 44);
            this.buttonRight = this.addDirectionButton(DIR_RIGHT, 126, 24);
            this.buttonLeft = this.addDirectionButton(DIR_LEFT, 86, 24);
            this.submit = new sc.ButtonGui(ig.lang.get("sc.gui.shop.submit"), 84);
            this.submit.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
            this.submit.setPos(4, 4);
            this.addChildGui(this.submit);
            this.buttongroup.addFocusGui(this.submit, 0, 0);
            this.buttongroup.addPressCallback(function () {
                this.hide();
                this._button.setCountNumber(this._number);
                this.submitCallback && this.submitCallback(this._button, this._number)
            }.bind(this));
            this.repeater = new ig.PressRepeater(0.3, 0.1);
            this.doStateTransition("HIDDEN", true)
        },

        update: function () {
            if (this.buttongroup.isActive() && !ig.interact.isBlocked()) {
                if (this._ampTimer > 0) {
                    this._ampTimer = this._ampTimer - ig.system.actualTick;
                    if (this._ampTimer <= 0) this._amp = this._ampTimer = 0
                }
                switch (this.getRepeaterValue()) {
                    case "up":
                        this.buttonUp.onButtonPress(true);
                        break;
                    case "down":
                        this.buttonDown.onButtonPress(true);
                        break;
                    case "right":
                        this.buttonRight.onButtonPress(true);
                        break;
                    case "left":
                        this.buttonLeft.onButtonPress(true)
                }
            }
        },

        getRepeaterValue: function () {
            sc.control.upDown() ? this.repeater.setDown("up") : sc.control.downDown() ? this.repeater.setDown("down") : sc.control.rightDown() ? this.repeater.setDown("right") : sc.control.leftDown() && this.repeater.setDown("left");
            return this.repeater.getPressed()
        },

        addDirectionButton: function (direction, x, y) {
            var button = new sc.ShopQuanityButton(direction);
            button.keepMouseFocus = true;
            button.setPos(x, y);
            button.onButtonPress = function () {
                var oldNumber = this._number;
                this._number = (this._number + direction.number).limit(0, this._max);
                if (oldNumber != this._number) {
                    this.quantity.setNumber(this._number);
                    this.updateCost();
                    this.playSound(direction, true);
                    button.focus || button.highlight()
                } else sc.BUTTON_SOUND.denied.play();
                sc.menu.updateTotalCost(this._button.data.id, this._number, this._button.price);
                this.updateDirectionButtons(this._number)
            }.bind(this);
            this.addChildGui(button);
            return button
        },

        updateCost: function () {
            var cost = this._number * this._button.price;
            this.cost.setNumber(sc.menu.shopSellMode ? cost : -cost);
            this.cost.showPlus = sc.menu.shopSellMode && cost;
            cost ? this.cost.setColor(sc.menu.shopSellMode ? sc.GUI_NUMBER_COLOR.GREEN : sc.GUI_NUMBER_COLOR.RED) : this.cost.setColor(sc.GUI_NUMBER_COLOR.WHITE)
        },

        updateDirectionButtons: function (number) {
            this.buttonUp.setColor(sc.GUI_NUMBER_COLOR.WHITE);
            this.buttonDown.setColor(sc.GUI_NUMBER_COLOR.WHITE);
            this.buttonRight.setColor(sc.GUI_NUMBER_COLOR.WHITE);
            this.buttonLeft.setColor(sc.GUI_NUMBER_COLOR.WHITE);
            if (number == this._max) {
                this.buttonUp.setColor(sc.GUI_NUMBER_COLOR.GREY);
                this.buttonRight.setColor(sc.GUI_NUMBER_COLOR.GREY)
            }
            if (number <= 0) {
                this.buttonDown.setColor(sc.GUI_NUMBER_COLOR.GREY);
                this.buttonLeft.setColor(sc.GUI_NUMBER_COLOR.GREY)
            }
        },

        playSound: function (direction, amplify) {
            this._ampTimer = 0.3;
            if (this._ampDir != direction) this._amp = 0;
            this._ampDir = direction;
            this._amp = Math.min(0.2, this._amp + 0.04);
            direction == DIR_UP || direction == DIR_RIGHT ? sc.BUTTON_SOUND.shop_up.play(null, {
                speed: 1 + (amplify ? this._amp : 0)
            }) : sc.BUTTON_SOUND.shop_down.play(null, {
                speed: 1 - (amplify ? this._amp : 0)
            })
        },

        show: function (button, x, y) {
            if (!this.active) {
                this.setPos(x, y);
                sc.menu.pushBackCallback(this.onBackButtonPress.bind(this));
                sc.menu.buttonInteract.pushButtonGroup(this.buttongroup);
                sc.menu.buttonInteract.addGlobalButton(this.buttonUp, this.onUpCheck.bind(this), true);
                sc.menu.buttonInteract.addGlobalButton(this.buttonDown, this.onDownCheck.bind(this), true);
                sc.menu.buttonInteract.addGlobalButton(this.buttonRight, this.onRightCheck.bind(this), true);
                sc.menu.buttonInteract.addGlobalButton(this.buttonLeft, this.onLeftCheck.bind(this), true);
                sc.menu.shopSellMode ? this.costText.setText(ig.lang.get("sc.gui.shop.profit")) : this.costText.setText(ig.lang.get("sc.gui.shop.cost"));
                this.buttonUp.show();
                this.buttonDown.show();
                this.buttonRight.show();
                this.buttonLeft.show();
                this._amp = 0;
                this._button = button;
                var price = this._button.price,
                    count = sc.menu.getItemQuantity(this._button.data.id, price),
                    totalCost = count * price,
                    maxOwn = ig.database.get("shops")[sc.menu.shopID].maxOwn || 99;
                if (sc.menu.shopSellMode) this._max = sc.model.player.getItemAmount(button.data.id);
                else {
                    var credits = sc.menu.shopCoinMode ? sc.arena.getTotalArenaCoins() : sc.model.player.credit;
                    this._max = Math.min(maxOwn || 99, (maxOwn || 99) - sc.model.player.getItemAmount(button.data.id));
                    this._max = Math.min(this._max, Math.floor(Math.max(0, credits - sc.menu.getTotalCost() + totalCost) / price))
                }
                this._number = count || 1;
                this._button.setCountNumber(count, true);
                this.updateDirectionButtons(this._number);
                this.quantity.setNumber(this._number, true);
                this.updateCost();
                sc.menu.updateTotalCost(this._button.data.id, this._number, this._button.price);
                ig.interact.setBlockDelay(0.1);
                this.getRepeaterValue();
                this.active = true;
                this.doStateTransition("DEFAULT")
            }
        },

        hide: function () {
            if (this.active) {
                sc.menu.popBackCallback();
                sc.menu.buttonInteract.removeButtonGroup(this.buttongroup);
                sc.menu.buttonInteract.removeGlobalButton(this.buttonUp);
                sc.menu.buttonInteract.removeGlobalButton(this.buttonDown);
                sc.menu.buttonInteract.removeGlobalButton(this.buttonRight);
                sc.menu.buttonInteract.removeGlobalButton(this.buttonLeft);
                this.buttonUp.hide();
                this.buttonDown.hide();
                this.buttonRight.hide();
                this.buttonLeft.hide();
                this.active = false;
                if (ig.input.mouseGuiActive) {
                    sc.menu.setInfoText("", true);
                    sc.menu.setBuffText("", false);
                    sc.menu.resetItemInfo()
                }
                this.doStateTransition("HIDDEN")
            }
        },

        onBackButtonPress: function () {
            this.hide();
            this._button.setCountNumber(sc.menu.getItemQuantity(this._button.data.id, this._button.price), true);
            sc.menu.updateTotalCost();
            this.cancelCallback && this.cancelCallback(this._button)
        },

        onUpCheck: function () {
            return false
        },

        onDownCheck: function () {
            return false
        },

        onRightCheck: function () {
            return false
        },

        onLeftCheck: function () {
            return false
        }
    });

    var HALF_BUTTON_SIZE = Math.floor(17.5);

    sc.ShopQuanityButton = ig.FocusGui.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        direction: DIR_UP,
        highlightTimer: 0,
        number: null,

        init: function (direction) {
            this.parent();
            this.setSize(35, 35);
            this.direction = direction || DIR_UP;
            this.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        offsetX: this.direction.insetX || 0,
                        offsetY: this.direction.insetY || 0
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.number = new sc.NumberGui(99, {
                size: sc.NUMBER_SIZE.SMALL,
                signed: true,
                showPlus: true
            });
            this.number.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.number.setNumber(direction.number);
            this.number.setPos(direction.numberOffX || 0, direction.numberOffY || 0);
            this.addChildGui(this.number)
        },

        setColor: function (color) {
            this.number.setColor(color)
        },

        highlight: function () {
            this.highlightTimer = 0.4
        },

        show: function () {
            this.highlightTimer = 0;
            this.doStateTransition("HIDDEN", true);
            this.doStateTransition("DEFAULT", false, false, null, 0.1)
        },

        hide: function () {
            this.doStateTransition("HIDDEN")
        },

        update: function () {
            if (this.highlightTimer > 0) {
                this.highlightTimer = this.highlightTimer - ig.system.actualTick;
                if (this.highlightTimer <= 0) this.highlightTimer = 0
            }
        },

        updateDrawables: function (renderer) {
            renderer.addGfx(this.gfx, 0, 0, this.direction.x, this.direction.y + (this.focus ? 36 : 0), 35, 35, this.direction.flipX, this.direction.flipY);
            if (this.highlightTimer > 0) {
                var alpha = (this.highlightTimer / 0.4).limit(0, 1);
                renderer.addGfx(this.gfx, 0, 0, this.direction.x, this.direction.y + 36, 35, 35, this.direction.flipX, this.direction.flipY).setAlpha(alpha)
            }
        },

        isMouseOver: function () {
            if (ig.interact.isBlocked()) return false;
            var x = Math.floor(this.hook.screenCoords.x),
                y = Math.floor(this.hook.screenCoords.y),
                mouseX = Math.floor(sc.control.getMouseX()),
                mouseY = Math.floor(sc.control.getMouseY());
            return Math.abs(mouseX - (HALF_BUTTON_SIZE + x)) + Math.abs(mouseY - (HALF_BUTTON_SIZE + y)) <= HALF_BUTTON_SIZE
        }
    });

    sc.ShopSlopLine = ig.GuiElementBase.extend({
        slop: null,
        line: null,
        hasLine: false,

        init: function (width, isRightAligned) {
            this.parent();
            this.setSize(width + 5, 5);
            this.slope = new sc.SlopeLine(5, isRightAligned, false, sc.SlopeLine_Color.DARK_GREY);
            this.addChildGui(this.slope);
            this.line = new ig.ColorGui("#7E7E7E", width, 1);
            this.line.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.1,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        scaleX: 0
                    },
                    time: 0.1,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.addChildGui(this.line);
            if (isRightAligned) {
                this.slope.setPos(0, 5);
                this.line.setPos(5, 0);
                this.line.setPivot(0, 0)
            } else {
                this.slope.setPos(width + 5, 5);
                this.line.setPos(0, 0);
                this.line.setPivot(width, 0)
            }
            this.slope.hide();
            this.line.doStateTransition("HIDDEN", true)
        },

        show: function (animate) {
            if (!this.hasLine)
                if (animate) {
                    this.slope.show(0);
                    this.line.doStateTransition("DEFAULT", true)
                } else {
                    this.line.hook.currentStateName == "HIDDEN" && this.line.hasTransition();
                    this.slope.hide();
                    this.slope.show(0.1);
                    this.line.doStateTransition("HIDDEN", true);
                    this.line.doStateTransition("DEFAULT", false, false, null, 0.1);
                    this.hasLine = true
                }
        },

        hide: function (immediate) {
            if (this.hasLine) {
                this.slope.hide(immediate ? 0 : 0.1, immediate ? 0 : 0.1);
                this.line.doStateTransition("HIDDEN", immediate);
                this.hasLine = false
            }
        }
    })
});
ig.baked = !0;

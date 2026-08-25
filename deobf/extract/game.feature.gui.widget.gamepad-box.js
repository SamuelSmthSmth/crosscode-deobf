ig.module("game.feature.gui.widget.gamepad-box").requires("impact.base.image", "impact.feature.gui.gui").defines(function() {
    ig.GUI.GamepadBox = ig.GuiElementBase.extend({
        transitions: {
            DEFAULT: {
                state: {
                    alpha: 1
                },
                time: 0,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            HIDDEN: {
                state: {
                    alpha: 1
                },
                time: 0.3,
                timeFunction: KEY_SPLINES.EASE_IN
            }
        },
        gfx: new ig.Image("media/gui/buttons.png"),
        infoButton: null,
        text: null,
        gamepadActive: false,
        init: function(b, a, d) {
            this.parent();
            this.setSize(180, 26);
            this.hook.zIndex = 90;
            this.infoButton = new sc.ButtonGui("?",
                28);
            this.infoButton.setPos(1, 1);
            this.infoButton.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
            this.infoButton.onButtonPress = function() {
                var a = ig.lang.get("sc.gui.gamepad-box.info-title") + "\n\n" + ig.lang.get("sc.gui.gamepad-box.info-text"),
                    a = new sc.CenterMsgBoxGui(a, {
                        maxWidth: 300,
                        speed: ig.TextBlock.SPEED.IMMEDIATE
                    }, "black", 0.9);
                a.hook.zIndex = 1500;
                ig.gui.addGuiElement(a)
            }.bind(this);
            b.addFocusGui(this.infoButton, a, d);
            this.addChildGui(this.infoButton);
            this.text = new sc.TextGui(ig.lang.get("sc.gui.gamepad-box.not-connected"), {
                maxWidth: 105,
                speed: ig.TextBlock.SPEED.SLOW
            });
            this.text.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.text.setPos(4, 0);
            this.addChildGui(this.text)
        },
        varsChanged: function() {
            if (!this.gamepadActive && ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                this.gamepadActive = true;
                this.text.setText(ig.lang.get("sc.gui.gamepad-box.connected"))
            }
        },
        updateDrawables: function(b) {
            b.addGfx(this.gfx, 0, 0, 0, 160, this.hook.size.x, this.hook.size.y)
        }
    })
});
ig.baked = !0;

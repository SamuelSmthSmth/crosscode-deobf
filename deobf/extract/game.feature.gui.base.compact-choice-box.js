ig.module("game.feature.gui.base.compact-choice-box").requires("impact.feature.gui.base.box", "impact.feature.gui.gui").defines(function() {
    sc.CompactChoiceBoxGui = ig.BoxGui.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.3,
                timeFunction: KEY_SPLINES.EASE_IN_OUT
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    scaleY: 0
                },
                time: 0.3,
                timeFunction: KEY_SPLINES.EASE_IN_OUT
            }
        },
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
        options: null,
        callback: null,
        init: function(b,
            a, d) {
            this.parent();
            this.options = b;
            this.callback = d;
            this.buttonInteract = new ig.ButtonInteractEntry;
            this.buttonGroup = new sc.ButtonGroup;
            this.buttonGroup.addPressCallback(this.onButtonPress.bind(this));
            this.buttonInteract.pushButtonGroup(this.buttonGroup);
            for (var d = a - 6, c = 3, e = 0; e < b.length; ++e) {
                var f = b[e],
                    g = new sc.ButtonGui(f.label, d, true, sc.BUTTON_TYPE.ITEM);
                g.textChild.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
                g.textChild.setPos(0, 0);
                g.setPos(3, c);
                g.setData(e);
                c = c + 20;
                this.addChildGui(g);
                this.buttonGroup.addFocusGui(g,
                    0, e, f.backButton || false)
            }
            this.setSize(a, c + 2);
            ig.interact.addEntry(this.buttonInteract);
            sc.model.stopSkip()
        },
        onDetach: function() {
            ig.interact.removeEntry(this.buttonInteract)
        },
        onButtonPress: function(b) {
            b = this.options[b.data];
            this.callback && this.callback(b.key)
        }
    })
});
ig.baked = !0;

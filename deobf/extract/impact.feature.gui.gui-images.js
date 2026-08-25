ig.module("impact.feature.gui.gui-images").requires("impact.base.image", "impact.base.game", "impact.feature.gui.gui", "impact.feature.storage.storage").defines(function() {
    ig.GuiImageContainer = ig.GuiElementBase.extend({
        init: function(b) {
            this.parent();
            this.hook.zIndex = b;
            this.setSize(ig.system.width, ig.system.height)
        }
    });
    ig.GuiImage = ig.GameAddon.extend({
        guiImages: {},
        containerBelowGui: null,
        containerOverGui: null,
        init: function() {
            this.parent("GUI");
            ig.storage.register(this);
            this.containerBelowGui = new ig.GuiImageContainer(-30);
            ig.gui.addGuiElement(this.containerBelowGui);
            this.containerOverGui = new ig.GuiImageContainer(51);
            ig.gui.addGuiElement(this.containerOverGui)
        },
        showImage: function(b, a, d, c, e, f, g) {
            this.removeImage(b);
            a = new ig.ImageGui(a.image, a.offX, a.offY, a.width, a.height);
            a.setAlign(ig.GUI_ALIGN_X[c], ig.GUI_ALIGN_Y[e]);
            a.renderMode = f || null;
            a.doTempStateTransition(this._createGuiState(d), 0, KEY_SPLINES.LINEAR, true);
            d = {
                gui: a,
                data: {
                    alignX: c,
                    alignY: e,
                    state: d
                }
            };
            g ? this.containerOverGui.addChildGui(a) : this.containerBelowGui.addChildGui(a);
            this.guiImages[b] = d
        },
        moveImage: function(b, a, d, c, e) {
            var f = this.guiImages[b];
            if (f) {
                f.data.state = a;
                f.gui.doTempStateTransition(this._createGuiState(a), d, c, false, e);
                e && delete this.guiImages[b]
            }
        },
        removeImage: function(b) {
            var a = this.guiImages[b];
            if (a) {
                a.gui.remove();
                delete this.guiImages[b]
            }
        },
        _createGuiState: function(b) {
            return {
                alpha: b.alpha,
                offsetX: b.offsetX,
                offsetY: b.offsetY,
                scaleX: b.scaleX,
                scaleY: b.scaleY,
                angle: b.angle
            }
        },
        onStorageSave: function() {},
        onStoragePreLoad: function() {},
        onReset: function() {
            for (var b in this.guiImages) this.removeImage(b)
        }
    });
    ig.addGameAddon(function() {
        return ig.guiImage = new ig.GuiImage
    })
});
ig.baked = !0;

ig.module("game.feature.interact.gui.interact-gui").requires("impact.feature.gui.gui").defines(function() {
    var b = Vec2.create();
    ig.GUI.Interact = ig.GuiElementBase.extend({
        iconState: 0,
        transitions: {
            DEFAULT: {
                state: {
                    alpha: 1
                },
                time: 0.1,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            NEAR: {
                state: {
                    alpha: 1
                },
                time: 0.1,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            AWAY: {
                state: {
                    alpha: 0.9
                },
                time: 0.1,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            HIDDEN: {
                state: {
                    scaleX: 0,
                    scaleY: 0,
                    alpha: 1
                },
                time: 0.1,
                timeFunction: KEY_SPLINES.EASE_IN
            }
        },
        gfx: new ig.Image("media/gui/map-ar.png"),
        target: null,
        offset: null,
        icon: null,
        timer: 0,
        offsetTimer: 0,
        overlayIcon: null,
        subGui: null,
        init: function(a, b) {
            this.parent();
            this.setSize(24, 24);
            this.setPivot(12, 24);
            this.hook.zIndex = -30;
            this.hook.invisibleUpdate = true;
            this.target = a;
            this.icon = b;
            this.doStateTransition("HIDDEN", true);
            this.overlayIcon = new sc.InteractOverlayIcon(this);
            this.addChildGui(this.overlayIcon)
        },
        setIconState: function(a) {
            this.iconState = a;
            var b = true;
            if (this.subGui) {
                this.subGui.setIconState(a);
                this.subGui.isActive(this.iconState) && (b = false);
                b || this.doStateTransition(a == sc.INTERACT_ENTRY_STATE.HIDDEN ? "HIDDEN" : "DEFAULT")
            }
            b && (this.icon.hasAnim(a) ? a == sc.INTERACT_ENTRY_STATE.AWAY ? this.doStateTransition("AWAY") : a == sc.INTERACT_ENTRY_STATE.NEAR || a == sc.INTERACT_ENTRY_STATE.BLOCK ? this.doStateTransition("NEAR") : this.doStateTransition("DEFAULT") : this.doStateTransition("HIDDEN"))
        },
        setSubGui: function(a) {
            this.subGui && this.removeChildGui(this.subGui);
            if (this.subGui = a) {
                this.insertChildGui(this.subGui, 0);
                this.subGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_BOTTOM)
            }
            this.setIconState(this.iconState)
        },
        update: function() {
            this.timer = (this.timer + ig.system.tick) % this.icon.getMaxTimer(this.iconState);
            this.offsetTimer = (this.offsetTimer + ig.system.tick) % 1;
            this._updatePos()
        },
        remove: function() {
            this.doStateTransition("HIDDEN", false, true)
        },
        _updatePos: function() {
            var a = 0;
            this.iconState != sc.INTERACT_ENTRY_STATE.RUNNING && (a = Math.round(Math.sin(Math.PI * 2 * (this.offsetTimer / 1)) * 1));
            this.subGui && this.subGui.isActive(this.iconState) && (a = 0);
            ig.system.getScreenFromMapPos(b, Math.round(this.target.coll.pos.x + this.target.coll.size.x /
                2), Math.round(this.target.coll.pos.y - this.target.coll.pos.z - this.target.coll.size.z));
            this.hook.pos.x = b.x - this.hook.size.x / 2;
            this.hook.pos.y = b.y - this.hook.size.y + a + 4;
            this.offset && Vec2.add(this.hook.pos, this.offset)
        }
    });
    sc.InteractOverlayIcon = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/message.png"),
        interactGui: null,
        init: function(a) {
            this.parent();
            this.interactGui = a
        },
        updateDrawables: function(a) {
            var b = this.interactGui;
            b.icon.updateDrawables(a, b.iconState, b.timer)
        }
    })
});
ig.baked = !0;

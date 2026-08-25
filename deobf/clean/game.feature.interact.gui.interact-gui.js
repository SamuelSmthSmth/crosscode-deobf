/**
 * @module game.feature.interact.gui.interact-gui
 *
 * GUI element that renders the floating interaction icon above an entity.
 * Tracks the icon's animation state (DEFAULT/NEAR/AWAY/HIDDEN) and positions
 * itself at the top of the target's collision box, with a subtle bobbing
 * offset.
 */
ig.module("game.feature.interact.gui.interact-gui").requires("impact.feature.gui.gui").defines(function() {
    var SCREEN_POS = Vec2.create();
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
        init: function(target, icon) {
            this.parent();
            this.setSize(24, 24);
            this.setPivot(12, 24);
            this.hook.zIndex = -30;
            this.hook.invisibleUpdate = true;
            this.target = target;
            this.icon = icon;
            this.doStateTransition("HIDDEN", true);
            this.overlayIcon = new sc.InteractOverlayIcon(this);
            this.addChildGui(this.overlayIcon)
        },
        setIconState: function(state) {
            this.iconState = state;
            var shouldTransition = true;
            if (this.subGui) {
                this.subGui.setIconState(state);
                this.subGui.isActive(this.iconState) && (shouldTransition = false);
                shouldTransition || this.doStateTransition(state == sc.INTERACT_ENTRY_STATE.HIDDEN ? "HIDDEN" : "DEFAULT")
            }
            shouldTransition && (this.icon.hasAnim(state) ? state == sc.INTERACT_ENTRY_STATE.AWAY ? this.doStateTransition("AWAY") : state == sc.INTERACT_ENTRY_STATE.NEAR || state == sc.INTERACT_ENTRY_STATE.BLOCK ? this.doStateTransition("NEAR") : this.doStateTransition("DEFAULT") : this.doStateTransition("HIDDEN"))
        },
        setSubGui: function(subGui) {
            this.subGui && this.removeChildGui(this.subGui);
            if (this.subGui = subGui) {
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
            var offsetY = 0;
            this.iconState != sc.INTERACT_ENTRY_STATE.RUNNING && (offsetY = Math.round(Math.sin(Math.PI * 2 * (this.offsetTimer / 1)) * 1));
            this.subGui && this.subGui.isActive(this.iconState) && (offsetY = 0);
            ig.system.getScreenFromMapPos(SCREEN_POS, Math.round(this.target.coll.pos.x + this.target.coll.size.x /
                2), Math.round(this.target.coll.pos.y - this.target.coll.pos.z - this.target.coll.size.z));
            this.hook.pos.x = SCREEN_POS.x - this.hook.size.x / 2;
            this.hook.pos.y = SCREEN_POS.y - this.hook.size.y + offsetY + 4;
            this.offset && Vec2.add(this.hook.pos, this.offset)
        }
    });
    sc.InteractOverlayIcon = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/message.png"),
        interactGui: null,
        init: function(interactGui) {
            this.parent();
            this.interactGui = interactGui
        },
        updateDrawables: function(drawables) {
            var gui = this.interactGui;
            gui.icon.updateDrawables(drawables, gui.iconState, gui.timer)
        }
    })
});
ig.baked = !0;

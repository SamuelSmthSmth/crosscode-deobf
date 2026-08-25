/**
 * game.feature.ar.gui.ar-box
 * ==========================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.ar.gui.ar-box")`.
 *
 * `ig.GUI.ARBox` — a floating augmented-reality text box that follows an entity
 * on screen. Supports colour modes (GREEN/RED), a fill bar mode (LINE_FILL,
 * LINE_EMPTY), var-tracked fill levels, tracker-based timers, and off-screen
 * hiding. Used for enemy HP bars, status labels, and similar HUD overlays.
 */
ig.module("game.feature.ar.gui.ar-box").requires(
    "impact.feature.gui.gui"
).defines(function () {

    sc.AR_BOX_MODE = {
        NO_LINE: 0,
        LINE_FILL: 1,
        LINE_EMPTY: 2
    };

    sc.AR_COLOR = {
        GREEN: { rgb: "#166c70", yOff: 0 },
        RED:   { rgb: "#6e0000", yOff: 16 }
    };

    ig.GUI.ARBox = ig.GuiElementBase.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.25,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            HIDDEN: {
                state: { scaleX: 1, scaleY: 0 },
                time: 0.25,
                timeFunction: KEY_SPLINES.EASE_IN
            }
        },
        gfx: new ig.Image("media/gui/map-ar.png"),
        target: null,
        attachEntity: null,
        text: null,
        timer: 0,
        maxTime: 0,
        prevMove: Vec2.createC(-1, -1),
        delta: Vec2.createC(-1, -1),
        arrowX: 0,
        mode: sc.AR_BOX_MODE.NO_LINE,
        color: null,
        finished: false,
        hideOutsideOfScreen: false,
        tracker: null,
        varName: null,
        varMaxFill: null,
        varRefEntity: null,

        /** @param {ig.Entity} target @param {string} text @param {number} [maxTime] @param {number} [mode] @param {object} [color] */
        init: function (target, text, maxTime, mode, color) {
            this.parent();
            this.setPivot(0, 4);
            this.hook.zIndex = -50;
            this.target = target;
            this.text = text;
            this.maxTime = this.timer = maxTime || 0;
            this.mode = mode || false;
            this.color = color || sc.AR_COLOR.GREEN;
            this.hook.invisibleUpdate = true;

            var textGui = new sc.TextGui(this.text, {
                speed: ig.TextBlock.SPEED.NORMAL,
                font: sc.fontsystem.smallFont
            });
            textGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.addChildGui(textGui);
            this.setSize(textGui.hook.size.x + 8, textGui.hook.size.y + 4 + (this.mode ? 2 : 0));
            this.hook.pivot.y = textGui.hook.size.y / 2 + 2;
            this.doStateTransition("HIDDEN", true);
            this.target ? this._updatePos(false) : this.doStateTransition("DEFAULT");
        },

        /** Bind the bar fill to a game variable. */
        setVarFill: function (varName, varMaxFill, refEntity) {
            this.varName = varName;
            this.varMaxFill = varMaxFill;
            this.varRefEntity = refEntity;
        },

        /** Bind the timer to an enemy tracker. */
        setTracker: function (trackerName) {
            var combatantRoot = this.target.getCombatantRoot();
            if (combatantRoot.trackers) {
                var tracker = combatantRoot.trackers[trackerName];
                if (tracker instanceof sc.ENEMY_TRACKER.TIME) this.tracker = tracker;
            }
        },

        update: function () {
            if (this.tracker) {
                this.maxTime = this.tracker._getTarget(this.target.getCombatantRoot());
                this.timer = this.maxTime - this.tracker.current;
                if (this.timer <= 0) this.remove();
            } else if (this.varName) {
                this.maxTime = this.varMaxFill;
                this.varRefEntity && ig.vars.pushEntityAccessor(this.varRefEntity);
                this.timer = this.maxTime - ig.vars.get(this.varName);
                this.varRefEntity && ig.vars.popEntityAccessor(this.varRefEntity);
            } else if (this.timer) {
                this.timer -= ig.system.tick;
                if (this.timer <= 0) this.remove();
            }

            if (!this.target) this.remove();
            if (this.target._killed) this.remove();
            if (this.target instanceof ig.ENTITY.Combatant && this.target.isDefeated()) this.remove();
            this._updatePos(true);
        },

        updateDrawables: function (renderer) {
            renderer.addColor(this.color.rgb, 2, 2, this.hook.size.x - 4, this.hook.size.y - 4).setAlpha(0.5);

            if (this.hasTransition()) {
                var factor = this.getTransitionFactor();
                if (this.hook.currentStateName == "DEFAULT") factor = 1 - factor;
                renderer.addDraw().setAlpha(factor).setColor("white", 2, 2, this.hook.size.x - 4, this.hook.size.y - 4);
            } else {
                // Nine-patch corners.
                renderer.addTransform().setAlpha(0.5);
                renderer.addGfx(this.gfx, 0, 0, 0, 0 + this.color.yOff, 8, 8);
                renderer.addGfx(this.gfx, this.hook.size.x - 8, 0, 8, 0 + this.color.yOff, 8, 8);
                renderer.addGfx(this.gfx, this.hook.size.x - 8, this.hook.size.y - 8, 8, 8 + this.color.yOff, 8, 8);
                renderer.addGfx(this.gfx, 0, this.hook.size.y - 8, 0, 8 + this.color.yOff, 8, 8);
                renderer.undoTransform();

                // Arrow pointing to target.
                if (this.arrowX <= 3) {
                    renderer.addGfx(this.gfx, -13, this.hook.size.y - 3, 32, 0 + this.color.yOff, 16, 16, true);
                } else if (this.arrowX >= this.hook.size.x - 3) {
                    renderer.addGfx(this.gfx, this.hook.size.x - 3, this.hook.size.y - 3, 32, 0 + this.color.yOff, 16, 16);
                } else {
                    renderer.addGfx(this.gfx, this.arrowX - 8, this.hook.size.y - 1, 16, 0 + this.color.yOff, 16, 16);
                }
            }

            // Fill bar.
            if (this.mode && this.maxTime) {
                renderer.addColor("black", 4, this.hook.size.y - 2 - 2, this.hook.size.x - 8, 1);
                var fraction = (this.timer / this.maxTime).limit(0, 1);
                if (this.mode == sc.AR_BOX_MODE.LINE_FILL) fraction = 1 - fraction;
                renderer.addColor("white", 4, this.hook.size.y - 2 - 2, (this.hook.size.x - 8) * fraction, 1);
            }
        },

        remove: function () {
            this.finished = true;
            this.attachEntity && this.attachEntity.removeEntityAttached(this);
            this.doStateTransition("HIDDEN", false, true);
        },

        isFinished: function () { return this.finished; },
        onActionEndDetach: function () { this.remove(); },
        onEntityKillDetach: function () { this.remove(); },

        /** Position the box near the target entity, clamping to screen bounds. */
        _updatePos: function (isMoving) {
            var hook = this.hook;
            var targetCenter = this.target.getCenter();
            var screenX = Math.round(targetCenter.x) - ig.game.screen.x;
            var screenY = Math.round(targetCenter.y - this.target.coll.pos.z - this.target.coll.size.z / 2) - ig.game.screen.y;
            var halfSizeX = this.target.coll.size.x / 2;
            var halfSizeYZ = (this.target.coll.size.y + this.target.coll.size.z) / 2 - 4;
            var maxRadius = Math.max(halfSizeX, halfSizeYZ);
            var xOffset = screenX - ig.system.width / 2;
            var dirX = xOffset > 0 ? 1 : -1;

            if (isMoving) {
                if (dirX != this.prevMove.x && Math.abs(xOffset) > 16) this.prevMove.x = dirX;
                this.delta.x = this.delta.x * 0.9 + this.prevMove.x * 0.1;
                this.delta.y = this.delta.y * 0.9 + this.prevMove.y * 0.1;
            } else {
                this.prevMove.x = this.delta.x = dirX;
                this.prevMove.y = this.delta.y = -1;
            }

            hook.pos.x = screenX + this.delta.x * (halfSizeX + hook.size.x / 2) - hook.size.x / 2;
            hook.pos.y = screenY + this.delta.y * (halfSizeYZ + hook.size.y / 2) - hook.size.y / 2;

            if (!this.hideOutsideOfScreen) {
                hook.pos.x = hook.pos.x.limit(0, ig.system.width - hook.size.x);
                var minY = sc.gui.statusHud.getFreeScreenMinY(hook.pos.x);
                hook.pos.y = hook.pos.y.limit(minY, ig.system.height - hook.size.y);
                hook.removeAfterTransition || this.doStateTransition("DEFAULT");
            }

            this.arrowX = screenX - hook.pos.x;

            if (this.hideOutsideOfScreen && !hook.removeAfterTransition) {
                if (this.arrowX < -8 - maxRadius || this.arrowX > hook.size.x + maxRadius + 8 ||
                    hook.pos.y > screenY || hook.pos.y < screenY - maxRadius - hook.size.y - 8) {
                    this.doStateTransition("HIDDEN");
                } else {
                    this.doStateTransition("DEFAULT");
                }
            }
        },

        setAttachedEntity: function (entity) {
            entity.addEntityAttached(this);
            this.attachEntity = entity;
        }
    });
});
ig.baked = !0;
ig.module("game.feature.ar.gui.ar-box").requires("impact.feature.gui.gui").defines(function() {
    sc.AR_BOX_MODE = {
        NO_LINE: 0,
        LINE_FILL: 1,
        LINE_EMPTY: 2
    };
    sc.AR_COLOR = {
        GREEN: {
            rgb: "#166c70",
            yOff: 0
        },
        RED: {
            rgb: "#6e0000",
            yOff: 16
        }
    };
    ig.GUI.ARBox = ig.GuiElementBase.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.25,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            HIDDEN: {
                state: {
                    scaleX: 1,
                    scaleY: 0
                },
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
        init: function(b, a, d, c, e) {
            this.parent();
            this.setPivot(0, 4);
            this.hook.zIndex = -50;
            this.target = b;
            this.text = a;
            this.maxTime = this.timer = d || 0;
            this.mode = c || false;
            this.color = e || sc.AR_COLOR.GREEN;
            this.hook.invisibleUpdate = true;
            b = new sc.TextGui(this.text, {
                speed: ig.TextBlock.SPEED.NORMAL,
                font: sc.fontsystem.smallFont
            });
            b.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.addChildGui(b);
            this.setSize(b.hook.size.x + 8, b.hook.size.y + 4 + (this.mode ? 2 : 0));
            this.hook.pivot.y = b.hook.size.y / 2 + 2;
            this.doStateTransition("HIDDEN", true);
            this.target ? this._updatePos(false) : this.doStateTransition("DEFAULT")
        },
        setVarFill: function(b, a, d) {
            this.varName = b;
            this.varMaxFill = a;
            this.varRefEntity = d
        },
        setTracker: function(b) {
            var a = this.target.getCombatantRoot();
            if (a.trackers) {
                b = a.trackers[b];
                if (b instanceof sc.ENEMY_TRACKER.TIME) this.tracker =
                    b
            }
        },
        update: function() {
            if (this.tracker) {
                this.maxTime = this.tracker._getTarget(this.target.getCombatantRoot());
                this.timer = this.maxTime - this.tracker.current;
                this.timer <= 0 && this.remove()
            } else if (this.varName) {
                this.maxTime = this.varMaxFill;
                this.varRefEntity && ig.vars.pushEntityAccessor(this.varRefEntity);
                this.timer = this.maxTime - ig.vars.get(this.varName);
                this.varRefEntity && ig.vars.popEntityAccessor(this.varRefEntity)
            } else if (this.timer) {
                this.timer = this.timer - ig.system.tick;
                this.timer <= 0 && this.remove()
            }
            this.target ||
                this.remove();
            this.target._killed && this.remove();
            this.target instanceof ig.ENTITY.Combatant && this.target.isDefeated() && this.remove();
            this._updatePos(true)
        },
        updateDrawables: function(b) {
            b.addColor(this.color.rgb, 2, 2, this.hook.size.x - 4, this.hook.size.y - 4).setAlpha(0.5);
            if (this.hasTransition()) {
                var a = this.getTransitionFactor();
                this.hook.currentStateName == "DEFAULT" && (a = 1 - a);
                b.addDraw().setAlpha(a).setColor("white", 2, 2, this.hook.size.x - 4, this.hook.size.y - 4)
            } else {
                b.addTransform().setAlpha(0.5);
                b.addGfx(this.gfx,
                    0, 0, 0, 0 + this.color.yOff, 8, 8);
                b.addGfx(this.gfx, this.hook.size.x - 8, 0, 8, 0 + this.color.yOff, 8, 8);
                b.addGfx(this.gfx, this.hook.size.x - 8, this.hook.size.y - 8, 8, 8 + this.color.yOff, 8, 8);
                b.addGfx(this.gfx, 0, this.hook.size.y - 8, 0, 8 + this.color.yOff, 8, 8);
                b.undoTransform();
                this.arrowX <= 3 ? b.addGfx(this.gfx, -13, this.hook.size.y - 3, 32, 0 + this.color.yOff, 16, 16, true) : this.arrowX >= this.hook.size.x - 3 ? b.addGfx(this.gfx, this.hook.size.x - 3, this.hook.size.y - 3, 32, 0 + this.color.yOff, 16, 16) : b.addGfx(this.gfx, this.arrowX - 8, this.hook.size.y -
                    1, 16, 0 + this.color.yOff, 16, 16)
            }
            if (this.mode && this.maxTime) {
                b.addColor("black", 4, this.hook.size.y - 2 - 2, this.hook.size.x - 8, 1);
                a = (this.timer / this.maxTime).limit(0, 1);
                this.mode == sc.AR_BOX_MODE.LINE_FILL && (a = 1 - a);
                b.addColor("white", 4, this.hook.size.y - 2 - 2, (this.hook.size.x - 8) * a, 1)
            }
        },
        remove: function() {
            this.finished = true;
            this.attachEntity && this.attachEntity.removeEntityAttached(this);
            this.doStateTransition("HIDDEN", false, true)
        },
        isFinished: function() {
            return this.finished
        },
        onActionEndDetach: function() {
            this.remove()
        },
        onEntityKillDetach: function() {
            this.remove()
        },
        _getCurrentNumber: function() {
            if (this.timer >= this.numTransitionTime) return this.targetNumber;
            var b = this.timer / this.numTransitionTime;
            return Math.floor((1 - b) * this.initNumber + b * this.targetNumber)
        },
        _updatePos: function(b) {
            var a = this.hook,
                d = this.target.getCenter(),
                c = Math.round(d.x) - ig.game.screen.x,
                d = Math.round(d.y - this.target.coll.pos.z - this.target.coll.size.z / 2) - ig.game.screen.y,
                e = this.target.coll.size.x / 2,
                f = (this.target.coll.size.y + this.target.coll.size.z) /
                2 - 4,
                g = Math.max(e, f),
                h = c - ig.system.width / 2,
                i = h > 0 ? 1 : -1;
            if (b) {
                if (i != this.prevMove.x && Math.abs(h) > 16) this.prevMove.x = i;
                this.delta.x = this.delta.x * 0.9 + this.prevMove.x * 0.1;
                this.delta.y = this.delta.y * 0.9 + this.prevMove.y * 0.1
            } else {
                this.prevMove.x = this.delta.x = i;
                this.prevMove.y = this.delta.y = -1
            }
            a.pos.x = c + this.delta.x * (e + a.size.x / 2) - a.size.x / 2;
            a.pos.y = d + this.delta.y * (f + a.size.y / 2) - a.size.y / 2;
            if (!this.hideOutsideOfScreen) {
                a.pos.x = a.pos.x.limit(0, ig.system.width - a.size.x);
                b = sc.gui.statusHud.getFreeScreenMinY(a.pos.x);
                a.pos.y = a.pos.y.limit(b, ig.system.height - a.size.y);
                a.removeAfterTransition || this.doStateTransition("DEFAULT")
            }
            this.arrowX = c - a.pos.x;
            this.hideOutsideOfScreen && !a.removeAfterTransition && (this.arrowX < -8 - g || this.arrowX > a.size.x + g + 8 || a.pos.y > d || a.pos.y < d - g - a.size.y - 8 ? this.doStateTransition("HIDDEN") : this.doStateTransition("DEFAULT"))
        },
        setAttachedEntity: function(b) {
            b.addEntityAttached(this);
            this.attachEntity = b
        }
    })
});
ig.baked = !0;

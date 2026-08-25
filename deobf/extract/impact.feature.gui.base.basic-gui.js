ig.module("impact.feature.gui.base.basic-gui").requires("impact.feature.gui.gui").defines(function() {
    ig.ImageGui = ig.GuiElementBase.extend({
        image: null,
        offsetX: 0,
        offsetY: 0,
        renderMode: null,
        flipX: false,
        flipY: false,
        pivotOverride: false,
        frames: null,
        xCount: 0,
        frameTime: 0,
        timer: 0,
        loop: false,
        stopped: true,
        init: function(b, a, d, c, e) {
            this.parent();
            b && this.setImage(b, a, d, c, e)
        },
        setImage: function(b, a, d, c, e) {
            this.image = b;
            this.offsetX = a || 0;
            this.offsetY = d || 0;
            this.hook.size.x = c || 0;
            this.hook.size.y = e || 0;
            this.image.addLoadListener(this)
        },
        setAnimation: function(b, a, d, c) {
            this.loop = c != void 0 ? c : true;
            this.stopped = false;
            this.frames = b;
            this.frameTime = a;
            this.xCount = d
        },
        restartAnimation: function() {
            this.timer = 0;
            this.stopped = false
        },
        onLoadableComplete: function() {
            this.hook.size.x = this.hook.size.x || this.image.width;
            this.hook.size.y = this.hook.size.y || this.image.height;
            this.hook.size.x = Math.min(this.hook.size.x, this.image.width);
            this.hook.size.y = Math.min(this.hook.size.y, this.image.height);
            if (!this.pivotOverride) {
                this.hook.pivot.x = this.hook.size.x /
                    2;
                this.hook.pivot.y = this.hook.size.y / 2
            }
        },
        update: function() {
            if (this.frames && !this.stopped) this.timer = this.timer + ig.system.actualTick
        },
        updateDrawables: function(b) {
            var a = 0,
                d = 0;
            if (this.frames) {
                d = Math.floor(this.timer / this.frameTime) % this.frames.length;
                if (d == this.frames.length - 1 && !this.loop) this.stopped = true;
                a = d % this.xCount * this.hook.size.x;
                d = Math.floor(d / this.xCount) * this.hook.size.y
            }
            b.addGfx(this.image, 0, 0, this.offsetX + a, this.offsetY + d, this.hook.size.x, this.hook.size.y, this.flipX, this.flipY).setCompositionMode(this.renderMode)
        }
    });
    ig.ColorGui = ig.GuiElementBase.extend({
        color: null,
        renderMode: null,
        init: function(b, a, d) {
            this.parent();
            this.color = b;
            this.hook.size.x = a == void 0 ? ig.system.width : a;
            this.hook.size.y = d == void 0 ? ig.system.height : d;
            this.hook.pivot.x = this.hook.size.x / 2;
            this.hook.pivot.y = this.hook.size.y / 2
        },
        updateDrawables: function(b) {
            this.hook.size.x != 0 && this.hook.size.y != 0 && b.addColor(this.color, 0, 0, this.hook.size.x, this.hook.size.y).setCompositionMode(this.renderMode)
        }
    });
    ig.SEQUENCE_MSG = {
        LABEL_REACHED: 1,
        ENDED: 2
    };
    ig.SequenceGui =
        ig.GuiElementBase.extend({
            timer: -1,
            timeLineIndex: 0,
            gfx: null,
            gui: null,
            timeLine: null,
            reachedLabels: [],
            currentSkipLabel: null,
            init: function(b) {
                this.parent();
                this.callback = b;
                this.timeLine && this.initTimeLine(this.gfx, this.gui, this.timeLine)
            },
            initTimeLine: function(b, a, d) {
                this.gfx = b;
                this.gui = a;
                this.timeLine = d;
                for (var c in this.gui) {
                    b = this.gui[c];
                    if (b.gfx) {
                        this.gui[c] = b.src ? new ig.ImageGui(this.gfx[b.gfx], b.src.x, b.src.y, b.src.w, b.src.h) : new ig.ImageGui(this.gfx[b.gfx]);
                        b.anim && this.gui[c].setAnimation(b.anim.frames,
                            b.anim.time, b.anim.xCount);
                        if (b.pos) this.gui[c].hook.pos = b.pos;
                        if (b.align) this.gui[c].hook.align = b.align;
                        if (b.renderMode) this.gui[c].renderMode = b.renderMode;
                        if (b.pivot) {
                            this.gui[c].hook.pivot = b.pivot;
                            this.gui[c].pivotOverride = true
                        }
                        if (b.sound) this.gui[c].sound = b.sound;
                        this.gui[c].flipX = b.flipX || false;
                        this.gui[c].flipY = b.flipY || false
                    } else if (b.sound) continue;
                    else this.gui[c] = new ig.ColorGui(b.color);
                    this.gui[c].hook.transitions = b.transitions;
                    this.gui[c].doStateTransition("HIDDEN", true);
                    this.addChildGui(this.gui[c])
                }
            },
            update: function() {
                if (this.timer >= 0)
                    for (this.timer = this.timer + ig.system.actualTick; this.timeLineIndex < this.timeLine.length && this.timeLine[this.timeLineIndex].time <= this.timer;) {
                        var b = this.timeLine[this.timeLineIndex];
                        if (b.gui) {
                            b.preState && this.gui[b.gui].doStateTransition(b.preState, true);
                            b.state && this.gui[b.gui].doStateTransition(b.state);
                            b.sound && b.sound.play()
                        } else if (b.sound) b.sound.sound.play(false, b.sound.sndSettings);
                        else if (b.end) {
                            this.end();
                            break
                        } else if (b.goto) this.jumpTo(b.goto);
                        else if (b.label) this._setLabelReached(b.label);
                        else if (b.skipLabel !== void 0) this.currentSkipLabel = b.skipLabel;
                        this.timeLineIndex++
                    }
            },
            _setLabelReached: function(b) {
                if (this.reachedLabels.indexOf(b) == -1) {
                    this.reachedLabels.push(b);
                    this.notifyCallback(ig.SEQUENCE_MSG.LABEL_REACHED, b)
                }
            },
            start: function() {
                for (var b in this.gui) this.gui[b].sound || this.gui[b].doStateTransition("HIDDEN", true);
                this.overlay = {};
                this.reachedLabels.length = 0;
                this.currentSkipLabel = null;
                this.timeLineIndex = this.timer = 0
            },
            end: function() {
                this.timeLineIndex = 0;
                this.timer = -1;
                this.notifyCallback(ig.SEQUENCE_MSG.ENDED)
            },
            notifyCallback: function(b, a) {
                this.callback && this.callback(b, a || null)
            },
            skip: function() {
                this.currentSkipLabel && this.jumpTo(this.currentSkipLabel)
            },
            jumpTo: function(b) {
                for (var a = this.timeLine.length; a--;)
                    if (this.timeLine[a].label == b) {
                        this.timer = this.timeLine[a].time;
                        this.timeLineIndex = a;
                        this._setLabelReached(b);
                        break
                    }
            },
            hasEnded: function() {
                return this.timer < 0
            },
            isLabelReached: function(b) {
                return this.reachedLabels.indexOf(b) != -1
            }
        });
    ig.SimpleGui = ig.GuiElementBase.extend({
        hide: function(b, a) {
            this.doStateTransition("HIDDEN",
                b, false, null, a)
        },
        show: function(b, a) {
            this.doStateTransition("DEFAULT", b, false, null, a)
        }
    })
});
ig.baked = !0;

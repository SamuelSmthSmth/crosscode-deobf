ig.module("game.feature.gui.widget.timer-gui").requires("impact.base.event", "game.feature.gui.base.boxes", "game.feature.gui.base.numbers", "game.feature.gui.base.slick-box").defines(function() {
    ig.GUI.TimerGui = sc.SlickBoxRawGui.extend({
        pos: {
            x: 4,
            y: 50
        },
        size: {
            x: 80,
            y: 18
        },
        pivot: {
            x: 40,
            y: 6
        },
        align: {
            x: ig.GUI_ALIGN.X_LEFT,
            y: ig.GUI_ALIGN.Y_TOP
        },
        _wm: new ig.Config({
            width: 100,
            attributes: {
                start: {
                    _type: "Boolean",
                    _info: "True if the timer should start right aways"
                }
            }
        }),
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.3,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    offsetX: -100
                },
                time: 0.3,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        gfx: new ig.Image("media/gui/basic.png"),
        centiseconds: null,
        seconds: null,
        minutes: null,
        time: 0,
        running: false,
        zIndex: 1001,
        init: function(b) {
            this.parent(false, "Timer");
            this.setSize(80, 16);
            this.setPos(0, 60);
            this.hook.zIndex = 1E6;
            this.centiseconds = new sc.NumberGui(99, {
                padZeros: true
            });
            this.seconds = new sc.NumberGui(99, {
                padZeros: true
            });
            this.minutes = new sc.NumberGui(99, {
                padZeros: true
            });
            this.centiseconds.setAlign(ig.GUI_ALIGN.X_RIGHT,
                ig.GUI_ALIGN.Y_TOP);
            this.seconds.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.minutes.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            var a = 8;
            this.centiseconds.setPos(a, 3);
            var a = a + this.centiseconds.hook.size.x,
                d = new ig.ImageGui(this.gfx, 104, 0, 8, 8);
            d.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            d.setPos(a, 3);
            this.addChildGui(d);
            a = a + 8;
            this.seconds.setPos(a, 3);
            a = a + this.seconds.hook.size.x;
            d = new ig.ImageGui(this.gfx, 104, 0, 8, 8);
            d.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            d.setPos(a,
                3);
            this.addChildGui(d);
            this.minutes.setPos(a + 8, 3);
            this.addChildGui(this.centiseconds);
            this.addChildGui(this.seconds);
            this.addChildGui(this.minutes);
            if (b) this.running = b.start || false;
            this.doStateTransition("HIDDEN", true);
            this.doStateTransition("DEFAULT")
        },
        update: function() {
            if (this.running) this.time = this.time + ig.system.tick;
            var b = Math.floor(this.time * 100);
            this.centiseconds.setNumber(b % 100);
            b = Math.floor(b / 100);
            this.seconds.setNumber(b % 60);
            b = Math.floor(b / 60);
            this.minutes.setNumber(b);
            this.parent()
        },
        start: function() {
            this.running =
                true
        },
        stop: function() {
            this.running = false
        },
        remove: function() {
            this.doStateTransition("HIDDEN", false, true)
        }
    });
    ig.EVENT_STEP.STOP_TIMER = ig.EventStepBase.extend({
        hide: null,
        _wm: new ig.Config({
            attributes: {
                hide: {
                    _type: "Boolean",
                    _info: "True if the timer should be hidden and removed."
                }
            }
        }),
        init: function(b) {
            this.hide = b.hide
        },
        start: function() {
            var b = ig.gui.namedGuiElements.timer;
            if (b) {
                b.stop();
                this.hide && b.remove()
            }
        }
    })
});
ig.baked = !0;

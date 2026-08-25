ig.module("impact.feature.video.video-gui").requires("impact.feature.video.video", "impact.feature.gui.gui").defines(function() {
    ig.VideoGui = ig.GuiElementBase.extend({
        video: null,
        playing: false,
        init: function(b, a, d) {
            this.parent();
            this.video = b;
            this.hook.size.x = a || ig.system.width;
            this.hook.size.y = d || ig.system.height
        },
        play: function(b) {
            this.playing = 1;
            this.video.play(b)
        },
        pause: function() {
            this.playing = 0;
            this.video.pause()
        },
        reset: function() {
            this.video.currentTime = 0
        },
        updateDrawables: function(b) {
            this.playing &&
                this.playing <= 4 ? this.playing++ : this.playing == 5 && b.addVideo(this.video, 0, 0, this.hook.size.x, this.hook.size.y)
        }
    });
    ig.VideoPlayerGui = ig.GuiElementBase.extend({
        videoGui: null,
        transitions: {
            DEFAULT: {
                state: {},
                time: 1,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0
                },
                time: 1,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        onEndCallback: null,
        screenInteract: null,
        init: function(b, a, d) {
            this.parent(b);
            this.videoGui = new ig.VideoGui(b, a, d);
            this.videoGui.hook.transitions.DEFAULT = {
                state: {},
                time: 0,
                timeFunction: KEY_SPLINES.LINEAR
            };
            this.videoGui.hook.transitions.HIDDEN = {
                state: {
                    alpha: 0
                },
                time: 1,
                timeFunction: KEY_SPLINES.LINEAR
            };
            this.addChildGui(this.videoGui);
            this.doStateTransition("HIDDEN", true);
            this.screenInteract = new sc.ScreenInteractEntry(this, true);
            Vec2.assign(this.hook.size, this.videoGui.hook.size)
        },
        start: function(b) {
            this.onEndCallback = b;
            this.doStateTransition("DEFAULT", false, false, this._startVideo.bind(this))
        },
        _startVideo: function() {
            this.videoGui.doStateTransition("DEFAULT");
            this.videoGui.play(this._stopVideo.bind(this));
            ig.interact.addEntry(this.screenInteract)
        },
        _stopVideo: function() {
            this.videoGui.doStateTransition("HIDDEN", false, false, this._onEnd.bind(this));
            this.videoGui.video.fadeOutAudio(1);
            ig.interact.removeEntry(this.screenInteract)
        },
        onInteraction: function() {
            this._stopVideo()
        },
        _onEnd: function() {
            this.doStateTransition("HIDDEN");
            this.videoGui.reset();
            this.videoGui.pause();
            this.onEndCallback && this.onEndCallback();
            this.onEndCallback = null
        },
        updateDrawables: function(b) {
            b.addColor("black", 0, 0, this.hook.size.x, this.hook.size.y)
        }
    })
});
ig.baked = !0;

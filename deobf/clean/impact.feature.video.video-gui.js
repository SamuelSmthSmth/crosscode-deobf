/**
 * impact.feature.video.video-gui
 * ==============================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.video.video-gui")`.
 *
 * GUI elements for playing a video: `ig.VideoGui` draws the video element
 * (after a few frames), and `ig.VideoPlayerGui` wraps it with a fade-in/out
 * and a screen-interact entry so touching the screen skips the video.
 */
ig.module("impact.feature.video.video-gui")
    .requires("impact.feature.video.video", "impact.feature.gui.gui")
    .defines(function () {

    /** Draws a playing video, delayed by a few frames so the texture is ready. */
    ig.VideoGui = ig.GuiElementBase.extend({
        video: null,
        playing: false,

        init: function (video, width, height) {
            this.parent();
            this.video = video;
            this.hook.size.x = width || ig.system.width;
            this.hook.size.y = height || ig.system.height;
        },

        play: function (onEnd) {
            this.playing = 1;
            this.video.play(onEnd);
        },

        pause: function () {
            this.playing = 0;
            this.video.pause();
        },

        reset: function () {
            this.video.currentTime = 0;
        },

        updateDrawables: function (drawables) {
            this.playing && this.playing <= 4 ? this.playing++ :
                this.playing == 5 && drawables.addVideo(this.video, 0, 0, this.hook.size.x, this.hook.size.y);
        }
    });

    /** Full-screen video player with fade and tap-to-skip. */
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

        init: function (video, width, height) {
            this.parent(video);
            this.videoGui = new ig.VideoGui(video, width, height);
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
            Vec2.assign(this.hook.size, this.videoGui.hook.size);
        },

        start: function (onEnd) {
            this.onEndCallback = onEnd;
            this.doStateTransition("DEFAULT", false, false, this._startVideo.bind(this));
        },

        _startVideo: function () {
            this.videoGui.doStateTransition("DEFAULT");
            this.videoGui.play(this._stopVideo.bind(this));
            ig.interact.addEntry(this.screenInteract);
        },

        _stopVideo: function () {
            this.videoGui.doStateTransition("HIDDEN", false, false, this._onEnd.bind(this));
            this.videoGui.video.fadeOutAudio(1);
            ig.interact.removeEntry(this.screenInteract);
        },

        onInteraction: function () {
            this._stopVideo();
        },

        _onEnd: function () {
            this.doStateTransition("HIDDEN");
            this.videoGui.reset();
            this.videoGui.pause();
            this.onEndCallback && this.onEndCallback();
            this.onEndCallback = null;
        },

        updateDrawables: function (drawables) {
            drawables.addColor("black", 0, 0, this.hook.size.x, this.hook.size.y);
        }
    });
});
ig.baked = !0;

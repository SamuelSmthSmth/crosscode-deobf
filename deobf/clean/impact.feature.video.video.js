/**
 * impact.feature.video.video
 * ==========================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.video.video")`.
 *
 * `ig.Video`: loadable <video> wrapper with play/pause/reset, audio fade-out
 * and draw-to-canvas support.
 */
ig.module("impact.feature.video.video")
    .requires("impact.base.loader", "game.config")
    .defines(function () {

    var VIDEO_TYPES = [{
        suffix: "webm",
        type: "video/webm"
    }];

    ig.Video = ig.Loadable.extend({
        cacheType: "Video",
        video: null,
        onEndCallback: null,
        _fadeTimer: 0,
        _fadeMaxTime: 0,
        _lastTime: 0,
        _fadeHandle: null,

        init: function (path) {
            this.parent(path);
        },

        loadInternal: function () {
            this.video = document.createElement("video");
            this.video.addEventListener("canplaythrough", this.onload.bind(this));
            this.video.addEventListener("error", this.onerror.bind(this));
            this.video.addEventListener("ended", this._onVideoEnded.bind(this));
            console.log("LOAD VIDEO!");
            this.video.className = "igVideo";
            this.video.preload = true;
            var basePath = ig.root + this.path.match(/^(.*)\.[^\.]+$/)[1];
            for (var i = VIDEO_TYPES.length; i--;) {
                var type = VIDEO_TYPES[i],
                    source = document.createElement("source");
                source.type = type.type;
                source.src = basePath + "." + type.suffix + ig.getCacheSuffix();
                this.video.appendChild(source);
            }
        },

        onload: function () {
            console.log("LOADED!");
            this.loadingFinished(true);
        },

        onerror: function (error) {
            console.log("NOPE!", error);
            this.loadingFinished(false);
        },

        play: function (onEnd) {
            this.onEndCallback = onEnd;
            this.video.currentTime = 0;
            this.video.volume = 1;
            this.video.play();
        },

        pause: function () {
            this.video.pause();
        },

        reset: function () {
            this.video.currentTime = 0;
        },

        fadeOutAudio: function (duration) {
            this._fadeTimer = this._fadeMaxTime = duration;
            this._lastTime = Date.now();
            this._fadeHandle = window.setInterval(this._fadeAudioCallback.bind(this), 10);
        },

        _fadeAudioCallback: function () {
            var now = Date.now(),
                delta = (now - this._lastTime) / 1E3;
            this._lastTime = now;
            this._fadeTimer = this._fadeTimer - delta;
            if (this._fadeTimer < 0) this._fadeTimer = 0;
            this.video.volume = this._fadeTimer / this._fadeMaxTime;
            this._fadeTimer == 0 && window.clearInterval(this._fadeHandle);
        },

        draw: function (x, y, width, height) {
            if (!this.video.paused) {
                var scale = ig.system.scale,
                    x = ig.system.getDrawPos(x),
                    y = ig.system.getDrawPos(y);
                ig.system.context.drawImage(this.video, x, y, width * scale, height * scale);
            }
        },

        _onVideoEnded: function () {
            this.onEndCallback && this.onEndCallback();
        }
    });
});
ig.baked = !0;

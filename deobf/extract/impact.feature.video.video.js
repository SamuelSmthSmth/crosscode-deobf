ig.module("impact.feature.video.video").requires("impact.base.loader", "game.config").defines(function() {
    var b = [{
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
        init: function(a) {
            this.parent(a)
        },
        loadInternal: function() {
            this.video = document.createElement("video");
            this.video.addEventListener("canplaythrough", this.onload.bind(this));
            this.video.addEventListener("error", this.onerror.bind(this));
            this.video.addEventListener("ended", this._onVideoEnded.bind(this));
            console.log("LOAD VIDEO!");
            this.video.className = "igVideo";
            this.video.preload = true;
            for (var a = ig.root + this.path.match(/^(.*)\.[^\.]+$/)[1], d = b.length; d--;) {
                var c = b[d],
                    e = document.createElement("source");
                e.type = c.type;
                e.src = a + "." + c.suffix + ig.getCacheSuffix();
                this.video.appendChild(e)
            }
        },
        onload: function() {
            console.log("LOADED!");
            this.loadingFinished(true)
        },
        onerror: function(a) {
            console.log("NOPE!", a);
            this.loadingFinished(false)
        },
        play: function(a) {
            this.onEndCallback =
                a;
            this.video.currentTime = 0;
            this.video.volume = 1;
            this.video.play()
        },
        pause: function() {
            this.video.pause()
        },
        reset: function() {
            this.video.currentTime = 0
        },
        fadeOutAudio: function(a) {
            this._fadeTimer = this._fadeMaxTime = a;
            this._lastTime = Date.now();
            this._fadeHandle = window.setInterval(this._fadeAudioCallback.bind(this), 10)
        },
        _fadeAudioCallback: function() {
            var a = Date.now(),
                b = (a - this._lastTime) / 1E3;
            this._lastTime = a;
            this._fadeTimer = this._fadeTimer - b;
            if (this._fadeTimer < 0) this._fadeTimer = 0;
            this.video.volume = this._fadeTimer /
                this._fadeMaxTime;
            this._fadeTimer == 0 && window.clearInterval(this._fadeHandle)
        },
        draw: function(a, b, c, e) {
            if (!this.video.paused) {
                var f = ig.system.scale,
                    a = ig.system.getDrawPos(a),
                    b = ig.system.getDrawPos(b);
                ig.system.context.drawImage(this.video, a, b, c * f, e * f)
            }
        },
        _onVideoEnded: function() {
            this.onEndCallback && this.onEndCallback()
        }
    })
});
ig.baked = !0;

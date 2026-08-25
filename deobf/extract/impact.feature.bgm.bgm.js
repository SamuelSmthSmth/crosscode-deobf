ig.module("impact.feature.bgm.bgm").requires("impact.base.event", "impact.base.game", "impact.base.sound", "impact.feature.storage.storage").defines(function() {
    ig.BGM_SWITCH_MODE = {
        IMMEDIATELY: {
            fadeOut: 0,
            fadeIn: 0
        },
        FAST_OUT: {
            fadeOut: 0.5,
            fadeIn: 0
        },
        MEDIUM_OUT: {
            fadeOut: 1,
            fadeIn: 0
        },
        SLOW_OUT: {
            fadeOut: 2,
            fadeIn: 0
        },
        VERY_SLOW_OUT: {
            fadeOut: 5,
            fadeIn: 0
        },
        FAST: {
            fadeOut: 0.5,
            fadeIn: 0.5
        },
        MEDIUM: {
            fadeOut: 1,
            fadeIn: 1
        },
        SLOW: {
            fadeOut: 2,
            fadeIn: 2
        },
        VERY_SLOW: {
            fadeOut: 5,
            fadeIn: 5
        }
    };
    ig.BGM_TRACK_LIST = {};
    ig.BGM_DEFAULT_TRACKS = {};
    ig.BgmTrack = ig.Class.extend({
        name: null,
        track: null,
        init: function(a) {
            this.name = a;
            if (a = ig.BGM_TRACK_LIST[a]) this.track = new ig.Track(a.path, a.loopEnd, a.introPath, a.introEnd, a.volume)
        },
        get: function() {
            return this.track
        },
        clearCached: function() {
            this.track && this.track.decreaseRef()
        },
        copy: function() {
            return new ig.BgmTrack(this.name)
        }
    });
    ig.BgmTrackSet = ig.Class.extend({
        name: null,
        entries: null,
        init: function(a) {
            var b = {},
                c = ig.BGM_DEFAULT_TRACKS[a],
                e;
            for (e in c) b[e] = {
                track: ig.bgm.loadTrack(c[e].track),
                volume: c[e].volume
            };
            this.name = a;
            this.entries = b
        },
        get: function(a) {
            return this.entries[a]
        },
        clearCached: function() {
            for (var a in this.entries) this.entries[a].track.clearCached()
        },
        copy: function() {
            return new ig.BgmTrackSet(this.name)
        }
    });
    var b = [];
    ig.Bgm = ig.GameAddon.extend({
        defaultTrackSet: null,
        defaultTrackTypeStack: ["field"],
        trackStack: [],
        overloadDefault: false,
        defaultMode: "SLOW_OUT",
        mapDefaultTrackSet: null,
        delayedResume: 0,
        pauseAutoResumeBlock: false,
        resumeOnChange: null,
        init: function() {
            this.parent("BGM");
            ig.storage.register(this)
        },
        loadTrack: function(a) {
            if (ig.music) return new ig.BgmTrack(a)
        },
        loadTrackSet: function(a) {
            return new ig.BgmTrackSet(a)
        },
        setDefault: function(a, b, c) {
            this.clearResumeOnChange();
            this.defaultTrackSet && this.defaultTrackSet.clearCached();
            this.defaultTrackSet = a.copy();
            !c && !this.overloadDefault && this.resumeDefault(b)
        },
        isPlayingDefault: function() {
            return !this.overloadDefault
        },
        getDefaultTrackTypeCount: function() {
            return this.defaultTrackTypeStack.length
        },
        hasDefaultTrackType: function(a) {
            return !(!this.defaultTrackSet ||
                !this.defaultTrackSet.get(a))
        },
        pushDefaultTrackType: function(a, b) {
            this.clearResumeOnChange();
            this.defaultTrackTypeStack.push(a);
            this.overloadDefault || this.resumeDefault(b)
        },
        popDefaultTrackType: function(a) {
            this.clearResumeOnChange();
            this.defaultTrackTypeStack.pop();
            this.overloadDefault || this.resumeDefault(a)
        },
        setResumeOnChange: function(a) {
            this.resumeOnChange = a
        },
        clearResumeOnChange: function() {
            this.resumeOnChange && this.resumeDefault(this.resumeOnChange)
        },
        resumeDefault: function(a) {
            this.resumeOnChange =
                null;
            for (var b = this.defaultTrackTypeStack.length; this.trackStack.length > b;) this.pop(a);
            var c = this._getDefaultTrackEntry();
            if (c) {
                this.trackStack.length < b && this.push(c.track, c.volume, a);
                ig.music.isTrackPlaying(c.track.track, c.volume) || this.play(c.track, c.volume, a)
            }
            this.overloadDefault = false
        },
        play: function(a, b, c) {
            this.clearResumeOnChange();
            this.overloadDefault = true;
            c = this._getModeData(c);
            ig.music.play(a.get(), c.fadeOut, c.fadeIn, b);
            (c = this.trackStack.pop()) && c.track.clearCached();
            this.trackStack.push({
                track: a.copy(),
                volume: b
            })
        },
        push: function(a, b, c) {
            this.clearResumeOnChange();
            this.overloadDefault = true;
            c = this._getModeData(c);
            ig.music.push(a.get(), c.fadeOut, c.fadeIn, b);
            this.trackStack.push({
                track: a.copy(),
                volume: b
            })
        },
        pop: function(a) {
            this.clearResumeOnChange();
            a = this._getModeData(a);
            ig.music.pop(a.fadeOut, a.fadeIn);
            (a = this.trackStack.pop()) && a.track.clearCached();
            a = this._getDefaultTrackEntry();
            if (this.trackStack.length == this.defaultTrackTypeStack.length && a && ig.music.isTrackPlaying(a.track.get(), a.volume)) this.overloadDefault =
                false
        },
        clear: function(a) {
            for (this.resumeOnChange = null; this.defaultTrackTypeStack.length > 1;) this.popDefaultTrackType(a);
            for (this.overloadDefault = false; this.trackStack.length > 0;) this.pop(a);
            this.defaultTrackSet && this.defaultTrackSet.clearCached();
            this.defaultTrackSet = null
        },
        inbetween: function(a, b, c) {
            c = this._getModeData(c);
            ig.music.inbetween(a.get(), c.fadeIn, c.fadeOut, b)
        },
        pause: function(a) {
            a = this._getModeData(a);
            ig.music.pause(a.fadeOut);
            this.pauseAutoResumeBlock = true
        },
        resume: function(a) {
            a = this._getModeData(a);
            ig.music.resume(a.fadeIn)
        },
        onStorageSave: function(a) {
            for (var b = [], c = 0; c < this.trackStack.length; ++c) b.push({
                track: this.trackStack[c].track.name,
                volume: this.trackStack[c].volume
            });
            a.bgm = {
                defaultTrackSet: this.defaultTrackSet ? this.defaultTrackSet.name : null,
                defaultTrackTypeStack: this.defaultTrackTypeStack,
                trackStack: b,
                overloadDefault: this.overloadDefault,
                paused: ig.music.paused,
                resumeOnChange: this.resumeOnChange
            }
        },
        onStoragePreLoad: function(a) {
            a = a.bgm;
            this.clear();
            if (a) {
                this.defaultTrackSet = this.loadTrackSet(a.defaultTrackSet);
                for (var a = a.trackStack, d = 0; d < a.length; ++d) b.push(this.loadTrack(a[d].track))
            }
        },
        onStoragePostLoad: function(a) {
            if (a = a.bgm) {
                this.defaultTrackTypeStack = a.defaultTrackTypeStack;
                for (var d = a.trackStack, c = 0; c < d.length; ++c) {
                    var e = b[c];
                    this.push(e, d[c].volume, "IMMEDIATELY");
                    e.clearCached()
                }
                this.overloadDefault = a.overloadDefault;
                this.resumeOnChange = a.resumeOnChange || null;
                b.length = 0;
                a.paused && this.pause("IMMEDIATELY")
            }
        },
        levelLoadStartOrder: 100,
        onLevelLoadStart: function(a) {
            this.clearResumeOnChange();
            if (a.attributes &&
                a.attributes.bgm) {
                this.mapDefaultTrackSet && this.mapDefaultTrackSet.clearCached();
                this.mapDefaultTrackSet = this.loadTrackSet(a.attributes.bgm);
                this.setDefault(this.mapDefaultTrackSet, null, true)
            }
        },
        levelLoadedOrder: 100,
        onLevelLoaded: function() {
            this.delayedResume = 2;
            this.pauseAutoResumeBlock = false
        },
        onReset: function() {
            this.clear("MEDIUM")
        },
        onDeferredUpdate: function() {
            if (this.delayedResume) {
                this.delayedResume--;
                this.delayedResume == 0 && !this.overloadDefault && !this.pauseAutoResumeBlock && this.resumeDefault()
            }
        },
        _getModeData: function(a) {
            return ig.BGM_SWITCH_MODE[a] || ig.BGM_SWITCH_MODE[this.defaultMode]
        },
        _getDefaultTrackEntry: function() {
            var a = this.defaultTrackTypeStack[this.defaultTrackTypeStack.length - 1];
            return this.defaultTrackSet && this.defaultTrackSet.get(a)
        }
    });
    ig.addGameAddon(function() {
        return ig.bgm = new ig.Bgm
    });
    ig.Bgm.startTrack = null;
    ig.Bgm.preloadStartTrack = function(a) {
        ig.Bgm.startTrack = new ig.BgmTrack(a)
    }
});
ig.baked = !0;

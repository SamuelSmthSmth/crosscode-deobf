/**
 * impact.feature.bgm.bgm
 * ======================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.bgm.bgm")`.
 *
 * The background-music subsystem:
 *   - `ig.BGM_SWITCH_MODE` — named fade in/out presets for track changes.
 *   - `ig.BGM_TRACK_LIST` / `ig.BGM_DEFAULT_TRACKS` — registered track / track
 *     set definitions (filled by other modules, e.g. `game.feature.bgm.*`).
 *   - `ig.BgmTrack` / `ig.BgmTrackSet` — cached wrappers around `ig.Track`.
 *   - `ig.Bgm` (`ig.bgm`) — the game add-on managing a stack of tracks on top
 *     of a default track set, with save/load integration via `ig.storage`.
 */
ig.module("impact.feature.bgm.bgm")
    .requires("impact.base.event", "impact.base.game", "impact.base.sound", "impact.feature.storage.storage")
    .defines(function () {

    ig.BGM_SWITCH_MODE = {
        IMMEDIATELY: { fadeOut: 0, fadeIn: 0 },
        FAST_OUT: { fadeOut: 0.5, fadeIn: 0 },
        MEDIUM_OUT: { fadeOut: 1, fadeIn: 0 },
        SLOW_OUT: { fadeOut: 2, fadeIn: 0 },
        VERY_SLOW_OUT: { fadeOut: 5, fadeIn: 0 },
        FAST: { fadeOut: 0.5, fadeIn: 0.5 },
        MEDIUM: { fadeOut: 1, fadeIn: 1 },
        SLOW: { fadeOut: 2, fadeIn: 2 },
        VERY_SLOW: { fadeOut: 5, fadeIn: 5 }
    };

    ig.BGM_TRACK_LIST = {};
    ig.BGM_DEFAULT_TRACKS = {};

    /** A cached reference to one background track by name. */
    ig.BgmTrack = ig.Class.extend({
        name: null,
        track: null,

        init: function (name) {
            this.name = name;
            var trackDef = ig.BGM_TRACK_LIST[name];
            if (trackDef) {
                this.track = new ig.Track(trackDef.path, trackDef.loopEnd, trackDef.introPath, trackDef.introEnd, trackDef.volume);
            }
        },

        get: function () {
            return this.track;
        },

        clearCached: function () {
            this.track && this.track.decreaseRef();
        },

        copy: function () {
            return new ig.BgmTrack(this.name);
        }
    });

    /** A named set of tracks (one per track type, e.g. field / battle). */
    ig.BgmTrackSet = ig.Class.extend({
        name: null,
        entries: null,

        init: function (name) {
            var entries = {},
                defaultTracks = ig.BGM_DEFAULT_TRACKS[name],
                trackType;
            for (trackType in defaultTracks) {
                entries[trackType] = {
                    track: ig.bgm.loadTrack(defaultTracks[trackType].track),
                    volume: defaultTracks[trackType].volume
                };
            }
            this.name = name;
            this.entries = entries;
        },

        get: function (trackType) {
            return this.entries[trackType];
        },

        clearCached: function () {
            for (var trackType in this.entries) this.entries[trackType].track.clearCached();
        },

        copy: function () {
            return new ig.BgmTrackSet(this.name);
        }
    });

    /** Tracks held across a save/load cycle (filled by onStoragePreLoad). */
    var reservedTracks = [];

    /** The BGM game add-on; owns the track stack and the default track set. */
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

        init: function () {
            this.parent("BGM");
            ig.storage.register(this);
        },

        loadTrack: function (name) {
            if (ig.music) return new ig.BgmTrack(name);
        },

        loadTrackSet: function (name) {
            return new ig.BgmTrackSet(name);
        },

        /**
         * Replace the default track set; unless `skipResume` (or the default
         * is currently overloaded), resume the default tracks right away.
         */
        setDefault: function (trackSet, mode, skipResume) {
            this.clearResumeOnChange();
            this.defaultTrackSet && this.defaultTrackSet.clearCached();
            this.defaultTrackSet = trackSet.copy();
            !skipResume && !this.overloadDefault && this.resumeDefault(mode);
        },

        isPlayingDefault: function () {
            return !this.overloadDefault;
        },

        getDefaultTrackTypeCount: function () {
            return this.defaultTrackTypeStack.length;
        },

        hasDefaultTrackType: function (trackType) {
            return !(!this.defaultTrackSet || !this.defaultTrackSet.get(trackType));
        },

        /** Push a track type onto the default stack (e.g. during battle). */
        pushDefaultTrackType: function (trackType, mode) {
            this.clearResumeOnChange();
            this.defaultTrackTypeStack.push(trackType);
            this.overloadDefault || this.resumeDefault(mode);
        },

        popDefaultTrackType: function (mode) {
            this.clearResumeOnChange();
            this.defaultTrackTypeStack.pop();
            this.overloadDefault || this.resumeDefault(mode);
        },

        setResumeOnChange: function (mode) {
            this.resumeOnChange = mode;
        },

        /** If a delayed resume is pending, run it now. */
        clearResumeOnChange: function () {
            this.resumeOnChange && this.resumeDefault(this.resumeOnChange);
        },

        /**
         * Restore the default track set: pop the stack down to the default
         * depth and play the current default track type (if not already
         * playing).
         */
        resumeDefault: function (mode) {
            this.resumeOnChange = null;
            for (var defaultStackDepth = this.defaultTrackTypeStack.length; this.trackStack.length > defaultStackDepth;) {
                this.pop(mode);
            }
            var defaultEntry = this._getDefaultTrackEntry();
            if (defaultEntry) {
                this.trackStack.length < defaultStackDepth && this.push(defaultEntry.track, defaultEntry.volume, mode);
                ig.music.isTrackPlaying(defaultEntry.track.track, defaultEntry.volume) ||
                    this.play(defaultEntry.track, defaultEntry.volume, mode);
            }
            this.overloadDefault = false;
        },

        /** Play a track (replacing the current one) and mark the default as overloaded. */
        play: function (track, volume, mode) {
            this.clearResumeOnChange();
            this.overloadDefault = true;
            mode = this._getModeData(mode);
            ig.music.play(track.get(), mode.fadeOut, mode.fadeIn, volume);
            (mode = this.trackStack.pop()) && mode.track.clearCached();
            this.trackStack.push({ track: track.copy(), volume: volume });
        },

        /** Push a track on top of the current one. */
        push: function (track, volume, mode) {
            this.clearResumeOnChange();
            this.overloadDefault = true;
            mode = this._getModeData(mode);
            ig.music.push(track.get(), mode.fadeOut, mode.fadeIn, volume);
            this.trackStack.push({ track: track.copy(), volume: volume });
        },

        /** Pop the top track; when back at the default depth, un-overload. */
        pop: function (mode) {
            this.clearResumeOnChange();
            mode = this._getModeData(mode);
            ig.music.pop(mode.fadeOut, mode.fadeIn);
            (mode = this.trackStack.pop()) && mode.track.clearCached();
            mode = this._getDefaultTrackEntry();
            if (this.trackStack.length == this.defaultTrackTypeStack.length &&
                mode && ig.music.isTrackPlaying(mode.track.get(), mode.volume)) {
                this.overloadDefault = false;
            }
        },

        /** Stop all music and drop the default track set. */
        clear: function (mode) {
            for (this.resumeOnChange = null; this.defaultTrackTypeStack.length > 1;) {
                this.popDefaultTrackType(mode);
            }
            for (this.overloadDefault = false; this.trackStack.length > 0;) {
                this.pop(mode);
            }
            this.defaultTrackSet && this.defaultTrackSet.clearCached();
            this.defaultTrackSet = null;
        },

        /** Play a one-off track without touching the stack. */
        inbetween: function (track, volume, mode) {
            mode = this._getModeData(mode);
            ig.music.inbetween(track.get(), mode.fadeIn, mode.fadeOut, volume);
        },

        pause: function (mode) {
            mode = this._getModeData(mode);
            ig.music.pause(mode.fadeOut);
            this.pauseAutoResumeBlock = true;
        },

        resume: function (mode) {
            mode = this._getModeData(mode);
            ig.music.resume(mode.fadeIn);
        },

        /** Serialise the BGM state into the save object. */
        onStorageSave: function (saveData) {
            var tracks = [];
            for (var i = 0; i < this.trackStack.length; ++i) {
                tracks.push({
                    track: this.trackStack[i].track.name,
                    volume: this.trackStack[i].volume
                });
            }
            saveData.bgm = {
                defaultTrackSet: this.defaultTrackSet ? this.defaultTrackSet.name : null,
                defaultTrackTypeStack: this.defaultTrackTypeStack,
                trackStack: tracks,
                overloadDefault: this.overloadDefault,
                paused: ig.music.paused,
                resumeOnChange: this.resumeOnChange
            };
        },

        /** Before the level loads: rebuild the track set and reserve tracks. */
        onStoragePreLoad: function (data) {
            data = data.bgm;
            this.clear();
            if (data) {
                this.defaultTrackSet = this.loadTrackSet(data.defaultTrackSet);
                for (var tracks = data.trackStack, i = 0; i < tracks.length; ++i) {
                    reservedTracks.push(this.loadTrack(tracks[i].track));
                }
            }
        },

        /** After the level loads: replay the reserved tracks and restore state. */
        onStoragePostLoad: function (data) {
            if (data = data.bgm) {
                this.defaultTrackTypeStack = data.defaultTrackTypeStack;
                for (var tracks = data.trackStack, i = 0; i < tracks.length; ++i) {
                    var track = reservedTracks[i];
                    this.push(track, tracks[i].volume, "IMMEDIATELY");
                    track.clearCached();
                }
                this.overloadDefault = data.overloadDefault;
                this.resumeOnChange = data.resumeOnChange || null;
                reservedTracks.length = 0;
                data.paused && this.pause("IMMEDIATELY");
            }
        },

        levelLoadStartOrder: 100,

        /** Load the map's default track set. */
        onLevelLoadStart: function (levelData) {
            this.clearResumeOnChange();
            if (levelData.attributes && levelData.attributes.bgm) {
                this.mapDefaultTrackSet && this.mapDefaultTrackSet.clearCached();
                this.mapDefaultTrackSet = this.loadTrackSet(levelData.attributes.bgm);
                this.setDefault(this.mapDefaultTrackSet, null, true);
            }
        },

        levelLoadedOrder: 100,
        onLevelLoaded: function () {
            this.delayedResume = 2;
            this.pauseAutoResumeBlock = false;
        },

        onReset: function () {
            this.clear("MEDIUM");
        },

        /** Resume the default tracks a couple of frames after level load. */
        onDeferredUpdate: function () {
            if (this.delayedResume) {
                this.delayedResume--;
                this.delayedResume == 0 && !this.overloadDefault && !this.pauseAutoResumeBlock && this.resumeDefault();
            }
        },

        _getModeData: function (mode) {
            return ig.BGM_SWITCH_MODE[mode] || ig.BGM_SWITCH_MODE[this.defaultMode];
        },

        _getDefaultTrackEntry: function () {
            var trackType = this.defaultTrackTypeStack[this.defaultTrackTypeStack.length - 1];
            return this.defaultTrackSet && this.defaultTrackSet.get(trackType);
        }
    });

    ig.addGameAddon(function () {
        return ig.bgm = new ig.Bgm();
    });

    ig.Bgm.startTrack = null;

    /** Preload a start track before the game boots. */
    ig.Bgm.preloadStartTrack = function (name) {
        ig.Bgm.startTrack = new ig.BgmTrack(name);
    };
});
ig.baked = !0;

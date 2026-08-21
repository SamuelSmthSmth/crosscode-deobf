/**
 * impact.feature.bgm.bgm-steps
 * ============================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.bgm.bgm-steps")`.
 *
 * Registers the BGM event steps: `PLAY_BGM`, `PAUSE_BGM`, `RESUME_BGM`,
 * `PUSH_BGM`, `POP_BGM`, `PLAY_IN_BETWEEN_BGM`, `SET_DEFAULT_BGM` and
 * `RESUME_DEFAULT_BGM`. All delegate to the `ig.bgm` add-on.
 */
ig.module("impact.feature.bgm.bgm-steps")
    .requires("impact.base.action", "impact.base.event", "impact.feature.bgm.bgm")
    .defines(function () {

    ig.EVENT_STEP.PLAY_BGM = ig.EventStepBase.extend({
        track: null,
        volume: null,
        mode: null,

        _wm: new ig.Config({
            attributes: {
                bgm: {
                    _type: "String",
                    _info: "Background Music to play",
                    _select: ig.BGM_TRACK_LIST
                },
                volume: {
                    _type: "Number",
                    _info: "Volume of music (0 = silent, 1 = max volume)"
                },
                mode: {
                    _type: "String",
                    _info: "Mode of transition",
                    _select: ig.BGM_SWITCH_MODE
                }
            }
        }),

        init: function (params) {
            this.track = ig.bgm.loadTrack(params.bgm);
            this.volume = params.volume || 1;
            this.mode = params.mode || 0;
        },

        clearCached: function () {
            this.track.clearCached();
        },

        run: function () {
            ig.bgm.play(this.track, this.volume, this.mode);
            return true;
        }
    });

    ig.EVENT_STEP.PAUSE_BGM = ig.EventStepBase.extend({
        mode: null,

        _wm: new ig.Config({
            attributes: {
                mode: {
                    _type: "String",
                    _info: "Mode of transition",
                    _select: ig.BGM_SWITCH_MODE
                }
            }
        }),

        init: function (params) {
            this.mode = params.mode || 0;
        },

        run: function () {
            ig.bgm.pause(this.mode);
            return true;
        }
    });

    ig.EVENT_STEP.RESUME_BGM = ig.EventStepBase.extend({
        mode: null,

        _wm: new ig.Config({
            attributes: {
                mode: {
                    _type: "String",
                    _info: "Mode of transition",
                    _select: ig.BGM_SWITCH_MODE
                }
            }
        }),

        init: function (params) {
            this.mode = params.mode || 0;
        },

        run: function () {
            ig.bgm.resume(this.mode);
            return true;
        }
    });

    ig.EVENT_STEP.PUSH_BGM = ig.EventStepBase.extend({
        track: null,
        volume: null,
        mode: null,

        _wm: new ig.Config({
            attributes: {
                bgm: {
                    _type: "String",
                    _info: "Background Music to play",
                    _select: ig.BGM_TRACK_LIST
                },
                volume: {
                    _type: "Number",
                    _info: "Volume of music (0 = silent, 1 = max volume)"
                },
                mode: {
                    _type: "String",
                    _info: "Mode of transition",
                    _select: ig.BGM_SWITCH_MODE
                }
            }
        }),

        init: function (params) {
            this.track = ig.bgm.loadTrack(params.bgm);
            this.volume = params.volume || 1;
            this.mode = params.mode || 0;
        },

        clearCached: function () {
            this.track.clearCached();
        },

        run: function () {
            ig.bgm.push(this.track, this.volume, this.mode);
            return true;
        }
    });

    ig.EVENT_STEP.POP_BGM = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                mode: {
                    _type: "String",
                    _info: "Mode of transition",
                    _select: ig.BGM_SWITCH_MODE
                }
            }
        }),

        init: function (params) {
            this.mode = params.mode || 0;
        },

        run: function () {
            ig.bgm.pop(this.mode);
            return true;
        }
    });

    ig.EVENT_STEP.PLAY_IN_BETWEEN_BGM = ig.EventStepBase.extend({
        track: null,
        volume: null,
        mode: null,

        _wm: new ig.Config({
            attributes: {
                bgm: {
                    _type: "String",
                    _info: "Background Music to play only once",
                    _select: ig.BGM_TRACK_LIST
                },
                volume: {
                    _type: "Number",
                    _info: "Volume of music (0 = silent, 1 = max volume)"
                },
                mode: {
                    _type: "String",
                    _info: "Mode of transition",
                    _select: ig.BGM_SWITCH_MODE
                }
            }
        }),

        init: function (params) {
            this.track = ig.bgm.loadTrack(params.bgm);
            this.volume = params.volume || 1;
            this.mode = params.mode || 0;
        },

        clearCached: function () {
            this.track.clearCached();
        },

        run: function () {
            ig.bgm.inbetween(this.track, this.volume, this.mode);
            return true;
        }
    });

    ig.EVENT_STEP.SET_DEFAULT_BGM = ig.EventStepBase.extend({
        trackSet: null,
        mode: null,

        _wm: new ig.Config({
            attributes: {
                defaultBgm: {
                    _type: "String",
                    _info: "Default BGM",
                    _select: ig.BGM_DEFAULT_TRACKS
                },
                mode: {
                    _type: "String",
                    _info: "Mode of transition",
                    _select: ig.BGM_SWITCH_MODE
                }
            }
        }),

        init: function (params) {
            this.trackSet = ig.bgm.loadTrackSet(params.defaultBgm);
            this.mode = params.mode || 0;
        },

        clearCached: function () {
            this.trackSet.clearCached();
        },

        run: function () {
            ig.bgm.setDefault(this.trackSet, this.mode);
            return true;
        }
    });

    ig.EVENT_STEP.RESUME_DEFAULT_BGM = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                mode: {
                    _type: "String",
                    _info: "Mode of transition",
                    _select: ig.BGM_SWITCH_MODE
                },
                delayed: {
                    _type: "Boolean",
                    _info: "Resume default BGM later when changing map or after anything changes about the music"
                }
            }
        }),

        init: function (params) {
            this.mode = params.mode || 0;
            this.delayed = params.delayed || false;
        },

        run: function () {
            this.delayed ? ig.bgm.setResumeOnChange(this.mode) : ig.bgm.resumeDefault(this.mode);
            return true;
        }
    });
});
ig.baked = !0;

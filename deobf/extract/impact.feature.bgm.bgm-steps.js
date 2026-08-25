ig.module("impact.feature.bgm.bgm-steps").requires("impact.base.action", "impact.base.event", "impact.feature.bgm.bgm").defines(function() {
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
        init: function(b) {
            this.track =
                ig.bgm.loadTrack(b.bgm);
            this.volume = b.volume || 1;
            this.mode = b.mode || 0
        },
        clearCached: function() {
            this.track.clearCached()
        },
        run: function() {
            ig.bgm.play(this.track, this.volume, this.mode);
            return true
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
        init: function(b) {
            this.mode = b.mode || 0
        },
        run: function() {
            ig.bgm.pause(this.mode);
            return true
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
        init: function(b) {
            this.mode = b.mode || 0
        },
        run: function() {
            ig.bgm.resume(this.mode);
            return true
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
        init: function(b) {
            this.track = ig.bgm.loadTrack(b.bgm);
            this.volume = b.volume || 1;
            this.mode = b.mode || 0
        },
        clearCached: function() {
            this.track.clearCached()
        },
        run: function() {
            ig.bgm.push(this.track, this.volume, this.mode);
            return true
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
        init: function(b) {
            this.mode = b.mode || 0
        },
        run: function() {
            ig.bgm.pop(this.mode);
            return true
        }
    });
    ig.EVENT_STEP.PLAY_IN_BETWEEN_BGM =
        ig.EventStepBase.extend({
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
            init: function(b) {
                this.track = ig.bgm.loadTrack(b.bgm);
                this.volume = b.volume || 1;
                this.mode = b.mode || 0
            },
            clearCached: function() {
                this.track.clearCached()
            },
            run: function() {
                ig.bgm.inbetween(this.track,
                    this.volume, this.mode);
                return true
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
        init: function(b) {
            this.trackSet = ig.bgm.loadTrackSet(b.defaultBgm);
            this.mode = b.mode || 0
        },
        clearCached: function() {
            this.trackSet.clearCached()
        },
        run: function() {
            ig.bgm.setDefault(this.trackSet, this.mode);
            return true
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
        init: function(b) {
            this.mode = b.mode || 0;
            this.delayed = b.delayed || false
        },
        run: function() {
            this.delayed ? ig.bgm.setResumeOnChange(this.mode) : ig.bgm.resumeDefault(this.mode);
            return true
        }
    })
});
ig.baked = !0;

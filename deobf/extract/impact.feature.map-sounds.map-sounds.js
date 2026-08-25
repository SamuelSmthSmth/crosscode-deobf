ig.module("impact.feature.map-sounds.map-sounds").requires("impact.base.game").defines(function() {
    ig.MAP_SOUNDS = {};
    ig.MAP_SOUNDS.CARGO_SHIP_OUTSIDE = {
        loop: [{
            path: "media/sound/background/cargo/cargo-ambient-out.ogg",
            volume: 1
        }, {
            path: "media/sound/background/cargo/ocean-ambient.ogg",
            volume: 0.5
        }],
        segments: [
            [{
                wait: 1
            }, {
                path: "media/sound/background/cargo/seagull-a.ogg",
                volume: 0.8
            }, {
                wait: 10
            }],
            [{
                wait: 2
            }, {
                path: "media/sound/background/cargo/seagull-a.ogg",
                volume: 0.4
            }, {
                wait: 8
            }],
            [{
                wait: 2
            }, {
                path: "media/sound/background/cargo/seagull-b.ogg",
                volume: 0.5
            }, {
                wait: 15
            }],
            [{
                wait: 2
            }, {
                path: "media/sound/background/cargo/seagull-b.ogg",
                volume: 0.7
            }, {
                wait: 17
            }],
            [{
                wait: 1
            }, {
                path: "media/sound/background/cargo/seagull-c.ogg",
                volume: 0.7
            }, {
                wait: 11
            }]
        ]
    };
    ig.MAP_SOUNDS.CARGO_SHIP_OUTSIDE_RAIN = {
        loop: [{
            path: "media/sound/background/cargo/cargo-ambient-out.ogg",
            volume: 1
        }, {
            path: "media/sound/background/cargo/ocean-ambient.ogg",
            volume: 0.5
        }],
        segments: []
    };
    ig.MAP_SOUNDS.CARGO_SHIP_INSIDE = {
        loop: [{
            path: "media/sound/background/ship-outside.ogg",
            volume: 1
        }],
        segments: []
    };
    ig.MAP_SOUNDS.STRONG_RAIN = {
        loop: [{
            path: "media/sound/background/rain.ogg",
            volume: 0.7
        }],
        segments: []
    };
    ig.MAP_SOUNDS.LIGHT_WIND = {
        loop: [{
            path: "media/sound/background/wind.ogg",
            volume: 0.8
        }],
        segments: []
    };
    ig.MAP_SOUNDS.CARGO_SHIP_AMBIENT_A = {
        loop: [{
            path: "media/sound/background/cargo/cargo-ambient-a.ogg",
            volume: 0.2
        }],
        segments: []
    };
    ig.MAP_SOUNDS.CARGO_SHIP_AMBIENT_B = {
        loop: [{
            path: "media/sound/background/cargo/cargo-ambient-b.ogg",
            volume: 0.6
        }],
        segments: []
    };
    ig.MAP_SOUNDS.CARGO_SHIP_AMBIENT_C = {
        loop: [{
            path: "media/sound/background/cargo/cargo-ambient-c.ogg",
            volume: 0.6
        }],
        segments: []
    };
    ig.MAP_SOUNDS.CARGO_SHIP_AMBIENT_D = {
        loop: [{
            path: "media/sound/background/cargo/cargo-ambient-d.ogg",
            volume: 0.6
        }],
        segments: []
    };
    ig.MAP_SOUNDS.CARGO_SHIP_AMBIENT_E = {
        loop: [{
            path: "media/sound/background/cargo/cargo-ambient-e.ogg",
            volume: 0.6
        }],
        segments: []
    };
    ig.MAP_SOUNDS.CARGO_SHIP_AMBIENT_F = {
        loop: [{
            path: "media/sound/background/cargo/cargo-ambient-f.ogg",
            volume: 0.5
        }],
        segments: []
    };
    ig.MAP_SOUNDS.CARGO_SHIP_AMBIENT_G = {
        loop: [{
            path: "media/sound/background/cargo/cargo-ambient-g.ogg",
            volume: 0.6
        }],
        segments: []
    };
    ig.MAP_SOUNDS.CARGO_SHIP_AMBIENT_H = {
        loop: [{
            path: "media/sound/background/cargo/cargo-ambient-h.ogg",
            volume: 0.6
        }],
        segments: []
    };
    ig.MAP_SOUNDS.HIDEOUT_AMBIENT = {
        loop: [{
            path: "media/sound/background/hideout/hideout-ambient.ogg",
            volume: 0.8
        }],
        segments: []
    };
    ig.MAP_SOUNDS.HIDEOUT_INNER_AMBIENT = {
        loop: [{
            path: "media/sound/background/hideout/hideout-inner-ambient.ogg",
            volume: 1
        }],
        segments: []
    };
    ig.MAP_SOUNDS.SAPPHIRE_RIDGE_AMBIENT = {
        loop: [{
            path: "media/sound/background/sapphire-ridge/sapphire-ridge-ambient.ogg",
            volume: 1
        }],
        segments: []
    };
    ig.MAP_SOUNDS.HIDEOUT_OFFICE_AMBIENT = {
        loop: [{
            path: "media/sound/background/hideout/hideout-office-ambient.ogg",
            volume: 0.8
        }],
        segments: []
    };
    ig.MAP_SOUNDS.CROSS_CENTRAL_INNER = {
        loop: [{
            path: "media/sound/background/rhombus-square/cross-central-inner.ogg",
            volume: 1
        }],
        segments: []
    };
    ig.MAP_SOUNDS.NEWCOMERS_BRIDGE = {
        loop: [{
            path: "media/sound/background/rhombus-square/bridge-wind-ambient.ogg",
            volume: 0.7
        }],
        segments: []
    };
    ig.MAP_SOUNDS.BERGEN_TRAIL_WIND = {
        loop: [{
            path: "media/sound/background/bergen-trail/bergen-wind.ogg",
            volume: 1
        }],
        segments: []
    };
    ig.MAP_SOUNDS.BERGEN_TRAIL_WIND_SUBTLE = {
        loop: [{
            path: "media/sound/background/bergen-trail/bergen-wind-subtle.ogg",
            volume: 1
        }],
        segments: []
    };
    ig.MAP_SOUNDS.ROOKIE_HARBOR_TELEPORTER = {
        loop: [{
            path: "media/sound/background/cargo/ocean-ambient.ogg",
            volume: 0.5
        }],
        segments: [
            [{
                wait: 1
            }, {
                path: "media/sound/background/cargo/seagull-a.ogg",
                volume: 0.8
            }, {
                wait: 10
            }],
            [{
                wait: 2
            }, {
                path: "media/sound/background/cargo/seagull-a.ogg",
                volume: 0.4
            }, {
                wait: 8
            }],
            [{
                wait: 2
            }, {
                path: "media/sound/background/cargo/seagull-b.ogg",
                volume: 0.5
            }, {
                wait: 15
            }],
            [{
                wait: 2
            }, {
                path: "media/sound/background/cargo/seagull-b.ogg",
                volume: 0.7
            }, {
                wait: 17
            }],
            [{
                wait: 1
            }, {
                path: "media/sound/background/cargo/seagull-c.ogg",
                volume: 0.7
            }, {
                wait: 11
            }]
        ]
    };
    ig.MAP_SOUNDS.ROOKIE_HARBOR_OCEAN = {
        loop: [{
            path: "media/sound/background/cargo/ocean-ambient.ogg",
            volume: 0.5
        }],
        segments: []
    };
    ig.MAP_SOUNDS.CROWD = {
        loop: [{
            path: "media/sound/background/crowd-ambient.ogg",
            volume: 0.5
        }],
        segments: []
    };
    ig.MAP_SOUNDS.ROOKIE_HARBOR_CROWD = {
        loop: [{
            path: "media/sound/background/crowd-ambient.ogg",
            volume: 0.5
        }],
        segments: []
    };
    ig.MAP_SOUNDS.HEAT_AREA_DESERT = {
        loop: [{
            path: "media/sound/background/desert/desert-ambient.ogg",
            volume: 0.5
        }],
        segments: []
    };
    ig.MAP_SOUNDS.HEAT_AREA_WIND = {
        loop: [{
            path: "media/sound/background/desert/sandstorm-ambient.ogg",
            volume: 0.2
        }],
        segments: []
    };
    ig.MAP_SOUNDS.HEAT_AREA_OASIS = {
        loop: [{
            path: "media/sound/background/desert/oasis-ambient.ogg",
            volume: 1
        }],
        segments: []
    };
    ig.MAP_SOUNDS.CAVE = {
        loop: [{
            path: "media/sound/background/cave-ambient.ogg",
            volume: 0.8
        }],
        segments: []
    };
    ig.MAP_SOUNDS.CAVE_WATER_DROPS = {
        loop: [{
            path: "media/sound/background/cave-water-drops.ogg",
            volume: 1
        }],
        segments: []
    };
    ig.MAP_SOUNDS["BAKI-KUM"] = {
        loop: [{
            path: "media/sound/background/baki-kum/baki-kum-ambient.ogg",
            volume: 0.8
        }],
        segments: []
    };
    ig.MAP_SOUNDS.HEAT_DUNGEON_OUTSIDE = {
        loop: [{
            path: "media/sound/background/strong-wind.ogg",
            volume: 0.5
        }],
        segments: []
    };
    ig.MAP_SOUNDS.DREAM = {
        loop: [{
            path: "media/sound/background/dreams/dream-atmo.ogg",
            volume: 0.5
        }],
        segments: []
    };
    ig.MAP_SOUNDS.JUNGLE = {
        loop: [{
            path: "media/sound/background/jungle/jungle-atmo.ogg",
            volume: 0.5
        }],
        segments: []
    };
    ig.MAP_SOUNDS.JUNGLE_INFESTED = {
        loop: [{
            path: "media/sound/background/jungle/jungle-atmo-infested.ogg",
            volume: 0.5
        }],
        segments: []
    };
    ig.MAP_SOUNDS.JUNGLE_CITY_INNER = {
        loop: [{
            path: "media/sound/background/rain-inside.ogg",
            volume: 1
        }],
        segments: []
    };
    ig.MAP_SOUNDS.JUNGLE_CITY_OUTER = {
        loop: [{
            path: "media/sound/background/basin-keep/basin-keep-ambient.ogg",
            volume: 0.5
        }],
        segments: []
    };
    ig.MAP_SOUNDS.COLD_DUNGEON = {
        loop: [{
            path: "media/sound/background/dungeons/cold-ambient.ogg",
            volume: 1
        }],
        segments: []
    };
    ig.MAP_SOUNDS.HEAT_DUNGEON = {
        loop: [{
            path: "media/sound/background/dungeons/heat-ambient.ogg",
            volume: 1
        }],
        segments: []
    };
    ig.MAP_SOUNDS.HEAT_DUNGEON_WATER = {
        loop: [{
            path: "media/sound/background/dungeons/heat-ambient-water.ogg",
            volume: 1
        }],
        segments: []
    };
    ig.MAP_SOUNDS.SHOCK_DUNGEON = {
        loop: [{
            path: "media/sound/background/dungeons/shock-ambient.ogg",
            volume: 1
        }],
        segments: []
    };
    ig.MAP_SOUNDS.WAVE_DUNGEON = {
        loop: [{
            path: "media/sound/background/dungeons/wave-ambient.ogg",
            volume: 1
        }],
        segments: []
    };
    ig.MAP_SOUNDS.TREE_DUNGEON = {
        loop: [{
            path: "media/sound/background/dungeons/tree-ambient.ogg",
            volume: 0.65
        }],
        segments: []
    };
    ig.MAP_SOUNDS.SPOOKY_INNER = {
        loop: [{
            path: "media/sound/background/dreams/dream-atmo.ogg",
            volume: 0.5
        }, {
            path: "media/sound/scenes/halloween/spooky-ambience.ogg",
            volume: 1
        }],
        segments: []
    };
    ig.MAP_SOUNDS.ARID_OUTSIDE = {
        loop: [{
            path: "media/sound/background/arid/arid-atmo.ogg",
            volume: 1
        }],
        segments: []
    };
    ig.MAP_SOUNDS.ARID_INSIDE = {
        loop: [{
            path: "media/sound/background/arid/arid-atmo-inside.ogg",
            volume: 1
        }],
        segments: []
    };
    ig.MAP_SOUNDS.SERIOUS_AMBIENT = {
        loop: [{
            path: "media/sound/background/serious-ambient.ogg",
            volume: 0.7
        }],
        segments: []
    };
    ig.MAP_SOUNDS.LAB = {
        loop: [{
            path: "media/sound/background/lab/lab-ambient.ogg",
            volume: 1
        }],
        segments: []
    };
    ig.MAP_SOUNDS.EVO_VILLAGE = {
        loop: [{
            path: "media/sound/background/evo-village/evo-village-outside.ogg",
            volume: 1
        }],
        segments: []
    };
    ig.MAP_SOUNDS.FINAL_DUNGEON_INSIDE = {
        loop: [{
            path: "media/sound/background/final-dng/final-dng-inside.ogg",
            volume: 0.7
        }],
        segments: []
    };
    ig.MAP_SOUNDS.FINAL_DUNGEON_OUTSIDE = {
        loop: [{
            path: "media/sound/background/final-dng/final-dng-outside.ogg",
            volume: 0.7
        }],
        segments: []
    };
    ig.MAP_SOUNDS.FINAL_DUNGEON_OUTSIDE_WINDY = {
        loop: [{
            path: "media/sound/background/final-dng/final-dng-outside-windy.ogg",
            volume: 0.7
        }],
        segments: []
    };
    ig.MAP_SOUNDS.BEACH_AMBIENCE = {
        loop: [{
            path: "media/sound/background/beach/beach-ambience.ogg",
            volume: 0.7
        }],
        segments: []
    };
    ig.MAP_SOUNDS.ARENA_TOP = {
        loop: [{
            path: "media/sound/arena/crowd-ambience.ogg",
            volume: 0.8
        }, {
            path: "media/sound/background/rhombus-square/bridge-wind-ambient.ogg",
            volume: 0.6
        }],
        segments: []
    };
    ig.MAP_SOUNDS.RAID_BOSS_AMBIENCE = {
        loop: [{
            path: "media/sound/background/raid-boss-ambience.ogg",
            volume: 0.8
        }],
        segments: []
    };
    ig.MapSoundEntry = ig.Class.extend({
        name: null,
        loopSounds: [],
        segments: [],
        loopHandles: [],
        currentSegment: -1,
        currentEntry: 0,
        timer: 0,
        init: function(b) {
            this.name = b;
            var a = ig.MAP_SOUNDS[b];
            if (!a) throw Error('Map Sounds of name "' + b + '" not found.');
            for (var d = a.loop, b = 0; b < d.length; ++b) this.loopSounds.push(new ig.Sound(d[b].path, d[b].volume));
            a = a.segments;
            for (b = 0; b < a.length; ++b) this.segments.push(this._createSegment(a[b]))
        },
        clearCached: function() {
            for (var b = this.loopSounds.length; b--;) this.loopSounds[b].clearCached();
            for (b = this.segments.length; b--;)
                for (var a = this.segments[b].entries.length; a--;) this.segments[b].entries[a].sound.clearCached()
        },
        start: function() {
            for (var b = this.loopSounds.length; b--;) this.loopHandles.push(this.loopSounds[b].play(true));
            this.currentSegment = -1;
            this.timer = this.currentEntry = 0
        },
        update: function() {
            if (this.segments.length && ig.system.tick) {
                this.currentSegment == -1 && this._selectSegment();
                var b = this.segments[this.currentSegment];
                this.timer = this.timer + ig.system.actualTick;
                for (var a = b.entries; this.currentEntry < a.length && a[this.currentEntry].time <= this.timer;) {
                    a[this.currentEntry].sound.play();
                    this.currentEntry++
                }
                if (this.timer >= b.maxTime) {
                    this.timer = this.timer - b.maxTime;
                    this._selectSegment()
                }
            }
        },
        stop: function() {
            for (var b = this.loopHandles.length; b--;) this.loopHandles[b].stop();
            this.loopHandles.length = 0
        },
        _createSegment: function(b) {
            for (var a = {
                    maxTime: 0,
                    entries: []
                }, d = 0, c = 0; c < b.length; ++c) {
                var e = b[c];
                e.wait ? d = d + e.wait : a.entries.push({
                    time: d,
                    sound: new ig.Sound(e.path, e.volume)
                })
            }
            a.maxTime = d;
            return a
        },
        _selectSegment: function() {
            this.currentSegment = Math.floor(Math.random() * this.segments.length);
            this.currentEntry = 0
        }
    });
    ig.MapSounds = ig.GameAddon.extend({
        mapEntry: null,
        currentEntry: null,
        init: function() {
            this.parent("MapSounds")
        },
        setEntry: function(b) {
            if (b != this.currentEntry) {
                this.currentEntry && this.currentEntry.stop();
                (this.currentEntry = b) && this.currentEntry.start()
            }
        },
        onReset: function() {
            this.setEntry(null)
        },
        levelLoadStartOrder: 100,
        onLevelLoadStart: function(b) {
            if (!this.mapEntry ||
                !(b.attributes && this.mapEntry.name == b.attributes["map-sounds"])) {
                this.mapEntry && this.mapEntry.clearCached();
                this.mapEntry = b.attributes && b.attributes["map-sounds"] ? new ig.MapSoundEntry(b.attributes["map-sounds"]) : null
            }
        },
        levelLoadedOrder: 100,
        onLevelLoaded: function() {
            this.setEntry(this.mapEntry)
        },
        deferredUpdateOrder: 0,
        onDeferredUpdate: function() {
            ig.game.paused || this.currentEntry && this.currentEntry.update()
        }
    });
    ig.addGameAddon(function() {
        return ig.mapSounds = new ig.MapSounds
    })
});
ig.baked = !0;

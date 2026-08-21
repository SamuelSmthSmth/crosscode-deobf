/**
 * impact.feature.map-sounds.map-sounds
 * ====================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.map-sounds.map-sounds")`.
 *
 * `ig.mapSounds` add-on: plays a looping background ambience for the current
 * map, optionally with randomized one-shot "segments" (e.g. seagulls). The
 * sound entries below are data, kept byte-identical to the original.
 */
ig.module("impact.feature.map-sounds.map-sounds")
    .requires("impact.base.game")
    .defines(function () {

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

    /** One configured map-sound set: loop sounds + randomized one-shot segments. */
    ig.MapSoundEntry = ig.Class.extend({
        name: null,
        loopSounds: [],
        segments: [],
        loopHandles: [],
        currentSegment: -1,
        currentEntry: 0,
        timer: 0,

        init: function (name) {
            this.name = name;
            var config = ig.MAP_SOUNDS[name];
            if (!config) throw Error('Map Sounds of name "' + name + '" not found.');
            for (var loop = config.loop, i = 0; i < loop.length; ++i) this.loopSounds.push(new ig.Sound(loop[i].path, loop[i].volume));
            config = config.segments;
            for (i = 0; i < config.length; ++i) this.segments.push(this._createSegment(config[i]));
        },

        clearCached: function () {
            for (var i = this.loopSounds.length; i--;) this.loopSounds[i].clearCached();
            for (i = this.segments.length; i--;)
                for (var j = this.segments[i].entries.length; j--;) this.segments[i].entries[j].sound.clearCached();
        },

        start: function () {
            for (var i = this.loopSounds.length; i--;) this.loopHandles.push(this.loopSounds[i].play(true));
            this.currentSegment = -1;
            this.timer = this.currentEntry = 0;
        },

        /** Play loop sounds; fire segment sounds at their scheduled times. */
        update: function () {
            if (this.segments.length && ig.system.tick) {
                this.currentSegment == -1 && this._selectSegment();
                var segment = this.segments[this.currentSegment];
                this.timer = this.timer + ig.system.actualTick;
                for (var entries = segment.entries; this.currentEntry < entries.length && entries[this.currentEntry].time <= this.timer;) {
                    entries[this.currentEntry].sound.play();
                    this.currentEntry++;
                }
                if (this.timer >= segment.maxTime) {
                    this.timer = this.timer - segment.maxTime;
                    this._selectSegment();
                }
            }
        },

        stop: function () {
            for (var i = this.loopHandles.length; i--;) this.loopHandles[i].stop();
            this.loopHandles.length = 0;
        },

        /** Convert a segment's wait/path list into { maxTime, entries:[{time,sound}] }. */
        _createSegment: function (segment) {
            var result = {
                    maxTime: 0,
                    entries: []
                },
                time = 0;
            for (var i = 0; i < segment.length; ++i) {
                var entry = segment[i];
                entry.wait ? time = time + entry.wait :
                    result.entries.push({
                        time: time,
                        sound: new ig.Sound(entry.path, entry.volume)
                    });
            }
            result.maxTime = time;
            return result;
        },

        _selectSegment: function () {
            this.currentSegment = Math.floor(Math.random() * this.segments.length);
            this.currentEntry = 0;
        }
    });

    /** The map-sounds add-on (`ig.mapSounds`). */
    ig.MapSounds = ig.GameAddon.extend({
        mapEntry: null,
        currentEntry: null,

        init: function () {
            this.parent("MapSounds");
        },

        setEntry: function (entry) {
            if (entry != this.currentEntry) {
                this.currentEntry && this.currentEntry.stop();
                (this.currentEntry = entry) && this.currentEntry.start();
            }
        },

        onReset: function () {
            this.setEntry(null);
        },

        levelLoadStartOrder: 100,

        onLevelLoadStart: function (level) {
            if (!this.mapEntry ||
                !(level.attributes && this.mapEntry.name == level.attributes["map-sounds"])) {
                this.mapEntry && this.mapEntry.clearCached();
                this.mapEntry = level.attributes && level.attributes["map-sounds"] ?
                    new ig.MapSoundEntry(level.attributes["map-sounds"]) : null;
            }
        },

        levelLoadedOrder: 100,

        onLevelLoaded: function () {
            this.setEntry(this.mapEntry);
        },

        deferredUpdateOrder: 0,

        onDeferredUpdate: function () {
            ig.game.paused || this.currentEntry && this.currentEntry.update();
        }
    });

    ig.addGameAddon(function () {
        return ig.mapSounds = new ig.MapSounds();
    });
});
ig.baked = !0;

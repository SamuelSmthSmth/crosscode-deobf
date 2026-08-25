/**
 * @module game.feature.arena.arena-cheer
 *
 * Manages arena crowd reaction sounds. Provides a pool of configurable
 * sound effects (applause, surprise reactions) with cooldown timers
 * and variance. Used by the Arena system to play reactive audio
 * during combat events.
 */
ig.module("game.feature.arena.arena-cheer").requires("impact.base.game", "impact.base.sound").defines(function() {
    var soundConfigs = {
        APPLAUSE: {
            sounds: [{
                sound: "media/sound/arena/applause-short-01.ogg",
                volume: 0.6
            }, {
                sound: "media/sound/arena/applause-short-02.ogg",
                volume: 0.6
            }, {
                sound: "media/sound/arena/applause-short-03.ogg",
                volume: 0.6
            }],
            maxVariance: 0.15,
            cooldown: 1,
            cooldownVariance: 1
        },
        SURPRISED: {
            sounds: [{
                sound: "media/sound/arena/crowd-ouh-01.ogg",
                volume: 0.6
            }, {
                sound: "media/sound/arena/crowd-ouh-02.ogg",
                volume: 0.6
            }, {
                sound: "media/sound/arena/crowd-ouh-03.ogg",
                volume: 0.6
            }],
            maxVariance: 0.15,
            cooldown: 1,
            cooldownVariance: 1
        }
    };
    sc.ArenaCrowdCheerController = ig.Class.extend({
        soundPool: {},
        update: function() {
            for (var key in this.soundPool) {
                var entry = this.soundPool[key];
                if (entry.timer > 0) entry.timer = entry.timer - ig.system.tick
            }
        },
        play: function(soundKey) {
            if (soundKey == "RANDOM") {
                soundKey = Object.keys(soundConfigs);
                soundKey = soundKey[Math.floor(Math.random() * soundKey.length)]
            }
            if (this.soundPool[soundKey]) {
                var entry = this.soundPool[soundKey];
                if (entry.timer <= 0) {
                    entry.sounds[Math.floor(Math.random() * entry.sounds.length)].play();
                    entry.timer = soundConfigs[soundKey].cooldown + Math.random() * soundConfigs[soundKey].cooldownVariance
                }
            }
        },
        resetTimers: function() {
            for (var key in this.soundPool) this.soundPool[key].timer = 0
        },
        loadCache: function() {
            for (var key in soundConfigs) {
                this.soundPool[key] = {
                    sounds: [],
                    timer: 0
                };
                for (var soundEntry = soundConfigs[key].sounds, idx = 0; idx < soundEntry.length; idx++) this.soundPool[key].sounds.push(new ig.Sound(soundEntry[idx].sound, soundEntry[idx].volume, soundEntry[idx].variance || soundConfigs[key].maxVariance))
            }
        },
        clearCache: function() {
            for (var key in this.soundPool)
                for (var sounds = this.soundPool[key].sounds, idx = sounds.length; idx--;) sounds[idx].clearCached();
            this.soundPool = {}
        }
    })
});
ig.baked = !0;
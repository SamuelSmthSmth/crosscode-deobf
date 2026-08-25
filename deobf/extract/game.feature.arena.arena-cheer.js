ig.module("game.feature.arena.arena-cheer").requires("impact.base.game", "impact.base.sound").defines(function() {
    var b = {
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
            for (var a in this.soundPool) {
                var b = this.soundPool[a];
                if (b.timer > 0) b.timer = b.timer - ig.system.tick
            }
        },
        play: function(a) {
            if (a == "RANDOM") {
                a = Object.keys(b);
                a = a[Math.floor(Math.random() * a.length)]
            }
            if (this.soundPool[a]) {
                var d = this.soundPool[a];
                if (d.timer <= 0) {
                    d.sounds[Math.floor(Math.random() * d.sounds.length)].play();
                    d.timer = b[a].cooldown + Math.random() * b[a].cooldownVariance
                }
            }
        },
        resetTimers: function() {
            for (var a in this.soundPool) this.soundPool[a].timer = 0
        },
        loadCache: function() {
            for (var a in b) {
                this.soundPool[a] = {
                    sounds: [],
                    timer: 0
                };
                for (var d = b[a].sounds, c = 0; c < d.length; c++) this.soundPool[a].sounds.push(new ig.Sound(d[c].sound, d[c].volume, d[c].variance || b[a].maxVariance))
            }
        },
        clearCache: function() {
            for (var a in this.soundPool)
                for (var b = this.soundPool[a].sounds, c = b.length; c--;) b[c].clearCached();
            this.soundPool = {}
        }
    })
});
ig.baked = !0;

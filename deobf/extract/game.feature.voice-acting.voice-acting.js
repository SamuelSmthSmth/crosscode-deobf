ig.module("game.feature.voice-acting.voice-acting").requires("impact.base.game").defines(function() {
    sc.VA_CONFIG = {};
    sc.VoiceActing = ig.GameAddon.extend({
        active: false,
        loaded: false,
        voices: {},
        init: function() {},
        toggle: function() {
            (this.active = !this.active) && this.load()
        },
        load: function() {
            if (!this.loaded) {
                for (var b in sc.VA_CONFIG) {
                    for (var a = sc.VA_CONFIG[b], d = [], c = 0; c < a.length; ++c) d[c] = this.loadConfigSounds(a[c]);
                    this.voices[b] = d
                }
                this.loaded = true
            }
        },
        loadConfigSounds: function(b) {
            for (var a = {
                        sounds: [],
                        filter: b.filter
                    },
                    d = 0; d < b.sounds.length; ++d) {
                var c = b.sounds[d];
                a.sounds[d] = new ig.Sound("media/sound/va/" + c.src, (c.volume || 1) * 1.5, 0, "voiceActing")
            }
            return a
        },
        play: function(b, a) {
            if (this.active) {
                var d = b.character.name,
                    c = b.expression;
                a instanceof ig.LangLabel && (a = a.data.en_US);
                a = a || "";
                if (d = this.voices[d]) {
                    for (var e = [], f = 0, g = d.length; g--;) {
                        var h = d[g],
                            i = 0;
                        if (h.filter && h.filter.text && a.toLowerCase().indexOf(h.filter.text.toLowerCase()) != -1) {
                            i = i + h.filter.text.length;
                            h.filter.expressions && h.filter.expressions.indexOf(c) != -1 &&
                                (i = i + 100)
                        }
                        if (i > f) {
                            e.length = 0;
                            f = i
                        }
                        if (i == f)
                            for (i = h.sounds.length; i--;) e.push(h.sounds[i])
                    }
                    e.length > 0 && e.random().play()
                }
            }
        }
    });
    ig.addGameAddon(function() {
        return sc.voiceActing = new sc.VoiceActing
    })
});
ig.baked = !0;

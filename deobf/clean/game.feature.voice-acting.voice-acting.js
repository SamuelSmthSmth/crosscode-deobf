/**
 * @module game.feature.voice-acting.voice-acting
 *
 * Voice acting playback system. Loads voice line sound banks per character
 * from `sc.VA_CONFIG`, and plays the best-matching voice clip for a line
 * based on text content filters and the character's current expression.
 */
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
                for (var characterName in sc.VA_CONFIG) {
                    for (var config = sc.VA_CONFIG[characterName], loadedClips = [], i = 0; i < config.length; ++i) loadedClips[i] = this.loadConfigSounds(config[i]);
                    this.voices[characterName] = loadedClips
                }
                this.loaded = true
            }
        },
        loadConfigSounds: function(config) {
            for (var clip = {
                    sounds: [],
                    filter: config.filter
                },
                i = 0; i < config.sounds.length; ++i) {
                var soundEntry = config.sounds[i];
                clip.sounds[i] = new ig.Sound("media/sound/va/" + soundEntry.src, (soundEntry.volume || 1) * 1.5, 0, "voiceActing")
            }
            return clip
        },
        play: function(message, text) {
            if (this.active) {
                var characterName = message.character.name,
                    expression = message.expression;
                text instanceof ig.LangLabel && (text = text.data.en_US);
                text = text || "";
                if (characterName = this.voices[characterName]) {
                    for (var candidates = [], bestScore = 0, i = characterName.length; i--;) {
                        var clip = characterName[i],
                            score = 0;
                        if (clip.filter && clip.filter.text && text.toLowerCase().indexOf(clip.filter.text.toLowerCase()) != -1) {
                            score = score + clip.filter.text.length;
                            clip.filter.expressions && clip.filter.expressions.indexOf(expression) != -1 &&
                                (score = score + 100)
                        }
                        if (score > bestScore) {
                            candidates.length = 0;
                            bestScore = score
                        }
                        if (score == bestScore)
                            for (var soundIndex = clip.sounds.length; soundIndex--;) candidates.push(clip.sounds[soundIndex])
                    }
                    candidates.length > 0 && candidates.random().play()
                }
            }
        }
    });
    ig.addGameAddon(function() {
        return sc.voiceActing = new sc.VoiceActing
    })
});
ig.baked = !0;

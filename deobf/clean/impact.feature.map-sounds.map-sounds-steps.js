/**
 * impact.feature.map-sounds.map-sounds-steps
 * ==========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.map-sounds.map-sounds-steps")`.
 *
 * Event step to switch the map's background sound entry.
 */
ig.module("impact.feature.map-sounds.map-sounds-steps")
    .requires("impact.feature.map-sounds.map-sounds", "impact.base.action", "impact.base.event")
    .defines(function () {

    ig.EVENT_STEP.SET_MAP_SOUNDS = ig.EventStepBase.extend({
        soundEntry: null,

        _wm: new ig.Config({
            attributes: {
                mapSounds: {
                    _type: "String",
                    _info: "Type of Map Sounds",
                    _select: ig.MAP_SOUNDS,
                    _withNull: true
                }
            }
        }),

        init: function (settings) {
            if (settings.mapSounds) this.soundEntry = new ig.MapSoundEntry(settings.mapSounds);
        },

        clearCached: function () {
            this.soundEntry && this.soundEntry.clearCached();
        },

        start: function () {
            ig.mapSounds.setEntry(this.soundEntry);
        }
    });
});
ig.baked = !0;

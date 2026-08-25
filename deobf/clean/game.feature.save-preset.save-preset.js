/**
 * game.feature.save-preset.save-preset
 * ====================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.save-preset.save-preset")`.
 *
 * Save-preset system: loads pre-configured save files from
 * `data/save-presets/` for the title-screen "Continue at..." feature.
 * Each preset is a named checkpoint (e.g. "3-autumn-rise",
 * "7-fajro-temple") with a title, subtitle, and save slot.
 */
ig.module("game.feature.save-preset.save-preset").requires(
    "impact.base.loader",
    "impact.base.game"
).defines(function () {

    var presetNames = [
        "0-before-boss", "1-rhombus-dng-start", "2-continue-story",
        "3-autumn-rise", "4-apollo-duel", "5-before-bergen",
        "6-before-maroon", "7-fajro-temple", "8-autumns-fall"
    ];

    sc.SavePresetData = ig.JsonLoadable.extend({
        cacheType: "SavePresetData",
        title: null,
        sub: null,
        saveSlot: null,
        onCacheCleared: function () {},
        getJsonPath: function () {
            return ig.root + this.path.toPath("data/save-presets/", ".json") + ig.getCacheSuffix();
        },
        onload: function (data) {
            this.title = new ig.LangLabel(data.title);
            this.sub = new ig.LangLabel(data.sub);
            this.saveSlot = new ig.SaveSlot(data.savefile);
            sc.version.updateSaveSlotVersion(this.saveSlot);
        }
    });

    sc.SavePreset = ig.GameAddon.extend({
        slots: [],
        init: function () {
            if (!window.wm) {
                for (var i = 0; i < presetNames.length; ++i) {
                    this.slots[i] = new sc.SavePresetData(presetNames[i]);
                }
            }
        },
        /** Load a preset save slot by index. */
        load: function (index) {
            var slot = ig.copy(this.slots[index].saveSlot);
            ig.game.loadStart(slot);
        }
    });

    sc.savePreset = new sc.SavePreset;
    ig.addGameAddon(function () { return sc.savePreset; });
});
ig.baked = !0;
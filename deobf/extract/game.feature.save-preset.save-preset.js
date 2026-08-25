ig.module("game.feature.save-preset.save-preset").requires("impact.base.loader", "impact.base.game").defines(function() {
    var b = ["0-before-boss", "1-rhombus-dng-start", "2-continue-story", "3-autumn-rise", "4-apollo-duel", "5-before-bergen", "6-before-maroon", "7-fajro-temple", "8-autumns-fall"];
    sc.SavePresetData = ig.JsonLoadable.extend({
        cacheType: "SavePresetData",
        title: null,
        sub: null,
        saveSlot: null,
        onCacheCleared: function() {},
        getJsonPath: function() {
            return ig.root + this.path.toPath("data/save-presets/", ".json") +
                ig.getCacheSuffix()
        },
        onload: function(a) {
            this.title = new ig.LangLabel(a.title);
            this.sub = new ig.LangLabel(a.sub);
            this.saveSlot = new ig.SaveSlot(a.savefile);
            sc.version.updateSaveSlotVersion(this.saveSlot)
        }
    });
    sc.SavePreset = ig.GameAddon.extend({
        slots: [],
        init: function() {
            if (!window.wm)
                for (var a = 0; a < b.length; ++a) this.slots[a] = new sc.SavePresetData(b[a])
        },
        load: function(a) {
            a = ig.copy(this.slots[a].saveSlot);
            ig.game.loadStart(a)
        }
    });
    sc.savePreset = new sc.SavePreset;
    ig.addGameAddon(function() {
        return sc.savePreset
    })
});
ig.baked = !0;

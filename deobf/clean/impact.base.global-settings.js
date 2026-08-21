/**
 * impact.base.global-settings
 * ===========================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `ig.module("impact.base.global-settings")`.
 *
 * Loads `data/global-settings.json` — a hierarchical key/value store that lets
 * entities reference shared settings through a `__GLOBAL__` key instead of
 * inlining the same data on every entity instance.
 */
ig.module("impact.base.global-settings").requires("impact.base.loader").defines(function () {

    Vec2.create(); // ensure the shared scratch vector exists

    ig.GlobalSettings = ig.SingleLoadable.extend({
        cacheType: "GlobalSettings",
        data: {},
        modified: false,

        init: function () {
            this.parent();
        },

        getGlobalSettingOptions: function (category, key) {
            var options = this.data[category];
            return !options ? null : options[key] || null;
        },

        getGlobalSetting: function (category, key, subKey) {
            var setting = this.getGlobalSettingOptions(category, key);
            return !setting ? null : setting[subKey] || null;
        },

        storeGlobalSetting: function (category, key, subKey, value) {
            this.data[category] || (this.data[category] = {});
            this.data[category][key] || (this.data[category][key] = {});
            this.data[category][key][subKey] = value;
            this.modified = true;
        },

        /**
         * If entity settings reference a global (via `__GLOBAL__`), resolve them
         * into a concrete settings object.
         * @param {string} type entity type key
         * @param {Object} settings entity settings (may contain `__GLOBAL__`)
         */
        resolveEntitySettings: function (type, settings) {
            if (!settings.__GLOBAL__) return settings;
            var global = this.getGlobalSetting("ENTITY", type, settings.__GLOBAL__);
            var resolved = {};
            ig.merge(resolved, global);
            resolved.name = settings.name;
            resolved.mapId = settings.mapId;
            resolved._globalSettingKey = settings.__GLOBAL__;
            return resolved;
        },

        loadInternal: function () {
            $.ajax({
                dataType: "json",
                url: ig.root + "data/global-settings.json" + ig.getCacheSuffix(),
                context: this,
                success: this.onload.bind(this),
                error: this.onerror.bind(this),
            });
        },

        onerror: function () {
            this.data = {};
            this.loadingFinished(true);
        },

        onload: function (data) {
            this.data = data;
            this.loadingFinished(true);
        },
    });

    ig.globalSettings = new ig.GlobalSettings();
});

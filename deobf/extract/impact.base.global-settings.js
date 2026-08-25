ig.module("impact.base.global-settings").requires("impact.base.loader").defines(function() {
    Vec2.create();
    ig.GlobalSettings = ig.SingleLoadable.extend({
        cacheType: "GlobalSettings",
        data: {},
        modified: false,
        init: function() {
            this.parent()
        },
        getGlobalSettingOptions: function(b, a) {
            var d = this.data[b];
            return !d ? null : d[a] || null
        },
        getGlobalSetting: function(b, a, d) {
            b = this.getGlobalSettingOptions(b, a);
            return !b ? null : b[d] || null
        },
        storeGlobalSetting: function(b, a, d, c) {
            this.data[b] || (this.data[b] = {});
            this.data[b][a] || (this.data[b][a] = {});
            this.data[b][a][d] = c;
            this.modified = true
        },
        resolveEntitySettings: function(b, a) {
            if (!a.__GLOBAL__) return a;
            var d = this.getGlobalSetting("ENTITY", b, a.__GLOBAL__),
                c = {};
            ig.merge(c, d);
            c.name = a.name;
            c.mapId = a.mapId;
            c._globalSettingKey = a.__GLOBAL__;
            return c
        },
        loadInternal: function() {
            $.ajax({
                dataType: "json",
                url: ig.root + "data/global-settings.json" + ig.getCacheSuffix(),
                context: this,
                success: this.onload.bind(this),
                error: this.onerror.bind(this)
            })
        },
        onerror: function() {
            this.data = {};
            this.loadingFinished(true)
        },
        onload: function(b) {
            this.data =
                b;
            this.loadingFinished(true)
        }
    });
    ig.globalSettings = new ig.GlobalSettings
});
ig.baked = !0;

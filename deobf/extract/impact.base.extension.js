ig.module("impact.base.extension").defines(function() {
    ig.ExtensionManager = ig.Class.extend({
        enabled: {},
        list: null,
        listeners: {},
        init: function() {},
        addListener: function(a, b) {
            this.listeners[b] = a
        },
        load: function() {
            this.list = new ig.ExtensionList
        },
        getExtensionList: function() {
            var a = [],
                b;
            for (b in this.list.extensions) this.enabled[b] && a.push(b);
            return a
        },
        getExtension: function(a) {
            return !this.enabled[a] ? null : this.list.get(a)
        },
        hasExtension: function(a) {
            if (!this.enabled[a]) return false;
            if (this.list.get(a)) return true
        },
        setExtensionEnabled: function(a, b) {
            this.enabled[a] = b
        },
        onExtensionLoaded: function(a) {
            var b = a.path;
            this.enabled[b] || (this.enabled[b] = window.IG_GAME_DEBUG ? false : true);
            window.IG_GAME_DEBUG && a.checkFileList();
            if (this.enabled[b]) {
                window.IG_GAME_DEBUG || a.addFileForwarding();
                for (var b = a.entries, c = 0; c < b.length; ++c) {
                    var e = b[c],
                        f = e.type;
                    if (this.listeners[f]) this.listeners[f].onExtensionLoaded(e.data, a)
                }
            } else window.IG_GAME_DEBUG && a.addFileForwarding(true)
        }
    });
    ig.extensions = new ig.ExtensionManager;
    ig.ExtensionList =
        ig.SingleLoadable.extend({
            extensions: {},
            get: function(a) {
                return this.extensions[a]
            },
            loadInternal: function() {
                ig.platform == ig.PLATFORM_TYPES.DESKTOP ? this.loadExtensionsNWJS() : this.loadExtensionsPHP()
            },
            loadExtensionsPHP: function() {
                $.ajax({
                    dataType: "json",
                    url: ig.root + "page/api/get-extension-list.php?debug=" + (window.IG_GAME_DEBUG ? 1 : 0),
                    context: this,
                    success: this.onExtensionListLoaded.bind(this),
                    error: this.onExtensionListLoaded.bind(this)
                })
            },
            _getExtensionFolder: function() {
                return ig.root + (window.IG_GAME_DEBUG ?
                    "data/extension/" : "assets/extension/")
            },
            loadExtensionsNWJS: function() {
                var a = window.require("fs"),
                    b = this._getExtensionFolder();
                a.readdir(b, this.onDirRead.bind(this))
            },
            onDirRead: function(a, b) {
                var c = this._getExtensionFolder(),
                    e = window.require("fs"),
                    f = [];
                if (!a)
                    for (var g = 0; g < b.length; ++g) {
                        var h = b[g];
                        if (h[0] != ".")
                            if (window.IG_GAME_DEBUG) {
                                var i = h.indexOf(".json");
                                i !== -1 && f.push(h.substr(0, i))
                            } else e.lstatSync(c + h).isDirectory() && e.existsSync(c + h + "/" + h + ".json") && f.push(h)
                    }
                this.onExtensionListLoaded(f)
            },
            onExtensionListLoaded: function(a) {
                console.log("%cEXTENSIONS:%c",
                    "color:#339966", "", a);
                for (var b = 0; b < a.length; ++b) {
                    var c = a[b];
                    c[0] != "-" && (this.extensions[c] = new ig.Extension(c))
                }
                this.loadingFinished(true)
            }
        });
    var b = {};
    ig.Extension = ig.JsonLoadable.extend({
        cacheType: "Extension",
        files: null,
        entries: null,
        name: null,
        description: null,
        getJsonPath: function() {
            return window.IG_GAME_DEBUG ? ig.root + "data/extension/" + this.path + ".json" : ig.root + "extension/" + this.path + "/" + this.path + ".json"
        },
        onload: function(a) {
            this.files = a.files || [];
            this.entries = a.entries || [];
            this.name = new ig.LangLabel(a.name);
            this.description = new ig.LangLabel(a.description);
            ig.extensions.onExtensionLoaded(this)
        },
        checkFileList: function() {
            for (var a = this.files.length; a--;) {
                var d = ig.root + this.files[a];
                if (b[d]) throw Error("DOUBLE REFERENCE '" + d + "' referred by extensions '" + b[d] + '" & "' + this.path + "'");
                b[d] = this.path;
                $.ajax({
                    url: d,
                    type: "HEAD",
                    context: {
                        path: d,
                        extension: this.path
                    },
                    success: function() {},
                    error: function() {
                        throw Error("WRONG REFERENCE '" + this.path + "' of extension '" + this.extension + "'");
                    }
                })
            }
        },
        addFileForwarding: function(a) {
            for (var b =
                    this.files.length; b--;) {
                var c = this.files[b],
                    e = ig.root + c,
                    f = ig.root + "extension/" + this.path + "/" + c;
                a && (f = ig.root + "missing-extension/" + c);
                ig.fileForwarding[e] = f
            }
        }
    })
});
ig.baked = !0;

/**
 * impact.base.extension
 * ======================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `ig.module("impact.base.extension")`.
 *
 * Official "extension" support (DLC-style content packs: post-game, ninja-skin,
 * etc.). `ig.ExtensionManager` tracks which extensions are enabled and dispatches
 * their entries to registered listeners; `ig.ExtensionList` discovers extension
 * folders; `ig.Extension` loads one extension's JSON and sets up file forwarding.
 */
ig.module("impact.base.extension").defines(function () {

    ig.ExtensionManager = ig.Class.extend({
        enabled: {},
        list: null,
        listeners: {}, // entry type -> listener

        init: function () {},

        addListener: function (listener, type) {
            this.listeners[type] = listener;
        },

        load: function () {
            this.list = new ig.ExtensionList();
        },

        getExtensionList: function () {
            var result = [];
            for (var key in this.list.extensions) if (this.enabled[key]) result.push(key);
            return result;
        },

        getExtension: function (name) {
            return !this.enabled[name] ? null : this.list.get(name);
        },

        hasExtension: function (name) {
            if (!this.enabled[name]) return false;
            if (this.list.get(name)) return true;
        },

        setExtensionEnabled: function (name, enabled) {
            this.enabled[name] = enabled;
        },

        /** Called by an ig.Extension once its JSON has loaded. */
        onExtensionLoaded: function (extension) {
            var path = extension.path;
            if (!this.enabled[path]) this.enabled[path] = window.IG_GAME_DEBUG ? false : true;

            if (window.IG_GAME_DEBUG) extension.checkFileList();

            if (this.enabled[path]) {
                if (!window.IG_GAME_DEBUG) extension.addFileForwarding();
                var entries = extension.entries;
                for (var i = 0; i < entries.length; ++i) {
                    var entry = entries[i];
                    var type = entry.type;
                    if (this.listeners[type]) this.listeners[type].onExtensionLoaded(entry.data, extension);
                }
            } else if (window.IG_GAME_DEBUG) {
                extension.addFileForwarding(true);
            }
        },
    });

    ig.extensions = new ig.ExtensionManager();

    ig.ExtensionList = ig.SingleLoadable.extend({
        extensions: {},

        get: function (name) {
            return this.extensions[name];
        },

        loadInternal: function () {
            if (ig.platform == ig.PLATFORM_TYPES.DESKTOP) this.loadExtensionsNWJS();
            else this.loadExtensionsPHP();
        },

        loadExtensionsPHP: function () {
            $.ajax({
                dataType: "json",
                url: ig.root + "page/api/get-extension-list.php?debug=" + (window.IG_GAME_DEBUG ? 1 : 0),
                context: this,
                success: this.onExtensionListLoaded.bind(this),
                error: this.onExtensionListLoaded.bind(this),
            });
        },

        _getExtensionFolder: function () {
            return ig.root + (window.IG_GAME_DEBUG ? "data/extension/" : "assets/extension/");
        },

        loadExtensionsNWJS: function () {
            var fs = window.require("fs");
            var folder = this._getExtensionFolder();
            fs.readdir(folder, this.onDirRead.bind(this));
        },

        onDirRead: function (err, files) {
            var folder = this._getExtensionFolder();
            var fs = window.require("fs");
            var result = [];
            if (!err) {
                for (var i = 0; i < files.length; ++i) {
                    var name = files[i];
                    if (name[0] != ".") {
                        if (window.IG_GAME_DEBUG) {
                            var dotIndex = name.indexOf(".json");
                            if (dotIndex !== -1) result.push(name.substr(0, dotIndex));
                        } else {
                            if (fs.lstatSync(folder + name).isDirectory() &&
                                fs.existsSync(folder + name + "/" + name + ".json")) {
                                result.push(name);
                            }
                        }
                    }
                }
            }
            this.onExtensionListLoaded(result);
        },

        onExtensionListLoaded: function (list) {
            console.log("%cEXTENSIONS:%c", "color:#339966", "", list);
            for (var i = 0; i < list.length; ++i) {
                var name = list[i];
                if (name[0] != "-") this.extensions[name] = new ig.Extension(name);
            }
            this.loadingFinished(true);
        },
    });

    // Maps a file path to the extension that references it (for double-reference checks).
    var fileReferences = {};

    ig.Extension = ig.JsonLoadable.extend({
        cacheType: "Extension",
        files: null,
        entries: null,
        name: null,
        description: null,

        getJsonPath: function () {
            return window.IG_GAME_DEBUG
                ? ig.root + "data/extension/" + this.path + ".json"
                : ig.root + "extension/" + this.path + "/" + this.path + ".json";
        },

        onload: function (data) {
            this.files = data.files || [];
            this.entries = data.entries || [];
            this.name = new ig.LangLabel(data.name);
            this.description = new ig.LangLabel(data.description);
            ig.extensions.onExtensionLoaded(this);
        },

        checkFileList: function () {
            for (var i = this.files.length; i--;) {
                var filePath = ig.root + this.files[i];
                if (fileReferences[filePath]) {
                    throw Error("DOUBLE REFERENCE '" + filePath + "' referred by extensions '" +
                        fileReferences[filePath] + '" & "' + this.path + "'");
                }
                fileReferences[filePath] = this.path;
                $.ajax({
                    url: filePath,
                    type: "HEAD",
                    context: { path: filePath, extension: this.path },
                    success: function () {},
                    error: function () {
                        throw Error("WRONG REFERENCE '" + this.path + "' of extension '" + this.extension + "'");
                    },
                });
            }
        },

        /**
         * Register file forwarding so the game loads this extension's files.
         * @param {boolean} [missing] if true, forward to a missing-extension stub
         */
        addFileForwarding: function (missing) {
            for (var i = this.files.length; i--;) {
                var file = this.files[i];
                var source = ig.root + file;
                var target = ig.root + "extension/" + this.path + "/" + file;
                if (missing) target = ig.root + "missing-extension/" + file;
                ig.fileForwarding[source] = target;
            }
        },
    });
});

ig.module("game.feature.version.version").requires("impact.base.game", "impact.feature.storage.storage").defines(function() {
    sc.VerionChangeLog = ig.SingleLoadable.extend({
        major: 1,
        minor: 4,
        patch: 2,
        hotfix: 3,
        special: null,
        saveVersion: 2,
        oldMajor: 0,
        oldMinor: 0,
        oldPatch: 0,
        changelog: null,
        init: function() {
            if (ig.CHANGE_LOG) {
                this.parent();
                var b = JSON.parse(localStorage.getItem("cc.version"));
                if (b) {
                    this.oldMajor = b.major || 0;
                    this.oldMinor = b.minor || 0;
                    this.oldPatch = b.patch || 0
                }
                if (ig.platform != ig.PLATFORM_TYPES.BROWSER) document.title = document.title +
                    " " + this.toString()
            } else ig.warn("Can't load changelog because no ig.CHANGE_LOG is given!")
        },
        saveCurrentVersion: function() {
            localStorage.setItem("cc.version", JSON.stringify(this._toObject()))
        },
        getLogsBetweenVersions: function(b) {
            b = b ? b : [];
            b.length = 0;
            for (var a = this._getVersionString(this.oldMajor, this.oldMinor, this.oldPatch), d = 0; d < this.changelog.length; d++)
                if (this.changelog[d].version == a) break;
                else b.push(this.changelog[d]);
            return b
        },
        toString: function() {
            var b = this.toOnlyNumberString();
            this.special && (b =
                b + (" " + this.special));
            return b
        },
        toOnlyNumberString: function() {
            return "v" + this.major + "." + this.minor + "." + this.patch + (this.hotfix > 0 ? "-" + this.hotfix : "")
        },
        hasVersionChanged: function() {
            return this.major != this.oldMajor || this.minor != this.oldMinor || this.patch != this.oldPatch
        },
        loadInternal: function() {
            $.ajax({
                dataType: "json",
                url: ig.root + ig.CHANGE_LOG + ig.getCacheSuffix(),
                context: this,
                success: this.onload.bind(this),
                error: this.onerror.bind(this)
            })
        },
        onerror: function(b) {
            this.changelog = null;
            this.loadingFinished(true);
            ig.error("Could not load Changelog json file! Event: %O", b)
        },
        onload: function(b) {
            this.changelog = b.changelog;
            window.wm && ig.database.register("changelog", "ChangelogList", "Changelog", {
                path: "data/changelog.json",
                data: this.changelog
            });
            var a = this._getVersionString(this.major, this.minor, this.patch);
            if (a != this.changelog[0].version) throw Error("Version collision! Inlined: " + a + ", Json: " + this.changelog[0].version + ", missing entry?");
            this.loadingFinished(true);
            ig.JSON_LOG && ig.log("%cLOADABLE: %cLoaded Changelog: \n%O",
                "color:#149AEB", "", b)
        },
        getLastSlotDataUpdated: function() {
            var b = {
                version: this.toOnlyNumberString(),
                saveVersion: this.saveVersion
            };
            return ig.storage.getLastSlotData(b)
        },
        updateSaveSlotVersion: function(b) {
            b.mergeData({
                version: this.toOnlyNumberString(),
                saveVersion: this.saveVersion
            })
        },
        _getVersionString: function(b, a, d) {
            return b + "." + a + "." + d
        },
        _toObject: function() {
            var b = {};
            b.major = this.major;
            b.minor = this.minor;
            b.patch = this.patch;
            return b
        }
    });
    sc.version = new sc.VerionChangeLog;
    sc.VersionTracker = ig.GameAddon.extend({
        loadedVersion: null,
        loadedSaveVersion: null,
        init: function() {
            ig.storage.register(this);
            this.onReset()
        },
        onReset: function() {
            this.loadedVersion = sc.version.toOnlyNumberString();
            this.loadedSaveVersion = sc.version.saveVersion
        },
        onStorageSave: function(b) {
            b.version = this.loadedVersion;
            b.saveVersion = this.loadedSaveVersion
        },
        onStoragePreLoad: function(b) {
            this.loadedVersion = b.version;
            this.loadedSaveVersion = b.saveVersion || 0;
            this.loadedSaveVersion < sc.version.saveVersion && ig.game.addTeleportMessage(ig.lang.get("sc.gui.loading.versionOutdated"))
        }
    });
    ig.addGameAddon(function() {
        return new sc.VersionTracker
    })
});
ig.baked = !0;

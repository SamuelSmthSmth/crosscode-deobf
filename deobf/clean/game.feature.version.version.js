/**
 * @module game.feature.version.version
 *
 * Version tracking and changelog system. Loads the changelog JSON, records
 * the current game version in localStorage, detects version changes, and
 * tracks the save-slot version so outdated saves can warn the player.
 */
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
                var storedVersion = JSON.parse(localStorage.getItem("cc.version"));
                if (storedVersion) {
                    this.oldMajor = storedVersion.major || 0;
                    this.oldMinor = storedVersion.minor || 0;
                    this.oldPatch = storedVersion.patch || 0
                }
                if (ig.platform != ig.PLATFORM_TYPES.BROWSER) document.title = document.title +
                    " " + this.toString()
            } else ig.warn("Can't load changelog because no ig.CHANGE_LOG is given!")
        },
        saveCurrentVersion: function() {
            localStorage.setItem("cc.version", JSON.stringify(this._toObject()))
        },
        getLogsBetweenVersions: function(logs) {
            logs = logs ? logs : [];
            logs.length = 0;
            for (var oldVersion = this._getVersionString(this.oldMajor, this.oldMinor, this.oldPatch), i = 0; i < this.changelog.length; i++)
                if (this.changelog[i].version == oldVersion) break;
                else logs.push(this.changelog[i]);
            return logs
        },
        toString: function() {
            var versionString = this.toOnlyNumberString();
            this.special && (versionString =
                versionString + (" " + this.special));
            return versionString
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
        onerror: function(event) {
            this.changelog = null;
            this.loadingFinished(true);
            ig.error("Could not load Changelog json file! Event: %O", event)
        },
        onload: function(data) {
            this.changelog = data.changelog;
            window.wm && ig.database.register("changelog", "ChangelogList", "Changelog", {
                path: "data/changelog.json",
                data: this.changelog
            });
            var currentVersion = this._getVersionString(this.major, this.minor, this.patch);
            if (currentVersion != this.changelog[0].version) throw Error("Version collision! Inlined: " + currentVersion + ", Json: " + this.changelog[0].version + ", missing entry?");
            this.loadingFinished(true);
            ig.JSON_LOG && ig.log("%cLOADABLE: %cLoaded Changelog: \n%O",
                "color:#149AEB", "", data)
        },
        getLastSlotDataUpdated: function() {
            var versionData = {
                version: this.toOnlyNumberString(),
                saveVersion: this.saveVersion
            };
            return ig.storage.getLastSlotData(versionData)
        },
        updateSaveSlotVersion: function(saveSlot) {
            saveSlot.mergeData({
                version: this.toOnlyNumberString(),
                saveVersion: this.saveVersion
            })
        },
        _getVersionString: function(major, minor, patch) {
            return major + "." + minor + "." + patch
        },
        _toObject: function() {
            var versionObject = {};
            versionObject.major = this.major;
            versionObject.minor = this.minor;
            versionObject.patch = this.patch;
            return versionObject
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
        onStorageSave: function(storageData) {
            storageData.version = this.loadedVersion;
            storageData.saveVersion = this.loadedSaveVersion
        },
        onStoragePreLoad: function(storageData) {
            this.loadedVersion = storageData.version;
            this.loadedSaveVersion = storageData.saveVersion || 0;
            this.loadedSaveVersion < sc.version.saveVersion && ig.game.addTeleportMessage(ig.lang.get("sc.gui.loading.versionOutdated"))
        }
    });
    ig.addGameAddon(function() {
        return new sc.VersionTracker
    })
});
ig.baked = !0;

ig.module("impact.feature.storage.storage").requires("impact.base.game").defines(function() {
    ig.SAVE_MODE = {
        ENABLED: 1,
        DISABLED: 0
    };
    ig.SaveSlot = ig.Class.extend({
        src: null,
        data: null,
        init: function(a) {
            if (ig.StorageTools.isEncrypted(a)) {
                this.src = a;
                this.data = ig.StorageTools.decryptSlotData(this.src)
            } else {
                this.data = a;
                this.src = ig.StorageTools.encryptSlotData(this.data)
            }
        },
        getData: function() {
            return this.data
        },
        getSrc: function() {
            return this.src
        },
        mergeData: function(a) {
            ig.merge(this.data, a);
            this.src = ig.StorageTools.encryptSlotData(this.data)
        }
    });
    var b = {},
        a = {
            rename: true,
            from: ".backup",
            to: ".backup2"
        },
        d = {
            rename: true,
            from: "",
            to: ".backup"
        },
        c = {
            save: true
        };
    ig.StorageData = ig.Class.extend({
        loaded: false,
        data: null,
        saveDataStack: [],
        path: null,
        cacheType: "STORAGE",
        ioState: null,
        loadPathStack: null,
        init: function(a) {
            this.path = a;
            window.wm || ig.addResource(this)
        },
        load: function(a) {
            this._loadCallback = a;
            if (ig.platform == ig.PLATFORM_TYPES.DESKTOP) {
                this.ioState = b;
                this.loadPathStack = this._getSaveFilePathList();
                this._loadFromList()
            } else this._loadStorageFromData(localStorage.getItem(this.path))
        },
        _loadFromList: function() {
            var a = this.loadPathStack.shift();
            window.require("fs").readFile(a, this._loadResponse.bind(this))
        },
        _loadResponse: function(a, b) {
            window.require("fs");
            if (a || !this._loadStorageFromData(b)) {
                ig.debug("FAILED TO LOAD FILE");
                this.loadPathStack.length > 0 ? this._loadFromList() : this._loadStorageFromData(localStorage.getItem(this.path))
            }
        },
        save: function(a) {
            if (ig.platform == ig.PLATFORM_TYPES.DESKTOP) {
                this.saveDataStack.push(a);
                this.ioState || this._saveToFile()
            } else localStorage.setItem(this.path,
                a)
        },
        _saveToFile: function() {
            this._doIoStep(a)
        },
        _doIoStep: function(a) {
            this.ioState = a;
            if (this.ioState.rename) {
                var a = window.require("fs"),
                    b = this._getSaveFilePathList()[0];
                a.rename(b + this.ioState.from, b + this.ioState.to, this._saveResponse.bind(this))
            } else if (this.ioState.save) {
                a = window.require("fs");
                b = this._getSaveFilePathList()[0];
                this.ioState = c;
                a.writeFile(b, this.saveDataStack[0], this._saveResponse.bind(this))
            }
        },
        _saveResponse: function(b) {
            if (this.ioState.rename) this.ioState == a ? this._doIoStep(d) : this._doIoStep(c);
            else {
                b && localStorage.setItem(this.path, this.saveDataStack[0]);
                this._resolveSave()
            }
        },
        _resolveSave: function() {
            if (this.saveDataStack.length > 1) {
                for (; this.saveDataStack.length > 1;) this.saveDataStack.shift();
                this._saveToFile()
            } else {
                this.ioState = null;
                this.saveDataStack.length = 0
            }
        },
        _getSaveFilePathList: function() {
            var a = [],
                b = window.require("nw.gui").App.dataPath,
                c = b.indexOf("\\User Data\\Default");
            if (c != -1) {
                c = b.substr(0, c);
                a.push(c + "/" + this.path);
                a.push(c + "/" + this.path + ".backup");
                a.push(c + "/" + this.path + ".backup2")
            }
            a.push(b +
                "/" + this.path);
            a.push(b + "/" + this.path + ".backup");
            a.push(b + "/" + this.path + ".backup2");
            return a
        },
        _loadStorageFromData: function(a) {
            if (a) {
                var b;
                try {
                    ig.StorageTools.isEncrypted(a) && (a = ig.StorageTools.decrypt(a));
                    b = JSON.parse(a)
                } catch (c) {
                    return false
                }
                this.data = b
            }
            this._loadCallback(this.cacheType, this.path, true);
            this.loaded = true;
            this.ioState = this.loadPathStack = null;
            return true
        },
        getData: function() {
            return this.data
        }
    });
    ig.Storage = ig.GameAddon.extend({
        mapSaveEnabled: true,
        resetAfterTeleport: false,
        slot: 0,
        slots: [],
        autoSlot: null,
        lastUsedSlot: -2,
        listeners: [],
        saveObject: {},
        globalData: {},
        checkPointSave: {},
        data: new ig.StorageData(window.IG_GAME_DEBUG ? "cc.save.dev" : "cc.save"),
        currentLoadFile: null,
        checkpointCondCallback: null,
        autoSaveCondCallback: null,
        loadHint: null,
        init: function() {
            this.parent("Storage");
            var a = this.data.getData();
            if (a) {
                if (a.lastSlot !== void 0) this.lastUsedSlot = a.lastSlot;
                for (var b = a.slots, c = 0; c < b.length; ++c) try {
                    this.slots.push(new ig.SaveSlot(b[c]))
                } catch (d) {
                    console.log("Error Loading Slot " + c)
                }
                if (a.autoSlot) try {
                    this.autoSlot =
                        new ig.SaveSlot(a.autoSlot)
                } catch (i) {
                    console.log("Error Loading Autoslot")
                }
                a = a.globals;
                if (ig.StorageTools.isEncrypted(a)) {
                    a = ig.StorageTools.decrypt(a);
                    a = JSON.parse(a)
                }
                this.globalData = a
            }
        },
        setAutoSaveCondCallback: function(a) {
            this.autoSaveCondCallback = a
        },
        setCheckpointCondCallback: function(a) {
            this.checkpointCondCallback = a
        },
        register: function(a) {
            a && this.listeners.push(a)
        },
        saveCheckpoint: function(a, b, c) {
            this.checkPointSave = {};
            this._saveState(this.checkPointSave, a, b && b.getJson());
            (!this.autoSaveCondCallback ||
                this.autoSaveCondCallback(c)) && this.saveAutoSlot(this.checkPointSave)
        },
        getLastSlotData: function(a) {
            return this.getSlotData(this.lastUsedSlot == -2 ? 0 : this.lastUsedSlot, a)
        },
        getAutoSlotData: function(a) {
            return this.getSlotData(-1, a)
        },
        hasSaves: function() {
            return this.slots.length > 0 || this.autoSlot
        },
        getSlotData: function(a, b) {
            var c;
            if (a == -1) {
                if (!this.autoSlot) return "";
                c = ig.copy(this.autoSlot.getData())
            } else {
                if (!this.slots[a]) return "";
                c = ig.copy(this.slots[a].getData())
            }
            b && ig.merge(c, b);
            return this._encrypt(JSON.stringify(c))
        },
        pushSlotData: function(a) {
            this.slots.push(new ig.SaveSlot(a));
            this._saveToStorage()
        },
        saveAutoSlot: function(a) {
            this.autoSlot = new ig.SaveSlot(a);
            this.lastUsedSlot = -1;
            this._saveToStorage()
        },
        save: function(a) {
            var a = a || 0,
                b = {};
            this._saveState(b, null, ig.copy(this.checkPointSave.position));
            this.checkPointSave = b;
            var c = new ig.SaveSlot(b);
            this.slots[a] && this.slots.splice(a, 1);
            this.slots.unshift(c);
            this.lastUsedSlot = 0;
            this._saveToStorage();
            ig.debug("Saved Game: %O", b)
        },
        _saveToStorage: function() {
            for (var a = {}, b =
                    0; b < this.listeners.length; b++)
                if (this.listeners[b].onStorageGlobalSave) this.listeners[b].onStorageGlobalSave(a);
            for (var c = {}, d = [], b = 0; b < this.slots.length; ++b) d[b] = this.slots[b].getSrc();
            c.slots = d;
            c.autoSlot = this.autoSlot && this.autoSlot.getSrc();
            c.globals = this._encrypt(JSON.stringify(a));
            c.lastSlot = this.lastUsedSlot;
            this.data.save(JSON.stringify(c));
            return c
        },
        _saveState: function(a, b, c) {
            for (var d = 0; d < ig.game.entities.length; d++) {
                var i = ig.game.entities[d];
                if (i && i.onSave) i.onSave()
            }
            a.map = b || ig.game.mapName;
            a.vars = ig.vars.getJson();
            a.position = c ? c : this._createCopyTeleportPosition(ig.game.playerEntity);
            for (d = 0; d < this.listeners.length; d++)
                if (this.listeners[d].onStorageSave) this.listeners[d].onStorageSave(a)
        },
        saveGlobals: function() {
            var a = this._saveToStorage();
            ig.debug("Saved Globals: %O", a)
        },
        loadSlot: function(a, b) {
            var a = a || 0,
                b = b == void 0 ? true : b,
                c;
            if (typeof a == "number") {
                c = this.getSlot(a);
                this.lastUsedSlot = a
            } else c = a;
            if ((c = c.getData()) && c.vars) {
                this.currentLoadFile = ig.copy(c);
                this.checkPointSave = ig.copy(c);
                this.resetAfterTeleport = false;
                var d = ig.TeleportPosition.createFromJson(c.position);
                b && ig.game.teleport(c.map, d, "LOAD");
                ig.debug("Load Game: %O", c)
            } else ig.debug("Loading Game failed, Slot " + a + " does not have a save file")
        },
        deleteSlot: function(a) {
            if (!(a == void 0 || a < 0 || a >= this.slots.length || !this.slots[a])) {
                this.slots.splice(a, 1);
                this.lastUsedSlot = Math.min(a, this.slots.length - 1);
                this._saveToStorage()
            }
        },
        loadCheckpoint: function() {
            this.resetAfterTeleport = true;
            this.currentLoadFile = ig.copy(this.checkPointSave);
            var a = ig.TeleportPosition.createFromJson(this.checkPointSave.position);
            ig.game.teleport(this.checkPointSave.map, a)
        },
        loadAutosave: function() {
            this.loadSlot(-1);
            this.resetAfterTeleport = true
        },
        _isEncrypted: function(a) {
            return typeof a == "string" && a.indexOf("[-!_0_!-]") == 0
        },
        _encrypt: function(a, b) {
            var c = 75 * b + "",
                d = ig.blog("Getting key from Server...");
            if (b = c + (d ^ NaN)) b = ":_." + b;
            d = window.CryptoJS.AES.encrypt(a, b).toString();
            return "[-!_0_!-]" + d
        },
        _decrypt: function(a, b) {
            var c = 75 * b + "",
                d = ig.blog("Getting key from Server...");
            if (b = c + (d ^ NaN)) b = ":_." + b;
            c = window.CryptoJS;
            a = a.substr(9, a.length);
            return c.AES.decrypt(a, b).toString(c.enc.Utf8)
        },
        _createCopyTeleportPosition: function(a) {
            if (!a) return null;
            var b = new ig.TeleportPosition;
            b.setFromData(null, ig.copy(a.coll.pos), a.face, a.coll.level, a.coll.baseZPos, a.coll.size);
            return b.getJson()
        },
        onLevelLoadStart: function(a) {
            if (this.currentLoadFile) {
                ig.vars.restoreFromJson(this.currentLoadFile.vars);
                ig.vars.onLevelChange(a.name, true);
                for (var b = 0; b < this.listeners.length; b++)
                    if (this.listeners[b].onStoragePreLoad) this.listeners[b].onStoragePreLoad(this.currentLoadFile)
            }
            if (a.attributes) this.mapSaveEnabled =
                ig.SAVE_MODE[a.attributes.saveMode] == ig.SAVE_MODE.ENABLED ? true : false
        },
        levelLoadedOrder: -100,
        onLevelLoaded: function() {
            if (this.currentLoadFile) {
                for (var a = 0; a < this.listeners.length; a++)
                    if (this.listeners[a].onStoragePostLoad) this.listeners[a].onStoragePostLoad(this.currentLoadFile);
                this.currentLoadFile = null
            } else if (!this.checkpointCondCallback || this.checkpointCondCallback()) {
                this.saveCheckpoint(ig.game.mapName, ig.game.teleporting.position, this.loadHint);
                if (ig.game.marker && this.checkPointSave.position) this.checkPointSave.position.marker =
                    ig.game.marker
            }
        },
        onTeleport: function(a, b, c) {
            this.loadHint = c
        },
        getSlot: function(a) {
            return a == -1 ? this.autoSlot : this.slots[a]
        },
        hasSaveSlotData: function(a) {
            return this.slots[a || 0] ? true : false
        },
        hasSlots: function() {
            return this.slots.length > 0
        }
    });
    ig.StorageTools = {
        isEncrypted: function(a) {
            return typeof a == "string" && a.indexOf("[-!_0_!-]") == 0
        },
        encrypt: function(a, b) {
            var c = 75 * b + "",
                d = ig.blog("Getting key from Server...");
            if (b = c + (d ^ NaN)) b = ":_." + b;
            d = window.CryptoJS.AES.encrypt(a, b).toString();
            return "[-!_0_!-]" + d
        },
        decrypt: function(a,
            b) {
            var c = 75 * b + "",
                d = ig.blog("Getting key from Server...");
            if (b = c + (d ^ NaN)) b = ":_." + b;
            c = window.CryptoJS;
            a = a.substr(9, a.length);
            return c.AES.decrypt(a, b).toString(c.enc.Utf8)
        },
        decryptSlotData: function(a) {
            return JSON.parse(this.decrypt(a))
        },
        encryptSlotData: function(a) {
            return this.encrypt(JSON.stringify(a))
        }
    };
    ig.addGameAddon(function() {
        return ig.storage = new ig.Storage
    })
});
ig.baked = !0;

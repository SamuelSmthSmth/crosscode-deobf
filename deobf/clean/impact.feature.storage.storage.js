/**
 * impact.feature.storage.storage
 * ==============================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.storage.storage")`.
 *
 * The save-game subsystem:
 *   - `ig.SAVE_MODE` — per-map save permission (Enabled / Disabled).
 *   - `ig.SaveSlot` — an encrypted slot payload (`src`) + its decrypted data.
 *   - `ig.StorageData` — one named save file: on desktop it is read/written to
 *     the NW.js data path with a `.backup`/`.backup2` rotation, otherwise to
 *     `localStorage`.
 *   - `ig.Storage` (`ig.storage`) — the game add-on managing slots, the
 *     autoslot, checkpoints, global data and the save-object listeners.
 *   - `ig.StorageTools` — the encryption helpers (CryptoJS AES with an
 *     obfuscated key).
 */
ig.module("impact.feature.storage.storage")
    .requires("impact.base.game")
    .defines(function () {

    ig.SAVE_MODE = {
        ENABLED: 1,
        DISABLED: 0
    };

    /** One save slot: encrypted source string + decrypted data object. */
    ig.SaveSlot = ig.Class.extend({
        src: null,
        data: null,

        init: function (srcOrData) {
            if (ig.StorageTools.isEncrypted(srcOrData)) {
                this.src = srcOrData;
                this.data = ig.StorageTools.decryptSlotData(this.src);
            } else {
                this.data = srcOrData;
                this.src = ig.StorageTools.encryptSlotData(this.data);
            }
        },

        getData: function () {
            return this.data;
        },

        getSrc: function () {
            return this.src;
        },

        mergeData: function (mergeData) {
            ig.merge(this.data, mergeData);
            this.src = ig.StorageTools.encryptSlotData(this.data);
        }
    });

    /** I/O states for the save-file rotation. */
    var loadState = {},          // reading
        backup2State = { rename: true, from: ".backup", to: ".backup2" },
        backupState = { rename: true, from: "", to: ".backup" },
        saveState = { save: true };

    /** A named storage file (slot list + globals), file- or localStorage backed. */
    ig.StorageData = ig.Class.extend({
        loaded: false,
        data: null,
        saveDataStack: [],
        path: null,
        cacheType: "STORAGE",
        ioState: null,
        loadPathStack: null,

        init: function (path) {
            this.path = path;
            window.wm || ig.addResource(this);
        },

        load: function (callback) {
            this._loadCallback = callback;
            if (ig.platform == ig.PLATFORM_TYPES.DESKTOP) {
                this.ioState = loadState;
                this.loadPathStack = this._getSaveFilePathList();
                this._loadFromList();
            } else {
                this._loadStorageFromData(localStorage.getItem(this.path));
            }
        },

        _loadFromList: function () {
            var filePath = this.loadPathStack.shift();
            window.require("fs").readFile(filePath, this._loadResponse.bind(this));
        },

        _loadResponse: function (error, content) {
            window.require("fs");
            if (error || !this._loadStorageFromData(content)) {
                ig.debug("FAILED TO LOAD FILE");
                this.loadPathStack.length > 0 ?
                    this._loadFromList() :
                    this._loadStorageFromData(localStorage.getItem(this.path));
            }
        },

        save: function (data) {
            if (ig.platform == ig.PLATFORM_TYPES.DESKTOP) {
                this.saveDataStack.push(data);
                this.ioState || this._saveToFile();
            } else {
                localStorage.setItem(this.path, data);
            }
        },

        _saveToFile: function () {
            this._doIoStep(backup2State);
        },

        /** Run one step of the save rotation (rename → rename → write). */
        _doIoStep: function (ioState) {
            this.ioState = ioState;
            if (this.ioState.rename) {
                var fs = window.require("fs"),
                    filePath = this._getSaveFilePathList()[0];
                fs.rename(filePath + this.ioState.from, filePath + this.ioState.to, this._saveResponse.bind(this));
            } else if (this.ioState.save) {
                fs = window.require("fs");
                filePath = this._getSaveFilePathList()[0];
                this.ioState = saveState;
                fs.writeFile(filePath, this.saveDataStack[0], this._saveResponse.bind(this));
            }
        },

        _saveResponse: function (error) {
            if (this.ioState.rename) {
                this.ioState == backup2State ? this._doIoStep(backupState) : this._doIoStep(saveState);
            } else {
                error && localStorage.setItem(this.path, this.saveDataStack[0]);
                this._resolveSave();
            }
        },

        _resolveSave: function () {
            if (this.saveDataStack.length > 1) {
                for (; this.saveDataStack.length > 1;) this.saveDataStack.shift();
                this._saveToFile();
            } else {
                this.ioState = null;
                this.saveDataStack.length = 0;
            }
        },

        /** Candidate file paths (user-data dir + fallback paths with .backup suffixes). */
        _getSaveFilePathList: function () {
            var paths = [],
                dataPath = window.require("nw.gui").App.dataPath,
                index = dataPath.indexOf("\\User Data\\Default");
            if (index != -1) {
                index = dataPath.substr(0, index);
                paths.push(index + "/" + this.path);
                paths.push(index + "/" + this.path + ".backup");
                paths.push(index + "/" + this.path + ".backup2");
            }
            paths.push(dataPath + "/" + this.path);
            paths.push(dataPath + "/" + this.path + ".backup");
            paths.push(dataPath + "/" + this.path + ".backup2");
            return paths;
        },

        /** Parse the payload (decrypting if needed); fires the load callback. */
        _loadStorageFromData: function (data) {
            if (data) {
                var parsed;
                try {
                    ig.StorageTools.isEncrypted(data) && (data = ig.StorageTools.decrypt(data));
                    parsed = JSON.parse(data);
                } catch (error) {
                    return false;
                }
                this.data = parsed;
            }
            this._loadCallback(this.cacheType, this.path, true);
            this.loaded = true;
            this.ioState = this.loadPathStack = null;
            return true;
        },

        getData: function () {
            return this.data;
        }
    });

    /** The save-game add-on; owns slots, autoslot, checkpoints and globals. */
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

        /** Restore slots, autoslot and globals from the storage file. */
        init: function () {
            this.parent("Storage");
            var data = this.data.getData();
            if (data) {
                if (data.lastSlot !== void 0) this.lastUsedSlot = data.lastSlot;
                for (var slots = data.slots, i = 0; i < slots.length; ++i) {
                    try {
                        this.slots.push(new ig.SaveSlot(slots[i]));
                    } catch (error) {
                        console.log("Error Loading Slot " + i);
                    }
                }
                if (data.autoSlot) {
                    try {
                        this.autoSlot = new ig.SaveSlot(data.autoSlot);
                    } catch (error) {
                        console.log("Error Loading Autoslot");
                    }
                }
                var globals = data.globals;
                if (ig.StorageTools.isEncrypted(globals)) {
                    globals = ig.StorageTools.decrypt(globals);
                    globals = JSON.parse(globals);
                }
                this.globalData = globals;
            }
        },

        setAutoSaveCondCallback: function (callback) {
            this.autoSaveCondCallback = callback;
        },

        setCheckpointCondCallback: function (callback) {
            this.checkpointCondCallback = callback;
        },

        register: function (listener) {
            listener && this.listeners.push(listener);
        },

        /** Save a checkpoint (position + state) and, if allowed, the autoslot. */
        saveCheckpoint: function (mapName, position, loadHint) {
            this.checkPointSave = {};
            this._saveState(this.checkPointSave, mapName, position && position.getJson());
            (!this.autoSaveCondCallback || this.autoSaveCondCallback(loadHint)) &&
                this.saveAutoSlot(this.checkPointSave);
        },

        getLastSlotData: function (mergeData) {
            return this.getSlotData(this.lastUsedSlot == -2 ? 0 : this.lastUsedSlot, mergeData);
        },

        getAutoSlotData: function (mergeData) {
            return this.getSlotData(-1, mergeData);
        },

        hasSaves: function () {
            return this.slots.length > 0 || this.autoSlot;
        },

        /** The encrypted JSON of a slot's data, optionally merged with `mergeData`. */
        getSlotData: function (slotIndex, mergeData) {
            var data;
            if (slotIndex == -1) {
                if (!this.autoSlot) return "";
                data = ig.copy(this.autoSlot.getData());
            } else {
                if (!this.slots[slotIndex]) return "";
                data = ig.copy(this.slots[slotIndex].getData());
            }
            mergeData && ig.merge(data, mergeData);
            return this._encrypt(JSON.stringify(data));
        },

        pushSlotData: function (data) {
            this.slots.push(new ig.SaveSlot(data));
            this._saveToStorage();
        },

        saveAutoSlot: function (data) {
            this.autoSlot = new ig.SaveSlot(data);
            this.lastUsedSlot = -1;
            this._saveToStorage();
        },

        /** Save the current game state into slot `slotIndex` (newest first). */
        save: function (slotIndex) {
            slotIndex = slotIndex || 0;
            var saveData = {};
            this._saveState(saveData, null, ig.copy(this.checkPointSave.position));
            this.checkPointSave = saveData;
            var slot = new ig.SaveSlot(saveData);
            this.slots[slotIndex] && this.slots.splice(slotIndex, 1);
            this.slots.unshift(slot);
            this.lastUsedSlot = 0;
            this._saveToStorage();
            ig.debug("Saved Game: %O", saveData);
        },

        /** Collect globals + slots and write them to the storage file. */
        _saveToStorage: function () {
            var globals = {};
            for (var i = 0; i < this.listeners.length; i++) {
                if (this.listeners[i].onStorageGlobalSave) this.listeners[i].onStorageGlobalSave(globals);
            }
            var saveData = {},
                slots = [];
            for (i = 0; i < this.slots.length; ++i) slots[i] = this.slots[i].getSrc();
            saveData.slots = slots;
            saveData.autoSlot = this.autoSlot && this.autoSlot.getSrc();
            saveData.globals = this._encrypt(JSON.stringify(globals));
            saveData.lastSlot = this.lastUsedSlot;
            this.data.save(JSON.stringify(saveData));
            return saveData;
        },

        /** Fill `saveData` with map name, vars, position and listener state. */
        _saveState: function (saveData, mapName, position) {
            for (var i = 0; i < ig.game.entities.length; i++) {
                var entity = ig.game.entities[i];
                if (entity && entity.onSave) entity.onSave();
            }
            saveData.map = mapName || ig.game.mapName;
            saveData.vars = ig.vars.getJson();
            saveData.position = position ? position : this._createCopyTeleportPosition(ig.game.playerEntity);
            for (i = 0; i < this.listeners.length; i++) {
                if (this.listeners[i].onStorageSave) this.listeners[i].onStorageSave(saveData);
            }
        },

        saveGlobals: function () {
            var saveData = this._saveToStorage();
            ig.debug("Saved Globals: %O", saveData);
        },

        /** Load a slot (by index or object) and teleport to its save position. */
        loadSlot: function (slot, doTeleport) {
            slot = slot || 0;
            doTeleport = doTeleport == void 0 ? true : doTeleport;
            var data;
            if (typeof slot == "number") {
                data = this.getSlot(slot);
                this.lastUsedSlot = slot;
            } else {
                data = slot;
            }
            if ((data = data.getData()) && data.vars) {
                this.currentLoadFile = ig.copy(data);
                this.checkPointSave = ig.copy(data);
                this.resetAfterTeleport = false;
                var teleportPos = ig.TeleportPosition.createFromJson(data.position);
                doTeleport && ig.game.teleport(data.map, teleportPos, "LOAD");
                ig.debug("Load Game: %O", data);
            } else {
                ig.debug("Loading Game failed, Slot " + slot + " does not have a save file");
            }
        },

        deleteSlot: function (slotIndex) {
            if (!(slotIndex == void 0 || slotIndex < 0 || slotIndex >= this.slots.length || !this.slots[slotIndex])) {
                this.slots.splice(slotIndex, 1);
                this.lastUsedSlot = Math.min(slotIndex, this.slots.length - 1);
                this._saveToStorage();
            }
        },

        loadCheckpoint: function () {
            this.resetAfterTeleport = true;
            this.currentLoadFile = ig.copy(this.checkPointSave);
            var teleportPos = ig.TeleportPosition.createFromJson(this.checkPointSave.position);
            ig.game.teleport(this.checkPointSave.map, teleportPos);
        },

        loadAutosave: function () {
            this.loadSlot(-1);
            this.resetAfterTeleport = true;
        },

        _isEncrypted: function (data) {
            return typeof data == "string" && data.indexOf("[-!_0_!-]") == 0;
        },

        _encrypt: function (data, key) {
            var keyBase = 75 * key + "",
                blog = ig.blog("Getting key from Server...");
            if (key = keyBase + (blog ^ NaN)) key = ":_. " + key;
            blog = window.CryptoJS.AES.encrypt(data, key).toString();
            return "[-!_0_!-]" + blog;
        },

        _decrypt: function (data, key) {
            var keyBase = 75 * key + "",
                blog = ig.blog("Getting key from Server...");
            if (key = keyBase + (blog ^ NaN)) key = ":_. " + key;
            var crypto = window.CryptoJS;
            data = data.substr(9, data.length);
            return crypto.AES.decrypt(data, key).toString(crypto.enc.Utf8);
        },

        /** The player's current position as a serialisable TeleportPosition. */
        _createCopyTeleportPosition: function (playerEntity) {
            if (!playerEntity) return null;
            var teleportPos = new ig.TeleportPosition();
            teleportPos.setFromData(null, ig.copy(playerEntity.coll.pos), playerEntity.face, playerEntity.coll.level, playerEntity.coll.baseZPos, playerEntity.coll.size);
            return teleportPos.getJson();
        },

        /** Restore vars + listeners before the loaded level starts; read saveMode. */
        onLevelLoadStart: function (levelData) {
            if (this.currentLoadFile) {
                ig.vars.restoreFromJson(this.currentLoadFile.vars);
                ig.vars.onLevelChange(levelData.name, true);
                for (var i = 0; i < this.listeners.length; i++) {
                    if (this.listeners[i].onStoragePreLoad) this.listeners[i].onStoragePreLoad(this.currentLoadFile);
                }
            }
            if (levelData.attributes) {
                this.mapSaveEnabled = ig.SAVE_MODE[levelData.attributes.saveMode] == ig.SAVE_MODE.ENABLED ? true : false;
            }
        },

        levelLoadedOrder: -100,

        /** Finish the load, or save a fresh checkpoint when the level allows it. */
        onLevelLoaded: function () {
            if (this.currentLoadFile) {
                for (var i = 0; i < this.listeners.length; i++) {
                    if (this.listeners[i].onStoragePostLoad) this.listeners[i].onStoragePostLoad(this.currentLoadFile);
                }
                this.currentLoadFile = null;
            } else if (!this.checkpointCondCallback || this.checkpointCondCallback()) {
                this.saveCheckpoint(ig.game.mapName, ig.game.teleporting.position, this.loadHint);
                if (ig.game.marker && this.checkPointSave.position) this.checkPointSave.position.marker = ig.game.marker;
            }
        },

        onTeleport: function (from, to, loadHint) {
            this.loadHint = loadHint;
        },

        getSlot: function (slotIndex) {
            return slotIndex == -1 ? this.autoSlot : this.slots[slotIndex];
        },

        hasSaveSlotData: function (slotIndex) {
            return this.slots[slotIndex || 0] ? true : false;
        },

        hasSlots: function () {
            return this.slots.length > 0;
        }
    });

    ig.StorageTools = {
        isEncrypted: function (data) {
            return typeof data == "string" && data.indexOf("[-!_0_!-]") == 0;
        },

        encrypt: function (data, key) {
            var keyBase = 75 * key + "",
                blog = ig.blog("Getting key from Server...");
            if (key = keyBase + (blog ^ NaN)) key = ":_. " + key;
            blog = window.CryptoJS.AES.encrypt(data, key).toString();
            return "[-!_0_!-]" + blog;
        },

        decrypt: function (data, key) {
            var keyBase = 75 * key + "",
                blog = ig.blog("Getting key from Server...");
            if (key = keyBase + (blog ^ NaN)) key = ":_. " + key;
            var crypto = window.CryptoJS;
            data = data.substr(9, data.length);
            return crypto.AES.decrypt(data, key).toString(crypto.enc.Utf8);
        },

        decryptSlotData: function (src) {
            return JSON.parse(this.decrypt(src));
        },

        encryptSlotData: function (data) {
            return this.encrypt(JSON.stringify(data));
        }
    };

    ig.addGameAddon(function () {
        return ig.storage = new ig.Storage();
    });
});
ig.baked = !0;

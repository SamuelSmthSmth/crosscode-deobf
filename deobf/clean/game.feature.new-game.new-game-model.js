/**
 * @module game.feature.new-game.new-game-model
 *
 * New Game Plus configuration model. Defines all available NG+
 * options organized into sets (carry-over, money, exp, combat
 * modifiers, etc.) with point costs. Tracks which options the
 * player has enabled and provides multipliers for drops, money,
 * and XP. Supports save-file-dependent carry-over options.
 */
ig.module("game.feature.new-game.new-game-model").requires("impact.base.game", "impact.feature.storage.storage", "game.feature.model.base-model").defines(function() {
    sc.NEW_GAME_SETS = {
        "carry-over": {type: "MULTI", order: 1E3}, money: {type: "SINGLE", order: 2E3},
        exp: {type: "SINGLE", order: 2001}, "drop-rate": {type: "SINGLE", order: 3E3},
        "combat-modifier": {type: "MULTI", order: 1E4}, itemCooldown: {type: "SINGLE", order: 10100},
        "hp-regen": {type: "SINGLE", order: 10200}, enemy: {type: "MULTI", order: 2E4},
        "enemy-damage": {type: "SINGLE", order: 3E4}, "combat-arts": {type: "SINGLE", order: 4E4},
        others: {type: "MULTI", order: 5E4}
    };
    sc.NEW_GAME_OPTIONS = {
        "money-plus-2": {set: "money", cost: 500}, "money-plus-4": {set: "money", cost: 1E3},
        "disable-money": {set: "money", cost: 100}, "exp-plus-2": {set: "exp", cost: 500},
        "exp-plus-4": {set: "exp", cost: 1E3}, "disable-exp": {set: "exp", cost: 100},
        "drop-rate-2": {set: "drop-rate", cost: 1E3}, "drop-rate-4": {set: "drop-rate", cost: 2E3},
        "keep-level": {set: "carry-over", cost: 500, needsSaveFile: true},
        "keep-consumables": {set: "carry-over", cost: 500, needsSaveFile: true},
        "keep-addons": {set: "carry-over", cost: 500, needsSaveFile: true},
        "keep-equipment": {set: "carry-over", cost: 500, needsSaveFile: true},
        "keep-trade": {set: "carry-over", cost: 500, needsSaveFile: true},
        "keep-money": {set: "carry-over", cost: 500, needsSaveFile: true},
        "keep-elements": {set: "carry-over", cost: 500, needsSaveFile: true},
        "keep-arena": {set: "carry-over", cost: 500, needsSaveFile: true},
        "keep-botanics": {set: "carry-over", cost: 500, needsSaveFile: true},
        "keep-traders": {set: "carry-over", cost: 500, needsSaveFile: true},
        "lea-must-die": {set: "combat-modifier", cost: 100}, "sergey-hax": {set: "combat-modifier", cost: 5E3},
        "dash-1": {set: "combat-modifier", cost: 2500}, "witch-time": {set: "combat-modifier", cost: 5E3},
        "overload-disable": {set: "combat-modifier", cost: 1E3}, "infinite-sp": {set: "combat-modifier", cost: 2E3},
        "double-buff-time": {set: "combat-modifier", cost: 2E3}, "remove-skill-blocks": {set: "combat-modifier", cost: 1E3},
        "item-cd-double": {set: "itemCooldown", cost: 100}, "item-cd-half": {set: "itemCooldown", cost: 1E3},
        "item-cd-zero": {set: "itemCooldown", cost: 2E3}, "combat-regen-half": {set: "hp-regen", cost: 200},
        "combat-regen-zero": {set: "hp-regen", cost: 100}, "scale-enemies": {set: "enemy", cost: 1E3},
        "harder-enemies": {set: "enemy", cost: 1E3, disabled: false}, "enemy-aggro": {set: "enemy", cost: 1E3},
        "enemy-damage-15": {set: "enemy-damage", cost: 1E3}, "enemy-damage-2": {set: "enemy-damage", cost: 1E3},
        "enemy-damage-4": {set: "enemy-damage", cost: 1E3}, "combat-arts-level-1": {set: "combat-arts", cost: 500},
        "combat-arts-level-2": {set: "combat-arts", cost: 1E3}, "waypoints-heals": {set: "others", cost: 500},
        "waypoints-teleport": {set: "others", cost: 500}, "rhombus-start": {set: "others", cost: 0},
        "no-trophies": {set: "others", cost: 0}, "ice-physics": {set: "others", cost: 0}
    };
    sc.NewGamePlusModel = ig.GameAddon.extend({
        active: false, options: {}, store: {}, observers: [],
        init: function() {
            this.parent("New Game +");
            ig.storage.register(this);
            ig.vars.registerVarAccessor("newgame", this, "VarNewGameEditor");
            for (var key in sc.NEW_GAME_OPTIONS)
                if (sc.NEW_GAME_OPTIONS[key].requires)
                    for (var reqs = sc.NEW_GAME_OPTIONS[key].requires, idx = reqs.length; idx--;) {
                        if (!sc.NEW_GAME_OPTIONS[reqs[idx]].usedBy) sc.NEW_GAME_OPTIONS[reqs[idx]].usedBy = [];
                        sc.NEW_GAME_OPTIONS[reqs[idx]].usedBy.push(key)
                    }
        },
        onReset: function() {this.options = {}; this.active = false},
        setActive: function(active) {this.active = active || false},
        setActiveAndOptions: function(optionList) {
            this.setActive(true);
            for (var idx = 0; idx < optionList.length; ++idx) {
                var opt = optionList[idx];
                if (!sc.NEW_GAME_OPTIONS[opt]) throw Error("Invalid Option: " + opt);
                this.options[opt] || this.toggle(opt)
            }
        },
        toggle: function(key, setKey) {
            if (sc.NEW_GAME_OPTIONS[key]) {
                this.options[key] = !this.options[key];
                if (!setKey) setKey = sc.NEW_GAME_OPTIONS[key].set;
                if (setKey && sc.NEW_GAME_SETS[setKey].type == sc.TOGGLE_SET_TYPE.SINGLE)
                    for (var optKey in sc.NEW_GAME_OPTIONS) sc.NEW_GAME_OPTIONS[optKey] && (setKey == sc.NEW_GAME_OPTIONS[optKey].set && optKey != key) && (this.options[optKey] = false);
                if (sc.NEW_GAME_OPTIONS[key].usedBy && !this.options[key]) {
                    var usedBy = sc.NEW_GAME_OPTIONS[key].usedBy;
                    for (var idx = usedBy.length; idx--;) this.options[usedBy[idx]] = false
                }
                return this.options[key] || false
            }
        },
        get: function(key) {return !this.active ? false : sc.NEW_GAME_OPTIONS[key] ? this.options[key] || false : false},
        storeSaveData: function(saveData) {this.store.level = saveData.player.level},
        applyData: function(saveData) {
            for (var items = [], player = sc.model.player, savePlayer = saveData.player, saveItems = savePlayer.items, idx = sc.inventory.items.length; idx--;) this._checkItemCondition(sc.inventory.getItem(idx).type) && (items[idx] = saveItems[idx]);
            if (this.options["keep-equipment"] && savePlayer.equip) {
                this._checkEquip(savePlayer, "head", items); this._checkEquip(savePlayer, "leftArm", items);
                this._checkEquip(savePlayer, "rightArm", items); this._checkEquip(savePlayer, "torso", items);
                this._checkEquip(savePlayer, "feet", items)
            }
            player.items = items;
            if (this.options["keep-money"]) player.credit = savePlayer.credit || 0;
            if (this.options["keep-arena"]) sc.arena.onNewGameApply(saveData);
            if (this.options["keep-traders"]) sc.trade.onNewGameApply(saveData);
            if (this.options["keep-botanics"]) sc.menu.onNewGameApply(saveData)
        },
        applyStoreData: function(atRhombus) {
            if (this.active && (this.options["rhombus-start"] || !atRhombus)) {
                var player = sc.model.player;
                this.options["keep-level"] && this.store.level ? player.setLevel(this.store.level) : this.options["rhombus-start"] && atRhombus && (!this.options["disable-exp"] && player.level <= 1 ? player.setLevel(2) : player.setLevel(player.level || 1))
            }
        },
        _checkItemCondition: function(itemType) {
            return itemType == sc.ITEMS_TYPES.CONS && this.options["keep-consumables"] || itemType == sc.ITEMS_TYPES.EQUIP && this.options["keep-equipment"] || itemType == sc.ITEMS_TYPES.TRADE && this.options["keep-trade"] || itemType == sc.ITEMS_TYPES.TOGGLE && this.options["keep-addons"]
        },
        _checkEquip: function(savePlayer, slot, items) {var idx = savePlayer.equip[slot]; idx >= 0 && items[idx]++},
        onVarAccess: function(path, args) {
            if (args[0] == "newgame") return args[1] == "active" ? this.active : this.get(args[1]);
            throw Error("Unsupported var access path: " + path);
        },
        getCost: function() {var total = 0, key; for (key in this.options) this.options[key] && (total = total + (sc.NEW_GAME_OPTIONS[key].cost || 0)); return total},
        requiresSaveFile: function() {for (var key in this.options) if (this.options[key] && sc.NEW_GAME_OPTIONS[key].needsSaveFile) return true; return false},
        hasAnyOptions: function() {for (var key in this.options) if (this.options[key]) return true; return false},
        hasHarderEnemies: function() {return this.get("harder-enemies")},
        getDropRateMultiplier: function() {return !this.active ? 1 : this.options["drop-rate-4"] ? 4 : this.options["drop-rate-2"] ? 2 : 1},
        getMoneyMultiplier: function() {return !this.active ? 1 : this.options["money-plus-2"] ? 2 : this.options["money-plus-4"] ? 4 : 1},
        getEXPMultiplier: function() {return !this.active ? 1 : this.options["exp-plus-2"] ? 2 : this.options["exp-plus-4"] ? 4 : 1},
        onStorageSave: function(storageData) {var data = {}; data.options = ig.copy(this.options); data.active = this.active; data.store = ig.copy(this.store); storageData.newGamePlus = data},
        onStoragePreLoad: function(storageData) {
            this.options = {};
            var saved = storageData.newGamePlus || {}, savedOptions = saved.options || {}, key;
            for (key in savedOptions) sc.NEW_GAME_OPTIONS[key] && savedOptions[key] && (this.options[key] = true);
            this.active = saved.active || false;
            this.store = saved.store || {}
        }
    });
    ig.addGameAddon(function() {return sc.newgame = new sc.NewGamePlusModel})
});
ig.baked = !0;
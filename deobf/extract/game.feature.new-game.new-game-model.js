ig.module("game.feature.new-game.new-game-model").requires("impact.base.game", "impact.feature.storage.storage", "game.feature.model.base-model").defines(function() {
    sc.NEW_GAME_SETS = {
        "carry-over": {
            type: "MULTI",
            order: 1E3
        },
        money: {
            type: "SINGLE",
            order: 2E3
        },
        exp: {
            type: "SINGLE",
            order: 2001
        },
        "drop-rate": {
            type: "SINGLE",
            order: 3E3
        },
        "combat-modifier": {
            type: "MULTI",
            order: 1E4
        },
        itemCooldown: {
            type: "SINGLE",
            order: 10100
        },
        "hp-regen": {
            type: "SINGLE",
            order: 10200
        },
        enemy: {
            type: "MULTI",
            order: 2E4
        },
        "enemy-damage": {
            type: "SINGLE",
            order: 3E4
        },
        "combat-arts": {
            type: "SINGLE",
            order: 4E4
        },
        others: {
            type: "MULTI",
            order: 5E4
        }
    };
    sc.NEW_GAME_OPTIONS = {
        "money-plus-2": {
            set: "money",
            cost: 500
        },
        "money-plus-4": {
            set: "money",
            cost: 1E3
        },
        "disable-money": {
            set: "money",
            cost: 100
        },
        "exp-plus-2": {
            set: "exp",
            cost: 500
        },
        "exp-plus-4": {
            set: "exp",
            cost: 1E3
        },
        "disable-exp": {
            set: "exp",
            cost: 100
        },
        "drop-rate-2": {
            set: "drop-rate",
            cost: 1E3
        },
        "drop-rate-4": {
            set: "drop-rate",
            cost: 2E3
        },
        "keep-level": {
            set: "carry-over",
            cost: 500,
            needsSaveFile: true
        },
        "keep-consumables": {
            set: "carry-over",
            cost: 500,
            needsSaveFile: true
        },
        "keep-addons": {
            set: "carry-over",
            cost: 500,
            needsSaveFile: true
        },
        "keep-equipment": {
            set: "carry-over",
            cost: 500,
            needsSaveFile: true
        },
        "keep-trade": {
            set: "carry-over",
            cost: 500,
            needsSaveFile: true
        },
        "keep-money": {
            set: "carry-over",
            cost: 500,
            needsSaveFile: true
        },
        "keep-elements": {
            set: "carry-over",
            cost: 500,
            needsSaveFile: true
        },
        "keep-arena": {
            set: "carry-over",
            cost: 500,
            needsSaveFile: true
        },
        "keep-botanics": {
            set: "carry-over",
            cost: 500,
            needsSaveFile: true
        },
        "keep-traders": {
            set: "carry-over",
            cost: 500,
            needsSaveFile: true
        },
        "lea-must-die": {
            set: "combat-modifier",
            cost: 100
        },
        "sergey-hax": {
            set: "combat-modifier",
            cost: 5E3
        },
        "dash-1": {
            set: "combat-modifier",
            cost: 2500
        },
        "witch-time": {
            set: "combat-modifier",
            cost: 5E3
        },
        "overload-disable": {
            set: "combat-modifier",
            cost: 1E3
        },
        "infinite-sp": {
            set: "combat-modifier",
            cost: 2E3
        },
        "double-buff-time": {
            set: "combat-modifier",
            cost: 2E3
        },
        "remove-skill-blocks": {
            set: "combat-modifier",
            cost: 1E3
        },
        "item-cd-double": {
            set: "itemCooldown",
            cost: 100
        },
        "item-cd-half": {
            set: "itemCooldown",
            cost: 1E3
        },
        "item-cd-zero": {
            set: "itemCooldown",
            cost: 2E3
        },
        "combat-regen-half": {
            set: "hp-regen",
            cost: 200
        },
        "combat-regen-zero": {
            set: "hp-regen",
            cost: 100
        },
        "scale-enemies": {
            set: "enemy",
            cost: 1E3
        },
        "harder-enemies": {
            set: "enemy",
            cost: 1E3,
            disabled: false
        },
        "enemy-aggro": {
            set: "enemy",
            cost: 1E3
        },
        "enemy-damage-15": {
            set: "enemy-damage",
            cost: 1E3
        },
        "enemy-damage-2": {
            set: "enemy-damage",
            cost: 1E3
        },
        "enemy-damage-4": {
            set: "enemy-damage",
            cost: 1E3
        },
        "combat-arts-level-1": {
            set: "combat-arts",
            cost: 500
        },
        "combat-arts-level-2": {
            set: "combat-arts",
            cost: 1E3
        },
        "waypoints-heals": {
            set: "others",
            cost: 500
        },
        "waypoints-teleport": {
            set: "others",
            cost: 500
        },
        "rhombus-start": {
            set: "others",
            cost: 0
        },
        "no-trophies": {
            set: "others",
            cost: 0
        },
        "ice-physics": {
            set: "others",
            cost: 0
        }
    };
    sc.NewGamePlusModel = ig.GameAddon.extend({
        active: false,
        options: {},
        store: {},
        observers: [],
        init: function() {
            this.parent("New Game +");
            ig.storage.register(this);
            ig.vars.registerVarAccessor("newgame", this, "VarNewGameEditor");
            for (var b in sc.NEW_GAME_OPTIONS)
                if (sc.NEW_GAME_OPTIONS[b].requires)
                    for (var a =
                            sc.NEW_GAME_OPTIONS[b].requires, d = a.length; d--;) {
                        if (!sc.NEW_GAME_OPTIONS[a[d]].usedBy) sc.NEW_GAME_OPTIONS[a[d]].usedBy = [];
                        sc.NEW_GAME_OPTIONS[a[d]].usedBy.push(b)
                    }
        },
        onReset: function() {
            this.options = {};
            this.active = false
        },
        setActive: function(b) {
            this.active = b || false
        },
        setActiveAndOptions: function(b) {
            this.setActive(true);
            for (var a = 0; a < b.length; ++a) {
                var d = b[a];
                if (!sc.NEW_GAME_OPTIONS[d]) throw Error("Invalid Option: " + d);
                this.options[d] || this.toggle(d)
            }
        },
        toggle: function(b, a) {
            if (sc.NEW_GAME_OPTIONS[b]) {
                this.options[b] = !this.options[b];
                if (!a) a = sc.NEW_GAME_OPTIONS[b].set;
                if (a && sc.NEW_GAME_SETS[a].type == sc.TOGGLE_SET_TYPE.SINGLE)
                    for (var d in sc.NEW_GAME_OPTIONS) sc.NEW_GAME_OPTIONS[d] && (a == sc.NEW_GAME_OPTIONS[d].set && d != b) && (this.options[d] = false);
                if (sc.NEW_GAME_OPTIONS[b].usedBy && !this.options[b]) {
                    d = sc.NEW_GAME_OPTIONS[b].usedBy;
                    for (var c = d.length; c--;) this.options[d[c]] = false
                }
                return this.options[b] || false
            }
        },
        get: function(b) {
            return !this.active ? false : sc.NEW_GAME_OPTIONS[b] ? this.options[b] || false : false
        },
        storeSaveData: function(b) {
            this.store.level =
                b.player.level
        },
        applyData: function(b) {
            for (var a = [], d = sc.model.player, c = b.player, e = c.items, f = sc.inventory.items.length; f--;) this._checkItemCondition(sc.inventory.getItem(f).type) && (a[f] = e[f]);
            if (this.options["keep-equipment"] && c.equip) {
                this._checkEquip(c, "head", a);
                this._checkEquip(c, "leftArm", a);
                this._checkEquip(c, "rightArm", a);
                this._checkEquip(c, "torso", a);
                this._checkEquip(c, "feet", a)
            }
            d.items = a;
            if (this.options["keep-money"]) d.credit = c.credit || 0;
            if (this.options["keep-arena"]) sc.arena.onNewGameApply(b);
            if (this.options["keep-traders"]) sc.trade.onNewGameApply(b);
            if (this.options["keep-botanics"]) sc.menu.onNewGameApply(b)
        },
        applyStoreData: function(b) {
            if (this.active && (this.options["rhombus-start"] || !b)) {
                var a = sc.model.player;
                this.options["keep-level"] && this.store.level ? a.setLevel(this.store.level) : this.options["rhombus-start"] && b && (!this.options["disable-exp"] && a.level <= 1 ? a.setLevel(2) : a.setLevel(a.level || 1))
            }
        },
        _checkItemCondition: function(b) {
            return b == sc.ITEMS_TYPES.CONS && this.options["keep-consumables"] ||
                b == sc.ITEMS_TYPES.EQUIP && this.options["keep-equipment"] || b == sc.ITEMS_TYPES.TRADE && this.options["keep-trade"] || b == sc.ITEMS_TYPES.TOGGLE && this.options["keep-addons"] ? true : false
        },
        _checkEquip: function(b, a, d) {
            b = b.equip[a];
            b >= 0 && d[b]++
        },
        onVarAccess: function(b, a) {
            if (a[0] == "newgame") return a[1] == "active" ? this.active : this.get(a[1]);
            throw Error("Unsupported var access path: " + b);
        },
        getCost: function() {
            var b = 0,
                a;
            for (a in this.options) this.options[a] && (b = b + (sc.NEW_GAME_OPTIONS[a].cost || 0));
            return b
        },
        requiresSaveFile: function() {
            for (var b in this.options)
                if (this.options[b] &&
                    sc.NEW_GAME_OPTIONS[b].needsSaveFile) return true;
            return false
        },
        hasAnyOptions: function() {
            for (var b in this.options)
                if (this.options[b]) return true;
            return false
        },
        hasHarderEnemies: function() {
            return this.get("harder-enemies")
        },
        getDropRateMultiplier: function() {
            return !this.active ? 1 : this.options["drop-rate-4"] ? 4 : this.options["drop-rate-2"] ? 2 : 1
        },
        getMoneyMultiplier: function() {
            return !this.active ? 1 : this.options["money-plus-2"] ? 2 : this.options["money-plus-4"] ? 4 : 1
        },
        getEXPMultiplier: function() {
            return !this.active ?
                1 : this.options["exp-plus-2"] ? 2 : this.options["exp-plus-4"] ? 4 : 1
        },
        onStorageSave: function(b) {
            var a = {};
            a.options = ig.copy(this.options);
            a.active = this.active;
            a.store = ig.copy(this.store);
            b.newGamePlus = a
        },
        onStoragePreLoad: function(b) {
            this.options = {};
            var b = b.newGamePlus || {},
                a = b.options || {},
                d;
            for (d in a) sc.NEW_GAME_OPTIONS[d] && a[d] && (this.options[d] = true);
            this.active = b.active || false;
            this.store = b.store || {}
        }
    });
    ig.addGameAddon(function() {
        return sc.newgame = new sc.NewGamePlusModel
    })
});
ig.baked = !0;

ig.module("game.feature.trade.trade-model").requires("impact.base.game", "impact.base.loader", "impact.feature.interact.button-interact", "impact.feature.database.database", "impact.feature.storage.storage", "game.feature.model.base-model").defines(function() {
    sc.TRADE_COMPARE_MODE = {};
    sc.TRADE_COMPARE_MODE.EQUIP = 0;
    sc.TRADE_COMPARE_MODE.OFF_HAND = 1;
    sc.TRADE_COMPARE_MODE.BASE_STATS = 2;
    sc.TRADE_SORT_TYPE = {
        ORDER: 0,
        FOUND: 1
    };
    sc.TradeModel = ig.GameAddon.extend({
        observers: [],
        buttonInteract: null,
        options: null,
        infoText: null,
        buffText: null,
        buffID: -1,
        equipID: -1,
        visible: false,
        sessionTradeCount: 0,
        tradeIndex: 0,
        statsToggle: false,
        statsToggleOffHand: false,
        hasEquippedTrade: false,
        equippedID1: {
            id: -1,
            bodypart: null
        },
        equippedID2: {
            id: -1,
            bodypart: null
        },
        compareMode: sc.TRADE_COMPARE_MODE.EQUIP,
        traders: {},
        tradersFound: {},
        init: function() {
            this.parent("Traders");
            this.buttonInteract = new ig.ButtonInteractEntry;
            ig.storage.register(this);
            window.wm && ig.database.register("traders", "TradeEnumEditor", "Traders");
            this.traders = ig.database.get("traders") || {};
            for (var b in this.traders) {
                var a = this.traders[b];
                a.upgradeTo && this.traders[a.upgradeTo] && (this.traders[a.upgradeTo].child = b)
            }
            ig.vars.registerVarAccessor("traders", this, "VarTradeEditor")
        },
        onStorageSave: function(b) {
            var a = {},
                d;
            for (d in this.tradersFound) this.traders[d] && (a[d] = {
                characterName: this.tradersFound[d].characterName,
                map: this.tradersFound[d].map && this.tradersFound[d].map.getSaveData ? this.tradersFound[d].map.getSaveData() : "???",
                area: this.tradersFound[d].area && this.tradersFound[d].area.getSaveData ?
                    this.tradersFound[d].area.getSaveData() : "???",
                time: this.tradersFound[d].time || 0
            });
            b.tradersFound = a
        },
        onStoragePreLoad: function(b) {
            b = b.tradersFound || {};
            this.tradersFound = {};
            for (var a in b) this.tradersFound[a] = {
                characterName: b[a].characterName,
                map: new ig.LangLabel(b[a].map || "???"),
                area: new ig.LangLabel(b[a].area || "???"),
                time: b[a].time || 0
            };
            this.checkForParents();
            sc.stats.setMap("trade", "tradeRate", this.getTotalTradersFound(true))
        },
        onNewGameApply: function(b) {
            this.onStoragePreLoad(b)
        },
        checkForParents: function() {
            for (var b in this.traders) {
                var a =
                    this.traders[b];
                this.tradersFound[b] && a.upgradeTo && (this.tradersFound[a.upgradeTo] || this.unlockParents(a.upgradeTo, this.tradersFound[b].characterName, b))
            }
        },
        getTotalTradersFound: function(b, a) {
            var d = 0,
                c = 0,
                e;
            for (e in this.traders)
                if (!this.traders[e].noTrack && !(a && this.traders[e].area != a)) {
                    this.tradersFound[e] && d++;
                    c = c + 1
                } return b ? d / c : d
        },
        getTotalTraders: function(b) {
            var a = 0,
                d;
            for (d in this.traders) this.traders[d].noTrack || b && this.traders[d].area != b || a++;
            return a
        },
        onReset: function() {
            this.tradersFound = {}
        },
        onVarAccess: function(b, a) {
            if (a[0] == "traders") {
                var d = a[1];
                if (this.traders[d]) switch (a[2]) {
                    case "name":
                        return ig.LangLabel.getText(this.traders[d].name);
                    case "unlocked":
                        return this.tradersFound[d]
                }
            }
            throw Error("Unsupported var access path: " + b);
        },
        hasAreaTraders: function(b) {
            for (var a in this.traders)
                if (this.traders[a].area == b) return true;
            return false
        },
        hasTraderInArea: function(b) {
            for (var a in this.tradersFound)
                if (this.traders[a] && this.traders[a].area == b) return true;
            return false
        },
        hasAnyTraderFound: function() {
            if (sc.map.hasAnyAreaUnlocked())
                for (var b in this.tradersFound) return true;
            return false
        },
        hasTrader: function(b) {
            return this.tradersFound[b]
        },
        unlockTrader: function(b, a) {
            if (!this.traders[b].noTrack && !this.tradersFound[b]) {
                this.tradersFound[b] = {
                    characterName: a || "",
                    map: sc.map.getCurrentMapName(),
                    area: sc.map.getCurrentPlayerAreaName(),
                    time: (new Date).getTime()
                };
                var d = 0;
                this.traders[b].upgradeTo && (d = this.unlockParents(this.traders[b].upgradeTo, a, b));
                sc.stats.setMap("tradersFound", b, 1);
                sc.stats.addMap("trade", "tradersTotal", 1);
                sc.stats.setMap("trade", "tradeRate", this.getTotalTradersFound(true));
                sc.menu.addLog({
                    type: "TRADER",
                    trader: b,
                    isUpdate: d == 1
                })
            }
        },
        unlockParents: function(b, a, d) {
            if (this.traders[b].noTrack) return 0;
            if (this.tradersFound[b]) return 1;
            this.tradersFound[b] = {
                characterName: a || "",
                map: ig.copy(this.tradersFound[d].map),
                area: ig.copy(this.tradersFound[d].area),
                time: (new Date).getTime()
            };
            sc.stats.setMap("tradersFound", b, 1);
            sc.stats.addMap("trade", "tradersTotal", 1);
            return this.traders[b].upgradeTo ? this.unlockParents(this.traders[b].upgradeTo, a, b) : 2
        },
        resetTrader: function(b) {
            if (!this.traders[b].noTrack &&
                this.tradersFound[b]) {
                sc.stats.setMap("tradersFound", b, 0);
                sc.stats.subMap("trade", "tradersTotal", 1);
                sc.stats.setMap("trade", "tradeRate", this.getTotalTradersFound(true));
                delete this.tradersFound[b]
            }
        },
        getTrader: function(b) {
            return this.traders[b]
        },
        getTraderName: function(b) {
            return ig.LangLabel.getText(this.traders[b].name)
        },
        getTraderAreaName: function(b, a) {
            return sc.map.getAreaName(this.traders[b].area, a)
        },
        getFoundTrader: function(b) {
            return this.tradersFound[b]
        },
        getFoundTraders: function(b, a) {
            var d = [],
                c;
            for (c in this.tradersFound) this.traders[c] && (this.traders[c].noTrack || (b ? this.traders[c].area == b && d.push(c) : d.push(c)));
            a != void 0 && this.sortList(d, a);
            return d
        },
        sortList: function(b, a) {
            switch (a) {
                case sc.TRADE_SORT_TYPE.FOUND:
                    b.sort(function(a, b) {
                        return (this.tradersFound[b].time || 0) - (this.tradersFound[a].time || 0)
                    }.bind(this));
                    break;
                case sc.TRADE_SORT_TYPE.ORDER:
                    b.sort(function(a, b) {
                        return (this.traders[a].order || 0) - (this.traders[b].order || 0)
                    }.bind(this))
            }
        },
        enterTrade: function(b) {
            this.hasEquippedTrade =
                false;
            ig.interact.addEntry(this.buttonInteract);
            this.options = b || null;
            this.visible = true;
            this.sessionTradeCount = 0
        },
        exitTrade: function() {
            ig.interact.removeEntry(this.buttonInteract);
            this.options = null;
            this.statsToggle = this.hasEquippedTrade = this.visible = false;
            this.equippedID1.id = -1;
            this.buffID = this.equippedID2.id = -1;
            this.compareMode = sc.TRADE_COMPARE_MODE.EQUIP;
            this.tradeIndex = 0
        },
        doTrade: function(b) {
            sc.stats.addMap("trade", "total", 1);
            for (var a = this.options[this.tradeIndex], d = sc.model.player, c = a.require,
                    e = c.length, f = 0; e--;) {
                d.removeItem(c[e].id, c[e].amount);
                f = f + (c[e].amount || 1)
            }
            sc.stats.addMap("trade", "lost", f);
            c = a.get;
            e = c.length;
            for (f = 0; e--;) {
                d.addItem(c[e].id, c[e].amount, true);
                f = f + (c[e].amount || 1)
            }
            d.removeCredit(b, true);
            sc.stats.addMap("trade", "moneyLost", b);
            sc.stats.addMap("trade", "got", f);
            this.sessionTradeCount++;
            sc.Model.notifyObserver(this, sc.TRADE_MODEL_EVENT.TRADED)
        },
        setEquippedID: function(b, a) {
            var d = sc.model.player.equip;
            switch (a) {
                case sc.ITEMS_EQUIP_TYPES.HEAD:
                    this._checkBodyPart(this.equippedID1,
                        b, d.head, sc.MENU_EQUIP_BODYPART.HEAD);
                    break;
                case sc.ITEMS_EQUIP_TYPES.ARM:
                    this._checkBodyPart(this.equippedID1, b, d.leftArm, sc.MENU_EQUIP_BODYPART.LEFT_ARM);
                    this._checkBodyPart(this.equippedID2, b, d.rightArm, sc.MENU_EQUIP_BODYPART.RIGHT_ARM);
                    break;
                case sc.ITEMS_EQUIP_TYPES.TORSO:
                    this._checkBodyPart(this.equippedID1, b, d.torso, sc.MENU_EQUIP_BODYPART.TORSO);
                    break;
                case sc.ITEMS_EQUIP_TYPES.FEET:
                    this._checkBodyPart(this.equippedID1, b, d.feet, sc.MENU_EQUIP_BODYPART.FEET)
            }
        },
        clearEquippedState: function() {
            this.equippedID1.id = -1;
            this.equippedID2.id = -1;
            this.hasEquippedTrade = false
        },
        unequipTradeItems: function() {
            var b = sc.model.player;
            if (this.equippedID1.id >= 0)
                if (this.equippedID1.id == this.equippedID2.id && this.equippedID1.bodypart == this.equippedID2.bodypart) {
                    b.setEquipment(this.equippedID1.bodypart, -1);
                    b.setEquipment(this.equippedID2.bodypart, -1);
                    this.equippedID1.id = -1;
                    this.equippedID2.id = -2
                } else {
                    b.setEquipment(this.equippedID1.bodypart, -1);
                    this.equippedID1.id = -1
                } if (this.equippedID2.id >= 0) {
                b.setEquipment(this.equippedID2.bodypart,
                    -1);
                this.equippedID2.id = -1
            }
            this.hasEquippedTrade = false
        },
        setActiveOffer: function(b) {
            if (b < 0 || b >= this.options.length) throw Error("No such active offer at index: " + b);
            this.tradeIndex = b;
            sc.Model.notifyObserver(this, sc.TRADE_MODEL_EVENT.OFFER_CHANGED)
        },
        getCurrentOffer: function() {
            return this.options[this.tradeIndex]
        },
        canTrade: function() {
            for (var b = this.options[this.tradeIndex], a = sc.model.player, d = b.require, c = d.length; c--;)
                if (a.getItemAmountWithEquip(d[c].id) < d[c].amount) return false;
            for (var d = b.get, c = d.length,
                    e = false, f = 0; c--;) {
                a.getItemAmountWithEquip(d[c].id) < 99 && (e = true);
                b.cost == void 0 && (f = f + sc.inventory.getItem(d[c].id).cost * (d[c].amount || 1))
            }
            f = b.cost != void 0 ? b.cost : Math.floor((f || 1) * (b.scale || 1));
            a.credit - f < 0 && (e = false);
            return e
        },
        setInfoText: function(b, a) {
            this.infoText = b;
            sc.Model.notifyObserver(this, sc.TRADE_MODEL_EVENT.INFO_TEXT_CHANGED, a)
        },
        setBuffText: function(b, a, d) {
            this.buffText = b;
            this.buffID = d || -1;
            sc.Model.notifyObserver(this, sc.TRADE_MODEL_EVENT.BUFF_TEXT_CHANGED, a)
        },
        setEquipID: function(b, a) {
            this.equipID =
                b;
            this.compareMode = sc.TRADE_COMPARE_MODE.EQUIP;
            sc.Model.notifyObserver(this, sc.TRADE_MODEL_EVENT.EQUIP_ID_CHANGED, a)
        },
        toggleCompareMode: function() {
            if (!(this.equipID <= -1)) {
                this.statsToggle = !this.statsToggle;
                this.compareMode = sc.inventory.getItem(this.equipID).equipType == sc.ITEMS_EQUIP_TYPES.ARM ? (this.compareMode + 1) % 3 : this.compareMode == sc.TRADE_COMPARE_MODE.EQUIP ? sc.TRADE_COMPARE_MODE.BASE_STATS : sc.TRADE_COMPARE_MODE.EQUIP;
                sc.Model.notifyObserver(this, sc.TRADE_MODEL_EVENT.COMPARE_MODE_CHANGED)
            }
        },
        _checkBodyPart: function(b,
            a, d, c) {
            if (a == d) {
                b.id = a;
                b.bodypart = c
            }
        }
    });
    sc.TradeInfo = ig.Class.extend({
        key: "",
        settings: null,
        iconGui: null,
        event: null,
        entity: null,
        init: function(b, a) {
            this.key = b.trader;
            this.settings = sc.trade.getTrader(this.key) || {};
            this.entity = a;
            if (!window.wm) this.iconGui = new sc.TradeIconGui(this.key);
            var d = b.event;
            d || (d = [{
                type: "START_NPC_TRADE_MENU"
            }]);
            this.event = new ig.Event({
                name: "NPC EVENT",
                steps: d
            })
        },
        startTradeMenu: function() {
            sc.model.enterOnMapMenu();
            sc.model.stopSkip();
            sc.trade.unlockTrader(this.key, this.entity.characterName);
            var b = new sc.TradeMenu(this.settings);
            ig.gui.addGuiElement(b);
            b.enterTrade()
        },
        clearCached: function() {
            this.event.clearCached();
            this.iconGui = null
        }
    });
    sc.TRADE_MODEL_EVENT = {};
    sc.TRADE_MODEL_EVENT.OFFER_CHANGED = 0;
    sc.TRADE_MODEL_EVENT.INFO_TEXT_CHANGED = 1;
    sc.TRADE_MODEL_EVENT.BUFF_TEXT_CHANGED = 2;
    sc.TRADE_MODEL_EVENT.EQUIP_ID_CHANGED = 3;
    sc.TRADE_MODEL_EVENT.COMPARE_MODE_CHANGED = 4;
    sc.TRADE_MODEL_EVENT.TRADED = 5;
    ig.addGameAddon(function() {
        return sc.trade = new sc.TradeModel
    })
});
ig.baked = !0;

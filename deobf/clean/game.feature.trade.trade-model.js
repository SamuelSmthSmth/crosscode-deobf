/**
 * @module game.feature.trade.trade-model
 *
 * Trade system model: loads trader definitions, tracks discovered traders
 * (with parent-unlock chains), saves/loads trader progress, runs the trade
 * exchange (removing required items/credits and granting the trade items),
 * tracks equipped-item comparisons, and manages the trade menu state.
 */
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
            for (var traderKey in this.traders) {
                var trader = this.traders[traderKey];
                trader.upgradeTo && this.traders[trader.upgradeTo] && (this.traders[trader.upgradeTo].child = traderKey)
            }
            ig.vars.registerVarAccessor("traders", this, "VarTradeEditor")
        },
        onStorageSave: function(storageData) {
            var savedFound = {},
                key;
            for (key in this.tradersFound) this.traders[key] && (savedFound[key] = {
                characterName: this.tradersFound[key].characterName,
                map: this.tradersFound[key].map && this.tradersFound[key].map.getSaveData ? this.tradersFound[key].map.getSaveData() : "???",
                area: this.tradersFound[key].area && this.tradersFound[key].area.getSaveData ?
                    this.tradersFound[key].area.getSaveData() : "???",
                time: this.tradersFound[key].time || 0
            });
            storageData.tradersFound = savedFound
        },
        onStoragePreLoad: function(storageData) {
            storageData = storageData.tradersFound || {};
            this.tradersFound = {};
            for (var key in storageData) this.tradersFound[key] = {
                characterName: storageData[key].characterName,
                map: new ig.LangLabel(storageData[key].map || "???"),
                area: new ig.LangLabel(storageData[key].area || "???"),
                time: storageData[key].time || 0
            };
            this.checkForParents();
            sc.stats.setMap("trade", "tradeRate", this.getTotalTradersFound(true))
        },
        onNewGameApply: function(saveData) {
            this.onStoragePreLoad(saveData)
        },
        checkForParents: function() {
            for (var key in this.traders) {
                var trader =
                    this.traders[key];
                this.tradersFound[key] && trader.upgradeTo && (this.tradersFound[trader.upgradeTo] || this.unlockParents(trader.upgradeTo, this.tradersFound[key].characterName, key))
            }
        },
        getTotalTradersFound: function(asRatio, area) {
            var found = 0,
                total = 0,
                key;
            for (key in this.traders)
                if (!this.traders[key].noTrack && !(area && this.traders[key].area != area)) {
                    this.tradersFound[key] && found++;
                    total = total + 1
                } return asRatio ? found / total : found
        },
        getTotalTraders: function(area) {
            var total = 0,
                key;
            for (key in this.traders) this.traders[key].noTrack || area && this.traders[key].area != area || total++;
            return total
        },
        onReset: function() {
            this.tradersFound = {}
        },
        onVarAccess: function(path, parts) {
            if (parts[0] == "traders") {
                var traderKey = parts[1];
                if (this.traders[traderKey]) switch (parts[2]) {
                    case "name":
                        return ig.LangLabel.getText(this.traders[traderKey].name);
                    case "unlocked":
                        return this.tradersFound[traderKey]
                }
            }
            throw Error("Unsupported var access path: " + path);
        },
        hasAreaTraders: function(area) {
            for (var key in this.traders)
                if (this.traders[key].area == area) return true;
            return false
        },
        hasTraderInArea: function(area) {
            for (var key in this.tradersFound)
                if (this.traders[key] && this.traders[key].area == area) return true;
            return false
        },
        hasAnyTraderFound: function() {
            if (sc.map.hasAnyAreaUnlocked())
                for (var key in this.tradersFound) return true;
            return false
        },
        hasTrader: function(traderKey) {
            return this.tradersFound[traderKey]
        },
        unlockTrader: function(traderKey, characterName) {
            if (!this.traders[traderKey].noTrack && !this.tradersFound[traderKey]) {
                this.tradersFound[traderKey] = {
                    characterName: characterName || "",
                    map: sc.map.getCurrentMapName(),
                    area: sc.map.getCurrentPlayerAreaName(),
                    time: (new Date).getTime()
                };
                var isParentUpdate = 0;
                this.traders[traderKey].upgradeTo && (isParentUpdate = this.unlockParents(this.traders[traderKey].upgradeTo, characterName, traderKey));
                sc.stats.setMap("tradersFound", traderKey, 1);
                sc.stats.addMap("trade", "tradersTotal", 1);
                sc.stats.setMap("trade", "tradeRate", this.getTotalTradersFound(true));
                sc.menu.addLog({
                    type: "TRADER",
                    trader: traderKey,
                    isUpdate: isParentUpdate == 1
                })
            }
        },
        unlockParents: function(parentKey, characterName, childKey) {
            if (this.traders[parentKey].noTrack) return 0;
            if (this.tradersFound[parentKey]) return 1;
            this.tradersFound[parentKey] = {
                characterName: characterName || "",
                map: ig.copy(this.tradersFound[childKey].map),
                area: ig.copy(this.tradersFound[childKey].area),
                time: (new Date).getTime()
            };
            sc.stats.setMap("tradersFound", parentKey, 1);
            sc.stats.addMap("trade", "tradersTotal", 1);
            return this.traders[parentKey].upgradeTo ? this.unlockParents(this.traders[parentKey].upgradeTo, characterName, parentKey) : 2
        },
        resetTrader: function(traderKey) {
            if (!this.traders[traderKey].noTrack &&
                this.tradersFound[traderKey]) {
                sc.stats.setMap("tradersFound", traderKey, 0);
                sc.stats.subMap("trade", "tradersTotal", 1);
                sc.stats.setMap("trade", "tradeRate", this.getTotalTradersFound(true));
                delete this.tradersFound[traderKey]
            }
        },
        getTrader: function(traderKey) {
            return this.traders[traderKey]
        },
        getTraderName: function(traderKey) {
            return ig.LangLabel.getText(this.traders[traderKey].name)
        },
        getTraderAreaName: function(traderKey, withMarker) {
            return sc.map.getAreaName(this.traders[traderKey].area, withMarker)
        },
        getFoundTrader: function(traderKey) {
            return this.tradersFound[traderKey]
        },
        getFoundTraders: function(area, sortType) {
            var traderKeys = [],
                key;
            for (key in this.tradersFound) this.traders[key] && (this.traders[key].noTrack || (area ? this.traders[key].area == area && traderKeys.push(key) : traderKeys.push(key)));
            sortType != void 0 && this.sortList(traderKeys, sortType);
            return traderKeys
        },
        sortList: function(traderKeys, sortType) {
            switch (sortType) {
                case sc.TRADE_SORT_TYPE.FOUND:
                    traderKeys.sort(function(a, b) {
                        return (this.tradersFound[b].time || 0) - (this.tradersFound[a].time || 0)
                    }.bind(this));
                    break;
                case sc.TRADE_SORT_TYPE.ORDER:
                    traderKeys.sort(function(a, b) {
                        return (this.traders[a].order || 0) - (this.traders[b].order || 0)
                    }.bind(this))
            }
        },
        enterTrade: function(options) {
            this.hasEquippedTrade =
                false;
            ig.interact.addEntry(this.buttonInteract);
            this.options = options || null;
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
        doTrade: function(creditCost) {
            sc.stats.addMap("trade", "total", 1);
            for (var offer = this.options[this.tradeIndex], player = sc.model.player, requireList = offer.require,
                    i = requireList.length, lostItems = 0; i--;) {
                player.removeItem(requireList[i].id, requireList[i].amount);
                lostItems = lostItems + (requireList[i].amount || 1)
            }
            sc.stats.addMap("trade", "lost", lostItems);
            requireList = offer.get;
            i = requireList.length;
            for (lostItems = 0; i--;) {
                player.addItem(requireList[i].id, requireList[i].amount, true);
                lostItems = lostItems + (requireList[i].amount || 1)
            }
            player.removeCredit(creditCost, true);
            sc.stats.addMap("trade", "moneyLost", creditCost);
            sc.stats.addMap("trade", "got", lostItems);
            this.sessionTradeCount++;
            sc.Model.notifyObserver(this, sc.TRADE_MODEL_EVENT.TRADED)
        },
        setEquippedID: function(itemId, equipType) {
            var playerEquip = sc.model.player.equip;
            switch (equipType) {
                case sc.ITEMS_EQUIP_TYPES.HEAD:
                    this._checkBodyPart(this.equippedID1,
                        itemId, playerEquip.head, sc.MENU_EQUIP_BODYPART.HEAD);
                    break;
                case sc.ITEMS_EQUIP_TYPES.ARM:
                    this._checkBodyPart(this.equippedID1, itemId, playerEquip.leftArm, sc.MENU_EQUIP_BODYPART.LEFT_ARM);
                    this._checkBodyPart(this.equippedID2, itemId, playerEquip.rightArm, sc.MENU_EQUIP_BODYPART.RIGHT_ARM);
                    break;
                case sc.ITEMS_EQUIP_TYPES.TORSO:
                    this._checkBodyPart(this.equippedID1, itemId, playerEquip.torso, sc.MENU_EQUIP_BODYPART.TORSO);
                    break;
                case sc.ITEMS_EQUIP_TYPES.FEET:
                    this._checkBodyPart(this.equippedID1, itemId, playerEquip.feet, sc.MENU_EQUIP_BODYPART.FEET)
            }
        },
        clearEquippedState: function() {
            this.equippedID1.id = -1;
            this.equippedID2.id = -1;
            this.hasEquippedTrade = false
        },
        unequipTradeItems: function() {
            var player = sc.model.player;
            if (this.equippedID1.id >= 0)
                if (this.equippedID1.id == this.equippedID2.id && this.equippedID1.bodypart == this.equippedID2.bodypart) {
                    player.setEquipment(this.equippedID1.bodypart, -1);
                    player.setEquipment(this.equippedID2.bodypart, -1);
                    this.equippedID1.id = -1;
                    this.equippedID2.id = -2
                } else {
                    player.setEquipment(this.equippedID1.bodypart, -1);
                    this.equippedID1.id = -1
                } if (this.equippedID2.id >= 0) {
                player.setEquipment(this.equippedID2.bodypart,
                    -1);
                this.equippedID2.id = -1
            }
            this.hasEquippedTrade = false
        },
        setActiveOffer: function(index) {
            if (index < 0 || index >= this.options.length) throw Error("No such active offer at index: " + index);
            this.tradeIndex = index;
            sc.Model.notifyObserver(this, sc.TRADE_MODEL_EVENT.OFFER_CHANGED)
        },
        getCurrentOffer: function() {
            return this.options[this.tradeIndex]
        },
        canTrade: function() {
            for (var offer = this.options[this.tradeIndex], player = sc.model.player, requireList = offer.require, i = requireList.length; i--;)
                if (player.getItemAmountWithEquip(requireList[i].id) < requireList[i].amount) return false;
            for (var requireList = offer.get, i = requireList.length,
                    hasRoom = false, creditCost = 0; i--;) {
                player.getItemAmountWithEquip(requireList[i].id) < 99 && (hasRoom = true);
                offer.cost == void 0 && (creditCost = creditCost + sc.inventory.getItem(requireList[i].id).cost * (requireList[i].amount || 1))
            }
            creditCost = offer.cost != void 0 ? offer.cost : Math.floor((creditCost || 1) * (offer.scale || 1));
            player.credit - creditCost < 0 && (hasRoom = false);
            return hasRoom
        },
        setInfoText: function(text, context) {
            this.infoText = text;
            sc.Model.notifyObserver(this, sc.TRADE_MODEL_EVENT.INFO_TEXT_CHANGED, context)
        },
        setBuffText: function(text, context, buffId) {
            this.buffText = text;
            this.buffID = buffId || -1;
            sc.Model.notifyObserver(this, sc.TRADE_MODEL_EVENT.BUFF_TEXT_CHANGED, context)
        },
        setEquipID: function(itemId, context) {
            this.equipID =
                itemId;
            this.compareMode = sc.TRADE_COMPARE_MODE.EQUIP;
            sc.Model.notifyObserver(this, sc.TRADE_MODEL_EVENT.EQUIP_ID_CHANGED, context)
        },
        toggleCompareMode: function() {
            if (!(this.equipID <= -1)) {
                this.statsToggle = !this.statsToggle;
                this.compareMode = sc.inventory.getItem(this.equipID).equipType == sc.ITEMS_EQUIP_TYPES.ARM ? (this.compareMode + 1) % 3 : this.compareMode == sc.TRADE_COMPARE_MODE.EQUIP ? sc.TRADE_COMPARE_MODE.BASE_STATS : sc.TRADE_COMPARE_MODE.EQUIP;
                sc.Model.notifyObserver(this, sc.TRADE_MODEL_EVENT.COMPARE_MODE_CHANGED)
            }
        },
        _checkBodyPart: function(equippedState,
            itemId, equippedItemId, bodypart) {
            if (itemId == equippedItemId) {
                equippedState.id = itemId;
                equippedState.bodypart = bodypart
            }
        }
    });
    sc.TradeInfo = ig.Class.extend({
        key: "",
        settings: null,
        iconGui: null,
        event: null,
        entity: null,
        init: function(settings, entity) {
            this.key = settings.trader;
            this.settings = sc.trade.getTrader(this.key) || {};
            this.entity = entity;
            if (!window.wm) this.iconGui = new sc.TradeIconGui(this.key);
            var eventSteps = settings.event;
            eventSteps || (eventSteps = [{
                type: "START_NPC_TRADE_MENU"
            }]);
            this.event = new ig.Event({
                name: "NPC EVENT",
                steps: eventSteps
            })
        },
        startTradeMenu: function() {
            sc.model.enterOnMapMenu();
            sc.model.stopSkip();
            sc.trade.unlockTrader(this.key, this.entity.characterName);
            var tradeMenu = new sc.TradeMenu(this.settings);
            ig.gui.addGuiElement(tradeMenu);
            tradeMenu.enterTrade()
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

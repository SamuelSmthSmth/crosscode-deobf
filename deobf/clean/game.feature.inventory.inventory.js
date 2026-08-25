/**
 * @module game.feature.inventory.inventory
 *
 * Item database loader and query API. Loads item definitions from JSON,
 * converts effects to handles, flags buff items, tracks scalable equipment
 * (re-adapting params when the player levels), and provides lookups for
 * names, descriptions, rarities, buff strings, and completion stats.
 */
ig.module("game.feature.inventory.inventory").requires("impact.base.loader", "game.config", "game.feature.inventory.item-level-scaling").defines(function() {
    sc.ITEMS_TYPES = {
        CONS: "CONS",
        EQUIP: "EQUIP",
        TRADE: "TRADE",
        KEY: "KEY",
        TOGGLE: "TOGGLE"
    };
    sc.ITEMS_EQUIP_TYPES = {
        HEAD: "HEAD",
        ARM: "ARM",
        TORSO: "TORSO",
        FEET: "FEET"
    };
    sc.ITEMS_RARITY = {
        LOW: 0,
        NORMAL: 1,
        RARE: 2,
        LEGENDARY: 3,
        UNIQUE: 4,
        BACKER: 5,
        SCALE: 6
    };
    sc.SORT_TYPE = {
        ORDER: 0,
        NAME: 1,
        AMOUNT: 2,
        RARITY: 3,
        HP: 4,
        ATTACK: 5,
        DEFENSE: 6,
        FOCUS: 7,
        LEVEL: 8
    };
    sc.ITEM_TRADE_TYPE = {
        ENEMY: {
            _type: "EnemySearch"
        },
        PLANT: {
            _type: "DropSelect"
        },
        TRADER: {
            _type: "TraderSelect"
        },
        QUEST: {
            _type: "Quest"
        },
        CHEST: {
            _type: "Select",
            _select: "areas"
        },
        OTHER: {
            _type: "TradeCustomEditor"
        }
    };
    sc.Inventory = ig.SingleLoadable.extend({
        items: [],
        scalable: [],
        init: function() {
            if (!ig.ITEM_DATABASE) return ig.warn("Can't initialize item database because no ig.ITEM_DATABASE was provided!");
            this.parent()
        },
        updateScaledEquipment: function(level) {
            for (var i = this.scalable.length; i--;) {
                var item = this.getItem(this.scalable[i]),
                    params = item.params,
                    baseParams = item.baseParams,
                    baseLevel = item.baseLevel;
                if (params) {
                    baseParams = sc.ItemLevelScaling.adaptParams(baseParams, baseLevel, level);
                    baseParams.hp && (params.hp = baseParams.hp);
                    baseParams.attack && (params.attack = baseParams.attack);
                    baseParams.defense && (params.defense = baseParams.defense);
                    baseParams.focus && (params.focus = baseParams.focus);
                    item.level = level
                }
            }
        },
        isScalable: function(itemId) {
            for (var i = this.scalable.length; i--;)
                if (this.scalable[i] == itemId) return true;
            return false
        },
        getItem: function(itemId) {
            return itemId < 0 ? null : this.items[itemId]
        },
        getItemName: function(itemId) {
            itemId = this.getItem(itemId);
            return !itemId ? null : ig.LangLabel.getText(itemId.name)
        },
        getItemByName: function(name) {
            name = this.getItemID(name);
            return name == -1 ? null : this.items[name]
        },
        getItemLevel: function(itemId) {
            return itemId <
                0 ? 0 : this.items[itemId].level || 0
        },
        getItemID: function(name) {
            for (var name = name.trim().toLowerCase(), i = this.items.length; i--;)
                if (this.items[i].name.en_US.toLowerCase() == name) return i;
            return -1
        },
        getBuffString: function(itemId, showTime, gradeOverride) {
            if (gradeOverride || this.isBuffID(itemId)) {
                for (var gradeOverride = gradeOverride || this.items[itemId].stats, i = gradeOverride.length, statChange = null, buffString = "", uniformGrade = this.areStatChangesRanksUniform(gradeOverride); i--;)
                    if ((statChange = sc.STAT_CHANGE_SETTINGS[gradeOverride[i]]) && statChange.change != sc.STAT_CHANGE_TYPE.HEAL) {
                        buffString = buffString + ("\\i[" + (statChange.icon || "stat-default") + "]");
                        uniformGrade || (buffString = buffString + ("\\i[" + statChange.grade + "]" || ""))
                    } uniformGrade && (buffString = buffString + ("\\i[" + uniformGrade + "]" || ""));
                return buffString + (showTime ? "" : " " + (this.items[itemId].time || 0) * (sc.newgame.get("double-buff-time") ? 2 : 1) + "sec")
            }
        },
        areStatChangesRanksUniform: function(stats) {
            for (var i = stats.length, statChange = sc.STAT_CHANGE_SETTINGS[stats[i - 1]], rank = statChange.grade; i--;) {
                statChange = sc.STAT_CHANGE_SETTINGS[stats[i]];
                if (!statChange || statChange.change == sc.STAT_CHANGE_TYPE.HEAL || statChange.grade != rank) return;
                rank = statChange.grade
            }
            return rank
        },
        isBuffID: function(itemId) {
            return this.items[itemId].isBuff
        },
        isEquipID: function(itemId) {
            return this.items[itemId].type == sc.ITEMS_TYPES.EQUIP
        },
        getRaritySuffix: function(rarity) {
            switch (rarity) {
                case sc.ITEMS_RARITY.LOW:
                    return "";
                case sc.ITEMS_RARITY.NORMAL:
                    return "-normal";
                case sc.ITEMS_RARITY.RARE:
                    return "-rare";
                case sc.ITEMS_RARITY.LEGENDARY:
                    return "-legend";
                case sc.ITEMS_RARITY.UNIQUE:
                    return "-unique";
                case sc.ITEMS_RARITY.BACKER:
                    return "-backer";
                case sc.ITEMS_RARITY.SCALE:
                    return "-scale"
            }
        },
        getItemNameWithIcon: function(itemId) {
            itemId = this.items[itemId];
            return !itemId ? "" : "\\i[" + (itemId.icon + this.getRaritySuffix(itemId.rarity || 0) || "item-default") + "]" + ig.LangLabel.getText(itemId.name)
        },
        getItemIcon: function(itemId) {
            if (itemId <= 0) return null;
            itemId = this.items[itemId];
            return !itemId ? "item-default" :
                "\\i[" + (itemId.icon + this.getRaritySuffix(itemId.rarity || 0) || "item-default") + "]"
        },
        getItemDescription: function(itemId) {
            return this.items[itemId] ? ig.LangLabel.getText(this.items[itemId].description) : ""
        },
        getItemRarity: function(itemId) {
            itemId = this.items[itemId];
            return !itemId ? null : itemId.rarity
        },
        getItemSubType: function(itemId) {
            itemId = this.items[itemId];
            return !itemId ? null : itemId.equipType
        },
        isConsumable: function(itemId) {
            itemId = this.items[itemId];
            return !itemId ? false : itemId.type == sc.ITEMS_TYPES.CONS
        },
        getTotalItemsUnlocked: function(asRatio, type, subType, logMissing) {
            for (var i = this.items.length, inventory = sc.inventory, unlocked = 0, total = 0, item = null; i--;) {
                item =
                    inventory.getItem(i);
                if (!item.name.en_US.startsWith("-") && !(item.type == "KEY" || item.type == "TOGGLE" || item.noTrack || item.noCount))
                    if (type)
                        if (subType) {
                            item = inventory.getItem(i);
                            if (item.type == type && item.equipType == subType) {
                                sc.stats.getMap("items", i) && unlocked++;
                                total++
                            }
                        } else {
                            if (inventory.getItem(i).type == type) {
                                sc.stats.getMap("items", i) && unlocked++;
                                total++
                            }
                        }
                else {
                    sc.stats.getMap("items", i) ? unlocked++ : logMissing && console.log("ITEM MISSING", inventory.getItemName(i));
                    total++
                }
            }
            return asRatio ? unlocked / total : unlocked
        },
        loadInternal: function() {
            $.ajax({
                dataType: "json",
                url: ig.root + ig.ITEM_DATABASE + ig.getCacheSuffix(),
                context: this,
                success: this.onload.bind(this),
                error: this.onerror.bind(this)
            })
        },
        onerror: function(event) {
            this.items = {};
            this.loadingFinished(true);
            ig.error("Could not load Inventory json file! Event: %O", event)
        },
        onload: function(data) {
            this.items = data.items;
            for (var i = this.items.length, item = null; i--;) {
                item = this.items[i];
                item.effect && (item.effect.sheet && item.effect.name) && (item.effect = new ig.EffectHandle(this.items[i].effect));
                this._isBuff(item) && (item.isBuff = true);
                if (item.isScalable) {
                    this.scalable.push(i);
                    item.baseParams = ig.copy(item.params);
                    item.baseLevel = item.level
                }
            }
            this.loadingFinished(true);
            ig.JSON_LOG &&
                ig.log("%cLOADABLE: %cLoaded Inventory: \n%O", "color:#149AEB", "", data)
        },
        _isBuff: function(item) {
            if (item.stats)
                for (var i = item.stats.length; i--;)
                    if (sc.STAT_CHANGE_SETTINGS[item.stats[i]].change != sc.STAT_CHANGE_TYPE.HEAL) return true;
            return false
        }
    });
    sc.inventory = new sc.Inventory
});
ig.baked = !0;

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
        updateScaledEquipment: function(b) {
            for (var a = this.scalable.length; a--;) {
                var d = this.getItem(this.scalable[a]),
                    c = d.params,
                    e = d.baseParams,
                    f = d.baseLevel;
                if (c) {
                    e = sc.ItemLevelScaling.adaptParams(e, f, b);
                    e.hp && (c.hp = e.hp);
                    e.attack && (c.attack = e.attack);
                    e.defense && (c.defense = e.defense);
                    e.focus && (c.focus = e.focus);
                    d.level = b
                }
            }
        },
        isScalable: function(b) {
            for (var a = this.scalable.length; a--;)
                if (this.scalable[a] == b) return true;
            return false
        },
        getItem: function(b) {
            return b < 0 ? null : this.items[b]
        },
        getItemName: function(b) {
            b = this.getItem(b);
            return !b ? null : ig.LangLabel.getText(b.name)
        },
        getItemByName: function(b) {
            b = this.getItemID(b);
            return b == -1 ? null : this.items[b]
        },
        getItemLevel: function(b) {
            return b <
                0 ? 0 : this.items[b].level || 0
        },
        getItemID: function(b) {
            for (var b = b.trim().toLowerCase(), a = this.items.length; a--;)
                if (this.items[a].name.en_US.toLowerCase() == b) return a;
            return -1
        },
        getBuffString: function(b, a, d) {
            if (d || this.isBuffID(b)) {
                for (var d = d || this.items[b].stats, c = d.length, e = null, f = "", g = this.areStatChangesRanksUniform(d); c--;)
                    if ((e = sc.STAT_CHANGE_SETTINGS[d[c]]) && e.change != sc.STAT_CHANGE_TYPE.HEAL) {
                        f = f + ("\\i[" + (e.icon || "stat-default") + "]");
                        g || (f = f + ("\\i[" + e.grade + "]" || ""))
                    } g && (f = f + ("\\i[" + g + "]" || ""));
                return f + (a ? "" : " " + (this.items[b].time || 0) * (sc.newgame.get("double-buff-time") ? 2 : 1) + "sec")
            }
        },
        areStatChangesRanksUniform: function(b) {
            for (var a = b.length, d = sc.STAT_CHANGE_SETTINGS[b[a - 1]], c = d.grade; a--;) {
                d = sc.STAT_CHANGE_SETTINGS[b[a]];
                if (!d || d.change == sc.STAT_CHANGE_TYPE.HEAL || d.grade != c) return;
                c = d.grade
            }
            return c
        },
        isBuffID: function(b) {
            return this.items[b].isBuff
        },
        isEquipID: function(b) {
            return this.items[b].type == sc.ITEMS_TYPES.EQUIP
        },
        getRaritySuffix: function(b) {
            switch (b) {
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
        getItemNameWithIcon: function(b) {
            b = this.items[b];
            return !b ? "" : "\\i[" + (b.icon + this.getRaritySuffix(b.rarity || 0) || "item-default") + "]" + ig.LangLabel.getText(b.name)
        },
        getItemIcon: function(b) {
            if (b <= 0) return null;
            b = this.items[b];
            return !b ? "item-default" :
                "\\i[" + (b.icon + this.getRaritySuffix(b.rarity || 0) || "item-default") + "]"
        },
        getItemDescription: function(b) {
            return this.items[b] ? ig.LangLabel.getText(this.items[b].description) : ""
        },
        getItemRarity: function(b) {
            b = this.items[b];
            return !b ? null : b.rarity
        },
        getItemSubType: function(b) {
            b = this.items[b];
            return !b ? null : b.equipType
        },
        isConsumable: function(b) {
            b = this.items[b];
            return !b ? false : b.type == sc.ITEMS_TYPES.CONS
        },
        getTotalItemsUnlocked: function(b, a, d, c) {
            for (var e = this.items.length, f = sc.inventory, g = 0, h = 0, i = null; e--;) {
                i =
                    f.getItem(e);
                if (!i.name.en_US.startsWith("-") && !(i.type == "KEY" || i.type == "TOGGLE" || i.noTrack || i.noCount))
                    if (a)
                        if (d) {
                            i = f.getItem(e);
                            if (i.type == a && i.equipType == d) {
                                sc.stats.getMap("items", e) && g++;
                                h++
                            }
                        } else {
                            if (f.getItem(e).type == a) {
                                sc.stats.getMap("items", e) && g++;
                                h++
                            }
                        }
                else {
                    sc.stats.getMap("items", e) ? g++ : c && console.log("ITEM MISSING", f.getItemName(e));
                    h++
                }
            }
            return b ? g / h : g
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
        onerror: function(b) {
            this.items = {};
            this.loadingFinished(true);
            ig.error("Could not load Inventory json file! Event: %O", b)
        },
        onload: function(b) {
            this.items = b.items;
            for (var a = this.items.length, d = null; a--;) {
                d = this.items[a];
                d.effect && (d.effect.sheet && d.effect.name) && (d.effect = new ig.EffectHandle(this.items[a].effect));
                this._isBuff(d) && (d.isBuff = true);
                if (d.isScalable) {
                    this.scalable.push(a);
                    d.baseParams = ig.copy(d.params);
                    d.baseLevel = d.level
                }
            }
            this.loadingFinished(true);
            ig.JSON_LOG &&
                ig.log("%cLOADABLE: %cLoaded Inventory: \n%O", "color:#149AEB", "", b)
        },
        _isBuff: function(b) {
            if (b.stats)
                for (var a = b.stats.length; a--;)
                    if (sc.STAT_CHANGE_SETTINGS[b.stats[a]].change != sc.STAT_CHANGE_TYPE.HEAL) return true;
            return false
        }
    });
    sc.inventory = new sc.Inventory
});
ig.baked = !0;

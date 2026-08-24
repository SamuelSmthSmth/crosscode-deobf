/**
 * game.feature.menu.menu-model
 * ============================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.menu-model")`.
 *
 * `sc.MenuModel` (`sc.menu`): the central menu-state model. Tracks the
 * submenu stack + back-callback stack, hotkeys, info/buff texts, the Lea
 * sprite state, and per-menu UI state (skill tree cursors, map drag/zoom
 * state, shop cart/pages, item/option/quest tabs, status page, drops).
 * Emits `sc.MENU_EVENT.*` notifications to observers; also owns drop
 * tracking (`incrementDropCount`, `dropCounts`), log entries, map stamps,
 * and save/load of those via `onStorageSave`/`onStoragePreLoad`.
 *
 * Data tables: `sc.MENU_SUBMENU`, `sc.SUB_MENU_INFO` (menu class registry),
 * `sc.MENU_SHOP_TYPES`/`sc.MENU_SHOP_STATE`, `sc.SELL_PAGES`,
 * `sc.LOG_TYPES`, `sc.MENU_STATUS_PAGES`, `sc.BOTANICS_SORT_TYPE`, ...
 */
ig.module("game.feature.menu.menu-model")
    .requires(
        "impact.base.game",
        "impact.feature.interact.button-interact",
        "impact.feature.storage.storage",
        "game.feature.model.base-model",
        "game.feature.menu.area-loadable",
        "game.feature.menu.gui.start-menu",
        "game.feature.menu.gui.equip.equip-menu",
        "game.feature.menu.gui.circuit.circuit-menu",
        "game.feature.menu.gui.item.item-menu",
        "game.feature.menu.gui.map.map-menu",
        "game.feature.menu.gui.save.save-menu",
        "game.feature.menu.gui.options.options-menu",
        "game.feature.menu.gui.shop.shop-menu",
        "game.feature.menu.gui.synop.synop-menu",
        "game.feature.menu.gui.quests.quest-menu",
        "game.feature.menu.gui.quest-hub.quest-hub-menu",
        "game.feature.menu.gui.enemies.enemy-menu",
        "game.feature.menu.gui.lore.lore-menu",
        "game.feature.menu.gui.status.status-menu",
        "game.feature.menu.gui.help.help-menu",
        "game.feature.menu.gui.museum.museum-menu",
        "game.feature.menu.gui.stats.stats-menu",
        "game.feature.menu.gui.trophy.trophy-menu",
        "game.feature.menu.gui.social.social-menu",
        "game.feature.menu.gui.trade.trader-menu",
        "game.feature.menu.gui.botanics.botanics-menu",
        "game.feature.menu.gui.arena.arena-menu",
        "game.feature.menu.gui.new-game.new-game-menu",
        "game.feature.menu.map-model"
    )
    .defines(function () {

    // Inserts the locale's thousands separator ("," or ".") into a number string.
    function addThousandsSeparator(number) {
        var langCode = ig.currentLang + "",
            separator = ig.LANG_DETAILS[ig.currentLang] && ig.LANG_DETAILS[ig.currentLang].commaDigits ? "." : ",",
            re = /(\d+)(\d{3})/,
            str = number + "";
        while (re.test(str)) str = str.replace(re, "$1" + separator + "$2");
        return str
    }

    // Pads a number to `digits` digits (zero-prefixed), used for time display.
    function padToDigits(number, digits) {
        var padded = "0000" + Math.floor(number);
        return padded.length >= 4 + digits ? Math.floor(number) : padded.substr(padded.length - digits)
    }

    sc.MENU_SUBMENU = {
        START: 0,
        ITEMS: 1,
        SKILLS: 2,
        EQUIPMENT: 3,
        STATUS: 4,
        SYNOPSIS: 5,
        MAP: 6,
        SAVE: 7,
        OPTIONS: 8,
        SHOP: 9,
        QUESTS: 10,
        TROPHY: 11,
        LORE: 12,
        ENEMY: 13,
        SOCIAL: 14,
        STATS: 15,
        MUSEUM: 16,
        TRADE: 17,
        BOTANICS: 18,
        QUEST_HUB: 19,
        ARENA: 20,
        NEW_GAME: 21
    };

    sc.SUB_MENU_INFO = {};
    sc.SUB_MENU_INFO[sc.MENU_SUBMENU.START] = {
        Clazz: sc.StartMenu,
        name: "start"
    };
    sc.SUB_MENU_INFO[sc.MENU_SUBMENU.ITEMS] = {
        Clazz: sc.ItemMenu,
        name: "items"
    };
    sc.SUB_MENU_INFO[sc.MENU_SUBMENU.SKILLS] = {
        Clazz: sc.CircuitMenu,
        name: "skills"
    };
    sc.SUB_MENU_INFO[sc.MENU_SUBMENU.EQUIPMENT] = {
        Clazz: sc.EquipMenu,
        name: "equipment"
    };
    sc.SUB_MENU_INFO[sc.MENU_SUBMENU.STATUS] = {
        Clazz: sc.StatusMenu,
        name: "status"
    };
    sc.SUB_MENU_INFO[sc.MENU_SUBMENU.SYNOPSIS] = {
        Clazz: sc.SynopsisMenu,
        name: "synopsis"
    };
    sc.SUB_MENU_INFO[sc.MENU_SUBMENU.MAP] = {
        Clazz: sc.MapMenu,
        name: "map"
    };
    sc.SUB_MENU_INFO[sc.MENU_SUBMENU.SAVE] = {
        Clazz: sc.SaveMenu,
        name: "save",
        alt: "load"
    };
    sc.SUB_MENU_INFO[sc.MENU_SUBMENU.OPTIONS] = {
        Clazz: sc.OptionsMenu,
        name: "options"
    };
    sc.SUB_MENU_INFO[sc.MENU_SUBMENU.SHOP] = {
        Clazz: sc.ShopMenu,
        name: "shop",
        alt: "arenaShop"
    };
    sc.SUB_MENU_INFO[sc.MENU_SUBMENU.QUESTS] = {
        Clazz: sc.QuestMenu,
        name: "quests"
    };
    sc.SUB_MENU_INFO[sc.MENU_SUBMENU.LORE] = {
        Clazz: sc.LoreMenu,
        name: "lore"
    };
    sc.SUB_MENU_INFO[sc.MENU_SUBMENU.ENEMY] = {
        Clazz: sc.EnemyMenu,
        name: "enemy"
    };
    sc.SUB_MENU_INFO[sc.MENU_SUBMENU.SOCIAL] = {
        Clazz: sc.SocialMenu,
        name: "social"
    };
    sc.SUB_MENU_INFO[sc.MENU_SUBMENU.TROPHY] = {
        Clazz: sc.TrophyMenu,
        name: "trophy"
    };
    sc.SUB_MENU_INFO[sc.MENU_SUBMENU.STATS] = {
        Clazz: sc.StatsMenu,
        name: "stats"
    };
    sc.SUB_MENU_INFO[sc.MENU_SUBMENU.MUSEUM] = {
        Clazz: sc.MuseumMenu,
        name: "museum"
    };
    sc.SUB_MENU_INFO[sc.MENU_SUBMENU.TRADE] = {
        Clazz: sc.TraderMenu,
        name: "trade"
    };
    sc.SUB_MENU_INFO[sc.MENU_SUBMENU.BOTANICS] = {
        Clazz: sc.BotanicsMenu,
        name: "botanics"
    };
    sc.SUB_MENU_INFO[sc.MENU_SUBMENU.QUEST_HUB] = {
        Clazz: sc.QuestHubMenu,
        name: "questHub"
    };
    sc.SUB_MENU_INFO[sc.MENU_SUBMENU.ARENA] = {
        Clazz: sc.ArenaMenu,
        name: "arena",
        alt: "arenaCustom"
    };
    sc.SUB_MENU_INFO[sc.MENU_SUBMENU.NEW_GAME] = {
        Clazz: sc.NewGamePlusMenu,
        name: "new-game"
    };

    sc.MENU_LEA_STATE = {
        LARGE: 0,
        SMALL: 1,
        HIDDEN: 2
    };

    sc.MENU_EQUIP_BODYPART = {
        NONE: 0,
        HEAD: 1,
        RIGHT_ARM: 2,
        LEFT_ARM: 3,
        TORSO: 4,
        FEET: 5
    };

    sc.MENU_SKILL_STATE = {
        OVERVIEW: 0,
        DETAIL_VIEW: 1,
        NODE_SELECT: 2,
        NODE_MENU: 3,
        SWAP_BRANCHES: 4
    };

    sc.MENU_SHOP_TYPES = {};
    sc.MENU_SHOP_TYPES.BUY_AND_SELL = 0;
    sc.MENU_SHOP_TYPES.BUY = 1;
    sc.MENU_SHOP_TYPES.SELL = 2;
    sc.MENU_SHOP_TYPES.COIN = 3;
    sc.MENU_SHOP_STATE = {};
    sc.MENU_SHOP_STATE.START = 0;
    sc.MENU_SHOP_STATE.BUY = 1;
    sc.MENU_SHOP_STATE.SELL_CAT = 2;
    sc.MENU_SHOP_STATE.SELL = 3;

    sc.LOG_TYPES = {
        QUEST: 0,
        LANDMARK: 1,
        LORE: 2,
        TROPHY: 3,
        TRADER: 4,
        STORY: 5,
        DROP: 6
    };

    sc.MENU_STATUS_PAGES = {
        MAIN: 0,
        PARAMS: 1,
        MODS: 2,
        COMBAT_ARTS: 3
    };

    sc.BOTANICS_SORT_TYPE = {
        ORDER: 0,
        FOUND: 1,
        NAME: 2
    };

    sc.MENU_STATUS_PAGES_LENGTH = 4;

    sc.SELL_PAGES = [{
        lang: "cons",
        type: "CONS"
    }, {
        lang: "equip-arm",
        type: "EQUIP",
        equipType: "ARM"
    }, {
        lang: "equip-head",
        type: "EQUIP",
        equipType: "HEAD"
    }, {
        lang: "equip-torso",
        type: "EQUIP",
        equipType: "TORSO"
    }, {
        lang: "equip-feet",
        type: "EQUIP",
        equipType: "FEET"
    }, {
        lang: "trade",
        type: "TRADE"
    }];

    sc.MENU_QUEST_HUB_TABS = {
        OPEN: 0,
        ACTIVE: 1,
        FINISHED: 2
    };

    sc.MENU_ARENA_TABS = {
        SOLO: 0,
        TEAM: 1
    };

    sc.MAP_STAMPS_MAX = 99;
    sc.MAX_MOD_VAL = 999;

    sc.TOGGLE_SET_TYPE = {
        SINGLE: "SINGLE",
        MULTI: "MULTI"
    };

    sc.MenuModel = ig.GameAddon.extend({
        guiReference: null,
        observers: [],
        infoText: null,
        buffText: null,
        buffID: -1,
        currentMenu: sc.MENU_SUBMENU.START,
        previousMenu: null,
        menuStack: [],
        buttonInteract: null,
        backCallbackStack: [],
        hotkeysCallbacks: [],
        currentBackCallback: null,
        leaState: sc.MENU_LEA_STATE,
        menuEntered: false,
        currentBodyPart: sc.MENU_EQUIP_BODYPART.NONE,
        previousBodyPart: null,
        exitCallback: null,
        currentSkillTree: -1,
        previousSkillTree: -1,
        skillCursor: Vec2.createC(0, 0),
        lastSkillCursor: Vec2.createC(0, 0),
        skillRecoverPos: Vec2.createC(0, 0),
        skillCamera: Vec2.createC(0, 0),
        skillDrag: false,
        skillWasDragged: false,
        skillState: sc.MENU_SKILL_STATE.OVERVIEW,
        skillStateOrigin: sc.MENU_SKILL_STATE.OVERVIEW,
        skillCursorMoved: false,
        currentSkillFocus: null,
        skillSwapCursor: Vec2.createC(0, 0),
        skillSwapMoved: false,
        skillSwapFocus: null,
        mapDrag: false,
        mapWasDragged: false,
        mapCamera: Vec2.createC(0, 0),
        mapFirstVisit: false,
        mapUnknownArea: false,
        mapMouseOverFloorButtons: false,
        mapCursor: Vec2.createC(0, 0),
        mapLastCursor: Vec2.createC(0, 0),
        mapCursorMoved: false,
        mapWorldmapActive: false,
        mapWorldCursor: Vec2.createC(0, 0),
        mapWorldLastCursor: Vec2.createC(0, 0),
        mapWmCursorMoved: false,
        mapAreaFocus: null,
        mapMapFocus: null,
        mapWorldFirstVisit: false,
        mapLoading: false,
        mapAreaOffset: Vec2.create(0, 0),
        mapStampMenu: false,
        mapStamps: {},
        shopID: null,
        shopState: sc.MENU_SHOP_STATE.START,
        shopCoinMode: false,
        shopPage: 0,
        shopCart: [],
        shopSellMode: false,
        itemCurrentTab: -1,
        itemLastButtonData: null,
        optionCurrentTab: 0,
        optionLastButtonData: null,
        optionsLocalMode: true,
        questCurrentTab: 0,
        questLastButtonData: null,
        questInfo: null,
        questDetailMode: false,
        questsSeen: {},
        newGameViewMode: false,
        tradeToggle: false,
        directMode: false,
        directMenu: 0,
        loadMode: false,
        loadSlotID: -2,
        loadClearFilesOnly: false,
        loreCurrentTab: 0,
        synopInfo: null,
        newUnlocks: {},
        logEntries: [],
        gamepadIcons: false,
        menuHost: 0,
        statusPage: 0,
        statusElement: 0,
        statusDiff: false,
        drops: {},
        dropCounts: {},
        questHubID: null,
        words: null,
        helpMenuOpen: false,

        init: function () {
            this.parent("MenuModel");
            this.buttonInteract = new ig.ButtonInteractEntry;
            if (window.wm) {
                ig.database.register("shops", "ShopList", "Shops");
                ig.database.register("drops", "DropsList", "Drops");
                ig.database.register("leawords", "StringArray", "Lea Words")
            }
            this.drops = ig.database.get("drops");
            this.words = ig.database.get("leawords");
            for (var key in this.drops)
                if (this.drops[key].other) this.drops[key].area = null;
            ig.vars.registerVarAccessor("drops", this, "VarDropEditor");
            ig.vars.registerVarAccessor("misc", this, "VarMiscEditor");
            ig.storage.register(this)
        },

        onVarAccess: function (accessType, args) {
            if (args[0] == "drops")
                switch (args[1]) {
                    case "totalProgress":
                        return this.getTotalDropsFoundAndCompleted(true)
                }
            else if (args[0] == "misc")
                switch (args[1]) {
                    case "time":
                        var now = new Date,
                            hours = now.getHours();
                        return hours >= 11 && hours <= 13 ? "It's High Noon" : now.getHours() + ":" + now.getMinutes();
                    case "words":
                        return args[2] ? ig.vars.get("lea.words." + (args[2] + "").toLowerCase()) : false;
                    case "localNum":
                        return args[2] ? addThousandsSeparator(args[2]) : "";
                    case "localNumTempVar":
                        return args[2] ? addThousandsSeparator(Math.round(parseInt(ig.vars.get("tmp." + args[2])))) : "";
                    case "formatTimeVar":
                        if (args[2]) {
                            now = ig.vars.get("tmp." + args[2]);
                            return padToDigits(Math.min(Math.floor(now / 60) % 60, 99), 2) + ":" + padToDigits(Math.min(Math.floor(now) % 60, 99), 2) + "." + padToDigits(Math.min(Math.floor(now * 100) % 100, 99), 2)
                        }
                }
        },

        dev_UnlockDrop: function (count) {
            var unlocked = 0,
                key;
            for (key in this.drops)
                if (!this.dropCounts[key] || !this.dropCounts[key].completed) {
                    for (var i = 0; i <= 100; i++) this.incrementDropCount(key, "Autumn-Ground-1");
                    unlocked++;
                    if (unlocked >= count) break
                }
        },

        incrementDropCount: function (key, anim) {
            if (this.drops[key]) {
                if (this.drops[key].link) {
                    key = this.drops[key].link || "";
                    if (!this.drops[key]) return
                }
                if (this.drops[key].track) {
                    var drop = this.dropCounts[key];
                    if (!drop) {
                        drop = {
                            anim: anim,
                            count: 0,
                            time: (new Date).getTime(),
                            completed: false
                        };
                        sc.stats.setMap("exploration", "dropFound-" + key, 1);
                        sc.stats.addMap("exploration", "dropsTotal", 1);
                        this.dropCounts[key] = drop
                    }
                    if (!drop.completed) {
                        drop.count++;
                        if (!drop.completed && drop.count >= (this.drops[key].progress || 50)) {
                            drop.completed = true;
                            drop.count = this.drops[key].progress || 50;
                            sc.stats.addMap("exploration", "dropsCompleted", 1);
                            sc.stats.setMap("exploration", "dropsCompletionRate", this.getTotalDropsFoundAndCompleted(true));
                            if (sc.model.player.hasItem(285)) {
                                sc.Model.notifyObserver(this, sc.MENU_EVENT.DROP_COMPLETED, key);
                                this.addLog({
                                    type: "DROP",
                                    drop: key
                                })
                            }
                        }
                    }
                }
            }
        },

        getFoundDrops: function (area, sortType) {
            var drops = [],
                key;
            for (key in this.dropCounts) {
                var drop = this.drops[key];
                if (area) {
                    if (area == "other") {
                        if (drop.other) drops.push(key)
                    } else if (drop.area == area) drops.push(key)
                } else drops.push(key)
            }
            if (sortType != void 0) this.sortDropList(drops, sortType);
            return drops
        },

        sortDropList: function (drops, sortType) {
            switch (sortType) {
                case sc.BOTANICS_SORT_TYPE.FOUND:
                    drops.sort(function (a, b) {
                        return (this.dropCounts[b].time || 0) - (this.dropCounts[a].time || 0)
                    }.bind(this));
                    break;
                case sc.BOTANICS_SORT_TYPE.ORDER:
                    drops.sort(function (a, b) {
                        return (this.drops[a].order || 0) - (this.drops[b].order || 0)
                    }.bind(this));
                    break;
                case sc.BOTANICS_SORT_TYPE.NAME:
                    drops.sort(function (a, b) {
                        var nameA = ig.LangLabel.getText(this.drops[a].name),
                            nameB = ig.LangLabel.getText(this.drops[b].name);
                        return nameA.localeCompare(nameB)
                    }.bind(this))
            }
        },

        getDropCount: function (key) {
            return this.dropCounts[key].count
        },

        hasAnyDropFound: function () {
            if (sc.map.hasAnyAreaUnlocked())
                for (var key in this.dropCounts) return true;
            return false
        },

        hasAnyDropInArea: function (area) {
            for (var key in this.drops)
                if (this.drops[key].area == area) return true
        },

        hasDropInArea: function (area) {
            for (var key in this.dropCounts)
                if (this.drops[key].area == area) return true
        },

        hasAnyOtherDropFound: function () {
            for (var key in this.dropCounts)
                if (this.drops[key].other) return true
        },

        getTotalDropsFoundAndCompleted: function (asRate) {
            var completed = 0,
                total = 0,
                key;
            for (key in this.drops) {
                var drop = this.drops[key];
                if (drop.track && !drop.extension) {
                    if (sc.stats.getMap("exploration", "dropFound-" + key) && this.dropCounts[key] && this.dropCounts[key].completed) completed++;
                    total++
                }
            }
            return asRate ? completed / total : completed
        },

        getFoundDrop: function (key) {
            return this.dropCounts[key]
        },

        getDropName: function (key) {
            return !this.drops[key] ? "???" : ig.LangLabel.getText(this.drops[key].name)
        },

        getDropArea: function (key) {
            return !this.drops[key] ? "???" : sc.map.getAreaName(this.drops[key].area)
        },

        setStatusPage: function (page) {
            var prevPage = this.statusPage;
            this.statusPage = page || sc.MENU_STATUS_PAGES.MAIN;
            sc.Model.notifyObserver(this, sc.MENU_EVENT.STATUS_SET_PAGE, prevPage)
        },

        setStatusElement: function (element) {
            var prevElement = this.statusElement;
            this.statusElement = element || sc.ELEMENT.NEUTRAL;
            sc.Model.notifyObserver(this, sc.MENU_EVENT.STATUS_SET_ELEMENT, prevElement)
        },

        fireStatusPageEvent: function () {
            sc.Model.notifyObserver(this, sc.MENU_EVENT.STATUS_SET_PAGE, this.statusPage)
        },

        addLog: function (log) {
            if (sc.LOG_TYPES[log.type] != void 0) {
                this.logEntries.push(log);
                sc.stats.addMap("player", "logs", 1);
                if (this.logEntries.length > 50) this.logEntries.shift()
            }
        },

        onReset: function () {
            this.newUnlocks = {};
            this.logEntries.length = 0;
            this.mapStamps = {};
            this.questsSeen = {};
            this.dropCounts = {}
        },

        varsChangedOrder: 1E3,

        onVarsChanged: function () {
            var isGamepad = ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD;
            if (this.gamepadIcons != isGamepad) {
                this.gamepadIcons = isGamepad;
                this.updateHotkeys(true)
            }
        },

        onPostUpdate: function () {
            if (window.IG_GAME_DEBUG && this.startMenuFromWarmUp && !this.startUpStarted)
                if (this.startUpTimer > 0) this.startUpTimer = this.startUpTimer - ig.system.tick;
                else this.enterStartUpMenu()
        },

        onLevelLoadStart: function () {
            this.startMenuFromWarmUp = false
        },

        onLevelLoaded: function () {
            if (window.MENU_ON_GAME_START && window.IG_GAME_DEBUG) {
                this.startMenuFromWarmUp = true;
                this.startUpTimer = 0.2
            }
        },

        enterStartUpMenu: function () {
            if (this.startMenuFromWarmUp && !this.startUpStarted) {
                this.setDirectMode(true, sc.MENU_SUBMENU[window.MENU_ON_GAME_START]);
                window.MENU_ON_GAME_START = null;
                this.startUpStarted = true;
                sc.model.enterMenu()
            }
        },

        addNewUnlock: function (key, value) {
            if (!this.newUnlocks[key]) this.newUnlocks[key] = [];
            this.newUnlocks[key].push(value)
        },

        hasNewUnlock: function (key) {
            return this.newUnlocks[key] && this.newUnlocks[key].length > 0
        },

        hasNewUnlockKey: function (key, value) {
            return this.newUnlocks[key] && this.newUnlocks[key].indexOf(value) != -1
        },

        clearNewUnlock: function (key, value) {
            if (this.newUnlocks[key]) {
                if (value) this.newUnlocks[key].erase(value);
                else delete this.newUnlocks[key]
            }
        },

        onStorageSave: function (saveData) {
            saveData.menuNewEntries = ig.copy(this.newUnlocks);
            saveData.logs = ig.copy(this.logEntries);
            saveData.drops = ig.copy(this.dropCounts);
            saveData.stamps = ig.copy(this.mapStamps);
            saveData.questsSeen = ig.copy(this.questsSeen)
        },

        onStoragePreLoad: function (saveData) {
            this.newUnlocks = saveData.menuNewEntries || {};
            this.logEntries = saveData.logs || [];
            this.dropCounts = saveData.drops || {};
            this.mapStamps = saveData.stamps || {};
            this.questsSeen = saveData.questsSeen || {};
            this.onPreLoadDrops()
        },

        onPreLoadDrops: function () {
            var completed = 0,
                total = 0,
                key;
            for (key in this.drops)
                if (this.dropCounts[key]) {
                    var drop = this.drops[key],
                        tracked = this.dropCounts[key];
                    if (drop.progress < tracked.count && tracked.completed) {
                        tracked.count = drop.progress || 50;
                        completed++
                    } else if (drop.progress < tracked.count) {
                        tracked.count = drop.progress || 50;
                        tracked.completed = true;
                        completed++;
                        sc.Model.notifyObserver(this, sc.MENU_EVENT.DROP_COMPLETED, key);
                        this.addLog({
                            type: "DROP",
                            drop: key
                        })
                    } else if (drop.progress > tracked.count && tracked.completed) {
                        tracked.count = drop.progress;
                        completed++
                    } else if (drop.progress <= tracked.count) completed++;
                    sc.stats.setMap("exploration", "dropFound-" + key, 1);
                    var globalSetting = ig.globalSettings.getGlobalSetting("ENTITY", "ItemDestruct", key);
                    if (globalSetting && globalSetting.desType != tracked.anim) tracked.anim = globalSetting.desType;
                    total++
                }
            sc.stats.setMap("exploration", "dropsTotal", total);
            sc.stats.setMap("exploration", "dropsCompleted", completed);
            sc.stats.setMap("exploration", "dropsCompletionRate", this.getTotalDropsFoundAndCompleted(true))
        },

        onNewGameApply: function (saveData) {
            this.dropCounts = saveData.drops || {};
            this.onPreLoadDrops()
        },

        addMapStamp: function (area, key, x, y, level) {
            if (!this.mapStamps[area]) this.mapStamps[area] = [];
            for (var i = 0; i < sc.MAP_STAMPS_MAX; i++)
                if (!this.mapStamps[area][i]) {
                    this.mapStamps[area][i] = {
                        key: key,
                        x: x,
                        y: y,
                        level: level,
                        index: i
                    };
                    return i
                }
            return -1
        },

        editStamp: function (index, area, key) {
            if (this.mapStamps[area]) {
                if (this.mapStamps[area][index]) this.mapStamps[area][index].key = key;
                sc.Model.notifyObserver(this, sc.MENU_EVENT.MAP_UPDATE_STAMP)
            }
        },

        removeStamp: function (area, index) {
            if (this.mapStamps[area] && this.mapStamps[area][index]) this.mapStamps[area][index] = null
        },

        getStamps: function (area) {
            if (!this.mapStamps[area]) this.mapStamps[area] = [];
            return this.mapStamps[area]
        },

        getStampCount: function (area) {
            if (!this.mapStamps[area]) this.mapStamps[area] = [];
            for (var count = 0, stamps = this.mapStamps[area].length; stamps--;)
                if (this.mapStamps[area][stamps]) count++;
            return count
        },

        fullyEntered: function () {
            sc.Model.notifyObserver(this, sc.MENU_EVENT.FULL_MENU_ENTER)
        },

        addHotkey: function (callback, notify) {
            this.hotkeysCallbacks.push(callback);
            if (notify) sc.Model.notifyObserver(this, sc.MENU_EVENT.TOP_BAR_CHANGED)
        },

        commitHotkeys: function (params) {
            sc.Model.notifyObserver(this, sc.MENU_EVENT.TOP_BAR_CHANGED, params)
        },

        updateHotkeys: function (params) {
            sc.Model.notifyObserver(this, sc.MENU_EVENT.TOP_BAR_UPDATE, params)
        },

        removeHotkeys: function () {
            this.hotkeysCallbacks = [];
            sc.Model.notifyObserver(this, sc.MENU_EVENT.REMOVE_HOTKEYS)
        },

        pushBackCallback: function (callback) {
            if (callback) {
                this.backCallbackStack.push(callback);
                this.currentBackCallback = callback
            }
        },

        popBackCallback: function () {
            this.backCallbackStack.pop();
            this.currentBackCallback = this.backCallbackStack.length > 0 ? this.backCallbackStack[this.backCallbackStack.length - 1] : null
        },

        invokeTopBackButton: function () {
            if (this.currentBackCallback) this.currentBackCallback()
        },

        pushMenu: function (menu) {
            if (menu) {
                this.menuStack.push(menu);
                this.previousMenu = this.currentMenu;
                this.currentMenu = menu;
                this.hotkeysCallbacks = [];
                this.setInfoText("", true);
                sc.Model.notifyObserver(this, sc.MENU_EVENT.ENTER_MENU)
            }
        },

        popMenu: function () {
            if (!(this.menuStack.length <= 0)) {
                this.previousMenu = this.menuStack.pop();
                this.currentMenu = this.menuStack.length > 0 ? this.menuStack[this.menuStack.length - 1] : this.directMode ? this.directMenu : sc.MENU_SUBMENU.START;
                this.setInfoText("", true);
                this.hotkeysCallbacks = [];
                sc.Model.notifyObserver(this, sc.MENU_EVENT.LEAVE_MENU)
            }
        },

        enterMenu: function () {
            ig.interact.addEntry(this.buttonInteract);
            this.menuEntered = true
        },

        setDirectMode: function (enabled, menu) {
            this.directMode = enabled || false;
            this.directMenu = menu || sc.MENU_SUBMENU.START
        },

        setHost: function (host) {
            this.menuHost = host || 0
        },

        exitMenu: function () {
            if (this.menuEntered) {
                this.menuEntered = false;
                sc.commonEvents.triggerEvent("MENU_LEAVE", {})
            }
            this.menuStack = [];
            this.backCallbackStack = [];
            this.buffText = this.infoText = this.currentBackCallback = null;
            this.buffID = -1;
            this.currentMenu = sc.MENU_SUBMENU.START;
            this.previousBodyPart = this.previousMenu = null;
            this.currentBodyPart = sc.MENU_EQUIP_BODYPART.NONE;
            this.menuHost = 0;
            this.previousSkillTree = this.currentSkillTree = -1;
            this.skillState = sc.MENU_SKILL_STATE.OVERVIEW;
            this.skillDrag = false;
            this.currentSkillFocus = null;
            this.skillSwapCursor.x = 0;
            this.skillSwapCursor.y = 0;
            this.skillSwapMoved = false;
            this.skillSwapFocus = null;
            this.newGameViewMode = false;
            this.itemCurrentTab = -1;
            this.itemLastButtonData = null;
            this.optionCurrentTab = 0;
            this.optionLastButtonData = null;
            this.questCurrentTab = 0;
            this.questInfo = this.questLastButtonData = null;
            this.questDetailMode = false;
            this.shopID = null;
            this.shopState = sc.MENU_SHOP_STATE.START;
            this.shopPage = 0;
            this.shopCart.length = 0;
            this.tradeToggle = this.shopCoinMode = this.shopSellMode = false;
            this.statusPage = sc.MENU_STATUS_PAGES.MAIN;
            this.statusElement = 0;
            this.statusDiff = false;
            sc.map.restore();
            this.mapMouseOverFloorButtons = this.mapFirstVisit = this.mapWasDragged = this.mapDrag = false;
            this.mapCursor.x = this.mapCursor.y = this.mapLastCursor.x = this.mapLastCursor.y = 0;
            this.mapWorldCursor.x = this.mapWorldCursor.y = this.mapWorldLastCursor.x = this.mapWorldLastCursor.y = 0;
            this.mapWorldmapActive = this.mapWmCursorMoved = this.mapCursorMoved = false;
            this.mapMapFocus = this.mapAreaFocus = null;
            this.mapLoading = this.mapWorldFirstVisit = false;
            this.mapAreaOffset.x = this.mapAreaOffset.y = 0;
            this.loadClearFilesOnly = this.loadMode = this.mapStampMenu = false;
            this.loreCurrentTab = 0;
            this.questHubID = this.synopInfo = null;
            this.helpMenuOpen = false;
            this.hotkeysCallbacks = [];
            ig.interact.removeEntry(this.buttonInteract);
            sc.Model.notifyObserver(this, sc.MENU_EVENT.EXIT_MENU);
            if (this.exitCallback) {
                var callback = this.exitCallback;
                this.exitCallback = null;
                callback()
            }
        },

        invokePostExit: function () {
            sc.Model.notifyObserver(this, sc.MENU_EVENT.POST_EXIT)
        },

        setInfoText: function (text, skipSounds) {
            this.infoText = text;
            sc.Model.notifyObserver(this, sc.MENU_EVENT.INFO_TEXT_CHANGED, skipSounds)
        },

        setBuffText: function (text, params, id) {
            this.buffText = text;
            this.buffID = id || -1;
            sc.Model.notifyObserver(this, sc.MENU_EVENT.SET_BUFF_INFO, params)
        },

        moveLeaSprite: function (x, y, state, skip) {
            this.leaState = state || sc.MENU_LEA_STATE.LARGE;
            sc.Model.notifyObserver(this, sc.MENU_EVENT.LEA_STATE_CHANGED, {
                x: x || 0,
                y: y || 0,
                skip: skip
            })
        },

        enterTradeDetails: function () {
            this.tradeToggle = true;
            sc.Model.notifyObserver(this, sc.MENU_EVENT.TRADE_TOGGLE_DETAILS)
        },

        exitTradeDetails: function () {
            this.tradeToggle = false;
            sc.Model.notifyObserver(this, sc.MENU_EVENT.TRADE_TOGGLE_DETAILS)
        },

        setShopState: function (state) {
            if (this.shopState != state) {
                var prevState = this.shopState;
                this.shopState = state || sc.MENU_SHOP_STATE.START;
                sc.Model.notifyObserver(this, sc.MENU_EVENT.SHOP_STATE_CHANGED, prevState)
            }
        },

        setShopPage: function (page) {
            if (this.shopPage != page) {
                var prevPage = this.shopPage;
                this.shopPage = page || 0;
                sc.Model.notifyObserver(this, sc.MENU_EVENT.SHOP_PAGE_CHANGED, prevPage)
            }
        },

        updateCart: function (id, amount, price) {
            for (var i = this.shopCart.length; i--;) {
                var entry = this.shopCart[i];
                if (entry.id == id && entry.price == price) {
                    entry.amount = amount;
                    if (entry.amount <= 0) this.shopCart.splice(i, 1);
                    i = -10;
                    break
                }
            }
            if (i != -10 && amount > 0) this.shopCart.push({
                id: id,
                amount: amount,
                price: price
            });
            sc.Model.notifyObserver(this, sc.MENU_EVENT.SHOP_CART_CHANGED)
        },

        getTotalCost: function (id, price) {
            for (var total = 0, i = this.shopCart.length; i--;) {
                var entry = this.shopCart[i];
                if (!(id == entry.id && price == entry.price)) total = total + entry.price * entry.amount
            }
            return total
        },

        getItemQuantity: function (id, price) {
            for (var i = this.shopCart.length; i--;) {
                var entry = this.shopCart[i];
                if (entry.id == id && entry.price == price) return entry.amount
            }
            return 0
        },

        openShopQuantitySelect: function (params) {
            sc.Model.notifyObserver(this, sc.MENU_EVENT.SHOP_OPEN_QUANTITY, params)
        },

        openCheckout: function () {
            sc.Model.notifyObserver(this, sc.MENU_EVENT.SHOP_OPEN_CHECKOUT)
        },

        updateTotalCost: function (id, amount, price) {
            var total = this.getTotalCost(id, price);
            if (id && (amount != void 0 && price)) total = total + (amount || 0) * price;
            sc.Model.notifyObserver(this, sc.MENU_EVENT.SHOP_CART_CHANGED, total)
        },

        newSlot: function () {
            sc.stats.addMap("player", "saves", 1);
            ig.storage.save(ig.storage.slots.length);
            sc.Model.notifyObserver(this, sc.MENU_EVENT.SAVE_NEW_SLOT)
        },

        saveSlot: function (slot) {
            ig.storage.save(slot);
            sc.Model.notifyObserver(this, sc.MENU_EVENT.SAVE_UPDATE_SLOT, slot)
        },

        deleteSlot: function (slot) {
            ig.storage.deleteSlot(slot);
            sc.Model.notifyObserver(this, sc.MENU_EVENT.SAVE_DELETE_SLOT, slot)
        },

        loadSlot: function (slot) {
            this.loadSlotID = slot
        },

        setItemInfo: function (params) {
            sc.Model.notifyObserver(this, sc.MENU_EVENT.ITEM_INFO_CHANGED, params)
        },

        resetItemInfo: function () {
            sc.Model.notifyObserver(this, sc.MENU_EVENT.ITEM_RESET_INFO)
        },

        setItemTab: function (tab) {
            tab = tab || 0;
            if (tab != this.itemCurrentTab) {
                var prevTab = this.itemCurrentTab;
                this.itemCurrentTab = tab;
                sc.Model.notifyObserver(this, sc.MENU_EVENT.ITEM_CHANGED_TAB, prevTab)
            }
        },

        getCurrentTabType: function () {
            switch (this.itemCurrentTab) {
                case 0:
                    return "NEW";
                case 1:
                    return sc.ITEMS_TYPES.CONS;
                case 2:
                case 3:
                case 4:
                case 5:
                    return sc.ITEMS_TYPES.EQUIP;
                case 6:
                    return sc.ITEMS_TYPES.TRADE;
                case 7:
                    return sc.ITEMS_TYPES.KEY;
                case 8:
                    return sc.ITEMS_TYPES.TOGGLE
            }
            return null
        },

        getCurrentTabSubType: function () {
            switch (this.itemCurrentTab) {
                case 2:
                    return sc.ITEMS_EQUIP_TYPES.ARM;
                case 3:
                    return sc.ITEMS_EQUIP_TYPES.HEAD;
                case 4:
                    return sc.ITEMS_EQUIP_TYPES.TORSO;
                case 5:
                    return sc.ITEMS_EQUIP_TYPES.FEET
            }
            return null
        },

        isItemEquipTab: function () {
            return this.itemCurrentTab >= 2 && this.itemCurrentTab <= 5
        },

        sortList: function (sortType) {
            sc.Model.notifyObserver(this, sc.MENU_EVENT.SORT_LIST, sortType)
        },

        setOptionTab: function (tab) {
            tab = tab || 0;
            if (tab != this.optionCurrentTab) {
                this.optionCurrentTab = tab;
                sc.Model.notifyObserver(this, sc.MENU_EVENT.OPTION_CHANGED_TAB)
            }
        },

        getCurrentOptionCategory: function () {
            for (var category in sc.OPTION_CATEGORY)
                if (sc.OPTION_CATEGORY[category] == this.itemCurrentTab) return this.itemCurrentTab;
            return null
        },

        openLanguagePopUp: function (params) {
            sc.Model.notifyObserver(this, sc.MENU_EVENT.OPTION_LANG_POP_UP, params)
        },

        setSynoTab: function () {
            sc.Model.notifyObserver(this, sc.MENU_EVENT.SYNO_CHANGED_TAB)
        },

        setSynopInfo: function (info, params) {
            this.synopInfo = info;
            sc.Model.notifyObserver(this, sc.MENU_EVENT.SYNOP_SET_INFO, params)
        },

        setSynopFocus: function (params) {
            sc.Model.notifyObserver(this, sc.MENU_EVENT.SYNOP_FOCUS, params)
        },

        switchSynopsisPage: function (params) {
            sc.Model.notifyObserver(this, sc.MENU_EVENT.SYNOP_SWITCH_PAGE, params)
        },

        setSynopPressed: function (params) {
            sc.Model.notifyObserver(this, sc.MENU_EVENT.SYNOP_BUTTON_PRESS, params)
        },

        setQuestTab: function (tab) {
            tab = tab || 0;
            if (tab != this.questCurrentTab) {
                var prevTab = this.questCurrentTab;
                this.questCurrentTab = tab;
                sc.Model.notifyObserver(this, sc.MENU_EVENT.QUEST_CHANGED_TAB, prevTab)
            }
        },

        setQuestInfo: function (info, params) {
            this.questInfo = info;
            sc.Model.notifyObserver(this, sc.MENU_EVENT.QUEST_SET_INFO, params)
        },

        enterQuestDetails: function (params) {
            this.questDetailMode = true;
            sc.Model.notifyObserver(this, sc.MENU_EVENT.QUEST_ENTER_DEAILS, params)
        },

        leaveQuestDetails: function () {
            this.questDetailMode = false;
            sc.Model.notifyObserver(this, sc.MENU_EVENT.QUEST_LEAVE_DEAILS)
        },

        selectBodyPart: function (bodyPart) {
            this.previousBodyPart = this.currentBodyPart;
            this.currentBodyPart = bodyPart || sc.MENU_EQUIP_BODYPART.NONE;
            sc.Model.notifyObserver(this, sc.MENU_EVENT.SELECTED_BODYPART)
        },

        cycleBodyPartRight: function () {
            var bodyPart = this.currentBodyPart + 1;
            if (bodyPart > 5) bodyPart = sc.MENU_EQUIP_BODYPART.HEAD;
            this.selectBodyPart(bodyPart)
        },

        cycleBodyPartLeft: function () {
            var bodyPart = this.currentBodyPart - 1;
            if (bodyPart < 1) bodyPart = sc.MENU_EQUIP_BODYPART.FEET;
            this.selectBodyPart(bodyPart)
        },

        changeEquipOnCurrentBodypart: function (params) {
            sc.Model.notifyObserver(this, sc.MENU_EVENT.EQUIP_CHANGED, params)
        },

        ensureCurrentValues: function () {
            sc.Model.notifyObserver(this, sc.MENU_EVENT.EQUIP_ENSURE_CURRENT_VALUES)
        },

        exitEquipMenu: function () {
            this.previousBodyPart = null;
            this.currentBodyPart = sc.MENU_EQUIP_BODYPART.NONE
        },

        showSkillEffect: function (gui, isSwitch, delay) {
            sc.Model.notifyObserver(this, sc.MENU_EVENT.SKILL_SHOW_EFFECT, {
                gui: gui,
                isSwitch: isSwitch,
                delay: delay
            })
        },

        showSwapSkillEffect: function (params) {
            sc.Model.notifyObserver(this, sc.MENU_EVENT.SKILL_SHOW_EFFECT_SWAP, params)
        },

        selectSkillTree: function (tree) {
            if (tree != this.currentSkillTree) {
                this.previousSkillTree = this.currentSkillTree;
                this.currentSkillTree = tree != void 0 ? tree : -1;
                if (this.currentSkillTree != -1) {
                    this.skillState = sc.MENU_SKILL_STATE.DETAIL_VIEW;
                    this.currentSkillFocus = null;
                    this.skillWasDragged = false
                } else {
                    this.skillState = sc.MENU_SKILL_STATE.OVERVIEW;
                    this.skillWasDragged = false;
                    this.lastSkillCursor.x = this.skillCursor.x;
                    this.lastSkillCursor.y = this.skillCursor.y;
                    this.skillCursor.x = 0;
                    this.skillCursor.y = 0;
                    this.currentSkillFocus = null
                }
                sc.Model.notifyObserver(this, sc.MENU_EVENT.SKILL_TREE_SELECT)
            }
        },

        focusCursorOnNode: function (x, y, node) {
            if (this.currentSkillFocus == node) {
                if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                    this.skillCursor.x = x;
                    this.skillCursor.y = y;
                    sc.Model.notifyObserver(this, sc.MENU_EVENT.SKILL_ENSURE_GAMEPAD_FOCUS)
                }
            } else {
                this.skillWasDragged = false;
                this.skillRecoverPos.x = this.skillCursor.x;
                this.skillRecoverPos.y = this.skillCursor.y;
                this.skillCursor.x = x;
                this.skillCursor.y = y;
                this.currentSkillFocus = node;
                this.skillState = sc.MENU_SKILL_STATE.NODE_SELECT;
                sc.Model.notifyObserver(this, sc.MENU_EVENT.SKILL_CURSOR_FOCUS_NODE, this.currentSkillFocus.skill)
            }
        },

        unfocusCursor: function (node) {
            if (this.currentSkillFocus == node) {
                this.currentSkillFocus = null;
                this.skillState = sc.MENU_SKILL_STATE.DETAIL_VIEW;
                sc.Model.notifyObserver(this, sc.MENU_EVENT.SKILL_CURSOR_UNFOCUS_NODE)
            }
        },

        unfocusSwapCursor: function (node) {
            if (this.skillSwapFocus == node) {
                this.skillSwapFocus = null;
                sc.Model.notifyObserver(this, sc.MENU_EVENT.SKILL_SWAP_UNFOCUS)
            }
        },

        focusSwapCursor: function (x, y, node) {
            if (this.skillSwapFocus == node) {
                if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                    this.skillSwapCursor.x = x;
                    this.skillSwapCursor.y = y;
                    sc.Model.notifyObserver(this, sc.MENU_EVENT.SKILL_SWAP_ENSURE)
                }
            } else {
                this.skillSwapMoved = false;
                this.skillSwapCursor.x = x;
                this.skillSwapCursor.y = y;
                this.skillSwapFocus = node;
                sc.Model.notifyObserver(this, sc.MENU_EVENT.SKILL_SWAP_FOCUS)
            }
        },

        resetSwapCursor: function () {
            this.skillSwapMoved = false;
            if (this.skillSwapFocus) this.skillSwapFocus.focus = false;
            this.skillSwapFocus = null
        },

        centerOnNode: function (node, params) {
            if (node) {
                var camY = -this.skillCursor.y + ig.system.height / 2;
                this.skillCamera.x = -this.skillCursor.x + ig.system.width / 2;
                this.skillCamera.y = camY;
                this.skillState = sc.MENU_SKILL_STATE.NODE_MENU;
                sc.Model.notifyObserver(this, sc.MENU_EVENT.SKILL_NODE_SELECT, params)
            }
        },

        centerOnNodeCam: function (node, pos, time, callback) {
            if (node) {
                var camY = -pos.y + ig.system.height / 2;
                this.skillCamera.x = -pos.x + ig.system.width / 2;
                this.skillCamera.y = camY;
                sc.Model.notifyObserver(this, sc.MENU_EVENT.CIRCUIT_FOCUS_CAM, {
                    callback: callback,
                    time: time || 0.2
                })
            }
        },

        exitNodeMenu: function (state) {
            this.skillState = state || sc.MENU_SKILL_STATE.DETAIL_VIEW;
            sc.Model.notifyObserver(this, sc.MENU_EVENT.SKILL_NODE_EXIT)
        },

        enterSwapBranches: function (origin) {
            this.skillStateOrigin = origin || sc.MENU_SKILL_STATE.OVERVIEW;
            this.skillState = sc.MENU_SKILL_STATE.SWAP_BRANCHES;
            sc.Model.notifyObserver(this, sc.MENU_EVENT.SKILL_ENTER_SWAP_BRANCHES)
        },

        leaveSwapBranches: function () {
            this.skillSwapFocus = null;
            this.skillState = sc.MENU_SKILL_STATE.OVERVIEW;
            sc.Model.notifyObserver(this, sc.MENU_EVENT.SKILL_LEAVE_SWAP_BRANCHES)
        },

        toggledInputMode: function () {
            sc.Model.notifyObserver(this, sc.MENU_EVENT.SKILL_TOGGLED_INPUT_MODE)
        },

        selectFloor: function (floor) {
            sc.map.currentFloor = floor || 0;
            sc.Model.notifyObserver(this, sc.MENU_EVENT.MAP_CHANGED_FLOOR)
        },

        enterWorldMap: function () {
            if (this.mapMapFocus && this.mapMapFocus.focus) this.mapMapFocus.focus = false;
            this.mapMapFocus = null;
            this.mapDrag = false;
            this.mapWorldmapActive = true;
            sc.Model.notifyObserver(this, sc.MENU_EVENT.MAP_WORLDMAP_STATE, this.mapWorldmapActive)
        },

        exitWorldMap: function () {
            this.mapWorldmapActive = false;
            sc.Model.notifyObserver(this, sc.MENU_EVENT.MAP_WORLDMAP_STATE, this.mapWorldmapActive)
        },

        focusArea: function (x, y, area, params) {
            if (this.mapAreaFocus == area) {
                if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                    this.mapWorldCursor.x = x;
                    this.mapWorldCursor.y = y;
                    sc.Model.notifyObserver(this, sc.MENU_EVENT.MAP_ENSURE_FOCUS, true)
                }
            } else {
                this.mapWorldCursor.x = x;
                this.mapWorldCursor.y = y;
                if (this.mapAreaFocus && this.mapAreaFocus.focus) this.mapAreaFocus.focus = false;
                if ((this.mapAreaFocus = area) && !this.mapAreaFocus.focus) this.mapAreaFocus.focus = true;
                sc.Model.notifyObserver(this, sc.MENU_EVENT.MAP_FOCUS_AREA, params)
            }
        },

        focusMap: function (x, y, map, params) {
            if (this.mapMapFocus == map) {
                if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                    this.mapCursor.x = x;
                    this.mapCursor.y = y;
                    sc.Model.notifyObserver(this, sc.MENU_EVENT.MAP_ENSURE_FOCUS)
                }
            } else {
                this.mapWasDragged = false;
                this.mapCursor.x = x;
                this.mapCursor.y = y;
                if (this.mapMapFocus && this.mapMapFocus.focus) this.mapMapFocus.focus = false;
                if (this.mapMapFocus = map) this.mapMapFocus.focus = true;
                sc.Model.notifyObserver(this, sc.MENU_EVENT.MAP_FOCUS_MAP, params)
            }
        },

        unfocusArea: function (area) {
            if (this.mapAreaFocus == area) {
                if (this.mapAreaFocus) this.mapAreaFocus.focus = false;
                this.mapAreaFocus = null;
                sc.Model.notifyObserver(this, sc.MENU_EVENT.MAP_UNFOCUS, true)
            }
        },

        unfocusMap: function (map) {
            if (this.mapMapFocus == map) {
                if (this.mapMapFocus) this.mapMapFocus.focus = false;
                this.mapMapFocus = null;
                sc.Model.notifyObserver(this, sc.MENU_EVENT.MAP_UNFOCUS, false)
            }
        },

        resetWorldmapCursor: function () {
            this.mapWmCursorMoved = false;
            if (this.mapAreaFocus) this.mapAreaFocus.focus = false;
            this.mapAreaFocus = null
        },

        loadArea: function (areaPath) {
            if (areaPath == sc.map.currentArea.path) this.exitWorldMap();
            else {
                this.mapLoading = true;
                this.mapWorldmapActive = false;
                sc.Model.notifyObserver(this, sc.MENU_EVENT.MAP_AREA_LOAD, areaPath)
            }
        },

        setAreaLoadDone: function (params) {
            this.mapLoading = false;
            sc.Model.notifyObserver(this, sc.MENU_EVENT.MAP_AREA_LOAD_DONE, params)
        },

        openStampMenu: function (params) {
            sc.Model.notifyObserver(this, sc.MENU_EVENT.MAP_OPEN_STAMPS, params)
        },

        getCurrentMenuAsName: function () {
            return this.getMenuAsName(this.currentMenu)
        },

        getMenuAsName: function (menu) {
            return ig.lang.get("sc.gui.menu.menu-titles." + ((this.loadMode || this.arenaCustomMode || this.shopCoinMode) && sc.SUB_MENU_INFO[menu].alt ? sc.SUB_MENU_INFO[menu].alt : sc.SUB_MENU_INFO[menu].name))
        },

        isStart: function () {
            return this.currentMenu == sc.MENU_SUBMENU.START
        },

        isSkills: function () {
            return this.currentMenu == sc.MENU_SUBMENU.SKILLS
        },

        isEquipment: function () {
            return this.currentMenu == sc.MENU_SUBMENU.EQUIPMENT
        },

        isStatus: function () {
            return this.currentMenu == sc.MENU_SUBMENU.STATUS
        },

        isSynopsis: function () {
            return this.currentMenu == sc.MENU_SUBMENU.SYNOPSIS
        },

        isMap: function () {
            return this.currentMenu == sc.MENU_SUBMENU.MAP
        },

        isSave: function () {
            return this.currentMenu == sc.MENU_SUBMENU.SAVE
        },

        isOptions: function () {
            return this.currentMenu == sc.MENU_SUBMENU.OPTIONS
        },

        isShop: function () {
            return this.currentMenu == sc.MENU_SUBMENU.SHOP
        },

        isButtonInteractActive: function () {
            return this.buttonInteract.isActive()
        }
    });

    sc.MENU_EVENT = {};
    sc.MENU_EVENT.INFO_TEXT_CHANGED = 0;
    sc.MENU_EVENT.TOP_BAR_CHANGED = 1;
    sc.MENU_EVENT.TOP_BAR_UPDATE = 2;
    sc.MENU_EVENT.ENTER_MENU = 3;
    sc.MENU_EVENT.LEAVE_MENU = 4;
    sc.MENU_EVENT.EXIT_MENU = 5;
    sc.MENU_EVENT.LEA_STATE_CHANGED = 6;
    sc.MENU_EVENT.ITEM_INFO_CHANGED = 7;
    sc.MENU_EVENT.SELECTED_BODYPART = 8;
    sc.MENU_EVENT.EQUIP_CHANGED = 9;
    sc.MENU_EVENT.SKILL_TREE_SELECT = 10;
    sc.MENU_EVENT.SKILL_CURSOR_FOCUS_NODE = 11;
    sc.MENU_EVENT.SKILL_CURSOR_UNFOCUS_NODE = 12;
    sc.MENU_EVENT.SKILL_NODE_SELECT = 13;
    sc.MENU_EVENT.SKILL_NODE_EXIT = 14;
    sc.MENU_EVENT.SKILL_ENTER_SWAP_BRANCHES = 15;
    sc.MENU_EVENT.SKILL_LEAVE_SWAP_BRANCHES = 16;
    sc.MENU_EVENT.SKILL_TOGGLED_INPUT_MODE = 17;
    sc.MENU_EVENT.SKILL_ENSURE_GAMEPAD_FOCUS = 18;
    sc.MENU_EVENT.ITEM_CHANGED_TAB = 19;
    sc.MENU_EVENT.MAP_CHANGED_FLOOR = 20;
    sc.MENU_EVENT.OPTION_CHANGED_TAB = 21;
    sc.MENU_EVENT.SORT_LIST = 22;
    sc.MENU_EVENT.ITEM_RESET_INFO = 23;
    sc.MENU_EVENT.SET_BUFF_INFO = 24;
    sc.MENU_EVENT.QUEST_CHANGED_TAB = 25;
    sc.MENU_EVENT.QUEST_SET_INFO = 26;
    sc.MENU_EVENT.QUEST_ENTER_DEAILS = 27;
    sc.MENU_EVENT.QUEST_LEAVE_DEAILS = 28;
    sc.MENU_EVENT.MAP_WORLDMAP_STATE = 29;
    sc.MENU_EVENT.MAP_FOCUS_AREA = 30;
    sc.MENU_EVENT.MAP_FOCUS_MAP = 31;
    sc.MENU_EVENT.MAP_UNFOCUS = 32;
    sc.MENU_EVENT.MAP_ENSURE_FOCUS = 33;
    sc.MENU_EVENT.MAP_AREA_LOAD = 34;
    sc.MENU_EVENT.MAP_AREA_LOAD_DONE = 35;
    sc.MENU_EVENT.SAVE_NEW_SLOT = 36;
    sc.MENU_EVENT.SAVE_UPDATE_SLOT = 37;
    sc.MENU_EVENT.SAVE_DELETE_SLOT = 38;
    sc.MENU_EVENT.SYNO_CHANGED_TAB = 39;
    sc.MENU_EVENT.SYNOP_SET_INFO = 40;
    sc.MENU_EVENT.SYNOP_SWITCH_PAGE = 41;
    sc.MENU_EVENT.SYNOP_BUTTON_PRESS = 42;
    sc.MENU_EVENT.SKILL_SWAP_FOCUS = 43;
    sc.MENU_EVENT.SKILL_SWAP_UNFOCUS = 44;
    sc.MENU_EVENT.SKILL_SWAP_ENSURE = 45;
    sc.MENU_EVENT.SHOP_STATE_CHANGED = 46;
    sc.MENU_EVENT.SHOP_PAGE_CHANGED = 47;
    sc.MENU_EVENT.SHOP_CART_CHANGED = 48;
    sc.MENU_EVENT.SHOP_OPEN_QUANTITY = 49;
    sc.MENU_EVENT.SHOP_OPEN_CHECKOUT = 50;
    sc.MENU_EVENT.TRADE_TOGGLE_DETAILS = 51;
    sc.MENU_EVENT.STATUS_SET_PAGE = 52;
    sc.MENU_EVENT.STATUS_SET_ELEMENT = 53;
    sc.MENU_EVENT.DROP_COMPLETED = 54;
    sc.MENU_EVENT.REMOVE_HOTKEYS = 55;
    sc.MENU_EVENT.EQUIP_ENSURE_CURRENT_VALUES = 56;
    sc.MENU_EVENT.MAP_OPEN_STAMPS = 57;
    sc.MENU_EVENT.MAP_UPDATE_STAMP = 58;
    sc.MENU_EVENT.SYNOP_FOCUS = 59;
    sc.MENU_EVENT.OPTION_LANG_POP_UP = 60;
    sc.MENU_EVENT.SKILL_SHOW_EFFECT = 61;
    sc.MENU_EVENT.CIRCUIT_FOCUS_CAM = 62;
    sc.MENU_EVENT.SKILL_SHOW_EFFECT_SWAP = 63;
    sc.MENU_EVENT.POST_EXIT = 99;
    sc.MENU_EVENT.FULL_MENU_ENTER = 100;

    sc.MenuHelper = {
        drawLevel: function (level, unusedX, y, ctx, special) {
            var offsetX = 13;
            y = y - 7;
            if (sc.options.get("level-letter-display")) ctx.draw(0, y, 56, 304 + (special ? 14 : 0), 5, 7);
            var remaining = level,
                digits = 2;
            do {
                digits--;
                offsetX = offsetX - 4;
                ctx.draw(offsetX, y, 62 + remaining % 10 * 5, 304 + (level < 10 && digits == 0 ? 7 : special ? 14 : 0), 5, 7);
                remaining = ~~(remaining / 10)
            } while (digits)
        },

        drawLevelGui: function (gui, level, unusedX, y, gfx) {
            var offsetX = 13;
            y = y - 7;
            if (sc.options.get("level-letter-display")) gui.addGfx(gfx, 0, y, 56, 304, 5, 7);
            var remaining = level,
                digits = 2;
            do {
                digits--;
                offsetX = offsetX - 4;
                gui.addGfx(gfx, offsetX, y, 62 + remaining % 10 * 5, 304 + (level < 10 && digits == 0 ? 7 : 0), 5, 7);
                remaining = ~~(remaining / 10)
            } while (digits)
        },

        addDots: function (number) {
            var langCode = ig.currentLang + "",
                separator = ig.LANG_DETAILS[ig.currentLang] && ig.LANG_DETAILS[ig.currentLang].commaDigits ? "." : ",",
                re = /(\d+)(\d{3})/,
                str = number + "";
            while (re.test(str)) str = str.replace(re, "$1" + separator + "$2");
            return str
        }
    };

    ig.addGameAddon(function () {
        return sc.menu = new sc.MenuModel
    })
});
ig.baked = !0;

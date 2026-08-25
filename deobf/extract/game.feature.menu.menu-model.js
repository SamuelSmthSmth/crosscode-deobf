ig.module("game.feature.menu.menu-model").requires("impact.base.game", "impact.feature.interact.button-interact", "impact.feature.storage.storage", "game.feature.model.base-model", "game.feature.menu.area-loadable", "game.feature.menu.gui.start-menu", "game.feature.menu.gui.equip.equip-menu", "game.feature.menu.gui.circuit.circuit-menu", "game.feature.menu.gui.item.item-menu", "game.feature.menu.gui.map.map-menu", "game.feature.menu.gui.save.save-menu", "game.feature.menu.gui.options.options-menu", "game.feature.menu.gui.shop.shop-menu",
    "game.feature.menu.gui.synop.synop-menu", "game.feature.menu.gui.quests.quest-menu", "game.feature.menu.gui.quest-hub.quest-hub-menu", "game.feature.menu.gui.enemies.enemy-menu", "game.feature.menu.gui.lore.lore-menu", "game.feature.menu.gui.status.status-menu", "game.feature.menu.gui.help.help-menu", "game.feature.menu.gui.museum.museum-menu", "game.feature.menu.gui.stats.stats-menu", "game.feature.menu.gui.trophy.trophy-menu", "game.feature.menu.gui.social.social-menu", "game.feature.menu.gui.trade.trader-menu",
    "game.feature.menu.gui.botanics.botanics-menu", "game.feature.menu.gui.arena.arena-menu", "game.feature.menu.gui.new-game.new-game-menu", "game.feature.menu.map-model").defines(function() {
    function b(a) {
        for (var b = ig.currentLang + "", b = ig.LANG_DETAILS[ig.currentLang] && ig.LANG_DETAILS[ig.currentLang].commaDigits ? "." : ",", e = /(\d+)(\d{3})/, a = a + ""; e.test(a);) a = a.replace(e, "$1" + b + "$2");
        return a
    }

    function a(a, b) {
        var e = "0000" + Math.floor(a);
        return e.length >= 4 + b ? Math.floor(a) : e.substr(e.length - b)
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
        skillRecoverPos: Vec2.createC(0,
            0),
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
        init: function() {
            this.parent("MenuModel");
            this.buttonInteract = new ig.ButtonInteractEntry;
            if (window.wm) {
                ig.database.register("shops", "ShopList",
                    "Shops");
                ig.database.register("drops", "DropsList", "Drops");
                ig.database.register("leawords", "StringArray", "Lea Words")
            }
            this.drops = ig.database.get("drops");
            this.words = ig.database.get("leawords");
            for (var a in this.drops) this.drops[a].other && (this.drops[a].area = null);
            ig.vars.registerVarAccessor("drops", this, "VarDropEditor");
            ig.vars.registerVarAccessor("misc", this, "VarMiscEditor");
            ig.storage.register(this)
        },
        onVarAccess: function(d, c) {
            if (c[0] == "drops") switch (c[1]) {
                case "totalProgress":
                    return this.getTotalDropsFoundAndCompleted(true)
            } else if (c[0] ==
                "misc") switch (c[1]) {
                case "time":
                    var e = new Date,
                        f = e.getHours();
                    return f >= 11 && f <= 13 ? "It's High Noon" : e.getHours() + ":" + e.getMinutes();
                case "words":
                    return c[2] ? ig.vars.get("lea.words." + (c[2] + "").toLowerCase()) : false;
                case "localNum":
                    return c[2] ? b(c[2]) : "";
                case "localNumTempVar":
                    return c[2] ? b(Math.round(parseInt(ig.vars.get("tmp." + c[2])))) : "";
                case "formatTimeVar":
                    if (c[2]) {
                        e = ig.vars.get("tmp." + c[2]);
                        return a(Math.min(Math.floor(e / 60) % 60, 99), 2) + ":" + a(Math.min(Math.floor(e) % 60, 99), 2) + "." + a(Math.min(Math.floor(e *
                            100) % 100, 99), 2)
                    }
            }
        },
        dev_UnlockDrop: function(a) {
            var b = 0,
                e;
            for (e in this.drops)
                if (!this.dropCounts[e] || !this.dropCounts[e].completed) {
                    for (var f = 0; f <= 100; f++) this.incrementDropCount(e, "Autumn-Ground-1");
                    b++;
                    if (b >= a) break
                }
        },
        incrementDropCount: function(a, b) {
            if (this.drops[a]) {
                if (this.drops[a].link) {
                    a = this.drops[a].link || "";
                    if (!this.drops[a]) return
                }
                if (this.drops[a].track) {
                    var e = this.dropCounts[a];
                    if (!e) {
                        e = {
                            anim: b,
                            count: 0,
                            time: (new Date).getTime(),
                            completed: false
                        };
                        sc.stats.setMap("exploration", "dropFound-" +
                            a, 1);
                        sc.stats.addMap("exploration", "dropsTotal", 1);
                        this.dropCounts[a] = e
                    }
                    if (!e.completed) {
                        e.count++;
                        if (!e.completed && e.count >= (this.drops[a].progress || 50)) {
                            e.completed = true;
                            e.count = this.drops[a].progress || 50;
                            sc.stats.addMap("exploration", "dropsCompleted", 1);
                            sc.stats.setMap("exploration", "dropsCompletionRate", this.getTotalDropsFoundAndCompleted(true));
                            if (sc.model.player.hasItem(285)) {
                                sc.Model.notifyObserver(this, sc.MENU_EVENT.DROP_COMPLETED, a);
                                this.addLog({
                                    type: "DROP",
                                    drop: a
                                })
                            }
                        }
                    }
                }
            }
        },
        getFoundDrops: function(a,
            b) {
            var e = [],
                f;
            for (f in this.dropCounts) {
                var g = this.drops[f];
                a ? a == "other" ? g.other && e.push(f) : g.area == a && e.push(f) : e.push(f)
            }
            b != void 0 && this.sortDropList(e, b);
            return e
        },
        sortDropList: function(a, b) {
            switch (b) {
                case sc.BOTANICS_SORT_TYPE.FOUND:
                    a.sort(function(a, b) {
                        return (this.dropCounts[b].time || 0) - (this.dropCounts[a].time || 0)
                    }.bind(this));
                    break;
                case sc.BOTANICS_SORT_TYPE.ORDER:
                    a.sort(function(a, b) {
                        return (this.drops[a].order || 0) - (this.drops[b].order || 0)
                    }.bind(this));
                    break;
                case sc.BOTANICS_SORT_TYPE.NAME:
                    a.sort(function(a,
                        b) {
                        var c = ig.LangLabel.getText(this.drops[a].name),
                            d = ig.LangLabel.getText(this.drops[b].name);
                        return c.localeCompare(d)
                    }.bind(this))
            }
        },
        getDropCount: function(a) {
            return this.dropCounts[a].count
        },
        hasAnyDropFound: function() {
            if (sc.map.hasAnyAreaUnlocked())
                for (var a in this.dropCounts) return true;
            return false
        },
        hasAnyDropInArea: function(a) {
            for (var b in this.drops)
                if (this.drops[b].area == a) return true
        },
        hasDropInArea: function(a) {
            for (var b in this.dropCounts)
                if (this.drops[b].area == a) return true
        },
        hasAnyOtherDropFound: function() {
            for (var a in this.dropCounts)
                if (this.drops[a].other) return true
        },
        getTotalDropsFoundAndCompleted: function(a) {
            var b = 0,
                e = 0,
                f;
            for (f in this.drops) {
                var g = this.drops[f];
                if (g.track && !g.extension) {
                    sc.stats.getMap("exploration", "dropFound-" + f) && this.dropCounts[f] && this.dropCounts[f].completed && b++;
                    e++
                }
            }
            return a ? b / e : b
        },
        getFoundDrop: function(a) {
            return this.dropCounts[a]
        },
        getDropName: function(a) {
            return !this.drops[a] ? "???" : ig.LangLabel.getText(this.drops[a].name)
        },
        getDropArea: function(a) {
            return !this.drops[a] ? "???" : sc.map.getAreaName(this.drops[a].area)
        },
        setStatusPage: function(a) {
            var b =
                this.statusPage;
            this.statusPage = a || sc.MENU_STATUS_PAGES.MAIN;
            sc.Model.notifyObserver(this, sc.MENU_EVENT.STATUS_SET_PAGE, b)
        },
        setStatusElement: function(a) {
            var b = this.statusElement;
            this.statusElement = a || sc.ELEMENT.NEUTRAL;
            sc.Model.notifyObserver(this, sc.MENU_EVENT.STATUS_SET_ELEMENT, b)
        },
        fireStatusPageEvent: function() {
            sc.Model.notifyObserver(this, sc.MENU_EVENT.STATUS_SET_PAGE, this.statusPage)
        },
        addLog: function(a) {
            if (sc.LOG_TYPES[a.type] != void 0) {
                this.logEntries.push(a);
                sc.stats.addMap("player", "logs",
                    1);
                this.logEntries.length > 50 && this.logEntries.shift()
            }
        },
        onReset: function() {
            this.newUnlocks = {};
            this.logEntries.length = 0;
            this.mapStamps = {};
            this.questsSeen = {};
            this.dropCounts = {}
        },
        varsChangedOrder: 1E3,
        onVarsChanged: function() {
            var a = ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD;
            if (this.gamepadIcons != a) {
                this.gamepadIcons = a;
                this.updateHotkeys(true)
            }
        },
        onPostUpdate: function() {
            if (window.IG_GAME_DEBUG && this.startMenuFromWarmUp && !this.startUpStarted) this.startUpTimer > 0 ? this.startUpTimer = this.startUpTimer -
                ig.system.tick : this.enterStartUpMenu()
        },
        onLevelLoadStart: function() {
            this.startMenuFromWarmUp = false
        },
        onLevelLoaded: function() {
            if (window.MENU_ON_GAME_START && window.IG_GAME_DEBUG) {
                this.startMenuFromWarmUp = true;
                this.startUpTimer = 0.2
            }
        },
        enterStartUpMenu: function() {
            if (this.startMenuFromWarmUp && !this.startUpStarted) {
                this.setDirectMode(true, sc.MENU_SUBMENU[window.MENU_ON_GAME_START]);
                window.MENU_ON_GAME_START = null;
                this.startUpStarted = true;
                sc.model.enterMenu()
            }
        },
        addNewUnlock: function(a, b) {
            this.newUnlocks[a] ||
                (this.newUnlocks[a] = []);
            this.newUnlocks[a].push(b)
        },
        hasNewUnlock: function(a) {
            return this.newUnlocks[a] && this.newUnlocks[a].length > 0
        },
        hasNewUnlockKey: function(a, b) {
            return this.newUnlocks[a] && this.newUnlocks[a].indexOf(b) != -1
        },
        clearNewUnlock: function(a, b) {
            this.newUnlocks[a] && (b ? this.newUnlocks[a].erase(b) : delete this.newUnlocks[a])
        },
        onStorageSave: function(a) {
            a.menuNewEntries = ig.copy(this.newUnlocks);
            a.logs = ig.copy(this.logEntries);
            a.drops = ig.copy(this.dropCounts);
            a.stamps = ig.copy(this.mapStamps);
            a.questsSeen =
                ig.copy(this.questsSeen)
        },
        onStoragePreLoad: function(a) {
            this.newUnlocks = a.menuNewEntries || {};
            this.logEntries = a.logs || [];
            this.dropCounts = a.drops || {};
            this.mapStamps = a.stamps || {};
            this.questsSeen = a.questsSeen || {};
            this.onPreLoadDrops()
        },
        onPreLoadDrops: function() {
            var a = 0,
                b = 0,
                e;
            for (e in this.drops)
                if (this.dropCounts[e]) {
                    var f = this.drops[e],
                        g = this.dropCounts[e];
                    if (f.progress < g.count && g.completed) {
                        g.count = f.progress || 50;
                        a++
                    } else if (f.progress < g.count) {
                        g.count = f.progress || 50;
                        g.completed = true;
                        a++;
                        sc.Model.notifyObserver(this,
                            sc.MENU_EVENT.DROP_COMPLETED, e);
                        this.addLog({
                            type: "DROP",
                            drop: e
                        })
                    } else if (f.progress > g.count && g.completed) {
                        g.count = f.progress;
                        a++
                    } else f.progress <= g.count && a++;
                    sc.stats.setMap("exploration", "dropFound-" + e, 1);
                    (f = ig.globalSettings.getGlobalSetting("ENTITY", "ItemDestruct", e)) && f.desType != g.anim && (g.anim = f.desType);
                    b++
                } sc.stats.setMap("exploration", "dropsTotal", b);
            sc.stats.setMap("exploration", "dropsCompleted", a);
            sc.stats.setMap("exploration", "dropsCompletionRate", this.getTotalDropsFoundAndCompleted(true))
        },
        onNewGameApply: function(a) {
            this.dropCounts = a.drops || {};
            this.onPreLoadDrops()
        },
        addMapStamp: function(a, b, e, f, g) {
            this.mapStamps[a] || (this.mapStamps[a] = []);
            for (var h = 0; h < sc.MAP_STAMPS_MAX; h++)
                if (!this.mapStamps[a][h]) {
                    this.mapStamps[a][h] = {
                        key: b,
                        x: e,
                        y: f,
                        level: g,
                        index: h
                    };
                    return h
                } return -1
        },
        editStamp: function(a, b, e) {
            if (this.mapStamps[b]) {
                this.mapStamps[b][a] && (this.mapStamps[b][a].key = e);
                sc.Model.notifyObserver(this, sc.MENU_EVENT.MAP_UPDATE_STAMP)
            }
        },
        removeStamp: function(a, b) {
            this.mapStamps[a] && this.mapStamps[a][b] &&
                (this.mapStamps[a][b] = null)
        },
        getStamps: function(a) {
            this.mapStamps[a] || (this.mapStamps[a] = []);
            return this.mapStamps[a]
        },
        getStampCount: function(a) {
            this.mapStamps[a] || (this.mapStamps[a] = []);
            for (var b = 0, e = this.mapStamps[a].length; e--;) this.mapStamps[a][e] && b++;
            return b
        },
        fullyEntered: function() {
            sc.Model.notifyObserver(this, sc.MENU_EVENT.FULL_MENU_ENTER)
        },
        addHotkey: function(a, b) {
            this.hotkeysCallbacks.push(a);
            b && sc.Model.notifyObserver(this, sc.MENU_EVENT.TOP_BAR_CHANGED)
        },
        commitHotkeys: function(a) {
            sc.Model.notifyObserver(this,
                sc.MENU_EVENT.TOP_BAR_CHANGED, a)
        },
        updateHotkeys: function(a) {
            sc.Model.notifyObserver(this, sc.MENU_EVENT.TOP_BAR_UPDATE, a)
        },
        removeHotkeys: function() {
            this.hotkeysCallbacks = [];
            sc.Model.notifyObserver(this, sc.MENU_EVENT.REMOVE_HOTKEYS)
        },
        pushBackCallback: function(a) {
            if (a) {
                this.backCallbackStack.push(a);
                this.currentBackCallback = a
            }
        },
        popBackCallback: function() {
            this.backCallbackStack.pop();
            this.currentBackCallback = this.backCallbackStack.length > 0 ? this.backCallbackStack[this.backCallbackStack.length - 1] : null
        },
        invokeTopBackButton: function() {
            this.currentBackCallback && this.currentBackCallback()
        },
        pushMenu: function(a) {
            if (a) {
                this.menuStack.push(a);
                this.previousMenu = this.currentMenu;
                this.currentMenu = a;
                this.hotkeysCallbacks = [];
                this.setInfoText("", true);
                sc.Model.notifyObserver(this, sc.MENU_EVENT.ENTER_MENU)
            }
        },
        popMenu: function() {
            if (!(this.menuStack.length <= 0)) {
                this.previousMenu = this.menuStack.pop();
                this.currentMenu = this.menuStack.length > 0 ? this.menuStack[this.menuStack.length - 1] : this.directMode ? this.directMenu : sc.MENU_SUBMENU.START;
                this.setInfoText("", true);
                this.hotkeysCallbacks = [];
                sc.Model.notifyObserver(this, sc.MENU_EVENT.LEAVE_MENU)
            }
        },
        enterMenu: function() {
            ig.interact.addEntry(this.buttonInteract);
            this.menuEntered = true
        },
        setDirectMode: function(a, b) {
            this.directMode = a || false;
            this.directMenu = b || sc.MENU_SUBMENU.START
        },
        setHost: function(a) {
            this.menuHost = a || 0
        },
        exitMenu: function() {
            if (this.menuEntered) {
                this.menuEntered = false;
                sc.commonEvents.triggerEvent("MENU_LEAVE", {})
            }
            this.menuStack = [];
            this.backCallbackStack = [];
            this.buffText = this.infoText =
                this.currentBackCallback = null;
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
            this.itemLastButtonData =
                null;
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
            this.mapCursor.x =
                this.mapCursor.y = this.mapLastCursor.x = this.mapLastCursor.y = 0;
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
                var a = this.exitCallback;
                this.exitCallback = null;
                a()
            }
        },
        invokePostExit: function() {
            sc.Model.notifyObserver(this, sc.MENU_EVENT.POST_EXIT)
        },
        setInfoText: function(a, b) {
            this.infoText = a;
            sc.Model.notifyObserver(this, sc.MENU_EVENT.INFO_TEXT_CHANGED, b)
        },
        setBuffText: function(a, b, e) {
            this.buffText = a;
            this.buffID = e || -1;
            sc.Model.notifyObserver(this, sc.MENU_EVENT.SET_BUFF_INFO,
                b)
        },
        moveLeaSprite: function(a, b, e, f) {
            this.leaState = e || sc.MENU_LEA_STATE.LARGE;
            sc.Model.notifyObserver(this, sc.MENU_EVENT.LEA_STATE_CHANGED, {
                x: a || 0,
                y: b || 0,
                skip: f
            })
        },
        enterTradeDetails: function() {
            this.tradeToggle = true;
            sc.Model.notifyObserver(this, sc.MENU_EVENT.TRADE_TOGGLE_DETAILS)
        },
        exitTradeDetails: function() {
            this.tradeToggle = false;
            sc.Model.notifyObserver(this, sc.MENU_EVENT.TRADE_TOGGLE_DETAILS)
        },
        setShopState: function(a) {
            if (this.shopState != a) {
                var b = this.shopState;
                this.shopState = a || sc.MENU_SHOP_STATE.START;
                sc.Model.notifyObserver(this, sc.MENU_EVENT.SHOP_STATE_CHANGED, b)
            }
        },
        setShopPage: function(a) {
            if (this.shopPage != a) {
                var b = this.shopPage;
                this.shopPage = a || 0;
                sc.Model.notifyObserver(this, sc.MENU_EVENT.SHOP_PAGE_CHANGED, b)
            }
        },
        updateCart: function(a, b, e) {
            for (var f = this.shopCart.length; f--;) {
                var g = this.shopCart[f];
                if (g.id == a && g.price == e) {
                    g.amount = b;
                    g.amount <= 0 && this.shopCart.splice(f, 1);
                    f = -10;
                    break
                }
            }
            f != -10 && b > 0 && this.shopCart.push({
                id: a,
                amount: b,
                price: e
            });
            sc.Model.notifyObserver(this, sc.MENU_EVENT.SHOP_CART_CHANGED)
        },
        getTotalCost: function(a, b) {
            for (var e = 0, f = this.shopCart.length; f--;) {
                var g = this.shopCart[f];
                a == g.id && b == g.price || (e = e + g.price * g.amount)
            }
            return e
        },
        getItemQuantity: function(a, b) {
            for (var e = this.shopCart.length; e--;) {
                var f = this.shopCart[e];
                if (f.id == a && f.price == b) return f.amount
            }
            return 0
        },
        openShopQuantitySelect: function(a) {
            sc.Model.notifyObserver(this, sc.MENU_EVENT.SHOP_OPEN_QUANTITY, a)
        },
        openCheckout: function() {
            sc.Model.notifyObserver(this, sc.MENU_EVENT.SHOP_OPEN_CHECKOUT)
        },
        updateTotalCost: function(a, b,
            e) {
            var f = this.getTotalCost(a, e);
            a && (b != void 0 && e) && (f = f + (b || 0) * e);
            sc.Model.notifyObserver(this, sc.MENU_EVENT.SHOP_CART_CHANGED, f)
        },
        newSlot: function() {
            sc.stats.addMap("player", "saves", 1);
            ig.storage.save(ig.storage.slots.length);
            sc.Model.notifyObserver(this, sc.MENU_EVENT.SAVE_NEW_SLOT)
        },
        saveSlot: function(a) {
            ig.storage.save(a);
            sc.Model.notifyObserver(this, sc.MENU_EVENT.SAVE_UPDATE_SLOT, a)
        },
        deleteSlot: function(a) {
            ig.storage.deleteSlot(a);
            sc.Model.notifyObserver(this, sc.MENU_EVENT.SAVE_DELETE_SLOT, a)
        },
        loadSlot: function(a) {
            this.loadSlotID = a
        },
        setItemInfo: function(a) {
            sc.Model.notifyObserver(this, sc.MENU_EVENT.ITEM_INFO_CHANGED, a)
        },
        resetItemInfo: function() {
            sc.Model.notifyObserver(this, sc.MENU_EVENT.ITEM_RESET_INFO)
        },
        setItemTab: function(a) {
            a = a || 0;
            if (a != this.itemCurrentTab) {
                var b = this.itemCurrentTab;
                this.itemCurrentTab = a;
                sc.Model.notifyObserver(this, sc.MENU_EVENT.ITEM_CHANGED_TAB, b)
            }
        },
        getCurrentTabType: function() {
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
        getCurrentTabSubType: function() {
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
        isItemEquipTab: function() {
            return this.itemCurrentTab >= 2 && this.itemCurrentTab <= 5
        },
        sortList: function(a) {
            sc.Model.notifyObserver(this, sc.MENU_EVENT.SORT_LIST,
                a)
        },
        setOptionTab: function(a) {
            a = a || 0;
            if (a != this.optionCurrentTab) {
                this.optionCurrentTab = a;
                sc.Model.notifyObserver(this, sc.MENU_EVENT.OPTION_CHANGED_TAB)
            }
        },
        getCurrentOptionCategory: function() {
            for (var a in sc.OPTION_CATEGORY)
                if (sc.OPTION_CATEGORY[a] == this.itemCurrentTab) return this.itemCurrentTab;
            return null
        },
        openLanguagePopUp: function(a) {
            sc.Model.notifyObserver(this, sc.MENU_EVENT.OPTION_LANG_POP_UP, a)
        },
        setSynoTab: function() {
            sc.Model.notifyObserver(this, sc.MENU_EVENT.SYNO_CHANGED_TAB)
        },
        setSynopInfo: function(a,
            b) {
            this.synopInfo = a;
            sc.Model.notifyObserver(this, sc.MENU_EVENT.SYNOP_SET_INFO, b)
        },
        setSynopFocus: function(a) {
            sc.Model.notifyObserver(this, sc.MENU_EVENT.SYNOP_FOCUS, a)
        },
        switchSynopsisPage: function(a) {
            sc.Model.notifyObserver(this, sc.MENU_EVENT.SYNOP_SWITCH_PAGE, a)
        },
        setSynopPressed: function(a) {
            sc.Model.notifyObserver(this, sc.MENU_EVENT.SYNOP_BUTTON_PRESS, a)
        },
        setQuestTab: function(a) {
            a = a || 0;
            if (a != this.questCurrentTab) {
                var b = this.questCurrentTab;
                this.questCurrentTab = a;
                sc.Model.notifyObserver(this, sc.MENU_EVENT.QUEST_CHANGED_TAB,
                    b)
            }
        },
        setQuestInfo: function(a, b) {
            this.questInfo = a;
            sc.Model.notifyObserver(this, sc.MENU_EVENT.QUEST_SET_INFO, b)
        },
        enterQuestDetails: function(a) {
            this.questDetailMode = true;
            sc.Model.notifyObserver(this, sc.MENU_EVENT.QUEST_ENTER_DEAILS, a)
        },
        leaveQuestDetails: function() {
            this.questDetailMode = false;
            sc.Model.notifyObserver(this, sc.MENU_EVENT.QUEST_LEAVE_DEAILS)
        },
        selectBodyPart: function(a) {
            this.previousBodyPart = this.currentBodyPart;
            this.currentBodyPart = a || sc.MENU_EQUIP_BODYPART.NONE;
            sc.Model.notifyObserver(this,
                sc.MENU_EVENT.SELECTED_BODYPART)
        },
        cycleBodyPartRight: function() {
            var a = this.currentBodyPart + 1;
            a > 5 && (a = sc.MENU_EQUIP_BODYPART.HEAD);
            this.selectBodyPart(a)
        },
        cycleBodyPartLeft: function() {
            var a = this.currentBodyPart - 1;
            a < 1 && (a = sc.MENU_EQUIP_BODYPART.FEET);
            this.selectBodyPart(a)
        },
        changeEquipOnCurrentBodypart: function(a) {
            sc.Model.notifyObserver(this, sc.MENU_EVENT.EQUIP_CHANGED, a)
        },
        ensureCurrentValues: function() {
            sc.Model.notifyObserver(this, sc.MENU_EVENT.EQUIP_ENSURE_CURRENT_VALUES)
        },
        exitEquipMenu: function() {
            this.previousBodyPart =
                null;
            this.currentBodyPart = sc.MENU_EQUIP_BODYPART.NONE
        },
        showSkillEffect: function(a, b, e) {
            sc.Model.notifyObserver(this, sc.MENU_EVENT.SKILL_SHOW_EFFECT, {
                gui: a,
                isSwitch: b,
                delay: e
            })
        },
        showSwapSkillEffect: function(a) {
            sc.Model.notifyObserver(this, sc.MENU_EVENT.SKILL_SHOW_EFFECT_SWAP, a)
        },
        selectSkillTree: function(a) {
            if (a != this.currentSkillTree) {
                this.previousSkillTree = this.currentSkillTree;
                this.currentSkillTree = a != void 0 ? a : -1;
                if (this.currentSkillTree != -1) {
                    this.skillState = sc.MENU_SKILL_STATE.DETAIL_VIEW;
                    this.currentSkillFocus =
                        null;
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
        focusCursorOnNode: function(a, b, e) {
            if (this.currentSkillFocus == e) {
                if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                    this.skillCursor.x = a;
                    this.skillCursor.y = b;
                    sc.Model.notifyObserver(this,
                        sc.MENU_EVENT.SKILL_ENSURE_GAMEPAD_FOCUS)
                }
            } else {
                this.skillWasDragged = false;
                this.skillRecoverPos.x = this.skillCursor.x;
                this.skillRecoverPos.y = this.skillCursor.y;
                this.skillCursor.x = a;
                this.skillCursor.y = b;
                this.currentSkillFocus = e;
                this.skillState = sc.MENU_SKILL_STATE.NODE_SELECT;
                sc.Model.notifyObserver(this, sc.MENU_EVENT.SKILL_CURSOR_FOCUS_NODE, this.currentSkillFocus.skill)
            }
        },
        unfocusCursor: function(a) {
            if (this.currentSkillFocus == a) {
                this.currentSkillFocus = null;
                this.skillState = sc.MENU_SKILL_STATE.DETAIL_VIEW;
                sc.Model.notifyObserver(this, sc.MENU_EVENT.SKILL_CURSOR_UNFOCUS_NODE)
            }
        },
        unfocusSwapCursor: function(a) {
            if (this.skillSwapFocus == a) {
                this.skillSwapFocus = null;
                sc.Model.notifyObserver(this, sc.MENU_EVENT.SKILL_SWAP_UNFOCUS)
            }
        },
        focusSwapCursor: function(a, b, e) {
            if (this.skillSwapFocus == e) {
                if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                    this.skillSwapCursor.x = a;
                    this.skillSwapCursor.y = b;
                    sc.Model.notifyObserver(this, sc.MENU_EVENT.SKILL_SWAP_ENSURE)
                }
            } else {
                this.skillSwapMoved = false;
                this.skillSwapCursor.x = a;
                this.skillSwapCursor.y =
                    b;
                this.skillSwapFocus = e;
                sc.Model.notifyObserver(this, sc.MENU_EVENT.SKILL_SWAP_FOCUS)
            }
        },
        resetSwapCursor: function() {
            this.skillSwapMoved = false;
            if (this.skillSwapFocus) this.skillSwapFocus.focus = false;
            this.skillSwapFocus = null
        },
        centerOnNode: function(a, b) {
            if (a) {
                var e = -this.skillCursor.y + ig.system.height / 2;
                this.skillCamera.x = -this.skillCursor.x + ig.system.width / 2;
                this.skillCamera.y = e;
                this.skillState = sc.MENU_SKILL_STATE.NODE_MENU;
                sc.Model.notifyObserver(this, sc.MENU_EVENT.SKILL_NODE_SELECT, b)
            }
        },
        centerOnNodeCam: function(a,
            b, e, f) {
            if (a) {
                a = -b.y + ig.system.height / 2;
                this.skillCamera.x = -b.x + ig.system.width / 2;
                this.skillCamera.y = a;
                sc.Model.notifyObserver(this, sc.MENU_EVENT.CIRCUIT_FOCUS_CAM, {
                    callback: f,
                    time: e || 0.2
                })
            }
        },
        exitNodeMenu: function(a) {
            this.skillState = a || sc.MENU_SKILL_STATE.DETAIL_VIEW;
            sc.Model.notifyObserver(this, sc.MENU_EVENT.SKILL_NODE_EXIT)
        },
        enterSwapBranches: function(a) {
            this.skillStateOrigin = a || sc.MENU_SKILL_STATE.OVERVIEW;
            this.skillState = sc.MENU_SKILL_STATE.SWAP_BRANCHES;
            sc.Model.notifyObserver(this, sc.MENU_EVENT.SKILL_ENTER_SWAP_BRANCHES)
        },
        leaveSwapBranches: function() {
            this.skillSwapFocus = null;
            this.skillState = sc.MENU_SKILL_STATE.OVERVIEW;
            sc.Model.notifyObserver(this, sc.MENU_EVENT.SKILL_LEAVE_SWAP_BRANCHES)
        },
        toggledInputMode: function() {
            sc.Model.notifyObserver(this, sc.MENU_EVENT.SKILL_TOGGLED_INPUT_MODE)
        },
        selectFloor: function(a) {
            sc.map.currentFloor = a || 0;
            sc.Model.notifyObserver(this, sc.MENU_EVENT.MAP_CHANGED_FLOOR)
        },
        enterWorldMap: function() {
            if (this.mapMapFocus && this.mapMapFocus.focus) this.mapMapFocus.focus = false;
            this.mapMapFocus = null;
            this.mapDrag =
                false;
            this.mapWorldmapActive = true;
            sc.Model.notifyObserver(this, sc.MENU_EVENT.MAP_WORLDMAP_STATE, this.mapWorldmapActive)
        },
        exitWorldMap: function() {
            this.mapWorldmapActive = false;
            sc.Model.notifyObserver(this, sc.MENU_EVENT.MAP_WORLDMAP_STATE, this.mapWorldmapActive)
        },
        focusArea: function(a, b, e, f) {
            if (this.mapAreaFocus == e) {
                if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                    this.mapWorldCursor.x = a;
                    this.mapWorldCursor.y = b;
                    sc.Model.notifyObserver(this, sc.MENU_EVENT.MAP_ENSURE_FOCUS, true)
                }
            } else {
                this.mapWorldCursor.x =
                    a;
                this.mapWorldCursor.y = b;
                if (this.mapAreaFocus && this.mapAreaFocus.focus) this.mapAreaFocus.focus = false;
                if ((this.mapAreaFocus = e) && !this.mapAreaFocus.focus) this.mapAreaFocus.focus = true;
                sc.Model.notifyObserver(this, sc.MENU_EVENT.MAP_FOCUS_AREA, f)
            }
        },
        focusMap: function(a, b, e, f) {
            if (this.mapMapFocus == e) {
                if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                    this.mapCursor.x = a;
                    this.mapCursor.y = b;
                    sc.Model.notifyObserver(this, sc.MENU_EVENT.MAP_ENSURE_FOCUS)
                }
            } else {
                this.mapWasDragged = false;
                this.mapCursor.x = a;
                this.mapCursor.y =
                    b;
                if (this.mapMapFocus && this.mapMapFocus.focus) this.mapMapFocus.focus = false;
                if (this.mapMapFocus = e) this.mapMapFocus.focus = true;
                sc.Model.notifyObserver(this, sc.MENU_EVENT.MAP_FOCUS_MAP, f)
            }
        },
        unfocusArea: function(a) {
            if (this.mapAreaFocus == a) {
                if (this.mapAreaFocus) this.mapAreaFocus.focus = false;
                this.mapAreaFocus = null;
                sc.Model.notifyObserver(this, sc.MENU_EVENT.MAP_UNFOCUS, true)
            }
        },
        unfocusMap: function(a) {
            if (this.mapMapFocus == a) {
                if (this.mapMapFocus) this.mapMapFocus.focus = false;
                this.mapMapFocus = null;
                sc.Model.notifyObserver(this,
                    sc.MENU_EVENT.MAP_UNFOCUS, false)
            }
        },
        resetWorldmapCursor: function() {
            this.mapWmCursorMoved = false;
            if (this.mapAreaFocus) this.mapAreaFocus.focus = false;
            this.mapAreaFocus = null
        },
        loadArea: function(a) {
            if (a == sc.map.currentArea.path) this.exitWorldMap();
            else {
                this.mapLoading = true;
                this.mapWorldmapActive = false;
                sc.Model.notifyObserver(this, sc.MENU_EVENT.MAP_AREA_LOAD, a)
            }
        },
        setAreaLoadDone: function(a) {
            this.mapLoading = false;
            sc.Model.notifyObserver(this, sc.MENU_EVENT.MAP_AREA_LOAD_DONE, a)
        },
        openStampMenu: function(a) {
            sc.Model.notifyObserver(this,
                sc.MENU_EVENT.MAP_OPEN_STAMPS, a)
        },
        getCurrentMenuAsName: function() {
            return this.getMenuAsName(this.currentMenu)
        },
        getMenuAsName: function(a) {
            return ig.lang.get("sc.gui.menu.menu-titles." + ((this.loadMode || this.arenaCustomMode || this.shopCoinMode) && sc.SUB_MENU_INFO[a].alt ? sc.SUB_MENU_INFO[a].alt : sc.SUB_MENU_INFO[a].name))
        },
        isStart: function() {
            return this.currentMenu == sc.MENU_SUBMENU.START
        },
        isSkills: function() {
            return this.currentMenu == sc.MENU_SUBMENU.SKILLS
        },
        isEquipment: function() {
            return this.currentMenu ==
                sc.MENU_SUBMENU.EQUIPMENT
        },
        isStatus: function() {
            return this.currentMenu == sc.MENU_SUBMENU.STATUS
        },
        isSynopsis: function() {
            return this.currentMenu == sc.MENU_SUBMENU.SYNOPSIS
        },
        isMap: function() {
            return this.currentMenu == sc.MENU_SUBMENU.MAP
        },
        isSave: function() {
            return this.currentMenu == sc.MENU_SUBMENU.SAVE
        },
        isOptions: function() {
            return this.currentMenu == sc.MENU_SUBMENU.OPTIONS
        },
        isShop: function() {
            return this.currentMenu == sc.MENU_SUBMENU.SHOP
        },
        isButtonInteractActive: function() {
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
    sc.MENU_EVENT.SKILL_NODE_EXIT =
        14;
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
    sc.MENU_EVENT.QUEST_LEAVE_DEAILS =
        28;
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
    sc.MENU_EVENT.MAP_UPDATE_STAMP =
        58;
    sc.MENU_EVENT.SYNOP_FOCUS = 59;
    sc.MENU_EVENT.OPTION_LANG_POP_UP = 60;
    sc.MENU_EVENT.SKILL_SHOW_EFFECT = 61;
    sc.MENU_EVENT.CIRCUIT_FOCUS_CAM = 62;
    sc.MENU_EVENT.SKILL_SHOW_EFFECT_SWAP = 63;
    sc.MENU_EVENT.POST_EXIT = 99;
    sc.MENU_EVENT.FULL_MENU_ENTER = 100;
    sc.MenuHelper = {
        drawLevel: function(a, b, e, f, g) {
            b = 13;
            e = e - 7;
            sc.options.get("level-letter-display") && f.draw(0, e, 56, 304 + (g ? 14 : 0), 5, 7);
            var h = a,
                i = 2;
            do {
                i--;
                b = b - 4;
                f.draw(b, e, 62 + h % 10 * 5, 304 + (a < 10 && i == 0 ? 7 : g ? 14 : 0), 5, 7);
                h = ~~(h / 10)
            } while (i)
        },
        drawLevelGui: function(a, b, e, f, g) {
            e = 13;
            f = f - 7;
            sc.options.get("level-letter-display") && a.addGfx(g, 0, f, 56, 304, 5, 7);
            var h = b,
                i = 2;
            do {
                i--;
                e = e - 4;
                a.addGfx(g, e, f, 62 + h % 10 * 5, 304 + (b < 10 && i == 0 ? 7 : 0), 5, 7);
                h = ~~(h / 10)
            } while (i)
        },
        addDots: function(a) {
            for (var b = ig.currentLang + "", b = ig.LANG_DETAILS[ig.currentLang] && ig.LANG_DETAILS[ig.currentLang].commaDigits ? "." : ",", e = /(\d+)(\d{3})/, a = a + ""; e.test(a);) a = a.replace(e, "$1" + b + "$2");
            return a
        }
    };
    ig.addGameAddon(function() {
        return sc.menu = new sc.MenuModel
    })
});
ig.baked = !0;

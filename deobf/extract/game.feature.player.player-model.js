ig.module("game.feature.player.player-model").requires("game.feature.model.base-model", "game.feature.combat.model.combat-params", "game.feature.combat.entities.ball", "game.feature.player.player-config", "game.feature.achievements.stats-model", "game.feature.player.player-level", "game.feature.inventory.inventory").defines(function() {
    var b = {
            id: 0,
            equipID: 0,
            amount: 0,
            skip: false,
            unequip: false
        },
        a = null,
        d = null,
        c, e, f = [0, 2, 3, 1, 4];
    sc.ITEM_USE_TIMER = 10;
    sc.ITEM_MAX_FAVS = 12;
    sc.PLAYER_MSG = {
        ELEMENT_MODE_CHANGE: 1,
        CREDIT_CHANGE: 2,
        EXP_CHANGE: 3,
        LEVEL_CHANGE: 4,
        EQUIP_CHANGE: 5,
        CP_CHANGE: 6,
        SKILL_CHANGED: 7,
        SKILL_BRANCH_SWAP: 8,
        RESET_PLAYER: 9,
        ITEM_OBTAINED: 10,
        SET_PARAMS: 11,
        CONFIG_CHANGED: 12,
        ITEM_USED: 13,
        STATS_CHANGED: 14,
        ITEM_REMOVED: 15,
        ITEM_BLOCK_FINISH: 16,
        ITEM_FAVORITES_CHANGED: 17,
        ITEM_EQUIP_UPDATE: 18,
        ITEM_CONSUME_START: 19,
        ITEM_CONSUME_END: 20,
        CORE_CHANGED: 21,
        ITEM_TOGGLED: 22
    };
    sc.PLAYER_CORE = {
        MOVE: 1,
        CHARGE: 2,
        DASH: 3,
        CLOSE_COMBAT: 4,
        GUARD: 5,
        CREDITS: 6,
        MENU: 7,
        ELEMENT_NEUTRAL: 8,
        ELEMENT_HEAT: 9,
        ELEMENT_COLD: 10,
        ELEMENT_SHOCK: 11,
        ELEMENT_WAVE: 12,
        QUICK_MENU: 13,
        THROWING: 14,
        ELEMENT_LOAD: 15,
        ELEMENT_CHANGE: 16,
        SPECIAL: 17,
        COMBAT_RANK: 18,
        QUEST_SWITCH: 19,
        EXP: 20,
        MENU_CIRCUIT: 21,
        MENU_SYNOPSIS: 22,
        MENU_SOCIAL: 23,
        MENU_SOCIAL_INVITE: 24,
        MENU_BOTANICS: 25,
        ITEMS: 26,
        MONEY: 27,
        MODIFIER: 28
    };
    sc.EXP_PER_LEVEL = 1E3;
    sc.EXP_MAX_LEVEL = 99;
    sc.MAX_SP = 16;
    sc.SP_LEVEL = [0, 4, 8, 12, 16];
    var g = [];
    g[sc.PLAYER_ACTION.THROW_NORMAL] = 1;
    g[sc.PLAYER_ACTION.THROW_NORMAL_REV] = 1;
    g[sc.PLAYER_ACTION.THROW_NORMAL_CHARGED] = 3;
    g[sc.PLAYER_ACTION.THROW_NORMAL_CHARGED_REV] = 3;
    g[sc.PLAYER_ACTION.ATTACK] =
        1;
    g[sc.PLAYER_ACTION.ATTACK_REV] = 1;
    g[sc.PLAYER_ACTION.ATTACK_FINISHER] = 2;
    g[sc.PLAYER_ACTION.THROW_SPECIAL1] = 4;
    g[sc.PLAYER_ACTION.THROW_SPECIAL2] = 6;
    g[sc.PLAYER_ACTION.THROW_SPECIAL3] = 12;
    g[sc.PLAYER_ACTION.ATTACK_SPECIAL1] = 4;
    g[sc.PLAYER_ACTION.ATTACK_SPECIAL2] = 6;
    g[sc.PLAYER_ACTION.ATTACK_SPECIAL3] = 12;
    sc.PlayerModel = ig.Class.extend({
        observers: [],
        core: {},
        config: null,
        loadedConfig: null,
        equip: {
            head: -1,
            leftArm: -1,
            rightArm: -1,
            torso: -1,
            feet: -1
        },
        items: [],
        itemFavs: [],
        itemNew: [],
        itemToggles: {},
        animSheet: null,
        stats: null,
        baseParams: {
            elemFactor: [1, 1, 1, 1]
        },
        equipParams: {},
        equipModifiers: {},
        params: null,
        name: null,
        character: null,
        credit: 0,
        level: 1,
        exp: 0,
        skills: [],
        skillPoints: [],
        skillPointsExtra: [],
        chapter: 0,
        spLevel: 2,
        baseConfig: null,
        elementConfigs: {},
        elementScrollDelay: 0,
        levelUpDelta: {
            level: 0,
            cp: 0,
            hp: 0,
            attack: 0,
            defense: 0,
            focus: 0
        },
        currentElementMode: 0,
        elementLoad: 0,
        elementLoadTimer: 0,
        hasOverload: false,
        itemBlockTimer: 0,
        chapters: null,
        toggleSets: null,
        init: function() {
            this.params = new sc.CombatParams;
            this.setSpLevel(2);
            for (var a in sc.PLAYER_CORE) this.core[sc.PLAYER_CORE[a]] = true;
            for (var b in sc.ELEMENT) {
                this.skillPoints[sc.ELEMENT[b]] = 0;
                this.skillPointsExtra[sc.ELEMENT[b]] = 0
            }
            if (window.wm) {
                ig.database.register("chapters", "ChapterList", "Chapters");
                ig.database.register("toggle-sets", "ToggleSetsList", "Toggle Sets")
            }
            this.chapters = ig.database.get("chapters");
            this.toggleSets = ig.database.get("toggle-sets");
            ig.vars.registerVarAccessor("item", this, "VarItemEditor");
            ig.vars.registerVarAccessor("equip", this, "VarEquipEditor");
            ig.vars.registerVarAccessor("player", this, "VarPlayerEditor");
            ig.vars.registerVarAccessor("chapter", this, "VarChapterEditor")
        },
        setConfig: function(a) {
            this.config && this.config.decreaseRef();
            this.config = a;
            this.config.increaseRef();
            this.name = a.name;
            this.character = a.character;
            this.defaultExpression && this.defaultExpression.decreaseRef();
            this.defaultExpression = new sc.CharacterExpression(a.character.name, "DEFAULT");
            this.animSheet = a.animSheet;
            this.stats = a.stats;
            this.baseConfig = a.baseConfig;
            this.elementConfigs =
                a.elementConfigs;
            this.updateStats();
            sc.Model.notifyObserver(this, sc.PLAYER_MSG.CONFIG_CHANGED)
        },
        updateChapter: function(a) {
            for (var b = ig.vars.get("plot.line"), c = this.chapters.length; c--;)
                if (b >= this.chapters[c].plotline) {
                    this.chapter = c;
                    break
                } b = sc.lore.getCategoryList(sc.LORE_CATERGORIES.STORY, sc.LORE_SORT_TYPE.ORDER);
            for (c = 0; c < this.chapter + 1; c++) a ? sc.lore.unlockLore(b[c], false, true, !sc.lore.isLoreUnlocked(b[c])) : sc.lore.isLoreUnlocked(b[c]) || sc.lore.unlockLore(b[c], true)
        },
        reset: function() {
            for (var a in sc.PLAYER_CORE) this.core[sc.PLAYER_CORE[a]] =
                true;
            for (var b in sc.ELEMENT) {
                this.skillPoints[sc.ELEMENT[b]] = 0;
                this.skillPointsExtra[sc.ELEMENT[b]] = 0
            }
            this.level = 1;
            this.exp = 0;
            this.clearLevelUp();
            this.setSpLevel(1);
            this.params.reset(sc.SP_LEVEL[2]);
            this.spLevel = 2;
            for (b in this.equip) this.equip[b] = -1;
            this.items.length = 0;
            this.itemFavs.length = 0;
            this.itemNew.length = 0;
            this.elementLoad = this.currentElementMode = this.credit = this.skills.length = 0;
            this.hasOverload = false;
            this.chapter = 0;
            this.itemToggles = {};
            sc.inventory.updateScaledEquipment(this.level);
            this.updateStats();
            sc.Model.notifyObserver(this, sc.PLAYER_MSG.RESET_PLAYER)
        },
        updateLoop: function(a) {
            this.elementLoadTimer = this.elementLoadTimer + ig.system.ingameTick;
            if (ig.game.firstUpdateLoop) {
                sc.stats.addMap("element", "time" + this.currentElementMode, ig.system.rawTick);
                sc.model.isAssistMode() && sc.stats.addMap("player", "assistTime", ig.system.rawTick)
            }
            if (this.elementScrollDelay) {
                this.elementScrollDelay = this.elementScrollDelay - ig.system.actualTick;
                if (this.elementScrollDelay < 0) this.elementScrollDelay = 0
            }
            var b = 0;
            this.elementLoadTimer >
                1 && (b = 1);
            a || (b = b * 8);
            !this.hasOverload && !this.currentElementMode && (b = b * 3);
            this.hasOverload && (b = b * 4);
            b && this.elementLoad > 0 && this.addElementLoad(-b * ig.system.ingameTick);
            if (this.itemBlockTimer > 0) {
                this.itemBlockTimer = sc.combat.isInCombat(ig.game.playerEntity) ? this.itemBlockTimer - ig.system.ingameTick : this.itemBlockTimer - ig.system.ingameTick * 10;
                if (this.itemBlockTimer <= 0) {
                    this.itemBlockTimer = 0;
                    sc.Model.notifyObserver(this, sc.PLAYER_MSG.ITEM_BLOCK_FINISH)
                }
            }
        },
        addElementLoad: function(a) {
            if (this.core[sc.PLAYER_CORE.ELEMENT_LOAD] &&
                !(sc.newgame.get("overload-disable") && a >= 0)) {
                var b = 50 * (1 + this.params.getModifier("OVERHEAT_REDUCTION"));
                this.elementLoad = this.elementLoad + a / b;
                if (this.elementLoad < 0) {
                    this.hasOverload = false;
                    this.elementLoad = 0
                } else if (this.elementLoad >= 1) {
                    this.enterElementalOverload();
                    this.elementLoad = 1
                }
            }
        },
        setElementLoad: function(a) {
            this.elementLoad = a;
            if (a < 1 && this.hasOverload) this.hasOverload = false;
            else if (a >= 1 && !this.hasOverload) {
                this.enterElementalOverload();
                this.elementLoad = 1
            }
        },
        enterElementalOverload: function() {
            if (!this.hasOverload) {
                sc.stats.addMap("element",
                    "overload", 1);
                sc.arena.onElementOverload();
                sc.combat.doDramaticEffect(ig.game.playerEntity, ig.game.playerEntity, sc.DRAMATIC_EFFECT.OVERLOAD);
                var a = ig.lang.get("sc.gui.combat.element-overload"),
                    a = new sc.SmallEntityBox(ig.game.playerEntity, a, 1);
                ig.gui.addGuiElement(a);
                this.hasOverload = true;
                this.setElementMode(sc.ELEMENT.NEUTRAL, true)
            }
        },
        onTargetHit: function(a, b, c) {
            this.currentElementMode == sc.ELEMENT.NEUTRAL && this.addElementLoad(-(c.offensiveFactor * c.defensiveFactor))
        },
        increaseActionHeat: function(a) {
            if (this.currentElementMode !=
                sc.ELEMENT.NEUTRAL)
                if (a = g[a]) {
                    this.addElementLoad(a);
                    this.elementLoadTimer = 0
                }
        },
        getCharacterName: function() {
            return this.character && ig.LangLabel.getText(this.character.data.name) || "???"
        },
        switchBranch: function(a, b, c) {
            for (var d = false, b = b ? 1 : -1, e = 3, c = c != void 0 ? c : -1; e--;) {
                if (c == a) {
                    this.learnSkill(c);
                    d = true;
                    break
                }
                if (this.skills[a + b]) {
                    this.skills[a + b] = null;
                    this.skills[a] = sc.skilltree.skills[a];
                    ig.debug("SWITCH SKILL: " + a);
                    d = true
                }
                a = a + 2
            }
            sc.stats.addMap("player", "branches", 1);
            this.updateStats();
            d && sc.Model.notifyObserver(this,
                sc.PLAYER_MSG.SKILL_BRANCH_SWAP)
        },
        learnSkill: function(a, b) {
            if (!b) {
                var c = sc.skilltree.getSkill(a);
                ig.debug("LEARN SKILL: " + a + " [" + c.skillKey + "]");
                window.IG_GAME_DEBUG && sc.Debug.addLearnedSkill(a);
                var d = c.element,
                    c = c.getCPCost();
                if (c != void 0 && d != void 0) {
                    this.skillPoints[d] = this.skillPoints[d] - c;
                    sc.stats.addMap("player", "skillPoints", c);
                    sc.stats.addMap("player", "skillPoints" + d, c);
                    if (this.skillPoints[d] < 0) throw Error("Skillpoints can never be below zero!");
                }
            }
            this.skills[a] = sc.skilltree.skills[a];
            sc.stats.addMap("player",
                "skills", 1);
            this.skills[a].skillType ? sc.stats.addMap("player", "skillsActive", 1) : sc.stats.addMap("player", "skillsPassive", 1);
            this.updateStats();
            sc.Model.notifyObserver(this, sc.PLAYER_MSG.SKILL_CHANGED, a)
        },
        unlearnSkill: function(a) {
            a != void 0 && (this.skills[a] = null);
            sc.Model.notifyObserver(this, sc.PLAYER_MSG.SKILL_CHANGED)
        },
        hasSkill: function(a) {
            return this.skills[a]
        },
        hasSkillPoints: function(a) {
            a = sc.skilltree.getSkill(a);
            return this.skillPoints[a.element] - a.getCPCost() >= 0
        },
        hasSkillPointsByCp: function(a,
            b) {
            return this.skillPoints[b] - a >= 0
        },
        addSkillPoints: function(a, b, c, d) {
            if (c)
                for (b = this.skillPoints.length; b--;) {
                    this.skillPoints[b] = Math.min(this.skillPoints[b] + a, 200);
                    d && (this.skillPointsExtra[b] = (this.skillPointsExtra[b] || 0) + a)
                } else {
                    this.skillPoints[b] = Math.min(this.skillPoints[b] + a, 200);
                    d && (this.skillPointsExtra[b] = (this.skillPointsExtra[b] || 0) + a)
                }
            sc.Model.notifyObserver(this, sc.PLAYER_MSG.CP_CHANGE)
        },
        resetSkillTree: function(a) {
            if (!(a == void 0 || a < 0)) {
                for (var b = null, c = this.skills.length; c--;)(b = this.skills[c]) &&
                    b.element == a && (this.skills[c] = null);
                this.skillPoints[a] = this.getMaxSkillPoints(a);
                this.updateStats();
                sc.Model.notifyObserver(this, sc.PLAYER_MSG.SKILL_CHANGED)
            }
        },
        setSpLevel: function(a) {
            if (!(a < 0 || a >= sc.SP_LEVEL.length)) {
                this.spLevel = a;
                this.params.setMaxSp(sc.SP_LEVEL[a])
            }
        },
        addItem: function(a, c, d, e) {
            if (!(a < 0)) {
                this.items[a] = this.items[a] ? Math.min(this.items[a] + (c | 0), 99) : c | 0;
                this._addNewItem(a);
                sc.stats.addMap("items", "total", c);
                sc.stats.addMap("items", a, c);
                b.id = a;
                b.amount = c;
                b.skip = d;
                b.cutscene = e;
                sc.Model.notifyObserver(this,
                    sc.PLAYER_MSG.ITEM_OBTAINED, b)
            }
        },
        startItemConsume: function() {
            sc.Model.notifyObserver(this, sc.PLAYER_MSG.ITEM_CONSUME_START)
        },
        endItemConsume: function(a) {
            sc.Model.notifyObserver(this, sc.PLAYER_MSG.ITEM_CONSUME_END, a)
        },
        useItem: function(a) {
            if (!(a < 0)) {
                if (this.items[a]) {
                    this.itemBlockTimer = this.getItemBlockTime();
                    this.items[a] = this.items[a] - 1;
                    if (this.items[a] <= 0) {
                        this.isFavorite(a) && this.updateFavorite(a);
                        this._removeIDFromNewList(a)
                    }
                    sc.stats.addMap("items", "used", 1);
                    sc.stats.addMap("items", "used-" + a, 1);
                    sc.stats.setMap("items", "usedTotal", this.getTotalItemsUsed(true));
                    sc.Model.notifyObserver(this, sc.PLAYER_MSG.ITEM_USED, a);
                    return true
                }
                return false
            }
        },
        getItemBlockTime: function() {
            return sc.newgame.get("item-cd-zero") ? 0 : sc.newgame.get("item-cd-half") ? sc.ITEM_USE_TIMER / 2 : sc.newgame.get("item-cd-double") ? sc.ITEM_USE_TIMER * 2 : sc.ITEM_USE_TIMER
        },
        getTotalItemsUsed: function(a) {
            for (var b = sc.inventory.items.length, c = 0, d = 0; b--;) {
                var e = sc.inventory.getItem(b);
                if (!e.noTrack && !e.noCount && e.type == sc.ITEMS_TYPES.CONS) {
                    sc.stats.getMap("items",
                        "used-" + b) >= 1 && c++;
                    d++
                }
            }
            return a ? c / d : c
        },
        removeItem: function(a, c, d, e) {
            if (!(a < 0 || c <= 0)) {
                if (e && this.items[a] < c && sc.inventory.getItem(a).type == sc.ITEMS_TYPES.EQUIP) {
                    if (c - this.items[a] >= 2) {
                        a == this.equip.leftArm && this.setEquipment(sc.MENU_EQUIP_BODYPART.RIGHT_ARM, -1E3);
                        a == this.equip.rightArm && this.setEquipment(sc.MENU_EQUIP_BODYPART.LEFT_ARM, -1E3)
                    } else a == this.equip.rightArm ? this.setEquipment(sc.MENU_EQUIP_BODYPART.RIGHT_ARM, -1E3) : a == this.equip.leftArm && this.setEquipment(sc.MENU_EQUIP_BODYPART.LEFT_ARM,
                        -1E3);
                    a == this.equip.head && this.setEquipment(sc.MENU_EQUIP_BODYPART.HEAD, -1E3);
                    a == this.equip.torso && this.setEquipment(sc.MENU_EQUIP_BODYPART.TORSO, -1E3);
                    a == this.equip.feet && this.setEquipment(sc.MENU_EQUIP_BODYPART.FEET, -1E3)
                }
                if (this.items[a]) {
                    c = Math.min(this.items[a], c);
                    this.items[a] = this.items[a] - c;
                    if (this.items[a] <= 0) {
                        this._removeIDFromNewList(a);
                        this.isFavorite(a) && this.updateFavorite(a);
                        if (this.itemToggles[a] && this.itemToggles[a].state) {
                            this.itemToggles[a].state = false;
                            sc.Model.notifyObserver(this,
                                sc.PLAYER_MSG.ITEM_TOGGLED)
                        }
                    }
                    b.id = a;
                    b.amount = c;
                    d || sc.Model.notifyObserver(this, sc.PLAYER_MSG.ITEM_REMOVED, b);
                    return true
                }
                return false
            }
        },
        getItemAmount: function(a) {
            if (!(a < 0)) return this.items[a] || 0
        },
        hasItem: function(a) {
            return this.getItemAmount(a) > 0
        },
        getItemAmountWithEquip: function(a) {
            if (!(a < 0)) {
                var b = this.items[a] || 0,
                    c = sc.inventory.getItem(a);
                if (c.type == sc.ITEMS_TYPES.EQUIP) {
                    var d = -1,
                        e = -1;
                    switch (c.equipType) {
                        case sc.ITEMS_EQUIP_TYPES.HEAD:
                            d = this.equip.head;
                            break;
                        case sc.ITEMS_EQUIP_TYPES.ARM:
                            d = this.equip.leftArm;
                            e = this.equip.rightArm;
                            break;
                        case sc.ITEMS_EQUIP_TYPES.TORSO:
                            d = this.equip.torso;
                            break;
                        case sc.ITEMS_EQUIP_TYPES.FEET:
                            d = this.equip.feet
                    }
                    d >= 0 && d == a && b++;
                    e >= 0 && e == a && b++
                }
                return b
            }
        },
        toggleItem: function(a, b) {
            var c = sc.inventory.getItem(a);
            if (c && c.type == sc.ITEMS_TYPES.TOGGLE) {
                this.itemToggles[a] || (this.itemToggles[a] = {
                    state: false
                });
                this.itemToggles[a].state = !this.itemToggles[a].state
            }
            if (b && b.type == sc.TOGGLE_SET_TYPE.SINGLE)
                for (var c = b.items, d = c.length; d--;) c[d] != a && this.forceToggleState(c[d], false);
            sc.Model.notifyObserver(this,
                sc.PLAYER_MSG.ITEM_TOGGLED);
            ig.game.varsChangedDeferred();
            return this.itemToggles[a].state
        },
        getToggleSet: function(a) {
            for (var b in this.toggleSets) {
                var c = this.toggleSets[b];
                if (c.items.indexOf(a) != -1) return c
            }
            return null
        },
        forceToggleState: function(a, b) {
            this.itemToggles[a] || (this.itemToggles[a] = {
                state: false
            });
            this.itemToggles[a].state = b
        },
        getToggleItemState: function(a) {
            var b = sc.inventory.getItem(a);
            if (b && b.type == sc.ITEMS_TYPES.TOGGLE) return this.itemToggles[a] ? this.itemToggles[a].state : false;
            throw Error("Item ist not toggle type: " +
                a + " ( Type Found: " + b.type + ")");
        },
        hasAnySetItem: function(a) {
            for (var a = a.items, b = a.length; b--;)
                if (this.items[a[b]] >= 1) return true;
            return false
        },
        hasToggleSetCompleted: function(a) {
            for (var a = this.toggleSets[a].items, b = a.length; b--;)
                if (!this.hasItem(a[b])) return false;
            return true
        },
        hasAnyToggleItems: function() {
            for (var a = this.items.length; a--;)
                if (this.items[a] && sc.inventory.getItem(a).type == sc.ITEMS_TYPES.TOGGLE) return true;
            return false
        },
        getItemSubList: function(a, b, c) {
            if (!a) return [];
            for (var d = [], e = this.items.length,
                    f = null; e--;)
                if (this.items[e])(f = sc.inventory.getItem(e)) && f.type == a && d.push(e);
            b != void 0 && this.sortItemList(d, b, c);
            return d
        },
        getNewItemList: function() {
            return this.itemNew
        },
        getEquipSubList: function(a, b, c) {
            if (!a) return [];
            var d = [],
                e = this.items.length,
                f = null,
                g = -10,
                n = -10;
            if (b) switch (a) {
                case sc.ITEMS_EQUIP_TYPES.ARM:
                    g = this.equip.leftArm;
                    n = this.equip.rightArm;
                    break;
                case sc.ITEMS_EQUIP_TYPES.HEAD:
                    g = this.equip.head;
                    break;
                case sc.ITEMS_EQUIP_TYPES.TORSO:
                    g = this.equip.torso;
                    break;
                case sc.ITEMS_EQUIP_TYPES.FEET:
                    g =
                        this.equip.feet
            }
            for (; e--;) {
                if (b) {
                    if (e != g && e != n && !this.items[e]) continue
                } else if (!this.items[e]) continue;
                (f = sc.inventory.getItem(e)) && (f.type == sc.ITEMS_TYPES.EQUIP && f.equipType == a) && d.push(e)
            }
            c != void 0 && this.sortItemList(d, c);
            return d
        },
        sortItemList: function(a, b, c) {
            switch (b) {
                case sc.SORT_TYPE.ORDER:
                    c ? a.sort(this._sortOrderFavorite.bind(this)) : a.sort(this._sortOrder.bind(this));
                    break;
                case sc.SORT_TYPE.NAME:
                    a.sort(this._sortName.bind(this));
                    break;
                case sc.SORT_TYPE.AMOUNT:
                    a.sort(this._sortAmount.bind(this));
                    break;
                case sc.SORT_TYPE.RARITY:
                    a.sort(this._sortRarity.bind(this));
                    break;
                case sc.SORT_TYPE.LEVEL:
                    a.sort(this._sortLevel.bind(this));
                    break;
                case sc.SORT_TYPE.HP:
                    this._sortStat(a, "hp");
                    break;
                case sc.SORT_TYPE.ATTACK:
                    this._sortStat(a, "attack");
                    break;
                case sc.SORT_TYPE.DEFENSE:
                    this._sortStat(a, "defense");
                    break;
                case sc.SORT_TYPE.FOCUS:
                    this._sortStat(a, "focus")
            }
        },
        _addNewItem: function(a) {
            for (var b = this.itemNew.length; b--;)
                if (this.itemNew[b] == a) {
                    this.itemNew.splice(b, 1);
                    break
                } this.itemNew.splice(0, 0, a);
            if (this.itemNew.length >=
                22) this.itemNew.length = 22
        },
        _removeIDFromNewList: function(a) {
            for (var b = this.itemNew.length; b--;)
                if (this.itemNew[b] == a) {
                    this.itemNew.splice(b, 1);
                    break
                }
        },
        _sortOrderFavorite: function(b, c) {
            var e = sc.inventory;
            a = e.getItem(b).order || 0;
            d = e.getItem(c).order || 0;
            this.isFavorite(b) && (a = a - 1E6);
            this.isFavorite(c) && (d = d - 1E6);
            return a - d
        },
        _sortOrder: function(a, b) {
            var c = sc.inventory;
            return (c.getItem(a).order || 0) - (c.getItem(b).order || 0)
        },
        _sortName: function(b, c) {
            var e = sc.inventory;
            a = ig.LangLabel.getText(e.getItem(b).name);
            d = ig.LangLabel.getText(e.getItem(c).name);
            return a < d ? -1 : a > d ? 1 : 0
        },
        _sortAmount: function(a, b) {
            var c = sc.inventory;
            return this.items[a] == this.items[b] ? (c.getItem(a).order || 0) - (c.getItem(b).order || 0) : (this.items[a] || 0) - (this.items[b] || 0)
        },
        _sortRarity: function(b, c) {
            var e = sc.inventory;
            a = e.getItem(b);
            d = e.getItem(c);
            return a.rarity == d.rarity ? (a.order || 0) - (d.order || 0) : (a.rarity || 0) - (d.rarity || 0)
        },
        _sortLevel: function(b, c) {
            var e = sc.inventory;
            a = e.getItem(b);
            d = e.getItem(c);
            return a.level == d.level ? (a.order || 0) - (d.order ||
                0) : (d.level || 0) - (a.level || 0)
        },
        _sortStat: function(b, f) {
            b.sort(function(b, g) {
                var h = sc.inventory;
                a = h.getItem(b);
                d = h.getItem(g);
                if (!a.params) return -1;
                if (!d.params) return 1;
                if (!d.params || !d.params) return 0;
                c = a.params || {};
                e = d.params || {};
                return e[f] == c[f] ? (d.order || 0) - (a.order || 0) : (e[f] || 0) - (c[f] || 0)
            }.bind(this))
        },
        canAddFavorite: function() {
            return this.itemFavs.length < 12
        },
        isFavorite: function(a) {
            for (var b = this.itemFavs.length; b--;)
                if (this.itemFavs[b] == a) return true;
            return false
        },
        updateFavorite: function(a) {
            for (var b =
                    this.itemFavs.length; b--;)
                if (this.itemFavs[b] == a) {
                    this.itemFavs.splice(b, 1);
                    this.itemFavs.sort(this._sortOrder.bind(this));
                    sc.Model.notifyObserver(this, sc.PLAYER_MSG.ITEM_FAVORITES_CHANGED);
                    return false
                } this.itemFavs.push(a);
            this.itemFavs.sort(this._sortOrder.bind(this));
            sc.Model.notifyObserver(this, sc.PLAYER_MSG.ITEM_FAVORITES_CHANGED);
            return true
        },
        setEquipment: function(a, c) {
            var d = sc.PlayerLevelTools.equip(this.equip, a, c);
            if (c == d) return false;
            this.updateStats();
            if (c > 0) {
                this.items[c]--;
                this.items[c] <
                    0 && (this.items[c] = null);
                b.id = c;
                b.amount = -1;
                sc.Model.notifyObserver(this, sc.PLAYER_MSG.ITEM_EQUIP_UPDATE, b)
            }
            if (d && d > 0) {
                this.items[d] ? this.items[d]++ : this.items[d] = 1;
                b.id = d;
                b.amount = 1;
                sc.Model.notifyObserver(this, sc.PLAYER_MSG.ITEM_EQUIP_UPDATE, b)
            }
            b.unequip = c < 0;
            b.equipID = c;
            sc.Model.notifyObserver(this, sc.PLAYER_MSG.EQUIP_CHANGE, b);
            return true
        },
        isEquipped: function(a) {
            for (var b in this.equip)
                if (this.equip[b] != -1 && this.equip[b] == a) return true;
            return false
        },
        getAvgEquipLevel: function() {
            var a = sc.inventory.getItemLevel(this.equip.head),
                a = a + sc.inventory.getItemLevel(this.equip.leftArm),
                a = a + sc.inventory.getItemLevel(this.equip.rightArm),
                a = a + sc.inventory.getItemLevel(this.equip.torso),
                a = a + sc.inventory.getItemLevel(this.equip.feet);
            return a / 5
        },
        setCore: function(a, b) {
            this.core[a] = b;
            sc.Model.notifyObserver(this, sc.PLAYER_MSG.CORE_CHANGED)
        },
        setCoreAll: function(a) {
            for (var b in sc.PLAYER_CORE) this.core[sc.PLAYER_CORE[b]] = a ? true : false
        },
        getCore: function(a) {
            return this.core[a]
        },
        getCombatCooldownTime: function() {
            return sc.model.isCombatRankActive() &&
                !sc.model.isCutscene() ? 10 : 0
        },
        hasElement: function(a) {
            switch (a) {
                case sc.ELEMENT.NEUTRAL:
                    return this.core[sc.PLAYER_CORE.ELEMENT_NEUTRAL];
                case sc.ELEMENT.HEAT:
                    return this.core[sc.PLAYER_CORE.ELEMENT_HEAT];
                case sc.ELEMENT.COLD:
                    return this.core[sc.PLAYER_CORE.ELEMENT_COLD];
                case sc.ELEMENT.SHOCK:
                    return this.core[sc.PLAYER_CORE.ELEMENT_SHOCK];
                case sc.ELEMENT.WAVE:
                    return this.core[sc.PLAYER_CORE.ELEMENT_WAVE]
            }
            return false
        },
        setLevel: function(a, b) {
            this.level = a;
            sc.inventory.updateScaledEquipment(this.level);
            this.updateStats();
            if (!b) {
                this.resetSkillTree(sc.ELEMENT.NEUTRAL);
                this.resetSkillTree(sc.ELEMENT.HEAT);
                this.resetSkillTree(sc.ELEMENT.COLD);
                this.resetSkillTree(sc.ELEMENT.SHOCK);
                this.resetSkillTree(sc.ELEMENT.WAVE)
            }
            sc.Model.notifyObserver(this, sc.PLAYER_MSG.LEVEL_CHANGE, null)
        },
        addExperience: function(a, b, c, d, e) {
            if (!this.getCore(sc.PLAYER_CORE.EXP) || sc.newgame.get("disable-exp")) return 0;
            var f = sc.party.addExperience(a, b, c, d, e);
            if (this.level >= 99) return 0;
            var g = 0,
                a = a * f,
                g = d ? sc.PlayerLevelTools.computeExp(a,
                    this.level, b, void 0, void 0, e) : sc.PlayerLevelTools.computeExp(a, this.level, b, 1 + this.params.getModifier("XP_PLUS"), this.params.getModifier("XP_ZERO"), e),
                g = g + (c || 0);
            if (g == 0) return 0;
            this.exp = this.exp + g;
            sc.stats.addMap("player", "exp", g);
            if (this.exp >= 1E3) {
                a = Math.floor(this.exp / 1E3);
                this.level = Math.min(99, this.level + a);
                sc.stats.setMap("player", "level", this.level);
                this.addSkillPoints(a, null, true);
                this.exp = this.level >= 99 ? 0 : this.exp % 1E3;
                b = ig.copy(this.baseParams);
                sc.inventory.updateScaledEquipment(this.level);
                this.updateStats();
                this.addElementLoad(-1E3);
                for (var n in b) b[n] = this.baseParams[n] - b[n];
                b.level = a;
                b.cp = a;
                for (n in b) this.levelUpDelta[n] = this.levelUpDelta[n] + b[n];
                sc.Model.notifyObserver(this, sc.PLAYER_MSG.LEVEL_CHANGE, b)
            }
            sc.Model.notifyObserver(this, sc.PLAYER_MSG.EXP_CHANGE, g);
            return g
        },
        addCredit: function(a, b, c) {
            if (this.getCore(sc.PLAYER_CORE.CREDITS) && !sc.newgame.get("disable-money")) {
                c && (a = Math.round(a * (1 + this.params.getModifier("MONEY_PLUS"))));
                a = a * sc.newgame.getMoneyMultiplier();
                this.credit =
                    this.credit + a;
                if (this.credit >= 9999999) this.credit = 9999999;
                else if (this.credit < 0) this.credit = 0;
                sc.stats.addMap("player", "money", Math.max(a, 0));
                sc.stats.addMap("player", "moneyHold", this.credit);
                sc.Model.notifyObserver(this, sc.PLAYER_MSG.CREDIT_CHANGE, a)
            }
        },
        removeCredit: function(a, b) {
            this.credit = Math.max(this.credit - a, 0);
            b || sc.Model.notifyObserver(this, sc.PLAYER_MSG.CREDIT_CHANGE, -a)
        },
        getRawExpGain: function(a, b, c) {
            return sc.PlayerLevelTools.computeExp(a, this.level, b, void 0, void 0, c)
        },
        regenerate: function() {
            this.params.revive(1)
        },
        setElementMode: function(a, b, c) {
            if (!b && !this.core[sc.PLAYER_CORE.ELEMENT_CHANGE] || !b && !this.hasElement(a)) return false;
            if (!c && ig.game.playerEntity && this.currentElementMode != a) ig.game.playerEntity.switchedMode = true;
            this.currentElementMode = a;
            sc.stats.addMap("element", "used" + a, 1);
            this.params.setBaseParams(this.elementConfigs[a].baseParams);
            this.params.setModifiers(this.elementConfigs[this.currentElementMode].modifiers);
            sc.Model.notifyObserver(this, sc.PLAYER_MSG.ELEMENT_MODE_CHANGE);
            return true
        },
        scrollElementMode: function(a,
            b, c) {
            if (!b && !this.core[sc.PLAYER_CORE.ELEMENT_CHANGE] || this.elementScrollDelay) return false;
            for (var d = f.indexOf(this.currentElementMode) + a; d >= 0 && d <= f.length;) {
                var e = f[d];
                if (this.hasElement(e)) {
                    this.elementScrollDelay = 0;
                    return this.setElementMode(e, b, c)
                }
                d = d + a
            }
            return false
        },
        getCurrentElementMode: function() {
            return this.elementConfigs[this.currentElementMode]
        },
        getCombatArt: function(a, b) {
            return this.elementConfigs[a].getPlayerAction(b)
        },
        getCombatArtName: function(a) {
            return this.elementConfigs[this.currentElementMode].getActiveCombatArtName(a)
        },
        getActiveCombatArt: function(a, b) {
            return this.elementConfigs[a].getAction(b)
        },
        getAction: function(a) {
            return this.elementConfigs[this.currentElementMode].getAction(a) || this.baseConfig.getAction(a)
        },
        getActionByElement: function(a, b) {
            return this.elementConfigs[a].getAction(b) || this.baseConfig.getAction(b)
        },
        getBalls: function() {
            return this.config.proxies
        },
        getOptionFace: function() {
            return "DEFAULT"
        },
        updateStats: function() {
            if (this.elementConfigs[sc.ELEMENT.NEUTRAL]) {
                sc.PlayerLevelTools.computeBaseParams(this.baseParams,
                    this.stats, this.level);
                this.equipParams = ig.copy(this.baseParams);
                this.equipModifiers = {};
                sc.PlayerLevelTools.updateEquipStats(this.equip, this.equipParams, this.equipModifiers);
                for (var a in sc.ELEMENT) this.elementConfigs[sc.ELEMENT[a]].preSkillInit();
                for (var b = 0; b < this.skills.length; b++) this.skills[b] && this.skills[b].applyOnConfigs(this.elementConfigs);
                this.baseConfig.update(this.equipParams, this.equipModifiers);
                for (a in sc.ELEMENT) this.elementConfigs[sc.ELEMENT[a]].update(this.equipParams, this.equipModifiers);
                this.params.setBaseParams(this.elementConfigs[this.currentElementMode].baseParams);
                this.params.setModifiers(this.elementConfigs[this.currentElementMode].modifiers);
                sc.Model.notifyObserver(this, sc.PLAYER_MSG.STATS_CHANGED)
            }
        },
        getCombatArtLevel: function(a, b) {
            for (var c = 0, d = this.skills.length; d--;) this.skills[d] && this.skills[d].getCombatArtLevel && (c = Math.max(c, this.skills[d].getCombatArtLevel(a, b)));
            return c
        },
        getTopCombatArtElement: function(a) {
            var b = void 0,
                c = 0,
                d;
            for (d in sc.ELEMENT) {
                var e = sc.ELEMENT[d],
                    f = this.getCombatArtLevel(a, e);
                if (f > c) {
                    c = f;
                    b = e
                }
            }
            return b
        },
        hasLevelUp: function() {
            return this.levelUpDelta.level > 0
        },
        clearLevelUp: function() {
            for (var a in this.levelUpDelta) this.levelUpDelta[a] = 0
        },
        getParamAvg: function() {
            return (this.params.getStat("attack") + this.params.getStat("defense") + this.params.getStat("focus")) / 3
        },
        getParamAvgLevel: function(a) {
            return Math.min(99, sc.EnemyLevelScaling.getLevelForAverageStat(this.getParamAvg()) + (a || 0))
        },
        onVarAccess: function(a, b) {
            if (b[0] == "item") {
                var c = b[1];
                if (b[2] == "amount") return this.items[c] ||
                    0;
                if (b[2] == "name") return sc.inventory.getItemName(c);
                if (b[2] == "toggled") return this.getToggleItemState(c);
                if (b[2] == "amountEquipped") return this.getItemAmountWithEquip(c)
            } else if (b[0] == "equip") switch (b[1]) {
                case "head":
                    return this.equip.head;
                case "feet":
                    return this.equip.feet;
                case "leftArm":
                    return this.equip.leftArm;
                case "rightArm":
                    return this.equip.rightArm;
                case "torso":
                    return this.equip.torso
            } else if (b[0] == "player") switch (b[1]) {
                case "money":
                    return this.credit + "";
                case "level":
                    return this.level + "";
                case "hasLevelUp":
                    return this.hasLevelUp();
                case "exp":
                    return this.exp + "";
                case "element":
                    return this.currentElementMode + "";
                case "hasElement":
                    return this.hasElement(b[2] * 1);
                case "elementLoad":
                    return this.elementLoad + "";
                case "param":
                    return this.params.getStat(b[2]) + "";
                case "paramAvg":
                    return this.getParamAvg();
                case "paramElementFactor":
                    return this.params.getStat("elemFactor")[b[2]] + "";
                case "modifier":
                    return this.params.getModifier(b[2]) + "";
                case "hp":
                    return this.params.currentHp + "";
                case "sp":
                    return this.params.currentSp +
                        "";
                case "maxSp":
                    return this.params.maxSp + "";
                case "core":
                    return this.getCore(b[2]);
                case "artLevel":
                    return this.getCombatArtLevel(b[2] == "ANY" ? null : b[2]);
                case "itemsUsed":
                    return this.getTotalItemsUsed(true);
                case "hasAnyToggleItems":
                    return this.hasAnyToggleItems();
                case "hasToggleSetCompleted":
                    return this.hasToggleSetCompleted(b[2]);
                case "entity":
                    return ig.game.playerEntity && ig.vars.forwardEntityVarAccess(ig.game.playerEntity, b, 2)
            } else if (b[0] == "chapter") switch (b[1]) {
                case "current":
                    return this.chapter;
                case "name":
                    return this.chapters[b[2]] ? ig.LangLabel.getText(this.chapters[b[2]].name) : "No Title"
            }
            throw Error("Unsupported var access path: " + a);
        },
        usedSkillPoints: function() {
            for (var a = 0; a < this.skillPoints.length; ++a) {
                var b = this.getMaxSkillPoints(a);
                if (this.skillPoints[a] < b) return true
            }
            return false
        },
        getMaxSkillPoints: function(a) {
            var b = this.level - 1;
            return b = b + (this.skillPointsExtra[a] || 0)
        },
        getSaveData: function() {
            var a = {};
            a.playerConfig = this.config.name;
            a.credit = this.credit;
            a.level = this.level;
            a.exp = this.exp;
            a.currentElementMode = this.currentElementMode;
            a.elementLoad = this.elementLoad;
            a.hasOverload = this.hasOverload;
            a.hp = this.params.currentHp;
            a.core = ig.copy(this.core);
            a.skills = [];
            a.chapter = this.chapter || 0;
            for (var b = 0; b < this.skills.length; ++b) this.skills[b] && (a.skills[b] = true);
            a.skillPoints = ig.copy(this.skillPoints);
            a.skillPointsExtra = ig.copy(this.skillPointsExtra);
            a.items = ig.copy(this.items);
            a.equip = {
                head: this.equip.head,
                leftArm: this.equip.leftArm,
                rightArm: this.equip.rightArm,
                torso: this.equip.torso,
                feet: this.equip.feet
            };
            a.levelUpDelta = ig.copy(this.levelUpDelta);
            a.spLevel = this.spLevel;
            a.itemFavs = ig.copy(this.itemFavs);
            a.itemNew = ig.copy(this.itemNew);
            a.itemToggles = ig.copy(this.itemToggles);
            a.skillVersion = sc.skilltree.version;
            return a
        },
        preLoad: function(a) {
            this.clearLevelUp();
            this.itemFavs = a.itemFavs || [];
            this.itemNew = a.itemNew || [];
            this.itemToggles = a.itemToggles || {};
            for (var b = this.itemFavs.length; b--;) {
                var c = this.itemFavs[b];
                if (this.items[c] <= 0 || !sc.inventory.isConsumable(c)) {
                    this.itemFavs.length = 0;
                    break
                }
            }
            this.credit =
                Math.round(a.credit || 0);
            this.level = a.level || 1;
            this.exp = a.exp || 0;
            this.chapter = a.chapter || 0;
            this.currentElementMode = a.currentElementMode || 0;
            this.elementLoad = a.elementLoad || 0;
            this.hasOverload = a.hasOverload || false;
            this.params.reset();
            this.core = a.core;
            if (this.itemBlockTimer) {
                this.itemBlockTimer = 0;
                sc.Model.notifyObserver(this, sc.PLAYER_MSG.ITEM_BLOCK_FINISH)
            }
            if (a.levelUpDelta)
                for (var d in this.levelUpDelta) this.levelUpDelta[d] = a.levelUpDelta[d] || 0;
            for (var e in sc.PLAYER_CORE) {
                d = sc.PLAYER_CORE[e];
                this.core[d] ==
                    void 0 && (this.core[d] = true)
            }
            for (b = this.skills.length = 0; b < a.skills.length; ++b) a.skills[b] && (this.skills[b] = sc.skilltree.skills[b]);
            this.skillPoints = ig.copy(a.skillPoints);
            this.skillPointsExtra = ig.copy(a.skillPointsExtra) || [0, 0, 0, 0];
            this.items = ig.copy(a.items);
            if (a.equip.leftArm === void 0) {
                ig.log("Apply fix for outdated equipment structure");
                for (d in a.equip) a.equip[d] != -1 && a.equip[d] !== void 0 && this.items[a.equip[d]]++;
                this.equip.head = this.equip.feet = this.equip.leftArm = this.equip.rightArm = this.equip.torso = -1
            } else {
                this.equip.head = a.equip.head;
                this.equip.feet = a.equip.feet;
                this.equip.leftArm = a.equip.leftArm;
                this.equip.rightArm = a.equip.rightArm;
                this.equip.torso = a.equip.torso
            }
            if (this.checkBodyPart(this.equip.head)) this.equip.head = -1;
            if (this.checkBodyPart(this.equip.feet)) this.equip.feet = -1;
            if (this.checkBodyPart(this.equip.leftArm)) this.equip.leftArm = -1;
            if (this.checkBodyPart(this.equip.rightArm)) this.equip.rightArm = -1;
            if (this.checkBodyPart(this.equip.torso)) this.equip.torso = -1;
            this.setSpLevel(a.spLevel ||
                0);
            sc.inventory.updateScaledEquipment(this.level);
            this.updateStats();
            this.updateChapter(true);
            if (a.playerConfig) this.loadedConfig = new sc.PlayerConfig(a.playerConfig);
            this.params.currentHp = Math.min(a.hp || this.params.getStat("hp"), this.params.getStat("hp"));
            if (a.skillVersion != sc.skilltree.version && this.usedSkillPoints()) {
                this.resetSkillTree(sc.ELEMENT.NEUTRAL);
                this.resetSkillTree(sc.ELEMENT.HEAT);
                this.resetSkillTree(sc.ELEMENT.COLD);
                this.resetSkillTree(sc.ELEMENT.SHOCK);
                this.resetSkillTree(sc.ELEMENT.WAVE);
                ig.game.addTeleportMessage(ig.lang.get("sc.gui.loading.skillUpdate"))
            }
            for (b = this.itemNew.length; b--;) this.items[this.itemNew[b]] <= 0 && !this.isEquipped(this.itemNew[b]) && this.itemNew.splice(b, 1);
            sc.stats.setMap("items", "usedTotal", this.getTotalItemsUsed(true));
            sc.Model.notifyObserver(this, sc.PLAYER_MSG.SET_PARAMS)
        },
        checkBodyPart: function(a) {
            if (a < 0) return false;
            if (sc.inventory.getItem(a).type != sc.ITEMS_TYPES.EQUIP) {
                this.items[a]++;
                return true
            }
            return false
        },
        postLoad: function() {
            if (this.loadedConfig) {
                this.setConfig(this.loadedConfig);
                this.loadedConfig.decreaseRef();
                this.loadedConfig = null
            }
        }
    })
});
ig.baked = !0;

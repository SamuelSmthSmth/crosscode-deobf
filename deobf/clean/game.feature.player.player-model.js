/**
 * game.feature.player.player-model
 * ================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.player.player-model")`.
 *
 * The central player state model (`sc.PlayerModel`): items, equipment,
 * favorites, skill trees, elements, credits, EXP/leveling, element load /
 * overload, and save-data handling. Communicates with the UI through
 * `sc.Model.notifyObserver` using the `sc.PLAYER_MSG` codes below, and
 * exposes the `item` / `equip` / `player` / `chapter` variable paths via
 * `ig.vars.registerVarAccessor`.
 */
ig.module("game.feature.player.player-model").requires(
    "game.feature.model.base-model",
    "game.feature.combat.model.combat-params",
    "game.feature.combat.entities.ball",
    "game.feature.player.player-config",
    "game.feature.achievements.stats-model",
    "game.feature.player.player-level",
    "game.feature.inventory.inventory"
).defines(function () {

    /** Reusable notification payload for item-obtained/removed/equip events. */
    var ITEM_MSG = {
            id: 0,
            equipID: 0,
            amount: 0,
            skip: false,
            unequip: false
        },
        scratchItemA = null,
        scratchItemB = null,
        scratchParamsA,
        scratchParamsB,
        ELEMENT_SCROLL_ORDER = [0, 2, 3, 1, 4];

    /** Cooldown (in seconds) between item uses; configurable via newgame flags. */
    sc.ITEM_USE_TIMER = 10;
    sc.ITEM_MAX_FAVS = 12;

    /** Notification codes emitted via sc.Model.notifyObserver. */
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

    /** Unlockable player abilities; each gates a feature (movement, elements, ...). */
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

    /** Element-load cost of each combat action (indexed by sc.PLAYER_ACTION). */
    var ACTION_HEAT = [];
    ACTION_HEAT[sc.PLAYER_ACTION.THROW_NORMAL] = 1;
    ACTION_HEAT[sc.PLAYER_ACTION.THROW_NORMAL_REV] = 1;
    ACTION_HEAT[sc.PLAYER_ACTION.THROW_NORMAL_CHARGED] = 3;
    ACTION_HEAT[sc.PLAYER_ACTION.THROW_NORMAL_CHARGED_REV] = 3;
    ACTION_HEAT[sc.PLAYER_ACTION.ATTACK] =
        1;
    ACTION_HEAT[sc.PLAYER_ACTION.ATTACK_REV] = 1;
    ACTION_HEAT[sc.PLAYER_ACTION.ATTACK_FINISHER] = 2;
    ACTION_HEAT[sc.PLAYER_ACTION.THROW_SPECIAL1] = 4;
    ACTION_HEAT[sc.PLAYER_ACTION.THROW_SPECIAL2] = 6;
    ACTION_HEAT[sc.PLAYER_ACTION.THROW_SPECIAL3] = 12;
    ACTION_HEAT[sc.PLAYER_ACTION.ATTACK_SPECIAL1] = 4;
    ACTION_HEAT[sc.PLAYER_ACTION.ATTACK_SPECIAL2] = 6;
    ACTION_HEAT[sc.PLAYER_ACTION.ATTACK_SPECIAL3] = 12;

    /** Global player state: inventory, equipment, skills, elements, save data. */
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

        init: function () {
            this.params = new sc.CombatParams;
            this.setSpLevel(2);
            for (var core in sc.PLAYER_CORE) this.core[sc.PLAYER_CORE[core]] = true;
            for (var element in sc.ELEMENT) {
                this.skillPoints[sc.ELEMENT[element]] = 0;
                this.skillPointsExtra[sc.ELEMENT[element]] = 0
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

        setConfig: function (config) {
            this.config && this.config.decreaseRef();
            this.config = config;
            this.config.increaseRef();
            this.name = config.name;
            this.character = config.character;
            this.defaultExpression && this.defaultExpression.decreaseRef();
            this.defaultExpression = new sc.CharacterExpression(config.character.name, "DEFAULT");
            this.animSheet = config.animSheet;
            this.stats = config.stats;
            this.baseConfig = config.baseConfig;
            this.elementConfigs =
                config.elementConfigs;
            this.updateStats();
            sc.Model.notifyObserver(this, sc.PLAYER_MSG.CONFIG_CHANGED)
        },

        /** Unlock the lore entries of every chapter reached so far (story category). */
        updateChapter: function (silent) {
            for (var plotLine = ig.vars.get("plot.line"), chapterIndex = this.chapters.length; chapterIndex--;)
                if (plotLine >= this.chapters[chapterIndex].plotline) {
                    this.chapter = chapterIndex;
                    break
                }
            var storyLore = sc.lore.getCategoryList(sc.LORE_CATERGORIES.STORY, sc.LORE_SORT_TYPE.ORDER);
            for (chapterIndex = 0; chapterIndex < this.chapter + 1; chapterIndex++) silent ? sc.lore.unlockLore(storyLore[chapterIndex], false, true, !sc.lore.isLoreUnlocked(storyLore[chapterIndex])) : sc.lore.isLoreUnlocked(storyLore[chapterIndex]) || sc.lore.unlockLore(storyLore[chapterIndex], true)
        },

        reset: function () {
            for (var core in sc.PLAYER_CORE) this.core[sc.PLAYER_CORE[core]] =
                true;
            for (var element in sc.ELEMENT) {
                this.skillPoints[sc.ELEMENT[element]] = 0;
                this.skillPointsExtra[sc.ELEMENT[element]] = 0
            }
            this.level = 1;
            this.exp = 0;
            this.clearLevelUp();
            this.setSpLevel(1);
            this.params.reset(sc.SP_LEVEL[2]);
            this.spLevel = 2;
            for (element in this.equip) this.equip[element] = -1;
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

        /** Per-tick element-load drain and item-block countdown. */
        updateLoop: function (inCombat) {
            this.elementLoadTimer = this.elementLoadTimer + ig.system.ingameTick;
            if (ig.game.firstUpdateLoop) {
                sc.stats.addMap("element", "time" + this.currentElementMode, ig.system.rawTick);
                sc.model.isAssistMode() && sc.stats.addMap("player", "assistTime", ig.system.rawTick)
            }
            if (this.elementScrollDelay) {
                this.elementScrollDelay = this.elementScrollDelay - ig.system.actualTick;
                if (this.elementScrollDelay < 0) this.elementScrollDelay = 0
            }
            var drain = 0;
            this.elementLoadTimer >
                1 && (drain = 1);
            inCombat || (drain = drain * 8);
            !this.hasOverload && !this.currentElementMode && (drain = drain * 3);
            this.hasOverload && (drain = drain * 4);
            drain && this.elementLoad > 0 && this.addElementLoad(-drain * ig.system.ingameTick);
            if (this.itemBlockTimer > 0) {
                this.itemBlockTimer = sc.combat.isInCombat(ig.game.playerEntity) ? this.itemBlockTimer - ig.system.ingameTick : this.itemBlockTimer - ig.system.ingameTick * 10;
                if (this.itemBlockTimer <= 0) {
                    this.itemBlockTimer = 0;
                    sc.Model.notifyObserver(this, sc.PLAYER_MSG.ITEM_BLOCK_FINISH)
                }
            }
        },

        addElementLoad: function (amount) {
            if (this.core[sc.PLAYER_CORE.ELEMENT_LOAD] &&
                !(sc.newgame.get("overload-disable") && amount >= 0)) {
                var maxLoad = 50 * (1 + this.params.getModifier("OVERHEAT_REDUCTION"));
                this.elementLoad = this.elementLoad + amount / maxLoad;
                if (this.elementLoad < 0) {
                    this.hasOverload = false;
                    this.elementLoad = 0
                } else if (this.elementLoad >= 1) {
                    this.enterElementalOverload();
                    this.elementLoad = 1
                }
            }
        },

        setElementLoad: function (load) {
            this.elementLoad = load;
            if (load < 1 && this.hasOverload) this.hasOverload = false;
            else if (load >= 1 && !this.hasOverload) {
                this.enterElementalOverload();
                this.elementLoad = 1
            }
        },

        enterElementalOverload: function () {
            if (!this.hasOverload) {
                sc.stats.addMap("element",
                    "overload", 1);
                sc.arena.onElementOverload();
                sc.combat.doDramaticEffect(ig.game.playerEntity, ig.game.playerEntity, sc.DRAMATIC_EFFECT.OVERLOAD);
                var overloadText = ig.lang.get("sc.gui.combat.element-overload"),
                    overloadBox = new sc.SmallEntityBox(ig.game.playerEntity, overloadText, 1);
                ig.gui.addGuiElement(overloadBox);
                this.hasOverload = true;
                this.setElementMode(sc.ELEMENT.NEUTRAL, true)
            }
        },

        /** Neutral-mode hits reduce element load by the hit's offensive*defensive factor. */
        onTargetHit: function (attacker, target, hitData) {
            this.currentElementMode == sc.ELEMENT.NEUTRAL && this.addElementLoad(-(hitData.offensiveFactor * hitData.defensiveFactor))
        },

        increaseActionHeat: function (action) {
            if (this.currentElementMode !=
                sc.ELEMENT.NEUTRAL)
                if (action = ACTION_HEAT[action]) {
                    this.addElementLoad(action);
                    this.elementLoadTimer = 0
                }
        },

        getCharacterName: function () {
            return this.character && ig.LangLabel.getText(this.character.data.name) || "???"
        },

        /** Swap the active combat-art branch of a skill line (step 2 through the line). */
        switchBranch: function (skill, forward, targetSkill) {
            for (var switched = false, direction = forward ? 1 : -1, step = 3, targetSkill = targetSkill != void 0 ? targetSkill : -1; step--;) {
                if (targetSkill == skill) {
                    this.learnSkill(targetSkill);
                    switched = true;
                    break
                }
                if (this.skills[skill + direction]) {
                    this.skills[skill + direction] = null;
                    this.skills[skill] = sc.skilltree.skills[skill];
                    ig.debug("SWITCH SKILL: " + skill);
                    switched = true
                }
                skill = skill + 2
            }
            sc.stats.addMap("player", "branches", 1);
            this.updateStats();
            switched && sc.Model.notifyObserver(this,
                sc.PLAYER_MSG.SKILL_BRANCH_SWAP)
        },

        learnSkill: function (skill, skipCost) {
            if (!skipCost) {
                var skillData = sc.skilltree.getSkill(skill);
                ig.debug("LEARN SKILL: " + skill + " [" + skillData.skillKey + "]");
                window.IG_GAME_DEBUG && sc.Debug.addLearnedSkill(skill);
                var element = skillData.element,
                    cost = skillData.getCPCost();
                if (cost != void 0 && element != void 0) {
                    this.skillPoints[element] = this.skillPoints[element] - cost;
                    sc.stats.addMap("player", "skillPoints", cost);
                    sc.stats.addMap("player", "skillPoints" + element, cost);
                    if (this.skillPoints[element] < 0) throw Error("Skillpoints can never be below zero!");
                }
            }
            this.skills[skill] = sc.skilltree.skills[skill];
            sc.stats.addMap("player",
                "skills", 1);
            this.skills[skill].skillType ? sc.stats.addMap("player", "skillsActive", 1) : sc.stats.addMap("player", "skillsPassive", 1);
            this.updateStats();
            sc.Model.notifyObserver(this, sc.PLAYER_MSG.SKILL_CHANGED, skill)
        },

        unlearnSkill: function (skill) {
            skill != void 0 && (this.skills[skill] = null);
            sc.Model.notifyObserver(this, sc.PLAYER_MSG.SKILL_CHANGED)
        },

        hasSkill: function (skill) {
            return this.skills[skill]
        },

        hasSkillPoints: function (skill) {
            skill = sc.skilltree.getSkill(skill);
            return this.skillPoints[skill.element] - skill.getCPCost() >= 0
        },

        hasSkillPointsByCp: function (cost,
            element) {
            return this.skillPoints[element] - cost >= 0
        },

        addSkillPoints: function (amount, element, all, extra) {
            if (all)
                for (element = this.skillPoints.length; element--;) {
                    this.skillPoints[element] = Math.min(this.skillPoints[element] + amount, 200);
                    extra && (this.skillPointsExtra[element] = (this.skillPointsExtra[element] || 0) + amount)
                } else {
                    this.skillPoints[element] = Math.min(this.skillPoints[element] + amount, 200);
                    extra && (this.skillPointsExtra[element] = (this.skillPointsExtra[element] || 0) + amount)
                }
            sc.Model.notifyObserver(this, sc.PLAYER_MSG.CP_CHANGE)
        },

        resetSkillTree: function (element) {
            if (!(element == void 0 || element < 0)) {
                for (var skill = null, index = this.skills.length; index--;)(skill = this.skills[index]) &&
                    skill.element == element && (this.skills[index] = null);
                this.skillPoints[element] = this.getMaxSkillPoints(element);
                this.updateStats();
                sc.Model.notifyObserver(this, sc.PLAYER_MSG.SKILL_CHANGED)
            }
        },

        setSpLevel: function (level) {
            if (!(level < 0 || level >= sc.SP_LEVEL.length)) {
                this.spLevel = level;
                this.params.setMaxSp(sc.SP_LEVEL[level])
            }
        },

        addItem: function (itemId, amount, skip, cutscene) {
            if (!(itemId < 0)) {
                this.items[itemId] = this.items[itemId] ? Math.min(this.items[itemId] + (amount | 0), 99) : amount | 0;
                this._addNewItem(itemId);
                sc.stats.addMap("items", "total", amount);
                sc.stats.addMap("items", itemId, amount);
                ITEM_MSG.id = itemId;
                ITEM_MSG.amount = amount;
                ITEM_MSG.skip = skip;
                ITEM_MSG.cutscene = cutscene;
                sc.Model.notifyObserver(this,
                    sc.PLAYER_MSG.ITEM_OBTAINED, ITEM_MSG)
            }
        },

        startItemConsume: function () {
            sc.Model.notifyObserver(this, sc.PLAYER_MSG.ITEM_CONSUME_START)
        },

        endItemConsume: function (result) {
            sc.Model.notifyObserver(this, sc.PLAYER_MSG.ITEM_CONSUME_END, result)
        },

        useItem: function (itemId) {
            if (!(itemId < 0)) {
                if (this.items[itemId]) {
                    this.itemBlockTimer = this.getItemBlockTime();
                    this.items[itemId] = this.items[itemId] - 1;
                    if (this.items[itemId] <= 0) {
                        this.isFavorite(itemId) && this.updateFavorite(itemId);
                        this._removeIDFromNewList(itemId)
                    }
                    sc.stats.addMap("items", "used", 1);
                    sc.stats.addMap("items", "used-" + itemId, 1);
                    sc.stats.setMap("items", "usedTotal", this.getTotalItemsUsed(true));
                    sc.Model.notifyObserver(this, sc.PLAYER_MSG.ITEM_USED, itemId);
                    return true
                }
                return false
            }
        },

        getItemBlockTime: function () {
            return sc.newgame.get("item-cd-zero") ? 0 : sc.newgame.get("item-cd-half") ? sc.ITEM_USE_TIMER / 2 : sc.newgame.get("item-cd-double") ? sc.ITEM_USE_TIMER * 2 : sc.ITEM_USE_TIMER
        },

        /** Share of distinct consumables ever used (ratio=true) or the plain count. */
        getTotalItemsUsed: function (ratio) {
            for (var index = sc.inventory.items.length, used = 0, total = 0; index--;) {
                var item = sc.inventory.getItem(index);
                if (!item.noTrack && !item.noCount && item.type == sc.ITEMS_TYPES.CONS) {
                    sc.stats.getMap("items",
                        "used-" + index) >= 1 && used++;
                    total++
                }
            }
            return ratio ? used / total : used
        },

        removeItem: function (itemId, amount, silent, forceUnequip) {
            if (!(itemId < 0 || amount <= 0)) {
                if (forceUnequip && this.items[itemId] < amount && sc.inventory.getItem(itemId).type == sc.ITEMS_TYPES.EQUIP) {
                    if (amount - this.items[itemId] >= 2) {
                        itemId == this.equip.leftArm && this.setEquipment(sc.MENU_EQUIP_BODYPART.RIGHT_ARM, -1E3);
                        itemId == this.equip.rightArm && this.setEquipment(sc.MENU_EQUIP_BODYPART.LEFT_ARM, -1E3)
                    } else itemId == this.equip.rightArm ? this.setEquipment(sc.MENU_EQUIP_BODYPART.RIGHT_ARM, -1E3) : itemId == this.equip.leftArm && this.setEquipment(sc.MENU_EQUIP_BODYPART.LEFT_ARM,
                        -1E3);
                    itemId == this.equip.head && this.setEquipment(sc.MENU_EQUIP_BODYPART.HEAD, -1E3);
                    itemId == this.equip.torso && this.setEquipment(sc.MENU_EQUIP_BODYPART.TORSO, -1E3);
                    itemId == this.equip.feet && this.setEquipment(sc.MENU_EQUIP_BODYPART.FEET, -1E3)
                }
                if (this.items[itemId]) {
                    amount = Math.min(this.items[itemId], amount);
                    this.items[itemId] = this.items[itemId] - amount;
                    if (this.items[itemId] <= 0) {
                        this._removeIDFromNewList(itemId);
                        this.isFavorite(itemId) && this.updateFavorite(itemId);
                        if (this.itemToggles[itemId] && this.itemToggles[itemId].state) {
                            this.itemToggles[itemId].state = false;
                            sc.Model.notifyObserver(this,
                                sc.PLAYER_MSG.ITEM_TOGGLED)
                        }
                    }
                    ITEM_MSG.id = itemId;
                    ITEM_MSG.amount = amount;
                    silent || sc.Model.notifyObserver(this, sc.PLAYER_MSG.ITEM_REMOVED, ITEM_MSG);
                    return true
                }
                return false
            }
        },

        getItemAmount: function (itemId) {
            if (!(itemId < 0)) return this.items[itemId] || 0
        },

        hasItem: function (itemId) {
            return this.getItemAmount(itemId) > 0
        },

        /** Owned + equipped copies of an item (equipped gear counts once per slot). */
        getItemAmountWithEquip: function (itemId) {
            if (!(itemId < 0)) {
                var amount = this.items[itemId] || 0,
                    item = sc.inventory.getItem(itemId);
                if (item.type == sc.ITEMS_TYPES.EQUIP) {
                    var left = -1,
                        right = -1;
                    switch (item.equipType) {
                        case sc.ITEMS_EQUIP_TYPES.HEAD:
                            left = this.equip.head;
                            break;
                        case sc.ITEMS_EQUIP_TYPES.ARM:
                            left = this.equip.leftArm;
                            right = this.equip.rightArm;
                            break;
                        case sc.ITEMS_EQUIP_TYPES.TORSO:
                            left = this.equip.torso;
                            break;
                        case sc.ITEMS_EQUIP_TYPES.FEET:
                            left = this.equip.feet
                    }
                    left >= 0 && left == itemId && amount++;
                    right >= 0 && right == itemId && amount++
                }
                return amount
            }
        },

        toggleItem: function (itemId, set) {
            var item = sc.inventory.getItem(itemId);
            if (item && item.type == sc.ITEMS_TYPES.TOGGLE) {
                this.itemToggles[itemId] || (this.itemToggles[itemId] = {
                    state: false
                });
                this.itemToggles[itemId].state = !this.itemToggles[itemId].state
            }
            if (set && set.type == sc.TOGGLE_SET_TYPE.SINGLE)
                for (var setItems = set.items, index = setItems.length; index--;) setItems[index] != itemId && this.forceToggleState(setItems[index], false);
            sc.Model.notifyObserver(this,
                sc.PLAYER_MSG.ITEM_TOGGLED);
            ig.game.varsChangedDeferred();
            return this.itemToggles[itemId].state
        },

        getToggleSet: function (itemId) {
            for (var key in this.toggleSets) {
                var set = this.toggleSets[key];
                if (set.items.indexOf(itemId) != -1) return set
            }
            return null
        },

        forceToggleState: function (itemId, state) {
            this.itemToggles[itemId] || (this.itemToggles[itemId] = {
                state: false
            });
            this.itemToggles[itemId].state = state
        },

        getToggleItemState: function (itemId) {
            var item = sc.inventory.getItem(itemId);
            if (item && item.type == sc.ITEMS_TYPES.TOGGLE) return this.itemToggles[itemId] ? this.itemToggles[itemId].state : false;
            throw Error("Item ist not toggle type: " +
                itemId + " ( Type Found: " + item.type + ")");
        },

        hasAnySetItem: function (set) {
            for (var setItems = set.items, index = setItems.length; index--;)
                if (this.items[setItems[index]] >= 1) return true;
            return false
        },

        hasToggleSetCompleted: function (setIndex) {
            for (var setItems = this.toggleSets[setIndex].items, index = setItems.length; index--;)
                if (!this.hasItem(setItems[index])) return false;
            return true
        },

        hasAnyToggleItems: function () {
            for (var index = this.items.length; index--;)
                if (this.items[index] && sc.inventory.getItem(index).type == sc.ITEMS_TYPES.TOGGLE) return true;
            return false
        },

        getItemSubList: function (type, sortType, favoritesFirst) {
            if (!type) return [];
            for (var list = [], index = this.items.length,
                    item = null; index--;)
                if (this.items[index])(item = sc.inventory.getItem(index)) && item.type == type && list.push(index);
            sortType != void 0 && this.sortItemList(list, sortType, favoritesFirst);
            return list
        },

        getNewItemList: function () {
            return this.itemNew
        },

        getEquipSubList: function (equipType, includeEquipped, sortType) {
            if (!equipType) return [];
            var list = [],
                index = this.items.length,
                item = null,
                equippedLeft = -10,
                equippedRight = -10;
            if (includeEquipped) switch (equipType) {
                case sc.ITEMS_EQUIP_TYPES.ARM:
                    equippedLeft = this.equip.leftArm;
                    equippedRight = this.equip.rightArm;
                    break;
                case sc.ITEMS_EQUIP_TYPES.HEAD:
                    equippedLeft = this.equip.head;
                    break;
                case sc.ITEMS_EQUIP_TYPES.TORSO:
                    equippedLeft = this.equip.torso;
                    break;
                case sc.ITEMS_EQUIP_TYPES.FEET:
                    equippedLeft =
                        this.equip.feet
            }
            for (; index--;) {
                if (includeEquipped) {
                    if (index != equippedLeft && index != equippedRight && !this.items[index]) continue
                } else if (!this.items[index]) continue;
                (item = sc.inventory.getItem(index)) && (item.type == sc.ITEMS_TYPES.EQUIP && item.equipType == equipType) && list.push(index)
            }
            sortType != void 0 && this.sortItemList(list, sortType);
            return list
        },

        sortItemList: function (list, sortType, favoritesFirst) {
            switch (sortType) {
                case sc.SORT_TYPE.ORDER:
                    favoritesFirst ? list.sort(this._sortOrderFavorite.bind(this)) : list.sort(this._sortOrder.bind(this));
                    break;
                case sc.SORT_TYPE.NAME:
                    list.sort(this._sortName.bind(this));
                    break;
                case sc.SORT_TYPE.AMOUNT:
                    list.sort(this._sortAmount.bind(this));
                    break;
                case sc.SORT_TYPE.RARITY:
                    list.sort(this._sortRarity.bind(this));
                    break;
                case sc.SORT_TYPE.LEVEL:
                    list.sort(this._sortLevel.bind(this));
                    break;
                case sc.SORT_TYPE.HP:
                    this._sortStat(list, "hp");
                    break;
                case sc.SORT_TYPE.ATTACK:
                    this._sortStat(list, "attack");
                    break;
                case sc.SORT_TYPE.DEFENSE:
                    this._sortStat(list, "defense");
                    break;
                case sc.SORT_TYPE.FOCUS:
                    this._sortStat(list, "focus")
            }
        },

        _addNewItem: function (itemId) {
            for (var index = this.itemNew.length; index--;)
                if (this.itemNew[index] == itemId) {
                    this.itemNew.splice(index, 1);
                    break
                } this.itemNew.splice(0, 0, itemId);
            if (this.itemNew.length >=
                22) this.itemNew.length = 22
        },

        _removeIDFromNewList: function (itemId) {
            for (var index = this.itemNew.length; index--;)
                if (this.itemNew[index] == itemId) {
                    this.itemNew.splice(index, 1);
                    break
                }
        },

        _sortOrderFavorite: function (itemA, itemB) {
            var inventory = sc.inventory;
            scratchItemA = inventory.getItem(itemA).order || 0;
            scratchItemB = inventory.getItem(itemB).order || 0;
            this.isFavorite(itemA) && (scratchItemA = scratchItemA - 1E6);
            this.isFavorite(itemB) && (scratchItemB = scratchItemB - 1E6);
            return scratchItemA - scratchItemB
        },

        _sortOrder: function (itemA, itemB) {
            var inventory = sc.inventory;
            return (inventory.getItem(itemA).order || 0) - (inventory.getItem(itemB).order || 0)
        },

        _sortName: function (itemA, itemB) {
            var inventory = sc.inventory;
            scratchItemA = ig.LangLabel.getText(inventory.getItem(itemA).name);
            scratchItemB = ig.LangLabel.getText(inventory.getItem(itemB).name);
            return scratchItemA < scratchItemB ? -1 : scratchItemA > scratchItemB ? 1 : 0
        },

        _sortAmount: function (itemA, itemB) {
            var inventory = sc.inventory;
            return this.items[itemA] == this.items[itemB] ? (inventory.getItem(itemA).order || 0) - (inventory.getItem(itemB).order || 0) : (this.items[itemA] || 0) - (this.items[itemB] || 0)
        },

        _sortRarity: function (itemA, itemB) {
            var inventory = sc.inventory;
            scratchItemA = inventory.getItem(itemA);
            scratchItemB = inventory.getItem(itemB);
            return scratchItemA.rarity == scratchItemB.rarity ? (scratchItemA.order || 0) - (scratchItemB.order || 0) : (scratchItemA.rarity || 0) - (scratchItemB.rarity || 0)
        },

        _sortLevel: function (itemA, itemB) {
            var inventory = sc.inventory;
            scratchItemA = inventory.getItem(itemA);
            scratchItemB = inventory.getItem(itemB);
            return scratchItemA.level == scratchItemB.level ? (scratchItemA.order || 0) - (scratchItemB.order ||
                0) : (scratchItemB.level || 0) - (scratchItemA.level || 0)
        },

        _sortStat: function (list, stat) {
            list.sort(function (itemA, itemB) {
                var inventory = sc.inventory;
                scratchItemA = inventory.getItem(itemA);
                scratchItemB = inventory.getItem(itemB);
                if (!scratchItemA.params) return -1;
                if (!scratchItemB.params) return 1;
                if (!scratchItemB.params || !scratchItemB.params) return 0;
                scratchParamsA = scratchItemA.params || {};
                scratchParamsB = scratchItemB.params || {};
                return scratchParamsB[stat] == scratchParamsA[stat] ? (scratchItemB.order || 0) - (scratchItemA.order || 0) : (scratchParamsB[stat] || 0) - (scratchParamsA[stat] || 0)
            }.bind(this))
        },

        canAddFavorite: function () {
            return this.itemFavs.length < 12
        },

        isFavorite: function (itemId) {
            for (var index = this.itemFavs.length; index--;)
                if (this.itemFavs[index] == itemId) return true;
            return false
        },

        updateFavorite: function (itemId) {
            for (var index =
                    this.itemFavs.length; index--;)
                if (this.itemFavs[index] == itemId) {
                    this.itemFavs.splice(index, 1);
                    this.itemFavs.sort(this._sortOrder.bind(this));
                    sc.Model.notifyObserver(this, sc.PLAYER_MSG.ITEM_FAVORITES_CHANGED);
                    return false
                } this.itemFavs.push(itemId);
            this.itemFavs.sort(this._sortOrder.bind(this));
            sc.Model.notifyObserver(this, sc.PLAYER_MSG.ITEM_FAVORITES_CHANGED);
            return true
        },

        setEquipment: function (bodypart, itemId) {
            var oldItem = sc.PlayerLevelTools.equip(this.equip, bodypart, itemId);
            if (itemId == oldItem) return false;
            this.updateStats();
            if (itemId > 0) {
                this.items[itemId]--;
                this.items[itemId] <
                    0 && (this.items[itemId] = null);
                ITEM_MSG.id = itemId;
                ITEM_MSG.amount = -1;
                sc.Model.notifyObserver(this, sc.PLAYER_MSG.ITEM_EQUIP_UPDATE, ITEM_MSG)
            }
            if (oldItem && oldItem > 0) {
                this.items[oldItem] ? this.items[oldItem]++ : this.items[oldItem] = 1;
                ITEM_MSG.id = oldItem;
                ITEM_MSG.amount = 1;
                sc.Model.notifyObserver(this, sc.PLAYER_MSG.ITEM_EQUIP_UPDATE, ITEM_MSG)
            }
            ITEM_MSG.unequip = itemId < 0;
            ITEM_MSG.equipID = itemId;
            sc.Model.notifyObserver(this, sc.PLAYER_MSG.EQUIP_CHANGE, ITEM_MSG);
            return true
        },

        isEquipped: function (itemId) {
            for (var bodypart in this.equip)
                if (this.equip[bodypart] != -1 && this.equip[bodypart] == itemId) return true;
            return false
        },

        getAvgEquipLevel: function () {
            var total = sc.inventory.getItemLevel(this.equip.head),
                total = total + sc.inventory.getItemLevel(this.equip.leftArm),
                total = total + sc.inventory.getItemLevel(this.equip.rightArm),
                total = total + sc.inventory.getItemLevel(this.equip.torso),
                total = total + sc.inventory.getItemLevel(this.equip.feet);
            return total / 5
        },

        setCore: function (core, enabled) {
            this.core[core] = enabled;
            sc.Model.notifyObserver(this, sc.PLAYER_MSG.CORE_CHANGED)
        },

        setCoreAll: function (enabled) {
            for (var core in sc.PLAYER_CORE) this.core[sc.PLAYER_CORE[core]] = enabled ? true : false
        },

        getCore: function (core) {
            return this.core[core]
        },

        getCombatCooldownTime: function () {
            return sc.model.isCombatRankActive() &&
                !sc.model.isCutscene() ? 10 : 0
        },

        hasElement: function (element) {
            switch (element) {
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

        setLevel: function (level, skipSkillReset) {
            this.level = level;
            sc.inventory.updateScaledEquipment(this.level);
            this.updateStats();
            if (!skipSkillReset) {
                this.resetSkillTree(sc.ELEMENT.NEUTRAL);
                this.resetSkillTree(sc.ELEMENT.HEAT);
                this.resetSkillTree(sc.ELEMENT.COLD);
                this.resetSkillTree(sc.ELEMENT.SHOCK);
                this.resetSkillTree(sc.ELEMENT.WAVE)
            }
            sc.Model.notifyObserver(this, sc.PLAYER_MSG.LEVEL_CHANGE, null)
        },

        addExperience: function (exp, targetLevel, bonusExp, useRawExp, curve) {
            if (!this.getCore(sc.PLAYER_CORE.EXP) || sc.newgame.get("disable-exp")) return 0;
            var partyFactor = sc.party.addExperience(exp, targetLevel, bonusExp, useRawExp, curve);
            if (this.level >= 99) return 0;
            var gained = 0,
                exp = exp * partyFactor,
                gained = useRawExp ? sc.PlayerLevelTools.computeExp(exp,
                    this.level, targetLevel, void 0, void 0, curve) : sc.PlayerLevelTools.computeExp(exp, this.level, targetLevel, 1 + this.params.getModifier("XP_PLUS"), this.params.getModifier("XP_ZERO"), curve),
                gained = gained + (bonusExp || 0);
            if (gained == 0) return 0;
            this.exp = this.exp + gained;
            sc.stats.addMap("player", "exp", gained);
            if (this.exp >= 1E3) {
                exp = Math.floor(this.exp / 1E3);
                this.level = Math.min(99, this.level + exp);
                sc.stats.setMap("player", "level", this.level);
                this.addSkillPoints(exp, null, true);
                this.exp = this.level >= 99 ? 0 : this.exp % 1E3;
                targetLevel = ig.copy(this.baseParams);
                sc.inventory.updateScaledEquipment(this.level);
                this.updateStats();
                this.addElementLoad(-1E3);
                for (var stat in targetLevel) targetLevel[stat] = this.baseParams[stat] - targetLevel[stat];
                targetLevel.level = exp;
                targetLevel.cp = exp;
                for (stat in targetLevel) this.levelUpDelta[stat] = this.levelUpDelta[stat] + targetLevel[stat];
                sc.Model.notifyObserver(this, sc.PLAYER_MSG.LEVEL_CHANGE, targetLevel)
            }
            sc.Model.notifyObserver(this, sc.PLAYER_MSG.EXP_CHANGE, gained);
            return gained
        },

        addCredit: function (amount, source, applyModifier) {
            if (this.getCore(sc.PLAYER_CORE.CREDITS) && !sc.newgame.get("disable-money")) {
                applyModifier && (amount = Math.round(amount * (1 + this.params.getModifier("MONEY_PLUS"))));
                amount = amount * sc.newgame.getMoneyMultiplier();
                this.credit =
                    this.credit + amount;
                if (this.credit >= 9999999) this.credit = 9999999;
                else if (this.credit < 0) this.credit = 0;
                sc.stats.addMap("player", "money", Math.max(amount, 0));
                sc.stats.addMap("player", "moneyHold", this.credit);
                sc.Model.notifyObserver(this, sc.PLAYER_MSG.CREDIT_CHANGE, amount)
            }
        },

        removeCredit: function (amount, silent) {
            this.credit = Math.max(this.credit - amount, 0);
            silent || sc.Model.notifyObserver(this, sc.PLAYER_MSG.CREDIT_CHANGE, -amount)
        },

        getRawExpGain: function (exp, targetLevel, curve) {
            return sc.PlayerLevelTools.computeExp(exp, this.level, targetLevel, void 0, void 0, curve)
        },

        regenerate: function () {
            this.params.revive(1)
        },

        setElementMode: function (element, force, suppressSwitchFlag) {
            if (!force && !this.core[sc.PLAYER_CORE.ELEMENT_CHANGE] || !force && !this.hasElement(element)) return false;
            if (!suppressSwitchFlag && ig.game.playerEntity && this.currentElementMode != element) ig.game.playerEntity.switchedMode = true;
            this.currentElementMode = element;
            sc.stats.addMap("element", "used" + element, 1);
            this.params.setBaseParams(this.elementConfigs[element].baseParams);
            this.params.setModifiers(this.elementConfigs[this.currentElementMode].modifiers);
            sc.Model.notifyObserver(this, sc.PLAYER_MSG.ELEMENT_MODE_CHANGE);
            return true
        },

        scrollElementMode: function (direction,
            force, suppressSwitchFlag) {
            if (!force && !this.core[sc.PLAYER_CORE.ELEMENT_CHANGE] || this.elementScrollDelay) return false;
            for (var index = ELEMENT_SCROLL_ORDER.indexOf(this.currentElementMode) + direction; index >= 0 && index <= ELEMENT_SCROLL_ORDER.length;) {
                var element = ELEMENT_SCROLL_ORDER[index];
                if (this.hasElement(element)) {
                    this.elementScrollDelay = 0;
                    return this.setElementMode(element, force, suppressSwitchFlag)
                }
                index = index + direction
            }
            return false
        },

        getCurrentElementMode: function () {
            return this.elementConfigs[this.currentElementMode]
        },

        getCombatArt: function (element, action) {
            return this.elementConfigs[element].getPlayerAction(action)
        },

        getCombatArtName: function (action) {
            return this.elementConfigs[this.currentElementMode].getActiveCombatArtName(action)
        },

        getActiveCombatArt: function (element, action) {
            return this.elementConfigs[element].getAction(action)
        },

        getAction: function (action) {
            return this.elementConfigs[this.currentElementMode].getAction(action) || this.baseConfig.getAction(action)
        },

        getActionByElement: function (element, action) {
            return this.elementConfigs[element].getAction(action) || this.baseConfig.getAction(action)
        },

        getBalls: function () {
            return this.config.proxies
        },

        getOptionFace: function () {
            return "DEFAULT"
        },

        /** Recompute base params, equipment stats and all element-config actions. */
        updateStats: function () {
            if (this.elementConfigs[sc.ELEMENT.NEUTRAL]) {
                sc.PlayerLevelTools.computeBaseParams(this.baseParams,
                    this.stats, this.level);
                this.equipParams = ig.copy(this.baseParams);
                this.equipModifiers = {};
                sc.PlayerLevelTools.updateEquipStats(this.equip, this.equipParams, this.equipModifiers);
                for (var element in sc.ELEMENT) this.elementConfigs[sc.ELEMENT[element]].preSkillInit();
                for (var skill = 0; skill < this.skills.length; skill++) this.skills[skill] && this.skills[skill].applyOnConfigs(this.elementConfigs);
                this.baseConfig.update(this.equipParams, this.equipModifiers);
                for (element in sc.ELEMENT) this.elementConfigs[sc.ELEMENT[element]].update(this.equipParams, this.equipModifiers);
                this.params.setBaseParams(this.elementConfigs[this.currentElementMode].baseParams);
                this.params.setModifiers(this.elementConfigs[this.currentElementMode].modifiers);
                sc.Model.notifyObserver(this, sc.PLAYER_MSG.STATS_CHANGED)
            }
        },

        getCombatArtLevel: function (action, element) {
            for (var level = 0, index = this.skills.length; index--;) this.skills[index] && this.skills[index].getCombatArtLevel && (level = Math.max(level, this.skills[index].getCombatArtLevel(action, element)));
            return level
        },

        getTopCombatArtElement: function (action) {
            var topElement = void 0,
                topLevel = 0,
                element;
            for (element in sc.ELEMENT) {
                var elementKey = sc.ELEMENT[element],
                    level = this.getCombatArtLevel(action, elementKey);
                if (level > topLevel) {
                    topLevel = level;
                    topElement = elementKey
                }
            }
            return topElement
        },

        hasLevelUp: function () {
            return this.levelUpDelta.level > 0
        },

        clearLevelUp: function () {
            for (var stat in this.levelUpDelta) this.levelUpDelta[stat] = 0
        },

        getParamAvg: function () {
            return (this.params.getStat("attack") + this.params.getStat("defense") + this.params.getStat("focus")) / 3
        },

        getParamAvgLevel: function (offset) {
            return Math.min(99, sc.EnemyLevelScaling.getLevelForAverageStat(this.getParamAvg()) + (offset || 0))
        },

        /** Resolve `ig.vars` paths ("item.<id>.amount", "player.level", ...). */
        onVarAccess: function (path, access) {
            if (access[0] == "item") {
                var itemId = access[1];
                if (access[2] == "amount") return this.items[itemId] ||
                    0;
                if (access[2] == "name") return sc.inventory.getItemName(itemId);
                if (access[2] == "toggled") return this.getToggleItemState(itemId);
                if (access[2] == "amountEquipped") return this.getItemAmountWithEquip(itemId)
            } else if (access[0] == "equip") switch (access[1]) {
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
            } else if (access[0] == "player") switch (access[1]) {
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
                    return this.hasElement(access[2] * 1);
                case "elementLoad":
                    return this.elementLoad + "";
                case "param":
                    return this.params.getStat(access[2]) + "";
                case "paramAvg":
                    return this.getParamAvg();
                case "paramElementFactor":
                    return this.params.getStat("elemFactor")[access[2]] + "";
                case "modifier":
                    return this.params.getModifier(access[2]) + "";
                case "hp":
                    return this.params.currentHp + "";
                case "sp":
                    return this.params.currentSp +
                        "";
                case "maxSp":
                    return this.params.maxSp + "";
                case "core":
                    return this.getCore(access[2]);
                case "artLevel":
                    return this.getCombatArtLevel(access[2] == "ANY" ? null : access[2]);
                case "itemsUsed":
                    return this.getTotalItemsUsed(true);
                case "hasAnyToggleItems":
                    return this.hasAnyToggleItems();
                case "hasToggleSetCompleted":
                    return this.hasToggleSetCompleted(access[2]);
                case "entity":
                    return ig.game.playerEntity && ig.vars.forwardEntityVarAccess(ig.game.playerEntity, access, 2)
            } else if (access[0] == "chapter") switch (access[1]) {
                case "current":
                    return this.chapter;
                case "name":
                    return this.chapters[access[2]] ? ig.LangLabel.getText(this.chapters[access[2]].name) : "No Title"
            }
            throw Error("Unsupported var access path: " + path);
        },

        usedSkillPoints: function () {
            for (var element = 0; element < this.skillPoints.length; ++element) {
                var max = this.getMaxSkillPoints(element);
                if (this.skillPoints[element] < max) return true
            }
            return false
        },

        getMaxSkillPoints: function (element) {
            var max = this.level - 1;
            return max = max + (this.skillPointsExtra[element] || 0)
        },

        getSaveData: function () {
            var data = {};
            data.playerConfig = this.config.name;
            data.credit = this.credit;
            data.level = this.level;
            data.exp = this.exp;
            data.currentElementMode = this.currentElementMode;
            data.elementLoad = this.elementLoad;
            data.hasOverload = this.hasOverload;
            data.hp = this.params.currentHp;
            data.core = ig.copy(this.core);
            data.skills = [];
            data.chapter = this.chapter || 0;
            for (var skill = 0; skill < this.skills.length; ++skill) this.skills[skill] && (data.skills[skill] = true);
            data.skillPoints = ig.copy(this.skillPoints);
            data.skillPointsExtra = ig.copy(this.skillPointsExtra);
            data.items = ig.copy(this.items);
            data.equip = {
                head: this.equip.head,
                leftArm: this.equip.leftArm,
                rightArm: this.equip.rightArm,
                torso: this.equip.torso,
                feet: this.equip.feet
            };
            data.levelUpDelta = ig.copy(this.levelUpDelta);
            data.spLevel = this.spLevel;
            data.itemFavs = ig.copy(this.itemFavs);
            data.itemNew = ig.copy(this.itemNew);
            data.itemToggles = ig.copy(this.itemToggles);
            data.skillVersion = sc.skilltree.version;
            return data
        },

        /** Restore all state from a save file (before the config/animSheet are loaded). */
        preLoad: function (saveData) {
            this.clearLevelUp();
            this.itemFavs = saveData.itemFavs || [];
            this.itemNew = saveData.itemNew || [];
            this.itemToggles = saveData.itemToggles || {};
            for (var favIndex = this.itemFavs.length; favIndex--;) {
                var favItem = this.itemFavs[favIndex];
                if (this.items[favItem] <= 0 || !sc.inventory.isConsumable(favItem)) {
                    this.itemFavs.length = 0;
                    break
                }
            }
            this.credit =
                Math.round(saveData.credit || 0);
            this.level = saveData.level || 1;
            this.exp = saveData.exp || 0;
            this.chapter = saveData.chapter || 0;
            this.currentElementMode = saveData.currentElementMode || 0;
            this.elementLoad = saveData.elementLoad || 0;
            this.hasOverload = saveData.hasOverload || false;
            this.params.reset();
            this.core = saveData.core;
            if (this.itemBlockTimer) {
                this.itemBlockTimer = 0;
                sc.Model.notifyObserver(this, sc.PLAYER_MSG.ITEM_BLOCK_FINISH)
            }
            if (saveData.levelUpDelta)
                for (var stat in this.levelUpDelta) this.levelUpDelta[stat] = saveData.levelUpDelta[stat] || 0;
            for (var core in sc.PLAYER_CORE) {
                stat = sc.PLAYER_CORE[core];
                this.core[stat] ==
                    void 0 && (this.core[stat] = true)
            }
            for (favIndex = this.skills.length = 0; favIndex < saveData.skills.length; ++favIndex) saveData.skills[favIndex] && (this.skills[favIndex] = sc.skilltree.skills[favIndex]);
            this.skillPoints = ig.copy(saveData.skillPoints);
            this.skillPointsExtra = ig.copy(saveData.skillPointsExtra) || [0, 0, 0, 0];
            this.items = ig.copy(saveData.items);
            if (saveData.equip.leftArm === void 0) {
                ig.log("Apply fix for outdated equipment structure");
                for (stat in saveData.equip) saveData.equip[stat] != -1 && saveData.equip[stat] !== void 0 && this.items[saveData.equip[stat]]++;
                this.equip.head = this.equip.feet = this.equip.leftArm = this.equip.rightArm = this.equip.torso = -1
            } else {
                this.equip.head = saveData.equip.head;
                this.equip.feet = saveData.equip.feet;
                this.equip.leftArm = saveData.equip.leftArm;
                this.equip.rightArm = saveData.equip.rightArm;
                this.equip.torso = saveData.equip.torso
            }
            if (this.checkBodyPart(this.equip.head)) this.equip.head = -1;
            if (this.checkBodyPart(this.equip.feet)) this.equip.feet = -1;
            if (this.checkBodyPart(this.equip.leftArm)) this.equip.leftArm = -1;
            if (this.checkBodyPart(this.equip.rightArm)) this.equip.rightArm = -1;
            if (this.checkBodyPart(this.equip.torso)) this.equip.torso = -1;
            this.setSpLevel(saveData.spLevel ||
                0);
            sc.inventory.updateScaledEquipment(this.level);
            this.updateStats();
            this.updateChapter(true);
            if (saveData.playerConfig) this.loadedConfig = new sc.PlayerConfig(saveData.playerConfig);
            this.params.currentHp = Math.min(saveData.hp || this.params.getStat("hp"), this.params.getStat("hp"));
            if (saveData.skillVersion != sc.skilltree.version && this.usedSkillPoints()) {
                this.resetSkillTree(sc.ELEMENT.NEUTRAL);
                this.resetSkillTree(sc.ELEMENT.HEAT);
                this.resetSkillTree(sc.ELEMENT.COLD);
                this.resetSkillTree(sc.ELEMENT.SHOCK);
                this.resetSkillTree(sc.ELEMENT.WAVE);
                ig.game.addTeleportMessage(ig.lang.get("sc.gui.loading.skillUpdate"))
            }
            for (favIndex = this.itemNew.length; favIndex--;) this.items[this.itemNew[favIndex]] <= 0 && !this.isEquipped(this.itemNew[favIndex]) && this.itemNew.splice(favIndex, 1);
            sc.stats.setMap("items", "usedTotal", this.getTotalItemsUsed(true));
            sc.Model.notifyObserver(this, sc.PLAYER_MSG.SET_PARAMS)
        },

        /** If the save carried a stale item in a bodypart slot, return it to the inventory. */
        checkBodyPart: function (itemId) {
            if (itemId < 0) return false;
            if (sc.inventory.getItem(itemId).type != sc.ITEMS_TYPES.EQUIP) {
                this.items[itemId]++;
                return true
            }
            return false
        },

        postLoad: function () {
            if (this.loadedConfig) {
                this.setConfig(this.loadedConfig);
                this.loadedConfig.decreaseRef();
                this.loadedConfig = null
            }
        }
    })
});
ig.baked = !0;

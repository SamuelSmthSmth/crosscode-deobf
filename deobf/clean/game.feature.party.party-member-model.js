/**
 * @module game.feature.party.party-member-model
 *
 * Model for a single party member: loads the character config, computes
 * stats (base params + equipment + skills per element), handles leveling,
 * EXP, SP, equipment, element mode switching, revive/death, sandwich
 * healing, and the eat-sandwich action sequence.
 */
ig.module("game.feature.party.party-member-model").requires("game.feature.model.base-model", "game.feature.combat.model.combat-params", "game.feature.combat.entities.ball", "game.feature.player.player-config", "game.feature.achievements.stats-model").defines(function() {
    sc.PARTY_MEMBER_MSG = {
        ELEMENT_MODE_CHANGE: 1,
        EXP_CHANGE: 3,
        LEVEL_CHANGE: 4,
        STATS_CHANGED: 5
    };
    var SANDWICH_HEAL = [{
            heal: 0.25
        }, {
            heal: 0.5
        }, {
            heal: 0.7
        }],
        SANDWICH_COUNTS = [{
            level: 1,
            count: [1, 0, 0]
        }, {
            level: 10,
            count: [2, 0, 0]
        }, {
            level: 20,
            count: [3, 1, 0]
        }, {
            level: 30,
            count: [4, 2, 0]
        }, {
            level: 40,
            count: [5, 3, 1]
        }, {
            level: 50,
            count: [6, 4, 1]
        }, {
            level: 60,
            count: [7, 5, 2]
        }];
    sc.PartyMemberModel = ig.Class.extend({
        observers: [],
        core: {},
        config: null,
        animSheet: null,
        stats: null,
        params: null,
        name: null,
        clazz: null,
        character: null,
        equipLevel: 0,
        level: 1,
        exp: 0,
        combatStyle: null,
        spLevel: 0,
        allElements: false,
        equip: {
            head: -1,
            leftArm: -1,
            rightArm: -1,
            torso: -1,
            feet: -1
        },
        baseParams: {
            elemFactor: [1, 1, 1, 1]
        },
        equipParams: null,
        equipModifiers: null,
        baseConfig: null,
        elementConfigs: {},
        reviveTimer: 0,
        skills: [],
        healing: {
            sandwich: [0, 0, 0],
            cooldown: 0,
            needRestock: true
        },
        temporary: false,
        noDie: false,
        currentElementMode: 0,
        init: function(settings) {
            this.params = new sc.CombatParams;
            this.config = new sc.PlayerConfig(settings);
            this.config.addLoadListener(this)
        },
        onLoadableComplete: function() {
            var config = this.config;
            this.name = config.name;
            this.clazz = config.clazz;
            this.combatStyle = config.combatStyle;
            this.walkAnims = config.walkAnims;
            this.character = config.character;
            this.defaultExpression = new sc.CharacterExpression(config.character.name, "DEFAULT");
            this.animSheet = config.animSheet;
            this.proxies = config.proxies;
            this.stats = config.stats;
            this.baseConfig = config.baseConfig;
            this.elementConfigs = config.elementConfigs;
            this.skillRanking = config.skillRanking;
            this.updateStats()
        },
        getHeadIdx: function() {
            return this.config.headIdx
        },
        setEquipment: function(bodyPart, itemId) {
            sc.PlayerLevelTools.equip(this.equip, bodyPart, itemId)
        },
        clearEquipment: function() {
            for (var bodyPart in this.equip) this.equip[bodyPart] = -1
        },
        updateAutoEquip: function(level) {
            if (this._updateAutoEquip(this.level, level)) {
                this.updateStats();
                return true
            }
            return false
        },
        _updateAutoEquip: function(level, targetLevel) {
            var newEquipLevel = sc.PlayerLevelTools.autoequip(this, this.config.autoequip,
                this.equipLevel, level, false, targetLevel);
            if (newEquipLevel > this.equipLevel) {
                this.equipLevel = newEquipLevel;
                return true
            }
            return false
        },
        setElementMode: function(elementMode) {
            this.currentElementMode = elementMode;
            this.params.setBaseParams(this.elementConfigs[this.currentElementMode].baseParams);
            this.params.setModifiers(this.elementConfigs[this.currentElementMode].modifiers);
            sc.Model.notifyObserver(this, sc.PARTY_MEMBER_MSG.STATS_CHANGED)
        },
        updateStats: function() {
            sc.PlayerLevelTools.computeBaseParams(this.baseParams, this.stats, this.level);
            this.equipParams = ig.copy(this.baseParams);
            this.equipModifiers = {};
            sc.PlayerLevelTools.updateEquipStats(this.equip, this.equipParams, this.equipModifiers);
            for (var elementKey in sc.ELEMENT) this.elementConfigs[sc.ELEMENT[elementKey]].preSkillInit();
            this.skills.length = 0;
            sc.skilltree.autoSkill(this.skills, this.level, this.skillRanking);
            for (var i = this.skills.length; i--;) this.skills[i].applyOnConfigs(this.elementConfigs);
            this.baseConfig.update(this.equipParams, this.equipModifiers);
            for (elementKey in sc.ELEMENT) this.elementConfigs[sc.ELEMENT[elementKey]].update(this.equipParams, this.equipModifiers);
            this.params.setBaseParams(this.elementConfigs[this.currentElementMode].baseParams);
            this.params.setModifiers(this.elementConfigs[this.currentElementMode].modifiers);
            sc.Model.notifyObserver(this, sc.PARTY_MEMBER_MSG.STATS_CHANGED)
        },
        isAlive: function() {
            return this.reviveTimer == 0
        },
        onDefeat: function() {
            this.reviveTimer = sc.arena.active ? 0 : 30
        },
        revive: function() {
            this.params.revive();
            this.reviveTimer = 0;
            this.restockSandwich()
        },
        setTemporary: function(temporary) {
            this.temporary = temporary
        },
        setNoDie: function(noDie) {
            this.noDie = noDie
        },
        update: function() {
            if (this.healing.cooldown) {
                this.healing.cooldown =
                    this.healing.cooldown - ig.system.tick;
                if (this.healing.cooldown <= 0 || !sc.model.isCombatMode()) this.healing.cooldown = 0
            }
            this.healing.needRestock && !sc.model.isCombatMode() && this.restockSandwich();
            if (this.reviveTimer) {
                this.reviveTimer = this.reviveTimer - ig.system.tick;
                if (this.reviveTimer <= 0 || !sc.model.isCombatMode()) {
                    sc.arena.active || sc.commonEvents.triggerEvent("PARTY_MEMBER_EVENT", {
                        member: [this.name],
                        eventType: "REVIVED"
                    });
                    sc.party.revivePartyMemberEntity(this.name)
                }
            }
        },
        getCharacterName: function() {
            return this.character ?
                this.character.data && this.character.data.name ? ig.LangLabel.getText(this.character.data.name) : null : null
        },
        getCharacterRealName: function() {
            return this.character ? this.character.data && this.character.data.realname ? ig.LangLabel.getText(this.character.data.realname) : null : null
        },
        getAction: function(actionName) {
            return this.elementConfigs[this.currentElementMode].getAction(actionName) || this.baseConfig.getAction(actionName)
        },
        getActionMaxLevel: function(actionName) {
            return this.elementConfigs[this.currentElementMode].getActionMaxLevel(actionName)
        },
        getCombatArtName: function(actionName) {
            return this.elementConfigs[this.currentElementMode].getActiveCombatArtName(actionName)
        },
        getBalls: function() {
            return this.config.proxies
        },
        getSaveData: function() {
            return {
                level: this.level,
                equipLevel: this.equipLevel,
                exp: this.exp,
                spLevel: this.spLevel,
                allElements: this.allElements,
                temporary: this.temporary,
                noDie: this.noDie
            }
        },
        setLoadData: function(saveData) {
            saveData = saveData || {};
            this.level = saveData.level || 1;
            this.exp = saveData.exp || 0;
            this.equipLevel = 0;
            this.temporary = saveData.temporary || false;
            this.noDie = saveData.noDie || false;
            this.allElements = saveData.allElements || false;
            this.setSpLevel(saveData.spLevel || 1);
            this.clearEquipment();
            this._updateAutoEquip(saveData.equipLevel ||
                1);
            this.updateStats();
            this.restockSandwich()
        },
        reset: function() {
            this.level = 1;
            this.equipLevel = this.exp = 0;
            this.noDie = this.temporary = this.allElements = false;
            this.revive();
            this.setSpLevel(2);
            this.clearEquipment();
            this.config.loaded && this.updateStats()
        },
        setSpLevel: function(spLevel) {
            if (!(spLevel < 0 || spLevel >= sc.SP_LEVEL.length)) {
                this.spLevel = spLevel;
                this.params.setMaxSp(sc.SP_LEVEL[spLevel])
            }
        },
        setAllElements: function(allElements) {
            this.allElements = allElements
        },
        addExperience: function(exp, enemyLevel, isBonus, ignoreCap, forceLevelUp) {
            exp = sc.PlayerLevelTools.computeExp(exp, this.level, enemyLevel, void 0, void 0,
                forceLevelUp);
            if (!(this.level >= sc.EXP_MAX_LEVEL)) {
                this.exp = this.exp + exp;
                if (this.exp >= sc.EXP_PER_LEVEL) {
                    this.level = this.level + Math.floor(this.exp / sc.EXP_PER_LEVEL);
                    this.exp = this.level >= sc.EXP_MAX_LEVEL ? 0 : this.exp % sc.EXP_PER_LEVEL;
                    this.updateStats();
                    sc.Model.notifyObserver(this, sc.PARTY_MEMBER_MSG.LEVEL_CHANGE)
                }
                sc.Model.notifyObserver(this, sc.PARTY_MEMBER_MSG.EXP_CHANGE)
            }
        },
        setLevel: function(level, exp, updateAutoEquip, onlyIfHigher, equipLevel) {
            if (!onlyIfHigher || this.level < level || this.level == level && this.exp < exp) {
                this.exp = exp;
                this.level = level
            }
            this.updateStats();
            updateAutoEquip && this.updateAutoEquip(equipLevel);
            sc.Model.notifyObserver(this, sc.PARTY_MEMBER_MSG.LEVEL_CHANGE);
            sc.Model.notifyObserver(this, sc.PARTY_MEMBER_MSG.EXP_CHANGE)
        },
        hasSandwich: function() {
            for (var sandwich = this.healing.sandwich, i = sandwich.length; i--;)
                if (sandwich[i]) return true;
            return false
        },
        canEatSandwich: function() {
            return sc.arena.active && sc.arena.hasChallenge("NO_ITEMS") ? false : this.hasSandwich() && !this.healing.cooldown
        },
        restockSandwich: function() {
            this.healing.needRestock = false;
            for (var level = this.level, i = SANDWICH_COUNTS.length; i--;) {
                var entry = SANDWICH_COUNTS[i];
                if (level >= entry.level) {
                    for (level = this.healing.sandwich.length; level--;) this.healing.sandwich[level] =
                        entry.count[level];
                    break
                }
            }
        },
        getBestSandwich: function(startIndex) {
            var index = startIndex,
                step = index ? -1 : 1;
            do {
                if (this.healing.sandwich[index]) return index;
                index = index + step;
                index < 0 && (index = SANDWICH_HEAL.length - 1);
                index > SANDWICH_HEAL.length - 1 && (index = 0)
            } while (index != startIndex);
            return false
        },
        consumeSandwich: function(index, combatParams) {
            combatParams.heal({
                value: SANDWICH_HEAL[index].heal
            });
            this.healing.sandwich[index]--;
            this.healing.cooldown = 10;
            this.healing.needRestock = true
        },
        getSandwichAction: function(index) {
            var foodSprite = "SANDWICH";
            this.combatStyle.foodSprites && (foodSprite = this.combatStyle.foodSprites[index]);
            return new ig.Action("consumeItem", [{
                type: "SET_FACE",
                face: "SOUTH"
            }, {
                type: "WAIT",
                time: 0.3
            }, {
                type: "SHOW_FOOD_ICON",
                icon: foodSprite,
                offset: this.combatStyle.foodOffset
            }, {
                type: "SHOW_ANIMATION",
                anim: "itemFetch",
                wait: true
            }, {
                type: "SHOW_ANIMATION",
                anim: "itemHold"
            }, {
                type: "WAIT",
                time: 0.2
            }, {
                type: "CHANGE_FOOD_ICON",
                state: "BUBBLE",
                offset: this.combatStyle.foodBubbleOffset
            }, {
                type: "PLAY_SOUND",
                sound: "media/sound/move/eat.ogg",
                volume: 1
            }, {
                type: "SHOW_ANIMATION",
                anim: "itemEatFast"
            }, {
                type: "WAIT",
                time: 0.8
            }, {
                type: "CHANGE_FOOD_ICON",
                state: "DONE"
            }, {
                type: "CONSUME_PARTY_SANDWICH",
                sandwich: index
            }, {
                type: "SHOW_ANIMATION",
                anim: "itemEffect"
            }, {
                type: "WAIT",
                time: 0.6
            }])
        }
    })
});
ig.baked = !0;

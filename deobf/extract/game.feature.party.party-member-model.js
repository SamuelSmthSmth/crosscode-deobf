ig.module("game.feature.party.party-member-model").requires("game.feature.model.base-model", "game.feature.combat.model.combat-params", "game.feature.combat.entities.ball", "game.feature.player.player-config", "game.feature.achievements.stats-model").defines(function() {
    sc.PARTY_MEMBER_MSG = {
        ELEMENT_MODE_CHANGE: 1,
        EXP_CHANGE: 3,
        LEVEL_CHANGE: 4,
        STATS_CHANGED: 5
    };
    var b = [{
            heal: 0.25
        }, {
            heal: 0.5
        }, {
            heal: 0.7
        }],
        a = [{
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
        init: function(a) {
            this.params = new sc.CombatParams;
            this.config = new sc.PlayerConfig(a);
            this.config.addLoadListener(this)
        },
        onLoadableComplete: function() {
            var a = this.config;
            this.name = a.name;
            this.clazz = a.clazz;
            this.combatStyle = a.combatStyle;
            this.walkAnims = a.walkAnims;
            this.character = a.character;
            this.defaultExpression = new sc.CharacterExpression(a.character.name, "DEFAULT");
            this.animSheet = a.animSheet;
            this.proxies = a.proxies;
            this.stats = a.stats;
            this.baseConfig = a.baseConfig;
            this.elementConfigs = a.elementConfigs;
            this.skillRanking = a.skillRanking;
            this.updateStats()
        },
        getHeadIdx: function() {
            return this.config.headIdx
        },
        setEquipment: function(a, b) {
            sc.PlayerLevelTools.equip(this.equip, a, b)
        },
        clearEquipment: function() {
            for (var a in this.equip) this.equip[a] = -1
        },
        updateAutoEquip: function(a) {
            if (this._updateAutoEquip(this.level, a)) {
                this.updateStats();
                return true
            }
            return false
        },
        _updateAutoEquip: function(a, b) {
            var e = sc.PlayerLevelTools.autoequip(this, this.config.autoequip,
                this.equipLevel, a, false, b);
            if (e > this.equipLevel) {
                this.equipLevel = e;
                return true
            }
            return false
        },
        setElementMode: function(a) {
            this.currentElementMode = a;
            this.params.setBaseParams(this.elementConfigs[this.currentElementMode].baseParams);
            this.params.setModifiers(this.elementConfigs[this.currentElementMode].modifiers);
            sc.Model.notifyObserver(this, sc.PARTY_MEMBER_MSG.STATS_CHANGED)
        },
        updateStats: function() {
            sc.PlayerLevelTools.computeBaseParams(this.baseParams, this.stats, this.level);
            this.equipParams = ig.copy(this.baseParams);
            this.equipModifiers = {};
            sc.PlayerLevelTools.updateEquipStats(this.equip, this.equipParams, this.equipModifiers);
            for (var a in sc.ELEMENT) this.elementConfigs[sc.ELEMENT[a]].preSkillInit();
            this.skills.length = 0;
            sc.skilltree.autoSkill(this.skills, this.level, this.skillRanking);
            for (var b = this.skills.length; b--;) this.skills[b].applyOnConfigs(this.elementConfigs);
            this.baseConfig.update(this.equipParams, this.equipModifiers);
            for (a in sc.ELEMENT) this.elementConfigs[sc.ELEMENT[a]].update(this.equipParams, this.equipModifiers);
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
        setTemporary: function(a) {
            this.temporary = a
        },
        setNoDie: function(a) {
            this.noDie = a
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
        getAction: function(a) {
            return this.elementConfigs[this.currentElementMode].getAction(a) || this.baseConfig.getAction(a)
        },
        getActionMaxLevel: function(a) {
            return this.elementConfigs[this.currentElementMode].getActionMaxLevel(a)
        },
        getCombatArtName: function(a) {
            return this.elementConfigs[this.currentElementMode].getActiveCombatArtName(a)
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
        setLoadData: function(a) {
            a = a || {};
            this.level = a.level || 1;
            this.exp = a.exp || 0;
            this.equipLevel = 0;
            this.temporary = a.temporary || false;
            this.noDie = a.noDie || false;
            this.allElements = a.allElements || false;
            this.setSpLevel(a.spLevel || 1);
            this.clearEquipment();
            this._updateAutoEquip(a.equipLevel ||
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
        setSpLevel: function(a) {
            if (!(a < 0 || a >= sc.SP_LEVEL.length)) {
                this.spLevel = a;
                this.params.setMaxSp(sc.SP_LEVEL[a])
            }
        },
        setAllElements: function(a) {
            this.allElements = a
        },
        addExperience: function(a, b, e, f, g) {
            a = sc.PlayerLevelTools.computeExp(a, this.level, b, void 0, void 0,
                g);
            if (!(this.level >= sc.EXP_MAX_LEVEL)) {
                this.exp = this.exp + a;
                if (this.exp >= sc.EXP_PER_LEVEL) {
                    this.level = this.level + Math.floor(this.exp / sc.EXP_PER_LEVEL);
                    this.exp = this.level >= sc.EXP_MAX_LEVEL ? 0 : this.exp % sc.EXP_PER_LEVEL;
                    this.updateStats();
                    sc.Model.notifyObserver(this, sc.PARTY_MEMBER_MSG.LEVEL_CHANGE)
                }
                sc.Model.notifyObserver(this, sc.PARTY_MEMBER_MSG.EXP_CHANGE)
            }
        },
        setLevel: function(a, b, e, f, g) {
            if (!f || this.level < a || this.level == a && this.exp < b) {
                this.exp = b;
                this.level = a
            }
            this.updateStats();
            e && this.updateAutoEquip(g);
            sc.Model.notifyObserver(this, sc.PARTY_MEMBER_MSG.LEVEL_CHANGE);
            sc.Model.notifyObserver(this, sc.PARTY_MEMBER_MSG.EXP_CHANGE)
        },
        hasSandwich: function() {
            for (var a = this.healing.sandwich, b = a.length; b--;)
                if (a[b]) return true;
            return false
        },
        canEatSandwich: function() {
            return sc.arena.active && sc.arena.hasChallenge("NO_ITEMS") ? false : this.hasSandwich() && !this.healing.cooldown
        },
        restockSandwich: function() {
            this.healing.needRestock = false;
            for (var b = this.level, c = a.length; c--;) {
                var e = a[c];
                if (b >= e.level) {
                    for (b = this.healing.sandwich.length; b--;) this.healing.sandwich[b] =
                        e.count[b];
                    break
                }
            }
        },
        getBestSandwich: function(a) {
            var c = a,
                e = c ? -1 : 1;
            do {
                if (this.healing.sandwich[c]) return c;
                c = c + e;
                c < 0 && (c = b.length - 1);
                c > b.length - 1 && (c = 0)
            } while (c != a);
            return false
        },
        consumeSandwich: function(a, c) {
            c.heal({
                value: b[a].heal
            });
            this.healing.sandwich[a]--;
            this.healing.cooldown = 10;
            this.healing.needRestock = true
        },
        getSandwichAction: function(a) {
            var b = "SANDWICH";
            this.combatStyle.foodSprites && (b = this.combatStyle.foodSprites[a]);
            return new ig.Action("consumeItem", [{
                type: "SET_FACE",
                face: "SOUTH"
            }, {
                type: "WAIT",
                time: 0.3
            }, {
                type: "SHOW_FOOD_ICON",
                icon: b,
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
                sandwich: a
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

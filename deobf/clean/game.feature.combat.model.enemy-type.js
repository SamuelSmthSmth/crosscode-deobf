/**
 * game.feature.combat.model.enemy-type
 * =====================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.combat.model.enemy-type")`.
 *
 * The enemy AI "brain". `sc.EnemyType` loads an enemy's JSON definition and
 * drives its behavior every tick: target detection, state machine
 * (`sc.EnemyState` + choices), reaction handling, HP-break heal drops, and
 * defeat rewards (credits/exp/item drops). Also defines `sc.CombatConditions`
 * (condition trees), `sc.EnemyInfo` and `sc.EnemyState`.
 */
ig.module("game.feature.combat.model.enemy-type")
    .requires("impact.base.loader", "game.feature.combat.model.combat-params", "game.feature.combat.model.combat-condition", "impact.base.animation")
    .defines(function () {

    // hpBreaks are sorted descending by hp threshold (latest break first).
    function compareHpBreaks(a, b) {
        return b.hp - a.hp
    }

    // Run any deferred `onPerformed` conditions and pending timer changes after
    // an action/reaction resolves. Clears the current reaction when done.
    function resolveDeferred(enemyType, entity) {
        if (!entity.reactions.restartAction) {
            if (entity.deferredPerformedConds.length > 0) {
                for (var i = entity.deferredPerformedConds.length; i--;) entity.deferredPerformedConds[i].onPerformed(entity);
                entity.deferredPerformedConds.length = 0
            }
            if (entity.nextTimerChange) {
                var changes = entity.nextTimerChange,
                    changed = false;
                for (var key in changes) {
                    changed = true;
                    var value = changes[key];
                    entity.stateTimers[key] = typeof value == "number" ? value : value[0] + Math.random() * ((value[1] || value[0]) - value[0])
                }
                if (changed) {
                    entity.nav.failTimer = 0;
                    entity.target && enemyType.reselectTarget(entity)
                }
                entity.nextTimerChange = null
            }
        }
        entity.reactions.running = null
    }

    // Drop HP orbs for the player plus every living party member.
    function spawnHealDrops(entity, amount) {
        sc.DropEntity.spawnDrops(entity, ig.ENTITY_ALIGN.CENTER, "HP", amount, ig.game.playerEntity);
        for (var i = sc.party.getPartySize(); i--;) {
            var member = sc.party.getPartyMemberEntityByIndex(i);
            member && (member.model && member.model.isAlive()) && sc.DropEntity.spawnDrops(entity, ig.ENTITY_ALIGN.CENTER, "HP", amount, member)
        }
    }

    // Recursively build the choice tree from raw JSON (`req` → conditions,
    // `sub` → nested choices, otherwise a leaf with action/frequency/collab).
    function parseChoices(choices, rawChoices, parent) {
        for (var i = 0; i < rawChoices.length; ++i) {
            var choice = {
                conditions: null,
                parent: parent || null
            };
            var req = rawChoices[i].req;
            if (req) choice.conditions = new sc.CombatConditions(req);
            if (rawChoices[i].sub) {
                choice.sub = [];
                parseChoices(choice.sub, rawChoices[i].sub, choice)
            } else {
                choice.action = rawChoices[i].action;
                choice.frequency = rawChoices[i].frequency || null;
                choice.collab = rawChoices[i].collab || null;
                if (choice.frequency && !sc.ATTACK_FREQUENCY[choice.frequency]) throw Error("Unknown attack frequency '" + choice.frequency + "'");
                choice.preSwitchState = rawChoices[i].preSwitchState;
                choice.postSwitchState = rawChoices[i].postSwitchState;
                choice.ignoreStun = rawChoices[i].ignoreStun
            }
            choices.push(choice)
        }
    }

    // Walk the choice tree to pick the first actionable leaf (respecting stun,
    // frequency cooldowns and conditions). `random` is fed to condition checks.
    function selectChoice(choices, entity, random) {
        for (var i = 0; i < choices.length; ++i) {
            var choice = choices[i];
            if (choice.sub || choice.ignoreStun || !entity.hasStun())
                if (!choice.frequency || sc.combat.checkFrequency(entity, choice.frequency))
                    if (!choice.conditions || choice.conditions.check(entity, random))
                        if (choice.sub) {
                            var sub = selectChoice(choice.sub, entity, random);
                            if (sub) return sub
                        } else {
                            if (choice.collab) {
                                var collab = new sc.EnemyCollab(entity, choice.collab);
                                if (!collab.success) continue;
                                entity.postStun.collab = collab
                            } else entity.postStun.collab = null;
                            return choice
                        }
        }
        return null
    }

    // Recursion guard for `assignTarget` (breaks the debugger on runaway loops).
    var assignTargetGuard = 0;

    sc.ENEMY_CATEGORY = {};
    sc.ENEMY_CATEGORY.ABSTRACT = 0;
    sc.ENEMY_CATEGORY.PLAYERS = 1;
    sc.ENEMY_CATEGORY.ANIMALS = 2;
    sc.ENEMY_CATEGORY.MECHA = 3;
    sc.ENEMY_CATEGORY.BOSS = 4;

    sc.ENEMY_AI_LEARN = {
        REGULAR: {},
        IMMEDIATELY: {
            knowItAll: true
        }
    };

    sc.EnemyType = ig.JsonLoadable.extend({
        cacheType: "Enemy",
        aiGroup: null,
        aiLearnType: sc.ENEMY_AI_LEARN.REGULAR,
        enduranceScale: null,
        name: "",
        params: null,
        credit: null,
        exp: 0,
        level: 1,
        maxSp: 4,
        boss: false,
        hpBreaks: [],
        hpBreakCond: null,
        animSheet: null,
        attribs: {},
        proxies: {},
        actions: {},
        states: {},
        reactions: {},
        trackerDef: null,
        headIdx: 0,
        healDropRate: 0,
        itemDrops: [],
        targetDetect: {
            onVisibleRange: 0,
            onDistance: false,
            onCloseBattle: false,
            detectDistance: 120,
            loseDistance: 240,
            loseTime: 3
        },

        getJsonPath: function () {
            return ig.root + this.path.toPath("data/enemies/", ".json") + ig.getCacheSuffix()
        },

        onload: function (data) {
            this.name = data.name;
            this.boss = data.boss;
            this.bossLabel = data.bossLabel || "Boss";
            this.bossOrder = data.bossOrder || 0;
            this.detectType = sc.EnemyType.DETECT_TYPE[data.detectType] || sc.EnemyType.DETECT_TYPE.DISTANCE;
            this.credit = data.credit || 0;
            this.aiGroup = data.aiGroup || null;
            this.aiLearnType = sc.ENEMY_AI_LEARN[data.aiLearnType] || sc.ENEMY_AI_LEARN.REGULAR;
            this.enduranceScale = data.enduranceScale || 1;
            this.exp = data.exp || 0;
            this.level = data.level || 1;
            this.boostedLevel = data.boostedLevel || 60;
            this.maxSp = data.maxSp || 4;
            this.headIdx = data.headIdx;
            if (this.headIdx == void 0) this.headIdx = 3;
            this.healDropRate = data.healDropRate || 0;
            this.itemDrops = data.itemDrops || [];
            this.ignoreTaunts = data.ignoreTaunts || false;
            this.trackerDef = data.trackers;
            if (data.params) this.params = data.params;
            if (data.elementModes) this.elementModes = data.elementModes;
            if (data.modifiers) this.modifiers = data.modifiers;
            if (data._wm && data._wm.attributes) this.attribs = data._wm.attributes;
            if (data.hpBreaks) {
                for (var i = 0; i < data.hpBreaks.length; ++i) {
                    var hpBreak = data.hpBreaks[i];
                    this.hpBreaks.push({
                        hp: hpBreak.hp,
                        healDrop: hpBreak.healDrop
                    })
                }
                this.hpBreaks.sort(compareHpBreaks)
            }
            this.hpBreakCond = new ig.VarCondition(data.hpBreakCond);
            this.animSheet = new ig.AnimationSheet(data.anims);
            this.size = data.size;
            this.cameraZFocus = data.cameraZFocus || 0;
            this.dmgZFocus = data.dmgZFocus || 0;
            this.padding = data.padding || Vec2.createC(0, 0);
            this.walkConfigs = data.walkConfigs;
            this.material = sc.COMBATANT_MATERIAL[data.material] || sc.COMBATANT_MATERIAL.METAL;
            for (var proxyKey in data.proxies) {
                var proxyDef = data.proxies[proxyKey];
                this.proxies[proxyKey] = new sc.PROXY_TYPE[proxyDef.type](proxyDef)
            }
            if (data.targetDetect) {
                var detect = data.targetDetect;
                if (detect.detectDistance != void 0) this.targetDetect.detectDistance = detect.detectDistance;
                if (detect.detectZDelta != void 0) this.targetDetect.detectZDelta = detect.detectZDelta || 0;
                if (detect.loseDistance != void 0) this.targetDetect.loseDistance = detect.loseDistance;
                if (detect.loseTime != void 0) this.targetDetect.loseTime = detect.loseTime;
                if (detect.onDistance != void 0) this.targetDetect.onDistance = detect.onDistance;
                if (detect.onVisible != void 0) this.targetDetect.onVisible = detect.onVisible;
                if (detect.notifyNeighbourRadius != void 0) this.targetDetect.notifyNeighbourRadius = detect.notifyNeighbourRadius;
                if (detect.onCloseBattle != void 0) this.targetDetect.onCloseBattle = detect.onCloseBattle;
                this.targetDetect.onVisible = detect.onVisible || false
            }
            this.entityConfig = new ig.ActorConfig;
            this.entityConfig.loadFromData(data);
            for (var actionKey in data.actions) {
                this.actions[actionKey] = new ig.Action(actionKey, data.actions[actionKey]);
                this.actions[actionKey].hint = "battle"
            }
            this.defaultState = data.defaultState;
            for (var stateKey in data.states) this.states[stateKey] = new sc.EnemyState(stateKey, data.states[stateKey], this.entityConfig);
            for (var reactionKey in data.reactions) {
                var reactionDef = data.reactions[reactionKey];
                this.reactions[reactionKey] = new sc.ENEMY_REACTION[reactionDef.type](reactionKey, reactionDef)
            }
        },

        onCacheCleared: function () {
            this.animSheet.decreaseRef();
            for (var actionKey in this.actions) this.actions[actionKey].clearCached();
            for (var proxyKey in this.proxies) this.proxies[proxyKey].clearCached()
        },

        initEntity: function (entity) {
            if (this.loaded && !entity.enemyTypeInitialized) {
                entity.enemyTypeInitialized = true;
                entity.setSize(this.size.x, this.size.y, this.size.z);
                entity.cameraZFocus = this.cameraZFocus;
                entity.dmgZFocus = this.dmgZFocus;
                entity.coll.setPadding(this.padding.x, this.padding.y);
                entity.material = this.material;
                entity.animSheet = this.animSheet;
                entity.proxies = this.proxies;
                entity.ignoreTaunts = this.ignoreTaunts;
                if (this.size.z > 96) entity.tooHighToFall = true;
                for (var walkKey in this.walkConfigs) entity.storeWalkAnims(walkKey, this.walkConfigs[walkKey]);
                for (var trackerKey in this.trackerDef) {
                    var trackerDef = this.trackerDef[trackerKey],
                        trackerType = trackerDef.type;
                    sc.ENEMY_TRACKER[trackerType] && (entity.trackers[trackerKey] = new sc.ENEMY_TRACKER[trackerType](entity, trackerDef))
                }
                for (var attribKey in this.attribs) {
                    var attribValue = entity.attributes[attribKey];
                    if (this.attribs[attribKey]._type == "VarCondition") entity.setAttribute(attribKey, new ig.VarCondition(attribValue));
                    else if (this.attribs[attribKey]._type == "Vec3") entity.setAttribute(attribKey, ig.Event.getVec3(attribValue, Vec3.create()));
                    else if (this.attribs[attribKey]._type == "Action" && attribValue) {
                        attribValue = new ig.Action(attribKey, attribValue);
                        attribValue.hint = "battle";
                        entity.setAttribute(attribKey, attribValue)
                    }
                }
                ig.vars.pushEntityAccessor(entity);
                if (!this.hpBreakCond.evaluate()) entity.hpBreakReached = this.hpBreaks.length;
                ig.vars.popEntityAccessor(entity);
                this.switchState(entity, entity.currentState || this.defaultState);
                if (this.params) {
                    entity.params = new sc.CombatParams(this.params);
                    if (this.elementModes) entity.elementModes = {
                        current: 0,
                        modes: null
                    };
                    this.updateParams(entity);
                    this.modifiers && entity.params.setModifiers(this.modifiers);
                    entity.params.setCombatant(entity);
                    entity.params.setMaxSp(this.maxSp);
                    entity.statusGui && entity.statusGui.initWithParams();
                    entity.params.initStatusFx()
                }
                sc.enemyBooster.updateEnemyBoostState(entity)
            }
        },

        updateParams: function (entity) {
            var params = this.params;
            entity.level.override && (params = sc.EnemyLevelScaling.adaptParams(this.params, this.level, entity.level.override));
            if (this.elementModes) {
                var modes = [];
                modes[sc.ELEMENT.NEUTRAL] = ig.copy(params);
                for (var elementKey in sc.ELEMENT) {
                    var elementParams = ig.copy(params),
                        elementMode = this.elementModes[elementKey];
                    for (var paramKey in elementMode)
                        if (elementMode[paramKey])
                            if (elementMode[paramKey] instanceof Array) {
                                elementParams[paramKey] || (elementParams[paramKey] = [1, 1, 1, 1]);
                                for (var idx = 0; idx < elementMode[paramKey].length; ++idx) elementParams[paramKey][idx] = elementMode[paramKey][idx]
                            } else elementParams[paramKey] = Math.round(elementMode[paramKey] * (elementParams[paramKey] / this.params[paramKey]));
                    modes[sc.ELEMENT[elementKey]] = elementParams
                }
                entity.elementModes.modes = modes;
                params = modes[entity.elementModes.current]
            }
            entity.params.setBaseParams(params, true)
        },

        onEntityKill: function (entity) {
            for (var attribKey in this.attribs) {
                var attribValue = entity.attributes[attribKey];
                attribValue instanceof ig.Action && attribValue.clearCached()
            }
        },

        getAppearAction: function (entity) {
            entity.currentState || this.switchState(entity, this.defaultState);
            var state = this.states[entity.currentState];
            return state && state.appearAction ? this.actions[state.appearAction] : null
        },

        update: function (entity) {
            if (this.loaded && !entity._hidden)
                if (entity.params && (entity.params.isDefeated() || entity.params.isLocked())) entity.postStun.choice = null;
                else {
                    entity.target && entity.target.isDefeated() && this.reselectTarget(entity, false, true);
                    entity.enemyTypeInitialized || this.initEntity(entity);
                    entity.currentState || this.switchState(entity, this.defaultState);
                    this.updateTarget(entity);
                    this.checkReactions(entity);
                    if (!entity.reactions.current && !entity.currentAction) {
                        resolveDeferred(this, entity);
                        entity.nextState && !entity.hasStun() && this.switchState(entity, entity.nextState);
                        entity.nextState || this.updateAction(entity)
                    }
                }
        },

        checkReactions: function (entity) {
            for (var i = 0; i < entity.reactions.enabled.length; ++i) {
                var reactionKey = entity.reactions.enabled[i],
                    reaction = this.reactions[reactionKey];
                if (entity.reactions.running != reaction && reaction.check && reaction.check(entity)) {
                    entity.reactions.current = reactionKey;
                    reaction.preApply(entity)
                }
            }
            entity.reactions.current && this.applyCurrentReaction(entity)
        },

        applyCurrentReaction: function (entity) {
            var reaction = this.reactions[entity.reactions.current];
            if (reaction.ignoreStun || !entity.hasStun()) {
                entity.postStun.choice = null;
                entity.cancelStun();
                reaction.apply(entity, this.actions);
                entity.collaboration && entity.addActionAttached(entity.collaboration);
                entity.reactions.running = reaction;
                entity.reactions.current = null
            }
        },

        updateAction: function (entity) {
            if (entity.reactions.restartAction) {
                entity.setAction(entity.reactions.restartAction);
                entity.reactions.restartAction = null
            } else if (entity.postStun.choice) {
                entity.damageTimer <= 0.2 && entity.cancelStun();
                if (!entity.hasStun()) {
                    entity.resetStunData();
                    this.startChoice(entity, entity.postStun.choice)
                }
            } else {
                var choice = this.states[entity.currentState].selectAction(entity);
                if (choice)
                    if (entity.hasStun()) {
                        entity.postStun.choice = choice;
                        entity.hitStable = sc.ATTACK_TYPE.MASSIVE
                    } else this.startChoice(entity, choice)
            }
        },

        startChoice: function (entity, choice) {
            entity.postStun.collab && entity.postStun.collab.start();
            for (var node = choice; node;) {
                if (node.conditions) node.conditions.onPerformed(entity, true);
                node = node.parent
            }
            entity.postStun.choice = null;
            entity.postStun.collab = null;
            entity.justEnteredState = false;
            entity.defaultConfig.apply(entity);
            choice.frequency && sc.combat.submitFrequency(entity, choice.frequency);
            entity.cancelStun();
            choice.preSwitchState && this.switchState(entity, choice.preSwitchState);
            choice.action ? entity.setAction(this.actions[choice.action]) : entity.setAction(null);
            entity.nextState = choice.postSwitchState
        },

        updateTarget: function (entity) {
            if (entity.target) {
                if (!sc.model.isForceCombat()) {
                    var distance = entity.distanceTo(entity.target);
                    entity.targetLoseTimer = distance > this.targetDetect.loseDistance ? entity.targetLoseTimer + ig.system.tick : 0;
                    entity.targetLoseTimer >= this.targetDetect.loseTime && entity.setTarget(null)
                }
            } else if (ig.game.playerEntity) {
                var player = ig.game.playerEntity,
                    distance = entity.distanceTo(player),
                    zDelta = Math.abs(entity.coll.pos.z - player.coll.pos.z);
                if (distance < this.targetDetect.detectDistance && (!this.targetDetect.detectZDelta || zDelta < this.targetDetect.detectZDelta))
                    this.targetDetect.onDistance
                        ? this.assignTarget(entity, player, true)
                        : this.targetDetect.onCloseBattle && player.targetedBy.length > 0 && this.assignTarget(entity, player, true)
            }
        },

        reselectTarget: function (entity, notify, forced, cancelAction) {
            var target = sc.combat.getEnemyTarget(entity);
            target && this.assignTarget(entity, target, notify, forced, cancelAction)
        },

        assignTarget: function (entity, target, notify, cancelAction, force) {
            entity.targetLoseTimer = 0;
            if (entity.target != target) {
                entity.setTarget(target, force);
                if (entity.target) {
                    assignTargetGuard++;
                    if (assignTargetGuard > 100) debugger;
                    else {
                        cancelAction || entity.cancelAction();
                        notify && this.targetDetect.notifyNeighbourRadius && sc.combat.notifyNearbyEnemiesOfTarget(entity, this.targetDetect.notifyNeighbourRadius)
                    }
                    assignTargetGuard--
                }
            }
        },

        damageUpdate: function (entity, attacker) {
            var root = attacker.getCombatantRoot();
            if (!entity.target && root != entity) {
                sc.combat.playerStartedCombat = true;
                this.assignTarget(entity, root, true)
            } else if (root == entity.target) entity.targetLoseTimer = 0
        },

        onNavigationFailed: function (entity, failCount) {
            failCount > 5 && entity.setTarget(null)
        },

        onStunEnd: function (entity) {
            entity.reactions.current && this.applyCurrentReaction(entity)
        },

        postActionUpdate: function (entity) {
            if ((!entity.params || !entity.params.isDefeated() && !entity.params.isLocked()) && !entity._killed && !entity.reactions.current && !entity.currentAction) {
                resolveDeferred(this, entity);
                entity.nextState || this.checkReactions(entity);
                if (!entity.currentAction) {
                    entity.nextState && !entity.hasStun() && this.switchState(entity, entity.nextState);
                    entity.nextState || this.updateAction(entity)
                }
            }
        },

        switchState: function (entity, state) {
            entity.currentAction && entity.cancelAction();
            var prevState = entity.currentState;
            entity.currentState = state;
            entity.nextState = null;
            entity.postStun.choice = null;
            entity.currentAction = null;
            entity.currentActionStep = null;
            entity.justEnteredState = true;
            resolveDeferred(this, entity);
            var stateDef = this.states[entity.currentState];
            if (stateDef) {
                var seamless = stateDef.seamlessStates && stateDef.seamlessStates.indexOf(prevState) != -1;
                prevState === state && (seamless = true);
                entity.setDefaultConfig(stateDef.entityConfig);
                if (!seamless) {
                    for (var trackerKey in entity.trackers) {
                        var tracker = entity.trackers[trackerKey];
                        tracker.onStateChange && tracker.onStateChange(entity)
                    }
                    sc.combat.initFrequencyTimers(entity)
                }
                entity.walkAnims && entity.walkAnims.preIdle && entity.setCurrentAnim(entity.walkAnims.preIdle, true, entity.walkAnims.idle)
            }
        },

        switchStateConfig: function (entity, state) {
            entity.setDefaultConfig(this.states[state].entityConfig)
        },

        isReadyToFight: function (entity) {
            return sc.combat.active && (!entity.currentAction || entity.currentAction.hint == "battle")
        },

        resolveHpBreak: function (attackInfo, entity, wasBroken, hpLoss, sourceEntity) {
            if (!(entity.hpBreakReached >= this.hpBreaks.length)) {
                wasBroken = false;
                for (var hpFraction = (entity.params.currentHp - hpLoss) / entity.params.getStat("hp"); entity.hpBreakReached < this.hpBreaks.length && hpFraction < this.hpBreaks[entity.hpBreakReached].hp;) {
                    spawnHealDrops(sourceEntity || entity, this.hpBreaks[entity.hpBreakReached].healDrop);
                    if (attackInfo && attackInfo.attackType == void 0) attackInfo.attackType = sc.ATTACK_TYPE.MASSIVE;
                    entity.hpBreakReached++;
                    entity.params.healStatus();
                    wasBroken = true
                }
                return wasBroken
            }
        },

        resolveDefeat: function (entity) {
            if (this.credit) {
                var credit = this.credit;
                entity.level.override && (credit = sc.EnemyLevelScaling.adaptCredits(credit, this.level, entity.level.override));
                sc.model.player.addCredit(credit, false, true)
            }
            if (this.exp) {
                var exp = sc.model.player.addExperience(this.exp, entity.level.override || this.level, 0, false, sc.LEVEL_CURVES.REGULAR);
                sc.stats.addMap("player", "expEnemies", exp)
            }
            this.resolveItemDrops(entity);
            var roll = Math.random(),
                partyHpFactor = sc.combat.getPartyHpFactor(sc.COMBATANT_PARTY.PLAYER);
            entity.dropHealOrb
                ? spawnHealDrops(entity, entity.dropHealOrb)
                : this.healDropRate && (partyHpFactor > 0.8 || (partyHpFactor < 0.1 && roll < 0.7 ? spawnHealDrops(entity, this.healDropRate) : partyHpFactor < 0.3 && roll < 0.5 ? spawnHealDrops(entity, this.healDropRate) : roll < 0.2 && spawnHealDrops(entity, this.healDropRate)))
        },

        resolveItemDrops: function (entity) {
            if (sc.model.player.getCore(sc.PLAYER_CORE.ITEMS))
                for (var drops = this.itemDrops, dropCount = drops.length, playerEntity = ig.game.playerEntity, dropChance = sc.model.player.params.getModifier("DROP_CHANCE") + 1, combatRank = sc.model.getCombatRank(), dropRateMultiplier = sc.model.getCombatRankDropRate() * sc.newgame.getDropRateMultiplier(); dropCount--;) {
                    var drop = drops[dropCount],
                        roll = Math.random();
                    if (!(drop.rank && combatRank < sc.model.getCombatRankByLabel(drop.rank)) && !(drop.boosted && entity.boosterState != sc.ENEMY_BOOSTER_STATE.BOOSTED) && roll <= drop.prob * (drop.prob == 1 ? 1 : dropChance) * dropRateMultiplier) {
                        var amount = drop.min || 1;
                        drop.max && (amount = amount + Math.floor((drop.max + 1 - amount) * Math.random()));
                        sc.ItemDropEntity.spawnDrops(entity, ig.ENTITY_ALIGN.CENTER, playerEntity, drop.item, amount, sc.ITEM_DROP_TYPE.ENEMY)
                    }
                }
        }
    });

    Vec2.create(); // leftover allocation in the compiled source

    sc.EnemyType.DETECT_TYPE = {
        DISTANCE: 1,
        VIEW: 2,
        NONE: 3
    };

    /**
     * An ordered list of `sc.COMBAT_CONDITION` entries. `check` returns true
     * only if every condition passes (each may be negated with a `!` prefix).
     */
    sc.CombatConditions = ig.Class.extend({
        conditions: [],
        init: function (conditionData) {
            for (var i = 0; i < conditionData.length; ++i) {
                var condition = this._parseCondition(conditionData[i]);
                this.conditions.push(condition)
            }
        },
        _parseCondition: function (conditionData) {
            var type = conditionData.type,
                negated = false;
            if (type.charAt(0) == "!") {
                type = type.substr(1);
                negated = true
            }
            if (!sc.COMBAT_CONDITION[type]) throw Error("Unknown Condition type '" + type + "'");
            var condition = new sc.COMBAT_CONDITION[type](conditionData);
            condition.not = negated;
            return condition
        },
        check: function (entity, argA, argB, argC) {
            ig.vars.pushEntityAccessor(entity);
            for (var i = 0; i < this.conditions.length; ++i) {
                var result = this.conditions[i].check(entity, argA, argB, argC);
                if (!this.conditions[i].not && !result || this.conditions[i].not && result) {
                    ig.vars.popEntityAccessor(entity);
                    return false
                }
            }
            ig.vars.popEntityAccessor(entity);
            return true
        },
        onReactionActivate: function (entity) {
            for (var i = this.conditions.length; i--;)
                if (this.conditions[i].onReactionActivate) this.conditions[i].onReactionActivate(entity)
        },
        onPerformed: function (entity, deferred) {
            for (var i = this.conditions.length; i--;) {
                var condition = this.conditions[i];
                if (condition.onPrePerformed) condition.onPrePerformed(entity);
                if (condition.onPerformed)
                    if (deferred) entity.deferredPerformedConds.push(condition);
                    else condition.onPerformed(entity)
            }
        }
    });

    /** Wraps a single enemy definition + its type reference + start/hide FX. */
    sc.EnemyInfo = ig.Class.extend({
        init: function (settings) {
            this.settings = settings;
            this.enemyType = new sc.EnemyType(settings.type);
            if (this.settings.startEffect) this.startFx = new ig.EffectHandle(this.settings.startEffect);
            if (this.settings.hideEffect) this.hideFx = new ig.EffectHandle(this.settings.hideEffect)
        },
        getSettings: function () {
            return this.settings
        },
        clearCached: function () {
            this.enemyType.decreaseRef();
            this.startFx && this.startFx.clearCached();
            this.hideFx && this.hideFx.clearCached()
        }
    });

    /** A named enemy state: its own entity config + choice tree. */
    sc.EnemyState = ig.Class.extend({
        name: "",
        entityConfig: {},
        choices: [],
        seamlessStates: null,
        appearAction: null,
        init: function (name, stateData, parentConfig) {
            this.name = name;
            this.seamlessStates = stateData.seamlessStates || null;
            this.entityConfig = new ig.ActorConfig;
            this.entityConfig.loadFromData(stateData, parentConfig);
            this.appearAction = stateData.appearAction || null;
            parseChoices(this.choices, stateData.choices)
        },
        selectAction: function (entity) {
            var random = Math.random();
            return selectChoice(this.choices, entity, random)
        }
    })
});
ig.baked = !0;

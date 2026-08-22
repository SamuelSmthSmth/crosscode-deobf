/**
 * game.feature.combat.entities.enemy
 * ===================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.combat.entities.enemy")`.
 *
 * The `ig.ENTITY.Enemy` combatant: extends `ig.ENTITY.Combatant` with the
 * enemy AI glue — state machine hooks, reactions, HP-breaks, dodge/counter
 * timers, target detection, element modes, HP-attached minions, and defeat
 * rewards. Also registers the `ig.ACTOR_CONFIGS.ENEMY` defaults.
 */
ig.module("game.feature.combat.entities.enemy")
    .requires("game.feature.combat.entities.combatant", "game.feature.combat.model.enemy-type", "game.feature.combat.model.enemy-annotation", "game.feature.new-game.new-game-model")
    .defines(function () {

    Vec2.create(); // leftover allocation in the compiled source

    // Shared scratch object passed into hit-reaction checks (filled per hit).
    var HIT_DATA = {
        damagingEntity: null,
        attackInfo: null,
        partEntity: null,
        damageResult: null,
        shielded: false,
        hpBroken: null,
        killed: false,
        weakness: false,
        dramaticEffect: null
    };

    sc.ENEMY_HP_BAR = {
        AUTO: 0,
        VISIBLE: 1,
        HIDDEN: 2
    };
    sc.ENEMY_BOOSTER_STATE = {
        NONE: 0,
        BOOSTABLE: 1,
        BOOSTED: 2
    };

    ig.ENTITY.Enemy = ig.ENTITY.Combatant.extend({
        party: sc.COMBATANT_PARTY.ENEMY,
        aggression: sc.ENEMY_AGGRESSION.THREAT,
        enemyName: null,
        enemyType: null,
        enemyGroup: null,
        defeatVarIncrease: null,
        enemyTypeInitialized: false,
        dropHealOrb: 0,
        hpAttached: {
            enemy: null,
            value: 0
        },
        spawnPoint: Vec3.create(),
        currentState: null,
        postStun: {
            choice: null,
            collab: null
        },
        nextState: null,
        nextTimerChange: null,
        stateTimers: {},
        trackers: {},
        deferredPerformedConds: [],
        targetLoseTimer: 0,
        reactions: {
            enabled: [],
            current: null,
            running: null,
            restartAction: null
        },
        dodge: {
            count: 0,
            timer: 0,
            blocked: 0,
            counterReactTime: 0,
            counterCooldown: 0,
            counterCooldownMax: 0
        },
        annotate: {
            active: 0,
            passive: 0,
            weapon: 0,
            element: 0,
            extra: null
        },
        hpBreakReached: 0,
        lastPoICheck: null,
        targetFixed: false,
        collaboration: null,
        collabAttribs: null,
        elementModes: null,
        storedEnemies: [],
        ownerEnemy: null,
        cameraZFocus: 0,
        startEffect: null,
        targetOnSpawn: false,
        boosterState: 0,
        level: {
            override: null,
            setting: null
        },
        visibility: {
            analyzable: true,
            hpBar: sc.ENEMY_HP_BAR.AUTO
        },
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                enemyInfo: {
                    _type: "EnemyType",
                    _info: "Enemy information",
                    _popup: true
                },
                spawnCondition: {
                    _type: "VarCondition",
                    _info: "Condition for Enemy to spawn",
                    _popup: true
                },
                manualKill: {
                    _type: "VarName",
                    _info: "Instead of killing the enemy, set specified variable to true.",
                    _optional: true
                }
            },
            label: function () {
                return ""
            },
            drawBox: true,
            boxColor: "rgba(255,0,0, 0.5)"
        }),

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.setSize(24, 24, 0);
            Vec3.assign(this.spawnPoint, this.coll.pos);
            if (settings.enemyInfo) {
                this.enemyName = settings.enemyInfo.type;
                this.enemyType = new sc.EnemyType(settings.enemyInfo.type);
                this.enemyGroup = settings.enemyInfo.group;
                this.currentState = settings.enemyInfo.state || null;
                this.dropHealOrb = settings.enemyInfo.dropHealOrb || 0;
                if (settings.enemyInfo.startEffect) this.startEffect = new ig.EffectHandle(settings.enemyInfo.startEffect);
                if (settings.enemyInfo.hideEffect) this.hideAction = new ig.Action("enemyHide", [{
                    type: "SHOW_EFFECT",
                    effect: settings.enemyInfo.hideEffect,
                    wait: true,
                    align: "CENTER"
                }, {
                    type: "HIDE"
                }]);
                if (settings.enemyInfo.varIncrease) {
                    this.defeatVarIncrease = settings.enemyInfo.varIncrease;
                    ig.vars.setDefault(this.defeatVarIncrease, 0)
                }
                this.targetOnSpawn = settings.enemyInfo.targetOnSpawn || false;
                this.level.setting = sc.newgame.get("scale-enemies") && !settings.enemyInfo.disableNoScale && !ig.vars.get("g.newgame.intro") ? sc.model.player.getParamAvgLevel(4) : settings.enemyInfo.level || null;
                if (settings.enemyInfo.party) this.party = sc.COMBATANT_PARTY[settings.enemyInfo.party];
                var attribs = settings.enemyInfo.attribs;
                for (var attribKey in attribs) this.setAttribute(attribKey, attribs[attribKey]);
                var face = ig.ActorEntity.FACE8.SOUTH;
                settings.enemyInfo.face && (face = ig.ActorEntity.FACE8[settings.enemyInfo.face] || ig.ActorEntity.FACE8.NORTH);
                ig.ActorEntity.getFaceVec(face, this.face);
                if (window.wm) {
                    this._wm = this._wm.copy();
                    this._wm.drawBox = false;
                    this.enemyType.initEntity(this);
                    this.initAnimations()
                }
            }
            this.manualKill = settings.manualKill || null;
            this.ownerEnemy = settings.ownerEnemy || null;
            this.boosterState = settings.boostable ? sc.ENEMY_BOOSTER_STATE.BOOSTABLE : sc.ENEMY_BOOSTER_STATE.NONE;
            settings.startAction && this.setAction(settings.startAction)
        },

        setElementMode: function (element, silent) {
            if (this.elementModes && this.elementModes.current != element) {
                this.params.setBaseParams(this.elementModes.modes[element], silent);
                if (silent) ig.EffectTools.clearEffects(this, "modeAura");
                else {
                    sc.combat.showModeChange(this, element);
                    sc.combat.showModeAura(this, element)
                }
                this.elementModes.current = element
            }
        },

        getQuickMenuSettings: function () {
            return {
                type: "Enemy",
                disabled: !this.params || !this.visibility.analyzable || !sc.combat.isEnemyAnalyzable(this.enemyName)
            }
        },

        // Split this enemy's HP among the given minion enemies (HP-attached).
        connectHpToEnemies: function (enemies) {
            for (var value = this.params.getHpFactor() / enemies.length, i = enemies.length; i--;) {
                var minion = enemies[i];
                minion.hpAttached.enemy = this;
                minion.hpAttached.value = value
            }
        },

        setLevelOverride: function (level) {
            this.level.override = level;
            this.enemyTypeInitialized && this.enemyType.updateParams(this)
        },

        getLevel: function () {
            return this.level.override || this.enemyType.level
        },

        storeEnemy: function (enemy) {
            this.storedEnemies.push(enemy)
        },

        onStoredRelease: function () {
            this.show(true);
            for (var i = 0; i < this.reactions.enabled.length; ++i) {
                var reactionKey = this.reactions.enabled[i],
                    reaction = this.enemyType.reactions[reactionKey];
                if (reaction.type == "STORE_RELEASE") {
                    this.reactions.current = reactionKey;
                    reaction.onStoredRelease(this);
                    return true
                }
            }
        },

        onEnemyEvent: function (target, eventType, settings) {
            for (var i = 0; i < this.reactions.enabled.length; ++i) {
                var reactionKey = this.reactions.enabled[i],
                    reaction = this.enemyType.reactions[reactionKey];
                if (reaction.type == "ENEMY_EVENT" && reaction.checkEnemyEvent(this, target, eventType, settings)) {
                    this.reactions.current = reactionKey;
                    reaction.onEnemyEvent(this, this.enemyType.actions);
                    return true
                }
            }
        },

        onMagnetStart: function () {
            if (this.isDefeated()) return false;
            if (this.onEnemyEvent(this.target, sc.COMBAT_ENEMY_EVENT.MAGNET_PULL, null)) {
                this.invincibleTimer = -1;
                this.coll.setType(ig.COLLTYPE.IGNORE);
                this.damageTimer = 1E3;
                return true
            }
        },
        onMagnetEnd: function () {
            this.damageTimer = this.invincibleTimer = 0;
            this.cancelAction()
        },

        isBoss: function () {
            return this.enemyType.boss
        },
        getHeadIdx: function () {
            return this.enemyType.headIdx
        },

        show: function (visible) {
            this.parent(visible);
            var currentAction = this.currentAction;
            this.level.setting && this.setLevelOverride(1 * ig.Event.getExpressionValue(this.level.setting));
            this.enemyType.initEntity(this);
            this.initAnimations();
            if (!visible) {
                this.animState.alpha = 0;
                var appearAction = this.enemyType.getAppearAction(this);
                if (currentAction || !appearAction) this.startEffect ? this.startEffect.spawnOnTarget(this) : ig.game.effects.teleport.spawnOnTarget("showDefault", this);
                this.setAction(currentAction || appearAction || DEFAULT_START_ACTION)
            }
            this.targetOnSpawn && this.enemyType.reselectTarget(this, false, true, true)
        },

        onHideRequest: function () {
            this.statusGui && this.statusGui.remove();
            this.statusGui = null;
            if (!this.dying) {
                ig.EffectTools.clearEffects(this);
                this.setAction(this.hideAction || DEFAULT_HIDE_ACTION)
            }
        },

        hide: function () {
            ig.EffectTools.clearEffects(this);
            this.parent()
        },

        onKill: function (silent) {
            this.parent(silent);
            silent || this._delegateDamage();
            this.startEffect && this.startEffect.clearCached();
            this.hideAction && this.hideAction.clearCached();
            this.enemyType.onEntityKill(this);
            this.enemyType.decreaseRef()
        },

        regenPvp: function (afterCombat) {
            this.parent(afterCombat);
            this.setElementMode(sc.ELEMENT.NEUTRAL);
            this.postStun.choice = null;
            this.reactions.current = null;
            this.reactions.restartAction = null
        },

        update: function () {
            if (this.dodge.counterCooldownMax) {
                this.dodge.counterCooldown = this.dodge.counterCooldown + ig.system.tick;
                if (this.dodge.counterCooldown >= this.dodge.counterCooldownMax) this.dodge.counterCooldownMax = this.dodge.counterCooldown = 0
            }
            if (this.dodge.timer > 0) {
                this.dodge.timer = this.dodge.timer - ig.system.tick;
                if (this.dodge.timer <= 0) {
                    this.dodge.timer = 0;
                    this.dodge.count = 0;
                    this.dodge.blocked = false
                }
            }
            this.ownerEnemy && (this.ownerEnemy.isDefeated() && !this.isDefeated()) && this.instantDefeat();
            this.enemyType && !this.enemyTypeInitialized && this.enemyType.initEntity(this);
            if (this.enemyType && this.enemyType.isReadyToFight(this)) {
                this.targetFixed = false;
                for (var timerKey in this.stateTimers) this.stateTimers[timerKey] = this.stateTimers[timerKey] - ig.system.tick;
                for (var trackerKey in this.trackers) {
                    var tracker = this.trackers[trackerKey];
                    tracker.update && tracker.update()
                }
                this.enemyType.update(this)
            } else this.targetFixed || this.setTarget(null);
            this.parent()
        },

        onTargetHit: function (victim, attackInfo, damageResult, shieldResult, force) {
            if (shieldResult == sc.SHIELD_RESULT.PERFECT && !force.isBall) {
                victim.combo && victim.combo.guardTrapTime && this.setCounterCooldown();
                for (var i = 0; i < this.reactions.enabled.length; ++i) {
                    var reactionKey = this.reactions.enabled[i],
                        reaction = this.enemyType.reactions[reactionKey];
                    if (reaction.type == "GUARD_COUNTER" && reaction.onGuardCounterCheck(this)) {
                        this.reactions.current = reactionKey;
                        reaction.onGuardCountered(this, victim);
                        return true
                    }
                }
            }
            this.parent(victim, attackInfo, damageResult, shieldResult)
        },

        setCounterCooldown: function () {
            for (var key in this.enemyType.reactions) {
                var reaction = this.enemyType.reactions[key];
                if (reaction.type == "COUNTER_COUNTER") {
                    this.dodge.counterCooldownMax = reaction.cooldown;
                    this.dodge.counterCooldown = 0;
                    break
                }
            }
        },

        onFallBehavior: function (terrain) {
            for (var i = 0; i < this.reactions.enabled.length; ++i) {
                var reactionKey = this.reactions.enabled[i],
                    reaction = this.enemyType.reactions[reactionKey];
                if (reaction.type == "FALL" && reaction.checkFall(terrain)) {
                    if (this.reactions.running == reaction) return true;
                    reaction.onFall(this);
                    this.reactions.current = reactionKey;
                    return true
                }
            }
            return false
        },

        postActionUpdate: function () {
            this.enemyType && this.enemyType.isReadyToFight(this) && this.enemyType.postActionUpdate(this)
        },
        onStunEnd: function () {
            if (this.enemyType && this.enemyType.isReadyToFight(this)) this.enemyType.onStunEnd(this)
        },

        changeState: function (state, immediate, updateConfig) {
            if (this.enemyType)
                if (immediate) {
                    this.cancelAction();
                    this.enemyType.initEntity(this);
                    this.enemyType.switchState(this, state)
                } else {
                    this.nextState = state;
                    updateConfig && this.enemyType.switchStateConfig(this, state)
                }
        },

        onPreDamageModification: function (result, force, attackInfo, partEntity, damageResult, shieldResult, hitIgnore) {
            var reacted = false;
            HIT_DATA.damagingEntity = force;
            HIT_DATA.attackInfo = attackInfo;
            HIT_DATA.partEntity = partEntity;
            HIT_DATA.damageResult = damageResult;
            HIT_DATA.shielded = shieldResult;
            HIT_DATA.weakness = 0;
            HIT_DATA.dramaticEffect = null;
            var random = Math.random();
            reacted = this._checkHitReactions(result, force, random, false);
            if (result.damageResult) damageResult = result.damageResult;
            var damage = damageResult && damageResult.damage || 0;
            var hpBreak = 0;
            HIT_DATA.killed = false;
            if (!hitIgnore) {
                if (damageResult && this.enemyType.resolveHpBreak(result, this, force.getCombatant(), damageResult.damage)) {
                    hpBreak = this.hpBreakReached;
                    reacted = true
                }
                HIT_DATA.killed = this.params && this.params.currentHp > 0 && this.params.currentHp - damage <= 0;
                HIT_DATA.killed && (hpBreak = 0)
            }
            HIT_DATA.hpBroken = hpBreak;
            reacted = this._checkHitReactions(result, force, random, true) || reacted;
            HIT_DATA.dramaticEffect && sc.combat.doDramaticEffect(force.getCombatantRoot(), this, HIT_DATA.dramaticEffect);
            HIT_DATA.killed && !result.survive && this._delegateDamage();
            return reacted
        },

        _delegateDamage: function () {
            if (this.hpAttached.enemy) {
                var damage = Math.ceil(this.hpAttached.enemy.params.getStat("hp") * this.hpAttached.value);
                this.hpAttached.enemy.instantDamage(damage, 2, this);
                this.hpAttached.enemy = null
            }
        },

        onInstantDamage: function (damage, source) {
            var hpBreak = 0;
            HIT_DATA.damagingEntity = ig.game.playerEntity;
            HIT_DATA.attackInfo = null;
            HIT_DATA.partEntity = null;
            HIT_DATA.damageResult = null;
            HIT_DATA.shielded = false;
            HIT_DATA.weakness = 0;
            HIT_DATA.dramaticEffect = null;
            if (this.enemyType.resolveHpBreak(null, this, ig.game.playerEntity, damage, source)) hpBreak = this.hpBreakReached;
            HIT_DATA.killed = this.params && this.params.currentHp > 0 && this.params.currentHp - damage <= 0;
            HIT_DATA.killed && (hpBreak = 0);
            HIT_DATA.hpBroken = hpBreak;
            var result = { survive: false };
            (HIT_DATA.killed || HIT_DATA.hpBroken) && this._checkHitReactions(result, ig.game.playerEntity, Math.random(), true);
            HIT_DATA.dramaticEffect && sc.combat.doDramaticEffect(ig.game.playerEntity, source || this, HIT_DATA.dramaticEffect);
            HIT_DATA.killed && !result.survive && this._delegateDamage();
            return result.survive
        },

        _checkHitReactions: function (result, force, random, isHit) {
            for (var reacted = false, i = 0; i < this.reactions.enabled.length; ++i) {
                HIT_DATA.weakness = 0;
                var reactionKey = this.reactions.enabled[i],
                    reaction = this.enemyType.reactions[reactionKey];
                if (reaction.type == "HIT_REACTION") {
                    var nonInterrupting = !reaction.needInterrupt();
                    if (isHit || nonInterrupting || !(reaction.hitType != sc.HIT_REACTION_TYPE.FORCE_HIT && this.reactions.current))
                        if (reaction.checkHit(this, random, HIT_DATA, result, isHit)) {
                            if (!nonInterrupting) this.reactions.current = reactionKey;
                            reaction.hitApply(this, force, HIT_DATA, result, this.enemyType.actions);
                            if (HIT_DATA.weakness >= 1 && reaction.dramaticEffect) {
                                this.statusGui.clearStatusEntry("BREAK");
                                result.weakness = 0
                            }
                            reacted = true;
                            if (!nonInterrupting) return true
                        } else {
                            if (HIT_DATA.weakness && reaction.dramaticEffect) {
                                reaction.partFocus ? this.statusGui.setReplaceTarget(ig.CollTools.getNamedSubCollEntity(this.coll, reaction.partFocus)) : this.statusGui.setReplaceTarget(null);
                                result.weakness = HIT_DATA.weakness
                            }
                            if (reaction.ignoreFailed && !HIT_DATA.weakness) result.ignoreHit = true
                        }
                }
            }
            return reacted
        },

        collabReady: function (collabKey) {
            for (var i = 0; i < this.reactions.enabled.length; ++i) {
                var reaction = this.enemyType.reactions[this.reactions.enabled[i]];
                if (reaction.type == "COLLAB" && reaction.isReady(this, collabKey)) return true
            }
        },

        doCollabReaction: function (collabKey) {
            if (!this.collaboration) throw Error("Tried to do collab reaction without collaboration set. Should never happen!");
            for (var i = 0; i < this.reactions.enabled.length; ++i) {
                var reactionKey = this.reactions.enabled[i],
                    reaction = this.enemyType.reactions[reactionKey];
                if (reaction.type == "COLLAB" && reaction.collabKey == collabKey) {
                    this.reactions.current = reactionKey;
                    this.enemyType.applyCurrentReaction(this);
                    break
                }
            }
        },

        getEnemyAction: function (name) {
            var action = this.enemyType.actions[name];
            if (!action) throw Error("Enemy does not has action of Name: " + name);
            return action
        },
        doEnemyAction: function (name, fromCurrent, inline) {
            var action = this.enemyType.actions[name];
            if (!action) throw Error("Enemy does not has action of Name: " + name);
            if (inline) {
                if (!fromCurrent) {
                    this.clearActionAttached();
                    this.defaultConfig.apply(this)
                }
                this.pushInlineAction(action)
            } else this.setAction(action, false, fromCurrent)
        },

        onDamage: function (force, attackInfo, source) {
            var handled = this.parent(force, attackInfo, source);
            handled && !attackInfo.limiter.noAggro && !attackInfo.hasNoEffect() && this.enemyType && this.enemyType.damageUpdate(this, force);
            return handled
        },

        onNavigationFailed: function (failCount) {
            sc.model.isForceCombat() || this.enemyType && this.enemyType.onNavigationFailed(this, failCount)
        },

        onDefeat: function (silent) {
            this.defeatVarIncrease && ig.vars.add(this.defeatVarIncrease, 1);
            silent || this.enemyType.resolveDefeat(this)
        },

        enableReactions: function (reactionKeys) {
            if (reactionKeys)
                for (var i = reactionKeys.length; i--;) {
                    var reactionKey = reactionKeys[i];
                    if (this.reactions.enabled.indexOf(reactionKey) == -1) this.enemyType.reactions[reactionKey].onActivate(this)
                }
            this.reactions.enabled.length = 0;
            reactionKeys && this.reactions.enabled.push.apply(this.reactions.enabled, reactionKeys)
        },
        enableReaction: function (reactionKey) {
            if (this.reactions.enabled.indexOf(reactionKey) == -1) {
                this.reactions.enabled.push(reactionKey);
                this.enemyType.reactions[reactionKey].onActivate(this)
            }
        },
        disableReaction: function (reactionKey) {
            var index = this.reactions.enabled.indexOf(reactionKey);
            index != -1 && this.reactions.enabled.splice(index, 1)
        },

        onVarAccess: function (accessor, path) {
            return path[1] == "dodgeBlocked" ? this.dodge.blocked
                : path[1] == "hpBreak" ? this.hpBreakReached
                : path[1] == "level" ? this.getLevel()
                : path[1] == "storedEnemyCnt" ? this.storedEnemies.length
                : path[1] == "ownerAttrib" ? !this.ownerEnemy ? null : ig.vars.resolveObjectAccess(this.ownerEnemy.attributes, path, 2)
                : path[1] == "owner" ? !this.ownerEnemy ? null : ig.vars.forwardEntityVarAccess(this.ownerEnemy, path, 2)
                : path[1] == "collab" ? !this.collaboration ? null : this.collaboration.onVarAccess(accessor, path)
                : this.parent(accessor, path)
        }
    });

    ig.ACTOR_CONFIGS.ENEMY = {
        classType: ig.ENTITY.Enemy,
        KEYS: {
            enabledReactions: [],
            aggression: sc.ENEMY_AGGRESSION.THREAT,
            regenFactor: 0,
            stunEscapeTime: 0,
            annotate: {},
            size: Vec3.createC(16, 16, 16),
            analyzable: true,
            hpBar: sc.ENEMY_HP_BAR.AUTO
        },
        fromDataFix: function () {
            typeof this.aggression == "string" && (this.aggression = sc.ENEMY_AGGRESSION[this.aggression]);
            typeof this.hpBar == "string" && (this.hpBar = sc.ENEMY_HP_BAR[this.hpBar]);
            if (this.annotate) {
                var annotate = this.annotate;
                if (annotate.extra && annotate.extra instanceof Array) {
                    var extraList = annotate.extra,
                        extraFlags = 0;
                    for (var i = 0; i < extraList.length; ++i) extraFlags = extraFlags | sc.ENEMY_ANNO_EXTRA[extraList[i]];
                    annotate.extra = extraFlags
                }
                typeof annotate.active == "string" && (annotate.active = sc.ENEMY_ANNO_ACTIVE[annotate.active]);
                typeof annotate.passive == "string" && (annotate.passive = sc.ENEMY_ANNO_PASSIVE[annotate.passive]);
                typeof annotate.weapon == "string" && (annotate.weapon = sc.ENEMY_ANNO_WEAPON[annotate.weapon]);
                typeof annotate.element == "string" && (annotate.element = sc.ENEMY_ANNO_ELEMENT[annotate.element])
            } else this.annotate = {}
        },
        apply: function (entity) {
            entity.enableReactions(this.enabledReactions);
            if (entity.aggression != this.aggression) {
                entity.aggression = this.aggression;
                if (entity.target) {
                    var target = entity.target;
                    entity.setTarget(null);
                    entity.setTarget(target)
                }
            }
            entity.visibility.analyzable = this.analyzable == void 0 ? true : this.analyzable;
            entity.visibility.hpBar = this.hpBar;
            entity.regenFactor = this.regenFactor;
            entity.stunData.stunEscapeTime = this.stunEscapeTime || 0;
            entity.annotate.active = this.annotate.active || 0;
            entity.annotate.passive = this.annotate.passive || 0;
            entity.annotate.weapon = this.annotate.weapon || 0;
            entity.annotate.extra = this.annotate.extra || 0;
            entity.annotate.element = this.annotate.element || 0;
            this.size && !window.wm && entity.coll.setSize(this.size.x, this.size.y, this.size.z, true)
        },
        load: function (entity) {
            this.enabledReactions = ig.copy(entity.reactions.enabled);
            this.stunEscapeTime = entity.stunData.stunEscapeTime;
            this.aggression = entity.aggression;
            this.regenFactor = entity.regenFactor;
            this.annotate = {
                active: entity.annotate.active,
                passive: entity.annotate.passive,
                weapon: entity.annotate.weapon,
                extra: entity.annotate.extra,
                element: entity.annotate.element
            };
            this.analyzable = entity.visibility.analyzable;
            this.hpBar = entity.visibility.hpBar
        }
    };

    // Default enemy start/hide actions (used when the JSON defines none).
    var DEFAULT_START_ACTION = new ig.Action("enemyStart", [{
            type: "WAIT",
            time: 0.4
        }]),
        DEFAULT_HIDE_ACTION = new ig.Action("enemyHide", [{
            type: "SHOW_EFFECT",
            effect: {
                sheet: "teleport",
                name: "hideDefault"
            },
            wait: true,
            align: "CENTER"
        }, {
            type: "HIDE"
        }])
});
ig.baked = !0;

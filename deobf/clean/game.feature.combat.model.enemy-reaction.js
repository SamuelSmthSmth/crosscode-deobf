/**
 * game.feature.combat.model.enemy-reaction
 * =========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.combat.model.enemy-reaction")`.
 *
 * Enemy "reactions" — interrupt-style behaviors triggered by events rather
 * than the normal state/choice AI: HIT_REACTION (react to being hit),
 * TARGET_DISTANCE, MOVEMENT_BLOCK, COLLAB, GUARD_COUNTER, ENEMY_EVENT,
 * STORE_RELEASE, DODGE, COUNTER_COUNTER, FALL. Each is a subclass of the
 * internal `EnemyReactionBase`; the `sc.ENEMY_REACTION` registry is keyed by
 * `type`. `sc.HIT_REACTION_TYPE` enumerates the hit situations.
 */
ig.module("game.feature.combat.model.enemy-reaction")
    .requires("impact.base.loader", "game.feature.combat.model.combat-params", "game.feature.combat.model.combat-condition", "impact.base.animation", "game.feature.combat.entities.combatant", "game.feature.combat.combat-target-event")
    .defines(function () {

    // Shared trace-result scratch for line-of-sight checks.
    var TRACE_SCRATCH = {};

    var EnemyReactionBase = ig.Class.extend({
        name: "",
        type: 0,
        action: null,
        postSwitchState: null,
        ignoreStun: false,
        restartPrevAction: false,

        init: function (name, config) {
            this.name = name;
            this.type = config.type;
            this.action = config.action || null;
            this.postSwitchState = config.postSwitchState || null;
            this.restartPrevAction = config.restartPrevAction || false
        },

        onActivate: function () {},
        preApply: function () {},
        apply: function (entity, actions) {
            if (this.restartPrevAction) entity.reactions.restartAction = entity.currentAction;
            this.action && entity.setAction(actions[this.action]);
            entity.nextState = this.postSwitchState
        },
        check: null
    });

    sc.ENEMY_REACTION = {};
    sc.HIT_REACTION_TYPE = {
        REGULAR: 1,
        FORCE_HIT: 2,
        HP_BREAK_HIT: 3,
        KILL_HIT: 4,
        KILL_SURVIVE: 5
    };

    var STUN_CHANGE = {
        FORCE_STUN: 1,
        FORCE_STABLE: 2,
        NO_CHANGE: 3
    };

    sc.ENEMY_REACTION.HIT_REACTION = EnemyReactionBase.extend({
        preAction: null,
        preSwitchState: null,
        blockFurtherHits: false,
        damageFactor: void 0,
        attackType: 0,
        flyLevel: null,
        forceStable: false,
        conditions: null,
        dramaticEffect: null,
        alignFace: false,
        _wm: new ig.Config({
            attributes: {
                hitType: {
                    _type: "String",
                    _info: "Type of hit reaction. Careful: FORCE_HIT will always cancel ANY other concurrent reaction.",
                    _select: sc.HIT_REACTION_TYPE
                },
                preAction: {
                    _type: "EnemyActionRef",
                    _info: "An Action that is very quickly executed before enemy is damaged. Any step that is not executed immediately will CANCEL this action",
                    _optional: true
                },
                preSwitchState: {
                    _type: "EnemyStateRef",
                    _info: "State to switch to before reaction starts",
                    _optional: true
                },
                postSwitchState: {
                    _type: "EnemyStateRef",
                    _info: "State to switch to after reaction ended",
                    _optional: true
                },
                action: {
                    _type: "EnemyActionRef",
                    _info: "Action to perform on reaction",
                    _optional: true
                },
                blockFurtherHits: {
                    _type: "Boolean",
                    _info: "If true - increase hitStable to withstand all following hits"
                },
                damageFactor: {
                    _type: "Number",
                    _info: "Damange factor applied on this attack",
                    _optional: true,
                    _default: 1
                },
                attackType: {
                    _type: "String",
                    _info: "If defined: change attackType of hit",
                    _withNull: true,
                    _select: sc.ATTACK_TYPE
                },
                flyLevel: {
                    _type: "String",
                    _info: "If defined: change flyLevel of hit",
                    _withNull: true,
                    _select: sc.COMBAT_FLY_LEVEL
                },
                stunChange: {
                    _type: "String",
                    _info: "Determines how Hit reaction will impact attack stun. NO_IMPACT: Will not influence hit stun in any way",
                    _select: STUN_CHANGE
                },
                alignFace: {
                    _type: "Boolean",
                    _info: "If true, then entity should watch towards hit direction"
                },
                dramaticEffect: {
                    _type: "String",
                    _info: "Dramatik effect of Reaction",
                    _withNull: true,
                    _select: sc.DRAMATIC_EFFECT
                },
                conditions: {
                    _type: "CombatConditions",
                    _info: "Additional conditions for hit condition"
                },
                walkAnims: {
                    _type: "String",
                    _info: "Override walk animation prior to damage",
                    _optional: true
                },
                ignoreFailed: {
                    _type: "Boolean",
                    _info: "If true: ignore hit if hit reaction is active but hit doesn't trigger it"
                },
                partFocus: {
                    _type: "String",
                    _info: "If defined: set status bar to be located at part of given name",
                    _optional: true
                }
            }
        }),
        init: function (name, config) {
            this.parent(name, config);
            this.hitType = sc.HIT_REACTION_TYPE[config.hitType] || sc.HIT_REACTION_TYPE.REGULAR;
            this.preAction = config.preAction || null;
            this.preSwitchState = config.preSwitchState || null;
            this.blockFurtherHits = config.blockFurtherHits || false;
            this.damageFactor = config.damageFactor;
            this.attackType = sc.ATTACK_TYPE[config.attackType] || 0;
            this.flyLevel = config.flyLevel || null;
            this.stunChange = STUN_CHANGE[config.stunChange] || STUN_CHANGE.FORCE_STUN;
            this.alignFace = config.alignFace || false;
            this.dramaticEffect = sc.DRAMATIC_EFFECT[config.dramaticEffect] || null;
            this.walkAnims = config.walkAnims || null;
            this.ignoreFailed = config.ignoreFailed || false;
            this.partFocus = config.partFocus || null;
            var conditions = config.conditions;
            if (conditions) this.conditions = new sc.CombatConditions(conditions)
        },
        onActivate: function (entity) {
            this.conditions && this.conditions.onReactionActivate(entity)
        },
        needInterrupt: function () {
            return this.action || this.postSwitchState || this.preSwitchState || this.stunChange == STUN_CHANGE.FORCE_STUN
        },
        hitApply: function (entity, attacker, hitData, result, actions) {
            entity.threat = attacker.getCombatant();
            this.conditions && this.conditions.onPerformed(entity);
            var recompute = false;
            if (this.preAction) {
                entity.stashAction(true);
                entity.setAction(actions[this.preAction]);
                entity.forceExecuteAction();
                entity.resumeStashedAction(true)
            }
            if (this.hitType == sc.HIT_REACTION_TYPE.HP_BREAK_HIT) {
                entity.setCombatStat("breaks", 0);
                entity.setCombatStat("guardCounters", 0)
            }
            var attackerRoot = attacker.getCombatantRoot();
            if (attackerRoot && attackerRoot.party == sc.COMBATANT_PARTY.PLAYER && this.dramaticEffect && this.dramaticEffect.break) {
                sc.stats.addMap("combat", "enemyBreaks", 1);
                sc.arena.onEnemyBreak(entity);
                entity.addCombatStat("breaks", 1)
            }
            if (this.damageFactor != void 0) {
                result.damageFactor = result.damageFactor * this.damageFactor;
                recompute = true
            }
            if (this.stunChange != STUN_CHANGE.NO_CHANGE) {
                if (this.attackType) result.attackType = this.attackType;
                if (this.flyLevel) result.flyLevel = this.flyLevel;
                if (this.preSwitchState) {
                    entity.enemyType.switchState(entity, this.preSwitchState);
                    recompute = true
                }
                if (this.stunChange == STUN_CHANGE.FORCE_STABLE) result.hitStable = sc.ATTACK_TYPE.BREAK;
                else {
                    result.hitStable = sc.ATTACK_TYPE.NONE;
                    entity.cancelAction()
                }
                if (this.blockFurtherHits) entity.hitStable = sc.ATTACK_TYPE.MASSIVE;
                this.walkAnims && entity.setWalkAnims(this.walkAnims)
            }
            if (this.alignFace) result.alignFace = true;
            if (this.dramaticEffect) hitData.dramaticEffect = this.dramaticEffect;
            if (this.hitType == sc.HIT_REACTION_TYPE.KILL_SURVIVE) {
                result.survive = true;
                entity.params.damageFactor = 0
            }
            if (recompute && entity.params && hitData.attackInfo && hitData.attackInfo.attackerParams && (this.hitType == sc.HIT_REACTION_TYPE.REGULAR || this.hitType == sc.HIT_REACTION_TYPE.FORCE_HIT))
                result.damageResult = entity.params.getDamage(hitData.attackInfo, result.damageFactor, attacker.getCombatant())
        },
        checkHit: function (entity, random, hitData, result, isHit) {
            if (isHit) {
                if (this.hitType == sc.HIT_REACTION_TYPE.REGULAR || this.hitType == sc.HIT_REACTION_TYPE.FORCE_HIT || this.hitType == sc.HIT_REACTION_TYPE.HP_BREAK_HIT && !hitData.hpBroken || this.hitType == sc.HIT_REACTION_TYPE.KILL_HIT && !hitData.killed || this.hitType == sc.HIT_REACTION_TYPE.KILL_SURVIVE && !hitData.killed) return false
            } else if (this.hitType != sc.HIT_REACTION_TYPE.REGULAR && this.hitType != sc.HIT_REACTION_TYPE.FORCE_HIT) return false;
            return !this.conditions ? true : this.conditions.check(entity, random, hitData, result)
        }
    });

    var tmpVec2A = Vec2.create(),
        tmpVec2B = Vec2.create(),
        tmpVec3 = Vec3.create();

    sc.ENEMY_REACTION.TARGET_DISTANCE = EnemyReactionBase.extend({
        minDistance: null,
        maxDistance: null,
        _wm: new ig.Config({
            attributes: {
                minDistance: {
                    _type: "Number",
                    _info: "Minimum Distance to target to trigger"
                },
                maxDistance: {
                    _type: "Number",
                    _info: "Maximum Distance to target to trigger"
                },
                preSwitchState: {
                    _type: "EnemyStateRef",
                    _info: "State to switch to before reaction starts",
                    _optional: true
                },
                postSwitchState: {
                    _type: "EnemyStateRef",
                    _info: "State to switch to after reaction ended",
                    _optional: true
                },
                targetFace: {
                    _type: "Number",
                    _info: "If defined, only activate if target is looking at enemy with given range. 0.5 = maximum 45 degree away",
                    _optional: true
                },
                ownFace: {
                    _type: "Number",
                    _info: "If defined, only activates if enemy is looking at close entity with given range. 0.5 = maximum 45 degree away",
                    _optional: true
                },
                preciseFace: {
                    _type: "Boolean",
                    _info: "If true, use precise face direction, not rounded by animation"
                },
                checkCollision: {
                    _type: "Boolean",
                    _info: "If true, check collision for view vector"
                },
                poiFilter: {
                    _type: "PoiFilter",
                    _info: "If defined: react to closeby POI instead of target",
                    _optional: true
                },
                action: {
                    _type: "EnemyActionRef",
                    _info: "Action to perform on reaction",
                    _optional: true
                },
                conditions: {
                    _type: "CombatConditions",
                    _info: "Additional conditions for hit condition"
                },
                ignoreParty: {
                    _type: "Boolean",
                    _info: "If true: Ignore party members for detection"
                },
                ignoreReplaceTargets: {
                    _type: "Boolean",
                    _info: "If true: Ignore Target Replacements"
                }
            }
        }),
        init: function (name, config) {
            this.parent(name, config);
            this.minDistance = config.minDistance || null;
            this.maxDistance = config.maxDistance || null;
            this.preSwitchState = config.preSwitchState || null;
            this.targetFace = config.targetFace || 0;
            this.ownFace = config.ownFace || 0;
            this.checkCollision = config.checkCollision || false;
            this.ignoreParty = config.ignoreParty || false;
            this.ignoreReplaceTargets = config.ignoreReplaceTargets || false;
            this.ignoreStun = true;
            this.preciseFace = config.preciseFace || false;
            this.poiFilter = sc.CombatPoI.initPoiFilter(config.poiFilter);
            var conditions = config.conditions;
            if (conditions) this.conditions = new sc.CombatConditions(conditions)
        },
        preApply: function (entity) {
            this.preSwitchState && entity.enemyType.switchState(entity, this.preSwitchState)
        },
        check: function (entity) {
            if (this.conditions && !this.conditions.check(entity, Math.random()) || entity.jumping) return false;
            if (this.poiFilter) {
                var poi = sc.CombatPoI.getClosestPoI(this.poiFilter, entity, this.maxDistance);
                return poi && this._subCheck(entity, poi)
            }
            if (this._subCheck(entity, ig.game.playerEntity)) return true;
            if (!this.ignoreParty)
                for (var i = sc.party.getPartySize(); i--;)
                    if (this._subCheck(entity, sc.party.getPartyMemberEntityByIndex(i))) return true;
            return false
        },
        _subCheck: function (entity, candidate) {
            if (!candidate || candidate.isDefeated() || candidate._killed) return false;
            var original = candidate;
            !this.ignoreReplaceTargets && candidate.replaceTargets && (candidate = candidate.replaceTargets[0]);
            var distVec = ig.CollTools.getDistVec2(candidate.coll, entity.coll, tmpVec2A),
                distance = Vec2.length(distVec),
                result = (!this.minDistance || distance >= this.minDistance) && (!this.maxDistance || distance <= this.maxDistance);
            if (result && this.targetFace) {
                if (original != entity.target) return false;
                Vec2.angle(distVec, candidate.face) > Math.PI * this.targetFace && (result = false)
            }
            var faceAngle = 0;
            if (result && this.ownFace) {
                Vec2.flip(distVec);
                var faceDir = entity.getCurrentAnimFaceCount();
                if (this.preciseFace) faceDir = entity.face;
                else {
                    faceDir = entity.getCurrentAnimFaceCount();
                    faceDir = ig.getRoundedFaceDir(entity.face.x, entity.face.y, faceDir, tmpVec2B)
                }
                faceAngle = Vec2.angle(distVec, faceDir);
                faceAngle > Math.PI * this.ownFace && (result = false);
                Vec2.flip(distVec)
            }
            if (result && (!this.checkCollision && this.maxDistance) && (entity.coll.pos.z > candidate.coll.pos.z + candidate.coll.size.z || candidate.coll.pos.z > entity.coll.pos.z + entity.coll.size.z)) return false;
            if (result && this.checkCollision) {
                Vec2.flip(distVec);
                var viewPos = entity.getAlignedPos(ig.ENTITY_ALIGN.TOP, tmpVec3),
                    selfTopZ = entity.coll.pos.z + entity.coll.size.z,
                    higherZ = selfTopZ,
                    candidateTopZ = candidate.coll.pos.z + candidate.coll.size.z;
                candidateTopZ > higherZ && (higherZ = candidateTopZ);
                candidateTopZ < higherZ && (higherZ = candidateTopZ);
                var selfLevelIdx = ig.game.getLevelIdx(selfTopZ),
                    candidateLevelIdx = ig.game.getLevelIdx(higherZ);
                if (Math.abs(selfLevelIdx - candidateLevelIdx) > 1) return false;
                var zGap = Math.abs(selfTopZ - higherZ);
                if (distance < zGap * 2 || this.ownFace && faceAngle > Math.PI * this.ownFace * ((distance - zGap) / distance)) return false;
                if (selfLevelIdx != candidateLevelIdx) {
                    var higherLevelZ = Math.max(selfTopZ, higherZ),
                        lowerLevelZ = Math.min(selfTopZ, higherZ),
                        level = ig.game.levels[Math.max(selfLevelIdx, candidateLevelIdx)],
                        slope = (higherLevelZ - level.height) / (higherLevelZ - lowerLevelZ);
                    selfLevelIdx < candidateLevelIdx && (slope = 1 - slope);
                    var stepX = Math.round(distVec.x * slope),
                        stepY = Math.round(distVec.y * slope),
                        edgeX = viewPos.x + stepX,
                        edgeY = viewPos.y + stepY;
                    if (!ig.game.isOverHole(edgeX - 1, edgeY - 1, level.height, 2, 2, true)) return false;
                    var traceResult = ig.game.physics.initTraceResult(TRACE_SCRATCH);
                    if (ig.game.trace(traceResult, viewPos.x - 1, viewPos.y - 1, selfTopZ, stepX, stepY, 2, 2, 2, ig.COLLTYPE.IGNORE, candidate) || ig.game.isAreaBlocked(edgeX - 1, edgeY - 1, higherZ, 2, 2, 2, true)) return false;
                    traceResult = ig.game.physics.initTraceResult(TRACE_SCRATCH);
                    if (ig.game.trace(traceResult, edgeX - 1, edgeY - 1, higherZ, distVec.x - stepX, distVec.y - stepY, 2, 2, 2, ig.COLLTYPE.IGNORE, candidate)) return false
                } else {
                    traceResult = ig.game.physics.initTraceResult(TRACE_SCRATCH);
                    if (ig.game.trace(traceResult, viewPos.x - 1, viewPos.y - 1, selfTopZ, distVec.x, distVec.y, 2, 2, 2, ig.COLLTYPE.IGNORE, candidate)) return false
                }
            }
            result && entity.setTarget(original);
            return result
        }
    });

    sc.ENEMY_REACTION.MOVEMENT_BLOCK = EnemyReactionBase.extend({
        preSwitchState: null,
        angle: null,
        _wm: new ig.Config({
            attributes: {
                preSwitchState: {
                    _type: "EnemyStateRef",
                    _info: "State to switch to before reaction starts",
                    _optional: true
                },
                postSwitchState: {
                    _type: "EnemyStateRef",
                    _info: "State to switch to after reaction ended",
                    _optional: true
                },
                action: {
                    _type: "EnemyActionRef",
                    _info: "Action to perform on reaction",
                    _optional: true
                },
                angle: {
                    _type: "Number",
                    _info: "The minimum angle to the wall for block to be accepted",
                    _default: 0.125
                }
            }
        }),
        init: function (name, config) {
            this.parent(name, config);
            this.preSwitchState = config.preSwitchState || null;
            this.angle = config.angle || 0.125
        },
        preApply: function (entity) {
            this.preSwitchState && entity.enemyType.switchState(entity, this.preSwitchState)
        },
        check: function (entity) {
            return ig.CollTools.hasWallCollide(entity.coll, this.angle)
        }
    });

    sc.ENEMY_REACTION.COLLAB = EnemyReactionBase.extend({
        collabKey: null,
        conditions: null,
        _wm: new ig.Config({
            attributes: {
                collabKey: {
                    _type: "String",
                    _info: "Collaboration Key to react to",
                    _optional: true
                },
                preSwitchState: {
                    _type: "EnemyStateRef",
                    _info: "State to switch to before reaction starts",
                    _optional: true
                },
                postSwitchState: {
                    _type: "EnemyStateRef",
                    _info: "State to switch to after reaction ended",
                    _optional: true
                },
                action: {
                    _type: "EnemyActionRef",
                    _info: "Action to perform on reaction",
                    _optional: true
                },
                conditions: {
                    _type: "CombatConditions",
                    _info: "Additional conditions for hit condition"
                }
            }
        }),
        init: function (name, config) {
            this.parent(name, config);
            this.collabKey = config.collabKey || null;
            this.preSwitchState = config.preSwitchState || null;
            this.ignoreStun = true;
            this.conditions = new sc.CombatConditions(config.conditions)
        },
        isReady: function (entity, collabKey) {
            var random = Math.random();
            return this.collabKey == collabKey && this.conditions.check(entity, random)
        },
        apply: function (entity, actions) {
            this.preSwitchState && entity.enemyType.switchState(entity, this.preSwitchState);
            this.action && entity.removeEntityAttached(entity.collaboration);
            this.parent(entity, actions)
        }
    });

    sc.ENEMY_REACTION.GUARD_COUNTER = EnemyReactionBase.extend({
        _wm: new ig.Config({
            attributes: {
                preSwitchState: {
                    _type: "EnemyStateRef",
                    _info: "State to switch to before reaction starts",
                    _optional: true
                },
                postSwitchState: {
                    _type: "EnemyStateRef",
                    _info: "State to switch to after reaction ended",
                    _optional: true
                },
                action: {
                    _type: "EnemyActionRef",
                    _info: "Action to perform on reaction",
                    _optional: true
                },
                conditions: {
                    _type: "CombatConditions",
                    _info: "Additional conditions for counter block"
                }
            }
        }),
        sound: new ig.Sound("media/sound/battle/hit-counter-echo.ogg", 1),
        init: function (name, config) {
            this.parent(name, config);
            this.preSwitchState = config.preSwitchState || null;
            this.ignoreStun = true;
            var conditions = config.conditions;
            if (conditions) this.conditions = new sc.CombatConditions(conditions)
        },
        onGuardCounterCheck: function (entity) {
            return this.conditions && !this.conditions.check(entity, Math.random()) ? false : true
        },
        onGuardCountered: function (entity, attacker) {
            this.preSwitchState && entity.enemyType.switchState(entity, this.preSwitchState);
            if (attacker.getCombatantRoot().isPlayer) {
                sc.stats.addMap("combat", "guardCounters", 1);
                sc.arena.onGuardCounter(entity);
                entity.addCombatStat("guardCounters", 1)
            }
            this.sound.play();
            sc.combat.doDramaticEffect(attacker, entity, sc.DRAMATIC_EFFECT.GUARD_COUNTER)
        }
    });

    sc.ENEMY_REACTION.ENEMY_EVENT = EnemyReactionBase.extend({
        _wm: new ig.Config({
            attributes: {
                eventType: {
                    _type: "EnemyEventType",
                    _info: "Type of target event"
                },
                preSwitchState: {
                    _type: "EnemyStateRef",
                    _info: "State to switch to before reaction starts",
                    _optional: true
                },
                postSwitchState: {
                    _type: "EnemyStateRef",
                    _info: "State to switch to after reaction ended",
                    _optional: true
                },
                preAction: {
                    _type: "EnemyActionRef",
                    _info: "An action that is executed immediately beforehand",
                    _optional: true
                },
                action: {
                    _type: "EnemyActionRef",
                    _info: "Action to perform on reaction",
                    _optional: true
                }
            }
        }),
        init: function (name, config) {
            this.parent(name, config);
            this.preSwitchState = config.preSwitchState || null;
            this.preAction = config.preAction || null;
            this.eventType = sc.COMBAT_ENEMY_EVENT[config.eventType.type];
            this.settings = config.eventType
        },
        checkEnemyEvent: function (entity, target, eventType, settings) {
            return eventType != this.eventType ? false : this.eventType.check(entity, target, settings, this.settings)
        },
        onEnemyEvent: function (entity, actions) {
            this.preSwitchState && entity.enemyType.switchState(entity, this.preSwitchState);
            if (this.preAction) {
                entity.cancelAction();
                entity.setAction(actions[this.preAction]);
                entity.forceExecuteAction();
                entity.cancelAction(true)
            }
        }
    });

    sc.COMBAT_ENEMY_EVENT.ENEMY_MSG = {
        _wm: {
            attributes: {
                key: {
                    _type: "String",
                    _info: "Key required to trigger message reaction. "
                }
            }
        },
        check: function (entity, target, eventSettings, reactionSettings) {
            return reactionSettings.key === eventSettings.key
        }
    };

    sc.ENEMY_REACTION.STORE_RELEASE = EnemyReactionBase.extend({
        _wm: new ig.Config({
            attributes: {
                preSwitchState: {
                    _type: "EnemyStateRef",
                    _info: "State to switch to before reaction starts",
                    _optional: true
                },
                postSwitchState: {
                    _type: "EnemyStateRef",
                    _info: "State to switch to after reaction ended",
                    _optional: true
                },
                action: {
                    _type: "EnemyActionRef",
                    _info: "Action to perform on reaction",
                    _optional: true
                }
            }
        }),
        init: function (name, config) {
            this.parent(name, config);
            this.preSwitchState = config.preSwitchState || null
        },
        onStoredRelease: function (entity) {
            this.preSwitchState && entity.enemyType.switchState(entity, this.preSwitchState)
        }
    });

    sc.ENEMY_REACTION.DODGE = EnemyReactionBase.extend({
        _wm: new ig.Config({
            attributes: {
                preSwitchState: {
                    _type: "EnemyStateRef",
                    _info: "State to switch to before reaction starts",
                    _optional: true
                },
                postSwitchState: {
                    _type: "EnemyStateRef",
                    _info: "State to switch to after reaction ended",
                    _optional: true
                },
                action: {
                    _type: "EnemyActionRef",
                    _info: "Action to perform on reaction",
                    _optional: true
                },
                viewAngle: {
                    _type: "Number",
                    _info: "View angle from which incoming attacks are seen. 1= full circle. 0.5= half circle",
                    _default: 0.5
                },
                radius: {
                    _type: "Number",
                    _info: "Radius around entity bounds used to detect threads. 32 by default",
                    _optional: true
                },
                restartPrevAction: {
                    _type: "Boolean",
                    _info: "If true, restart previous action after reaction."
                },
                probability: {
                    _type: "Number",
                    _info: "Probability for dodge to work. 1=always",
                    _default: 3
                },
                count: {
                    _type: "Integer",
                    _info: "Maximum number of consecutive dodges allowed. 0 = infinity"
                },
                blockTime: {
                    _type: "Number",
                    _info: "Time for dodge to block or counter reset",
                    _default: 1
                },
                conditions: {
                    _type: "CombatConditions",
                    _info: "Additional conditions for dodge"
                }
            }
        }),
        init: function (name, config) {
            this.parent(name, config);
            this.preSwitchState = config.preSwitchState || null;
            this.viewAngle = config.viewAngle;
            this.probability = config.probability;
            this.radius = config.radius || 32;
            this.count = config.count;
            this.blockTime = config.blockTime;
            var conditions = config.conditions;
            if (conditions) this.conditions = new sc.CombatConditions(conditions)
        },
        preApply: function (entity) {
            this.preSwitchState && entity.enemyType.switchState(entity, this.preSwitchState)
        },
        check: function (entity) {
            if (entity.dodge.blocked) return false;
            var threat = sc.combat.getNearbyThreat(entity, this.radius, this.viewAngle, this.conditions);
            if (threat) {
                entity.dodge.timer = this.blockTime;
                if (Math.random() > this.probability) {
                    entity.dodge.blocked = true;
                    return false
                }
                entity.dodge.count++;
                if (this.count && entity.dodge.count >= this.count) entity.dodge.blocked = true;
                entity.threat = threat;
                return true
            }
            return false
        }
    });

    sc.ENEMY_REACTION.COUNTER_COUNTER = EnemyReactionBase.extend({
        _wm: new ig.Config({
            attributes: {
                maxDelay: {
                    _type: "Number",
                    _info: "Maximum delay until combatant will react to counter trap"
                },
                cooldown: {
                    _type: "Number",
                    _info: "Number of seconds combatant will react with increased awareness to counters"
                },
                preSwitchState: {
                    _type: "EnemyStateRef",
                    _info: "State to switch to before reaction starts",
                    _optional: true
                },
                postSwitchState: {
                    _type: "EnemyStateRef",
                    _info: "State to switch to after reaction ended",
                    _optional: true
                },
                action: {
                    _type: "EnemyActionRef",
                    _info: "Action to perform on reaction",
                    _optional: true
                },
                conditions: {
                    _type: "CombatConditions",
                    _info: "Additional conditions for reaction to react"
                }
            }
        }),
        init: function (name, config) {
            this.parent(name, config);
            this.maxDelay = config.maxDelay || 1;
            this.cooldown = config.cooldown || 10;
            this.preSwitchState = config.preSwitchState || null;
            var conditions = config.conditions;
            if (conditions) this.conditions = new sc.CombatConditions(conditions)
        },
        preApply: function (entity) {
            this.preSwitchState && entity.enemyType.switchState(entity, this.preSwitchState)
        },
        onActivate: function (entity) {
            entity.dodge.counterReactTime = 0
        },
        check: function (entity) {
            var target = entity.getTarget();
            if (!target || !target.combo) return false;
            var guardTrapTime = target.combo.guardTrapTime;
            if (guardTrapTime && !entity.dodge.counterReactTime) {
                var cooldownActive = 1;
                entity.dodge.counterCooldownMax && (cooldownActive = 0);
                entity.dodge.counterReactTime = cooldownActive * this.maxDelay + (1 - cooldownActive) * 0.1
            }
            if (!guardTrapTime && entity.dodge.counterReactTime) entity.dodge.counterReactTime = 0;
            if (guardTrapTime > entity.dodge.counterReactTime) {
                if (this.conditions && !this.conditions.check(entity, Math.random())) return false;
                entity.dodge.counterReactTime = 0;
                return true
            }
            return false
        }
    });

    sc.ENEMY_REACTION.FALL = EnemyReactionBase.extend({
        _wm: new ig.Config({
            attributes: {
                preSwitchState: {
                    _type: "EnemyStateRef",
                    _info: "State to switch to before reaction starts",
                    _optional: true
                },
                postSwitchState: {
                    _type: "EnemyStateRef",
                    _info: "State to switch to after reaction ended",
                    _optional: true
                },
                action: {
                    _type: "EnemyActionRef",
                    _info: "Action to perform on reaction",
                    _optional: true
                },
                terrain: {
                    _type: "String",
                    _info: "If defined: only react when falling into specified terrain",
                    _optional: true,
                    _select: ig.TERRAIN
                }
            }
        }),
        init: function (name, config) {
            this.parent(name, config);
            this.preSwitchState = config.preSwitchState || null;
            this.ignoreStun = true;
            this.terrain = ig.TERRAIN[config.terrain] || null
        },
        onFall: function (entity) {
            this.preSwitchState && entity.enemyType.switchState(entity, this.preSwitchState);
            entity.params && entity.params.clearLock()
        },
        checkFall: function (terrain) {
            return !this.terrain || this.terrain == terrain
        }
    })
});
ig.baked = !0;

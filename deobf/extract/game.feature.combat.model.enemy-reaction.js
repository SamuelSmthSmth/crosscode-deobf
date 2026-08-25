ig.module("game.feature.combat.model.enemy-reaction").requires("impact.base.loader", "game.feature.combat.model.combat-params", "game.feature.combat.model.combat-condition", "impact.base.animation", "game.feature.combat.entities.combatant", "game.feature.combat.combat-target-event").defines(function() {
    var b = {},
        a = ig.Class.extend({
            name: "",
            type: 0,
            action: null,
            postSwitchState: null,
            ignoreStun: false,
            restartPrevAction: false,
            init: function(a, b) {
                this.name = a;
                this.type = b.type;
                this.action = b.action || null;
                this.postSwitchState =
                    b.postSwitchState || null;
                this.restartPrevAction = b.restartPrevAction || false
            },
            onActivate: function() {},
            preApply: function() {},
            apply: function(a, b) {
                if (this.restartPrevAction) a.reactions.restartAction = a.currentAction;
                this.action && a.setAction(b[this.action]);
                a.nextState = this.postSwitchState
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
    var d = {
        FORCE_STUN: 1,
        FORCE_STABLE: 2,
        NO_CHANGE: 3
    };
    sc.ENEMY_REACTION.HIT_REACTION = a.extend({
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
                    _select: d
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
        init: function(a, b) {
            this.parent(a,
                b);
            this.hitType = sc.HIT_REACTION_TYPE[b.hitType] || sc.HIT_REACTION_TYPE.REGULAR;
            this.preAction = b.preAction || null;
            this.preSwitchState = b.preSwitchState || null;
            this.blockFurtherHits = b.blockFurtherHits || false;
            this.damageFactor = b.damageFactor;
            this.attackType = sc.ATTACK_TYPE[b.attackType] || 0;
            this.flyLevel = b.flyLevel || null;
            this.stunChange = d[b.stunChange] || d.FORCE_STUN;
            this.alignFace = b.alignFace || false;
            this.dramaticEffect = sc.DRAMATIC_EFFECT[b.dramaticEffect] || null;
            this.walkAnims = b.walkAnims || null;
            this.ignoreFailed =
                b.ignoreFailed || false;
            this.partFocus = b.partFocus || null;
            var c = b.conditions;
            if (c) this.conditions = new sc.CombatConditions(c)
        },
        onActivate: function(a) {
            this.conditions && this.conditions.onReactionActivate(a)
        },
        needInterrupt: function() {
            return this.action || this.postSwitchState || this.preSwitchState || this.stunChange == d.FORCE_STUN
        },
        hitApply: function(a, b, c, e, f) {
            a.threat = b.getCombatant();
            this.conditions && this.conditions.onPerformed(a);
            var l = false;
            if (this.preAction) {
                a.stashAction(true);
                a.setAction(f[this.preAction]);
                a.forceExecuteAction();
                a.resumeStashedAction(true)
            }
            if (this.hitType == sc.HIT_REACTION_TYPE.HP_BREAK_HIT) {
                a.setCombatStat("breaks", 0);
                a.setCombatStat("guardCounters", 0)
            }
            if ((f = b.getCombatantRoot()) && f.party == sc.COMBATANT_PARTY.PLAYER && this.dramaticEffect && this.dramaticEffect.break) {
                sc.stats.addMap("combat", "enemyBreaks", 1);
                sc.arena.onEnemyBreak(a);
                a.addCombatStat("breaks", 1)
            }
            if (this.damageFactor != void 0) {
                e.damageFactor = e.damageFactor * this.damageFactor;
                l = true
            }
            if (this.stunChange != d.NO_CHANGE) {
                if (this.attackType) e.attackType =
                    this.attackType;
                if (this.flyLevel) e.flyLevel = this.flyLevel;
                if (this.preSwitchState) {
                    a.enemyType.switchState(a, this.preSwitchState);
                    l = true
                }
                if (this.stunChange == d.FORCE_STABLE) e.hitStable = sc.ATTACK_TYPE.BREAK;
                else {
                    e.hitStable = sc.ATTACK_TYPE.NONE;
                    a.cancelAction()
                }
                if (this.blockFurtherHits) a.hitStable = sc.ATTACK_TYPE.MASSIVE;
                this.walkAnims && a.setWalkAnims(this.walkAnims)
            }
            if (this.alignFace) e.alignFace = true;
            if (this.dramaticEffect) c.dramaticEffect = this.dramaticEffect;
            if (this.hitType == sc.HIT_REACTION_TYPE.KILL_SURVIVE) {
                e.survive =
                    true;
                a.params.damageFactor = 0
            }
            if (l && a.params && c.attackInfo && c.attackInfo.attackerParams && (this.hitType == sc.HIT_REACTION_TYPE.REGULAR || this.hitType == sc.HIT_REACTION_TYPE.FORCE_HIT)) e.damageResult = a.params.getDamage(c.attackInfo, e.damageFactor, b.getCombatant())
        },
        checkHit: function(a, b, c, d, e) {
            if (e) {
                if (this.hitType == sc.HIT_REACTION_TYPE.REGULAR || this.hitType == sc.HIT_REACTION_TYPE.FORCE_HIT || this.hitType == sc.HIT_REACTION_TYPE.HP_BREAK_HIT && !c.hpBroken || this.hitType == sc.HIT_REACTION_TYPE.KILL_HIT && !c.killed ||
                    this.hitType == sc.HIT_REACTION_TYPE.KILL_SURVIVE && !c.killed) return false
            } else if (this.hitType != sc.HIT_REACTION_TYPE.REGULAR && this.hitType != sc.HIT_REACTION_TYPE.FORCE_HIT) return false;
            return !this.conditions ? true : this.conditions.check(a, b, c, d)
        }
    });
    var c = Vec2.create(),
        e = Vec2.create(),
        f = Vec3.create();
    sc.ENEMY_REACTION.TARGET_DISTANCE = a.extend({
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
        init: function(a, b) {
            this.parent(a, b);
            this.minDistance = b.minDistance || null;
            this.maxDistance = b.maxDistance || null;
            this.preSwitchState = b.preSwitchState || null;
            this.targetFace = b.targetFace || 0;
            this.ownFace = b.ownFace || 0;
            this.checkCollision = b.checkCollision || false;
            this.ignoreParty = b.ignoreParty || false;
            this.ignoreReplaceTargets = b.ignoreReplaceTargets || false;
            this.ignoreStun =
                true;
            this.preciseFace = b.preciseFace || false;
            this.poiFilter = sc.CombatPoI.initPoiFilter(b.poiFilter);
            var c = b.conditions;
            if (c) this.conditions = new sc.CombatConditions(c)
        },
        preApply: function(a) {
            this.preSwitchState && a.enemyType.switchState(a, this.preSwitchState)
        },
        check: function(a) {
            if (this.conditions && !this.conditions.check(a, Math.random()) || a.jumping) return false;
            if (this.poiFilter) {
                var b = sc.CombatPoI.getClosestPoI(this.poiFilter, a, this.maxDistance);
                return b && this._subCheck(a, b)
            }
            if (this._subCheck(a, ig.game.playerEntity)) return true;
            if (!this.ignoreParty)
                for (b = sc.party.getPartySize(); b--;)
                    if (this._subCheck(a, sc.party.getPartyMemberEntityByIndex(b))) return true;
            return false
        },
        _subCheck: function(a, d) {
            if (!d || d.isDefeated() || d._killed) return false;
            var i = d;
            !this.ignoreReplaceTargets && d.replaceTargets && (d = d.replaceTargets[0]);
            var j = ig.CollTools.getDistVec2(d.coll, a.coll, c),
                k = Vec2.length(j),
                l = (!this.minDistance || k >= this.minDistance) && (!this.maxDistance || k <= this.maxDistance);
            if (l && this.targetFace) {
                if (i != a.target) return false;
                Vec2.angle(j,
                    d.face) > Math.PI * this.targetFace && (l = false)
            }
            var o = 0;
            if (l && this.ownFace) {
                Vec2.flip(j);
                var m = a.getCurrentAnimFaceCount();
                if (this.preciseFace) m = a.face;
                else {
                    m = a.getCurrentAnimFaceCount();
                    m = ig.getRoundedFaceDir(a.face.x, a.face.y, m, e)
                }
                o = Vec2.angle(j, m);
                o > Math.PI * this.ownFace && (l = false);
                Vec2.flip(j)
            }
            if (l && (!this.checkCollision && this.maxDistance) && (a.coll.pos.z > d.coll.pos.z + d.coll.size.z || d.coll.pos.z > a.coll.pos.z + a.coll.size.z)) return false;
            if (l && this.checkCollision) {
                Vec2.flip(j);
                var m = a.getAlignedPos(ig.ENTITY_ALIGN.TOP,
                        f),
                    n = a.coll.pos.z + a.coll.size.z,
                    p = n,
                    r = d.coll.pos.z + d.coll.size.z;
                r > p && (p = r);
                r < p && (p = r);
                var r = ig.game.getLevelIdx(n),
                    t = ig.game.getLevelIdx(p);
                if (Math.abs(r - t) > 1) return false;
                var q = Math.abs(n - p);
                if (k < q * 2 || this.ownFace && o > Math.PI * this.ownFace * ((k - q) / k)) return false;
                if (r != t) {
                    o = Math.max(n, p);
                    q = Math.min(n, p);
                    k = ig.game.levels[Math.max(r, t)];
                    o = (o - k.height) / (o - q);
                    r < t && (o = 1 - o);
                    r = Math.round(j.x * o);
                    t = Math.round(j.y * o);
                    o = m.x + r;
                    q = m.y + t;
                    if (!ig.game.isOverHole(o - 1, q - 1, k.height, 2, 2, true)) return false;
                    k = ig.game.physics.initTraceResult(b);
                    if (ig.game.trace(k, m.x - 1, m.y - 1, n, r, t, 2, 2, 2, ig.COLLTYPE.IGNORE, d) || ig.game.isAreaBlocked(o - 1, q - 1, p, 2, 2, 2, true)) return false;
                    k = ig.game.physics.initTraceResult(b);
                    if (ig.game.trace(k, o - 1, q - 1, p, j.x - r, j.y - t, 2, 2, 2, ig.COLLTYPE.IGNORE, d)) return false
                } else {
                    k = ig.game.physics.initTraceResult(b);
                    if (ig.game.trace(k, m.x - 1, m.y - 1, n, j.x, j.y, 2, 2, 2, ig.COLLTYPE.IGNORE, d)) return false
                }
            }
            l && a.setTarget(i);
            return l
        }
    });
    sc.ENEMY_REACTION.MOVEMENT_BLOCK = a.extend({
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
        init: function(a, b) {
            this.parent(a, b);
            this.preSwitchState = b.preSwitchState || null;
            this.angle = b.angle || 0.125
        },
        preApply: function(a) {
            this.preSwitchState &&
                a.enemyType.switchState(a, this.preSwitchState)
        },
        check: function(a) {
            return ig.CollTools.hasWallCollide(a.coll, this.angle)
        }
    });
    sc.ENEMY_REACTION.COLLAB = a.extend({
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
        init: function(a, b) {
            this.parent(a, b);
            this.collabKey = b.collabKey || null;
            this.preSwitchState = b.preSwitchState || null;
            this.ignoreStun = true;
            this.conditions = new sc.CombatConditions(b.conditions)
        },
        isReady: function(a, b) {
            var c = Math.random();
            return this.collabKey == b && this.conditions.check(a, c)
        },
        apply: function(a, b) {
            this.preSwitchState && a.enemyType.switchState(a,
                this.preSwitchState);
            this.action && a.removeEntityAttached(a.collaboration);
            this.parent(a, b)
        }
    });
    sc.ENEMY_REACTION.GUARD_COUNTER = a.extend({
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
        init: function(a, b) {
            this.parent(a, b);
            this.preSwitchState = b.preSwitchState || null;
            this.ignoreStun = true;
            var c = b.conditions;
            if (c) this.conditions = new sc.CombatConditions(c)
        },
        onGuardCounterCheck: function(a) {
            return this.conditions && !this.conditions.check(a, Math.random()) ? false : true
        },
        onGuardCountered: function(a, b) {
            this.preSwitchState && a.enemyType.switchState(a, this.preSwitchState);
            if (b.getCombatantRoot().isPlayer) {
                sc.stats.addMap("combat", "guardCounters",
                    1);
                sc.arena.onGuardCounter(a);
                a.addCombatStat("guardCounters", 1)
            }
            this.sound.play();
            sc.combat.doDramaticEffect(b, a, sc.DRAMATIC_EFFECT.GUARD_COUNTER)
        }
    });
    sc.ENEMY_REACTION.ENEMY_EVENT = a.extend({
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
        init: function(a, b) {
            this.parent(a, b);
            this.preSwitchState = b.preSwitchState || null;
            this.preAction = b.preAction || null;
            this.eventType = sc.COMBAT_ENEMY_EVENT[b.eventType.type];
            this.settings = b.eventType
        },
        checkEnemyEvent: function(a, b, c, d) {
            return c != this.eventType ? false : this.eventType.check(a, b, d, this.settings)
        },
        onEnemyEvent: function(a, b) {
            this.preSwitchState &&
                a.enemyType.switchState(a, this.preSwitchState);
            if (this.preAction) {
                a.cancelAction();
                a.setAction(b[this.preAction]);
                a.forceExecuteAction();
                a.cancelAction(true)
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
        check: function(a, b, c, d) {
            return d.key === c.key
        }
    };
    sc.ENEMY_REACTION.STORE_RELEASE = a.extend({
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
        init: function(a, b) {
            this.parent(a, b);
            this.preSwitchState = b.preSwitchState || null
        },
        onStoredRelease: function(a) {
            this.preSwitchState && a.enemyType.switchState(a, this.preSwitchState)
        }
    });
    sc.ENEMY_REACTION.DODGE = a.extend({
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
        init: function(a, b) {
            this.parent(a, b);
            this.preSwitchState = b.preSwitchState || null;
            this.viewAngle = b.viewAngle;
            this.probability = b.probability;
            this.radius = b.radius ||
                32;
            this.count = b.count;
            this.blockTime = b.blockTime;
            var c = b.conditions;
            if (c) this.conditions = new sc.CombatConditions(c)
        },
        preApply: function(a) {
            this.preSwitchState && a.enemyType.switchState(a, this.preSwitchState)
        },
        check: function(a) {
            if (a.dodge.blocked) return false;
            var b = sc.combat.getNearbyThreat(a, this.radius, this.viewAngle, this.conditions);
            if (b) {
                a.dodge.timer = this.blockTime;
                if (Math.random() > this.probability) {
                    a.dodge.blocked = true;
                    return false
                }
                a.dodge.count++;
                if (this.count && a.dodge.count >= this.count) a.dodge.blocked =
                    true;
                a.threat = b;
                return true
            }
            return false
        }
    });
    sc.ENEMY_REACTION.COUNTER_COUNTER = a.extend({
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
        init: function(a, b) {
            this.parent(a, b);
            this.maxDelay = b.maxDelay || 1;
            this.cooldown = b.cooldown || 10;
            this.preSwitchState = b.preSwitchState || null;
            var c = b.conditions;
            if (c) this.conditions = new sc.CombatConditions(c)
        },
        preApply: function(a) {
            this.preSwitchState && a.enemyType.switchState(a, this.preSwitchState)
        },
        onActivate: function(a) {
            a.dodge.counterReactTime =
                0
        },
        check: function(a) {
            var b = a.getTarget();
            if (!b || !b.combo) return false;
            if ((b = b.combo.guardTrapTime) && !a.dodge.counterReactTime) {
                var c = 1;
                a.dodge.counterCooldownMax && (c = 0);
                a.dodge.counterReactTime = c * this.maxDelay + (1 - c) * 0.1
            }
            if (!b && a.dodge.counterReactTime) a.dodge.counterReactTime = 0;
            if (b > a.dodge.counterReactTime) {
                if (this.conditions && !this.conditions.check(a, Math.random())) return false;
                a.dodge.counterReactTime = 0;
                return true
            }
            return false
        }
    });
    sc.ENEMY_REACTION.FALL = a.extend({
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
        init: function(a, b) {
            this.parent(a, b);
            this.preSwitchState = b.preSwitchState || null;
            this.ignoreStun = true;
            this.terrain = ig.TERRAIN[b.terrain] ||
                null
        },
        onFall: function(a) {
            this.preSwitchState && a.enemyType.switchState(a, this.preSwitchState);
            a.params && a.params.clearLock()
        },
        checkFall: function(a) {
            return !this.terrain || this.terrain == a
        }
    })
});
ig.baked = !0;

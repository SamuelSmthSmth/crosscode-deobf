/**
 * @module game.feature.party.entities.party-member-entity
 *
 * In-map entity for a party member. Follows the player in the overworld and
 * fights alongside them in combat with an AI state machine (IDLE, FOLLOW,
 * BACKOFF, ROTATE, combat states, dodging, healing, throwing, melee
 * combos, and combat art charging). Shares the party member model's params
 * and proxies.
 */
ig.module("game.feature.party.entities.party-member-entity").requires("game.feature.player.entities.player-base").defines(function() {
    function countdownTimer(timer) {
        if (timer > 0) {
            timer = timer - ig.system.tick;
            timer <= 0 && (timer = 0)
        }
        return timer
    }
    var COMBAT_ARTS = {
            ATTACK: {
                actionKey: "ATTACK_SPECIAL",
                idx: 0
            },
            THROW: {
                actionKey: "THROW_SPECIAL",
                idx: 1,
                distant: true
            },
            GUARD: {
                actionKey: "GUARD_SPECIAL",
                idx: 2
            },
            DASH: {
                actionKey: "DASH_SPECIAL",
                idx: 3,
                distant: true
            }
        },
        COMBAT_ART_KEYS = ["ATTACK", "THROW", "GUARD", "DASH"],
        ART_MAX_LEVELS = [],
        CHARGE_TIMES = [0.2, 0.25, 0.3],
        STATES = {
            IDLE: {
                start: function(entity, player, targetStats, stateData) {
                    entity.updateDefaultConfig(false);
                    stateData.faceRotateTimer = Math.random() * 0.2
                },
                update: function(entity, player, targetStats, stateData) {
                    Vec2.assignC(entity.coll.accelDir, 0, 0);
                    if (sc.model.isCombatActive() && sc.party.getStrategy("BEHAVIOUR").doNothing || sc.party.keepDistance) {
                        targetStats.outOfScreenTime = 0;
                        stateData = sc.party.keepDistance ? 200 : 320;
                        return targetStats.distance < (sc.party.keepDistance ? 64 : 120) || targetStats.distance > stateData ? STATES.STAY_AWAY : STATES.ROTATE
                    }
                    entity.updateDefaultConfig(false);
                    if (targetStats.distance > 48) return STATES.FOLLOW;
                    if (targetStats.distance < 4) return STATES.BACKOFF;
                    if (!entity.noFaceRotate) {
                        targetStats = targetStats.distVec;
                        if (player.isPlayer && Vec2.angle(targetStats, player.face) < 1 * Math.PI) targetStats =
                            player.face;
                        entity = Vec2.angle(targetStats, entity.face);
                        stateData.faceRotateTimer = entity > Math.PI * 0.05 ? stateData.faceRotateTimer + ig.system.tick : Math.random() * 0.2;
                        if (entity > Math.PI * 0.5 || stateData.faceRotateTimer > 0.25) return STATES.ROTATE
                    }
                }
            },
            STAY_AWAY: {
                start: function(entity) {
                    entity.noFaceRotate = false;
                    entity.updateDefaultConfig(false);
                    entity.setNavTarget(12);
                    entity.timer.move = 4
                },
                update: function(entity, player, targetStats) {
                    entity.coll.relativeVel = 1;
                    targetStats.outOfScreenTime = 0;
                    if (entity.nav.path.moveEntity() || entity.timer.move <= 0) return STATES.IDLE;
                    entity.jumping || targetStats.outOfScreenTime > 3 && entity.resetPos()
                }
            },
            BACKOFF: {
                start: function(entity) {
                    entity.updateDefaultConfig(false);
                    entity.noFaceRotate = false;
                    entity.coll.relativeVel = 0.5;
                    entity.setNavTarget(2)
                },
                update: function(entity, player, targetStats) {
                    entity.faceDirFixed = true;
                    Vec2.assign(entity.face, targetStats.distVec);
                    if (targetStats.distance >= 16) {
                        Vec2.assignC(entity.coll.accelDir, 0, 0);
                        return STATES.IDLE
                    }
                    if (entity.nav.path.moveEntity()) return STATES.IDLE
                }
            },
            ROTATE: {
                start: function(entity) {
                    entity.updateDefaultConfig(false)
                },
                update: function(entity, player, targetStats) {
                    var distVec = targetStats.distVec;
                    if (player.isPlayer && Vec2.angle(distVec, player.face) < 1 * Math.PI) distVec = player.face;
                    Vec2.rotateToward(entity.face, distVec, Math.PI * 2 * ig.system.tick * 2);
                    Vec2.assignC(entity.coll.accelDir, 0, 0);
                    if (!(sc.model.isCombatActive() &&
                            sc.party.getStrategy("BEHAVIOUR").doNothing || sc.party.keepDistance) && targetStats.distance > 48) return STATES.FOLLOW;
                    if (Vec2.angle(distVec, entity.face) < Math.PI * 0.05) return STATES.IDLE
                }
            },
            FOLLOW: {
                start: function(entity) {
                    entity.noFaceRotate = false;
                    entity.updateDefaultConfig(false);
                    entity.setNavTarget(1)
                },
                update: function(entity, player, targetStats) {
                    if (sc.model.isCombatActive() && sc.party.getStrategy("BEHAVIOUR").doNothing || sc.party.keepDistance) return STATES.STAY_AWAY;
                    player = 80 + sc.party.getPartyMemberIndex(entity.model.name) * 40;
                    player = targetStats.distance > player ? 1 : Math.max(0.25, targetStats.distance / player);
                    entity.jumping && (player = 1);
                    entity.coll.relativeVel =
                        player;
                    entity.nav.path.startRelativeVel = player;
                    if (entity.nav.path.moveEntity()) return STATES.IDLE;
                    entity.jumping || targetStats.outOfScreenTime > 3 && entity.resetPos()
                }
            },
            COMBAT_IDLE: {
                start: function(entity) {
                    entity.reselectTarget();
                    entity.faceToTarget.active = true
                },
                update: function(entity, player, targetStats) {
                    Vec2.assignC(entity.coll.accelDir, 0, 0);
                    if (entity.target && !sc.model.isCutscene()) {
                        var hpFactor = entity.params.getHpFactor(),
                            healThreshold = 0.5;
                        sc.EnemyAnno.isWeak(player, entity) && (healThreshold = 0.33);
                        if (hpFactor <= healThreshold && entity.model.canEatSandwich()) return STATES.COMBAT_HEALING;
                        hpFactor = sc.party.getStrategy("TARGET").others && entity.target == ig.game.playerEntity.combatStats.lastTarget;
                        if ((player = ig.navigation.isTargetReachable(entity, player, entity.model.combatStyle.normDistance + 40, true)) && !hpFactor && !sc.party.getStrategy("BEHAVIOUR").noAttack && !entity.timer.attack) {
                            if (sc.EnemyAnno.shouldBePassive(entity.target, entity)) {
                                entity.timer.attack = 0.2;
                                return STATES.COMBAT_SIDEWAYS
                            }
                            entity.timer.noAttackTime = 0;
                            entity.updateElement();
                            if (entity.params.getSp()) {
                                targetStats = sc.EnemyAnno.isWeak(entity.target, entity) ? 1 : entity.params.getRelativeSp();
                                targetStats = targetStats * sc.party.getStrategy("ARTS").factor;
                                Math.random() < targetStats && entity.selectCombatArt()
                            }
                            targetStats = entity.model.combatStyle.throwProb;
                            entity.currentCombatArt ? targetStats = entity.currentCombatArt.distant ?
                                1 : 0 : sc.EnemyAnno.useMelee(entity.target) ? targetStats = 0 : sc.EnemyAnno.useRanged(entity.target) && (targetStats = 1);
                            return Math.random() < targetStats ? STATES.COMBAT_THROWING : STATES.MELEE
                        }
                        if (!player || targetStats.distance < entity.model.combatStyle.minDistance || targetStats.distance > entity.model.combatStyle.normDistance + 40) return STATES.COMBAT_ADJUST;
                        if (entity.timer.move <= 0 && entity.timer.attack > 0.5) {
                            entity.timer.move = 0.5 + Math.random() * 0.5;
                            return STATES.COMBAT_SIDEWAYS
                        }
                    }
                }
            },
            COMBAT_SIDEWAYS: {
                start: function(entity, player, targetStats, stateData) {
                    entity.updateDefaultConfig(true);
                    entity.faceToTarget.active = true;
                    if (sc.EnemyAnno.hasLookAway(player, entity)) entity.faceToTarget.offset =
                        0.5;
                    entity.coll.relativeVel = entity.model.combatStyle.sidewaySpeed || 1;
                    entity.setNavTarget(5);
                    entity.timer.move = 1;
                    stateData.attackCount = 0
                },
                update: function(entity) {
                    if (entity.nav.path.moveEntity() || entity.timer.move <= 0) return STATES.COMBAT_IDLE
                }
            },
            COMBAT_HEALING: {
                start: function(entity, player, targetStats, stateData) {
                    entity.updateDefaultConfig(false);
                    entity.faceToTarget.active = false;
                    entity.coll.relativeVel = 1;
                    entity.setNavTarget(11);
                    entity.timer.move = 1;
                    stateData.healingStart = false
                },
                update: function(entity, player, targetStats, stateData) {
                    if (stateData.healingStart) {
                        if (!entity.currentAction) return STATES.COMBAT_IDLE
                    } else(entity.nav.path.moveEntity() || entity.timer.move <= 0) &&
                        this.startHealing(entity, targetStats, stateData)
                },
                startHealing: function(entity, targetStats, stateData) {
                    var sandwichIndex = 0,
                        hpFactor = entity.params.getHpFactor();
                    hpFactor < 0.25 ? sandwichIndex = 2 : hpFactor < 0.33 && (sandwichIndex = 1);
                    stateData.healingStart = true;
                    stateData = entity.model.getBestSandwich(sandwichIndex);
                    if (stateData !== false) {
                        stateData = entity.model.getSandwichAction(stateData);
                        entity.setAction(stateData)
                    }
                }
            },
            COMBAT_THROWING: {
                start: function(entity, player, targetStats, stateData) {
                    entity.updateDefaultConfig(false);
                    entity.faceToTarget.active = false;
                    entity.coll.relativeVel = 1;
                    if (sc.EnemyAnno.hasAttackBack(entity.target, entity)) {
                        entity.setNavTarget(9);
                        entity.timer.move = 2
                    } else if (sc.EnemyAnno.hasAttackFront(entity.target, entity)) {
                        entity.setNavTarget(10);
                        entity.timer.move =
                            2
                    } else {
                        entity.updateDefaultConfig(true);
                        entity.faceToTarget.active = true;
                        entity.coll.relativeVel = 0.7;
                        entity.setNavTarget(6);
                        entity.timer.move = 1
                    }
                    stateData.attackCount = 0
                },
                update: function(entity, player, targetStats, stateData) {
                    if (stateData.attackCount == 0) {
                        if (entity.nav.path.moveEntity() || entity.timer.move <= 0) {
                            entity.faceToTarget.active = true;
                            entity.updateDefaultConfig(true);
                            this.startThrow(entity, targetStats, stateData)
                        }
                    } else if (stateData.attackCount < entity.model.combatStyle.throwCount && !entity.timer.action) this.startThrow(entity, targetStats, stateData);
                    else if (stateData.attackCount == entity.model.combatStyle.throwCount && !entity.timer.action)
                        if (entity.currentCombatArt) entity.startCombatArtCharging();
                        else {
                            entity.resetAttackTimer();
                            return STATES.COMBAT_IDLE
                        }
                },
                startThrow: function(entity, targetStats, stateData) {
                    entity.cancelAction();
                    stateData.attackCount++;
                    var reverseAction = entity.model.getAction(sc.PLAYER_ACTION.THROW_NORMAL_REV),
                        actionName = stateData.attackCount == 1 ? "THROW_CHARGED" : !reverseAction || stateData.attackCount % 2 == 1 ? "THROW_NORMAL" : "THROW_NORMAL_REV";
                    Vec2.assign(entity.face, targetStats.distVec);
                    Vec2.assign(entity.throwDirData, targetStats.distVec);
                    entity.setAttribute("dashDir", entity.face);
                    entity.doPlayerAction(actionName)
                }
            },
            COMBAT_ADJUST: {
                start: function(entity, player, targetStats, stateData) {
                    entity.nav.path.interrupt();
                    entity.coll.relativeVel = 1;
                    entity.setNavTarget(3);
                    entity.timer.move = 1;
                    stateData.doInit =
                        true;
                    if (entity.nav.path.getDistance() > 0) entity.faceToTarget.active = false
                },
                update: function(entity, player, targetStats, stateData) {
                    if (entity.nav.path.moveEntity() || entity.timer.move <= 0)
                        if (targetStats.distance > entity.model.combatStyle.normDistance + 40) entity.setNavTarget(3);
                        else return STATES.COMBAT_IDLE;
                    else if (stateData.doInit) {
                        stateData.doInit = false;
                        entity.updateDefaultConfig(false)
                    }
                }
            },
            PERMA_PUNCH: {
                start: function(entity, player, targetStats, stateData) {
                    stateData.attackCount = 0
                },
                update: function(entity, player, targetStats, stateData) {
                    entity.timer.action || this.startAttack(entity, targetStats, stateData)
                },
                startAttack: function(entity, targetStats, stateData) {
                    entity.cancelAction();
                    stateData.attackCount++;
                    stateData = stateData.attackCount % 2 == 1 ? "ATTACK" :
                        "ATTACK_REV";
                    entity.coll.setType(ig.COLLTYPE.VIRTUAL);
                    Vec2.assign(entity.face, targetStats.distVec);
                    entity.setAttribute("dashDir", Vec2.create());
                    entity.doPlayerAction(stateData)
                }
            },
            MELEE: {
                start: function(entity, player, targetStats, stateData) {
                    entity.nav.path.interrupt();
                    entity.updateDefaultConfig(false);
                    entity.coll.relativeVel = 1;
                    stateData.directionMove = false;
                    if (sc.EnemyAnno.hasAttackBack(entity.target, entity)) {
                        stateData.directionMove = true;
                        entity.setNavTarget(7)
                    } else if (sc.EnemyAnno.hasAttackFront(entity.target, entity)) {
                        stateData.directionMove = true;
                        entity.setNavTarget(8)
                    } else entity.setNavTarget(4);
                    entity.timer.move = 3;
                    stateData.attackCount = 0
                },
                update: function(entity,
                    player, targetStats, stateData) {
                    if (stateData.directionMove) {
                        if ((player = entity.nav.path.moveEntity()) || entity.timer.move <= 0) {
                            entity.setNavTarget(4);
                            stateData.directionMove = false
                        }
                    } else if (stateData.attackCount == 0)(player = entity.nav.path.moveEntity()) || targetStats.distance < 16 ? this.startAttack(entity, targetStats, stateData) : targetStats.distance < 32 && entity.coll.setType(ig.COLLTYPE.VIRTUAL);
                    else if (stateData.attackCount < entity.model.combatStyle.comboCount && !entity.timer.action) {
                        if (targetStats.distance > entity.model.combatStyle.meleeDistance * 2) {
                            entity.resetAttackTimer();
                            return STATES.COMBAT_IDLE
                        }
                        this.startAttack(entity, targetStats, stateData)
                    } else if (stateData.attackCount == entity.model.combatStyle.comboCount &&
                        !entity.timer.action) {
                        entity.resetAttackTimer();
                        return STATES.COMBAT_IDLE
                    }
                },
                startAttack: function(entity, targetStats, stateData) {
                    entity.cancelAction();
                    stateData.attackCount++;
                    entity.coll.setType(ig.COLLTYPE.VIRTUAL);
                    Vec2.assign(entity.face, targetStats.distVec);
                    entity.setAttribute("dashDir", entity.face);
                    stateData.attackCount == entity.model.combatStyle.comboCount && entity.currentCombatArt ? entity.startCombatArtCharging() : entity.doPlayerAction(stateData.attackCount == entity.model.combatStyle.comboCount ? "ATTACK_FINISHER" : stateData.attackCount % 2 == 1 ? "ATTACK" : "ATTACK_REV")
                }
            },
            DODGE: {
                start: function(entity, player) {
                    entity.nav.path.interrupt();
                    entity.updateDefaultConfig(false);
                    var dodgeType = ig.NAV_DODGE_TYPE.NEUTRAL;
                    sc.EnemyAnno.keepFarDistance(player) && (dodgeType = ig.NAV_DODGE_TYPE.GET_AWAY);
                    ig.navigation.getDodgePosition(DODGE_POS, entity, entity.threat, 48, dodgeType);
                    dodgeType = entity.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM);
                    Vec3.sub(dodgeType, DODGE_POS);
                    Vec3.flip(dodgeType);
                    entity.timer.dodge = 0.25;
                    entity.faceToTarget.active = true;
                    entity.setAttribute("dashDir", dodgeType);
                    entity.doPlayerAction("DASH")
                },
                update: function(entity) {
                    if (!entity.currentAction) return entity.inCombat ? STATES.COMBAT_IDLE : STATES.IDLE
                }
            }
        };
    Vec2.create();
    var DODGE_POS = Vec3.create(),
        WALK_ANIM_KEYS = ["normal", "battle", "aiming", "interogate"];
    sc.PartyMemberEntity = sc.PlayerBaseEntity.extend({
        party: sc.COMBATANT_PARTY.PLAYER,
        material: sc.COMBATANT_MATERIAL.ORGANIC,
        configs: {
            normal: null,
            aiming: null
        },
        guard: {
            damage: 0,
            timer: 0,
            fxSheet: new ig.EffectSheet("guard"),
            fxHandle: null,
            currentKey: null
        },
        model: null,
        posOffset: Vec2.create(),
        navTarget: null,
        state: null,
        inCombat: false,
        targetStats: {
            distVec: Vec2.create(),
            distance: 0,
            outOfScreenTime: 0
        },
        stateData: {},
        timer: {
            action: 0,
            move: 0,
            attack: 0,
            noAttackTime: 0,
            dodge: 0
        },
        throwDirData: Vec2.create(),
        currentCombatArt: null,
        charging: {
            max: 0,
            current: 0,
            timer: 0
        },
        init: function(x, y, settings, extraSettings) {
            this.parent(x, y, settings, extraSettings);
            this.configs.normal.overwrite("collType", ig.COLLTYPE.SEMI_IGNORE);
            this.configs.battle.overwrite("collType", ig.COLLTYPE.SEMI_IGNORE);
            this.configs.aiming.overwrite("collType", ig.COLLTYPE.SEMI_IGNORE);
            this.configs.aiming.overwrite("maxVel", 180);
            this.configs.aiming.overwrite("relativeVel", 100 / 180);
            this.setDefaultConfig(this.configs.normal);
            this.model = sc.party.getPartyMemberModel(extraSettings.partyMemberName);
            sc.Model.addObserver(this.model, this);
            if (this.model.walkAnims)
                for (var i = WALK_ANIM_KEYS.length; i--;) {
                    var animKey = WALK_ANIM_KEYS[i];
                    this.model.walkAnims[animKey] &&
                        this.storeWalkAnims(animKey, this.model.walkAnims[animKey])
                }
            this.animSheet = this.model.animSheet;
            this.proxies = this.model.getBalls();
            this.initAnimations();
            this.params = this.model.params;
            this.params.setCombatant(this);
            this.updateModelStats();
            extraSettings.posOffset && Vec2.assign(this.posOffset, extraSettings.posOffset);
            this.state = STATES.IDLE;
            this.state.start(this, ig.game.playerEntity, this.targetStats, this.stateData);
            this.charging.fx = new sc.CombatCharge(this, false)
        },
        updateDefaultConfig: function(aiming) {
            aiming ? this.setDefaultConfig(this.configs.aiming) : this.setDefaultConfig(this.goToCombat() ?
                this.configs.battle : this.configs.normal)
        },
        show: function(silent) {
            this.parent(silent);
            if (!silent) {
                this.animState.alpha = 0;
                ig.game.effects.teleport.spawnOnTarget("showDefault", this, {
                    align: "CENTER"
                });
                this.setAction(SPAWN_ACTION)
            }
        },
        onPreDamageModification: function(params, damage, attacker, target, damageInfo) {
            if (damageInfo && damageInfo.damage >= this.params.currentHp && this.model.noDie) return params.survive = true;
            return false
        },
        onInstantDamage: function(damage) {
            return damage >= this.params.currentHp && this.model.noDie
        },
        onKill: function(silent) {
            this.model && sc.Model.removeObserver(this.model, this);
            if (this.model &&
                this.params.isDefeated()) sc.party.onMemberDefeat(this.model.name);
            this.parent(silent)
        },
        leaveParty: function(showEffect) {
            if (!this._killed) {
                sc.Model.removeObserver(this.model, this);
                this.model = null;
                this.endCombat();
                showEffect ? this.kill() : this.setAction(HIDE_ACTION)
            }
        },
        resetAttackTimer: function() {
            var attackTimer;
            attackTimer = this.target && sc.EnemyAnno.isWeak(this.target) ? 1 : 1.5 + Math.random() * 1.5;
            sc.party.getPartySize() == 2 && (attackTimer = attackTimer * 2);
            attackTimer = attackTimer * (1 - sc.party.ai.aggressive);
            this.timer.attack = attackTimer
        },
        startCombat: function() {
            this.selectTarget();
            if (this.target) {
                this.inCombat = true;
                this.timer.attack = 1 + Math.random() * 1;
                this.changeState(STATES.COMBAT_IDLE)
            }
        },
        endCombat: function() {
            this.setTarget(null);
            this.inCombat = false;
            this.changeState(STATES.IDLE)
        },
        startCombatArtCharging: function() {
            this.setCurrentAnim("charge", false, null, true);
            this.animationFixed = true;
            this.timer.action = -1;
            this.charging.max = 1;
            this.charging.level = 0;
            var artName = this.model.getCombatArtName(sc.PLAYER_ACTION[this.currentCombatArt.actionKey + this.charging.max]);
            if (artName && sc.options.get("party-combat-arts") != sc.PARTY_COMBAT_ARTS.NONE) {
                artName =
                    new sc.SmallEntityBox(this, artName.toString(), 1);
                artName.stopRumble();
                ig.gui.addGuiElement(artName)
            }
            this.doCombatArtCharge()
        },
        doCombatArtCharge: function() {
            this.charging.timer = CHARGE_TIMES[this.charging.level];
            this.faceToTarget.active = true;
            this.charging.level++;
            this.charging.fx.charge(this.model.currentElementMode, this.charging.level, sc.options.get("party-combat-arts") != sc.PARTY_COMBAT_ARTS.FULL)
        },
        cancelCharge: function() {
            if (this.currentCombatArt) {
                this.charging.timer = 0;
                this.currentCombatArt = null;
                this.charging.fx.stop();
                this.animationFixed =
                    false
            }
        },
        doCombatArt: function() {
            this.charging.fx.stop();
            var actionKey = this.currentCombatArt.actionKey + this.charging.max;
            this.params.consumeSp(sc.PLAYER_SP_COST[this.charging.max - 1]);
            this.cancelCharge();
            this.doPlayerAction(actionKey);
            this.coll.relativeVel = 1;
            this.faceToTarget.active = false
        },
        setAction: function(action, params, force) {
            if (!this.eventBlocked && sc.model.isCutscene() && action && action.eventAction) {
                this.eventBlocked = true;
                this.updateDefaultConfig(false)
            }
            this.parent(action, params, force)
        },
        setActionBlocked: function(blockData) {
            this.timer.action = blockData.action;
            this.timer.dodge =
                blockData.dash || 0
        },
        hasValidTarget: function() {
            return this.target && !this.target._killed && !this.target.isDefeated() && this.target.target
        },
        selectTarget: function() {
            if (!this.hasValidTarget()) {
                var target = sc.combat.getPlayerTarget(this);
                this.setTarget(target)
            }
        },
        reselectTarget: function() {
            var target = sc.combat.getPlayerTarget(this);
            (target || !this.hasValidTarget()) && this.setTarget(target)
        },
        hasElement: function(element) {
            return this.model.allElements ? true : sc.newgame.get("keep-elements") && element != sc.ELEMENT.NEUTRAL ? ig.vars.get("g.newgame.elements." + element) || false :
                sc.model.player.hasElement(element)
        },
        getBestElement: function() {
            if (!this.target || !this.model || !sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_CHANGE)) return sc.ELEMENT.NEUTRAL;
            var bestElement = 0,
                bestFactor = 1,
                sameCount = 1;
            if (Math.random() <= sc.EnemyAnno.getUnderstandFactor(this.target, this, 1))
                for (var targetElement = sc.EnemyAnno.getElement(this.target), elemFactors = this.target.params && this.target.params.getStat("elemFactor"), i = sc.ELEMENT_MAX + 1; i--;)
                    if (this.hasElement(i)) {
                        if (i == targetElement || this.target.elementFilter && this.target.elementFilter == i) return i;
                        if (i && elemFactors && elemFactors[i - 1] >=
                            bestFactor) {
                            if (elemFactors[i - 1] == bestFactor) {
                                sameCount++;
                                if (Math.random() < 1 / sameCount) continue
                            } else sameCount = 1;
                            bestElement = i;
                            bestFactor = elemFactors[i - 1]
                        }
                    } return bestElement
        },
        consumeSandwich: function(index) {
            this.model.consumeSandwich(index, this)
        },
        updateElement: function() {
            if (this.model) {
                var bestElement = this.getBestElement();
                bestElement != this.model.currentElementMode && this.model.setElementMode(bestElement)
            }
        },
        updateModelStats: function() {
            this.regenFactor = this.params.getModifier("HP_REGEN");
            this.spikeDmg.baseFactor = this.params.getModifier("SPIKE_DMG");
            this.stunThreshold = this.params.getModifier("STUN_THRESHOLD");
            if (this.params) this.params.criticalDmgFactor =
                1.5 + this.params.getModifier("CRITICAL_DMG")
        },
        modelChanged: function(model, msg) {
            model == this.model && msg == sc.PARTY_MEMBER_MSG.STATS_CHANGED && this.updateModelStats()
        },
        selectCombatArt: function() {
            for (var i = 0; i < COMBAT_ART_KEYS.length; ++i) ART_MAX_LEVELS[i] = this.model.getActionMaxLevel(COMBAT_ARTS[COMBAT_ART_KEYS[i]].actionKey);
            if (sc.EnemyAnno.useRanged(this.target)) {
                ART_MAX_LEVELS[COMBAT_ARTS.ATTACK.idx] = 0;
                ART_MAX_LEVELS[COMBAT_ARTS.DASH.idx] = 0
            }
            sc.EnemyAnno.useMelee(this.target) && (ART_MAX_LEVELS[COMBAT_ARTS.THROW.idx] = 0);
            for (var availableArts = [], i = ART_MAX_LEVELS.length; i--;) ART_MAX_LEVELS[i] > 0 && availableArts.push(i);
            if (availableArts.length > 0) {
                i = availableArts[Math.floor(Math.random() * availableArts.length)];
                if (ART_MAX_LEVELS[i]) this.currentCombatArt =
                    COMBAT_ARTS[COMBAT_ART_KEYS[i]]
            }
        },
        changeState: function(state) {
            this.state = state;
            this.cancelAction();
            state = this.target || ig.game.playerEntity;
            this.state.start && this.state.start(this, state, this.targetStats, this.stateData)
        },
        isControlBlocked: function() {
            return !this.model || this.hasStun() || this.params.isDefeated() || this.currentAction && this.currentAction.eventAction || this.currentAction == SPAWN_ACTION
        },
        getDodgeProbability: function(threat) {
            var understandFactor = 0.5;
            (threat = threat.getCombatant()) && (understandFactor = sc.EnemyAnno.getUnderstandFactor(threat, this, 1));
            threat = sc.party.getStrategy("BEHAVIOUR");
            return (1 - understandFactor) *
                threat.dodgeMin + understandFactor * threat.dodgeMax
        },
        goToCombat: function() {
            return sc.model.isCombatActive() && !sc.party.getStrategy("BEHAVIOUR").doNothing
        },
        update: function() {
            if (!this.eventBlocked || !sc.model.isCutscene()) {
                if (this.eventBlocked) {
                    this.navTarget = null;
                    this.changeState(STATES.IDLE);
                    this.eventBlocked = false
                }
                this.targetStats.outOfScreenTime = ig.EntityTools.isInScreen(this, 0) ? 0 : this.targetStats.outOfScreenTime + ig.system.tick;
                this.timer.attack = countdownTimer(this.timer.attack);
                this.timer.move = countdownTimer(this.timer.move);
                this.timer.action = countdownTimer(this.timer.action);
                this.timer.dodge = countdownTimer(this.timer.dodge);
                var player = ig.game.playerEntity;
                if (this.isControlBlocked()) {
                    this.state = null;
                    this.cancelCharge();
                    this.timer.action = 0
                } else {
                    if (this.charging.timer) {
                        this.charging.timer = this.charging.timer - ig.system.tick;
                        this.charging.timer <= 0 && (this.charging.level == this.charging.max ? this.doCombatArt() : this.doCombatArtCharge())
                    } else if (this.timer.action && !this.currentAction) {
                        this.timer.action = 0;
                        this.timer.dodge = 0
                    }
                    this.state || this.changeState(this.inCombat ? STATES.COMBAT_IDLE : STATES.IDLE);
                    if (sc.model.isCombatActive() &&
                        !this.jumping && this.timer.dodge == 0) {
                        var threat = sc.combat.getNearbyThreat(this, 48, 1);
                        if (!threat && (this.target && sc.EnemyAnno.keepFarDistance(this.target, this)) && ig.CollTools.getGroundDistance(this.coll, this.target.coll) < 240) threat = this.target;
                        if (threat) {
                            this.timer.dodge = 0.25;
                            if (Math.random() < this.getDodgeProbability(threat)) {
                                this.threat = threat;
                                this.changeState(STATES.DODGE)
                            }
                        }
                    }
                    if (!this.timer.action && !this.jumping)
                        if (this.goToCombat()) {
                            if (this.inCombat) {
                                if (!this.hasValidTarget()) {
                                    this.selectTarget();
                                    this.target ? this.changeState(STATES.COMBAT_IDLE) :
                                        this.endCombat()
                                }
                            } else this.startCombat();
                            this.timer.noAttackTime = this.timer.noAttackTime + ig.system.tick;
                            if (this.timer.noAttackTime > 5) {
                                this.timer.noAttackTime = 0;
                                this.reselectTarget()
                            }
                        } else this.inCombat && this.endCombat();
                    player = this.target || player;
                    ig.CollTools.getDistVec2(this.coll, player.coll, this.targetStats.distVec);
                    this.targetStats.distance = Vec2.length(this.targetStats.distVec);
                    this.targetStats.distance = this.targetStats.distance - player.coll.size.x / 2;
                    (player = this.state.update(this, player, this.targetStats, this.stateData)) &&
                        this.changeState(player)
                }
            } else {
                this.noFaceRotate = true;
                this.cancelCharge()
            }
            this.parent();
            this.model || this.currentAction || this.kill()
        },
        resetPos: function(silent) {
            sc.party.resetMemberPos(this.model.name);
            silent || ig.game.effects.teleport.spawnOnTarget("showFast", this);
            this.nav.path.mapVersion = -1;
            this.target && this.reselectTarget()
        },
        setNavTarget: function(targetType) {
            targetType == 1 ? this.navTarget != targetType && this.nav.path.toEntity(ig.game.playerEntity, 16, {
                posOffset: this.posOffset
            }) : targetType == 2 ? this.nav.path.dodge(ig.game.playerEntity, 32) : targetType == 12 ? this.nav.path.runAway(ig.game.playerEntity,
                sc.party.keepDistance ? 100 : 240) : this.target && (targetType == 3 ? this.nav.path.runAway(this.target, this.model.combatStyle.normDistance, true) : targetType == 4 ? this.nav.path.toEntity(this.target, this.model.combatStyle.meleeDistance) : targetType == 7 ? this.nav.path.runToFace(this.target, 0.5, 32, 80) : targetType == 8 ? this.nav.path.runToFace(this.target, 0, 32, 80) : targetType == 5 ? this.nav.path.sideways(this.target, 80, 16, true) : targetType == 6 ? this.nav.path.runAway(this.target, this.model.combatStyle.normDistance - 20, true) : targetType == 9 ? this.nav.path.runToFace(this.target, 0.5, this.model.combatStyle.normDistance -
                20, this.model.combatStyle.normDistance + 12, true) : targetType == 10 ? this.nav.path.runToFace(this.target, 0, this.model.combatStyle.normDistance - 20, this.model.combatStyle.normDistance + 12, true) : targetType == 11 && this.nav.path.runAway(this.target, 240));
            this.navTarget = targetType
        },
        onNavigationFailed: function(failCount) {
            if (failCount > 5) {
                this.nav.failTimer = 0;
                this.resetPos()
            }
        }
    });
    var SPAWN_ACTION = new ig.Action("enemyStart", [{
            type: "WAIT",
            time: 0.4
        }]),
        HIDE_ACTION = new ig.Action("enemyStart", [{
            type: "SHOW_EFFECT",
            effect: {
                sheet: "teleport",
                name: "hideDefault"
            },
            wait: true,
            align: "CENTER",
            actionDetached: true
        }])
});
ig.baked = !0;

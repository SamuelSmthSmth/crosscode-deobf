/**
 * game.feature.combat.entities.combatant
 * =======================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.combat.entities.combatant")`.
 *
 * The base combatant: `sc.BasicCombatant` (tackle/contact damage, targeting)
 * and `ig.ENTITY.Combatant` (HP/SP params, shields, spike damage, stun,
 * knockback/fly movement, quick-respawn, defeat/death). Also defines
 * `sc.CombatantAnimPartEntity` (animated body-part sub-entities that route
 * hits to their owner) and the `ig.ACTOR_CONFIGS.COMBAT` defaults.
 */
ig.module("game.feature.combat.entities.combatant")
    .requires("game.feature.npc.entities.sc-actor", "game.feature.combat.combat", "game.feature.combat.entities.hit-number", "game.feature.combat.model.combat-params", "impact.feature.effect.effect-sheet", "game.feature.model.options-model", "impact.feature.terrain.terrain", "game.feature.combat.model.proxy")
    .defines(function () {

    ig.terrain.registerDangerTerrain(ig.TERRAIN.COAL, true);
    ig.terrain.registerDangerTerrain(ig.TERRAIN.WATER, true);
    ig.terrain.registerDangerTerrain(ig.TERRAIN.HIGHWAY, true);

    sc.SHIELD_RESULT = {
        NONE: 0,
        REGULAR: 1,
        PERFECT: 2,
        NEUTRALIZE: 3
    };

    sc.COMBAT_FLY_LEVEL = {
        LIGHT: {
            vel: 100,
            stun: 0.2,
            jump: 0
        },
        MEDIUM: {
            vel: 200,
            stun: 0.25,
            jump: 0
        },
        HEAVY: {
            vel: 250,
            stun: 0.3,
            jump: 100,
            bounciness: 0.2,
            airFriction: 0.5
        },
        MASSIVE: {
            vel: 300,
            stun: 0.55,
            jump: 150,
            bounciness: 0.5,
            airFriction: 0.3,
            far: true
        },
        "MASSIVE+": {
            vel: 400,
            stun: 0.7,
            jump: 180,
            bounciness: 0.5,
            airFriction: 0.2,
            far: true
        },
        "MASSIVE++": {
            vel: 500,
            stun: 0.9,
            jump: 200,
            bounciness: 0.5,
            airFriction: 0.15,
            far: true
        },
        "MASSIVE+++": {
            vel: 600,
            stun: 1,
            jump: 200,
            bounciness: 0.5,
            airFriction: 0.13,
            far: true
        }
    };

    // Shared scratch buffers.
    var tmpVec2A = Vec2.create(),   // face dir / dist vec
        tmpVec2B = Vec2.create(),   // dist vec
        tmpVec3A = Vec3.create(),   // hit center
        tmpVec3B = Vec3.create();   // aligned pos
    var SHIELD_SCRATCH = {};        // { hitStable, damageFactor } in/out for isShielded
    var DAMAGE_MOD_SCRATCH = {      // in/out for onPreDamageModification
        damageResult: void 0,
        attackType: void 0,
        flyLevel: void 0,
        hitStable: void 0,
        damageFactor: void 0,
        weakness: false,
        alignFace: false,
        ignoreHit: false
    };

    sc.BasicCombatant = sc.ActorEntity.extend({
        tackle: {
            attackInfo: null,
            orthoDirFactor: 0,
            blocked: [],
            hitCount: 0,
            cancelOnHit: 0
        },
        combo: {
            damageCeiling: null,
            hitCombatants: [],
            dmgSum: 0,
            blockedDamage: 0,
            blockedFactor: 0,
            guardedHits: 0,
            guardedEntity: null,
            hitProxy: null,
            guardTrapTime: 0
        },
        target: null,
        tmpTarget: null,
        replaceTargets: null,
        ignoreTaunts: false,

        getTarget: function (ignoreReplace) {
            var target = this.tmpTarget || this.target;
            if (!ignoreReplace && target && target.replaceTargets && !sc.pvp.isActive()) {
                var replacement = target.replaceTargets[0];
                return this.ignoreTaunts && replacement.group == "taunt" ? target : replacement
            }
            return target
        },

        hasBlockEntity: function () {
            var guarded = this.combo.guardedEntity;
            return !guarded || guarded.isBall || guarded instanceof sc.CircleHitForce && guarded.pos ? false : guarded.getCombatant() instanceof ig.ENTITY.Combatant
        },

        // Begin a tackle (contact) attack; `blockLastHit` prevents re-hitting the
        // combatant we just struck.
        setTackle: function (attackInfo, orthoDirFactor, cancelOnHit, blockLastHit) {
            this.tackle.attackInfo = attackInfo;
            this.tackle.orthoDirFactor = orthoDirFactor || 0;
            this.tackle.blocked.length = 0;
            if (blockLastHit) {
                var lastHit = this.combo.hitCombatants[this.combo.hitCombatants.length - 1];
                lastHit && this.tackle.blocked.push(lastHit.id);
            }
            this.tackle.hitCount = 0;
            this.tackle.cancelOnHit = cancelOnHit || false;
            if (this.tackle.attackInfo) {
                var coll = ig.game.getEntitiesInRectangle(this.coll.pos.x, this.coll.pos.y, this.coll.pos.z, this.coll.size.x, this.coll.size.y, this.coll.size.z, this);
                for (var i = 0; i < coll.length; ++i) this.checkTackle(coll[i], null, true)
            }
        },

        getElement: function () {
            return this.tackle.attackInfo ? this.tackle.attackInfo.element : sc.ELEMENT.NEUTRAL
        },

        getAttackInfo: function () {
            for (var attached = this.actionAttached, i = attached.length; i--;)
                if (attached[i] instanceof sc.CircleHitForce) return attached[i].attackInfo;
            return this.tackle.attackInfo || null
        },

        collideWith: function (entity) {
            this.checkTackle(entity, null)
        },

        checkTackle: function (entity, force, requireFacing) {
            if (this.tackle.attackInfo && entity.isCombatant && entity.party != this.party) {
                if (entity.coll.pos.z >= this.coll.pos.z + this.coll.size.z || this.coll.pos.z >= entity.coll.pos.z + entity.coll.size.z || entity.coll.subColls.length > 0) return false;
                var root = entity.coll.parentColl ? entity.coll.parentColl.entity : entity;
                if (this.tackle.blocked.indexOf(root.id) == -1) {
                    if (requireFacing && this.coll.maxVel > 0) {
                        var distVec = ig.CollTools.getDistVec2(this.coll, entity.coll, tmpVec2A);
                        if (Vec2.dot(distVec, this.face) < 0) return false
                    }
                    if (entity.damage(force || this, this.tackle.attackInfo)) {
                        this.tackle.blocked.push(root.id);
                        this.tackle.hitCount++;
                        if (this.tackle.cancelOnHit) this.tackle.attackInfo = null;
                        return true
                    }
                }
            }
            return false
        },

        getHitCenter: function (entity, out) {
            return this.getOverlapCenterCoords(entity, out)
        },
        getCombatant: function () {
            return this
        },
        getCombatantRoot: function () {
            return this
        },

        getHitVel: function (entity, out) {
            var vel = out || {};
            Vec2.assign(vel, this.coll.vel);
            Vec2.isZero(vel) && this.coll.maxVel * this.coll.relativeVel > 0 && Vec2.assign(vel, this.coll.accelDir);
            if (Vec2.isZero(vel)) {
                Vec2.assign(vel, entity.coll.vel);
                Vec2.flip(vel)
            }
            if (this.tackle.orthoDirFactor) {
                Vec2.assign(tmpVec2A, vel);
                Vec2.rotate90CW(tmpVec2A);
                ig.CollTools.getDistVec2(this.coll, entity.coll, tmpVec2B);
                Vec2.dot(tmpVec2A, tmpVec2B) < 0 && Vec2.flip(tmpVec2A);
                Vec2.lerp(vel, tmpVec2A, this.tackle.orthoDirFactor, vel)
            }
            return vel
        },

        setHitProxy: function (proxy, params, comboLink, fromKill) {
            this.combo.hitProxy = new sc.HitProxyConnect(proxy, params, comboLink, fromKill)
        },
        spawnHitProxy: function (target, result, pos) {
            this.combo.hitProxy && this.combo.hitProxy.spawn(target, this, this.face, result, pos)
        },

        onVarAccess: function (accessor, path) {
            return path[1] == "target" ? ig.vars.forwardEntityVarAccess(this.getTarget(), path, 2)
                : path[1] == "hasTmpTarget" ? !!this.tmpTarget
                : path[1] == "manualKill" ? this.manualKill
                : path[1] == "defeated" ? this.dying > sc.DYING_STATE.ALIVE
                : path[1] == "lastHitElement" ? this.stunData.lastHitElement
                : path[1] == "blockedDamage" ? this.combo.blockedDamage
                : path[1] == "blockedFactor" ? this.combo.blockedFactor
                : path[1] == "hpFactor" ? this.params.getHpFactor()
                : this.parent(accessor, path)
        }
    });

    /** Temporary target replacement (e.g. a taunt); detaches with the action. */
    sc.ReplaceTargetHandle = ig.Class.extend({
        combatant: null,
        init: function (combatant, entity) {
            this.combatant = combatant;
            entity.addActionAttached(this);
            if (!this.combatant.replaceTargets) this.combatant.replaceTargets = [];
            this.combatant.replaceTargets.push(entity)
        },
        onActionEndDetach: function (entity) {
            if (this.combatant.replaceTargets) {
                this.combatant.replaceTargets.erase(entity);
                if (this.combatant.replaceTargets.length == 0) this.combatant.replaceTargets = null
            }
        }
    });

    sc.DYING_STATE = {
        ALIVE: 0,
        KILL_HIT: 1,
        DYING: 2
    };

    ig.ENTITY.Combatant = sc.BasicCombatant.extend({
        params: null,
        isCombatant: true,
        party: 0,
        material: sc.COMBATANT_MATERIAL.METAL,
        damageTimer: 0,
        defeatNotified: false,
        dying: sc.DYING_STATE.ALIVE,
        skipRumble: false,
        deathEffect: null,
        manualKill: null,
        invincibleTimer: 0,
        stunThreshold: 0,
        stunCombatant: null,
        stunSteps: [],
        stunData: {
            time: 0,
            hits: 0,
            damage: 0,
            resetTimer: 0,
            stunEscapeTime: 0,
            damageSum: 0,
            damageSumHits: 0,
            damageSumEntity: null,
            lastHitElement: 0,
            hitNumberEntities: [],
            damageSumTimer: 0
        },
        targetedBy: [],
        threat: null,
        regenFactor: 0,
        regenTimer: 0,
        walkAnims: {
            idle: null,
            preMove: null,
            move: null,
            moveRev: null,
            run: null,
            runRev: null,
            brake: null,
            preIdle: null,
            jump: null,
            fall: null,
            hover: null,
            preHoverMove: null,
            hoverMove: null,
            hoverMoveRev: null,
            land: null,
            damage: null,
            postDamage: null,
            damageFly: null,
            damageFall: null,
            pvpDown: null
        },
        hitStable: 0,
        hitIgnore: false,
        statusGui: null,
        shieldsConnections: [],
        spikeDmg: {
            baseFactor: 0,
            tmpFactor: 0,
            receiveStash: []
        },
        pvp: {
            active: false,
            enemies: [],
            round: 0,
            points: {}
        },
        respawn: {
            dmgFactor: 0.1,
            pos: Vec3.create(),
            oldPos: Vec3.create(),
            timer: 0,
            terrain: null
        },
        effects: {
            death: new ig.EffectSheet("combatant")
        },

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            Vec3.assign(this.respawn.pos, this.coll.pos)
        },

        show: function (visible) {
            this.parent(visible);
            this.statusGui = new ig.GUI.StatusBar(this);
            this.params && this.params.initStatusFx();
            ig.gui.addGuiElement(this.statusGui)
        },

        hide: function () {
            this.clearDamageSum();
            this.statusGui && this.statusGui.remove();
            this.statusGui = null;
            this.parent()
        },

        hasStun: function () {
            return this.damageTimer > 0
        },
        setRespawnPoint: function (pos) {
            Vec3.assignC(this.respawn.pos, pos.x - this.coll.size.x / 2, pos.y - this.coll.size.y / 2, pos.z)
        },
        isDefeated: function () {
            return this.params && this.params.isDefeated()
        },

        cancelStun: function () {
            if (this.damageTimer > 0) {
                this.stepTimer = this.damageTimer = 0;
                this.stunSteps.length = 0;
                this.defaultConfig.apply(this);
                this.walkAnims.postDamage && this.setCurrentAnim(this.walkAnims.postDamage, true, this.walkAnims.idle);
                this.walkAnims.preIdle && this.setCurrentAnim(this.walkAnims.preIdle, true, this.walkAnims.idle)
            }
        },
        onStunEnd: null,

        setTarget: function (target, fixed) {
            if (!this._killed && this.target != target) {
                !this.target && target ? sc.combat.addActiveCombatant(this) : this.target && !target && sc.combat.removeActiveCombatant(this);
                if (target && fixed) this.targetFixed = true;
                this.target && this.target._removeTargetedBy && this.target._removeTargetedBy(this);
                (this.target = target) && this.target._addTargetedBy && this.target._addTargetedBy(this)
            }
        },
        setReplaceTarget: function (entity) {
            return new sc.ReplaceTargetHandle(this, entity)
        },
        _addTargetedBy: function (combatant) {
            this.targetedBy.push(combatant)
        },
        _removeTargetedBy: function (combatant) {
            this.targetedBy.erase(combatant)
        },

        onEnemyEvent: null,
        sendEnemyEvent: function (eventType, settings) {
            for (var i = this.targetedBy.length; i--;) {
                var combatant = this.targetedBy[i];
                if (combatant.onEnemyEvent) combatant.onEnemyEvent(this, eventType, settings)
            }
        },

        hasShield: function (name) {
            for (var i = this.shieldsConnections.length; i--;)
                if (this.shieldsConnections[i].shield.name == name) return true;
            return false
        },
        updateShields: function () {
            for (var i = this.shieldsConnections.length; i--;)
                if (this.shieldsConnections[i].update()) {
                    this.shieldsConnections[i].onDetach(this);
                    this.shieldsConnections.splice(i, 1)
                }
        },
        addShield: function (shield, perfectGuardTime) {
            var connection = new sc.CombatantShieldConnection(this, shield, perfectGuardTime);
            this.shieldsConnections.push(connection);
            return connection
        },
        removeShield: function (connection) {
            connection.onDetach(this);
            this.shieldsConnections.erase(connection)
        },
        removeNamedShield: function (name) {
            for (var i = this.shieldsConnections.length; i--;)
                if (this.shieldsConnections[i].shield.name == name) {
                    this.shieldsConnections[i].onDetach(this);
                    this.shieldsConnections.splice(i, 1)
                }
        },

        damage: function (force, attackInfo, source) {
            if (sc.pvp.isActive() && !sc.pvp.isCombatantInPvP(this) || sc.pvp.isCombatantInPvP(this) && (sc.pvp.isBrake() || sc.pvp.isFinished() || sc.pvp.isKillHit()) || !source && this.coll.subColls.length > 0) return false;
            if (this.invincibleTimer && !attackInfo.hitInvincible && !attackInfo.limiter.noAggro) {
                this.onPerfectDash();
                return false
            }
            return this.elementFilter && force.getElement() != this.elementFilter || this.party == sc.COMBATANT_PARTY.ENEMY && (!this.target && !attackInfo.limiter.noAggro) && (!force.getCombatantRoot().isPlayer || !ig.EntityTools.isInScreen(this, 32)) ? false : this.onDamage(force, attackInfo, source)
        },

        isShielded: function (force, attackInfo, partEntity, result) {
            var partName = partEntity && partEntity.partName;
            for (var i = this.shieldsConnections.length, shieldResult = sc.SHIELD_RESULT.NONE; i--;) {
                var connection = this.shieldsConnections[i],
                    shield = connection.shield;
                if (shield.strength != sc.SHIELD_STRENGTH.BLOCK_ALL && attackInfo.guardable != sc.GUARDABLE.ALWAYS) {
                    if (attackInfo.guardable == sc.GUARDABLE.NEVER) continue;
                    if (attackInfo.guardable == sc.GUARDABLE.FROM_ABOVE && shield.strength != sc.SHIELD_STRENGTH.BLOCK_ABOVE) continue;
                    if (shield.hitResist < attackInfo.type) continue
                }
                if (shield.isActive(this, force, attackInfo, partName, connection.isPerfect()) && shield.getDamageFactor(attackInfo, this) < 1) {
                    if (shield.neutralize) return sc.SHIELD_RESULT.NEUTRALIZE;
                    if (result) {
                        if (shield.stableOverride > result.hitStable) result.hitStable = shield.stableOverride;
                        result.damageFactor = connection.isPerfect() ? 0 : result.damageFactor * shield.getDamageFactor(attackInfo, this)
                    }
                    shieldResult = Math.max(shieldResult, connection.isPerfect() ? sc.SHIELD_RESULT.PERFECT : sc.SHIELD_RESULT.REGULAR)
                }
            }
            return shieldResult
        },

        getSpikeShieldFactor: function () {
            for (var factor = 1, i = this.shieldsConnections.length; i--;) {
                var shield = this.shieldsConnections[i].shield;
                shield.reduceSpikeDamage() && (factor = factor * shield.baseFactor)
            }
            return factor
        },

        onPreDamageModification: function () {
            return false
        },
        onPerfectDash: function () {},
        onStunLockClear: function () {
            this.damageTimer = 0.01;
            this.stunSteps.length = 0
        },

        /**
         * Resolve an incoming hit: shield check, damage computation, hit
         * reactions, spike damage, knockback/fly movement and stun.
         * `force` is the hit force, `attackInfo` the attack, `source` the
         * (optional) sub-entity/part that was hit.
         */
        onDamage: function (force, attackInfo, source) {
            var hitStable = this.hitStable,
                damageFactor, attackType = attackInfo.type,
                visualType = attackInfo.visualType,
                flyLevel = attackInfo.fly,
                reverse = attackInfo.reverse,
                hitSource = source || this,
                hitIgnore = this.hitIgnore;
            SHIELD_SCRATCH.hitStable = hitStable;
            SHIELD_SCRATCH.damageFactor = 1;
            var shieldResult = this.isShielded(force, attackInfo, source, SHIELD_SCRATCH);
            hitStable = SHIELD_SCRATCH.hitStable;
            damageFactor = SHIELD_SCRATCH.damageFactor;
            var hitCenter = force.getHitCenter(hitSource, tmpVec3A),
                attacker = force.getCombatant(),
                attackerRoot = attacker.getCombatantRoot();
            if (this.params && this.params.isDefeated() || !this.statusGui) return false;
            var damageResult;
            if (shieldResult == sc.SHIELD_RESULT.NEUTRALIZE) {
                sc.combat.showHitEffect(hitSource, hitCenter, sc.ATTACK_TYPE.NONE, attackInfo.element, shieldResult);
                return true
            }
            if (!attackInfo.damageFactor || attackInfo.limiter.onlyHitProxy) {
                attackInfo.limiter.noHitProxy || (force.spawnHitProxy ? force.spawnHitProxy(hitSource, null, hitCenter) : attackerRoot.spawnHitProxy(hitSource, null, hitCenter));
                return true
            }
            this.params && attackInfo.attackerParams && (damageResult = this.params.getDamage(attackInfo, damageFactor, attacker, shieldResult, hitIgnore));
            DAMAGE_MOD_SCRATCH.weakness = false;
            DAMAGE_MOD_SCRATCH.alignFace = false;
            DAMAGE_MOD_SCRATCH.ignoreHit = false;
            DAMAGE_MOD_SCRATCH.survive = false;
            DAMAGE_MOD_SCRATCH.damageFactor = damageFactor;
            var savedShieldResult = shieldResult;
            var alignFace = false;
            this.stunData.lastHitElement = attackInfo.element;
            if (this.onPreDamageModification(DAMAGE_MOD_SCRATCH, force, attackInfo, source, damageResult, shieldResult, hitIgnore)) {
                hitStable = DAMAGE_MOD_SCRATCH.hitStable == void 0 ? hitStable : DAMAGE_MOD_SCRATCH.hitStable;
                DAMAGE_MOD_SCRATCH.hitStable == sc.ATTACK_TYPE.NONE && (savedShieldResult = false);
                if (DAMAGE_MOD_SCRATCH.attackType != void 0) visualType = attackType = DAMAGE_MOD_SCRATCH.attackType;
                if (DAMAGE_MOD_SCRATCH.damageResult && damageResult) damageResult = DAMAGE_MOD_SCRATCH.damageResult;
                if (DAMAGE_MOD_SCRATCH.survive && damageResult) damageResult.damage = this.params.currentHp - 1;
                flyLevel = DAMAGE_MOD_SCRATCH.flyLevel || flyLevel;
                DAMAGE_MOD_SCRATCH.damageResult = void 0;
                DAMAGE_MOD_SCRATCH.attackType = void 0;
                DAMAGE_MOD_SCRATCH.flyLevel = void 0;
                DAMAGE_MOD_SCRATCH.hitStable = void 0;
                alignFace = DAMAGE_MOD_SCRATCH.alignFace;
                hitIgnore = this.hitIgnore
            } else if (DAMAGE_MOD_SCRATCH.ignoreHit) return false;
            sc.combat.isDamageIgnore() && (damageResult = null);
            attackInfo.limiter.noHitProxy || (force.spawnHitProxy ? force.spawnHitProxy(hitSource, damageResult, hitCenter) : attackerRoot.spawnHitProxy(hitSource, damageResult, hitCenter));
            if (hitIgnore && attackType < sc.ATTACK_TYPE.BREAK) {
                attackInfo.limiter.noDmg || sc.combat.showHitEffect(hitSource, hitCenter, sc.ATTACK_TYPE.NONE, attackInfo.element);
                return true
            }
            DAMAGE_MOD_SCRATCH.weakness && this.statusGui.setStatusEntry("BREAK", DAMAGE_MOD_SCRATCH.weakness);
            if (attacker != hitSource) {
                attacker.combo.hitCombatants.erase(hitSource);
                attacker.combo.hitCombatants.push(hitSource)
            }
            if (damageResult && !attackInfo.limiter.noDmg) {
                var stunThreshold = Math.max(1, this.params.getStat("hp") * this.stunThreshold * sc.combat.getGlobalDmgFactor(this.party));
                hitStable > sc.ATTACK_TYPE.NONE && (damageResult.damage <= stunThreshold && !attackInfo.noIronStance) && (hitStable = sc.ATTACK_TYPE.MASSIVE);
                if (this.party == sc.COMBATANT_PARTY.ENEMY && attackerRoot.isPlayer && this.params.getHpFactor() == 1 && damageResult.damage >= this.params.getStat("hp")) {
                    sc.stats.addMap("combat", "oneHitKills", 1);
                    sc.arena.onHitKill(this)
                }
                sc.arena.onPreDamageApply(this, damageResult, shieldResult, attacker, attackInfo);
                this.params.applyDamage(damageResult, attackInfo, attacker);
                attacker.combo.dmgSum = attacker.combo.dmgSum + damageResult.damage;
                attackerRoot.addSpikeDamage(damageResult, this.spikeDmg.baseFactor + this.spikeDmg.tmpFactor, this, shieldResult, force);
                this.onDamageTaken && this.onDamageTaken(damageResult.damage, shieldResult);
                if (attackerRoot) attackerRoot.onTargetHit(this, attackInfo, damageResult, shieldResult, force);
                sc.options.get("damage-numbers") && !sc.combat.hideDamageNumbers && (sc.options.get("damage-numbers-crit") ? damageResult.critical && ig.ENTITY.HitNumber.spawnHitNumber(hitCenter, this, damageResult.damage, damageResult.baseOffensiveFactor, damageResult.defensiveFactor, shieldResult, damageResult.critical, DAMAGE_MOD_SCRATCH.weakness) : ig.ENTITY.HitNumber.spawnHitNumber(hitCenter, this, damageResult.damage, damageResult.baseOffensiveFactor, damageResult.defensiveFactor, shieldResult, damageResult.critical, DAMAGE_MOD_SCRATCH.weakness))
            }
            hitStable = hitStable >= attackType && (!this.params || !this.params.isLocked());
            this.params && (this.params.isLocked() && !this.params.isLockedBy(attacker) && !this.params.isLockedBy(attackerRoot)) && (hitStable = true);
            var wasLocked = this.params && this.params.isLocked();
            if (!hitStable) {
                this.stunCombatant = attacker;
                for (var i = attackInfo.stunSteps.length; i--;) {
                    var stunStep = attackInfo.stunSteps[i];
                    stunStep.preHit && stunStep.preHit(this, this.stunCombatant)
                }
            }
            if (wasLocked && !this.params.isLocked() && attackerRoot.charging && attackerRoot.charging.executeLevel >= 1) sc.arena.onLockEnd(this, attackInfo, damageResult, attackerRoot.charging.executeLevel);
            if (this.params && this.params.isDefeated()) {
                this._onDeathHit(attackerRoot);
                visualType = sc.ATTACK_TYPE.BREAK;
                var hpFraction = damageResult ? damageResult.damage / this.params.getStat("hp") : 0;
                hpFraction = hpFraction >= 2 ? "MASSIVE+++" : hpFraction >= 1 ? "MASSIVE++" : hpFraction >= 0.5 ? "MASSIVE+" : "MASSIVE";
                if (!flyLevel || sc.COMBAT_FLY_LEVEL[flyLevel].vel < sc.COMBAT_FLY_LEVEL[hpFraction].vel) flyLevel = hpFraction;
                hitStable = false
            }
            if (!attackInfo.limiter.noDmg) {
                sc.combat.showHitEffect(hitSource, hitCenter, visualType, attackInfo.element, savedShieldResult, damageResult && damageResult.critical);
                damageResult && (damageResult.damage > 1E12 ? sc.combat.effects.hit.spawnOnTarget("hitExtra4", this) : damageResult.damage > 1E9 ? sc.combat.effects.hit.spawnOnTarget("hitExtra3", this) : damageResult.damage > 1E7 ? sc.combat.effects.hit.spawnOnTarget("hitExtra2", this) : damageResult.damage > 1E5 && sc.combat.effects.hit.spawnOnTarget("hitExtra1", this))
            }
            var hitVel = force.getHitVel(this, tmpVec2A);
            if (alignFace) {
                Vec2.assign(this.face, hitVel);
                Vec2.flip(this.face)
            }
            hitStable || this.cancelAction();
            if (!flyLevel) switch (visualType) {
                case sc.ATTACK_TYPE.LIGHT:
                    flyLevel = "LIGHT";
                    break;
                case sc.ATTACK_TYPE.MEDIUM:
                    flyLevel = "MEDIUM";
                    break;
                case sc.ATTACK_TYPE.HEAVY:
                    flyLevel = "HEAVY";
                    break;
                case sc.ATTACK_TYPE.MASSIVE:
                case sc.ATTACK_TYPE.BREAK:
                    flyLevel = "MASSIVE"
            }
            var isBreak = visualType == sc.ATTACK_TYPE.BREAK;
            var knockback = 0;
            force.isBall && attackInfo.hasHint("CHARGED") && (knockback = attackInfo.attackerParams.getModifier("KNOCKBACK"));
            var stunTime = this.doDamageMovement(hitVel, flyLevel, isBreak, hitStable, knockback, false, reverse, 1);
            this.damageTimer = Math.max(this.damageTimer, stunTime);
            if (!hitStable && this.stunCombatant) {
                this.stunData.hits++;
                this.stunData.damage = this.stunData.damage + (damageResult && damageResult.damage || 0);
                this.stunData.resetTimer = 0.5;
                this.stepTimer = 0;
                if (this.stunSteps.length > 0) this.stunSteps.length = 0;
                for (var i = attackInfo.stunSteps.length; i--;) {
                    var stunStep = attackInfo.stunSteps[i];
                    stunStep.start && stunStep.start(this, this.stunCombatant);
                    stunStep.run(this, this.stunCombatant) || this.stunSteps.push(stunStep)
                }
            }
            return true
        },

        regenPvp: function (hpFactor) {
            this.dying = sc.DYING_STATE.ALIVE;
            this.params.revive(hpFactor);
            this.params.setRelativeSp(sc.SP_REGEN_FACTOR);
            sc.CombatProxyTools.clearEntityProxy(this);
            this.resetStunData()
        },

        onPvpEnd: function (won) {
            if (won) {
                sc.combat.notifyCombatantDefeated(this);
                this.defeatNotified = false
            } else {
                var key = "kill" + this.enemyName;
                sc.stats.getMap("combat", key) || sc.stats.setMap("combat", key, -1)
            }
        },

        setCombatStat: function (name, value) {
            this.params && this.params.setCombatStat(name, value)
        },
        getCombatStat: function (name, fallback) {
            return this.params ? this.params.getCombatStat(name, fallback) : void 0
        },
        addCombatStat: function (name, value) {
            this.params && this.params.addCombatStat(name, value)
        },

        _onDeathHit: function (attacker) {
            if (this.dying == sc.DYING_STATE.ALIVE) {
                this.dying = sc.DYING_STATE.KILL_HIT;
                sc.combat.onCombatantDeathHit(attacker, this);
                ig.EffectTools.clearEffects(this);
                var rumble = new ig.Rumble.RumbleHandle("RANDOM", "STRONG", "FASTER", 0.3, false, true);
                rumble && !this.skipRumble && ig.rumble.addRumble(rumble);
                if (!sc.pvp.isCombatantInPvP(this)) {
                    this.effects.death.spawnOnTarget("pre_die", this, {
                        duration: -1
                    });
                    this.coll.type = ig.COLLTYPE.IGNORE
                }
            }
        },

        // Reflect damage back to the attacker (spike/thorns). Queued in a stash
        // so multiple hits don't all land at once.
        addSpikeDamage: function (result, spikeFactor, victim, shieldResult, force) {
            if (victim.party != sc.COMBATANT_PARTY.PLAYER || shieldResult) {
                var spikeShieldFactor = this.getSpikeShieldFactor() * this.params.damageFactor,
                    defenseDiff = (this.params.getStat("defense") - victim.params.getStat("defense") / 2) / 2,
                    spikeDamage = result.defReduced - result.offensiveFactor * defenseDiff;
                if (shieldResult) {
                    victim.combo.blockedDamage = victim.combo.blockedDamage + Math.max(0, spikeDamage);
                    victim.combo.blockedFactor = victim.combo.blockedFactor + result.offensiveFactor;
                    victim.combo.guardedHits = victim.combo.guardedHits + 1;
                    victim.combo.guardedEntity = force
                }
                spikeDamage = Math.max(0, Math.round(spikeDamage * spikeFactor * spikeShieldFactor));
                if (spikeDamage) {
                    var delay = 0,
                        stash = this.spikeDmg.receiveStash;
                    for (var i = stash.length; i--;) delay = delay + stash[i].timer;
                    this.effects.death.spawnOnTarget("spikeDmg", this, {
                        target2: victim,
                        target2Align: ig.ENTITY_ALIGN.CENTER,
                        align: ig.ENTITY_ALIGN.CENTER
                    }).setIgnoreSlowdown();
                    this.spikeDmg.receiveStash.push({
                        damage: spikeDamage,
                        timer: 0.6 - delay,
                        offensiveFactor: result.offensiveFactor
                    })
                }
            }
        },

        updateSpikeDamage: function () {
            var stash = this.spikeDmg.receiveStash;
            if (this.isDefeated()) stash.length = 0;
            if (stash.length)
                for (stash[stash.length - 1].timer -= ig.system.ingameTick; stash.length && stash[stash.length - 1].timer <= 0;) {
                    var entry = stash.pop(),
                        damage = entry.damage;
                    if (this.getSpikeShieldFactor() * this.params.damageFactor > 0) {
                        this.effects.death.spawnOnTarget("spikeHit", this, {
                            align: ig.ENTITY_ALIGN.CENTER
                        }).setIgnoreSlowdown();
                        this.instantDamage(damage, entry.offensiveFactor)
                    }
                }
        },

        instantDamage: function (damage, offensiveFactor, source) {
            if (!this.params.isDefeated()) {
                var survive = this.onInstantDamage && this.onInstantDamage(damage, source);
                this.onDamageTaken && this.onDamageTaken(damage);
                survive && (damage = this.params.currentHp - 1);
                sc.arena.onPreInstantDamage(this, damage);
                this.params.reduceHp(damage);
                var pos = this.getAlignedPos(ig.ENTITY_ALIGN.CENTER, tmpVec3B);
                sc.options.get("damage-numbers") && ig.ENTITY.HitNumber.spawnHitNumber(pos, this, damage, offensiveFactor, 1, false, false, false);
                if (this.params.isDefeated()) {
                    this.cancelAction();
                    this._onDeathHit(this);
                    var dir = Vec2.assign(tmpVec2A, this.face);
                    Vec2.flip(dir);
                    var stunTime = this.doDamageMovement(dir, "MASSIVE", false, false, 0);
                    this.damageTimer = Math.max(this.damageTimer, stunTime)
                }
            }
        },

        // Apply knockback/fly movement for a hit. Returns the stun duration.
        doDamageMovement: function (dir, flyLevel, isBreak, stable, knockback, forceJump, flip, weightFactor) {
            flyLevel = flyLevel && sc.COMBAT_FLY_LEVEL[flyLevel];
            if (!flyLevel) return 0;
            knockback = knockback || 0;
            if (!stable) {
                this.cancelJump();
                this.walkAnims.damage && this.setCurrentAnim(this.walkAnims.damage, true, null, true);
                this.animationFixed = true;
                this.coll.accelDir.x = this.coll.accelDir.y = 0
            }
            var weightScale = this.coll.weight == -1 ? 0 : Math.min(1, 200 / this.coll.weight);
            stable && (weightScale = weightScale / 2);
            isBreak && !this.coll.groundConnect && (weightScale = 1);
            weightFactor !== void 0 && (weightScale = weightScale * weightFactor);
            var stunTime = 0;
            if (!dir.x && !dir.y) dir.y = 1;
            knockback = flyLevel.vel * (1 + knockback) * weightScale;
            Vec2.length(dir, knockback);
            flip && Vec2.flip(dir);
            stable ? (Vec2.dot(this.coll.vel, dir) <= 0 || Vec2.length(this.coll.vel) < knockback) && Vec2.add(this.coll.vel, dir) : Vec2.assign(this.coll.vel, dir);
            if (!stable) {
                if (this.coll.groundConnect != ig.COLL_GROUND_CONNECT.STRONG_FLIGHT) this.coll.friction.ground = 1;
                stunTime = flyLevel.stun;
                if (flyLevel.jump) {
                    if (this.coll.groundConnect != ig.COLL_GROUND_CONNECT.STRONG_FLIGHT) this.fly.blocked = 0.1;
                    if (flyLevel.far) {
                        this.coll.type == ig.COLLTYPE.VIRTUAL && this.coll.setType(ig.COLLTYPE.IGNORE);
                        this.coll.float.height = this.floatHeightOnMove = 0
                    }
                    if (weightScale) {
                        this.coll.zBounciness = flyLevel.bounciness;
                        this.coll.friction.air = flyLevel.airFriction;
                        var jumpSpeed = flyLevel.jump;
                        !forceJump && !this.isDefeated() && (jumpSpeed = Math.min(flyLevel.jump, Math.max(0, ig.CollTools.getJumpSpeedToHeight(this.coll, this.coll.baseZPos + 24))));
                        this.coll.vel.z = jumpSpeed
                    }
                }
            }
            return stunTime
        },

        onTargetHit: function (victim, attackInfo, result) {
            if (attackInfo.spFactor) {
                var spGain = result.baseOffensiveFactor * attackInfo.spFactor;
                spGain = spGain * ((1 + result.defensiveFactor) / 2);
                result.critical && (spGain = spGain * 1.5);
                var focus = this.params.getStat("focus");
                spGain = spGain * (0.75 + Math.pow(focus / 400, 0.75));
                spGain = spGain * attackInfo.spRepeatFactor;
                attackInfo.spRepeatFactor = 0;
                this.params.addSp(spGain * 0.1)
            }
        },

        heal: function (healInfo, noNumber) {
            if (this.params && !this.params.isDefeated()) {
                var amount = this.params.getHealAmount(healInfo),
                    pos = this.getAlignedPos(ig.ENTITY_ALIGN.CENTER, tmpVec3A);
                sc.arena.onCombatantHeal(this, amount);
                this.params.increaseHp(amount);
                sc.options.get("damage-numbers") && !noNumber && ig.ENTITY.HitNumber.spawnHealingNumber(pos, this, amount);
                this.onHeal && this.onHeal(healInfo, amount)
            }
        },

        instantDefeat: function (skipRumble, explode) {
            if (this.params) {
                this.skipRumble = skipRumble;
                this.params.reduceHp(this.params.currentHp);
                this.damageTimer = 0.01
            } else if (explode) {
                this.skipRumble = skipRumble;
                this.effects.death.spawnFixed("boom_medium", this.coll.pos.x + this.coll.size.x / 2, this.coll.pos.y + this.coll.size.y + 1, this.coll.pos.z + this.coll.size.z / 2 + this.coll.size.y / 2 + 1, this).coll.time.globalStatic = true;
                this.coll.vel.x = this.coll.vel.y = 0;
                this.coll.zGravityFactor = 0;
                this.dying = sc.DYING_STATE.DYING;
                this.damageTimer = 0;
                this.stunSteps.length = 0
            }
        },

        selfDestruct: function (skipRumble) {
            this.dying = sc.DYING_STATE.DYING;
            this.params && this.params.setDefeated();
            this.manualKill ? ig.vars.set(this.manualKill, true) : this.doManualKill(skipRumble, true)
        },

        doManualKill: function (skipRumble, silent) {
            sc.combat.notifyCombatantDefeated(this, skipRumble, silent);
            this.kill()
        },

        doManualRevive: function (hpFactor) {
            ig.EffectTools.clearEffects(this);
            sc.combat.notifyCombatantDefeated(this);
            this.dying = sc.DYING_STATE.ALIVE;
            this.params.revive(hpFactor);
            this.params.setRelativeSp(sc.SP_REGEN_FACTOR);
            this.resetStunData()
        },

        onKill: function (silent) {
            this.setTarget(null);
            this.clearDamageSum();
            silent ? this.statusGui && this.statusGui.forceRemove() : this.statusGui && this.statusGui.remove();
            this.statusGui = null;
            this.parent()
        },

        update: function () {
            if (this.respawn.timer) {
                this.handleRespawn();
                this.parent()
            }
            this.coll.edgeSlipInward = this.damageTimer <= 0 && !this.influencer.hasPush();
            this.updateSpikeDamage();
            if (this.invincibleTimer > 0) {
                this.invincibleTimer = this.invincibleTimer - ig.system.actualTick * ig.slowMotion.getNonInvertSlowDown();
                if (this.invincibleTimer < 0) this.invincibleTimer = 0
            }
            var inCombat = sc.combat.isInCombat(this);
            if ((inCombat || sc.newgame.get("waypoints-heals")) && this.regenFactor && this.params && this.params.getHpFactor() < 1) {
                var regenInterval = 0.5 / 6;
                this.regenFactor >= 0.2 * 6 ? regenInterval = regenInterval / 4 : this.regenFactor >= 0.1 * 6 && (regenInterval = regenInterval / 2);
                this.regenTimer = this.regenTimer + ig.system.tick;
                if (this.regenTimer > 60 * regenInterval) {
                    this.regenTimer = this.regenTimer - 60 * regenInterval;
                    sc.pvp.isActive() && (regenInterval = regenInterval / 4);
                    sc.combat.showHealEffect(this);
                    this.heal(new sc.HealInfo(this.params, {
                        value: this.regenFactor * regenInterval
                    }))
                }
            } else this.regenTimer = 0;
            this.updateShields();
            this.params && this.params.update(inCombat);
            this.params && this.params.isDefeated() && this.influencer.removeActionInfluences();
            if (this.dying == sc.DYING_STATE.DYING) {
                if (!this.manualKill && !sc.pvp.isCombatantInPvP(this)) {
                    this.damageTimer = this.damageTimer + ig.system.tick;
                    this.coll.pos.z = this.coll.pos.z + ig.system.tick * 16;
                    this.damageTimer >= 0.5 && this.kill()
                }
            } else if (this.damageTimer > 0) {
                this.stunData.time = this.stunData.time + ig.system.tick;
                this.stepTimer = this.stepTimer + ig.system.tick;
                for (var i = this.stunSteps.length; i--;) this.stunSteps[i].run(this, this.stunCombatant) && this.stunSteps.splice(i, 1);
                if (!this.params || !this.params.isLocked())
                    if (this.damageTimer <= ig.system.tick)
                        if (this.params && this.params.isDefeated())
                            if (this.dying == sc.DYING_STATE.ALIVE) {
                                this._onDeathHit(this.stunCombatant || this);
                                if (!this.skipRumble) {
                                    var faceDir = Vec2.assign(tmpVec2A, this.face);
                                    Vec2.flip(faceDir);
                                    this.damageTimer = this.doDamageMovement(faceDir, "MASSIVE", false, false, 0)
                                }
                            } else {
                                this.clearDamageSum();
                                if (sc.pvp.isCombatantInPvP(this)) {
                                    this.defaultConfig.apply(this);
                                    this.setCurrentAnim("pvpDown")
                                } else if (this.manualKill) ig.vars.set(this.manualKill, true);
                                else {
                                    sc.combat.notifyCombatantDefeated(this);
                                    this.effects.death.spawnFixed("boom_medium", this.coll.pos.x + this.coll.size.x / 2, this.coll.pos.y + this.coll.size.y + 1, this.coll.pos.z + this.coll.size.z / 2 + this.coll.size.y / 2 + 1, this).coll.time.globalStatic = true;
                                    this.coll.vel.x = this.coll.vel.y = 0;
                                    this.coll.zGravityFactor = 0
                                }
                                this.dying = sc.DYING_STATE.DYING;
                                this.damageTimer = 0;
                                this.stunSteps.length = 0
                            }
                        else {
                            this.cancelStun();
                            this.onStunEnd && this.onStunEnd()
                        }
                    else this.damageTimer = this.damageTimer - ig.system.tick
            } else {
                if (this.stunData.resetTimer > 0) {
                    this.stunData.resetTimer = this.stunData.resetTimer - ig.system.tick;
                    this.stunData.resetTimer <= 0 && this.resetStunData()
                }
                if (this.stunData.damageSumTimer > 0) {
                    this.stunData.damageSumTimer = this.stunData.damageSumTimer - ig.system.tick;
                    this.stunData.damageSumTimer <= 0 && this.clearDamageSum()
                }
            }
            this.parent()
        },

        resetStunData: function () {
            this.stunData.resetTimer = 0;
            this.stunData.hits = 0;
            this.stunData.damage = 0;
            this.stunData.time = 0
        },

        clearDamageSum: function () {
            this.stunData.damageSumTimer = 0;
            this.stunData.damageSum = 0;
            this.stunData.damageSumHits = 0;
            if (this.stunData.damageSumEntity) {
                this.stunData.damageSumEntity.clear();
                this.stunData.damageSumEntity = null
            }
        },

        onTerrainUpdate: function () {
            this.checkQuickRespawn()
        },

        checkQuickRespawn: function () {
            var coll = this.coll;
            if (coll.pos.z < ig.game.minLevelZ && !this.tooHighToFall && !this.coll.ignoreCollision && coll._collData) {
                var ground = ig.EntityTools.getGroundEntity(this);
                if (!ground || !(ground instanceof ig.ENTITY.Elevator)) {
                    if (coll.vel.z < 0) coll.vel.z = 0;
                    if (this.dying != sc.DYING_STATE.DYING && this.params && this.params.isDefeated()) this.damageTimer = 0.001;
                    this.quickFall(ig.TERRAIN.HOLE);
                    return
                }
            }
            if (this.coll.float.height && !this.jumping) {
                this.getCenter(tmpVec2A);
                !sc.combat.isRespawnBlocked(this.coll) && (!this.respawn.timer && !ig.CollTools.isCloseToEdge(this.coll) && coll.baseZPos >= ig.game.minLevelZ && !ig.terrain.isDangerTerrain(ig.terrain.getTerrain(this.coll, false, true))) && Vec3.assign(this.respawn.pos, this.coll.pos)
            }
            if (!(coll.pos.z > coll.baseZPos || this.jumping || coll.zGravityFactor == 0)) {
                var terrain = this.stepStats.terrain;
                if (ig.terrain.isFallTerrain(terrain)) this.quickFall(terrain);
                else {
                    var friction = terrain == ig.TERRAIN.ICE && (!this.params || !this.params.getModifier("BEGONE_ICE")) ? 0.12 : this.isPlayer && sc.newgame.get("ice-physics") ? 0.12 : 1;
                    coll.friction.terrain = friction <= coll.friction.terrain ? friction : (1 - ig.system.tick * 3) * coll.friction.terrain + ig.system.tick * 3 * friction;
                    !ig.CollTools.isCloseToEdge(this.coll) && (!sc.combat.isRespawnBlocked(this.coll) && !ig.terrain.isDangerTerrain(this.stepStats.terrain) && !this.respawn.timer) && Vec3.assign(this.respawn.pos, this.coll.pos)
                }
            }
        },

        quickFall: function (terrain) {
            if (!this.respawn.timer && (!this.params || !this.params.isDefeated() || this.isPlayer && this.manualKill))
                if (!this.onFallBehavior || !this.onFallBehavior(terrain)) {
                    var pos = this.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, tmpVec3A);
                    this.animState.alpha = 0;
                    ig.EntityTools.isInScreen(this) || (terrain = ig.TERRAIN[sc.map._oobSoundTerrain]);
                    terrain == ig.TERRAIN.HOLE ? this.effects.death.spawnFixed("hole_fall", pos.x, pos.y, pos.z) : terrain == ig.TERRAIN.WATER ? this.effects.death.spawnFixed("waterSplash", pos.x, pos.y, pos.z) : terrain == ig.TERRAIN.HIGHWAY ? this.effects.death.spawnFixed("hole_fall", pos.x, pos.y, pos.z) : terrain == ig.TERRAIN.COAL && this.effects.death.spawnFixed("coalBurn", pos.x, pos.y, pos.z);
                    var damage = 0;
                    if (this.params) {
                        sc.combat.isDamageIgnore() || (damage = Math.floor(this.params.getStat("hp") * this.fallDmgFactor));
                        this.cancelAction()
                    }
                    this.doQuickRespawn(terrain, false, damage)
                }
        },

        handleRespawn: function () {
            this.respawn.timer = this.respawn.timer - ig.system.tick;
            if (this.respawn.timer < 0) this.respawn.timer = 0;
            Vec3.assignC(this.coll.vel, 0, 0, 0);
            Vec2.assignC(this.coll.accelDir, 0, 0);
            var progress = this.respawn.timer / this.respawn.duration,
                eased = KEY_SPLINES.EASE_IN_OUT.get((1 - progress).limit(0, 1)),
                pos = Vec3.lerp(this.respawn.oldPos, this.respawn.pos, eased, tmpVec3A);
            this.setPos(pos.x, pos.y, pos.z);
            if (this.respawn.timer <= 0.2 && !this.respawn.fx) {
                this.respawn.fx = true;
                ig.game.effects.teleport.spawnOnTarget("showRespawn", this)
            }
            if (progress <= 0) {
                this.animState.scaleX = 1;
                this.animState.scaleY = 1;
                this.invincibleTimer = 0.3;
                if (this.onRespawnEnd) this.onRespawnEnd();
                this.nav.path.redoPathDeferred();
                if (!this.isDefeated()) {
                    this.cancelAction();
                    if (!sc.combat.isDamageIgnore() && this.respawn.damage) {
                        this.instantDamage(this.respawn.damage, 2);
                        this.damageTimer = 0.1;
                        if (this.isDefeated()) {
                            this.animState.alpha = 1;
                            if (!this.isPlayer && this.respawn.terrain) {
                                sc.stats.addMap("combat", "enviroKills", 1);
                                sc.arena.onEnvironmentKill(this)
                            }
                        }
                        this.respawn.terrain = null
                    }
                }
            }
        },

        doQuickRespawn: function (terrain, instant, damage) {
            Vec3.assignC(this.coll.vel, 0, 0, 0);
            if (instant) {
                this.respawn.terrain = terrain;
                this.setPos(this.respawn.pos.x, this.respawn.pos.y, this.respawn.pos.z);
                this.nav.path.redoPathDeferred();
                ig.game.effects.teleport.spawnOnTarget("showFast", this);
                if (this.onRespawnEnd) this.onRespawnEnd()
            } else {
                var bottomPos = this.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, tmpVec3A),
                    respawnCenter = Vec3.create(this.respawn.pos);
                Vec2.addMulF(respawnCenter, this.coll.size, 0.5);
                var duration = (Vec3.distance(bottomPos, respawnCenter) / 640).limit(0.5, 1.5);
                this.effects.death.spawnFixed("respawnLine", bottomPos.x, bottomPos.y, bottomPos.z, this, {
                    target2Point: respawnCenter,
                    duration: duration + 0.1
                });
                Vec3.assign(this.respawn.oldPos, this.coll.pos);
                this.invincibleTimer = -1;
                this.respawn.timer = duration + 0.1;
                this.respawn.duration = duration;
                this.respawn.damage = damage || 0;
                this.respawn.fx = false;
                this.respawn.terrain = terrain;
                this.isDefeated() || this.setAction(QUICK_RESPAWN_ACTION)
            }
        },

        onDefeat: function () {},
        getAnimPartyEntityClass: function () {
            return sc.CombatantAnimPartEntity
        }
    });

    sc.CombatantAnimPartEntity = ig.AnimationPartEntity.extend({
        isCombatant: true,
        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.party = this.owner.party
        },
        damage: function (force, attackInfo) {
            return this.owner.damage(force, attackInfo, this)
        },
        collideWith: function (entity) {
            this.owner.checkTackle(entity, this)
        },
        getCombatant: function () {
            return this.owner
        },
        getCombatantRoot: function () {
            return this.owner
        },
        getHitCenter: function (entity, out) {
            return this.getOverlapCenterCoords(entity, out)
        },
        getHitVel: function (entity, out) {
            var vel = out || {};
            Vec2.assign(vel, this.coll._collData.frameVel);
            if (Vec2.isZero(vel)) {
                Vec2.assign(vel, entity.coll.vel);
                Vec2.flip(vel)
            }
            return vel
        }
    });

    var QUICK_RESPAWN_ACTION = new ig.Action("quickRespawnAction", [{
        type: "WAIT",
        time: 10
    }]);
    QUICK_RESPAWN_ACTION.hint = "battle";
    QUICK_RESPAWN_ACTION.eventAction = true;

    ig.ACTOR_CONFIGS.COMBAT = {
        classType: ig.ENTITY.Combatant,
        KEYS: {
            damageFactor: 1,
            ballFactor: 1,
            hitStable: "NONE",
            hitIgnore: false,
            tackleAttackInfo: null,
            invincibleTimer: 0,
            elementFilter: 0,
            spikeDmg: 0,
            tmpTarget: null,
            fallDmgFactor: 0.1
        },
        fromDataFix: function () {
            typeof this.hitStable == "string" && (this.hitStable = sc.ATTACK_TYPE[this.hitStable]);
            typeof this.elementFilter == "string" && (this.elementFilter = sc.ELEMENT[this.elementFilter])
        },
        apply: function (entity) {
            if (entity.params) {
                entity.params.damageFactor = this.damageFactor * 1;
                entity.params.ballFactor = this.ballFactor * 1
            }
            entity.hitStable = this.hitStable;
            entity.hitIgnore = this.hitIgnore;
            entity.tackle.attackInfo = this.tackleAttackInfo;
            entity.invincibleTimer = this.invincibleTimer;
            entity.elementFilter = this.elementFilter;
            entity.spikeDmg.tmpFactor = this.spikeDmg;
            entity.tmpTarget = this.tmpTarget;
            entity.fallDmgFactor = this.fallDmgFactor;
            entity.combo.damageCeiling = null;
            entity.combo.hitCombatants.length = 0;
            entity.combo.dmgSum = 0;
            entity.combo.blockedDamage = 0;
            entity.combo.blockedFactor = 0;
            entity.combo.guardedHits = 0;
            entity.combo.guardedEntity = null;
            entity.combo.hitProxy = null;
            entity.combo.guardTrapTime = 0
        },
        load: function (entity) {
            if (entity.params) {
                this.damageFactor = entity.params.damageFactor;
                this.ballFactor = entity.params.ballFactor
            }
            this.hitStable = entity.hitStable;
            this.hitIgnore = entity.hitIgnore;
            this.tackleAttackInfo = entity.tackle.attackInfo;
            this.invincibleTimer = entity.invincibleTimer;
            this.elementFilter = entity.elementFilter;
            this.spikeDmg = entity.spikeDmg.tmpFactor;
            this.tmpTarget = entity.tmpTarget;
            this.fallDmgFactor = entity.fallDmgFactor
        }
    }
});
ig.baked = !0;

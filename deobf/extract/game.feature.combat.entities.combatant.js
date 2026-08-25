ig.module("game.feature.combat.entities.combatant").requires("game.feature.npc.entities.sc-actor", "game.feature.combat.combat", "game.feature.combat.entities.hit-number", "game.feature.combat.model.combat-params", "impact.feature.effect.effect-sheet", "game.feature.model.options-model", "impact.feature.terrain.terrain", "game.feature.combat.model.proxy").defines(function() {
    ig.terrain.registerDangerTerrain(ig.TERRAIN.COAL, true);
    ig.terrain.registerDangerTerrain(ig.TERRAIN.WATER, true);
    ig.terrain.registerDangerTerrain(ig.TERRAIN.HIGHWAY,
        true);
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
    var b = Vec2.create(),
        a = Vec2.create(),
        d = Vec3.create(),
        c = Vec3.create(),
        e = {},
        f = {
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
        getTarget: function(a) {
            var b = this.tmpTarget || this.target;
            if (!a && b && b.replaceTargets && !sc.pvp.isActive()) {
                a = b.replaceTargets[0];
                return this.ignoreTaunts && a.group == "taunt" ? b : a
            }
            return b
        },
        hasBlockEntity: function() {
            var a = this.combo.guardedEntity;
            return !a || a.isBall || a instanceof sc.CircleHitForce && a.pos ? false : a.getCombatant() instanceof ig.ENTITY.Combatant
        },
        setTackle: function(a, b, c, d) {
            this.tackle.attackInfo = a;
            this.tackle.orthoDirFactor = b ||
                0;
            this.tackle.blocked.length = 0;
            if (d)(a = this.combo.hitCombatants[this.combo.hitCombatants.length - 1]) && this.tackle.blocked.push(a.id);
            this.tackle.hitCount = 0;
            this.tackle.cancelOnHit = c || false;
            if (this.tackle.attackInfo) {
                c = this.coll;
                c = ig.game.getEntitiesInRectangle(c.pos.x, c.pos.y, c.pos.z, c.size.x, c.size.y, c.size.z, this);
                a = c.length;
                for (a = 0; a < c.length; ++a) this.checkTackle(c[a], null, true)
            }
        },
        getElement: function() {
            return this.tackle.attackInfo ? this.tackle.attackInfo.element : sc.ELEMENT.NEUTRAL
        },
        getAttackInfo: function() {
            for (var a =
                    this.actionAttached, b = a.length; b--;)
                if (a[b] instanceof sc.CircleHitForce) return a[b].attackInfo;
            return this.tackle.attackInfo || null
        },
        collideWith: function(a) {
            this.checkTackle(a, null)
        },
        checkTackle: function(a, c, d) {
            if (this.tackle.attackInfo && a.isCombatant && a.party != this.party) {
                if (a.coll.pos.z >= this.coll.pos.z + this.coll.size.z || this.coll.pos.z >= a.coll.pos.z + a.coll.size.z || a.coll.subColls.length > 0) return false;
                var e = a.coll.parentColl ? a.coll.parentColl.entity : a;
                if (this.tackle.blocked.indexOf(e.id) == -1) {
                    if (d &&
                        this.coll.maxVel > 0) {
                        d = ig.CollTools.getDistVec2(this.coll, a.coll, b);
                        if (Vec2.dot(d, this.face) < 0) return false
                    }
                    if (a.damage(c || this, this.tackle.attackInfo)) {
                        this.tackle.blocked.push(e.id);
                        this.tackle.hitCount++;
                        if (this.tackle.cancelOnHit) this.tackle.attackInfo = null;
                        return true
                    }
                }
            }
            return false
        },
        getHitCenter: function(a, b) {
            return this.getOverlapCenterCoords(a, b)
        },
        getCombatant: function() {
            return this
        },
        getCombatantRoot: function() {
            return this
        },
        getHitVel: function(c, d) {
            var e = d || {};
            Vec2.assign(e, this.coll.vel);
            Vec2.isZero(e) &&
                this.coll.maxVel * this.coll.relativeVel > 0 && Vec2.assign(e, this.coll.accelDir);
            if (Vec2.isZero(e)) {
                Vec2.assign(e, c.coll.vel);
                Vec2.flip(e)
            }
            if (this.tackle.orthoDirFactor) {
                Vec2.assign(b, e);
                Vec2.rotate90CW(b);
                ig.CollTools.getDistVec2(this.coll, c.coll, a);
                Vec2.dot(b, a) < 0 && Vec2.flip(b);
                Vec2.lerp(e, b, this.tackle.orthoDirFactor, e)
            }
            return e
        },
        setHitProxy: function(a, b, c, d) {
            this.combo.hitProxy = new sc.HitProxyConnect(a, b, c, d)
        },
        spawnHitProxy: function(a, b, c) {
            this.combo.hitProxy && this.combo.hitProxy.spawn(a, this, this.face,
                b, c)
        },
        onVarAccess: function(a, b) {
            return b[1] == "target" ? ig.vars.forwardEntityVarAccess(this.getTarget(), b, 2) : b[1] == "hasTmpTarget" ? !!this.tmpTarget : b[1] == "manualKill" ? this.manualKill : b[1] == "defeated" ? this.dying > sc.DYING_STATE.ALIVE : b[1] == "lastHitElement" ? this.stunData.lastHitElement : b[1] == "blockedDamage" ? this.combo.blockedDamage : b[1] == "blockedFactor" ? this.combo.blockedFactor : b[1] == "hpFactor" ? this.params.getHpFactor() : this.parent(a, b)
        }
    });
    sc.ReplaceTargetHandle = ig.Class.extend({
        combatant: null,
        init: function(a,
            b) {
            this.combatant = a;
            b.addActionAttached(this);
            if (!this.combatant.replaceTargets) this.combatant.replaceTargets = [];
            this.combatant.replaceTargets.push(b)
        },
        onActionEndDetach: function(a) {
            if (this.combatant.replaceTargets) {
                this.combatant.replaceTargets.erase(a);
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
        init: function(a, b, c, d) {
            this.parent(a, b,
                c, d);
            Vec3.assign(this.respawn.pos, this.coll.pos)
        },
        show: function(a) {
            this.parent(a);
            this.statusGui = new ig.GUI.StatusBar(this);
            this.params && this.params.initStatusFx();
            ig.gui.addGuiElement(this.statusGui)
        },
        hide: function() {
            this.clearDamageSum();
            this.statusGui && this.statusGui.remove();
            this.statusGui = null;
            this.parent()
        },
        hasStun: function() {
            return this.damageTimer > 0
        },
        setRespawnPoint: function(a) {
            Vec3.assignC(this.respawn.pos, a.x - this.coll.size.x / 2, a.y - this.coll.size.y / 2, a.z)
        },
        isDefeated: function() {
            return this.params &&
                this.params.isDefeated()
        },
        cancelStun: function() {
            if (this.damageTimer > 0) {
                this.stepTimer = this.damageTimer = 0;
                this.stunSteps.length = 0;
                this.defaultConfig.apply(this);
                this.walkAnims.postDamage && this.setCurrentAnim(this.walkAnims.postDamage, true, this.walkAnims.idle);
                this.walkAnims.preIdle && this.setCurrentAnim(this.walkAnims.preIdle, true, this.walkAnims.idle)
            }
        },
        onStunEnd: null,
        setTarget: function(a, b) {
            if (!this._killed && this.target != a) {
                !this.target && a ? sc.combat.addActiveCombatant(this) : this.target && !a && sc.combat.removeActiveCombatant(this);
                if (a && b) this.targetFixed = true;
                this.target && this.target._removeTargetedBy && this.target._removeTargetedBy(this);
                (this.target = a) && this.target._addTargetedBy && this.target._addTargetedBy(this)
            }
        },
        setReplaceTarget: function(a) {
            return new sc.ReplaceTargetHandle(this, a)
        },
        _addTargetedBy: function(a) {
            this.targetedBy.push(a)
        },
        _removeTargetedBy: function(a) {
            this.targetedBy.erase(a)
        },
        onEnemyEvent: null,
        sendEnemyEvent: function(a, b) {
            for (var c = this.targetedBy.length; c--;) {
                var d = this.targetedBy[c];
                if (d.onEnemyEvent) d.onEnemyEvent(this,
                    a, b)
            }
        },
        hasShield: function(a) {
            for (var b = this.shieldsConnections.length; b--;)
                if (this.shieldsConnections[b].shield.name == a) return true;
            return false
        },
        updateShields: function() {
            for (var a = this.shieldsConnections.length; a--;)
                if (this.shieldsConnections[a].update()) {
                    this.shieldsConnections[a].onDetach(this);
                    this.shieldsConnections.splice(a, 1)
                }
        },
        addShield: function(a, b) {
            var c = new sc.CombatantShieldConnection(this, a, b);
            this.shieldsConnections.push(c);
            return c
        },
        removeShield: function(a) {
            a.onDetach(this);
            this.shieldsConnections.erase(a)
        },
        removeNamedShield: function(a) {
            for (var b = this.shieldsConnections.length; b--;)
                if (this.shieldsConnections[b].shield.name == a) {
                    this.shieldsConnections[b].onDetach(this);
                    this.shieldsConnections.splice(b, 1)
                }
        },
        damage: function(a, b, c) {
            if (sc.pvp.isActive() && !sc.pvp.isCombatantInPvP(this) || sc.pvp.isCombatantInPvP(this) && (sc.pvp.isBrake() || sc.pvp.isFinished() || sc.pvp.isKillHit()) || !c && this.coll.subColls.length > 0) return false;
            if (this.invincibleTimer && !b.hitInvincible && !b.limiter.noAggro) {
                this.onPerfectDash();
                return false
            }
            return this.elementFilter &&
                a.getElement() != this.elementFilter || this.party == sc.COMBATANT_PARTY.ENEMY && (!this.target && !b.limiter.noAggro) && (!a.getCombatantRoot().isPlayer || !ig.EntityTools.isInScreen(this, 32)) ? false : this.onDamage(a, b, c)
        },
        isShielded: function(a, b, c, d) {
            for (var c = c && c.partName, e = this.shieldsConnections.length, f = sc.SHIELD_RESULT.NONE; e--;) {
                var g = this.shieldsConnections[e],
                    n = g.shield;
                if (n.strength != sc.SHIELD_STRENGTH.BLOCK_ALL && b.guardable != sc.GUARDABLE.ALWAYS) {
                    if (b.guardable == sc.GUARDABLE.NEVER) continue;
                    if (b.guardable ==
                        sc.GUARDABLE.FROM_ABOVE && n.strength != sc.SHIELD_STRENGTH.BLOCK_ABOVE) continue;
                    if (n.hitResist < b.type) continue
                }
                if (n.isActive(this, a, b, c, g.isPerfect()) && n.getDamageFactor(b, this) < 1) {
                    if (n.neutralize) return sc.SHIELD_RESULT.NEUTRALIZE;
                    if (d) {
                        if (n.stableOverride > d.hitStable) d.hitStable = n.stableOverride;
                        d.damageFactor = g.isPerfect() ? 0 : d.damageFactor * n.getDamageFactor(b, this)
                    }
                    f = Math.max(f, g.isPerfect() ? sc.SHIELD_RESULT.PERFECT : sc.SHIELD_RESULT.REGULAR)
                }
            }
            return f
        },
        getSpikeShieldFactor: function() {
            for (var a = 1,
                    b = this.shieldsConnections.length; b--;) {
                var c = this.shieldsConnections[b].shield;
                c.reduceSpikeDamage() && (a = a * c.baseFactor)
            }
            return a
        },
        onPreDamageModification: function() {
            return false
        },
        onPerfectDash: function() {},
        onStunLockClear: function() {
            this.damageTimer = 0.01;
            this.stunSteps.length = 0
        },
        onDamage: function(a, c, g) {
            var k = this.hitStable,
                l, o = c.type,
                m = c.visualType,
                n = c.fly,
                p = c.reverse,
                r = g || this,
                t = this.hitIgnore;
            e.hitStable = k;
            e.damageFactor = 1;
            var q = this.isShielded(a, c, g, e),
                k = e.hitStable;
            l = e.damageFactor;
            var s = a.getHitCenter(r,
                    d),
                v = a.getCombatant(),
                y = v.getCombatantRoot();
            if (this.params && this.params.isDefeated() || !this.statusGui) return false;
            var u;
            if (q == sc.SHIELD_RESULT.NEUTRALIZE) {
                sc.combat.showHitEffect(r, s, sc.ATTACK_TYPE.NONE, c.element, q);
                return true
            }
            if (!c.damageFactor || c.limiter.onlyHitProxy) {
                c.limiter.noHitProxy || (a.spawnHitProxy ? a.spawnHitProxy(r, null, s) : v.spawnHitProxy(r, null, s));
                return true
            }
            this.params && c.attackerParams && (u = this.params.getDamage(c, l, v, q, t));
            f.weakness = false;
            f.alignFace = false;
            f.ignoreHit = false;
            f.survive =
                false;
            f.damageFactor = l;
            var z = q;
            l = false;
            this.stunData.lastHitElement = c.element;
            if (this.onPreDamageModification(f, a, c, g, u, q, t)) {
                k = f.hitStable == void 0 ? k : f.hitStable;
                f.hitStable == sc.ATTACK_TYPE.NONE && (z = false);
                if (f.attackType != void 0) m = o = f.attackType;
                if (f.damageResult && u) u = f.damageResult;
                if (f.survive && u) u.damage = this.params.currentHp - 1;
                n = f.flyLevel || n;
                f.damageResult = void 0;
                f.attackType = void 0;
                f.flyLevel = void 0;
                f.hitStable = void 0;
                l = f.alignFace;
                t = this.hitIgnore
            } else if (f.ignoreHit) return false;
            sc.combat.isDamageIgnore() &&
                (u = null);
            c.limiter.noHitProxy || (a.spawnHitProxy ? a.spawnHitProxy(r, u, s) : v.spawnHitProxy(r, u, s));
            if (t && o < sc.ATTACK_TYPE.BREAK) {
                c.limiter.noDmg || sc.combat.showHitEffect(r, s, sc.ATTACK_TYPE.NONE, c.element);
                return true
            }
            f.weakness && this.statusGui.setStatusEntry("BREAK", f.weakness);
            if (v != r) {
                v.combo.hitCombatants.erase(r);
                v.combo.hitCombatants.push(r)
            }
            if (u && !c.limiter.noDmg) {
                g = Math.max(1, this.params.getStat("hp") * this.stunThreshold * sc.combat.getGlobalDmgFactor(this.party));
                k > sc.ATTACK_TYPE.NONE && (u.damage <=
                    g && !c.noIronStance) && (k = sc.ATTACK_TYPE.MASSIVE);
                if (this.party == sc.COMBATANT_PARTY.ENEMY && y.isPlayer && this.params.getHpFactor() == 1 && u.damage >= this.params.getStat("hp")) {
                    sc.stats.addMap("combat", "oneHitKills", 1);
                    sc.arena.onHitKill(this)
                }
                sc.arena.onPreDamageApply(this, u, q, v, c);
                this.params.applyDamage(u, c, v);
                v.combo.dmgSum = v.combo.dmgSum + u.damage;
                y.addSpikeDamage(u, this.spikeDmg.baseFactor + this.spikeDmg.tmpFactor, this, q, a);
                this.onDamageTaken && this.onDamageTaken(u.damage, q);
                if (y) y.onTargetHit(this, c, u,
                    q, a);
                sc.options.get("damage-numbers") && !sc.combat.hideDamageNumbers && (sc.options.get("damage-numbers-crit") ? u.critical && ig.ENTITY.HitNumber.spawnHitNumber(s, this, u.damage, u.baseOffensiveFactor, u.defensiveFactor, q, u.critical, f.weakness) : ig.ENTITY.HitNumber.spawnHitNumber(s, this, u.damage, u.baseOffensiveFactor, u.defensiveFactor, q, u.critical, f.weakness))
            }
            k = k >= o && (!this.params || !this.params.isLocked());
            this.params && (this.params.isLocked() && !this.params.isLockedBy(v) && !this.params.isLockedBy(y)) && (k = true);
            o = this.params && this.params.isLocked();
            if (!k) {
                this.stunCombatant = v;
                for (v = c.stunSteps.length; v--;) {
                    q = c.stunSteps[v];
                    q.preHit && q.preHit(this, this.stunCombatant)
                }
            }
            if (o && !this.params.isLocked() && y.charging && y.charging.executeLevel >= 1) sc.arena.onLockEnd(this, c, u, y.charging.executeLevel);
            if (this.params && this.params.isDefeated()) {
                this._onDeathHit(y);
                m = sc.ATTACK_TYPE.BREAK;
                y = u ? u.damage / this.params.getStat("hp") : 0;
                y = y >= 2 ? "MASSIVE+++" : y >= 1 ? "MASSIVE++" : y >= 0.5 ? "MASSIVE+" : "MASSIVE";
                if (!n || sc.COMBAT_FLY_LEVEL[n].vel <
                    sc.COMBAT_FLY_LEVEL[y].vel) n = y;
                k = false
            }
            if (!c.limiter.noDmg) {
                sc.combat.showHitEffect(r, s, m, c.element, z, u && u.critical);
                u && (u.damage > 1E12 ? sc.combat.effects.hit.spawnOnTarget("hitExtra4", this) : u.damage > 1E9 ? sc.combat.effects.hit.spawnOnTarget("hitExtra3", this) : u.damage > 1E7 ? sc.combat.effects.hit.spawnOnTarget("hitExtra2", this) : u.damage > 1E5 && sc.combat.effects.hit.spawnOnTarget("hitExtra1", this))
            }
            r = a.getHitVel(this, b);
            if (l) {
                Vec2.assign(this.face, r);
                Vec2.flip(this.face)
            }
            k || this.cancelAction();
            if (!n) switch (m) {
                case sc.ATTACK_TYPE.LIGHT:
                    n =
                        "LIGHT";
                    break;
                case sc.ATTACK_TYPE.MEDIUM:
                    n = "MEDIUM";
                    break;
                case sc.ATTACK_TYPE.HEAVY:
                    n = "HEAVY";
                    break;
                case sc.ATTACK_TYPE.MASSIVE:
                case sc.ATTACK_TYPE.BREAK:
                    n = "MASSIVE"
            }
            m = m == sc.ATTACK_TYPE.BREAK;
            s = 0;
            a.isBall && c.hasHint("CHARGED") && (s = c.attackerParams.getModifier("KNOCKBACK"));
            a = this.doDamageMovement(r, n, m, k, s, false, p, 1);
            this.damageTimer = Math.max(this.damageTimer, a);
            if (!k && this.stunCombatant) {
                this.stunData.hits++;
                this.stunData.damage = this.stunData.damage + (u && u.damage || 0);
                this.stunData.resetTimer = 0.5;
                this.stepTimer = 0;
                if (this.stunSteps.length > 0) this.stunSteps.length = 0;
                for (v = c.stunSteps.length; v--;) {
                    q = c.stunSteps[v];
                    q.start && q.start(this, this.stunCombatant);
                    q.run(this, this.stunCombatant) || this.stunSteps.push(q)
                }
            }
            return true
        },
        regenPvp: function(a) {
            this.dying = sc.DYING_STATE.ALIVE;
            this.params.revive(a);
            this.params.setRelativeSp(sc.SP_REGEN_FACTOR);
            sc.CombatProxyTools.clearEntityProxy(this);
            this.resetStunData()
        },
        onPvpEnd: function(a) {
            if (a) {
                sc.combat.notifyCombatantDefeated(this);
                this.defeatNotified = false
            } else {
                a =
                    "kill" + this.enemyName;
                sc.stats.getMap("combat", a) || sc.stats.setMap("combat", a, -1)
            }
        },
        setCombatStat: function(a, b) {
            this.params && this.params.setCombatStat(a, b)
        },
        getCombatStat: function(a, b) {
            return this.params ? this.params.getCombatStat(a, b) : void 0
        },
        addCombatStat: function(a, b) {
            this.params && this.params.addCombatStat(a, b)
        },
        _onDeathHit: function(a) {
            if (this.dying == sc.DYING_STATE.ALIVE) {
                this.dying = sc.DYING_STATE.KILL_HIT;
                sc.combat.onCombatantDeathHit(a, this);
                ig.EffectTools.clearEffects(this);
                (a = new ig.Rumble.RumbleHandle("RANDOM",
                    "STRONG", "FASTER", 0.3, false, true)) && !this.skipRumble && ig.rumble.addRumble(a);
                if (!sc.pvp.isCombatantInPvP(this)) {
                    this.effects.death.spawnOnTarget("pre_die", this, {
                        duration: -1
                    });
                    this.coll.type = ig.COLLTYPE.IGNORE
                }
            }
        },
        addSpikeDamage: function(a, b, c, d, e) {
            if (c.party != sc.COMBATANT_PARTY.PLAYER || d) {
                var f = this.getSpikeShieldFactor() * this.params.damageFactor,
                    g = (this.params.getStat("defense") - c.params.getStat("defense") / 2) / 2,
                    g = a.defReduced - a.offensiveFactor * g;
                if (d) {
                    c.combo.blockedDamage = c.combo.blockedDamage + Math.max(0,
                        g);
                    c.combo.blockedFactor = c.combo.blockedFactor + a.offensiveFactor;
                    c.combo.guardedHits = c.combo.guardedHits + 1;
                    c.combo.guardedEntity = e
                }
                if (b = Math.max(0, Math.round(g * b * f))) {
                    d = 0;
                    e = this.spikeDmg.receiveStash;
                    for (f = e.length; f--;) d = d + e[f].timer;
                    this.effects.death.spawnOnTarget("spikeDmg", this, {
                        target2: c,
                        target2Align: ig.ENTITY_ALIGN.CENTER,
                        align: ig.ENTITY_ALIGN.CENTER
                    }).setIgnoreSlowdown();
                    this.spikeDmg.receiveStash.push({
                        damage: b,
                        timer: 0.6 - d,
                        offensiveFactor: a.offensiveFactor
                    })
                }
            }
        },
        updateSpikeDamage: function() {
            var a =
                this.spikeDmg.receiveStash;
            if (this.isDefeated()) a.length = 0;
            if (a.length)
                for (a.last().timer -= ig.system.ingameTick; a.length && a.last().timer <= 0;) {
                    var b = a.pop(),
                        c = b.damage;
                    if (this.getSpikeShieldFactor() * this.params.damageFactor > 0) {
                        this.effects.death.spawnOnTarget("spikeHit", this, {
                            align: ig.ENTITY_ALIGN.CENTER
                        }).setIgnoreSlowdown();
                        this.instantDamage(c, b.offensiveFactor)
                    }
                }
        },
        instantDamage: function(a, d, e) {
            if (!this.params.isDefeated()) {
                e = this.onInstantDamage && this.onInstantDamage(a, e);
                this.onDamageTaken && this.onDamageTaken(a);
                e && (a = this.params.currentHp - 1);
                sc.arena.onPreInstantDamage(this, a);
                this.params.reduceHp(a);
                e = this.getAlignedPos(ig.ENTITY_ALIGN.CENTER, c);
                sc.options.get("damage-numbers") && ig.ENTITY.HitNumber.spawnHitNumber(e, this, a, d, 1, false, false, false);
                if (this.params.isDefeated()) {
                    this.cancelAction();
                    this._onDeathHit(this);
                    a = Vec2.assign(b, this.face);
                    Vec2.flip(a);
                    a = this.doDamageMovement(a, "MASSIVE", false, false, 0);
                    this.damageTimer = Math.max(this.damageTimer, a)
                }
            }
        },
        doDamageMovement: function(a, b, c, d, e, f, g, n) {
            b = b && sc.COMBAT_FLY_LEVEL[b];
            if (!b) return 0;
            e = e || 0;
            if (!d) {
                this.cancelJump();
                this.walkAnims.damage && this.setCurrentAnim(this.walkAnims.damage, true, null, true);
                this.animationFixed = true;
                this.coll.accelDir.x = this.coll.accelDir.y = 0
            }
            var p = this.coll.weight == -1 ? 0 : Math.min(1, 200 / this.coll.weight);
            d && (p = p / 2);
            c && !this.coll.groundConnect && (p = 1);
            n !== void 0 && (p = p * n);
            c = 0;
            if (!a.x && !a.y) a.y = 1;
            e = b.vel * (1 + e) * p;
            Vec2.length(a, e);
            g && Vec2.flip(a);
            d ? (Vec2.dot(this.coll.vel, a) <= 0 || Vec2.length(this.coll.vel) < e) && Vec2.add(this.coll.vel, a) : Vec2.assign(this.coll.vel,
                a);
            if (!d) {
                if (this.coll.groundConnect != ig.COLL_GROUND_CONNECT.STRONG_FLIGHT) this.coll.friction.ground = 1;
                c = b.stun;
                if (b.jump) {
                    if (this.coll.groundConnect != ig.COLL_GROUND_CONNECT.STRONG_FLIGHT) this.fly.blocked = 0.1;
                    if (b.far) {
                        this.coll.type == ig.COLLTYPE.VIRTUAL && this.coll.setType(ig.COLLTYPE.IGNORE);
                        this.coll.float.height = this.floatHeightOnMove = 0
                    }
                    if (p) {
                        this.coll.zBounciness = b.bounciness;
                        this.coll.friction.air = b.airFriction;
                        a = b.jump;
                        !f && !this.isDefeated() && (a = Math.min(b.jump, Math.max(0, ig.CollTools.getJumpSpeedToHeight(this.coll,
                            this.coll.baseZPos + 24))));
                        this.coll.vel.z = a
                    }
                }
            }
            return c
        },
        onTargetHit: function(a, b, c) {
            if (b.spFactor) {
                a = c.baseOffensiveFactor * b.spFactor;
                a = a * ((1 + c.defensiveFactor) / 2);
                c.critical && (a = a * 1.5);
                c = this.params.getStat("focus");
                a = a * (0.75 + Math.pow(c / 400, 0.75));
                a = a * b.spRepeatFactor;
                b.spRepeatFactor = 0;
                this.params.addSp(a * 0.1)
            }
        },
        heal: function(a, b) {
            if (this.params && !this.params.isDefeated()) {
                var c = this.params.getHealAmount(a),
                    e = this.getAlignedPos(ig.ENTITY_ALIGN.CENTER, d);
                sc.arena.onCombatantHeal(this, c);
                this.params.increaseHp(c);
                sc.options.get("damage-numbers") && !b && ig.ENTITY.HitNumber.spawnHealingNumber(e, this, c);
                this.onHeal && this.onHeal(a, c)
            }
        },
        instantDefeat: function(a, b) {
            if (this.params) {
                this.skipRumble = a;
                this.params.reduceHp(this.params.currentHp);
                this.damageTimer = 0.01
            } else if (b) {
                this.skipRumble = a;
                this.effects.death.spawnFixed("boom_medium", this.coll.pos.x + this.coll.size.x / 2, this.coll.pos.y + this.coll.size.y + 1, this.coll.pos.z + this.coll.size.z / 2 + this.coll.size.y / 2 + 1, this).coll.time.globalStatic = true;
                this.coll.vel.x = this.coll.vel.y =
                    0;
                this.coll.zGravityFactor = 0;
                this.dying = sc.DYING_STATE.DYING;
                this.damageTimer = 0;
                this.stunSteps.length = 0
            }
        },
        selfDestruct: function(a) {
            this.dying = sc.DYING_STATE.DYING;
            this.params && this.params.setDefeated();
            this.manualKill ? ig.vars.set(this.manualKill, true) : this.doManualKill(a, true)
        },
        doManualKill: function(a, b) {
            sc.combat.notifyCombatantDefeated(this, a, b);
            this.kill()
        },
        doManualRevive: function(a) {
            ig.EffectTools.clearEffects(this);
            sc.combat.notifyCombatantDefeated(this);
            this.dying = sc.DYING_STATE.ALIVE;
            this.params.revive(a);
            this.params.setRelativeSp(sc.SP_REGEN_FACTOR);
            this.resetStunData()
        },
        onKill: function(a) {
            this.setTarget(null);
            this.clearDamageSum();
            a ? this.statusGui && this.statusGui.forceRemove() : this.statusGui && this.statusGui.remove();
            this.statusGui = null;
            this.parent()
        },
        update: function() {
            if (this.respawn.timer) {
                this.handleRespawn();
                this.parent()
            }
            this.coll.edgeSlipInward = this.damageTimer <= 0 && !this.influencer.hasPush();
            this.updateSpikeDamage();
            if (this.invincibleTimer > 0) {
                this.invincibleTimer = this.invincibleTimer - ig.system.actualTick *
                    ig.slowMotion.getNonInvertSlowDown();
                if (this.invincibleTimer < 0) this.invincibleTimer = 0
            }
            var a = sc.combat.isInCombat(this);
            if ((a || sc.newgame.get("waypoints-heals")) && this.regenFactor && this.params && this.params.getHpFactor() < 1) {
                var c = 0.5 / 6;
                this.regenFactor >= 0.2 * 6 ? c = c / 4 : this.regenFactor >= 0.1 * 6 && (c = c / 2);
                this.regenTimer = this.regenTimer + ig.system.tick;
                if (this.regenTimer > 60 * c) {
                    this.regenTimer = this.regenTimer - 60 * c;
                    sc.pvp.isActive() && (c = c / 4);
                    sc.combat.showHealEffect(this);
                    this.heal(new sc.HealInfo(this.params, {
                        value: this.regenFactor * c
                    }))
                }
            } else this.regenTimer = 0;
            this.updateShields();
            this.params && this.params.update(a);
            this.params && this.params.isDefeated() && this.influencer.removeActionInfluences();
            if (this.dying == sc.DYING_STATE.DYING) {
                if (!this.manualKill && !sc.pvp.isCombatantInPvP(this)) {
                    this.damageTimer = this.damageTimer + ig.system.tick;
                    this.coll.pos.z = this.coll.pos.z + ig.system.tick * 16;
                    this.damageTimer >= 0.5 && this.kill()
                }
            } else if (this.damageTimer > 0) {
                this.stunData.time = this.stunData.time + ig.system.tick;
                this.stepTimer =
                    this.stepTimer + ig.system.tick;
                for (a = this.stunSteps.length; a--;) this.stunSteps[a].run(this, this.stunCombatant) && this.stunSteps.splice(a, 1);
                if (!this.params || !this.params.isLocked())
                    if (this.damageTimer <= ig.system.tick)
                        if (this.params && this.params.isDefeated())
                            if (this.dying == sc.DYING_STATE.ALIVE) {
                                this._onDeathHit(this.stunCombatant || this);
                                if (!this.skipRumble) {
                                    a = Vec2.assign(b, this.face);
                                    Vec2.flip(a);
                                    this.damageTimer = this.doDamageMovement(a, "MASSIVE", false, false, 0)
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
                    this.onStunEnd &&
                        this.onStunEnd()
                } else this.damageTimer = this.damageTimer - ig.system.tick
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
        resetStunData: function() {
            this.stunData.resetTimer = 0;
            this.stunData.hits = 0;
            this.stunData.damage = 0;
            this.stunData.time =
                0
        },
        clearDamageSum: function() {
            this.stunData.damageSumTimer = 0;
            this.stunData.damageSum = 0;
            this.stunData.damageSumHits = 0;
            if (this.stunData.damageSumEntity) {
                this.stunData.damageSumEntity.clear();
                this.stunData.damageSumEntity = null
            }
        },
        onTerrainUpdate: function() {
            this.checkQuickRespawn()
        },
        checkQuickRespawn: function() {
            var a = this.coll;
            if (a.pos.z < ig.game.minLevelZ && !this.tooHighToFall && !this.coll.ignoreCollision && a._collData) {
                var c = ig.EntityTools.getGroundEntity(this);
                if (!c || !(c instanceof ig.ENTITY.Elevator)) {
                    if (a.vel.z <
                        0) a.vel.z = 0;
                    if (this.dying != sc.DYING_STATE.DYING && this.params && this.params.isDefeated()) this.damageTimer = 0.001;
                    this.quickFall(ig.TERRAIN.HOLE);
                    return
                }
            }
            if (this.coll.float.height && !this.jumping) {
                this.getCenter(b);
                !sc.combat.isRespawnBlocked(this.coll) && (!this.respawn.timer && !ig.CollTools.isCloseToEdge(this.coll) && a.baseZPos >= ig.game.minLevelZ && !ig.terrain.isDangerTerrain(ig.terrain.getTerrain(this.coll, false, true))) && Vec3.assign(this.respawn.pos, this.coll.pos)
            }
            if (!(a.pos.z > a.baseZPos || this.jumping ||
                    a.zGravityFactor == 0)) {
                c = this.stepStats.terrain;
                if (ig.terrain.isFallTerrain(c)) this.quickFall(c);
                else {
                    c = c == ig.TERRAIN.ICE && (!this.params || !this.params.getModifier("BEGONE_ICE")) ? 0.12 : this.isPlayer && sc.newgame.get("ice-physics") ? 0.12 : 1;
                    a.friction.terrain = c <= a.friction.terrain ? c : (1 - ig.system.tick * 3) * a.friction.terrain + ig.system.tick * 3 * c;
                    !ig.CollTools.isCloseToEdge(this.coll) && (!sc.combat.isRespawnBlocked(this.coll) && !ig.terrain.isDangerTerrain(this.stepStats.terrain) && !this.respawn.timer) && Vec3.assign(this.respawn.pos,
                        this.coll.pos)
                }
            }
        },
        quickFall: function(a) {
            if (!this.respawn.timer && (!this.params || !this.params.isDefeated() || this.isPlayer && this.manualKill))
                if (!this.onFallBehavior || !this.onFallBehavior(a)) {
                    var b = this.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, d);
                    this.animState.alpha = 0;
                    ig.EntityTools.isInScreen(this) || (a = ig.TERRAIN[sc.map._oobSoundTerrain]);
                    a == ig.TERRAIN.HOLE ? this.effects.death.spawnFixed("hole_fall", b.x, b.y, b.z) : a == ig.TERRAIN.WATER ? this.effects.death.spawnFixed("waterSplash", b.x, b.y, b.z) : a == ig.TERRAIN.HIGHWAY ?
                        this.effects.death.spawnFixed("hole_fall", b.x, b.y, b.z) : a == ig.TERRAIN.COAL && this.effects.death.spawnFixed("coalBurn", b.x, b.y, b.z);
                    b = 0;
                    if (this.params) {
                        sc.combat.isDamageIgnore() || (b = Math.floor(this.params.getStat("hp") * this.fallDmgFactor));
                        this.cancelAction()
                    }
                    this.doQuickRespawn(a, false, b)
                }
        },
        handleRespawn: function() {
            this.respawn.timer = this.respawn.timer - ig.system.tick;
            if (this.respawn.timer < 0) this.respawn.timer = 0;
            Vec3.assignC(this.coll.vel, 0, 0, 0);
            Vec2.assignC(this.coll.accelDir, 0, 0);
            var a = this.respawn.timer /
                this.respawn.duration,
                b = KEY_SPLINES.EASE_IN_OUT.get((1 - a).limit(0, 1)),
                b = Vec3.lerp(this.respawn.oldPos, this.respawn.pos, b, d);
            this.setPos(b.x, b.y, b.z);
            if (this.respawn.timer <= 0.2 && !this.respawn.fx) {
                this.respawn.fx = true;
                ig.game.effects.teleport.spawnOnTarget("showRespawn", this)
            }
            if (a <= 0) {
                this.animState.scaleX = 1;
                this.animState.scaleY = 1;
                this.invincibleTimer = 0.3;
                if (this.onRespawnEnd) this.onRespawnEnd();
                this.nav.path.redoPathDeferred();
                if (!this.isDefeated()) {
                    this.cancelAction();
                    if (!sc.combat.isDamageIgnore() &&
                        this.respawn.damage) {
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
        doQuickRespawn: function(a, b, c) {
            Vec3.assignC(this.coll.vel, 0, 0, 0);
            if (b) {
                this.respawn.terrain = a;
                this.setPos(this.respawn.pos.x, this.respawn.pos.y, this.respawn.pos.z);
                this.nav.path.redoPathDeferred();
                ig.game.effects.teleport.spawnOnTarget("showFast",
                    this);
                if (this.onRespawnEnd) this.onRespawnEnd()
            } else {
                var b = this.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, d),
                    e = Vec3.create(this.respawn.pos);
                Vec2.addMulF(e, this.coll.size, 0.5);
                var f = (Vec3.distance(b, e) / 640).limit(0.5, 1.5);
                this.effects.death.spawnFixed("respawnLine", b.x, b.y, b.z, this, {
                    target2Point: e,
                    duration: f + 0.1
                });
                Vec3.assign(this.respawn.oldPos, this.coll.pos);
                this.invincibleTimer = -1;
                this.respawn.timer = f + 0.1;
                this.respawn.duration = f;
                this.respawn.damage = c || 0;
                this.respawn.fx = false;
                this.respawn.terrain = a;
                this.isDefeated() ||
                    this.setAction(g)
            }
        },
        onDefeat: function() {},
        getAnimPartyEntityClass: function() {
            return sc.CombatantAnimPartEntity
        }
    });
    sc.CombatantAnimPartEntity = ig.AnimationPartEntity.extend({
        isCombatant: true,
        init: function(a, b, c, d) {
            this.parent(a, b, c, d);
            this.party = this.owner.party
        },
        damage: function(a, b) {
            return this.owner.damage(a, b, this)
        },
        collideWith: function(a) {
            this.owner.checkTackle(a, this)
        },
        getCombatant: function() {
            return this.owner
        },
        getCombatantRoot: function() {
            return this.owner
        },
        getHitCenter: function(a, b) {
            return this.getOverlapCenterCoords(a,
                b)
        },
        getHitVel: function(a, b) {
            var c = b || {};
            Vec2.assign(c, this.coll._collData.frameVel);
            if (Vec2.isZero(c)) {
                Vec2.assign(c, a.coll.vel);
                Vec2.flip(c)
            }
            return c
        }
    });
    var g = new ig.Action("quickRespawnAction", [{
        type: "WAIT",
        time: 10
    }]);
    g.hint = "battle";
    g.eventAction = true;
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
        fromDataFix: function() {
            typeof this.hitStable ==
                "string" && (this.hitStable = sc.ATTACK_TYPE[this.hitStable]);
            typeof this.elementFilter == "string" && (this.elementFilter = sc.ELEMENT[this.elementFilter])
        },
        apply: function(a) {
            if (a.params) {
                a.params.damageFactor = this.damageFactor * 1;
                a.params.ballFactor = this.ballFactor * 1
            }
            a.hitStable = this.hitStable;
            a.hitIgnore = this.hitIgnore;
            a.tackle.attackInfo = this.tackleAttackInfo;
            a.invincibleTimer = this.invincibleTimer;
            a.elementFilter = this.elementFilter;
            a.spikeDmg.tmpFactor = this.spikeDmg;
            a.tmpTarget = this.tmpTarget;
            a.fallDmgFactor =
                this.fallDmgFactor;
            a.combo.damageCeiling = null;
            a.combo.hitCombatants.length = 0;
            a.combo.dmgSum = 0;
            a.combo.blockedDamage = 0;
            a.combo.blockedFactor = 0;
            a.combo.guardedHits = 0;
            a.combo.guardedEntity = null;
            a.combo.hitProxy = null;
            a.combo.guardTrapTime = 0
        },
        load: function(a) {
            if (a.params) {
                this.damageFactor = a.params.damageFactor;
                this.ballFactor = a.params.ballFactor
            }
            this.hitStable = a.hitStable;
            this.hitIgnore = a.hitIgnore;
            this.tackleAttackInfo = a.tackle.attackInfo;
            this.invincibleTimer = a.invincibleTimer;
            this.elementFilter = a.elementFilter;
            this.spikeDmg = a.spikeDmg.tmpFactor;
            this.tmpTarget = a.tmpTarget;
            this.fallDmgFactor = a.fallDmgFactor
        }
    }
});
ig.baked = !0;

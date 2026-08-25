ig.module("game.feature.combat.model.combat-params").requires("game.feature.model.base-model").defines(function() {
    sc.ELEMENT = {
        NEUTRAL: 0,
        HEAT: 1,
        COLD: 2,
        SHOCK: 3,
        WAVE: 4
    };
    sc.ELEMENT_MAX = 4;
    sc.ELEMENT_COUNTER = {};
    sc.ELEMENT_COUNTER[sc.ELEMENT.HEAT] = sc.ELEMENT.COLD;
    sc.ELEMENT_COUNTER[sc.ELEMENT.COLD] = sc.ELEMENT.HEAT;
    sc.ELEMENT_COUNTER[sc.ELEMENT.SHOCK] = sc.ELEMENT.WAVE;
    sc.ELEMENT_COUNTER[sc.ELEMENT.WAVE] = sc.ELEMENT.SHOCK;
    sc.SP_REGEN_SPEED = {
        4: 1,
        8: 1.2,
        12: 1.4,
        16: 1.6
    };
    sc.SP_REGEN_FACTOR = 0.25;
    sc.HP_LOW_WARNING =
        0.33;
    var b = {
        LINEAR: function(a, b) {
            return a * 2 - b
        },
        PERCENTAGE: function(a, b) {
            return a > b ? a * (1 + Math.pow(1 - b / a, 0.5) * 0.2) : a * Math.pow(a / b, 1.5)
        }
    };
    ig.perf.skipDmgModifiers = false;
    sc.CombatParams = ig.Class.extend({
        combatant: null,
        observers: [],
        baseParams: {
            hp: 100,
            attack: 10,
            defense: 5,
            focus: 5,
            elemFactor: [1, 1, 1, 1],
            statusInflict: [1, 1, 1, 1],
            statusEffect: [1, 1, 1, 1]
        },
        modifiers: null,
        buffs: [],
        currentHp: 100,
        maxSp: 12,
        currentSp: 6,
        spHoldTimer: 0,
        currentItemBuffs: 0,
        tmpElemFactor: [1, 1, 1, 1],
        tmpStatusInflict: [1, 1, 1, 1],
        damageFactor: 1,
        ballFactor: 1,
        defeated: false,
        statusStates: [],
        hpRegTime: 5,
        hpHealTimer: 0,
        criticalDmgFactor: 1.5,
        lockedBy: [],
        stats: {},
        init: function(a) {
            if (a)
                for (var b in this.baseParams) this.baseParams[b] = a[b] || this.baseParams[b];
            this.currentHp = this.getStat("hp");
            for (b = 0; b < 4; ++b) this.statusStates[b] = new sc.COMBAT_STATUS[b]
        },
        setCombatStat: function(a, b) {
            this.stats[a] = b || null
        },
        getCombatStat: function(a, b) {
            return this.stats[a] || b
        },
        addCombatStat: function(a, b) {
            this.stats[a] = this.stats[a] ? this.stats[a] + b : b
        },
        healStatus: function() {
            for (var a =
                    0; a < 4; ++a) this.statusStates[a].clear(this.combatant)
        },
        revive: function(a) {
            this.defeated = false;
            if (this.currentHp < 0) this.currentHp = 0;
            this.increaseHp(Math.round(this.getStat("hp") * (a || 1)));
            this.healStatus()
        },
        setCombatant: function(a) {
            this.combatant = a
        },
        initStatusFx: function() {
            if (this.combatant)
                for (var a = 0; a < 4; ++a) this.statusStates[a].initEntity(this.combatant)
        },
        setModifiers: function(a) {
            this.modifiers = a
        },
        startLock: function(a) {
            if (a.currentAction && a.actionAttached.indexOf(this) == -1) {
                a.addActionAttached(this);
                this.lockedBy.push(a)
            }
        },
        endLock: function(a) {
            a.removeActionAttached(this) && this._decreaseLock(a)
        },
        clearLock: function() {
            for (var a = this.lockedBy.length; a--;) this.lockedBy[a].actionAttached.erase(this);
            this.lockedBy.length = 0
        },
        isLocked: function() {
            return this.lockedBy.length > 0
        },
        isLockedBy: function(a) {
            return this.lockedBy.indexOf(a) != -1
        },
        onActionEndDetach: function(a) {
            this._decreaseLock(a)
        },
        _decreaseLock: function(a) {
            this.lockedBy.erase(a);
            if (this.lockedBy.length == 0) this.combatant.onStunLockClear()
        },
        reset: function(a) {
            this.currentItemBuffs =
                this.buffs.length = 0;
            this.currentHp = this.getStat("hp");
            this.spHoldTimer = 0;
            this.defeated = false;
            this.damageFactor = 1;
            this.maxSp = a || 16;
            this.currentSp = this.maxSp * sc.SP_REGEN_FACTOR;
            this.resetStatusConditions();
            sc.Model.notifyObserver(this, sc.COMBAT_PARAM_MSG.RESET_STATS)
        },
        resetStatusConditions: function() {
            for (var a = this.statusStates.length; a--;) this.statusStates[a].clear()
        },
        resetSp: function() {
            this.currentSp = this.maxSp * sc.SP_REGEN_FACTOR;
            sc.Model.notifyObserver(this, sc.COMBAT_PARAM_MSG.SP_CHANGED)
        },
        setMaxSp: function(a) {
            this.maxSp =
                a || 0;
            this.currentSp = this.maxSp * sc.SP_REGEN_FACTOR;
            sc.Model.notifyObserver(this, sc.COMBAT_PARAM_MSG.MAX_SP_CHANGED)
        },
        setBaseParams: function(a, b) {
            var c = this.getStat("hp") - this.currentHp,
                d;
            for (d in this.baseParams) this.baseParams[d] = a[d] || this.baseParams[d];
            this.currentHp = this.getStat("hp") - c;
            sc.Model.notifyObserver(this, sc.COMBAT_PARAM_MSG.STATS_CHANGED, b)
        },
        getStat: function(a, b) {
            for (var c = this.baseParams[a], d = this.buffs.length; d--;)
                if (!b || !this.buffs[d].hacked) c = this.buffs[d].multiply(c, a);
            typeof c ==
                "number" && (c = Math.round(c));
            return c
        },
        getStatBuffFactor: function(a) {
            for (var b = 1, c = this.buffs.length; c--;) b = this.buffs[c].multiply(b, a);
            return b
        },
        getModifier: function(a) {
            if (this.combatant && this.combatant.isPlayer && !sc.model.player.getCore(sc.PLAYER_CORE.MODIFIER) || sc.arena.isStatusModifierBlocked(a)) return 0;
            for (var b = this.modifiers && this.modifiers[a] || 0, c = this.buffs.length; c--;) b = this.buffs[c].add(b, a);
            return b
        },
        getDamage: function(e, g, h, i, j) {
            var k = e.damageFactor,
                l = e.noHack || false,
                o = h.getCombatantRoot(),
                h = h.combo || o.combo;
            if (h.damageCeiling) {
                var m = Math.max(1 - (h.damageCeiling.sum[this.combatant.id] || 0) / h.damageCeiling.max, 0);
                m < 0.5 && (k = Math.max(k * 2 * m, 0.01))
            }
            h = k;
            if (!ig.perf.skipDmgModifiers) {
                e.skillBonus && (k = k * (1 + e.attackerParams.getModifier(e.skillBonus)));
                var n = e.attackerParams.getModifier("BERSERK");
                n && e.attackerParams.getHpFactor() <= sc.HP_LOW_WARNING && (k = k * (1 + n));
                (n = e.attackerParams.getModifier("MOMENTUM")) && (o.isPlayer && o.dashAttackCount) && (k = k * (1 + o.dashAttackCount * n));
                !ig.vars.get("g.newgame.ignoreSergeyHax") &&
                    (o.isPlayer && !this.combatant.isPlayer && sc.newgame.get("sergey-hax")) && (k = k * 4096)
            }
            var g = this.damageFactor * (g === void 0 ? 1 : g),
                n = 1,
                p = e.attackerParams.getStat("focus", l) / this.getStat("focus", l),
                r = (Math.pow(p, 0.35) - 0.9) * e.critFactor,
                r = Math.random() <= r;
            if (!ig.perf.skipDmgModifiers) {
                e.element && (n = this.getStat("elemFactor")[e.element - 1] * this.tmpElemFactor[e.element - 1]);
                g = g * n;
                e.ballDamage && (g = g * (this.ballFactor + this.statusStates[3].getValue(this)));
                (m = e.attackerParams.getModifier("CROSS_COUNTER")) && sc.EnemyAnno.isCrossCounterEffective(this.combatant) &&
                    (g = g * (1 + m));
                (m = e.attackerParams.getModifier("BREAK_DMG")) && sc.EnemyAnno.isWeak(this.combatant) && (g = g * (1 + m));
                r && (k = k * e.attackerParams.criticalDmgFactor)
            }
            o = sc.combat.getGlobalDmgFactor(o.party);
            m = 0;
            if (e.element && e.statusInflict && g > 0 && !j) var j = e.element - 1,
                m = h * e.statusInflict,
                t = (Math.pow(1 + (p >= 1 ? p - 1 : 1 - p) * c, a) - 1) * d,
                p = p >= 1 ? 1 + t : Math.max(0, 1 - t),
                m = m * p * this.getStat("statusInflict")[j] * this.tmpStatusInflict[j] * n,
                m = this.statusStates[j].getInflictValue(m, this, e, i);
            i = e.attackerParams.getStat("attack", l);
            l = e.defenseFactor *
                this.getStat("defense", l);
            l = Math.max(1, b.PERCENTAGE(i, l));
            l = l * g;
            i = b.PERCENTAGE(i, 0) - l;
            l = l * k * o;
            i = i * k * o;
            if (!ig.perf.skipDmgModifiers) {
                l = l * (0.95 + Math.random() * 0.1);
                i = i * (0.95 + Math.random() * 0.1)
            }
            if (e.limiter.noDmg) i = l = 0;
            l = Math.round(l);
            return {
                damage: l,
                defReduced: i,
                offensiveFactor: k,
                baseOffensiveFactor: h,
                elementalDef: n,
                defensiveFactor: g,
                critical: r,
                status: m
            }
        },
        applyDamage: function(a, b, c) {
            var d = c.getCombatantRoot(),
                c = c.combo || d.combo;
            if (c.damageCeiling) {
                d = this.combatant.id;
                c.damageCeiling.sum[d] || (c.damageCeiling.sum[d] =
                    0);
                c.damageCeiling.sum[d] = c.damageCeiling.sum[d] + a.baseOffensiveFactor
            }
            a.status && this.statusStates[b.element - 1].inflict(a.status, this, b);
            this.reduceHp(a.damage)
        },
        getHealAmount: function(a) {
            a = !a.absolute ? this.getStat("hp") * a.value : a.value;
            a = a * (0.95 + Math.random() * 0.1);
            return a = Math.round(a)
        },
        reduceHp: function(a) {
            if (a < 0) return this.increaseHp(-a);
            if (a > 0) {
                if (!this.defeated && this.currentHp <= a) {
                    var b = this.getModifier("ONCE_MORE");
                    this.currentHp > 0 && b ? sc.combat.doDramaticEffect(this.combatant, this.combatant,
                        sc.DRAMATIC_EFFECT.ONCE_MORE) : this.defeated = true
                }
                this.currentHp = Math.max(-this.getStat("hp"), this.currentHp - a)
            }
            if (this.combatant.party == sc.COMBATANT_PARTY.PLAYER) this.hpHealTimer = 2;
            sc.Model.notifyObserver(this, sc.COMBAT_PARAM_MSG.HP_CHANGED)
        },
        setRelativeHp: function(a) {
            this.currentHp = Math.round(this.getStat("hp") * a);
            sc.Model.notifyObserver(this, sc.COMBAT_PARAM_MSG.HP_CHANGED)
        },
        setCritical: function() {
            this.currentHp = 0;
            sc.Model.notifyObserver(this, sc.COMBAT_PARAM_MSG.HP_CHANGED)
        },
        increaseHp: function(a) {
            this.currentHp =
                Math.min(this.getStat("hp"), this.currentHp + a);
            if (this.currentHp > 0) this.defeated = false;
            sc.Model.notifyObserver(this, sc.COMBAT_PARAM_MSG.HP_CHANGED)
        },
        getHpFactor: function() {
            return this.currentHp / this.getStat("hp")
        },
        addSp: function(a, b) {
            if (a > 0) this.spHoldTimer = 5;
            var b = b || (a > 0 ? this.maxSp : 0),
                c = (sc.SP_REGEN_SPEED[this.maxSp] || 1) * (1 + this.getModifier("SP_REGEN"));
            this.currentSp = this.currentSp + a * c;
            if (a > 0 && this.currentSp > b) this.currentSp = b;
            if (a < 0 && this.currentSp < b) this.currentSp = b;
            sc.Model.notifyObserver(this,
                sc.COMBAT_PARAM_MSG.SP_CHANGED, true)
        },
        consumeSp: function(a) {
            this.currentSp = this.currentSp - a;
            if (this.currentSp < 0) this.currentSp = 0;
            sc.Model.notifyObserver(this, sc.COMBAT_PARAM_MSG.SP_CHANGED)
        },
        setRelativeSp: function(a) {
            this.spHoldTimer = 5;
            this.currentSp = Math.round(this.maxSp * a);
            sc.Model.notifyObserver(this, sc.COMBAT_PARAM_MSG.SP_CHANGED)
        },
        getSp: function() {
            return Math.floor(this.currentSp)
        },
        getRelativeSp: function() {
            return Math.floor(this.currentSp) / this.maxSp
        },
        notifySpConsume: function(a) {
            sc.Model.notifyObserver(this,
                sc.COMBAT_PARAM_MSG.SP_CONSUME, a)
        },
        setDefeated: function() {
            this.currentHp = 0;
            this.defeated = true;
            sc.Model.notifyObserver(this, sc.COMBAT_PARAM_MSG.HP_CHANGED)
        },
        isDefeated: function() {
            return this.defeated && !this.isLocked()
        },
        addItemBuff: function(a, b, c) {
            b = b * (1 + this.getModifier("ITEM_BOOST"));
            a = new sc.ItemBuff(a, b, c);
            this.removeIntersectingItemBuff(a);
            for (b = this.getMaxBuffs(); this.currentItemBuffs >= b;) {
                for (b = 0; !this.buffs[b].itemID;) b++;
                this.removeBuff(this.buffs[b]);
                b = this.getMaxBuffs()
            }
            this.currentItemBuffs++;
            return this.addBuff(a)
        },
        removeIntersectingItemBuff: function(a) {
            for (var b = this.buffs.length; b--;) {
                var c = this.buffs[b];
                c.itemID && c.intersectsWith(a) && this.removeBuff(c)
            }
        },
        addBuff: function(a) {
            var b = this.getStat("hp") - this.currentHp;
            this.buffs.push(a);
            this.currentHp = this.getStat("hp") - b;
            sc.Model.notifyObserver(this, sc.COMBAT_PARAM_MSG.BUFF_ADDED, a);
            sc.Model.notifyObserver(this, sc.COMBAT_PARAM_MSG.STATS_CHANGED);
            return true
        },
        modifyBuff: function(a, b, c) {
            var d = this.currentHp / this.getStat("hp");
            a.params[b] =
                c;
            this.currentHp = Math.round(this.getStat("hp") * d);
            sc.Model.notifyObserver(this, sc.COMBAT_PARAM_MSG.STATS_CHANGED);
            return true
        },
        removeBuff: function(a) {
            var b = this.getStat("hp") - this.currentHp;
            this.buffs.erase(a);
            a.itemID && this.currentItemBuffs--;
            this.currentHp = this.getStat("hp") - b;
            a.clear();
            sc.Model.notifyObserver(this, sc.COMBAT_PARAM_MSG.BUFF_REMOVED, a);
            sc.Model.notifyObserver(this, sc.COMBAT_PARAM_MSG.STATS_CHANGED)
        },
        removeAllBuffs: function() {
            for (var a = this.buffs.length; a--;) {
                this.buffs[a].clear();
                this.buffs[a].itemID && this.currentItemBuffs--
            }
            this.buffs.length = 0;
            this.currentHp = this.getStat("hp");
            sc.Model.notifyObserver(this, sc.COMBAT_PARAM_MSG.BUFFS_CLEARED);
            sc.Model.notifyObserver(this, sc.COMBAT_PARAM_MSG.STATS_CHANGED)
        },
        getMaxBuffs: function() {
            return 2 + this.getModifier("APPETITE")
        },
        hasMaxBuffs: function() {
            return false
        },
        update: function(a) {
            if (!this.defeated) {
                var b = ig.system.ingameTick;
                if (this.combatant.isPlayer && sc.newgame.get("infinite-sp")) this.currentSp != this.maxSp && this.setRelativeSp(1);
                else {
                    var c = this.maxSp * sc.SP_REGEN_FACTOR,
                        d = a ? 0.05 : 0.25;
                    if (sc.pvp.isActive()) {
                        d = d * 3;
                        c = this.maxSp
                    }
                    if (this.currentSp < c) this.addSp(b * d, c);
                    else if (this.currentSp > c && !a) this.spHoldTimer > 0 ? this.spHoldTimer = this.spHoldTimer - b : this.addSp(b * -0.05, c)
                }
                if (!a && this.getHpFactor() < 1 && !sc.arena.active) {
                    if (!sc.newgame.get("waypoints-heals") || ig.game.playerEntity.atLandmarkHeal) {
                        if (this.hpHealTimer <= 0) {
                            this.hpHealTimer = 1;
                            c = Math.round(this.getStat("hp") * 1 / this.hpRegTime);
                            this.increaseHp(c)
                        }
                        this.hpHealTimer = this.hpHealTimer -
                            b
                    }
                } else this.hpHealTimer = 1;
                if (sc.model.isRunning()) {
                    for (b = this.statusStates.length; b--;) this.statusStates[b].update(this.combatant, this, a);
                    if (!sc.model.isCutscene())
                        for (b = this.buffs.length; b--;) this.buffs[b].update() && this.removeBuff(this.buffs[b])
                }
            }
        }
    });
    var a = 0.25,
        d = 1.5,
        c = 3;
    sc.COMBAT_PARAM_MSG = {
        HP_CHANGED: 1,
        SP_CHANGED: 2,
        STATS_CHANGED: 3,
        BUFF_ADDED: 4,
        BUFF_REMOVED: 5,
        RESET_STATS: 6,
        MAX_SP_CHANGED: 7,
        SP_CONSUME: 8,
        BUFFS_CLEARED: 9
    };
    sc.ATTACK_TYPE = {
        NONE: 0,
        LIGHT: 1,
        MEDIUM: 2,
        HEAVY: 3,
        MASSIVE: 4,
        BREAK: 5
    };
    sc.ATTACK_SOUND_TYPE = {
        BLUNT: 0,
        SLASH: 1
    };
    sc.GUARDABLE = {
        AUTO: 0,
        NEVER: 1,
        FROM_ABOVE: 2,
        ALWAYS: 3
    };
    var e = {};
    sc.ATTACK_LIMITER = {
        NO_DAMAGE: {
            noDmg: true
        },
        ONLY_HIT_PROXY: {
            onlyHitProxy: true
        },
        SIGNAL: {
            noDmg: true,
            noAggro: true
        },
        NO_EFFECT: {
            noDmg: true,
            noAggro: true,
            noEffect: true
        },
        NO_HIT_PROXY: {
            noHitProxy: true
        }
    };
    sc.ATTACK_SKILL_BONUS = {
        MELEE_DMG: 1,
        RANGED_DMG: 2
    };
    sc.AttackInfo = ig.Class.extend({
        type: sc.ATTACK_TYPE.LIGHT,
        visualType: null,
        soundType: sc.ATTACK_SOUND_TYPE.SLASH,
        attackerParams: null,
        reverse: true,
        ballDamage: false,
        hints: null,
        damageFactor: 1,
        defenseFactor: 1,
        statusInflict: 0,
        element: sc.ELEMENT.NEUTRAL,
        critFactor: 1,
        spFactor: 0,
        spRepeatFactor: 1,
        fly: null,
        stunSteps: [],
        skillBonus: null,
        guardable: null,
        limiter: null,
        hitInvincible: false,
        noIronStance: false,
        noHack: false,
        init: function(a, b, c) {
            this.attackerParams = a;
            if (b.type != void 0) this.type = typeof b.type == "string" ? sc.ATTACK_TYPE[b.type] : b.type;
            this.visualType = b.visualType ? typeof b.visualType == "string" ? sc.ATTACK_TYPE[b.visualType] : b.visualType : this.type;
            if (b.damageFactor != void 0) this.damageFactor = b.damageFactor *
                1;
            if (b.defenseFactor != void 0) this.defenseFactor = b.defenseFactor * 1;
            if (b.element) this.element = typeof b.element == "string" ? sc.ELEMENT[b.element] : b.element;
            this.spFactor = b.spFactor || 0;
            this.fly = b.fly || null;
            this.reverse = b.reverse || false;
            if (b.critFactor != void 0) this.critFactor = b.critFactor;
            if (b.stunSteps)
                for (var a = b.stunSteps, d = a.length; d--;) this.stunSteps.push(new sc.COMBAT_STUN[a[d].type](a[d]));
            this.guardable = sc.GUARDABLE[b.guardable] || sc.GUARDABLE.AUTO;
            this.statusInflict = b.status || 0;
            this.hints = b.hints ||
                null;
            this.skillBonus = b.skillBonus || null;
            this.limiter = sc.ATTACK_LIMITER[b.limiter] || e;
            this.hitInvincible = b.hitInvincible || false;
            this.noIronStance = b.noIronStance || false;
            this.noHack = b.noHack || false;
            if (this.skillBonus == "MELEE_DMG") this.ballDamage = false;
            else if (this.skillBonus == "RANGED_DMG" || c) this.ballDamage = true
        },
        hasHint: function(a) {
            return this.hints && this.hints.indexOf(a) != -1
        },
        hasNoEffect: function() {
            return this.limiter.noEffect
        }
    });
    sc.HealInfo = ig.Class.extend({
        healerParams: null,
        value: 0,
        absolute: false,
        init: function(a, b) {
            this.healerParams = a;
            this.value = b.value || 0;
            this.absolute = b.absolute || false
        },
        clone: function() {
            return new sc.HealInfo(this.healerParams, {
                value: this.value,
                absolute: this.absolute
            })
        }
    })
});
ig.baked = !0;

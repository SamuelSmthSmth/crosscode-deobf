/**
 * game.feature.combat.model.combat-params
 * ========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.combat.model.combat-params")`.
 *
 * The heart of combat math. Defines:
 *   - `sc.ELEMENT` / element counter table (heat↔cold, shock↔wave)
 *   - `sc.CombatParams` — a combatant's HP/SP/attack/defense/focus, buffs,
 *     status states, and the central `getDamage()` formula
 *   - `sc.AttackInfo` / `sc.HealInfo` — the data a combat art passes into that
 *     formula
 *   - enums: `sc.COMBAT_PARAM_MSG`, `sc.ATTACK_TYPE`, `sc.ATTACK_SOUND_TYPE`,
 *     `sc.GUARDABLE`, `sc.ATTACK_LIMITER`, `sc.ATTACK_SKILL_BONUS`
 */
ig.module("game.feature.combat.model.combat-params")
    .requires("game.feature.model.base-model")
    .defines(function () {

    // ---------------------------------------------------------------------
    // Elements and their counters. Neutral has no counter; HEAT↔COLD and
    // SHOCK↔WAVE defeat each other.
    // ---------------------------------------------------------------------
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

    // SP regen multiplier keyed by max SP; higher pools regen faster.
    sc.SP_REGEN_SPEED = {
        4: 1,
        8: 1.2,
        12: 1.4,
        16: 1.6
    };
    // Combatants enter battle with this fraction of their max SP.
    sc.SP_REGEN_FACTOR = 0.25;
    // HP fraction below which "berserk"-type modifiers activate.
    sc.HP_LOW_WARNING = 0.33;

    // The two damage curves. LINEAR is used for defense (flat doubling),
    // PERCENTAGE for the attack-vs-defense ratio.
    var DAMAGE_FORMULA = {
        LINEAR: function (attack, defense) {
            return attack * 2 - defense
        },
        PERCENTAGE: function (attack, defense) {
            return attack > defense
                ? attack * (1 + Math.pow(1 - defense / attack, 0.5) * 0.2)
                : attack * Math.pow(attack / defense, 1.5)
        }
    };

    // Perf flag: skip the (expensive) damage-modifier pass for e.g. sandbox dummies.
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

        init: function (overrides) {
            if (overrides)
                for (var key in this.baseParams) this.baseParams[key] = overrides[key] || this.baseParams[key];
            this.currentHp = this.getStat("hp");
            for (var i = 0; i < 4; ++i) this.statusStates[i] = new sc.COMBAT_STATUS[i]
        },

        setCombatStat: function (name, value) {
            this.stats[name] = value || null
        },
        getCombatStat: function (name, fallback) {
            return this.stats[name] || fallback
        },
        addCombatStat: function (name, value) {
            this.stats[name] = this.stats[name] ? this.stats[name] + value : value
        },

        healStatus: function () {
            for (var i = 0; i < 4; ++i) this.statusStates[i].clear(this.combatant)
        },

        revive: function (hpFactor) {
            this.defeated = false;
            if (this.currentHp < 0) this.currentHp = 0;
            this.increaseHp(Math.round(this.getStat("hp") * (hpFactor || 1)));
            this.healStatus()
        },

        setCombatant: function (combatant) {
            this.combatant = combatant
        },

        initStatusFx: function () {
            if (this.combatant)
                for (var i = 0; i < 4; ++i) this.statusStates[i].initEntity(this.combatant)
        },

        setModifiers: function (modifiers) {
            this.modifiers = modifiers
        },

        // --- Action locking (prevents defeat while a finisher is attached) ---
        startLock: function (action) {
            if (action.currentAction && action.actionAttached.indexOf(this) == -1) {
                action.addActionAttached(this);
                this.lockedBy.push(action)
            }
        },
        endLock: function (action) {
            action.removeActionAttached(this) && this._decreaseLock(action)
        },
        clearLock: function () {
            for (var i = this.lockedBy.length; i--;) this.lockedBy[i].actionAttached.erase(this);
            this.lockedBy.length = 0
        },
        isLocked: function () {
            return this.lockedBy.length > 0
        },
        isLockedBy: function (action) {
            return this.lockedBy.indexOf(action) != -1
        },
        onActionEndDetach: function (action) {
            this._decreaseLock(action)
        },
        _decreaseLock: function (action) {
            this.lockedBy.erase(action);
            if (this.lockedBy.length == 0) this.combatant.onStunLockClear()
        },

        reset: function (maxSp) {
            this.currentItemBuffs = this.buffs.length = 0;
            this.currentHp = this.getStat("hp");
            this.spHoldTimer = 0;
            this.defeated = false;
            this.damageFactor = 1;
            this.maxSp = maxSp || 16;
            this.currentSp = this.maxSp * sc.SP_REGEN_FACTOR;
            this.resetStatusConditions();
            sc.Model.notifyObserver(this, sc.COMBAT_PARAM_MSG.RESET_STATS)
        },

        resetStatusConditions: function () {
            for (var i = this.statusStates.length; i--;) this.statusStates[i].clear()
        },

        resetSp: function () {
            this.currentSp = this.maxSp * sc.SP_REGEN_FACTOR;
            sc.Model.notifyObserver(this, sc.COMBAT_PARAM_MSG.SP_CHANGED)
        },

        setMaxSp: function (maxSp) {
            this.maxSp = maxSp || 0;
            this.currentSp = this.maxSp * sc.SP_REGEN_FACTOR;
            sc.Model.notifyObserver(this, sc.COMBAT_PARAM_MSG.MAX_SP_CHANGED)
        },

        setBaseParams: function (params, source) {
            var hpLost = this.getStat("hp") - this.currentHp;
            for (var key in this.baseParams) this.baseParams[key] = params[key] || this.baseParams[key];
            this.currentHp = this.getStat("hp") - hpLost;
            sc.Model.notifyObserver(this, sc.COMBAT_PARAM_MSG.STATS_CHANGED, source)
        },

        // --- Stat reading. Buffs each apply a multiply() pass. ---
        getStat: function (name, noHack) {
            var value = this.baseParams[name];
            for (var i = this.buffs.length; i--;)
                if (!noHack || !this.buffs[i].hacked) value = this.buffs[i].multiply(value, name);
            typeof value == "number" && (value = Math.round(value));
            return value
        },

        getStatBuffFactor: function (name) {
            var factor = 1;
            for (var i = this.buffs.length; i--;) factor = this.buffs[i].multiply(factor, name);
            return factor
        },

        // A modifier is additive (unlike buffs, which multiply). Blocked for the
        // player if the MODIFIER player-core is off, or in arenas that forbid it.
        getModifier: function (name) {
            if (this.combatant && this.combatant.isPlayer && !sc.model.player.getCore(sc.PLAYER_CORE.MODIFIER) || sc.arena.isStatusModifierBlocked(name)) return 0;
            var value = this.modifiers && this.modifiers[name] || 0;
            for (var i = this.buffs.length; i--;) value = this.buffs[i].add(value, name);
            return value
        },

        /**
         * The core damage computation.
         *
         * @param {sc.AttackInfo} attackInfo   the attack being resolved
         * @param {number} [damageFactorIn]    extra defensive multiplier from the victim's shield/guard (default 1)
         * @param {ig.ENTITY.Combatant} attacker  the attacking combatant (not its root)
         * @param {number} [shieldResult]      sc.SHIELD_RESULT, affects status inflict
         * @param {boolean} [hitIgnore]        true if the hit bypasses status inflict
         *
         * Returns { damage, defReduced, offensiveFactor, baseOffensiveFactor,
         *           elementalDef, defensiveFactor, critical, status }.
         *
         * Pipeline: (1) damage ceiling from combo, (2) attacker modifiers
         * (skill bonus / berserk / momentum / sergey-hax), (3) element + crit,
         * (4) PERCENTAGE(attack, defense) curve, (5) randomization, (6) round.
         */
        getDamage: function (attackInfo, damageFactorIn, attacker, shieldResult, hitIgnore) {
            // --- 1. base offensive factor, capped by the attacker's combo damage ceiling ---
            var offensiveFactor = attackInfo.damageFactor;
            var noHack = attackInfo.noHack || false;
            var attackerRoot = attacker.getCombatantRoot();
            var combo = attacker.combo || attackerRoot.combo;

            if (combo.damageCeiling) {
                var ceilingFactor = Math.max(1 - (combo.damageCeiling.sum[this.combatant.id] || 0) / combo.damageCeiling.max, 0);
                ceilingFactor < 0.5 && (offensiveFactor = Math.max(offensiveFactor * 2 * ceilingFactor, 0.01))
            }
            var baseOffensiveFactor = offensiveFactor;

            // --- 2. attacker-side modifiers ---
            if (!ig.perf.skipDmgModifiers) {
                attackInfo.skillBonus && (offensiveFactor = offensiveFactor * (1 + attackInfo.attackerParams.getModifier(attackInfo.skillBonus)));
                var modifier = attackInfo.attackerParams.getModifier("BERSERK");
                modifier && attackInfo.attackerParams.getHpFactor() <= sc.HP_LOW_WARNING && (offensiveFactor = offensiveFactor * (1 + modifier));
                (modifier = attackInfo.attackerParams.getModifier("MOMENTUM")) && (attackerRoot.isPlayer && attackerRoot.dashAttackCount) && (offensiveFactor = offensiveFactor * (1 + attackerRoot.dashAttackCount * modifier));
                !ig.vars.get("g.newgame.ignoreSergeyHax") && (attackerRoot.isPlayer && !this.combatant.isPlayer && sc.newgame.get("sergey-hax")) && (offensiveFactor = offensiveFactor * 4096)
            }

            // --- 3. defensive factor: victim damageFactor × elemental defense ---
            var defensiveFactor = this.damageFactor * (damageFactorIn === void 0 ? 1 : damageFactorIn);
            var elementalDef = 1;
            var focusRatio = attackInfo.attackerParams.getStat("focus", noHack) / this.getStat("focus", noHack);
            var criticalChance = (Math.pow(focusRatio, 0.35) - 0.9) * attackInfo.critFactor;
            var critical = Math.random() <= criticalChance;

            if (!ig.perf.skipDmgModifiers) {
                attackInfo.element && (elementalDef = this.getStat("elemFactor")[attackInfo.element - 1] * this.tmpElemFactor[attackInfo.element - 1]);
                defensiveFactor = defensiveFactor * elementalDef;
                attackInfo.ballDamage && (defensiveFactor = defensiveFactor * (this.ballFactor + this.statusStates[3].getValue(this)));
                (modifier = attackInfo.attackerParams.getModifier("CROSS_COUNTER")) && sc.EnemyAnno.isCrossCounterEffective(this.combatant) && (defensiveFactor = defensiveFactor * (1 + modifier));
                (modifier = attackInfo.attackerParams.getModifier("BREAK_DMG")) && sc.EnemyAnno.isWeak(this.combatant) && (defensiveFactor = defensiveFactor * (1 + modifier));
                critical && (offensiveFactor = offensiveFactor * attackInfo.attackerParams.criticalDmgFactor)
            }

            // --- 4. status inflict value (burn/chill/jolt/mark charge) ---
            var globalDmgFactor = sc.combat.getGlobalDmgFactor(attackerRoot.party);
            var statusValue = 0;
            if (attackInfo.element && attackInfo.statusInflict && defensiveFactor > 0 && !hitIgnore) {
                var elementIndex = attackInfo.element - 1;
                statusValue = baseOffensiveFactor * attackInfo.statusInflict;
                // Focus advantage skews the inflict chance away from 50/50.
                var focusMod = (Math.pow(1 + (focusRatio >= 1 ? focusRatio - 1 : 1 - focusRatio) * FOCUS_BASE, FOCUS_EXP) - 1) * FOCUS_SCALE;
                focusRatio = focusRatio >= 1 ? 1 + focusMod : Math.max(0, 1 - focusMod);
                statusValue = statusValue * focusRatio * this.getStat("statusInflict")[elementIndex] * this.tmpStatusInflict[elementIndex] * elementalDef;
                statusValue = this.statusStates[elementIndex].getInflictValue(statusValue, this, attackInfo, shieldResult)
            }

            // --- 5. attack-vs-defense curve, randomized, then rounded ---
            var attackStat = attackInfo.attackerParams.getStat("attack", noHack);
            var defenseStat = attackInfo.defenseFactor * this.getStat("defense", noHack);
            var damage = Math.max(1, DAMAGE_FORMULA.PERCENTAGE(attackStat, defenseStat));
            damage = damage * defensiveFactor;
            var defReduced = DAMAGE_FORMULA.PERCENTAGE(attackStat, 0) - damage;
            damage = damage * offensiveFactor * globalDmgFactor;
            defReduced = defReduced * offensiveFactor * globalDmgFactor;

            if (!ig.perf.skipDmgModifiers) {
                damage = damage * (0.95 + Math.random() * 0.1);
                defReduced = defReduced * (0.95 + Math.random() * 0.1)
            }
            if (attackInfo.limiter.noDmg) defReduced = damage = 0;
            damage = Math.round(damage);

            return {
                damage: damage,
                defReduced: defReduced,
                offensiveFactor: offensiveFactor,
                baseOffensiveFactor: baseOffensiveFactor,
                elementalDef: elementalDef,
                defensiveFactor: defensiveFactor,
                critical: critical,
                status: statusValue
            }
        },

        // --- applying the result ---
        applyDamage: function (result, attackInfo, attacker) {
            var root = attacker.getCombatantRoot();
            var combo = attacker.combo || root.combo;
            if (combo.damageCeiling) {
                var victimId = this.combatant.id;
                combo.damageCeiling.sum[victimId] || (combo.damageCeiling.sum[victimId] = 0);
                combo.damageCeiling.sum[victimId] = combo.damageCeiling.sum[victimId] + result.baseOffensiveFactor
            }
            result.status && this.statusStates[attackInfo.element - 1].inflict(result.status, this, attackInfo);
            this.reduceHp(result.damage)
        },

        getHealAmount: function (healInfo) {
            var amount = !healInfo.absolute ? this.getStat("hp") * healInfo.value : healInfo.value;
            amount = amount * (0.95 + Math.random() * 0.1);
            return amount = Math.round(amount)
        },

        reduceHp: function (amount) {
            if (amount < 0) return this.increaseHp(-amount);
            if (amount > 0) {
                if (!this.defeated && this.currentHp <= amount) {
                    var onceMore = this.getModifier("ONCE_MORE");
                    this.currentHp > 0 && onceMore
                        ? sc.combat.doDramaticEffect(this.combatant, this.combatant, sc.DRAMATIC_EFFECT.ONCE_MORE)
                        : this.defeated = true
                }
                this.currentHp = Math.max(-this.getStat("hp"), this.currentHp - amount)
            }
            if (this.combatant.party == sc.COMBATANT_PARTY.PLAYER) this.hpHealTimer = 2;
            sc.Model.notifyObserver(this, sc.COMBAT_PARAM_MSG.HP_CHANGED)
        },

        setRelativeHp: function (fraction) {
            this.currentHp = Math.round(this.getStat("hp") * fraction);
            sc.Model.notifyObserver(this, sc.COMBAT_PARAM_MSG.HP_CHANGED)
        },

        setCritical: function () {
            this.currentHp = 0;
            sc.Model.notifyObserver(this, sc.COMBAT_PARAM_MSG.HP_CHANGED)
        },

        increaseHp: function (amount) {
            this.currentHp = Math.min(this.getStat("hp"), this.currentHp + amount);
            if (this.currentHp > 0) this.defeated = false;
            sc.Model.notifyObserver(this, sc.COMBAT_PARAM_MSG.HP_CHANGED)
        },

        getHpFactor: function () {
            return this.currentHp / this.getStat("hp")
        },

        // --- SP ---
        addSp: function (amount, limit) {
            if (amount > 0) this.spHoldTimer = 5;
            limit = limit || (amount > 0 ? this.maxSp : 0);
            var regen = (sc.SP_REGEN_SPEED[this.maxSp] || 1) * (1 + this.getModifier("SP_REGEN"));
            this.currentSp = this.currentSp + amount * regen;
            if (amount > 0 && this.currentSp > limit) this.currentSp = limit;
            if (amount < 0 && this.currentSp < limit) this.currentSp = limit;
            sc.Model.notifyObserver(this, sc.COMBAT_PARAM_MSG.SP_CHANGED, true)
        },

        consumeSp: function (amount) {
            this.currentSp = this.currentSp - amount;
            if (this.currentSp < 0) this.currentSp = 0;
            sc.Model.notifyObserver(this, sc.COMBAT_PARAM_MSG.SP_CHANGED)
        },

        setRelativeSp: function (fraction) {
            this.spHoldTimer = 5;
            this.currentSp = Math.round(this.maxSp * fraction);
            sc.Model.notifyObserver(this, sc.COMBAT_PARAM_MSG.SP_CHANGED)
        },

        getSp: function () {
            return Math.floor(this.currentSp)
        },
        getRelativeSp: function () {
            return Math.floor(this.currentSp) / this.maxSp
        },
        notifySpConsume: function (attackInfo) {
            sc.Model.notifyObserver(this, sc.COMBAT_PARAM_MSG.SP_CONSUME, attackInfo)
        },

        setDefeated: function () {
            this.currentHp = 0;
            this.defeated = true;
            sc.Model.notifyObserver(this, sc.COMBAT_PARAM_MSG.HP_CHANGED)
        },
        isDefeated: function () {
            return this.defeated && !this.isLocked()
        },

        // --- buffs ---
        addItemBuff: function (itemId, value, duration) {
            value = value * (1 + this.getModifier("ITEM_BOOST"));
            var buff = new sc.ItemBuff(itemId, value, duration);
            this.removeIntersectingItemBuff(buff);
            for (var max = this.getMaxBuffs(); this.currentItemBuffs >= max;) {
                for (var i = 0; !this.buffs[i].itemID;) i++;
                this.removeBuff(this.buffs[i]);
                max = this.getMaxBuffs()
            }
            this.currentItemBuffs++;
            return this.addBuff(buff)
        },

        removeIntersectingItemBuff: function (buff) {
            for (var i = this.buffs.length; i--;) {
                var existing = this.buffs[i];
                existing.itemID && existing.intersectsWith(buff) && this.removeBuff(existing)
            }
        },

        addBuff: function (buff) {
            var hpLost = this.getStat("hp") - this.currentHp;
            this.buffs.push(buff);
            this.currentHp = this.getStat("hp") - hpLost;
            sc.Model.notifyObserver(this, sc.COMBAT_PARAM_MSG.BUFF_ADDED, buff);
            sc.Model.notifyObserver(this, sc.COMBAT_PARAM_MSG.STATS_CHANGED);
            return true
        },

        modifyBuff: function (buff, key, value) {
            var hpFactor = this.currentHp / this.getStat("hp");
            buff.params[key] = value;
            this.currentHp = Math.round(this.getStat("hp") * hpFactor);
            sc.Model.notifyObserver(this, sc.COMBAT_PARAM_MSG.STATS_CHANGED);
            return true
        },

        removeBuff: function (buff) {
            var hpLost = this.getStat("hp") - this.currentHp;
            this.buffs.erase(buff);
            buff.itemID && this.currentItemBuffs--;
            this.currentHp = this.getStat("hp") - hpLost;
            buff.clear();
            sc.Model.notifyObserver(this, sc.COMBAT_PARAM_MSG.BUFF_REMOVED, buff);
            sc.Model.notifyObserver(this, sc.COMBAT_PARAM_MSG.STATS_CHANGED)
        },

        removeAllBuffs: function () {
            for (var i = this.buffs.length; i--;) {
                this.buffs[i].clear();
                this.buffs[i].itemID && this.currentItemBuffs--
            }
            this.buffs.length = 0;
            this.currentHp = this.getStat("hp");
            sc.Model.notifyObserver(this, sc.COMBAT_PARAM_MSG.BUFFS_CLEARED);
            sc.Model.notifyObserver(this, sc.COMBAT_PARAM_MSG.STATS_CHANGED)
        },

        getMaxBuffs: function () {
            return 2 + this.getModifier("APPETITE")
        },
        hasMaxBuffs: function () {
            return false
        },

        // --- per-tick: SP regen, HP regen, status + buff updates ---
        update: function (inCombat) {
            if (!this.defeated) {
                var tick = ig.system.ingameTick;
                if (this.combatant.isPlayer && sc.newgame.get("infinite-sp")) {
                    this.currentSp != this.maxSp && this.setRelativeSp(1)
                } else {
                    var regenTarget = this.maxSp * sc.SP_REGEN_FACTOR;
                    var regenRate = inCombat ? 0.05 : 0.25;
                    if (sc.pvp.isActive()) {
                        regenRate = regenRate * 3;
                        regenTarget = this.maxSp
                    }
                    if (this.currentSp < regenTarget) this.addSp(tick * regenRate, regenTarget);
                    else if (this.currentSp > regenTarget && !inCombat)
                        this.spHoldTimer > 0
                            ? this.spHoldTimer = this.spHoldTimer - tick
                            : this.addSp(tick * -0.05, regenTarget)
                }
                if (!inCombat && this.getHpFactor() < 1 && !sc.arena.active) {
                    if (!sc.newgame.get("waypoints-heals") || ig.game.playerEntity.atLandmarkHeal) {
                        if (this.hpHealTimer <= 0) {
                            this.hpHealTimer = 1;
                            var heal = Math.round(this.getStat("hp") * 1 / this.hpRegTime);
                            this.increaseHp(heal)
                        }
                        this.hpHealTimer = this.hpHealTimer - tick
                    }
                } else this.hpHealTimer = 1;
                if (sc.model.isRunning()) {
                    for (var i = this.statusStates.length; i--;) this.statusStates[i].update(this.combatant, this, inCombat);
                    if (!sc.model.isCutscene())
                        for (i = this.buffs.length; i--;) this.buffs[i].update() && this.removeBuff(this.buffs[i])
                }
            }
        }
    });

    // Focus-advantage formula constants for status inflict:
    //   inflictChance = 1 ± ((1 + |focusRatio-1| * FOCUS_BASE) ^ FOCUS_EXP - 1) * FOCUS_SCALE
    var FOCUS_EXP = 0.25,
        FOCUS_SCALE = 1.5,
        FOCUS_BASE = 3;

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

    // `{}` is the "no limiter" default; named limiters each add flags.
    var DEFAULT_LIMITER = {};
    sc.ATTACK_LIMITER = {
        NO_DAMAGE: { noDmg: true },
        ONLY_HIT_PROXY: { onlyHitProxy: true },
        SIGNAL: { noDmg: true, noAggro: true },
        NO_EFFECT: { noDmg: true, noAggro: true, noEffect: true },
        NO_HIT_PROXY: { noHitProxy: true }
    };
    sc.ATTACK_SKILL_BONUS = {
        MELEE_DMG: 1,
        RANGED_DMG: 2
    };

    /**
     * Fully-resolved attack descriptor. Combat arts build these from JSON config;
     * `sc.CombatParams.getDamage()` reads them.
     */
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

        init: function (attackerParams, attack, ranged) {
            this.attackerParams = attackerParams;
            if (attack.type != void 0) this.type = typeof attack.type == "string" ? sc.ATTACK_TYPE[attack.type] : attack.type;
            this.visualType = attack.visualType ? typeof attack.visualType == "string" ? sc.ATTACK_TYPE[attack.visualType] : attack.visualType : this.type;
            if (attack.damageFactor != void 0) this.damageFactor = attack.damageFactor * 1;
            if (attack.defenseFactor != void 0) this.defenseFactor = attack.defenseFactor * 1;
            if (attack.element) this.element = typeof attack.element == "string" ? sc.ELEMENT[attack.element] : attack.element;
            this.spFactor = attack.spFactor || 0;
            this.fly = attack.fly || null;
            this.reverse = attack.reverse || false;
            if (attack.critFactor != void 0) this.critFactor = attack.critFactor;
            if (attack.stunSteps)
                for (var i = attack.stunSteps.length; i--;) this.stunSteps.push(new sc.COMBAT_STUN[attack.stunSteps[i].type](attack.stunSteps[i]));
            this.guardable = sc.GUARDABLE[attack.guardable] || sc.GUARDABLE.AUTO;
            this.statusInflict = attack.status || 0;
            this.hints = attack.hints || null;
            this.skillBonus = attack.skillBonus || null;
            this.limiter = sc.ATTACK_LIMITER[attack.limiter] || DEFAULT_LIMITER;
            this.hitInvincible = attack.hitInvincible || false;
            this.noIronStance = attack.noIronStance || false;
            this.noHack = attack.noHack || false;
            if (this.skillBonus == "MELEE_DMG") this.ballDamage = false;
            else if (this.skillBonus == "RANGED_DMG" || ranged) this.ballDamage = true
        },

        hasHint: function (hint) {
            return this.hints && this.hints.indexOf(hint) != -1
        },
        hasNoEffect: function () {
            return this.limiter.noEffect
        }
    });

    sc.HealInfo = ig.Class.extend({
        healerParams: null,
        value: 0,
        absolute: false,
        init: function (healerParams, heal) {
            this.healerParams = healerParams;
            this.value = heal.value || 0;
            this.absolute = heal.absolute || false
        },
        clone: function () {
            return new sc.HealInfo(this.healerParams, {
                value: this.value,
                absolute: this.absolute
            })
        }
    })
});
ig.baked = !0;

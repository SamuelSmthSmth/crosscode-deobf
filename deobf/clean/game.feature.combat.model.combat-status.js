/**
 * game.feature.combat.model.combat-status
 * =======================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.combat.model.combat-status")`.
 *
 * Status effects (burn / chill / jolt / mark): `sc.CombatStatusBase` handles
 * the shared inflict → charge → activate → decay lifecycle, and each subclass
 * (`sc.COMBAT_STATUS[0..3]`) adds its per-status behavior.
 */
ig.module("game.feature.combat.model.combat-status")
    .requires("game.feature.combat.model.combat-params", "impact.feature.effect.effect-sheet")
    .defines(function () {

    sc.CombatStatusBase = ig.Class.extend({
        id: 0,
        statusBarEntry: null,
        offenseModifier: null,
        defenseModifier: null,
        effects: new ig.EffectSheet("combatant"),
        duration: 5,
        charge: 0,
        active: false,
        effectiveness: 0,
        fxHandle: null,

        init: function () {},

        getInflictValue: function (value, targetParams, attackInfo, shieldResult) {
            if (this.active || shieldResult == sc.SHIELD_RESULT.PERFECT) return 0;
            var defenseFactor = Math.max(0, 1 - targetParams.getModifier(this.defenseModifier));
            var offensiveFactor = this._getOffensiveFactor(attackInfo);
            return value * defenseFactor * offensiveFactor / 12
        },

        inflict: function (value, targetParams, attackInfo) {
            var combatant = targetParams.combatant;
            this.charge = this.charge + value;
            this.charge >= 1 ? this.activate(combatant, targetParams, attackInfo) : this.statusBarEntry && combatant.statusGui && combatant.statusGui.setStatusEntry(this.statusBarEntry, this.charge)
        },

        _getOffensiveFactor: function (attackInfo) {
            return 1 + attackInfo.attackerParams.getModifier(this.offenseModifier) + attackInfo.attackerParams.getModifier("COND_EFFECT_ALL")
        },

        activate: function (combatant, targetParams, attackInfo) {
            this.charge = 1;
            this.active = true;
            this.effectiveness = targetParams.getStat("statusEffect")[this.id] * this._getOffensiveFactor(attackInfo);
            sc.combat.showCombatantLabel(combatant, this.getLabel(), 1.5);
            if (this.onActivate) this.onActivate(combatant);
            this.initEntity(combatant)
        },

        initEntity: function (combatant) {
            if (this.active) {
                this.fxHandle && this.fxHandle.stop();
                combatant.statusGui && combatant.statusGui.setStatusEntryStick(this.statusBarEntry, true);
                this.fxHandle = this.effects.spawnOnTarget(this.label, combatant, {
                    duration: -1
                });
                if (this.onInitEntity) this.onInitEntity(combatant)
            }
        },

        getEffectiveness: function (targetParams) {
            var defenseFactor = Math.max(0, 1 - targetParams.getModifier(this.defenseModifier));
            return this.effectiveness * defenseFactor
        },

        clear: function (combatant) {
            this.charge = 0;
            this.active = false;
            this.fxHandle && this.fxHandle.stop();
            if (combatant) {
                if (this.onClear) this.onClear(combatant);
                combatant.statusGui && combatant.statusGui.clearStatusEntry(this.statusBarEntry)
            }
        },

        update: function (combatant, targetParams, inCombat) {
            var decay = Math.max(0, 1 - targetParams.getModifier("COND_HEALING"));
            inCombat || (decay = decay / 5);
            if (this.active) {
                this.charge = this.charge - ig.system.ingameTick / (decay * this.duration);
                if (this.charge <= 0) this.clear(combatant);
                else if (this.onUpdate) this.onUpdate(combatant, targetParams)
            } else if (this.charge > 0) {
                this.charge = this.charge - ig.system.ingameTick / (50 * decay);
                if (this.charge < 0) this.charge = 0;
                combatant.statusGui && combatant.statusGui.updateStatusEntry(this.statusBarEntry, this.charge)
            }
        },

        getLabel: function () {
            var labelText = ig.lang.get("sc.gui.combat." + this.label);
            return "\\i[" + this.label + "]" + labelText
        },

        onActivate: null,
        onInitEntity: null,
        onUpdate: null,
        onClear: null
    });

    sc.COMBAT_STATUS = [];

    sc.BurnStatus = sc.COMBAT_STATUS[0] = sc.CombatStatusBase.extend({
        id: 0,
        label: "burn",
        statusBarEntry: "BURN",
        offenseModifier: "COND_EFFECT_HEAT",
        defenseModifier: "COND_GUARD_HEAT",
        duration: 20,
        burnTimer: 0,

        onUpdate: function (combatant, targetParams) {
            this.burnTimer = this.burnTimer + ig.system.ingameTick;
            if (!(combatant.getCombatantRoot().isPlayer && sc.model.isCutscene() || !combatant.damageFactor && combatant.hitIgnore && combatant.invincibleTimer) && this.burnTimer > 0.5) {
                var damage = Math.floor(targetParams.getStat("hp") * (0.3 / (this.duration / 0.5)) * this.getEffectiveness(targetParams));
                combatant.instantDamage(damage, 0.5);
                this.effects.spawnOnTarget("burnDamage", combatant);
                this.burnTimer = 0
            }
        }
    });

    sc.ChillStatus = sc.COMBAT_STATUS[1] = sc.CombatStatusBase.extend({
        id: 1,
        label: "chill",
        statusBarEntry: "CHILL",
        offenseModifier: "COND_EFFECT_COLD",
        defenseModifier: "COND_GUARD_COLD",
        duration: 20,
        influence: null,

        init: function () {
            this.parent();
            this.influence = new ig.InfluenceEntry
        },

        onInitEntity: function (combatant) {
            combatant.influencer.addInfluence(this.influence)
        },

        onUpdate: function (combatant, targetParams) {
            this.influence.timeScale = (1 - this.getEffectiveness(targetParams) * 0.25).limit(0.25, 1)
        },

        onClear: function (combatant) {
            combatant.influencer.removeInfluence(this.influence)
        }
    });

    sc.JoltStatus = sc.COMBAT_STATUS[2] = sc.CombatStatusBase.extend({
        id: 2,
        label: "jolt",
        statusBarEntry: "WEAK",
        offenseModifier: "COND_EFFECT_SHOCK",
        defenseModifier: "COND_GUARD_SHOCK",
        duration: 20,
        shockTimer: 0,

        onActivate: function (combatant) {
            this.attackInfo = new sc.AttackInfo(combatant.params, {
                damageFactor: 0.33,
                type: "MASSIVE",
                visualType: "LIGHT",
                fly: "HEAVY",
                element: "SHOCK",
                critFactor: 0,
                noHack: true,
                limiter: "NO_HIT_PROXY"
            })
        },

        onUpdate: function (combatant, targetParams) {
            this.shockTimer = this.shockTimer + ig.system.ingameTick;
            if (!(combatant.getCombatantRoot().isPlayer && sc.model.isCutscene() || !combatant.damageFactor && combatant.hitIgnore && combatant.invincibleTimer)) {
                var effectiveness = this.getEffectiveness(targetParams);
                if (effectiveness && this.shockTimer > 3 / effectiveness && !combatant.invincibleTimer) {
                    var damageFactor = 0.33;
                    combatant instanceof ig.ENTITY.Enemy && (damageFactor = damageFactor * (1 + combatant.enemyType.enduranceScale));
                    this.attackInfo.damageFactor = damageFactor;
                    combatant.onDamage(combatant, this.attackInfo);
                    this.shockTimer = 0
                }
            }
        }
    });

    sc.MarkStatus = sc.COMBAT_STATUS[3] = sc.CombatStatusBase.extend({
        id: 3,
        label: "mark",
        statusBarEntry: "BRITTLE",
        offenseModifier: "COND_EFFECT_WAVE",
        defenseModifier: "COND_GUARD_WAVE",
        duration: 20,

        getValue: function (targetParams) {
            return !this.active ? 0 : this.getEffectiveness(targetParams) * 0.5
        }
    })
});
ig.baked = !0;

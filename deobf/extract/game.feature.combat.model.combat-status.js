ig.module("game.feature.combat.model.combat-status").requires("game.feature.combat.model.combat-params", "impact.feature.effect.effect-sheet").defines(function() {
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
        init: function() {},
        getInflictValue: function(b, a, d, c) {
            if (this.active || c == sc.SHIELD_RESULT.PERFECT) return 0;
            a = Math.max(0, 1 - a.getModifier(this.defenseModifier));
            d = this._getOffensiveFactor(d);
            return b * a * d / 12
        },
        inflict: function(b, a, d) {
            var c = a.combatant;
            this.charge = this.charge + b;
            this.charge >= 1 ? this.activate(c, a, d) : this.statusBarEntry && c.statusGui && c.statusGui.setStatusEntry(this.statusBarEntry, this.charge)
        },
        _getOffensiveFactor: function(b) {
            return 1 + b.attackerParams.getModifier(this.offenseModifier) + b.attackerParams.getModifier("COND_EFFECT_ALL")
        },
        activate: function(b, a, d) {
            this.charge = 1;
            this.active = true;
            this.effectiveness = a.getStat("statusEffect")[this.id] * this._getOffensiveFactor(d);
            sc.combat.showCombatantLabel(b, this.getLabel(), 1.5);
            if (this.onActivate) this.onActivate(b);
            this.initEntity(b)
        },
        initEntity: function(b) {
            if (this.active) {
                this.fxHandle && this.fxHandle.stop();
                b.statusGui && b.statusGui.setStatusEntryStick(this.statusBarEntry, true);
                this.fxHandle = this.effects.spawnOnTarget(this.label, b, {
                    duration: -1
                });
                if (this.onInitEntity) this.onInitEntity(b)
            }
        },
        getEffectiveness: function(b) {
            b = Math.max(0, 1 - b.getModifier(this.defenseModifier));
            return this.effectiveness * b
        },
        clear: function(b) {
            this.charge =
                0;
            this.active = false;
            this.fxHandle && this.fxHandle.stop();
            if (b) {
                if (this.onClear) this.onClear(b);
                b.statusGui && b.statusGui.clearStatusEntry(this.statusBarEntry)
            }
        },
        update: function(b, a, d) {
            var c = Math.max(0, 1 - a.getModifier("COND_HEALING"));
            d || (c = c / 5);
            if (this.active) {
                this.charge = this.charge - ig.system.ingameTick / (c * this.duration);
                if (this.charge <= 0) this.clear(b);
                else if (this.onUpdate) this.onUpdate(b, a)
            } else if (this.charge > 0) {
                this.charge = this.charge - ig.system.ingameTick / (50 * c);
                if (this.charge < 0) this.charge = 0;
                b.statusGui && b.statusGui.updateStatusEntry(this.statusBarEntry, this.charge)
            }
        },
        getLabel: function() {
            var b = ig.lang.get("sc.gui.combat." + this.label);
            return "\\i[" + this.label + "]" + b
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
        onUpdate: function(b, a) {
            this.burnTimer = this.burnTimer +
                ig.system.ingameTick;
            if (!(b.getCombatantRoot().isPlayer && sc.model.isCutscene() || !b.damageFactor && b.hitIgnore && b.invincibleTimer) && this.burnTimer > 0.5) {
                var d = Math.floor(a.getStat("hp") * (0.3 / (this.duration / 0.5)) * this.getEffectiveness(a));
                b.instantDamage(d, 0.5);
                this.effects.spawnOnTarget("burnDamage", b);
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
        init: function() {
            this.parent();
            this.influence = new ig.InfluenceEntry
        },
        onInitEntity: function(b) {
            b.influencer.addInfluence(this.influence)
        },
        onUpdate: function(b, a) {
            this.influence.timeScale = (1 - this.getEffectiveness(a) * 0.25).limit(0.25, 1)
        },
        onClear: function(b) {
            b.influencer.removeInfluence(this.influence)
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
        onActivate: function(b) {
            this.attackInfo = new sc.AttackInfo(b.params, {
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
        onUpdate: function(b, a) {
            this.shockTimer = this.shockTimer + ig.system.ingameTick;
            if (!(b.getCombatantRoot().isPlayer && sc.model.isCutscene() || !b.damageFactor && b.hitIgnore && b.invincibleTimer)) {
                var d = this.getEffectiveness(a);
                if (d && this.shockTimer > 3 / d && !b.invincibleTimer) {
                    d = 0.33;
                    b instanceof ig.ENTITY.Enemy &&
                        (d = d * (1 + b.enemyType.enduranceScale));
                    this.attackInfo.damageFactor = d;
                    b.onDamage(b, this.attackInfo);
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
        getValue: function(b) {
            return !this.active ? 0 : this.getEffectiveness(b) * 0.5
        }
    })
});
ig.baked = !0;

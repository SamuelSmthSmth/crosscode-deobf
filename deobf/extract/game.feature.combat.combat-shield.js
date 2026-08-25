ig.module("game.feature.combat.combat-shield").requires("game.feature.combat.model.combat-params").defines(function() {
    sc.SHIELD_STRENGTH = {
        REGULAR: 1,
        BLOCK_ABOVE: 2,
        BLOCK_ALL: 3
    };
    sc.CombatShield = ig.Class.extend({
        name: null,
        baseFactor: 1,
        elementFactors: [1, 1, 1, 1],
        hitResist: sc.ATTACK_TYPE.MASSIVE,
        stableOverride: sc.ATTACK_TYPE.HEAVY,
        duration: 0,
        effect: void 0,
        neutralize: false,
        init: function(a, b) {
            this.name = b;
            this.baseFactor = a.baseFactor !== void 0 ? a.baseFactor : 0;
            this.elementFactors = a.elementFactors !== void 0 ? a.elementFactors :
                this.elementFactors;
            this.strength = sc.SHIELD_STRENGTH[a.strength] || sc.SHIELD_STRENGTH.BLOCK_ALL;
            this.hitResist = sc.ATTACK_TYPE[a.hitResist] || this.hitResist;
            this.stableOverride = sc.ATTACK_TYPE[a.stableOverride];
            this.neutralize = a.neutralize;
            if (this.stableOverride === void 0) this.stableOverride = sc.ATTACK_TYPE.HEAVY;
            this.duration = a.duration != void 0 ? a.duration : -1;
            if (a.effect) {
                this.effect = new ig.EffectHandle(a.effect);
                this.fxOffset = a.fxOffset
            }
        },
        clearCached: function() {
            this.effect && this.effect.clearCached()
        },
        onActivate: null,
        onDeactivate: null,
        isActive: function() {
            return true
        },
        getDamageFactor: function(a) {
            return this.baseFactor * (a.element ? this.elementFactors[a.element - 1] : 1)
        },
        reduceSpikeDamage: function() {
            return true
        }
    });
    sc.CombatantShieldConnection = ig.Class.extend({
        combatant: null,
        shield: null,
        timer: 0,
        perfectGuardTime: 0,
        perfectTimeReset: 0,
        effectHandle: null,
        init: function(a, b, e) {
            this.combatant = a;
            this.shield = b;
            this.perfectGuardTime = e || 0;
            this.perfectTimeReset = e || 0;
            this.shield.onActivate && this.shield.onActivate(a);
            if (this.shield.effect) this.effectHandle = b.effect.spawnOnTarget(a, {
                duration: -1,
                align: "CENTER",
                offset: this.shield.fxOffset
            })
        },
        update: function() {
            if (this.shield.duration != -1) {
                this.timer = this.timer + ig.system.tick;
                if (this.timer >= this.shield.duration) return true
            }
            if (this.perfectGuardTime > 0) {
                this.perfectGuardTime = this.perfectGuardTime - ig.system.tick;
                if (this.perfectGuardTime < 0) this.perfectGuardTime = 0
            }
            return false
        },
        isPerfect: function() {
            return this.perfectGuardTime > 0
        },
        resetPerfectGuardTime: function() {
            this.perfectGuardTime =
                this.perfectTimeReset
        },
        onDetach: function(a) {
            this.effectHandle && this.effectHandle.stop();
            this.shield.onDeactivate && this.shield.onDeactivate(a)
        },
        onActionEndDetach: function() {
            this.combatant.removeShield(this)
        },
        onEntityKillDetach: function() {
            this.combatant.removeShield(this)
        }
    });
    sc.COMBAT_SHIELDS = {};
    var b = Vec2.create(),
        a = Vec2.create();
    sc.COMBAT_SHIELDS.DIRECTIONAL = sc.CombatShield.extend({
        _wm: new ig.Config({
            attributes: {
                baseFactor: {
                    _type: "Number",
                    _info: "Basic effectiveness of shield. 0.1 = reduces damage to 10%."
                },
                elementFactors: {
                    _type: "ElementDef",
                    _info: "Effectiveness per element",
                    _optional: true
                },
                strength: {
                    _type: "String",
                    _info: "Strength of shield. Determines what is blocked",
                    _select: sc.SHIELD_STRENGTH,
                    optional: true
                },
                hitResist: {
                    _type: "String",
                    _info: "Up to which attackType attacks are resisted by default",
                    _select: sc.ATTACK_TYPE,
                    _optional: true
                },
                stableOverride: {
                    _type: "String",
                    _info: "If shield is effective, what is the new hit stable for the entity?",
                    _select: sc.ATTACK_TYPE,
                    _optional: true
                },
                duration: {
                    _type: "Number",
                    _info: "Duration of shield if -1: will last forever",
                    _optional: true
                },
                range: {
                    _type: "Number",
                    _info: "Range of shield per circularAngle. 0.5 = 50% circular angle protected",
                    _default: 0.5
                },
                back: {
                    _type: "Boolean",
                    _info: "If true: shield is around back of entity, not front"
                },
                effect: {
                    _type: "Effect",
                    _info: "Effect to be shown while shield is active",
                    _optional: true
                },
                fxOffset: {
                    _type: "Offset",
                    _info: "Offset to effects spanning (CENTER) by default",
                    _optional: true
                },
                neutralize: {
                    _type: "Boolean",
                    _info: "If true: entirely neutralize damage effect, even knockback + no damage + special sound",
                    _optional: true
                }
            }
        }),
        range: 0.5,
        back: false,
        init: function(a, b) {
            this.parent(a, b);
            this.strength = sc.SHIELD_STRENGTH[a.strength] || sc.SHIELD_STRENGTH.REGULAR;
            this.range = a.range || 0.5;
            this.back = a.back || false
        },
        isActive: function(d, c) {
            var e = d.getCurrentAnimFaceCount();
            e > 1 ? ig.getRoundedFaceDir(d.face.x, d.face.y, e, a) : Vec2.assign(a, d.face);
            this.back && Vec2.flip(a);
            var f = c.getHitDir(d, b),
                f = Math.PI - Math.abs(Vec2.angle(f, a)),
                e = this.range * Math.PI;
            if (f <= e) return true;
            f = c.getHitVel(d, b);
            f = Math.PI - Math.abs(Vec2.angle(f, a));
            return f <= e / 2 ? true : false
        },
        reduceSpikeDamage: function() {
            return this.range >= 1
        }
    });
    sc.COMBAT_SHIELDS.PARTS = sc.CombatShield.extend({
        _wm: new ig.Config({
            attributes: {
                baseFactor: {
                    _type: "Number",
                    _info: "Basic effectiveness of shield. 0.1 = reduces damage to 10%."
                },
                elementFactors: {
                    _type: "ElementDef",
                    _info: "Effectiveness per element",
                    _optional: true
                },
                strength: {
                    _type: "String",
                    _info: "Strength of shield. Determines what is blocked",
                    _select: sc.SHIELD_STRENGTH,
                    optional: true
                },
                hitResist: {
                    _type: "String",
                    _info: "Up to which attackType attacks are resisted by default",
                    _select: sc.ATTACK_TYPE,
                    _optional: true
                },
                stableOverride: {
                    _type: "String",
                    _info: "If shield is effective, what is the new hit stable for the entity?",
                    _select: sc.ATTACK_TYPE,
                    _optional: true
                },
                duration: {
                    _type: "Number",
                    _info: "Duration of shield if -1: will last forever",
                    _optional: true
                },
                parts: {
                    _type: "Array",
                    _info: "An array of part names that are protected",
                    _sub: {
                        _type: "String"
                    }
                },
                inverse: {
                    _type: "Boolean",
                    _info: "If true: Protect all parts that are NOT in the part list"
                },
                effect: {
                    _type: "Effect",
                    _info: "Effect to be shown while shield is active",
                    _optional: true
                }
            }
        }),
        parts: null,
        inverse: false,
        init: function(a, b) {
            this.parent(a, b);
            this.strength = sc.SHIELD_STRENGTH[a.strength] || sc.SHIELD_STRENGTH.BLOCK_ALL;
            this.parts = a.parts || null;
            this.inverse = a.inverse || false
        },
        isActive: function(a, b, e, f) {
            a = this.parts.indexOf(f) != -1;
            this.inverse && (a = !a);
            return a
        },
        reduceSpikeDamage: function() {
            return true
        }
    });
    sc.COMBAT_SHIELDS.PLAYER = sc.COMBAT_SHIELDS.DIRECTIONAL.extend({
        _wm: new ig.Config({
            attributes: {
                baseFactor: {
                    _type: "Number",
                    _info: "Basic effectiveness of shield. Is MULTIPLIED with calculated def effectiveness. 1.0 = normal shield defense",
                    _default: 1
                },
                elementFactors: {
                    _type: "ElementDef",
                    _info: "Effectiveness per element",
                    _optional: true
                },
                strength: {
                    _type: "String",
                    _info: "Strength of shield. Determines what is blocked",
                    _select: sc.SHIELD_STRENGTH,
                    optional: true
                },
                hitResist: {
                    _type: "String",
                    _info: "Up to which attackType attacks are resisted by default",
                    _select: sc.ATTACK_TYPE,
                    _optional: true
                },
                stableOverride: {
                    _type: "String",
                    _info: "If shield is effective, what is the new hit stable for the entity?",
                    _select: sc.ATTACK_TYPE,
                    _optional: true
                },
                duration: {
                    _type: "Number",
                    _info: "Duration of shield if -1: will last forever",
                    _optional: true
                },
                range: {
                    _type: "Number",
                    _info: "Range of shield per circularAngle. 0.5 = 50% circular angle protected",
                    _default: 0.5
                },
                back: {
                    _type: "Boolean",
                    _info: "If true: shield is around back of entity, not front"
                },
                noShieldDamage: {
                    _type: "Boolean",
                    _info: "If true, don't apply shield damage when effective (no guard break)"
                },
                effect: {
                    _type: "Effect",
                    _info: "Effect to be shown while shield is active. Won't show default effect when active.",
                    _optional: true
                },
                noDefaultFX: {
                    _type: "Boolean",
                    _info: "If true: Hide default shield graphics"
                }
            }
        }),
        init: function(a, b) {
            this.parent(a, b);
            this.noShieldDamage = a.noShieldDamage || false;
            this.noDefaultFX = a.noDefaultFX || false
        },
        isActive: function(a, b, e, f, g) {
            if (!this.parent(a, b, e, f, g)) return false;
            if (a.params.getModifier("GUARD_SP") && !this.noShieldDamage) {
                b = a.params.getModifier("GUARD_SP");
                a.params.addSp(b * e.damageFactor * (g ? 2 : 1))
            }
            if (this.noShieldDamage || g) return true;
            g = this.getDefenseRatio(e, a);
            e = e.damageFactor * Math.pow(g, 1.5);
            return !a.damageShield(e)
        },
        onActivate: function(a) {
            !this.effect && !this.noDefaultFX && a.startGuardEffect()
        },
        onDeactivate: function(a) {
            !this.effect && !this.noDefaultFX && a.endGuardEffect()
        },
        getDamageFactor: function(a, b) {
            var e = this.parent(a, b),
                f = 1,
                f = this.getDefenseRatio(a, b),
                f = f <= 1 ? 0.2 - (1 - Math.pow(f, 0.3)) * 1 : 0.2 + (Math.pow(f, 1.1) - 1) * 0.35,
                f = f - b.params.getModifier("GUARD_STRENGTH"),
                f = f.limit(0, 1);
            return e * f
        },
        getDefenseRatio: function(a, b) {
            var e = b.params.getStat("defense");
            return !a.attackerParams ? 0 : a.attackerParams.getStat("attack") /
                e
        },
        reduceSpikeDamage: function() {
            return false
        }
    })
});
ig.baked = !0;

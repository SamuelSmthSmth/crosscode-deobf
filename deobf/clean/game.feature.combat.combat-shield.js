/**
 * game.feature.combat.combat-shield
 * =================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.combat.combat-shield")`.
 *
 * Combat shields/guards: `sc.CombatShield` base, `sc.CombatantShieldConnection`
 * (the active shield attached to a combatant), and `sc.COMBAT_SHIELDS.*`
 * (DIRECTIONAL, PARTS, PLAYER). Defines `sc.SHIELD_STRENGTH`.
 */
ig.module("game.feature.combat.combat-shield")
    .requires("game.feature.combat.model.combat-params")
    .defines(function () {

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

        init: function (settings, name) {
            this.name = name;
            this.baseFactor = settings.baseFactor !== void 0 ? settings.baseFactor : 0;
            this.elementFactors = settings.elementFactors !== void 0 ? settings.elementFactors : this.elementFactors;
            this.strength = sc.SHIELD_STRENGTH[settings.strength] || sc.SHIELD_STRENGTH.BLOCK_ALL;
            this.hitResist = sc.ATTACK_TYPE[settings.hitResist] || this.hitResist;
            this.stableOverride = sc.ATTACK_TYPE[settings.stableOverride];
            this.neutralize = settings.neutralize;
            if (this.stableOverride === void 0) this.stableOverride = sc.ATTACK_TYPE.HEAVY;
            this.duration = settings.duration != void 0 ? settings.duration : -1;
            if (settings.effect) {
                this.effect = new ig.EffectHandle(settings.effect);
                this.fxOffset = settings.fxOffset
            }
        },

        clearCached: function () {
            this.effect && this.effect.clearCached()
        },

        onActivate: null,
        onDeactivate: null,

        isActive: function () {
            return true
        },

        getDamageFactor: function (attack) {
            return this.baseFactor * (attack.element ? this.elementFactors[attack.element - 1] : 1)
        },

        reduceSpikeDamage: function () {
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

        init: function (combatant, shield, perfectGuardTime) {
            this.combatant = combatant;
            this.shield = shield;
            this.perfectGuardTime = perfectGuardTime || 0;
            this.perfectTimeReset = perfectGuardTime || 0;
            this.shield.onActivate && this.shield.onActivate(combatant);
            if (this.shield.effect) this.effectHandle = shield.effect.spawnOnTarget(combatant, {
                duration: -1,
                align: "CENTER",
                offset: this.shield.fxOffset
            })
        },

        update: function () {
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

        isPerfect: function () {
            return this.perfectGuardTime > 0
        },

        resetPerfectGuardTime: function () {
            this.perfectGuardTime = this.perfectTimeReset
        },

        onDetach: function (combatant) {
            this.effectHandle && this.effectHandle.stop();
            this.shield.onDeactivate && this.shield.onDeactivate(combatant)
        },

        onActionEndDetach: function () {
            this.combatant.removeShield(this)
        },

        onEntityKillDetach: function () {
            this.combatant.removeShield(this)
        }
    });

    sc.COMBAT_SHIELDS = {};

    var hitDirScratch = Vec2.create(),
        faceScratch = Vec2.create();

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

        init: function (settings, name) {
            this.parent(settings, name);
            this.strength = sc.SHIELD_STRENGTH[settings.strength] || sc.SHIELD_STRENGTH.REGULAR;
            this.range = settings.range || 0.5;
            this.back = settings.back || false
        },

        isActive: function (combatant, attacker) {
            var faceCount = combatant.getCurrentAnimFaceCount();
            faceCount > 1 ? ig.getRoundedFaceDir(combatant.face.x, combatant.face.y, faceCount, faceScratch) : Vec2.assign(faceScratch, combatant.face);
            this.back && Vec2.flip(faceScratch);
            var hitAngle = attacker.getHitDir(combatant, hitDirScratch);
            hitAngle = Math.PI - Math.abs(Vec2.angle(hitAngle, faceScratch));
            var rangeAngle = this.range * Math.PI;
            if (hitAngle <= rangeAngle) return true;
            hitAngle = attacker.getHitVel(combatant, hitDirScratch);
            hitAngle = Math.PI - Math.abs(Vec2.angle(hitAngle, faceScratch));
            return hitAngle <= rangeAngle / 2 ? true : false
        },

        reduceSpikeDamage: function () {
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

        init: function (settings, name) {
            this.parent(settings, name);
            this.strength = sc.SHIELD_STRENGTH[settings.strength] || sc.SHIELD_STRENGTH.BLOCK_ALL;
            this.parts = settings.parts || null;
            this.inverse = settings.inverse || false
        },

        isActive: function (combatant, attacker, attackInfo, partName) {
            var active = this.parts.indexOf(partName) != -1;
            this.inverse && (active = !active);
            return active
        },

        reduceSpikeDamage: function () {
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

        init: function (settings, name) {
            this.parent(settings, name);
            this.noShieldDamage = settings.noShieldDamage || false;
            this.noDefaultFX = settings.noDefaultFX || false
        },

        isActive: function (defender, attacker, attackInfo, partName, perfect) {
            if (!this.parent(defender, attacker, attackInfo, partName, perfect)) return false;
            if (defender.params.getModifier("GUARD_SP") && !this.noShieldDamage) {
                var guardSp = defender.params.getModifier("GUARD_SP");
                defender.params.addSp(guardSp * attackInfo.damageFactor * (perfect ? 2 : 1))
            }
            if (this.noShieldDamage || perfect) return true;
            var defenseRatio = this.getDefenseRatio(attackInfo, defender);
            var shieldDamage = attackInfo.damageFactor * Math.pow(defenseRatio, 1.5);
            return !defender.damageShield(shieldDamage)
        },

        onActivate: function (combatant) {
            !this.effect && !this.noDefaultFX && combatant.startGuardEffect()
        },

        onDeactivate: function (combatant) {
            !this.effect && !this.noDefaultFX && combatant.endGuardEffect()
        },

        getDamageFactor: function (attackInfo, defender) {
            var baseFactor = this.parent(attackInfo, defender),
                damageFactor = this.getDefenseRatio(attackInfo, defender);
            damageFactor = damageFactor <= 1 ? 0.2 - (1 - Math.pow(damageFactor, 0.3)) * 1 : 0.2 + (Math.pow(damageFactor, 1.1) - 1) * 0.35;
            damageFactor = damageFactor - defender.params.getModifier("GUARD_STRENGTH");
            damageFactor = damageFactor.limit(0, 1);
            return baseFactor * damageFactor
        },

        getDefenseRatio: function (attackInfo, defender) {
            var defense = defender.params.getStat("defense");
            return !attackInfo.attackerParams ? 0 : attackInfo.attackerParams.getStat("attack") / defense
        },

        reduceSpikeDamage: function () {
            return false
        }
    })
});
ig.baked = !0;

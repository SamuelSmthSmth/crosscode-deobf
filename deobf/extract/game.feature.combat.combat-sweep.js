ig.module("game.feature.combat.combat-sweep").requires("impact.feature.effect.effect-sheet").defines(function() {
    sc.COMBAT_SWEEPS = {};
    sc.COMBAT_SWEEPS.SPHEROMANCER = {
        sheet: new ig.EffectSheet("sweeps"),
        keys: ["default", "heat", "cold", "shock", "wave"],
        force: {
            radius: 32,
            zHeight: 24,
            centralAngle: 0.5,
            duration: 0.1,
            attack: {
                type: "MEDIUM",
                damageFactor: 0.8,
                spFactor: 1,
                skillBonus: "MELEE_DMG"
            },
            checkCollision: true
        }
    };
    sc.COMBAT_SWEEPS.SPHEROMANCER_FINISHER = {
        sheet: new ig.EffectSheet("special-neutral"),
        keys: ["finisherNeutral",
            "finisherHeat", "finisherCold", "finisherShock", "finisherWave"
        ],
        force: {
            radius: 32,
            zHeight: 24,
            centralAngle: 1.5,
            startAngle: -0.25,
            duration: 0.3,
            attack: {
                type: "HEAVY",
                damageFactor: 1,
                spFactor: 1,
                skillBonus: "MELEE_DMG"
            },
            checkCollision: true
        }
    };
    sc.COMBAT_SWEEPS.TRIBLADER = {
        sheet: new ig.EffectSheet("combat.triblader"),
        keys: ["sweepNeutral", "sweepHeat", "sweepCold", "sweepShock", "sweepWave"],
        fxDuration: -1,
        force: {
            radius: 48,
            zHeight: 24,
            centralAngle: 0.7,
            duration: 0.2,
            attack: {
                type: "MEDIUM",
                fly: "HEAVY",
                damageFactor: 1.15,
                spFactor: 1,
                skillBonus: "MELEE_DMG"
            },
            checkCollision: true
        }
    };
    sc.COMBAT_SWEEPS.TRIBLADER_FINISHER = {
        sheet: new ig.EffectSheet("combat.triblader"),
        keys: ["finisherNeutral", "finisherHeat", "finisherCold", "finisherShock", "finisherWave"],
        fxDuration: -1,
        force: {
            radius: 48,
            zHeight: 24,
            centralAngle: 1.7,
            startAngle: -0.35,
            duration: 0.4,
            attack: {
                type: "HEAVY",
                damageFactor: 1.4,
                spFactor: 1,
                skillBonus: "MELEE_DMG"
            },
            checkCollision: true
        }
    };
    sc.COMBAT_SWEEPS.QUADROGUARD = {
        sheet: new ig.EffectSheet("combat.quadroguard"),
        keys: ["shieldNeutral", "shieldHeat",
            "shieldCold", "shieldShock", "shieldWave"
        ],
        fxRotOffset: {
            x: 0,
            y: -20
        },
        force: {
            radius: 40,
            zHeight: 24,
            centralAngle: 0.3,
            duration: 0.1,
            alwaysFull: true,
            attack: {
                type: "HEAVY",
                damageFactor: 1.5,
                spFactor: 1,
                skillBonus: "MELEE_DMG"
            },
            checkCollision: true
        }
    };
    sc.COMBAT_SWEEPS.QUADROGUARD_FINISHER = {
        sheet: new ig.EffectSheet("combat.quadroguard"),
        keys: ["shieldNeutralFinisher", "shieldHeatFinisher", "shieldColdFinisher", "shieldShockFinisher", "shieldWaveFinisher"],
        fxRotOffset: {
            x: 0,
            y: -20
        },
        force: {
            radius: 40,
            zHeight: 24,
            centralAngle: 0.3,
            duration: 0.1,
            alwaysFull: true,
            attack: {
                type: "HEAVY",
                damageFactor: 3,
                spFactor: 1,
                skillBonus: "MELEE_DMG"
            },
            checkCollision: true
        }
    };
    sc.CombatSweep = {
        show: function(b, a, d, c, e, f) {
            var g = ig.copy(b.force);
            g.attack.element = d;
            f = f ? c : 0;
            e && (g.clockwise = !g.clockwise);
            f && (g.flipLeftFace = f);
            g = new sc.CircleHitForce(a, g);
            sc.combat.addCombatForce(g);
            a.addActionAttached(g);
            d = b.keys[d];
            e && (d = d + "Rev");
            b = b.sheet.spawnOnTarget(d, a, {
                rotateFace: c,
                flipLeftFace: f,
                duration: b.fxDuration || 0,
                rotOffset: b.fxRotOffset || false
            });
            a.addActionAttached(b)
        }
    }
});
ig.baked = !0;

/**
 * game.feature.combat.combat-sweep
 * ================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.combat.combat-sweep")`.
 *
 * Melee "sweep" combat art definitions (`sc.COMBAT_SWEEPS.*`: spheromancer,
 * triblader, quadroguard + finishers) and `sc.CombatSweep.show`, which spawns
 * the circular hit force + sweep visual for one of them.
 */
ig.module("game.feature.combat.combat-sweep")
    .requires("impact.feature.effect.effect-sheet")
    .defines(function () {

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
        keys: ["finisherNeutral", "finisherHeat", "finisherCold", "finisherShock", "finisherWave"],
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
        keys: ["shieldNeutral", "shieldHeat", "shieldCold", "shieldShock", "shieldWave"],
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
        show: function (sweep, entity, element, rotateFace, reverse, flip) {
            var forceConfig = ig.copy(sweep.force);
            forceConfig.attack.element = element;
            var flipValue = flip ? rotateFace : 0;
            reverse && (forceConfig.clockwise = !forceConfig.clockwise);
            flipValue && (forceConfig.flipLeftFace = flipValue);
            var force = new sc.CircleHitForce(entity, forceConfig);
            sc.combat.addCombatForce(force);
            entity.addActionAttached(force);

            var key = sweep.keys[element];
            reverse && (key = key + "Rev");
            var fx = sweep.sheet.spawnOnTarget(key, entity, {
                rotateFace: rotateFace,
                flipLeftFace: flipValue,
                duration: sweep.fxDuration || 0,
                rotOffset: sweep.fxRotOffset || false
            });
            entity.addActionAttached(fx)
        }
    }
});
ig.baked = !0;

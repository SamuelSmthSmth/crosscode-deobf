/**
 * game.feature.combat.combat-assault
 * ==================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.combat.combat-assault")`.
 *
 * The "assault" charged-shot combat art: builds one `sc.BallInfo` per element
 * (`sc.ASSAULT_PROJECTILES`) and `sc.AssaultTools.spawn`, which fans out a
 * spread of element balls whose damage is split from the ASSAULT modifier.
 */
ig.module("game.feature.combat.combat-assault")
    .requires("game.feature.combat.model.combat-params", "game.feature.combat.entities.ball")
    .defines(function () {

    var ballInfoTemplate = {
        type: "BALL",
        effects: "ball-assault",
        speed: 250,
        maxBounce: 0,
        timer: 0.166,
        animation: {
            name: "default",
            sheet: {
                src: "media/entity/balls/default.png",
                width: 16,
                height: 16,
                offY: 168
            },
            time: 0.05,
            repeat: true,
            frames: [0],
            renderMode: "lighter",
            guiSprites: true
        },
        attack: {
            type: "NONE",
            visualType: "LIGHT",
            element: "HEAT",
            damageFactor: 0.6,
            reverse: false,
            spFactor: 1,
            guardable: "",
            skillBonus: "MELEE_DMG",
            hints: ["NO_PUZZLE"]
        },
        behaviors: []
    };

    sc.ASSAULT_PROJECTILES = {};

    for (var elementName in sc.ELEMENT) {
        var elementId = sc.ELEMENT[elementName],
            ballInfo = ig.copy(ballInfoTemplate);
        ballInfo.attack.element = elementName;
        ballInfo.animation.frames[0] = elementId;
        sc.ASSAULT_PROJECTILES[elementId] = new sc.BallInfo(ballInfo)
    }

    var spawnPos = Vec3.create(),
        direction = Vec2.create();

    sc.AssaultTools = {
        spawn: function (entity, elementId, damage) {
            var totalDamage = entity.params.getModifier("ASSAULT") * damage;
            if (totalDamage) {
                var count = Math.max(1, Math.round(totalDamage / 0.2));
                var ballInfo = sc.ASSAULT_PROJECTILES[elementId];
                if (ballInfo) {
                    ballInfo.data.attack.damageFactor = totalDamage / count;
                    var pos = entity.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, spawnPos);
                    for (pos.z = pos.z + Constants.BALL_HEIGHT; count--;) {
                        var dir = Vec2.assign(direction, entity.face);
                        Vec2.rotate(dir, Math.PI * 0.4 * (Math.random() - 0.5));
                        Vec2.length(dir, 4);
                        ballInfo.spawn(pos.x + dir.x, pos.y + dir.y, pos.z, entity, dir)
                    }
                }
            }
        }
    }
});
ig.baked = !0;

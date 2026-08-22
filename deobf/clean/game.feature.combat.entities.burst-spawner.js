/**
 * game.feature.combat.entities.burst-spawner
 * ==========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.combat.entities.burst-spawner")`.
 *
 * `ig.BurstSpawnerEntity`: a moving "burst" projectile that periodically
 * leaves behind circular hit forces as it travels toward its target.
 */
ig.module("game.feature.combat.entities.burst-spawner")
    .requires("game.constants", "impact.feature.effect.effect-sheet", "impact.base.entity")
    .defines(function () {

    ig.BurstSpawnerEntity = ig.Entity.extend({
        combatant: null,
        target: null,
        attack: null,
        moveSpeed: 0,
        spawnCount: 3,
        spawnInterval: 0.2,
        effect: null,
        damageDelay: 0,
        radius: 32,
        zHeight: 24,
        steerDegree: 0.2,
        adjustTime: 0,
        timer: 0,
        spawnList: [],
        isThreat: true,

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.IGNORE;
            this.coll.bounciness = 1;
            this.coll.accelSpeed = 0;
            this.coll.friction.ground = 0;
            this.coll.setSize(4, 4, 4);
            this.coll.vel.x = settings.vel.x;
            this.coll.vel.y = settings.vel.y;
            this.target = (this.combatant = settings.combatant || null) && this.combatant.target;
            this.attack = settings.attack;
            this.moveSpeed = settings.moveSpeed || 40;
            this.spawnCount = settings.spawnCount || 3;
            this.spawnInterval = settings.spawnInterval || 0.3;
            this.effect = settings.effect;
            this.damageDelay = settings.damageDelay || 0;
            this.radius = settings.radius || 32;
            this.zHeight = settings.zHeight || 24;
            this.steerDegree = settings.steerDegree || 0.2;
            this.adjustTime = settings.adjustTime || 0;
            if (this.cancelOnCollision = settings.cancelOnCollision || false) this.coll.bounciness = 0
        },

        getCombatant: function () {
            return this.combatant
        },

        handleMovementTrace: function (res) {
            !this._killed && res.collided && this.cancelOnCollision ? this.kill() : this.parent(res)
        },

        update: function () {
            this.timer = this.timer + ig.system.tick;
            var spawnTarget = Math.min(this.spawnCount, Math.floor(this.timer / this.spawnInterval));
            for (; this.spawnList.length < spawnTarget;) this.startSpawn();
            var allSpawned = false;
            for (var index = 0; index < this.spawnList.length; ++index) allSpawned = this.updateSpawn(this.spawnList[index]);
            if (spawnTarget == this.spawnCount && allSpawned) this.kill();
            else {
                this.target && sc.BallTools.adjustDirection(this, this.target, this.timer, this.adjustTime, this.steerDegree);
                Vec2.length(this.coll.vel, this.moveSpeed)
            }
            this.parent()
        },

        startSpawn: function () {
            var pos = Vec3.create(this.coll.pos);
            this.spawnList.push({
                pos: pos,
                timer: this.damageDelay
            });
            this.effect.spawnFixed(pos.x, pos.y, pos.z)
        },

        updateSpawn: function (spawn) {
            if (spawn.timer >= 0) {
                spawn.timer = spawn.timer - ig.system.tick;
                if (spawn.timer <= 0) {
                    var force = new sc.CircleHitForce(this.combatant, {
                        pos: spawn.pos,
                        radius: this.radius,
                        attack: this.attack,
                        zHeight: this.zHeight
                    });
                    sc.combat.addCombatForce(force);
                    return true
                }
                return false
            }
            return true
        }
    })
});
ig.baked = !0;

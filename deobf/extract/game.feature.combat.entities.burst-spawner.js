ig.module("game.feature.combat.entities.burst-spawner").requires("game.constants", "impact.feature.effect.effect-sheet", "impact.base.entity").defines(function() {
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
        init: function(b, a, d, c) {
            this.parent(b, a, d, c);
            this.coll.type = ig.COLLTYPE.IGNORE;
            this.coll.bounciness = 1;
            this.coll.accelSpeed =
                0;
            this.coll.friction.ground = 0;
            this.coll.setSize(4, 4, 4);
            this.coll.vel.x = c.vel.x;
            this.coll.vel.y = c.vel.y;
            this.target = (this.combatant = c.combatant || null) && this.combatant.target;
            this.attack = c.attack;
            this.moveSpeed = c.moveSpeed || 40;
            this.spawnCount = c.spawnCount || 3;
            this.spawnInterval = c.spawnInterval || 0.3;
            this.effect = c.effect;
            this.damageDelay = c.damageDelay || 0;
            this.radius = c.radius || 32;
            this.zHeight = c.zHeight || 24;
            this.steerDegree = c.steerDegree || 0.2;
            this.adjustTime = c.adjustTime || 0;
            if (this.cancelOnCollision = c.cancelOnCollision ||
                false) this.coll.bounciness = 0
        },
        getCombatant: function() {
            return this.combatant
        },
        handleMovementTrace: function(b) {
            !this._killed && b.collided && this.cancelOnCollision ? this.kill() : this.parent(b)
        },
        update: function() {
            this.timer = this.timer + ig.system.tick;
            for (var b = Math.min(this.spawnCount, Math.floor(this.timer / this.spawnInterval)); this.spawnList.length < b;) this.startSpawn();
            for (var a = false, d = 0; d < this.spawnList.length; ++d) a = this.updateSpawn(this.spawnList[d]);
            if (b == this.spawnCount && a) this.kill();
            else {
                this.target &&
                    sc.BallTools.adjustDirection(this, this.target, this.timer, this.adjustTime, this.steerDegree);
                Vec2.length(this.coll.vel, this.moveSpeed)
            }
            this.parent()
        },
        startSpawn: function() {
            var b = Vec3.create(this.coll.pos);
            this.spawnList.push({
                pos: b,
                timer: this.damageDelay
            });
            this.effect.spawnFixed(b.x, b.y, b.z)
        },
        updateSpawn: function(b) {
            if (b.timer >= 0) {
                b.timer = b.timer - ig.system.tick;
                if (b.timer <= 0) {
                    b = new sc.CircleHitForce(this.combatant, {
                        pos: b.pos,
                        radius: this.radius,
                        attack: this.attack,
                        zHeight: this.zHeight
                    });
                    sc.combat.addCombatForce(b);
                    return true
                }
                return false
            }
            return true
        }
    })
});
ig.baked = !0;

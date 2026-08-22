/**
 * game.feature.combat.entities.projectile
 * =======================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.combat.entities.projectile")`.
 *
 * `ig.ENTITY.Projectile`: the base projectile entity — a bouncing combat
 * entity tied to a combatant's hit proxy, with hit/bounce callbacks,
 * already-collided tracking, and hit-center/hit-velocity accessors. Defines
 * `ig.PROJECTILE_KILL_TYPE` (how a projectile ended: wall / air / other).
 */
ig.module("game.feature.combat.entities.projectile")
    .requires("game.constants", "impact.feature.effect.effect-sheet", "impact.base.entity")
    .defines(function () {

    ig.PROJECTILE_KILL_TYPE = {
        WALL: 1,
        AIR: 2,
        OTHER: 3
    };

    ig.ENTITY.Projectile = ig.AnimatedEntity.extend({
        speedVary: {
            _type: "Number",
            _info: "Speed variance. Value will be applied +- 50%"
        },

        combatant: null,
        hitProxy: null,
        remainingHits: 3,
        maxHits: 3,
        alreadyCollided: [],
        skipBounce: false,
        noMoveRotate: false,

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.PROJECTILE;
            this.coll.bounciness = 1;
            this.coll.accelSpeed = 0;
            this.coll.friction.air = 0;
            this.coll.friction.ground = 0;
            this.coll.minBounceVelocity = 0;
            this.coll.vel.x = settings.vel.x;
            this.coll.vel.y = settings.vel.y;
            this.combatant = settings.combatant || null;
            this.animState.angle = Vec3.clockangle(this.coll.vel);
            this.hitProxy = this.combatant.combo.hitProxy
        },

        spawnHitProxy: function (target, params, hitPos) {
            this.hitProxy && this.hitProxy.spawn(target, this.combatant, this.coll.vel, params, hitPos)
        },

        update: function () {
            this.animState.angle = this.noMoveRotate ? 0 : Vec3.clockangle(this.coll.vel);
            this.parent()
        },

        handleMovementTrace: function (res) {
            if (!this._killed) {
                if (res.collided) {
                    this.alreadyCollided.length = 0;
                    var center = this.getCenter();
                    center.x = center.x + res.blockDir.x * this.coll.size.x / 2.05;
                    center.y = center.y + res.blockDir.y * this.coll.size.y / 2.05;
                    if (!this.remainingHits) {
                        if (this.onProjectileKill) this.onProjectileKill(ig.PROJECTILE_KILL_TYPE.WALL, center, res);
                        this.kill();
                        return
                    }
                    this.remainingHits--;
                    if (this.onBounce) this.onBounce(center, res)
                }
                this.skipBounce ? this.skipBounce = false : this.parent(res)
            }
        },

        onKill: function (data) {
            this.parent(data)
        },

        collideWith: function (other) {
            if (!(other.coll.subColls.length > 0)) {
                var entity = other.coll.parentColl ? other.coll.parentColl.entity : other;
                if (this.alreadyCollided.indexOf(entity.id) == -1) {
                    var blocked = false;
                    this.onProjectileHit && (blocked = !this.onProjectileHit(other, this.coll._collData && this.coll._collData.blockDir));
                    blocked || this.alreadyCollided.push(entity.id)
                }
            }
        },

        clearIgnored: function () {
            this.alreadyCollided.length = 0
        },

        addIgnore: function (entity) {
            this.alreadyCollided.push(entity.id)
        },

        getHitCenter: function (other, out) {
            return this.getOverlapCenterCoords(other, out)
        },

        getHitVel: function (other, out) {
            var vel = out || {};
            Vec2.assign(vel, this.coll.vel);
            return vel
        },

        getElement: function () {
            return sc.ELEMENT.NEUTRAL
        },

        getCombatant: function () {
            return this.combatant
        },

        getCombatantRoot: function () {
            return this.combatant.getCombatantRoot()
        },

        getAttackInfo: function () {
            return this.attackInfo
        }
    })
});
ig.baked = !0;

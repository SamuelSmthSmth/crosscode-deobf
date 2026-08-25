ig.module("game.feature.combat.entities.projectile").requires("game.constants", "impact.feature.effect.effect-sheet", "impact.base.entity").defines(function() {
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
        init: function(b, a, d, c) {
            this.parent(b, a, d, c);
            this.coll.type = ig.COLLTYPE.PROJECTILE;
            this.coll.bounciness = 1;
            this.coll.accelSpeed = 0;
            this.coll.friction.air = 0;
            this.coll.friction.ground = 0;
            this.coll.minBounceVelocity = 0;
            this.coll.vel.x = c.vel.x;
            this.coll.vel.y = c.vel.y;
            this.combatant = c.combatant || null;
            this.animState.angle = Vec3.clockangle(this.coll.vel);
            this.hitProxy = this.combatant.combo.hitProxy
        },
        spawnHitProxy: function(b, a, d) {
            this.hitProxy && this.hitProxy.spawn(b, this.combatant, this.coll.vel, a, d)
        },
        update: function() {
            this.animState.angle = this.noMoveRotate ? 0 : Vec3.clockangle(this.coll.vel);
            this.parent()
        },
        handleMovementTrace: function(b) {
            if (!this._killed) {
                if (b.collided) {
                    this.alreadyCollided.length = 0;
                    var a = this.getCenter();
                    a.x = a.x + b.blockDir.x * this.coll.size.x / 2.05;
                    a.y = a.y + b.blockDir.y * this.coll.size.y / 2.05;
                    if (!this.remainingHits) {
                        if (this.onProjectileKill) this.onProjectileKill(ig.PROJECTILE_KILL_TYPE.WALL, a, b);
                        this.kill();
                        return
                    }
                    this.remainingHits--;
                    if (this.onBounce) this.onBounce(a, b)
                }
                this.skipBounce ? this.skipBounce = false : this.parent(b)
            }
        },
        onKill: function(b) {
            this.parent(b)
        },
        collideWith: function(b) {
            if (!(b.coll.subColls.length >
                    0)) {
                var a = b.coll.parentColl ? b.coll.parentColl.entity : b;
                if (this.alreadyCollided.indexOf(a.id) == -1) {
                    var d = false;
                    this.onProjectileHit && (d = !this.onProjectileHit(b, this.coll._collData && this.coll._collData.blockDir));
                    d || this.alreadyCollided.push(a.id)
                }
            }
        },
        clearIgnored: function() {
            this.alreadyCollided.length = 0
        },
        addIgnore: function(b) {
            this.alreadyCollided.push(b.id)
        },
        getHitCenter: function(b, a) {
            return this.getOverlapCenterCoords(b, a)
        },
        getHitVel: function(b, a) {
            var d = a || {};
            Vec2.assign(d, this.coll.vel);
            return d
        },
        getElement: function() {
            return sc.ELEMENT.NEUTRAL
        },
        getCombatant: function() {
            return this.combatant
        },
        getCombatantRoot: function() {
            return this.combatant.getCombatantRoot()
        },
        getAttackInfo: function() {
            return this.attackInfo
        }
    })
});
ig.baked = !0;

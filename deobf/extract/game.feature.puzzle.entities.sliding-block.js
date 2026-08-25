ig.module("game.feature.puzzle.entities.sliding-block").requires("impact.base.actor-entity", "impact.base.entity", "impact.feature.effect.effect-sheet").defines(function() {
    var b = Vec2.create(),
        a = {};
    ig.ENTITY.SlidingBlock = ig.AnimatedEntity.extend({
        _wm: new ig.Config({
            spawnable: true,
            attributes: {}
        }),
        moving: false,
        moveDir: Vec2.create(),
        bombSnap: true,
        squishRespawn: true,
        effects: {
            sheet: new ig.EffectSheet("puzzle.sliding-block"),
            handle: null
        },
        init: function(a, b, e, f) {
            this.parent(a, b, e, f);
            this.coll.type = ig.COLLTYPE.BLOCK;
            this.coll.zGravityFactor = 1;
            this.coll.zBounciness = 0.3;
            this.coll.weight = -1;
            this.coll.shadow.size = 16;
            this.coll.setSize(32, 32, 32);
            this.terrain = ig.TERRAIN.METAL;
            a = ig.mapStyle.get("puzzle");
            this.initAnimations({
                sheet: {
                    src: a.sheet,
                    width: 32,
                    height: 64,
                    offX: 224,
                    offY: 192
                },
                aboveZ: 1,
                wallY: 0.1,
                SUB: [{
                    name: "default",
                    time: 1,
                    frames: [0],
                    repeat: false
                }]
            })
        },
        ballHit: function(d) {
            var c = d.getHitCenter(this),
                e = false;
            !d.isBall && !d.attackInfo.hasHint("BOMB") && (e = true);
            d.isBall && !d.attackInfo.hasHint("CHARGED") && (e = true);
            if (this.moving ||
                e) {
                sc.combat.showHitEffect(this, c, sc.ATTACK_TYPE.NONE, d.getElement(), true, false, true);
                return true
            }
            Vec2.flip(ig.ActorEntity.getFaceVec(d.getCollideSide(this), this.moveDir));
            d = Vec2.assign(b, this.moveDir);
            c = ig.game.physics.initTraceResult(a);
            if (ig.game.traceEntity(c, this, d.x, d.y, 0, 0, 0, ig.COLLTYPE.IGNORE)) this.effects.sheet.spawnOnTarget("blocked", this);
            else {
                this.moving = true;
                this.effects.handle = this.effects.sheet.spawnOnTarget("slide", this, {
                    duration: -1
                })
            }
            return true
        },
        update: function() {
            if (this.moving) {
                var d =
                    Vec2.assign(b, this.moveDir);
                Vec2.length(d, 400 * ig.system.tick);
                var c = ig.game.physics.initTraceResult(a);
                if (ig.game.traceEntity(c, this, d.x, d.y, 0, 0, 1, ig.COLLTYPE.IGNORE, null, null, 1)) {
                    Vec2.mulF(d, c.dist);
                    this.moving = false;
                    this.effects.handle && this.effects.handle.stop();
                    this.coll.vel.z = 0
                }
                c = this.coll;
                this.setPos(c.pos.x + d.x, c.pos.y + d.y, c.pos.z, true)
            }
            this.parent()
        }
    })
});
ig.baked = !0;

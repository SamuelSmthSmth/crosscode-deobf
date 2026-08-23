/**
 * game.feature.puzzle.entities.sliding-block
 * ==========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.puzzle.entities.sliding-block")`.
 *
 * `ig.ENTITY.SlidingBlock`: a heavy block that a ball/attack can shove along
 * the ground (400 px/s). Blocked hits (non-ball attacks, uncharged balls or
 * while already moving) only show a hit effect; otherwise the block slides
 * until it hits an obstacle.
 */
ig.module("game.feature.puzzle.entities.sliding-block")
    .requires("impact.base.actor-entity", "impact.base.entity", "impact.feature.effect.effect-sheet")
    .defines(function () {

    var moveVec = Vec2.create(),
        traceResult = {};

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

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.BLOCK;
            this.coll.zGravityFactor = 1;
            this.coll.zBounciness = 0.3;
            this.coll.weight = -1;
            this.coll.shadow.size = 16;
            this.coll.setSize(32, 32, 32);
            this.terrain = ig.TERRAIN.METAL;
            var puzzleStyle = ig.mapStyle.get("puzzle");
            this.initAnimations({
                sheet: {
                    src: puzzleStyle.sheet,
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

        ballHit: function (ball) {
            var hitCenter = ball.getHitCenter(this),
                blocked = false;
            !ball.isBall && !ball.attackInfo.hasHint("BOMB") && (blocked = true);
            ball.isBall && !ball.attackInfo.hasHint("CHARGED") && (blocked = true);
            if (this.moving || blocked) {
                sc.combat.showHitEffect(this, hitCenter, sc.ATTACK_TYPE.NONE, ball.getElement(), true, false, true);
                return true
            }
            Vec2.flip(ig.ActorEntity.getFaceVec(ball.getCollideSide(this), this.moveDir));
            var move = Vec2.assign(moveVec, this.moveDir),
                trace = ig.game.physics.initTraceResult(traceResult);
            if (ig.game.traceEntity(trace, this, move.x, move.y, 0, 0, 0, ig.COLLTYPE.IGNORE)) this.effects.sheet.spawnOnTarget("blocked", this);
            else {
                this.moving = true;
                this.effects.handle = this.effects.sheet.spawnOnTarget("slide", this, {
                    duration: -1
                })
            }
            return true
        },

        update: function () {
            if (this.moving) {
                var move = Vec2.assign(moveVec, this.moveDir);
                Vec2.length(move, 400 * ig.system.tick);
                var trace = ig.game.physics.initTraceResult(traceResult);
                if (ig.game.traceEntity(trace, this, move.x, move.y, 0, 0, 1, ig.COLLTYPE.IGNORE, null, null, 1)) {
                    Vec2.mulF(move, trace.dist);
                    this.moving = false;
                    this.effects.handle && this.effects.handle.stop();
                    this.coll.vel.z = 0
                }
                var coll = this.coll;
                this.setPos(coll.pos.x + move.x, coll.pos.y + move.y, coll.pos.z, true)
            }
            this.parent()
        }
    })
});
ig.baked = !0;

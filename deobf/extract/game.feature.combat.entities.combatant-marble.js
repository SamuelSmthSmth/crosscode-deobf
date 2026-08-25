ig.module("game.feature.combat.entities.combatant-marble").requires("impact.feature.effect.effect-sheet", "impact.base.entity").defines(function() {
    ig.ENTITY.CombatantMarble = ig.AnimatedEntity.extend({
        tileSheet: new ig.TileSheet("media/entity/enemy/combatant-marble.png", 8, 8),
        effects: new ig.EffectSheet("marble"),
        startPos: Vec2.create(),
        startZPos: 0,
        target: null,
        timer: 0,
        maxZHeight: 0,
        maxTime: 0,
        lineHandle: null,
        init: function(b, a, d, c) {
            this.parent(b, a, d, c);
            this.coll.type = ig.COLLTYPE.NONE;
            this.coll.setSize(8, 8,
                8);
            this.coll.time.globalStatic = true;
            this.coll.shadow.size = 8;
            this.target = c.target;
            Vec2.assign(this.startPos, this.coll.pos);
            this.startZPos = this.coll.pos.z;
            b = Vec2.length(Vec2.sub(this.target.getCenter(), this.coll.pos));
            b = Math.max(b, 120);
            this.maxTime = 0.3 + Math.sqrt(b) / 16;
            this.maxHeight = 32 + Math.sqrt(b) * 8;
            b = Math.max(0, (this.startZPos - this.target.coll.pos.z) * 0.6 / this.maxTime);
            this.maxHeight = this.maxHeight + b;
            this.lineHandle = this.effects.spawnOnTarget("line", this, {
                duration: -1
            });
            this.lineHandle.coll.time.globalStatic =
                true;
            b = new ig.LightHandle(this, ig.LIGHT_SIZE.XS, 0, 0, -1, 1);
            ig.light.addLightHandle(b);
            this.initAnimations({
                sheet: this.tileSheet,
                name: "default",
                time: 0.03,
                frames: [0, 1, 2, 3, 4, 5],
                repeat: true
            })
        },
        update: function() {
            this.parent();
            this.timer = this.timer + ig.system.tick;
            var b = Math.min(1, this.timer / this.maxTime),
                b = KEY_SPLINES.EASE_IN.get(b),
                a = 1 - (2 * b - 1) * (2 * b - 1),
                d = this.target.getCenter(),
                c = this.target.coll.pos.z + this.target.coll.size.z + 1;
            this.coll.pos.x = this.startPos.x * (1 - b) + (d.x - this.coll.size.x / 2) * b;
            this.coll.pos.y =
                this.startPos.y * (1 - b) + (d.y - this.coll.size.y / 2) * b;
            this.coll.pos.z = this.startZPos * (1 - b) + c * b + a * this.maxHeight;
            this.coll.baseZPos = 0;
            if (this.timer >= this.maxTime) {
                this.lineHandle.stop();
                this.effects.spawnOnTarget("explode", this).coll.time.globalStatic = true;
                this.target.onCombatMarbleReach(this);
                this.kill()
            }
        }
    })
});
ig.baked = !0;

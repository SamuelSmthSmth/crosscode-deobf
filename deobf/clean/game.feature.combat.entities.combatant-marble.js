/**
 * game.feature.combat.entities.combatant-marble
 * =============================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.combat.entities.combatant-marble")`.
 *
 * `ig.ENTITY.CombatantMarble`: the little "marble" that arcs from an enemy to
 * the player's combatant when a party member tags an enemy to switch in. It
 * travels an eased arc, then notifies the target via `onCombatMarbleReach`.
 */
ig.module("game.feature.combat.entities.combatant-marble")
    .requires("impact.feature.effect.effect-sheet", "impact.base.entity")
    .defines(function () {

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

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.NONE;
            this.coll.setSize(8, 8, 8);
            this.coll.time.globalStatic = true;
            this.coll.shadow.size = 8;
            this.target = settings.target;
            Vec2.assign(this.startPos, this.coll.pos);
            this.startZPos = this.coll.pos.z;

            var distance = Vec2.length(Vec2.sub(this.target.getCenter(), this.coll.pos));
            distance = Math.max(distance, 120);
            this.maxTime = 0.3 + Math.sqrt(distance) / 16;
            this.maxHeight = 32 + Math.sqrt(distance) * 8;
            var heightBoost = Math.max(0, (this.startZPos - this.target.coll.pos.z) * 0.6 / this.maxTime);
            this.maxHeight = this.maxHeight + heightBoost;

            this.lineHandle = this.effects.spawnOnTarget("line", this, {
                duration: -1
            });
            this.lineHandle.coll.time.globalStatic = true;
            var lightHandle = new ig.LightHandle(this, ig.LIGHT_SIZE.XS, 0, 0, -1, 1);
            ig.light.addLightHandle(lightHandle);
            this.initAnimations({
                sheet: this.tileSheet,
                name: "default",
                time: 0.03,
                frames: [0, 1, 2, 3, 4, 5],
                repeat: true
            })
        },

        update: function () {
            this.parent();
            this.timer = this.timer + ig.system.tick;

            var progress = Math.min(1, this.timer / this.maxTime);
            progress = KEY_SPLINES.EASE_IN.get(progress);
            var arc = 1 - (2 * progress - 1) * (2 * progress - 1);
            var targetCenter = this.target.getCenter();
            var targetZ = this.target.coll.pos.z + this.target.coll.size.z + 1;
            this.coll.pos.x = this.startPos.x * (1 - progress) + (targetCenter.x - this.coll.size.x / 2) * progress;
            this.coll.pos.y = this.startPos.y * (1 - progress) + (targetCenter.y - this.coll.size.y / 2) * progress;
            this.coll.pos.z = this.startZPos * (1 - progress) + targetZ * progress + arc * this.maxHeight;
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

/**
 * game.feature.puzzle.entities.glowing-line
 * =========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.puzzle.entities.glowing-line")`.
 *
 * `ig.ENTITY.GlowingLine`: a decorative puzzle line that renders a glowing
 * pattern while its `VarCondition` evaluates true, fading between states over
 * 0.25 seconds.
 */
ig.module("game.feature.puzzle.entities.glowing-line")
    .requires("impact.base.entity")
    .defines(function () {

    ig.ENTITY.GlowingLine = ig.Entity.extend({
        patterns: null,
        timer: 0,
        glowing: false,
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                condition: {
                    _type: "VarCondition",
                    _info: "Condition on which the line will glow"
                }
            },
            scalableX: true,
            scalableY: true,
            scalableStep: 16,
            label: function () {
                return ""
            }
        }),

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.NONE;
            this.coll.time.globalStatic = true;
            settings.size || this.coll.setSize(8, 8, 0);
            var puzzleStyle = ig.mapStyle.get("puzzle");
            this.patterns = new ig.ImagePatternSheet(puzzleStyle.sheet, ig.ImagePattern.OPT.REPEAT_X_OR_Y, 16, 16, 176, 80, 4, 1);
            this.condition = new ig.VarCondition(settings.condition);
            this.glowing = this.condition.evaluate()
        },

        initSprites: function () {
            this.setSpriteCount(1)
        },

        update: function () {
            if (this.timer > 0) this.timer = this.timer - ig.system.tick
        },

        updateSprites: function () {
            var patternIndex = this.glowing ? 3 : 0;
            this.timer > 0 && (patternIndex = patternIndex - Math.min(2, Math.floor(this.timer / 0.05)));
            var coll = this.coll,
                sprite = this.sprites[0];
            sprite.setPos(coll.pos.x, coll.pos.y, coll.pos.z);
            sprite.setSize(coll.size.x, coll.size.y, coll.size.z);
            sprite.setImageSrc(this.patterns.getPattern(patternIndex), 0, 0)
        },

        varsChanged: function () {
            var active = this.condition && this.condition.evaluate();
            if (active && !this.glowing) {
                this.glowing = true;
                this.timer = 0.25
            } else if (!active && this.glowing) {
                this.glowing = false;
                this.timer = 0
            }
        }
    })
});
ig.baked = !0;

/**
 * game.feature.puzzle.entities.switch
 * ===================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.puzzle.entities.switch")`.
 *
 * `ig.ENTITY.Switch`: a ball-hit toggle switch that flips a named variable
 * (with animated on/off states). Also destroys the hitting ball
 * (`ballDestroyer: true`).
 */
ig.module("game.feature.puzzle.entities.switch")
    .requires("impact.base.entity")
    .defines(function () {

    ig.ENTITY.Switch = ig.AnimatedEntity.extend({
        ballDestroyer: true,
        variable: "",
        isOn: false,
        sounds: {
            hit: new ig.Sound("media/sound/battle/hit-7.ogg", 0.4),
            bing: new ig.Sound("media/sound/puzzle/switch-activate-2.ogg", 1)
        },
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                variable: {
                    _type: "VarName",
                    _info: "Variable set to true when switch is hit"
                }
            },
            label: function () {
                return "[ " + this.variable + " ]"
            }
        }),

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.VIRTUAL;
            this.coll.setSize(16, 16, 24);
            this.coll.setPadding(4, 4);
            this.coll.zGravityFactor = 1E3;
            var puzzleStyle = ig.mapStyle.get("puzzle");
            this.initAnimations({
                sheet: {
                    src: puzzleStyle.sheet,
                    width: 24,
                    height: 24,
                    offX: 0,
                    offY: 64
                },
                repeat: true,
                time: 0.15,
                SUB: [{
                    name: "off",
                    frames: [6]
                }, {
                    name: "switchOn",
                    frames: [6]
                }, {
                    name: "on",
                    frames: [6]
                }, {
                    name: "switchOff",
                    frames: [6]
                }, {
                    name: "off",
                    frames: [0, 0, 0, 0, 0, 0],
                    framesSpriteOffset: [0, 0, 12, 0, 0, 12, 0, 0, 13, 0, 0, 14, 0, 0, 14, 0, 0, 13]
                }, {
                    name: "switchOn",
                    time: 0.07,
                    frames: [1, 2],
                    framesSpriteOffset: [0, 0, 13, 0, 0, 13]
                }, {
                    name: "on",
                    frames: [3, 3, 3, 3, 3, 3],
                    framesSpriteOffset: [0, 0, 12, 0, 0, 12, 0, 0, 13, 0, 0, 14, 0, 0, 14, 0, 0, 13]
                }, {
                    name: "switchOff",
                    time: 0.07,
                    frames: [4, 5],
                    framesSpriteOffset: [0, 0, 13, 0, 0, 13]
                }]
            });
            this.variable = settings.variable;
            ig.vars.setDefault(this.variable, 0);
            this.isOn = ig.vars.get(this.variable);
            this.setCurrentAnim(this.isOn ? "on" : "off")
        },

        ballHit: function (ball) {
            if (ball.attackInfo && ball.attackInfo.hasHint("NO_PUZZLE")) return false;
            ig.vars.set(this.variable, !ig.vars.get(this.variable));
            sc.combat.showHitEffect(this, ball.getHitCenter(this), sc.ATTACK_TYPE.MEDIUM, ball.getElement(), false, false, true);
            ig.SoundHelper.playAtEntity(this.sounds.hit, this);
            ig.SoundHelper.playAtEntity(this.sounds.bing, this);
            return true
        },

        varsChanged: function () {
            var variableValue = ig.vars.get(this.variable);
            if (this.isOn != variableValue) {
                this.isOn = variableValue;
                this.setCurrentAnim(this.isOn ? "switchOn" : "switchOff", true, this.isOn ? "on" : "off", true)
            }
        }
    })
});
ig.baked = !0;

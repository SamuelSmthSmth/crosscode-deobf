ig.module("game.feature.puzzle.entities.switch").requires("impact.base.entity").defines(function() {
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
            label: function() {
                return "[ " + this.variable + " ]"
            }
        }),
        init: function(b, a, d,
            c) {
            this.parent(b, a, d, c);
            this.coll.type = ig.COLLTYPE.VIRTUAL;
            this.coll.setSize(16, 16, 24);
            this.coll.setPadding(4, 4);
            this.coll.zGravityFactor = 1E3;
            b = ig.mapStyle.get("puzzle");
            this.initAnimations({
                sheet: {
                    src: b.sheet,
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
            this.variable = c.variable;
            ig.vars.setDefault(this.variable, 0);
            this.isOn = ig.vars.get(this.variable);
            this.setCurrentAnim(this.isOn ? "on" : "off")
        },
        ballHit: function(b) {
            if (b.attackInfo && b.attackInfo.hasHint("NO_PUZZLE")) return false;
            ig.vars.set(this.variable, !ig.vars.get(this.variable));
            sc.combat.showHitEffect(this, b.getHitCenter(this), sc.ATTACK_TYPE.MEDIUM, b.getElement(), false, false, true);
            ig.SoundHelper.playAtEntity(this.sounds.hit, this);
            ig.SoundHelper.playAtEntity(this.sounds.bing, this);
            return true
        },
        varsChanged: function() {
            var b = ig.vars.get(this.variable);
            if (this.isOn != b) {
                this.isOn = b;
                this.setCurrentAnim(this.isOn ? "switchOn" : "switchOff", true, this.isOn ? "on" : "off", true)
            }
        }
    })
});
ig.baked = !0;

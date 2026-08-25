ig.module("impact.feature.base.entities.sound-entities").requires("impact.base.entity", "impact.base.actor-entity").defines(function() {
    ig.ENTITY.SoundSource = ig.Entity.extend({
        sound: null,
        soundHandle: null,
        radius: 20,
        rangeType: ig.SOUND_RANGE_TYPE.CIRCULAR,
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                sound: {
                    _type: "SoundT",
                    _info: "URL of sound."
                },
                volume: {
                    _type: "Number",
                    _info: "The volume. Value between 0 and 1.",
                    _default: 1
                },
                speed: {
                    _type: "Number",
                    _info: "Playback speed. 1=default speed. 0.5=half speed.",
                    _optional: true
                },
                fadeDuration: {
                    _type: "Number",
                    _info: "Duration in seconds the sound is faded out with",
                    _optional: true
                },
                radius: {
                    _type: "Number",
                    _info: "The radius of the sound range. In Pixels.",
                    _default: 800
                },
                rangeType: {
                    _type: "Number",
                    _select: ig.SOUND_RANGE_TYPE,
                    _info: "Determines in which direction the sound range goes",
                    _default: ig.SOUND_RANGE_TYPE.CIRCULAR
                },
                spawnCondition: {
                    _type: "VarCondition",
                    _info: "Condition for Enemy to spawn",
                    _popup: true
                }
            },
            label: function() {
                return "Sound Source"
            },
            drawCircle: function(b) {
                return (b.radius ||
                    0) / 3
            },
            boxColor: "rgba(200,200,200, 0.5)",
            borderColor: "rgba(10, 10, 223, 0.5)",
            circleColor: "rgba(200, 200, 200, 1)"
        }),
        init: function(b, a, d, c) {
            this.parent(b, a, d, c);
            if (c.sound) this.sound = new ig.Sound(c.sound, c.volume || 1);
            this.coll.type = ig.COLLTYPE.NONE;
            this.coll.setSize(16, 16, 0);
            this.radius = c.radius || 0;
            this.rangeType = c.rangeType || ig.SOUND_RANGE_TYPE.CIRCULAR;
            this.settings = {
                speed: c.speed || 1,
                fadeDuration: c.fadeDuration || 0
            }
        },
        show: function(b) {
            this.parent(b)
        },
        stop: function() {
            if (this.soundHandle) {
                this.soundHandle.stop();
                this.soundHandle = null
            }
        },
        update: function() {
            if (!this.soundHandle && !this._hidden) {
                this.soundHandle = this.sound.play(true, this.settings);
                this.soundHandle.setEntityPosition(this, ig.ENTITY_ALIGN.center, null, this.radius, this.rangeType)
            }
            this.parent()
        },
        hide: function() {
            this.parent();
            this.stop()
        },
        onKill: function(b) {
            this.parent(b);
            this.stop();
            this.sound && this.sound.clearCached()
        }
    })
});
ig.baked = !0;

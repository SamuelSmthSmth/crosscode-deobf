ig.module("impact.feature.effect.effect-steps").requires("impact.base.action", "impact.base.event", "impact.base.entity").defines(function() {
    var b = Vec3.create(),
        a = function(a) {
            if (a.isDone()) this.effect = null
        };
    ig.FX_FIRST_TARGET_OPTION = {};
    ig.FX_FIRST_TARGET_OPTION.SELF = function(a) {
        return a
    };
    ig.FX_FIRST_TARGET_OPTION.TARGET = function(a) {
        return a.getTarget()
    };
    ig.FX_SECOND_TARGET_OPTION = {};
    ig.FX_SECOND_TARGET_OPTION.SELF = function(a, b) {
        a.target2 = b
    };
    ig.FX_SECOND_TARGET_OPTION.ATTRIB_ENTITY = function(a, b, e) {
        a.target2 =
            b.getAttribute(e)
    };
    ig.FX_SECOND_TARGET_OPTION.ATTRIB_POINT = function(a, b, e) {
        a.target2Point = b.getAttribVec3(e)
    };
    ig.FX_SECOND_TARGET_OPTION.TARGET = function(a, b) {
        a.target2 = b.getTarget()
    };
    ig.ACTION_STEP.SHOW_EFFECT = ig.ActionStepBase.extend({
        effect: null,
        duration: 0,
        offset: null,
        align: 0,
        rotateFace: 0,
        wait: false,
        waitSkip: 0,
        group: null,
        partName: null,
        _wm: new ig.Config({
            attributes: {
                effect: {
                    _type: "Effect",
                    _info: "Effect to play"
                },
                duration: {
                    _type: "Number",
                    _info: "Amount of time to play animation.<br /> 0 = actual lenght of animation, -1 = forever until stopped."
                },
                offset: {
                    _type: "Offset",
                    _info: "Offset to entity position"
                },
                rotOffset: {
                    _type: "Vec2",
                    _info: "X and Y offset that is rotated with face direction. Specified is vector for NORTH viewing direction",
                    _optional: true
                },
                target: {
                    _type: "String",
                    _info: "If not defined: use same target",
                    _optional: true,
                    _select: ig.FX_FIRST_TARGET_OPTION
                },
                align: {
                    _type: "String",
                    _info: "Alignment of Animation relative to target",
                    _select: ig.ENTITY_ALIGN
                },
                rotateFace: {
                    _type: "Number",
                    _info: "If number is provided: rotate effect to match entity face, number matching possible face directions. -1 = take precise face rotation"
                },
                flipLeftFace: {
                    _type: "Boolean",
                    _info: "Flip the animation if rotation is negative."
                },
                wait: {
                    _type: "Boolean",
                    _info: "Wait until effect is over"
                },
                waitSkip: {
                    _type: "Number",
                    _info: "The amount of seconds to skip waiting before effect is over"
                },
                actionDetached: {
                    _type: "Boolean",
                    _info: "If true, keep Effect even after action is finished or canceled"
                },
                group: {
                    _type: "String",
                    _info: "A string identifying the effect. Optional. Name can be used with CLEAR_EFFECT to clear only certain effects",
                    _optional: true
                },
                partName: {
                    _type: "String",
                    _info: "Entity part on which to show animation",
                    _optional: true
                },
                target2: {
                    _type: "String",
                    _info: "Secondary effect target options.",
                    _optional: true,
                    _select: ig.FX_SECOND_TARGET_OPTION
                },
                target2Key: {
                    _type: "String",
                    _info: "Additional key value to determine second target (e.g. for attribute name)",
                    _optional: true
                },
                target2Offset: {
                    _type: "Offset",
                    _info: "Offset to entity position",
                    _optional: true
                },
                target2Align: {
                    _type: "String",
                    _info: "Alignment of Animation relative to target",
                    _select: ig.ENTITY_ALIGN,
                    _optional: true
                },
                noMultiGroup: {
                    _type: "Boolean",
                    _info: "If true: Do not transfer effect to all parts of the same group.",
                    _optional: true
                },
                fixPos: {
                    _type: "Boolean",
                    _info: "If true: show effect fixed at current entity pos"
                },
                spriteFilter: {
                    _type: "Array",
                    _info: "Only apply filter on list of sprites (by index)",
                    _sub: {
                        _type: "Integer"
                    },
                    _optional: true
                },
                ignoreSlowMo: {
                    _type: "Boolean",
                    _info: "If true: ignore slow motion for this effect",
                    _optional: true
                }
            }
        }),
        init: function(a) {
            assertContent(a, "effect");
            this.effect = new ig.EffectHandle(a.effect);
            this.duration = a.duration || 0;
            this.offset = a.offset || 0;
            this.rotOffset = a.rotOffset;
            this.align = ig.ENTITY_ALIGN[a.align] || ig.ENTITY_ALIGN.BOTTOM;
            this.wait = a.wait || false;
            this.waitSkip = a.waitSkip || 0;
            this.actionDetached = a.actionDetached || false;
            this.rotateFace = a.rotateFace || 0;
            this.group = a.group || false;
            this.flipLeftFace = a.flipLeftFace || false;
            this.partName = a.partName || null;
            this.target = ig.FX_FIRST_TARGET_OPTION[a.target] || null;
            this.target2 = ig.FX_SECOND_TARGET_OPTION[a.target2] || null;
            this.target2Align = ig.ENTITY_ALIGN[a.target2Align] ||
                ig.ENTITY_ALIGN.BOTTOM;
            this.noMultiGroup = a.noMultiGroup || false;
            this.target2Offset = a.target2Offset;
            this.target2Key = a.target2Key || null;
            this.fixPos = a.fixPos || false;
            this.spriteFilter = a.spriteFilter || null;
            this.ignoreSlowMo = a.ignoreSlowMo || false
        },
        clearCached: function() {
            this.effect.clearCached()
        },
        start: function(d) {
            var c = {
                duration: this.duration,
                offset: this.offset,
                rotOffset: this.rotOffset,
                align: this.align,
                group: this.group,
                rotateFace: this.rotateFace,
                flipLeftFace: this.flipLeftFace,
                callback: null,
                target2: null,
                target2Point: null,
                target2Align: this.target2Align,
                target2Offset: this.target2Offset,
                noMultiGroup: this.noMultiGroup,
                spriteFilter: this.spriteFilter
            };
            this.target2 && this.target2(c, d, this.target2Key);
            if (this.wait) {
                d.stepData.onEffectEvent = a;
                c.callback = d.stepData
            }
            var e = d;
            this.target && (e = this.target(d) || d);
            if (this.partName) {
                for (var e = e.coll.subColls, f = e.length, g = null; f--;)
                    if (e[f].entity.partName == this.partName) {
                        g = e[f].entity;
                        break
                    } e = g
            }
            if (this.fixPos) {
                e = e.getAlignedPos(this.align, b);
                c.offset && Vec3.add(e, c.offset);
                c = this.effect.spawnFixed(e.x, e.y, e.z, d, c)
            } else c = this.effect.spawnOnTarget(e, c);
            if (c) {
                c.setTimeEntity(d);
                this.actionDetached || c.attachToAction(d);
                this.ignoreSlowMo && c.setIgnoreSlowdown();
                if (this.wait) d.stepData.effect = c
            }
        },
        run: function(a) {
            return !this.wait || !a.stepData.effect || a.stepData.effect.getRemainingTime() <= this.waitSkip
        }
    });
    ig.ACTION_STEP.CLEAR_EFFECTS = ig.ActionStepBase.extend({
        entity: null,
        group: null,
        _wm: new ig.Config({
            attributes: {
                entity: {
                    _type: "String",
                    _info: "Secondary effect target.",
                    _optional: true,
                    _select: ig.FX_SECOND_TARGET_OPTION
                },
                group: {
                    _type: "String",
                    _info: "If provided: only clear effects attached under specified group",
                    _optional: true
                }
            }
        }),
        init: function(a) {
            this.entity = ig.FX_SECOND_TARGET_OPTION[a.entity] || null;
            this.group = a.group || null
        },
        entityAttachedCondition: function(a) {
            return a instanceof ig.ENTITY.Effect && (!this.group || this.group == a.attachGroup)
        },
        actionAttachedCondition: function(a) {
            return a instanceof ig.ENTITY.Effect
        },
        run: function(a) {
            if (this.entity) {
                var b = {};
                this.entity(b, a);
                a = b.target2;
                a.clearEntityAttached(this.entityAttachedCondition.bind(this))
            } else this.group ? a.clearEntityAttached(this.entityAttachedCondition.bind(this)) : a.clearActionAttached(this.actionAttachedCondition.bind(this));
            return true
        }
    });
    ig.EVENT_STEP.SHOW_EFFECT = ig.EventStepBase.extend({
        entity: null,
        effect: null,
        duration: 0,
        offset: null,
        group: null,
        wait: false,
        waitSkip: 0,
        target2: null,
        target2Offset: null,
        target2Align: null,
        _wm: new ig.Config({
            attributes: {
                entity: {
                    _type: "Entity",
                    _info: "Entity to apply effect on"
                },
                effect: {
                    _type: "Effect",
                    _info: "Effect to play"
                },
                duration: {
                    _type: "Number",
                    _info: "Amount of time to play animation.<br /> 0 = actual lenght of animation, -1 = forever until stopped."
                },
                offset: {
                    _type: "Offset",
                    _info: "Offset to entity position"
                },
                align: {
                    _type: "String",
                    _info: "Alignment of Animation relative to target",
                    _select: ig.ENTITY_ALIGN
                },
                group: {
                    _type: "String",
                    _info: "A string identifying the effect. Optional. Name can be used with CLEAR_EFFECT to clear only certain effects"
                },
                wait: {
                    _type: "Boolean",
                    _info: "Wait until effect is over"
                },
                waitSkip: {
                    _type: "Number",
                    _info: "The amount of seconds to skip waiting before effect is over"
                },
                target2: {
                    _type: "Entity",
                    _info: "Alternative target for homing particles",
                    _optional: true
                },
                target2Offset: {
                    _type: "Offset",
                    _info: "Offset to entity position",
                    _optional: true
                },
                target2Align: {
                    _type: "String",
                    _info: "Alignment of Animation relative to target",
                    _select: ig.ENTITY_ALIGN,
                    _optional: true
                },
                ignoreSlowMo: {
                    _type: "Boolean",
                    _info: "If true: ignore slow motion for this effect",
                    _optional: true
                }
            }
        }),
        init: function(a) {
            assertContent(a,
                "effect");
            this.entity = a.entity;
            this.effect = new ig.EffectHandle(a.effect);
            this.duration = a.duration || 0;
            this.offset = a.offset || null;
            this.align = ig.ENTITY_ALIGN[a.align] || ig.ENTITY_ALIGN.BOTTOM;
            this.group = a.group || null;
            this.wait = a.wait || false;
            this.waitSkip = a.waitSkip || 0;
            this.target2 = a.target2;
            this.target2Align = ig.ENTITY_ALIGN[a.target2Align] || ig.ENTITY_ALIGN.BOTTOM;
            this.target2Offset = a.target2Offset;
            this.ignoreSlowMo = a.ignoreSlowMo || false
        },
        clearCached: function() {
            this.effect.clearCached()
        },
        start: function(b,
            c) {
            var e = ig.Event.getEntity(this.entity, c),
                f;
            this.target2 && (f = ig.Event.getEntity(this.target2, c));
            f = {
                duration: this.duration,
                offset: this.offset,
                align: this.align,
                group: this.group,
                target2: f,
                target2Align: this.target2Align,
                target2Offset: this.target2Offset
            };
            if (this.wait) {
                f.callback = b;
                b.onEffectEvent = a
            }
            b.effect = this.effect.spawnOnTarget(e, f);
            this.ignoreSlowMo && b.effect.setIgnoreSlowdown()
        },
        run: function(a) {
            if (!this.wait || !a.effect || a.effect.getRemainingTime() <= this.waitSkip) {
                a.effect = null;
                return true
            }
            return false
        }
    });
    ig.EVENT_STEP.CLEAR_EFFECTS = ig.EventStepBase.extend({
        entity: null,
        group: null,
        _wm: new ig.Config({
            attributes: {
                entity: {
                    _type: "Entity",
                    _info: "Entity to clear effects from"
                },
                group: {
                    _type: "String",
                    _info: "if provided: only clear effects attached under specified group",
                    _optional: true
                }
            }
        }),
        init: function(a) {
            this.entity = a.entity;
            this.group = a.group || null
        },
        entityAttachedCondition: function(a) {
            return a instanceof ig.ENTITY.Effect && (!this.group || this.group == a.attachGroup)
        },
        start: function(a, b) {
            var e = ig.Event.getEntity(this.entity,
                b);
            e && e.clearEntityAttached(this.entityAttachedCondition.bind(this))
        }
    })
});
ig.baked = !0;

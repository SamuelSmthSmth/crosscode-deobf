ig.module("impact.feature.base.entities.touch-trigger").requires("impact.base.actor-entity").defines(function() {
    ig.TOUCH_TRIGGER_TYPE = {
        SET_TRUE: {},
        SET_FALSE: {
            setFalse: true
        },
        WHILE_TOUCH_TRUE: {
            keepTrack: true
        },
        WHILE_TOUCH_ADD_1: {
            keepTrack: true,
            add: true
        }
    };
    ig.ENTITY.TouchTrigger = ig.Entity.extend({
        name: "",
        face: Vec2.create(),
        touchType: 0,
        touchedCnt: 0,
        startCondition: null,
        isOn: false,
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                startCondition: {
                    _type: "VarCondition",
                    _info: "Condition for the touch trigger to react",
                    _popup: true
                },
                variable: {
                    _type: "VarName",
                    _info: "Variable to be changed"
                },
                type: {
                    _type: "String",
                    _info: "Type of change",
                    _select: ig.TOUCH_TRIGGER_TYPE,
                    _default: "SET_TRUE"
                },
                zHeight: {
                    _type: "Integer",
                    _info: "Height of trigger",
                    _default: 64
                },
                shape: {
                    _type: "String",
                    _info: "Shape of Block Entity",
                    _select: ig.COLLSHAPE,
                    _optional: true
                },
                reactToParty: {
                    _type: "Boolean",
                    _info: "If true: also react to party members"
                }
            },
            scalableX: true,
            scalableY: true,
            label: function() {
                return "[" + this.variable + "]"
            },
            drawBox: true,
            boxColor: "rgba(255,0,255, 0.25)",
            frontColor: "rgba(120,0,120, 0.25)"
        }),
        init: function(b, a, d, c) {
            this.parent(b, a, d, c);
            this.coll.type = ig.COLLTYPE.NONE;
            this.variable = c.variable;
            this.touchType = ig.TOUCH_TRIGGER_TYPE[c.type || "SET_TRUE"];
            this.shape = ig.COLLSHAPE[c.shape] || ig.COLLSHAPE.RECTANGLE;
            this.coll.size.z = c.zHeight * 1;
            this.startCondition = new ig.VarCondition(c.startCondition || "true");
            this.reactToParty = c.reactToParty || false;
            this.isOn = false;
            this.touchType.keepTrack && (this.touchType.add ? ig.vars.add(this.variable, 0) : ig.vars.set(this.variable,
                false))
        },
        update: function() {
            if (this.startCondition.evaluate()) {
                var b = this.coll,
                    a = ig.game.playerEntity;
                if (a) {
                    a = a.coll.intersectsWith(b.pos.x, b.pos.y, b.pos.z, b.size.x, b.size.y, b.size.z, true, this.shape);
                    if (this.reactToParty)
                        for (var d = sc.party.getPartySize(); !a && d--;) {
                            var c = sc.party.getPartyMemberEntityByIndex(d);
                            c && (a = c.coll.intersectsWith(b.pos.x, b.pos.y, b.pos.z, b.size.x, b.size.y, b.size.z, true, this.shape))
                        }
                    a ? this.setOn() : this.touchType.keepTrack && this.setOff()
                }
            } else this.touchType.keepTrack && this.setOff()
        },
        setOn: function() {
            if (!this.touchType.keepTrack || !this.isOn) {
                this.touchType.setFalse ? ig.vars.set(this.variable, false) : this.touchType.add ? ig.vars.add(this.variable, 1) : ig.vars.set(this.variable, true);
                this.isOn = true
            }
        },
        setOff: function() {
            if (!this.touchType.keepTrack || this.isOn) {
                this.touchType.setFalse ? ig.vars.set(this.variable, true) : this.touchType.add ? ig.vars.sub(this.variable, 1) : ig.vars.set(this.variable, false);
                this.isOn = false
            }
        }
    })
});
ig.baked = !0;

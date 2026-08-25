ig.module("game.feature.ar.ar-steps").requires("impact.base.action", "impact.base.event", "game.feature.ar.gui.ar-box").defines(function() {
    function b(a) {
        return a instanceof ig.GUI.ARBox
    }
    ig.EVENT_STEP.SHOW_AR_MSG = ig.EventStepBase.extend({
        entity: null,
        text: null,
        time: null,
        mode: false,
        color: null,
        partName: null,
        varFill: null,
        varFillMax: null,
        _wm: new ig.Config({
            attributes: {
                entity: {
                    _type: "Entity",
                    _info: "Entity to show AR Message on"
                },
                text: {
                    _type: "LangLabel",
                    _info: "AR Text to display"
                },
                time: {
                    _type: "NumberExpression",
                    _info: "Time in seconds the message should be visible. 0 = forever"
                },
                mode: {
                    _type: "String",
                    _info: "Mode of AR display.",
                    _select: sc.AR_BOX_MODE
                },
                color: {
                    _type: "String",
                    _info: "Color of AR display.",
                    _select: sc.AR_COLOR
                },
                hideOutsideOfScreen: {
                    _type: "Boolean",
                    _info: "If defined: don't show offscreen-msg"
                },
                partName: {
                    _type: "String",
                    _info: "If provided: Show AR display to sub part of entity",
                    _optional: true
                },
                varFill: {
                    _type: "VarName",
                    _info: "Filling of AR Message depends on value of variable",
                    _optional: true
                },
                varFillMax: {
                    _type: "NumberExpression",
                    _info: "Maximum Number of variable to fill bar",
                    _optional: true
                }
            },
            width: 400
        }),
        init: function(a) {
            this.entity = a.entity;
            this.text = new ig.LangLabel(a.text);
            this.time = a.time;
            this.mode = sc.AR_BOX_MODE[a.mode];
            this.color = sc.AR_COLOR[a.color];
            this.partName = a.partName;
            this.varFill = a.varFill;
            this.varFillMax = a.varFillMax
        },
        start: function(a, b) {
            var c = ig.Event.getEntity(this.entity, b),
                e = c,
                f = ig.Event.getExpressionValue(this.time);
            if (this.partName)
                for (var g = c.coll.subColls, h = g.length; h--;)
                    if (g[h].entity.partName == this.partName) {
                        e =
                            g[h].entity;
                        break
                    } e = new ig.GUI.ARBox(e, this.text.toString(), f, this.mode, this.color);
            ig.gui.addGuiElement(e);
            if (this.hideOutsideOfScreen) e.hideOutsideOfScreen = true;
            this.varFill && e.setVarFill(this.varFill, ig.Event.getExpressionValue(this.varFillMax), c);
            e.setAttachedEntity(c)
        }
    });
    ig.EVENT_STEP.CLEAR_AR_MSG = ig.EventStepBase.extend({
        entity: null,
        _wm: new ig.Config({
            attributes: {
                entity: {
                    _type: "Entity",
                    _info: "Entity to show AR Message on"
                }
            },
            width: 400
        }),
        init: function(a) {
            this.entity = a.entity
        },
        start: function(a,
            d) {
            ig.Event.getEntity(this.entity, d).clearEntityAttached(b)
        }
    });
    ig.ACTION_STEP.SHOW_AR_MSG = ig.ActionStepBase.extend({
        text: null,
        time: null,
        mode: false,
        color: null,
        actionDetached: false,
        partName: null,
        varFill: null,
        varFillMax: null,
        _wm: new ig.Config({
            attributes: {
                text: {
                    _type: "LangLabel",
                    _info: "AR Text to display"
                },
                time: {
                    _type: "NumberExpression",
                    _info: "Time in seconds the message should be visible. 0 = forever"
                },
                mode: {
                    _type: "String",
                    _info: "Mode of AR display.",
                    _select: sc.AR_BOX_MODE
                },
                color: {
                    _type: "String",
                    _info: "Color of AR display.",
                    _select: sc.AR_COLOR
                },
                actionDetached: {
                    _type: "Boolean",
                    _info: "If true, keep Message even after action is finished or canceled"
                },
                hideOutsideOfScreen: {
                    _type: "Boolean",
                    _info: "If defined: don't show offscreen-msg"
                },
                partName: {
                    _type: "String",
                    _info: "If provided: Show AR display to sub part of entity",
                    _optional: true
                },
                tracker: {
                    _type: "TrackerRef",
                    _info: "If defined: bind time value of AR message to enemy tracker",
                    _optional: true
                },
                varFill: {
                    _type: "VarName",
                    _info: "Filling of AR Message depends on value of variable",
                    _optional: true
                },
                varFillMax: {
                    _type: "NumberExpression",
                    _info: "Maximum Number of variable to fill bar",
                    _optional: true
                }
            }
        }),
        init: function(a) {
            this.text = new ig.LangLabel(a.text);
            this.time = a.time;
            this.mode = sc.AR_BOX_MODE[a.mode];
            this.color = sc.AR_COLOR[a.color];
            this.actionDetached = a.actionDetached || false;
            this.hideOutsideOfScreen = a.hideOutsideOfScreen || false;
            this.partName = a.partName;
            this.tracker = a.tracker || null;
            this.varFill = a.varFill;
            this.varFillMax = a.varFillMax
        },
        start: function(a) {
            var b = a;
            if (this.partName)
                for (var c =
                        a.coll.subColls, e = c.length; e--;)
                    if (c[e].entity.partName == this.partName) {
                        b = c[e].entity;
                        break
                    } c = ig.Event.getExpressionValue(this.time);
            b = new ig.GUI.ARBox(b, this.text.toString(), c, this.mode, this.color);
            this.tracker ? b.setTracker(this.tracker) : this.varFill && b.setVarFill(this.varFill, ig.Event.getExpressionValue(this.varFillMax), a);
            ig.gui.addGuiElement(b);
            this.actionDetached || a.addActionAttached(b);
            if (this.hideOutsideOfScreen) b.hideOutsideOfScreen = true;
            b.setAttachedEntity(a)
        }
    });
    ig.ACTION_STEP.CLEAR_AR_MSG =
        ig.ActionStepBase.extend({
            _wm: new ig.Config({
                attributes: {}
            }),
            init: function() {},
            start: function(a) {
                a.clearEntityAttached(b)
            }
        })
});
ig.baked = !0;

/**
 * game.feature.ar.ar-steps
 * ========================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.ar.ar-steps")`.
 *
 * AR event/action steps:
 *   - SHOW_AR_MSG (event + action): spawns an ARBox on an entity
 *   - CLEAR_AR_MSG (event + action): removes all AR boxes from an entity
 */
ig.module("game.feature.ar.ar-steps").requires(
    "impact.base.action",
    "impact.base.event",
    "game.feature.ar.gui.ar-box"
).defines(function () {

    function isARBox(obj) {
        return obj instanceof ig.GUI.ARBox;
    }

    /* ── Event steps ─────────────────────────────────────────────── */

    ig.EVENT_STEP.SHOW_AR_MSG = ig.EventStepBase.extend({
        entity: null, text: null, time: null,
        mode: false, color: null, partName: null,
        varFill: null, varFillMax: null,
        _wm: new ig.Config({
            attributes: {
                entity: { _type: "Entity", _info: "Entity to show AR Message on" },
                text: { _type: "LangLabel", _info: "AR Text to display" },
                time: { _type: "NumberExpression", _info: "Time in seconds. 0 = forever" },
                mode: { _type: "String", _info: "Mode of AR display.", _select: sc.AR_BOX_MODE },
                color: { _type: "String", _info: "Color of AR display.", _select: sc.AR_COLOR },
                hideOutsideOfScreen: { _type: "Boolean", _info: "If defined: don't show offscreen-msg" },
                partName: { _type: "String", _info: "Show AR to sub part of entity", _optional: true },
                varFill: { _type: "VarName", _info: "Fill depends on variable value", _optional: true },
                varFillMax: { _type: "NumberExpression", _info: "Max fill value", _optional: true }
            },
            width: 400
        }),
        init: function (data) {
            this.entity = data.entity;
            this.text = new ig.LangLabel(data.text);
            this.time = data.time;
            this.mode = sc.AR_BOX_MODE[data.mode];
            this.color = sc.AR_COLOR[data.color];
            this.partName = data.partName;
            this.varFill = data.varFill;
            this.varFillMax = data.varFillMax;
        },
        start: function (data, event) {
            var entity = ig.Event.getEntity(this.entity, event);
            var target = entity;
            var duration = ig.Event.getExpressionValue(this.time);

            if (this.partName) {
                for (var i = entity.coll.subColls.length; i--;) {
                    if (entity.coll.subColls[i].entity.partName == this.partName) {
                        target = entity.coll.subColls[i].entity;
                        break;
                    }
                }
            }

            var box = new ig.GUI.ARBox(target, this.text.toString(), duration, this.mode, this.color);
            ig.gui.addGuiElement(box);
            if (this.hideOutsideOfScreen) box.hideOutsideOfScreen = true;
            this.varFill && box.setVarFill(this.varFill, ig.Event.getExpressionValue(this.varFillMax), entity);
            box.setAttachedEntity(entity);
        }
    });

    ig.EVENT_STEP.CLEAR_AR_MSG = ig.EventStepBase.extend({
        entity: null,
        _wm: new ig.Config({
            attributes: { entity: { _type: "Entity", _info: "Entity to clear AR from" } },
            width: 400
        }),
        init: function (data) { this.entity = data.entity; },
        start: function (data, event) {
            ig.Event.getEntity(this.entity, event).clearEntityAttached(isARBox);
        }
    });

    /* ── Action steps ────────────────────────────────────────────── */

    ig.ACTION_STEP.SHOW_AR_MSG = ig.ActionStepBase.extend({
        text: null, time: null, mode: false, color: null,
        actionDetached: false, partName: null, varFill: null, varFillMax: null,
        _wm: new ig.Config({
            attributes: {
                text: { _type: "LangLabel", _info: "AR Text to display" },
                time: { _type: "NumberExpression", _info: "Time in seconds. 0 = forever" },
                mode: { _type: "String", _info: "Mode of AR display.", _select: sc.AR_BOX_MODE },
                color: { _type: "String", _info: "Color of AR display.", _select: sc.AR_COLOR },
                actionDetached: { _type: "Boolean", _info: "Keep even after action finishes" },
                hideOutsideOfScreen: { _type: "Boolean", _info: "If defined: don't show offscreen-msg" },
                partName: { _type: "String", _info: "Show AR to sub part", _optional: true },
                tracker: { _type: "TrackerRef", _info: "Bind time to enemy tracker", _optional: true },
                varFill: { _type: "VarName", _info: "Fill depends on variable", _optional: true },
                varFillMax: { _type: "NumberExpression", _info: "Max fill", _optional: true }
            }
        }),
        init: function (data) {
            this.text = new ig.LangLabel(data.text);
            this.time = data.time;
            this.mode = sc.AR_BOX_MODE[data.mode];
            this.color = sc.AR_COLOR[data.color];
            this.actionDetached = data.actionDetached || false;
            this.hideOutsideOfScreen = data.hideOutsideOfScreen || false;
            this.partName = data.partName;
            this.tracker = data.tracker || null;
            this.varFill = data.varFill;
            this.varFillMax = data.varFillMax;
        },
        start: function (entity) {
            var target = entity;
            if (this.partName) {
                for (var i = entity.coll.subColls.length; i--;) {
                    if (entity.coll.subColls[i].entity.partName == this.partName) {
                        target = entity.coll.subColls[i].entity;
                        break;
                    }
                }
            }
            var duration = ig.Event.getExpressionValue(this.time);
            var box = new ig.GUI.ARBox(target, this.text.toString(), duration, this.mode, this.color);
            if (this.tracker) {
                box.setTracker(this.tracker);
            } else if (this.varFill) {
                box.setVarFill(this.varFill, ig.Event.getExpressionValue(this.varFillMax), entity);
            }
            ig.gui.addGuiElement(box);
            if (!this.actionDetached) entity.addActionAttached(box);
            if (this.hideOutsideOfScreen) box.hideOutsideOfScreen = true;
            box.setAttachedEntity(entity);
        }
    });

    ig.ACTION_STEP.CLEAR_AR_MSG = ig.ActionStepBase.extend({
        _wm: new ig.Config({ attributes: {} }),
        init: function () {},
        start: function (entity) { entity.clearEntityAttached(isARBox); }
    });
});
ig.baked = !0;
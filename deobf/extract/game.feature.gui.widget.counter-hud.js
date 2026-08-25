ig.module("game.feature.gui.widget.counter-hud").requires("game.feature.gui.hud.right-hud", "impact.feature.gui.base.basic-gui", "impact.base.image").defines(function() {
    ig.GUI.CounterHud = sc.RightHudBoxGui.extend({
        maxCount: 0,
        currentCount: 0,
        variable: null,
        zIndex: 101,
        _wm: new ig.Config({
            width: 500,
            attributes: {
                taskTitle: {
                    _type: "LangLabel",
                    _info: "Text to describe task"
                },
                maxCount: {
                    _type: "NumberExpression",
                    _info: "Maximum count to reach"
                },
                variable: {
                    _type: "VarName",
                    _info: "Variable that stores current hit count"
                }
            }
        }),
        maxNumberGui: null,
        init: function(b) {
            this.parent(new ig.LangLabel(b.taskTitle));
            this.maxCount = b.maxCount;
            this.variable = b.variable;
            this.currentCount = ig.vars.get(this.variable);
            this.maxNumberGui = new sc.MaxNumberGui(ig.Event.getExpressionValue(this.maxCount), 0);
            this.maxNumberGui.setNumber(this.currentCount);
            this.pushContent(this.maxNumberGui, true)
        },
        varsChanged: function() {
            this.updateNumber()
        },
        updateNumber: function() {
            var b = ig.Event.getExpressionValue(this.maxCount);
            b != this.maxNumberGui.getMaxNumber && this.maxNumberGui.setMaxNumber(b);
            if (b > 0) {
                b = ig.vars.get(this.variable);
                if (b != this.currentCount) {
                    this.currentCount = b;
                    this.maxNumberGui.setNumber(this.currentCount)
                }
            }
        },
        remove: function() {
            sc.Model.removeObserver(sc.model, this);
            this.parent()
        },
        modelChanged: function(b, a) {
            if (a == sc.GAME_MODEL_MSG.SUB_STATE_CHANGED || a == sc.GAME_MODEL_MSG.STATE_CHANGED) b.isQuickMenu() || b.isCutscene() ? this.hide() : this.show()
        },
        onSpawn: function() {
            sc.Model.addObserver(sc.model, this);
            this.updateNumber()
        }
    });
    ig.GUI.CounterHud.spawnHandler = function(b) {
        sc.gui.rightHudPanel.addHudBoxBefore(b,
            sc.gui.moneyHud);
        b.onSpawn && b.onSpawn();
        b.show()
    };
    ig.GUI.ScoreHud = sc.RightHudBoxGui.extend({
        currentCount: 0,
        variable: null,
        zIndex: 101,
        _wm: new ig.Config({
            width: 500,
            attributes: {
                taskTitle: {
                    _type: "LangLabel",
                    _info: "Text to describe score"
                },
                variable: {
                    _type: "VarName",
                    _info: "Variable that stores value"
                },
                maxValue: {
                    _type: "Number",
                    _info: "Max Number to display (value can still be higher)"
                },
                time: {
                    _type: "Number",
                    _info: "Transition time for the score value when counting up and down",
                    _optional: true,
                    _default: 0.2
                },
                signed: {
                    _type: "Boolean",
                    _info: "If true, also allow negative numbers",
                    _optional: true,
                    _default: true
                },
                useDots: {
                    _type: "Boolean",
                    _info: "If true, use dots every 3 digits of the number",
                    _optional: true,
                    _default: true
                }
            }
        }),
        numberGui: null,
        _cutscene: false,
        init: function(b) {
            this.parent(new ig.LangLabel(b.taskTitle));
            this.variable = b.variable;
            this._cutscene = b.cutsceneOkay || false;
            this.currentCount = ig.vars.get(this.variable);
            this.numberGui = new sc.NumberGui(b.maxValue || 9999999, {
                transitionTime: b.time || 0,
                signed: b.signed || false,
                dots: b.useDots ||
                    false
            });
            this.numberGui.setNumber(this.currentCount);
            this.pushContent(this.numberGui, true)
        },
        varsChanged: function() {
            var b = ig.vars.get(this.variable);
            if (b != this.currentCount) {
                this.currentCount = b;
                this.numberGui.setNumber(this.currentCount)
            }
        },
        remove: function() {
            sc.Model.removeObserver(sc.model, this);
            this.parent()
        },
        modelChanged: function(b, a) {
            if (a == sc.GAME_MODEL_MSG.SUB_STATE_CHANGED || a == sc.GAME_MODEL_MSG.STATE_CHANGED) b.isQuickMenu() || b.isCutscene() ? this._cutscene ? this.show() : this.hide() : this.show()
        },
        onSpawn: function() {
            sc.Model.addObserver(sc.model,
                this)
        }
    });
    ig.GUI.ScoreHud.spawnHandler = function(b) {
        sc.gui.rightHudPanel.addHudBoxBefore(b, sc.gui.moneyHud);
        b.onSpawn && b.onSpawn();
        b.show()
    }
});
ig.baked = !0;

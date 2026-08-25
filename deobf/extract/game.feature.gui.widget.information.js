ig.module("game.feature.gui.widget.information").requires("game.feature.gui.base.boxes", "impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.base.image", "impact.base.lang", "game.feature.gui.base.boxes").defines(function() {
    ig.GUI.Information = sc.SideBoxGui.extend({
        text: null,
        altText: null,
        altCondition: null,
        _wm: new ig.Config({
            width: 500,
            attributes: {
                text: {
                    _type: "LangLabel",
                    _info: "Text to display in information.",
                    _large: true
                },
                altText: {
                    _type: "LangLabel",
                    _info: "Alternative text to display",
                    _large: true,
                    _optional: true
                },
                altCondition: {
                    _type: "VarCondition",
                    _info: "Condition for alternative text",
                    _default: "false"
                }
            }
        }),
        useAltText: false,
        textGui: null,
        hidden: false,
        init: function(b) {
            this.parent(true, ig.lang.get("sc.gui.information.title"));
            this.hook.zIndex = 99;
            this.hook.pauseGui = true;
            this.text = new ig.LangLabel(b.text);
            if (b.altText) {
                this.altText = new ig.LangLabel(b.altText);
                this.altCondition = new ig.VarCondition(b.altCondition)
            }
            this.textGui = new sc.TextGui(this.text, {
                maxWidth: 200
            });
            this.pushContent(this.textGui);
            this.updateText();
            this.setPos(0, 3);
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM)
        },
        onAttach: function() {
            sc.Model.addObserver(sc.model, this);
            this.show()
        },
        onDetach: function() {
            sc.Model.removeObserver(sc.model, this)
        },
        updateText: function() {
            if (this.altCondition && this.altCondition.evaluate() != this.useAltText) {
                this.useAltText = !this.useAltText;
                this.textGui.setText(this.useAltText ? this.altText : this.text);
                this.replaceContent(0, this.textGui);
                this.hide(true);
                this.show()
            }
        },
        modelChanged: function(b, a) {
            if (a ==
                sc.GAME_MODEL_MSG.STATE_CHANGED || a == sc.GAME_MODEL_MSG.SUB_STATE_CHANGED) !this.hidden && b.isGame() && !b.isPaused() && !b.isMenu() && !b.isQuickMenu() && !b.isLevelUp() && !b.isQuestSolved() ? this.show() : this.hide()
        },
        varsChanged: function() {
            this.updateText()
        },
        remove: function() {
            this.parent()
        }
    })
});
ig.baked = !0;

ig.module("game.feature.gui.hud.task-hud").requires("game.feature.gui.hud.right-hud").defines(function() {
    sc.TaskHudBox = sc.RightHudBoxGui.extend({
        contentGui: null,
        addedSum: 0,
        timer: 0,
        init: function() {
            this.parent(ig.lang.get("sc.gui.task-hud.title"));
            this.contentGui = new sc.TextGui("", {
                bestRatio: 12,
                maxWidth: 240
            });
            this.pushContent(this.contentGui);
            sc.Model.addObserver(sc.model, this)
        },
        update: function() {
            if (!ig.game.paused && !this.hidden && !sc.model.keepTaskDisplayed && this.timer > 0) {
                this.timer = this.timer - ig.system.actualTick;
                this.timer <= 0 && this.hide()
            }
        },
        modelChanged: function(b, a) {
            if (b == sc.model) {
                var d = b.currentTask || b.permaTask || "";
                if (a == sc.GAME_MODEL_MSG.TASK_CHANGED) {
                    b.currentTask && !this.hidden && this.hide(true);
                    if (b.currentTask) {
                        this.contentGui.setText(d);
                        this.replaceContent(0, this.contentGui);
                        this.show();
                        this.timer = b.taskTimer != void 0 && b.taskTimer >= 0 ? b.taskTimer : 7;
                        this.timer <= 0 && this.hide()
                    } else {
                        this.timer = 0;
                        this.hide()
                    }
                } else if (a == sc.GAME_MODEL_MSG.PERMA_TASK_CHANGED) {
                    this.contentGui.setText(d);
                    this.replaceContent(0,
                        this.contentGui)
                } else if (a == sc.GAME_MODEL_MSG.SUB_STATE_CHANGED)
                    if (b.isPaused() && d) {
                        this.contentGui.setText(d);
                        this.replaceContent(0, this.contentGui);
                        this.show()
                    } else if ((b.isMenu() || b.isQuickMenu()) && d) this.hide();
                else if (!b.keepTaskDisplayed && b.isCutscene()) this.hide();
                else if (d && (this.timer > 0 || b.keepTaskDisplayed)) {
                    this.contentGui.setText(d);
                    this.replaceContent(0, this.contentGui);
                    this.show()
                } else this.hide();
                else if (a == sc.GAME_MODEL_MSG.STATE_CHANGED && b.isTitle()) this.timer = 0
            }
        }
    })
});
ig.baked = !0;

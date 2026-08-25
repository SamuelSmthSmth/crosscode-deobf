ig.module("game.feature.gui.hud.landmark-hud").requires("game.feature.gui.hud.right-hud", "game.feature.menu.gui.quests.quest-entries", "game.feature.model.options-model").defines(function() {
    sc.LandmarkEntry = ig.GuiElementBase.extend({
        timer: 0,
        id: null,
        textGui: null,
        init: function(b, a) {
            this.parent();
            this.id = b || null;
            this.timer = 5;
            var d = ig.lang.get("sc.gui.landmark-hud.landmark") + " \\c[3]" + sc.map.getLandmarkName(b, a) + "\\c[0] " + ig.lang.get("sc.gui.landmark-hud.unlocked") + "!";
            this.textGui = new sc.TextGui(d, {
                font: sc.fontsystem.tinyFont,
                maxWidth: 180
            });
            this.addChildGui(this.textGui);
            this.setSize(this.textGui.hook.size.x, this.textGui.hook.size.y)
        },
        updateTimer: function() {
            if (this.timer > 0) this.timer = this.timer - ig.system.tick
        }
    });
    sc.LandmarkHud = sc.RightHudBoxGui.extend({
        delayedStack: [],
        init: function() {
            this.parent(ig.lang.get("sc.gui.landmark-hud.title"));
            sc.Model.addObserver(sc.model, this);
            sc.Model.addObserver(sc.map, this)
        },
        addEntry: function(b, a) {
            var d = null;
            if ((d = this._isInEntries(b)) != null) d.timer = 5;
            else {
                d = new sc.LandmarkEntry(b, a);
                this.contentEntries.length >=
                    3 ? this.delayedStack.push(d) : this.pushContent(d, !sc.model.isCutscene());
                this.hidden && !sc.model.isCutscene() && this.show()
            }
        },
        _isInEntries: function(b) {
            for (var a = this.contentEntries.length; a--;)
                if (this.contentEntries[a].subGui.id == b) return this.contentEntries[a].subGui;
            for (a = this.delayedStack.length; a--;)
                if (this.delayedStack[a].id == b) return this.delayedStack[a];
            return null
        },
        _popDelayed: function() {
            if (this.delayedStack.length != 0) {
                var b = this.delayedStack.splice(0, 1)[0];
                this.pushContent(b, true)
            }
        },
        update: function() {
            if (!sc.model.isPaused() &&
                !sc.model.isMenu() && !this.hidden) {
                for (var b = this.contentEntries.length, a = null; b--;) {
                    a = this.contentEntries[b].subGui;
                    a.updateTimer();
                    if (a.timer <= 0) {
                        a = this.removeContent(b);
                        if (b == 0 && this.contentEntries.length == 0) a.hook.pivot.y = a.hook.size.y / 2;
                        else {
                            a.hook.pivot.y = 0;
                            a.hook.anim.timeFunction = KEY_SPLINES.EASE_OUT
                        }
                        this._popDelayed()
                    }
                }!this.hidden && this.contentEntries.length == 0 && this.hide()
            }
        },
        modelChanged: function(b, a, d) {
            if (b == sc.model)
                if (b.isReset()) {
                    this.clearContent();
                    this.hide()
                } else b.isCutscene() ||
                    b.isHUDBlocked() || sc.quests.hasQuestSolvedDialogs() ? this.hide() : !b.isCutscene() && (!b.isHUDBlocked() && this.contentEntries.length > 0 && !sc.quests.hasQuestSolvedDialogs()) && this.show();
            else b == sc.map && a == sc.MAP_EVENT.LANDMARK_ADDED && d && d.landmark && d.area && sc.options.get("update-landmark-style") == sc.UPDATE_LANDMARK_STYLE.SMALL && this.addEntry(d.landmark, d.area)
        }
    })
});
ig.baked = !0;

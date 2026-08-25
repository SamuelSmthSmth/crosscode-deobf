ig.module("game.feature.gui.hud.lore-hud").requires("game.feature.gui.hud.right-hud", "game.feature.menu.lore-model").defines(function() {
    sc.LoreUpdateEntry = ig.GuiElementBase.extend({
        timer: 0,
        textGui: null,
        init: function(b) {
            this.parent();
            this.timer = 5;
            var a = "\\c[3]" + sc.lore.getLoreTitle(b.lore) + "\\c[0] ",
                a = b.updated ? a + ig.lang.get("sc.gui.lore-hud.updated") : a + ig.lang.get("sc.gui.lore-hud.unlocked");
            this.textGui = new sc.TextGui(a, {
                font: sc.fontsystem.tinyFont
            });
            this.addChildGui(this.textGui);
            this.setSize(this.textGui.hook.size.x,
                this.textGui.hook.size.y)
        },
        updateTimer: function() {
            if (this.timer > 0) this.timer = this.timer - ig.system.tick
        }
    });
    sc.LoreUpdateHud = sc.RightHudBoxGui.extend({
        delayedStack: [],
        init: function() {
            this.parent(ig.lang.get("sc.gui.lore-hud.title"));
            sc.Model.addObserver(sc.model, this);
            sc.Model.addObserver(sc.lore, this)
        },
        addEntry: function(b) {
            b = new sc.LoreUpdateEntry(b);
            this.contentEntries.length >= 3 ? this.delayedStack.push(b) : this.pushContent(b, !sc.model.isCutscene());
            this.hidden && !sc.model.isCutscene() && this.show()
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
            if (!sc.model.isPaused() && !sc.model.isMenu() && !this.hidden) {
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
                } else b.isCutscene() || b.isHUDBlocked() || sc.quests.hasQuestSolvedDialogs() ? this.hide() : !b.isCutscene() && (!b.isHUDBlocked() && this.contentEntries.length >
                    0 && !sc.quests.hasQuestSolvedDialogs()) && this.show();
            else b == sc.lore && (a == sc.LORE_EVENT.UNLOCKED && sc.options.get("update-lore-style") == sc.UPDATE_LORE_STYLE.SMALL && d) && this.addEntry(d)
        }
    })
});
ig.baked = !0;

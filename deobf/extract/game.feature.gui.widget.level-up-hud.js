ig.module("game.feature.gui.widget.level-up-hud").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.gui.base.boxes", "impact.base.image").defines(function() {
    var b = ["level", "cp", "hp", "attack", "defense", "focus"];
    sc.LevelUpContentGui = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/status-gui.png"),
        arrowTimer: 0,
        init: function() {
            this.parent();
            this.setSize(136, 20)
        },
        update: function() {
            if (this.arrowTimer < 1.5) {
                this.arrowTimer = this.arrowTimer + ig.system.actualTick;
                if (this.arrowTimer >
                    1.5) this.arrowTimer = 1.5
            }
        },
        updateDrawables: function(a) {
            a.addGfx(this.gfx, 1, 0, 0, 192, 112, 20);
            var b = this.arrowTimer / 1.5,
                b = KEY_SPLINES.EASE_OUT.get(b),
                b = b * 12 % 1,
                c = 0,
                c = 0,
                e = 20,
                c = Math.round(b * 20);
            (e = e - c) && a.addGfx(this.gfx, 113, 0, 112, 192 + c, 23, e);
            e = 20;
            c = Math.round((1 - b) * 20);
            (e = e - c) && a.addGfx(this.gfx, 113, c, 112, 192, 23, e)
        }
    });
    sc.LevelUpSideStatsGui = sc.SideBoxGui.extend({
        deltaValues: null,
        init: function(a) {
            this.parent(true, ig.lang.get("sc.gui.levelup.title"));
            this.hook.zIndex = 99;
            this.hook.pauseGui = true;
            this.deltaValues =
                a.deltaValues;
            for (var a = 178, d = b.length; d--;) this.deltaValues[b[d]] || (a = a + 22);
            this.setPos(0, a);
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.show()
        },
        addDeltaEntry: function(a) {
            if (!this.deltaValues[a]) return false;
            var b = ig.lang.get("sc.gui.levelup." + a),
                c = Math.min(0.5, this.deltaValues[a] * 0.07),
                b = new sc.LabeledNumberGuy(b, 60, 9999, {
                    signed: true,
                    showPlus: true,
                    transitionTime: c
                });
            b.setNumber(this.deltaValues[a], false);
            this.pushContent(b, true);
            return true
        }
    });
    ig.GUI.LevelUpHud = ig.SimpleGui.extend({
        transitions: {
            DEFAULT: {
                state: {
                    alpha: 1
                },
                time: 0.5,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            HIDDEN: {
                state: {
                    alpha: 1
                },
                time: 0.5,
                timeFunction: KEY_SPLINES.EASE_IN
            }
        },
        screenInteract: null,
        currentEntry: 0,
        timer: 0,
        sideStatGui: null,
        lineBox: null,
        init: function(a) {
            this.parent(true, ig.lang.get("sc.gui.levelup.title"));
            this.setSize(ig.system.width, ig.system.height);
            this.sideStatGui = new sc.LevelUpSideStatsGui(a);
            this.addChildGui(this.sideStatGui);
            a = new sc.LevelUpContentGui;
            this.lineBox = new sc.LineBoxGui(a, 32);
            this.lineBox.setPos(0, 100);
            this.addChildGui(this.lineBox);
            this.screenInteract = new sc.ScreenInteractEntry(this);
            ig.interact.addEntry(this.screenInteract);
            ig.vars.set("tmp._levelUpFinished", false)
        },
        update: function() {
            if (this.currentEntry < b.length) {
                this.timer = this.timer - ig.system.actualTick;
                if (this.timer <= 0) {
                    do {
                        var a = this.sideStatGui.addDeltaEntry(b[this.currentEntry]);
                        this.currentEntry++
                    } while (this.currentEntry < b.length && !a);
                    this.timer = 0.5
                }
            }
        },
        onInteraction: function() {
            if (this.currentEntry < b.length) this.timer = 0;
            else {
                ig.vars.set("tmp._levelUpFinished", true);
                ig.interact.removeEntry(this.screenInteract);
                this.remove()
            }
        },
        remove: function() {
            this.lineBox.doStateTransition("HIDDEN", false, true);
            this.sideStatGui.remove();
            this.doStateTransition("HIDDEN", false, true)
        }
    })
});
ig.baked = !0;

ig.module("game.feature.gui.widget.demo-stats").requires("impact.base.event", "game.feature.gui.base.boxes", "game.feature.gui.base.numbers").defines(function() {
    function b(b) {
        return a(b / 60 / 60, 3) + ":" + a(Math.floor(b / 60) % 60, 2) + ":" + a(Math.floor(b) % 60, 2)
    }

    function a(a, b) {
        var e = "0000" + Math.floor(a);
        return e.length >= 4 + b ? Math.floor(a) : e.substr(e.length - b)
    }
    sc.DemoStatsStat = ig.GuiElementBase.extend({
        nameGui: null,
        valueGui: null,
        totalGui: null,
        name: null,
        value: null,
        updateCallback: null,
        init: function(a, b, e, f) {
            this.parent();
            this.hook.size.x = 200;
            this.hook.size.y = 20;
            this.nameGui = new sc.TextGui(ig.lang.get("sc.gui.stats." + a) + ":");
            this.nameGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
            this.nameGui.setPos(10, 0);
            this.addChildGui(this.nameGui);
            this.valueGui = new sc.TextGui(b + "");
            this.valueGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_CENTER);
            this.addChildGui(this.valueGui);
            e && this.addUpdater(e);
            f && this.addTotalNumber(f)
        },
        update: function() {
            this.updateCallback && this.updateCallback(this)
        },
        setValue: function(a) {
            this.valueGui.setText(a +
                "")
        },
        addUpdater: function(a) {
            this.updateCallback = a || null
        },
        addTotalNumber: function(a) {
            a = new sc.TextGui(" / " + a);
            a.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_CENTER);
            this.addChildGui(a);
            this.valueGui.setPos(a.hook.size.x + 5, 0)
        }
    });
    sc.DemoStats = ig.GuiElementBase.extend({
        transitions: {
            DEFAULT: {
                state: {
                    alpha: 1
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            HIDDEN: {
                state: {
                    alpha: 0
                },
                time: 0.3,
                timeFunction: KEY_SPLINES.EASE_IN
            }
        },
        bgColor: null,
        msgBox: null,
        content: null,
        callback: null,
        screenInteract: null,
        init: function(a) {
            this.parent();
            this.hook.localAlpha = 0.8;
            this.hook.zIndex = 90;
            this.hook.temporary = true;
            this.hook.size.x = ig.system.width;
            this.hook.size.y = ig.system.height;
            this.callback = a;
            this.screenInteract = new sc.ScreenInteractEntry(this);
            this.content = new ig.GuiElementBase;
            this.content.setSize(210, 160);
            this._createContent();
            this.msgBox = new sc.CenterBoxGui(this.content);
            this.msgBox.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.addChildGui(this.msgBox);
            this.doStateTransition("HIDDEN", true);
            this.doStateTransition("DEFAULT");
            ig.system.skipMode || ig.interact.addEntry(this.screenInteract)
        },
        update: function() {
            !this.hook.removeAfterTransition && ig.system.skipMode && this._close();
            this.parent()
        },
        updateDrawables: function(a) {
            a.addColor("#000", 0, 0, this.hook.size.x, this.hook.size.y)
        },
        onInteraction: function() {
            ig.interact.removeEntry(this.screenInteract);
            this._close()
        },
        _createContent: function() {
            var a = 2,
                c = new sc.TextGui(ig.lang.get("sc.gui.stats.stats"));
            c.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            c.setPos(0, a);
            this.content.addChildGui(c);
            a = a + (c.hook.size.y + 2);
            c = new sc.LineGui(200);
            c.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            c.setPos(0, a);
            this.content.addChildGui(c);
            a = this._createStatLine(a + 4, "time", b(sc.stats.getMap("player", "playtime")), function(a) {
                a.setValue(b(sc.stats.getMap("player", "playtime")))
            }.bind(this));
            c = sc.stats.getMap("chests", "autumn-area");
            a = this._createStatLine(a, "chests", c, null, Math.max(27, c));
            a = this._createStatLine(a, "level", sc.model.player.level || 0);
            a = this._createStatLine(a, "exp", sc.stats.getMap("player",
                "exp") || 0);
            a = this._createStatLine(a, "money", sc.stats.getMap("player", "money") || 0);
            a = this._createStatLine(a, "kills", sc.stats.getMap("combat", "totalKilled") || 0)
        },
        _createStatLine: function(a, b, e, f, g) {
            b = new sc.DemoStatsStat(b, e, f, g);
            b.setPos(0, a);
            this.content.addChildGui(b);
            return a + b.hook.size.y + 2
        },
        _close: function() {
            this.msgBox.doStateTransition("HIDDEN");
            this.doStateTransition("HIDDEN", false, true);
            this.callback && this.callback()
        }
    })
});
ig.baked = !0;

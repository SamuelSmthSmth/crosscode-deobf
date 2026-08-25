ig.module("game.feature.menu.gui.stats.stats-misc").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.save.save-misc", "game.feature.menu.gui.stats.stats-gui-builds").defines(function() {
    sc.StatsScrollPane = sc.ScrollPane.extend({
        contentPane: null,
        paddingTop: 1,
        init: function(b) {
            this.parent(sc.ScrollType.Y_ONLY);
            this.paddingTop = b == void 0 ? 1 : b;
            this.contentPane = new ig.GuiElementBase;
            this.setContent(this.contentPane)
        },
        update: function() {
            this.parent();
            if (this.isVisible() && (!this.onCheckScrollable || this.onCheckScrollable())) {
                sc.control.menuScrollUp() ? this.scrollY(-20) : sc.control.menuScrollDown() && this.scrollY(20);
                sc.control.downDown() ? this.scroll(200 * ig.system.tick) : sc.control.upDown() && this.scroll(-200 * ig.system.tick)
            }
        },
        setSize: function(b, a) {
            this.parent(b, a);
            this.contentPane.setSize(b, a)
        },
        scroll: function(b, a) {
            this.scrollY(b, a, 0.05)
        },
        addEntry: function(b, a) {
            var d = this.getContentHeight(this.contentPane.hook.children.length % 1 != 0) + 0;
            b.setPos(a, d);
            this.contentPane.addChildGui(b);
            this.setContentHeight(this.getContentHeight())
        },
        clear: function(b) {
            this.contentPane.removeAllChildren();
            this.contentPane.hook.size.y = 0;
            this.box.doScrollTransition(0, 0, 0);
            this.recalculateScrollBars(b)
        },
        setScrollY: function(b, a, d) {
            this._skipFirst = false;
            d || this.box.doScrollTransition(0, 0, 0);
            this.parent(b, a)
        },
        getContentHeight: function(b) {
            var a = this.contentPane.hook.children,
                d = a.length;
            b && (d = d - 1);
            for (b = 0; d--;) {
                b = b + (a[d].size.y + 0);
                d = d - 0;
                if (d < 0) break
            }
            return b + this.paddingTop
        },
        setContentHeight: function(b) {
            this.contentPane.hook.size.y =
                b;
            this.recalculateScrollBars()
        }
    });
    sc.StatPercentNumber = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        number: null,
        floating: null,
        color: 0,
        x: 528,
        smallPercent: false,
        init: function(b, a) {
            this.parent();
            this.smallPercent = a.smallPercent || false;
            this.floating = new sc.NumberGui(99, {
                size: a.size,
                leadingZeros: 2,
                scramble: a.scramble
            });
            this.floating.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.floating.setPos(9, 0);
            this.addChildGui(this.floating);
            this.number = new sc.NumberGui(null, a);
            this.number.setAlign(ig.GUI_ALIGN.X_RIGHT,
                ig.GUI_ALIGN.Y_TOP);
            this.number.setPos(this.floating.hook.size.x + 12, 0);
            this.addChildGui(this.number);
            if (!ig.LANG_DETAILS[ig.currentLang] || !ig.LANG_DETAILS[ig.currentLang].commaDigits) this.x = 548;
            this.setSize(this.number.hook.size.x + this.floating.hook.size.x + 12, this.number.hook.size.y)
        },
        setNumber: function(b, a) {
            var d = Math.floor(b * 100);
            this.number.setNumber(d, a);
            d = Math.floor(b * 1E4) % 100;
            this.floating.setNumber(d, a);
            this.setSize(this.number.hook.size.x + this.floating.hook.size.x + 12, this.number.hook.size.y)
        },
        setColor: function(b) {
            this.color = b || 0;
            this.number.setColor(this.color);
            this.floating.setColor(this.color)
        },
        updateDrawables: function(b) {
            this.smallPercent ? b.addGfx(this.gfx, this.hook.size.x - 8, 0, 440 + 8 * this.color, 440, 8, 8) : b.addGfx(this.gfx, this.hook.size.x - 8, 0, 512 + 9 * this.color, 192, 8, 10);
            b.addGfx(this.gfx, this.hook.size.x - 28, this.hook.size.y - 3, this.x + 4 * this.color, 184, 3, 5)
        }
    })
});
ig.baked = !0;

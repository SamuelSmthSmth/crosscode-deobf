ig.module("game.feature.credits.gui.credits-gui").requires("game.feature.gui.base.boxes", "impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.base.image", "impact.base.lang", "game.feature.gui.base.boxes", "game.feature.credits.credit-loadable", "game.feature.gui.base.text").defines(function() {
    ig.GUI.CreditSection = ig.GuiElementBase.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        credits: null,
        imageContent: null,
        content: null,
        contentWidth: 0,
        finished: false,
        isOffscreen: false,
        triggers: {},
        init: function(b) {
            this.parent();
            this.setSize(ig.system.width, ig.system.height);
            this.hook.zIndex = 99;
            this.hook.clip = true;
            this.credits = b;
            this.contentWidth = ig.system.width - (this.credits.data.border || 64) * 2;
            this.content = new ig.GuiElementBase;
            this.content.setSize(this.contentWidth, ig.system.height);
            this.imageContent = new ig.GuiElementBase;
            this.imageContent.setSize(ig.system.width, ig.system.height);
            this.addChildGui(this.imageContent);
            this.addChildGui(this.content);
            this.doStateTransition("HIDDEN", true)
        },
        update: function() {
            var b = this.content.hook.pos.y,
                b = b + -30 * ig.system.actualTick * sc.credits.speed;
            if (!this.finished && b <= -this.content.hook.size.y + ig.system.height) this.finished = true;
            if (this.finished && b <= -this.content.hook.size.y) {
                this.isOffscreen = true;
                this.remove()
            }
            this.content.hook.pos.y = b
        },
        onAttach: function() {
            this.createSection();
            this.doStateTransition("DEFAULT", true)
        },
        onDetach: function() {},
        varsChanged: function() {},
        remove: function() {
            this.doStateTransition("HIDDEN",
                true, true)
        },
        createSection: function() {
            var b = this.credits.data;
            this.content.setPos(this.getAlignPos(b.align), ig.system.height);
            var b = b.entries,
                a = Vec2.createC(),
                d;
            for (d in b) {
                var c = b[d];
                if (c.key == "BASE") {
                    var e = c.names;
                    c.hideHeader || this.createHeader(c.header, a, e.length == 0);
                    if (e.length > 0) {
                        var f = c.columns,
                            g = this.createColumnGuis(f, a);
                        this.createNames(e, f, g, a);
                        a.y = a.y + (c.bottomPad || 60)
                    } else a.y = a.y + (c.bottomPad || 30)
                } else c.key == "IMAGE" ? this.createImage(c, a) : c.key == "TRIGGER" && this.createTrigger(c.name, a)
            }
            this.content.hook.size.y =
                a.y
        },
        createImage: function(b, a) {
            var d = b.image,
                c = new ig.GuiElementBase;
            c.setAlign(ig.GUI_ALIGN_X[b.alignX || "CENTER"], ig.GUI_ALIGN.Y_TOP);
            c.setPos(0, a.y);
            if (d) {
                var d = new ig.ImageGui(new ig.Image(d.src), d.offX, d.offY, d.width, d.height),
                    e = b.offset ? b.offset.x : 0,
                    f = b.top != void 0 ? b.top : 0,
                    f = f + (b.offset ? b.offset.y : 0);
                d.setPos(e, f);
                c.addChildGui(d);
                c.setSize(d.hook.size.x, d.hook.pos.y + d.hook.size.y + (b.bottom != void 0 ? b.bottom : 100))
            } else c.setSize(2, (b.top != void 0 ? b.top : 0) + (b.bottom != void 0 ? b.bottom : 100));
            this.content.addChildGui(c);
            a.y = a.y + c.hook.size.y
        },
        createHeader: function(b, a, d) {
            var c = new sc.TextGui(ig.LangLabel.getText(b), {
                maxWidth: this.contentWidth
            });
            c.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.4,
                    timeFunction: KEY_SPLINES.EASE_OUT
                },
                HIDDEN: {
                    state: {
                        scaleY: 1E-4
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            c.onVisibilityChange = function() {
                c.isVisible() ? c.doStateTransition("DEFAULT", false, false, null, 1.2 / sc.credits.speed) : c.doStateTransition("HIDDEN", true)
            }.bind(this);
            c.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            c.setPos(0,
                a.y);
            c.doStateTransition("HIDDEN", true);
            this.content.addChildGui(c);
            a.y = a.y + c.hook.size.y;
            if (!d) {
                var e = new sc.LineGui(c.hook.size.x + 10);
                e.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
                e.setPos(0, a.y);
                e.hook.transitions = {
                    HIDDEN: {
                        state: {
                            scaleX: 1E-5
                        },
                        time: 0,
                        timeFunction: KEY_SPLINES.LINEAR
                    },
                    DEFAULT: {
                        state: {
                            scaleX: 1
                        },
                        time: 1,
                        timeFunction: KEY_SPLINES.EASE_OUT
                    }
                };
                e.onVisibilityChange = function() {
                    e.isVisible() ? e.doStateTransition("DEFAULT", false, false, null, 1.2 / sc.credits.speed) : e.doStateTransition("HIDDEN",
                        true)
                }.bind(this);
                e.doStateTransition("HIDDEN", true);
                this.content.addChildGui(e);
                a.y = a.y + (e.hook.size.y + 2)
            }
        },
        createColumnGuis: function(b, a) {
            var d = 0,
                c = Math.floor((this.contentWidth - 16 * (b - 1)) / b),
                e = new ig.GuiElementBase;
            e.setPos(0, a.y);
            e.setSize(this.contentWidth, 20);
            var f = [];
            f.push(e);
            for (var g = 0; g < b; g++) {
                var h = new ig.GuiElementBase;
                h.onVisibilityChange = function() {
                    if (this.isVisible())
                        for (var a = this.hook.children, b = 0; b < a.length; b++) {
                            a[b].doStateTransition("HIDDEN", true);
                            a[b].doStateTransition("DEFAULT",
                                false, false, null, (1 + 0.6 * b) / sc.credits.speed)
                        }
                };
                h.setPos(d, 0);
                h.setSize(c, 20);
                e.addChildGui(h);
                d = d + (c + 16);
                f.push(h)
            }
            this.content.addChildGui(e);
            return f
        },
        createNames: function(b, a, d, c) {
            for (var e = 1, f = Math.floor((this.contentWidth - 16 * (a - 1)) / a), g = 0, h = 0, i = 0; i < b.length; i++) {
                var j = new sc.TextGui(ig.LangLabel.getText(b[i]), {
                    maxWidth: f,
                    linePadding: -1
                });
                j.hook.transitions = {
                    DEFAULT: {
                        state: {},
                        time: 1,
                        timeFunction: KEY_SPLINES.LINEAR
                    },
                    HIDDEN: {
                        state: {
                            alpha: 0
                        },
                        time: 0.2,
                        timeFunction: KEY_SPLINES.LINEAR
                    }
                };
                if (a > 1)
                    if (e ==
                        1) {
                        j.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
                        j.setTextAlign(ig.Font.ALIGN.RIGHT)
                    } else if (e >= a) {
                    j.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
                    j.setTextAlign(ig.Font.ALIGN.LEFT)
                } else {
                    j.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
                    j.setTextAlign(ig.Font.ALIGN.CENTER)
                } else j.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
                j.setTextAlign(ig.Font.ALIGN.CENTER);
                j.setPos(0, h);
                j.hook.size.y + 2 > g && (g = j.hook.size.y + 2);
                d[e].addChildGui(j);
                e++;
                if (e > a) {
                    e = 1;
                    h = h + g;
                    g = 0
                } else i == b.length - 1 && (h =
                    h + g)
            }
            for (b = d.length; b--;) d[b].hook.size.y = h;
            c.y = c.y + h
        },
        createTrigger: function(b, a) {
            var d = new ig.GuiElementBase;
            d.setPos(0, a.y);
            d.setSize(2, 2);
            d.onVisibilityChange = function() {
                if (d.isVisible()) d.skipFirst ? this.triggers[b] = true : d.skipFirst = true
            }.bind(this);
            this.content.addChildGui(d)
        },
        getAlignPos: function(b) {
            var a = 0;
            b == "CENTER" ? a = ig.system.width / 2 - this.content.hook.size.x / 2 : b == "RIGHT" && (a = 128);
            return a
        }
    })
});
ig.baked = !0;

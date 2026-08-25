ig.module("game.feature.gui.base.boxes").requires("impact.feature.gui.base.box", "impact.feature.gui.gui").defines(function() {
    sc.RegularBoxGui = ig.BoxGui.extend({
        ninepatch: new ig.NinePatch("media/gui/message.png", {
            width: 16,
            height: 16,
            left: 8,
            top: 16,
            right: 8,
            bottom: 8,
            offsets: {
                "default": {
                    x: 0,
                    y: 0
                }
            }
        }),
        PADDING_X: 8,
        PADDING_Y: 4,
        init: function(a) {
            this.parent(0, 0, a, this.ninepatch);
            this.hook.pivot.x = this.hook.size.x / 2;
            this.hook.pivot.y = this.hook.size.y / 2
        },
        setContent: function(a) {
            this.setSize(a.hook.size.x + this.PADDING_X *
                2, a.hook.size.y + this.PADDING_Y * 2);
            this.addChildGui(a);
            a.setPos(this.PADDING_X, this.PADDING_Y)
        }
    });
    sc.WhiteLineBox = ig.BoxGui.extend({
        transitions: {
            DEFAULT: {
                state: {
                    alpha: 1
                },
                time: 0.15,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    scaleX: 1.5,
                    scaleY: 1.5
                },
                time: 0.15,
                timeFunction: KEY_SPLINES.EASE_IN
            }
        },
        ninepatch: new ig.NinePatch("media/gui/message.png", {
            width: 14,
            height: 14,
            left: 1,
            top: 1,
            right: 1,
            bottom: 1,
            offsets: {
                "default": {
                    x: 16,
                    y: 96
                }
            }
        }),
        init: function(a, b) {
            this.parent(a, b, false, this.ninepatch);
            this.ninepatch.skipTile[0] =
                this.ninepatch.skipTile[2] = 1;
            this.ninepatch.skipTile[4] = 1;
            this.ninepatch.skipTile[6] = this.ninepatch.skipTile[8] = 1;
            this.hook.pivot.x = this.hook.size.x / 2;
            this.hook.pivot.y = this.hook.size.y / 2
        }
    });
    var b = [{
        x: 8,
        y: 4
    }, {
        x: 10,
        y: 6
    }];
    sc.ArrowBoxGui = ig.BoxGui.extend({
        transitions: {
            DEFAULT: {
                state: {
                    alpha: 0.8
                },
                time: 0,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        gfx: new ig.Image("media/gui/message.png"),
        ninepatch: new ig.NinePatch("media/gui/message.png", {
            width: 16,
            height: 16,
            left: 8,
            top: 16,
            right: 8,
            bottom: 8,
            offsets: {
                "default": {
                    x: 0,
                    y: 0
                },
                dream: {
                    x: 224,
                    y: 0
                }
            }
        }),
        PADDING_X: 8,
        PADDING_Y: 4,
        PADDING_POINTER: 8,
        pointerType: 0,
        init: function(a, d, f) {
            var g = b[sc.options.get("message-padding")];
            this.PADDING_X = g.x;
            this.PADDING_Y = g.y;
            this.parent(a + this.PADDING_X * 2, d + this.PADDING_Y * 2, false, this.ninepatch);
            if (ig.dreamFx.isActive()) {
                this.currentTileOffset = "dream";
                this.hook.localAlpha = 0.5
            }
            if (this.hook.size.x % 2 == 1) this.hook.size.x = this.hook.size.x + 1;
            this.pointerType = f || sc.ArrowBoxGui.POINTER.NONE;
            this.hook.pivot.x = this.pointerType > 2 ? this.hook.size.x :
                0;
            this.hook.pivot.y = this.hook.size.y
        },
        resize: function(a, b) {
            this.setSize(a + this.PADDING_X * 2, b + this.PADDING_Y * 2)
        },
        setPointerDown: function() {
            if (this.pointerType == sc.ArrowBoxGui.POINTER.TOP_LEFT) this.pointerType = sc.ArrowBoxGui.POINTER.BOTTOM_LEFT;
            else if (this.pointerType == sc.ArrowBoxGui.POINTER.TOP_RIGHT) this.pointerType = sc.ArrowBoxGui.POINTER.BOTTOM_RIGHT
        },
        updateDrawables: function(a) {
            this.ninepatch.skipTile[0] = this.pointerType;
            this.pointerType > 2 && a.addTransform().setScale(-1, 1).setTranslate(this.hook.size.x,
                0);
            this.parent(a);
            if (this.pointerType) {
                var b = ig.dreamFx.isActive() ? 224 : 0,
                    d = Math.min(this.ninepatch.tile.top, this.hook.size.y - this.ninepatch.tile.bottom);
                a.addGfx(this.gfx, -8, 0, b + (this.pointerType % 2 == 0 ? 16 : 0), 40, 16, d)
            }
            this.pointerType > 2 && a.undoTransform()
        }
    });
    sc.ArrowBoxGui.POINTER = {
        NONE: 0,
        TOP_LEFT: 1,
        BOTTOM_LEFT: 2,
        TOP_RIGHT: 3,
        BOTTOM_RIGHT: 4
    };
    sc.PointingBoxGui = ig.BoxGui.extend({
        transitions: {
            HIDDEN: {
                state: {
                    alpha: 0,
                    scaleX: 0,
                    scaleY: 0
                },
                time: 0,
                timeFunction: KEY_SPLINES.EASE_IN
            },
            DEFAULT: {
                state: {
                    alpha: 1
                },
                time: 0,
                timeFunction: KEY_SPLINES.EASE_OUT
            }
        },
        gfx: new ig.Image("media/gui/message.png"),
        ninepatch: new ig.NinePatch("media/gui/message.png", {
            width: 16,
            height: 16,
            left: 8,
            top: 16,
            right: 8,
            bottom: 8,
            offsets: {
                "default": {
                    x: 0,
                    y: 0
                }
            }
        }),
        direction: 0,
        init: function() {
            this.parent(width + this.PADDING_X * 2, height + this.PADDING_Y * 2, false, this.ninepatch);
            if (this.hook.size.x % 2 == 1) this.hook.size.x = this.hook.size.x + 1;
            this.pointerType = pointerType || ig.BoxGui.POINTER.NONE;
            this.hook.pivot.x = this.pointerType > 2 ? this.hook.size.x : 0;
            this.hook.pivot.y =
                this.hook.size.y
        },
        setPointerDown: function() {
            if (this.pointerType == sc.ArrowBoxGui.POINTER.TOP_LEFT) this.pointerType = sc.ArrowBoxGui.POINTER.BOTTOM_LEFT;
            else if (this.pointerType == sc.ArrowBoxGui.POINTER.TOP_RIGHT) this.pointerType = sc.ArrowBoxGui.POINTER.BOTTOM_RIGHT
        },
        updateDrawables: function(a) {
            this.ninepatch.skipTile[0] = this.pointerType;
            this.pointerType > 2 && a.addTransform().setScale(-1, 1).setTranslate(this.hook.size.x, 0);
            this.parent(a);
            if (this.pointerType) {
                var b = Math.min(this.ninepatch.tile.top, this.hook.size.y -
                    this.ninepatch.tile.bottom);
                a.addGfx(this.gfx, -8, 0, this.pointerType % 2 == 0 ? 16 : 0, 40, 16, b)
            }
            this.pointerType > 2 && a.undoTransform()
        }
    });
    sc.LineGui = ig.BoxGui.extend({
        ninepatch: new ig.NinePatch("media/gui/message.png", {
            width: 12,
            height: 2,
            left: 2,
            top: 0,
            right: 0,
            bottom: 0,
            offsets: {
                "default": {
                    x: 0,
                    y: 80
                }
            }
        }),
        init: function(a) {
            this.parent(a, 2, false, this.ninepatch)
        }
    });
    sc.BlackGrayBox = ig.BoxGui.extend({
        text: null,
        ninepatch: new ig.NinePatch("media/gui/message.png", {
            width: 16,
            height: 16,
            left: 8,
            top: 16,
            right: 8,
            bottom: 8,
            offsets: {
                "default": {
                    x: 0,
                    y: 0
                }
            }
        }),
        init: function(a, b, d) {
            this.parent(a, b, d)
        }
    });
    sc.BlackWhiteBox = ig.BoxGui.extend({
        text: null,
        ninepatch: new ig.NinePatch("media/gui/message.png", {
            width: 22,
            height: 22,
            left: 5,
            top: 5,
            right: 5,
            bottom: 5,
            offsets: {
                "default": {
                    x: 48,
                    y: 0
                }
            }
        }),
        init: function(a, b, d) {
            this.parent(a, b, d);
            this.hook.localAlpha = 0.8
        }
    });
    sc.SideBorderBox = ig.BoxGui.extend({
        text: null,
        transitions: {
            DEFAULT: {
                state: {},
                time: 0,
                timeFunction: KEY_SPLINES.LINEAR
            },
            FLIPPED: {
                state: {
                    scaleX: -1,
                    scaleY: -1
                },
                time: 0,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        ninepatch: new ig.NinePatch("media/gui/message.png", {
            width: 12,
            height: 20,
            left: 0,
            top: 7,
            right: 0,
            bottom: 5,
            offsets: {
                "default": {
                    x: 32,
                    y: 0
                }
            }
        }),
        init: function(a, b) {
            this.parent(12, a, false);
            b && this.doStateTransition("FLIPPED", true)
        },
        setHeight: function(a) {
            this.setSize(12, a)
        }
    });
    sc.SideBoxGui = ig.GuiElementBase.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.3,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            HIDDEN: {
                state: {},
                time: 0.3,
                timeFunction: KEY_SPLINES.EASE_IN
            }
        },
        titleGui: null,
        contentEntries: [],
        right: false,
        init: function(a, b) {
            this.parent();
            this.hook.localAlpha = 1;
            this.right = a;
            this.titleGui = new sc.SlickTitleGui(b, a, 75);
            this.titleGui.hook.localAlpha = this.hook.localAlpha;
            this.titleGui.setAlign(this.right ? ig.GUI_ALIGN.X_RIGHT : ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
            this.titleGui.doStateTransition("HIDDEN", true);
            this.addChildGui(this.titleGui);
            this.setSize(this.titleGui.hook.size.x, this.titleGui.hook.size.y)
        },
        pushContent: function(a, b, d, g) {
            a = new sc.SlickBoxGui(a, this.right, d || 8, g || 2, 80);
            this.right && a.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.contentEntries.push(a);
            a.doStateTransition("HIDDEN", true);
            b && a.doStateTransition("DEFAULT");
            this.addChildGui(a);
            this.rearrangeContent(a)
        },
        replaceContent: function(a, b) {
            this.contentEntries[a].setContent(b);
            this.rearrangeContent()
        },
        removeContent: function(a) {
            a = this.contentEntries.splice(a, 1)[0];
            a.doStateTransition("HIDDEN", false, true);
            this.rearrangeContent();
            return a
        },
        clearContent: function() {
            for (; this.contentEntries.length;) this.contentEntries.pop().doStateTransition("HIDDEN", false, true)
        },
        popContent: function() {
            this.contentEntries.pop().doStateTransition("HIDDEN",
                false, true);
            this.rearrangeContent()
        },
        rearrangeContent: function(a) {
            for (var b = this.titleGui.hook.size.x, d = this.titleGui.hook.size.y, g = 0; g < this.contentEntries.length; ++g) {
                var h = this.contentEntries[g];
                g && (d = d + 1);
                h == a ? h.setPos(0, d) : h.doPosTranstition(0, d, 0.3, KEY_SPLINES.EASE_OUT);
                d = d + h.hook.size.y;
                b = Math.max(b, h.hook.size.x)
            }
            this.setSize(b, d)
        },
        hide: function(a, b) {
            if (!this.hook.removeAfterTransition) {
                this.titleGui.doStateTransition("HIDDEN", a);
                for (var d = 0; d < this.contentEntries.length; ++d) this.contentEntries[d].doStateTransition("HIDDEN",
                    a);
                this.doStateTransition("HIDDEN", false, false, b)
            }
        },
        show: function(a, b) {
            if (!this.hook.removeAfterTransition) {
                this.titleGui.doStateTransition("DEFAULT", a, false, null, b || 0);
                for (var d = 0; d < this.contentEntries.length; ++d) this.contentEntries[d].doStateTransition("DEFAULT", a, false, null, b || 0);
                this.doStateTransition("DEFAULT")
            }
        },
        remove: function() {
            this.titleGui.doStateTransition("HIDDEN");
            for (var a = 0; a < this.contentEntries.length; ++a) this.contentEntries[a].doStateTransition("HIDDEN");
            this.doStateTransition("HIDDEN",
                false, true)
        }
    });
    sc.CenterBoxGui = ig.GuiElementBase.extend({
        transitions: {
            DEFAULT: {
                state: {
                    alpha: 1
                },
                time: 0.3,
                timeFunction: KEY_SPLINES.EASE_IN_OUT
            },
            HIDDEN: {
                state: {
                    alpha: 0.5,
                    scaleX: 1,
                    scaleY: 0
                },
                time: 0.3,
                timeFunction: KEY_SPLINES.EASE_IN_OUT
            }
        },
        iconGfx: new ig.Image("media/gui/message.png"),
        msgContent: null,
        centerBox: null,
        borderLeftGui: null,
        borderRightGui: null,
        init: function(a, b) {
            this.parent();
            this.msgContent = a;
            this.centerBox = new sc.BlackWhiteBox(a.hook.size.x + 16, a.hook.size.y + 10);
            this.addChildGui(this.centerBox);
            this.centerBox.setPos(5, 3);
            this.setSize(this.centerBox.hook.size.x + 10, this.centerBox.hook.size.y + 6);
            this.hook.pivot.x = this.hook.size.x / 2;
            this.hook.pivot.y = this.hook.size.y / 2;
            this.addChildGui(this.msgContent);
            this.msgContent.setPos(13, 8);
            this.borderLeftGui = new sc.SideBorderBox(this.hook.size.y - 1);
            this.borderLeftGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.addChildGui(this.borderLeftGui);
            this.borderRightGui = new sc.SideBorderBox(this.hook.size.y - 1, true);
            this.borderRightGui.setAlign(ig.GUI_ALIGN.X_RIGHT,
                ig.GUI_ALIGN.Y_TOP);
            this.addChildGui(this.borderRightGui);
            this.doStateTransition("HIDDEN", true);
            this.doStateTransition("DEFAULT", b)
        },
        remove: function() {
            this.doStateTransition("HIDDEN", false, true)
        },
        resize: function() {
            var a = this.msgContent;
            this.centerBox.setSize(a.hook.size.x + 16, a.hook.size.y + 10);
            this.setSize(this.centerBox.hook.size.x + 10, this.centerBox.hook.size.y + 6);
            this.hook.pivot.x = this.hook.size.x / 2;
            this.hook.pivot.y = this.hook.size.y / 2;
            this.borderLeftGui.setHeight(this.hook.size.y - 1);
            this.borderRightGui.setHeight(this.hook.size.y -
                1)
        }
    });
    var a = Vec2.create(),
        d = 2 / 60;
    sc.SMALL_BOX_ALIGN = {
        BOTTOM: function(a, b) {
            a.x = b.size.x / 2;
            a.y = b.size.y
        },
        CENTER: function(a, b) {
            a.x = b.size.x / 2;
            a.y = b.size.y / 2 - b.size.z / 2
        },
        TOP: function(a, b) {
            a.x = b.size.x / 2;
            a.y = -b.size.z
        }
    };
    sc.SmallEntityBox = ig.GuiElementBase.extend({
        ninepatch: new ig.NinePatch("media/gui/message.png", {
            width: 16,
            height: 0,
            left: 16,
            top: 11,
            right: 16,
            bottom: 0,
            offsets: {
                "default": {
                    x: 96,
                    y: 64
                }
            }
        }),
        transitions: {
            DEFAULT: {
                state: {
                    alpha: 1
                },
                time: 0.1,
                timeFunction: KEY_SPLINES.EASE_IN_OUT
            },
            START: {
                state: {
                    alpha: 0.5,
                    scaleX: 0.8,
                    scaleY: 0
                },
                time: 0.15,
                timeFunction: KEY_SPLINES.EASE_IN_OUT
            },
            HIDDEN: {
                state: {
                    alpha: 0.5,
                    scaleX: 2,
                    scaleY: 0
                },
                time: 0.15,
                timeFunction: KEY_SPLINES.EASE_IN_OUT
            },
            HIDDEN_SMALL: {
                state: {
                    alpha: 0.5,
                    scaleX: 1,
                    scaleY: 0
                },
                time: 0.15,
                timeFunction: KEY_SPLINES.EASE_IN_OUT
            }
        },
        entity: null,
        textGui: null,
        timer: 0,
        rumbleTime: 0,
        finished: false,
        entityOff: Vec2.create(),
        offY: 0,
        fixedPos: null,
        hideSmall: false,
        init: function(a, b, d, g, h) {
            this.parent();
            this.entity = a;
            this.textGui = new sc.TextGui(b, {
                font: sc.fontsystem.smallFont
            });
            this.textGui.setAlign(ig.GUI_ALIGN.X_CENTER,
                ig.GUI_ALIGN.Y_CENTER);
            this.textGui.setPos(0, 1);
            this.addChildGui(this.textGui);
            this.setSize(this.textGui.hook.size.x + 16, 11);
            this.hook.localAlpha = 0.5;
            this.setPivot(this.hook.size.x / 2, this.hook.size.y / 2);
            this.doStateTransition("START", true);
            this.doStateTransition("DEFAULT");
            this.timer = d;
            this.rumbleTime = d / 2;
            g = g || sc.SMALL_BOX_ALIGN.TOP;
            g(this.entityOff, a.coll);
            this.offY = h || 0
        },
        setFixedPos: function() {
            this.fixedPos = Vec3.create();
            Vec3.assign(this.fixedPos, this.entity.coll.pos)
        },
        stopRumble: function() {
            this.rumbleTime =
                this.timer
        },
        update: function() {
            this._updatePos();
            this.timer = this.timer - ig.system.actualTick;
            this.timer <= 0 && this.remove()
        },
        updateDrawables: function(a) {
            this.ninepatch.draw(a, this.hook.size.x, this.hook.size.y, "default")
        },
        _updatePos: function() {
            if (this.entity) {
                var b = this.entity.coll,
                    b = this.fixedPos || b.pos;
                ig.system.getScreenFromMapPos(a, Math.round(b.x + this.entityOff.x), Math.round(b.y - b.z + this.entityOff.y - this.offY));
                b = 0;
                if (this.timer > this.rumbleTime) {
                    var e = Math.floor(this.timer / d);
                    e % 4 == 1 && (b = 2);
                    e % 4 == 3 &&
                        (b = -2)
                }
                this.hook.pos.x = a.x - this.hook.size.x / 2 + b;
                this.hook.pos.y = a.y - this.hook.size.y / 2 - 4 + 0
            }
        },
        remove: function() {
            this.finished = true;
            this.doStateTransition(this.hideSmall ? "HIDDEN_SMALL" : "HIDDEN", false, true)
        },
        isFinished: function() {
            return this.finished
        }
    });
    sc.LineBoxGui = ig.GuiElementBase.extend({
        ninepatch: new ig.NinePatch("media/gui/message.png", {
            width: 16,
            height: 0,
            left: 16,
            top: 26,
            right: 16,
            bottom: 0,
            offsets: {
                "default": {
                    x: 48,
                    y: 32
                }
            }
        }),
        transitions: {
            DEFAULT: {
                state: {
                    alpha: 1
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_IN_OUT
            },
            HIDDEN: {
                state: {
                    alpha: 0.5,
                    scaleX: 1,
                    scaleY: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_IN_OUT
            }
        },
        content: null,
        paddingX: 0,
        init: function(a, b) {
            this.parent();
            this.content = a;
            this.paddingX = b || 16;
            this.hook.localAlpha = 0.8;
            this.addChildGui(this.content);
            this.content.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.setSize(ig.system.width, 26);
            this.setPivot(this.hook.size.x / 2, this.hook.size.y / 2);
            this.doStateTransition("HIDDEN", true);
            this.doStateTransition("DEFAULT")
        },
        updateDrawables: function(a) {
            var b = this.content.hook.size.x +
                this.paddingX * 2,
                d = ig.system.width / 2 - b / 2;
            this.ninepatch.draw(a, b, this.hook.size.y, "default", d, 0);
            a.addColor("black", 0, 12, d, 2);
            a.addColor("black", d + b, 12, d, 2)
        }
    });
    sc.SmallBlackBoxGui = ig.BoxGui.extend({
        text: null,
        transitions: {
            DEFAULT: {
                state: {
                    alpha: 0.5
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_IN_OUT
            }
        },
        ninepatch: new ig.NinePatch("media/gui/message.png", {
            width: 8,
            height: 0,
            left: 4,
            top: 15,
            right: 4,
            bottom: 0,
            offsets: {
                "default": {
                    x: 24,
                    y: 80
                }
            }
        }),
        init: function(a) {
            this.parent(a, 15, false)
        }
    })
});
ig.baked = !0;

ig.module("game.feature.msg.gui.dream-msg").requires("impact.base.image", "impact.feature.interact.gui.focus-gui", "game.feature.interact.button-group").defines(function() {
    sc.DREAM_TEXT_POS_TYPE = {
        TOP: 1,
        BOTTOM: 2
    };
    var b = Vec2.create();
    sc.DreamMsgGui = ig.GuiElementBase.extend({
        transitions: {
            DEFAULT: {
                state: {
                    alpha: 1
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            TRANSPARENT: {
                state: {
                    alpha: 0.6
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            HIDDEN: {
                state: {
                    alpha: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_IN
            }
        },
        time: 0,
        init: function(a, b, c, e, f, g, h, i) {
            this.parent();
            this.hook.zIndex = 90;
            this.hook.temporary = true;
            this.target = a;
            this.posType = b;
            this.offset = c;
            this.time = f || 0;
            this.textGui = new sc.TextGui(e, g);
            this.addChildGui(this.textGui);
            this.setSize(this.textGui.hook.size.x, this.textGui.hook.size.y);
            sc.Model.addObserver(sc.model.message, this);
            this.doStateTransition(i ? "TRANSPARENT" : "DEFAULT", true);
            this.textGui.textBlock.onFinish = this._onTextFinish.bind(this);
            this.textDone = this.textGui.textBlock.isFinished();
            this.callback =
                h;
            if (!this.time) this.screenInteract = new sc.ScreenInteractEntry(this);
            this.time || (ig.system.skipMode ? this._close() : ig.interact.addEntry(this.screenInteract));
            this._updatePos()
        },
        onActionEndDetach: function() {
            this._close()
        },
        onDetach: function() {
            sc.Model.removeObserver(sc.model.message, this)
        },
        setBoxOffset: function(a, b) {
            this.msgBox.hook.pos.x = a;
            this.msgBox.hook.pos.y = b
        },
        _onTextFinish: function() {
            this.textDone = true
        },
        onInteraction: function() {
            if (this.textDone) {
                this.screenInteract && ig.interact.removeEntry(this.screenInteract);
                this._close()
            } else this.textGui.finish()
        },
        _close: function() {
            this.doStateTransition("HIDDEN", false, true);
            this.callback && this.callback()
        },
        update: function() {
            this.target && this._updatePos();
            if (this.time) {
                this.time = this.time - ig.system.tick;
                this.time <= 0 && this._close()
            }!this.hook.removeAfterTransition && (this.textDone && ig.system.skipMode && !this.time) && this._close();
            this.parent()
        },
        updateDrawables: function(a) {
            this.bgColor && a.addColor(this.bgColor, 0, 0, this.hook.size.x, this.hook.size.y)
        },
        _updatePos: function() {
            if (this.target) {
                var a =
                    this.target.coll.pos.y - this.target.coll.pos.z,
                    a = this.posType == sc.DREAM_TEXT_POS_TYPE.TOP ? a - this.target.coll.size.z : a + this.target.coll.size.y;
                ig.system.getScreenFromMapPos(b, Math.round(this.target.coll.pos.x + this.target.coll.size.x / 2), Math.round(a));
                this.hook.pos.x = b.x - this.hook.size.x / 2;
                this.hook.pos.y = b.y;
                this.hook.pos.y = this.posType == sc.DREAM_TEXT_POS_TYPE.TOP ? this.hook.pos.y - (8 + this.hook.size.y) : this.hook.pos.y + 8
            } else {
                this.hook.pos.x = ig.system.width / 2 - this.hook.size.x / 2;
                this.hook.pos.y = ig.system.height /
                    2 - this.hook.size.y / 2
            }
            this.offset && Vec2.add(this.hook.pos, this.offset);
            this.hook.pos.x = this.hook.pos.x.limit(0, ig.system.width - this.hook.size.x);
            this.hook.pos.y = this.hook.pos.y.limit(0, ig.system.height - this.hook.size.y)
        },
        modelChanged: function(a, b) {
            if (b == sc.MESSAGE_EVENT.DREAM_MSG_CLOSE && this.time) this.time = 0.001
        }
    })
});
ig.baked = !0;

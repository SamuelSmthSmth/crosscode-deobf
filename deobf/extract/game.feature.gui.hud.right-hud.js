ig.module("game.feature.gui.hud.right-hud").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.base.image", "game.feature.gui.base.boxes").defines(function() {
    sc.RightHudGui = ig.GuiElementBase.extend({
        taskTitle: null,
        maxCount: 0,
        currentCount: 0,
        variable: null,
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
            },
            HALF: {
                state: {
                    scaleX: 0.5,
                    scaleY: 0.5,
                    offsetX: -1
                },
                time: 0.3,
                timeFunction: KEY_SPLINES.EASE_OUT
            }
        },
        boxes: [],
        doReorder: false,
        init: function() {
            this.parent();
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.hook.zIndex = 101;
            this.hook.pauseGui = true;
            sc.Model.addObserver(sc.model, this);
            sc.Model.addObserver(sc.options, this);
            this.updateSize()
        },
        update: function() {
            if (this.doReorder) {
                this.doReorder = false;
                for (var b = 4, a = 0; a < this.boxes.length; ++a) {
                    if (!this.boxes[a].hidden) {
                        this.boxes[a].justAdded ? this.boxes[a].setPos(0, b) : this.boxes[a].doPosTranstition(0, b, 0.3, KEY_SPLINES.EASE_OUT);
                        b = b + (this.boxes[a].hook.size.y +
                            8)
                    }
                    this.boxes[a].justAdded = false
                }
            }
        },
        addHudBox: function(b, a) {
            b.parentPanel = this;
            b.justAdded = true;
            b.hook.align.x = ig.GUI_ALIGN.X_RIGHT;
            this.boxes.erase(b);
            if (a === void 0) {
                this.boxes.push(b);
                this.addChildGui(b)
            } else {
                this.boxes.splice(a, 0, b);
                this.insertChildGui(b, a)
            }
            this.reorder()
        },
        addHudBoxBefore: function(b, a) {
            var d = this.getChildGuiIndex(a);
            this.addHudBox(b, d == -1 ? void 0 : d)
        },
        removeHudBox: function(b) {
            b.parentPanel = null;
            this.boxes.erase(b);
            this.reorder()
        },
        reorder: function() {
            this.doReorder = true
        },
        modelChanged: function(b,
            a) {
            if (b == sc.model) {
                var d = sc.model.isCombatMode(),
                    c = sc.model.isCutscene();
                this.doPosTranstition(0, c ? 21 : d ? 16 : 0, 0.2, KEY_SPLINES.EASE_IN_OUT, !d && !c ? 0.5 : 0)
            } else b == sc.options && a == sc.OPTIONS_EVENT.OPTION_CHANGED && this.updateSize()
        },
        updateSize: function() {
            sc.options.get("pixel-size") == sc.PIXEL_SIZE.ONE ? this.doStateTransition("DEFAULT", true) : sc.options.get("min-sidebar") ? this.doStateTransition("HALF", true) : this.doStateTransition("DEFAULT", true)
        }
    });
    sc.RightHudBoxGui = sc.SideBoxGui.extend({
        hidden: true,
        justAdded: false,
        parentPanel: null,
        init: function(b) {
            this.parent(true, b);
            this.doStateTransition("HIDDEN", true)
        },
        show: function(b, a) {
            this.parent(b, a);
            if (this.hidden) this.justAdded = true;
            this.hidden = false;
            this.parentPanel && this.parentPanel.reorder()
        },
        hide: function(b, a) {
            this.parent(b, a);
            this.hidden = true;
            this.parentPanel && this.parentPanel.reorder()
        },
        remove: function() {
            this.parent();
            this.parentPanel && this.parentPanel.removeHudBox(this)
        }
    })
});
ig.baked = !0;

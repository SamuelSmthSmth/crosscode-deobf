ig.module("impact.feature.gui.gui-steps").requires("impact.base.action", "impact.base.event", "impact.feature.gui.gui").defines(function() {
    ig.EVENT_STEP.ADD_GUI = ig.EventStepBase.extend({
        name: null,
        guiInfo: null,
        guiElement: null,
        _wm: new ig.Config({
            attributes: {
                name: {
                    _type: "String",
                    _info: "Name to identify GUI for subsequent modifications (e.g. removal)",
                    _optional: true
                },
                guiInfo: {
                    _type: "GUI",
                    _info: "Type and Settings of GUI to spawn",
                    _popup: true
                }
            }
        }),
        init: function(b) {
            this.name = b.name;
            this.guiInfo = b.guiInfo;
            if (!window.wm) this.guiElement =
                ig.gui.createEventGui(this.name, this.guiInfo.type, this.guiInfo.settings)
        },
        start: function() {
            if (this.name) {
                var b = ig.gui.namedGuiElements[this.name];
                b && b.remove()
            }
            ig.gui.spawnEventGui(this.guiElement)
        },
        clearCached: function() {
            ig.gui.freeEventGui(this.guiElement)
        }
    });
    ig.EVENT_STEP.REMOVE_GUI = ig.EventStepBase.extend({
        name: null,
        guiInfo: null,
        _wm: new ig.Config({
            attributes: {
                name: {
                    _type: "String",
                    _info: "Name of GUI to be removed"
                }
            }
        }),
        init: function(b) {
            assertContent(b, "name");
            this.name = b.name
        },
        start: function() {
            var b =
                ig.gui.namedGuiElements[this.name];
            b && b.remove()
        }
    });
    ig.EVENT_STEP.CHANGE_GUI_STATE = ig.EventStepBase.extend({
        name: null,
        guiState: null,
        immediate: false,
        remove: false,
        _wm: new ig.Config({
            attributes: {
                name: {
                    _type: "String",
                    _info: "Name to identify GUI for subsequent modifications (e.g. removal)"
                },
                guiState: {
                    _type: "GUIState",
                    _info: "Transition to change to"
                },
                immediate: {
                    _type: "Boolean",
                    _info: "If true: skip transition"
                },
                remove: {
                    _type: "Boolean",
                    _info: "Remove GUI after transition"
                }
            }
        }),
        init: function(b) {
            assertContent(b,
                "name", "guiState");
            this.name = b.name;
            this.guiState = b.guiState;
            this.immediate = b.immediate || false;
            this.remove = b.remove || false
        },
        start: function() {
            var b = ig.gui.namedGuiElements[this.name];
            if (b) {
                if (!(b instanceof ig.GUI[this.guiState.type])) throw Error("Gui State transition with invalid GUI type!");
                b.doStateTransition(this.guiState.state, this.immediate, this.remove)
            }
        }
    });
    ig.EVENT_STEP.SHOW_IMAGE = ig.EventStepBase.extend({
        name: null,
        image: null,
        guiState: null,
        alignX: null,
        alignY: null,
        renderMode: null,
        overGui: false,
        _wm: new ig.Config({
            attributes: {
                name: {
                    _type: "String",
                    _info: "Name of image"
                },
                image: {
                    _type: "TileSheet",
                    _info: "Image to be displayed",
                    _popup: true
                },
                guiState: {
                    _type: "GuiState",
                    _info: "Initial State of image",
                    _popup: true
                },
                alignX: {
                    _type: "String",
                    _info: "X alignment",
                    _select: ig.GUI_ALIGN_X
                },
                alignY: {
                    _type: "String",
                    _info: "Y alignment",
                    _select: ig.GUI_ALIGN_Y
                },
                renderMode: {
                    _type: "String",
                    _info: "Render Mode if Image",
                    _select: ["source-over", "lighter"],
                    _optional: true
                },
                overGui: {
                    _type: "Boolean",
                    _info: "If true, display image above game hud (e.g. cut scene bars, portraits)"
                }
            }
        }),
        init: function(b) {
            this.name = b.name;
            this.image = new ig.TileSheet.createFromJson(b.image);
            this.guiState = b.guiState;
            this.alignX = b.alignX;
            this.alignY = b.alignY;
            this.renderMode = b.renderMode;
            this.overGui = b.overGui || false
        },
        start: function() {
            ig.guiImage.showImage(this.name, this.image, this.guiState, this.alignX, this.alignY, this.renderMode, this.overGui)
        },
        clearCached: function() {
            this.image.clearCached()
        }
    });
    ig.EVENT_STEP.MOVE_IMAGE = ig.EventStepBase.extend({
        name: null,
        guiState: null,
        time: null,
        keySpline: null,
        removeAfterwards: false,
        _wm: new ig.Config({
            attributes: {
                name: {
                    _type: "String",
                    _info: "Name of image"
                },
                guiState: {
                    _type: "GuiState",
                    _info: "Initial State of image",
                    _popup: true
                },
                time: {
                    _type: "Number",
                    _info: "Transition time"
                },
                keySpline: {
                    _type: "String",
                    _info: "Key spline for transition",
                    _select: KEY_SPLINES
                },
                removeAfterwards: {
                    _type: "Boolean",
                    _info: "True if image should be removed after transition"
                }
            }
        }),
        init: function(b) {
            this.name = b.name;
            this.guiState = b.guiState;
            this.time = b.time || 0.1;
            this.keySpline = KEY_SPLINES[b.keySpline] || KEY_SPLINES.LINEAR;
            this.removeAfterwards = b.removeAfterwards || false
        },
        start: function() {
            ig.guiImage.moveImage(this.name, this.guiState, this.time, this.keySpline, this.removeAfterwards)
        }
    });
    ig.EVENT_STEP.REMOVE_IMAGE = ig.EventStepBase.extend({
        name: null,
        _wm: new ig.Config({
            attributes: {
                name: {
                    _type: "String",
                    _info: "Name of image to be removed"
                }
            }
        }),
        init: function(b) {
            this.name = b.name
        },
        start: function() {
            ig.guiImage.removeImage(this.name)
        }
    })
});
ig.baked = !0;

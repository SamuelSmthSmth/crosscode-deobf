/**
 * impact.feature.gui.gui-steps
 * =============================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.gui.gui-steps")`.
 *
 * Registers `ig.EVENT_STEP` entries for event-sheet scripting of GUI elements and images:
 *
 *   - `ADD_GUI`          — spawn an event GUI element by type name.
 *   - `REMOVE_GUI`       — remove a named event GUI element.
 *   - `CHANGE_GUI_STATE` — trigger a named state transition on an existing event GUI element.
 *   - `SHOW_IMAGE`       — show a full-screen/aligned image overlay.
 *   - `MOVE_IMAGE`       — smoothly transition a named image overlay to a new state.
 *   - `REMOVE_IMAGE`     — remove a named image overlay.
 *
 * All steps carry `_wm` metadata for the World Map editor tool (not used at runtime).
 */
ig.module("impact.feature.gui.gui-steps").requires(
    "impact.base.action",
    "impact.base.event",
    "impact.feature.gui.gui"
).defines(function () {

    // -------------------------------------------------------------------------
    // ADD_GUI — spawn an event GUI element
    // -------------------------------------------------------------------------

    ig.EVENT_STEP.ADD_GUI = ig.EventStepBase.extend({
        /** Optional name by which subsequent steps can reference this element. */
        name:       null,
        /** Descriptor: `{ type: string, settings: Object }`. */
        guiInfo:    null,
        /** Pre-constructed GUI element (built at parse time to avoid repeated construction). */
        guiElement: null,

        _wm: new ig.Config({
            attributes: {
                name: {
                    _type: "String",
                    _info: "Name to identify GUI for subsequent modifications (e.g. removal)",
                    _optional: true
                },
                guiInfo: {
                    _type:   "GUI",
                    _info:   "Type and Settings of GUI to spawn",
                    _popup:  true
                }
            }
        }),

        init: function (data) {
            this.name    = data.name;
            this.guiInfo = data.guiInfo;
            // Pre-construct the element during event sheet loading (not in the World Map editor).
            if (!window.wm) {
                this.guiElement = ig.gui.createEventGui(
                    this.name,
                    this.guiInfo.type,
                    this.guiInfo.settings
                );
            }
        },

        start: function () {
            // If the name is already in use, remove the existing element first.
            if (this.name) {
                var existing = ig.gui.namedGuiElements[this.name];
                if (existing) existing.remove();
            }
            ig.gui.spawnEventGui(this.guiElement);
        },

        clearCached: function () {
            ig.gui.freeEventGui(this.guiElement);
        }
    });

    // -------------------------------------------------------------------------
    // REMOVE_GUI — remove a named event GUI element
    // -------------------------------------------------------------------------

    ig.EVENT_STEP.REMOVE_GUI = ig.EventStepBase.extend({
        name:    null,
        guiInfo: null,  // unused at runtime; kept for editor schema symmetry

        _wm: new ig.Config({
            attributes: {
                name: {
                    _type: "String",
                    _info: "Name of GUI to be removed"
                }
            }
        }),

        init: function (data) {
            assertContent(data, "name");
            this.name = data.name;
        },

        start: function () {
            var element = ig.gui.namedGuiElements[this.name];
            if (element) element.remove();
        }
    });

    // -------------------------------------------------------------------------
    // CHANGE_GUI_STATE — trigger a named state transition on an existing element
    // -------------------------------------------------------------------------

    ig.EVENT_STEP.CHANGE_GUI_STATE = ig.EventStepBase.extend({
        /** Name of the target element (must exist in `ig.gui.namedGuiElements`). */
        name:      null,
        /** `{ type: string, state: string }` — type used for type-safety validation. */
        guiState:  null,
        /** If true, skip the transition animation. */
        immediate: false,
        /** If true, remove the element after the transition completes. */
        remove:    false,

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

        init: function (data) {
            assertContent(data, "name", "guiState");
            this.name      = data.name;
            this.guiState  = data.guiState;
            this.immediate = data.immediate || false;
            this.remove    = data.remove    || false;
        },

        start: function () {
            var element = ig.gui.namedGuiElements[this.name];
            if (element) {
                // Type-check: the element must be an instance of the expected GUI type.
                if (!(element instanceof ig.GUI[this.guiState.type])) {
                    throw Error("Gui State transition with invalid GUI type!");
                }
                element.doStateTransition(this.guiState.state, this.immediate, this.remove);
            }
        }
    });

    // -------------------------------------------------------------------------
    // SHOW_IMAGE — show a full-screen/aligned sprite overlay
    // -------------------------------------------------------------------------

    ig.EVENT_STEP.SHOW_IMAGE = ig.EventStepBase.extend({
        name:       null,
        /** @type {ig.TileSheet} Pre-constructed image descriptor. */
        image:      null,
        /** Initial display state. */
        guiState:   null,
        /** X alignment key for `ig.GUI_ALIGN_X`. */
        alignX:     null,
        /** Y alignment key for `ig.GUI_ALIGN_Y`. */
        alignY:     null,
        /** Canvas composite/blend mode (null = "source-over"). */
        renderMode: null,
        /** If true, render above HUD; if false, render below. */
        overGui:    false,

        _wm: new ig.Config({
            attributes: {
                name:    { _type: "String", _info: "Name of image" },
                image:   { _type: "TileSheet", _info: "Image to be displayed", _popup: true },
                guiState:{ _type: "GuiState",  _info: "Initial State of image", _popup: true },
                alignX:  { _type: "String", _info: "X alignment", _select: ig.GUI_ALIGN_X },
                alignY:  { _type: "String", _info: "Y alignment", _select: ig.GUI_ALIGN_Y },
                renderMode: {
                    _type:     "String",
                    _info:     "Render Mode if Image",
                    _select:   ["source-over", "lighter"],
                    _optional: true
                },
                overGui: {
                    _type: "Boolean",
                    _info: "If true, display image above game hud (e.g. cut scene bars, portraits)"
                }
            }
        }),

        init: function (data) {
            this.name       = data.name;
            this.image      = new ig.TileSheet.createFromJson(data.image);
            this.guiState   = data.guiState;
            this.alignX     = data.alignX;
            this.alignY     = data.alignY;
            this.renderMode = data.renderMode;
            this.overGui    = data.overGui || false;
        },

        start: function () {
            ig.guiImage.showImage(
                this.name, this.image, this.guiState,
                this.alignX, this.alignY,
                this.renderMode, this.overGui
            );
        },

        clearCached: function () {
            this.image.clearCached();
        }
    });

    // -------------------------------------------------------------------------
    // MOVE_IMAGE — animate a named image overlay to a new state
    // -------------------------------------------------------------------------

    ig.EVENT_STEP.MOVE_IMAGE = ig.EventStepBase.extend({
        name:            null,
        guiState:        null,
        time:            null,
        /** @type {Object} KEY_SPLINES entry. */
        keySpline:       null,
        removeAfterwards: false,

        _wm: new ig.Config({
            attributes: {
                name:     { _type: "String", _info: "Name of image" },
                guiState: { _type: "GuiState", _info: "Initial State of image", _popup: true },
                time:     { _type: "Number",  _info: "Transition time" },
                keySpline:{ _type: "String",  _info: "Key spline for transition", _select: KEY_SPLINES },
                removeAfterwards: {
                    _type: "Boolean",
                    _info: "True if image should be removed after transition"
                }
            }
        }),

        init: function (data) {
            this.name             = data.name;
            this.guiState         = data.guiState;
            this.time             = data.time     || 0.1;
            this.keySpline        = KEY_SPLINES[data.keySpline] || KEY_SPLINES.LINEAR;
            this.removeAfterwards = data.removeAfterwards || false;
        },

        start: function () {
            ig.guiImage.moveImage(this.name, this.guiState, this.time, this.keySpline, this.removeAfterwards);
        }
    });

    // -------------------------------------------------------------------------
    // REMOVE_IMAGE — immediately remove a named image overlay
    // -------------------------------------------------------------------------

    ig.EVENT_STEP.REMOVE_IMAGE = ig.EventStepBase.extend({
        name: null,

        _wm: new ig.Config({
            attributes: {
                name: { _type: "String", _info: "Name of image to be removed" }
            }
        }),

        init: function (data) {
            this.name = data.name;
        },

        start: function () {
            ig.guiImage.removeImage(this.name);
        }
    });
});

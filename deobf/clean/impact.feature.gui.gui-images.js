/**
 * impact.feature.gui.gui-images
 * ==============================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.gui.gui-images")`.
 *
 * Provides a GameAddon that manages "event images" — full-screen or aligned sprite
 * overlays spawned and removed by event steps (cutscenes, scripted sequences).
 *
 * Defines:
 *   - `ig.GuiImageContainer` — a root-level `GuiElementBase` that acts as a z-ordered
 *                              container for event images (two instances: below-GUI and above-GUI).
 *   - `ig.GuiImage`          — the singleton GameAddon (`ig.guiImage`) that owns both
 *                              containers and exposes show/move/remove operations.
 */
ig.module("impact.feature.gui.gui-images").requires(
    "impact.base.image",
    "impact.base.game",
    "impact.feature.gui.gui",
    "impact.feature.storage.storage"
).defines(function () {

    // -------------------------------------------------------------------------
    // ig.GuiImageContainer
    // -------------------------------------------------------------------------

    /**
     * A full-screen `GuiElementBase` used purely as a z-ordered layer container.
     * Two instances are created by `ig.GuiImage.init()`:
     *   - zIndex = -30  → rendered below all HUD elements
     *   - zIndex = 51   → rendered above all HUD elements
     *
     * @param {number} zIndex
     */
    ig.GuiImageContainer = ig.GuiElementBase.extend({
        init: function (zIndex) {
            this.parent();
            this.hook.zIndex = zIndex;
            this.setSize(ig.system.width, ig.system.height);
        }
    });

    // -------------------------------------------------------------------------
    // ig.GuiImage  (singleton GameAddon — `ig.guiImage`)
    // -------------------------------------------------------------------------

    ig.GuiImage = ig.GameAddon.extend({
        /**
         * Map of image name → `{ gui: ig.ImageGui, data: { alignX, alignY, state } }`.
         * @type {Object.<string, {gui:ig.ImageGui, data:Object}>}
         */
        guiImages: {},

        /** Layer rendered below the main GUI (zIndex -30). */
        containerBelowGui: null,
        /** Layer rendered above the main GUI (zIndex 51). */
        containerOverGui:  null,

        init: function () {
            this.parent("GUI");
            ig.storage.register(this);

            this.containerBelowGui = new ig.GuiImageContainer(-30);
            ig.gui.addGuiElement(this.containerBelowGui);

            this.containerOverGui = new ig.GuiImageContainer(51);
            ig.gui.addGuiElement(this.containerOverGui);
        },

        /**
         * Show a named event image.
         *
         * @param {string}       name        unique identifier for later move/remove calls
         * @param {ig.TileSheet} tileSheet   source image descriptor (has `.image`, `.offX`, `.offY`, `.width`, `.height`)
         * @param {Object}       guiState    initial state `{ alpha, offsetX, offsetY, scaleX, scaleY, angle }`
         * @param {string}       alignX      key into `ig.GUI_ALIGN_X` ("LEFT"|"CENTER"|"RIGHT")
         * @param {string}       alignY      key into `ig.GUI_ALIGN_Y` ("TOP"|"CENTER"|"BOTTOM")
         * @param {string}       [renderMode] canvas composite operation (null = "source-over")
         * @param {boolean}      [overGui]   if true, add to the above-GUI container
         */
        showImage: function (name, tileSheet, guiState, alignX, alignY, renderMode, overGui) {
            // Remove any existing image with the same name first.
            this.removeImage(name);

            var imageGui = new ig.ImageGui(tileSheet.image, tileSheet.offX, tileSheet.offY, tileSheet.width, tileSheet.height);
            imageGui.setAlign(ig.GUI_ALIGN_X[alignX], ig.GUI_ALIGN_Y[alignY]);
            imageGui.renderMode = renderMode || null;
            // Snap to the initial state immediately.
            imageGui.doTempStateTransition(this._createGuiState(guiState), 0, KEY_SPLINES.LINEAR, true);

            var entry = {
                gui:  imageGui,
                data: { alignX: alignX, alignY: alignY, state: guiState }
            };
            if (overGui) {
                this.containerOverGui.addChildGui(imageGui);
            } else {
                this.containerBelowGui.addChildGui(imageGui);
            }
            this.guiImages[name] = entry;
        },

        /**
         * Smoothly move (transition) a named event image to a new state.
         *
         * @param {string}   name
         * @param {Object}   guiState         target state
         * @param {number}   time             transition duration in seconds
         * @param {Object}   keySpline        KEY_SPLINES entry
         * @param {boolean}  [removeAfter]    if true, remove the image after the transition ends
         */
        moveImage: function (name, guiState, time, keySpline, removeAfter) {
            var entry = this.guiImages[name];
            if (entry) {
                entry.data.state = guiState;
                entry.gui.doTempStateTransition(this._createGuiState(guiState), time, keySpline, false, removeAfter);
                if (removeAfter) delete this.guiImages[name];
            }
        },

        /**
         * Immediately remove a named event image.
         * @param {string} name
         */
        removeImage: function (name) {
            var entry = this.guiImages[name];
            if (entry) {
                entry.gui.remove();
                delete this.guiImages[name];
            }
        },

        /**
         * Convert an event-step GUI state descriptor to the format expected by
         * `ig.GuiHook.doTempStateTransition`.
         *
         * @param {Object} stateDesc  `{ alpha, offsetX, offsetY, scaleX, scaleY, angle }`
         * @returns {{ alpha:number, offsetX:number, offsetY:number, scaleX:number, scaleY:number, angle:number }}
         */
        _createGuiState: function (stateDesc) {
            return {
                alpha:   stateDesc.alpha,
                offsetX: stateDesc.offsetX,
                offsetY: stateDesc.offsetY,
                scaleX:  stateDesc.scaleX,
                scaleY:  stateDesc.scaleY,
                angle:   stateDesc.angle
            };
        },

        // Storage hooks are intentional no-ops; images are not persisted.
        onStorageSave:    function () {},
        onStoragePreLoad: function () {},

        /** Clear all active event images on map reset. */
        onReset: function () {
            for (var name in this.guiImages) this.removeImage(name);
        }
    });

    // Register the singleton.
    ig.addGameAddon(function () {
        return ig.guiImage = new ig.GuiImage();
    });
});

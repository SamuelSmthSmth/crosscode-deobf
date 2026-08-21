/**
 * impact.feature.gui.gui
 * ======================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.gui.gui")`.
 *
 * The core GUI system. Defines:
 *   - `ig.Gui`            — the singleton GameAddon that owns all root GUI elements,
 *                           drives the per-frame update/draw tree, and handles mouse routing.
 *   - `ig.GuiHook`        — the scene-graph node attached to every GUI element; holds
 *                           position, size, alignment, children, transitions, and animation state.
 *   - `ig.GuiElementBase` — base class for every concrete GUI widget; thin wrapper that
 *                           delegates to its `hook`.
 *   - `ig.GuiDrawable`    — a single pooled draw command (image / color / pattern / text /
 *                           video / game-state); written into a `GuiRenderer` each frame.
 *   - `ig.GuiTransform`   — a pooled canvas transform/clip/alpha command inserted into the
 *                           renderer's draw-step list.
 *   - `ig.GuiStepPool`    — object pool for `GuiDrawable` and `GuiTransform`.
 *   - `ig.GUI_ALIGN`      — enum constants for 6 alignment values (X/Y × LEFT|CENTER|RIGHT / TOP|CENTER|BOTTOM).
 *   - `ig.GUI`            — registry object: maps event-GUI type-name strings → constructors.
 */
ig.module("impact.feature.gui.gui").requires(
    "impact.base.image",
    "impact.base.game",
    "impact.feature.storage.storage"
).defines(function () {

    // -------------------------------------------------------------------------
    // Module-private helpers
    // -------------------------------------------------------------------------

    /**
     * Sort comparator: ascending zIndex for root hook arrays.
     * @param {ig.GuiHook} hookA
     * @param {ig.GuiHook} hookB
     */
    function sortByZIndex(hookA, hookB) {
        return hookA.zIndex - hookB.zIndex;
    }

    /**
     * Compute the resolved X draw position of a hook within a parent of width `parentW`.
     * @param {ig.GuiHook} hook
     * @param {number}     parentW  parent container pixel width
     * @returns {number}
     */
    function resolveAlignX(hook, parentW) {
        switch (hook.align.x) {
            case ig.GUI_ALIGN.X_LEFT:
                return hook.pos.x;
            case ig.GUI_ALIGN.X_RIGHT:
                return parentW - hook.size.x - hook.pos.x;
            case ig.GUI_ALIGN.X_CENTER:
                return Math.floor(parentW / 2 - hook.size.x / 2 + hook.pos.x);
        }
        return 0;
    }

    /**
     * Compute the resolved Y draw position of a hook within a parent of height `parentH`.
     * @param {ig.GuiHook} hook
     * @param {number}     parentH  parent container pixel height
     * @returns {number}
     */
    function resolveAlignY(hook, parentH) {
        switch (hook.align.y) {
            case ig.GUI_ALIGN.Y_TOP:
                return hook.pos.y;
            case ig.GUI_ALIGN.Y_BOTTOM:
                return parentH - hook.size.y - hook.pos.y;
            case ig.GUI_ALIGN.Y_CENTER:
                return Math.floor(parentH / 2 - hook.size.y / 2 + hook.pos.y);
        }
        return 0;
    }

    /**
     * Recursively call `varsChanged()` on every GUI element in a hook array.
     * @param {ig.GuiHook[]} hooks
     */
    function notifyVarsChanged(hooks) {
        for (var i = 0; i < hooks.length; ++i) {
            hooks[i].gui.varsChanged && hooks[i].gui.varsChanged();
            notifyVarsChanged(hooks[i].children);
        }
    }

    /**
     * Set `hook._visible` and fire `onVisibilityChange` if the value changes.
     * @param {ig.GuiHook} hook
     * @param {boolean}    visible
     */
    function setVisibility(hook, visible) {
        if (visible != hook._visible) {
            hook._visible = visible;
            if (hook.gui.onVisibilityChange) hook.gui.onVisibilityChange(visible);
        }
    }

    /**
     * Walk up the hook hierarchy from `hook` to the root `ig.Gui` and accumulate
     * alignment offsets into `screenCoords`, filling in `active`, `x`, and `y`.
     * @param {Object}     screenCoords  mutable coords object { x, y, active }
     * @param {ig.GuiHook} hook
     */
    function computeScreenCoords(screenCoords, hook) {
        var parentHook = hook.parentHook,
            parentW, parentH;
        if (parentHook instanceof ig.Gui) {
            screenCoords.active = hook.pauseGui || !ig.game.paused;
            parentW = ig.system.width;
            parentH = ig.system.height;
        } else {
            computeScreenCoords(screenCoords, parentHook);
            screenCoords.x = screenCoords.x + parentHook.scroll.x;
            screenCoords.y = screenCoords.y + parentHook.scroll.y;
            parentW = parentHook.size.x;
            parentH = parentHook.size.y;
        }
        screenCoords.x = screenCoords.x + resolveAlignX(hook, parentW);
        screenCoords.y = screenCoords.y + resolveAlignY(hook, parentH);
    }

    // Scratch clip-rect stack used during _updateRecursive.
    var clipRectStack = [];
    // Pending canvas transform stack used during ig.GuiRenderer.draw().
    var transformStack = [];

    // -------------------------------------------------------------------------
    // ig.GuiRenderer  (module-private class, exposed as ig.Gui.prototype.renderer)
    // -------------------------------------------------------------------------

    /**
     * Renderer: accumulates a flat list of draw-steps (GuiDrawable / GuiTransform / null)
     * during the update pass, then replays them in onPostDraw.
     * null in the list means "undo the most recent transform".
     */
    var GuiRenderer = ig.Class.extend({
        drawSteps: [],

        /** Shorthand: add a GuiDrawable configured as a sprite. */
        addGfx: function (image, posX, posY, srcX, srcY, width, height, flipX, flipY) {
            return this.addDraw().setGfx(image, posX, posY, srcX, srcY, width, height, flipX, flipY);
        },
        /** Shorthand: add a GuiDrawable configured as a tile from a sprite sheet. */
        addGfxTile: function (image, posX, posY, tileIndex, tileWidth, tileHeight, flipX, flipY) {
            return this.addDraw().setGfxTile(image, posX, posY, tileIndex, tileWidth, tileHeight, flipX, flipY);
        },
        /** Shorthand: add a GuiDrawable configured as a video element. */
        addVideo: function (video, posX, posY, width, height) {
            return this.addDraw().setVideo(video, posX, posY, width, height);
        },
        /** Shorthand: add a GuiDrawable configured as a game-state draw. */
        addGameStateDraw: function (gameState, posX, posY) {
            return this.addDraw().setGameStateDraw(gameState, posX, posY);
        },
        /** Shorthand: add a GuiDrawable configured as a filled color rectangle. */
        addColor: function (color, posX, posY, width, height) {
            return this.addDraw().setColor(color, posX, posY, width, height);
        },
        /** Shorthand: add a GuiDrawable configured as a tiled pattern. */
        addPattern: function (pattern, posX, posY, srcX, srcY, width, height) {
            return this.addDraw().setPattern(pattern, posX, posY, srcX, srcY, width, height);
        },
        /** Shorthand: add a GuiDrawable configured as a TextBlock. */
        addText: function (textBlock, posX, posY) {
            return this.addDraw().setText(textBlock, posX, posY);
        },

        /** Release all draw steps back to the pool. */
        clearDrawSteps: function () {
            while (this.drawSteps.length) {
                var step = this.drawSteps.pop();
                step && step.kill();
            }
        },

        /**
         * Allocate a fresh `ig.GuiDrawable` from the pool and append it.
         * @returns {ig.GuiDrawable}
         */
        addDraw: function () {
            var drawable = guiStepPool.get(ig.GuiDrawable);
            this.drawSteps.push(drawable);
            return drawable;
        },

        /**
         * Allocate a fresh `ig.GuiTransform` from the pool and append it.
         * @returns {ig.GuiTransform}
         */
        addTransform: function () {
            var transform = guiStepPool.get(ig.GuiTransform);
            this.drawSteps.push(transform);
            return transform;
        },

        /**
         * Push a null sentinel to signal "undo the last transform" during draw().
         */
        undoTransform: function () {
            this.drawSteps.push(null);
        },

        /**
         * Replay the accumulated draw-step list on the canvas.
         * Simple (translate-only, no clip/scale/rotate) transforms are handled with a
         * running offset (dx, dy); complex transforms use canvas save/restore.
         */
        draw: function () {
            var system = ig.system,
                ctx    = system.context,
                scale  = system.scale,
                dx = 0,
                dy = 0,
                steps  = this.drawSteps,
                len    = steps.length;

            for (var i = 0; i < len; ++i) {
                var step = steps[i];
                if (step) {
                    if (step.draw) {
                        // GuiDrawable
                        step.draw(dx, dy);
                    } else {
                        // GuiTransform — push it
                        if (step.transform) {
                            transformStack.push(step);
                            if (step.isComplex()) {
                                step.transform(dx, dy);
                                dx = dy = 0;
                            } else {
                                dx = dx + system.getDrawPos(step.translate.x) / scale;
                                dy = dy + system.getDrawPos(step.translate.y) / scale;
                            }
                            if (step.alpha != 1) {
                                step.preAlpha = ctx.globalAlpha;
                                ctx.globalAlpha = ctx.globalAlpha * step.alpha;
                            }
                        }
                    }
                } else {
                    // null sentinel — pop and undo the last transform
                    var poppedTransform = transformStack.pop();
                    if (!poppedTransform) throw Error("Gui Draw: tried to undo non existing transform. Too many undos?");
                    if (poppedTransform.isComplex()) {
                        ctx.restore();
                        dx = poppedTransform.prePos.x;
                        dy = poppedTransform.prePos.y;
                    } else {
                        dx = dx - system.getDrawPos(poppedTransform.translate.x) / scale;
                        dy = dy - system.getDrawPos(poppedTransform.translate.y) / scale;
                    }
                    if (poppedTransform.alpha != 1) ctx.globalAlpha = poppedTransform.preAlpha;
                }
            }
            if (transformStack.length > 0) throw Error("Exited gui draw with transform remaining. Forgot to undo transform");
        }
    });

    // z-order counter reset each frame; used to assign `screenCoords.zIndex`.
    var guiZCounter = 0;

    // -------------------------------------------------------------------------
    // ig.Gui  (the singleton GameAddon — accessible as `ig.gui`)
    // -------------------------------------------------------------------------

    ig.Gui = ig.GameAddon.extend({
        /** @type {ig.GuiHook[]} Root-level GUI hooks, sorted by zIndex. */
        guiHooks: [],
        /** @type {Object.<string, ig.GuiElementBase>} Named GUI elements created by event steps. */
        namedGuiElements: {},
        /** True when a screen-blocking GUI element is visible (blocks map rendering). */
        screenBlocked: false,
        /** @type {GuiRenderer} */
        renderer: new GuiRenderer(),
        /** @type {ig.GuiHook[]} Hooks that registered for mouse-over/click callbacks. */
        mouseListenerHooks: [],
        /** @type {Object|null} Optional override for mouse position / click (e.g. gamepad cursor). */
        controlModule: null,

        init: function () {
            this.parent("GUI");
            ig.storage.register(this);
        },

        /** @param {Object} controlModule */
        setControlModule: function (controlModule) {
            this.controlModule = controlModule;
        },

        // --- Storage (save/load named GUI elements across map reloads) ---

        /** @param {Object} storageData */
        onStorageSave: function (storageData) {
            var namedData = {}, name;
            for (name in this.namedGuiElements) {
                var mapGuiInfo = this.namedGuiElements[name].hook.mapGuiInfo;
                namedData[name] = {
                    settings: mapGuiInfo.settings,
                    type:     mapGuiInfo.type
                };
            }
            storageData.gui = namedData;
        },

        /** @param {Object} storageData */
        onStoragePreLoad: function (storageData) {
            this.onReset();
            var savedGui = storageData.gui, name;
            for (name in savedGui) {
                var entry = savedGui[name];
                if (!ig.GUI[entry.type] || !ig.GUI[entry.type]._noGuiSave) {
                    var element = this.createEventGui(name, entry.type, entry.settings, true);
                    this.spawnEventGui(element);
                }
            }
        },

        // --- Deferred update (runs after all game logic, before draw) ---

        deferredUpdateOrder: 500,
        onDeferredUpdate: function () {
            this.screenBlocked = false;
            this.renderer.clearDrawSteps();
            this._updateGuiMouse();
            guiZCounter = 0;
            this._updateRecursive(
                0, 0, ig.system.width, ig.system.height,
                clipRectStack, true,
                this.guiHooks,
                0, 0, 1, true
            );
            ig.game.mapRenderingBlocked = this.screenBlocked;
        },

        postDrawOrder: 500,
        onPostDraw: function () {
            ig.perf.gui && this.renderer.draw();
        },

        onVarsChanged: function () {
            notifyVarsChanged(this.guiHooks);
        },

        // --- Named GUI element management ---

        clearNamedGuiElements: function () {
            for (var name in this.namedGuiElements) this.namedGuiElements[name].remove();
            this.namedGuiElements = {};
        },

        onReset: function () {
            this.clearNamedGuiElements();
            // Remove temporary (event-spawned) hooks.
            for (var i = this.guiHooks.length; i--;) {
                if (this.guiHooks[i].temporary) {
                    this.guiHooks[i].onDetach();
                    this.guiHooks.splice(i, 1);
                }
            }
        },

        /** Debug: log all registered GUI types to the console. */
        logGUIArray: function () {
            console.groupCollapsed("GUI Array Elements:");
            for (var type in ig.GUI) ig.GUI[type] && console.log(type);
            console.groupEnd();
        },

        // --- Event GUI factory / lifecycle ---

        /**
         * Construct a GUI element for use by event steps, but do not add it to the scene yet.
         * @param {string}  name      identifier (may be null/empty)
         * @param {string}  typeName  key into ig.GUI
         * @param {Object}  settings
         * @param {boolean} [free]    if true, element is not pinned (will be freed on map clear)
         * @returns {ig.GuiElementBase|null}
         */
        createEventGui: function (name, typeName, settings, free) {
            var Ctor = ig.GUI[typeName];
            if (!Ctor) return null;
            var element = new Ctor(settings);
            element.hook.mapGuiInfo = {
                name:     name,
                type:     typeName,
                settings: settings,
                free:     free || false
            };
            return element;
        },

        /**
         * Add a previously created event GUI to the scene (or hand it to the type's spawnHandler).
         * @param {ig.GuiElementBase} element
         */
        spawnEventGui: function (element) {
            var mapGuiInfo = element.hook.mapGuiInfo;
            var Ctor = ig.GUI[mapGuiInfo.type];
            if (mapGuiInfo.name) this.namedGuiElements[mapGuiInfo.name] = element;
            if (Ctor.spawnHandler) {
                element.hook.removeAfterTransition = false;
                Ctor.spawnHandler(element);
            } else {
                this.addGuiElement(element);
            }
        },

        /**
         * Mark an event GUI as "free" so it will be cleared when the map unloads.
         * @param {ig.GuiElementBase} element
         */
        freeEventGui: function (element) {
            if (element) {
                element.hook.parentHook
                    ? (element.hook.mapGuiInfo.free = true)
                    : (element.clearCached && element.clearCached());
            }
        },

        /**
         * Add a root-level GUI element and keep the hook list sorted.
         * @param {ig.GuiElementBase} element
         */
        addGuiElement: function (element) {
            var hook = element.hook;
            hook.removeAfterTransition = false;
            if (this.guiHooks.indexOf(hook) == -1) {
                this.guiHooks.push(hook);
                this.guiHooks.sort(sortByZIndex);
                hook.onAttach(this);
            }
        },

        /** Re-sort the root hook list by zIndex. */
        sortGui: function () {
            this.guiHooks.sort(sortByZIndex);
        },

        /**
         * Remove a root-level GUI element.
         * @param {ig.GuiElementBase} element
         */
        removeGuiElement: function (element) {
            this.guiHooks.erase(element.hook);
        },

        // --- Mouse routing ---

        /** Update mouseOver state and fire onMouseInteract on hooks that registered for it. */
        _updateGuiMouse: function () {
            var mouseX, mouseY;
            if (this.controlModule) {
                mouseX = this.controlModule.getMouseX();
                mouseY = this.controlModule.getMouseY();
            } else {
                mouseX = ig.input.mouse.x;
                mouseY = ig.input.mouse.y;
            }

            var topHook = null;
            var guiClick = this.controlModule && this.controlModule.getGuiClick();

            for (var i = 0; i < this.mouseListenerHooks.length; ++i) {
                var hook = this.mouseListenerHooks[i];
                if (hook._visible) {
                    // Lazily compute screenCoords on first mouse check.
                    if (!hook.screenCoords) {
                        hook.screenCoords = {
                            x: 0, y: 0,
                            w: hook.size.x, h: hook.size.y,
                            active: false, zIndex: 0
                        };
                        computeScreenCoords(hook.screenCoords, hook);
                    }
                    var coords = hook.screenCoords;
                    if (coords.active) {
                        var isOver = false;
                        isOver = hook.gui.isMouseOver
                            ? hook.gui.isMouseOver()
                            : (coords.x <= mouseX && coords.x + coords.w > mouseX &&
                               coords.y <= mouseY && coords.y + coords.h > mouseY);

                        if (isOver) {
                            if (topHook) {
                                if (topHook.screenCoords.zIndex < hook.screenCoords.zIndex) {
                                    topHook.mouseOver = false;
                                    topHook.gui.onMouseInteract && topHook.gui.onMouseInteract(false, false);
                                    topHook = hook;
                                } else {
                                    isOver = false;
                                }
                            } else {
                                topHook = hook;
                            }
                        }
                        if (!isOver) {
                            hook.mouseOver = isOver;
                            hook.gui.onMouseInteract && hook.gui.onMouseInteract(false, false);
                        }
                    }
                }
            }
            if (topHook) {
                topHook.mouseOver = true;
                topHook.gui.onMouseInteract && topHook.gui.onMouseInteract(true, guiClick);
            }
        },

        // --- Recursive update tree ---

        /**
         * Recursively update, cull, and enqueue draw-steps for all GUI hooks in `hooks`.
         *
         * Parameters carry the accumulated clip rect (stored in `clipRectStack` as 4 values),
         * the parent's visible flag `doVisible`, the parent's world-space position `parentX/Y`,
         * the inherited alpha `inheritedAlpha`, and whether the parent is active `isActive`.
         *
         * @param {number}      scrollX         parent scroll offset X
         * @param {number}      scrollY         parent scroll offset Y
         * @param {number}      parentW         parent container width
         * @param {number}      parentH         parent container height
         * @param {number[]}    clipRectStack   flat stack of (clipX, clipY, clipW, clipH) quads
         * @param {boolean}     doVisible       whether parent is in a visible subtree
         * @param {ig.GuiHook[]} hooks          the child list to iterate
         * @param {number}      parentScreenX   accumulated screen X for screenCoords
         * @param {number}      parentScreenY   accumulated screen Y for screenCoords
         * @param {number}      inheritedAlpha  product of all ancestor alphas
         * @param {boolean}     isActive        whether the hook should receive update() calls
         * @returns {boolean}  true if any child has an active transition (subtreeTransition)
         */
        _updateRecursive: function (
            scrollX, scrollY, parentW, parentH,
            clipRectStack, doVisible,
            hooks,
            parentScreenX, parentScreenY,
            inheritedAlpha, isActive
        ) {
            var hasClip = clipRectStack.length > 0;
            var anyTransition = false;

            for (var hookIdx = 0; hookIdx < hooks.length; ++hookIdx) {
                // Read clip rect from top of stack (4 values).
                var clipX, clipY, clipW, clipH;
                if (hasClip) {
                    clipX = clipRectStack[clipRectStack.length - 4];
                    clipY = clipRectStack[clipRectStack.length - 3];
                    clipW = clipRectStack[clipRectStack.length - 2];
                    clipH = clipRectStack[clipRectStack.length - 1];
                }

                var hook = hooks[hookIdx];
                // A hook is active only when the game isn't paused (or the hook is pause-safe).
                var hookActive = isActive && (hooks != this.guiHooks || hook.pauseGui || !ig.game.paused);

                // Remove the hook if its state transition says to.
                if (hookActive && hook.updateState()) {
                    hook.onDetach();
                    hooks.splice(hookIdx, 1);
                    hookIdx--;
                    if (hook.mapGuiInfo) {
                        var guiName = hook.mapGuiInfo.name;
                        if (guiName && this.namedGuiElements[guiName] == hook.gui) {
                            delete this.namedGuiElements[hook.mapGuiInfo.name];
                        }
                        hook.mapGuiInfo.free && hook.gui.clearCached && hook.gui.clearCached();
                    }
                    continue;
                }

                // Run update() for visible (or invisibleUpdate) active hooks.
                var needsUpdate = hookActive;
                if (hookActive && (hook._visible || hook.invisibleUpdate)) {
                    needsUpdate = false;
                    hook.gui.update();
                }

                var hookW = hook.size.x;
                var hookH = hook.size.y;

                // Compute aligned draw position relative to parent.
                var drawX = scrollX + resolveAlignX(hook, parentW);
                var drawY = scrollY + resolveAlignY(hook, parentH);

                var state = hook.currentState;
                var alpha = inheritedAlpha * state.alpha;

                // Screen-blocking detection.
                if (state.alpha == 1 && hook.screenBlocking) ig.gui.screenBlocked = true;

                // Apply state offsets, respecting right/bottom alignment sign.
                drawX = drawX + (hook.align.x == ig.GUI_ALIGN.X_RIGHT ? -state.offsetX : state.offsetX);
                drawY = drawY + (hook.align.y == ig.GUI_ALIGN.Y_BOTTOM ? -state.offsetY : state.offsetY);

                var screenX = parentScreenX + drawX;
                var screenY = parentScreenY + drawY;

                // Cull: hook is in-bounds only when alpha > 0 and scale != 0.
                var inBounds = doVisible && alpha > 0.01 && state.scaleX != 0 && state.scaleY != 0;
                if (inBounds && hasClip) {
                    // Apply clip-space transform.
                    var adjClipX = clipX - drawX;
                    var adjClipY = clipY - drawY;
                    var adjClipW = clipW;
                    var adjClipH = clipH;
                    if (state.scaleX != 1 || state.scaleY != 1 || state.angle != 0) {
                        adjClipX = adjClipX - hook.pivot.x;
                        adjClipY = adjClipY - hook.pivot.y;
                        adjClipX = adjClipX / Math.abs(state.scaleX);
                        adjClipY = adjClipY / Math.abs(state.scaleY);
                        adjClipX = adjClipX + hook.pivot.x;
                        adjClipY = adjClipY + hook.pivot.y;
                        adjClipW = adjClipW / Math.abs(state.scaleX);
                        adjClipH = adjClipH / Math.abs(state.scaleY);
                    }
                    inBounds = !(0 >= adjClipX + adjClipW || 0 >= adjClipY + adjClipH ||
                                 hookW <= adjClipX       || hookH <= adjClipY);
                }

                // Update screenCoords for mouse-hit testing.
                if (hook.screenCoords) {
                    guiZCounter++;
                    hook.screenCoords.x = screenX;
                    hook.screenCoords.y = screenY;
                    hook.screenCoords.w = hook.size.x;
                    hook.screenCoords.h = hook.size.y;
                    hook.screenCoords.active = hookActive;
                    hook.screenCoords.zIndex = guiZCounter;
                    if (hasClip) {
                        if (adjClipX > 0) {
                            hook.screenCoords.x = hook.screenCoords.x + adjClipX;
                            hook.screenCoords.w = hook.screenCoords.w - adjClipX;
                        }
                        if (adjClipY > 0) {
                            hook.screenCoords.y = hook.screenCoords.y + adjClipY;
                            hook.screenCoords.h = hook.screenCoords.h - adjClipY;
                        }
                        hook.screenCoords.w = Math.min(hook.screenCoords.w, adjClipW + (adjClipX < 0 ? adjClipX : 0));
                        hook.screenCoords.h = Math.min(hook.screenCoords.h, adjClipH + (adjClipY < 0 ? adjClipY : 0));
                    }
                }

                // Call update() for in-bounds hooks that didn't already receive it.
                needsUpdate && inBounds && hook.gui.update();

                // Only queue draw steps when the hook has an active transition, is visible, or
                // its subtree has a running transition.
                if (hook._subState.subtreeTransition || inBounds || hook._visible || hook.invisibleUpdate) {
                    var transform = this.renderer.addTransform();
                    transform.setTranslate(drawX, drawY);
                    transform.setScale(state.scaleX, state.scaleY);
                    transform.setPivot(hook.pivot.x, hook.pivot.y);
                    transform.setRotate(state.angle);
                    transform.setAlpha(alpha);
                    hook.clip && transform.setClip(hook.size.x, hook.size.y);

                    var clipThisHook = hook.clip;
                    // Push clip rect for children.
                    if (inBounds && (hasClip || clipThisHook)) {
                        if (clipThisHook) {
                            if (hasClip) {
                                var cX = Math.max(adjClipX, 0);
                                var cY = Math.max(adjClipY, 0);
                                var cX2 = Math.min(adjClipX + adjClipW, hookW);
                                var cY2 = Math.min(adjClipY + adjClipH, hookH);
                                clipRectStack.push(cX, cY, cX2 - cX, cY2 - cY);
                            } else {
                                clipRectStack.push(0, 0, hookW, hookH);
                            }
                        } else {
                            clipRectStack.push(adjClipX, adjClipY, adjClipW, adjClipH);
                        }
                    }

                    setVisibility(hook, inBounds);

                    // Queue the hook's own drawables.
                    if (inBounds && hook.localAlpha > 0) {
                        if (hook.localAlpha != 1) this.renderer.addTransform().setAlpha(hook.localAlpha);
                        hook.gui.updateDrawables(this.renderer);
                        if (hook.localAlpha != 1) this.renderer.undoTransform();
                    }

                    // Recurse into children.
                    var childTransition = this._updateRecursive(
                        hook.scroll.x, hook.scroll.y, hookW, hookH,
                        clipRectStack, inBounds,
                        hook.children,
                        screenX, screenY,
                        alpha, hookActive
                    );
                    hook._subState.subtreeTransition = hook.hasTransition() || childTransition;
                    anyTransition = anyTransition || hook._subState.subtreeTransition;

                    // Pop clip rect.
                    if (inBounds && (hasClip || clipThisHook)) clipRectStack.length = clipRectStack.length - 4;

                    this.renderer.undoTransform();
                }
            }
            return anyTransition;
        },

        // --- Legacy direct-draw path (kept but superseded by renderer) ---

        /**
         * @deprecated  Legacy canvas-direct draw path; superseded by the renderer pipeline.
         *              Kept for reference; may be called from older code paths.
         */
        _drawRecursive: function (parentX, parentY, parentW, parentH, hooks) {
            var ctx = ig.system.context;
            for (var i = 0; i < hooks.length; ++i) {
                var hook  = hooks[i];
                var drawX = parentX;
                var drawY = parentY;
                switch (hook.align.x) {
                    case ig.GUI_ALIGN.X_LEFT:   drawX = drawX + hook.pos.x; break;
                    case ig.GUI_ALIGN.X_RIGHT:  drawX = drawX + (parentW - hook.size.x - hook.pos.x); break;
                    case ig.GUI_ALIGN.X_CENTER: drawX = drawX + Math.floor(parentW / 2 - hook.size.x / 2 + hook.pos.x); break;
                }
                switch (hook.align.y) {
                    case ig.GUI_ALIGN.Y_TOP:    drawY = drawY + hook.pos.y; break;
                    case ig.GUI_ALIGN.Y_BOTTOM: drawY = drawY + (parentH - hook.size.y - hook.pos.y); break;
                    case ig.GUI_ALIGN.Y_CENTER: drawY = drawY + Math.floor(parentH / 2 - hook.size.y / 2 + hook.pos.y); break;
                }
                var state = hook.currentState;
                if (hook._visible) {
                    drawX = drawX + (hook.align.x == ig.GUI_ALIGN.X_RIGHT  ? -state.offsetX : state.offsetX);
                    drawY = drawY + (hook.align.y == ig.GUI_ALIGN.Y_BOTTOM ? -state.offsetY : state.offsetY);
                    var savedAlpha = ctx.globalAlpha;
                    var compositeAlpha = savedAlpha * state.alpha;
                    var localAlpha    = compositeAlpha * hook.localAlpha;
                    var needsSave = false;
                    if (hook.clip || state.scaleX != 1 || state.scaleY != 1 || state.angle != 0) {
                        needsSave = true;
                        ctx.save();
                        ctx.translate(ig.system.getDrawPos(drawX), ig.system.getDrawPos(drawY));
                        drawX = drawY = 0;
                        if (hook.clip) {
                            ctx.beginPath();
                            ctx.rect(0, 0, hook.size.x, hook.size.y);
                            ctx.clip();
                        }
                        if (state.scaleX != 1 || state.scaleY != 1 || state.angle != 0) {
                            ctx.translate(ig.system.getDrawPos(hook.pivot.x), ig.system.getDrawPos(hook.pivot.y));
                            ctx.rotate(state.angle);
                            ctx.scale(state.scaleX, state.scaleY);
                            ctx.translate(-ig.system.getDrawPos(hook.pivot.x), -ig.system.getDrawPos(hook.pivot.y));
                        }
                    }
                    var drawables = hook.drawables;
                    if (localAlpha > 0 && drawables.length > 0) {
                        if (savedAlpha != localAlpha) ctx.globalAlpha = localAlpha;
                        for (var d = 0; d < drawables.length; ++d) drawables[d].draw(drawX, drawY);
                        if (localAlpha != compositeAlpha) ctx.globalAlpha = compositeAlpha;
                    } else if (savedAlpha != compositeAlpha) {
                        ctx.globalAlpha = compositeAlpha;
                    }
                    this._drawRecursive(hook.scroll.x + drawX, hook.scroll.y + drawY, hook.size.x, hook.size.y, hook.children);
                    if (savedAlpha != compositeAlpha) ctx.globalAlpha = savedAlpha;
                    needsSave && ig.system.context.restore();
                }
            }
        },

        // --- Mouse listener registration ---

        /** @param {ig.GuiHook} hook */
        _addMouseListenerHook: function (hook) {
            this.mouseListenerHooks.push(hook);
        },
        /** @param {ig.GuiHook} hook */
        _removeMouseListenerHook: function (hook) {
            this.mouseListenerHooks.erase(hook);
        }
    });

    // Register the singleton.
    ig.addGameAddon(function () {
        return ig.gui = new ig.Gui();
    });

    // -------------------------------------------------------------------------
    // ig.GUI  — type registry for event-spawned GUI elements
    // -------------------------------------------------------------------------

    ig.GUI = {};

    // -------------------------------------------------------------------------
    // ig.GUI_ALIGN  — alignment enum
    // -------------------------------------------------------------------------

    ig.GUI_ALIGN = {};
    ig.GUI_ALIGN.Y_TOP    = 1;
    ig.GUI_ALIGN.Y_CENTER = 2;
    ig.GUI_ALIGN.Y_BOTTOM = 3;
    ig.GUI_ALIGN.X_LEFT   = 4;
    ig.GUI_ALIGN.X_CENTER = 5;
    ig.GUI_ALIGN.X_RIGHT  = 6;

    /** Convenience aliases used by event-step data (string key → numeric constant). */
    ig.GUI_ALIGN_X = {
        LEFT:   ig.GUI_ALIGN.X_LEFT,
        RIGHT:  ig.GUI_ALIGN.X_RIGHT,
        CENTER: ig.GUI_ALIGN.X_CENTER
    };
    ig.GUI_ALIGN_Y = {
        TOP:    ig.GUI_ALIGN.Y_TOP,
        BOTTOM: ig.GUI_ALIGN.Y_BOTTOM,
        CENTER: ig.GUI_ALIGN.Y_CENTER
    };

    // -------------------------------------------------------------------------
    // ig.GuiHook  — scene-graph node
    // -------------------------------------------------------------------------

    ig.GuiHook = ig.Class.extend({
        /** @type {Vec2} Local position within parent. */
        pos: Vec2.create(),
        /** @type {{x:number, y:number}} Pixel dimensions. */
        size:   { x: 1, y: 1 },
        /** @type {{x:number, y:number}} Transform pivot point (local coords). */
        pivot:  { x: 0, y: 0 },
        /** @type {{x:number, y:number}} Scroll offset applied to children. */
        scroll: { x: 0, y: 0 },
        /** @type {{x:number, y:number}} Alignment pair of ig.GUI_ALIGN constants. */
        align:  { x: ig.GUI_ALIGN.X_LEFT, y: ig.GUI_ALIGN.Y_TOP },

        /** @type {ig.GuiHook|ig.Gui|null} Parent hook (or the root ig.Gui when top-level). */
        parentHook:    null,
        /** @type {ig.GuiHook[]} Children. */
        children:      [],
        /** True when this hook has registered for mouse-over callbacks. */
        mouseRecord:   false,
        /** @type {{x,y,w,h,active,zIndex}|null} Cached absolute screen rect for mouse hit-testing. */
        screenCoords:  null,
        /** True when the mouse cursor is over this hook. */
        mouseOver:     false,
        /** Per-element alpha multiplier (separate from state alpha). */
        localAlpha:    1,
        zIndex:        0,
        /** If true, this element stays active when the game is paused. */
        pauseGui:      false,
        /** If true, `gui.update()` is called even when the hook is not visible. */
        invisibleUpdate: false,
        /** If true, the presence of this element blocks map rendering. */
        screenBlocking: false,
        /** @type {Function|null} Callback fired when a state transition completes. */
        stateCallback: null,
        /** If true, clip children to this hook's bounds. */
        clip: false,
        /** If true, removed by `ig.Gui.onReset()` on map transitions. */
        temporary: false,

        /**
         * Transition definitions keyed by state name.
         * Each entry: `{ state: {offsetX,offsetY,alpha,scaleX,scaleY,angle}, time, timeFunction }`.
         */
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.5,
                timeFunction: KEY_SPLINES.EASE
            }
        },

        /** @type {ig.GuiElementBase} Back-reference to the owning GUI element. */
        gui: null,

        /** Live interpolated rendering state (modified every frame during transitions). */
        currentState: {
            offsetX: 0, offsetY: 0,
            alpha:   1,
            scaleX:  1, scaleY: 1,
            angle:   0
        },
        /** Name of the last state passed to `doStateTransition`. */
        currentStateName: "",

        /** Active animation interpolation data. */
        anim: {
            targetState:  null,
            initState:    null,
            timer:        0,
            maxTime:      0,
            timeFunction: null
        },

        /** If true, the hook will remove itself once the current transition finishes. */
        removeAfterTransition: false,
        /** @type {Object|null} Active position transition data. */
        posTransition:    null,
        /** @type {Object|null} Active scroll transition data. */
        scrollTransition: null,

        /** Whether this hook is currently visible (managed by setVisibility). */
        _visible: false,
        /** Sub-state tracking for transition propagation. */
        _subState: { subtreeTransition: false },
        /** @type {{name:string,type:string,settings:Object,free:boolean}|null} Event GUI metadata. */
        mapGuiInfo: null,
        /** @type {Array} Draw steps list (legacy; populated by ig.GuiElementBase wrappers). */
        drawSteps: [],

        /**
         * @param {ig.GuiElementBase} guiElement
         */
        init: function (guiElement) {
            this.gui = guiElement;
            if (guiElement.transitions) {
                this.transitions = guiElement.transitions;
                this.doStateTransition("DEFAULT", true);
            }
        },

        /**
         * Enable or disable mouse-over recording.
         * Automatically registers/deregisters with `ig.gui`.
         * @param {boolean} enabled
         */
        setMouseRecord: function (enabled) {
            if (this.mouseRecord != enabled) {
                this.mouseRecord = enabled;
                this.parentHook && (
                    enabled
                        ? ig.gui._addMouseListenerHook(this)
                        : ig.gui._removeMouseListenerHook(this)
                );
            }
        },

        /**
         * Called when this hook is attached to a parent (or directly to `ig.Gui`).
         * @param {ig.GuiHook|ig.Gui} parent
         */
        onAttach: function (parent) {
            if (this.parentHook != parent) {
                this.parentHook = parent;
                setVisibility(this, parent instanceof ig.Gui ? true : parent._visible);
                this.mouseRecord && ig.gui._addMouseListenerHook(this);
                this.gui.onAttach && this.gui.onAttach();
                for (var i = this.children.length; i--;) this.children[i].onAttach(this);
            }
        },

        /** Called when this hook is removed from its parent. */
        onDetach: function () {
            if (this.parentHook) {
                if (this.mouseRecord) {
                    this.screenCoords = null;
                    ig.gui._removeMouseListenerHook(this);
                }
                for (var i = this.children.length; i--;) this.children[i].onDetach();
                this.gui.onDetach && this.gui.onDetach();
                this.parentHook = null;
            }
        },

        /** @param {ig.GuiHook} childHook */
        getChildGuiIndex: function (childHook) {
            return this.children.indexOf(childHook);
        },
        /** @param {number} index */
        getChildGuiByIndex: function (index) {
            return this.children[index];
        },

        /**
         * Append a child hook (detaching it from any previous parent first).
         * @param {ig.GuiHook} childHook
         */
        addChildHook: function (childHook) {
            childHook.removeAfterTransition = false;
            this.children.erase(childHook);
            childHook.onDetach();
            this.children.push(childHook);
            this.parentHook && childHook.onAttach(this);
        },

        /**
         * Insert a child hook at a specific index.
         * @param {ig.GuiHook} childHook
         * @param {number}     index
         */
        insertChildHook: function (childHook, index) {
            childHook.removeAfterTransition = false;
            this.children.erase(childHook);
            childHook.onDetach();
            this.children.splice(index, 0, childHook);
            this.parentHook && childHook.onAttach(this);
        },

        /**
         * Remove a child hook.
         * @param {ig.GuiHook} childHook
         */
        removeChildHook: function (childHook) {
            childHook.removeAfterTransition = false;
            this.children.erase(childHook);
            childHook.onDetach();
        },

        /**
         * Remove a child hook by index and return it.
         * @param {number} index
         * @returns {ig.GuiHook}
         */
        removeChildHookByIndex: function (index) {
            var removed = this.children.splice(index, 1)[0];
            removed.removeAfterTransition = false;
            removed.onDetach();
            return removed;
        },

        /** Remove all children, detaching each. */
        removeAllChildren: function () {
            for (var i = this.children.length; i--;) {
                this.children[i].onDetach();
                this.children[i].removeAfterTransition = false;
            }
            this.children.length = 0;
        },

        // --- State transitions ---

        /**
         * Transition to a named state (must exist in `this.transitions`).
         * @param {string}   stateName
         * @param {boolean}  [immediate]      if true, skip the animation (snap to end)
         * @param {boolean}  [removeAfter]    if true, remove after transition completes
         * @param {Function} [callback]       called when the transition ends
         * @param {number}   [delay]          seconds before transition starts
         */
        doStateTransition: function (stateName, immediate, removeAfter, callback, delay) {
            var transitionDef = this.transitions[stateName];
            if (!transitionDef) throw Error("No Transition found with name: " + stateName);
            if (!this.removeAfterTransition) {
                this.removeAfterTransition = removeAfter || false;
                this.stateCallback = null;
                if (!immediate) {
                    // Mark all ancestors as having a subtree transition.
                    for (var ancestor = this.parentHook; ancestor && ancestor != ig.gui;) {
                        ancestor._subState.subtreeTransition = true;
                        ancestor = ancestor.parentHook;
                    }
                }
                if (this.currentStateName == stateName) {
                    if (callback) this.stateCallback = callback;
                    this.anim.timer = Math.max(this.anim.timer, immediate ? transitionDef.time : 0 - (delay || 0));
                } else {
                    this.currentStateName = stateName;
                    this._setStateData(transitionDef.state, transitionDef.time, transitionDef.timeFunction, immediate, removeAfter, callback, delay);
                }
            }
        },

        /**
         * @returns {number} 0..1 progress of the current state transition.
         */
        getStateTransitionProgress: function () {
            return !this.anim.maxTime ? 1 : Math.min(1, this.anim.timer / this.anim.maxTime);
        },

        /**
         * Begin an ad-hoc (unnamed) state transition.
         * @param {Object}   targetState  {offsetX, offsetY, alpha, scaleX, scaleY, angle}
         * @param {number}   time
         * @param {Object}   timeFunction  KEY_SPLINES entry
         * @param {boolean}  [immediate]
         * @param {boolean}  [removeAfter]
         * @param {Function} [callback]
         * @param {number}   [delay]
         */
        doTempStateTransition: function (targetState, time, timeFunction, immediate, removeAfter, callback, delay) {
            if (!this.removeAfterTransition) {
                this.removeAfterTransition = removeAfter || false;
                this.currentStateName = null;
                this._setStateData(targetState, time, timeFunction, immediate, removeAfter, callback, delay);
            }
        },

        /**
         * Instantly set both scale axes.
         * @param {number} scaleX
         * @param {number} scaleY
         */
        setScale: function (scaleX, scaleY) {
            this.currentState.scaleX = scaleX;
            this.currentState.scaleY = scaleY;
        },

        /**
         * Internal: configure the animation interpolation.
         * @param {Object}   targetStateFields
         * @param {number}   time
         * @param {Object}   timeFunction
         * @param {boolean}  immediate
         * @param {boolean}  removeAfter
         * @param {Function} [callback]
         * @param {number}   [delay]
         */
        _setStateData: function (targetStateFields, time, timeFunction, immediate, removeAfter, callback, delay) {
            if (callback) this.stateCallback = callback;
            this.anim.initState = ig.copy(this.currentState);
            var fullTarget = {
                offsetX: 0, offsetY: 0,
                alpha:   1,
                scaleX:  1, scaleY: 1,
                angle:   0
            };
            for (var key in targetStateFields) fullTarget[key] = targetStateFields[key];
            this.anim.targetState  = fullTarget;
            this.anim.maxTime      = time;
            this.anim.timer        = immediate ? time : 0 - (delay || 0);
            this.anim.timeFunction = timeFunction;
            if (immediate) this.currentState = ig.copy(fullTarget);
        },

        // --- Position transition ---

        /**
         * Smoothly move `pos` to (destX, destY) over `time` seconds.
         * @param {number}   destX
         * @param {number}   destY
         * @param {number}   time
         * @param {Object}   [timeFunction]
         * @param {number}   [delay]
         * @param {boolean}  [keepAtLeastRemaining]  if true, don't shorten an in-progress transition
         * @param {Function} [endCallback]
         */
        doPosTranstition: function (destX, destY, time, timeFunction, delay, keepAtLeastRemaining, endCallback) {
            if (keepAtLeastRemaining) {
                time = Math.max(time, this.posTransition ? this.posTransition.time - this.posTransition.timer : 0);
            }
            if (!time || time <= 0) {
                this.pos.x = destX;
                this.pos.y = destY;
                this.posTransition = null;
            } else {
                this.posTransition = {
                    startX: this.pos.x,
                    startY: this.pos.y,
                    x: destX, y: destY,
                    time: time,
                    timeFunction: timeFunction || KEY_SPLINES.EASE_IN_OUT,
                    timer: 0 - (delay || 0),
                    endCallback: endCallback
                };
            }
        },

        /**
         * @returns {number} 0..1 progress of the active position transition, or 1 if none.
         */
        getPosTransitionProgress: function () {
            return !this.posTransition
                ? 1
                : this.posTransition.timeFunction.get(this.posTransition.timer / this.posTransition.time);
        },

        // --- Scroll transition ---

        /**
         * Smoothly animate `scroll` to (destX, destY).
         * @param {number}   destX
         * @param {number}   destY
         * @param {number}   time
         * @param {Object}   [timeFunction]
         * @param {Function} [endCallback]
         */
        doScrollTransition: function (destX, destY, time, timeFunction, endCallback) {
            if (!time || time <= 0 ||
                (Math.abs(destX - this.scroll.x) < ig.COLLISION.EPS &&
                 Math.abs(destY - this.scroll.y) < ig.COLLISION.EPS))
            {
                this.scroll.x = destX;
                this.scroll.y = destY;
                this.scrollTransition = null;
            } else {
                this.scrollTransition = {
                    startX: this.scroll.x,
                    startY: this.scroll.y,
                    x: destX, y: destY,
                    time: time,
                    timeFunction: timeFunction || KEY_SPLINES.EASE_IN_OUT,
                    timer: 0,
                    endCallback: endCallback || null
                };
            }
        },

        /** @returns {boolean} True while a state transition is actively animating. */
        hasTransition: function () {
            return !!this.anim.targetState;
        },

        /**
         * @returns {number} 0..1 clamped factor of the current transition.
         */
        getTransitionFactor: function () {
            return (this.anim.timer / this.anim.maxTime).limit(0, 1);
        },

        /**
         * Override a single state property in the transition definition for `stateName`.
         * @param {string} stateName
         * @param {string} propertyKey
         * @param {*}      value
         */
        setStateValue: function (stateName, propertyKey, value) {
            this.transitions[stateName] && (this.transitions[stateName].state[propertyKey] = value);
        },

        /**
         * Advance all active transitions by one frame.
         * @returns {boolean|undefined}  true (i.e. `removeAfterTransition`) when the hook should
         *          be removed; returns nothing/false otherwise.
         */
        updateState: function () {
            // --- Position transition ---
            if (this.posTransition) {
                this.posTransition.timer = this.posTransition.timer + ig.system.actualTick;
                var posT = Math.min(1, Math.max(0, this.posTransition.timer) / this.posTransition.time);
                posT = this.posTransition.timeFunction.get(posT);
                this.pos.x = this.posTransition.startX * (1 - posT) + this.posTransition.x * posT;
                this.pos.y = this.posTransition.startY * (1 - posT) + this.posTransition.y * posT;
                if (posT == 1) {
                    this.posTransition.endCallback && this.posTransition.endCallback();
                    this.posTransition = null;
                }
            }

            // --- Scroll transition ---
            if (this.scrollTransition) {
                this.scrollTransition.timer = this.scrollTransition.timer + ig.system.actualTick;
                var scrollT = Math.min(1, this.scrollTransition.timer / this.scrollTransition.time);
                scrollT = this.scrollTransition.timeFunction.get(scrollT);
                this.scroll.x = this.scrollTransition.startX * (1 - scrollT) + this.scrollTransition.x * scrollT;
                this.scroll.y = this.scrollTransition.startY * (1 - scrollT) + this.scrollTransition.y * scrollT;
                if (scrollT == 1) {
                    var cb = this.scrollTransition.endCallback;
                    this.scrollTransition = null;
                    cb && cb();
                }
            }

            // --- State (alpha / scale / offset / angle) transition ---
            if (this.anim.targetState) {
                this.anim.timer = this.anim.timer + ig.system.actualTick;
                var animT = (this.anim.timer / this.anim.maxTime).limit(0, 1);
                animT = this.anim.timeFunction.get(animT);
                for (var key in this.anim.targetState) {
                    this.currentState[key] =
                        (1 - animT) * this.anim.initState[key] + animT * this.anim.targetState[key];
                }
                if (animT == 1) {
                    this.anim.targetState = null;
                    if (this.stateCallback) {
                        var cb = this.stateCallback;
                        this.stateCallback = null;
                        cb();
                    }
                } else {
                    return false;  // still animating — do not remove
                }
            }

            return this.removeAfterTransition;
        }
    });

    // -------------------------------------------------------------------------
    // ig.GuiDrawable  — a single pooled draw command
    // -------------------------------------------------------------------------

    /**
     * Drawn types:
     *   0 = empty / killed
     *   1 = sprite image  (ig.Image / ig.ImageAtlasFragment)
     *   2 = tiled pattern (ig.ImagePattern)
     *   3 = solid color   (CSS color string)
     *   4 = text block    (ig.TextBlock)
     *   5 = video         (ig.Video)
     *   6 = game-state    (ig.GameState)
     */
    ig.GuiDrawable = ig.Class.extend({
        pos:  { x: 0, y: 0 },
        size: { x: 0, y: 0 },
        src:  { x: 0, y: 0 },
        gfxSource: null,
        /** @type {number} Draw type (0–6). */
        gfxType: 0,
        flip: { x: false, y: false },
        alpha: 1,
        compositionMode: "source-over",

        setPos:  function (x, y) { this.pos.x = x;  this.pos.y = y;  return this; },
        setSize: function (w, h) { this.size.x = w; this.size.y = h; return this; },
        setSrc:  function (x, y) { this.src.x = x;  this.src.y = y;  return this; },
        setAlpha: function (a) { this.alpha = a; return this; },
        setCompositionMode: function (mode) {
            this.compositionMode = mode || "source-over";
            return this;
        },

        /**
         * Configure as a solid-color fill rect.
         * @param {string} color  CSS color
         */
        setColor: function (color, posX, posY, width, height) {
            this.gfxSource = color;
            this.gfxType   = 3;
            this.setPos(posX, posY);
            this.setSize(width, height);
            return this;
        },

        /**
         * Configure as a sprite image draw.
         * @param {ig.Image|ig.ImageAtlasFragment} image
         */
        setGfx: function (image, posX, posY, srcX, srcY, width, height, flipX, flipY) {
            if (window.IG_GAME_DEBUG && !(image instanceof ig.Image || image instanceof ig.ImageAtlasFragment)) {
                throw Error("Invalid setGfx Call. gfx is not instance of ig.Image");
            }
            this.gfxSource = image;
            this.gfxType   = 1;
            this.setPos(posX, posY);
            this.setSrc(srcX, srcY);
            this.setSize(width, height);
            this.flip.x = flipX || false;
            this.flip.y = flipY || false;
            return this;
        },

        /**
         * Configure as a tile draw (tile index → source rect computed from sheet width).
         * @param {ig.Image} image
         * @param {number}   tileIndex
         * @param {number}   tileWidth
         * @param {number}   [tileHeight]  defaults to tileWidth
         */
        setGfxTile: function (image, posX, posY, tileIndex, tileWidth, tileHeight, flipX, flipY) {
            if (window.IG_GAME_DEBUG && !(image instanceof ig.Image)) {
                throw Error("Invalid setGfxTile Call. gfx is not instance of ig.Image");
            }
            tileHeight = tileHeight || tileWidth;
            var srcX = Math.floor(tileIndex * tileWidth) % image.width;
            var srcY = Math.floor(tileIndex * tileWidth / image.width) * tileHeight;
            this.setGfx(image, posX, posY, srcX, srcY, tileWidth, tileHeight, flipX, flipY);
            return this;
        },

        /** Configure as a video element draw. */
        setVideo: function (video, posX, posY, width, height) {
            if (window.IG_GAME_DEBUG && !(video instanceof ig.Video)) {
                throw Error("Invalid setVideo Call. video is not instance of ig.Video");
            }
            this.gfxSource = video;
            this.gfxType   = 5;
            this.setPos(posX, posY);
            this.setSize(width, height);
            return this;
        },

        /** Configure as a game-state forced draw. */
        setGameStateDraw: function (gameState, posX, posY) {
            if (window.IG_GAME_DEBUG && !(gameState instanceof ig.GameState)) {
                throw Error("Invalid setGameStateDraw Call. gamestate is not instance of ig.GameState");
            }
            this.gfxSource = gameState;
            this.gfxType   = 6;
            this.setPos(posX, posY);
            return this;
        },

        /** Configure as a tiled pattern draw. */
        setPattern: function (pattern, posX, posY, srcX, srcY, width, height) {
            if (window.IG_GAME_DEBUG && !(pattern instanceof ig.ImagePattern)) {
                throw Error("Invalid setPattern Call. gfx is not instance of ig.ImagePattern");
            }
            this.gfxSource = pattern;
            this.gfxType   = 2;
            this.color = this.gfx = null;
            this.setPos(posX, posY);
            this.setSrc(srcX, srcY);
            this.setSize(width, height);
            return this;
        },

        /** Configure as a TextBlock draw. */
        setText: function (textBlock, posX, posY) {
            if (window.IG_GAME_DEBUG && !(textBlock instanceof ig.TextBlock)) {
                throw Error("Invalid setText Call. gfx is not instance of ig.TextBlock");
            }
            this.gfxSource = textBlock;
            this.gfxType   = 4;
            this.setPos(posX, posY);
            return this;
        },

        /**
         * Execute the draw command on the canvas.
         * @param {number} offsetX  accumulated X offset from the current transform chain
         * @param {number} offsetY  accumulated Y offset from the current transform chain
         */
        draw: function (offsetX, offsetY) {
            var sys = ig.system,
                ctx = sys.context,
                scale = sys.scale,
                drawX = offsetX + this.pos.x,
                drawY = offsetY + this.pos.y;
            var savedAlpha, savedComposite;

            if (this.alpha != 1) {
                savedAlpha = ctx.globalAlpha;
                ctx.globalAlpha = ctx.globalAlpha * this.alpha;
            }
            if (this.compositionMode != "source-over") {
                savedComposite = ctx.globalCompositeOperation;
                ctx.globalCompositeOperation = this.compositionMode;
            }

            switch (this.gfxType) {
                case 3:  // color
                    ctx.fillStyle = this.gfxSource;
                    ctx.fillRect(sys.getDrawPos(drawX), sys.getDrawPos(drawY), this.size.x * scale, this.size.y * scale);
                    break;
                case 1:  // sprite
                    this.gfxSource.draw(drawX, drawY, this.src.x, this.src.y, this.size.x, this.size.y, this.flip.x, this.flip.y);
                    break;
                case 5:  // video
                    this.gfxSource.draw(drawX, drawY, this.size.x, this.size.y);
                    break;
                case 6:  // game-state
                    this.gfxSource.forceDraw(drawX, drawY);
                    break;
                case 2:  // pattern
                    this.gfxSource.draw(drawX, drawY, this.src.x, this.src.y, this.size.x, this.size.y);
                    break;
                case 4:  // text
                    this.gfxSource.draw(drawX, drawY);
                    break;
            }

            if (ctx.globalCompositeOperation != "source-over") ctx.globalCompositeOperation = savedComposite;
            if (this.alpha != 1) ctx.globalAlpha = savedAlpha;
        },

        /** Return this drawable to the pool. */
        kill: function () {
            this.gfxSource = null;
            this.gfxType   = 0;
            guiStepPool.free(this);
        },

        /** Reset mutable fields (called by the pool on reuse). */
        clear: function () {
            this.alpha = 1;
            this.src.x = this.src.y = this.size.x = this.size.y = undefined;
            this.flip.x = this.flip.y = false;
            this.compositionMode = "source-over";
        }
    });

    // -------------------------------------------------------------------------
    // ig.GuiTransform  — a pooled canvas-transform command
    // -------------------------------------------------------------------------

    ig.GuiTransform = ig.Class.extend({
        translate: { x: 0, y: 0 },
        scale:     { x: 1, y: 1 },
        rotate:    0,
        pivot:     { x: 0, y: 0 },
        alpha:     1,
        /** Clip rect dimensions (0 = no clip). */
        clip:      { x: 0, y: 0 },
        /** Canvas position saved before a complex transform (for undo). */
        prePos:    { x: 0, y: 0 },
        preAlpha:  0,

        setAlpha:     function (a) { this.alpha = a; return this; },
        setClip:      function (w, h) { this.clip.x = w; this.clip.y = h; return this; },
        setTranslate: function (x, y) { this.translate.x = x; this.translate.y = y; return this; },
        setScale:     function (x, y) { this.scale.x = x; this.scale.y = y; return this; },
        setRotate:    function (a) { this.rotate = a; return this; },
        setPivot:     function (x, y) { this.pivot.x = x; this.pivot.y = y; return this; },

        /**
         * A transform is "complex" (requires canvas save/restore) when it has non-identity
         * scale, non-zero rotation, or a clip rect.
         * @returns {boolean}
         */
        isComplex: function () {
            return this.scale.x != 1 || this.scale.y != 1 || this.rotate || this.clip.x != 0;
        },

        /**
         * Apply this transform to the canvas context (saves context state).
         * @param {number} dx  current accumulated draw offset X
         * @param {number} dy  current accumulated draw offset Y
         */
        transform: function (dx, dy) {
            var sys   = ig.system,
                ctx   = sys.context,
                scale = sys.scale;
            ctx.save();
            this.prePos.x = dx;
            this.prePos.y = dy;
            ctx.translate(
                ig.system.getDrawPos(dx + this.translate.x),
                ig.system.getDrawPos(dy + this.translate.y)
            );
            if (this.clip.x != 0) {
                ctx.beginPath();
                ctx.rect(0, 0, this.clip.x * scale, this.clip.y * scale);
                ctx.clip();
            }
            if (this.scale.x != 1 || this.scale.y != 1 || this.rotate != 0) {
                ctx.translate(ig.system.getDrawPos(this.pivot.x), ig.system.getDrawPos(this.pivot.y));
                ctx.rotate(this.rotate);
                ctx.scale(this.scale.x || 1e-4, this.scale.y || 1e-4);
                ctx.translate(-ig.system.getDrawPos(this.pivot.x), -ig.system.getDrawPos(this.pivot.y));
            }
        },

        kill:  function () { guiStepPool.free(this); },
        clear: function () {
            this.translate.x = this.translate.y = 0;
            this.scale.x     = this.scale.y     = 1;
            this.rotate      = 0;
            this.pivot.x     = this.pivot.y = 0;
            this.alpha       = 1;
            this.clip.x      = this.clip.y  = 0;
        }
    });

    // -------------------------------------------------------------------------
    // ig.GuiStepPool  — simple free-list pool for GuiDrawable / GuiTransform
    // -------------------------------------------------------------------------

    ig.GuiStepPool = ig.Class.extend({
        /**
         * Get a recycled instance of `Ctor`, or construct a new one.
         * @param {Function} Ctor
         * @returns {*}
         */
        get: function (Ctor) {
            if (!Ctor.poolEntries) Ctor.poolEntries = [];
            if (Ctor.poolEntries.length) {
                var entry = Ctor.poolEntries.pop();
                entry.clear();
                return entry;
            }
            return new Ctor();
        },

        /**
         * Return an instance to the pool.
         * @param {*} instance
         */
        free: function (instance) {
            var Ctor = instance.constructor;
            if (!Ctor.poolEntries) Ctor.poolEntries = [];
            Ctor.poolEntries.push(instance);
        }
    });

    // Module-level pool singleton (used by GuiRenderer, GuiDrawable, GuiTransform).
    var guiStepPool = new ig.GuiStepPool();

    // -------------------------------------------------------------------------
    // ig.GuiElementBase  — base class for all GUI widgets
    // -------------------------------------------------------------------------

    ig.GuiElementBase = ig.Class.extend({
        /** @type {ig.GuiHook} */
        hook: null,

        init: function () {
            this.hook = new ig.GuiHook(this);
        },

        // --- Position / size / layout helpers ---

        /** @param {number} x @param {number} y */
        setPos: function (x, y) {
            var hook = this.hook;
            hook.pos.x = x || 0;
            hook.pos.y = y || 0;
            hook.posTransition = null;
        },
        /** @returns {{x,y}} Destination pos (posTransition target, or current pos). */
        getDestPos: function () {
            var hook = this.hook;
            return hook.posTransition || hook.pos;
        },
        /** @param {number} x @param {number} y */
        setScroll: function (x, y) {
            var hook = this.hook;
            hook.scroll.x = x;
            hook.scroll.y = y;
            hook.scrollTransition = null;
        },
        /** @returns {{x,y}} Destination scroll. */
        getDestScroll: function () {
            var hook = this.hook;
            return hook.scrollTransition || hook.scroll;
        },
        /** @param {number} w @param {number} h */
        setSize: function (w, h) {
            var hook = this.hook;
            hook.size.x = w;
            hook.size.y = h;
        },
        /** @param {number} x @param {number} y */
        setPivot: function (x, y) {
            var hook = this.hook;
            hook.pivot.x = x;
            hook.pivot.y = y;
        },
        /**
         * @param {number} alignX  ig.GUI_ALIGN.X_*
         * @param {number} alignY  ig.GUI_ALIGN.Y_*
         */
        setAlign: function (alignX, alignY) {
            var hook = this.hook;
            hook.align.x = alignX;
            hook.align.y = alignY;
        },
        /** @returns {boolean} */
        isVisible: function () { return this.hook._visible; },

        // --- Child management (delegates to hook) ---

        /** @param {ig.GuiElementBase} child */
        getChildGuiIndex: function (child) { return this.hook.getChildGuiIndex(child.hook); },
        /** @param {number} index @returns {ig.GuiHook} */
        getChildGuiByIndex: function (index) { return this.hook.getChildGuiByIndex(index); },
        /** @param {ig.GuiElementBase} child */
        addChildGui: function (child) { this.hook.addChildHook(child.hook); },
        /** @param {ig.GuiElementBase} child @param {number} index */
        insertChildGui: function (child, index) { this.hook.insertChildHook(child.hook, index); },
        /** @param {ig.GuiElementBase} child */
        removeChildGui: function (child) { this.hook.removeChildHook(child.hook); },
        /** @param {number} index @returns {ig.GuiElementBase} */
        removeChildGuiByIndex: function (index) { return this.hook.removeChildHookByIndex(index).gui; },
        removeAllChildren: function () { this.hook.removeAllChildren(); },

        // --- Lifecycle hooks (overridden by subclasses) ---
        update: function () {},
        updateDrawables: function () {},

        /**
         * Schedule or immediately remove this element.
         * @param {boolean} immediate  if true, detach now; otherwise mark for removal after transition.
         */
        remove: function (immediate) {
            if (immediate) {
                this.hook.onDetach();
                this.hook.removeAfterTransition = false;
            } else {
                this.hook.removeAfterTransition = true;
            }
        },

        // Overridable callbacks (null = not implemented).
        onAttach:          null,
        onDetach:          null,
        onVisibilityChange: null,
        isMouseOver:       null,

        // Default no-op show/hide (overridden by e.g. ig.SimpleGui).
        hide: function () {},
        show: function () {},

        // --- State transition pass-throughs ---

        doStateTransition: function (stateName, immediate, removeAfter, callback, delay) {
            this.hook.doStateTransition(stateName, immediate, removeAfter, callback, delay);
        },
        doTempStateTransition: function (targetState, time, timeFunction, immediate, removeAfter, callback, delay) {
            this.hook.doTempStateTransition(targetState, time, timeFunction, immediate, removeAfter, callback, delay);
        },
        doPosTranstition: function (destX, destY, time, timeFunction, delay, keepAtLeast, endCallback) {
            this.hook.doPosTranstition(destX, destY, time, timeFunction, delay, keepAtLeast, endCallback);
        },
        doScrollTransition: function (destX, destY, time, timeFunction, endCallback) {
            this.hook.doScrollTransition(destX, destY, time, timeFunction, endCallback);
        },
        hasTransition:       function () { return this.hook.hasTransition(); },
        getTransitionFactor: function () { return this.hook.getTransitionFactor(); },
        setStateValue:       function (stateName, key, value) { this.hook.setStateValue(stateName, key, value); }
    });
});

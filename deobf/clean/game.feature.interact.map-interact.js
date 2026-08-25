/**
 * @module game.feature.interact.map-interact
 *
 * Map-level interaction system. Maintains interact entries for entities in
 * the world, computes each entry's state (HIDDEN/AWAY/NEAR/BLOCKED/FOCUS/
 * RUNNING) each frame based on distance, line of sight, z-condition, and
 * combat state, and drives the floating interact icon GUIs.
 */
ig.module("game.feature.interact.map-interact").requires("impact.base.game", "game.feature.model.game-model", "game.feature.interact.gui.interact-gui").defines(function() {
    var TRACE_RESULT = {
            dist: 1,
            dir: {
                x: 0,
                y: 0
            }
        },
        HIT_ENTITIES = [],
        ENTITY_CENTER = Vec2.create(),
        PLAYER_CENTER = Vec2.create(),
        TO_ENTITY = Vec2.create(),
        MOUSE_DIST = Vec2.create(),
        TILE_SRC = {},
        SCREEN_POS = Vec2.create();
    sc.INTERACT_Z_CONDITION = {
        SAME_Z: 1,
        Z_RANGE_OVERLAP: 2
    };
    sc.INTERACT_ENTRY_STATE = {
        HIDDEN: 0,
        AWAY: 1,
        NEAR: 2,
        BLOCKED: 3,
        FOCUS: 4,
        RUNNING: 5
    };
    sc.MapInteract = ig.GameAddon.extend({
        entries: [],
        focusEntry: null,
        interacting: false,
        hidden: false,
        init: function() {
            this.parent("MapInteract")
        },
        addEntry: function(entry) {
            if (this.entries.indexOf(entry) == -1) {
                this.entries.push(entry);
                ig.gui.addGuiElement(entry.gui)
            }
        },
        removeEntry: function(entry) {
            entry.gui.remove();
            this.entries.erase(entry)
        },
        preUpdateOrder: 0,
        onPreUpdate: function() {
            var interactDown = !sc.control.interactDown(),
                processEntries = true;
            if (!ig.game.paused) {
                this.updateHideStatus();
                if (this.hidden) {
                    interactDown = true;
                    processEntries = false
                }
                var player = ig.game.playerEntity;
                if (player) player.getCenter(PLAYER_CENTER);
                else {
                    interactDown = true;
                    processEntries = false
                }
                if (this.interacting)
                    if (interactDown) {
                        if (this.focusEntry.handler.onInteractionEnd) this.focusEntry.handler.onInteractionEnd();
                        this.focusEntry = null;
                        this.interacting = false
                    } else processEntries = false;
                else this.focusEntry = null;
                for (var bestScore = -1, i = this.entries.length, bestEntry; i--;) {
                    var entry = this.entries[i],
                        entity = entry.entity;
                    if (entity._killed) this.removeEntry(entry);
                    else if (processEntries) {
                        var state = sc.INTERACT_ENTRY_STATE.AWAY;
                        if (entry.blockedDuringCombat && sc.model.isCombatActive()) state = sc.INPUT_FORCER_ENTRIES.HIDDEN;
                        else if (ig.EntityTools.isInScreen(entity, 16)) {
                            entity.getCenter(ENTITY_CENTER);
                            Vec2.sub(ENTITY_CENTER, PLAYER_CENTER, TO_ENTITY);
                            var zInRange = false;
                            entry.zCondition == sc.INTERACT_Z_CONDITION.SAME_Z ? zInRange = Math.abs(player.coll.pos.z - entity.coll.pos.z) <= ig.COLLISION.HEIGHT_TOLERATE :
                                entry.zCondition == sc.INTERACT_Z_CONDITION.Z_RANGE_OVERLAP && (zInRange = entity.coll.pos.z + entity.coll.size.z >= player.coll.pos.z && player.coll.pos.z + player.coll.size.z >= entity.coll.pos.z);
                            player.coll.pos.z > player.coll.baseZPos && (zInRange = false);
                            var distance = Vec2.length(TO_ENTITY);
                            if (zInRange && distance <= 40 + entity.coll.size.y / 2 && (!entry.interrupting || ig.game.isInterruptible() && !sc.model.isMapLeaveBlocked()) && !player.interactObject) {
                                TRACE_RESULT.dist = 1;
                                TRACE_RESULT.dir.x = 0;
                                TRACE_RESULT.dir.y = 0;
                                HIT_ENTITIES = [];
                                if (!ig.game.trace(TRACE_RESULT, PLAYER_CENTER.x, PLAYER_CENTER.y, Math.floor(player.coll.pos.z + player.coll.size.z * 0.75), TO_ENTITY.x, TO_ENTITY.y, 2, 2, 2, ig.COLLTYPE.IGNORE, player, HIT_ENTITIES) || HIT_ENTITIES[0] == entity.coll || (1 - TRACE_RESULT.dist) * distance < entity.coll.size.x /
                                    2 + 16) {
                                    state = sc.INTERACT_ENTRY_STATE.NEAR;
                                    if (entry.handler.isInteractionBlocked && entry.handler.isInteractionBlocked()) state = sc.INTERACT_ENTRY_STATE.BLOCKED;
                                    else {
                                        var score = -1;
                                        if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) Vec2.angle(TO_ENTITY, player.face) < Math.PI / 2 ? score = distance : distance < 16 && (score = distance + 100);
                                        else {
                                            ig.system.getScreenFromMapPos(SCREEN_POS, entity.coll.pos.x + entity.coll.size.x / 2, entity.coll.pos.y - entity.coll.pos.z + entity.coll.size.y / 2 - entity.coll.size.z / 2);
                                            MOUSE_DIST.x = sc.control.getMouseX() - SCREEN_POS.x;
                                            MOUSE_DIST.y = sc.control.getMouseY() - SCREEN_POS.y;
                                            distance = Vec2.length(MOUSE_DIST);
                                            entity = Math.max(32, (entity.coll.size.y + entity.coll.size.z) / 2);
                                            distance <= entity && (score = distance)
                                        }
                                        if (score != -1 && (bestScore == -1 || score < bestScore)) {
                                            bestScore = score;
                                            this.focusEntry = entry
                                        }
                                    }
                                }
                            }
                        } else state = sc.INTERACT_ENTRY_STATE.HIDDEN;
                        entry.setState(state)
                    } else entry != this.focusEntry && entry.setState(sc.INTERACT_ENTRY_STATE.HIDDEN)
                }
                if (processEntries && this.focusEntry)
                    if (sc.control.interactPressed() && !ig.interact.isBlocked()) {
                        var interactionResult = null;
                        this.focusEntry.handler.onInteraction && (interactionResult = this.focusEntry.handler.onInteraction());
                        if (interactionResult !== false) {
                            this.focusEntry.setState(sc.INTERACT_ENTRY_STATE.RUNNING);
                            ig.interact.setBlockDelay();
                            this.interacting = true
                        } else this.focusEntry.setState(sc.INTERACT_ENTRY_STATE.FOCUS)
                    } else this.focusEntry.setState(sc.INTERACT_ENTRY_STATE.FOCUS)
            }
        },
        updateHideStatus: function() {
            var controlsBlocked = ig.game.isControlBlocked();
            if (this.hidden != controlsBlocked)
                if (this.hidden = controlsBlocked)
                    for (controlsBlocked = 0; controlsBlocked < this.entries.length; ++controlsBlocked) this.entries[controlsBlocked].gui.hide()
        },
        forceHide: function() {
            this.hidden = true;
            for (var i = 0; i < this.entries.length; ++i) {
                this.entries[i].setState(sc.INTERACT_ENTRY_STATE.HIDDEN);
                this.entries[i].gui.hook.pauseGui = true;
                this.entries[i].gui.hide()
            }
        },
        forceShow: function() {
            this.hidden = false;
            for (var i = 0; i < this.entries.length; ++i) this.entries[i].gui.hook.pauseGui = false
        }
    });
    ig.addGameAddon(function() {
        return sc.mapInteract =
            new sc.MapInteract
    });
    sc.MapInteractIcon = ig.Class.extend({
        tiles: null,
        noAwayIcon: false,
        anims: {},
        frameTime: 0,
        init: function(tiles, anims, frameTime) {
            this.tiles = tiles;
            this.frameTime = frameTime;
            for (var stateName in anims) this.anims[sc.INTERACT_ENTRY_STATE[stateName]] = anims[stateName]
        },
        hasAnim: function(state) {
            return !!this.anims[state]
        },
        getMaxTimer: function(state) {
            return (this.anims[state] || this.anims[sc.INTERACT_ENTRY_STATE.NEAR]).length * this.frameTime
        },
        updateDrawables: function(drawables, state, timer) {
            var tileSrc = this.tiles.getTileSrc(TILE_SRC, (this.anims[state] || this.anims[sc.INTERACT_ENTRY_STATE.NEAR])[Math.floor(timer /
                    this.frameTime)]),
                tileWidth = this.tiles.width,
                tileHeight = this.tiles.height;
            drawables.addGfx(this.tiles.image, (24 - tileWidth) / 2, 24 - tileHeight, tileSrc.x, tileSrc.y, tileWidth, tileHeight)
        }
    });
    sc.MapInteractEntry = ig.Class.extend({
        entity: null,
        handler: null,
        offset: null,
        state: sc.INTERACT_ENTRY_STATE.HIDDEN,
        icon: null,
        interrupting: false,
        zCondition: sc.INTERACT_Z_CONDITION.Z_RANGE_OVERLAP,
        gui: null,
        blockedDuringCombat: false,
        init: function(entity, handler, icon, zCondition, interrupting) {
            this.entity = entity;
            this.handler = handler;
            this.icon = icon;
            this.zCondition = zCondition || sc.INTERACT_Z_CONDITION.Z_RANGE_OVERLAP;
            this.interrupting = interrupting || false;
            this.gui = new ig.GUI.Interact(entity,
                icon)
        },
        setOffset: function(x, y) {
            if (!this.gui.offset) this.gui.offset = Vec2.create();
            this.gui.offset.x = x;
            this.gui.offset.y = y
        },
        setIcon: function(icon) {
            this.icon = icon;
            this.gui.icon = icon
        },
        setSubGui: function(subGui) {
            this.gui.setSubGui(subGui)
        },
        setState: function(state) {
            this.state = state;
            this.gui.setIconState(state)
        }
    })
});
ig.baked = !0;

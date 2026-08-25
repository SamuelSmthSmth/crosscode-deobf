/**
 * game.feature.npc.entities.npc-entity
 * ====================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.npc.entities.npc-entity")`.
 *
 * The main NPC entity (`ig.ENTITY.NPC`) and its supporting class
 * `sc.NpcState`. NPCs are actor entities backed by a `sc.Character`
 * definition with multiple state pages, each gated by a var condition.
 * They support interaction (talk/shop/trade/arena/quest), xeno-dialog
 * bubbles, door-based enter/leave, and map-interact icons that change
 * per state.
 */
ig.module("game.feature.npc.entities.npc-entity").requires(
    "game.feature.npc.entities.sc-actor",
    "game.feature.character.character",
    "game.feature.interact.map-interact",
    "game.feature.trade.gui.trade-menu"
).defines(function () {

    /* ── Shared defaults ─────────────────────────────────────────── */

    var defaultActorConfig = new ig.ActorConfig({
        jumpingEnabled: true,
        maxVel: 180,
        weight: 200
    });

    var scratchVec3 = Vec3.create();
    Vec2.create(); // (unreferenced Vec2; present in original)

    /** Action: face the player entity. */
    var lookAtPlayerAction = new ig.Action("", [{
        type: "SET_FACE_TO_ENTITY",
        entity: { player: true },
        rotate: true
    }]);

    /** Action: face the direction saved in the "preEventFace" attrib. */
    var lookAtSavedFaceAction = new ig.Action("", [{
        type: "SET_FACE",
        face: { actorAttrib: "preEventFace" },
        rotate: true
    }]);

    /* ── Enums ───────────────────────────────────────────────────── */

    sc.NPC_REACT_TYPE = {
        PUSHABLE: 0,
        FIXED_POS: 1,
        FIXED_FACE: 2
    };

    sc.NPC_GENDER = {
        BOTH: 0,
        MALE: 1,
        FEMALE: 2
    };

    ig.LANG_CONTEXT.NPC = function (entity) {
        return "NPC[" + (entity.settings.name || "") + "]";
    };

    /* ── ig.ENTITY.NPC ───────────────────────────────────────────── */

    ig.ENTITY.NPC = sc.ActorEntity.extend({
        characterName: null,
        character: null,
        npcStates: [],
        npcStatesData: null,
        activeStateIdx: -1,
        configs: {},
        hidden: false,
        interactEntry: null,
        eventBlocked: false,
        deferredReset: false,
        npcEffects: new ig.EffectSheet("npc"),

        interactIcons: {
            normal: new sc.MapInteractIcon(
                new ig.TileSheet("media/gui/map-icon.png", 24, 24), {
                    FOCUS: [0, 1, 2, 3, 4, 5, 5, 5],
                    NEAR: [6]
                }, 0.1
            ),
            shop: new sc.MapInteractIcon(
                new ig.TileSheet("media/gui/map-icon.png", 24, 24, 0, 240), {
                    FOCUS: [0, 0, 1, 2, 3, 0, 0, 0, 0],
                    NEAR: [4],
                    AWAY: [5]
                }, 0.1
            ),
            quest: new sc.MapInteractIcon(
                new ig.TileSheet("media/gui/map-icon.png", 24, 24, 0, 216), {
                    FOCUS: [1, 0, 1, 2, 3, 2],
                    NEAR: [4],
                    AWAY: [5]
                }, 0.1
            ),
            arena: new sc.MapInteractIcon(
                new ig.TileSheet("media/gui/map-icon.png", 24, 24, 0, 264), {
                    FOCUS: [1, 0, 1, 2, 3, 2],
                    NEAR: [4],
                    AWAY: [5]
                }, 0.1
            ),
            newMsg: new sc.MapInteractIcon(
                new ig.TileSheet("media/gui/map-icon.png", 24, 24), {
                    FOCUS: [0, 1, 2, 3, 4, 5, 5, 5],
                    NEAR: [6],
                    AWAY: [7]
                }, 0.1
            ),
            trade: new sc.MapInteractIcon(
                new ig.TileSheet("media/gui/map-icon.png", 40, 24, 0, 144), {
                    FOCUS: [0, 1, 2, 3],
                    NEAR: [4],
                    AWAY: [5]
                }, 0.3
            ),
            xeno: new sc.MapInteractIcon(
                new ig.TileSheet("media/gui/map-icon.png", 40, 24, 0, 192), {
                    FOCUS: [2],
                    NEAR: [2],
                    AWAY: [2]
                }, 0.3
            ),
            xenoEvent: new sc.MapInteractIcon(
                new ig.TileSheet("media/gui/map-icon.png", 40, 24, 0, 192), {
                    FOCUS: [0],
                    NEAR: [1],
                    AWAY: [1]
                }, 0.3
            )
        },

        lookAtAction: null,
        eventCall: null,
        doPostEventAction: false,
        xenoDialog: null,
        xenoDialogGui: null,
        permaEffect: null,
        displayName: null,
        displayTrigger: null,
        displayNameRandom: null,

        respawn: {
            pos: Vec3.create()
        },

        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                characterName: {
                    _type: "Character",
                    _info: "Character of NPC",
                    _context: "Character"
                },
                npcStates: {
                    _type: "NPCStates",
                    _info: "Different states of the NPC",
                    _popup: true
                },
                analyzable: {
                    _type: "Analyzable",
                    _info: "Analyzable if any.",
                    _compact: true,
                    _optional: true,
                    _popup: true
                },
                hideCondition: {
                    _type: "VarCondition",
                    _info: "Condition for entity to become transparent",
                    _optional: true,
                    _width: 70
                }
            },
            label: function () {
                return "";
            },
            drawBox: true,
            boxColor: "rgba(0,0,255, 0.5)"
        }),

        hideHandle: null,
        hideManager: null,

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.setSize(12, 12, 28);
            this.coll.edgeSlipInward = true;
            this.npcStatesData = settings.npcStates;

            this.interactEntry = new sc.MapInteractEntry(
                this, this, this.interactIcons.normal,
                sc.INTERACT_Z_CONDITION.Z_RANGE_OVERLAP, true
            );
            this.interactEntry.blockedDuringCombat = true;

            Vec3.assign(this.respawn.pos, this.coll.pos);

            if ((this.characterName = settings.characterName)) {
                if (window.wm) {
                    this._wm = this._wm.copy();
                    this._wm.drawBox = false;
                }
                this.character = new sc.Character(this.characterName);
                this.character.addLoadListener(this);
            }

            if (settings.analyzable) {
                this.displayName = settings.analyzable.text || null;
                this.displayTrigger = settings.analyzable.active || null;
            } else {
                this.displayName = settings.displayName || null;
                this.displayTrigger = settings.displayTrigger || null;
            }

            if (settings.hideCondition) {
                this.hideManager = new ig.EntityHideManager(settings.hideCondition);
            }
        },

        /** Override from sc.ActorEntity: check for fall respawn. */
        onTerrainUpdate: function () {
            this.checkQuickRespawn();
        },

        /**
         * Save a custom respawn point (e.g. from a path node).
         * @param {{x:number, y:number, z:number}} pos
         */
        setRespawnPoint: function (pos) {
            Vec3.assignC(this.respawn.pos,
                pos.x - this.coll.size.x / 2,
                pos.y - this.coll.size.y / 2,
                pos.z
            );
        },

        /**
         * Check if the NPC has fallen below the map, into dangerous terrain,
         * or into water, and trigger a quick respawn back to the last safe
         * position.
         */
        checkQuickRespawn: function () {
            var coll = this.coll;
            if (coll._collData && !coll._collData.zBaseUncertain) {
                if (coll.pos.z < ig.game.minLevelZ && !this.tooHighToFall &&
                    !this.coll.ignoreCollision) {
                    if (coll.vel.z < 0) coll.vel.z = 0;
                    this.doQuickRespawn();
                } else {
                    // Update safe respawn position when on stable ground.
                    if (coll.float.height && !this.jumping &&
                        !ig.CollTools.isCloseToEdge(coll) &&
                        coll.baseZPos >= ig.game.minLevelZ &&
                        !ig.terrain.isDangerTerrain(
                            ig.terrain.getTerrain(this.coll, false, true)
                        )) {
                        Vec3.assign(this.respawn.pos, this.coll.pos);
                    }

                    // Check for fall-outside-bounds or dangerous-terrain fall.
                    if (!(coll.pos.z > coll.baseZPos || this.jumping ||
                        coll.zGravityFactor == 0)) {
                        var terrain = this.stepStats.terrain;
                        if (ig.terrain.isFallTerrain(terrain)) {
                            var splashPos = this.getAlignedPos(
                                ig.ENTITY_ALIGN.BOTTOM, scratchVec3
                            );
                            if (terrain == ig.TERRAIN.WATER) {
                                ig.game.effects.death.spawnFixed(
                                    "waterSplash", splashPos.x, splashPos.y, splashPos.z
                                );
                            }
                            this.doQuickRespawn(terrain);
                        } else if (!ig.CollTools.isCloseToEdge(this.coll) &&
                            !ig.terrain.isDangerTerrain(this.stepStats.terrain) &&
                            !this.respawn.timer) {
                            Vec3.assign(this.respawn.pos, this.coll.pos);
                        }
                    }
                }
            }
        },

        doQuickRespawn: function () {
            Vec3.assignC(this.coll.vel, 0, 0, 0);
            this.setPos(this.respawn.pos.x, this.respawn.pos.y, this.respawn.pos.z);
            this.nav.path.redoPathDeferred();
            ig.game.effects.npc.spawnOnTarget("appear", this);
        },

        getQuickMenuSettings: function () {
            return {
                type: "NPC",
                displayName: this.displayName,
                displayTrigger: this.displayTrigger,
                randomName: this.displayNameRandom,
                disabled: this.hidden
            };
        },

        /* ── Character load listener ─────────────────────────────── */

        onLoadableComplete: function (data) {
            if (!data) throw Error(
                "Character loading failed for character '" + this.characterName
            );

            data = this.character.data;

            if (data.size) Vec3.assign(this.coll.size, data.size);
            data.shadow == void 0 && (data.shadow = 16);

            this.animSheet = new ig.AnimationSheet(data.animSheet);

            // Store walk animation sets.
            for (var walkSet in data.walkAnimSet) {
                this.storeWalkAnims(walkSet, data.walkAnimSet[walkSet]);
            }

            // Build actor configs.
            var baseConfig = new ig.ActorConfig;
            baseConfig.loadFromData(data, defaultActorConfig);

            for (var configKey in data.configs) {
                var cfg = data.configs[configKey];
                this.configs[configKey] = new ig.ActorConfig;
                this.configs[configKey].loadFromData(cfg, baseConfig);
            }

            // Set initial walk set.
            this.setWalkAnims(walkSet);

            // Build NpcState list.
            if ((walkSet = this.npcStatesData)) {
                for (var si = 0; si < walkSet.length; ++si) {
                    this.npcStates.push(new sc.NpcState(walkSet[si], this));
                }
            }
            this.npcStatesData = null;

            if (window.wm) {
                // Editor: apply the first state's face & config.
                if (this.npcStates[0]) {
                    Vec2.assign(this.face, this.npcStates[0].face);
                    var savedPos = Vec3.assign(scratchVec3, this.coll.pos);
                    this.setDefaultConfig(this.configs[this.npcStates[0].config]);
                    this.setPos(savedPos.x, savedPos.y, savedPos.z);
                }
            } else {
                this.updateNpcState(true);
            }

            // Build the "look at" action for cutscene camera focus.
            this.lookAtAction = new ig.Action("", [{
                type: "SET_FACE_TO_ENTITY",
                entity: this,
                rotate: true
            }]);
            this.lookAtAction.eventAction = true;

            this.initAnimations();
        },

        onKill: function (params) {
            this.parent(params);
            this.character.decreaseRef();
            this.animSheet.decreaseRef();
            for (var si = 0; si < this.npcStates.length; ++si) {
                this.npcStates[si].clearCached();
            }
        },

        update: function () {
            if (this.deferredReset) {
                this.eventBlocked = false;
                this.updateNpcState(false, true);
                this.deferredReset = false;
            }
            this.interactEntry.gui.hook.localAlpha = this.animState.alpha;
            this.hideManager && this.hideManager.update(this);
            this.parent();
        },

        /**
         * Called by party-swap system: temporarily hide the NPC during
         * a party-member dialogue swap.
         */
        onPartySwapHide: function () {
            sc.mapInteract.removeEntry(this.interactEntry);
            this.hide();
        },

        /* ── Action-driven cutscene state machine ────────────────── */

        /**
         * Called every frame after the current action updates. Manages
         * the transition between event-driven and free states: stashes
         * the current action during events, resumes it after, and handles
         * the deferred reset that applies state changes when a cutscene
         * ends.
         */
        postActionUpdate: function () {
            if (!this.eventCall || !this.eventCall.isRunning() || !this.doPostEventAction) {
                this.eventCall = null;

                if (this.currentAction && this.currentAction.eventAction) {
                    this.eventBlocked = true;
                }

                if (!this.currentAction && !this.eventBlocked) {
                    if (this.hasStashedAction()) {
                        this.resumeStashedAction();
                    } else {
                        var activeState = this.npcStates[this.activeStateIdx];
                        activeState && activeState.loopAction &&
                            this.setAction(activeState.loopAction);
                    }
                }

                // Hide when no action running and hidden state is active.
                if (!this.currentAction && this.hidden && !this._hidden &&
                    !this.deferredReset) {
                    sc.mapInteract.removeEntry(this.interactEntry);
                    this.animState.alpha = 0;
                    this.hide();
                }

                // Deferred reset after cutscene.
                if (!this.currentAction && !sc.model.isCutscene() &&
                    (this.postActionSceneReset || this.eventBlocked)) {
                    this.postActionSceneReset = false;
                    this.deferredReset = true;
                }
            }
        },

        /** Re-evaluate NPC state when game vars change. */
        varsChanged: function () {
            this.updateNpcState(false);
            this.hideManager && this.hideManager.varsChanged(this);
        },

        /**
         * Force-reset the NPC state (e.g., after a cutscene or respawn).
         * @param {boolean} [forceShow]
         */
        resetNpcState: function (forceShow) {
            if (forceShow || this._hidden) {
                this.eventBlocked = false;
                this.updateNpcState(true, true);
            } else {
                this.deferredReset = true;
            }
        },

        /** Apply a named actor config from the character definition. */
        setConfig: function (configName) {
            if (this.configs[configName]) {
                this.setDefaultConfig(this.configs[configName]);
            } else {
                ig.warn("NPC: No such config available: " + configName);
            }
        },

        /** @returns {boolean} whether the active state would change. */
        hasNpcStateChanged: function () {
            for (var si = this.npcStates.length; si--;) {
                if (this.npcStates[si].condition.evaluate()) break;
            }
            return si != this.activeStateIdx;
        },

        /**
         * Evaluate conditions, pick the active NPC state, and apply it.
         * Handles appear/disappear effects, config switching, position
         * changes, face changes, door enter/leave actions, and map-
         * interact icon updates.
         *
         * @param {boolean} [forceReset] skip state-change guards
         * @param {boolean} [forceShow] also reappear from hidden
         */
        updateNpcState: function (forceReset, forceShow) {
            var wasEventActionHidden =
                this.currentAction && this.currentAction.eventAction && this._hidden;
            var eventBlocksScene =
                this.eventBlocked ||
                (this.currentAction && this.currentAction.eventAction && !this._hidden);

            if (forceReset) eventBlocksScene = false;

            // Find the first matching state.
            for (var si = this.npcStates.length; si--;) {
                if (this.npcStates[si].condition.evaluate()) break;
            }

            // Skip state change if the current event action hides us and
            // the new state is hidden too.
            if (wasEventActionHidden && this.npcStates[si] &&
                !this.npcStates[si].hidden) {
                // proceed
            } else if (!wasEventActionHidden) {
                // proceed
            } else {
                return;
            }

            if (forceShow || forceReset || si != this.activeStateIdx) {
                // Clean up previous perma-effect.
                this.permaEffect && this.permaEffect.stop();
                this.permaEffect = null;
                this.postActionSceneReset = eventBlocksScene;
                this.cancelPostEventAction();

                var previousState = this.npcStates[this.activeStateIdx];
                var previousWasHidden = !previousState || previousState.hidden;

                this.activeStateIdx = si;

                if (si == -1) {
                    // No matching state → hide.
                    sc.mapInteract.removeEntry(this.interactEntry);
                    if (!eventBlocksScene) {
                        this.hidden = true;
                        this.cancelAction();
                        this.hide();
                    }
                } else {
                    var newState = this.npcStates[this.activeStateIdx];

                    if (!eventBlocksScene) {
                        var newConfig = this.configs[newState.config];

                        // Non-pushable NPCs get infinite weight.
                        if (newState.reactType != sc.NPC_REACT_TYPE.PUSHABLE) {
                            newConfig.overwrite("weight", -1);
                        } else {
                            newConfig.clearOverwrite();
                        }

                        var stashedAction;
                        if (wasEventActionHidden) {
                            stashedAction = this.currentAction;
                            this.cancelAction();
                        }

                        // Save position for force-reset path.
                        var savedPos;
                        if (forceReset) {
                            savedPos = Vec3.assign(scratchVec3, this.coll.pos);
                        }

                        // Apply base (state 0) config first, then the new state's config.
                        this.setDefaultConfig(
                            this.configs[this.npcStates[0].config]
                        );
                        forceReset && this.setPos(savedPos.x, savedPos.y, savedPos.z);
                        this.setDefaultConfig(newConfig);

                        this.hidden = newState.hidden;

                        if (wasEventActionHidden) {
                            this.setAction(stashedAction);
                        }
                    }

                    // Handle visibility.
                    if (forceReset) {
                        if (this.hidden) {
                            this.hide();
                        } else {
                            this.animState.alpha = 1;
                            this.show();
                        }
                    }

                    // Update the map interaction icon.
                    this.setMapInteractIcon(newState);

                    // Register/unregister interact entry.
                    if (eventBlocksScene || !newState.npcEventObj) {
                        sc.mapInteract.removeEntry(this.interactEntry);
                    } else {
                        sc.mapInteract.addEntry(this.interactEntry);
                    }

                    if (!eventBlocksScene) {
                        if (forceReset || (previousWasHidden && this.hidden && this._hidden)) {
                            // Immediate position + face change (no transition).
                            this.setPos(
                                newState.position.x - this.coll.size.x / 2,
                                newState.position.y - this.coll.size.y / 2,
                                newState.position.z
                            );
                            Vec2.assign(this.face, newState.face);

                            if (newState.permaFx) {
                                this.permaEffect = newState.permaFx.spawnOnTarget(this, {
                                    duration: -1
                                });
                            }
                        } else {
                            var doorAction = null;

                            // Appear from hidden (previous state was hidden, now visible).
                            if (previousWasHidden && this._hidden) {
                                if (previousState) {
                                    this.setPos(
                                        previousState.position.x - this.coll.size.x / 2,
                                        previousState.position.y - this.coll.size.y / 2,
                                        previousState.position.z
                                    );
                                    Vec2.assign(this.face, previousState.face);
                                }
                                this.show();
                                this.animState.alpha = 0;

                                if (newState.showFx) {
                                    newState.showFx.spawnOnTarget(this);
                                } else {
                                    this.npcEffects.spawnOnTarget("appear", this, {
                                        duration: 0
                                    });
                                }

                                // If previous state had a door, get the leave action.
                                if (previousState && previousState.door) {
                                    var doorEntity = ig.Event.getEntity(previousState.door);
                                    doorAction = doorEntity && doorEntity.leaveEntity(this);
                                }
                            }

                            if (newState.permaFx) {
                                this.permaEffect = newState.permaFx.spawnOnTarget(this, {
                                    duration: -1
                                });
                            }

                            if (!wasEventActionHidden &&
                                newState.reactType != sc.NPC_REACT_TYPE.FIXED_FACE) {
                                this.setAction(newState.startAction);
                            }

                            if (doorAction) {
                                this.pushInlineAction(doorAction, true, true);
                            }
                        }
                    }
                }
            }
        },

        /**
         * Set the map-interact icon based on the NPC event type.
         * @param {sc.NpcState} state
         */
        setMapInteractIcon: function (state) {
            if (state.npcEventType == sc.NPC_EVENT_TYPE.TRADE) {
                this.interactEntry.setIcon(this.interactIcons.trade);
                this.interactEntry.setSubGui(state.npcEventObj.iconGui);
            } else if (state.npcEventType == sc.NPC_EVENT_TYPE.QUEST) {
                this.interactEntry.setIcon(this.interactIcons.quest);
            } else if (state.npcEventType == sc.NPC_EVENT_TYPE.SHOP) {
                this.interactEntry.setIcon(this.interactIcons.shop);
            } else if (state.npcEventType == sc.NPC_EVENT_TYPE.ARENA) {
                this.interactEntry.setIcon(this.interactIcons.arena);
            } else {
                this.interactEntry.setIcon(this.interactIcons.normal);
                this.interactEntry.setSubGui(null);
            }
        },

        /* ── Xeno dialog bubble ───────────────────────────────────── */

        /** Attach a floating xeno-dialog bubble to this NPC. */
        setXenoDialog: function (dialog) {
            this._initXenoDialogGui();
            this.interactEntry.setSubGui(this.xenoDialogGui);
            this.xenoDialog = dialog || null;
            sc.mapInteract.addEntry(this.interactEntry);
            this.xenoDialog.getCallbackEvent()
                ? this.interactEntry.setIcon(this.interactIcons.xenoEvent)
                : this.interactEntry.setIcon(this.interactIcons.xeno);
            this.xenoDialogGui.setText(dialog.getCurrentText(), dialog);
            this.xenoDialogGui.show();
        },

        isXenoTextFinished: function () {
            return this.xenoDialogGui && this.xenoDialogGui.isTextFinished();
        },

        cancelXenoDialog: function () {
            this.xenoDialog = null;
            this.xenoDialogGui.hide();
            sc.mapInteract.removeEntry(this.interactEntry);
        },

        _initXenoDialogGui: function () {
            if (!this.xenoDialogGui) this.xenoDialogGui = new sc.XenoDialogIcon;
        },

        /* ── Player interaction ───────────────────────────────────── */

        /**
         * Called when the player interacts with the NPC. Routes to the
         * appropriate handler based on NPC event type (simple event,
         * trade, quest, shop, arena, xeno dialog).
         */
        onInteraction: function () {
            var event;
            if (!sc.quests.hasSolvedQuestsStacked()) {
                if (this.xenoDialog) {
                    if (!this.xenoDialog.getCallbackEvent()) return false;
                    event = this.xenoDialog.getCallbackEvent();
                    this.xenoDialog.onEventStart();
                } else {
                    var state = this.npcStates[this.activeStateIdx];
                    if (state.npcEventObj) {
                        event = state.npcEventType == sc.NPC_EVENT_TYPE.TRADE
                            ? state.npcEventObj.event
                            : state.npcEventObj;
                    }
                }
                if (event) {
                    this.eventCall = ig.game.events.callEvent(
                        event, ig.EventRunType.BLOCKING,
                        this.onEventStart.bind(this),
                        this.onEventEnd.bind(this),
                        null, this, { character: this.characterName }
                    );
                }
            }
        },

        /**
         * Called when an NPC event starts. Pushes a camera focus target,
         * faces the player + party toward the NPC, and stashes the current
         * action so the NPC faces the player during the event.
         */
        onEventStart: function () {
            var state = this.npcStates[this.activeStateIdx];
            ig.game.playerEntity.setAction(this.lookAtAction);

            var member0 = sc.party.getPartyMemberEntityByIndex(0);
            var member1 = sc.party.getPartyMemberEntityByIndex(1);
            member0 && member0.setAction(this.lookAtAction);
            member1 && member1.setAction(this.lookAtAction);

            if (state.reactType != sc.NPC_REACT_TYPE.FIXED_FACE) {
                this.setAttribute("preEventFace", ig.copy(this.face));
                this.doPostEventAction = true;
                if (this.eventBlocked) {
                    this.eventBlocked = false;
                } else {
                    this.stashAction();
                }
                this.setAction(lookAtPlayerAction);
                this.eventBlocked = true;
            }

            var center = this.getCenter();
            center.y -= this.coll.pos.z;
            ig.camera.pushTarget(
                new ig.Camera.TargetHandle(new ig.Camera.PosTarget(center), 0, 0),
                "FAST"
            );
            sc.model.enterCutscene();
        },

        /**
         * Called when the NPC event ends. Restores the previous action
         * or re-evaluates the NPC state.
         */
        onEventEnd: function () {
            this.eventBlocked = false;

            if (this.currentAction && this.currentAction.eventAction) {
                this.postActionSceneReset = true;
            }

            if (!this.postActionSceneReset && this.doPostEventAction) {
                if (this.hasStashedAction()) {
                    this.setAction(lookAtSavedFaceAction);
                } else {
                    var state = this.npcStates[this.activeStateIdx];
                    state && this.setAction(state.startAction);
                }
            } else {
                this.updateNpcState(false, true);
            }

            if (this.xenoDialog) this.xenoDialog.onEventEnd();
            ig.camera.popTarget("FAST");
            sc.model.enterGame();
        },

        /** Open the trade menu via the active NPC state's trade info. */
        startTradeMenu: function () {
            var state = this.npcStates[this.activeStateIdx];
            state.npcEventObj &&
                state.npcEventType == sc.NPC_EVENT_TYPE.TRADE &&
                state.npcEventObj.startTradeMenu();
        },

        /** Cancel any pending post-event action restoration. */
        cancelPostEventAction: function () {
            this.clearStashedAction();
            this.doPostEventAction = false;
        }
    });

    /* ── sc.NPC_EVENT_TYPE ───────────────────────────────────────── */

    sc.NPC_EVENT_TYPE = {
        SIMPLE: 0,
        TRADE: 1,
        QUEST: 2,
        SHOP: 3,
        ARENA: 4
    };

    /* ── sc.NpcState ─────────────────────────────────────────────── */

    sc.NpcState = ig.Class.extend({
        _wm: new ig.Config({
            attributes: {
                condition: {
                    _type: "VarCondition",
                    _info: "Condition for this page to be active",
                    _height: 24
                },
                position: {
                    _type: "Vec3",
                    _info: "Position of NPC for this page",
                    _pointSelect: true,
                    _optional: true
                },
                reactType: {
                    _type: "String",
                    _info: "How NPC will react on touches and talking",
                    _float: true,
                    _select: sc.NPC_REACT_TYPE,
                    _default: "FIXED_POS"
                },
                face: {
                    _type: "Face",
                    _info: "Face direction.",
                    _float: true
                },
                config: {
                    _type: "CharConfig",
                    _info: "Configuration of Character for this page",
                    _float: true
                },
                action: {
                    _type: "Action",
                    _info: "Action to perform constantly",
                    _popup: true,
                    _float: true,
                    _clear: true,
                    _optional: true
                },
                showFx: {
                    _type: "Effect",
                    _info: "Effect when NPC becomes visible",
                    _popup: true,
                    _float: true,
                    _optional: true
                },
                hideFx: {
                    _type: "Effect",
                    _info: "Effect when NPC becomes hidden",
                    _popup: true,
                    _float: true,
                    _optional: true
                },
                permaFx: {
                    _type: "Effect",
                    _info: "Permanent effect on NPC",
                    _popup: true,
                    _float: true,
                    _optional: true
                },
                hidden: {
                    _type: "Boolean",
                    _info: "If true: NPC is hidden.",
                    _float: true,
                    _clear: true
                },
                door: {
                    _type: "Entity",
                    _info: "Door that NPC should enter from/leave to (only specify when hidden!)",
                    _optional: true,
                    _float: true
                },
                event: {
                    _type: "NPCEvent",
                    _info: "Type of npc event. e.g. simple event or trade."
                }
            }
        }),

        condition: null,
        position: Vec3.create(),
        config: null,
        face: Vec2.create(),
        hidden: false,
        door: null,
        startAction: null,
        loopAction: null,
        reactType: sc.NPC_REACT_TYPE.PUSHABLE,
        npcEventObj: null,
        npcEventType: null,
        showFx: null,
        permaFx: null,

        /**
         * @param {object} data — the state definition from the map/editor
         * @param {ig.ENTITY.NPC} npc — the owning NPC entity
         */
        init: function (data, npc) {
            this.condition = new ig.VarCondition(data.condition);

            if (data.position) {
                ig.Event.getVec3(data.position, this.position);
            } else {
                npc.getCenter(this.position);
                this.position.z = npc.coll.pos.z;
            }

            ig.ActorEntity.getFaceVec(
                ig.ActorEntity.FACE8[data.face] || 0, this.face
            );

            this.hidden = data.hidden || false;
            this.config = data.config;

            // Fall back to the first available config if the named one doesn't exist.
            if (!npc.configs[this.config]) {
                for (var configKey in npc.configs) break;
                this.config = configKey;
            }

            this.door = data.door;
            this.reactType = sc.NPC_REACT_TYPE[data.reactType || "PUSHABLE"];

            // Build the start action: navigate to position → set face → enter door.
            var steps = [{
                type: "NAVIGATE_TO_POINT",
                target: this.position,
                maxTime: 0,
                teleportOnFail: true,
                precise: !this.door && this.reactType == sc.NPC_REACT_TYPE.FIXED_POS
            }];

            if (this.hidden) {
                steps.push({
                    type: "SHOW_EFFECT",
                    effect: data.hideFx ? ig.copy(data.hideFx) : {
                        sheet: "npc",
                        name: "disappear"
                    },
                    duration: 0,
                    wait: !this.door,
                    actionDetached: true
                });
            } else {
                steps.push({
                    type: "SET_FACE",
                    face: data.face || 0,
                    rotate: true
                });
            }

            if (this.door) {
                steps.push({
                    type: "ENTER_DOOR",
                    door: this.door
                });
            }

            this.startAction = new ig.Action("[NPC]", steps);

            if (data.showFx) this.showFx = new ig.EffectHandle(data.showFx);
            if (data.permaFx) this.permaFx = new ig.EffectHandle(data.permaFx);
            if (data.action && data.action.length > 0 && !this.hidden) {
                this.loopAction = new ig.Action("[NPC]", data.action);
            }

            // Parse the event object.
            if (data.event) {
                if (data.event instanceof Array) {
                    if (data.event.length > 0) {
                        var eventDef = { name: "NPC EVENT", steps: data.event };
                        this.npcEventObj = new ig.Event(eventDef);
                        this.npcEventType = sc.NPC_EVENT_TYPE.SIMPLE;
                    }
                } else if (data.event instanceof Object) {
                    if (data.event.trade) {
                        this.npcEventObj = new sc.TradeInfo(data.event.trade, npc);
                        this.npcEventType = sc.NPC_EVENT_TYPE.TRADE;
                    } else if (data.event.quest) {
                        var questDef = { name: "NPC EVENT", steps: data.event.quest };
                        this.npcEventObj = new ig.Event(questDef);
                        this.npcEventType = sc.NPC_EVENT_TYPE.QUEST;
                    } else if (data.event.shop) {
                        var shopDef = { name: "NPC EVENT", steps: data.event.shop };
                        this.npcEventObj = new ig.Event(shopDef);
                        this.npcEventType = sc.NPC_EVENT_TYPE.SHOP;
                    } else if (data.event.arena) {
                        var arenaDef = { name: "NPC EVENT", steps: data.event.arena };
                        this.npcEventObj = new ig.Event(arenaDef);
                        this.npcEventType = sc.NPC_EVENT_TYPE.ARENA;
                    }
                }
            }
        },

        /** Release cached references (actions, effects, events). */
        clearCached: function () {
            this.npcEventObj && this.npcEventObj.clearCached();
            this.startAction && this.startAction.clearCached();
            this.loopAction && this.loopAction.clearCached();
            this.showFx && this.showFx.clearCached();
            this.permaFx && this.permaFx.clearCached();
        }
    });

    /* ── ACTOR_CONFIGS entry ─────────────────────────────────────── */

    ig.ACTOR_CONFIGS.NPC = {
        classType: ig.ENTITY.NPC,
        KEYS: {
            sizeOverride: null,
            terrain: 0
        },
        fromDataFix: function () {
            typeof this.terrain == "string" &&
                (this.terrain = ig.TERRAIN[this.terrain] || 0);
        },
        apply: function (entity) {
            this.sizeOverride && entity.coll.setSize(
                this.sizeOverride.x, this.sizeOverride.y, this.sizeOverride.z, true
            );
            entity.terrain = this.terrain || 0;
        },
        load: function (entity) {
            this.terrain = entity.terrain;
        }
    };
});
ig.baked = !0;
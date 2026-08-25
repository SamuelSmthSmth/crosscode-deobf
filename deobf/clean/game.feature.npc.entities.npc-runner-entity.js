/**
 * game.feature.npc.entities.npc-runner-entity
 * ===========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.npc.entities.npc-runner-entity")`.
 *
 * `sc.NPCRunnerEntity` — a lightweight NPC entity spawned by
 * `sc.NpcRunnerSpawner` that walks between map destinations (enter→exit)
 * via waypoint paths. Used to give areas background pedestrian life.
 * Each runner picks a character from the current runner group, navigates
 * through intermediate waypoints, and is killed when off-screen or on
 * water contact.
 */
ig.module("game.feature.npc.entities.npc-runner-entity").requires(
    "game.feature.npc.entities.sc-actor",
    "game.feature.character.character",
    "game.feature.interact.map-interact",
    "game.feature.trade.gui.trade-menu"
).defines(function () {

    /** Default actor config for runner entities — ignores collision. */
    var runnerConfig = new ig.ActorConfig({
        jumpingEnabled: true,
        maxVel: 180,
        weight: 200,
        collType: ig.COLLTYPE.IGNORE,
        soundType: "none"
    });

    /** Direction vectors for SIDE-positioned runner exits. */
    var DIR_OFFSETS = {
        NORTH: { x: 0, y: 1 },
        EAST: { x: -1, y: 0 },
        SOUTH: { x: 0, y: -1 },
        WEST: { x: 1, y: 0 }
    };

    var scratchVec2 = Vec2.create();
    var scratchVec3 = Vec3.create();

    sc.NPCRunnerEntity = sc.ActorEntity.extend({
        npcEffects: new ig.EffectSheet("npc"),
        characterName: null,
        character: null,
        configs: {},
        pushTimer: 0,
        effects: {
            water: new ig.EffectSheet("scene.water")
        },

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.setSize(12, 12, 28);
            this.coll.edgeSlipInward = true;
            this.character = settings.character;
            var charData = this.character.data;
            charData.size && Vec3.assign(this.coll.size, charData.size);
            charData.shadow == void 0 && (charData.shadow = 16);
            this.animSheet = settings.animSheet;

            for (var walkSet in charData.walkAnimSet) {
                this.storeWalkAnims(walkSet, charData.walkAnimSet[walkSet]);
            }
            var baseConfig = new ig.ActorConfig;
            baseConfig.loadFromData(charData, runnerConfig);

            for (var configKey in charData.configs) {
                var cfg = new ig.ActorConfig;
                cfg.loadFromData(charData.configs[configKey], baseConfig);
                cfg.overwrite("weight", 20);
                cfg.overwrite("relativeVel", settings.speed);
                this.setDefaultConfig(cfg);
                break;
            }

            this.initAnimations();
            this.initAction(settings.enter, settings.exit, settings.waypoints, settings.partyIdx);
        },

        /**
         * Build the full movement action: appear at enter, walk waypoints,
         * disappear at exit.
         * @param {object} enter — destination data
         * @param {object} exit — destination data
         * @param {Array<ig.Entity>|null} waypoints
         * @param {number} partyIdx
         */
        initAction: function (enter, exit, waypoints, partyIdx) {
            var enterPos = Vec3.create();
            enter = this.getDestinationEntryAndPos(enter, sc.NPC_RUNNER_DEST_TYPE.ENTER, partyIdx, enterPos);
            var exitPos = Vec3.create();
            exit = this.getDestinationEntryAndPos(exit, sc.NPC_RUNNER_DEST_TYPE.EXIT, partyIdx, exitPos);

            // Place at the entrance.
            this.setPos(enterPos.x - this.coll.size.x / 2, enterPos.y - this.coll.size.y / 2, enterPos.z);
            ig.ActorEntity.getFaceVec(ig.ActorEntity.FACE8[enter.dir] || 0, this.face);
            this.animState.alpha = 0;
            this.npcEffects.spawnOnTarget("appear", this, { duration: 0 });

            // Check for door leave-entity inline action.
            var leaveAction = null;
            if (enter.entity.leaveEntity) {
                leaveAction = enter.entity.leaveEntity(this);
            }

            var steps = [{
                type: "NAVIGATE_TO_POINT",
                target: exitPos,
                maxTime: 0,
                precise: false
            }, {
                type: "SHOW_EFFECT",
                effect: { sheet: "npc", name: "disappear" },
                duration: 0,
                wait: false,
                actionDetached: true
            }, {
                type: "ENTER_DOOR",
                door: exit.entity
            }];

            // Prepend waypoint navigation steps in reverse order.
            if (waypoints) {
                for (var wi = waypoints.length; wi--;) {
                    var wp = waypoints[wi];
                    var wpPos = Vec3.create();
                    wp.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, wpPos);
                    // Add small random offset within the waypoint's bounds.
                    var spreadX = wp.coll.size.x - this.coll.size.x;
                    var spreadY = wp.coll.size.y - this.coll.size.y;
                    wpPos.x += (Math.random() - 0.5) * spreadX;
                    wpPos.y += (Math.random() - 0.5) * spreadY;
                    steps.unshift({
                        type: "NAVIGATE_TO_POINT",
                        target: wpPos,
                        maxTime: 0,
                        precise: false
                    });
                }
            }

            // Random initial pause if the entrance has a waiting flag.
            if (enter.waiting) {
                steps.unshift({
                    type: "WAIT",
                    time: 0.1 + Math.random() * 1
                });
            }

            var action = new ig.Action("[NPC]", steps);
            this.setAction(action);
            leaveAction && this.pushInlineAction(leaveAction, true, true);
        },

        /**
         * Pick a destination entry (weighted by flags) and compute its
         * aligned world position for the runner.
         * @param {object} destData — destination with .entries[]
         * @param {number} destType — ENTER or EXIT
         * @param {number} partyIdx
         * @param {Vec3} outPos — receives the computed position
         * @returns {object} the chosen entry
         */
        getDestinationEntryAndPos: function (destData, destType, partyIdx, outPos) {
            var entries = destData.entries;
            var candidates = [];

            for (var i = entries.length; i--;) {
                var entry = entries[i];
                if (entry.type & destType) {
                    if (destType != sc.NPC_RUNNER_DEST_TYPE.ENTER ||
                        !entry.entity.isRunnerDestBlocked ||
                        !entry.entity.isRunnerDestBlocked()) {
                        candidates.push(entry);
                    }
                }
            }
            if (candidates.length == 0) candidates = entries;

            var entry = candidates[partyIdx % candidates.length];
            var entity = entry.entity;
            entity.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, outPos);

            if (entry.posType == sc.NPC_RUNNER_DEST_POS_TYPE.SIDE) {
                var dirVec = DIR_OFFSETS[entry.dir];
                outPos.x += dirVec.x * (entity.coll.size.x / 2 + this.coll.size.x / 2);
                outPos.y += dirVec.y * (entity.coll.size.y / 2 + this.coll.size.y / 2);

                // Random lateral spread.
                if (!dirVec.x) {
                    var halfSpread = Math.max(0, entity.coll.size.x - 64) / 2;
                    outPos.x += (2 * Math.random() - 1) * halfSpread;
                }
                if (!dirVec.y) {
                    var halfSpread2 = Math.max(0, entity.coll.size.y - 64) / 2;
                    outPos.y += (2 * Math.random() - 1) * halfSpread2;
                }
            }

            return entry;
        },

        update: function () {
            this.parent();

            var coll = this.coll;
            var hasPush = false;

            // Push other actors when in IGNORE collision mode.
            if (coll.type == ig.COLLTYPE.IGNORE) {
                var nearEntities = ig.game.getEntitiesInRectangle(
                    coll.pos.x, coll.pos.y, coll.pos.z,
                    coll.size.x, coll.size.y, coll.size.z, this
                );
                for (var k = nearEntities.length; k--;) {
                    var near = nearEntities[k];
                    if (near instanceof sc.ActorEntity && near.coll.type !== ig.COLLTYPE.TRIGGER) {
                        ig.CollTools.getDistVec2(near.coll, coll, scratchVec2);
                        Vec2.length(scratchVec2, 80 * (1 - this.pushTimer / 1).limit(0, 1));
                        Vec2.add(coll.pushVel, scratchVec2);
                        hasPush = true;
                    }
                }
            }
            this.pushTimer = hasPush ? this.pushTimer + ig.system.tick : 0;

            // Kill on water contact.
            if (ig.terrain.getTerrain(coll, true) == ig.TERRAIN.WATER) {
                var waterPos = this.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, scratchVec3);
                this.effects.water.spawnFixed("circularSmallSplash", waterPos.x, waterPos.y, waterPos.z);
                this.kill();
            }

            // Kill when off-screen, combat is active, or no runner group.
            if ((sc.model.isCombatActive() || !sc.npcRunner.hasGroup()) &&
                !ig.EntityTools.isInScreen(this, 16)) {
                this.kill();
            }

            // Kill when the action completes.
            if (!this.currentAction) this.kill();
        },

        onKill: function (params) {
            this.parent(params);
        }
    });
});
ig.baked = !0;
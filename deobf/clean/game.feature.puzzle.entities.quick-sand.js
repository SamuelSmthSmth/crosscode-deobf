/**
 * game.feature.puzzle.entities.quick-sand
 * =======================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.puzzle.entities.quick-sand")`.
 *
 * Quicksand hazard: `ig.QuickSand` is an influencer callback that sinks and
 * slows entities standing on QUICKSAND terrain, and (after 2 seconds) either
 * triggers the ground entity's `onQuickSandFall` (player) or makes the entity
 * fall through. `ig.ENTITY.QuicksandHole` is the visual hole that teleports
 * the player to a map marker when they fall in.
 */
ig.module("game.feature.puzzle.entities.quick-sand")
    .requires("impact.feature.influencer.influencer", "impact.feature.terrain.terrain", "impact.feature.effect.effect-sheet")
    .defines(function () {

    ig.terrain.registerDangerTerrain(ig.TERRAIN.QUICKSAND);

    ig.QuickSand = ig.Class.extend({
        influence: null,
        timer: 0,
        teleportDelay: 0,
        effects: {
            sheet: new ig.EffectSheet("puzzle.quicksand"),
            handle: null
        },

        init: function () {},

        onUpdate: function (influencer, entity) {
            var coll = entity.coll,
                inSand = entity.stepStats.centerTerrain == ig.TERRAIN.QUICKSAND && coll.pos.z == coll.baseZPos;
            if (entity.currentAction && entity.currentAction.name == "waveTeleportAction") {
                inSand = false;
                this.teleportDelay = 0.4
            } else if (this.teleportDelay) {
                this.teleportDelay = this.teleportDelay - ig.system.tick;
                if (this.teleportDelay <= 0) this.teleportDelay = 0;
                inSand = false
            }
            entity instanceof sc.CombatProxyEntity && (inSand = false);
            entity instanceof sc.PlayerPetEntity && (inSand = false);
            coll.groundConnect != ig.COLL_GROUND_CONNECT.LOOSE && (inSand = false);
            coll.friction.ignoreTerrain && (inSand = false);
            entity.respawn && entity.respawn.timer && (inSand = false);
            if (!this.influence && inSand) {
                this.influence = new ig.InfluenceEntry;
                this.influence.moveXYScale = 0.9;
                influencer.addInfluence(this.influence);
                this.timer = 0;
                this.effects.handle = this.effects.sheet.spawnOnTarget("sandTrail", entity, {
                    duration: -1
                })
            } else if (this.influence && !inSand) {
                this.timer / 2 > 0.3 && entity.doJump(100, 0, 80);
                this.endQuicksand(influencer, 0.1)
            }
            if (this.influence) {
                this.timer = this.timer + ig.system.tick;
                var sinkProgress = this.timer / 2;
                this.influence.groundSinkZ = coll.size.z * sinkProgress;
                this.influence.moveXYScale = 1 - sinkProgress * 0.7;
                if (this.timer >= 2) {
                    var ground = ig.EntityTools.getGroundEntity(entity);
                    if (ground && ground.onQuickSandFall && entity.isPlayer) {
                        this.endQuicksand(influencer, 1);
                        ground.onQuickSandFall(entity)
                    } else {
                        this.endQuicksand(influencer, 0);
                        entity.quickFall && entity.quickFall(ig.TERRAIN.QUICKSAND)
                    }
                }
            }
        },

        endQuicksand: function (influencer, fadeDuration) {
            fadeDuration ? this.influence.setFadeOut(0.1) : influencer.removeInfluence(this.influence);
            this.effects.handle.stop();
            this.influence = this.effects.handle = null
        }
    });

    ig.InfluencerCallbacks.addCallback(ig.QuickSand);

    ig.ENTITY.QuicksandHole = ig.AnimatedEntity.extend({
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                spawnCondition: {
                    _type: "VarCondition",
                    _info: "Condition for Enemy to spawn",
                    _popup: true
                },
                map: {
                    _type: "Maps",
                    _info: "Map to be loaded",
                    _context: "Map"
                },
                marker: {
                    _type: "Marker",
                    _info: "Marker on map to teleport player to"
                }
            },
            label: function () {
                return this.map + "\n" + this.marker
            }
        }),
        effects: {
            sheet: new ig.EffectSheet("puzzle.quicksand")
        },

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.BLOCK;
            this.coll.setSize(32, 32, 0);
            var quicksandStyle = ig.mapStyle.get("quicksand");
            this.initAnimations({
                sheet: {
                    src: quicksandStyle.sheet,
                    width: 32,
                    height: 32,
                    offX: quicksandStyle.x,
                    offY: quicksandStyle.y
                },
                SUB: [{
                    name: "defaukt",
                    time: 0.2,
                    frames: [0, 1, 2, 3],
                    repeat: true
                }]
            });
            this.map = settings.map;
            this.marker = settings.marker;
            this.influence = new ig.InfluenceEntry;
            this.influence.setPushType(sc.INFLUENCE_PUSH.PULL, 0, 0, 40);
            this.influence.setPushEntityCenter(this)
        },

        show: function (show) {
            this.parent(show);
            if (!show) {
                this.animState.alpha = 0;
                ig.game.effects.teleport.spawnOnTarget("showAlpha", this, {})
            }
        },

        update: function () {
            this.parent()
        },

        onQuickSandFall: function (entity) {
            this.effects.sheet.spawnOnTarget("sandDive", entity);
            entity = new ig.Event({
                steps: [{
                    type: "TELEPORT",
                    map: this.map,
                    marker: this.marker
                }]
            });
            ig.game.events.callEvent(entity, ig.EventRunType.BLOCKING)
        },

        onGroundAdd: function (ground) {
            ground.influencer && ground.influencer.addInfluence(this.influence)
        },

        onGroundRemove: function (ground) {
            ground.influencer && ground.influencer.removeInfluence(this.influence)
        }
    })
});
ig.baked = !0;

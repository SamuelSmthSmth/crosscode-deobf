ig.module("game.feature.puzzle.entities.quick-sand").requires("impact.feature.influencer.influencer", "impact.feature.terrain.terrain", "impact.feature.effect.effect-sheet").defines(function() {
    ig.terrain.registerDangerTerrain(ig.TERRAIN.QUICKSAND);
    ig.QuickSand = ig.Class.extend({
        influence: null,
        timer: 0,
        teleportDelay: 0,
        effects: {
            sheet: new ig.EffectSheet("puzzle.quicksand"),
            handle: null
        },
        init: function() {},
        onUpdate: function(b, a) {
            var d = a.coll,
                c = a.stepStats.centerTerrain == ig.TERRAIN.QUICKSAND && d.pos.z == d.baseZPos;
            if (a.currentAction && a.currentAction.name == "waveTeleportAction") {
                c = false;
                this.teleportDelay = 0.4
            } else if (this.teleportDelay) {
                this.teleportDelay = this.teleportDelay - ig.system.tick;
                if (this.teleportDelay <= 0) this.teleportDelay = 0;
                c = false
            }
            a instanceof sc.CombatProxyEntity && (c = false);
            a instanceof sc.PlayerPetEntity && (c = false);
            d.groundConnect != ig.COLL_GROUND_CONNECT.LOOSE && (c = false);
            d.friction.ignoreTerrain && (c = false);
            a.respawn && a.respawn.timer && (c = false);
            if (!this.influence && c) {
                this.influence = new ig.InfluenceEntry;
                this.influence.moveXYScale = 0.9;
                b.addInfluence(this.influence);
                this.timer = 0;
                this.effects.handle = this.effects.sheet.spawnOnTarget("sandTrail", a, {
                    duration: -1
                })
            } else if (this.influence && !c) {
                this.timer / 2 > 0.3 && a.doJump(100, 0, 80);
                this.endQuicksand(b, 0.1)
            }
            if (this.influence) {
                this.timer = this.timer + ig.system.tick;
                c = this.timer / 2;
                this.influence.groundSinkZ = d.size.z * c;
                this.influence.moveXYScale = 1 - c * 0.7;
                if (this.timer >= 2)
                    if ((d = ig.EntityTools.getGroundEntity(a)) && d.onQuickSandFall && a.isPlayer) {
                        this.endQuicksand(b,
                            1);
                        d.onQuickSandFall(a)
                    } else {
                        this.endQuicksand(b, 0);
                        a.quickFall && a.quickFall(ig.TERRAIN.QUICKSAND)
                    }
            }
        },
        endQuicksand: function(b, a) {
            a ? this.influence.setFadeOut(0.1) : b.removeInfluence(this.influence);
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
            label: function() {
                return this.map + "\n" + this.marker
            }
        }),
        effects: {
            sheet: new ig.EffectSheet("puzzle.quicksand")
        },
        init: function(b, a, d, c) {
            this.parent(b, a, d, c);
            this.coll.type = ig.COLLTYPE.BLOCK;
            this.coll.setSize(32, 32, 0);
            b = ig.mapStyle.get("quicksand");
            this.initAnimations({
                sheet: {
                    src: b.sheet,
                    width: 32,
                    height: 32,
                    offX: b.x,
                    offY: b.y
                },
                SUB: [{
                    name: "defaukt",
                    time: 0.2,
                    frames: [0, 1, 2, 3],
                    repeat: true
                }]
            });
            this.map =
                c.map;
            this.marker = c.marker;
            this.influence = new ig.InfluenceEntry;
            this.influence.setPushType(sc.INFLUENCE_PUSH.PULL, 0, 0, 40);
            this.influence.setPushEntityCenter(this)
        },
        show: function(b) {
            this.parent(b);
            if (!b) {
                this.animState.alpha = 0;
                ig.game.effects.teleport.spawnOnTarget("showAlpha", this, {})
            }
        },
        update: function() {
            this.parent()
        },
        onQuickSandFall: function(b) {
            this.effects.sheet.spawnOnTarget("sandDive", b);
            b = new ig.Event({
                steps: [{
                    type: "TELEPORT",
                    map: this.map,
                    marker: this.marker
                }]
            });
            ig.game.events.callEvent(b, ig.EventRunType.BLOCKING)
        },
        onGroundAdd: function(b) {
            b.influencer && b.influencer.addInfluence(this.influence)
        },
        onGroundRemove: function(b) {
            b.influencer && b.influencer.removeInfluence(this.influence)
        }
    })
});
ig.baked = !0;

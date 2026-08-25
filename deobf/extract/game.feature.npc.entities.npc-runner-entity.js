ig.module("game.feature.npc.entities.npc-runner-entity").requires("game.feature.npc.entities.sc-actor", "game.feature.character.character", "game.feature.interact.map-interact", "game.feature.trade.gui.trade-menu").defines(function() {
    var b = new ig.ActorConfig({
            jumpingEnabled: true,
            maxVel: 180,
            weight: 200,
            collType: ig.COLLTYPE.IGNORE,
            soundType: "none"
        }),
        a = {
            NORTH: {
                x: 0,
                y: 1
            },
            EAST: {
                x: -1,
                y: 0
            },
            SOUTH: {
                x: 0,
                y: -1
            },
            WEST: {
                x: 1,
                y: 0
            }
        },
        d = Vec2.create(),
        c = Vec3.create();
    sc.NPCRunnerEntity = sc.ActorEntity.extend({
        npcEffects: new ig.EffectSheet("npc"),
        characterName: null,
        character: null,
        configs: {},
        pushTimer: 0,
        effects: {
            water: new ig.EffectSheet("scene.water")
        },
        init: function(a, c, d, h) {
            this.parent(a, c, d, h);
            this.coll.setSize(12, 12, 28);
            this.coll.edgeSlipInward = true;
            this.character = h.character;
            a = this.character.data;
            a.size && Vec3.assign(this.coll.size, a.size);
            a.shadow == void 0 && (a.shadow = 16);
            this.animSheet = h.animSheet;
            for (var i in a.walkAnimSet) this.storeWalkAnims(i, a.walkAnimSet[i]);
            i = new ig.ActorConfig;
            i.loadFromData(a, b);
            for (var j in a.configs) {
                c = new ig.ActorConfig;
                c.loadFromData(a.configs[j], i);
                c.overwrite("weight", 20);
                c.overwrite("relativeVel", h.speed);
                this.setDefaultConfig(c);
                break
            }
            this.initAnimations();
            this.initAction(h.enter, h.exit, h.waypoints, h.partyIdx)
        },
        initAction: function(a, b, c, d) {
            var i = Vec3.create(),
                a = this.getDestinationEntryAndPos(a, sc.NPC_RUNNER_DEST_TYPE.ENTER, d, i),
                j = Vec3.create(),
                b = this.getDestinationEntryAndPos(b, sc.NPC_RUNNER_DEST_TYPE.EXIT, d, j);
            this.setPos(i.x - this.coll.size.x / 2, i.y - this.coll.size.y / 2, i.z);
            ig.ActorEntity.getFaceVec(ig.ActorEntity.FACE8[a.dir] ||
                0, this.face);
            this.animState.alpha = 0;
            this.npcEffects.spawnOnTarget("appear", this, {
                duration: 0
            });
            i = null;
            a.entity.leaveEntity && (i = a.entity.leaveEntity(this));
            j = [{
                type: "NAVIGATE_TO_POINT",
                target: j,
                maxTime: 0,
                precise: false
            }, {
                type: "SHOW_EFFECT",
                effect: {
                    sheet: "npc",
                    name: "disappear"
                },
                duration: 0,
                wait: false,
                actionDetached: true
            }, {
                type: "ENTER_DOOR",
                door: b.entity
            }];
            if (c)
                for (b = c.length; b--;) {
                    var k = c[b],
                        d = Vec3.create();
                    k.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, d);
                    var l = k.coll.size.x - this.coll.size.x,
                        k = k.coll.size.y -
                        this.coll.size.y;
                    d.x = d.x + (Math.random() - 0.5) * l;
                    d.y = d.y + (Math.random() - 0.5) * k;
                    j.unshift({
                        type: "NAVIGATE_TO_POINT",
                        target: d,
                        maxTime: 0,
                        precise: false
                    })
                }
            a.waiting && j.unshift({
                type: "WAIT",
                time: 0.1 + Math.random() * 1
            });
            c = new ig.Action("[NPC]", j);
            this.setAction(c);
            i && this.pushInlineAction(i, true, true)
        },
        getDestinationEntryAndPos: function(b, c, d, h) {
            for (var i = b.entries, j = [], k = b.entries.length; k--;) {
                b = i[k];
                b.type & c && (c != sc.NPC_RUNNER_DEST_TYPE.ENTER || !b.entity.isRunnerDestBlocked || !b.entity.isRunnerDestBlocked()) &&
                    j.push(b)
            }
            j.length == 0 && (j = i);
            b = j[d % j.length];
            c = b.entity;
            c.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, h);
            if (b.posType == sc.NPC_RUNNER_DEST_POS_TYPE.SIDE) {
                d = a[b.dir];
                h.x = h.x + d.x * (c.coll.size.x / 2 + this.coll.size.x / 2);
                h.y = h.y + d.y * (c.coll.size.y / 2 + this.coll.size.y / 2);
                if (!d.x) {
                    i = Math.max(0, c.coll.size.x - 64) / 2;
                    h.x = h.x + (2 * Math.random() - 1) * i
                }
                if (!d.y) {
                    c = Math.max(0, c.coll.size.y - 64) / 2;
                    h.y = h.y + (2 * Math.random() - 1) * c
                }
            }
            return b
        },
        update: function() {
            this.parent();
            var a = this.coll,
                b = false;
            if (a.type == ig.COLLTYPE.IGNORE)
                for (var g =
                        ig.game.getEntitiesInRectangle(a.pos.x, a.pos.y, a.pos.z, a.size.x, a.size.y, a.size.z, this), h = g.length; h--;) {
                    var i = g[h];
                    if (i instanceof sc.ActorEntity && i.coll.type !== ig.COLLTYPE.TRIGGER) {
                        ig.CollTools.getDistVec2(i.coll, a, d);
                        Vec2.length(d, 80 * (1 - this.pushTimer / 1).limit(0, 1));
                        Vec2.add(a.pushVel, d);
                        b = true
                    }
                }
            this.pushTimer = b ? this.pushTimer + ig.system.tick : 0;
            if (ig.terrain.getTerrain(a, true) == ig.TERRAIN.WATER) {
                a = this.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, c);
                this.effects.water.spawnFixed("circularSmallSplash", a.x,
                    a.y, a.z);
                this.kill()
            }(sc.model.isCombatActive() || !sc.npcRunner.hasGroup()) && !ig.EntityTools.isInScreen(this, 16) && this.kill();
            this.currentAction || this.kill()
        },
        onKill: function(a) {
            this.parent(a)
        }
    })
});
ig.baked = !0;

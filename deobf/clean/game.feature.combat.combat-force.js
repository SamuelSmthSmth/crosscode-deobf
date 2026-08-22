/**
 * game.feature.combat.combat-force
 * ================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.combat.combat-force")`.
 *
 * "Forces" are the live, ticking hitbox/effect objects a combat art spawns on
 * its `combatant`. They do the actual collision + damage application:
 *   - `sc.CircleHitForce`  — a radial/sweeping arc hitbox (most melee arts)
 *   - `sc.DirectHitForce`  — guaranteed hits on one victim over N ticks
 *   - `sc.PushPullForce`   — an influence (knockback/pull) bubble
 *   - `sc.ProxyGridForce`  — spawns proxies in a 2D pattern grid
 *   - `sc.ProxySpawnerForce` / `sc.EnemySpawnerForce` — spawn proxies/enemies
 *     via a shared `sc.SpawnHelper` (position/direction/collision placement)
 */
ig.module("game.feature.combat.combat-force")
    .requires("impact.base.entity")
    .defines(function () {

    // Shared scratch buffers — allocated once to avoid per-tick GC churn.
    var tmpPos3 = Vec3.create();     // aligned position / center (Vec3)
    var tmpVec2A = Vec2.create();
    var tmpVec2B = Vec2.create();
    var tmpVec2C = Vec2.create();
    var tmpVec2D = Vec2.create();
    var tmpSize3 = Vec3.create();    // entity/proxy size (Vec3)
    var TRACE_SCRATCH = {};          // reused ig.physics trace result

    sc.CombatForce = ig.Class.extend({
        combatant: null,
        combatantRoot: null,

        init: function (combatant) {
            this.combatant = combatant;
            this.combatantRoot = combatant.getCombatantRoot && combatant.getCombatantRoot() || combatant
        },

        update: function () {
            return true
        },
        isRepeating: function () {
            return false
        },
        onActionEndDetach: function () {
            this.combatantRoot && this.combatantRoot.removeActionAttached(this);
            this.combatantRoot = null
        },
        getCombatant: function () {
            return this.combatant
        },
        getCombatantRoot: function () {
            return this.combatantRoot
        },
        onEnd: null
    });

    /**
     * A sweeping radial hitbox. `centralAngle` is the total sweep (in turns),
     * `startAngle` the initial offset, `duration` how long it expands; `expandRadius`
     * grows the radius over the sweep.
     */
    sc.CircleHitForce = sc.CombatForce.extend({
        attackInfo: null,
        align: ig.ENTITY_ALIGN.BOTTOM,
        offset: null,
        radius: 0,
        dir: null,
        yScale: 1,
        zHeight: 0,
        centralAngle: 0,
        startAngle: 0,
        duration: 0,
        expandRadius: 0,
        alwaysFull: false,
        clockwise: false,
        flipLeftFace: 0,
        party: 0,
        rectangular: false,
        pos: null,
        prevAngle: 0,
        timer: 0,
        hitEntities: null,
        hitEntitiesAngle: null,

        init: function (combatant, config) {
            this.parent(combatant);
            this.party = sc.COMBATANT_PARTY[config.party] || this.combatant.party;
            this.attackInfo = new sc.AttackInfo(this.combatant.params, config.attack);
            this.align = ig.ENTITY_ALIGN[config.align] || this.align;
            this.pos = config.pos || null;
            if (config.fixPos) this.pos = this.combatant.getAlignedPos(this.align);
            this.dir = config.dir || null;
            this.offset = config.offset || null;
            this.radius = config.radius;
            this.yScale = config.yScale || 1;
            this.zHeight = config.zHeight || 24;
            this.centralAngle = Math.PI * 2 * (config.centralAngle || 1);
            this.startAngle = config.startAngle !== void 0 ? Math.PI * 2 * config.startAngle : -this.centralAngle / 2;
            this.duration = config.duration || 0;
            this.expandRadius = config.expandRadius || 0;
            this.alwaysFull = config.alwaysFull || false;
            this.clockwise = config.clockwise || false;
            this.flipLeftFace = config.flipLeftFace || false;
            this.rectangular = config.rectangular || false;
            this.repeat = config.repeat || false;
            this.uniformHitDir = config.uniformHitDir || false;
            this.checkCollision = config.checkCollision || false;
            this.timer = this.duration;
            this.prevAngle = 0;
            this.hitEntities = [];
            this.hitEntitiesAngle = []
        },

        update: function () {
            this.timer = this.timer - this.combatant.coll.getTick(true);
            var progress = this.duration ? 1 - (this.timer / this.duration).limit(0, 1) : 1;
            var sweepStartAngle = this.startAngle + Math.max(0, this.prevAngle - Math.PI * 0.5);
            var sweptAngle = this.centralAngle * progress;
            if (this.alwaysFull) {
                this.prevAngle = 0;
                sweepStartAngle = this.startAngle;
                sweptAngle = this.centralAngle
            }
            var endAngle = this.startAngle + sweptAngle;
            var radius = this.radius + progress * this.expandRadius;

            if (this.timer <= 0 || sweptAngle - this.prevAngle > Math.PI * 0.1) {
                // Drop hit records that have rotated a full turn behind the sweep.
                if (!this.alwaysFull)
                    for (; this.hitEntitiesAngle.length && sweptAngle - this.hitEntitiesAngle[0] > Math.PI;) {
                        this.hitEntities.shift();
                        this.hitEntitiesAngle.shift()
                    }
                this.prevAngle = sweptAngle;
                var counterClockwise = !this.clockwise;
                this.flipLeftFace && ig.isFaceLeftHalf(this.combatant, this.flipLeftFace) && (counterClockwise = !counterClockwise);
                if (counterClockwise) {
                    var swap = sweepStartAngle;
                    sweepStartAngle = -endAngle;
                    endAngle = -swap
                }
                var party = this.party;
                var hitDirection = this.alwaysFull && this.centralAngle >= Math.PI * 2 ? null : this.dir || this.combatant.face;
                var excludeEntity = this.combatant.party == this.party ? this.combatant : null;
                var hitPos = this._getPos();
                var entities = ig.game.getEntitiesInCircle(hitPos, radius, this.yScale, this.zHeight, hitDirection, sweepStartAngle, endAngle, excludeEntity, this.hitEntities, this.rectangular, this.checkCollision);
                window.ig.perf.showHitBoxes && (this.rectangular || ig.debugView.addMapCircle(hitPos.x, hitPos.y, hitPos.z, radius, hitDirection, sweepStartAngle, endAngle, this.zHeight, "red", 0.1, this.yScale));

                for (var i = entities.length; i--;) {
                    var damaged = false;
                    var entity = entities[i];
                    var hitKey = null;
                    if (entity.coll.parentColl && entity.coll.parentGroup) {
                        hitKey = entity.coll.parentColl.entity.uid + entity.coll.parentGroup;
                        if (this.hitEntities.indexOf(hitKey) != -1) continue
                    }
                    if (damaged = entity.isCombatant && party != entity.party ? entity.damage(this, this.attackInfo) : true) {
                        entity.ballHit && entity.ballHit(this);
                        hitKey ? this.hitEntities.push(hitKey) : this.hitEntities.push(entity);
                        this.hitEntitiesAngle.push(sweptAngle)
                    }
                }
            }

            if (this.repeat && this.timer <= 0) {
                this.timer = this.duration;
                this.hitEntities.length = 0;
                this.prevAngle = this.hitEntitiesAngle.length = 0
            }
            return this.timer <= 0
        },

        getElement: function () {
            return this.attackInfo && this.attackInfo.element || sc.ELEMENT.NEUTRAL
        },

        // Clamp a point to the edge of the hit circle (used to place hit FX).
        getHitCenter: function (combatant, out) {
            var center = out || Vec3.create();
            combatant.getAlignedPos(ig.ENTITY_ALIGN.CENTER, center);
            var pos = this._getPos();
            Vec2.assign(tmpVec2B, center);
            Vec2.sub(tmpVec2B, pos);
            var progress = this.duration ? 1 - (this.timer / this.duration).limit(0, 1) : 1;
            var radius = this.radius + progress * this.expandRadius;
            if (Vec2.length(tmpVec2B) > radius) {
                Vec2.length(tmpVec2B, radius);
                Vec2.assign(center, pos);
                Vec2.add(center, tmpVec2B)
            }
            center.z = center.z.limit(pos.z, pos.z + this.zHeight);
            return center
        },

        getHitVel: function (combatant, out) {
            var vel = out || Vec2.create();
            combatant.getCenter(vel);
            this.uniformHitDir ? Vec2.sub(vel, this.combatant.getCenter(tmpVec2B)) : Vec2.sub(vel, this._getPos());
            if (!this.pos && Vec2.dot(vel, this.combatant.face) > 0) {
                Vec2.assign(tmpVec2B, this.combatant.face);
                Vec2.length(tmpVec2B, 2);
                Vec2.length(vel, 1);
                Vec2.add(vel, tmpVec2B)
            }
            return vel
        },

        getHitDir: function (combatant, out) {
            var dir = out || Vec2.create();
            combatant.getCenter(dir);
            this.uniformHitDir ? Vec2.sub(dir, this.combatant.getCenter(tmpVec2B)) : Vec2.sub(dir, this._getPos());
            return dir
        },

        getCollideSide: function (combatant) {
            var dir = this.getHitDir(combatant, tmpVec2A);
            return Math.abs(dir.x) > Math.abs(dir.y)
                ? ig.ActorEntity.FACE4[dir.x < 0 ? "EAST" : "WEST"]
                : ig.ActorEntity.FACE4[dir.y < 0 ? "SOUTH" : "NORTH"]
        },

        _getPos: function () {
            if (this.pos) return this.pos;
            var pos = this.combatant.getAlignedPos(this.align, tmpPos3);
            this.offset && Vec3.add(pos, this.offset);
            return pos
        },

        isRepeating: function () {
            return this.repeat
        }
    });

    sc.DIRECT_HIT_DIR = {
        TOWARD: 1,
        AWAY: 2
    };

    /**
     * Guaranteed, non-spatial hits: repeatedly damages one victim on a fixed
     * delay (used for grabs/combos that don't need to sweep a hitbox).
     */
    sc.DirectHitForce = sc.CombatForce.extend({
        attackInfo: null,
        hitDir: null,
        align: ig.ENTITY_ALIGN.CENTER,
        hitCount: 0,
        hitDelay: 0,
        effect: null,
        victim: null,
        timer: 0,

        init: function (combatant, victim, config, effect) {
            this.parent(combatant);
            this.attackInfo = new sc.AttackInfo(this.combatantRoot.params, config.attack);
            this.hitDir = sc.DIRECT_HIT_DIR[config.hitDir || "AWAY"];
            this.align = ig.ENTITY_ALIGN[config.align] || this.align;
            this.hitCount = config.hitCount || 1;
            this.hitDelay = config.hitDelay || 0.1;
            this.timer = 0;
            this.effect = effect;
            this.victim = victim
        },

        update: function () {
            if (!this.victim.damage) return true;
            for (this.timer = this.timer - this.combatant.coll.getTick(true); this.hitCount && this.timer <= 0;) {
                this.timer = this.timer + this.hitDelay;
                this.hitCount--;
                this.effect && this.effect.spawnOnTarget(this.victim, { align: this.align });
                this.victim.damage(this, this.attackInfo)
            }
            return this.hitCount == 0
        },

        getElement: function () {
            return this.attackInfo && this.attackInfo.element || sc.ELEMENT.NEUTRAL
        },
        getHitCenter: function (combatant, out) {
            var center = out || Vec2.create();
            combatant.getCenter(center);
            center.z = combatant.coll.pos.z + combatant.coll.size.z / 2;
            return center
        },
        getHitVel: function (combatant, out) {
            var vel = out || Vec2.create();
            combatant.getCenter(vel);
            this.combatant.getCenter(tmpVec2C);
            Vec2.sub(vel, tmpVec2C);
            this.hitDir == sc.DIRECT_HIT_DIR.TOWARD && Vec2.flip(vel);
            return vel
        },
        getHitDir: function (combatant, out) {
            return this.getHitVel(combatant, out)
        },
        getCollideSide: function (combatant) {
            var dir = this.getHitVel(combatant, tmpVec2A);
            return Math.abs(dir.x) > Math.abs(dir.y)
                ? ig.ActorEntity.FACE4[dir.x < 0 ? "EAST" : "WEST"]
                : ig.ActorEntity.FACE4[dir.y < 0 ? "SOUTH" : "NORTH"]
        }
    });

    sc.PUSH_PULL_STRENGTH = {
        EASY_ESCAPE: 40,
        WALK_ESCAPE: 100,
        RUN_ESCAPE: 130,
        DASH_ESCAPE: 190,
        NO_ESCAPE: 300,
        SERIOUSLY_GO_AWAY: 500
    };

    /**
     * An influence bubble that pushes or pulls other combatants (see
     * `ig.InfluenceEntry`). Applies to loose, non-static enemy bodies.
     */
    sc.PushPullForce = sc.CombatForce.extend({
        radius: 0,
        fadeRadius: 0,
        zHeight: 0,
        influencedEntities: [],
        fxHandles: [],
        timer: 0,
        pullAll: false,

        init: function (combatant, config) {
            this.parent(combatant);
            this.radius = config.radius;
            this.minRadius = config.minRadius || 0;
            this.fadeRadius = config.fadeRadius;
            this.faceDist = config.faceDist;
            this.strength = sc.PUSH_PULL_STRENGTH[config.strength] || sc.PUSH_PULL_STRENGTH.WALK_ESCAPE;
            this.influence = new ig.InfluenceEntry;
            this.influence.setPushType(config.pull ? sc.INFLUENCE_PUSH.PULL : sc.INFLUENCE_PUSH.PUSH, this.radius, this.fadeRadius, this.strength);
            this.zHeight = config.zHeight || 32;
            this.timer = config.duration || 0;
            this.party = sc.COMBATANT_PARTY[config.party] || this.combatant.party;
            this.effect = config.effect || null;
            this.align = ig.ENTITY_ALIGN[config.align] || ig.ENTITY_ALIGN.BOTTOM
        },

        update: function () {
            var center = this.combatant.getAlignedPos(this.align, tmpPos3);
            if (this.faceDist) {
                var faceDir = Vec2.assign(tmpVec2A, this.combatant.face);
                Vec2.length(faceDir, this.faceDist);
                Vec2.add(center, faceDir)
            }
            this.influence.setPushCenter(center);

            // Drop influenced entities that have left the bubble.
            var ownColl = this.combatant.coll;
            for (var i = this.influencedEntities.length; i--;) {
                var entity = this.influencedEntities[i];
                var entityColl = entity.coll;
                var offset = Vec2.sub(entity.getCenter(tmpVec2A), center);
                var distance = Vec2.length(offset);
                var gap = distance - this.combatant.coll.size.y / 2 - entity.coll.size.y / 2;
                (distance > this.radius + this.fadeRadius || this.minRadius && gap < this.minRadius || entityColl.pos.z > ownColl.pos.z + this.zHeight || entityColl.pos.z + entityColl.size.z < ownColl.pos.z) && this._removeEntity(i)
            }

            // Pick up newly-overlapping enemies.
            var entities = ig.game.getEntitiesInCircle(center, this.radius + this.fadeRadius, 1, this.zHeight, null, null, null, this.combatantRoot, this.influencedEntities, false);
            for (i = entities.length; i--;) {
                entity = entities[i];
                if (entity != this.combatant && (entity.influencer && entity instanceof ig.ENTITY.Combatant && entity.party != this.party) && entity.coll.groundConnect == ig.COLL_GROUND_CONNECT.LOOSE && entity.coll.weight != -1) {
                    offset = Vec2.sub(entity.getCenter(tmpVec2A), center);
                    distance = Vec2.length(offset);
                    gap = distance - this.combatant.coll.size.y / 2 - entity.coll.size.y / 2;
                    if (!(this.minRadius && gap < this.minRadius)) {
                        entity.influencer.addInfluence(this.influence);
                        this.influencedEntities.push(entity);
                        if (this.effect) {
                            var fx = this.effect.spawnOnTarget(entity, {
                                duration: -1,
                                align: ig.ENTITY_ALIGN.CENTER,
                                target2: this.combatant,
                                target2Align: ig.ENTITY_ALIGN.CENTER
                            });
                            this.fxHandles.push(fx)
                        }
                    }
                }
            }

            if (this.timer > 0) {
                this.timer = this.timer - ig.system.tick;
                if (this.timer <= 0) this.timer = 0
            }
            return this.timer == 0
        },

        _removeEntity: function (index) {
            this.influencedEntities[index].influencer.removeInfluence(this.influence);
            this.influencedEntities.splice(index, 1);
            if (this.effect) {
                this.fxHandles[index].stop();
                this.fxHandles.splice(index, 1)
            }
        },
        onEnd: function () {
            for (var i = this.influencedEntities.length; i--;) this._removeEntity(i)
        },
        isRepeating: function () {
            return this.timer < 0
        }
    });

    // Two ways a 2D pattern grid "lights up" as the effect progresses.
    sc.PROXY_GRID_FLOW = {
        SQUARE: function (radius, width, height, x, y) {
            x = Math.abs(x + 0.5 - width / 2);
            y = Math.abs(y + 0.5 - height / 2);
            return radius * width / 2 >= x && radius * height / 2 >= y
        },
        CIRCLE: function (radius, width, height, x, y) {
            x = Math.abs(x + 0.5 - width / 2);
            y = Math.abs(y + 0.5 - height / 2);
            var dist = Math.sqrt(x * x + y * y);
            return radius * Math.sqrt(width * width / 4 + height * height / 4) >= dist
        }
    };

    /**
     * Spawns proxies according to a 2D pattern grid (array of rows; each cell
     * value is 1 + proxy index). Cells activate in sequence based on `flow`.
     */
    sc.ProxyGridForce = sc.CombatForce.extend({
        init: function (combatant, config, posTarget) {
            this.parent(combatant);
            this.posTarget = posTarget;
            this.proxies = config.proxies;
            this.pattern = config.pattern;
            this.tilesize = config.tilesize;
            this.align = ig.ENTITY_ALIGN[config.align] || ig.ENTITY_ALIGN.BOTTOM;
            this.offset = config.offset;
            this.duration = config.duration;
            this.spawnDelay = config.spawnDelay || 0;
            this.delayTimer = this.timer = 0;
            this.width = this.pattern[0].length;
            this.height = this.pattern.length;
            this.flow = sc.PROXY_GRID_FLOW[config.flow] || sc.PROXY_GRID_FLOW.CIRCLE;
            this.oldWeight = 0;
            this.spawnList = []
        },

        update: function () {
            var target = this.posTarget || this.combatant;
            var center = target.getAlignedPos(this.align, tmpPos3);
            Vec3.add(center, this.offset);
            this.timer = this.timer + ig.system.tick;

            var weight = this.duration ? this.timer / this.duration : 1;
            for (var row = this.height; row--;)
                for (var col = this.width; col--;)
                    if (this.pattern[row] && this.pattern[row][col] && (!this.oldWeight || !this.flow(this.oldWeight, this.width, this.height, col, row)) && this.flow(weight, this.width, this.height, col, row)) {
                        var proxyIndex = this.pattern[row][col] - 1;
                        var proxy = sc.ProxyTools.getProxy(this.proxies[proxyIndex], this.combatantRoot);
                        if (proxy) {
                            var x = center.x + (col + 0.5 - this.width / 2) * this.tilesize;
                            var y = center.y + (row + 0.5 - this.height / 2) * this.tilesize;
                            if (!ig.game.isAreaBlocked(x - this.tilesize / 2, y - this.tilesize / 2, center.z, this.tilesize, this.tilesize, 16)) {
                                if (this.maxGroundDistance != null) {
                                    var baseZ = ig.game.physics.getBaseZPos(x - 1, y - 1, center.z, 2, 2);
                                    if (center.z - baseZ > this.maxGroundDistance) continue
                                }
                                if (this.spawnDelay) {
                                    // NOTE: original stores `proxyIndex - 1` here but `proxyIndex + 1`
                                    // in the immediate branch — an off-by-two in the compiled source.
                                    this.spawnList.push({ x: x, y: y, index: proxyIndex - 1, proxy: proxy });
                                } else {
                                    var spawned = proxy.spawn(x, y, center.z, this.combatant, this.combatant.face);
                                    spawned.setAttribute("gridIndex", proxyIndex + 1)
                                }
                            }
                        }
                    }

            if (this.delayTimer) {
                this.delayTimer = this.delayTimer - ig.system.tick;
                if (this.delayTimer <= 0) this.delayTimer = 0
            }
            for (; this.spawnList.length > 0 && !this.delayTimer;) {
                var entry = this.spawnList.shift();
                var spawned = entry.proxy.spawn(entry.x, entry.y, center.z, this.combatant, this.combatant.face);
                spawned.setAttribute("gridIndex", entry.index);
                this.delayTimer = this.delayTimer + this.spawnDelay
            }

            this.oldWeight = weight;
            return this.timer >= this.duration && this.spawnList.length == 0
        }
    });

    // Sampling points for offset-area placement (jitter a spawn inside a rect/circle).
    var AREA_POINTS = [{
        radius: 1, angle: 0, x: 0.5, y: 1
    }, {
        radius: 1, angle: 0.25, x: 0.5, y: 0
    }, {
        radius: 1, angle: 0.5, x: 1, y: 0.5
    }, {
        radius: 1, angle: 0.75, x: 0, y: 0.5
    }];

    sc.SPAWN_START_DIST_COLLIDE = {
        NONE: 0,
        CLOSER: 1,
        DROP: 2,
        ALT_DIR: 3
    };

    /**
     * Reusable spawn-placement engine: computes a fan of positions around a
     * combatant (with direction, distance, collision avoidance, area jitter)
     * and invokes a callback for each. Shared by proxy & enemy spawner forces.
     */
    sc.SpawnHelper = ig.Class.extend({
        align: ig.ENTITY_ALIGN.FACE,
        offset: null,
        centralAngle: 0,
        startAngle: 0,
        angleVary: 0,
        count: 1,
        duration: 0,
        clockwise: false,
        random: false,
        flipLeftFace: 0,
        dir: null,
        offsetArea: null,
        circularArea: false,
        callback: null,
        maxGroundDistance: null,
        uniformDir: 0,
        delay: 0,
        yScale: 0,
        repeat: false,
        posEntity: false,
        limitRangeOnColl: 0,

        init: function (config, callback, posEntity) {
            this.align = ig.ENTITY_ALIGN[config.align] || this.align;
            this.offset = config.offset || null;
            this.centralAngle = Math.PI * 2 * (config.centralAngle || 0);
            this.startAngle = config.startAngle !== void 0 ? Math.PI * 2 * config.startAngle : -this.centralAngle / 2;
            this.startDist = config.startDist || 0;
            this.startDistAdd = config.startDistAdd || 0;
            this.startDistCollide = sc.SPAWN_START_DIST_COLLIDE[config.startDistCollide] || sc.SPAWN_START_DIST_COLLIDE.NONE;
            this.angleVary = (config.angleVary || 0) * Math.PI * 2;
            this.count = config.count || 1;
            this.duration = config.duration || 0;
            this.clockwise = config.clockwise || false;
            this.flipLeftFace = config.flipLeftFace || false;
            this.random = config.random || false;
            this.timer = this.duration;
            this.dir = config.dir || null;
            this.aimAtTarget = config.aimAtTarget || false;
            this.yScale = config.yScale || 1;
            this.offsetArea = config.offsetArea || null;
            this.circularArea = config.circularArea || false;
            this.uniformDir = config.uniformDir || 0;
            this.delay = config.delay || 0;
            this.callback = callback;
            this.repeat = config.repeat;
            this.posEntity = posEntity;
            if (config.maxGroundDistance != null && config.maxGroundDistance != void 0) this.maxGroundDistance = config.maxGroundDistance;
            if (config.terrainFilter) {
                var terrain = config.terrainFilter;
                this.terrainFilter = [];
                for (var i = terrain.length; i--;) this.terrainFilter.push(ig.TERRAIN[terrain[i]])
            }
            this.limitRangeOnColl = config.limitRangeOnColl || 0
        },

        initData: function (spawnData) {
            spawnData.count = ig.Event.getExpressionValue(this.count);
            spawnData.spawned = 0;
            return ig.Event.getExpressionValue(this.duration)
        },

        spawn: function (combatant, timer, spawnData, sizeX, sizeY, height) {
            var sizeX = sizeX || 16,
                sizeY = sizeY || 16,
                height = height || 16;

            // --- spawn direction ---
            var dir;
            if (this.dir) dir = ig.Action.getVec2(this.dir, combatant, tmpVec2B);
            else if (this.aimAtTarget) {
                var aimPos = this._getPos(combatant, 0);
                var target = combatant.getTarget();
                if (target) {
                    target = target.getCenter(tmpVec2C);
                    dir = Vec2.sub(target, aimPos, tmpVec2B)
                } else dir = Vec2.assign(tmpVec2B, combatant.face)
            } else dir = Vec2.assign(tmpVec2B, combatant.face);

            var startDist = ig.Event.getExpressionValue(this.startDist);
            startDist && Vec2.length(dir, startDist);

            // Collision sizing for start-distance tracing.
            if (this.startDistCollide || this.limitRangeOnColl)
                var collideSizeX = Math.min((this.posEntity || combatant).coll.size.x, sizeX),
                    collideSizeY = Math.min((this.posEntity || combatant).coll.size.y, sizeY);

            if (this.limitRangeOnColl) {
                this.limitRangeOnColl = 0;
                this._limitRange(combatant, dir, collideSizeX, collideSizeY, height)
            }

            timer = timer - combatant.coll.getTick(true);
            var duration = ig.Event.getExpressionValue(this.duration);
            if (duration - timer < this.delay) return timer;

            var progress = duration ? 1 - (timer / (duration - this.delay)).limit(0, 1) : 1;
            var totalCount = this.repeat ? spawnData.count : spawnData.count - 1;
            var spawnCount = this.repeat ? Math.ceil(totalCount * progress) : 1 + Math.floor(totalCount * progress);

            if (spawnCount > spawnData.spawned)
                for (var spawned = spawnData.spawned; spawned < spawnCount; ++spawned) {
                    var timeOffset = 0;
                    if (totalCount && duration) {
                        timeOffset = (duration - this.delay) * (1 - spawned / totalCount);
                        timeOffset = timeOffset - timer
                    }
                    this.startDistAdd && Vec2.length(dir, startDist + this.startDistAdd * (spawned / (spawnData.count - 1 || 1)));

                    var spawnPos = this._getPos(combatant, timeOffset);
                    var angleFrac = this.random ? Math.random() : spawned / (spawnData.count == 1 || this.centralAngle == Math.PI * 2 ? spawnData.count : spawnData.count - 1);
                    var angle = this.startAngle + angleFrac * this.centralAngle;
                    this.clockwise && (angle = -angle);
                    angle = angle + (Math.random() - 0.5) * this.angleVary;
                    this.flipLeftFace && ig.isFaceLeftHalf(combatant, this.flipLeftFace) && (angle = -angle);
                    var dirRot = Vec2.rotate(dir, angle, tmpVec2C);
                    var offset = Vec3.assignC(tmpSize3, 0, 0, 0);

                    if (startDist) {
                        var traceDist = 1;
                        if (this.startDistCollide) {
                            var step = 0.0625,
                                trying = false,
                                drop = false;
                            do {
                                trying = false;
                                var traceResult = ig.game.physics.initTraceResult(TRACE_SCRATCH);
                                ig.game.trace(traceResult, spawnPos.x - collideSizeX / 2, spawnPos.y - collideSizeY / 2, spawnPos.z, dirRot.x, dirRot.y * this.yScale, collideSizeX, collideSizeY, height, ig.COLLTYPE.IGNORE, combatant, void 0, true);
                                traceDist = traceResult.dist;
                                if (traceResult.dist < 1 && this.startDistCollide == sc.SPAWN_START_DIST_COLLIDE.ALT_DIR) {
                                    Vec2.rotate(dirRot, Math.PI * 2 * step);
                                    step = -step;
                                    step = step + (step > 0 ? 0.0625 : -0.0625);
                                    trying = Math.abs(step) < 0.5
                                } else traceResult.dist < 1 && this.startDistCollide == sc.SPAWN_START_DIST_COLLIDE.DROP && (drop = true)
                            } while (trying);
                            if (drop) continue
                        }
                        offset.x = offset.x + dirRot.x * traceDist;
                        offset.y = offset.y + dirRot.y * this.yScale * traceDist
                    }
                    dirRot.y = dirRot.y * this.yScale;

                    // Optional jitter inside a rectangular/circular offset area.
                    if (this.offsetArea) {
                        var tries = 10;
                        var areaX = 0,
                            areaY = 0;
                        do {
                            areaX = Math.random();
                            areaY = Math.random();
                            if (this.circularArea) {
                                if (AREA_POINTS[tries - 1]) {
                                    areaX = AREA_POINTS[tries - 1].radius;
                                    areaY = AREA_POINTS[tries - 1].angle
                                }
                                var radial = Vec2.assignC(tmpVec2D, 0, Math.sqrt(areaX));
                                Vec2.rotate(radial, areaY * Math.PI * 2);
                                areaX = this.offsetArea.x / 2 * radial.x;
                                areaY = this.offsetArea.y / 2 * radial.y
                            } else {
                                if (AREA_POINTS[tries - 1]) {
                                    areaX = AREA_POINTS[tries - 1].x;
                                    areaY = AREA_POINTS[tries - 1].y
                                }
                                areaX = (areaX - 0.5) * this.offsetArea.x;
                                areaY = (areaY - 0.5) * this.offsetArea.y
                            }
                            var ox = spawnPos.x + offset.x + areaX,
                                oy = spawnPos.y + offset.y + areaY,
                                oz = spawnPos.z + offset.z
                        } while ((ig.game.isAreaBlocked(ox - sizeX / 2, oy - sizeY / 2, oz, sizeX, sizeY, 0) || this.terrainFilter && this.terrainFilter.indexOf(ig.terrain.getPointTerrain(ox, oy, oz + 4, sizeX, sizeY)) == -1) && --tries);
                        tries == 0 && (areaX = areaY = 0);
                        offset.x = offset.x + areaX;
                        offset.y = offset.y + areaY
                    }

                    if (this.uniformDir) {
                        dirRot = Vec2.rotate(dir, angle * (1 - this.uniformDir), tmpVec2C);
                        dirRot.y = dirRot.y * this.yScale
                    }
                    if (this.maxGroundDistance != null) {
                        var groundZ = ig.game.physics.getBaseZPos(spawnPos.x + offset.x - 1, spawnPos.y + offset.y - 1, spawnPos.z + offset.z, 2, 2);
                        if (spawnPos.z + offset.z - groundZ > this.maxGroundDistance) continue
                    }

                    this.callback(spawnPos.x + offset.x, spawnPos.y + offset.y, spawnPos.z + offset.z, dirRot, spawnData)
                }

            spawnData.spawned = spawnCount;
            if (timer <= 0 && this.repeat) {
                timer = timer + (duration - this.delay);
                spawnData.spawned = 0
            }
            return timer
        },

        // Sweep a ring of collision traces to find the clear angular range when
        // the fan would hit geometry (adjusts startAngle/centralAngle).
        _limitRange: function (combatant, dir, sizeX, sizeY, height) {
            for (var state = 0, angle = 0, blocked = false, startAngleAccum = 0, stepCount = 16, stepAngle = Math.PI * 2 / stepCount; stepCount--;) {
                var traceResult = ig.game.physics.initTraceResult(TRACE_SCRATCH);
                var pos = this._getPos(combatant, 0);
                var dirRot = Vec2.rotate(dir, startAngleAccum + angle, tmpVec2C);
                ig.game.trace(traceResult, pos.x - sizeX / 2, pos.y - sizeY / 2, pos.z, dirRot.x, dirRot.y * this.yScale, sizeX, sizeY, height - ig.COLLISION.HEIGHT_TOLERATE, ig.COLLTYPE.IGNORE, combatant, void 0, true);
                if (state) {
                    if (traceResult.dist < 1 != blocked) {
                        blocked = !blocked;
                        if (state == 1) {
                            if (blocked) {
                                this.startAngle = startAngleAccum + angle - stepAngle;
                                this.centralAngle = -angle + stepAngle;
                                angle = 0;
                                stepAngle = -stepAngle;
                                blocked = !blocked
                            } else {
                                startAngleAccum = this.startAngle = startAngleAccum + angle;
                                this.centralAngle = angle = 0
                            }
                            state = 2
                        } else if (state == 2) break
                    }
                } else {
                    state = 1;
                    blocked = traceResult.dist < 1
                }
                angle = angle + stepAngle
            }
            if (state > 1) this.centralAngle = this.centralAngle + angle
        },

        _getPos: function (combatant, timeOffset) {
            if (this.posEntity) combatant = this.posEntity;
            var pos = combatant.getAlignedPos(this.align, tmpPos3);
            if (combatant.isPlayer && this.align == ig.ENTITY_ALIGN.BOTTOM) {
                var maxJumpHeight = combatant.maxJumpHeight === void 0 ? -1 : combatant.maxJumpHeight;
                if (maxJumpHeight >= 0) pos.z = Math.min(combatant.coll.pos.z, maxJumpHeight)
            }
            this.offset && Vec3.add(pos, this.offset);
            Vec2.addMulF(pos, combatant.coll.vel, -timeOffset);
            return pos
        }
    });

    sc.ProxySpawnerForce = sc.CombatForce.extend({
        proxy: null,
        spawnHelper: null,
        timer: 0,
        spawnData: {},

        init: function (combatant, config, posEntity) {
            this.parent(combatant);
            this.proxy = sc.ProxyTools.getProxy(config.proxy, combatant);
            this.spawnHelper = new sc.SpawnHelper(config, this.spawnProxy.bind(this), posEntity);
            this.timer = this.spawnHelper.initData(this.spawnData)
        },
        update: function () {
            var size = this.proxy.getSize(tmpSize3);
            this.timer = this.spawnHelper.spawn(this.combatant, this.timer, this.spawnData, size.x, size.y, size.z);
            return this.timer <= 0
        },
        spawnProxy: function (x, y, z, dir) {
            this.proxy && this.proxy.spawn(x, y, z, this.combatant, dir, this.combatant)
        },
        isRepeating: function () {
            return this.spawnHelper.repeat
        }
    });

    sc.EnemySpawnerForce = sc.CombatForce.extend({
        enemyInfo: null,
        enemyType: null,
        spawnHelper: null,
        timer: 0,
        spawnData: {},

        init: function (combatant, config) {
            this.parent(combatant);
            this.enemyType = config.enemyType;
            this.enemyInfo = config.enemyInfo;
            this.pushVel = config.pushVel;
            this.pushZVel = config.pushZVel;
            this.proxySrc = config.proxySrc;
            this.spawnHelper = new sc.SpawnHelper(config, this.spawnEnemy.bind(this));
            this.timer = this.spawnHelper.initData(this.spawnData)
        },
        update: function () {
            this.timer = this.spawnHelper.spawn(this.combatant, this.timer, this.spawnData);
            return this.timer <= 0
        },
        spawnEnemy: function (x, y, z, dir) {
            var ownerEnemy = null;
            if (this.combatantRoot instanceof ig.ENTITY.Enemy) ownerEnemy = this.combatantRoot;
            var enemy = ig.game.spawnEntity(ig.ENTITY.Enemy, x - this.enemyType.size.x / 2, y - this.enemyType.size.y / 2, z, {
                enemyInfo: this.enemyInfo,
                ownerEnemy: ownerEnemy
            }, true);
            Vec2.assign(enemy.face, dir);
            this.combatant.target ? enemy.setTarget(this.combatant.target, true) : enemy.enemyType.reselectTarget(enemy, false, true, true);
            if (this.pushVel) {
                Vec2.assign(enemy.coll.vel, dir);
                Vec2.length(enemy.coll.vel, ig.Event.getNumberVary(this.pushVel));
                enemy.coll.friction.air = 0
            }
            if (this.pushZVel) enemy.coll.vel.z = ig.Event.getNumberVary(this.pushZVel);
            if (this.proxySrc) {
                var proxy = sc.ProxyTools.getProxy(this.proxySrc, ownerEnemy);
                if (proxy) proxy.spawn(x, y, z, ownerEnemy, dir).target = enemy
            }
        },
        isRepeating: function () {
            return this.spawnHelper.repeat
        }
    })
});
ig.baked = !0;

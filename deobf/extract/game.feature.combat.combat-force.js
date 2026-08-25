ig.module("game.feature.combat.combat-force").requires("impact.base.entity").defines(function() {
    sc.CombatForce = ig.Class.extend({
        combatant: null,
        combatantRoot: null,
        init: function(a) {
            this.combatant = a;
            this.combatantRoot = a.getCombatantRoot && a.getCombatantRoot() || a
        },
        update: function() {
            return true
        },
        isRepeating: function() {
            return false
        },
        onActionEndDetach: function() {
            this.combatantRoot && this.combatantRoot.removeActionAttached(this);
            this.combatantRoot = null
        },
        getCombatant: function() {
            return this.combatant
        },
        getCombatantRoot: function() {
            return this.combatantRoot
        },
        onEnd: null
    });
    var b = Vec3.create(),
        a = Vec2.create(),
        d = Vec2.create(),
        c = Vec2.create(),
        e = Vec2.create(),
        f = Vec3.create();
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
        init: function(a, b) {
            this.parent(a);
            this.party = sc.COMBATANT_PARTY[b.party] ||
                this.combatant.party;
            this.attackInfo = new sc.AttackInfo(a.params, b.attack);
            this.align = ig.ENTITY_ALIGN[b.align] || this.align;
            this.pos = b.pos || null;
            if (b.fixPos) this.pos = a.getAlignedPos(this.align);
            this.dir = b.dir || null;
            this.offset = b.offset || null;
            this.radius = b.radius;
            this.yScale = b.yScale || 1;
            this.zHeight = b.zHeight || 24;
            this.centralAngle = Math.PI * 2 * (b.centralAngle || 1);
            this.startAngle = b.startAngle !== void 0 ? Math.PI * 2 * b.startAngle : -this.centralAngle / 2;
            this.duration = b.duration || 0;
            this.expandRadius = b.expandRadius ||
                0;
            this.alwaysFull = b.alwaysFull || false;
            this.clockwise = b.clockwise || false;
            this.flipLeftFace = b.flipLeftFace || false;
            this.rectangular = b.rectangular || false;
            this.repeat = b.repeat || false;
            this.uniformHitDir = b.uniformHitDir || false;
            this.checkCollision = b.checkCollision || false;
            this.timer = this.duration;
            this.prevAngle = 0;
            this.hitEntities = [];
            this.hitEntitiesAngle = []
        },
        update: function() {
            this.timer = this.timer - this.combatant.coll.getTick(true);
            var a = this.duration ? 1 - (this.timer / this.duration).limit(0, 1) : 1,
                b = this.startAngle +
                Math.max(0, this.prevAngle - Math.PI * 0.5),
                c = this.centralAngle * a;
            if (this.alwaysFull) {
                this.prevAngle = 0;
                b = this.startAngle;
                c = this.centralAngle
            }
            var d = this.startAngle + c,
                e = this.radius + a * this.expandRadius;
            if (this.timer <= 0 || c - this.prevAngle > Math.PI * 0.1) {
                if (!this.alwaysFull)
                    for (; this.hitEntitiesAngle.length && c - this.hitEntitiesAngle[0] > Math.PI;) {
                        this.hitEntities.shift();
                        this.hitEntitiesAngle.shift()
                    }
                this.prevAngle = c;
                a = !this.clockwise;
                this.flipLeftFace && ig.isFaceLeftHalf(this.combatant, this.flipLeftFace) && (a = !a);
                if (a) {
                    a = b;
                    b = -d;
                    d = -a
                }
                var a = this.party,
                    f = this.alwaysFull && this.centralAngle >= Math.PI * 2 ? null : this.dir || this.combatant.face,
                    g = this.combatant.party == this.party ? this.combatant : null,
                    h = this._getPos(),
                    g = ig.game.getEntitiesInCircle(h, e, this.yScale, this.zHeight, f, b, d, g, this.hitEntities, this.rectangular, this.checkCollision);
                window.ig.perf.showHitBoxes && (this.rectangular || ig.debugView.addMapCircle(h.x, h.y, h.z, e, f, b, d, this.zHeight, "red", 0.1, this.yScale));
                for (b = g.length; b--;) {
                    d = false;
                    e = g[b];
                    f = null;
                    if (e.coll.parentColl &&
                        e.coll.parentGroup) {
                        f = e.coll.parentColl.entity.uid + e.coll.parentGroup;
                        if (this.hitEntities.indexOf(f) != -1) continue
                    }
                    if (d = e.isCombatant && a != e.party ? e.damage(this, this.attackInfo) : true) {
                        e.ballHit && e.ballHit(this);
                        f ? this.hitEntities.push(f) : this.hitEntities.push(e);
                        this.hitEntitiesAngle.push(c)
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
        getElement: function() {
            return this.attackInfo && this.attackInfo.element ||
                sc.ELEMENT.NEUTRAL
        },
        getHitCenter: function(a, b) {
            var c = b || Vec3.create();
            a.getAlignedPos(ig.ENTITY_ALIGN.CENTER, c);
            var e = this._getPos();
            Vec2.assign(d, c);
            Vec2.sub(d, e);
            var f = this.duration ? 1 - (this.timer / this.duration).limit(0, 1) : 1,
                f = this.radius + f * this.expandRadius;
            if (Vec2.length(d) > f) {
                Vec2.length(d, f);
                Vec2.assign(c, e);
                Vec2.add(c, d)
            }
            c.z = c.z.limit(e.z, e.z + this.zHeight);
            return c
        },
        getHitVel: function(a, b) {
            var c = b || Vec2.create();
            a.getCenter(c);
            this.uniformHitDir ? Vec2.sub(c, this.combatant.getCenter(d)) : Vec2.sub(c,
                this._getPos());
            if (!this.pos && Vec2.dot(c, this.combatant.face) > 0) {
                Vec2.assign(d, this.combatant.face);
                Vec2.length(d, 2);
                Vec2.length(c, 1);
                Vec2.add(c, d)
            }
            return c
        },
        getHitDir: function(a, b) {
            b = b || Vec2.create();
            a.getCenter(b);
            this.uniformHitDir ? Vec2.sub(b, this.combatant.getCenter(d)) : Vec2.sub(b, this._getPos());
            return b
        },
        getCollideSide: function(b) {
            b = this.getHitDir(b, a);
            return Math.abs(b.x) > Math.abs(b.y) ? ig.ActorEntity.FACE4[b.x < 0 ? "EAST" : "WEST"] : ig.ActorEntity.FACE4[b.y < 0 ? "SOUTH" : "NORTH"]
        },
        _getPos: function() {
            if (this.pos) return this.pos;
            var a = this.combatant.getAlignedPos(this.align, b);
            this.offset && Vec3.add(a, this.offset);
            return a
        },
        isRepeating: function() {
            return this.repeat
        }
    });
    sc.DIRECT_HIT_DIR = {
        TOWARD: 1,
        AWAY: 2
    };
    sc.DirectHitForce = sc.CombatForce.extend({
        attackInfo: null,
        hitDir: null,
        align: ig.ENTITY_ALIGN.CENTER,
        hitCount: 0,
        hitDelay: 0,
        effect: null,
        victim: null,
        timer: 0,
        init: function(a, b, c, d) {
            this.parent(a);
            this.attackInfo = new sc.AttackInfo(this.combatantRoot.params, c.attack);
            this.hitDir = sc.DIRECT_HIT_DIR[c.hitDir || "AWAY"];
            this.align = ig.ENTITY_ALIGN[c.align] ||
                this.align;
            this.hitCount = c.hitCount || 1;
            this.hitDelay = c.hitDelay || 0.1;
            this.timer = 0;
            this.effect = d;
            this.victim = b
        },
        update: function() {
            if (!this.victim.damage) return true;
            for (this.timer = this.timer - this.combatant.coll.getTick(true); this.hitCount && this.timer <= 0;) {
                this.timer = this.timer + this.hitDelay;
                this.hitCount--;
                this.effect && this.effect.spawnOnTarget(this.victim, {
                    align: this.align
                });
                this.victim.damage(this, this.attackInfo)
            }
            return this.hitCount == 0
        },
        getElement: function() {
            return this.attackInfo && this.attackInfo.element ||
                sc.ELEMENT.NEUTRAL
        },
        getHitCenter: function(a, b) {
            var c = b || Vec2.create();
            a.getCenter(c);
            c.z = a.coll.pos.z + a.coll.size.z / 2;
            return c
        },
        getHitVel: function(a, b) {
            var d = b || Vec2.create();
            a.getCenter(d);
            this.combatant.getCenter(c);
            Vec2.sub(d, c);
            this.hitDir == sc.DIRECT_HIT_DIR.TOWARD && Vec2.flip(d);
            return d
        },
        getHitDir: function(a, b) {
            return this.getHitVel(a, b)
        },
        getCollideSide: function(b) {
            b = this.getHitVel(b, a);
            return Math.abs(b.x) > Math.abs(b.y) ? ig.ActorEntity.FACE4[b.x < 0 ? "EAST" : "WEST"] : ig.ActorEntity.FACE4[b.y < 0 ? "SOUTH" :
                "NORTH"]
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
    sc.PushPullForce = sc.CombatForce.extend({
        radius: 0,
        fadeRadius: 0,
        zHeight: 0,
        influencedEntities: [],
        fxHandles: [],
        timer: 0,
        pullAll: false,
        init: function(a, b) {
            this.parent(a);
            this.radius = b.radius;
            this.minRadius = b.minRadius || 0;
            this.fadeRadius = b.fadeRadius;
            this.faceDist = b.faceDist;
            this.strength = sc.PUSH_PULL_STRENGTH[b.strength] || sc.PUSH_PULL_STRENGTH.WALK_ESCAPE;
            this.influence = new ig.InfluenceEntry;
            this.influence.setPushType(b.pull ? sc.INFLUENCE_PUSH.PULL : sc.INFLUENCE_PUSH.PUSH, this.radius, this.fadeRadius, this.strength);
            this.zHeight = b.zHeight || 32;
            this.timer = b.duration || 0;
            this.party = sc.COMBATANT_PARTY[b.party] || this.combatant.party;
            this.effect = b.effect || null;
            this.align = ig.ENTITY_ALIGN[b.align] || ig.ENTITY_ALIGN.BOTTOM
        },
        update: function() {
            var c = this.combatant.getAlignedPos(this.align, b);
            if (this.faceDist) {
                var d = Vec2.assign(a, this.combatant.face);
                Vec2.length(d, this.faceDist);
                Vec2.add(c, d)
            }
            this.influence.setPushCenter(c);
            for (var e = this.combatant.coll, d = this.influencedEntities.length; d--;) {
                var f = this.influencedEntities[d],
                    g = f.coll,
                    h = Vec2.sub(f.getCenter(a), c),
                    h = Vec2.length(h),
                    n = h - this.combatant.coll.size.y / 2 - f.coll.size.y / 2;
                (h > this.radius + this.fadeRadius || this.minRadius && n < this.minRadius || g.pos.z > e.pos.z + this.zHeight || g.pos.z + g.size.z < e.pos.z) && this._removeEntity(d)
            }
            e = ig.game.getEntitiesInCircle(c, this.radius + this.fadeRadius, 1, this.zHeight, null, null, null, this.combatantRoot, this.influencedEntities, false);
            for (d = e.length; d--;) {
                f =
                    e[d];
                if (f != this.combatant && (f.influencer && f instanceof ig.ENTITY.Combatant && f.party != this.party) && f.coll.groundConnect == ig.COLL_GROUND_CONNECT.LOOSE && f.coll.weight != -1) {
                    h = Vec2.sub(f.getCenter(a), c);
                    h = Vec2.length(h);
                    n = h - this.combatant.coll.size.y / 2 - f.coll.size.y / 2;
                    if (!(this.minRadius && n < this.minRadius)) {
                        f.influencer.addInfluence(this.influence);
                        this.influencedEntities.push(f);
                        if (this.effect) {
                            f = this.effect.spawnOnTarget(f, {
                                duration: -1,
                                align: ig.ENTITY_ALIGN.CENTER,
                                target2: this.combatant,
                                target2Align: ig.ENTITY_ALIGN.CENTER
                            });
                            this.fxHandles.push(f)
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
        _removeEntity: function(a) {
            this.influencedEntities[a].influencer.removeInfluence(this.influence);
            this.influencedEntities.splice(a, 1);
            if (this.effect) {
                this.fxHandles[a].stop();
                this.fxHandles.splice(a, 1)
            }
        },
        onEnd: function() {
            for (var a = this.influencedEntities.length; a--;) this._removeEntity(a)
        },
        isRepeating: function() {
            return this.timer < 0
        }
    });
    sc.PROXY_GRID_FLOW = {
        SQUARE: function(a,
            b, c, d, e) {
            d = Math.abs(d + 0.5 - b / 2);
            e = Math.abs(e + 0.5 - c / 2);
            return a * b / 2 >= d && a * c / 2 >= e
        },
        CIRCLE: function(a, b, c, d, e) {
            d = Math.abs(d + 0.5 - b / 2);
            e = Math.abs(e + 0.5 - c / 2);
            e = Math.sqrt(d * d + e * e);
            return a * Math.sqrt(b * b / 4 + c * c / 4) >= e
        }
    };
    sc.ProxyGridForce = sc.CombatForce.extend({
        init: function(a, b, c) {
            this.parent(a);
            this.posTarget = c;
            this.proxies = b.proxies;
            this.pattern = b.pattern;
            this.tilesize = b.tilesize;
            this.align = ig.ENTITY_ALIGN[b.align] || ig.ENTITY_ALIGN.BOTTOM;
            this.offset = b.offset;
            this.duration = b.duration;
            this.spawnDelay = b.spawnDelay ||
                0;
            this.delayTimer = this.timer = 0;
            this.width = this.pattern[0].length;
            this.height = this.pattern.length;
            this.flow = sc.PROXY_GRID_FLOW[b.flow] || sc.PROXY_GRID_FLOW.CIRCLE;
            this.oldWeight = 0;
            this.spawnList = []
        },
        update: function() {
            var a = this.posTarget || this.combatant,
                c = a.getAlignedPos(this.align, b);
            Vec3.add(c, this.offset);
            this.timer = this.timer + ig.system.tick;
            for (var d = this.duration ? this.timer / this.duration : 1, e = this.height; e--;)
                for (var f = this.width; f--;)
                    if (this.pattern[e] && this.pattern[e][f] && (!this.oldWeight || !this.flow(this.oldWeight,
                            this.width, this.height, f, e)) && this.flow(d, this.width, this.height, f, e)) {
                        var g = this.pattern[e][f] - 1;
                        if (a = sc.ProxyTools.getProxy(this.proxies[g], this.combatantRoot)) {
                            var h = c.x + (f + 0.5 - this.width / 2) * this.tilesize,
                                p = c.y + (e + 0.5 - this.height / 2) * this.tilesize;
                            if (!ig.game.isAreaBlocked(h - this.tilesize / 2, p - this.tilesize / 2, c.z, this.tilesize, this.tilesize, 16)) {
                                if (this.maxGroundDistance != null) {
                                    var r = ig.game.physics.getBaseZPos(h - 1, p - 1, c.z, 2, 2);
                                    if (c.z - r > this.maxGroundDistance) continue
                                }
                                if (this.spawnDelay) this.spawnList.push({
                                    x: h,
                                    y: p,
                                    index: g - 1,
                                    proxy: a
                                });
                                else {
                                    a = a.spawn(h, p, c.z, this.combatant, this.combatant.face);
                                    a.setAttribute("gridIndex", g + 1)
                                }
                            }
                        }
                    } if (this.delayTimer) {
                this.delayTimer = this.delayTimer - ig.system.tick;
                if (this.delayTimer <= 0) this.delayTimer = 0
            }
            for (; this.spawnList.length > 0 && !this.delayTimer;) {
                e = this.spawnList.shift();
                a = e.proxy.spawn(e.x, e.y, c.z, this.combatant, this.combatant.face);
                a.setAttribute("gridIndex", e.index);
                this.delayTimer = this.delayTimer + this.spawnDelay
            }
            this.oldWeight = d;
            return this.timer >= this.duration && this.spawnList.length ==
                0
        }
    });
    var g = [{
            radius: 1,
            angle: 0,
            x: 0.5,
            y: 1
        }, {
            radius: 1,
            angle: 0.25,
            x: 0.5,
            y: 0
        }, {
            radius: 1,
            angle: 0.5,
            x: 1,
            y: 0.5
        }, {
            radius: 1,
            angle: 0.75,
            x: 0,
            y: 0.5
        }],
        h = {};
    sc.SPAWN_START_DIST_COLLIDE = {
        NONE: 0,
        CLOSER: 1,
        DROP: 2,
        ALT_DIR: 3
    };
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
        init: function(a, b, c) {
            this.align = ig.ENTITY_ALIGN[a.align] || this.align;
            this.offset = a.offset || null;
            this.centralAngle = Math.PI * 2 * (a.centralAngle || 0);
            this.startAngle = a.startAngle !== void 0 ? Math.PI * 2 * a.startAngle : -this.centralAngle / 2;
            this.startDist = a.startDist || 0;
            this.startDistAdd = a.startDistAdd || 0;
            this.startDistCollide = sc.SPAWN_START_DIST_COLLIDE[a.startDistCollide] || sc.SPAWN_START_DIST_COLLIDE.NONE;
            this.angleVary = (a.angleVary || 0) * Math.PI * 2;
            this.count = a.count || 1;
            this.duration =
                a.duration || 0;
            this.clockwise = a.clockwise || false;
            this.flipLeftFace = a.flipLeftFace || false;
            this.random = a.random || false;
            this.timer = this.duration;
            this.dir = a.dir || null;
            this.aimAtTarget = a.aimAtTarget || false;
            this.yScale = a.yScale || 1;
            this.offsetArea = a.offsetArea || null;
            this.circularArea = a.circularArea || false;
            this.uniformDir = a.uniformDir || 0;
            this.delay = a.delay || 0;
            this.callback = b;
            this.repeat = a.repeat;
            this.posEntity = c;
            if (a.maxGroundDistance != null && a.maxGroundDistance != void 0) this.maxGroundDistance = a.maxGroundDistance;
            if (a.terrainFilter) {
                b = a.terrainFilter;
                this.terrainFilter = [];
                for (c = b.length; c--;) this.terrainFilter.push(ig.TERRAIN[b[c]])
            }
            this.limitRangeOnColl = a.limitRangeOnColl || 0
        },
        initData: function(a) {
            a.count = ig.Event.getExpressionValue(this.count);
            a.spawned = 0;
            return ig.Event.getExpressionValue(this.duration)
        },
        spawn: function(a, b, k, l, o, m) {
            var l = l || 16,
                o = o || 16,
                m = m || 16,
                n;
            if (this.dir) n = ig.Action.getVec2(this.dir, a, d);
            else if (this.aimAtTarget) {
                var p = this._getPos(a, 0);
                if (n = a.getTarget()) {
                    n = n.getCenter(c);
                    n = Vec2.sub(n,
                        p, d)
                } else n = Vec2.assign(d, a.face)
            } else n = Vec2.assign(d, a.face);
            var r = ig.Event.getExpressionValue(this.startDist);
            r && Vec2.length(n, r);
            if (this.startDistCollide || this.limitRangeOnColl) var t = Math.min((this.posEntity || a).coll.size.x, l),
                q = Math.min((this.posEntity || a).coll.size.y, o);
            if (this.limitRangeOnColl) {
                this.limitRangeOnColl = 0;
                this._limitRange(a, n, t, q, m)
            }
            var b = b - a.coll.getTick(true),
                s = ig.Event.getExpressionValue(this.duration);
            if (s - b < this.delay) return b;
            var p = s ? 1 - (b / (s - this.delay)).limit(0, 1) : 1,
                v = this.repeat ?
                k.count : k.count - 1,
                y = this.repeat ? Math.ceil(v * p) : 1 + Math.floor(v * p);
            if (y > k.spawned)
                for (var u = k.spawned; u < y; ++u) {
                    p = 0;
                    if (v && s) {
                        p = (s - this.delay) * (1 - u / v);
                        p = p - b
                    }
                    this.startDistAdd && Vec2.length(n, r + this.startDistAdd * (u / (k.count - 1 || 1)));
                    var p = this._getPos(a, p),
                        z = this.random ? Math.random() : u / (k.count == 1 || this.centralAngle == Math.PI * 2 ? k.count : k.count - 1),
                        D = this.startAngle + z * this.centralAngle;
                    this.clockwise && (D = -D);
                    D = D + (Math.random() - 0.5) * this.angleVary;
                    this.flipLeftFace && ig.isFaceLeftHalf(a, this.flipLeftFace) && (D = -D);
                    var C = Vec2.rotate(n, D, c),
                        A = Vec3.assignC(f, 0, 0, 0);
                    if (r) {
                        z = 1;
                        if (this.startDistCollide) {
                            var B = 0.0625,
                                w = false,
                                x = false;
                            do {
                                var w = false,
                                    E = ig.game.physics.initTraceResult(h);
                                ig.game.trace(E, p.x - t / 2, p.y - q / 2, p.z, C.x, C.y * this.yScale, t, q, m, ig.COLLTYPE.IGNORE, a, void 0, true);
                                z = E.dist;
                                if (E.dist < 1 && this.startDistCollide == sc.SPAWN_START_DIST_COLLIDE.ALT_DIR) {
                                    Vec2.rotate(C, Math.PI * 2 * B);
                                    B = -B;
                                    B = B + (B > 0 ? 0.0625 : -0.0625);
                                    w = Math.abs(B) < 0.5
                                } else E.dist < 1 && this.startDistCollide == sc.SPAWN_START_DIST_COLLIDE.DROP && (x = true)
                            } while (w);
                            if (x) continue
                        }
                        A.x = A.x + C.x * z;
                        A.y = A.y + C.y * this.yScale * z
                    }
                    C.y = C.y * this.yScale;
                    if (this.offsetArea) {
                        z = 10;
                        do {
                            B = Math.random();
                            w = Math.random();
                            if (this.circularArea) {
                                if (g[z - 1]) {
                                    B = g[z - 1].radius;
                                    w = g[z - 1].angle
                                }
                                x = Vec2.assignC(e, 0, Math.sqrt(B));
                                Vec2.rotate(x, w * Math.PI * 2);
                                B = this.offsetArea.x / 2 * x.x;
                                w = this.offsetArea.y / 2 * x.y
                            } else {
                                if (g[z - 1]) {
                                    B = g[z - 1].x;
                                    w = g[z - 1].y
                                }
                                B = (B - 0.5) * this.offsetArea.x;
                                w = (w - 0.5) * this.offsetArea.y
                            }
                            var x = p.x + A.x + B,
                                E = p.y + A.y + w,
                                G = p.z + A.z
                        } while ((ig.game.isAreaBlocked(x - l / 2, E - o / 2, G, l, o, 0) || this.terrainFilter &&
                                this.terrainFilter.indexOf(ig.terrain.getPointTerrain(x, E, G + 4, l, o)) == -1) && --z);
                        z == 0 && (B = w = 0);
                        A.x = A.x + B;
                        A.y = A.y + w
                    }
                    if (this.uniformDir) {
                        C = Vec2.rotate(n, D * (1 - this.uniformDir), c);
                        C.y = C.y * this.yScale
                    }
                    if (this.maxGroundDistance != null) {
                        D = ig.game.physics.getBaseZPos(p.x + A.x - 1, p.y + A.y - 1, p.z + A.z, 2, 2);
                        if (p.z + A.z - D > this.maxGroundDistance) continue
                    }
                    this.callback(p.x + A.x, p.y + A.y, p.z + A.z, C, k)
                }
            k.spawned = y;
            if (b <= 0 && this.repeat) {
                b = b + (s - this.delay);
                k.spawned = 0
            }
            return b
        },
        _limitRange: function(a, b, d, e, f) {
            for (var g = 0, n = 0,
                    p = false, r = 0, t = 16, q = Math.PI * 2 / t; t--;) {
                var s = ig.game.physics.initTraceResult(h),
                    v = this._getPos(a, 0),
                    y = Vec2.rotate(b, r + n, c);
                ig.game.trace(s, v.x - d / 2, v.y - e / 2, v.z, y.x, y.y * this.yScale, d, e, f - ig.COLLISION.HEIGHT_TOLERATE, ig.COLLTYPE.IGNORE, a, void 0, true);
                if (g) {
                    if (s.dist < 1 != p) {
                        p = !p;
                        if (g == 1) {
                            if (p) {
                                this.startAngle = r + n - q;
                                this.centralAngle = -n + q;
                                n = 0;
                                q = -q;
                                p = !p
                            } else {
                                r = this.startAngle = r + n;
                                this.centralAngle = n = 0
                            }
                            g = 2
                        } else if (g == 2) break
                    }
                } else {
                    g = 1;
                    p = s.dist < 1
                }
                n = n + q
            }
            if (g > 1) this.centralAngle = this.centralAngle + n
        },
        _getPos: function(a,
            c) {
            if (this.posEntity) a = this.posEntity;
            var d = a.getAlignedPos(this.align, b);
            if (a.isPlayer && this.align == ig.ENTITY_ALIGN.BOTTOM) {
                var e = a.maxJumpHeight === void 0 ? -1 : a.maxJumpHeight;
                if (e >= 0) d.z = Math.min(a.coll.pos.z, e)
            }
            this.offset && Vec3.add(d, this.offset);
            Vec2.addMulF(d, a.coll.vel, -c);
            return d
        }
    });
    sc.ProxySpawnerForce = sc.CombatForce.extend({
        proxy: null,
        spawnHelper: null,
        timer: 0,
        spawnData: {},
        init: function(a, b, c) {
            this.parent(a);
            this.proxy = sc.ProxyTools.getProxy(b.proxy, a);
            this.spawnHelper = new sc.SpawnHelper(b,
                this.spawnProxy.bind(this), c);
            this.timer = this.spawnHelper.initData(this.spawnData)
        },
        update: function() {
            var a = this.proxy.getSize(f);
            this.timer = this.spawnHelper.spawn(this.combatant, this.timer, this.spawnData, a.x, a.y, a.z);
            return this.timer <= 0
        },
        spawnProxy: function(a, b, c, d) {
            this.proxy && this.proxy.spawn(a, b, c, this.combatant, d, this.combatant)
        },
        isRepeating: function() {
            return this.spawnHelper.repeat
        }
    });
    sc.EnemySpawnerForce = sc.CombatForce.extend({
        enemyInfo: null,
        enemyType: null,
        spawnHelper: null,
        timer: 0,
        spawnData: {},
        init: function(a, b) {
            this.parent(a);
            this.enemyType = b.enemyType;
            this.enemyInfo = b.enemyInfo;
            this.pushVel = b.pushVel;
            this.pushZVel = b.pushZVel;
            this.proxySrc = b.proxySrc;
            this.spawnHelper = new sc.SpawnHelper(b, this.spawnEnemy.bind(this));
            this.timer = this.spawnHelper.initData(this.spawnData)
        },
        update: function() {
            this.timer = this.spawnHelper.spawn(this.combatant, this.timer, this.spawnData);
            return this.timer <= 0
        },
        spawnEnemy: function(a, b, c, d) {
            var e = null;
            if (this.combatantRoot instanceof ig.ENTITY.Enemy) e = this.combatantRoot;
            var f = ig.game.spawnEntity(ig.ENTITY.Enemy, a - this.enemyType.size.x / 2, b - this.enemyType.size.y / 2, c, {
                enemyInfo: this.enemyInfo,
                ownerEnemy: e
            }, true);
            Vec2.assign(f.face, d);
            this.combatant.target ? f.setTarget(this.combatant.target, true) : f.enemyType.reselectTarget(f, false, true, true);
            if (this.pushVel) {
                Vec2.assign(f.coll.vel, d);
                Vec2.length(f.coll.vel, ig.Event.getNumberVary(this.pushVel));
                f.coll.friction.air = 0
            }
            if (this.pushZVel) f.coll.vel.z = ig.Event.getNumberVary(this.pushZVel);
            if (this.proxySrc) {
                var g = sc.ProxyTools.getProxy(this.proxySrc,
                    e);
                if (g) g.spawn(a, b, c, e, d).target = f
            }
        },
        isRepeating: function() {
            return this.spawnHelper.repeat
        }
    })
});
ig.baked = !0;

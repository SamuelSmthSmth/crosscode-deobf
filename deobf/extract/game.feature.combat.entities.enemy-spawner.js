ig.module("game.feature.combat.entities.enemy-spawner").requires("impact.base.actor-entity").defines(function() {
    ig.ENTITY.EnemySpawner = ig.Entity.extend({
        enemyTypes: [],
        maxEnemies: 0,
        respawnTimer: 0,
        initialSpawn: false,
        effectInitialSpawn: false,
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                spawnCondition: {
                    _type: "VarCondition",
                    _info: "Condition for prop to appear",
                    _popup: true
                },
                enemyTypes: {
                    _type: "EnemyTypeList",
                    _info: "All enemies that are spawned on this place",
                    _popup: true
                },
                onActivateClear: {
                    _type: "Boolean",
                    _info: "If true: initially set all enemies as killed when activated."
                }
            },
            scalableX: true,
            scalableY: true,
            drawBox: true,
            boxColor: "rgba(255,120,0, 0.5)"
        }),
        init: function(b, a, d, c) {
            this.parent(b, a, d, c);
            this.coll.type = ig.COLLTYPE.NONE;
            c.size || this.coll.setSize(32, 32, 0);
            if (c.enemyTypes) {
                b = c.enemyTypes;
                for (a = 0; a < b.length; ++a) {
                    d = {
                        info: b[a].info,
                        type: new sc.EnemyType(b[a].info.type),
                        count: b[a].count,
                        activeEnemies: []
                    };
                    this.maxEnemies = this.maxEnemies + d.count;
                    this.enemyTypes.push(d)
                }
            }
            this.onActivateClear = c.onActivateClear
        },
        show: function(b) {
            this.parent(b);
            if (!b) this.onActivateClear ? this._storeState(true) : this.effectInitialSpawn = true
        },
        onKill: function(b) {
            this.parent(b);
            this._storeState();
            for (b = this.enemyTypes.length; b--;) this.enemyTypes[b].type.decreaseRef()
        },
        _storeState: function(b) {
            for (var a = [], d = 0, c = 0; c < this.enemyTypes.length; c++) {
                var e = this.enemyTypes[c].activeEnemies.length;
                b && (e = 0);
                a[c] = this.enemyTypes[c].count - e;
                d = d + a[c]
            }
            c = -1;
            d > 0 && (c = b ? sc.combat.time + 180 : sc.combat.time + this.respawnTimer);
            ig.vars.set(this._getVarPrefix(), {
                killed: a,
                respawnTime: c
            })
        },
        _getVarPrefix: function() {
            return "session.map.spawner" + this.mapId
        },
        update: function() {
            if (!this.initialSpawn) {
                this.initialSpawn = true;
                var b = ig.vars.get(this._getVarPrefix()),
                    a = null,
                    d = 180;
                if (b && (sc.combat.time < b.respawnTime - 180 + 30 || !sc.model.isSRank() && sc.combat.time < b.respawnTime)) {
                    a = b.killed;
                    d = b.respawnTime - sc.combat.time
                }
                this.respawnEnemies(this.effectInitialSpawn, a);
                this.respawnTimer = d
            }
            b = true;
            a = 0;
            for (d = this.enemyTypes.length; d--;) {
                for (var c = this.enemyTypes[d], e = c.activeEnemies.length; e--;) {
                    var f =
                        c.activeEnemies[e];
                    if (f.defeatNotified) {
                        c.activeEnemies.splice(e, 1);
                        c.activeEnemies.length == 0 && ig.game.varsChangedDeferred()
                    } else f.target && (b = false)
                }
                a = a + (c.count - c.activeEnemies.length)
            }
            if (b && a > 0 && sc.combat.active) {
                this.respawnTimer = this.respawnTimer - ig.system.tick;
                if (this.respawnTimer <= 0 || sc.model.isSRank() && this.respawnTimer <= 150) {
                    this.respawnEnemies(true);
                    this.respawnTimer = 180
                }
            }
        },
        isCleared: function() {
            if (!this.initialSpawn) return false;
            for (var b = this.enemyTypes.length; b--;)
                if (this.enemyTypes[b].activeEnemies.length >
                    0) return false;
            return true
        },
        respawnEnemies: function(b, a) {
            for (var d = this.enemyTypes.length; d--;)
                for (var c = this.enemyTypes[d], e = c.count - c.activeEnemies.length - (a && a[d] || 0); e--;) {
                    var f = this.spawnEnemy(c, b);
                    if (sc.newgame.get("enemy-aggro")) f.enemyType.targetDetect.onDistance = true;
                    c.activeEnemies.push(f)
                }
            ig.game.varsChangedDeferred()
        },
        spawnEnemy: function(b, a) {
            var d = this.coll,
                c = b.type.size,
                e = d.size.x - c.x,
                c = d.size.y - c.y;
            e < 0 && (e = 0);
            c < 0 && (c = 0);
            return ig.game.spawnEntity(ig.ENTITY.Enemy, Math.round(d.pos.x +
                Math.random() * e), Math.round(d.pos.y + Math.random() * c), d.pos.z, {
                enemyInfo: b.info,
                boostable: true
            }, a)
        }
    })
});
ig.baked = !0;

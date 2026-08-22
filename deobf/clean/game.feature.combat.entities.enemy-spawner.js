/**
 * game.feature.combat.entities.enemy-spawner
 * ==========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.combat.entities.enemy-spawner")`.
 *
 * `ig.ENTITY.EnemySpawner`: an invisible map entity that spawns and respawns
 * a list of enemy types inside its area. Persists kill/respawn state to
 * `ig.vars`, honors a clear-on-activate flag, and only respawns while combat
 * is active.
 */
ig.module("game.feature.combat.entities.enemy-spawner")
    .requires("impact.base.actor-entity")
    .defines(function () {

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

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.NONE;
            settings.size || this.coll.setSize(32, 32, 0);
            if (settings.enemyTypes) {
                var enemyTypeList = settings.enemyTypes;
                for (var i = 0; i < enemyTypeList.length; ++i) {
                    var entry = {
                        info: enemyTypeList[i].info,
                        type: new sc.EnemyType(enemyTypeList[i].info.type),
                        count: enemyTypeList[i].count,
                        activeEnemies: []
                    };
                    this.maxEnemies = this.maxEnemies + entry.count;
                    this.enemyTypes.push(entry)
                }
            }
            this.onActivateClear = settings.onActivateClear
        },

        show: function (visible) {
            this.parent(visible);
            if (!visible) this.onActivateClear ? this._storeState(true) : this.effectInitialSpawn = true
        },

        onKill: function (data) {
            this.parent(data);
            this._storeState();
            for (var index = this.enemyTypes.length; index--;) this.enemyTypes[index].type.decreaseRef()
        },

        _storeState: function (clearAll) {
            var killedCounts = [],
                totalKilled = 0,
                index;
            for (index = 0; index < this.enemyTypes.length; index++) {
                var activeCount = this.enemyTypes[index].activeEnemies.length;
                clearAll && (activeCount = 0);
                killedCounts[index] = this.enemyTypes[index].count - activeCount;
                totalKilled = totalKilled + killedCounts[index]
            }
            var respawnTime = -1;
            totalKilled > 0 && (respawnTime = clearAll ? sc.combat.time + 180 : sc.combat.time + this.respawnTimer);
            ig.vars.set(this._getVarPrefix(), {
                killed: killedCounts,
                respawnTime: respawnTime
            })
        },

        _getVarPrefix: function () {
            return "session.map.spawner" + this.mapId
        },

        update: function () {
            if (!this.initialSpawn) {
                this.initialSpawn = true;
                var stored = ig.vars.get(this._getVarPrefix()),
                    killed = null,
                    respawnDelay = 180;
                if (stored && (sc.combat.time < stored.respawnTime - 180 + 30 || !sc.model.isSRank() && sc.combat.time < stored.respawnTime)) {
                    killed = stored.killed;
                    respawnDelay = stored.respawnTime - sc.combat.time
                }
                this.respawnEnemies(this.effectInitialSpawn, killed);
                this.respawnTimer = respawnDelay
            }

            var allCleared = true,
                killedCount = 0;
            for (var typeIndex = this.enemyTypes.length; typeIndex--;) {
                var entry = this.enemyTypes[typeIndex];
                for (var activeIndex = entry.activeEnemies.length; activeIndex--;) {
                    var enemy = entry.activeEnemies[activeIndex];
                    if (enemy.defeatNotified) {
                        entry.activeEnemies.splice(activeIndex, 1);
                        entry.activeEnemies.length == 0 && ig.game.varsChangedDeferred()
                    } else enemy.target && (allCleared = false)
                }
                killedCount = killedCount + (entry.count - entry.activeEnemies.length)
            }

            if (allCleared && killedCount > 0 && sc.combat.active) {
                this.respawnTimer = this.respawnTimer - ig.system.tick;
                if (this.respawnTimer <= 0 || sc.model.isSRank() && this.respawnTimer <= 150) {
                    this.respawnEnemies(true);
                    this.respawnTimer = 180
                }
            }
        },

        isCleared: function () {
            if (!this.initialSpawn) return false;
            for (var index = this.enemyTypes.length; index--;)
                if (this.enemyTypes[index].activeEnemies.length > 0) return false;
            return true
        },

        respawnEnemies: function (effectSpawn, killed) {
            for (var typeIndex = this.enemyTypes.length; typeIndex--;) {
                var entry = this.enemyTypes[typeIndex];
                for (var count = entry.count - entry.activeEnemies.length - (killed && killed[typeIndex] || 0); count--;) {
                    var enemy = this.spawnEnemy(entry, effectSpawn);
                    if (sc.newgame.get("enemy-aggro")) enemy.enemyType.targetDetect.onDistance = true;
                    entry.activeEnemies.push(enemy)
                }
            }
            ig.game.varsChangedDeferred()
        },

        spawnEnemy: function (entry, effectSpawn) {
            var coll = this.coll,
                enemySize = entry.type.size,
                rangeX = coll.size.x - enemySize.x,
                rangeY = coll.size.y - enemySize.y;
            rangeX < 0 && (rangeX = 0);
            rangeY < 0 && (rangeY = 0);
            return ig.game.spawnEntity(ig.ENTITY.Enemy, Math.round(coll.pos.x + Math.random() * rangeX), Math.round(coll.pos.y + Math.random() * rangeY), coll.pos.z, {
                enemyInfo: entry.info,
                boostable: true
            }, effectSpawn)
        }
    })
});
ig.baked = !0;

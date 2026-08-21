/**
 * impact.base.entity-pool
 * ========================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `ig.module("impact.base.entity-pool")`.
 *
 * Object pooling for entities: instead of `new` + GC on every spawn, recycled
 * entity instances are reused. `ig.EntityPool.mixin` (via `staticInstantiate`
 * and `erase`) is injected into an entity class to opt it into pooling. All
 * pools are drained whenever a level is loaded.
 */
ig.module("impact.base.entity-pool").requires("impact.base.game").defines(function () {

    ig.EntityPool = {
        pools: {}, // classId -> array of recycled entities

        // Injected into an entity class to make it pool-backed.
        mixin: {
            staticInstantiate: function (x, y, z, settings) {
                return ig.EntityPool.getFromPool(this.constructor.classId, x, y, z, settings);
            },
            erase: function () {
                ig.EntityPool.putInPool(this);
            },
        },

        enableFor: function (entityClass) {
            entityClass.inject(this.mixin);
        },

        /**
         * Pop a recycled entity for the given class id, or null if the pool is empty.
         */
        getFromPool: function (classId, x, y, z, settings) {
            var pool = this.pools[classId];
            if (!pool || !pool.length) return null;
            var entity = pool.pop();
            entity.reset(x, y, z, settings);
            return entity;
        },

        putInPool: function (entity) {
            if (this.pools[entity.classId]) this.pools[entity.classId].push(entity);
            else this.pools[entity.classId] = [entity];
        },

        drainPool: function (classId) {
            delete this.pools[classId];
        },

        drainAllPools: function () {
            this.pools = {};
        },
    };

    ig.Game.inject({
        loadLevel: function (levelData, clearEntities, reloadCache) {
            ig.EntityPool.drainAllPools();
            this.parent(levelData, clearEntities, reloadCache);
        },
    });
});

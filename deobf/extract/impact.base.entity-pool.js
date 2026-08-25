ig.module("impact.base.entity-pool").requires("impact.base.game").defines(function() {
    ig.EntityPool = {
        pools: {},
        mixin: {
            staticInstantiate: function(b, a, d, c) {
                return ig.EntityPool.getFromPool(this.constructor.classId, b, a, d, c)
            },
            erase: function() {
                ig.EntityPool.putInPool(this)
            }
        },
        enableFor: function(b) {
            b.inject(this.mixin)
        },
        getFromPool: function(b, a, d, c, e) {
            b = this.pools[b];
            if (!b || !b.length) return null;
            b = b.pop();
            b.reset(a, d, c, e);
            return b
        },
        putInPool: function(b) {
            this.pools[b.classId] ? this.pools[b.classId].push(b) : this.pools[b.classId] = [b]
        },
        drainPool: function(b) {
            delete this.pools[b]
        },
        drainAllPools: function() {
            this.pools = {}
        }
    };
    ig.Game.inject({
        loadLevel: function(b, a, d) {
            ig.EntityPool.drainAllPools();
            this.parent(b, a, d)
        }
    })
});
ig.baked = !0;

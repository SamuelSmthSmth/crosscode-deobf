ig.module("game.feature.combat.model.proxy").defines(function() {
    sc.ProxySpawnerBase = ig.Class.extend({
        spawn: function() {}
    });
    sc.PROXY_TYPE = {};
    sc.ProxyTools = {
        prepareSrc: function(b) {
            return typeof b == "object" ? new sc.PROXY_TYPE[b.type](b) : b
        },
        getProxy: function(b, a) {
            if (typeof b == "object") return b;
            var d = a.getCombatantRoot();
            return d.proxies && d.proxies[b]
        },
        getSize: function(b) {
            Vec3.assignC(b, 0, 0, 0);
            return b
        },
        releaseSrc: function(b) {
            typeof b == "object" && b.clearCached()
        }
    };
    sc.COMBAT_HIT_PROXY_POS = {
        SELF: function(b,
            a, d, c) {
            a.getAlignedPos(c, b)
        },
        TARGET: function(b, a, d, c) {
            return d.getAlignedPos(c, b)
        },
        HIT_POS: function(b, a, d, c, e) {
            return Vec3.assign(b, e)
        }
    };
    sc.PROXY_BREAK_TYPE = {
        NEVER: 1,
        ACTION: 2,
        COMBATANT: 3,
        COLLABORATION: 4
    };
    sc.HitProxyConnect = ig.Class.extend({
        proxy: null,
        pos: null,
        align: 0,
        offset: Vec3.create(),
        init: function(b, a, d, c) {
            this.proxy = b;
            this.pos = a || sc.COMBAT_HIT_PROXY_POS.SELF;
            this.align = d || ig.ENTITY_ALIGN.BOTTOM;
            c && Vec3.assign(this.offset, c)
        },
        spawn: function(b, a, d, c, e) {
            var f = Vec3.create();
            this.pos(f, a, b, this.align,
                e);
            Vec3.add(f, this.offset);
            a = this.proxy.spawn(f.x, f.y, f.z, a, d);
            a.target = b;
            c && a.setAttribute && a.setAttribute("damage", c.damage)
        }
    })
});
ig.baked = !0;

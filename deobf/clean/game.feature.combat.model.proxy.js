/**
 * game.feature.combat.model.proxy
 * ===============================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.combat.model.proxy")`.
 *
 * Proxy helpers for combat: `sc.ProxySpawnerBase`, `sc.ProxyTools`,
 * `sc.COMBAT_HIT_PROXY_POS` (where a hit proxy attaches), `sc.PROXY_BREAK_TYPE`,
 * and `sc.HitProxyConnect` (wires a proxy to a combatant).
 */
ig.module("game.feature.combat.model.proxy")
    .defines(function () {

    sc.ProxySpawnerBase = ig.Class.extend({
        spawn: function () {}
    });

    sc.PROXY_TYPE = {};

    sc.ProxyTools = {
        prepareSrc: function (proxy) {
            return typeof proxy == "object" ? new sc.PROXY_TYPE[proxy.type](proxy) : proxy
        },

        getProxy: function (proxy, combatant) {
            if (typeof proxy == "object") return proxy;
            var root = combatant.getCombatantRoot();
            return root.proxies && root.proxies[proxy]
        },

        getSize: function (size) {
            Vec3.assignC(size, 0, 0, 0);
            return size
        },

        releaseSrc: function (proxy) {
            typeof proxy == "object" && proxy.clearCached()
        }
    };

    sc.COMBAT_HIT_PROXY_POS = {
        SELF: function (out, entity, target, align) {
            entity.getAlignedPos(align, out)
        },

        TARGET: function (out, entity, target, align) {
            return target.getAlignedPos(align, out)
        },

        HIT_POS: function (out, entity, target, align, hitPos) {
            return Vec3.assign(out, hitPos)
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

        init: function (proxy, pos, align, offset) {
            this.proxy = proxy;
            this.pos = pos || sc.COMBAT_HIT_PROXY_POS.SELF;
            this.align = align || ig.ENTITY_ALIGN.BOTTOM;
            offset && Vec3.assign(this.offset, offset)
        },

        spawn: function (target, source, direction, params, hitPos) {
            var pos = Vec3.create();
            this.pos(pos, source, target, this.align, hitPos);
            Vec3.add(pos, this.offset);
            var proxy = this.proxy.spawn(pos.x, pos.y, pos.z, source, direction);
            proxy.target = target;
            params && proxy.setAttribute && proxy.setAttribute("damage", params.damage)
        }
    })
});
ig.baked = !0;

ig.module("game.feature.combat.entities.combat-proxy").requires("game.feature.npc.entities.sc-actor", "game.feature.combat.model.proxy", "game.feature.combat.entities.combatant", "game.feature.combat.combat-poi").defines(function() {
    sc.PROXY_STICK_TYPE = {
        NONE: 0,
        OWNER: 1,
        TARGET: 2
    };
    sc.PROXY_TYPE.GENERIC = sc.ProxySpawnerBase.extend({
        data: null,
        _wm: new ig.Config({
            attributes: {
                animation: {
                    _type: "AnimSheet",
                    _info: "Animation sheet of proxy. Needs one entry with name 'default'",
                    _popup: true,
                    _optional: true
                },
                faceAnims: {
                    _type: "AnimSheet",
                    _info: "Animation sheet of proxy. Needs one entry with name 'default'",
                    _multiDir: true,
                    _popup: true,
                    _optional: true
                },
                copyOwnerAnims: {
                    _type: "Boolean",
                    _info: "If true: Copy animations from owner combatant."
                },
                size: {
                    _type: "Offset",
                    _info: "Size of proxy"
                },
                padding: {
                    _type: "Vec2",
                    _info: "Padding of proxy",
                    _optional: true
                },
                breakType: {
                    _type: "String",
                    _info: "How proxy is broken",
                    _select: sc.PROXY_BREAK_TYPE
                },
                config: {
                    _type: "ProxyConfig",
                    _info: "Configuration of proxy"
                },
                action: {
                    _type: "Action",
                    _info: "Action performed with proxy",
                    _popup: true
                },
                invisible: {
                    _type: "Boolean",
                    _info: "If true, set initial alpha to 0"
                },
                hp: {
                    _type: "Number",
                    _info: "If 0: proxy will ignore attack. -1: will take hits but is never destroyed (stops balls) >0: takes hits and can be destroyed"
                },
                terrain: {
                    _type: "String",
                    _info: "Terrain of proxy, in case you can jump onto it",
                    _select: ig.TERRAIN,
                    _optional: true
                },
                killEffect: {
                    _type: "Effect",
                    _info: "Effect shown when proxy is killed",
                    _optional: true
                },
                stickToSource: {
                    _type: "String",
                    _info: "Specify whether proxy should move with connected entity",
                    _select: sc.PROXY_STICK_TYPE
                },
                stickFaceAlign: {
                    _type: "Boolean",
                    _info: "If true: align face with sticking entity"
                },
                group: {
                    _type: "String",
                    _info: "Group identifier used to clear proxies or WAIT_UNTIL_PROXIES_DONE"
                },
                timeDisconnect: {
                    _type: "Boolean",
                    _info: "If true: don't connect proxy to time of owner.",
                    _optional: true
                },
                noFallDestroy: {
                    _type: "Boolean",
                    _info: "Do not destory proxy when falling into the ground etc.",
                    _optional: true
                },
                walkAnims: {
                    _type: "WalkAnims",
                    _optional: true
                },
                startAnim: {
                    _type: "String",
                    _info: "Animation to show at start"
                }
            }
        }),
        init: function(a) {
            this.data = ig.copy(a);
            this.data.animation && (this.data.animation = new ig.AnimationSheet(a.animation));
            if (this.data.faceAnims) {
                this.data.faceAnims.DOCTYPE || (this.data.faceAnims.DOCTYPE = "MULTI_DIR_ANIMATION");
                this.data.faceAnims = new ig.AnimationSheet(this.data.faceAnims)
            }
            this.data.config = sc.CombatProxyEntity.createActorConfig(a.config);
            this.data.action = new ig.Action("[PROXY]", a.action, false, false);
            this.data.breakType = sc.PROXY_BREAK_TYPE[a.breakType];
            this.data.stickToSource = sc.PROXY_STICK_TYPE[a.stickToSource] ||
                sc.PROXY_STICK_TYPE.NONE;
            this.data.killEffect && (this.data.killEffect = new ig.EffectHandle(a.killEffect))
        },
        clearCached: function() {
            this.data.action.clearCached();
            this.data.animation && this.data.animation.clearCached();
            this.data.faceAnims && this.data.faceAnims.clearCached();
            this.data.killEffect && this.data.killEffect.clearCached()
        },
        getSize: function(a) {
            Vec3.assign(a, this.data.size);
            return a
        },
        spawn: function(a, b, d, g, h, i) {
            h = {
                data: this.data,
                combatant: g,
                dir: h
            };
            !i && g.getCombatantRoot().isPlayer && sc.stats.addMap("player",
                "throws", 1);
            g = this.data.size;
            return ig.game.spawnEntity(sc.CombatProxyEntity, a - g.x / 2, b - g.y / 2, d, h)
        }
    });
    var b = Vec3.create(),
        a = {
            ACTION_END_DESTROYED: 1,
            HIT_DESTROYED: 2
        };
    sc.CombatProxyEntity = sc.BasicCombatant.extend({
        hp: 0,
        maxHp: 0,
        breakType: null,
        combatant: null,
        sourceEntity: null,
        externalEntity: null,
        party: 0,
        collaboration: null,
        target: null,
        params: null,
        group: null,
        tackle: {
            attackInfo: null,
            blocked: [],
            hitCount: 0
        },
        effects: {
            onKill: null,
            handle: null
        },
        stickToSource: 0,
        wasHit: false,
        isThreat: true,
        destroyType: 0,
        init: function(a,
            b, d, g) {
            this.parent(a, b, d, g);
            a = g.data;
            a.size && this.coll.setSize(a.size.x, a.size.y, a.size.z);
            a.padding && this.coll.setPadding(a.padding.x, a.padding.y);
            this.setDefaultConfig(a.config);
            this.sourceEntity = g.combatant;
            this.combatant = this.sourceEntity.getCombatantRoot();
            if (!a.timeDisconnect) this.coll.time.parent = this.sourceEntity.coll;
            this.noFallDestroy = g.noFallDestroy || false;
            this.terrain = ig.TERRAIN[a.terrain] || null;
            this.party = this.combatant && this.combatant.party;
            this.collaboration = this.combatant.collaboration;
            this.target = this.sourceEntity.getTarget(true);
            this.params = this.combatant.params;
            this.ignoreTaunts = this.combatant.ignoreTaunts;
            this.combo.damageCeiling = this.sourceEntity.combo.damageCeiling;
            Vec2.assign(this.face, g.dir);
            this.stickToSource = a.stickToSource || 0;
            this.stickFaceAlign = a.stickFaceAlign || false;
            this.group = a.group;
            this.breakType = a.breakType;
            this.breakType == sc.PROXY_BREAK_TYPE.ACTION ? this.sourceEntity.addActionAttached(this) : this.breakType == sc.PROXY_BREAK_TYPE.COMBATANT ? this.combatant.addEntityAttached(this) :
                this.breakType == sc.PROXY_BREAK_TYPE.COLLABORATION && this.combatant.collaboration.addCollabAttached(this);
            if (a.invisible) this.animState.alpha = 0;
            if (a.copyOwnerAnims) {
                this.animSheet = this.combatant.animSheet;
                if (a.startAnim) {
                    this.setCurrentAnim(a.startAnim, true, null);
                    this.animationFixed = true
                }
                this.initAnimations();
                this.storedWalkAnims = ig.copy(this.combatant.storedWalkAnims);
                this.setWalkAnims(this.combatant.walkAnimsName)
            } else {
                if (a.faceAnims || a.animation) {
                    this.animSheet = a.faceAnims || a.animation;
                    this.initAnimations()
                }
                a.walkAnims ?
                    this.storeWalkAnims("default", a.walkAnims) : this.storeWalkAnims("default", {
                        idle: "default"
                    });
                this.setWalkAnims("default");
                if (a.startAnim) {
                    this.setCurrentAnim(a.startAnim, true, null);
                    this.animationFixed = true
                }
            }
            this.setAction(a.action);
            this.maxHp = this.hp = a.hp;
            this.effects.onKill = a.killEffect
        },
        getCombatantRoot: function() {
            return this.combatant
        },
        getSourceEntity: function() {
            return this.sourceEntity
        },
        connectExternal: function(a) {
            if (this.externalEntity) {
                this.externalEntity.removeEntityAttached(this);
                this.externalEntity =
                    null
            }
            if (a)
                if (a.isDefeated && a.isDefeated()) this.destroy();
                else {
                    this.externalEntity = a;
                    this.externalEntity.addEntityAttached(this)
                }
        },
        update: function() {
            this.breakType == sc.PROXY_BREAK_TYPE.COMBATANT && this.combatant.isDefeated() && this.destroy();
            this.coll.pos.z < ig.game.minLevelZ && (!this.stickToSource && !this.noFallDestroy) && this.destroy();
            if (this.stickToSource) {
                var a = this.stickToSource == sc.PROXY_STICK_TYPE.TARGET ? this.getTarget() : this.sourceEntity;
                if (a) {
                    var d = ig.CollTools.getCenterXYAlignedPos(b, this.coll,
                        a.coll);
                    this.setPos(d.x, d.y, a.coll.pos.z);
                    this.stickFaceAlign && a.face && Vec2.assign(this.face, a.face)
                }
            }
            this.parent()
        },
        onActionEndDetach: function() {
            this.destroy()
        },
        onEntityKillDetach: function() {
            this.destroy()
        },
        onCollabEndDetach: function() {
            this.destroy()
        },
        postActionUpdate: function() {
            this.currentAction || this.destroy()
        },
        detach: function() {
            if (this.externalEntity) {
                this.externalEntity.removeEntityAttached(this);
                this.externalEntity = null
            }
            this.breakType == sc.PROXY_BREAK_TYPE.ACTION ? this.sourceEntity.removeActionAttached(this) :
                this.breakType == sc.PROXY_BREAK_TYPE.COMBATANT ? this.combatant.removeEntityAttached(this) : this.breakType == sc.PROXY_BREAK_TYPE.COLLABORATION && this.combatant.collaboration && this.combatant.collaboration.removeCollabAttached(this)
        },
        onEffectEvent: function(a) {
            a.isDone() && this.kill()
        },
        destroy: function(b) {
            if (!this.destroyType) {
                this.destroyType = b || a.ACTION_END_DESTROYED;
                this.detach();
                if (this.effects.onKill) {
                    this.cancelAction();
                    Vec2.assignC(this.coll.accelDir, 0, 0);
                    if (!this.effects.handle) {
                        this.effects.handle =
                            this.effects.onKill.spawnOnTarget(this, {
                                align: "CENTER",
                                callback: this
                            });
                        this.coll.setType(ig.COLLTYPE.NONE)
                    }
                } else this.kill()
            }
        },
        ballHit: function(a) {
            if (this.hp) {
                if (a.party == this.combatant.party) return false;
                var b = a.getHitCenter(this);
                this.wasHit = true;
                if (this.hp < 0) {
                    sc.combat.showHitEffect(this, b, sc.ATTACK_TYPE.NONE, a.getElement(), false, false);
                    return true
                }
                var d = a.attackInfo.damageFactor;
                sc.combat.showHitEffect(this, b, a.attackInfo.type, a.getElement(), false, false);
                this.reduceHp(d);
                return true
            }
            return false
        },
        setMaxHp: function(a) {
            this.hp = this.maxHp > 0 && a > 0 ? this.hp * (a / this.maxHp) : a;
            this.maxHp = a
        },
        reduceHp: function(b) {
            this.hp = this.hp - b;
            this.hp <= 0 && this.destroy(a.HIT_DESTROYED)
        },
        onVarAccess: function(b, d) {
            return d[1] == "collab" ? !this.collaboration ? null : this.collaboration.onVarAccess(b, d) : d[1] == "ownerAttrib" ? ig.vars.resolveObjectAccess(this.combatant.attributes, d, 2) : d[1] == "srcAttrib" ? ig.vars.resolveObjectAccess(this.sourceEntity.attributes, d, 2) : d[1] == "owner" ? ig.vars.forwardEntityVarAccess(this.combatant, d, 2) :
                d[1] == "src" ? ig.vars.forwardEntityVarAccess(this.sourceEntity, d, 2) : d[1] == "destroyed" ? this.destroyType != 0 : d[1] == "hitDestroyed" ? this.destroyType == a.HIT_DESTROYED : d[1] == "wasHit" ? this.wasHit : this.parent(b, d)
        }
    });
    var d = new ig.ActorConfig({
        walkAnims: "default",
        collType: "IGNORE",
        maxVel: 180,
        weight: -1,
        flyHeight: 0,
        soundType: "none",
        friction: 1,
        accelSpeed: 1,
        bounciness: 0
    });
    sc.CombatProxyEntity.createActorConfig = function(a) {
        var b = new ig.ActorConfig;
        b.loadFromData(a, d);
        return b
    };
    sc.CombatProxyTools = {
        clearEntityProxy: function(a,
            b, d, g, h) {
            g = this.clearAttachedProxy(a.entityAttached, b, d, g, h);
            this.clearAttachedProxy(a.actionAttached, b, d, g, h)
        },
        hasProxy: function(a, b) {
            return this.hasAttachedProxy(a.entityAttached, b) || this.hasAttachedProxy(a.actionAttached, b)
        },
        clearAttachedProxy: function(a, b, d, g, h) {
            for (var i = a.length; i--;) {
                var j = a[i];
                if (j instanceof sc.CombatProxyEntity && j != h && (!d || j.stickToSource)) b && j.group != b || (g ? g-- : j.destroy())
            }
            return g || 0
        },
        hasAttachedProxy: function(a, b) {
            for (var d = a.length; d--;) {
                var g = a[d];
                if (g instanceof sc.CombatProxyEntity &&
                    g.group == b) return true
            }
        }
    };
    sc.COMBAT_POI.PROXY = {
        _wm: {
            attributes: {
                group: {
                    _type: "String",
                    _info: "Group name of proxy"
                }
            }
        },
        filterEntities: function(a, b, d) {
            for (var d = d.group, g = b.length; g--;) {
                var h = b[g];
                h instanceof sc.CombatProxyEntity && !(d && h.group !== d) && a.push(h)
            }
            return a
        }
    }
});
ig.baked = !0;

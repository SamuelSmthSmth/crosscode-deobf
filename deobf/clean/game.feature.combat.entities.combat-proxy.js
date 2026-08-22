/**
 * game.feature.combat.entities.combat-proxy
 * =========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.combat.entities.combat-proxy")`.
 *
 * The generic combat "proxy" (a spawned combatant that stands in for an attack
 * or effect): `sc.PROXY_TYPE.GENERIC` spawner and `sc.CombatProxyEntity`.
 * Also `sc.CombatProxyTools` (clear/query proxies) and `sc.COMBAT_POI.PROXY`.
 */
ig.module("game.feature.combat.entities.combat-proxy")
    .requires("game.feature.npc.entities.sc-actor", "game.feature.combat.model.proxy", "game.feature.combat.entities.combatant", "game.feature.combat.combat-poi")
    .defines(function () {

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

        init: function (settings) {
            this.data = ig.copy(settings);
            this.data.animation && (this.data.animation = new ig.AnimationSheet(settings.animation));
            if (this.data.faceAnims) {
                this.data.faceAnims.DOCTYPE || (this.data.faceAnims.DOCTYPE = "MULTI_DIR_ANIMATION");
                this.data.faceAnims = new ig.AnimationSheet(this.data.faceAnims)
            }
            this.data.config = sc.CombatProxyEntity.createActorConfig(settings.config);
            this.data.action = new ig.Action("[PROXY]", settings.action, false, false);
            this.data.breakType = sc.PROXY_BREAK_TYPE[settings.breakType];
            this.data.stickToSource = sc.PROXY_STICK_TYPE[settings.stickToSource] || sc.PROXY_STICK_TYPE.NONE;
            this.data.killEffect && (this.data.killEffect = new ig.EffectHandle(settings.killEffect))
        },

        clearCached: function () {
            this.data.action.clearCached();
            this.data.animation && this.data.animation.clearCached();
            this.data.faceAnims && this.data.faceAnims.clearCached();
            this.data.killEffect && this.data.killEffect.clearCached()
        },

        getSize: function (size) {
            Vec3.assign(size, this.data.size);
            return size
        },

        spawn: function (x, y, z, source, dir, noStats) {
            var settings = {
                data: this.data,
                combatant: source,
                dir: dir
            };
            !noStats && source.getCombatantRoot().isPlayer && sc.stats.addMap("player", "throws", 1);
            var size = this.data.size;
            return ig.game.spawnEntity(sc.CombatProxyEntity, x - size.x / 2, y - size.y / 2, z, settings)
        }
    });

    var stickPosScratch = Vec3.create(),
        destroyTypeEnum = {
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

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            var data = settings.data;
            data.size && this.coll.setSize(data.size.x, data.size.y, data.size.z);
            data.padding && this.coll.setPadding(data.padding.x, data.padding.y);
            this.setDefaultConfig(data.config);
            this.sourceEntity = settings.combatant;
            this.combatant = this.sourceEntity.getCombatantRoot();
            if (!data.timeDisconnect) this.coll.time.parent = this.sourceEntity.coll;
            this.noFallDestroy = settings.noFallDestroy || false;
            this.terrain = ig.TERRAIN[data.terrain] || null;
            this.party = this.combatant && this.combatant.party;
            this.collaboration = this.combatant.collaboration;
            this.target = this.sourceEntity.getTarget(true);
            this.params = this.combatant.params;
            this.ignoreTaunts = this.combatant.ignoreTaunts;
            this.combo.damageCeiling = this.sourceEntity.combo.damageCeiling;
            Vec2.assign(this.face, settings.dir);
            this.stickToSource = data.stickToSource || 0;
            this.stickFaceAlign = data.stickFaceAlign || false;
            this.group = data.group;
            this.breakType = data.breakType;
            this.breakType == sc.PROXY_BREAK_TYPE.ACTION ? this.sourceEntity.addActionAttached(this) : this.breakType == sc.PROXY_BREAK_TYPE.COMBATANT ? this.combatant.addEntityAttached(this) : this.breakType == sc.PROXY_BREAK_TYPE.COLLABORATION && this.combatant.collaboration.addCollabAttached(this);
            if (data.invisible) this.animState.alpha = 0;
            if (data.copyOwnerAnims) {
                this.animSheet = this.combatant.animSheet;
                if (data.startAnim) {
                    this.setCurrentAnim(data.startAnim, true, null);
                    this.animationFixed = true
                }
                this.initAnimations();
                this.storedWalkAnims = ig.copy(this.combatant.storedWalkAnims);
                this.setWalkAnims(this.combatant.walkAnimsName)
            } else {
                if (data.faceAnims || data.animation) {
                    this.animSheet = data.faceAnims || data.animation;
                    this.initAnimations()
                }
                data.walkAnims ? this.storeWalkAnims("default", data.walkAnims) : this.storeWalkAnims("default", {
                    idle: "default"
                });
                this.setWalkAnims("default");
                if (data.startAnim) {
                    this.setCurrentAnim(data.startAnim, true, null);
                    this.animationFixed = true
                }
            }
            this.setAction(data.action);
            this.maxHp = this.hp = data.hp;
            this.effects.onKill = data.killEffect
        },

        getCombatantRoot: function () {
            return this.combatant
        },

        getSourceEntity: function () {
            return this.sourceEntity
        },

        connectExternal: function (entity) {
            if (this.externalEntity) {
                this.externalEntity.removeEntityAttached(this);
                this.externalEntity = null
            }
            if (entity) {
                if (entity.isDefeated && entity.isDefeated()) this.destroy();
                else {
                    this.externalEntity = entity;
                    this.externalEntity.addEntityAttached(this)
                }
            }
        },

        update: function () {
            this.breakType == sc.PROXY_BREAK_TYPE.COMBATANT && this.combatant.isDefeated() && this.destroy();
            this.coll.pos.z < ig.game.minLevelZ && (!this.stickToSource && !this.noFallDestroy) && this.destroy();
            if (this.stickToSource) {
                var stickTarget = this.stickToSource == sc.PROXY_STICK_TYPE.TARGET ? this.getTarget() : this.sourceEntity;
                if (stickTarget) {
                    var pos = ig.CollTools.getCenterXYAlignedPos(stickPosScratch, this.coll, stickTarget.coll);
                    this.setPos(pos.x, pos.y, stickTarget.coll.pos.z);
                    this.stickFaceAlign && stickTarget.face && Vec2.assign(this.face, stickTarget.face)
                }
            }
            this.parent()
        },

        onActionEndDetach: function () {
            this.destroy()
        },

        onEntityKillDetach: function () {
            this.destroy()
        },

        onCollabEndDetach: function () {
            this.destroy()
        },

        postActionUpdate: function () {
            this.currentAction || this.destroy()
        },

        detach: function () {
            if (this.externalEntity) {
                this.externalEntity.removeEntityAttached(this);
                this.externalEntity = null
            }
            this.breakType == sc.PROXY_BREAK_TYPE.ACTION ? this.sourceEntity.removeActionAttached(this) : this.breakType == sc.PROXY_BREAK_TYPE.COMBATANT ? this.combatant.removeEntityAttached(this) : this.breakType == sc.PROXY_BREAK_TYPE.COLLABORATION && this.combatant.collaboration && this.combatant.collaboration.removeCollabAttached(this)
        },

        onEffectEvent: function (effect) {
            effect.isDone() && this.kill()
        },

        destroy: function (destroyType) {
            if (!this.destroyType) {
                this.destroyType = destroyType || destroyTypeEnum.ACTION_END_DESTROYED;
                this.detach();
                if (this.effects.onKill) {
                    this.cancelAction();
                    Vec2.assignC(this.coll.accelDir, 0, 0);
                    if (!this.effects.handle) {
                        this.effects.handle = this.effects.onKill.spawnOnTarget(this, {
                            align: "CENTER",
                            callback: this
                        });
                        this.coll.setType(ig.COLLTYPE.NONE)
                    }
                } else this.kill()
            }
        },

        ballHit: function (ball) {
            if (this.hp) {
                if (ball.party == this.combatant.party) return false;
                var hitCenter = ball.getHitCenter(this);
                this.wasHit = true;
                if (this.hp < 0) {
                    sc.combat.showHitEffect(this, hitCenter, sc.ATTACK_TYPE.NONE, ball.getElement(), false, false);
                    return true
                }
                var damage = ball.attackInfo.damageFactor;
                sc.combat.showHitEffect(this, hitCenter, ball.attackInfo.type, ball.getElement(), false, false);
                this.reduceHp(damage);
                return true
            }
            return false
        },

        setMaxHp: function (maxHp) {
            this.hp = this.maxHp > 0 && maxHp > 0 ? this.hp * (maxHp / this.maxHp) : maxHp;
            this.maxHp = maxHp
        },

        reduceHp: function (damage) {
            this.hp = this.hp - damage;
            this.hp <= 0 && this.destroy(destroyTypeEnum.HIT_DESTROYED)
        },

        onVarAccess: function (context, path) {
            return path[1] == "collab" ? !this.collaboration ? null : this.collaboration.onVarAccess(context, path) : path[1] == "ownerAttrib" ? ig.vars.resolveObjectAccess(this.combatant.attributes, path, 2) : path[1] == "srcAttrib" ? ig.vars.resolveObjectAccess(this.sourceEntity.attributes, path, 2) : path[1] == "owner" ? ig.vars.forwardEntityVarAccess(this.combatant, path, 2) : path[1] == "src" ? ig.vars.forwardEntityVarAccess(this.sourceEntity, path, 2) : path[1] == "destroyed" ? this.destroyType != 0 : path[1] == "hitDestroyed" ? this.destroyType == destroyTypeEnum.HIT_DESTROYED : path[1] == "wasHit" ? this.wasHit : this.parent(context, path)
        }
    });

    var defaultConfig = new ig.ActorConfig({
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

    sc.CombatProxyEntity.createActorConfig = function (data) {
        var config = new ig.ActorConfig;
        config.loadFromData(data, defaultConfig);
        return config
    };

    sc.CombatProxyTools = {
        clearEntityProxy: function (entity, group, onlyStickToSource, clearCount, exclude) {
            clearCount = this.clearAttachedProxy(entity.entityAttached, group, onlyStickToSource, clearCount, exclude);
            this.clearAttachedProxy(entity.actionAttached, group, onlyStickToSource, clearCount, exclude)
        },

        hasProxy: function (entity, group) {
            return this.hasAttachedProxy(entity.entityAttached, group) || this.hasAttachedProxy(entity.actionAttached, group)
        },

        clearAttachedProxy: function (attached, group, onlyStickToSource, clearCount, exclude) {
            for (var index = attached.length; index--;) {
                var proxy = attached[index];
                if (proxy instanceof sc.CombatProxyEntity && proxy != exclude && (!onlyStickToSource || proxy.stickToSource))
                    group && proxy.group != group || (clearCount ? clearCount-- : proxy.destroy())
            }
            return clearCount || 0
        },

        hasAttachedProxy: function (attached, group) {
            for (var index = attached.length; index--;) {
                var proxy = attached[index];
                if (proxy instanceof sc.CombatProxyEntity && proxy.group == group) return true
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

        filterEntities: function (result, candidates, settings) {
            var group = settings.group;
            for (var index = candidates.length; index--;) {
                var entity = candidates[index];
                entity instanceof sc.CombatProxyEntity && !(group && entity.group !== group) && result.push(entity)
            }
            return result
        }
    }
});
ig.baked = !0;

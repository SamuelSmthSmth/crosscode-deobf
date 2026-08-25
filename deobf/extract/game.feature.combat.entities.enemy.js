ig.module("game.feature.combat.entities.enemy").requires("game.feature.combat.entities.combatant", "game.feature.combat.model.enemy-type", "game.feature.combat.model.enemy-annotation", "game.feature.new-game.new-game-model").defines(function() {
    Vec2.create();
    var b = {
        damagingEntity: null,
        attackInfo: null,
        partEntity: null,
        damageResult: null,
        shielded: false,
        hpBroken: null,
        killed: false,
        weakness: false,
        dramaticEffect: null
    };
    sc.ENEMY_HP_BAR = {
        AUTO: 0,
        VISIBLE: 1,
        HIDDEN: 2
    };
    sc.ENEMY_BOOSTER_STATE = {
        NONE: 0,
        BOOSTABLE: 1,
        BOOSTED: 2
    };
    ig.ENTITY.Enemy = ig.ENTITY.Combatant.extend({
        party: sc.COMBATANT_PARTY.ENEMY,
        aggression: sc.ENEMY_AGGRESSION.THREAT,
        enemyName: null,
        enemyType: null,
        enemyGroup: null,
        defeatVarIncrease: null,
        enemyTypeInitialized: false,
        dropHealOrb: 0,
        hpAttached: {
            enemy: null,
            value: 0
        },
        spawnPoint: Vec3.create(),
        currentState: null,
        postStun: {
            choice: null,
            collab: null
        },
        nextState: null,
        nextTimerChange: null,
        stateTimers: {},
        trackers: {},
        deferredPerformedConds: [],
        targetLoseTimer: 0,
        reactions: {
            enabled: [],
            current: null,
            running: null,
            restartAction: null
        },
        dodge: {
            count: 0,
            timer: 0,
            blocked: 0,
            counterReactTime: 0,
            counterCooldown: 0,
            counterCooldownMax: 0
        },
        annotate: {
            active: 0,
            passive: 0,
            weapon: 0,
            element: 0,
            extra: null
        },
        hpBreakReached: 0,
        lastPoICheck: null,
        targetFixed: false,
        collaboration: null,
        collabAttribs: null,
        elementModes: null,
        storedEnemies: [],
        ownerEnemy: null,
        cameraZFocus: 0,
        startEffect: null,
        targetOnSpawn: false,
        boosterState: 0,
        level: {
            override: null,
            setting: null
        },
        visibility: {
            analyzable: true,
            hpBar: sc.ENEMY_HP_BAR.AUTO
        },
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                enemyInfo: {
                    _type: "EnemyType",
                    _info: "Enemy information",
                    _popup: true
                },
                spawnCondition: {
                    _type: "VarCondition",
                    _info: "Condition for Enemy to spawn",
                    _popup: true
                },
                manualKill: {
                    _type: "VarName",
                    _info: "Instead of killing the enemy, set specified variable to true.",
                    _optional: true
                }
            },
            label: function() {
                return ""
            },
            drawBox: true,
            boxColor: "rgba(255,0,0, 0.5)"
        }),
        init: function(a, b, d, g) {
            this.parent(a, b, d, g);
            this.setSize(24, 24, 0);
            Vec3.assign(this.spawnPoint, this.coll.pos);
            if (g.enemyInfo) {
                this.enemyName = g.enemyInfo.type;
                this.enemyType = new sc.EnemyType(g.enemyInfo.type);
                this.enemyGroup = g.enemyInfo.group;
                this.currentState = g.enemyInfo.state || null;
                this.dropHealOrb = g.enemyInfo.dropHealOrb || 0;
                if (g.enemyInfo.startEffect) this.startEffect = new ig.EffectHandle(g.enemyInfo.startEffect);
                if (g.enemyInfo.hideEffect) this.hideAction = new ig.Action("enemyHide", [{
                    type: "SHOW_EFFECT",
                    effect: g.enemyInfo.hideEffect,
                    wait: true,
                    align: "CENTER"
                }, {
                    type: "HIDE"
                }]);
                if (g.enemyInfo.varIncrease) {
                    this.defeatVarIncrease = g.enemyInfo.varIncrease;
                    ig.vars.setDefault(this.defeatVarIncrease, 0)
                }
                this.targetOnSpawn =
                    g.enemyInfo.targetOnSpawn || false;
                this.level.setting = sc.newgame.get("scale-enemies") && !g.enemyInfo.disableNoScale && !ig.vars.get("g.newgame.intro") ? sc.model.player.getParamAvgLevel(4) : g.enemyInfo.level || null;
                if (g.enemyInfo.party) this.party = sc.COMBATANT_PARTY[g.enemyInfo.party];
                var a = g.enemyInfo.attribs,
                    h;
                for (h in a) this.setAttribute(h, a[h]);
                h = ig.ActorEntity.FACE8.SOUTH;
                g.enemyInfo.face && (h = ig.ActorEntity.FACE8[g.enemyInfo.face] || ig.ActorEntity.FACE8.NORTH);
                ig.ActorEntity.getFaceVec(h, this.face);
                if (window.wm) {
                    this._wm =
                        this._wm.copy();
                    this._wm.drawBox = false;
                    this.enemyType.initEntity(this);
                    this.initAnimations()
                }
            }
            this.manualKill = g.manualKill || null;
            this.ownerEnemy = g.ownerEnemy || null;
            this.boosterState = g.boostable ? sc.ENEMY_BOOSTER_STATE.BOOSTABLE : sc.ENEMY_BOOSTER_STATE.NONE;
            g.startAction && this.setAction(g.startAction)
        },
        setElementMode: function(a, b) {
            if (this.elementModes && this.elementModes.current != a) {
                this.params.setBaseParams(this.elementModes.modes[a], b);
                if (b) ig.EffectTools.clearEffects(this, "modeAura");
                else {
                    sc.combat.showModeChange(this,
                        a);
                    sc.combat.showModeAura(this, a)
                }
                this.elementModes.current = a
            }
        },
        getQuickMenuSettings: function() {
            return {
                type: "Enemy",
                disabled: !this.params || !this.visibility.analyzable || !sc.combat.isEnemyAnalyzable(this.enemyName)
            }
        },
        connectHpToEnemies: function(a) {
            for (var b = this.params.getHpFactor() / a.length, d = a.length; d--;) {
                var g = a[d];
                g.hpAttached.enemy = this;
                g.hpAttached.value = b
            }
        },
        setLevelOverride: function(a) {
            this.level.override = a;
            this.enemyTypeInitialized && this.enemyType.updateParams(this)
        },
        getLevel: function() {
            return this.level.override ||
                this.enemyType.level
        },
        storeEnemy: function(a) {
            this.storedEnemies.push(a)
        },
        onStoredRelease: function() {
            this.show(true);
            for (var a = 0; a < this.reactions.enabled.length; ++a) {
                var b = this.reactions.enabled[a],
                    d = this.enemyType.reactions[b];
                if (d.type == "STORE_RELEASE") {
                    this.reactions.current = b;
                    d.onStoredRelease(this);
                    return true
                }
            }
        },
        onEnemyEvent: function(a, b, d) {
            for (var g = 0; g < this.reactions.enabled.length; ++g) {
                var h = this.reactions.enabled[g],
                    i = this.enemyType.reactions[h];
                if (i.type == "ENEMY_EVENT" && i.checkEnemyEvent(this,
                        a, b, d)) {
                    this.reactions.current = h;
                    i.onEnemyEvent(this, this.enemyType.actions);
                    return true
                }
            }
        },
        onMagnetStart: function() {
            if (this.isDefeated()) return false;
            if (this.onEnemyEvent(this.target, sc.COMBAT_ENEMY_EVENT.MAGNET_PULL, null)) {
                this.invincibleTimer = -1;
                this.coll.setType(ig.COLLTYPE.IGNORE);
                this.damageTimer = 1E3;
                return true
            }
        },
        onMagnetEnd: function() {
            this.damageTimer = this.invincibleTimer = 0;
            this.cancelAction()
        },
        isBoss: function() {
            return this.enemyType.boss
        },
        getHeadIdx: function() {
            return this.enemyType.headIdx
        },
        show: function(b) {
            this.parent(b);
            var d = this.currentAction;
            this.level.setting && this.setLevelOverride(1 * ig.Event.getExpressionValue(this.level.setting));
            this.enemyType.initEntity(this);
            this.initAnimations();
            if (!b) {
                this.animState.alpha = 0;
                b = this.enemyType.getAppearAction(this);
                if (d || !b) this.startEffect ? this.startEffect.spawnOnTarget(this) : ig.game.effects.teleport.spawnOnTarget("showDefault", this);
                this.setAction(d || b || a)
            }
            this.targetOnSpawn && this.enemyType.reselectTarget(this, false, true, true)
        },
        onHideRequest: function() {
            this.statusGui &&
                this.statusGui.remove();
            this.statusGui = null;
            if (!this.dying) {
                ig.EffectTools.clearEffects(this);
                this.setAction(this.hideAction || d)
            }
        },
        hide: function() {
            ig.EffectTools.clearEffects(this);
            this.parent()
        },
        onKill: function(a) {
            this.parent(a);
            a || this._delegateDamage();
            this.startEffect && this.startEffect.clearCached();
            this.hideAction && this.hideAction.clearCached();
            this.enemyType.onEntityKill(this);
            this.enemyType.decreaseRef()
        },
        regenPvp: function(a) {
            this.parent(a);
            this.setElementMode(sc.ELEMENT.NEUTRAL);
            this.postStun.choice =
                null;
            this.reactions.current = null;
            this.reactions.restartAction = null
        },
        update: function() {
            if (this.dodge.counterCooldownMax) {
                this.dodge.counterCooldown = this.dodge.counterCooldown + ig.system.tick;
                if (this.dodge.counterCooldown >= this.dodge.counterCooldownMax) this.dodge.counterCooldownMax = this.dodge.counterCooldown = 0
            }
            if (this.dodge.timer > 0) {
                this.dodge.timer = this.dodge.timer - ig.system.tick;
                if (this.dodge.timer <= 0) {
                    this.dodge.timer = 0;
                    this.dodge.count = 0;
                    this.dodge.blocked = false
                }
            }
            this.ownerEnemy && (this.ownerEnemy.isDefeated() &&
                !this.isDefeated()) && this.instantDefeat();
            this.enemyType && !this.enemyTypeInitialized && this.enemyType.initEntity(this);
            if (this.enemyType && this.enemyType.isReadyToFight(this)) {
                this.targetFixed = false;
                for (var a in this.stateTimers) this.stateTimers[a] = this.stateTimers[a] - ig.system.tick;
                for (a in this.trackers) {
                    var b = this.trackers[a];
                    b.update && b.update()
                }
                this.enemyType.update(this)
            } else this.targetFixed || this.setTarget(null);
            this.parent()
        },
        onTargetHit: function(a, b, d, g, h) {
            if (g == sc.SHIELD_RESULT.PERFECT &&
                !h.isBall) {
                a.combo && a.combo.guardTrapTime && this.setCounterCooldown();
                for (h = 0; h < this.reactions.enabled.length; ++h) {
                    var i = this.reactions.enabled[h],
                        j = this.enemyType.reactions[i];
                    if (j.type == "GUARD_COUNTER" && j.onGuardCounterCheck(this)) {
                        this.reactions.current = i;
                        j.onGuardCountered(this, a);
                        return true
                    }
                }
            }
            this.parent(a, b, d, g)
        },
        setCounterCooldown: function() {
            for (var a in this.enemyType.reactions) {
                var b = this.enemyType.reactions[a];
                if (b.type == "COUNTER_COUNTER") {
                    this.dodge.counterCooldownMax = b.cooldown;
                    this.dodge.counterCooldown =
                        0;
                    break
                }
            }
        },
        onFallBehavior: function(a) {
            for (var b = 0; b < this.reactions.enabled.length; ++b) {
                var d = this.reactions.enabled[b],
                    g = this.enemyType.reactions[d];
                if (g.type == "FALL" && g.checkFall(a)) {
                    if (this.reactions.running == g) return true;
                    g.onFall(this);
                    this.reactions.current = d;
                    return true
                }
            }
            return false
        },
        postActionUpdate: function() {
            this.enemyType && this.enemyType.isReadyToFight(this) && this.enemyType.postActionUpdate(this)
        },
        onStunEnd: function() {
            if (this.enemyType && this.enemyType.isReadyToFight(this)) this.enemyType.onStunEnd(this)
        },
        changeState: function(a, b, d) {
            if (this.enemyType)
                if (b) {
                    this.cancelAction();
                    this.enemyType.initEntity(this);
                    this.enemyType.switchState(this, a)
                } else {
                    this.nextState = a;
                    d && this.enemyType.switchStateConfig(this, a)
                }
        },
        onPreDamageModification: function(a, d, f, g, h, i, j) {
            var k = false;
            b.damagingEntity = d;
            b.attackInfo = f;
            b.partEntity = g;
            b.damageResult = h;
            b.shielded = i;
            b.weakness = 0;
            b.dramaticEffect = null;
            f = Math.random();
            k = this._checkHitReactions(a, d, f, false);
            if (a.damageResult) h = a.damageResult;
            g = h && h.damage || 0;
            i = 0;
            b.killed =
                false;
            if (!j) {
                if (h && this.enemyType.resolveHpBreak(a, this, d.getCombatant(), h.damage)) {
                    i = this.hpBreakReached;
                    k = true
                }
                b.killed = this.params && this.params.currentHp > 0 && this.params.currentHp - g <= 0;
                b.killed && (i = 0)
            }
            b.hpBroken = i;
            k = this._checkHitReactions(a, d, f, true) || k;
            b.dramaticEffect && sc.combat.doDramaticEffect(d.getCombatantRoot(), this, b.dramaticEffect);
            b.killed && !a.survive && this._delegateDamage();
            return k
        },
        _delegateDamage: function() {
            if (this.hpAttached.enemy) {
                var a = Math.ceil(this.hpAttached.enemy.params.getStat("hp") *
                    this.hpAttached.value);
                this.hpAttached.enemy.instantDamage(a, 2, this);
                this.hpAttached.enemy = null
            }
        },
        onInstantDamage: function(a, d) {
            var f = 0;
            b.damagingEntity = ig.game.playerEntity;
            b.attackInfo = null;
            b.partEntity = null;
            b.damageResult = null;
            b.shielded = false;
            b.weakness = 0;
            b.dramaticEffect = null;
            if (this.enemyType.resolveHpBreak(null, this, ig.game.playerEntity, a, d)) f = this.hpBreakReached;
            b.killed = this.params && this.params.currentHp > 0 && this.params.currentHp - a <= 0;
            b.killed && (f = 0);
            b.hpBroken = f;
            f = {
                survive: false
            };
            (b.killed ||
                b.hpBroken) && this._checkHitReactions(f, ig.game.playerEntity, Math.random(), true);
            b.dramaticEffect && sc.combat.doDramaticEffect(ig.game.playerEntity, d || this, b.dramaticEffect);
            b.killed && !f.survive && this._delegateDamage();
            return f.survive
        },
        _checkHitReactions: function(a, d, f, g) {
            for (var h = false, i = 0; i < this.reactions.enabled.length; ++i) {
                b.weakness = 0;
                var j = this.reactions.enabled[i],
                    k = this.enemyType.reactions[j];
                if (k.type == "HIT_REACTION") {
                    var l = !k.needInterrupt();
                    if (g || l || !(k.hitType != sc.HIT_REACTION_TYPE.FORCE_HIT &&
                            this.reactions.current))
                        if (k.checkHit(this, f, b, a, g)) {
                            if (!l) this.reactions.current = j;
                            k.hitApply(this, d, b, a, this.enemyType.actions);
                            if (b.weakness >= 1 && k.dramaticEffect) {
                                this.statusGui.clearStatusEntry("BREAK");
                                a.weakness = 0
                            }
                            h = true;
                            if (!l) return true
                        } else {
                            if (b.weakness && k.dramaticEffect) {
                                k.partFocus ? this.statusGui.setReplaceTarget(ig.CollTools.getNamedSubCollEntity(this.coll, k.partFocus)) : this.statusGui.setReplaceTarget(null);
                                a.weakness = b.weakness
                            }
                            if (k.ignoreFailed && !b.weakness) a.ignoreHit = true
                        }
                }
            }
            return h
        },
        collabReady: function(a) {
            for (var b = 0; b < this.reactions.enabled.length; ++b) {
                var d = this.enemyType.reactions[this.reactions.enabled[b]];
                if (d.type == "COLLAB" && d.isReady(this, a)) return true
            }
        },
        doCollabReaction: function(a) {
            if (!this.collaboration) throw Error("Tried to do collab reaction without collaboration set. Should never happen!");
            for (var b = 0; b < this.reactions.enabled.length; ++b) {
                var d = this.reactions.enabled[b],
                    g = this.enemyType.reactions[d];
                if (g.type == "COLLAB" && g.collabKey == a) {
                    this.reactions.current = d;
                    this.enemyType.applyCurrentReaction(this);
                    break
                }
            }
        },
        getEnemyAction: function(a) {
            var b = this.enemyType.actions[a];
            if (!b) throw Error("Enemy does not has action of Name: " + a);
            return b
        },
        doEnemyAction: function(a, b, d) {
            var g = this.enemyType.actions[a];
            if (!g) throw Error("Enemy does not has action of Name: " + a);
            if (d) {
                if (!b) {
                    this.clearActionAttached();
                    this.defaultConfig.apply(this)
                }
                this.pushInlineAction(g)
            } else this.setAction(g, false, b)
        },
        onDamage: function(a, b, d) {
            (d = this.parent(a, b, d)) && !b.limiter.noAggro && !b.hasNoEffect() && this.enemyType && this.enemyType.damageUpdate(this,
                a);
            return d
        },
        onNavigationFailed: function(a) {
            sc.model.isForceCombat() || this.enemyType && this.enemyType.onNavigationFailed(this, a)
        },
        onDefeat: function(a) {
            this.defeatVarIncrease && ig.vars.add(this.defeatVarIncrease, 1);
            a || this.enemyType.resolveDefeat(this)
        },
        enableReactions: function(a) {
            if (a)
                for (var b = a.length; b--;) {
                    var d = a[b];
                    if (this.reactions.enabled.indexOf(d) == -1) this.enemyType.reactions[d].onActivate(this)
                }
            this.reactions.enabled.length = 0;
            a && this.reactions.enabled.push.apply(this.reactions.enabled, a)
        },
        enableReaction: function(a) {
            if (this.reactions.enabled.indexOf(a) == -1) {
                this.reactions.enabled.push(a);
                this.enemyType.reactions[a].onActivate(this)
            }
        },
        disableReaction: function(a) {
            a = this.reactions.enabled.indexOf(a);
            a != -1 && this.reactions.enabled.splice(a, 1)
        },
        onVarAccess: function(a, b) {
            return b[1] == "dodgeBlocked" ? this.dodge.blocked : b[1] == "hpBreak" ? this.hpBreakReached : b[1] == "level" ? this.getLevel() : b[1] == "storedEnemyCnt" ? this.storedEnemies.length : b[1] == "ownerAttrib" ? !this.ownerEnemy ? null : ig.vars.resolveObjectAccess(this.ownerEnemy.attributes,
                b, 2) : b[1] == "owner" ? !this.ownerEnemy ? null : ig.vars.forwardEntityVarAccess(this.ownerEnemy, b, 2) : b[1] == "collab" ? !this.collaboration ? null : this.collaboration.onVarAccess(a, b) : this.parent(a, b)
        }
    });
    ig.ACTOR_CONFIGS.ENEMY = {
        classType: ig.ENTITY.Enemy,
        KEYS: {
            enabledReactions: [],
            aggression: sc.ENEMY_AGGRESSION.THREAT,
            regenFactor: 0,
            stunEscapeTime: 0,
            annotate: {},
            size: Vec3.createC(16, 16, 16),
            analyzable: true,
            hpBar: sc.ENEMY_HP_BAR.AUTO
        },
        fromDataFix: function() {
            typeof this.aggression == "string" && (this.aggression = sc.ENEMY_AGGRESSION[this.aggression]);
            typeof this.hpBar == "string" && (this.hpBar = sc.ENEMY_HP_BAR[this.hpBar]);
            if (this.annotate) {
                var a = this.annotate;
                if (a.extra && a.extra instanceof Array) {
                    for (var b = a.extra, d = 0, g = 0; g < b.length; ++g) d = d | sc.ENEMY_ANNO_EXTRA[b[g]];
                    a.extra = d
                }
                typeof a.active == "string" && (a.active = sc.ENEMY_ANNO_ACTIVE[a.active]);
                typeof a.passive == "string" && (a.passive = sc.ENEMY_ANNO_PASSIVE[a.passive]);
                typeof a.weapon == "string" && (a.weapon = sc.ENEMY_ANNO_WEAPON[a.weapon]);
                typeof a.element == "string" && (a.element = sc.ENEMY_ANNO_ELEMENT[a.element])
            } else this.annotate = {}
        },
        apply: function(a) {
            a.enableReactions(this.enabledReactions);
            if (a.aggression != this.aggression) {
                a.aggression = this.aggression;
                if (a.target) {
                    var b = a.target;
                    a.setTarget(null);
                    a.setTarget(b)
                }
            }
            a.visibility.analyzable = this.analyzable == void 0 ? true : this.analyzable;
            a.visibility.hpBar = this.hpBar;
            a.regenFactor = this.regenFactor;
            a.stunData.stunEscapeTime = this.stunEscapeTime || 0;
            a.annotate.active = this.annotate.active || 0;
            a.annotate.passive = this.annotate.passive || 0;
            a.annotate.weapon = this.annotate.weapon || 0;
            a.annotate.extra =
                this.annotate.extra || 0;
            a.annotate.element = this.annotate.element || 0;
            this.size && !window.wm && a.coll.setSize(this.size.x, this.size.y, this.size.z, true)
        },
        load: function(a) {
            this.enabledReactions = ig.copy(a.reactions.enabled);
            this.stunEscapeTime = a.stunData.stunEscapeTime;
            this.aggression = a.aggression;
            this.regenFactor = a.regenFactor;
            this.annotate = {
                active: a.annotate.active,
                passive: a.annotate.passive,
                weapon: a.annotate.weapon,
                extra: a.annotate.extra,
                element: a.annotate.element
            };
            this.analyzable = a.visibility.analyzable;
            this.hpBar = a.visibility.hpBar
        }
    };
    var a = new ig.Action("enemyStart", [{
            type: "WAIT",
            time: 0.4
        }]),
        d = new ig.Action("enemyHide", [{
            type: "SHOW_EFFECT",
            effect: {
                sheet: "teleport",
                name: "hideDefault"
            },
            wait: true,
            align: "CENTER"
        }, {
            type: "HIDE"
        }])
});
ig.baked = !0;

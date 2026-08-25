ig.module("game.feature.combat.model.enemy-type").requires("impact.base.loader", "game.feature.combat.model.combat-params", "game.feature.combat.model.combat-condition", "impact.base.animation").defines(function() {
    function b(a, b) {
        return b.hp - a.hp
    }

    function a(a, b) {
        if (!b.reactions.restartAction) {
            if (b.deferredPerformedConds.length > 0) {
                for (var c = b.deferredPerformedConds.length; c--;) b.deferredPerformedConds[c].onPerformed(b);
                b.deferredPerformedConds.length = 0
            }
            if (b.nextTimerChange) {
                var c = b.nextTimerChange,
                    d =
                    false,
                    e;
                for (e in c) {
                    var d = true,
                        f = c[e];
                    b.stateTimers[e] = typeof f == "number" ? f : f[0] + Math.random() * ((f[1] || f[0]) - f[0])
                }
                if (d) {
                    b.nav.failTimer = 0;
                    b.target && a.reselectTarget(b)
                }
                b.nextTimerChange = null
            }
        }
        b.reactions.running = null
    }

    function d(a, b) {
        sc.DropEntity.spawnDrops(a, ig.ENTITY_ALIGN.CENTER, "HP", b, ig.game.playerEntity);
        for (var c = sc.party.getPartySize(); c--;) {
            var d = sc.party.getPartyMemberEntityByIndex(c);
            d && (d.model && d.model.isAlive()) && sc.DropEntity.spawnDrops(a, ig.ENTITY_ALIGN.CENTER, "HP", b, d)
        }
    }

    function c(a,
        b, d) {
        for (var e = 0; e < b.length; ++e) {
            var f = {
                    conditions: null,
                    parent: d || null
                },
                l = b[e].req;
            if (l) f.conditions = new sc.CombatConditions(l);
            if (b[e].sub) {
                f.sub = [];
                c(f.sub, b[e].sub, f)
            } else {
                f.action = b[e].action;
                f.frequency = b[e].frequency || null;
                f.collab = b[e].collab || null;
                if (f.frequency && !sc.ATTACK_FREQUENCY[f.frequency]) throw Error("Unknown attack frequency '" + f.frequency + "'");
                f.preSwitchState = b[e].preSwitchState;
                f.postSwitchState = b[e].postSwitchState;
                f.ignoreStun = b[e].ignoreStun
            }
            a.push(f)
        }
    }

    function e(a, b, c) {
        for (var d =
                0; d < a.length; ++d) {
            var f = a[d];
            if (f.sub || f.ignoreStun || !b.hasStun())
                if (!f.frequency || sc.combat.checkFrequency(b, f.frequency))
                    if (!f.conditions || f.conditions.check(b, c))
                        if (f.sub) {
                            if (f = e(f.sub, b, c)) return f
                        } else {
                            if (f.collab) {
                                var l = new sc.EnemyCollab(b, f.collab);
                                if (!l.success) continue;
                                b.postStun.collab = l
                            } else b.postStun.collab = null;
                            return f
                        }
        }
        return null
    }
    var f = 0;
    sc.ENEMY_CATEGORY = {};
    sc.ENEMY_CATEGORY.ABSTRACT = 0;
    sc.ENEMY_CATEGORY.PLAYERS = 1;
    sc.ENEMY_CATEGORY.ANIMALS = 2;
    sc.ENEMY_CATEGORY.MECHA = 3;
    sc.ENEMY_CATEGORY.BOSS =
        4;
    sc.ENEMY_AI_LEARN = {
        REGULAR: {},
        IMMEDIATELY: {
            knowItAll: true
        }
    };
    sc.EnemyType = ig.JsonLoadable.extend({
        cacheType: "Enemy",
        aiGroup: null,
        aiLearnType: sc.ENEMY_AI_LEARN.REGULAR,
        enduranceScale: null,
        name: "",
        params: null,
        credit: null,
        exp: 0,
        level: 1,
        maxSp: 4,
        boss: false,
        hpBreaks: [],
        hpBreakCond: null,
        animSheet: null,
        attribs: {},
        proxies: {},
        actions: {},
        states: {},
        reactions: {},
        trackerDef: null,
        headIdx: 0,
        healDropRate: 0,
        itemDrops: [],
        targetDetect: {
            onVisibleRange: 0,
            onDistance: false,
            onCloseBattle: false,
            detectDistance: 120,
            loseDistance: 240,
            loseTime: 3
        },
        getJsonPath: function() {
            return ig.root + this.path.toPath("data/enemies/", ".json") + ig.getCacheSuffix()
        },
        onload: function(a) {
            this.name = a.name;
            this.boss = a.boss;
            this.bossLabel = a.bossLabel || "Boss";
            this.bossOrder = a.bossOrder || 0;
            this.detectType = sc.EnemyType.DETECT_TYPE[a.detectType] || sc.EnemyType.DETECT_TYPE.DISTANCE;
            this.credit = a.credit || 0;
            this.aiGroup = a.aiGroup || null;
            this.aiLearnType = sc.ENEMY_AI_LEARN[a.aiLearnType] || sc.ENEMY_AI_LEARN.REGULAR;
            this.enduranceScale = a.enduranceScale || 1;
            this.exp = a.exp ||
                0;
            this.level = a.level || 1;
            this.boostedLevel = a.boostedLevel || 60;
            this.maxSp = a.maxSp || 4;
            this.headIdx = a.headIdx;
            if (this.headIdx == void 0) this.headIdx = 3;
            this.healDropRate = a.healDropRate || 0;
            this.itemDrops = a.itemDrops || [];
            this.ignoreTaunts = a.ignoreTaunts || false;
            this.trackerDef = a.trackers;
            if (a.params) this.params = a.params;
            if (a.elementModes) this.elementModes = a.elementModes;
            if (a.modifiers) this.modifiers = a.modifiers;
            if (a._wm && a._wm.attributes) this.attribs = a._wm.attributes;
            if (a.hpBreaks) {
                for (var c = 0; c < a.hpBreaks.length; ++c) {
                    var d =
                        a.hpBreaks[c];
                    this.hpBreaks.push({
                        hp: d.hp,
                        healDrop: d.healDrop
                    })
                }
                this.hpBreaks.sort(b)
            }
            this.hpBreakCond = new ig.VarCondition(a.hpBreakCond);
            this.animSheet = new ig.AnimationSheet(a.anims);
            this.size = a.size;
            this.cameraZFocus = a.cameraZFocus || 0;
            this.dmgZFocus = a.dmgZFocus || 0;
            this.padding = a.padding || Vec2.createC(0, 0);
            this.walkConfigs = a.walkConfigs;
            this.material = sc.COMBATANT_MATERIAL[a.material] || sc.COMBATANT_MATERIAL.METAL;
            for (var e in a.proxies) {
                c = a.proxies[e];
                this.proxies[e] = new sc.PROXY_TYPE[c.type](c)
            }
            if (a.targetDetect) {
                c =
                    a.targetDetect;
                if (c.detectDistance != void 0) this.targetDetect.detectDistance = c.detectDistance;
                if (c.detectZDelta != void 0) this.targetDetect.detectZDelta = c.detectZDelta || 0;
                if (c.loseDistance != void 0) this.targetDetect.loseDistance = c.loseDistance;
                if (c.loseTime != void 0) this.targetDetect.loseTime = c.loseTime;
                if (c.onDistance != void 0) this.targetDetect.onDistance = c.onDistance;
                if (c.onVisible != void 0) this.targetDetect.onVisible = c.onVisible;
                if (c.notifyNeighbourRadius != void 0) this.targetDetect.notifyNeighbourRadius =
                    c.notifyNeighbourRadius;
                if (c.onCloseBattle != void 0) this.targetDetect.onCloseBattle = c.onCloseBattle;
                this.targetDetect.onVisible = c.onVisible || false
            }
            this.entityConfig = new ig.ActorConfig;
            this.entityConfig.loadFromData(a);
            for (e in a.actions) {
                this.actions[e] = new ig.Action(e, a.actions[e]);
                this.actions[e].hint = "battle"
            }
            this.defaultState = a.defaultState;
            for (e in a.states) this.states[e] = new sc.EnemyState(e, a.states[e], this.entityConfig);
            for (e in a.reactions) {
                c = a.reactions[e];
                this.reactions[e] = new sc.ENEMY_REACTION[c.type](e,
                    c)
            }
        },
        onCacheCleared: function() {
            this.animSheet.decreaseRef();
            for (var a in this.actions) this.actions[a].clearCached();
            for (a in this.proxies) this.proxies[a].clearCached()
        },
        initEntity: function(a) {
            if (this.loaded && !a.enemyTypeInitialized) {
                a.enemyTypeInitialized = true;
                a.setSize(this.size.x, this.size.y, this.size.z);
                a.cameraZFocus = this.cameraZFocus;
                a.dmgZFocus = this.dmgZFocus;
                a.coll.setPadding(this.padding.x, this.padding.y);
                a.material = this.material;
                a.animSheet = this.animSheet;
                a.proxies = this.proxies;
                a.ignoreTaunts =
                    this.ignoreTaunts;
                if (this.size.z > 96) a.tooHighToFall = true;
                for (var b in this.walkConfigs) a.storeWalkAnims(b, this.walkConfigs[b]);
                for (var c in this.trackerDef) {
                    var d = this.trackerDef[c],
                        e = d.type;
                    sc.ENEMY_TRACKER[e] && (a.trackers[c] = new sc.ENEMY_TRACKER[e](a, d))
                }
                for (b in this.attribs) {
                    c = a.attributes[b];
                    if (this.attribs[b]._type == "VarCondition") a.setAttribute(b, new ig.VarCondition(c));
                    else if (this.attribs[b]._type == "Vec3") a.setAttribute(b, ig.Event.getVec3(c, Vec3.create()));
                    else if (this.attribs[b]._type ==
                        "Action" && c) {
                        c = new ig.Action(b, c);
                        c.hint = "battle";
                        a.setAttribute(b, c)
                    }
                }
                ig.vars.pushEntityAccessor(a);
                if (!this.hpBreakCond.evaluate()) a.hpBreakReached = this.hpBreaks.length;
                ig.vars.popEntityAccessor(a);
                this.switchState(a, a.currentState || this.defaultState);
                if (this.params) {
                    a.params = new sc.CombatParams(this.params);
                    if (this.elementModes) a.elementModes = {
                        current: 0,
                        modes: null
                    };
                    this.updateParams(a);
                    this.modifiers && a.params.setModifiers(this.modifiers);
                    a.params.setCombatant(a);
                    a.params.setMaxSp(this.maxSp);
                    a.statusGui && a.statusGui.initWithParams();
                    a.params.initStatusFx()
                }
                sc.enemyBooster.updateEnemyBoostState(a)
            }
        },
        updateParams: function(a) {
            var b = this.params;
            a.level.override && (b = sc.EnemyLevelScaling.adaptParams(this.params, this.level, a.level.override));
            if (this.elementModes) {
                var c = [];
                c[sc.ELEMENT.NEUTRAL] = ig.copy(b);
                for (var d in sc.ELEMENT) {
                    var e = ig.copy(b),
                        f = this.elementModes[d],
                        o;
                    for (o in f)
                        if (f[o])
                            if (f[o] instanceof Array) {
                                e[o] || (e[o] = [1, 1, 1, 1]);
                                for (var m = 0; m < f[o].length; ++m) e[o][m] = f[o][m]
                            } else e[o] =
                                Math.round(f[o] * (e[o] / this.params[o]));
                    c[sc.ELEMENT[d]] = e
                }
                a.elementModes.modes = c;
                b = c[a.elementModes.current]
            }
            a.params.setBaseParams(b, true)
        },
        onEntityKill: function(a) {
            for (var b in this.attribs) {
                var c = a.attributes[b];
                c instanceof ig.Action && c.clearCached()
            }
        },
        getAppearAction: function(a) {
            a.currentState || this.switchState(a, this.defaultState);
            return (a = this.states[a.currentState]) && a.appearAction ? this.actions[a.appearAction] : null
        },
        update: function(b) {
            if (this.loaded && !b._hidden)
                if (b.params && (b.params.isDefeated() ||
                        b.params.isLocked())) b.postStun.choice = null;
                else {
                    b.target && b.target.isDefeated() && this.reselectTarget(b, false, true);
                    b.enemyTypeInitialized || this.initEntity(b);
                    b.currentState || this.switchState(b, this.defaultState);
                    this.updateTarget(b);
                    this.checkReactions(b);
                    if (!b.reactions.current && !b.currentAction) {
                        a(this, b);
                        b.nextState && !b.hasStun() && this.switchState(b, b.nextState);
                        b.nextState || this.updateAction(b)
                    }
                }
        },
        checkReactions: function(a) {
            for (var b = 0; b < a.reactions.enabled.length; ++b) {
                var c = a.reactions.enabled[b],
                    d = this.reactions[c];
                if (a.reactions.running != d && d.check && d.check(a)) {
                    a.reactions.current = c;
                    d.preApply(a)
                }
            }
            a.reactions.current && this.applyCurrentReaction(a)
        },
        applyCurrentReaction: function(a) {
            var b = this.reactions[a.reactions.current];
            if (b.ignoreStun || !a.hasStun()) {
                a.postStun.choice = null;
                a.cancelStun();
                b.apply(a, this.actions);
                a.collaboration && a.addActionAttached(a.collaboration);
                a.reactions.running = b;
                a.reactions.current = null
            }
        },
        updateAction: function(a) {
            if (a.reactions.restartAction) {
                a.setAction(a.reactions.restartAction);
                a.reactions.restartAction = null
            } else if (a.postStun.choice) {
                a.damageTimer <= 0.2 && a.cancelStun();
                if (!a.hasStun()) {
                    a.resetStunData();
                    this.startChoice(a, a.postStun.choice)
                }
            } else {
                var b = this.states[a.currentState].selectAction(a);
                if (b)
                    if (a.hasStun()) {
                        a.postStun.choice = b;
                        a.hitStable = sc.ATTACK_TYPE.MASSIVE
                    } else this.startChoice(a, b)
            }
        },
        startChoice: function(a, b) {
            a.postStun.collab && a.postStun.collab.start();
            for (var c = b; c;) {
                if (c.conditions) c.conditions.onPerformed(a, true);
                c = c.parent
            }
            a.postStun.choice = null;
            a.postStun.collab =
                null;
            a.justEnteredState = false;
            a.defaultConfig.apply(a);
            b.frequency && sc.combat.submitFrequency(a, b.frequency);
            a.cancelStun();
            b.preSwitchState && this.switchState(a, b.preSwitchState);
            b.action ? a.setAction(this.actions[b.action]) : a.setAction(null);
            a.nextState = b.postSwitchState
        },
        updateTarget: function(a) {
            if (a.target) {
                if (!sc.model.isForceCombat()) {
                    c = a.distanceTo(a.target);
                    a.targetLoseTimer = c > this.targetDetect.loseDistance ? a.targetLoseTimer + ig.system.tick : 0;
                    a.targetLoseTimer >= this.targetDetect.loseTime && a.setTarget(null)
                }
            } else if (ig.game.playerEntity) {
                var b =
                    ig.game.playerEntity,
                    c = a.distanceTo(b),
                    d = Math.abs(a.coll.pos.z - b.coll.pos.z);
                if (c < this.targetDetect.detectDistance && (!this.targetDetect.detectZDelta || d < this.targetDetect.detectZDelta)) this.targetDetect.onDistance ? this.assignTarget(a, b, true) : this.targetDetect.onCloseBattle && b.targetedBy.length > 0 && this.assignTarget(a, b, true)
            }
        },
        reselectTarget: function(a, b, c, d) {
            var e = sc.combat.getEnemyTarget(a);
            e && this.assignTarget(a, e, b, c, d)
        },
        assignTarget: function(a, b, c, d, e) {
            a.targetLoseTimer = 0;
            if (a.target != b) {
                a.setTarget(b,
                    e);
                if (a.target) {
                    f++;
                    if (f > 100) debugger;
                    else {
                        d || a.cancelAction();
                        c && this.targetDetect.notifyNeighbourRadius && sc.combat.notifyNearbyEnemiesOfTarget(a, this.targetDetect.notifyNeighbourRadius)
                    }
                    f--
                }
            }
        },
        damageUpdate: function(a, b) {
            var c = b.getCombatantRoot();
            if (!a.target && c != a) {
                sc.combat.playerStartedCombat = true;
                this.assignTarget(a, c, true)
            } else if (c == a.target) a.targetLoseTimer = 0
        },
        onNavigationFailed: function(a, b) {
            b > 5 && a.setTarget(null)
        },
        onStunEnd: function(a) {
            a.reactions.current && this.applyCurrentReaction(a)
        },
        postActionUpdate: function(b) {
            if ((!b.params || !b.params.isDefeated() && !b.params.isLocked()) && !b._killed && !b.reactions.current && !b.currentAction) {
                a(this, b);
                b.nextState || this.checkReactions(b);
                if (!b.currentAction) {
                    b.nextState && !b.hasStun() && this.switchState(b, b.nextState);
                    b.nextState || this.updateAction(b)
                }
            }
        },
        switchState: function(b, c) {
            b.currentAction && b.cancelAction();
            var d = b.currentState;
            b.currentState = c;
            b.nextState = null;
            b.postStun.choice = null;
            b.currentAction = null;
            b.currentActionStep = null;
            b.justEnteredState =
                true;
            a(this, b);
            var e = this.states[b.currentState];
            if (e) {
                var f = e.seamlessStates && e.seamlessStates.indexOf(d) != -1;
                d === c && (f = true);
                b.setDefaultConfig(e.entityConfig);
                if (!f) {
                    for (var l in b.trackers) {
                        d = b.trackers[l];
                        d.onStateChange && d.onStateChange(b)
                    }
                    sc.combat.initFrequencyTimers(b)
                }
                b.walkAnims && b.walkAnims.preIdle && b.setCurrentAnim(b.walkAnims.preIdle, true, b.walkAnims.idle)
            }
        },
        switchStateConfig: function(a, b) {
            a.setDefaultConfig(this.states[b].entityConfig)
        },
        isReadyToFight: function(a) {
            return sc.combat.active &&
                (!a.currentAction || a.currentAction.hint == "battle")
        },
        resolveHpBreak: function(a, b, c, e, f) {
            if (!(b.hpBreakReached >= this.hpBreaks.length)) {
                c = false;
                for (e = (b.params.currentHp - e) / b.params.getStat("hp"); b.hpBreakReached < this.hpBreaks.length && e < this.hpBreaks[b.hpBreakReached].hp;) {
                    d(f || b, this.hpBreaks[b.hpBreakReached].healDrop);
                    if (a && a.attackType == void 0) a.attackType = sc.ATTACK_TYPE.MASSIVE;
                    b.hpBreakReached++;
                    b.params.healStatus();
                    c = true
                }
                return c
            }
        },
        resolveDefeat: function(a) {
            if (this.credit) {
                var b = this.credit;
                a.level.override && (b = sc.EnemyLevelScaling.adaptCredits(b, this.level, a.level.override));
                sc.model.player.addCredit(b, false, true)
            }
            if (this.exp) {
                b = sc.model.player.addExperience(this.exp, a.level.override || this.level, 0, false, sc.LEVEL_CURVES.REGULAR);
                sc.stats.addMap("player", "expEnemies", b)
            }
            this.resolveItemDrops(a);
            var b = Math.random(),
                c = sc.combat.getPartyHpFactor(sc.COMBATANT_PARTY.PLAYER);
            a.dropHealOrb ? d(a, a.dropHealOrb) : this.healDropRate && (c > 0.8 || (c < 0.1 && b < 0.7 ? d(a, this.healDropRate) : c < 0.3 && b < 0.5 ? d(a, this.healDropRate) :
                b < 0.2 && d(a, this.healDropRate)))
        },
        resolveItemDrops: function(a) {
            if (sc.model.player.getCore(sc.PLAYER_CORE.ITEMS))
                for (var b = this.itemDrops, c = b.length, d = ig.game.playerEntity, e = sc.model.player.params.getModifier("DROP_CHANCE") + 1, f = sc.model.getCombatRank(), o = sc.model.getCombatRankDropRate() * sc.newgame.getDropRateMultiplier(); c--;) {
                    var m = b[c],
                        n = Math.random();
                    if (!(m.rank && f < sc.model.getCombatRankByLabel(m.rank)) && !(m.boosted && a.boosterState != sc.ENEMY_BOOSTER_STATE.BOOSTED) && n <= m.prob * (m.prob == 1 ? 1 : e) * o) {
                        n =
                            m.min || 1;
                        m.max && (n = n + Math.floor((m.max + 1 - n) * Math.random()));
                        sc.ItemDropEntity.spawnDrops(a, ig.ENTITY_ALIGN.CENTER, d, m.item, n, sc.ITEM_DROP_TYPE.ENEMY)
                    }
                }
        }
    });
    Vec2.create();
    sc.EnemyType.DETECT_TYPE = {
        DISTANCE: 1,
        VIEW: 2,
        NONE: 3
    };
    sc.CombatConditions = ig.Class.extend({
        conditions: [],
        init: function(a) {
            for (var b = 0; b < a.length; ++b) {
                var c = this._parseCondition(a[b]);
                this.conditions.push(c)
            }
        },
        _parseCondition: function(a) {
            var b = a.type,
                c = false;
            if (b.charAt(0) == "!") {
                b = b.substr(1);
                c = true
            }
            if (!sc.COMBAT_CONDITION[b]) throw Error("Unknown Condition type '" +
                b + "'");
            a = new sc.COMBAT_CONDITION[b](a);
            a.not = c;
            return a
        },
        check: function(a, b, c, d) {
            ig.vars.pushEntityAccessor(a);
            for (var e = 0; e < this.conditions.length; ++e) {
                var f = this.conditions[e].check(a, b, c, d);
                if (!this.conditions[e].not && !f || this.conditions[e].not && f) {
                    ig.vars.popEntityAccessor(a);
                    return false
                }
            }
            ig.vars.popEntityAccessor(a);
            return true
        },
        onReactionActivate: function(a) {
            for (var b = this.conditions.length; b--;)
                if (this.conditions[b].onReactionActivate) this.conditions[b].onReactionActivate(a)
        },
        onPerformed: function(a,
            b) {
            for (var c = this.conditions.length; c--;) {
                var d = this.conditions[c];
                if (d.onPrePerformed) d.onPrePerformed(a);
                if (d.onPerformed)
                    if (b) a.deferredPerformedConds.push(d);
                    else d.onPerformed(a)
            }
        }
    });
    sc.EnemyInfo = ig.Class.extend({
        init: function(a) {
            this.settings = a;
            this.enemyType = new sc.EnemyType(a.type);
            if (this.settings.startEffect) this.startFx = new ig.EffectHandle(this.settings.startEffect);
            if (this.settings.hideEffect) this.hideFx = new ig.EffectHandle(this.settings.hideEffect)
        },
        getSettings: function() {
            return this.settings
        },
        clearCached: function() {
            this.enemyType.decreaseRef();
            this.startFx && this.startFx.clearCached();
            this.hideFx && this.hideFx.clearCached()
        }
    });
    sc.EnemyState = ig.Class.extend({
        name: "",
        entityConfig: {},
        choices: [],
        seamlessStates: null,
        appearAction: null,
        init: function(a, b, d) {
            this.name = a;
            this.seamlessStates = b.seamlessStates || null;
            this.entityConfig = new ig.ActorConfig;
            this.entityConfig.loadFromData(b, d);
            this.appearAction = b.appearAction || null;
            c(this.choices, b.choices)
        },
        selectAction: function(a) {
            var b = Math.random();
            return e(this.choices,
                a, b)
        }
    })
});
ig.baked = !0;

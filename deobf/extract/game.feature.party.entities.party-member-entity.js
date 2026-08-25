ig.module("game.feature.party.entities.party-member-entity").requires("game.feature.player.entities.player-base").defines(function() {
    function b(a) {
        if (a > 0) {
            a = a - ig.system.tick;
            a <= 0 && (a = 0)
        }
        return a
    }
    var a = {
            ATTACK: {
                actionKey: "ATTACK_SPECIAL",
                idx: 0
            },
            THROW: {
                actionKey: "THROW_SPECIAL",
                idx: 1,
                distant: true
            },
            GUARD: {
                actionKey: "GUARD_SPECIAL",
                idx: 2
            },
            DASH: {
                actionKey: "DASH_SPECIAL",
                idx: 3,
                distant: true
            }
        },
        d = ["ATTACK", "THROW", "GUARD", "DASH"],
        c = [],
        e = [0.2, 0.25, 0.3],
        f = {
            IDLE: {
                start: function(a, b, c, d) {
                    a.updateDefaultConfig(false);
                    d.faceRotateTimer = Math.random() * 0.2
                },
                update: function(a, b, c, d) {
                    Vec2.assignC(a.coll.accelDir, 0, 0);
                    if (sc.model.isCombatActive() && sc.party.getStrategy("BEHAVIOUR").doNothing || sc.party.keepDistance) {
                        c.outOfScreenTime = 0;
                        d = sc.party.keepDistance ? 200 : 320;
                        return c.distance < (sc.party.keepDistance ? 64 : 120) || c.distance > d ? f.STAY_AWAY : f.ROTATE
                    }
                    a.updateDefaultConfig(false);
                    if (c.distance > 48) return f.FOLLOW;
                    if (c.distance < 4) return f.BACKOFF;
                    if (!a.noFaceRotate) {
                        c = c.distVec;
                        if (b.isPlayer && Vec2.angle(c, b.face) < 1 * Math.PI) c =
                            b.face;
                        a = Vec2.angle(c, a.face);
                        d.faceRotateTimer = a > Math.PI * 0.05 ? d.faceRotateTimer + ig.system.tick : Math.random() * 0.2;
                        if (a > Math.PI * 0.5 || d.faceRotateTimer > 0.25) return f.ROTATE
                    }
                }
            },
            STAY_AWAY: {
                start: function(a) {
                    a.noFaceRotate = false;
                    a.updateDefaultConfig(false);
                    a.setNavTarget(12);
                    a.timer.move = 4
                },
                update: function(a, b, c) {
                    a.coll.relativeVel = 1;
                    c.outOfScreenTime = 0;
                    if (a.nav.path.moveEntity() || a.timer.move <= 0) return f.IDLE;
                    a.jumping || c.outOfScreenTime > 3 && a.resetPos()
                }
            },
            BACKOFF: {
                start: function(a) {
                    a.updateDefaultConfig(false);
                    a.noFaceRotate = false;
                    a.coll.relativeVel = 0.5;
                    a.setNavTarget(2)
                },
                update: function(a, b, c) {
                    a.faceDirFixed = true;
                    Vec2.assign(a.face, c.distVec);
                    if (c.distance >= 16) {
                        Vec2.assignC(a.coll.accelDir, 0, 0);
                        return f.IDLE
                    }
                    if (a.nav.path.moveEntity()) return f.IDLE
                }
            },
            ROTATE: {
                start: function(a) {
                    a.updateDefaultConfig(false)
                },
                update: function(a, b, c) {
                    var d = c.distVec;
                    if (b.isPlayer && Vec2.angle(d, b.face) < 1 * Math.PI) d = b.face;
                    Vec2.rotateToward(a.face, d, Math.PI * 2 * ig.system.tick * 2);
                    Vec2.assignC(a.coll.accelDir, 0, 0);
                    if (!(sc.model.isCombatActive() &&
                            sc.party.getStrategy("BEHAVIOUR").doNothing || sc.party.keepDistance) && c.distance > 48) return f.FOLLOW;
                    if (Vec2.angle(d, a.face) < Math.PI * 0.05) return f.IDLE
                }
            },
            FOLLOW: {
                start: function(a) {
                    a.noFaceRotate = false;
                    a.updateDefaultConfig(false);
                    a.setNavTarget(1)
                },
                update: function(a, b, c) {
                    if (sc.model.isCombatActive() && sc.party.getStrategy("BEHAVIOUR").doNothing || sc.party.keepDistance) return f.STAY_AWAY;
                    b = 80 + sc.party.getPartyMemberIndex(a.model.name) * 40;
                    b = c.distance > b ? 1 : Math.max(0.25, c.distance / b);
                    a.jumping && (b = 1);
                    a.coll.relativeVel =
                        b;
                    a.nav.path.startRelativeVel = b;
                    if (a.nav.path.moveEntity()) return f.IDLE;
                    a.jumping || c.outOfScreenTime > 3 && a.resetPos()
                }
            },
            COMBAT_IDLE: {
                start: function(a) {
                    a.reselectTarget();
                    a.faceToTarget.active = true
                },
                update: function(a, b, c) {
                    Vec2.assignC(a.coll.accelDir, 0, 0);
                    if (a.target && !sc.model.isCutscene()) {
                        var d = a.params.getHpFactor(),
                            e = 0.5;
                        sc.EnemyAnno.isWeak(b, a) && (e = 0.33);
                        if (d <= e && a.model.canEatSandwich()) return f.COMBAT_HEALING;
                        d = sc.party.getStrategy("TARGET").others && a.target == ig.game.playerEntity.combatStats.lastTarget;
                        if ((b = ig.navigation.isTargetReachable(a, b, a.model.combatStyle.normDistance + 40, true)) && !d && !sc.party.getStrategy("BEHAVIOUR").noAttack && !a.timer.attack) {
                            if (sc.EnemyAnno.shouldBePassive(a.target, a)) {
                                a.timer.attack = 0.2;
                                return f.COMBAT_SIDEWAYS
                            }
                            a.timer.noAttackTime = 0;
                            a.updateElement();
                            if (a.params.getSp()) {
                                c = sc.EnemyAnno.isWeak(a.target, a) ? 1 : a.params.getRelativeSp();
                                c = c * sc.party.getStrategy("ARTS").factor;
                                Math.random() < c && a.selectCombatArt()
                            }
                            c = a.model.combatStyle.throwProb;
                            a.currentCombatArt ? c = a.currentCombatArt.distant ?
                                1 : 0 : sc.EnemyAnno.useMelee(a.target) ? c = 0 : sc.EnemyAnno.useRanged(a.target) && (c = 1);
                            return Math.random() < c ? f.COMBAT_THROWING : f.MELEE
                        }
                        if (!b || c.distance < a.model.combatStyle.minDistance || c.distance > a.model.combatStyle.normDistance + 40) return f.COMBAT_ADJUST;
                        if (a.timer.move <= 0 && a.timer.attack > 0.5) {
                            a.timer.move = 0.5 + Math.random() * 0.5;
                            return f.COMBAT_SIDEWAYS
                        }
                    }
                }
            },
            COMBAT_SIDEWAYS: {
                start: function(a, b, c, d) {
                    a.updateDefaultConfig(true);
                    a.faceToTarget.active = true;
                    if (sc.EnemyAnno.hasLookAway(b, a)) a.faceToTarget.offset =
                        0.5;
                    a.coll.relativeVel = a.model.combatStyle.sidewaySpeed || 1;
                    a.setNavTarget(5);
                    a.timer.move = 1;
                    d.attackCount = 0
                },
                update: function(a) {
                    if (a.nav.path.moveEntity() || a.timer.move <= 0) return f.COMBAT_IDLE
                }
            },
            COMBAT_HEALING: {
                start: function(a, b, c, d) {
                    a.updateDefaultConfig(false);
                    a.faceToTarget.active = false;
                    a.coll.relativeVel = 1;
                    a.setNavTarget(11);
                    a.timer.move = 1;
                    d.healingStart = false
                },
                update: function(a, b, c, d) {
                    if (d.healingStart) {
                        if (!a.currentAction) return f.COMBAT_IDLE
                    } else(a.nav.path.moveEntity() || a.timer.move <= 0) &&
                        this.startHealing(a, c, d)
                },
                startHealing: function(a, b, c) {
                    var b = 0,
                        d = a.params.getHpFactor();
                    d < 0.25 ? b = 2 : d < 0.33 && (b = 1);
                    c.healingStart = true;
                    c = a.model.getBestSandwich(b);
                    if (c !== false) {
                        c = a.model.getSandwichAction(c);
                        a.setAction(c)
                    }
                }
            },
            COMBAT_THROWING: {
                start: function(a, b, c, d) {
                    a.updateDefaultConfig(false);
                    a.faceToTarget.active = false;
                    a.coll.relativeVel = 1;
                    if (sc.EnemyAnno.hasAttackBack(a.target, a)) {
                        a.setNavTarget(9);
                        a.timer.move = 2
                    } else if (sc.EnemyAnno.hasAttackFront(a.target, a)) {
                        a.setNavTarget(10);
                        a.timer.move =
                            2
                    } else {
                        a.updateDefaultConfig(true);
                        a.faceToTarget.active = true;
                        a.coll.relativeVel = 0.7;
                        a.setNavTarget(6);
                        a.timer.move = 1
                    }
                    d.attackCount = 0
                },
                update: function(a, b, c, d) {
                    if (d.attackCount == 0) {
                        if (a.nav.path.moveEntity() || a.timer.move <= 0) {
                            a.faceToTarget.active = true;
                            a.updateDefaultConfig(true);
                            this.startThrow(a, c, d)
                        }
                    } else if (d.attackCount < a.model.combatStyle.throwCount && !a.timer.action) this.startThrow(a, c, d);
                    else if (d.attackCount == a.model.combatStyle.throwCount && !a.timer.action)
                        if (a.currentCombatArt) a.startCombatArtCharging();
                        else {
                            a.resetAttackTimer();
                            return f.COMBAT_IDLE
                        }
                },
                startThrow: function(a, b, c) {
                    a.cancelAction();
                    c.attackCount++;
                    var d = a.model.getAction(sc.PLAYER_ACTION.THROW_NORMAL_REV),
                        c = c.attackCount == 1 ? "THROW_CHARGED" : !d || c.attackCount % 2 == 1 ? "THROW_NORMAL" : "THROW_NORMAL_REV";
                    Vec2.assign(a.face, b.distVec);
                    Vec2.assign(a.throwDirData, b.distVec);
                    a.setAttribute("dashDir", a.face);
                    a.doPlayerAction(c)
                }
            },
            COMBAT_ADJUST: {
                start: function(a, b, c, d) {
                    a.nav.path.interrupt();
                    a.coll.relativeVel = 1;
                    a.setNavTarget(3);
                    a.timer.move = 1;
                    d.doInit =
                        true;
                    if (a.nav.path.getDistance() > 0) a.faceToTarget.active = false
                },
                update: function(a, b, c, d) {
                    if (a.nav.path.moveEntity() || a.timer.move <= 0)
                        if (c.distance > a.model.combatStyle.normDistance + 40) a.setNavTarget(3);
                        else return f.COMBAT_IDLE;
                    else if (d.doInit) {
                        d.doInit = false;
                        a.updateDefaultConfig(false)
                    }
                }
            },
            PERMA_PUNCH: {
                start: function(a, b, c, d) {
                    d.attackCount = 0
                },
                update: function(a, b, c, d) {
                    a.timer.action || this.startAttack(a, c, d)
                },
                startAttack: function(a, b, c) {
                    a.cancelAction();
                    c.attackCount++;
                    c = c.attackCount % 2 == 1 ? "ATTACK" :
                        "ATTACK_REV";
                    a.coll.setType(ig.COLLTYPE.VIRTUAL);
                    Vec2.assign(a.face, b.distVec);
                    a.setAttribute("dashDir", Vec2.create());
                    a.doPlayerAction(c)
                }
            },
            MELEE: {
                start: function(a, b, c, d) {
                    a.nav.path.interrupt();
                    a.updateDefaultConfig(false);
                    a.coll.relativeVel = 1;
                    d.directionMove = false;
                    if (sc.EnemyAnno.hasAttackBack(a.target, a)) {
                        d.directionMove = true;
                        a.setNavTarget(7)
                    } else if (sc.EnemyAnno.hasAttackFront(a.target, a)) {
                        d.directionMove = true;
                        a.setNavTarget(8)
                    } else a.setNavTarget(4);
                    a.timer.move = 3;
                    d.attackCount = 0
                },
                update: function(a,
                    b, c, d) {
                    if (d.directionMove) {
                        if ((b = a.nav.path.moveEntity()) || a.timer.move <= 0) {
                            a.setNavTarget(4);
                            d.directionMove = false
                        }
                    } else if (d.attackCount == 0)(b = a.nav.path.moveEntity()) || c.distance < 16 ? this.startAttack(a, c, d) : c.distance < 32 && a.coll.setType(ig.COLLTYPE.VIRTUAL);
                    else if (d.attackCount < a.model.combatStyle.comboCount && !a.timer.action) {
                        if (c.distance > a.model.combatStyle.meleeDistance * 2) {
                            a.resetAttackTimer();
                            return f.COMBAT_IDLE
                        }
                        this.startAttack(a, c, d)
                    } else if (d.attackCount == a.model.combatStyle.comboCount &&
                        !a.timer.action) {
                        a.resetAttackTimer();
                        return f.COMBAT_IDLE
                    }
                },
                startAttack: function(a, b, c) {
                    a.cancelAction();
                    c.attackCount++;
                    a.coll.setType(ig.COLLTYPE.VIRTUAL);
                    Vec2.assign(a.face, b.distVec);
                    a.setAttribute("dashDir", a.face);
                    c.attackCount == a.model.combatStyle.comboCount && a.currentCombatArt ? a.startCombatArtCharging() : a.doPlayerAction(c.attackCount == a.model.combatStyle.comboCount ? "ATTACK_FINISHER" : c.attackCount % 2 == 1 ? "ATTACK" : "ATTACK_REV")
                }
            },
            DODGE: {
                start: function(a, b) {
                    a.nav.path.interrupt();
                    a.updateDefaultConfig(false);
                    var c = ig.NAV_DODGE_TYPE.NEUTRAL;
                    sc.EnemyAnno.keepFarDistance(b) && (c = ig.NAV_DODGE_TYPE.GET_AWAY);
                    ig.navigation.getDodgePosition(g, a, a.threat, 48, c);
                    c = a.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM);
                    Vec3.sub(c, g);
                    Vec3.flip(c);
                    a.timer.dodge = 0.25;
                    a.faceToTarget.active = true;
                    a.setAttribute("dashDir", c);
                    a.doPlayerAction("DASH")
                },
                update: function(a) {
                    if (!a.currentAction) return a.inCombat ? f.COMBAT_IDLE : f.IDLE
                }
            }
        };
    Vec2.create();
    var g = Vec3.create(),
        h = ["normal", "battle", "aiming", "interogate"];
    sc.PartyMemberEntity = sc.PlayerBaseEntity.extend({
        party: sc.COMBATANT_PARTY.PLAYER,
        material: sc.COMBATANT_MATERIAL.ORGANIC,
        configs: {
            normal: null,
            aiming: null
        },
        guard: {
            damage: 0,
            timer: 0,
            fxSheet: new ig.EffectSheet("guard"),
            fxHandle: null,
            currentKey: null
        },
        model: null,
        posOffset: Vec2.create(),
        navTarget: null,
        state: null,
        inCombat: false,
        targetStats: {
            distVec: Vec2.create(),
            distance: 0,
            outOfScreenTime: 0
        },
        stateData: {},
        timer: {
            action: 0,
            move: 0,
            attack: 0,
            noAttackTime: 0,
            dodge: 0
        },
        throwDirData: Vec2.create(),
        currentCombatArt: null,
        charging: {
            max: 0,
            current: 0,
            timer: 0
        },
        init: function(a, b, c, d) {
            this.parent(a, b, c, d);
            this.configs.normal.overwrite("collType", ig.COLLTYPE.SEMI_IGNORE);
            this.configs.battle.overwrite("collType", ig.COLLTYPE.SEMI_IGNORE);
            this.configs.aiming.overwrite("collType", ig.COLLTYPE.SEMI_IGNORE);
            this.configs.aiming.overwrite("maxVel", 180);
            this.configs.aiming.overwrite("relativeVel", 100 / 180);
            this.setDefaultConfig(this.configs.normal);
            this.model = sc.party.getPartyMemberModel(d.partyMemberName);
            sc.Model.addObserver(this.model, this);
            if (this.model.walkAnims)
                for (a = h.length; a--;) {
                    b = h[a];
                    this.model.walkAnims[b] &&
                        this.storeWalkAnims(b, this.model.walkAnims[b])
                }
            this.animSheet = this.model.animSheet;
            this.proxies = this.model.getBalls();
            this.initAnimations();
            this.params = this.model.params;
            this.params.setCombatant(this);
            this.updateModelStats();
            d.posOffset && Vec2.assign(this.posOffset, d.posOffset);
            this.state = f.IDLE;
            this.state.start(this, ig.game.playerEntity, this.targetStats, this.stateData);
            this.charging.fx = new sc.CombatCharge(this, false)
        },
        updateDefaultConfig: function(a) {
            a ? this.setDefaultConfig(this.configs.aiming) : this.setDefaultConfig(this.goToCombat() ?
                this.configs.battle : this.configs.normal)
        },
        show: function(a) {
            this.parent(a);
            if (!a) {
                this.animState.alpha = 0;
                ig.game.effects.teleport.spawnOnTarget("showDefault", this, {
                    align: "CENTER"
                });
                this.setAction(i)
            }
        },
        onPreDamageModification: function(a, b, c, d, e) {
            if (e && e.damage >= this.params.currentHp && this.model.noDie) return a.survive = true;
            return false
        },
        onInstantDamage: function(a) {
            return a >= this.params.currentHp && this.model.noDie
        },
        onKill: function(a) {
            this.model && sc.Model.removeObserver(this.model, this);
            if (this.model &&
                this.params.isDefeated()) sc.party.onMemberDefeat(this.model.name);
            this.parent(a)
        },
        leaveParty: function(a) {
            if (!this._killed) {
                sc.Model.removeObserver(this.model, this);
                this.model = null;
                this.endCombat();
                a ? this.kill() : this.setAction(j)
            }
        },
        resetAttackTimer: function() {
            var a;
            a = this.target && sc.EnemyAnno.isWeak(this.target) ? 1 : 1.5 + Math.random() * 1.5;
            sc.party.getPartySize() == 2 && (a = a * 2);
            a = a * (1 - sc.party.ai.aggressive);
            this.timer.attack = a
        },
        startCombat: function() {
            this.selectTarget();
            if (this.target) {
                this.inCombat = true;
                this.timer.attack = 1 + Math.random() * 1;
                this.changeState(f.COMBAT_IDLE)
            }
        },
        endCombat: function() {
            this.setTarget(null);
            this.inCombat = false;
            this.changeState(f.IDLE)
        },
        startCombatArtCharging: function() {
            this.setCurrentAnim("charge", false, null, true);
            this.animationFixed = true;
            this.timer.action = -1;
            this.charging.max = 1;
            this.charging.level = 0;
            var a = this.model.getCombatArtName(sc.PLAYER_ACTION[this.currentCombatArt.actionKey + this.charging.max]);
            if (a && sc.options.get("party-combat-arts") != sc.PARTY_COMBAT_ARTS.NONE) {
                a =
                    new sc.SmallEntityBox(this, a.toString(), 1);
                a.stopRumble();
                ig.gui.addGuiElement(a)
            }
            this.doCombatArtCharge()
        },
        doCombatArtCharge: function() {
            this.charging.timer = e[this.charging.level];
            this.faceToTarget.active = true;
            this.charging.level++;
            this.charging.fx.charge(this.model.currentElementMode, this.charging.level, sc.options.get("party-combat-arts") != sc.PARTY_COMBAT_ARTS.FULL)
        },
        cancelCharge: function() {
            if (this.currentCombatArt) {
                this.charging.timer = 0;
                this.currentCombatArt = null;
                this.charging.fx.stop();
                this.animationFixed =
                    false
            }
        },
        doCombatArt: function() {
            this.charging.fx.stop();
            var a = this.currentCombatArt.actionKey + this.charging.max;
            this.params.consumeSp(sc.PLAYER_SP_COST[this.charging.max - 1]);
            this.cancelCharge();
            this.doPlayerAction(a);
            this.coll.relativeVel = 1;
            this.faceToTarget.active = false
        },
        setAction: function(a, b, c) {
            if (!this.eventBlocked && sc.model.isCutscene() && a && a.eventAction) {
                this.eventBlocked = true;
                this.updateDefaultConfig(false)
            }
            this.parent(a, b, c)
        },
        setActionBlocked: function(a) {
            this.timer.action = a.action;
            this.timer.dodge =
                a.dash || 0
        },
        hasValidTarget: function() {
            return this.target && !this.target._killed && !this.target.isDefeated() && this.target.target
        },
        selectTarget: function() {
            if (!this.hasValidTarget()) {
                var a = sc.combat.getPlayerTarget(this);
                this.setTarget(a)
            }
        },
        reselectTarget: function() {
            var a = sc.combat.getPlayerTarget(this);
            (a || !this.hasValidTarget()) && this.setTarget(a)
        },
        hasElement: function(a) {
            return this.model.allElements ? true : sc.newgame.get("keep-elements") && a != sc.ELEMENT.NEUTRAL ? ig.vars.get("g.newgame.elements." + a) || false :
                sc.model.player.hasElement(a)
        },
        getBestElement: function() {
            if (!this.target || !this.model || !sc.model.player.getCore(sc.PLAYER_CORE.ELEMENT_CHANGE)) return sc.ELEMENT.NEUTRAL;
            var a = 0,
                b = 1,
                c = 1;
            if (Math.random() <= sc.EnemyAnno.getUnderstandFactor(this.target, this, 1))
                for (var d = sc.EnemyAnno.getElement(this.target), e = this.target.params && this.target.params.getStat("elemFactor"), f = sc.ELEMENT_MAX + 1; f--;)
                    if (this.hasElement(f)) {
                        if (f == d || this.target.elementFilter && this.target.elementFilter == f) return f;
                        if (f && e && e[f - 1] >=
                            b) {
                            if (e[f - 1] == b) {
                                c++;
                                if (Math.random() < 1 / c) continue
                            } else c = 1;
                            a = f;
                            b = e[f - 1]
                        }
                    } return a
        },
        consumeSandwich: function(a) {
            this.model.consumeSandwich(a, this)
        },
        updateElement: function() {
            if (this.model) {
                var a = this.getBestElement();
                a != this.model.currentElementMode && this.model.setElementMode(a)
            }
        },
        updateModelStats: function() {
            this.regenFactor = this.params.getModifier("HP_REGEN");
            this.spikeDmg.baseFactor = this.params.getModifier("SPIKE_DMG");
            this.stunThreshold = this.params.getModifier("STUN_THRESHOLD");
            if (this.params) this.params.criticalDmgFactor =
                1.5 + this.params.getModifier("CRITICAL_DMG")
        },
        modelChanged: function(a, b) {
            a == this.model && b == sc.PARTY_MEMBER_MSG.STATS_CHANGED && this.updateModelStats()
        },
        selectCombatArt: function() {
            for (var b = 0; b < d.length; ++b) c[b] = this.model.getActionMaxLevel(a[d[b]].actionKey);
            if (sc.EnemyAnno.useRanged(this.target)) {
                c[a.ATTACK.idx] = 0;
                c[a.DASH.idx] = 0
            }
            sc.EnemyAnno.useMelee(this.target) && (c[a.THROW.idx] = 0);
            for (var e = [], b = c.length; b--;) c[b] > 0 && e.push(b);
            if (e.length > 0) {
                b = e[Math.floor(Math.random() * e.length)];
                if (c[b]) this.currentCombatArt =
                    a[d[b]]
            }
        },
        changeState: function(a) {
            this.state = a;
            this.cancelAction();
            a = this.target || ig.game.playerEntity;
            this.state.start && this.state.start(this, a, this.targetStats, this.stateData)
        },
        isControlBlocked: function() {
            return !this.model || this.hasStun() || this.params.isDefeated() || this.currentAction && this.currentAction.eventAction || this.currentAction == i
        },
        getDodgeProbability: function(a) {
            var b = 0.5;
            (a = a.getCombatant()) && (b = sc.EnemyAnno.getUnderstandFactor(a, this, 1));
            a = sc.party.getStrategy("BEHAVIOUR");
            return (1 - b) *
                a.dodgeMin + b * a.dodgeMax
        },
        goToCombat: function() {
            return sc.model.isCombatActive() && !sc.party.getStrategy("BEHAVIOUR").doNothing
        },
        update: function() {
            if (!this.eventBlocked || !sc.model.isCutscene()) {
                if (this.eventBlocked) {
                    this.navTarget = null;
                    this.changeState(f.IDLE);
                    this.eventBlocked = false
                }
                this.targetStats.outOfScreenTime = ig.EntityTools.isInScreen(this, 0) ? 0 : this.targetStats.outOfScreenTime + ig.system.tick;
                this.timer.attack = b(this.timer.attack);
                this.timer.move = b(this.timer.move);
                this.timer.action = b(this.timer.action);
                this.timer.dodge = b(this.timer.dodge);
                var a = ig.game.playerEntity;
                if (this.isControlBlocked()) {
                    this.state = null;
                    this.cancelCharge();
                    this.timer.action = 0
                } else {
                    if (this.charging.timer) {
                        this.charging.timer = this.charging.timer - ig.system.tick;
                        this.charging.timer <= 0 && (this.charging.level == this.charging.max ? this.doCombatArt() : this.doCombatArtCharge())
                    } else if (this.timer.action && !this.currentAction) {
                        this.timer.action = 0;
                        this.timer.dodge = 0
                    }
                    this.state || this.changeState(this.inCombat ? f.COMBAT_IDLE : f.IDLE);
                    if (sc.model.isCombatActive() &&
                        !this.jumping && this.timer.dodge == 0) {
                        var c = sc.combat.getNearbyThreat(this, 48, 1);
                        if (!c && (this.target && sc.EnemyAnno.keepFarDistance(this.target, this)) && ig.CollTools.getGroundDistance(this.coll, this.target.coll) < 240) c = this.target;
                        if (c) {
                            this.timer.dodge = 0.25;
                            if (Math.random() < this.getDodgeProbability(c)) {
                                this.threat = c;
                                this.changeState(f.DODGE)
                            }
                        }
                    }
                    if (!this.timer.action && !this.jumping)
                        if (this.goToCombat()) {
                            if (this.inCombat) {
                                if (!this.hasValidTarget()) {
                                    this.selectTarget();
                                    this.target ? this.changeState(f.COMBAT_IDLE) :
                                        this.endCombat()
                                }
                            } else this.startCombat();
                            this.timer.noAttackTime = this.timer.noAttackTime + ig.system.tick;
                            if (this.timer.noAttackTime > 5) {
                                this.timer.noAttackTime = 0;
                                this.reselectTarget()
                            }
                        } else this.inCombat && this.endCombat();
                    a = this.target || a;
                    ig.CollTools.getDistVec2(this.coll, a.coll, this.targetStats.distVec);
                    this.targetStats.distance = Vec2.length(this.targetStats.distVec);
                    this.targetStats.distance = this.targetStats.distance - a.coll.size.x / 2;
                    (a = this.state.update(this, a, this.targetStats, this.stateData)) &&
                    this.changeState(a)
                }
            } else {
                this.noFaceRotate = true;
                this.cancelCharge()
            }
            this.parent();
            this.model || this.currentAction || this.kill()
        },
        resetPos: function(a) {
            sc.party.resetMemberPos(this.model.name);
            a || ig.game.effects.teleport.spawnOnTarget("showFast", this);
            this.nav.path.mapVersion = -1;
            this.target && this.reselectTarget()
        },
        setNavTarget: function(a) {
            a == 1 ? this.navTarget != a && this.nav.path.toEntity(ig.game.playerEntity, 16, {
                posOffset: this.posOffset
            }) : a == 2 ? this.nav.path.dodge(ig.game.playerEntity, 32) : a == 12 ? this.nav.path.runAway(ig.game.playerEntity,
                sc.party.keepDistance ? 100 : 240) : this.target && (a == 3 ? this.nav.path.runAway(this.target, this.model.combatStyle.normDistance, true) : a == 4 ? this.nav.path.toEntity(this.target, this.model.combatStyle.meleeDistance) : a == 7 ? this.nav.path.runToFace(this.target, 0.5, 32, 80) : a == 8 ? this.nav.path.runToFace(this.target, 0, 32, 80) : a == 5 ? this.nav.path.sideways(this.target, 80, 16, true) : a == 6 ? this.nav.path.runAway(this.target, this.model.combatStyle.normDistance - 20, true) : a == 9 ? this.nav.path.runToFace(this.target, 0.5, this.model.combatStyle.normDistance -
                20, this.model.combatStyle.normDistance + 12, true) : a == 10 ? this.nav.path.runToFace(this.target, 0, this.model.combatStyle.normDistance - 20, this.model.combatStyle.normDistance + 12, true) : a == 11 && this.nav.path.runAway(this.target, 240));
            this.navTarget = a
        },
        onNavigationFailed: function(a) {
            if (a > 5) {
                this.nav.failTimer = 0;
                this.resetPos()
            }
        }
    });
    var i = new ig.Action("enemyStart", [{
            type: "WAIT",
            time: 0.4
        }]),
        j = new ig.Action("enemyStart", [{
            type: "SHOW_EFFECT",
            effect: {
                sheet: "teleport",
                name: "hideDefault"
            },
            wait: true,
            align: "CENTER",
            actionDetached: true
        }])
});
ig.baked = !0;

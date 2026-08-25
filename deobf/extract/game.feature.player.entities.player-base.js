ig.module("game.feature.player.entities.player-base").requires("game.feature.combat.entities.ball", "game.feature.combat.entities.combatant", "game.feature.player.entities.crosshair", "game.feature.player.player-level-notifier", "game.feature.player.item-consumption").defines(function() {
    sc.PlayerBaseEntity = ig.ENTITY.Combatant.extend({
        party: sc.COMBATANT_PARTY.PLAYER,
        material: sc.COMBATANT_MATERIAL.ORGANIC,
        configs: {
            normal: null,
            aiming: null
        },
        maxJumpHeight: -1,
        guard: {
            damage: 0,
            timer: 0,
            fxSheet: new ig.EffectSheet("guard"),
            fxHandle: null,
            currentKey: null
        },
        stunEscapeReady: false,
        playerTrack: {
            startedAction: null,
            trackTimer: 0
        },
        init: function(b, a, d, c) {
            this.parent(b, a, d, c);
            this.coll.type = ig.COLLTYPE.VIRTUAL;
            this.coll.zBounciness = 0;
            this.coll.setSize(16, 16, 24);
            this.storeWalkAnims("normal", {
                idle: "idle",
                hover: "hover",
                hoverMove: "hover",
                move: "walk",
                run: "run",
                brake: "brake",
                preIdle: "preIdle",
                damage: "damage",
                fall: "fall",
                jump: "jump"
            });
            this.storeWalkAnims("battle", {
                idle: "idle",
                hover: "hover",
                hoverMove: "hover",
                move: "walk",
                run: "run",
                brake: "brake",
                preIdle: "preIdle",
                damage: "damage",
                fall: "fall",
                jump: "jump"
            });
            this.storeWalkAnims("aiming", {
                idle: "aim",
                move: "aimMove",
                moveRev: "aimMoveRev",
                damage: "damage"
            });
            this.setWalkAnims("normal");
            this.configs.normal = new ig.ActorConfig({
                walkAnims: "normal",
                maxVel: 180,
                relativeVel: 1,
                accelSpeed: 0.8,
                friction: 1.6,
                airFriction: 0.7,
                hitStable: "LIGHT",
                jumpingEnabled: true,
                shadow: 16,
                stepSfxFrames: [2, 5],
                floatHeight: 0
            });
            this.configs.battle = new ig.ActorConfig({
                walkAnims: "battle",
                maxVel: 180,
                relativeVel: 1,
                accelSpeed: 0.8,
                friction: 1.6,
                airFriction: 0.7,
                hitStable: "LIGHT",
                jumpingEnabled: true,
                shadow: 16,
                stepSfxFrames: [2, 5],
                floatHeight: 0
            });
            this.configs.aiming = new ig.ActorConfig({
                walkAnims: "aiming",
                maxVel: 100,
                accelSpeed: 0.7,
                friction: 1.6,
                airFriction: 0.7,
                hitStable: "LIGHT",
                faceDirFixed: true,
                jumpingEnabled: true,
                shadow: 16,
                stepSfxFrames: 0,
                floatHeight: 0
            });
            this.setDefaultConfig(this.configs.normal)
        },
        doPlayerAction: function(b) {
            var a = sc.PLAYER_ACTION[b];
            if (!a) throw Error("Unknown Action Type: " + b);
            a = this.model.getAction(a);
            this.playerTrack.startedAction =
                b;
            this.playerTrack.trackTimer = 0.05;
            this.setAction(a)
        },
        startGuardEffect: function() {
            var b = "neutral";
            this.guard.damage > 0.75 ? b = b + "4" : this.guard.damage > 0.5 ? b = b + "3" : this.guard.damage > 0.25 && (b = b + "2");
            var a = this.params.getModifier("GUARD_AREA");
            a >= 2 ? b = b + "_top" : a >= 1 && (b = b + "_full");
            if (b != this.guard.currentKey) {
                this.guard.fxHandle && this.guard.fxHandle.stop();
                this.guard.currentKey = b;
                this.guard.fxHandle = this.guard.fxSheet.spawnOnTarget(b, this, {
                    duration: -1
                })
            }
        },
        endGuardEffect: function() {
            if (!(this.guard.damage >=
                    1)) {
                this.guard.fxHandle && this.guard.fxHandle.stop();
                this.guard.fxHandle = null;
                this.guard.currentKey = null
            }
        },
        damageShield: function(b) {
            var a = this.guard.damage;
            this.guard.damage = this.guard.damage + b / 7;
            if (a <= 0.75 && this.guard.damage >= 1) this.guard.damage = 0.99;
            if (this.guard.damage >= 1) {
                this.guard.fxHandle && this.guard.fxHandle.stop();
                this.guard.fxHandle = this.guard.fxSheet.spawnOnTarget("guardBroken", this, {
                    duration: -1
                });
                this.onPlayerShieldBreak && this.onPlayerShieldBreak();
                this.guard.timer = 5;
                this.guard.damage =
                    1;
                sc.combat.doDramaticEffect(this, this, sc.DRAMATIC_EFFECT.GUARD_BREAK);
                return true
            }
            this.guard.timer = 1;
            this.startGuardEffect();
            return false
        },
        regenShield: function(b) {
            if (!b)
                if (this.guard.timer > 0) {
                    this.guard.timer = this.guard.timer - ig.system.tick;
                    if (this.guard.timer < 0) {
                        this.guard.timer = 0;
                        if (this.guard.damage == 1) {
                            this.guard.fxHandle && this.guard.fxHandle.stop();
                            this.guard.fxHandle = null;
                            this.guard.damage = 0
                        }
                    }
                } else if (this.guard.damage > 0) {
                this.guard.damage = this.guard.damage - ig.system.tick / 10;
                if (this.guard.damage <
                    0) this.guard.damage = 0
            }
        },
        update: function() {
            if (this.playerTrack.trackTimer) {
                this.playerTrack.trackTimer = this.playerTrack.trackTimer - ig.system.tick;
                if (this.playerTrack.trackTimer <= 0) {
                    this.playerTrack.trackTimer = 0;
                    this.playerTrack.startedAction = null
                }
            }
            ig.ENTITY.Combatant.prototype.update.call(this)
        },
        _addTargetedBy: function(b) {
            this.parent(b);
            this.updateCombatMode()
        },
        _removeTargetedBy: function(b) {
            this.parent(b);
            this.updateCombatMode()
        },
        updateCombatMode: function() {
            var b = sc.combat.isPlayerPartyInCombat();
            sc.model.setCombatMode(b)
        }
    })
});
ig.baked = !0;

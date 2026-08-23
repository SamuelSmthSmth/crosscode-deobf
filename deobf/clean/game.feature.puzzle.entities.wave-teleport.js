/**
 * game.feature.puzzle.entities.wave-teleport
 * ==========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.puzzle.entities.wave-teleport")`.
 *
 * `ig.ENTITY.WaveTeleport`: a wave-element teleport beacon. A charged wave
 * ball hitting it starts a 0.1-second teleport animation, transporting the
 * player + party to the beacon position. Includes
 * `sc.COMBAT_ENEMY_EVENT.WAVE_TELEPORT` for enemy AI checks.
 */
ig.module("game.feature.puzzle.entities.wave-teleport")
    .requires("impact.base.entity", "impact.feature.effect.effect-sheet", "game.feature.combat.combat-target-event")
    .defines(function () {

    var centerOut = Vec2.create(),
        distOut = Vec2.create(),
        center2 = Vec2.create();

    sc.COMBAT_ENEMY_EVENT.WAVE_TELEPORT = {
        _wm: {
            attributes: {
                angle: {
                    _type: "Number",
                    _info: "Minimum angle different between vectors pointing to old and new target position. 0.5= at least 90 degree difference. 1.0= essentially impossible (180 degree)"
                }
            }
        },
        check: function (combatant, target, params, angleConfig) {
            var vecToTarget = ig.CollTools.getDistVec2(combatant.coll, target.coll, distOut),
                combatantCenter = combatant.getCenter(center2);
            Vec2.sub(combatantCenter, params.newPos);
            Vec2.flip(combatantCenter);
            return Vec2.angle(vecToTarget, combatantCenter) >= angleConfig.angle * Math.PI
        }
    };

    ig.ENTITY.WaveTeleport = ig.AnimatedEntity.extend({
        effects: {
            sheet: new ig.EffectSheet("puzzle.wave-teleport"),
            handle: null,
            hideHandle: null
        },
        teleportTimer: 0,
        teleportTargets: [],
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                spawnCondition: {
                    _type: "VarCondition",
                    _info: "Condition for Enemy to spawn",
                    _popup: true
                }
            }
        }),
        permaRemove: false,
        delayedHide: false,

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.TRIGGER;
            this.coll.setSize(16, 16, 24);
            this.coll.shadow.size = 16;
            this.coll.zGravityFactor = 9001;
            this.coll.setPadding(4, 4);
            this.initAnimations({
                shapeType: "Y_FLAT",
                offset: {
                    x: 0,
                    y: -4,
                    z: 8
                },
                sheet: {
                    src: "media/entity/objects/object-effects.png",
                    width: 24,
                    height: 24,
                    xCount: 5,
                    offX: 128,
                    offY: 40
                },
                SUB: [{
                    name: "idle",
                    time: 0.1,
                    frames: [0],
                    repeat: true,
                    framesAlpha: [0.5]
                }, {
                    name: "idle",
                    time: 0.133,
                    frames: [1, 2, 3, 4],
                    repeat: true,
                    renderMode: "lighter"
                }]
            });
            this.setCurrentAnim("idle")
        },

        show: function (show) {
            this.parent(show);
            if (this.effects.hideHandle) {
                this.effects.hideHandle.stop();
                this.effects.hideHandle = null
            }
            if (!show) {
                this.animState.alpha = 0;
                this.effects.sheet.spawnOnTarget("appear", this, {
                    align: ig.ENTITY_ALIGN.CENTER
                })
            }
        },

        onActionEndDetach: function () {
            this.effects.hideHandle = this.effects.sheet.spawnOnTarget("disappear", this, {
                align: ig.ENTITY_ALIGN.CENTER,
                callback: this
            });
            this.permaRemove = true
        },

        onHideRequest: function () {
            this.effects.hideHandle = this.effects.sheet.spawnOnTarget("disappear", this, {
                align: ig.ENTITY_ALIGN.CENTER,
                callback: this
            })
        },

        onEffectEvent: function (effect) {
            if (effect.isDone() && this.effects.hideHandle) {
                this.effects.hideHandle = null;
                this.teleportTimer ? this.delayedHide = true : this.permaRemove ? this.kill() : this.hide()
            }
        },

        startTeleport: function () {
            if (this.teleportTargets.length == 0) {
                this.teleportTargets.push(ig.game.playerEntity);
                for (var i = sc.party.getPartySize(); i--;) {
                    var member = sc.party.getPartyMemberEntityByIndex(i);
                    member && this.teleportTargets.push(member)
                }
            }
            var waitAction = new ig.Action("waveTeleportAction", [{
                type: "WAIT",
                time: -1
            }]);
            waitAction.eventAction = true;
            for (var i = this.teleportTargets.length; i--;) {
                var target = this.teleportTargets[i],
                    centerPos = target.getCenter(centerOut);
                this.effects.sheet.spawnFixed("trail", centerPos.x, centerPos.y, target.coll.pos.z + 12, null, {
                    target2: this,
                    target2Align: ig.ENTITY_ALIGN.CENTER
                });
                this.effects.sheet.spawnOnTarget("hide", target, {
                    target2: this,
                    target2Align: ig.ENTITY_ALIGN.CENTER
                });
                if (target instanceof ig.ENTITY.Combatant) {
                    target.invincibleTimer = -1;
                    target.setAction(waitAction)
                }
                target.onTeleportStart && target.onTeleportStart(this);
                var groundEntities = ig.game.getEntitiesOnTop(target);
                for (var j = groundEntities.length; j--;) groundEntities[j] instanceof ig.ENTITY.WavePushPullBlock || this.effects.sheet.spawnOnTarget("hide", groundEntities[j], {
                    target2: this,
                    target2Align: ig.ENTITY_ALIGN.CENTER
                })
            }
            this.teleportTimer = 0.1
        },

        doTeleport: function () {
            for (var zAccum = 0, waitAction = new ig.Action("waveTeleportAction", [{
                    type: "WAIT",
                    time: 0
                }]), count = this.teleportTargets.length, i = 0; i < count; ++i) {
                var target = this.teleportTargets[i],
                    centerPos = this.getCenter(centerOut);
                target.sendEnemyEvent && target.sendEnemyEvent(sc.COMBAT_ENEMY_EVENT.WAVE_TELEPORT, {
                    newPos: centerPos
                });
                if (target instanceof ig.ENTITY.Combatant) target.invincibleTimer = 0;
                if (target instanceof sc.PartyMemberEntity) target.resetPos();
                else {
                    var groundEntities = ig.game.getEntitiesOnTop(target),
                        offX = centerPos.x - target.coll.size.x / 2,
                        offY = centerPos.y - target.coll.size.y / 2,
                        z = this.coll.pos.z + zAccum;
                    for (var j = groundEntities.length; j--;)
                        if (groundEntities[j] instanceof ig.ENTITY.WavePushPullBlock) groundEntities[j].coll.setGroundEntry(null);
                        else {
                            this.effects.sheet.spawnOnTarget("show", groundEntities[j]);
                            var groundColl = groundEntities[j].coll;
                            groundColl.setGroundEntry(null);
                            groundColl.setPos(groundColl.pos.x + offX - target.coll.pos.x, groundColl.pos.y + offY - target.coll.pos.y, groundColl.pos.z + z - target.coll.pos.z)
                        }
                    z = target.getTeleportZOffset ? z + target.getTeleportZOffset() : z + target.coll.float.height;
                    target.setPos(offX, offY, z);
                    zAccum = zAccum + target.coll.size.z
                }
                if (target.isPlayer) {
                    ig.camera.isActiveTarget(target.cameraHandle) && ig.camera.retarget("FASTER", KEY_SPLINES.EASE_IN_OUT);
                    waitAction.eventAction = true
                }
                this.effects.sheet.spawnOnTarget("show", target);
                target.setAction && target.setAction(waitAction);
                target.doTeleport && target.doTeleport(this)
            }
            this.teleportTargets.length = 0
        },

        update: function () {
            this.animState.angle = this.animState.angle + ig.system.tick * 1;
            if (this.teleportTimer) {
                this.teleportTimer = this.teleportTimer - ig.system.tick;
                if (this.teleportTimer <= 0) {
                    this.teleportTimer = 0;
                    this.doTeleport();
                    if (this.delayedHide) {
                        this.delayedHide = true;
                        this.permaRemove ? this.kill() : this.hide()
                    }
                }
            }
            this.parent()
        },

        hasBlockOnTop: function () {
            for (var coll = this.coll, overlapping = ig.game.getEntitiesInRectangle(coll.pos.x - 8, coll.pos.y - 8, coll.pos.z, coll.size.x + 16, coll.size.y + 16, coll.size.z, this), i = overlapping.length; i--;) {
                var entity = overlapping[i];
                if (entity instanceof ig.ENTITY.WavePushPullBlock || entity instanceof ig.ENTITY.PushPullBlock || entity instanceof sc.FerroEntity) return true
            }
            return false
        },

        ballHit: function (ball) {
            var hitCenter = ball.getHitCenter(this),
                element = ball.getElement();
            if (this.hasBlockOnTop()) return false;
            var isValidHit = (ball.isBall || ball instanceof sc.CompressedWaveEntity) && ball.getCombatantRoot().isPlayer;
            if ((!ball.isBall || ball.attackInfo.hasHint("CHARGED")) && isValidHit && element == sc.ELEMENT.WAVE && !this.teleportTimer) {
                var attached = ball.entityAttached;
                for (var i = attached.length; i--;)
                    if (attached[i].doTeleport) {
                        this.teleportTargets.push(attached[i]);
                        attached.splice(i, 1)
                    } if (this.teleportTargets.length == 0 && ball.isBall && !ig.EntityTools.isInScreen(this, 32) || this.teleportTargets.length == 0 && ig.CollTools.getGroundDistance(this.coll, ig.game.playerEntity.coll) < 48 || this.teleportTargets.length == 0 && ig.game.playerEntity.currentAction && ig.game.playerEntity.currentAction.eventAction) return false;
                sc.combat.showHitEffect(this, hitCenter, sc.ATTACK_TYPE.NONE, ball.getElement(), false, false, true);
                this.startTeleport();
                return true
            }
            return false
        },

        isBallDestroyer: function (entity, other, ignore) {
            return !ignore || sc.model.player.currentElementMode != sc.ELEMENT.WAVE || ig.CollTools.getGroundDistance(this.coll, ig.game.playerEntity.coll) < 48 || this.hasBlockOnTop() ? false : true
        }
    })
});
ig.baked = !0;
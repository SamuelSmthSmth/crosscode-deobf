ig.module("game.feature.puzzle.entities.wave-teleport").requires("impact.base.entity", "impact.feature.effect.effect-sheet", "game.feature.combat.combat-target-event").defines(function() {
    var b = Vec2.create(),
        a = Vec2.create(),
        d = Vec2.create();
    sc.COMBAT_ENEMY_EVENT.WAVE_TELEPORT = {
        _wm: {
            attributes: {
                angle: {
                    _type: "Number",
                    _info: "Minimum angle different between vectors pointing to old and new target position. 0.5= at least 90 degree difference. 1.0= essentially impossible (180 degree)"
                }
            }
        },
        check: function(b, e,
            f, g) {
            e = ig.CollTools.getDistVec2(b.coll, e.coll, a);
            b = b.getCenter(d);
            Vec2.sub(b, f.newPos);
            Vec2.flip(b);
            return Vec2.angle(e, b) >= g.angle * Math.PI
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
        init: function(a,
            b, d, g) {
            this.parent(a, b, d, g);
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
        show: function(a) {
            this.parent(a);
            if (this.effects.hideHandle) {
                this.effects.hideHandle.stop();
                this.effects.hideHandle = null
            }
            if (!a) {
                this.animState.alpha = 0;
                this.effects.sheet.spawnOnTarget("appear", this, {
                    align: ig.ENTITY_ALIGN.CENTER
                })
            }
        },
        onActionEndDetach: function() {
            this.effects.hideHandle = this.effects.sheet.spawnOnTarget("disappear", this, {
                align: ig.ENTITY_ALIGN.CENTER,
                callback: this
            });
            this.permaRemove = true
        },
        onHideRequest: function() {
            this.effects.hideHandle = this.effects.sheet.spawnOnTarget("disappear", this, {
                align: ig.ENTITY_ALIGN.CENTER,
                callback: this
            })
        },
        onEffectEvent: function(a) {
            if (a.isDone() && this.effects.hideHandle) {
                this.effects.hideHandle = null;
                this.teleportTimer ? this.delayedHide = true : this.permaRemove ? this.kill() : this.hide()
            }
        },
        startTeleport: function() {
            if (this.teleportTargets.length == 0) {
                this.teleportTargets.push(ig.game.playerEntity);
                for (var a = sc.party.getPartySize(); a--;) {
                    var d = sc.party.getPartyMemberEntityByIndex(a);
                    d && this.teleportTargets.push(d)
                }
            }
            d = new ig.Action("waveTeleportAction", [{
                type: "WAIT",
                time: -1
            }]);
            d.eventAction = true;
            for (a = this.teleportTargets.length; a--;) {
                var f = this.teleportTargets[a],
                    g = f.getCenter(b);
                this.effects.sheet.spawnFixed("trail", g.x, g.y, f.coll.pos.z + 12, null, {
                    target2: this,
                    target2Align: ig.ENTITY_ALIGN.CENTER
                });
                this.effects.sheet.spawnOnTarget("hide", f, {
                    target2: this,
                    target2Align: ig.ENTITY_ALIGN.CENTER
                });
                if (f instanceof ig.ENTITY.Combatant) {
                    f.invincibleTimer = -1;
                    f.setAction(d)
                }
                f.onTeleportStart && f.onTeleportStart(this);
                f = ig.game.getEntitiesOnTop(f);
                for (g = f.length; g--;) f[g] instanceof
                ig.ENTITY.WavePushPullBlock || this.effects.sheet.spawnOnTarget("hide", f[g], {
                    target2: this,
                    target2Align: ig.ENTITY_ALIGN.CENTER
                })
            }
            this.teleportTimer = 0.1
        },
        doTeleport: function() {
            for (var a = 0, d = new ig.Action("waveTeleportAction", [{
                    type: "WAIT",
                    time: 0
                }]), f = this.teleportTargets.length, g = 0; g < f; ++g) {
                var h = this.teleportTargets[g],
                    i = this.getCenter(b);
                h.sendEnemyEvent && h.sendEnemyEvent(sc.COMBAT_ENEMY_EVENT.WAVE_TELEPORT, {
                    newPos: i
                });
                if (h instanceof ig.ENTITY.Combatant) h.invincibleTimer = 0;
                if (h instanceof sc.PartyMemberEntity) h.resetPos();
                else {
                    for (var j = ig.game.getEntitiesOnTop(h), k = i.x - h.coll.size.x / 2, i = i.y - h.coll.size.y / 2, l = this.coll.pos.z + a, o = j.length; o--;)
                        if (j[o] instanceof ig.ENTITY.WavePushPullBlock) j[o].coll.setGroundEntry(null);
                        else {
                            this.effects.sheet.spawnOnTarget("show", j[o]);
                            var m = j[o].coll;
                            m.setGroundEntry(null);
                            m.setPos(m.pos.x + k - h.coll.pos.x, m.pos.y + i - h.coll.pos.y, m.pos.z + l - h.coll.pos.z)
                        } l = h.getTeleportZOffset ? l + h.getTeleportZOffset() : l + h.coll.float.height;
                    h.setPos(k, i, l);
                    a = a + h.coll.size.z
                }
                if (h.isPlayer) {
                    ig.camera.isActiveTarget(h.cameraHandle) &&
                        ig.camera.retarget("FASTER", KEY_SPLINES.EASE_IN_OUT);
                    d.eventAction = true
                }
                this.effects.sheet.spawnOnTarget("show", h);
                h.setAction && h.setAction(d);
                h.doTeleport && h.doTeleport(this)
            }
            this.teleportTargets.length = 0
        },
        update: function() {
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
        hasBlockOnTop: function() {
            for (var a = this.coll, a = ig.game.getEntitiesInRectangle(a.pos.x - 8, a.pos.y - 8, a.pos.z, a.size.x + 16, a.size.y + 16, a.size.z, this), b = a.length; b--;) {
                var d = a[b];
                if (d instanceof ig.ENTITY.WavePushPullBlock || d instanceof ig.ENTITY.PushPullBlock || d instanceof sc.FerroEntity) return true
            }
            return false
        },
        ballHit: function(a) {
            var b = a.getHitCenter(this),
                d = a.getElement();
            if (this.hasBlockOnTop()) return false;
            var g = (a.isBall || a instanceof sc.CompressedWaveEntity) && a.getCombatantRoot().isPlayer;
            if ((!a.isBall ||
                    a.attackInfo.hasHint("CHARGED")) && g && d == sc.ELEMENT.WAVE && !this.teleportTimer) {
                d = a.entityAttached;
                for (g = d.length; g--;)
                    if (d[g].doTeleport) {
                        this.teleportTargets.push(d[g]);
                        d.splice(g, 1)
                    } if (this.teleportTargets.length == 0 && a.isBall && !ig.EntityTools.isInScreen(this, 32) || this.teleportTargets.length == 0 && ig.CollTools.getGroundDistance(this.coll, ig.game.playerEntity.coll) < 48 || this.teleportTargets.length == 0 && ig.game.playerEntity.currentAction && ig.game.playerEntity.currentAction.eventAction) return false;
                sc.combat.showHitEffect(this,
                    b, sc.ATTACK_TYPE.NONE, a.getElement(), false, false, true);
                this.startTeleport();
                return true
            }
            return false
        },
        isBallDestroyer: function(a, b, d) {
            return !d || sc.model.player.currentElementMode != sc.ELEMENT.WAVE || ig.CollTools.getGroundDistance(this.coll, ig.game.playerEntity.coll) < 48 || this.hasBlockOnTop() ? false : true
        }
    })
});
ig.baked = !0;

/**
 * game.feature.puzzle.entities.thermo-pole
 * ========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.puzzle.entities.thermo-pole")`.
 *
 * Thermo (element) poles: `ig.ENTITY.ElementPole` charged by element balls
 * to activate `ig.ENTITY.ElementPoleDest`; `sc.ElementPoleGroups` groups
 * poles sharing a destination. `sc.TERMO_POLE_TYPE` is the type table.
 */
ig.module("game.feature.puzzle.entities.thermo-pole").requires("impact.base.entity", "impact.feature.effect.effect-sheet", "game.feature.combat.combat-poi").defines(function() {
    var tmpVec = Vec3.create();
    sc.ElementPoleGroups = {
        groups: {},
        registerDest: function(poleDest, isOn) {
            if (poleDest.group) {
                var group = this.getGroup(poleDest.group);
                group.dests[poleDest.element] = poleDest;
                if (isOn) {
                    group.currentDest = poleDest;
                    for (var i = group.hitCount = group.poles.length; i--;)
                        group.poles[i].onDestInit(poleDest.element);
                }
            }
        },
        registerPole: function(pole) {
            if (pole.group) {
                var group = this.getGroup(pole.group);
                group.poles.push(pole);
                if (group.currentDest) {
                    group.hitCount = group.poles.length;
                    pole.onDestInit(group.currentDest.element);
                }
            }
        },
        getGroup: function(name) {
            if (!this.groups[name]) this.groups[name] = {
                dests: {},
                poles: [],
                currentBall: null,
                currentDest: null,
                hitCount: 0
            };
            return this.groups[name];
        },
        deleteGroup: function(name) {
            if (name) delete this.groups[name];
        },
        onPoleHit: function(pole, ball, isSameElement) {
            if (pole.active) {
                var element = ball.getElement();
                if (!element) return false;
                if (!pole.group) return true;
                var group = this.getGroup(pole.group),
                    dest = group.dests[element] || null;
                if (group.currentBall && group.currentBall != ball && !isSameElement || group.currentDest && group.currentDest != dest) {
                    this.onGroupChargeCancel(pole);
                    isSameElement = false;
                }
                if (dest && !dest.isOn()) {
                    if (isSameElement || group.hitCount >= group.poles.length) return true;
                    group.currentBall = ball;
                    group.currentDest = dest;
                    group.hitCount++;
                    var groupComplete = group.hitCount == group.poles.length;
                    dest.onPoleHit(pole, groupComplete, group.poles);
                    if (groupComplete)
                        for (var i = group.poles.length; i--;) {
                            var otherPole = group.poles[i];
                            if (pole != otherPole) otherPole.onComplete();
                        }
                }
                return true;
            }
        },
        getChargeState: function(pole) {
            if (!pole.group) return ChargeState.TMP;
            var group = this.getGroup(pole.group);
            return !group.currentDest ? ChargeState.TMP : group.hitCount < group.poles.length ? ChargeState.PENDING : ChargeState.GROUP;
        },
        onFinalizeGroup: function(pole) {
            var group = this.getGroup(pole.group);
            group.currentBall = null;
            for (var i = group.poles.length; i--;) group.poles[i].onFinalize();
        },
        onCancelCheck: function(pole) {
            var group = this.getGroup(pole.group);
            if (group.hitCount == group.poles.length) return false;
            if (group.currentBall._killed) {
                group.currentBall = null;
                group.hitCount = 0;
                for (var i = group.poles.length; i--;) group.poles[i].onCancel();
                return true;
            }
            return false;
        },
        onGroupChargeCancel: function(pole) {
            if (!pole.group) return null;
            var group = this.getGroup(pole.group);
            group.currentDest.onCancel();
            group.currentDest = null;
            group.hitCount = 0;
            group.currentBall = null;
            for (var i = group.poles.length; i--;) {
                var otherPole = group.poles[i];
                if (otherPole != pole) otherPole.onCancel();
            }
        }
    };
    sc.TERMO_POLE_TYPE = {};
    sc.TERMO_POLE_TYPE.LONG = {
        size: { x: 16, y: 16, z: 48 },
        src: { x: 0, y: 144 },
        changeHeight: 32
    };
    sc.TERMO_POLE_TYPE.LONG_64 = {
        size: { x: 16, y: 16, z: 80 },
        src: { x: 80, y: 144 },
        changeHeight: 64
    };
    sc.TERMO_POLE_TYPE.SHORT = {
        size: { x: 16, y: 16, z: 16 },
        src: { x: 0, y: 208 }
    };
    var ChargeState = {
            NONE: { timed: false },
            TMP: { timed: true, blink: true },
            PENDING: { timed: false, blink: true },
            GROUP: { timed: false },
            DISCHARGE: { timed: true }
        },
        spawnCondition = null;
    ig.ENTITY.ElementPole = ig.AnimatedEntity.extend({
        data: null,
        gfx: null,
        group: null,
        active: false,
        charge: {
            state: ChargeState.NONE,
            element: 0,
            prevElement: 0,
            timer: 0,
            lightHandles: []
        },
        effects: {
            sheet: new ig.EffectSheet("puzzle.thermo-pole"),
            handle: null,
            hideHandle: null
        },
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                poleType: {
                    _type: "String",
                    _info: "Type of Pole",
                    _select: sc.TERMO_POLE_TYPE
                },
                group: {
                    _type: "String",
                    _info: "Group of ThermoPoleDest this pole belongs to"
                },
                spawnCondition: {
                    _type: "VarCondition",
                    _info: "Condition for prop to appear",
                    _popup: true
                }
            }
        }),
        init: function(x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.VIRTUAL;
            this.coll.zGravityFactor = 1E3;
            this.group = settings.group;
            if (settings.spawnCondition) {
                if (!spawnCondition) spawnCondition = new ig.VarCondition;
                spawnCondition.setCondition(settings.spawnCondition);
                this.active = spawnCondition.evaluate();
            } else this.active = true;
            this.data = sc.TERMO_POLE_TYPE[settings.poleType] || sc.TERMO_POLE_TYPE.SHORT;
            this.coll.setSize(this.data.size.x, this.data.size.y, this.data.size.z);
            Vec2.assignC(this.coll.padding, 4, 4);
            var mapStyle = ig.mapStyle.get("puzzle2");
            if (mapStyle) this.gfx = new ig.Image(mapStyle.sheet);
            this.charge.timer = new ig.WeightTimer(false);
            sc.ElementPoleGroups.registerPole(this);
        },
        onKill: function(entity) {
            sc.ElementPoleGroups.deleteGroup(this.group);
            if (this.gfx) this.gfx.decreaseRef();
            this.parent(entity);
        },
        show: function(show) {
            this.parent(show);
            if (this.effects.hideHandle) {
                this.effects.hideHandle.stop();
                this.effects.hideHandle = null;
            }
            if (!show) {
                this.animState.alpha = 0;
                ig.game.effects.teleport.spawnOnTarget("showDefault", this, {});
            }
            this.active = true;
        },
        onHideRequest: function() {
            this.active = false;
            if (this.charge.state != ChargeState.NONE) this.discharge(true);
            this.effects.hideHandle = ig.game.effects.teleport.spawnOnTarget("hideDefault", this, {
                callback: this
            });
        },
        onEffectEvent: function(effect) {
            if (effect == this.effects.hideHandle && effect.isDone()) {
                this.effects.hideHandle = null;
                this.hide();
            }
        },
        initSprites: function() {
            this.setSpriteCount(3);
        },
        update: function() {
            if (this.charge.state != ChargeState.NONE) {
                this.charge.timer.tick();
                if (this.charge.state.timed && this.charge.timer.done())
                    this.charge.state == ChargeState.DISCHARGE ? this.charge.state = ChargeState.NONE : this.discharge();
            }
            this.parent();
        },
        updateSprites: function() {
            if (!this.gfx) return;
            var src = this.data.src,
                mainSprite = this.sprites[0],
                sizeY = this.coll.size.y + this.coll.size.z;
            mainSprite.setEntityDefault(this, 16, sizeY, "NO_EXPAND", 1, null, this.gfx, src.x, src.y);
            mainSprite.setAlpha(this.animState.alpha);
            var chargeSprite = this.sprites[1],
                glowSprite = this.sprites[2];
            if (this.charge.state == ChargeState.DISCHARGE) {
                var elementOffset = this.charge.prevElement * 16;
                chargeSprite.setEntityDefault(this, 16, sizeY, "NO_EXPAND", 1, null, this.gfx, src.x + elementOffset, src.y);
                sizeY = chargeSprite.size.y + chargeSprite.size.z;
                var cut = Math.round(this.charge.timer.get() * sizeY);
                chargeSprite.setGfxCut(cut, 0);
                chargeSprite.setAlpha(this.animState.alpha);
                chargeSprite.renderMode = "lighter";
                glowSprite.setInvisible();
            } else if (this.charge.element) {
                elementOffset = this.charge.element * 16;
                var time = this.charge.timer.getTimePassed(),
                    alphaBase = 0.3,
                    freq = 4;
                if (this.charge.state.blink) {
                    alphaBase = 0.5;
                    freq = 8;
                }
                time = (1 - alphaBase + alphaBase / 2 * Math.sin(Math.PI * 2 * time * freq)) * (4 * time * freq).limit(0, 1);
                chargeSprite.setGfxCut(0, 0);
                chargeSprite.setEntityDefault(this, 16, sizeY, "NO_EXPAND", 1, null, this.gfx, src.x + elementOffset, src.y);
                chargeSprite.renderMode = "lighter";
                chargeSprite.setAlpha(Math.min(time * 2, 1) * this.animState.alpha);
                if (time > 0.5) {
                    glowSprite.setEntityDefault(this, 16, sizeY, "NO_EXPAND", 1, null, this.gfx, src.x + elementOffset, src.y);
                    glowSprite.renderMode = "lighter";
                    glowSprite.setAlpha(time * 2 - 1);
                } else glowSprite.setInvisible();
            } else {
                chargeSprite.setInvisible();
                glowSprite.setInvisible();
            }
            this.animState.updateSpriteColor(this);
        },
        chargeElement: function(element, isHigh, state, silent) {
            if (this.active) {
                this.charge.prevElement = this.charge.element;
                this.charge.element = element;
                if (!silent && (state != this.charge.state || this.charge.prevElement != this.charge.element)) this.showEffect(element, isHigh, state);
                this.charge.timer.set(8, ig.TIMER_MODE.ONCE);
                this.charge.state = state;
                if (!this.charge.lightHandles.length)
                    if (this.data.changeHeight) {
                        this.addLight(4 - this.data.changeHeight / 2);
                        this.addLight(4 + this.data.changeHeight / 2);
                    } else this.addLight(4);
            }
        },
        resetTimer: function(time) {
            if (this.charge.state == ChargeState.TMP) this.charge.timer.setRemainingTime(time);
        },
        addLight: function(zOffset) {
            if (this.active) {
                var handle = new ig.LightHandle(this, ig.LIGHT_SIZE.XL, 0.1, 0.3, -1, 1, false);
                handle.setOffset(0, 0, zOffset);
                ig.light.addLightHandle(handle);
                this.charge.lightHandles.push(handle);
            }
        },
        discharge: function(silent) {
            if (this.effects.handle) this.effects.handle.stop();
            if (!silent) this.effects.sheet.spawnOnTarget("discharge", this);
            this.effects.handle = null;
            this.charge.timer.set(0.5, ig.TIMER_MODE.ONCE);
            this.charge.prevElement = this.charge.element;
            this.charge.element = 0;
            this.charge.state = ChargeState.DISCHARGE;
            for (var i = this.charge.lightHandles.length; i--;) this.charge.lightHandles[i].stop();
            this.charge.lightHandles.length = 0;
        },
        showEffect: function(element, isHigh, state) {
            var effectName = elementEffects[element] + "Circle" + (isHigh ? "Down" : "Up");
            this.effects.sheet.spawnOnTarget(effectName, this, {
                offset: { z: 12 }
            });
            if (state == ChargeState.TMP) {
                if (this.effects.handle) this.effects.handle.stop();
                effectName = elementEffects[element] + "Temp";
                this.effects.handle = this.effects.sheet.spawnOnTarget(effectName, this, {
                    offset: {
                        x: 1,
                        z: this.data.changeHeight ? 12 + this.data.changeHeight : 12
                    },
                    duration: -1
                });
            }
        },
        ballHit: function(ball) {
            if (!this.active) return false;
            if (!ball.isBall || ball.party != sc.COMBATANT_PARTY.PLAYER) return false;
            var element = ball.getElement();
            if (!sc.ElementPoleGroups.onPoleHit(this, ball, this.charge.element == element)) {
                sc.combat.showHitEffect(this, ball.getHitCenter(this), sc.ATTACK_TYPE.NONE, ball.getElement(), false, false, true);
                return true;
            }
            var isHigh = false;
            if (this.charge.state != ChargeState.TMP) ball.cleanDirection(0.015);
            if (this.data.changeHeight) {
                isHigh = ball.coll.pos.z > this.coll.pos.z + this.coll.size.z / 2;
                var grabPoint = ig.CollTools.getCenterXYAlignedPos(tmpVec, ball.coll, this.coll);
                grabPoint.z = isHigh ? this.coll.pos.z + 12 : this.coll.pos.z + this.data.changeHeight + 12;
                ball.grabPoint(grabPoint, 0.5);
            }
            this.chargeElement(element, isHigh, sc.ElementPoleGroups.getChargeState(this));
            if (this.charge.element != this.charge.prevElement) {
                if (this.charge.state == ChargeState.GROUP) return true;
                if (ball.timer < 0.2) ball.resetTime(0.2);
            }
            ball.addIgnore(this);
            return false;
        },
        onComplete: function() {
            if (this.effects.handle) this.effects.handle.stop();
            this.effects.handle = null;
            this.chargeElement(this.charge.element, false, ChargeState.GROUP);
        },
        onDestInit: function(element) {
            this.chargeElement(element, false, ChargeState.GROUP, true);
        },
        onFinalize: function() {},
        onCancel: function() {
            if (this.charge.element) this.discharge();
        },
        isBallAdjust: function() {
            if (this.active) return this.data.changeHeight;
        },
        doBallAdjust: function(ball, x, z, fallback) {
            if (x != Constants.BALL_SIZE) return 0;
            var isHigh = z > this.coll.pos.z + this.coll.size.z / 2;
            this.getCenter(ball);
            ball.z = isHigh ? this.coll.pos.z + 12 : this.coll.pos.z + this.data.changeHeight + 12;
            return fallback;
        },
        isBallDestroyer: function() {
            return false;
        }
    });
    var DestState = {
        OFF: 1,
        CHARGING: 2,
        ON: 3
    };
    ig.ENTITY.ElementPoleDest = ig.AnimatedEntity.extend({
        group: null,
        element: null,
        state: DestState.OFF,
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                group: {
                    _type: "String",
                    _info: "Group of ThermoPoleDest this pole belongs to"
                },
                element: {
                    _type: "String",
                    _info: "Element of Destination",
                    _select: ["HEAT", "COLD", "SHOCK", "WAVE"]
                },
                variable: {
                    _type: "VarName",
                    _info: "Variable to be se to true when switch is activated"
                },
                activeTime: {
                    _type: "Number",
                    _info: "If >0: only keep switch active for said amount of time"
                }
            }
        }),
        effects: {
            sheet: new ig.EffectSheet("puzzle.thermo-pole"),
            handle: null,
            lightHandle: null
        },
        init: function(x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.VIRTUAL;
            this.coll.setSize(16, 16, 0);
            this.coll.zGravityFactor = 1E3;
            this.group = settings.group;
            this.element = sc.ELEMENT[settings.element] || sc.ELEMENT.HEAT;
            this.variable = settings.variable;
            this.activeTime = settings.activeTime;
            var mapStyle = ig.mapStyle.get("puzzle2");
            this.initAnimations({
                sheet: {
                    src: mapStyle.sheet,
                    width: 16,
                    height: 16,
                    offX: 0,
                    offY: 240
                },
                SUB: [{
                    time: 0.1,
                    frames: [0],
                    repeat: true,
                    SUB: [{ name: "off" }, { name: "tmpOn" }, { name: "tmpOnEnd" }, { name: "on" }]
                }, {
                    tileOffset: this.element * 2 - 1,
                    repeat: true,
                    SUB: [{
                        name: "off",
                        time: 0.3,
                        frames: [0, 0, 0, 0],
                        framesGfxOffset: [0, 1, 0, 0, 0, -1, 0, 0]
                    }, {
                        name: "tmpOn",
                        time: 0.1,
                        frames: [1, 1, 1, 1],
                        framesAlpha: [1, 0.66, 0.33, 0.66, 1]
                    }, {
                        name: "tmpOnEnd",
                        time: 0.033,
                        frames: [1, 1, 1, 1],
                        framesAlpha: [1, 0.5, 0.25, 0.5, 1]
                    }, {
                        name: "on",
                        time: 0.1,
                        frames: [1, 1, 1, 1],
                        framesAlpha: [1, 0.9, 0.8, 0.9, 1]
                    }]
                }]
            });
            var isOn = ig.vars.get(this.variable);
            if (isOn) {
                this.turnOnGfx();
                this.state = DestState.ON;
            }
            sc.ElementPoleGroups.registerDest(this, isOn);
        },
        onKill: function(entity) {
            if (this.timer) this.turnOff();
            sc.ElementPoleGroups.deleteGroup(this.group);
            this.parent(entity);
        },
        update: function() {
            if (this.timer) {
                this.timer = this.timer - ig.system.tick;
                if (this.timer <= 1 && this.currentAnim != "tmpOnEnd") this.setCurrentAnim("tmpOnEnd");
                if (this.timer <= 0) {
                    this.timer = 0;
                    sc.ElementPoleGroups.onGroupChargeCancel(this);
                    this.turnOff();
                }
            }
            if (this.state == DestState.CHARGING && sc.ElementPoleGroups.onCancelCheck(this)) {
                this.state = DestState.OFF;
                this.setCurrentAnim("off", true);
            }
            this.parent();
        },
        isOn: function() {
            return this.state == DestState.ON;
        },
        onPoleHit: function(pole, groupComplete, poles) {
            var effectName = elementEffects[this.element] + "Charge";
            this.state = groupComplete ? DestState.ON : DestState.CHARGING;
            if (pole.effects.handle) pole.effects.handle.stop();
            if (groupComplete) {
                for (var i = poles.length; i--;) {
                    var handle = this.effects.sheet.spawnOnTarget(effectName, this, {
                        target2: poles[i],
                        target2Align: ig.ENTITY_ALIGN.TOP
                    });
                    if (poles[i] == pole) {
                        handle.setCallback(this);
                        this.effects.handle = handle;
                    }
                }
            } else pole.effects.handle = this.effects.sheet.spawnOnTarget(effectName + "Prepare", this, {
                target2: pole,
                target2Align: ig.ENTITY_ALIGN.TOP,
                duration: -1
            });
        },
        onEffectEvent: function(effect) {
            if (effect.state == ig.EFFECT_STATE.POST_LOOP) this.turnOn();
        },
        onCancel: function() {
            this.turnOff();
        },
        turnOn: function() {
            this.effects.handle = null;
            sc.ElementPoleGroups.onFinalizeGroup(this);
            this.effects.sheet.spawnOnTarget(elementEffects[this.element] + "Activate", this);
            ig.vars.set(this.variable, true);
            this.turnOnGfx();
        },
        turnOnGfx: function() {
            if (!this.effects.lightHandle) {
                var handle = new ig.LightHandle(this, ig.LIGHT_SIZE.L, 0.1, 0.1, -1, 1, false);
                handle.setOffset(0, 0, 0);
                ig.light.addLightHandle(handle);
                this.effects.lightHandle = handle;
            }
            if (this.activeTime) {
                this.timer = this.activeTime / sc.options.get("assist-puzzle-speed");
                this.setCurrentAnim("tmpOn", true);
            } else this.setCurrentAnim("on", true);
        },
        turnOff: function() {
            if (this.effects.lightHandle) this.effects.lightHandle.stop();
            this.effects.lightHandle = null;
            ig.vars.set(this.variable, false);
            if (this.effects.handle) this.effects.handle.setCallback(null);
            this.effects.handle = null;
            this.timer = 0;
            this.state = DestState.OFF;
            this.setCurrentAnim("off", true);
        }
    });
    var elementEffects = {};
    elementEffects[sc.ELEMENT.HEAT] = "flame";
    elementEffects[sc.ELEMENT.COLD] = "ice";
    elementEffects[sc.ELEMENT.SHOCK] = "shock";
    elementEffects[sc.ELEMENT.WAVE] = "wave";
    var PoleSize = {
        ALL: 0,
        SMALL: 1,
        TALL: 2
    };
    sc.COMBAT_POI.ELEMENT_POLE = {
        _wm: {
            attributes: {
                element: {
                    _type: "String",
                    _info: "Element the pole is charged to",
                    _select: sc.ELEMENT
                },
                size: {
                    _type: "String",
                    _info: "Type of Pole to select",
                    _select: PoleSize
                }
            }
        },
        filterEntities: function(result, entities, settings) {
            for (var element = sc.ELEMENT[settings.element], size = PoleSize[settings.size], i = entities.length; i--;) {
                var entity = entities[i];
                if (entity instanceof ig.ENTITY.ElementPole &&
                    !(entity.charge.state != ChargeState.TMP && entity.charge.state != ChargeState.GROUP) &&
                    entity.charge.element == element &&
                    !(size == PoleSize.SMALL && entity.data.changeHeight) &&
                    (size != PoleSize.TALL || entity.data.changeHeight))
                    result.push(entity);
            }
            return result;
        }
    };
});
ig.baked = !0;

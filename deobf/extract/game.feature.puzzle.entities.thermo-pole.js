ig.module("game.feature.puzzle.entities.thermo-pole").requires("impact.base.entity", "impact.feature.effect.effect-sheet", "game.feature.combat.combat-poi").defines(function() {
    var b = Vec3.create();
    sc.ElementPoleGroups = {
        groups: {},
        registerDest: function(a, b) {
            if (a.group) {
                var c = this.getGroup(a.group);
                c.dests[a.element] = a;
                if (b) {
                    c.currentDest = a;
                    for (var d = c.hitCount = c.poles.length; d--;) c.poles[d].onDestInit(a.element)
                }
            }
        },
        registerPole: function(a) {
            if (a.group) {
                var b = this.getGroup(a.group);
                b.poles.push(a);
                if (b.currentDest) {
                    b.hitCount =
                        b.poles.length;
                    a.onDestInit(b.currentDest.element)
                }
            }
        },
        getGroup: function(a) {
            this.groups[a] || (this.groups[a] = {
                dests: {},
                poles: [],
                currentBall: null,
                currentDest: null,
                hitCount: 0
            });
            return this.groups[a]
        },
        deleteGroup: function(a) {
            a && delete this.groups[a]
        },
        onPoleHit: function(a, b, c) {
            if (a.active) {
                var d = b.getElement();
                if (!d) return false;
                if (!a.group) return true;
                var e = this.getGroup(a.group),
                    d = e.dests[d] || null;
                if (e.currentBall && e.currentBall != b && !c || e.currentDest && e.currentDest != d) {
                    this.onGroupChargeCancel(a);
                    c = false
                }
                if (d &&
                    !d.isOn()) {
                    if (c || e.hitCount >= e.poles.length) return true;
                    e.currentBall = b;
                    e.currentDest = d;
                    e.hitCount++;
                    b = e.hitCount == e.poles.length;
                    d.onPoleHit(a, b, e.poles);
                    if (b)
                        for (b = e.poles.length; b--;) {
                            c = e.poles[b];
                            if (a != c) c.onComplete()
                        }
                }
                return true
            }
        },
        getChargeState: function(b) {
            if (!b.group) return a.TMP;
            b = this.getGroup(b.group);
            return !b.currentDest ? a.TMP : b.hitCount < b.poles.length ? a.PENDING : a.GROUP
        },
        onFinalizeGroup: function(a) {
            a = this.getGroup(a.group);
            a.currentBall = null;
            for (var b = a.poles.length; b--;) a.poles[b].onFinalize()
        },
        onCancelCheck: function(a) {
            a = this.getGroup(a.group);
            if (a.hitCount == a.poles.length) return false;
            if (a.currentBall._killed) {
                a.currentBall = null;
                a.hitCount = 0;
                for (var b = a.poles.length; b--;) a.poles[b].onCancel();
                return true
            }
            return false
        },
        onGroupChargeCancel: function(a) {
            if (!a.group) return null;
            var b = this.getGroup(a.group);
            b.currentDest.onCancel();
            b.currentDest = null;
            b.hitCount = 0;
            b.currentBall = null;
            for (var c = b.poles.length; c--;) {
                var d = b.poles[c];
                if (d != a) d.onCancel()
            }
        }
    };
    sc.TERMO_POLE_TYPE = {};
    sc.TERMO_POLE_TYPE.LONG = {
        size: {
            x: 16,
            y: 16,
            z: 48
        },
        src: {
            x: 0,
            y: 144
        },
        changeHeight: 32
    };
    sc.TERMO_POLE_TYPE.LONG_64 = {
        size: {
            x: 16,
            y: 16,
            z: 80
        },
        src: {
            x: 80,
            y: 144
        },
        changeHeight: 64
    };
    sc.TERMO_POLE_TYPE.SHORT = {
        size: {
            x: 16,
            y: 16,
            z: 16
        },
        src: {
            x: 0,
            y: 208
        }
    };
    var a = {
            NONE: {
                timed: false
            },
            TMP: {
                timed: true,
                blink: true
            },
            PENDING: {
                timed: false,
                blink: true
            },
            GROUP: {
                timed: false
            },
            DISCHARGE: {
                timed: true
            }
        },
        d = null;
    ig.ENTITY.ElementPole = ig.AnimatedEntity.extend({
        data: null,
        gfx: null,
        group: null,
        active: false,
        charge: {
            state: a.NONE,
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
        init: function(a, b, c, e) {
            this.parent(a, b, c, e);
            this.coll.type = ig.COLLTYPE.VIRTUAL;
            this.coll.zGravityFactor = 1E3;
            this.group = e.group;
            if (e.spawnCondition) {
                d ||
                    (d = new ig.VarCondition);
                d.setCondition(e.spawnCondition);
                this.active = d.evaluate()
            } else this.active = true;
            this.data = sc.TERMO_POLE_TYPE[e.poleType] || sc.TERMO_POLE_TYPE.SHORT;
            this.coll.setSize(this.data.size.x, this.data.size.y, this.data.size.z);
            Vec2.assignC(this.coll.padding, 4, 4);
            if (a = ig.mapStyle.get("puzzle2")) this.gfx = new ig.Image(a.sheet);
            this.charge.timer = new ig.WeightTimer(false);
            sc.ElementPoleGroups.registerPole(this)
        },
        onKill: function(a) {
            sc.ElementPoleGroups.deleteGroup(this.group);
            this.gfx && this.gfx.decreaseRef();
            this.parent(a)
        },
        show: function(a) {
            this.parent(a);
            if (this.effects.hideHandle) {
                this.effects.hideHandle.stop();
                this.effects.hideHandle = null
            }
            if (!a) {
                this.animState.alpha = 0;
                ig.game.effects.teleport.spawnOnTarget("showDefault", this, {})
            }
            this.active = true
        },
        onHideRequest: function() {
            this.active = false;
            this.charge.state != a.NONE && this.discharge(true);
            this.effects.hideHandle = ig.game.effects.teleport.spawnOnTarget("hideDefault", this, {
                callback: this
            })
        },
        onEffectEvent: function(a) {
            if (a == this.effects.hideHandle && a.isDone()) {
                this.effects.hideHandle =
                    null;
                this.hide()
            }
        },
        initSprites: function() {
            this.setSpriteCount(3)
        },
        update: function() {
            if (this.charge.state != a.NONE) {
                this.charge.timer.tick();
                if (this.charge.state.timed && this.charge.timer.done()) this.charge.state == a.DISCHARGE ? this.charge.state = a.NONE : this.discharge()
            }
            this.parent()
        },
        updateSprites: function() {
            if (this.gfx) {
                var b = this.data.src,
                    c = this.sprites[0],
                    d = this.coll.size.y + this.coll.size.z;
                c.setEntityDefault(this, 16, d, "NO_EXPAND", 1, null, this.gfx, b.x, b.y);
                c.setAlpha(this.animState.alpha);
                var c = this.sprites[1],
                    e = this.sprites[2];
                if (this.charge.state == a.DISCHARGE) {
                    var f = this.charge.prevElement * 16;
                    c.setEntityDefault(this, 16, d, "NO_EXPAND", 1, null, this.gfx, b.x + f, b.y);
                    d = c.size.y + c.size.z;
                    b = Math.round(this.charge.timer.get() * d);
                    c.setGfxCut(b, 0);
                    c.setAlpha(this.animState.alpha);
                    c.renderMode = "lighter";
                    e.setInvisible()
                } else if (this.charge.element) {
                    var f = this.charge.element * 16,
                        l = this.charge.timer.getTimePassed(),
                        o = 0.3,
                        m = 4;
                    if (this.charge.state.blink) {
                        o = 0.5;
                        m = 8
                    }
                    l = (1 - o + o / 2 * Math.sin(Math.PI * 2 * l * m)) * (4 * l * m).limit(0, 1);
                    c.setGfxCut(0, 0);
                    c.setEntityDefault(this, 16, d, "NO_EXPAND", 1, null, this.gfx, b.x + f, b.y);
                    c.renderMode = "lighter";
                    c.setAlpha(Math.min(l * 2, 1) * this.animState.alpha);
                    if (l > 0.5) {
                        e.setEntityDefault(this, 16, d, "NO_EXPAND", 1, null, this.gfx, b.x + f, b.y);
                        e.renderMode = "lighter";
                        e.setAlpha(l * 2 - 1)
                    } else e.setInvisible()
                } else {
                    c.setInvisible();
                    e.setInvisible()
                }
                this.animState.updateSpriteColor(this)
            }
        },
        chargeElement: function(a, b, c, d) {
            if (this.active) {
                this.charge.prevElement = this.charge.element;
                this.charge.element = a;
                !d && (c != this.charge.state ||
                    this.charge.prevElement != this.charge.element) && this.showEffect(a, b, c);
                this.charge.timer.set(8, ig.TIMER_MODE.ONCE);
                this.charge.state = c;
                if (!this.charge.lightHandles.length)
                    if (this.data.changeHeight) {
                        this.addLight(4 - this.data.changeHeight / 2);
                        this.addLight(4 + this.data.changeHeight / 2)
                    } else this.addLight(4)
            }
        },
        resetTimer: function(b) {
            this.charge.state == a.TMP && this.charge.timer.setRemainingTime(b)
        },
        addLight: function(a) {
            if (this.active) {
                var b = new ig.LightHandle(this, ig.LIGHT_SIZE.XL, 0.1, 0.3, -1, 1, false);
                b.setOffset(0,
                    0, a);
                ig.light.addLightHandle(b);
                this.charge.lightHandles.push(b)
            }
        },
        discharge: function(b) {
            this.effects.handle && this.effects.handle.stop();
            b || this.effects.sheet.spawnOnTarget("discharge", this);
            this.effects.handle = null;
            this.charge.timer.set(0.5, ig.TIMER_MODE.ONCE);
            this.charge.prevElement = this.charge.element;
            this.charge.element = 0;
            this.charge.state = a.DISCHARGE;
            for (b = this.charge.lightHandles.length; b--;) this.charge.lightHandles[b].stop();
            this.charge.lightHandles.length = 0
        },
        showEffect: function(b, c, d) {
            c = e[b] +
                "Circle" + (c ? "Down" : "Up");
            this.effects.sheet.spawnOnTarget(c, this, {
                offset: {
                    z: 12
                }
            });
            if (d == a.TMP) {
                this.effects.handle && this.effects.handle.stop();
                c = e[b] + "Temp";
                this.effects.handle = this.effects.sheet.spawnOnTarget(c, this, {
                    offset: {
                        x: 1,
                        z: this.data.changeHeight ? 12 + this.data.changeHeight : 12
                    },
                    duration: -1
                })
            }
        },
        ballHit: function(c) {
            if (this.active) {
                if (!c.isBall || c.party != sc.COMBATANT_PARTY.PLAYER) return false;
                var d = c.getElement();
                if (!sc.ElementPoleGroups.onPoleHit(this, c, this.charge.element == d)) {
                    sc.combat.showHitEffect(this,
                        c.getHitCenter(this), sc.ATTACK_TYPE.NONE, c.getElement(), false, false, true);
                    return true
                }
                var e = false;
                this.charge.state != a.TMP && c.cleanDirection(0.015);
                if (this.data.changeHeight) {
                    var e = c.coll.pos.z > this.coll.pos.z + this.coll.size.z / 2,
                        f = ig.CollTools.getCenterXYAlignedPos(b, c.coll, this.coll);
                    f.z = e ? this.coll.pos.z + 12 : this.coll.pos.z + this.data.changeHeight + 12;
                    c.grabPoint(f, 0.5)
                }
                this.chargeElement(d, e, sc.ElementPoleGroups.getChargeState(this));
                if (this.charge.element != this.charge.prevElement) {
                    if (this.charge.state ==
                        a.GROUP) return true;
                    c.timer < 0.2 && c.resetTime(0.2)
                }
                c.addIgnore(this);
                return false
            }
        },
        onComplete: function() {
            this.effects.handle && this.effects.handle.stop();
            this.effects.handle = null;
            this.chargeElement(this.charge.element, false, a.GROUP)
        },
        onDestInit: function(b) {
            this.chargeElement(b, false, a.GROUP, true)
        },
        onFinalize: function() {},
        onCancel: function() {
            this.charge.element && this.discharge()
        },
        isBallAdjust: function() {
            if (this.active) return this.data.changeHeight
        },
        doBallAdjust: function(a, b, c, d) {
            if (c.x != Constants.BALL_SIZE) return 0;
            b = a.z > this.coll.pos.z + this.coll.size.z / 2;
            this.getCenter(a);
            a.z = b ? this.coll.pos.z + 12 : this.coll.pos.z + this.data.changeHeight + 12;
            return d
        },
        isBallDestroyer: function() {
            return false
        }
    });
    var c = {
        OFF: 1,
        CHARGING: 2,
        ON: 3
    };
    ig.ENTITY.ElementPoleDest = ig.AnimatedEntity.extend({
        group: null,
        element: null,
        state: c.OFF,
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
                    _select: ["HEAT", "COLD", "SHOCK",
                        "WAVE"
                    ]
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
        init: function(a, b, d, e) {
            this.parent(a, b, d, e);
            this.coll.type = ig.COLLTYPE.VIRTUAL;
            this.coll.setSize(16, 16, 0);
            this.coll.zGravityFactor = 1E3;
            this.group = e.group;
            this.element = sc.ELEMENT[e.element] || sc.ELEMENT.HEAT;
            this.variable = e.variable;
            this.activeTime = e.activeTime;
            a = ig.mapStyle.get("puzzle2");
            this.initAnimations({
                sheet: {
                    src: a.sheet,
                    width: 16,
                    height: 16,
                    offX: 0,
                    offY: 240
                },
                SUB: [{
                    time: 0.1,
                    frames: [0],
                    repeat: true,
                    SUB: [{
                        name: "off"
                    }, {
                        name: "tmpOn"
                    }, {
                        name: "tmpOnEnd"
                    }, {
                        name: "on"
                    }]
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
                        framesAlpha: [1, 0.5, 0.25, 0.5,
                            1
                        ]
                    }, {
                        name: "on",
                        time: 0.1,
                        frames: [1, 1, 1, 1],
                        framesAlpha: [1, 0.9, 0.8, 0.9, 1]
                    }]
                }]
            });
            if (a = ig.vars.get(this.variable)) {
                this.turnOnGfx();
                this.state = c.ON
            }
            sc.ElementPoleGroups.registerDest(this, a)
        },
        onKill: function(a) {
            this.timer && this.turnOff();
            sc.ElementPoleGroups.deleteGroup(this.group);
            this.parent(a)
        },
        update: function() {
            if (this.timer) {
                this.timer = this.timer - ig.system.tick;
                this.timer <= 1 && this.currentAnim != "tmpOnEnd" && this.setCurrentAnim("tmpOnEnd");
                if (this.timer <= 0) {
                    this.timer = 0;
                    sc.ElementPoleGroups.onGroupChargeCancel(this);
                    this.turnOff()
                }
            }
            if (this.state == c.CHARGING && sc.ElementPoleGroups.onCancelCheck(this)) {
                this.state = c.IDLE;
                this.setCurrentAnim("off", true)
            }
            this.parent()
        },
        isOn: function() {
            return this.state == c.ON
        },
        onPoleHit: function(a, b, d) {
            var f = e[this.element] + "Charge";
            this.state = b ? c.ON : c.CHARGING;
            a.effects.handle && a.effects.handle.stop();
            if (b)
                for (b = d.length; b--;) {
                    var k = this.effects.sheet.spawnOnTarget(f, this, {
                        target2: d[b],
                        target2Align: ig.ENTITY_ALIGN.TOP
                    });
                    if (d[b] == a) {
                        k.setCallback(this);
                        this.effects.handle = k
                    }
                } else a.effects.handle =
                    this.effects.sheet.spawnOnTarget(f + "Prepare", this, {
                        target2: a,
                        target2Align: ig.ENTITY_ALIGN.TOP,
                        duration: -1
                    })
        },
        onEffectEvent: function(a) {
            a.state == ig.EFFECT_STATE.POST_LOOP && this.turnOn()
        },
        onCancel: function() {
            this.turnOff()
        },
        turnOn: function() {
            this.effects.handle = null;
            sc.ElementPoleGroups.onFinalizeGroup(this);
            this.effects.sheet.spawnOnTarget(e[this.element] + "Activate", this);
            ig.vars.set(this.variable, true);
            this.turnOnGfx()
        },
        turnOnGfx: function() {
            if (!this.effects.lightHandle) {
                var a = new ig.LightHandle(this,
                    ig.LIGHT_SIZE.L, 0.1, 0.1, -1, 1, false);
                a.setOffset(0, 0, 0);
                ig.light.addLightHandle(a);
                this.effects.lightHandle = a
            }
            if (this.activeTime) {
                this.timer = this.activeTime / sc.options.get("assist-puzzle-speed");
                this.setCurrentAnim("tmpOn", true)
            } else this.setCurrentAnim("on", true)
        },
        turnOff: function() {
            this.effects.lightHandle && this.effects.lightHandle.stop();
            this.effects.lightHandle = null;
            ig.vars.set(this.variable, false);
            this.effects.handle && this.effects.handle.setCallback(null);
            this.effects.handle = null;
            this.timer = 0;
            this.state = c.OFF;
            this.setCurrentAnim("off", true)
        }
    });
    var e = {};
    e[sc.ELEMENT.HEAT] = "flame";
    e[sc.ELEMENT.COLD] = "ice";
    e[sc.ELEMENT.SHOCK] = "shock";
    e[sc.ELEMENT.WAVE] = "wave";
    var f = {
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
                    _select: f
                }
            }
        },
        filterEntities: function(b, c, d) {
            for (var e = sc.ELEMENT[d.element], d = f[d.size], k = c.length; k--;) {
                var l = c[k];
                l instanceof
                ig.ENTITY.ElementPole && !(l.charge.state != a.TMP && l.charge.state != a.GROUP) && l.charge.element == e && !(d == f.SMALL && l.data.changeHeight) && (d != f.TALL || l.data.changeHeight) && b.push(l)
            }
            return b
        }
    }
});
ig.baked = !0;

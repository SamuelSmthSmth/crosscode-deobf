ig.module("game.feature.puzzle.entities.floor-switch").requires("impact.base.entity", "impact.feature.effect.effect-sheet").defines(function() {
    sc.FLOOR_SWITCH_TYPE = {
        PERMANENT: {
            permanent: true
        },
        WHILE_ON_TOP: {
            delay: 0
        },
        UNDOABLE: {
            permanent: true,
            undoable: true
        }
    };
    ig.ENTITY.FloorSwitch = ig.AnimatedEntity.extend({
        hitCondition: null,
        ballDestroyer: true,
        switchType: null,
        variable: "",
        isOn: false,
        lockCondition: null,
        setOnDelay: 0,
        effects: {
            sheet: new ig.EffectSheet("puzzle")
        },
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                spawnCondition: {
                    _type: "VarCondition",
                    _info: "Condition for Anti Compressor to spawn",
                    _popup: true,
                    _optional: true
                },
                switchType: {
                    _type: "String",
                    _info: "Type of floor switch",
                    _select: sc.FLOOR_SWITCH_TYPE
                },
                variable: {
                    _type: "VarName",
                    _info: "Variable to be increased by 1 when switch is activated. IMPORTANT: MUST BE TMP when switchType ist NOT PERMANENT!"
                },
                lockCondition: {
                    _type: "VarCondition",
                    _info: "If specified: Switch will always stick while condition is true",
                    _optional: true
                }
            },
            label: function() {
                return "[ " + this.variable + " ]"
            }
        }),
        init: function(b, a,
            d, c) {
            this.parent(b, a, d, c);
            this.coll.type = ig.COLLTYPE.BLOCK;
            this.coll.zGravityFactor = 1;
            this.coll.weight = -1;
            this.coll.time.globalStatic = true;
            this.coll.setSize(16, 16, 1);
            b = ig.mapStyle.get("puzzle2");
            this.initAnimations({
                sheet: {
                    src: b.sheet,
                    width: 16,
                    height: 16,
                    offX: 0,
                    offY: 48
                },
                SUB: [{
                    name: "off",
                    time: 1,
                    frames: [0],
                    repeat: false
                }, {
                    name: "on",
                    time: 1,
                    frames: [1],
                    repeat: false
                }]
            });
            this.switchType = sc.FLOOR_SWITCH_TYPE[c.switchType] || sc.FLOOR_SWITCH_TYPE.PERMANENT;
            this.variable = c.variable;
            if (c.lockCondition) this.lockCondition =
                new ig.VarCondition(c.lockCondition);
            ig.vars.setDefault(this.variable, 0);
            if (this.switchType.permanent) this.isOn = ig.vars.get(this.variable);
            if (!this.switchType.permanent && this.lockCondition && this.lockCondition.evaluate()) {
                this.isOn = true;
                ig.vars.add(this.variable, 1)
            }
            if (this.isOn) this.coll.size.z = 1;
            this.setCurrentAnim(this.isOn ? "on" : "off")
        },
        show: function(b) {
            this.parent(b);
            if (!b) {
                this.animState.alpha = 0;
                ig.game.effects.teleport.spawnOnTarget("showFast", this, {})
            }
        },
        onHideRequest: function() {
            ig.game.effects.teleport.spawnOnTarget("hideFast",
                this, {
                    callback: this
                })
        },
        onEffectEvent: function(b) {
            if (b.isDone()) {
                this.deactivate();
                this.hide()
            }
        },
        _isStillPressed: function() {
            var b = ig.game.getEntitiesOnTop(this),
                a = this.coll,
                a = ig.game.getEntitiesInRectangle(a.pos.x, a.pos.y, a.pos.z, a.size.x, a.size.y, a.size.z + 1, this);
            return this.checkEntityArraySupport(b) || this.checkEntityArraySupport(a)
        },
        update: function() {
            if ((this.isOn || this.setOnDelay) && !this.switchType.permanent && (!this.lockCondition || !this.lockCondition.evaluate())) this._isStillPressed() || this.deactivate();
            if (this.setOnDelay) {
                this.setOnDelay = this.setOnDelay - ig.system.tick;
                if (this.setOnDelay <= 0) {
                    this.setOnDelay = 0;
                    this.activate(true)
                }
            }
            this.parent()
        },
        activate: function(b) {
            if (!this.isOn)
                if (!b && this.switchType.delay) {
                    if (!this.setOnDelay) this.setOnDelay = this.switchType.delay
                } else {
                    this.setCurrentAnim("on");
                    this.isOn = true;
                    ig.vars.add(this.variable, 1);
                    this.effects.sheet.spawnOnTarget("floorSwitchActivate", this)
                }
        },
        deactivate: function() {
            this.setOnDelay = 0;
            if (this.isOn) {
                this.isOn = false;
                this.setCurrentAnim("off");
                this.switchType.undoable ? ig.vars.set(this.variable, 0) : ig.vars.sub(this.variable, 1);
                this.effects.sheet.spawnOnTarget("floorSwitchDeactivate", this)
            }
        },
        varsChanged: function() {
            if (this.isOn && (this.switchType.undoable && this.variable) && !ig.vars.get(this.variable)) {
                this.deactivate();
                this._isStillPressed() && this.activate()
            }
        },
        collideWith: function(b) {
            this.isEntitySupported(b) && this.activate()
        },
        onGroundAdd: function(b) {
            this.isEntitySupported(b) && this.activate()
        },
        checkEntityArraySupport: function(b) {
            for (var a = b.length; a--;)
                if (this.isEntitySupported(b[a])) return true;
            return false
        },
        isEntitySupported: function(b) {
            return b.isPlayer ? !this.isOn && !this.switchType.permanent && !ig.CollTools.isMinOverlap(this.coll, b.coll, 4, 4) ? false : true : b instanceof ig.ENTITY.PushPullBlock || b instanceof ig.ENTITY.WavePushPullBlock || b instanceof ig.ENTITY.SlidingBlock ? true : false
        }
    });
    sc.COMBAT_POI.FLOOR_SWITCH = {
        _wm: {
            attributes: {}
        },
        filterEntities: function(b, a) {
            for (var d = a.length; d--;) {
                var c = a[d];
                c instanceof ig.ENTITY.FloorSwitch && b.push(c)
            }
            return b
        }
    }
});
ig.baked = !0;

/**
 * game.feature.puzzle.entities.floor-switch
 * =========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.puzzle.entities.floor-switch")`.
 *
 * `ig.ENTITY.FloorSwitch`: a pressure switch activated by entities standing on
 * it (player or push-pull/sliding blocks). Comes in PERMANENT, WHILE_ON_TOP
 * (delayed) and UNDOABLE variants; increments a variable while active.
 */
ig.module("game.feature.puzzle.entities.floor-switch")
    .requires("impact.base.entity", "impact.feature.effect.effect-sheet")
    .defines(function () {

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
            label: function () {
                return "[ " + this.variable + " ]"
            }
        }),

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.BLOCK;
            this.coll.zGravityFactor = 1;
            this.coll.weight = -1;
            this.coll.time.globalStatic = true;
            this.coll.setSize(16, 16, 1);
            var puzzleStyle = ig.mapStyle.get("puzzle2");
            this.initAnimations({
                sheet: {
                    src: puzzleStyle.sheet,
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
            this.switchType = sc.FLOOR_SWITCH_TYPE[settings.switchType] || sc.FLOOR_SWITCH_TYPE.PERMANENT;
            this.variable = settings.variable;
            if (settings.lockCondition) this.lockCondition = new ig.VarCondition(settings.lockCondition);
            ig.vars.setDefault(this.variable, 0);
            if (this.switchType.permanent) this.isOn = ig.vars.get(this.variable);
            if (!this.switchType.permanent && this.lockCondition && this.lockCondition.evaluate()) {
                this.isOn = true;
                ig.vars.add(this.variable, 1)
            }
            if (this.isOn) this.coll.size.z = 1;
            this.setCurrentAnim(this.isOn ? "on" : "off")
        },

        show: function (show) {
            this.parent(show);
            if (!show) {
                this.animState.alpha = 0;
                ig.game.effects.teleport.spawnOnTarget("showFast", this, {})
            }
        },

        onHideRequest: function () {
            ig.game.effects.teleport.spawnOnTarget("hideFast", this, {
                callback: this
            })
        },

        onEffectEvent: function (effect) {
            if (effect.isDone()) {
                this.deactivate();
                this.hide()
            }
        },

        _isStillPressed: function () {
            var onTop = ig.game.getEntitiesOnTop(this),
                coll = this.coll,
                overlapping = ig.game.getEntitiesInRectangle(coll.pos.x, coll.pos.y, coll.pos.z, coll.size.x, coll.size.y, coll.size.z + 1, this);
            return this.checkEntityArraySupport(onTop) || this.checkEntityArraySupport(overlapping)
        },

        update: function () {
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

        activate: function (instant) {
            if (!this.isOn)
                if (!instant && this.switchType.delay) {
                    if (!this.setOnDelay) this.setOnDelay = this.switchType.delay
                } else {
                    this.setCurrentAnim("on");
                    this.isOn = true;
                    ig.vars.add(this.variable, 1);
                    this.effects.sheet.spawnOnTarget("floorSwitchActivate", this)
                }
        },

        deactivate: function () {
            this.setOnDelay = 0;
            if (this.isOn) {
                this.isOn = false;
                this.setCurrentAnim("off");
                this.switchType.undoable ? ig.vars.set(this.variable, 0) : ig.vars.sub(this.variable, 1);
                this.effects.sheet.spawnOnTarget("floorSwitchDeactivate", this)
            }
        },

        varsChanged: function () {
            if (this.isOn && (this.switchType.undoable && this.variable) && !ig.vars.get(this.variable)) {
                this.deactivate();
                this._isStillPressed() && this.activate()
            }
        },

        collideWith: function (entity) {
            this.isEntitySupported(entity) && this.activate()
        },

        onGroundAdd: function (entity) {
            this.isEntitySupported(entity) && this.activate()
        },

        checkEntityArraySupport: function (entities) {
            for (var i = entities.length; i--;)
                if (this.isEntitySupported(entities[i])) return true;
            return false
        },

        isEntitySupported: function (entity) {
            return entity.isPlayer ? !this.isOn && !this.switchType.permanent && !ig.CollTools.isMinOverlap(this.coll, entity.coll, 4, 4) ? false : true : entity instanceof ig.ENTITY.PushPullBlock || entity instanceof ig.ENTITY.WavePushPullBlock || entity instanceof ig.ENTITY.SlidingBlock ? true : false
        }
    });

    sc.COMBAT_POI.FLOOR_SWITCH = {
        _wm: {
            attributes: {}
        },
        filterEntities: function (out, entities) {
            for (var i = entities.length; i--;) {
                var entity = entities[i];
                entity instanceof ig.ENTITY.FloorSwitch && out.push(entity)
            }
            return out
        }
    }
});
ig.baked = !0;

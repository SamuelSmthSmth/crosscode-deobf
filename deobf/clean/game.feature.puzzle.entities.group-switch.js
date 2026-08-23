/**
 * game.feature.puzzle.entities.group-switch
 * =========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.puzzle.entities.group-switch")`.
 *
 * `ig.ENTITY.GroupSwitch`: a ball-hit switch that groups with others of the
 * same name. Once all switches in a group are hit within the active time,
 * they all toggle on. LOCAL mode resets individually; GLOBAL mode has one
 * master. Keeps count in `activeCountVar` and sets `activeBoolVar` when done.
 */
ig.module("game.feature.puzzle.entities.group-switch")
    .requires("impact.base.entity")
    .defines(function () {

    sc.GROUP_SWITCH_TYPE = {};
    sc.GROUP_SWITCH_UPDATE_TYPE = {};
    sc.GROUP_SWITCH_UPDATE_TYPE.LOCAL = 0;
    sc.GROUP_SWITCH_UPDATE_TYPE.GLOBAL = 1;

    var groupRegistry = {};

    ig.ENTITY.GroupSwitch = ig.AnimatedEntity.extend({
        hitCondition: null,
        ballDestroyer: true,
        activeCondition: null,
        group: null,
        updateType: sc.GROUP_SWITCH_UPDATE_TYPE.LOCAL,
        activeBoolVar: null,
        activeCountVar: null,
        activeZHeight: 0,
        firstTrigger: null,
        isOn: false,
        sounds: {
            hit: new ig.Sound("media/sound/battle/hit-7.ogg", 0.4),
            bing: new ig.Sound("media/sound/puzzle/switch-activate-2.ogg", 1)
        },
        time: 0,
        timer: 0,
        isSpinning: false,
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                switchType: {
                    _type: "String",
                    _info: "Type of Group Switch",
                    _select: sc.GROUP_SWITCH_TYPE
                },
                updateType: {
                    _type: "String",
                    _info: "Update type for the group switch",
                    _select: sc.GROUP_SWITCH_UPDATE_TYPE
                },
                group: {
                    _type: "String",
                    _info: "The associated group for this switch. Must be set for global type switches."
                },
                activeTime: {
                    _type: "Number",
                    _info: "the time the switch (or all switches in the group if global) stays active."
                },
                activeBoolVar: {
                    _type: "VarName",
                    _info: "Variable is set to true when all switches are activated"
                },
                activeCountVar: {
                    _type: "VarName",
                    _info: "This variable stored the number of active switches in this group"
                },
                firstTrigger: {
                    _type: "VarName",
                    _info: "Set to true when one of the first switches in a group is hit.",
                    _optional: true
                }
            },
            label: function () {
                return "[ " + this.activeBoolVar + " ]\n" + this.activeCountVar + "++"
            }
        }),

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.VIRTUAL;
            this.coll.time.globalStatic = true;
            var typeData = sc.GROUP_SWITCH_TYPE[settings.switchType];
            ig.mapStyle.get("switch");
            if (typeData) {
                Vec3.assign(this.coll.size, typeData.size);
                this.hitCondition = typeData.hitCondition;
                this.activeZHeight = typeData.activeZHeight;
                if (typeData.useStyleSheet) {
                    var puzzleStyle = ig.mapStyle.get("puzzle");
                    typeData.anims.sheet.src = puzzleStyle.sheet
                }
                this.initAnimations(typeData.anims)
            }
            this.updateType = sc.GROUP_SWITCH_UPDATE_TYPE[settings.updateType];
            this.group = settings.group;
            this.time = settings.activeTime;
            this.timer = 0;
            this.activeCondition = new ig.VarCondition(settings.activeCondition || "false");
            this.activeBoolVar = settings.activeBoolVar;
            this.activeCountVar = settings.activeCountVar;
            this.firstTrigger = settings.firstTrigger || null;
            this.activeCountVar && ig.vars.setDefault(this.activeCountVar, 0);
            ig.vars.setDefault(this.activeBoolVar, 0);
            groupRegistry[this.group] || (groupRegistry[this.group] = {
                entities: [],
                master: null,
                activeCount: 0
            });
            groupRegistry[this.group].entities.push(this);
            (this.isOn = ig.vars.get(this.activeBoolVar)) ? this.coll.size.z = this.activeZHeight : this.activeCountVar && ig.vars.set(this.activeCountVar, 0);
            this.setCurrentAnim(this.isOn ? "on" : "off")
        },

        onKill: function (parent) {
            this.isOn || this.activeCountVar && ig.vars.set(this.activeCountVar, 0);
            delete groupRegistry[this.group];
            this.parent(parent)
        },

        setOff: function () {
            this.setCurrentAnim("off", true, null, true, false);
            this.isSpinning = 0;
            this.isOn = false
        },

        setOn: function () {
            this.isOn = true;
            this.setCurrentAnim("switch", true, null, true, true)
        },

        update: function () {
            if (!this.isOn && this.timer) {
                this.timer = this.timer - ig.system.tick;
                if (this.timer <= 0) {
                    this.timer = 0;
                    var group = groupRegistry[this.group];
                    if (this.updateType == sc.GROUP_SWITCH_UPDATE_TYPE.LOCAL) {
                        this.activeCountVar && ig.vars.sub(this.activeCountVar, 1);
                        this.setOff();
                        group.activeCount--
                    } else if (this.updateType == sc.GROUP_SWITCH_UPDATE_TYPE.GLOBAL && this == group.master) {
                        this.activeCountVar && ig.vars.set(this.activeCountVar, 0);
                        for (var entityCount = group.entities.length; entityCount--;) group.entities[entityCount].setOff();
                        group.master = null;
                        group.activeCount = 0
                    }
                }
            }
            this.parent()
        },

        ballHit: function (ball) {
            if (!this.isOn && !this.isSpinning && this.hitCondition(this, ball)) {
                this.isSpinning = true;
                this.setCurrentAnim("spinning", true, null, true, false);
                sc.combat.showHitEffect(this, ball.getHitCenter(this), sc.ATTACK_TYPE.MASSIVE, ball.getElement(), false, false, true);
                ig.SoundHelper.playAtEntity(this.sounds.hit, this);
                ig.SoundHelper.playAtEntity(this.sounds.bing, this);
                var group = groupRegistry[this.group];
                this.timer = this.time / sc.options.get("assist-puzzle-speed");
                if (this.updateType == sc.GROUP_SWITCH_UPDATE_TYPE.GLOBAL && !group.master) {
                    group.master = this;
                    this.firstTrigger && ig.vars.set(this.firstTrigger, true)
                }
                group.activeCount++;
                this.activeCountVar && ig.vars.add(this.activeCountVar, 1);
                if (group.activeCount == group.entities.length) {
                    for (var entityCount = group.entities.length; entityCount--;) group.entities[entityCount].setOn();
                    ig.vars.set(this.activeBoolVar, true)
                }
            } else sc.combat.showHitEffect(this, ball.getHitCenter(this), sc.ATTACK_TYPE.NONE, ball.getElement(), false, false, true);
            return true
        },

        animationEnded: function (animName) {
            if (animName == "switch") {
                this.coll.size.z = this.activeZHeight;
                this.setCurrentAnim("switch_end", true, "on")
            }
        }
    });

    sc.GROUP_SWITCH_TYPE["default"] = {
        size: {
            x: 16,
            y: 16,
            z: 17
        },
        activeZHeight: 0,
        useStyleSheet: true,
        anims: {
            offset: {
                x: 0,
                y: 0,
                z: 0
            },
            sheet: {
                src: null,
                width: 16,
                height: 32
            },
            SUB: [{
                name: "off",
                time: 0.1,
                frames: [0, 1, 2, 3],
                repeat: true
            }, {
                name: "spinning",
                time: 0.03,
                frames: [4, 5, 6, 7],
                repeat: true
            }, {
                name: "switch",
                time: 0.03,
                frames: [8, 9, 10, 11, 8, 9, 10, 11, 8, 9, 10, 11, 8, 9, 10, 11, 8, 9, 10, 10, 11, 11, 11, 8, 8, 8, 8, 8, 12, 13],
                repeat: false
            }, {
                name: "switch_end",
                time: 0.1,
                frames: [14, 15],
                repeat: false
            }, {
                name: "on",
                time: 1,
                frames: [15],
                repeat: false
            }]
        },
        hitCondition: function (switchEntity, ball) {
            return ball.party == sc.COMBATANT_PARTY.PLAYER
        }
    }
});
ig.baked = !0;
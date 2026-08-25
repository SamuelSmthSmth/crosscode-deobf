ig.module("game.feature.puzzle.entities.group-switch").requires("impact.base.entity").defines(function() {
    sc.GROUP_SWITCH_TYPE = {};
    sc.GROUP_SWITCH_UPDATE_TYPE = {};
    sc.GROUP_SWITCH_UPDATE_TYPE.LOCAL = 0;
    sc.GROUP_SWITCH_UPDATE_TYPE.GLOBAL = 1;
    var b = {};
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
            hit: new ig.Sound("media/sound/battle/hit-7.ogg",
                0.4),
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
            label: function() {
                return "[ " + this.activeBoolVar + " ]\n" + this.activeCountVar + "++"
            }
        }),
        init: function(a, d, c, e) {
            this.parent(a, d, c, e);
            this.coll.type = ig.COLLTYPE.VIRTUAL;
            this.coll.time.globalStatic =
                true;
            a = sc.GROUP_SWITCH_TYPE[e.switchType];
            ig.mapStyle.get("switch");
            if (a) {
                Vec3.assign(this.coll.size, a.size);
                this.hitCondition = a.hitCondition;
                this.activeZHeight = a.activeZHeight;
                if (a.useStyleSheet) {
                    d = ig.mapStyle.get("puzzle");
                    a.anims.sheet.src = d.sheet
                }
                this.initAnimations(a.anims)
            }
            this.updateType = sc.GROUP_SWITCH_UPDATE_TYPE[e.updateType];
            this.group = e.group;
            this.time = e.activeTime;
            this.timer = 0;
            this.activeCondition = new ig.VarCondition(e.activeCondition || "false");
            this.activeBoolVar = e.activeBoolVar;
            this.activeCountVar =
                e.activeCountVar;
            this.firstTrigger = e.firstTrigger || null;
            this.activeCountVar && ig.vars.setDefault(this.activeCountVar, 0);
            ig.vars.setDefault(this.activeBoolVar, 0);
            b[this.group] || (b[this.group] = {
                entities: [],
                master: null,
                activeCount: 0
            });
            b[this.group].entities.push(this);
            (this.isOn = ig.vars.get(this.activeBoolVar)) ? this.coll.size.z = this.activeZHeight: this.activeCountVar && ig.vars.set(this.activeCountVar, 0);
            this.setCurrentAnim(this.isOn ? "on" : "off")
        },
        onKill: function(a) {
            this.isOn || this.activeCountVar && ig.vars.set(this.activeCountVar,
                0);
            delete b[this.group];
            this.parent(a)
        },
        setOff: function() {
            this.setCurrentAnim("off", true, null, true, false);
            this.isSpinning = 0;
            this.isOn = false
        },
        setOn: function() {
            this.isOn = true;
            this.setCurrentAnim("switch", true, null, true, true)
        },
        update: function() {
            if (!this.isOn && this.timer) {
                this.timer = this.timer - ig.system.tick;
                if (this.timer <= 0) {
                    this.timer = 0;
                    var a = b[this.group];
                    if (this.updateType == sc.GROUP_SWITCH_UPDATE_TYPE.LOCAL) {
                        this.activeCountVar && ig.vars.sub(this.activeCountVar, 1);
                        this.setOff();
                        a.activeCount--
                    } else if (this.updateType ==
                        sc.GROUP_SWITCH_UPDATE_TYPE.GLOBAL && this == a.master) {
                        this.activeCountVar && ig.vars.set(this.activeCountVar, 0);
                        for (var d = a.entities.length; d--;) a.entities[d].setOff();
                        a.master = null;
                        a.activeCount = 0
                    }
                }
            }
            this.parent()
        },
        ballHit: function(a) {
            if (!this.isOn && !this.isSpinning && this.hitCondition(this, a)) {
                this.isSpinning = true;
                this.setCurrentAnim("spinning", true, null, true, false);
                sc.combat.showHitEffect(this, a.getHitCenter(this), sc.ATTACK_TYPE.MASSIVE, a.getElement(), false, false, true);
                ig.SoundHelper.playAtEntity(this.sounds.hit,
                    this);
                ig.SoundHelper.playAtEntity(this.sounds.bing, this);
                a = b[this.group];
                this.timer = this.time / sc.options.get("assist-puzzle-speed");
                if (this.updateType == sc.GROUP_SWITCH_UPDATE_TYPE.GLOBAL && !a.master) {
                    a.master = this;
                    this.firstTrigger && ig.vars.set(this.firstTrigger, true)
                }
                a.activeCount++;
                this.activeCountVar && ig.vars.add(this.activeCountVar, 1);
                if (a.activeCount == a.entities.length) {
                    for (var d = a.entities.length; d--;) a.entities[d].setOn();
                    ig.vars.set(this.activeBoolVar, true)
                }
            } else sc.combat.showHitEffect(this,
                a.getHitCenter(this), sc.ATTACK_TYPE.NONE, a.getElement(), false, false, true);
            return true
        },
        animationEnded: function(a) {
            if (a == "switch") {
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
        hitCondition: function(a, b) {
            return b.party == sc.COMBATANT_PARTY.PLAYER
        }
    }
});
ig.baked = !0;

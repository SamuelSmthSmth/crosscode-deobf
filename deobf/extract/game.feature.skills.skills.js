ig.module("game.feature.skills.skills").requires("impact.base.game", "game.feature.combat.model.combat-params").defines(function() {
    function b(a, b, c) {
        a = f[a] || f.FALLBACK;
        return c == sc.ELEMENT.NEUTRAL ? a.neutral[b - 1] : a.element[b - 1]
    }

    function a(a, b, c, d) {
        b = g[b];
        if (!b) return null;
        b = b[a];
        if (!b) return null;
        b = b[c - 1];
        return !b ? null : b[d] || null
    }
    sc.SkillTools = {
        getCPCost: function(a, b) {
            return a == sc.ELEMENT.NEUTRAL && b == 3 ? 4 : b
        }
    };
    sc.SKILL_STATES = {
        NORMAL: 0,
        OR_BRANCH: 1,
        OR_BRANCH_FIRST: 2
    };
    var d = [0.05, 0.09, 0.13],
        c = [0.07, 0.13,
            0.19
        ],
        e = [0.04, 0.08, 0.14],
        f = {};
    f.hp = f.attack = f.defense = f.focus = {
        element: [0.04, 0.07, 0.09],
        neutral: [0.04, 0.06, 0.1]
    };
    f.RANGED_DMG = {
        element: [0.06, 0.11, 0.15],
        neutral: [0.06, 0.12, 0.22]
    };
    f.KNOCKBACK = {
        element: [0.15, 0.3, 0.45],
        neutral: [0.16, 0.3, 0.6]
    };
    f.MELEE_DMG = {
        element: [0.06, 0.11, 0.15],
        neutral: [0.06, 0.12, 0.22]
    };
    f.CRITICAL_DMG = {
        element: [0.15, 0.3, 0.45],
        neutral: [0.15, 0.3, 0.6]
    };
    f.GUARD_STRENGTH = {
        element: [0.08, 0.16, 0.24],
        neutral: [0.08, 0.16, 0.32]
    };
    f.STUN_THRESHOLD = {
        element: [0.02, 0.04, 0.06],
        neutral: [0.02, 0.04, 0.08]
    };
    f.DASH_INVINC = {
        element: [0.1, 0.2, 0.3],
        neutral: [0.1, 0.2, 0.4]
    };
    f.HP_REGEN = {
        element: [0.13, 0.25, 0.36],
        neutral: [0.13, 0.25, 0.5]
    };
    f.AIM_SPEED = {
        element: [0.1, 0.2, 0.3],
        neutral: [0.1, 0.2, 0.4]
    };
    f.ITEM_BOOST = {
        element: [0.12, 0.25, 0.37],
        neutral: [0.12, 0.25, 0.5],
        propagateFactor: 1
    };
    f.APPETITE = {
        element: [0, 0, 1],
        neutral: [0, 0, 1],
        propagateFactor: 1
    };
    f.SPIKE_DMG = {
        element: [0.15, 0.3, 0.45],
        neutral: [0.15, 0.3, 0.6]
    };
    f.CROSS_COUNTER = {
        element: [0.1, 0.2, 0.3],
        neutral: [0.1, 0.2, 0.4]
    };
    f.BERSERK = {
        element: [0.1, 0.2, 0.3],
        neutral: [0.1, 0.2, 0.4]
    };
    f.ONCE_MORE = {
        element: [1, 1, 1],
        neutral: [1, 1, 1]
    };
    f.OVERHEAT_REDUCTION = {
        element: [0.1, 0.2, 0.3],
        neutral: [0.1, 0.2, 0.4]
    };
    f.AIMING_MOVEMENT = {
        element: [0.08, 0.16, 0.24],
        neutral: [0.08, 0.16, 0.32]
    };
    f.GUARD_SP = {
        element: [0.1, 0.2, 0.3],
        neutral: [0.1, 0.2, 0.4]
    };
    f.COND_HEALING = {
        element: [0.13, 0.25, 0.35],
        neutral: [0.13, 0.3, 0.6]
    };
    f.AIM_STABILITY = {
        element: [0.2, 0.4, 0.6],
        neutral: [0.2, 0.4, 0.8]
    };
    f.GUARD_AREA = {
        element: [1, 1, 1],
        neutral: [1, 1, 1]
    };
    f.DASH_STEP = {
        element: [1, 1, 1],
        neutral: [1, 1, 1]
    };
    f.ASSAULT = {
        element: [0.1, 0.2, 0.3],
        neutral: [0.1,
            0.2, 0.3
        ]
    };
    f.COND_EFFECT_HEAT = {
        element: [0.13, 0.25, 0.35],
        neutral: [0.15, 0.3, 0.6]
    };
    f.COND_EFFECT_COLD = {
        element: [0.13, 0.25, 0.35],
        neutral: [0.15, 0.3, 0.6]
    };
    f.COND_EFFECT_SHOCK = {
        element: [0.13, 0.25, 0.35],
        neutral: [0.15, 0.3, 0.6]
    };
    f.COND_EFFECT_WAVE = {
        element: [0.13, 0.25, 0.35],
        neutral: [0.15, 0.3, 0.6]
    };
    f.COND_GUARD_HEAT = {
        element: [0.2, 0.35, 0.5],
        neutral: [0.2, 0.4, 0.8]
    };
    f.COND_GUARD_COLD = {
        element: [0.2, 0.35, 0.5],
        neutral: [0.2, 0.4, 0.8]
    };
    f.COND_GUARD_SHOCK = {
        element: [0.2, 0.35, 0.5],
        neutral: [0.2, 0.4, 0.8]
    };
    f.COND_GUARD_WAVE = {
        element: [0.2, 0.35, 0.5],
        neutral: [0.2, 0.4, 0.8]
    };
    f.FALLBACK = {
        element: [0.12, 0.24, 0.36],
        neutral: [0.12, 0.24, 0.48]
    };
    sc.BaseSkill = ig.Class.extend({
        id: -1,
        level: 1,
        element: sc.ELEMENT.NEUTRAL,
        type: sc.SKILL_STATES.NORMAL,
        skillKey: null,
        icon: 2,
        init: function(a, b) {
            this.id = b.id != void 0 ? b.id : -1;
            this.level = b.level != void 0 ? b.level : 1;
            this.element = b.element != void 0 ? b.element : sc.ELEMENT.NEUTRAL;
            this.type = b.type != void 0 ? b.type : sc.SKILL_STATES.NORMAL;
            this.skillKey = a
        },
        applyOnConfigs: function() {},
        getName: function() {
            return ig.lang.get("sc.gui.skills.names." +
                this.skillKey)
        },
        getDescription: function() {
            return ig.lang.get("sc.gui.skills.descriptions." + this.skillKey)
        },
        getCPCost: function() {
            return sc.SkillTools.getCPCost(this.element, this.level)
        },
        _getElementConfig: function(a) {
            return a[this.element]
        }
    });
    sc.SKILLS = {};
    sc.SKILLS.EMPTY = sc.BaseSkill.extend({
        init: function(a, b) {
            this.parent(a, b)
        },
        apply: function() {},
        getDescription: function() {
            return "This is an empty Skill for testing. Gives 0 on everything!"
        }
    });
    sc.StatSkill = sc.BaseSkill.extend({
        statType: null,
        applyOnConfigs: function(a) {
            var c =
                this.statType;
            if (!c) throw Error("Stat is not defined!");
            var d = this._getElementConfig(a),
                e = b(c, this.level, this.element);
            d.skillFactors[c] = d.skillFactors[c] + e;
            d = f[c] || f.FALLBACK;
            if (this.element == sc.ELEMENT.NEUTRAL) {
                var d = d.propagateFactor || 0.5,
                    g;
                for (g in a) g != sc.ELEMENT.NEUTRAL && (a[g].skillFactors[c] = a[g].skillFactors[c] + e * d)
            }
        },
        getDescription: function() {
            var a = ig.lang.get("sc.gui.skills.descriptions." + this.skillKey),
                c = b(this.statType, this.level, this.element);
            return a = a.replace("[xyz]", Math.floor(c * 100))
        }
    });
    sc.SKILLS.MAXHP = sc.StatSkill.extend({
        icon: 7,
        statType: "hp"
    });
    sc.SKILLS.ATK = sc.StatSkill.extend({
        icon: 4,
        statType: "attack"
    });
    sc.SKILLS.DEF = sc.StatSkill.extend({
        icon: 5,
        statType: "defense"
    });
    sc.SKILLS.FOC = sc.StatSkill.extend({
        icon: 6,
        statType: "focus"
    });
    sc.ElementSkill = sc.BaseSkill.extend({
        counter: false,
        init: function(a, b) {
            this.parent(a, b)
        },
        applyOnConfigs: function(a) {
            var a = this._getElementConfig(a),
                b = this._getFactor(),
                c = this.element - 1;
            this.counter && (c = c == 0 ? 1 : c == 1 ? 0 : c == 2 ? 3 : 2);
            a.skillFactors.elemFactor[c] = a.skillFactors.elemFactor[c] -
                b
        },
        _getFactor: function() {
            return this.counter ? c[this.level - 1] : d[this.level - 1]
        },
        getDescription: function() {
            var a = ig.lang.get("sc.gui.skills.descriptions." + this.skillKey),
                b = this._getFactor();
            return a = a.replace("[xyz]", Math.floor(b * 100))
        }
    });
    sc.SKILLS.OWN_ELEMENT_RES_HEAT = sc.ElementSkill.extend({
        icon: 8,
        counter: false
    });
    sc.SKILLS.COUNTER_ELEMENT_RES_HEAT = sc.ElementSkill.extend({
        icon: 9,
        counter: true
    });
    sc.SKILLS.OWN_ELEMENT_RES_COLD = sc.ElementSkill.extend({
        icon: 9,
        counter: false
    });
    sc.SKILLS.COUNTER_ELEMENT_RES_COLD =
        sc.ElementSkill.extend({
            icon: 8,
            counter: true
        });
    sc.SKILLS.OWN_ELEMENT_RES_SHOCK = sc.ElementSkill.extend({
        icon: 10,
        counter: false
    });
    sc.SKILLS.COUNTER_ELEMENT_RES_SHOCK = sc.ElementSkill.extend({
        icon: 11,
        counter: true
    });
    sc.SKILLS.OWN_ELEMENT_RES_WAVE = sc.ElementSkill.extend({
        icon: 11,
        counter: false
    });
    sc.SKILLS.COUNTER_ELEMENT_RES_WAVE = sc.ElementSkill.extend({
        icon: 10,
        counter: true
    });
    sc.SKILLS.ALL_ELEMENT_RES = sc.BaseSkill.extend({
        icon: 12,
        init: function(a, b) {
            this.parent(a, b)
        },
        applyOnConfigs: function(a) {
            for (var b = this._getElementConfig(a),
                    c = e[this.level - 1], d = 0; d < b.skillFactors.elemFactor.length; d++) b.skillFactors.elemFactor[d] = b.skillFactors.elemFactor[d] - c;
            if (this.element == sc.ELEMENT.NEUTRAL)
                for (d in a)
                    if (d != sc.ELEMENT.NEUTRAL)
                        for (var b = a[d].skillFactors.elemFactor, f = 0; f < b.length; f++) b[f] = b[f] - c / 2
        },
        getDescription: function() {
            var a = ig.lang.get("sc.gui.skills.descriptions." + this.skillKey);
            return a = a.replace("[xyz]", Math.floor(e[this.level - 1] * 100))
        }
    });
    sc.SKILLS.RANGED_DAMAGE = sc.StatSkill.extend({
        icon: 13,
        statType: "RANGED_DMG"
    });
    sc.SKILLS.CHARGED_KNOCKBACK =
        sc.StatSkill.extend({
            icon: 14,
            statType: "KNOCKBACK"
        });
    sc.SKILLS.MELEE_DAMAGE = sc.StatSkill.extend({
        icon: 15,
        statType: "MELEE_DMG"
    });
    sc.SKILLS.ASSAULT = sc.StatSkill.extend({
        icon: 16,
        statType: "ASSAULT"
    });
    sc.SKILLS.CRITICAL_DAMAGE = sc.StatSkill.extend({
        icon: 17,
        statType: "CRITICAL_DMG"
    });
    sc.SKILLS.AIMING_SPEED = sc.StatSkill.extend({
        icon: 18,
        statType: "AIM_SPEED"
    });
    sc.SKILLS.AIMING_STABILITY = sc.StatSkill.extend({
        icon: 19,
        statType: "AIM_STABILITY"
    });
    sc.SKILLS.AIMING_MOVEMENT_SPEED = sc.StatSkill.extend({
        icon: 20,
        statType: "AIMING_MOVEMENT"
    });
    sc.SKILLS.DASH_DISTANCE = sc.StatSkill.extend({
        icon: 21,
        statType: "DASH_INVINC"
    });
    sc.SKILLS.ADDITIONAL_DASH_STEP = sc.StatSkill.extend({
        icon: 22,
        statType: "DASH_STEP"
    });
    sc.SKILLS.GUARD_STRENGTH = sc.StatSkill.extend({
        icon: 23,
        statType: "GUARD_STRENGTH"
    });
    sc.SKILLS.ADDITIONAL_GUARD_AREA = sc.StatSkill.extend({
        icon: 24,
        statType: "GUARD_AREA"
    });
    sc.SKILLS.STUN_THRESHOLD = sc.StatSkill.extend({
        icon: 26,
        statType: "STUN_THRESHOLD"
    });
    sc.SKILLS.STATUS_CONDITION_EFFECT_HEAT = sc.StatSkill.extend({
        icon: 140,
        statType: "COND_EFFECT_HEAT"
    });
    sc.SKILLS.STATUS_CONDITION_EFFECT_COLD = sc.StatSkill.extend({
        icon: 141,
        statType: "COND_EFFECT_COLD"
    });
    sc.SKILLS.STATUS_CONDITION_EFFECT_SHOCK = sc.StatSkill.extend({
        icon: 142,
        statType: "COND_EFFECT_SHOCK"
    });
    sc.SKILLS.STATUS_CONDITION_EFFECT_WAVE = sc.StatSkill.extend({
        icon: 143,
        statType: "COND_EFFECT_WAVE"
    });
    sc.SKILLS.STATUS_CONDITION_GUARD_HEAT = sc.StatSkill.extend({
        icon: 144,
        statType: "COND_GUARD_HEAT"
    });
    sc.SKILLS.STATUS_CONDITION_GUARD_COLD = sc.StatSkill.extend({
        icon: 145,
        statType: "COND_GUARD_COLD"
    });
    sc.SKILLS.STATUS_CONDITION_GUARD_SHOCK =
        sc.StatSkill.extend({
            icon: 146,
            statType: "COND_GUARD_SHOCK"
        });
    sc.SKILLS.STATUS_CONDITION_GUARD_WAVE = sc.StatSkill.extend({
        icon: 147,
        statType: "COND_GUARD_WAVE"
    });
    sc.SKILLS.STATUS_CONDITION_HEALING = sc.StatSkill.extend({
        icon: 35,
        statType: "COND_HEALING"
    });
    sc.SKILLS.HP_REGENERATION = sc.StatSkill.extend({
        icon: 36,
        statType: "HP_REGEN"
    });
    sc.SKILLS.OVERHEAT_REDUCTION = sc.StatSkill.extend({
        icon: 37,
        statType: "OVERHEAT_REDUCTION"
    });
    sc.SKILLS.ITEM_BOOST = sc.StatSkill.extend({
        icon: 38,
        statType: "ITEM_BOOST"
    });
    sc.SKILLS.APPETITE =
        sc.StatSkill.extend({
            icon: 28,
            statType: "APPETITE"
        });
    sc.SKILLS.SPIKE_DAMAGE = sc.StatSkill.extend({
        icon: 25,
        statType: "SPIKE_DMG"
    });
    sc.SKILLS.CROSS_COUNTER = sc.StatSkill.extend({
        icon: 30,
        statType: "CROSS_COUNTER"
    });
    sc.SKILLS.BERSERKER = sc.StatSkill.extend({
        icon: 31,
        statType: "BERSERK"
    });
    sc.SKILLS.ONCE_MORE = sc.StatSkill.extend({
        icon: 32,
        statType: "ONCE_MORE"
    });
    sc.SKILLS.GUARD_SP = sc.StatSkill.extend({
        icon: 27,
        statType: "GUARD_SP"
    });
    var g = {};
    g[sc.ELEMENT.NEUTRAL] = {
        THROW: [{
            A: {
                icon: 40
            },
            B: {
                icon: 41
            }
        }, {
            A: {
                icon: 42
            },
            B: {
                icon: 43
            }
        }],
        ATTACK: [{
            A: {
                icon: 44
            },
            B: {
                icon: 45
            }
        }, {
            A: {
                icon: 46
            },
            B: {
                icon: 47
            }
        }],
        DASH: [{
            A: {
                icon: 48
            },
            B: {
                icon: 49
            }
        }, {
            A: {
                icon: 50
            },
            B: {
                icon: 51
            }
        }],
        GUARD: [{
            A: {
                icon: 52
            },
            B: {
                icon: 53
            }
        }, {
            A: {
                icon: 54
            },
            B: {
                icon: 55
            }
        }]
    };
    g[sc.ELEMENT.HEAT] = {
        THROW: [{
            A: {
                icon: 60
            }
        }, {
            A: {
                icon: 61
            }
        }],
        ATTACK: [{
            A: {
                icon: 62
            },
            B: {
                icon: 63
            }
        }, {
            A: {
                icon: 64
            },
            B: {
                icon: 65
            }
        }, {
            A: {
                icon: 66
            },
            B: {
                icon: 67
            }
        }],
        DASH: [{
            A: {
                icon: 68
            },
            B: {
                icon: 69
            }
        }, {
            A: {
                icon: 70
            },
            B: {
                icon: 71
            }
        }, {
            A: {
                icon: 72
            }
        }],
        GUARD: [{
            A: {
                icon: 73
            },
            B: {
                icon: 74
            }
        }, {
            A: {
                icon: 75
            },
            B: {
                icon: 76
            }
        }, {
            A: {
                icon: 77
            },
            B: {
                icon: 78
            }
        }]
    };
    g[sc.ELEMENT.COLD] = {
        THROW: [{
            A: {
                icon: 80
            },
            B: {
                icon: 81
            }
        }, {
            A: {
                icon: 82
            },
            B: {
                icon: 83
            }
        }, {
            A: {
                icon: 84
            }
        }],
        ATTACK: [{
            A: {
                icon: 85
            },
            B: {
                icon: 86
            }
        }, {
            A: {
                icon: 87
            },
            B: {
                icon: 88
            }
        }, {
            A: {
                icon: 89
            },
            B: {
                icon: 90
            }
        }],
        DASH: [{
            A: {
                icon: 91
            }
        }, {
            A: {
                icon: 92
            }
        }],
        GUARD: [{
            A: {
                icon: 93
            },
            B: {
                icon: 94
            }
        }, {
            A: {
                icon: 95
            },
            B: {
                icon: 96
            }
        }, {
            A: {
                icon: 97
            },
            B: {
                icon: 98
            }
        }]
    };
    g[sc.ELEMENT.SHOCK] = {
        THROW: [{
            A: {
                icon: 100
            },
            B: {
                icon: 101
            }
        }, {
            A: {
                icon: 102
            },
            B: {
                icon: 103
            }
        }, {
            A: {
                icon: 104
            },
            B: {
                icon: 105
            }
        }],
        ATTACK: [{
            A: {
                icon: 106
            },
            B: {
                icon: 107
            }
        }, {
            A: {
                icon: 108
            },
            B: {
                icon: 109
            }
        }, {
            A: {
                icon: 110
            }
        }],
        DASH: [{
                A: {
                    icon: 111
                },
                B: {
                    icon: 112
                }
            },
            {
                A: {
                    icon: 113
                },
                B: {
                    icon: 114
                }
            }, {
                A: {
                    icon: 115
                },
                B: {
                    icon: 116
                }
            }
        ],
        GUARD: [{
            A: {
                icon: 117
            }
        }, {
            A: {
                icon: 118
            }
        }]
    };
    g[sc.ELEMENT.WAVE] = {
        THROW: [{
            A: {
                icon: 120
            },
            B: {
                icon: 121
            }
        }, {
            A: {
                icon: 122
            },
            B: {
                icon: 123
            }
        }, {
            A: {
                icon: 124
            },
            B: {
                icon: 125
            }
        }],
        ATTACK: [{
            A: {
                icon: 126
            }
        }, {
            A: {
                icon: 127
            }
        }],
        DASH: [{
            A: {
                icon: 128
            },
            B: {
                icon: 129
            }
        }, {
            A: {
                icon: 130
            },
            B: {
                icon: 131
            }
        }, {
            A: {
                icon: 132
            },
            B: {
                icon: 133
            }
        }],
        GUARD: [{
            A: {
                icon: 134
            },
            B: {
                icon: 135
            }
        }, {
            A: {
                icon: 136
            },
            B: {
                icon: 137
            }
        }, {
            A: {
                icon: 138
            }
        }]
    };
    var h = /(.+)_SPECIAL(\d)_(A|B)/;
    sc.getCombatArtIcon = function(b, c) {
        var d = h.exec(c);
        if (d) return (d =
            a(d[1], b, d[2], d[3])) && d.icon || 0;
        return 0
    };
    sc.SKILLS.ACTIVE_PLACEHOLDER = sc.BaseSkill.extend({
        icon: 0,
        init: function(a, b) {
            this.parent(a, b)
        },
        applyOnConfigs: function() {}
    });
    sc.SpecialSkill = sc.BaseSkill.extend({
        skillType: null,
        branchType: null,
        init: function(b, c, d, e) {
            this.parent(b, c);
            this.skillType = d;
            this.branchType = e;
            this.icon = (b = a(d, this.element, this.level, e)) ? b.icon : 48
        },
        getName: function() {
            var a = sc.model.player.getCombatArt(this.element, this.skillType + "_SPECIAL" + this.level + "_" + this.branchType);
            return a && a.name ?
                a.name.toString() : ig.lang.get("sc.gui.skills.specials.wip.name")
        },
        getDescription: function() {
            var a = sc.model.player.getCombatArt(this.element, this.skillType + "_SPECIAL" + this.level + "_" + this.branchType);
            return a && a.description ? a.description.toString() : ig.lang.get("sc.gui.skills.specials.wip.desc")
        },
        applyOnConfigs: function(a) {
            var a = this._getElementConfig(a),
                b = this.skillType + "_SPECIAL" + this.level,
                c = b + "_" + this.branchType,
                d = b + "_" + (this.branchType == "A" ? "B" : "A");
            a.actions[c] ? a.activeActions[sc.PLAYER_ACTION[b]] =
                a.actions[c] : a.actions[d] && (a.activeActions[sc.PLAYER_ACTION[b]] = a.actions[d])
        },
        getCombatArtLevel: function(a, b) {
            return a && a != this.skillType || b != void 0 && b != this.element ? 0 : this.level
        },
        _getElementName: function() {
            switch (this.element) {
                case sc.ELEMENT.NEUTRAL:
                    return "NEUTRAL";
                case sc.ELEMENT.HEAT:
                    return "HEAT";
                case sc.ELEMENT.COLD:
                    return "COLD";
                case sc.ELEMENT.SHOCK:
                    return "SHOCK";
                case sc.ELEMENT.WAVE:
                    return "WAVE"
            }
        }
    });
    sc.SKILLS.THROW_SPECIAL_A = sc.SpecialSkill.extend({
        init: function(a, b) {
            this.parent(a, b, "THROW",
                "A")
        }
    });
    sc.SKILLS.THROW_SPECIAL_B = sc.SpecialSkill.extend({
        init: function(a, b) {
            this.parent(a, b, "THROW", "B")
        }
    });
    sc.SKILLS.ATTACK_SPECIAL_A = sc.SpecialSkill.extend({
        init: function(a, b) {
            this.parent(a, b, "ATTACK", "A")
        }
    });
    sc.SKILLS.ATTACK_SPECIAL_B = sc.SpecialSkill.extend({
        init: function(a, b) {
            this.parent(a, b, "ATTACK", "B")
        }
    });
    sc.SKILLS.DASH_SPECIAL_A = sc.SpecialSkill.extend({
        init: function(a, b) {
            this.parent(a, b, "DASH", "A")
        }
    });
    sc.SKILLS.DASH_SPECIAL_B = sc.SpecialSkill.extend({
        init: function(a, b) {
            this.parent(a, b, "DASH",
                "B")
        }
    });
    sc.SKILLS.GUARD_SPECIAL_A = sc.SpecialSkill.extend({
        init: function(a, b) {
            this.parent(a, b, "GUARD", "A")
        }
    });
    sc.SKILLS.GUARD_SPECIAL_B = sc.SpecialSkill.extend({
        init: function(a, b) {
            this.parent(a, b, "GUARD", "B")
        }
    })
});
ig.baked = !0;

ig.module("game.feature.party.party-steps").requires("impact.base.action", "impact.base.event", "game.feature.party.party").defines(function() {
    ig.EVENT_STEP.SET_CONTACT_ONLINE = ig.EventStepBase.extend({
        member: null,
        online: null,
        _wm: new ig.Config({
            attributes: {
                member: {
                    _type: "String",
                    _info: "Party member to add",
                    _select: sc.PARTY_OPTIONS
                },
                online: {
                    _type: "Boolean",
                    _info: "True if online."
                }
            }
        }),
        init: function(a) {
            this.member = a.member;
            this.online = a.online
        },
        start: function() {
            sc.party.setOnlineStatus(this.member, this.online)
        }
    });
    ig.EVENT_STEP.SET_MEMBER_LOCKED = ig.EventStepBase.extend({
        member: null,
        locked: null,
        _wm: new ig.Config({
            attributes: {
                member: {
                    _type: "String",
                    _info: "Party member to change",
                    _select: sc.PARTY_OPTIONS
                },
                locked: {
                    _type: "Boolean",
                    _info: "True if locked."
                }
            }
        }),
        init: function(a) {
            this.member = a.member;
            this.locked = a.locked
        },
        start: function() {
            sc.party.setLocked(this.member, this.locked)
        }
    });
    ig.EVENT_STEP.SET_CONTACT_TYPE = ig.EventStepBase.extend({
        member: null,
        status: null,
        _wm: new ig.Config({
            attributes: {
                member: {
                    _type: "String",
                    _info: "Party member to add",
                    _select: sc.PARTY_OPTIONS
                },
                status: {
                    _type: "String",
                    _info: "Status to set",
                    _select: sc.PARTY_MEMBER_TYPE
                }
            }
        }),
        init: function(a) {
            this.member = a.member;
            this.status = sc.PARTY_MEMBER_TYPE[a.status] || 0
        },
        start: function() {
            sc.party.setContactType(this.member, this.status)
        }
    });
    ig.EVENT_STEP.SET_CONTACT_TYPE_ALL = ig.EventStepBase.extend({
        status: null,
        _wm: new ig.Config({
            attributes: {
                status: {
                    _type: "String",
                    _info: "Status to set",
                    _select: sc.PARTY_MEMBER_TYPE
                }
            }
        }),
        init: function(a) {
            this.status = sc.PARTY_MEMBER_TYPE[a.status] ||
                0
        },
        start: function() {
            for (var a in sc.party.contacts) sc.party.setContactType(a, this.status)
        }
    });
    ig.EVENT_STEP.ADD_PARTY_MEMBER = ig.EventStepBase.extend({
        member: null,
        npc: null,
        _wm: new ig.Config({
            attributes: {
                member: {
                    _type: "String",
                    _info: "Party member to add",
                    _select: sc.PARTY_OPTIONS
                },
                npc: {
                    _type: "NPC",
                    _info: "NPC that will turn into the party member",
                    _optional: true
                },
                skipEffect: {
                    _type: "Boolean",
                    _info: "If true: skip NPC show effect"
                },
                temporary: {
                    _type: "Boolean",
                    _info: "If true: add Party member temporary"
                }
            }
        }),
        init: function(a) {
            this.member = a.member;
            this.npc = a.npc;
            this.skipEffect = a.skipEffect || false;
            this.temporary = a.temporary || false
        },
        start: function(a, b) {
            var e = ig.Event.getEntity(this.npc, b);
            sc.party.addPartyMember(this.member, e, false, this.skipEffect, this.temporary)
        }
    });
    ig.EVENT_STEP.SET_PARTY_MEMBER_LEVEL = ig.EventStepBase.extend({
        member: null,
        level: null,
        exp: null,
        updateEquipment: false,
        _wm: new ig.Config({
            attributes: {
                member: {
                    _type: "String",
                    _info: "Party member to add",
                    _select: sc.PARTY_OPTIONS
                },
                level: {
                    _type: "Integer",
                    _info: "Level to set"
                },
                exp: {
                    _type: "Integer",
                    _info: "Exp to set"
                },
                updateEquipment: {
                    _type: "Boolean",
                    _info: "If true, also update equipment of party member"
                }
            }
        }),
        init: function(a) {
            this.member = a.member;
            this.level = a.level || 1;
            this.exp = a.exp || 0;
            this.updateEquipment = a.updateEquipment || false
        },
        start: function() {
            sc.party.getPartyMemberModel(this.member).setLevel(this.level, this.exp, this.updateEquipment, true)
        }
    });
    ig.EVENT_STEP.SET_PARTY_MEMBER_NO_DIE = ig.EventStepBase.extend({
        noDie: false,
        _wm: new ig.Config({
            attributes: {
                member: {
                    _type: "String",
                    _info: "Party member to modify",
                    _select: sc.PARTY_OPTIONS
                },
                noDie: {
                    _type: "Boolean",
                    _info: "If true: party member won't die, even if you kill him"
                }
            }
        }),
        init: function(a) {
            this.member = a.member;
            this.noDie = a.noDie || false
        },
        start: function() {
            sc.party.getPartyMemberModel(this.member).setNoDie(this.noDie)
        }
    });
    ig.EVENT_STEP.SET_PARTY_MEMBER_SP_LEVEL = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                member: {
                    _type: "String",
                    _info: "Party member to add",
                    _select: sc.PARTY_OPTIONS
                },
                level: {
                    _type: "String",
                    _info: "Type of Core.",
                    _select: {
                        "0": "0 SP",
                        1: "4 SP",
                        2: "8 SP",
                        3: "12 SP",
                        4: "16 SP"
                    }
                }
            }
        }),
        init: function(a) {
            this.member = a.member;
            this.level = a.level
        },
        start: function() {
            sc.party.getPartyMemberModel(this.member).setSpLevel(this.level)
        }
    });
    ig.EVENT_STEP.SET_PARTY_MEMBER_ALL_ELEMENTS = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                member: {
                    _type: "String",
                    _info: "Party member to add",
                    _select: sc.PARTY_OPTIONS
                },
                allElements: {
                    _type: "Boolean",
                    _info: "If true: has all elements. If false: has all elements player has"
                }
            }
        }),
        init: function(a) {
            this.member =
                a.member;
            this.allElements = a.allElements
        },
        start: function() {
            sc.party.getPartyMemberModel(this.member).setAllElements(this.allElements)
        }
    });
    ig.EVENT_STEP.REMOVE_PARTY_MEMBER = ig.EventStepBase.extend({
        member: null,
        npc: null,
        _wm: new ig.Config({
            attributes: {
                member: {
                    _type: "String",
                    _info: "Party member to add",
                    _select: sc.PARTY_OPTIONS
                },
                npc: {
                    _type: "NPC",
                    _info: "NPC that will turn into the party member",
                    _optional: true
                },
                skipEffect: {
                    _type: "Boolean",
                    _info: "If true: skip NPC show effect"
                }
            }
        }),
        init: function(a) {
            this.member =
                a.member;
            this.npc = a.npc;
            this.skipEffect = a.skipEffect || false
        },
        start: function(a, b) {
            var e = ig.Event.getEntity(this.npc, b);
            sc.party.removePartyMember(this.member, e, this.skipEffect)
        }
    });
    ig.EVENT_STEP.REVIVE_PARTY_MEMBER = ig.EventStepBase.extend({
        member: null,
        _wm: new ig.Config({
            attributes: {
                member: {
                    _type: "String",
                    _info: "Party member to revive",
                    _select: sc.PARTY_OPTIONS
                }
            }
        }),
        init: function(a) {
            this.member = a.member
        },
        start: function() {
            sc.party.getPartyMemberModel(this.member).isAlive() || sc.party.revivePartyMemberEntity(this.member)
        }
    });
    ig.EVENT_STEP.REVIVE_ALL_PARTY_MEMBERS = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        start: function() {
            sc.party.reviveAllPartyMemberModels()
        }
    });
    ig.EVENT_STEP.SET_PARTY_AI = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                battle: {
                    _type: "Number",
                    _info: "Battle AI Factor: 0=default, 1=always the best possible decision.",
                    _optional: true
                },
                aggressive: {
                    _type: "Number",
                    _info: "Aggressiveness Factor: 0=default, 1=attacks as often as possible",
                    _optional: true
                },
                targeting: {
                    _type: "Number",
                    _info: "Influence enemy targeting behavior: 0=default, 1=enemies will always target party members, -1=enemies will always target player",
                    _optional: true
                }
            }
        }),
        init: function(a) {
            if (a.battle !== void 0) this.battle = a.battle;
            if (a.aggressive !== void 0) this.aggressive = a.aggressive;
            if (a.targeting !== void 0) this.targeting = a.targeting
        },
        start: function() {
            if (this.battle !== void 0) sc.party.ai.battle = this.battle;
            if (this.battle !== void 0) sc.party.ai.aggressive = this.aggressive;
            if (this.targeting !== void 0) sc.party.ai.targeting = this.targeting
        }
    });
    ig.EVENT_STEP.PARTY_KEEP_MAP_DUNGEON = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function() {
            sc.party.keepMapDungeon()
        }
    });
    var b = {
            RANDOM: function(a) {
                return a[Math.floor(a.length * Math.random())]
            },
            LOWEST_HP: function(a) {
                for (var b = a.length, e = null, f = 0; b--;) {
                    var g = a[b];
                    if (!e || f > g.params.getHpFactor()) {
                        f = g.params.getHpFactor();
                        e = g
                    }
                }
                return e
            },
            FIRST: function(a) {
                return a[0]
            },
            SECOND: function(a) {
                return a[1]
            },
            HAS_NO_PROXY: function(a, b) {
                for (var e = a.length; e--;) {
                    var f = a[e];
                    if (!sc.CombatProxyTools.hasProxy(f, b)) return f
                }
                return null
            }
        },
        a = [];
    ig.ACTION_STEP.SET_PARTY_TEMP_TARGET = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                kind: {
                    _type: "String",
                    _info: "Kind of temp target",
                    _select: b
                },
                includeSelf: {
                    _type: "Boolean",
                    _info: "If true: also include self as possible target"
                },
                enemyFilter: {
                    _type: "Array",
                    _info: "Only for enemy: filter for enemy type",
                    _optional: true,
                    _sub: {
                        _type: "EnemySearch"
                    }
                },
                selectKey: {
                    _type: "StringExpression",
                    _info: "Search Key used for some selection criteria of 'kind'"
                }
            }
        }),
        init: function(a) {
            this.kind = b[a.kind] || b.PLAYER;
            this.includeSelf = a.includeSelf || false;
            this.enemyFilter = a.enemyFilter || null;
            this.selectKey = a.selectKey || null
        },
        start: function(b) {
            var c =
                b.getCombatantRoot();
            a.length = 0;
            if (c.party == sc.COMBATANT_PARTY.PLAYER) {
                var e = this.includeSelf;
                (e || !c.isPlayer) && !ig.game.playerEntity.isDefeated() && a.push(ig.game.playerEntity);
                var f = sc.party.getPartyMemberEntityByIndex(0);
                f && ((e || f != c) && !f.isDefeated()) && a.push(f);
                (f = sc.party.getPartyMemberEntityByIndex(1)) && ((e || f != c) && !f.isDefeated()) && a.push(f)
            } else {
                e = this.enemyFilter;
                this.includeSelf && a.push(c);
                for (var f = sc.combat.getActiveCombatants(sc.COMBATANT_PARTY.ENEMY), g = f.length; g--;) {
                    var h = f[g];
                    h != c &&
                        !(e && e.indexOf(h.enemyName) == -1) && a.push(h)
                }
            }
            if (a.length) {
                c = this.kind(a, this.selectKey);
                b.tmpTarget = c
            } else b.tmpTarget = null
        }
    });
    ig.ACTION_STEP.SET_TARGET_TO_PARTYMEMBER = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                member: {
                    _type: "String",
                    _info: "Party member to add",
                    _select: sc.PARTY_OPTIONS
                }
            }
        }),
        init: function(a) {
            this.member = a.member
        },
        start: function(a) {
            if (sc.party.getPartyMemberModel(this.member).isAlive()) {
                var b = sc.party.getPartyMemberEntity(this.member);
                b && a.setTarget(b)
            }
        }
    });
    ig.ACTION_STEP.CONSUME_PARTY_SANDWICH =
        ig.ActionStepBase.extend({
            init: function(a) {
                this.sandwich = a.sandwich
            },
            start: function(a) {
                a.consumeSandwich && a.consumeSandwich(this.sandwich)
            }
        })
});
ig.baked = !0;

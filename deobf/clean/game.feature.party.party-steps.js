/**
 * @module game.feature.party.party-steps
 *
 * Event and action steps for the party system: setting contact status,
 * adding/removing/reviving party members, adjusting member level/SP/no-die/
 * all-elements, configuring party AI, dungeon party blocking, and combat
 * actions for temporary targets and sandwich consumption.
 */
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
        init: function(settings) {
            this.member = settings.member;
            this.online = settings.online
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
        init: function(settings) {
            this.member = settings.member;
            this.locked = settings.locked
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
        init: function(settings) {
            this.member = settings.member;
            this.status = sc.PARTY_MEMBER_TYPE[settings.status] || 0
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
        init: function(settings) {
            this.status = sc.PARTY_MEMBER_TYPE[settings.status] ||
                0
        },
        start: function() {
            for (var member in sc.party.contacts) sc.party.setContactType(member, this.status)
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
        init: function(settings) {
            this.member = settings.member;
            this.npc = settings.npc;
            this.skipEffect = settings.skipEffect || false;
            this.temporary = settings.temporary || false
        },
        start: function(stepState, eventContext) {
            var npcEntity = ig.Event.getEntity(this.npc, eventContext);
            sc.party.addPartyMember(this.member, npcEntity, false, this.skipEffect, this.temporary)
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
        init: function(settings) {
            this.member = settings.member;
            this.level = settings.level || 1;
            this.exp = settings.exp || 0;
            this.updateEquipment = settings.updateEquipment || false
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
        init: function(settings) {
            this.member = settings.member;
            this.noDie = settings.noDie || false
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
        init: function(settings) {
            this.member = settings.member;
            this.level = settings.level
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
        init: function(settings) {
            this.member =
                settings.member;
            this.allElements = settings.allElements
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
        init: function(settings) {
            this.member =
                settings.member;
            this.npc = settings.npc;
            this.skipEffect = settings.skipEffect || false
        },
        start: function(stepState, eventContext) {
            var npcEntity = ig.Event.getEntity(this.npc, eventContext);
            sc.party.removePartyMember(this.member, npcEntity, this.skipEffect)
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
        init: function(settings) {
            this.member = settings.member
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
        init: function(settings) {
            if (settings.battle !== void 0) this.battle = settings.battle;
            if (settings.aggressive !== void 0) this.aggressive = settings.aggressive;
            if (settings.targeting !== void 0) this.targeting = settings.targeting
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
    var TEMP_TARGET_KINDS = {
            RANDOM: function(candidates) {
                return candidates[Math.floor(candidates.length * Math.random())]
            },
            LOWEST_HP: function(candidates) {
                for (var i = candidates.length, bestCandidate = null, lowestFactor = 0; i--;) {
                    var candidate = candidates[i];
                    if (!bestCandidate || lowestFactor > candidate.params.getHpFactor()) {
                        lowestFactor = candidate.params.getHpFactor();
                        bestCandidate = candidate
                    }
                }
                return bestCandidate
            },
            FIRST: function(candidates) {
                return candidates[0]
            },
            SECOND: function(candidates) {
                return candidates[1]
            },
            HAS_NO_PROXY: function(candidates, selectKey) {
                for (var i = candidates.length; i--;) {
                    var candidate = candidates[i];
                    if (!sc.CombatProxyTools.hasProxy(candidate, selectKey)) return candidate
                }
                return null
            }
        },
        TEMP_TARGETS = [];
    ig.ACTION_STEP.SET_PARTY_TEMP_TARGET = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                kind: {
                    _type: "String",
                    _info: "Kind of temp target",
                    _select: TEMP_TARGET_KINDS
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
        init: function(settings) {
            this.kind = TEMP_TARGET_KINDS[settings.kind] || TEMP_TARGET_KINDS.PLAYER;
            this.includeSelf = settings.includeSelf || false;
            this.enemyFilter = settings.enemyFilter || null;
            this.selectKey = settings.selectKey || null
        },
        start: function(actor) {
            var combatantRoot =
                actor.getCombatantRoot();
            TEMP_TARGETS.length = 0;
            if (combatantRoot.party == sc.COMBATANT_PARTY.PLAYER) {
                var includeSelf = this.includeSelf;
                (includeSelf || !combatantRoot.isPlayer) && !ig.game.playerEntity.isDefeated() && TEMP_TARGETS.push(ig.game.playerEntity);
                var partyEntity = sc.party.getPartyMemberEntityByIndex(0);
                partyEntity && ((includeSelf || partyEntity != combatantRoot) && !partyEntity.isDefeated()) && TEMP_TARGETS.push(partyEntity);
                (partyEntity = sc.party.getPartyMemberEntityByIndex(1)) && ((includeSelf || partyEntity != combatantRoot) && !partyEntity.isDefeated()) && TEMP_TARGETS.push(partyEntity)
            } else {
                includeSelf = this.enemyFilter;
                this.includeSelf && TEMP_TARGETS.push(combatantRoot);
                for (var partyEntity = sc.combat.getActiveCombatants(sc.COMBATANT_PARTY.ENEMY), i = partyEntity.length; i--;) {
                    var enemy = partyEntity[i];
                    enemy != combatantRoot &&
                        !(includeSelf && includeSelf.indexOf(enemy.enemyName) == -1) && TEMP_TARGETS.push(enemy)
                }
            }
            if (TEMP_TARGETS.length) {
                combatantRoot = this.kind(TEMP_TARGETS, this.selectKey);
                actor.tmpTarget = combatantRoot
            } else actor.tmpTarget = null
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
        init: function(settings) {
            this.member = settings.member
        },
        start: function(actor) {
            if (sc.party.getPartyMemberModel(this.member).isAlive()) {
                var partyEntity = sc.party.getPartyMemberEntity(this.member);
                partyEntity && actor.setTarget(partyEntity)
            }
        }
    });
    ig.ACTION_STEP.CONSUME_PARTY_SANDWICH =
        ig.ActionStepBase.extend({
            init: function(settings) {
                this.sandwich = settings.sandwich
            },
            start: function(actor) {
                actor.consumeSandwich && actor.consumeSandwich(this.sandwich)
            }
        })
});
ig.baked = !0;

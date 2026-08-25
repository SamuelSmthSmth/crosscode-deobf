ig.module("game.feature.party.party").requires("impact.feature.storage.storage", "impact.base.event", "game.feature.menu.map-model", "game.feature.model.game-model").defines(function() {
    var b = Vec3.create();
    Vec2.create();
    sc.PARTY_MSG = {
        PARTY_CHANGED: 1,
        DUNGEON_BLOCK_CHANGED: 2
    };
    sc.PARTY_MAX_MEMBERS = 2;
    var a = [1, 0.9, 0.75],
        d = [1, 0.8, 0.6];
    sc.PARTY_OPTIONS = ["Lea", "Shizuka", "Shizuka0", "Emilie", "Sergey", "Schneider", "Schneider2", "Hlin", "Grumpy", "Buggy", "Glasses", "Apollo", "Joern", "Triblader1", "Luke"];
    sc.PARTY_SORT_TYPE = {
        STATUS: 0,
        NAME: 1,
        LEVEL: 2
    };
    sc.PARTY_MEMBER_TYPE = {
        UNKNOWN: 0,
        CONTACT: 1,
        FRIEND: 2
    };
    sc.PARTY_STRATEGY = {};
    sc.PARTY_STRATEGY.TARGET = {
        WHATEVER: {
            others: false,
            same: false
        },
        MY_ENEMY: {
            others: false,
            same: true
        },
        OTHERS: {
            others: true,
            same: false
        }
    };
    sc.PARTY_STRATEGY.BEHAVIOUR = {
        OFFENSIVE: {
            dodgeMin: 0.2,
            dodgeMax: 0.75
        },
        DEFENSIVE: {
            dodgeMin: 0.4,
            dodgeMax: 1,
            noAttack: true
        },
        DO_NOTHING: {
            dodgeMin: 0.4,
            dodgeMax: 1,
            doNothing: true,
            onlyTargetPlayer: true
        }
    };
    sc.PARTY_STRATEGY.ARTS = {
        NORMAL: {
            factor: 1
        },
        OFTEN: {
            factor: 4
        },
        NEVER: {
            factor: 0
        }
    };
    sc.SOCIAL_ACTION = {
        PARTY_JOIN: 1,
        PARTY_LEAVE: 2,
        CONTACT: 3
    };
    sc.PartyModel = ig.GameAddon.extend({
        observers: [],
        models: {},
        currentParty: [],
        partyEntities: {},
        contacts: {},
        dungeonBlocked: false,
        lastAreaDungeon: false,
        _deferredEntityUpdate: false,
        keepDistance: false,
        strategyKeys: {
            TARGET: "WHATEVER",
            BEHAVIOUR: "OFFENSIVE",
            ARTS: "NORMAL"
        },
        ai: {
            battle: 0,
            targeting: 0,
            aggressive: 0
        },
        init: function() {
            this.parent("Party");
            for (var a = 0; a < sc.PARTY_OPTIONS.length; ++a) this.addPartyOption(sc.PARTY_OPTIONS[a]);
            this.onReset();
            ig.storage.register(this);
            ig.vars.registerVarAccessor("party", this, "VarPartyEditor");
            sc.Model.addObserver(sc.model, this)
        },
        getStrategy: function(a) {
            return sc.PARTY_STRATEGY[a][this.strategyKeys[a]] || {}
        },
        updatePartyStrategy: function(a, b) {
            this.strategyKeys[a] = b
        },
        getStrategyKey: function(a, b) {
            if (a == "TARGET") {
                if (b == 0) return "WHATEVER";
                if (b == 1) return "MY_ENEMY";
                if (b == 2) return "OTHERS"
            } else if (a == "BEHAVIOUR") {
                if (b == 0) return "OFFENSIVE";
                if (b == 1) return "DEFENSIVE";
                if (b == 2) return "DO_NOTHING"
            } else if (a == "ARTS") {
                if (b == 0) return "NORMAL";
                if (b ==
                    1) return "OFTEN";
                if (b == 2) return "NEVER"
            }
        },
        setContactType: function(a, b) {
            if (this.contacts[a]) this.contacts[a].status = b
        },
        setOnlineStatus: function(a, b) {
            if (this.contacts[a]) this.contacts[a].online = b || false
        },
        setLocked: function(a, b) {
            if (this.contacts[a]) this.contacts[a].locked = b || false
        },
        addPartyOption: function(a) {
            var b = new sc.PartyMemberModel(a);
            this.models[a] = b
        },
        initParty: function(a) {
            for (var a = a.split(","), b = 0; b < a.length; ++b) this.addPartyMember(a[b], null, true, false, b >= 2)
        },
        addPartyMember: function(a, b, c, d, i) {
            if (this.currentParty.indexOf(a) ==
                -1) {
                if (!i) {
                    this.setContactType(a, sc.PARTY_MEMBER_TYPE.FRIEND);
                    this.setOnlineStatus(a, true)
                }
                this.currentParty.push(a);
                this.models[a].revive();
                this.models[a].setTemporary(i || false);
                if (!b && d) {
                    this._spawnPartyMemberEntity(a, false, false);
                    this._updateEntitiesOffset()
                } else if (!c)
                    if (b) {
                        this._spawnPartyMemberEntity(a, true, false, b);
                        this._updateEntitiesOffset()
                    } else this._deferredEntityUpdate = true;
                sc.Model.notifyObserver(this, sc.PARTY_MSG.PARTY_CHANGED);
                ig.game.varsChangedDeferred()
            }
        },
        removePartyMember: function(a,
            b, c) {
            if (this.isPartyMember(a)) {
                var d = this.currentParty.indexOf(a);
                this.currentParty.splice(d, 1);
                this.contacts[a].locked = false;
                if (!b && c) {
                    this._removePartyMemberEntity(a, null, true);
                    this._updateEntitiesOffset()
                } else if (b) {
                    this._removePartyMemberEntity(a, b);
                    this._updateEntitiesOffset()
                } else this._deferredEntityUpdate = true;
                this.models[a].noDie = false;
                this.models[a].revive();
                this.models[a].setTemporary(false);
                sc.Model.notifyObserver(this, sc.PARTY_MSG.PARTY_CHANGED);
                ig.game.varsChangedDeferred()
            }
        },
        reviveAllPartyMembers: function() {
            for (var a =
                    this.currentParty.length; a--;) {
                var b = this.currentParty[a];
                this.models[b].isAlive() || this.revivePartyMemberEntity(b)
            }
        },
        reviveAllPartyMemberModels: function() {
            for (var a = this.currentParty.length; a--;) {
                var b = this.currentParty[a];
                this.models[b] && this.models[b].revive()
            }
        },
        revivePartyMemberEntity: function(a) {
            var b = this.currentParty.indexOf(a);
            this.models[a].revive();
            if (b != -1) {
                this._spawnPartyMemberEntity(a, true, false, null);
                this._updateEntitiesOffset()
            }
        },
        modelChanged: function(a, b) {
            b == sc.GAME_MODEL_MSG.STATE_CHANGED &&
                a.isCutscene() && this.reviveAllPartyMembers()
        },
        onMemberDefeat: function(a) {
            this.models[a].onDefeat();
            sc.commonEvents.triggerEvent("PARTY_MEMBER_EVENT", {
                member: [a],
                eventType: "DIES"
            });
            sc.model.isCombatMode() || this.reviveAllPartyMembers()
        },
        keepMapDungeon: function() {
            this.lastAreaDungeon = this.dungeonBlocked = true;
            sc.Model.notifyObserver(this, sc.PARTY_MSG.DUNGEON_BLOCK_CHANGED);
            for (var a = this.currentParty.length; a--;) {
                var b = this.partyEntities[this.currentParty[a]];
                b && b.hide()
            }
            sc.commonEvents.cancelEvent("DUNGEON_TRANSITION") ||
                sc.commonEvents.triggerEvent("DUNGEON_TRANSITION", {
                    mapTransition: null,
                    areaTransition: "ENTER"
                })
        },
        onMapEnter: function() {
            this.partyEntities = {};
            this.resetAi();
            var a = sc.map.isDungeon(true),
                b = null,
                c = null;
            if (sc.map.isDungeon()) {
                if (!this.dungeonBlocked) {
                    this.dungeonBlocked = true;
                    sc.Model.notifyObserver(this, sc.PARTY_MSG.DUNGEON_BLOCK_CHANGED);
                    b = "ENTER"
                }
            } else {
                if (this.dungeonBlocked) {
                    this.dungeonBlocked = false;
                    sc.Model.notifyObserver(this, sc.PARTY_MSG.DUNGEON_BLOCK_CHANGED);
                    b = "LEAVE"
                }
                this.respawnMembers()
            }
            if (a !=
                this.lastAreaDungeon) c = (this.lastAreaDungeon = a) ? "ENTER" : "LEAVE";
            (b || c) && sc.commonEvents.triggerEvent("DUNGEON_TRANSITION", {
                mapTransition: b,
                areaTransition: c
            })
        },
        respawnMembers: function() {
            for (var a = 0; a < this.currentParty.length; ++a) this.models[this.currentParty[a]].isAlive() && this._spawnPartyMemberEntity(this.currentParty[a], false, true);
            this._updateEntitiesOffset()
        },
        isDungeonBlocked: function() {
            return this.dungeonBlocked
        },
        isPartyMember: function(a) {
            return this.getCurrentPartyIndex(a) != -1
        },
        isFriend: function(a) {
            return this.contacts[a].status ==
                sc.PARTY_MEMBER_TYPE.FRIEND
        },
        isPartyMemberLocked: function(a) {
            return (a = this.contacts[a]) && a.locked
        },
        isPartyMemberOnline: function(a) {
            return (a = this.contacts[a]) && a.online
        },
        isDefeated: function() {
            for (var a = this.currentParty.length; a--;)
                if (!this.partyEntities[this.currentParty[a]].isDefeated()) return false;
            return ig.game.playerEntity.isDefeated()
        },
        getCurrentPartyIndex: function(a) {
            return this.currentParty.indexOf(a)
        },
        getPartySize: function() {
            return this.currentParty.length
        },
        getPartySizeAlive: function(a) {
            if (this.isDungeonBlocked()) return 0;
            for (var b = this.currentParty.length, c = 0; b--;) {
                var d = this.getPartyMemberModel(this.currentParty[b]);
                if (d.isAlive() && (!a || !d.isAlive().temporary)) c = c + 1
            }
            return c
        },
        getDmgFactor: function() {
            return sc.party.getStrategy("BEHAVIOUR").doNothing ? d[0] : d[this.getPartySizeAlive().limit(0, 2)]
        },
        getPartyMemberModel: function(a) {
            return this.models[a]
        },
        getPartyMemberEntity: function(a) {
            return this.partyEntities[a] || null
        },
        getPartyMemberEntityByIndex: function(a, b) {
            if (b) {
                var c = this.getPartyMemberModelByIndex(a);
                if (!c || !c.isAlive()) return null
            }
            return this.partyEntities[this.currentParty[a]] ||
                null
        },
        getPartyMemberIndex: function(a) {
            return this.currentParty.indexOf(a)
        },
        getPartyMemberModelByIndex: function(a) {
            return (a = this.currentParty[a]) && this.models[a]
        },
        addExperience: function(b, c, d, h, i) {
            var j = this.getPartySize().limit(0, 2);
            if (i && i.ignorePartyCount || this.isDungeonBlocked()) j = 0;
            for (var j = a[j] || 1, k = this.currentParty.length; k--;) this.models[this.currentParty[k]].addExperience(b * j, c, d, h, i);
            return j
        },
        updateEquipment: function() {
            for (var a = this.currentParty.length, b = []; a--;) {
                var c = this.currentParty[a];
                this.models[c].updateAutoEquip() && b.push(c)
            }
            b.length > 0 && sc.commonEvents.triggerEvent("PARTY_MEMBER_EVENT", {
                member: b,
                eventType: "EQUIP_UPDATE"
            })
        },
        resetMemberPos: function(a) {
            var c = this.partyEntities[a];
            if (c) {
                a = this._getMemberPos(b, a, false);
                c.setPos(a.x, a.y, a.z)
            }
        },
        resetAi: function() {
            this.ai.aggressive = 0;
            this.ai.battle = 0;
            this.ai.targeting = 0
        },
        _getMemberPos: function(a, c, d) {
            var h = ig.game.playerEntity,
                c = this.currentParty.indexOf(c);
            if (d) {
                a = h.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, a);
                d = c == 1 ? -16 : 16;
                if (Math.abs(h.face.x) >
                    Math.abs(h.face.y)) {
                    a.y = a.y + d;
                    a.x = a.x + (h.face.x > 0 ? -8 : 8)
                } else {
                    a.x = a.x + d;
                    a.y = a.y + (h.face.y > 0 ? -8 : 8)
                }
                a.x = a.x - h.coll.size.x / 2;
                a.y = a.y - h.coll.size.y / 2
            } else if (h.coll.pos.z != h.coll.baseZPos) a = Vec3.assign(a, h.respawn.pos);
            else {
                ig.navigation.getClosePosition(a, h.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, b), h.coll.size, h, null, 48, 1, 0, ig.NAV_CLOSE_POINT_SEARCH.BEHIND_FACE, false);
                a.x = a.x - h.coll.size.x / 2;
                a.y = a.y - h.coll.size.y / 2
            }
            return a
        },
        doDeferredEntityUpdate: function() {
            if (!this.dungeonBlocked) {
                for (var a in this.partyEntities) this.isPartyMember(a) ||
                    this._removePartyMemberEntity(a);
                for (var b = this.currentParty.length; b--;) {
                    a = this.currentParty[b];
                    this.partyEntities[a] || this._spawnPartyMemberEntity(a, true, false)
                }
                this._updateEntitiesOffset()
            }
        },
        _spawnPartyMemberEntity: function(a, c, d, h) {
            var i = ig.game.playerEntity;
            if (h) {
                d = h.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, b);
                d.x = d.x - i.coll.size.x / 2;
                d.y = d.y + (h.coll.size.y / 2 - i.coll.size.y)
            } else d = this._getMemberPos(b, a, d);
            c = ig.game.spawnEntity(sc.PartyMemberEntity, d.x, d.y, d.z, {
                partyMemberName: a
            }, !h && c);
            this.partyEntities[a] =
                c;
            if (h) {
                Vec2.assign(c.face, h.face);
                if (h.onPartySwapHide) h.onPartySwapHide();
                else h.hide()
            } else Vec2.assign(c.face, i.face);
            c.initAnimations(true);
            if (h) c.noFaceRotate = true
        },
        _updateEntitiesOffset: function() {
            for (var a = 0; a < this.currentParty.length; ++a) {
                var b = this.partyEntities[this.currentParty[a]];
                if (b)
                    if (this.currentParty.length == 1) {
                        b.posOffset.x = 0;
                        b.posOffset.y = -16
                    } else {
                        b.posOffset.x = a % 2 == 1 ? -16 : 16;
                        if (a % 2 == 0 && a == this.currentParty.length - 1) b.posOffset.x = 0;
                        b.posOffset.y = -8 - Math.floor(a / 2) * 16
                    }
            }
        },
        _removePartyMemberEntity: function(a,
            c, d) {
            var h = this.partyEntities[a];
            if (h) {
                if (c) {
                    c.resetNpcState(true);
                    var i = h.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, b);
                    i.x = i.x - c.coll.size.x / 2;
                    i.y = i.y + (h.coll.size.y / 2 - c.coll.size.y);
                    c.setPos(i.x, i.y, i.z);
                    ig.EntityTools.clearEntitySpriteCut(c);
                    c.show();
                    c.resetNpcState()
                }
                h.leaveParty(d || !!c);
                delete this.partyEntities[a]
            }
        },
        onVarAccess: function(a, b) {
            if (b[0] == "party") {
                var c = b[1];
                return c == "has" ? this.currentParty.indexOf(b[2]) != -1 : c == "alive" ? !this.dungeonBlocked && this.currentParty.indexOf(b[2]) != -1 && this.getPartyMemberModel(b[2]).isAlive() :
                    c == "size" ? this.currentParty.length + 1 : null
            }
        },
        postUpdateOrder: 600,
        onPostUpdate: function() {
            if (!ig.loading && !ig.game.paused) {
                if (this._deferredEntityUpdate) {
                    this.doDeferredEntityUpdate();
                    this._deferredEntityUpdate = false
                }
                for (var a = this.currentParty.length; a--;) this.models[this.currentParty[a]].update()
            }
        },
        onReset: function() {
            for (var a in this.models) this.models[a].reset();
            this.currentParty.length = 0;
            this.resetAi();
            this.updatePartyStrategy("TARGET", "WHATEVER");
            this.updatePartyStrategy("BEHAVIOUR", "OFFENSIVE");
            this.updatePartyStrategy("ARTS", "NORMAL");
            this.lastAreaDungeon = this.dungeonBlocked = false;
            for (a = 0; a < sc.PARTY_OPTIONS.length; ++a) this.contacts[sc.PARTY_OPTIONS[a]] = {
                status: sc.PARTY_MEMBER_TYPE.UNKNOWN,
                online: true,
                locked: false
            };
            sc.Model.notifyObserver(this, sc.PARTY_MSG.PARTY_CHANGED)
        },
        onStorageSave: function(a) {
            var b = {},
                c;
            for (c in this.models) b[c] = this.models[c].getSaveData();
            c = {};
            for (var d in this.contacts) c[d] = {
                status: this.contacts[d].status,
                online: this.contacts[d].online,
                locked: this.contacts[d].locked
            };
            a.party = {
                models: b,
                currentParty: ig.copy(this.currentParty),
                contacts: c,
                strategies: ig.copy(this.strategyKeys),
                dungeonBlocked: this.dungeonBlocked,
                lastAreaDungeon: this.lastAreaDungeon
            }
        },
        onStoragePreLoad: function(a) {
            if (a = a.party) {
                for (var b in this.models) this.models[b].setLoadData(a.models[b]);
                this.currentParty = ig.copy(a.currentParty);
                for (var c in this.contacts)
                    if (a.contacts[c]) {
                        this.contacts[c].status = a.contacts[c].status || 0;
                        this.contacts[c].online = a.contacts[c].online || false;
                        this.contacts[c].locked = a.contacts[c].locked ||
                            false
                    } if (a.strategies)
                    for (c in this.strategyKeys) this.strategyKeys[c] = a.strategies[c] || this.strategyKeys[c];
                this.dungeonBlocked = a.dungeonBlocked;
                this.lastAreaDungeon = a.lastAreaDungeon || false
            } else this.onReset();
            sc.Model.notifyObserver(this, sc.PARTY_MSG.PARTY_CHANGED)
        }
    });
    ig.addGameAddon(function() {
        return sc.party = new sc.PartyModel
    });
    var c = ig.copy(sc.PARTY_OPTIONS);
    c.unshift("Member3");
    c.unshift("Member2");
    ig.Event.registerEntityFetchType("party", function(a) {
        if (a.indexOf("Member") == 0) {
            a = a.substr(6,
                1) * 1 - 2;
            return sc.party.getPartyMemberEntityByIndex(a)
        }
        return sc.party.getPartyMemberEntity(a)
    }, {
        _type: "String",
        _select: c
    })
});
ig.baked = !0;

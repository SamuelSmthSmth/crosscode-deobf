/**
 * @module game.feature.party.party
 *
 * Party system model. Manages the set of known party members (models), the
 * current active party, their in-map entities, contact status, dungeon
 * blocking (party members vanish in dungeons), AI parameters, experience
 * sharing, strategies, and save/load.
 */
ig.module("game.feature.party.party").requires("impact.feature.storage.storage", "impact.base.event", "game.feature.menu.map-model", "game.feature.model.game-model").defines(function() {
    var MEMBER_POS = Vec3.create();
    Vec2.create();
    sc.PARTY_MSG = {
        PARTY_CHANGED: 1,
        DUNGEON_BLOCK_CHANGED: 2
    };
    sc.PARTY_MAX_MEMBERS = 2;
    var EXP_FACTORS = [1, 0.9, 0.75],
        DMG_FACTORS = [1, 0.8, 0.6];
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
            for (var i = 0; i < sc.PARTY_OPTIONS.length; ++i) this.addPartyOption(sc.PARTY_OPTIONS[i]);
            this.onReset();
            ig.storage.register(this);
            ig.vars.registerVarAccessor("party", this, "VarPartyEditor");
            sc.Model.addObserver(sc.model, this)
        },
        getStrategy: function(strategyType) {
            return sc.PARTY_STRATEGY[strategyType][this.strategyKeys[strategyType]] || {}
        },
        updatePartyStrategy: function(strategyType, key) {
            this.strategyKeys[strategyType] = key
        },
        getStrategyKey: function(strategyType, index) {
            if (strategyType == "TARGET") {
                if (index == 0) return "WHATEVER";
                if (index == 1) return "MY_ENEMY";
                if (index == 2) return "OTHERS"
            } else if (strategyType == "BEHAVIOUR") {
                if (index == 0) return "OFFENSIVE";
                if (index == 1) return "DEFENSIVE";
                if (index == 2) return "DO_NOTHING"
            } else if (strategyType == "ARTS") {
                if (index == 0) return "NORMAL";
                if (index ==
                    1) return "OFTEN";
                if (index == 2) return "NEVER"
            }
        },
        setContactType: function(member, status) {
            if (this.contacts[member]) this.contacts[member].status = status
        },
        setOnlineStatus: function(member, online) {
            if (this.contacts[member]) this.contacts[member].online = online || false
        },
        setLocked: function(member, locked) {
            if (this.contacts[member]) this.contacts[member].locked = locked || false
        },
        addPartyOption: function(member) {
            var model = new sc.PartyMemberModel(member);
            this.models[member] = model
        },
        initParty: function(memberList) {
            for (var memberList = memberList.split(","), i = 0; i < memberList.length; ++i) this.addPartyMember(memberList[i], null, true, false, i >= 2)
        },
        addPartyMember: function(member, npcEntity, noSpawn, skipEffect, temporary) {
            if (this.currentParty.indexOf(member) ==
                -1) {
                if (!temporary) {
                    this.setContactType(member, sc.PARTY_MEMBER_TYPE.FRIEND);
                    this.setOnlineStatus(member, true)
                }
                this.currentParty.push(member);
                this.models[member].revive();
                this.models[member].setTemporary(temporary || false);
                if (!npcEntity && skipEffect) {
                    this._spawnPartyMemberEntity(member, false, false);
                    this._updateEntitiesOffset()
                } else if (!noSpawn)
                    if (npcEntity) {
                        this._spawnPartyMemberEntity(member, true, false, npcEntity);
                        this._updateEntitiesOffset()
                    } else this._deferredEntityUpdate = true;
                sc.Model.notifyObserver(this, sc.PARTY_MSG.PARTY_CHANGED);
                ig.game.varsChangedDeferred()
            }
        },
        removePartyMember: function(member,
            npcEntity, skipEffect) {
            if (this.isPartyMember(member)) {
                var partyIndex = this.currentParty.indexOf(member);
                this.currentParty.splice(partyIndex, 1);
                this.contacts[member].locked = false;
                if (!npcEntity && skipEffect) {
                    this._removePartyMemberEntity(member, null, true);
                    this._updateEntitiesOffset()
                } else if (npcEntity) {
                    this._removePartyMemberEntity(member, npcEntity);
                    this._updateEntitiesOffset()
                } else this._deferredEntityUpdate = true;
                this.models[member].noDie = false;
                this.models[member].revive();
                this.models[member].setTemporary(false);
                sc.Model.notifyObserver(this, sc.PARTY_MSG.PARTY_CHANGED);
                ig.game.varsChangedDeferred()
            }
        },
        reviveAllPartyMembers: function() {
            for (var i =
                    this.currentParty.length; i--;) {
                var member = this.currentParty[i];
                this.models[member].isAlive() || this.revivePartyMemberEntity(member)
            }
        },
        reviveAllPartyMemberModels: function() {
            for (var i = this.currentParty.length; i--;) {
                var member = this.currentParty[i];
                this.models[member] && this.models[member].revive()
            }
        },
        revivePartyMemberEntity: function(member) {
            var partyIndex = this.currentParty.indexOf(member);
            this.models[member].revive();
            if (partyIndex != -1) {
                this._spawnPartyMemberEntity(member, true, false, null);
                this._updateEntitiesOffset()
            }
        },
        modelChanged: function(model, msg) {
            msg == sc.GAME_MODEL_MSG.STATE_CHANGED &&
                model.isCutscene() && this.reviveAllPartyMembers()
        },
        onMemberDefeat: function(member) {
            this.models[member].onDefeat();
            sc.commonEvents.triggerEvent("PARTY_MEMBER_EVENT", {
                member: [member],
                eventType: "DIES"
            });
            sc.model.isCombatMode() || this.reviveAllPartyMembers()
        },
        keepMapDungeon: function() {
            this.lastAreaDungeon = this.dungeonBlocked = true;
            sc.Model.notifyObserver(this, sc.PARTY_MSG.DUNGEON_BLOCK_CHANGED);
            for (var i = this.currentParty.length; i--;) {
                var entity = this.partyEntities[this.currentParty[i]];
                entity && entity.hide()
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
            var isDungeon = sc.map.isDungeon(true),
                mapTransition = null,
                areaTransition = null;
            if (sc.map.isDungeon()) {
                if (!this.dungeonBlocked) {
                    this.dungeonBlocked = true;
                    sc.Model.notifyObserver(this, sc.PARTY_MSG.DUNGEON_BLOCK_CHANGED);
                    mapTransition = "ENTER"
                }
            } else {
                if (this.dungeonBlocked) {
                    this.dungeonBlocked = false;
                    sc.Model.notifyObserver(this, sc.PARTY_MSG.DUNGEON_BLOCK_CHANGED);
                    mapTransition = "LEAVE"
                }
                this.respawnMembers()
            }
            if (isDungeon !=
                this.lastAreaDungeon) areaTransition = (this.lastAreaDungeon = isDungeon) ? "ENTER" : "LEAVE";
            (mapTransition || areaTransition) && sc.commonEvents.triggerEvent("DUNGEON_TRANSITION", {
                mapTransition: mapTransition,
                areaTransition: areaTransition
            })
        },
        respawnMembers: function() {
            for (var i = 0; i < this.currentParty.length; ++i) this.models[this.currentParty[i]].isAlive() && this._spawnPartyMemberEntity(this.currentParty[i], false, true);
            this._updateEntitiesOffset()
        },
        isDungeonBlocked: function() {
            return this.dungeonBlocked
        },
        isPartyMember: function(member) {
            return this.getCurrentPartyIndex(member) != -1
        },
        isFriend: function(member) {
            return this.contacts[member].status ==
                sc.PARTY_MEMBER_TYPE.FRIEND
        },
        isPartyMemberLocked: function(member) {
            return (member = this.contacts[member]) && member.locked
        },
        isPartyMemberOnline: function(member) {
            return (member = this.contacts[member]) && member.online
        },
        isDefeated: function() {
            for (var i = this.currentParty.length; i--;)
                if (!this.partyEntities[this.currentParty[i]].isDefeated()) return false;
            return ig.game.playerEntity.isDefeated()
        },
        getCurrentPartyIndex: function(member) {
            return this.currentParty.indexOf(member)
        },
        getPartySize: function() {
            return this.currentParty.length
        },
        getPartySizeAlive: function(includeTemporary) {
            if (this.isDungeonBlocked()) return 0;
            for (var i = this.currentParty.length, aliveCount = 0; i--;) {
                var model = this.getPartyMemberModel(this.currentParty[i]);
                if (model.isAlive() && (!includeTemporary || !model.isAlive().temporary)) aliveCount = aliveCount + 1
            }
            return aliveCount
        },
        getDmgFactor: function() {
            return sc.party.getStrategy("BEHAVIOUR").doNothing ? DMG_FACTORS[0] : DMG_FACTORS[this.getPartySizeAlive().limit(0, 2)]
        },
        getPartyMemberModel: function(member) {
            return this.models[member]
        },
        getPartyMemberEntity: function(member) {
            return this.partyEntities[member] || null
        },
        getPartyMemberEntityByIndex: function(index, checkAlive) {
            if (checkAlive) {
                var model = this.getPartyMemberModelByIndex(index);
                if (!model || !model.isAlive()) return null
            }
            return this.partyEntities[this.currentParty[index]] ||
                null
        },
        getPartyMemberIndex: function(member) {
            return this.currentParty.indexOf(member)
        },
        getPartyMemberModelByIndex: function(index) {
            return (index = this.currentParty[index]) && this.models[index]
        },
        addExperience: function(exp, enemyLevel, isBonus, ignoreCap, extraParams) {
            var partyCount = this.getPartySize().limit(0, 2);
            if (extraParams && extraParams.ignorePartyCount || this.isDungeonBlocked()) partyCount = 0;
            for (var partyCount = EXP_FACTORS[partyCount] || 1, i = this.currentParty.length; i--;) this.models[this.currentParty[i]].addExperience(exp * partyCount, enemyLevel, isBonus, ignoreCap, extraParams);
            return partyCount
        },
        updateEquipment: function() {
            for (var i = this.currentParty.length, updatedMembers = []; i--;) {
                var member = this.currentParty[i];
                this.models[member].updateAutoEquip() && updatedMembers.push(member)
            }
            updatedMembers.length > 0 && sc.commonEvents.triggerEvent("PARTY_MEMBER_EVENT", {
                member: updatedMembers,
                eventType: "EQUIP_UPDATE"
            })
        },
        resetMemberPos: function(member) {
            var entity = this.partyEntities[member];
            if (entity) {
                member = this._getMemberPos(MEMBER_POS, member, false);
                entity.setPos(member.x, member.y, member.z)
            }
        },
        resetAi: function() {
            this.ai.aggressive = 0;
            this.ai.battle = 0;
            this.ai.targeting = 0
        },
        _getMemberPos: function(outPos, member, isRespawn) {
            var player = ig.game.playerEntity,
                member = this.currentParty.indexOf(member);
            if (isRespawn) {
                outPos = player.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, outPos);
                var sideOffset = member == 1 ? -16 : 16;
                if (Math.abs(player.face.x) >
                    Math.abs(player.face.y)) {
                    outPos.y = outPos.y + sideOffset;
                    outPos.x = outPos.x + (player.face.x > 0 ? -8 : 8)
                } else {
                    outPos.x = outPos.x + sideOffset;
                    outPos.y = outPos.y + (player.face.y > 0 ? -8 : 8)
                }
                outPos.x = outPos.x - player.coll.size.x / 2;
                outPos.y = outPos.y - player.coll.size.y / 2
            } else if (player.coll.pos.z != player.coll.baseZPos) outPos = Vec3.assign(outPos, player.respawn.pos);
            else {
                ig.navigation.getClosePosition(outPos, player.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, MEMBER_POS), player.coll.size, player, null, 48, 1, 0, ig.NAV_CLOSE_POINT_SEARCH.BEHIND_FACE, false);
                outPos.x = outPos.x - player.coll.size.x / 2;
                outPos.y = outPos.y - player.coll.size.y / 2
            }
            return outPos
        },
        doDeferredEntityUpdate: function() {
            if (!this.dungeonBlocked) {
                for (var member in this.partyEntities) this.isPartyMember(member) ||
                    this._removePartyMemberEntity(member);
                for (var i = this.currentParty.length; i--;) {
                    member = this.currentParty[i];
                    this.partyEntities[member] || this._spawnPartyMemberEntity(member, true, false)
                }
                this._updateEntitiesOffset()
            }
        },
        _spawnPartyMemberEntity: function(member, noRespawn, isRespawn, npcEntity) {
            var player = ig.game.playerEntity;
            if (npcEntity) {
                isRespawn = npcEntity.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, MEMBER_POS);
                isRespawn.x = isRespawn.x - player.coll.size.x / 2;
                isRespawn.y = isRespawn.y + (npcEntity.coll.size.y / 2 - player.coll.size.y)
            } else isRespawn = this._getMemberPos(MEMBER_POS, member, isRespawn);
            var entity = ig.game.spawnEntity(sc.PartyMemberEntity, isRespawn.x, isRespawn.y, isRespawn.z, {
                partyMemberName: member
            }, !npcEntity && noRespawn);
            this.partyEntities[member] =
                entity;
            if (npcEntity) {
                Vec2.assign(entity.face, npcEntity.face);
                if (npcEntity.onPartySwapHide) npcEntity.onPartySwapHide();
                else npcEntity.hide()
            } else Vec2.assign(entity.face, player.face);
            entity.initAnimations(true);
            if (npcEntity) entity.noFaceRotate = true
        },
        _updateEntitiesOffset: function() {
            for (var i = 0; i < this.currentParty.length; ++i) {
                var entity = this.partyEntities[this.currentParty[i]];
                if (entity)
                    if (this.currentParty.length == 1) {
                        entity.posOffset.x = 0;
                        entity.posOffset.y = -16
                    } else {
                        entity.posOffset.x = i % 2 == 1 ? -16 : 16;
                        if (i % 2 == 0 && i == this.currentParty.length - 1) entity.posOffset.x = 0;
                        entity.posOffset.y = -8 - Math.floor(i / 2) * 16
                    }
            }
        },
        _removePartyMemberEntity: function(member,
            npcEntity, isLeaveParty) {
            var entity = this.partyEntities[member];
            if (entity) {
                if (npcEntity) {
                    npcEntity.resetNpcState(true);
                    var bottomPos = entity.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, MEMBER_POS);
                    bottomPos.x = bottomPos.x - npcEntity.coll.size.x / 2;
                    bottomPos.y = bottomPos.y + (entity.coll.size.y / 2 - npcEntity.coll.size.y);
                    npcEntity.setPos(bottomPos.x, bottomPos.y, bottomPos.z);
                    ig.EntityTools.clearEntitySpriteCut(npcEntity);
                    npcEntity.show();
                    npcEntity.resetNpcState()
                }
                entity.leaveParty(isLeaveParty || !!npcEntity);
                delete this.partyEntities[member]
            }
        },
        onVarAccess: function(path, parts) {
            if (parts[0] == "party") {
                var member = parts[1];
                return member == "has" ? this.currentParty.indexOf(parts[2]) != -1 : member == "alive" ? !this.dungeonBlocked && this.currentParty.indexOf(parts[2]) != -1 && this.getPartyMemberModel(parts[2]).isAlive() :
                    member == "size" ? this.currentParty.length + 1 : null
            }
        },
        postUpdateOrder: 600,
        onPostUpdate: function() {
            if (!ig.loading && !ig.game.paused) {
                if (this._deferredEntityUpdate) {
                    this.doDeferredEntityUpdate();
                    this._deferredEntityUpdate = false
                }
                for (var i = this.currentParty.length; i--;) this.models[this.currentParty[i]].update()
            }
        },
        onReset: function() {
            for (var member in this.models) this.models[member].reset();
            this.currentParty.length = 0;
            this.resetAi();
            this.updatePartyStrategy("TARGET", "WHATEVER");
            this.updatePartyStrategy("BEHAVIOUR", "OFFENSIVE");
            this.updatePartyStrategy("ARTS", "NORMAL");
            this.lastAreaDungeon = this.dungeonBlocked = false;
            for (member = 0; member < sc.PARTY_OPTIONS.length; ++member) this.contacts[sc.PARTY_OPTIONS[member]] = {
                status: sc.PARTY_MEMBER_TYPE.UNKNOWN,
                online: true,
                locked: false
            };
            sc.Model.notifyObserver(this, sc.PARTY_MSG.PARTY_CHANGED)
        },
        onStorageSave: function(storageData) {
            var modelsData = {},
                key;
            for (key in this.models) modelsData[key] = this.models[key].getSaveData();
            key = {};
            for (var contactKey in this.contacts) key[contactKey] = {
                status: this.contacts[contactKey].status,
                online: this.contacts[contactKey].online,
                locked: this.contacts[contactKey].locked
            };
            storageData.party = {
                models: modelsData,
                currentParty: ig.copy(this.currentParty),
                contacts: key,
                strategies: ig.copy(this.strategyKeys),
                dungeonBlocked: this.dungeonBlocked,
                lastAreaDungeon: this.lastAreaDungeon
            }
        },
        onStoragePreLoad: function(storageData) {
            if (storageData = storageData.party) {
                for (var member in this.models) this.models[member].setLoadData(storageData.models[member]);
                this.currentParty = ig.copy(storageData.currentParty);
                for (var contactKey in this.contacts)
                    if (storageData.contacts[contactKey]) {
                        this.contacts[contactKey].status = storageData.contacts[contactKey].status || 0;
                        this.contacts[contactKey].online = storageData.contacts[contactKey].online || false;
                        this.contacts[contactKey].locked = storageData.contacts[contactKey].locked ||
                            false
                    } if (storageData.strategies)
                    for (contactKey in this.strategyKeys) this.strategyKeys[contactKey] = storageData.strategies[contactKey] || this.strategyKeys[contactKey];
                this.dungeonBlocked = storageData.dungeonBlocked;
                this.lastAreaDungeon = storageData.lastAreaDungeon || false
            } else this.onReset();
            sc.Model.notifyObserver(this, sc.PARTY_MSG.PARTY_CHANGED)
        }
    });
    ig.addGameAddon(function() {
        return sc.party = new sc.PartyModel
    });
    var PARTY_FETCH_OPTIONS = ig.copy(sc.PARTY_OPTIONS);
    PARTY_FETCH_OPTIONS.unshift("Member3");
    PARTY_FETCH_OPTIONS.unshift("Member2");
    ig.Event.registerEntityFetchType("party", function(memberName) {
        if (memberName.indexOf("Member") == 0) {
            memberName = memberName.substr(6,
                1) * 1 - 2;
            return sc.party.getPartyMemberEntityByIndex(memberName)
        }
        return sc.party.getPartyMemberEntity(memberName)
    }, {
        _type: "String",
        _select: PARTY_FETCH_OPTIONS
    })
});
ig.baked = !0;

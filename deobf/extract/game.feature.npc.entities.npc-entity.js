ig.module("game.feature.npc.entities.npc-entity").requires("game.feature.npc.entities.sc-actor", "game.feature.character.character", "game.feature.interact.map-interact", "game.feature.trade.gui.trade-menu").defines(function() {
    var b = new ig.ActorConfig({
            jumpingEnabled: true,
            maxVel: 180,
            weight: 200
        }),
        a = Vec3.create();
    Vec2.create();
    var d = new ig.Action("", [{
            type: "SET_FACE_TO_ENTITY",
            entity: {
                player: true
            },
            rotate: true
        }]),
        c = new ig.Action("", [{
            type: "SET_FACE",
            face: {
                actorAttrib: "preEventFace"
            },
            rotate: true
        }]);
    sc.NPC_REACT_TYPE = {
        PUSHABLE: 0,
        FIXED_POS: 1,
        FIXED_FACE: 2
    };
    sc.NPC_GENDER = {
        BOTH: 0,
        MALE: 1,
        FEMALE: 2
    };
    ig.LANG_CONTEXT.NPC = function(a) {
        return "NPC[" + (a.settings.name || "") + "]"
    };
    ig.ENTITY.NPC = sc.ActorEntity.extend({
        characterName: null,
        character: null,
        npcStates: [],
        npcStatesData: null,
        activeStateIdx: -1,
        configs: {},
        hidden: false,
        interactEntry: null,
        eventBlocked: false,
        deferredReset: false,
        npcEffects: new ig.EffectSheet("npc"),
        interactIcons: {
            normal: new sc.MapInteractIcon(new ig.TileSheet("media/gui/map-icon.png", 24, 24), {
                FOCUS: [0, 1, 2, 3, 4,
                    5, 5, 5
                ],
                NEAR: [6]
            }, 0.1),
            shop: new sc.MapInteractIcon(new ig.TileSheet("media/gui/map-icon.png", 24, 24, 0, 240), {
                FOCUS: [0, 0, 1, 2, 3, 0, 0, 0, 0],
                NEAR: [4],
                AWAY: [5]
            }, 0.1),
            quest: new sc.MapInteractIcon(new ig.TileSheet("media/gui/map-icon.png", 24, 24, 0, 216), {
                FOCUS: [1, 0, 1, 2, 3, 2],
                NEAR: [4],
                AWAY: [5]
            }, 0.1),
            arena: new sc.MapInteractIcon(new ig.TileSheet("media/gui/map-icon.png", 24, 24, 0, 264), {
                FOCUS: [1, 0, 1, 2, 3, 2],
                NEAR: [4],
                AWAY: [5]
            }, 0.1),
            newMsg: new sc.MapInteractIcon(new ig.TileSheet("media/gui/map-icon.png", 24, 24), {
                FOCUS: [0,
                    1, 2, 3, 4, 5, 5, 5
                ],
                NEAR: [6],
                AWAY: [7]
            }, 0.1),
            trade: new sc.MapInteractIcon(new ig.TileSheet("media/gui/map-icon.png", 40, 24, 0, 144), {
                FOCUS: [0, 1, 2, 3],
                NEAR: [4],
                AWAY: [5]
            }, 0.3),
            xeno: new sc.MapInteractIcon(new ig.TileSheet("media/gui/map-icon.png", 40, 24, 0, 192), {
                FOCUS: [2],
                NEAR: [2],
                AWAY: [2]
            }, 0.3),
            xenoEvent: new sc.MapInteractIcon(new ig.TileSheet("media/gui/map-icon.png", 40, 24, 0, 192), {
                FOCUS: [0],
                NEAR: [1],
                AWAY: [1]
            }, 0.3)
        },
        lookAtAction: null,
        eventCall: null,
        doPostEventAction: false,
        xenoDialog: null,
        xenoDialogGui: null,
        permaEffect: null,
        displayName: null,
        displayTrigger: null,
        displayNameRandom: null,
        respawn: {
            pos: Vec3.create()
        },
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                characterName: {
                    _type: "Character",
                    _info: "Character of NPC",
                    _context: "Character"
                },
                npcStates: {
                    _type: "NPCStates",
                    _info: "Different states of the NPC",
                    _popup: true
                },
                analyzable: {
                    _type: "Analyzable",
                    _info: "Analyzable if any.",
                    _compact: true,
                    _optional: true,
                    _popup: true
                },
                hideCondition: {
                    _type: "VarCondition",
                    _info: "Condition for entity to become transparent",
                    _optional: true,
                    _width: 70
                }
            },
            label: function() {
                return ""
            },
            drawBox: true,
            boxColor: "rgba(0,0,255, 0.5)"
        }),
        hideHandle: null,
        hideManager: null,
        init: function(a, b, c, d) {
            this.parent(a, b, c, d);
            this.coll.setSize(12, 12, 28);
            this.coll.edgeSlipInward = true;
            this.npcStatesData = d.npcStates;
            this.interactEntry = new sc.MapInteractEntry(this, this, this.interactIcons.normal, sc.INTERACT_Z_CONDITION.Z_RANGE_OVERLAP, true);
            this.interactEntry.blockedDuringCombat = true;
            Vec3.assign(this.respawn.pos, this.coll.pos);
            if (this.characterName = d.characterName) {
                if (window.wm) {
                    this._wm =
                        this._wm.copy();
                    this._wm.drawBox = false
                }
                this.character = new sc.Character(this.characterName);
                this.character.addLoadListener(this)
            }
            if (d.analyzable) {
                this.displayName = d.analyzable.text || null;
                this.displayTrigger = d.analyzable.active || null
            } else {
                this.displayName = d.displayName || null;
                this.displayTrigger = d.displayTrigger || null
            }
            if (d.hideCondition) this.hideManager = new ig.EntityHideManager(d.hideCondition)
        },
        onTerrainUpdate: function() {
            this.checkQuickRespawn()
        },
        setRespawnPoint: function(a) {
            Vec3.assignC(this.respawn.pos,
                a.x - this.coll.size.x / 2, a.y - this.coll.size.y / 2, a.z)
        },
        checkQuickRespawn: function() {
            var b = this.coll;
            if (b._collData && !b._collData.zBaseUncertain)
                if (b.pos.z < ig.game.minLevelZ && !this.tooHighToFall && !this.coll.ignoreCollision) {
                    if (b.vel.z < 0) b.vel.z = 0;
                    this.doQuickRespawn()
                } else {
                    this.coll.float.height && !this.jumping && !ig.CollTools.isCloseToEdge(this.coll) && (b.baseZPos >= ig.game.minLevelZ && !ig.terrain.isDangerTerrain(ig.terrain.getTerrain(this.coll, false, true))) && Vec3.assign(this.respawn.pos, this.coll.pos);
                    if (!(b.pos.z >
                            b.baseZPos || this.jumping || b.zGravityFactor == 0)) {
                        b = this.stepStats.terrain;
                        if (ig.terrain.isFallTerrain(b)) {
                            var c = this.getAlignedPos(ig.ENTITY_ALIGN.BOTTOM, a);
                            b == ig.TERRAIN.WATER && ig.game.effects.death.spawnFixed("waterSplash", c.x, c.y, c.z);
                            this.doQuickRespawn(b)
                        } else !ig.CollTools.isCloseToEdge(this.coll) && (!ig.terrain.isDangerTerrain(this.stepStats.terrain) && !this.respawn.timer) && Vec3.assign(this.respawn.pos, this.coll.pos)
                    }
                }
        },
        doQuickRespawn: function() {
            Vec3.assignC(this.coll.vel, 0, 0, 0);
            this.setPos(this.respawn.pos.x,
                this.respawn.pos.y, this.respawn.pos.z);
            this.nav.path.redoPathDeferred();
            ig.game.effects.npc.spawnOnTarget("appear", this)
        },
        getQuickMenuSettings: function() {
            return {
                type: "NPC",
                displayName: this.displayName,
                displayTrigger: this.displayTrigger,
                randomName: this.displayNameRandom,
                disabled: this.hidden
            }
        },
        onLoadableComplete: function(c) {
            if (!c) throw Error("Character loading failed for character '" + this.characterName);
            c = this.character.data;
            c.size && Vec3.assign(this.coll.size, c.size);
            c.shadow == void 0 && (c.shadow = 16);
            this.animSheet = new ig.AnimationSheet(c.animSheet);
            for (var d in c.walkAnimSet) this.storeWalkAnims(d, c.walkAnimSet[d]);
            var g = new ig.ActorConfig;
            g.loadFromData(c, b);
            for (var h in c.configs) {
                var i = c.configs[h];
                this.configs[h] = new ig.ActorConfig;
                this.configs[h].loadFromData(i, g)
            }
            this.setWalkAnims(d);
            if (d = this.npcStatesData)
                for (h = 0; h < d.length; ++h) this.npcStates.push(new sc.NpcState(d[h], this));
            this.npcStatesData = null;
            if (window.wm) {
                if (this.npcStates[0]) {
                    Vec2.assign(this.face, this.npcStates[0].face);
                    d = Vec3.assign(a,
                        this.coll.pos);
                    this.setDefaultConfig(this.configs[this.npcStates[0].config]);
                    this.setPos(d.x, d.y, d.z)
                }
            } else this.updateNpcState(true);
            this.lookAtAction = new ig.Action("", [{
                type: "SET_FACE_TO_ENTITY",
                entity: this,
                rotate: true
            }]);
            this.lookAtAction.eventAction = true;
            this.initAnimations()
        },
        onKill: function(a) {
            this.parent(a);
            this.character.decreaseRef();
            this.animSheet.decreaseRef();
            for (a = 0; a < this.npcStates.length; ++a) this.npcStates[a].clearCached()
        },
        update: function() {
            if (this.deferredReset) {
                this.eventBlocked =
                    false;
                this.updateNpcState(false, true);
                this.deferredReset = false
            }
            this.interactEntry.gui.hook.localAlpha = this.animState.alpha;
            this.hideManager && this.hideManager.update(this);
            this.parent()
        },
        onPartySwapHide: function() {
            sc.mapInteract.removeEntry(this.interactEntry);
            this.hide()
        },
        postActionUpdate: function() {
            if (!this.eventCall || !this.eventCall.isRunning() || !this.doPostEventAction) {
                this.eventCall = null;
                if (this.currentAction && this.currentAction.eventAction) this.eventBlocked = true;
                if (!this.currentAction && !this.eventBlocked)
                    if (this.hasStashedAction()) this.resumeStashedAction();
                    else {
                        var a = this.npcStates[this.activeStateIdx];
                        a && a.loopAction && this.setAction(a.loopAction)
                    } if (!this.currentAction && this.hidden && !this._hidden && !this.deferredReset) {
                    sc.mapInteract.removeEntry(this.interactEntry);
                    this.animState.alpha = 0;
                    this.hide()
                }
                if (!this.currentAction && !sc.model.isCutscene() && (this.postActionSceneReset || this.eventBlocked)) {
                    this.postActionSceneReset = false;
                    this.deferredReset = true
                }
            }
        },
        varsChanged: function() {
            this.updateNpcState(false);
            this.hideManager && this.hideManager.varsChanged(this)
        },
        resetNpcState: function(a) {
            if (a || this._hidden) {
                this.eventBlocked = false;
                this.updateNpcState(true, true)
            } else this.deferredReset = true
        },
        setConfig: function(a) {
            this.configs[a] ? this.setDefaultConfig(this.configs[a]) : ig.warn("NPC: No such config available: " + a)
        },
        hasNpcStateChanged: function() {
            for (var a = this.npcStates.length; a--;)
                if (this.npcStates[a].condition.evaluate()) break;
            return a != this.activeStateIdx
        },
        updateNpcState: function(b, c) {
            var d = this.currentAction && this.currentAction.eventAction && this._hidden,
                h =
                this.eventBlocked || this.currentAction && this.currentAction.eventAction && !this._hidden;
            b && (h = false);
            for (var i = this.npcStates.length; i--;)
                if (this.npcStates[i].condition.evaluate()) break;
            if (!d || this.npcStates[i] && !this.npcStates[i].hidden)
                if (c || b || i != this.activeStateIdx) {
                    this.permaEffect && this.permaEffect.stop();
                    this.permaEffect = null;
                    this.postActionSceneReset = h;
                    this.cancelPostEventAction();
                    var j = this.npcStates[this.activeStateIdx],
                        k = !j || j.hidden;
                    this.activeStateIdx = i;
                    if (i == -1) {
                        sc.mapInteract.removeEntry(this.interactEntry);
                        if (!h) {
                            this.hidden = true;
                            this.cancelAction();
                            this.hide()
                        }
                    } else {
                        i = this.npcStates[this.activeStateIdx];
                        if (!h) {
                            var l = this.configs[i.config];
                            i.reactType != sc.NPC_REACT_TYPE.PUSHABLE ? l.overwrite("weight", -1) : l.clearOverwrite();
                            var o;
                            if (d) {
                                o = this.currentAction;
                                this.cancelAction()
                            }
                            if (b) var m = Vec3.assign(a, this.coll.pos);
                            this.setDefaultConfig(this.configs[this.npcStates[0].config]);
                            b && this.setPos(m.x, m.y, m.z);
                            this.setDefaultConfig(l);
                            this.hidden = i.hidden;
                            d && this.setAction(o)
                        }
                        if (b)
                            if (this.hidden) this.hide();
                            else {
                                this.animState.alpha = 1;
                                this.show()
                            } this.setMapInteractIcon(i);
                        h || !i.npcEventObj ? sc.mapInteract.removeEntry(this.interactEntry) : sc.mapInteract.addEntry(this.interactEntry);
                        if (!h)
                            if (b || k && this.hidden && this._hidden) {
                                this.setPos(i.position.x - this.coll.size.x / 2, i.position.y - this.coll.size.y / 2, i.position.z);
                                Vec2.assign(this.face, i.face);
                                if (i.permaFx) this.permaEffect = i.permaFx.spawnOnTarget(this, {
                                    duration: -1
                                })
                            } else {
                                h = null;
                                if (k && this._hidden) {
                                    if (j) {
                                        this.setPos(j.position.x - this.coll.size.x / 2, j.position.y -
                                            this.coll.size.y / 2, j.position.z);
                                        Vec2.assign(this.face, j.face)
                                    }
                                    this.show();
                                    this.animState.alpha = 0;
                                    i.showFx ? i.showFx.spawnOnTarget(this) : this.npcEffects.spawnOnTarget("appear", this, {
                                        duration: 0
                                    });
                                    if (j && j.door) h = (j = ig.Event.getEntity(j.door)) && j.leaveEntity(this)
                                }
                                if (i.permaFx) this.permaEffect = i.permaFx.spawnOnTarget(this, {
                                    duration: -1
                                });
                                !d && i.reactType != sc.NPC_REACT_TYPE.FIXED_FACE && this.setAction(i.startAction);
                                h && this.pushInlineAction(h, true, true)
                            }
                    }
                }
        },
        setMapInteractIcon: function(a) {
            if (a.npcEventType ==
                sc.NPC_EVENT_TYPE.TRADE) {
                this.interactEntry.setIcon(this.interactIcons.trade);
                this.interactEntry.setSubGui(a.npcEventObj.iconGui)
            } else if (a.npcEventType == sc.NPC_EVENT_TYPE.QUEST) this.interactEntry.setIcon(this.interactIcons.quest);
            else if (a.npcEventType == sc.NPC_EVENT_TYPE.SHOP) this.interactEntry.setIcon(this.interactIcons.shop);
            else if (a.npcEventType == sc.NPC_EVENT_TYPE.ARENA) this.interactEntry.setIcon(this.interactIcons.arena);
            else {
                this.interactEntry.setIcon(this.interactIcons.normal);
                this.interactEntry.setSubGui(null)
            }
        },
        setXenoDialog: function(a) {
            this._initXenoDialogGui();
            this.interactEntry.setSubGui(this.xenoDialogGui);
            this.xenoDialog = a || null;
            sc.mapInteract.addEntry(this.interactEntry);
            this.xenoDialog.getCallbackEvent() ? this.interactEntry.setIcon(this.interactIcons.xenoEvent) : this.interactEntry.setIcon(this.interactIcons.xeno);
            this.xenoDialogGui.setText(a.getCurrentText(), a);
            this.xenoDialogGui.show()
        },
        isXenoTextFinished: function() {
            return this.xenoDialogGui && this.xenoDialogGui.isTextFinished()
        },
        cancelXenoDialog: function() {
            this.xenoDialog =
                null;
            this.xenoDialogGui.hide();
            sc.mapInteract.removeEntry(this.interactEntry)
        },
        _initXenoDialogGui: function() {
            if (!this.xenoDialogGui) this.xenoDialogGui = new sc.XenoDialogIcon
        },
        onInteraction: function() {
            var a;
            if (!sc.quests.hasSolvedQuestsStacked()) {
                if (this.xenoDialog) {
                    if (!this.xenoDialog.getCallbackEvent()) return false;
                    a = this.xenoDialog.getCallbackEvent();
                    this.xenoDialog.onEventStart()
                } else {
                    var b = this.npcStates[this.activeStateIdx];
                    b.npcEventObj && (a = b.npcEventType == sc.NPC_EVENT_TYPE.TRADE ? b.npcEventObj.event :
                        b.npcEventObj)
                }
                if (a) this.eventCall = ig.game.events.callEvent(a, ig.EventRunType.BLOCKING, this.onEventStart.bind(this), this.onEventEnd.bind(this), null, this, {
                    character: this.characterName
                })
            }
        },
        onEventStart: function() {
            var a = this.npcStates[this.activeStateIdx];
            ig.game.playerEntity.setAction(this.lookAtAction);
            var b = sc.party.getPartyMemberEntityByIndex(0),
                c = sc.party.getPartyMemberEntityByIndex(1);
            b && b.setAction(this.lookAtAction);
            c && c.setAction(this.lookAtAction);
            if (a.reactType != sc.NPC_REACT_TYPE.FIXED_FACE) {
                this.setAttribute("preEventFace",
                    ig.copy(this.face));
                this.doPostEventAction = true;
                this.eventBlocked ? this.eventBlocked = false : this.stashAction();
                this.setAction(d);
                this.eventBlocked = true
            }
            a = this.getCenter();
            a.y = a.y - this.coll.pos.z;
            ig.camera.pushTarget(new ig.Camera.TargetHandle(new ig.Camera.PosTarget(a), 0, 0), "FAST");
            sc.model.enterCutscene()
        },
        onEventEnd: function() {
            this.eventBlocked = false;
            if (this.currentAction && this.currentAction.eventAction) this.postActionSceneReset = true;
            if (!this.postActionSceneReset && this.doPostEventAction)
                if (this.hasStashedAction()) this.setAction(c);
                else {
                    var a = this.npcStates[this.activeStateIdx];
                    a && this.setAction(a.startAction)
                }
            else this.updateNpcState(false, true);
            if (this.xenoDialog) this.xenoDialog.onEventEnd();
            ig.camera.popTarget("FAST");
            sc.model.enterGame()
        },
        startTradeMenu: function() {
            var a = this.npcStates[this.activeStateIdx];
            a.npcEventObj && a.npcEventType == sc.NPC_EVENT_TYPE.TRADE && a.npcEventObj.startTradeMenu()
        },
        cancelPostEventAction: function() {
            this.clearStashedAction();
            this.doPostEventAction = false
        }
    });
    sc.NPC_EVENT_TYPE = {
        SIMPLE: 0,
        TRADE: 1,
        QUEST: 2,
        SHOP: 3,
        ARENA: 4
    };
    sc.NpcState = ig.Class.extend({
        _wm: new ig.Config({
            attributes: {
                condition: {
                    _type: "VarCondition",
                    _info: "Condition for this page to be active",
                    _height: 24
                },
                position: {
                    _type: "Vec3",
                    _info: "Position of NPC for this page",
                    _pointSelect: true,
                    _optional: true
                },
                reactType: {
                    _type: "String",
                    _info: "How NPC will react on touches and talking",
                    _float: true,
                    _select: sc.NPC_REACT_TYPE,
                    _default: "FIXED_POS"
                },
                face: {
                    _type: "Face",
                    _info: "Face direction.",
                    _float: true
                },
                config: {
                    _type: "CharConfig",
                    _info: "Configuration of Charater for this page",
                    _float: true
                },
                action: {
                    _type: "Action",
                    _info: "Action to perform constantly",
                    _popup: true,
                    _float: true,
                    _clear: true,
                    _optional: true
                },
                showFx: {
                    _type: "Effect",
                    _info: "Action to perform constantly",
                    _popup: true,
                    _float: true,
                    _optional: true
                },
                hideFx: {
                    _type: "Effect",
                    _info: "Action to perform constantly",
                    _popup: true,
                    _float: true,
                    _optional: true
                },
                permaFx: {
                    _type: "Effect",
                    _info: "Action to perform constantly",
                    _popup: true,
                    _float: true,
                    _optional: true
                },
                hidden: {
                    _type: "Boolean",
                    _info: "If true: NPC is hidden.",
                    _float: true,
                    _clear: true
                },
                door: {
                    _type: "Entity",
                    _info: "Door that NPC should enter from/leave to (only specify when hidden!)",
                    _optional: true,
                    _float: true
                },
                event: {
                    _type: "NPCEvent",
                    _info: "Type of npc event. e.g. simple event or trade."
                }
            }
        }),
        condition: null,
        position: Vec3.create(),
        config: null,
        face: Vec2.create(),
        hidden: false,
        door: null,
        startAction: null,
        loopAction: null,
        reactType: sc.NPC_REACT_TYPE.PUSHABLE,
        npcEventObj: null,
        npcEventType: null,
        showFx: null,
        permaFx: null,
        init: function(a, b) {
            this.condition = new ig.VarCondition(a.condition);
            if (a.position) ig.Event.getVec3(a.position,
                this.position);
            else {
                b.getCenter(this.position);
                this.position.z = b.coll.pos.z
            }
            ig.ActorEntity.getFaceVec(ig.ActorEntity.FACE8[a.face] || 0, this.face);
            this.hidden = a.hidden || false;
            this.config = a.config;
            if (!b.configs[this.config]) {
                for (var c in b.configs) break;
                this.config = c
            }
            this.door = a.door;
            this.reactType = sc.NPC_REACT_TYPE[a.reactType || "PUSHABLE"];
            c = [{
                type: "NAVIGATE_TO_POINT",
                target: this.position,
                maxTime: 0,
                teleportOnFail: true,
                precise: !this.door && this.reactType == sc.NPC_REACT_TYPE.FIXED_POS
            }];
            this.hidden ? c.push({
                type: "SHOW_EFFECT",
                effect: a.hideFx ? ig.copy(a.hideFx) : {
                    sheet: "npc",
                    name: "disappear"
                },
                duration: 0,
                wait: !this.door,
                actionDetached: true
            }) : c.push({
                type: "SET_FACE",
                face: a.face || 0,
                rotate: true
            });
            this.door && c.push({
                type: "ENTER_DOOR",
                door: this.door
            });
            this.startAction = new ig.Action("[NPC]", c);
            if (a.showFx) this.showFx = new ig.EffectHandle(a.showFx);
            if (a.permaFx) this.permaFx = new ig.EffectHandle(a.permaFx);
            if (a.action && a.action.length > 0 && !this.hidden) this.loopAction = new ig.Action("[NPC]", a.action);
            if (a.event)
                if (a.event instanceof Array) {
                    if (a.event.length >
                        0) {
                        c = {
                            name: "NPC EVENT",
                            steps: a.event
                        };
                        this.npcEventObj = new ig.Event(c);
                        this.npcEventType = sc.NPC_EVENT_TYPE.SIMPLE
                    }
                } else if (a.event instanceof Object)
                if (a.event.trade) {
                    this.npcEventObj = new sc.TradeInfo(a.event.trade, b);
                    this.npcEventType = sc.NPC_EVENT_TYPE.TRADE
                } else if (a.event.quest) {
                c = {
                    name: "NPC EVENT",
                    steps: a.event.quest
                };
                this.npcEventObj = new ig.Event(c);
                this.npcEventType = sc.NPC_EVENT_TYPE.QUEST
            } else if (a.event.shop) {
                c = {
                    name: "NPC EVENT",
                    steps: a.event.shop
                };
                this.npcEventObj = new ig.Event(c);
                this.npcEventType =
                    sc.NPC_EVENT_TYPE.SHOP
            } else if (a.event.arena) {
                c = {
                    name: "NPC EVENT",
                    steps: a.event.arena
                };
                this.npcEventObj = new ig.Event(c);
                this.npcEventType = sc.NPC_EVENT_TYPE.ARENA
            }
        },
        clearCached: function() {
            this.npcEventObj && this.npcEventObj.clearCached();
            this.startAction && this.startAction.clearCached();
            this.loopAction && this.loopAction.clearCached();
            this.showFx && this.showFx.clearCached();
            this.permaFx && this.permaFx.clearCached()
        }
    });
    ig.ACTOR_CONFIGS.NPC = {
        classType: ig.ENTITY.NPC,
        KEYS: {
            sizeOverride: null,
            terrain: 0
        },
        fromDataFix: function() {
            typeof this.terrain ==
                "string" && (this.terrain = ig.TERRAIN[this.terrain] || 0)
        },
        apply: function(a) {
            this.sizeOverride && a.coll.setSize(this.sizeOverride.x, this.sizeOverride.y, this.sizeOverride.z, true);
            a.terrain = this.terrain || 0
        },
        load: function(a) {
            this.terrain = a.terrain
        }
    }
});
ig.baked = !0;

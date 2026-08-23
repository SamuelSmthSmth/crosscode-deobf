/**
 * game.feature.puzzle.entities.chest
 * ==================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.puzzle.entities.chest")`.
 *
 * `ig.ENTITY.Chest`: a treasure chest that drops an item on interaction
 * (via `sc.ItemDropEntity.spawnDrops`). Variants in `sc.CHEST_TYPE`
 * (Default/Bronze/Silver/Gold need the matching key item, Key/MasterKey are
 * purely cosmetic). Opening is scripted with the `openChest` action;
 * `ig.ACTION_STEP.OPEN_CHEST` performs the actual opening.
 */
ig.module("game.feature.puzzle.entities.chest")
    .requires("impact.base.actor-entity", "impact.base.entity", "game.feature.interact.map-interact", "game.feature.inventory.inventory", "game.feature.menu.menu-model")
    .defines(function () {

    sc.CHEST_TYPE = {};
    sc.CHEST_KEY = {};
    sc.CHEST_KEY.BRONZE = 154;
    sc.CHEST_KEY.SILVER = 155;
    sc.CHEST_KEY.GOLD = 156;

    ig.ENTITY.Chest = ig.AnimatedEntity.extend({
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                chestType: {
                    _type: "String",
                    _info: "Type of the chest.",
                    _select: sc.CHEST_TYPE
                },
                item: {
                    _type: "Item",
                    _info: "The item to spawn."
                },
                amount: {
                    _type: "Number",
                    _info: "Amount of the given item. 0 = 1.",
                    _default: 1
                },
                spawnCondition: {
                    _type: "VarCondition",
                    _info: "Condition for Enemy to spawn",
                    _popup: true
                },
                variable: {
                    _type: "VarName",
                    _info: "the value to add 1 to",
                    _optional: true
                },
                trigger: {
                    _type: "VarName",
                    _info: "trigger to set to true the only 'once' when chest is activated",
                    _optional: true
                },
                hideCondition: {
                    _type: "VarCondition",
                    _info: "Condition for entity to become transparent",
                    _optional: true
                },
                noTrack: {
                    _type: "Boolean",
                    _info: "If true, this chest is not tracked in the area counter",
                    _optional: true,
                    _default: true
                },
                detectCondition: {
                    _type: "VarCondition",
                    _info: "Condition for Detector to pick up the chest",
                    _popup: true,
                    _optional: true
                }
            },
            label: function () {
                return this._itemName + " + " + this.amount
            }
        }),
        mapIcons: new sc.MapInteractIcon(new ig.TileSheet("media/gui/map-icon.png", 24, 24), {
            FOCUS: [50, 51, 52, 51],
            NEAR: [53]
        }, 0.2),
        mapIconsKey: new sc.MapInteractIcon(new ig.TileSheet("media/gui/map-icon.png", 24, 24), {
            FOCUS: [55, 56, 57, 58, 57, 58, 57, 56],
            NEAR: [54]
        }, 0.2),
        effects: {
            sheet: new ig.EffectSheet("map.chest"),
            handle: null
        },
        interactEntry: null,
        hideHandle: null,
        isOpen: false,
        chestVariable: false,
        item: null,
        amount: 0,
        chestType: null,
        lockedIcon: false,
        _itemName: null,
        _trigger: null,
        _initialized: false,
        _noTrack: false,

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.NONE;
            this.coll.zGravityFactor = 1;
            this.interactEntry = new sc.MapInteractEntry(this, this, this.mapIcons, sc.INTERACT_Z_CONDITION.Z_RANGE_OVERLAP, false);
            this.interactEntry.blockedDuringCombat = true;
            this._trigger = settings.trigger || null;
            this._noTrack = settings.noTrack || false;
            var chestType = sc.CHEST_TYPE[settings.chestType] || sc.CHEST_TYPE["default"];
            this.item = settings.item || 0;
            this.chestType = chestType;
            this.coll.setSize(17, 13, 12);
            this.chestVariable = (chestType = settings.variable || "") && chestType != "" ? chestType : "map.chest_" + this.mapId;
            this._itemName = ig.LangLabel.getText(sc.inventory.getItem(this.item).name) || "NULL";
            this.amount = settings.amount || 1;
            this.initAnimations({
                SUB: [{
                        shapeType: "Y_FLAT",
                        sheet: {
                            src: "media/entity/objects/treasure.png",
                            width: 16,
                            height: 24
                        },
                        time: 0.05,
                        frames: [0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5],
                        repeat: true,
                        SUB: [{
                            name: "idle"
                        }, {
                            name: "idleBronze"
                        }, {
                            name: "idleSilver"
                        }, {
                            name: "idleGold"
                        }, {
                            name: "idleKey"
                        }, {
                            name: "idleMasterKey"
                        }]
                    }, {
                        shapeType: "Y_FLAT",
                        sheet: {
                            src: "media/entity/objects/treasure.png",
                            width: 24,
                            height: 24,
                            offY: 56
                        },
                        SUB: [{
                            name: "idleBronze",
                            time: 0.05,
                            frames: [3],
                            repeat: true
                        }, {
                            name: "idleSilver",
                            time: 0.05,
                            frames: [2],
                            repeat: true
                        }, {
                            name: "idleGold",
                            time: 0.05,
                            frames: [0],
                            repeat: true
                        }, {
                            name: "idleKey",
                            time: 0.05,
                            frames: [4],
                            repeat: true
                        }, {
                            name: "idleMasterKey",
                            time: 0.05,
                            frames: [5],
                            repeat: true
                        }]
                    },
                    {
                        sheet: {
                            src: "media/entity/objects/treasure.png",
                            width: 24,
                            height: 32,
                            offY: 24
                        },
                        gfxOffset: {
                            x: 0,
                            y: 4
                        },
                        SUB: [{
                            name: "open",
                            time: 0.1,
                            frames: [0, 1, 2, 3],
                            repeat: false
                        }, {
                            name: "end",
                            time: 0.1,
                            frames: [4],
                            repeat: false,
                            shapeType: "Z_FLAT"
                        }]
                    }
                ]
            });
            if (ig.vars.get(this.chestVariable)) {
                this.isOpen = true;
                this.setCurrentAnim("end", true, null, true)
            } else {
                this.setCurrentAnim(this.chestType.anim || "idle", true, null, true);
                this.coll.float.height = 6;
                this.coll.float.variance = 2;
                this.coll.shadow.size = 16
            }
            this.animState.alpha = 1;
            if (settings.hideCondition) this.hideManager = new ig.EntityHideManager(settings.hideCondition);
            if (settings.detectCondition) this.detectCondition = new ig.VarCondition(settings.detectCondition)
        },

        _initGfx: function () {
            this._initialized = true;
            var areaItemType = sc.map.getAreaItemType(this.item);
            if (areaItemType == "DUNGEON_KEY") this.chestType = sc.CHEST_TYPE.Key;
            else if (areaItemType == "DUNGEON_MASTER_KEY") this.chestType = sc.CHEST_TYPE.MasterKey;
            !this.isOpen && this.chestType.anim && this.setCurrentAnim(this.chestType.anim, true, null, true)
        },

        onEffectEvent: function (effect) {
            if (this.hideHandle) {
                if (effect.isDone()) {
                    this.hideHandle = null;
                    this.hide()
                }
            } else effect.isDone() && this._reallyOpenUp()
        },

        show: function (show) {
            this.parent(show);
            if (!show) {
                this.animState.alpha = 0;
                ig.game.effects.teleport.spawnOnTarget("showDefault", this, {})
            }
            if (!this.isOpen) {
                this._updateIcon();
                sc.mapInteract.addEntry(this.interactEntry)
            }
        },

        _updateIcon: function () {
            var hasKey = this.chestType.item ? false : true;
            hasKey || (hasKey = sc.model.player.hasItem(this.chestType.item));
            hasKey ? this.interactEntry.setIcon(this.mapIcons) : this.interactEntry.setIcon(this.mapIconsKey)
        },

        onHideRequest: function () {
            sc.mapInteract.removeEntry(this.interactEntry);
            this.hideHandle = ig.game.effects.teleport.spawnOnTarget("hideDefault", this, {
                callback: this
            })
        },

        update: function () {
            this._initialized || this._initGfx();
            this.hideManager && this.hideManager.update(this);
            this.parent()
        },

        onInteraction: function () {
            var player = ig.game.playerEntity;
            if (player.currentAction && player.currentAction.eventAction) return false;
            if (this.isOpen) return true;
            if (this.chestType.item && !sc.model.player.hasItem(this.chestType.item)) {
                if (this._trigger && !ig.vars.get(this._trigger)) {
                    ig.vars.set(this._trigger, true);
                    return true
                }
                return false
            }
            var steps = [{
                    type: "SET_TERRAIN_FRICTION_IGNORE",
                    value: true
                }, {
                    type: "SET_WALK_ANIMS",
                    config: "normal"
                }, {
                    type: "SET_RELATIVE_SPEED",
                    value: 0.5
                }, {
                    type: "SET_FACE_TO_ENTITY",
                    entity: this,
                    rotate: true
                }, {
                    type: "SET_FACE_FIX",
                    value: true
                }, {
                    type: "MOVE_TO_ENTITY_DISTANCE",
                    entity: this,
                    min: 16,
                    max: 20,
                    maxTime: 0.2
                }, {
                    type: "SHOW_ANIMATION",
                    anim: "chestOpen"
                }],
                waitTime = this.chestType.openEffect ? 1.2 : 0.8;
            if (this._trigger && !ig.vars.get(this._trigger)) {
                steps.push({
                    type: "CHANGE_VAR_BOOL",
                    varName: this._trigger,
                    changeType: "set",
                    value: true
                });
                steps.push({
                    type: "WAIT",
                    time: 0.8
                })
            } else {
                steps.push({
                    type: "OPEN_CHEST",
                    entity: this
                });
                steps.push({
                    type: "WAIT",
                    time: waitTime
                })
            }
            steps.push({
                type: "SHOW_ANIMATION",
                anim: "preIdle",
                wait: true
            });
            var action = new ig.Action("openChest", steps);
            action.eventAction = true;
            player.setAction(action)
        },

        openUp: function () {
            this.chestType.openEffect ? this.effects.sheet.spawnOnTarget(this.chestType.openEffect, this, {
                callback: this,
                spriteFilter: [1]
            }) : this._reallyOpenUp()
        },

        _reallyOpenUp: function () {
            if (!this.isOpen) {
                this.isOpen = true;
                this.effects.sheet.spawnOnTarget("openRegular", this);
                sc.ItemDropEntity.spawnDrops(this, ig.ENTITY_ALIGN.CENTER, ig.game.playerEntity, this.item, this.amount, sc.ITEM_DROP_TYPE.CHEST);
                if (!this._noTrack) {
                    sc.stats.addMap("chests", sc.map.currentPlayerArea.path, 1);
                    sc.stats.addMap("chests", "total", 1);
                    sc.stats.setMap("chests", "totalRate", sc.map.getTotalChestsFound(true))
                }
                sc.mapInteract.removeEntry(this.interactEntry);
                this.setCurrentAnim("open", true, null, true, true);
                ig.vars.add(this.chestVariable, 1);
                ig.vars.set(this._trigger, true);
                this.coll.float.height = 0;
                this.coll.shadow.size = 0
            }
        },

        isOpened: function () {
            return this.isOpen
        },

        animationEnded: function (animName) {
            animName == "open" && this.setCurrentAnim("end", true, null, true)
        },

        varsChanged: function () {
            this.isOpen || this._updateIcon();
            this.hideManager && this.hideManager.varsChanged(this)
        }
    });

    ig.ACTION_STEP.OPEN_CHEST = ig.ActionStepBase.extend({
        entity: 0,

        init: function (settings) {
            this.entity = settings.entity
        },

        start: function () {
            var chest = ig.Event.getEntity(this.entity);
            chest && chest.openUp && chest.openUp()
        }
    });

    sc.CHEST_TYPE.Default = {
        anim: "idle"
    };

    sc.CHEST_TYPE.Bronze = {
        item: sc.CHEST_KEY.BRONZE,
        anim: "idleBronze",
        openEffect: "keyOpenBronze"
    };

    sc.CHEST_TYPE.Silver = {
        item: sc.CHEST_KEY.SILVER,
        anim: "idleSilver",
        openEffect: "keyOpenSilver"
    };

    sc.CHEST_TYPE.Gold = {
        item: sc.CHEST_KEY.GOLD,
        anim: "idleGold",
        openEffect: "keyOpenGold"
    };

    sc.CHEST_TYPE.Key = {
        anim: "idleKey"
    };

    sc.CHEST_TYPE.MasterKey = {
        anim: "idleMasterKey"
    }
});
ig.baked = !0;
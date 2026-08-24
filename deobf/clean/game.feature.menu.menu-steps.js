/**
 * game.feature.menu.menu-steps
 * ============================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.menu-steps")`.
 *
 * EVENT_STEP classes for menu/social-system mechanics: plant drops,
 * enemy/lore unlocking, landmark activation, chest-track undo, opening
 * shops and quest hubs directly, and undoing visited areas.
 */
ig.module("game.feature.menu.menu-steps")
    .requires("impact.base.utils", "impact.base.event", "impact.base.action", "game.feature.menu.menu-model", "game.feature.menu.map-model", "game.feature.menu.lore-model")
    .defines(function () {

    ig.EVENT_STEP.ADD_PLANT = ig.EventStepBase.extend({
        key: null,
        anim: null,
        _wm: new ig.Config({
            attributes: {
                plant: {
                    _type: "DropSelect",
                    _info: "drop to update"
                }
            }
        }),

        init: function (settings) {
            this.key = settings.plant;
            this.anim = ig.globalSettings.getGlobalSettingOptions("ENTITY", "ItemDestruct")[this.key].desType
        },

        start: function () {
            sc.menu.incrementDropCount(this.key, this.anim)
        }
    });

    ig.EVENT_STEP.UNLOCK_ENEMY = ig.EventStepBase.extend({
        enemy: null,
        asSpecial: null,
        _wm: new ig.Config({
            attributes: {
                enemy: {
                    _type: "EnemySearch",
                    _info: "Enemy to unlock, note that this enemy, use this only for special enemies."
                },
                asSpecial: {
                    _type: "Boolean",
                    _info: "if true 'special' will be displayed instead of kill count",
                    _default: true
                }
            }
        }),

        init: function (settings) {
            this.enemy = settings.enemy;
            this.asSpecial = settings.asSpecial == void 0 ? true : settings.asSpecial
        },

        start: function () {
            sc.stats.setMap("combat", "kill" + this.enemy, this.asSpecial ? -1 : 1);
            sc.stats.setMap("combat", "enemyCompletionRate", sc.combat.getTotalEnemiesFound(true))
        }
    });

    ig.EVENT_STEP.UNLOCK_LORE = ig.EventStepBase.extend({
        lore: null,
        notify: false,
        _wm: new ig.Config({
            attributes: {
                lore: {
                    _type: "LoreSelect",
                    _info: "Lore to unlock. Unlocks ALL entries "
                },
                notify: {
                    _type: "Boolean",
                    _info: "True if notification should be displayed",
                    _default: false
                }
            }
        }),

        init: function (settings) {
            this.lore = settings.lore;
            this.notify = settings.notify || false
        },

        start: function () {
            sc.lore.unlockLore(this.lore, this.notify)
        }
    });

    ig.EVENT_STEP.UNLOCK_LORE_ALL = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),

        init: function () {},

        start: function () {
            window.IG_GAME_DEBUG && sc.lore.unlockLoreAll()
        }
    });

    ig.EVENT_STEP.UNLOCK_LORE_FIRST_TIME = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),

        init: function () {},

        start: function () {
            sc.lore.notifyFirstActivated()
        }
    });

    ig.EVENT_STEP.UNLOCK_LORE_ENTRY = ig.EventStepBase.extend({
        lore: null,
        entry: null,
        notify: false,
        _wm: new ig.Config({
            attributes: {
                lore: {
                    _type: "LoreSelect",
                    _info: "Lore to the entry is associated with",
                    _context: "Lore"
                },
                entry: {
                    _type: "LoreEntrySelect",
                    _info: "The entry to unlock"
                },
                notify: {
                    _type: "Boolean",
                    _info: "True if notification should be displayed",
                    _default: false
                }
            }
        }),

        init: function (settings) {
            this.lore = settings.lore;
            this.entry = settings.entry;
            this.notify = settings.notify || false
        },

        start: function () {
            sc.lore.unlockLoreEntry(this.lore, this.entry, this.notify)
        }
    });

    ig.EVENT_STEP.UNLOCK_LORE_LIST = ig.EventStepBase.extend({
        lories: null,
        entry: null,
        notify: false,
        _wm: new ig.Config({
            attributes: {
                lories: {
                    _type: "Array",
                    _info: "The list from which to pick. will unlock the next 'locked' entry in the array.",
                    _sub: {
                        _type: "LoreSelect"
                    },
                    _subWidth: 150
                },
                notify: {
                    _type: "Boolean",
                    _info: "True if notification should be displayed",
                    _default: false
                }
            }
        }),

        init: function (settings) {
            this.lories = settings.lories || [];
            this.notify = settings.notify || false
        },

        start: function () {
            if (this.lories.length > 0)
                for (var i = 0, count = this.lories.length; i < count; i++)
                    if (!sc.lore.isLoreUnlocked(this.lories[i])) {
                        sc.lore.unlockLore(this.lories[i], this.notify);
                        break
                    }
        }
    });

    ig.EVENT_STEP.ACTIVATE_LANDMARK = ig.EventStepBase.extend({
        area: null,
        landmark: null,
        _wm: new ig.Config({
            attributes: {
                area: {
                    _type: "Area",
                    _info: "Area to select landmark from",
                    _select: "areas",
                    _context: "Area"
                },
                landmark: {
                    _type: "Landmarks",
                    _info: "Landmark to activate"
                }
            }
        }),

        init: function (settings) {
            this.area = settings.area;
            this.landmark = settings.landmark
        },

        start: function () {
            sc.map.addLandmark(this.landmark, this.area)
        }
    });

    ig.EVENT_STEP.SET_LANDMARK_ACTIVE_STATE = ig.EventStepBase.extend({
        area: null,
        landmark: null,
        _wm: new ig.Config({
            attributes: {
                area: {
                    _type: "Area",
                    _info: "Area to select landmark from",
                    _select: "areas",
                    _context: "Area"
                },
                landmark: {
                    _type: "Landmarks",
                    _info: "Landmark to set state of. If not defined: Set state of all landmarks of area (if found)",
                    _optional: true
                },
                state: {
                    _type: "Boolean",
                    _info: "New Active State of Landmark"
                }
            }
        }),

        init: function (settings) {
            this.area = settings.area;
            this.landmark = settings.landmark;
            this.state = settings.state
        },

        start: function () {
            if (this.landmark) sc.map.setLandmarkActiveState(this.landmark, this.state, this.area);
            else sc.map.setAreaLandmarksActiveState(this.area, this.state)
        }
    });

    ig.EVENT_STEP.UNDO_OPENED_CHEST_TRACK = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                map: {
                    _type: "Maps",
                    _info: "Map of the chest",
                    _context: "Map"
                },
                area: {
                    _type: "Area",
                    _info: "Area of the map",
                    _select: "areas",
                    _context: "Area"
                },
                chestId: {
                    _type: "Integer",
                    _info: "Entity id of the chest that is no more"
                },
                variable: {
                    _type: "String",
                    _info: "Alternative Variable used for chest. Do NOT add map. prefix!",
                    _optional: true
                }
            }
        }),

        init: function (settings) {
            this.map = settings.map;
            this.area = settings.area;
            this.chestId = settings.chestId || 0;
            this.variable = settings.variable || null
        },

        start: function () {
            var varName = "maps." + this.map.toPath("", "").toCamel() + ".",
                varName = this.variable ? varName + this.variable : NaN + this.chestId;
            if (ig.vars.get(varName)) {
                ig.vars.set(varName, false);
                sc.stats.subMap("chests", this.area, 1);
                sc.stats.subMap("chests", "total", 1)
            }
        }
    });

    ig.EVENT_STEP.OPEN_SHOP = ig.EventStepBase.extend({
        shop: null,
        _wm: new ig.Config({
            attributes: {
                shop: {
                    _type: "Shop",
                    _info: "The Shop to access. Below you can see the content",
                    _context: "Shop"
                }
            }
        }),

        init: function (settings) {
            this.shop = settings.shop || null
        },

        start: function () {
            var shopData = ig.database.get("shops")[this.shop];
            if (sc.MENU_SHOP_TYPES[shopData.shopType] == sc.MENU_SHOP_TYPES.COIN) sc.menu.shopCoinMode = true;
            sc.menu.shopID = this.shop;
            sc.menu.setDirectMode(true, sc.MENU_SUBMENU.SHOP);
            sc.model.enterMenu(true);
            sc.model.prevSubState = sc.GAME_MODEL_SUBSTATE.RUNNING
        }
    });

    ig.EVENT_STEP.OPEN_QUEST_HUB = ig.EventStepBase.extend({
        hub: null,
        _wm: new ig.Config({
            attributes: {
                hub: {
                    _type: "QuestHub",
                    _info: "The hub to access.",
                    _context: "QuestHub"
                }
            }
        }),

        init: function (settings) {
            this.hub = settings.hub || null
        },

        start: function () {
            sc.menu.questHubID = this.hub;
            sc.menu.setDirectMode(true, sc.MENU_SUBMENU.QUEST_HUB);
            sc.model.enterMenu(true);
            sc.model.prevSubState = sc.GAME_MODEL_SUBSTATE.RUNNING
        }
    });

    ig.EVENT_STEP.UNDO_VISITED_AREA = ig.EventStepBase.extend({
        hub: null,
        _wm: new ig.Config({
            attributes: {
                area: {
                    _type: "String",
                    _select: "areas",
                    _info: "Visited area to be undone. WARNING: Will delete ALL map variables of those maps"
                }
            }
        }),

        init: function (settings) {
            this.area = settings.area;
            this.areaLoadable = new sc.AreaLoadable(this.area)
        },

        clearCached: function () {
            this.areaLoadable.decreaseRef()
        },

        start: function () {
            sc.map.undoVisitedArea(this.area, this.areaLoadable)
        }
    })
});
ig.baked = !0;

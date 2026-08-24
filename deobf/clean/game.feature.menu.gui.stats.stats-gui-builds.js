/**
 * @module game.feature.menu.gui.stats.stats-gui-builds
 * @description The sc.STATS_CATEGORY enum and the sc.STATS_BUILD table that
 *   defines every statistics-menu entry per category (progress overview,
 *   combat, items, exploration, quests, arena, misc, log), with embedded
 *   calc / value / max / list functions.
 */
ig.module("game.feature.menu.gui.stats.stats-gui-builds").defines(function() {
	sc.STATS_CATEGORY = {
		GENERAL: 0,
		COMBAT: 1,
		ITEMS: 2,
		QUESTS: 3,
		EXPLORATION: 4,
		MISC: 5,
		LOG: 6,
		ARENA: 7
	};
	sc.STATS_BUILD = [];
	sc.STATS_BUILD[sc.STATS_CATEGORY.GENERAL] = {
		progressComplete: {
			highlight: {
				min: 1
			},
			type: "Percent",
			calc: function() {
				var progress;
				progress = ig.vars.get("plot.line") || 0;
				progress = (progress >= 32E3 ? 1 : progress / 32E3) + sc.combat.getTotalEnemiesFound(true);
				progress = progress + sc.inventory.getTotalItemsUnlocked(true);
				progress = progress + sc.quests.getTotalQuestsSolved(true);
				progress = progress + sc.lore.getTotalLoreEntriesFound(true);
				progress = progress + sc.map.getTotalLandmarksFound(true);
				progress = progress + sc.map.getTotalChestsFound(true);
				progress = progress + sc.map.getTotalAreasFound(true);
				progress = progress + sc.menu.getTotalDropsFoundAndCompleted(true);
				progress = progress + sc.combat.getTotalEnemyReportsFound(true);
				progress = progress + sc.trophies.getTotalTrophiesUnlocked(true);
				progress = progress + sc.trade.getTotalTradersFound(true);
				if (ig.vars.get("arenaVars.statsUnlocked")) {
					progress = progress + sc.arena.getTotalArenaCompletion();
					return progress / 13
				}
				return progress / 12
			}
		},
		progressEnemies: {
			highlight: {
				min: 1
			},
			inset: "progress",
			type: "Percent",
			calc: function() {
				var progress = sc.combat.getTotalEnemiesFound(true),
					progress = progress + sc.combat.getTotalEnemyReportsFound(true);
				return progress / 2
			}
		},
		progressCollection: {
			highlight: {
				min: 1
			},
			type: "Percent",
			calc: function() {
				var progress = sc.inventory.getTotalItemsUnlocked(true),
					progress = progress + sc.trade.getTotalTradersFound(true);
				return progress / 2
			}
		},
		progressExploration: {
			highlight: {
				min: 1
			},
			type: "Percent",
			calc: function() {
				var progress = sc.lore.getTotalLoreEntriesFound(true),
					progress = progress + sc.map.getTotalLandmarksFound(true),
					progress = progress + sc.map.getTotalAreasFound(true),
					progress = progress + sc.map.getTotalChestsFound(true),
					progress = progress + sc.menu.getTotalDropsFoundAndCompleted(true);
				return progress / 5
			}
		},
		progressQuests: {
			highlight: {
				min: 1
			},
			type: "Percent",
			calc: function() {
				return sc.quests.getTotalQuestsSolved(true)
			}
		},
		progressTrophies: {
			highlight: {
				min: 1
			},
			type: "Percent",
			calc: function() {
				return sc.trophies.getTotalTrophiesUnlocked(true)
			}
		},
		progressArena: {
			highlight: {
				min: 1
			},
			type: "Percent",
			calc: function() {
				return sc.arena.getTotalArenaCompletion()
			},
			condition: "arenaVars.statsUnlocked"
		},
		sepProg: {
			type: "Separator",
			group: "overview",
			deset: "progress"
		},
		playtime: {
			type: "Time",
			map: "player",
			update: true
		},
		assistTime: {
			type: "Time",
			map: "player"
		},
		level: {
			type: "KeyValue",
			map: "player"
		},
		exp: {
			type: "KeyValue",
			map: "player"
		},
		expEnemies: {
			type: "KeyValuePercent",
			map: "player",
			maxMap: "player",
			maxStat: "exp",
			inset: "exp"
		},
		expQuest: {
			type: "KeyValuePercent",
			map: "quests",
			stat: "exp",
			maxMap: "player",
			maxStat: "exp"
		},
		expOther: {
			type: "KeyValuePercent",
			map: "player",
			maxMap: "player",
			maxStat: "exp"
		},
		money: {
			type: "KeyValue",
			map: "player",
			deset: "exp"
		},
		saves: {
			type: "KeyValue",
			map: "player"
		},
		jumps: {
			type: "KeyValue",
			map: "player"
		},
		steps: {
			type: "KeyValue",
			map: "player"
		},
		meters: {
			type: "KeyValue",
			value: function() {
				var meters = (sc.stats.getMap("player", "steps") || 0) * 1.632;
				return meters < 1E3 ? Math.round(meters) : Math.floor(meters / 1E3)
			},
			postfix: function() {
				var meters = (sc.stats.getMap("player", "steps") || 0) * 1.632;
				if (meters < 1E3) return "m";
				var meters = Math.floor(meters) % 1E3 / 10,
					digits = "0000" + Math.floor(meters),
					meters = digits.length >= 6 ? Math.floor(meters) : digits.substr(digits.length - 2);
				return "." + meters + "km"
			}
		},
		respawns: {
			type: "KeyValue",
			map: "player"
		},
		respWater: {
			type: "KeyValuePercent",
			map: "player",
			stat: "waterDeath",
			maxMap: "player",
			maxStat: "respawns",
			inset: "deaths"
		},
		respHole: {
			type: "KeyValuePercent",
			map: "player",
			stat: "holeDeath",
			maxMap: "player",
			maxStat: "respawns"
		},
		respSand: {
			type: "KeyValuePercent",
			map: "player",
			stat: "sandDeath",
			maxMap: "player",
			maxStat: "respawns"
		},
		respCoal: {
			type: "KeyValuePercent",
			map: "player",
			stat: "coalDeath",
			maxMap: "player",
			maxStat: "respawns"
		},
		respHighway: {
			type: "KeyValuePercent",
			map: "player",
			stat: "highwayDeath",
			maxMap: "player",
			maxStat: "respawns"
		},
		teleports: {
			type: "KeyValue",
			map: "player",
			deset: "deaths"
		}
	};
	sc.STATS_BUILD[sc.STATS_CATEGORY.COMBAT] = {
		enemies: {
			type: "Percent",
			highlight: {
				min: 1
			},
			calc: function() {
				return sc.combat.getTotalEnemiesFound(true)
			}
		},
		foundAnimals: {
			type: "Percent",
			highlight: {
				min: 1
			},
			calc: function() {
				return sc.combat.getTotalEnemiesFound(true, "ANIMALS")
			},
			inset: "enemies"
		},
		foundMechas: {
			type: "Percent",
			highlight: {
				min: 1
			},
			calc: function() {
				return sc.combat.getTotalEnemiesFound(true, "MECHA")
			}
		},
		foundPlayers: {
			type: "Percent",
			highlight: {
				min: 1
			},
			calc: function() {
				return sc.combat.getTotalEnemiesFound(true, "PLAYERS")
			}
		},
		foundAbstract: {
			type: "Percent",
			highlight: {
				min: 1
			},
			calc: function() {
				return sc.combat.getTotalEnemiesFound(true, "ABSTRACT")
			}
		},
		enemyReports: {
			type: "Percent",
			highlight: {
				min: 1
			},
			deset: "enemies",
			calc: function() {
				return sc.combat.getTotalEnemyReportsFound(true)
			}
		},
		sepFoundEnd: {
			type: "Separator",
			group: "overview"
		},
		timeCombat: {
			type: "Time",
			map: "combat",
			stat: "time",
			max: 99,
			leading: 2
		},
		kills: {
			type: "KeyValue",
			map: "combat",
			stat: "totalKilled"
		},
		enviroKills: {
			type: "KeyValue",
			map: "combat",
			inset: "kills"
		},
		boostedKills: {
			type: "KeyValue",
			map: "combat",
			hideNameIfNull: true
		},
		oneHitKills: {
			type: "KeyValue",
			map: "combat",
			hideNameIfNull: true
		},
		damageGiven: {
			type: "KeyValue",
			map: "combat",
			deset: "kills"
		},
		maxDamage: {
			type: "KeyValue",
			map: "combat"
		},
		hitsTaken: {
			type: "KeyValue",
			map: "combat",
			stat: "damageHits"
		},
		damageTaken: {
			type: "KeyValue",
			map: "combat"
		},
		healed: {
			type: "KeyValue",
			map: "combat"
		},
		critHits: {
			type: "KeyValue",
			map: "combat"
		},
		critHitsClose: {
			type: "KeyValuePercent",
			map: "combat",
			maxMap: "combat",
			maxStat: "critHits",
			inset: "crits"
		},
		critHitsThrow: {
			type: "KeyValuePercent",
			map: "combat",
			maxMap: "combat",
			maxStat: "critHits"
		},
		streakTime: {
			type: "Time",
			map: "combat",
			max: 99,
			leading: 2,
			deset: "crits"
		},
		streakKilled: {
			type: "KeyValue",
			map: "combat"
		},
		expEn: {
			type: "KeyValue",
			map: "player",
			stat: "expEnemies"
		},
		sepThrow: {
			type: "Separator",
			group: "throwing"
		},
		close: {
			type: "KeyValue",
			map: "player"
		},
		closeHits: {
			type: "KeyValue",
			map: "player",
			maxMap: "player",
			maxStat: "close"
		},
		aimingTime: {
			type: "Time",
			map: "combat",
			stat: "aiming",
			max: 99,
			leading: 2
		},
		"throws": {
			type: "KeyValue",
			map: "player"
		},
		throwHits: {
			type: "KeyValue",
			map: "player"
		},
		hitPercent: {
			type: "Percent",
			calc: function() {
				return Math.min(1, (sc.stats.getMap("player", "throwHits") || 0) / (sc.stats.getMap("player", "throws") || 0) || 0)
			},
			max: function() {}
		},
		sepGuard: {
			type: "Separator",
			group: "guarding"
		},
		dashTime: {
			type: "Time",
			map: "player",
			stat: "dashTime",
			max: 99,
			leading: 2
		},
		dash: {
			type: "KeyValue",
			map: "player"
		},
		perfectDash: {
			type: "KeyValue",
			map: "player"
		},
		atkDashCancel: {
			type: "KeyValue",
			map: "player"
		},
		guardTime: {
			type: "Time",
			map: "combat",
			stat: "guardTime",
			max: 99,
			leading: 2
		},
		shieldedHits: {
			type: "KeyValue",
			map: "combat"
		},
		perfectShield: {
			type: "KeyValuePercent",
			map: "combat",
			maxMap: "combat",
			maxStat: "shieldedHits",
			inset: "shields"
		},
		guardCounters: {
			type: "KeyValue",
			map: "combat",
			deset: "shields"
		},
		shieldBreaks: {
			type: "KeyValue",
			map: "combat"
		},
		sepSpe: {
			type: "Separator",
			group: "combatArts"
		},
		chargeTime: {
			type: "Time",
			map: "combat",
			stat: "charging",
			max: 99,
			leading: 2
		},
		specials: {
			type: "KeyValue",
			map: "combat"
		},
		specialsClose: {
			type: "KeyValuePercent",
			map: "combat",
			maxMap: "combat",
			maxStat: "specials",
			inset: "specials"
		},
		specialsThrow: {
			type: "KeyValuePercent",
			map: "combat",
			maxMap: "combat",
			maxStat: "specials"
		},
		specialsDash: {
			type: "KeyValuePercent",
			map: "combat",
			maxMap: "combat",
			maxStat: "specials"
		},
		specialsGuard: {
			type: "KeyValuePercent",
			map: "combat",
			maxMap: "combat",
			maxStat: "specials"
		},
		sepCircuits: {
			type: "Separator",
			group: "circuits",
			deset: "specials"
		},
		skills: {
			type: "KeyValue",
			map: "player"
		},
		skillsPassive: {
			type: "KeyValuePercent",
			map: "player",
			maxMap: "player",
			maxStat: "skills",
			inset: "skills"
		},
		skillsActive: {
			type: "KeyValuePercent",
			map: "player",
			maxMap: "player",
			maxStat: "skills"
		},
		branches: {
			type: "KeyValue",
			map: "player",
			deset: "skills"
		},
		skillPoints: {
			type: "KeyValue",
			map: "player"
		},
		skillPoints0: {
			type: "KeyValuePercent",
			map: "player",
			maxMap: "player",
			maxStat: "skillPoints",
			inset: "points"
		},
		skillPoints1: {
			type: "KeyValuePercent",
			map: "player",
			maxMap: "player",
			maxStat: "skillPoints"
		},
		skillPoints2: {
			type: "KeyValuePercent",
			map: "player",
			maxMap: "player",
			maxStat: "skillPoints"
		},
		skillPoints3: {
			type: "KeyValuePercent",
			map: "player",
			maxMap: "player",
			maxStat: "skillPoints"
		},
		skillPoints4: {
			type: "KeyValuePercent",
			map: "player",
			maxMap: "player",
			maxStat: "skillPoints"
		},
		sepElements: {
			type: "Separator",
			group: "elements",
			deset: "points"
		},
		elOverload: {
			type: "KeyValue",
			map: "element",
			stat: "overload"
		},
		elSwitches: {
			type: "KeyValue",
			max: 99,
			leading: 2,
			value: function() {
				var total = 0,
					element;
				for (element in sc.ELEMENT) total = total + (sc.stats.getMap("element", "used" + sc.ELEMENT[element]) || 0);
				return total
			}
		},
		elSwitchesNeutral: {
			type: "KeyValue",
			map: "element",
			stat: "used0",
			inset: "switches"
		},
		elSwitchesHeat: {
			type: "KeyValue",
			map: "element",
			stat: "used1",
			condition: "player.core.9"
		},
		elSwitchesCold: {
			type: "KeyValue",
			map: "element",
			stat: "used2",
			condition: "player.core.10"
		},
		elSwitchesShock: {
			type: "KeyValue",
			map: "element",
			stat: "used3",
			condition: "player.core.11"
		},
		elSwitchesWave: {
			type: "KeyValue",
			map: "element",
			stat: "used4",
			condition: "player.core.12"
		},
		elTime: {
			type: "Time",
			max: 99,
			leading: 2,
			deset: "switches",
			value: function() {
				var total = 0,
					element;
				for (element in sc.ELEMENT) element != "NEUTRAL" && (total = total + (sc.stats.getMap("element", "time" + sc.ELEMENT[element]) || 0));
				return total
			}
		},
		elTimeHeat: {
			type: "Time",
			map: "element",
			stat: "time1",
			max: 99,
			leading: 2,
			condition: "player.core.9",
			inset: "elements"
		},
		elTimeCold: {
			type: "Time",
			map: "element",
			stat: "time2",
			max: 99,
			leading: 2,
			condition: "player.core.10"
		},
		elTimeShock: {
			type: "Time",
			map: "element",
			stat: "time3",
			max: 99,
			leading: 2,
			condition: "player.core.11"
		},
		elTimeWave: {
			type: "Time",
			map: "element",
			stat: "time4",
			max: 99,
			leading: 2,
			condition: "player.core.12"
		}
	};
	sc.STATS_BUILD[sc.STATS_CATEGORY.ITEMS] = {
		tradersFound: {
			type: "Percent",
			highlight: {
				min: 1
			},
			calc: function() {
				return sc.trade.getTotalTradersFound(true)
			}
		},
		items: {
			highlight: {
				min: 1
			},
			type: "Percent",
			calc: function() {
				return sc.inventory.getTotalItemsUnlocked(true)
			}
		},
		itemCons: {
			type: "Percent",
			highlight: {
				min: 1
			},
			calc: function() {
				return sc.inventory.getTotalItemsUnlocked(true, "CONS")
			},
			inset: "items"
		},
		itemEquip: {
			type: "Percent",
			highlight: {
				min: 1
			},
			calc: function() {
				return sc.inventory.getTotalItemsUnlocked(true, "EQUIP")
			}
		},
		itemEquipHead: {
			type: "Percent",
			highlight: {
				min: 1
			},
			calc: function() {
				return sc.inventory.getTotalItemsUnlocked(true, "EQUIP", "HEAD")
			},
			inset: "equip"
		},
		itemEquipArm: {
			type: "Percent",
			highlight: {
				min: 1
			},
			calc: function() {
				return sc.inventory.getTotalItemsUnlocked(true, "EQUIP", "ARM")
			}
		},
		itemEquipTorso: {
			type: "Percent",
			highlight: {
				min: 1
			},
			calc: function() {
				return sc.inventory.getTotalItemsUnlocked(true, "EQUIP", "TORSO")
			}
		},
		itemEquipFeet: {
			type: "Percent",
			highlight: {
				min: 1
			},
			calc: function() {
				return sc.inventory.getTotalItemsUnlocked(true, "EQUIP", "FEET")
			}
		},
		itemTrade: {
			type: "Percent",
			highlight: {
				min: 1
			},
			calc: function() {
				return sc.inventory.getTotalItemsUnlocked(true, "TRADE")
			},
			deset: "equip"
		},
		sepFoundEnd: {
			type: "Separator",
			group: "overview",
			deset: "items"
		},
		total: {
			type: "KeyValue",
			map: "items"
		},
		used: {
			type: "KeyValue",
			map: "items"
		},
		dropsTotal: {
			type: "KeyValue",
			map: "items"
		},
		dropsProps: {
			type: "KeyValuePercent",
			map: "items",
			maxMap: "items",
			maxStat: "dropsTotal",
			inset: "drops"
		},
		dropsEnemies: {
			type: "KeyValuePercent",
			map: "items",
			maxMap: "items",
			maxStat: "dropsTotal"
		},
		buy: {
			type: "KeyValue",
			map: "items",
			deset: "drops"
		},
		sell: {
			type: "KeyValue",
			map: "items"
		},
		sepTra: {
			type: "Separator",
			group: "trades"
		},
		trades: {
			type: "KeyValue",
			map: "trade",
			stat: "total"
		},
		tradeGot: {
			type: "KeyValue",
			map: "trade",
			stat: "got"
		},
		tradeLost: {
			type: "KeyValue",
			map: "trade",
			stat: "lost"
		},
		traderTotal: {
			type: "KeyCurMax",
			highlight: true,
			value: function() {
				return sc.trade.getTotalTradersFound()
			},
			max: function() {
				return sc.trade.getTotalTraders()
			},
			hide: function() {
				return sc.trade.getTotalTradersFound(true) < 1 && !sc.map.hasAllAreasFound()
			}
		},
		tradersAreas: {
			type: "List",
			subtype: "KeyCurMax",
			list: function() {
				return sc.map.areas
			},
			getSettings: function(area) {
				return !sc.map.getVisitedArea(area) || !sc.trade.hasAreaTraders(area) ? null : {
					highlight: true,
					displayName: sc.map.getAreaName(area),
					value: function() {
						return sc.trade.getTotalTradersFound(false, area)
					},
					max: function() {
						return sc.trade.getTotalTraders(area)
					}
				}
			},
			inset: "traders"
		}
	};
	sc.STATS_BUILD[sc.STATS_CATEGORY.EXPLORATION] = {
		areas: {
			highlight: {
				min: 1
			},
			type: "Percent",
			calc: function() {
				return sc.map.getTotalAreasFound(true)
			}
		},
		landmarks: {
			highlight: {
				min: 1
			},
			type: "Percent",
			calc: function() {
				return sc.map.getTotalLandmarksFound(true)
			}
		},
		chests: {
			highlight: {
				min: 1
			},
			type: "Percent",
			calc: function() {
				return sc.map.getTotalChestsFound(true)
			}
		},
		botanics: {
			highlight: {
				min: 1
			},
			type: "Percent",
			calc: function() {
				return sc.menu.getTotalDropsFoundAndCompleted(true)
			}
		},
		lories: {
			type: "Percent",
			calc: function() {
				return sc.lore.getTotalLoreEntriesFound(true)
			},
			highlight: {
				min: 1
			}
		},
		loriesStory: {
			type: "Percent",
			calc: function() {
				return sc.lore.getTotalLoreEntriesFound(true, "STORY")
			},
			highlight: {
				min: 1
			},
			scramble: true,
			frontLeading: 2,
			inset: "lories"
		},
		loriesPeople: {
			type: "Percent",
			calc: function() {
				return sc.lore.getTotalLoreEntriesFound(true, "CHARACTERS")
			},
			highlight: {
				min: 1
			}
		},
		loriesCross: {
			type: "Percent",
			calc: function() {
				return sc.lore.getTotalLoreEntriesFound(true, "CROSS_LORE")
			},
			highlight: {
				min: 1
			}
		},
		loriesEarth: {
			type: "Percent",
			calc: function() {
				return sc.lore.getTotalLoreEntriesFound(true, "EARTH_LORE")
			},
			highlight: {
				min: 1
			}
		},
		sepOverview: {
			type: "Separator",
			group: "overview",
			deset: "lories"
		},
		areasFound: {
			type: "KeyValue",
			value: function() {
				return sc.map.getTotalAreasFound()
			}
		},
		landmarksFound: {
			type: "KeyValue",
			map: "exploration",
			stat: "landmarks"
		},
		loreFound: {
			type: "KeyValue",
			map: "exploration",
			stat: "lore"
		},
		sepBotanics: {
			type: "Separator",
			group: "botanics"
		},
		propsDestroyed: {
			type: "KeyValue",
			map: "player"
		},
		dropsTotalPlants: {
			type: "KeyValue",
			map: "exploration",
			stat: "dropsTotal"
		},
		dropsCompleted: {
			type: "KeyValuePercent",
			map: "exploration",
			stat: "dropsCompleted",
			maxMap: "exploration",
			maxStat: "dropsTotal",
			inset: "drops"
		},
		sepChests: {
			type: "Separator",
			group: "chests",
			deset: "drops"
		},
		chestFound: {
			type: "KeyCurMax",
			highlight: true,
			value: function() {
				return sc.map.getTotalChestsFound()
			},
			max: function() {
				return sc.map.getTotalChests()
			},
			hide: function() {
				return !sc.map.hasAllAreasFound()
			}
		},
		chestAres: {
			type: "List",
			subtype: "KeyCurMax",
			list: function() {
				return sc.map.areas
			},
			getSettings: function(area) {
				return !sc.map.getVisitedArea(area) || !sc.map.areas[area].track || !sc.map.areas[area].chests ? null : {
					highlight: true,
					displayName: sc.map.getAreaName(area, false, true),
					map: "chests",
					stat: area,
					max: function() {
						return sc.map.areas[area].chests
					}
				}
			},
			inset: "chests"
		}
	};
	sc.STATS_BUILD[sc.STATS_CATEGORY.QUESTS] = {
		quests: {
			type: "Percent",
			highlight: {
				min: 1
			},
			calc: function() {
				return sc.quests.getTotalQuestsSolved(true)
			}
		},
		sepOverview: {
			type: "Separator",
			group: "overview"
		},
		questTotal: {
			type: "KeyValue",
			map: "quests",
			stat: "solved"
		},
		tasksTotal: {
			type: "KeyValue",
			map: "quests",
			stat: "tasks"
		},
		subTaskTotal: {
			type: "KeyValue",
			map: "quests",
			stat: "subtasks"
		},
		subTaskKill: {
			type: "KeyValuePercent",
			map: "quests",
			stat: "subtasksKILL",
			maxMap: "quests",
			maxStat: "subtasks",
			inset: "subtasks"
		},
		subTaskCol: {
			type: "KeyValuePercent",
			map: "quests",
			stat: "subtasksCOLLECT",
			maxMap: "quests",
			maxStat: "subtasks"
		},
		subTaskAct: {
			type: "KeyValuePercent",
			map: "quests",
			stat: "subtasksCONDITION",
			maxMap: "quests",
			maxStat: "subtasks"
		},
		subTaskQuest: {
			type: "KeyValuePercent",
			map: "quests",
			stat: "subtasksQUEST",
			maxMap: "quests",
			maxStat: "subtasks"
		},
		subTaskLandmark: {
			type: "KeyValuePercent",
			map: "quests",
			stat: "subtasksLANDMARK",
			maxMap: "quests",
			maxStat: "subtasks"
		},
		questActive: {
			type: "KeyValue",
			map: "quests",
			stat: "active",
			deset: "subtasks"
		},
		rewardExp: {
			type: "KeyValue",
			map: "quests",
			stat: "exp"
		},
		rewardMoney: {
			type: "KeyValue",
			map: "quests",
			stat: "money"
		},
		rewardItems: {
			type: "KeyValue",
			map: "quests",
			stat: "rewards"
		},
		rewardCp: {
			type: "KeyValue",
			map: "quest",
			stat: "cp"
		},
		sepAreas: {
			type: "Separator",
			group: "questAreas"
		},
		questAreas: {
			type: "List",
			subtype: "Percent",
			list: function() {
				return sc.map.areas
			},
			getSettings: function(area) {
				return !sc.map.getVisitedArea(area) || !sc.map.areas[area].track || !sc.quests.hasAreaQuests(area) ? null : {
					highlight: {
						min: 1
					},
					displayName: sc.map.getAreaName(area),
					calc: function() {
						return sc.quests.getTotalQuestsSolved(true, area)
					}
				}
			}
		}
	};
	sc.STATS_BUILD[sc.STATS_CATEGORY.ARENA] = {
		arenaCompletion: {
			highlight: {
				min: 1
			},
			type: "Percent",
			calc: function() {
				return sc.arena.getTotalArenaCompletion()
			}
		},
		sepOverview: {
			type: "Separator",
			group: "overview"
		},
		arenaTime: {
			type: "Time",
			map: "arena",
			stat: "time",
			max: 999,
			leading: 3
		},
		arenaScore: {
			type: "KeyValue",
			map: "arena",
			stat: "score"
		},
		arenaKills: {
			type: "KeyValue",
			map: "arena",
			stat: "kills"
		},
		roundsDone: {
			type: "KeyValue",
			map: "arena",
			stat: "roundsCleared"
		},
		roundsFailed: {
			type: "KeyValue",
			map: "arena",
			stat: "deaths"
		},
		rushDone: {
			type: "KeyValue",
			map: "arena",
			stat: "rushCleared"
		},
		totalCoins: {
			type: "KeyValue",
			value: function() {
				return sc.arena.getTotalArenaCoins() + sc.arena.coinsSpend
			}
		},
		sepMedals: {
			type: "Separator",
			group: "medals"
		},
		totalMedals: {
			type: "KeyValue",
			map: "arena"
		},
		totalMedals1: {
			type: "KeyValuePercent",
			map: "arena",
			stat: "medals-got-1",
			maxMap: "arena",
			maxStat: "totalMedals",
			inset: "medals"
		},
		totalMedals2: {
			type: "KeyValuePercent",
			map: "arena",
			stat: "medals-got-2",
			maxMap: "arena",
			maxStat: "totalMedals"
		},
		totalMedals3: {
			type: "KeyValuePercent",
			map: "arena",
			stat: "medals-got-3",
			maxMap: "arena",
			maxStat: "totalMedals"
		},
		totalMedals4: {
			type: "KeyValuePercent",
			map: "arena",
			stat: "medals-got-4",
			maxMap: "arena",
			maxStat: "totalMedals",
			condition: "stat.arena.medals-got-4 >= 1"
		},
		sepTrophies: {
			type: "Separator",
			group: "trophies",
			deset: "medals"
		},
		totalTrophies: {
			type: "KeyCurMax",
			highlight: true,
			value: function() {
				return sc.arena.getTotalDefaultTrophies(0, false)
			},
			max: function() {
				return sc.arena.getTotalDefaultTrophies(0, true)
			}
		},
		totalTrophies1: {
			type: "KeyCurMax",
			highlight: true,
			inset: "trophies",
			value: function() {
				return sc.arena.getTotalDefaultTrophies(1, false)
			},
			max: function() {
				return sc.arena.getTotalDefaultTrophies(1, true)
			}
		},
		totalTrophies2: {
			type: "KeyCurMax",
			highlight: true,
			value: function() {
				return sc.arena.getTotalDefaultTrophies(2, false)
			},
			max: function() {
				return sc.arena.getTotalDefaultTrophies(2, true)
			}
		},
		totalTrophies3: {
			type: "KeyCurMax",
			highlight: true,
			value: function() {
				return sc.arena.getTotalDefaultTrophies(3, false)
			},
			max: function() {
				return sc.arena.getTotalDefaultTrophies(3, true)
			}
		},
		totalTrophies4: {
			type: "KeyCurMax",
			highlight: true,
			value: function() {
				return sc.arena.getTotalDefaultTrophies(4, false)
			},
			max: function() {
				return sc.arena.getTotalDefaultTrophies(4, true)
			}
		},
		totalTrophies5: {
			type: "KeyCurMax",
			highlight: true,
			condition: "stat.arena.unlockedTruePlatin >= 1",
			value: function() {
				return sc.arena.getTotalDefaultTrophies(5, false)
			},
			max: function() {
				return sc.arena.getTotalDefaultTrophies(5, true)
			}
		},
		sepTrophiesComp: {
			type: "Separator",
			group: "trophyCompletion",
			deset: "trophies"
		},
		trophiesByCup: {
			type: "List",
			subtype: "Percent",
			list: function() {
				return sc.arena.getTotalDefaultCups(true)
			},
			getSettings: function(cup) {
				return !sc.arena.isCupUnlocked(cup) ? null : {
					highlight: {
						min: 1
					},
					displayName: sc.arena.getCupName(cup),
					calc: function() {
						return sc.arena.getCupCompletion(cup)
					}
				}
			}
		}
	};
	sc.STATS_BUILD[sc.STATS_CATEGORY.MISC] = {
		gameBoots: {
			type: "KeyValue"
		},
		logs: {
			type: "KeyValue",
			map: "player"
		},
		words: {
			type: "KeyValue",
			map: "misc"
		},
		hiCount: {
			type: "KeyValue",
			map: "misc"
		},
		yawns: {
			type: "KeyValue",
			map: "misc"
		},
		randomNumber: {
			type: "KeyValue",
			value: function() {
				return Math.floor(Math.random() * Math.random() * 123952637)
			}
		},
		finalStat: {
			type: "KeyValue",
			highlight: true,
			value: function() {
				for (var count = 0, builds = sc.STATS_BUILD, i = builds.length, entry = null; i--;)
					for (var key in builds[i]) {
						entry = builds[i][key];
						if (entry.type == "LIST") {
							var list = entry.list(),
								listKey;
							for (listKey in list) entry.getSettings() && count++
						} else count++
					}
				return count
			}
		}
	};
	sc.STATS_BUILD[sc.STATS_CATEGORY.LOG] = {
		activity: {
			type: "Logs"
		}
	}
});
ig.baked = !0;

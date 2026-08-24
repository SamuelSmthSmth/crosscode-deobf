/**
 * @module game.feature.menu.map-model
 * @description sc.MapModel: the map/area model — area & landmark tracking,
 *   visited/floors state, per-area item (key/booster) helpers, dungeon
 *   detection, teleport events, area/landmark enums and storage save/load.
 */
ig.module("game.feature.menu.map-model").requires("impact.base.game", "impact.base.loader", "impact.base.vars", "impact.feature.database.database", "game.config", "game.feature.quick-menu.quick-menu-model", "game.feature.model.options-model").defines(function() {
	var landmarkEvent = {
		landmark: "",
		area: ""
	};
	sc.LANDMARK_OPTIONS = {
		DEFAULT: {
			icon: null,
			bounds: {
				x: 0,
				y: 0,
				w: 8,
				h: 8
			}
		}
	};
	sc.MAP_DUNGEON_OVERRIDE = {
		DUNGEON: 1,
		NO_DUNGEON: 2
	};
	sc.AREA_TYPE = {};
	sc.AREA_TYPE.TOWN = 0;
	sc.AREA_TYPE.PATH = 1;
	sc.AREA_TYPE.DUNGEON = 2;
	sc.AREA_ITEM_TYPE = {
		DUNGEON_KEY: {
			areaField: "keyItem"
		},
		DUNGEON_MASTER_KEY: {
			areaField: "masterKeyItem"
		},
		BOOSTER: {
			areaField: "boosterItem"
		}
	};
	sc.MapModel = ig.GameAddon.extend({
		observers: [],
		activeLandmarks: {},
		areas: null,
		areasVisited: {},
		currentPlayerArea: null,
		currentArea: null,
		currentPlayerFloor: 0,
		currentFloor: 0,
		currentMap: null,
		unknownArea: null,
		teleportEvent: null,
		_usedNames: [],
		_oobSoundTerrain: null,
		init: function() {
			this.parent("MapModel");
			ig.storage.register(this);
			window.wm && ig.database.register("areas", "AreaList", "Areas");
			this.initAreas();
			ig.vars.registerVarAccessor("area", this, "VarAreaEditor");
			ig.vars.registerVarAccessor("location", this, "VarLocationEditor")
		},
		isValidArea: function(area) {
			return this.areas[area].track && !this.areas[area].isDLC
		},
		getTotalAreasFound: function(asPercent) {
			var found = 0,
				total = 0,
				area;
			for (area in this.areas)
				if (this.isValidArea(area)) {
					this.areasVisited[area.toCamel()] && found++;
					total++
				} return asPercent ? found / total : found
		},
		getTotalLandmarksFound: function(asPercent) {
			var found = 0,
				total = 0,
				area;
			for (area in this.areas)
				for (var landmark in this.areas[area].landmarks)
					if (!this.areas[area].landmarks[landmark].extension && this.isValidArea(area)) {
						this.activeLandmarks[area] && this.activeLandmarks[area][landmark] && found++;
						total++
					} return asPercent ? found / total : found
		},
		getTotalChestsFound: function(asPercent) {
			var found = 0,
				total = 0,
				area;
			for (area in this.areas)
				if (this.isValidArea(area)) {
					var chests = sc.stats.getMap("chests", area) || 0;
					chests > this.areas[area].chests && (chests = this.areas[area].chests);
					found = found + chests;
					total = total + (this.areas[area].chests || 0)
				} return asPercent ? found / total : found
		},
		getTotalChests: function() {
			var total = 0,
				area;
			for (area in this.areas) this.isValidArea(area) && (total = total + (this.areas[area].chests || 0));
			return total
		},
		hasAllAreasFound: function() {
			for (var area in this.areas)
				if (this.isValidArea(area) && !this.areasVisited[area.toCamel()]) return false;
			return true
		},
		getTotalLandmarksFoundInArea: function(area) {
			if (area = this.activeLandmarks[area]) {
				var count = 0,
					landmark;
				for (landmark in area) count++;
				return count || 0
			}
		},
		levelLoadStartOrder: 10,
		onLevelLoadStart: function(levelData) {
			this.currentMap = levelData.name.toKey("", "");
			var area = levelData.attributes && levelData.attributes.area || "fallback";
			this.updateVisitedArea(area);
			this._oobSoundTerrain = levelData.attributes && levelData.attributes.oobSound || "HOLE";
			var needsLoad = false;
			this.currentPlayerArea && this.currentPlayerArea.path != area ? needsLoad = true : this.currentPlayerArea || (needsLoad = true);
			if (needsLoad) {
				this.currentPlayerArea = new sc.AreaLoadable(area);
				this.currentPlayerArea.addLoadListener(this);
				this.currentArea = this.currentPlayerArea
			} else {
				this.currentArea = this.currentPlayerArea;
				this.onLoadableComplete()
			}
		},
		levelLoadedOrder: 150,
		onLevelLoaded: function() {
			var entities = ig.game.entities,
				i = entities.length;
			Math.seedrandomSeed(ig.game.mapName);
			this._usedNames.length = 0;
			for (var names = sc.quickmodel.names, attempts = 0, gender = sc.NPC_GENDER.BOTH; i--;) {
				var entity = entities[i];
				if (entity && entity instanceof ig.ENTITY.NPC && !entity.displayName && !entity.character.data.name) {
					for (var gender = sc.NPC_GENDER[entity.character.data.gender] || sc.NPC_GENDER.BOTH,
							index = Math.floor(Math.randomSeed() * names.length), attempts = 0; !this.canUseGenderName(gender, sc.NPC_GENDER[names[index].gender]) || this._usedNames[index];) {
						index = Math.floor(Math.randomSeed() * names.length);
						attempts++;
						if (attempts >= 3) break
					}
					this._usedNames[index] = true;
					entity.displayNameRandom = ig.LangLabel.getText(names[index].name)
				}
			}
			sc.Model.notifyObserver(sc.map, sc.MAP_EVENT.MAP_ENTERED)
		},
		canUseGenderName: function(gender, nameGender) {
			switch (nameGender || 0) {
				case sc.NPC_GENDER.BOTH:
					return gender == sc.NPC_GENDER.MALE || gender == sc.NPC_GENDER.FEMALE;
				case sc.NPC_GENDER.MALE:
					return gender == sc.NPC_GENDER.MALE;
				case sc.NPC_GENDER.FEMALE:
					return gender == sc.NPC_GENDER.FEMALE
			}
			return false
		},
		onReset: function() {
			this.areasVisited = {};
			this.activeLandmarks = {}
		},
		onVarAccess: function(path, args) {
			if (args[0] == "area") {
				var area = args[1];
				if (this.areas[area]) switch (args[2]) {
					case "name":
						return ig.LangLabel.getText(this.areas[area].name);
					case "isCurrent":
						return this.currentPlayerArea && this.currentPlayerArea.path == area;
					case "isBoosted":
						return this.getAreaItemToggleState(sc.AREA_ITEM_TYPE.BOOSTER, area);
					case "chests":
						return (this.areas[area].chests || 0) + "";
					case "landmark":
						switch (args[3]) {
							case "name":
								return ig.LangLabel.getText(this.areas[area].landmarks[args[4]].name);
							case "active":
								return this.activeLandmarks[args[1]][args[4]] ? true : false
						}
						break;
					case "unlocked":
						return this.areasVisited[area.toCamel()] ? true : false
				}
			}
			if (args[0] == "location") switch (args[1]) {
				case "current":
					return this.currentPlayerArea && this.currentPlayerArea.path;
				case "isMapDungeon":
					return this.isDungeon();
				case "isAreaDungon":
					return this.isDungeon(true)
			}
			throw Error("Unsupported var access path: " + path);
		},
		initAreas: function() {
			this.areas = ig.database.get("areas")
		},
		loadArea: function(area, loadable) {
			if (area == this.currentPlayerArea.path) {
				this.currentArea = this.currentPlayerArea;
				loadable.onLoadableComplete(true, this.currentArea)
			} else {
				this.currentArea = new sc.AreaLoadable(area);
				this.currentArea.addLoadListener(loadable)
			}
		},
		unloadCurrentArea: function() {
			if (this.currentArea.path != this.currentPlayerArea.path) {
				this.currentArea.decreaseRef();
				this.currentArea = null
			}
		},
		updateVisitedArea: function(area) {
			if (!this.areasVisited[area.toCamel()]) {
				this.areas[area].track && sc.stats.addMap("exploration", "areas", 1);
				this.areasVisited[area.toCamel()] = {}
			}
		},
		undoVisitedArea: function(area, data) {
			if (this.areasVisited[area.toCamel()]) {
				this.areas[area].track && sc.stats.subMap("exploration", "areas", 1);
				delete this.areasVisited[area.toCamel()]
			}
			if (data)
				for (var floors = data.data.floors, i = floors.length; i--;)
					for (var floor = floors[i], j = floor.maps.length; j--;) ig.vars.set("maps." + floor.maps[j].path.toCamel().toPath("", ""), null)
		},
		validateCurrentPlayerFloor: function() {
			var areaData = this.currentPlayerArea.data;
			if (areaData) {
				var floors = areaData.floors.length,
					maps = 0,
					floor = null,
					map = null;
				this.currentPlayerFloor = this.currentFloor = 0;
				for (var found = false; floors--;) {
					floor = areaData.floors[floors];
					for (maps = floor.maps.length; maps--;) {
						map = floor.maps[maps];
						found = map.path == this.currentMap;
						map.zMin && (found = found & ig.game.playerEntity.coll.level >= map.zMin);
						map.zMax && (found = found & ig.game.playerEntity.coll.level <= map.zMax);
						if (found) {
							this.currentFloor = this.currentPlayerFloor = floor.level || 0;
							return
						}
					}
				}
			}
		},
		validateCurrentFloor: function() {
			var areaData = this.currentArea.data,
				floors = areaData.floors.length,
				maps = 0,
				floor = null,
				map = null;
			this.currentFloor = 0;
			for (var defaultFloor = areaData.defaultFloor == void 0 ? void 0 : areaData.defaultFloor, found = false; floors--;) {
				floor = areaData.floors[floors];
				for (maps = floor.maps.length; maps--;) {
					map = floor.maps[maps];
					found = ig.vars.get("maps." + map.path.toCamel().toPath("", ""));
					map.zMin && (found = found & ig.game.playerEntity.coll.level >= map.zMin);
					map.zMax && (found = found & ig.game.playerEntity.coll.level <= map.zMax);
					if (found) {
						if (defaultFloor == void 0) {
							this.currentFloor = floor.level || 0;
							return
						}
						if (defaultFloor == floor.level) {
							this.currentFloor = defaultFloor;
							return
						}
					} else floor.level == defaultFloor && (defaultFloor = void 0)
				}
			}
		},
		restore: function() {
			this.currentFloor = this.currentPlayerFloor;
			this.currentArea && this.currentPlayerArea && this.currentArea.path != this.currentPlayerArea.path && this.currentArea.decreaseRef();
			this.currentArea = this.currentPlayerArea
		},
		addLandmark: function(landmark, area, eventEntity) {
			if (!this.isLandmarkValid(landmark, area || this.currentPlayerArea.path)) throw Error("invalid Landmark: " +
				landmark + "! Maybe missing entry in database?");
			area = area || this.currentPlayerArea.path;
			this.activeLandmarks[area] || (this.activeLandmarks[area] = {});
			if (!this.activeLandmarks[area][landmark] || !this.activeLandmarks[area][landmark].active) {
				if (this.activeLandmarks[area][landmark]) this.activeLandmarks[area][landmark].active = true;
				else {
					this.activeLandmarks[area][landmark] = {
						active: true
					};
					sc.stats.addMap("exploration", "landmarks", 1);
					sc.stats.addMap("exploration", area + "-landmarks", 1);
					sc.stats.setMap("exploration", "landmarksTotalRate", this.getTotalLandmarksFound(true));
					sc.menu.addLog({
						type: "LANDMARK",
						area: area,
						landmark: landmark
					})
				}
				landmarkEvent.landmark = landmark;
				landmarkEvent.area = area || this.currentPlayerArea.path;
				eventEntity && sc.options.get("update-landmark-style") != sc.UPDATE_LANDMARK_STYLE.NONE && ig.game.events.callEvent(this.getLandmarkEvent(eventEntity), ig.EventRunType.INTERRUPTABLE);
				sc.quests.onLandmarkEvent(area);
				sc.Model.notifyObserver(this, sc.MAP_EVENT.LANDMARK_ADDED, landmarkEvent)
			}
		},
		startTeleport: function(teleport) {
			this.teleportEvent = this.getTeleportEvent(teleport.path);
			sc.stats.addMap("player", "teleports", 1);
			sc.model.enterRunning();
			sc.Cutscene.startCutscene(this.teleportEvent)
		},
		getAreaType: function(area) {
			return sc.AREA_TYPE[this.areas[area].areaType]
		},
		isLandmarkValid: function(landmark, area) {
			var landmarks = this.areas[area].landmarks;
			return landmarks ? landmarks[landmark] : false
		},
		getAreaItemId: function(itemType, area) {
			if (!area) {
				if (!this.currentPlayerArea) return -1;
				area = this.currentPlayerArea.path
			}
			var itemId = this.areas[area][itemType.areaField];
			return !itemId && itemId !== 0 ? -1 : itemId
		},
		getAreaItemType: function(itemId, area) {
			if (!area) {
				if (!this.currentPlayerArea) return null;
				area = this.currentPlayerArea.path
			}
			var areaData = this.areas[area],
				itemType;
			for (itemType in sc.AREA_ITEM_TYPE)
				if (itemId == areaData[sc.AREA_ITEM_TYPE[itemType].areaField]) return itemType
		},
		getAreaItemAmount: function(itemType, area) {
			var itemId = this.getAreaItemId(itemType, area);
			return itemId == -1 ? 0 : sc.model.player.getItemAmount(itemId)
		},
		getAreaItemToggleState: function(itemType, area) {
			var itemId = this.getAreaItemId(itemType, area);
			return itemId == -1 ? false : sc.model.player.getItemAmount(itemId) > 0 && sc.model.player.getToggleItemState(itemId)
		},
		isLandmarkActive: function(landmark, area, getState) {
			if (area = area || this.currentPlayerArea && this.currentPlayerArea.path) {
				this.activeLandmarks[area] || (this.activeLandmarks[area] = {});
				return !this.activeLandmarks[area][landmark] ? false : getState ? this.activeLandmarks[area][landmark].active || false :
					this.activeLandmarks[area][landmark] || false
			}
		},
		setLandmarkActiveState: function(landmark, active, area) {
			(area = area || this.currentPlayerArea && this.currentPlayerArea.path) && this.activeLandmarks[area] && this.activeLandmarks[area][landmark] && (this.activeLandmarks[area][landmark].active = active || false)
		},
		setAreaLandmarksActiveState: function(area, active) {
			var landmarks = this.activeLandmarks[area];
			if (landmarks)
				for (var landmark in landmarks) landmarks[landmark].active = active
		},
		isDungeon: function(areaOnly) {
			if (!this.currentPlayerArea) return false;
			if (!areaOnly)
				if (areaOnly = this.getMapDungeon(this.currentMap)) return areaOnly == sc.MAP_DUNGEON_OVERRIDE.DUNGEON;
			areaOnly = this.areas[this.currentPlayerArea.path];
			return sc.AREA_TYPE[areaOnly && areaOnly.areaType] == sc.AREA_TYPE.DUNGEON
		},
		hasAnyAreaUnlocked: function() {
			for (var area in this.areas)
				if (this.areas[area] && this.areas[area].track && this.areasVisited[area.toCamel()]) return true;
			return false
		},
		getUnlockedAreas: function() {
			var areas = [],
				area;
			for (area in this.areas) this.areas[area] && (this.areas[area].track && this.areasVisited[area.toCamel()]) && areas.push(area);
			return areas
		},
		sortAreaList: function(areas) {
			if (areas) {
				areas.sort(function(a, b) {
					return (this.areas[a].order || 0) - (this.areas[b].order || 0)
				}.bind(this));
				return areas
			}
		},
		getLandmarkName: function(landmark, area) {
			var name = (area = this.areas[area]) && area.landmarks && area.landmarks[landmark] && area.landmarks[landmark].name;
			return name ? new ig.LangLabel(name) : "???"
		},
		getLandmark: function(landmark, area) {
			return this.areas[area].landmarks[landmark]
		},
		getCurrentAreaLandmark: function(landmark) {
			return this.areas[this.currentArea.path].landmarks[landmark]
		},
		getCurrentPlayerAreaName: function() {
			return new ig.LangLabel(this.areas[this.currentPlayerArea.path].name)
		},
		getCurrentAreaName: function() {
			return new ig.LangLabel(this.areas[this.currentArea.path].name)
		},
		getAreaOrder: function(area) {
			return this.areas[area] ? this.areas[area].order || 0 : 0
		},
		getAreaName: function(area, useShortName, showDlc) {
			if (!area) return "";
			if (area = this.areas[area]) {
				var name = new ig.LangLabel(useShortName ? area.shortName ? area.shortName : area.name : area.name);
				showDlc && area.isDLC && (name = name + (" \\c[2][" + ig.lang.get("sc.gui.dlc.abr") + "]\\c[0]"));
				return name
			}
			return null
		},
		getCurrentMapName: function(hideUnknown) {
			var name = this.getMapName(this.currentMap);
			return hideUnknown && name == this.currentMap ? "???" : name
		},
		getMapName: function(mapPath) {
			for (var maps = this.currentArea.data.floors[this.getCurrentFloorIndex()].maps, i = maps.length; i--;) {
				var map = maps[i];
				if (map.path == mapPath && map.name) return new ig.LangLabel(map.name)
			}
			return this.currentMap
		},
		getMapDungeon: function(mapPath) {
			if (!this.currentArea || !this.currentArea.data) return null;
			var floor = this.currentArea.data.floors[this.getCurrentFloorIndex()];
			if (!floor) return null;
			for (var maps = floor.maps, i = maps.length; i--;) {
				var map = maps[i];
				if (map.path == mapPath) return sc.MAP_DUNGEON_OVERRIDE[map.dungeon] || null
			}
			return null
		},
		getCurrentFloorIndex: function() {
			return this.currentFloor - this.currentArea.lowestFloor
		},
		getCurrentArea: function() {
			return this.currentArea ? this.currentArea.data : null
		},
		getLandmarkEvent: function(entity) {
			return new ig.Event({
				steps: [{
					type: "SET_CAMERA_BETWEEN",
					entity1: entity,
					entity2: ig.game.playerEntity,
					speed: "NORMAL",
					wait: true,
					transition: "EASE_OUT"
				}, {
					type: "WAIT",
					time: 1
				}, {
					type: "RESET_CAMERA",
					speed: "NORMAL",
					transition: "EASE_IN_OUT"
				}]
			})
		},
		getTeleportEvent: function(mapPath) {
			var player = ig.game.playerEntity,
				steps = [];
			steps.push({
				type: "DO_ACTION",
				entity: ig.game.playerEntity,
				action: [{
					type: "SET_Z_GRAVITY_FACTOR",
					value: 0
				}, {
					type: "SET_Z_VEL",
					value: 0
				}, {
					type: "WAIT",
					time: 5
				}]
			});
			steps.push({
				time: 0.2,
				ignoreSlowDown: false,
				type: "WAIT"
			});
			steps.push({
				type: "SET_TELEPORT_COLOR",
				lighter: true,
				color: "white"
			});
			steps.push({
				color: "white",
				alpha: 1,
				time: 1,
				lighter: true,
				type: "SET_OVERLAY"
			});
			steps.push({
				type: "SET_CAMERA_TARGET",
				entity: player,
				speed: "NORMAL",
				transition: "EASE_IN_OUT",
				zoom: 1.5
			});
			steps.push({
				time: 0.2,
				ignoreSlowDown: false,
				type: "WAIT"
			});
			steps.push({
				type: "SHOW_EFFECT",
				entity: player,
				effect: {
					sheet: "teleport",
					name: "hideMapTeleport"
				}
			});
			for (player = sc.party.getPartySize(); player--;) {
				var member = sc.party.getPartyMemberEntityByIndex(player);
				steps.push({
					type: "SHOW_EFFECT",
					entity: member,
					effect: {
						sheet: "teleport",
						name: "hideFast"
					}
				})
			}
			steps.push({
				time: 1,
				ignoreSlowDown: false,
				type: "WAIT"
			});
			steps.push({
				type: "TELEPORT",
				map: mapPath,
				marker: "landmark"
			});
			steps.push({
				time: 3,
				ignoreSlowDown: false,
				type: "WAIT"
			});
			mapPath = new ig.Event({
				steps: steps
			});
			mapPath.addHint("SKIN_ALLOWED");
			return mapPath
		},
		getVisitedArea: function(area) {
			return this.areasVisited[area.toCamel()]
		},
		getTeleport: function() {
			return this.teleportEvent
		},
		getCurrentChestCount: function() {
			return this.areas[this.currentArea.path].chests || 0
		},
		getChestCount: function(area) {
			return this.areas[area].chests || 0
		},
		onStorageSave: function(data) {
			if (this.currentPlayerArea) {
				data.area = this.areas[this.currentPlayerArea.path].name;
				if (this.currentPlayerFloor != void 0)
					for (var floors = this.currentPlayerArea.data.floors, i = floors.length; i--;) {
						if (this.currentPlayerFloor == floors[i].level) {
							data.floor = floors[i].name ? ig.LangLabel.getText(floors[i].name) : "";
							floors = floors[i].maps;
							for (i = floors.length; i--;)
								if (floors[i].path == this.currentMap && floors[i].name) {
									data.specialMap = ig.LangLabel.getText(floors[i].name);
									data.specialMap = floors[i].name
								} break
						}
					} else data.floor = "???"
			} else {
				data.area = "???";
				data.floor = ""
			}
			data.visitedAreas = ig.copy(this.areasVisited);
			data.landmarks = ig.copy(this.activeLandmarks)
		},
		onStoragePreLoad: function(data) {
			this.areasVisited = data.visitedAreas || {};
			data = data.landmarks || {};
			this.activeLandmarks = {};
			var count, landmark;
			for (landmark in data) {
				count = 0;
				for (var entry in data[landmark]) {
					this.activeLandmarks[landmark] || (this.activeLandmarks[landmark] = {});
					var state = data[landmark][entry];
					if (!state || state.active === void 0) state = {
						active: true
					};
					this.activeLandmarks[landmark][entry] = state;
					count++
				}
				sc.stats.setMap("exploration", landmark + "-landmarks", count)
			}
			sc.stats.setMap("exploration", "landmarksTotalRate", this.getTotalLandmarksFound(true));
			sc.stats.setMap("chests", "totalRate", sc.map.getTotalChestsFound(true))
		},
		onLoadableComplete: function() {
			this.validateCurrentPlayerFloor()
		}
	});
	sc.MAP_EVENT = {};
	sc.MAP_EVENT.LANDMARK_ADDED = 1;
	sc.MAP_EVENT.PLAYER_AREA_CHANGED = 2;
	sc.MAP_EVENT.MAP_ENTERED = 3;
	ig.addGameAddon(function() {
		return sc.map = new sc.MapModel
	})
});
ig.baked = !0;

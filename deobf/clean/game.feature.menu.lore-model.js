/**
 * @module game.feature.menu.lore-model
 * @description sc.LoreModel: the lore database model — category/sort/image
 *   enums, unlock tracking (whole lore + per entry), new-unlock/log/stats
 *   wiring, completion percentages, and storage save/load.
 */
ig.module("game.feature.menu.lore-model").requires("impact.base.game", "game.feature.model.base-model", "impact.feature.storage.storage").defines(function() {
	sc.LORE_CATERGORIES = {
		STORY: 0,
		CHARACTERS: 1,
		CROSS_LORE: 2,
		EARTH_LORE: 3
	};
	sc.LORE_SORT_TYPE = {
		ORDER: 0,
		NAME: 1,
		UNLOCKED: 2
	};
	sc.LORE_IMAGE_ALIGN = {
		LEFT: 0,
		CENTER: 1,
		RIGHT: 2
	};
	var unlockEvent = {
		lore: null,
		entry: null,
		updated: false
	};
	sc.LoreModel = ig.GameAddon.extend({
		observers: [],
		lories: null,
		unlockedLories: {},
		loaded: false,
		init: function() {
			this.parent("LoreModel");
			ig.storage.register(this);
			window.wm && ig.database.register("lore", "LoreEnumEditor", "Lore");
			ig.vars.registerVarAccessor("lore", this, "VarLoreEditor");
			this.lories = ig.database.get("lore")
		},
		onReset: function() {
			this.unlockedLories = {};
			this.loaded = false
		},
		onVarAccess: function(path, args) {
			if (args[0] == "lore") switch (args[1]) {
				case "unlock":
					var text = this._createUnlockText(args[2], args[3]);
					args[3] ? this.unlockLoreEntry(args[2], args[3], true) : this.unlockLore(args[2], true);
					return text;
				case "title":
					return this.getLoreTitle(args[2]);
				case "unlocked":
					return args[3] ? this.isLoreEntryUnlocked(args[2], args[3]) : this.isLoreUnlocked(args[2])
			}
			throw Error("Unsupported var access path: " + path);
		},
		_createUnlockText: function(lore, entry) {
			return entry ? !this.isLoreEntryUnlocked(lore, entry) ? "\\i[loreNew]" : "\\i[lore]" : !this.isLoreUnlocked(lore) ? "\\i[loreNew]" : "\\i[lore]"
		},
		unlockLoreAll: function() {
			for (var lore in this.lories) this.unlockLore(lore, false, true)
		},
		unlockLore: function(lore, notify, force, updateStats) {
			updateStats = updateStats == void 0 ? true : updateStats;
			if (this.lories[lore]) {
				if (!this.unlockedLories[lore] || force) {
					this.unlockedLories[lore] = {};
					unlockEvent.entry = null;
					unlockEvent.lore = lore;
					unlockEvent.updated = false;
					var content = this.lories[lore].content,
						entry;
					for (entry in content) {
						this.unlockedLories[lore][entry] = true;
						!force && updateStats && sc.stats.addMap("exploration", "loreEntry", 1)
					}!force && updateStats && sc.menu.addNewUnlock(sc.MENU_SUBMENU.LORE, lore);
					!force && updateStats && sc.stats.addMap("exploration", "lore", 1);
					!force && updateStats && sc.menu.addLog({
						type: "LORE",
						lore: lore
					});
					sc.stats.setMap("exploration", "loreTotalRate", this.getTotalLoreFound(true));
					notify && sc.model.player.hasItem(135) && sc.Model.notifyObserver(this, sc.LORE_EVENT.UNLOCKED, unlockEvent);
					ig.game.varsChangedDeferred()
				}
			} else ig.warn("LOCK NOT FOUND: " + lore)
		},
		unlockLoreEntry: function(lore, entry, notify) {
			if (this.lories[lore]) {
				var content = this.lories[lore].content;
				if (!this.unlockedLories[lore] || !this.unlockedLories[lore][entry]) {
					unlockEvent.lore = lore;
					unlockEvent.entry = entry;
					unlockEvent.updated = false;
					if (this.unlockedLories[lore]) {
						sc.menu.addLog({
							type: "LORE",
							lore: lore,
							update: true
						});
						unlockEvent.updated = true
					} else {
						this.unlockedLories[lore] = {};
						sc.stats.addMap("exploration", "lore", 1);
						sc.menu.addLog({
							type: "LORE",
							lore: lore
						});
						unlockEvent.updated = false
					}
					for (var key in content) {
						if (!this.unlockedLories[lore][key]) {
							this.unlockedLories[lore][key] = true;
							sc.stats.addMap("exploration", "loreEntry", 1)
						}
						if (key == entry) break
					}
					sc.menu.addNewUnlock(sc.MENU_SUBMENU.LORE, lore);
					notify && sc.model.player.hasItem(135) && sc.Model.notifyObserver(this, sc.LORE_EVENT.UNLOCKED, unlockEvent);
					ig.game.varsChangedDeferred()
				}
			} else throw Error("No such lore found: " + lore);
		},
		notifyFirstActivated: function() {
			sc.Model.notifyObserver(this, sc.LORE_EVENT.ACIVATED)
		},
		getLore: function(lore) {
			return this.lories[lore]
		},
		getLoreTitle: function(lore) {
			return ig.LangLabel.getText(this.lories[lore].title)
		},
		getLoreEntry: function(lore, entry) {
			return this.lories[lore] ? this.lories[lore].content[entry] : null
		},
		isLoreUnlocked: function(lore) {
			if (!this.unlockedLories[lore]) return false;
			var content = this.lories[lore].content,
				entry;
			for (entry in content)
				if (!this.unlockedLories[lore][entry]) return false;
			return true
		},
		hasAtLeastOneUnlocked: function(lore) {
			if (!this.unlockedLories[lore]) return false;
			var content = this.lories[lore].content,
				entry;
			for (entry in content)
				if (this.unlockedLories[lore][entry]) return true;
			return false
		},
		isLoreAvailable: function(lore) {
			return this.unlockedLories[lore] ? true : false
		},
		isLoreEntryUnlocked: function(lore, entry) {
			return this.unlockedLories[lore] && this.unlockedLories[lore][entry]
		},
		getCategoryList: function(category, sortType) {
			var list = [],
				entry = null,
				key;
			for (key in this.lories) {
				entry = this.lories[key];
				sc.LORE_CATERGORIES[entry.category] == category && list.push(key)
			}
			sortType != void 0 && this.sortLoreList(list, sortType);
			return list
		},
		sortLoreList: function(list, sortType) {
			switch (sortType) {
				case sc.LORE_SORT_TYPE.ORDER:
					list.sort(function(a, b) {
						return (this.lories[a].order || 0) - (this.lories[b].order || 0)
					}.bind(this));
					break;
				case sc.LORE_SORT_TYPE.NAME:
					list.sort(function(a, b) {
						var nameA = ig.LangLabel.getText(this.lories[a].title),
							nameB = ig.LangLabel.getText(this.lories[b].title);
						return nameA.localeCompare(nameB)
					}.bind(this));
					break;
				case sc.LORE_SORT_TYPE.UNLOCKED:
					list.sort(function(a, b) {
						var aUnlocked = this.isLoreAvailable(a),
							bUnlocked = this.isLoreAvailable(b);
						return aUnlocked == bUnlocked ? (this.lories[a].order || 0) - (this.lories[b].order || 0) : aUnlocked === bUnlocked ? 0 : aUnlocked ? -1 : 1
					}.bind(this))
			}
		},
		getCompletionPercent: function(lore) {
			if (!this.unlockedLories[lore]) return 0;
			var content = this.lories[lore].content,
				unlocked = 0,
				total = 0,
				entry;
			for (entry in content) {
				this.unlockedLories[lore][entry] && unlocked++;
				total++
			}
			return !total && !unlocked ? 100 : total ? unlocked / total : 0
		},
		getTotalLoreFound: function(asPercent, category) {
			var found = 0,
				total = 0,
				key;
			for (key in this.lories)
				if (!this.lories[key].noTrack && !this.lories[key].extension)
					if (category) {
						if (category == this.lories[key].category) {
							this.hasAtLeastOneUnlocked(key) && found++;
							total++
						}
					} else {
						this.hasAtLeastOneUnlocked(key) && found++;
						total++
					} return asPercent ? found / total : found
		},
		getTotalLoreEntriesFound: function(asPercent, category) {
			return this.getTotalLoreFound(asPercent, category)
		},
		onStorageSave: function(data) {
			data.lories = ig.copy(this.unlockedLories)
		},
		onStoragePreLoad: function(data) {
			this.unlockedLories = data.lories || {};
			for (var lore in this.unlockedLories) this.lories[lore] || delete this.unlockedLories[lore];
			sc.stats.setMap("exploration", "loreTotalRate", this.getTotalLoreFound(true));
			this.loaded = true
		}
	});
	sc.LORE_EVENT = {};
	sc.LORE_EVENT.UNLOCKED = 0;
	sc.LORE_EVENT.ACIVATED = 1;
	ig.addGameAddon(function() {
		return sc.lore = new sc.LoreModel
	})
});
ig.baked = !0;

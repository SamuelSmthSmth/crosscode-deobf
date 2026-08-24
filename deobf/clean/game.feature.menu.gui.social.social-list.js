/**
 * @module game.feature.menu.gui.social.social-list
 * @description The Social menu's tabbed party list (sc.SocialList): friends /
 *   contacts tabs, member sorting by status / name / level.
 */
ig.module("game.feature.menu.gui.social.social-list").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.gui.base.text", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.list-boxes", "game.feature.menu.gui.tab-box", "game.feature.menu.gui.social.social-misc").defines(function() {
	sc.SocialList = sc.ListTabbedPane.extend({
		submitSound: null,
		favSound: null,
		errorSound: null,
		init: function() {
			this.parent(true);
			this.setSize(264, 262);
			this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
			this.setPivot(264, 262);
			this.setPanelSize(264, 243);
			this.favSound = this.submitSound = sc.BUTTON_SOUND.submit;
			this.errorSound = sc.BUTTON_SOUND.denied;
			this.hook.transitions = {
				DEFAULT: {
					state: {},
					time: 0.2,
					timeFunction: KEY_SPLINES.LINEAR
				},
				HIDDEN: {
					state: {
						alpha: 0,
						offsetX: -132
					},
					time: 0.2,
					timeFunction: KEY_SPLINES.LINEAR
				},
				HIDDEN_EASE: {
					state: {
						alpha: 0,
						offsetX: -132
					},
					time: 0.2,
					timeFunction: KEY_SPLINES.EASE
				}
			};
			var label = new sc.TextGui(ig.lang.get("sc.gui.status-hud.lvl"), {
				font: sc.fontsystem.tinyFont
			});
			label.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
			label.setPos(9, -8);
			this.bg.addChildGui(label);
			label = new sc.TextGui(ig.lang.get("sc.gui.menu.social.status"), {
				font: sc.fontsystem.tinyFont
			});
			label.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
			label.setPos(37, -8);
			this.bg.addChildGui(label);
			this.addTab("close", 0, {
				type: sc.PARTY_MEMBER_TYPE.FRIEND
			});
			this.addTab("contacts", 1, {
				type: sc.PARTY_MEMBER_TYPE.CONTACT
			})
		},
		addObservers: function() {
			sc.Model.addObserver(sc.menu, this)
		},
		removeObservers: function() {
			sc.Model.removeObserver(sc.menu, this)
		},
		show: function() {
			this.parent();
			this.setTab(this.currentTabIndex || 0, true, {
				skipSounds: true
			});
			ig.interact.setBlockDelay(0.2);
			this.doStateTransition("DEFAULT")
		},
		hide: function() {
			this.parent();
			this.doStateTransition("HIDDEN")
		},
		updatePartyMembers: function() {
			for (var children = this.currentList.getChildren(), i = children.length; i--;) children[i].gui.updateMemberStatus()
		},
		getCurrentSortText: function() {
			var sortType = null,
				sortType = this.tabContent[this.currentTabIndex] ? this.tabContent[this.currentTabIndex].sort || sc.PARTY_SORT_TYPE.STATUS : sc.PARTY_SORT_TYPE.STATUS,
				sortText = "auto";
			switch (sortType) {
				case sc.PARTY_SORT_TYPE.STATUS:
					sortText = "status";
					break;
				case sc.PARTY_SORT_TYPE.NAME:
					sortText = "name";
					break;
				case sc.PARTY_SORT_TYPE.LEVEL:
					sortText = "socialLevel"
			}
			return ig.lang.get("sc.gui.menu.sort." + sortText)
		},
		onLeftRightPress: function() {
			this.submitSound.play();
			return {
				skipSounds: true
			}
		},
		onTabChanged: function(tab) {
			sc.menu.setSynoTab(tab);
			(ig.input.mouseGuiActive || this.currentGroup.isEmpty()) && sc.menu.setSynopInfo(null, true)
		},
		onTabButtonCreation: function(key, button, data) {
			button = new sc.ItemTabbedBox.TabButton(ig.lang.get("sc.gui.menu.social.tabs." + key), "social-" + key, 85);
			button.textChild.setPos(7, 1);
			button.setPos(0, 2);
			button.setData({
				type: data.type
			});
			this.addChildGui(button);
			return button
		},
		onTabPressed: function(button, skip) {
			if (!skip) {
				this.submitSound.play();
				this.setTab(this.getButtonIndex(button));
				for (var i = this.tabArray.length; i--;)
					if (button == this.tabArray[i]) {
						sc.menu.setSynoTab(i);
						break
					} sc.menu.setSynopInfo(null, true);
				return false
			}
		},
		onTabSelected: function() {
			ig.input.mouseGuiActive && sc.menu.setSynopInfo(null, true)
		},
		onTabMouseFocusLost: function() {
			sc.menu.synopInfo && sc.menu.setSynopInfo(null, true)
		},
		getMemberList: function(status, sortType) {
			var members = [],
				contacts = sc.party.contacts,
				key;
			for (key in contacts) {
				var contact = contacts[key];
				contact && contact.status == status && members.push(key)
			}
			sortType != void 0 && this.sortList(members, sortType);
			return members
		},
		sortList: function(list, sortType) {
			switch (sortType) {
				case sc.PARTY_SORT_TYPE.STATUS:
					list.sort(function(a, b) {
						var party = sc.party,
							aInParty = party.isPartyMember(a),
							bInParty = party.isPartyMember(b);
						if (party.isFriend(a) && party.isFriend(b)) {
							if (aInParty == bInParty) return sc.party.models[a].getCharacterName().localeCompare(sc.party.models[b].getCharacterName());
							if (aInParty) return -1
						}
						aInParty = party.contacts[a];
						bInParty = party.contacts[b];
						return aInParty.online && bInParty.online ? 0 : aInParty.online ? -1 : bInParty.online ? 1 : aInParty.status == bInParty.status ? party.models[a].getCharacterName().localeCompare(party.models[b].getCharacterName()) : bInParty.status - aInParty.status
					}.bind(this));
					break;
				case sc.PARTY_SORT_TYPE.NAME:
					list.sort(function(a, b) {
						var nameA = sc.party.models[a].getCharacterName(),
							nameB = sc.party.models[b].getCharacterName();
						return nameA.localeCompare(nameB)
					}.bind(this));
					break;
				case sc.PARTY_SORT_TYPE.LEVEL:
					list.sort(function(a, b) {
						var modelA = sc.party.models[a],
							modelB = sc.party.models[b];
						return modelA.level == modelB.level ? sc.party.models[a].getCharacterName().localeCompare(sc.party.models[b].getCharacterName()) :
							modelB.level - modelA.level
					}.bind(this))
			}
		},
		onCreateListEntries: function(buttonList, categoryButtons, memberType, sortType) {
			var entry = null,
				entry = null,
				memberType = this.getMemberList(memberType, sortType);
			buttonList.clear();
			categoryButtons.clear();
			for (categoryButtons = 0; categoryButtons < memberType.length; categoryButtons++) {
				entry = memberType[categoryButtons];
				entry = new sc.SocialEntryButton(entry, sc.party.getPartyMemberModel(entry));
				buttonList.addButton(entry)
			}
		},
		onListEntrySelected: function(entry) {
			if (entry.key) {
				sc.party.isFriend(entry.key) ? sc.menu.setSynopInfo(entry.key) : sc.menu.setSynopInfo(null);
				sc.menu.setInfoText(null, true)
			} else {
				sc.menu.setSynopInfo(entry.key);
				entry.data && (entry.data instanceof Object || sc.menu.setInfoText(entry.data))
			}
		},
		onListEntryPressed: function(entry) {
			this.submitSound.play();
			sc.menu.setSynopPressed(entry)
		},
		onListMouseFocusLost: function() {
			sc.menu.setSynopInfo(null, true);
			sc.menu.setInfoText(null, true)
		},
		modelChanged: function(model, event, data) {
			if (model == sc.menu && event == sc.MENU_EVENT.SORT_LIST) {
				this.sort(data.sortType);
				sc.menu.setSynopInfo(null, true);
				sc.menu.setInfoText(null, true)
			}
		}
	})
});
ig.baked = !0;

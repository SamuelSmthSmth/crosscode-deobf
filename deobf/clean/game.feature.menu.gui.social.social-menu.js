/**
 * @module game.feature.menu.gui.social.social-menu
 * @description The Social menu container (sc.SocialMenu): party list + info
 *   box, invite/contact/remove popup menus, and social-event wiring.
 */
ig.module("game.feature.menu.gui.social.social-menu").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.base-menu", "game.feature.menu.gui.social.social-list", "game.feature.menu.gui.social.social-misc").defines(function() {
	sc.SocialMenu = sc.ListInfoMenu.extend({
		party: null,
		options: null,
		optionsContacts: null,
		_keepButtonFocused: null,
		init: function() {
			this.parent(new sc.SocialList, new sc.SocialInfoBox);
			this.info.hook.pos.y = 164;
			this.party = new sc.SocialPartyBox;
			this.addChildGui(this.party);
			this.sortMenu.addButton("status", sc.PARTY_SORT_TYPE.STATUS, 0);
			this.sortMenu.addButton("name", sc.PARTY_SORT_TYPE.NAME, 1);
			this.sortMenu.addButton("socialLevel", sc.PARTY_SORT_TYPE.LEVEL, 2);
			this.options = new sc.SortMenu(this.onOptionsExecute.bind(this), this.onOptionsBack.bind(this), 126);
			this.options.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
			this.options.setPivot(this.options.hook.size.x / 2, 0);
			this.options.addButton("invite", 0, 0);
			this.options.addButton("contact", 1, 1);
			this.optionsContacts = new sc.SortMenu(this.onOptionsExecute.bind(this), this.onOptionsBack.bind(this), 126);
			this.optionsContacts.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
			this.optionsContacts.setPivot(this.optionsContacts.hook.size.x / 2, 0);
			this.optionsContacts.addButton("contact", 1, 0);
			this.doStateTransition("DEFAULT")
		},
		showMenu: function() {
			sc.menu.setSynopInfo(null, false);
			sc.menu.setInfoText("", false);
			this.parent();
			sc.menu.moveLeaSprite(0, 0, sc.MENU_LEA_STATE.HIDDEN);
			this.party.show();
			this.updateSortMenuButton(this.list.getCurrentSortText())
		},
		exitMenu: function() {
			this.parent();
			this.options.active && this.options.hideSortMenu();
			this.optionsContacts.active && this.optionsContacts.hideSortMenu();
			this.party.hide();
			sc.menu.moveLeaSprite(0, 0, sc.MENU_LEA_STATE.LARGE)
		},
		openOptionsMenu: function(entry, isContact) {
			this.hotkeySort.setActive(false);
			var menu = isContact ? this.optionsContacts : this.options;
			ig.gui.addGuiElement(menu);
			var coords = entry.hook.screenCoords,
				x = coords.x,
				y = coords.y + coords.h - 2,
				hook = menu.hook;
			if (y + hook.size.y > ig.system.height - 26) {
				y = coords.y - hook.size.y + 1;
				menu.setPivot(hook.size.x / 2, hook.size.y)
			} else menu.setPivot(hook.size.x / 2, 0);
			var key = entry.key,
				contactActive = inviteActive = true;
			sc.model.player.getCore(sc.PLAYER_CORE.MENU_SOCIAL_INVITE) || (inviteActive = contactActive = false);
			if (!sc.party.isPartyMemberOnline(key)) contactActive = inviteActive = false;
			if (isContact) menu.buttons[0].setActive(contactActive);
			else {
				if (sc.party.isPartyMemberLocked(key)) {
					menu.setButtonKey(0, "locked");
					inviteActive = false
				} else if (sc.party.isPartyMember(key)) menu.setButtonKey(0, "remove");
				else if (sc.party.currentParty.length >= sc.PARTY_MAX_MEMBERS) {
					menu.setButtonKey(0, "inviteFull");
					inviteActive = false
				} else menu.setButtonKey(0, "invite");
				menu.buttons[0].setActive(inviteActive);
				menu.buttons[1] && menu.buttons[1].setActive(contactActive)
			}
			entry.keepButtonPressed();
			this._keepButtonFocused = entry;
			menu.showSortMenuAt(x, y)
		},
		contactMember: function(member) {
			sc.commonEvents.triggerEvent("SOCIAL_ACTION", {
				member: member,
				actionType: sc.SOCIAL_ACTION.CONTACT
			})
		},
		inviteMember: function(member) {
			sc.commonEvents.triggerEvent("SOCIAL_ACTION", {
				member: member,
				actionType: sc.SOCIAL_ACTION.PARTY_JOIN
			}).addEventAttached(this)
		},
		removeMember: function(member) {
			sc.commonEvents.triggerEvent("SOCIAL_ACTION", {
				member: member,
				actionType: sc.SOCIAL_ACTION.PARTY_LEAVE
			}).addEventAttached(this)
		},
		onEventEndDetach: function() {
			this.party.updatePartyMembers();
			this.list.updatePartyMembers()
		},
		onOptionsExecute: function(button) {
			var entry = this._keepButtonFocused;
			if (this._keepButtonFocused) {
				this._keepButtonFocused.unPressButton();
				this._keepButtonFocused = null
			}
			this.options.hideSortMenu();
			this.optionsContacts.hideSortMenu();
			switch (button.data.sortType) {
				case 0:
					sc.party.isPartyMember(entry.key) ? this.removeMember(entry.key) : this.inviteMember(entry.key);
					break;
				case 1:
					this.contactMember(entry.key)
			}
			ig.interact.setBlockDelay(0.2);
			this.onOptionsBack()
		},
		onOptionsBack: function() {
			if (this._keepButtonFocused) {
				this._keepButtonFocused.unPressButton();
				this._keepButtonFocused = null
			}
			this.hotkeySort.setActive(true);
			if (ig.input.mouseGuiActive) {
				sc.menu.buttonInteract.mouseOverGui = null;
				sc.menu.synopInfo = null;
				this.info.setCharacter(null)
			}
		},
		createHelpGui: function() {
			if (!this.helpGui) {
				this.helpGui = new sc.HelpScreen(this, ig.lang.get("sc.gui.menu.help-texts.social.title"), ig.lang.get("sc.gui.menu.help-texts.social.pages"), function() {
					this.commitHotKeysToTopBar(true)
				}.bind(this), true);
				this.helpGui.hook.zIndex = 15E4;
				this.helpGui.hook.pauseGui = true
			}
		},
		modelChanged: function(model, event, data) {
			if (model == sc.menu)
				if (event == sc.MENU_EVENT.SORT_LIST) this.updateSortMenuButton(data.text);
				else if (event == sc.MENU_EVENT.SYNO_CHANGED_TAB) {
				this.options.hideSortMenu();
				this.optionsContacts.hideSortMenu();
				this.onOptionsBack();
				this.list.currentTabIndex == 0 ? this.info.show() : this.info.hide();
				this.updateSortMenuButton(this.list.getCurrentSortText())
			} else event == sc.MENU_EVENT.SYNOP_SET_INFO ? (!this.options.active || !this.optionsContacts.active) && this.info.setCharacter(sc.menu.synopInfo) : event == sc.MENU_EVENT.SYNOP_BUTTON_PRESS &&
				(sc.party.isFriend(data.key) ? this.openOptionsMenu(data) : this.openOptionsMenu(data, true))
		}
	})
});
ig.baked = !0;

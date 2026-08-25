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
            var b = new sc.TextGui(ig.lang.get("sc.gui.status-hud.lvl"), {
                font: sc.fontsystem.tinyFont
            });
            b.setAlign(ig.GUI_ALIGN.X_RIGHT,
                ig.GUI_ALIGN.Y_TOP);
            b.setPos(9, -8);
            this.bg.addChildGui(b);
            b = new sc.TextGui(ig.lang.get("sc.gui.menu.social.status"), {
                font: sc.fontsystem.tinyFont
            });
            b.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            b.setPos(37, -8);
            this.bg.addChildGui(b);
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
            for (var b = this.currentList.getChildren(), a = b.length; a--;) b[a].gui.updateMemberStatus()
        },
        getCurrentSortText: function() {
            var b = null,
                b = this.tabContent[this.currentTabIndex] ? this.tabContent[this.currentTabIndex].sort || sc.PARTY_SORT_TYPE.STATUS : sc.PARTY_SORT_TYPE.STATUS,
                a = "auto";
            switch (b) {
                case sc.PARTY_SORT_TYPE.STATUS:
                    a =
                        "status";
                    break;
                case sc.PARTY_SORT_TYPE.NAME:
                    a = "name";
                    break;
                case sc.PARTY_SORT_TYPE.LEVEL:
                    a = "socialLevel"
            }
            return ig.lang.get("sc.gui.menu.sort." + a)
        },
        onLeftRightPress: function() {
            this.submitSound.play();
            return {
                skipSounds: true
            }
        },
        onTabChanged: function(b) {
            sc.menu.setSynoTab(b);
            (ig.input.mouseGuiActive || this.currentGroup.isEmpty()) && sc.menu.setSynopInfo(null, true)
        },
        onTabButtonCreation: function(b, a, d) {
            b = new sc.ItemTabbedBox.TabButton(ig.lang.get("sc.gui.menu.social.tabs." + b), "social-" + b, 85);
            b.textChild.setPos(7,
                1);
            b.setPos(0, 2);
            b.setData({
                type: d.type
            });
            this.addChildGui(b);
            return b
        },
        onTabPressed: function(b, a) {
            if (!a) {
                this.submitSound.play();
                this.setTab(this.getButtonIndex(b));
                for (var d = this.tabArray.length; d--;)
                    if (b == this.tabArray[d]) {
                        sc.menu.setSynoTab(d);
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
        getMemberList: function(b, a) {
            var d = [],
                c = sc.party.contacts,
                e;
            for (e in c) {
                var f = c[e];
                f && f.status == b && d.push(e)
            }
            a != void 0 && this.sortList(d, a);
            return d
        },
        sortList: function(b, a) {
            switch (a) {
                case sc.PARTY_SORT_TYPE.STATUS:
                    b.sort(function(a, b) {
                        var e = sc.party,
                            f = e.isPartyMember(a),
                            g = e.isPartyMember(b);
                        if (e.isFriend(a) && e.isFriend(b)) {
                            if (f == g) return sc.party.models[a].getCharacterName().localeCompare(sc.party.models[b].getCharacterName());
                            if (f) return -1
                        }
                        f = e.contacts[a];
                        g = e.contacts[b];
                        return f.online && g.online ? 0 : f.online ? -1 : g.online ? 1 : f.status ==
                            g.status ? e.models[a].getCharacterName().localeCompare(e.models[b].getCharacterName()) : g.status - f.status
                    }.bind(this));
                    break;
                case sc.PARTY_SORT_TYPE.NAME:
                    b.sort(function(a, b) {
                        var e = sc.party.models[a].getCharacterName(),
                            f = sc.party.models[b].getCharacterName();
                        return e.localeCompare(f)
                    }.bind(this));
                    break;
                case sc.PARTY_SORT_TYPE.LEVEL:
                    b.sort(function(a, b) {
                        var e = sc.party.models[a],
                            f = sc.party.models[b];
                        return e.level == f.level ? sc.party.models[a].getCharacterName().localeCompare(sc.party.models[b].getCharacterName()) :
                            f.level - e.level
                    }.bind(this))
            }
        },
        onCreateListEntries: function(b, a, d, c) {
            var e = null,
                e = null,
                d = this.getMemberList(d, c);
            b.clear();
            a.clear();
            for (a = 0; a < d.length; a++) {
                e = d[a];
                e = new sc.SocialEntryButton(e, sc.party.getPartyMemberModel(e));
                b.addButton(e)
            }
        },
        onListEntrySelected: function(b) {
            if (b.key) {
                sc.party.isFriend(b.key) ? sc.menu.setSynopInfo(b.key) : sc.menu.setSynopInfo(null);
                sc.menu.setInfoText(null, true)
            } else {
                sc.menu.setSynopInfo(b.key);
                b.data && (b.data instanceof Object || sc.menu.setInfoText(b.data))
            }
        },
        onListEntryPressed: function(b) {
            this.submitSound.play();
            sc.menu.setSynopPressed(b)
        },
        onListMouseFocusLost: function() {
            sc.menu.setSynopInfo(null, true);
            sc.menu.setInfoText(null, true)
        },
        modelChanged: function(b, a, d) {
            if (b == sc.menu && a == sc.MENU_EVENT.SORT_LIST) {
                this.sort(d.data.sortType);
                sc.menu.setSynopInfo(null, true);
                sc.menu.setInfoText(null, true)
            }
        }
    })
});
ig.baked = !0;

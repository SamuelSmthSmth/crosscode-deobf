ig.module("game.feature.menu.gui.quest-hub.quest-hub-list").requires("impact.feature.gui.base.box", "impact.feature.gui.gui", "impact.feature.interact.button-interact", "game.feature.menu.gui.quest-hub.quest-hub-misc").defines(function() {
    sc.QuestHubList = sc.ListTabbedPane.extend({
        submitSound: null,
        containerHeightOffset: -26,
        listPosOffset: -6,
        listHeightOffset: 6,
        listPageSize: 25,
        init: function() {
            this.parent(true);
            this.setSize(436, 258);
            this.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.setPivot(436,
                258);
            this.setPanelSize(436, 216);
            this.submitSound = sc.BUTTON_SOUND.submit;
            this.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: 218
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN_EASE: {
                    state: {
                        alpha: 0,
                        offsetX: 218
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                }
            };
            this.addTab("open", 0, {
                type: sc.MENU_QUEST_HUB_TABS.OPEN
            });
            this.addTab("active", 1, {
                type: sc.MENU_QUEST_HUB_TABS.ACTIVE
            });
            this.addTab("finished", 2, {
                type: sc.MENU_QUEST_HUB_TABS.FINISHED
            })
        },
        addObservers: function() {
            sc.Model.addObserver(sc.menu,
                this)
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
        getCurrentSortText: function() {
            var b = null,
                b = this.tabContent[this.currentTabIndex] ? this.tabContent[this.currentTabIndex].sort || sc.QUEST_SORT_TYPE.ORDER : sc.QUEST_SORT_TYPE.ORDER,
                a = "auto";
            switch (b) {
                case sc.QUEST_SORT_TYPE.ORDER:
                    a =
                        "auto";
                    break;
                case sc.QUEST_SORT_TYPE.NAME:
                    a = "name";
                    break;
                case sc.QUEST_SORT_TYPE.LEVEL:
                    a = "questLevel"
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
            sc.menu.setSynoTab(b)
        },
        onTabButtonCreation: function(b, a, d) {
            b = new sc.ItemTabbedBox.TabButton(ig.lang.get("sc.gui.menu.questHub.tabs." + b), "questHub-" + b, 85);
            b.textChild.setPos(7, 1);
            b.setPos(0, 2);
            b.setData({
                type: d.type
            });
            this.addChildGui(b);
            return b
        },
        onTabPressed: function(b,
            a) {
            if (!a) {
                this.submitSound.play();
                this.setTab(this.getButtonIndex(b));
                for (var d = this.tabArray.length; d--;)
                    if (b == this.tabArray[d]) {
                        sc.menu.setSynoTab(d);
                        break
                    } return false
            }
        },
        onTabSelected: function() {
            sc.menu.setInfoText("", true)
        },
        onTabMouseFocusLost: function() {
            sc.menu.setInfoText(null, true)
        },
        onInitSortType: function() {
            return 1
        },
        onCreateListEntries: function(b, a, d, c) {
            var e = null,
                e = null,
                c = this.collectQuests(d, c);
            b.clear();
            a.clear();
            for (a = 0; a < c.length; a++) {
                e = c[a];
                e = new sc.QuestHubListEntry(e, d);
                b.addButton(e)
            }
        },
        onListEntrySelected: function(b) {
            b.data && (b.data instanceof Object || sc.menu.setInfoText(b.data))
        },
        onListMouseFocusLost: function() {
            sc.menu.setInfoText(null, true)
        },
        collectQuests: function(b, a) {
            var d = ig.database.get("questHubs")[sc.menu.questHubID];
            if (!d) throw Error("Quest HUB ID not found: " + sc.menu.questHubID);
            var d = d.areas,
                c = sc.quests.staticQuests,
                e = [],
                f = new ig.VarCondition,
                g;
            for (g in c) {
                var h = c[g];
                if (h.hubSettings && !h.noTrack && (!h.extension || ig.extensions.hasExtension(h.extension)))
                    for (var i = 0; i < d.length; i++)
                        if (h.area ==
                            d[i])
                            if (b == sc.MENU_QUEST_HUB_TABS.OPEN) {
                                if (!sc.quests.isQuestActive(g) && !sc.quests.isQuestSolved(g))
                                    if (h.hubSettings.condition) {
                                        f.setCondition(h.hubSettings.condition);
                                        f.evaluate() && e.push(g)
                                    } else e.push(g)
                            } else b == sc.MENU_QUEST_HUB_TABS.ACTIVE ? sc.quests.isQuestActive(g) && e.push(g) : b == sc.MENU_QUEST_HUB_TABS.FINISHED && sc.quests.isQuestSolved(g) && e.push(g)
            }
            a != void 0 && this.sortList(e, a);
            return e
        },
        sortList: function(b, a) {
            switch (a) {
                case sc.QUEST_SORT_TYPE.ORDER:
                    b.sort(function(a, b) {
                        var e = sc.quests.getStaticQuest(a),
                            f = sc.quests.getStaticQuest(b);
                        if (e.area != f.area) {
                            e = sc.map.getAreaOrder(e.area);
                            f = sc.map.getAreaOrder(f.area);
                            return e - f
                        }
                        return e.order - f.order
                    });
                    break;
                case sc.QUEST_SORT_TYPE.NAME:
                    b.sort(function(a, b) {
                        var e = sc.quests.getStaticQuest(a),
                            f = sc.quests.getStaticQuest(b);
                        return e.name.toString().localeCompare(f.name.toString())
                    });
                    break;
                case sc.QUEST_SORT_TYPE.LEVEL:
                    b.sort(function(a, b) {
                        var e = sc.quests.getStaticQuest(a),
                            f = sc.quests.getStaticQuest(b);
                        return e.level - f.level
                    })
            }
        },
        modelChanged: function(b, a, d) {
            b ==
                sc.menu && a == sc.MENU_EVENT.SORT_LIST && this.sort(d.data.sortType)
        }
    })
});
ig.baked = !0;

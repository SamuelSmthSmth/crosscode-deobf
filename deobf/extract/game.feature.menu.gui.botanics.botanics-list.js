ig.module("game.feature.menu.gui.botanics.botanics-list").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.gui.base.box", "game.feature.gui.base.text", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.item.item-list", "game.feature.menu.gui.list-boxes", "game.feature.menu.gui.tab-box", "game.feature.menu.gui.botanics.botanics-misc").defines(function() {
    sc.BotanicsListBox = sc.ListTabbedPane.extend({
        submitSound: null,
        init: function() {
            this.parent(true);
            this.setSize(436,
                258);
            this.setPivot(436, 258);
            this.setPanelSize(436, 242);
            this.setPos(0, 0);
            this.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
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
                }
            };
            this.annotation = {
                content: {
                    title: "sc.gui.menu.help.botanics.titles.info",
                    description: "sc.gui.menu.help.botanics.description.info"
                },
                offset: {
                    x: 2,
                    y: 34
                },
                size: {
                    x: 34,
                    y: 224
                },
                index: {
                    x: 0,
                    y: 0
                }
            };
            this.bg.setSize(this.hook.size.x, 222);
            var b = new sc.TextGui(ig.lang.get("sc.gui.botanics.rate"), {
                font: sc.fontsystem.tinyFont
            });
            b.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            b.setPos(6, -8);
            this.bg.addChildGui(b);
            for (var b = sc.map.getUnlockedAreas(), b = sc.map.sortAreaList(b), a = 0, d = 0; d < b.length; d++) sc.menu.hasAnyDropInArea(b[d]) && sc.menu.hasDropInArea(b[d]) && this.addTab(b[d], a++, {
                type: b[d]
            });
            sc.menu.hasAnyOtherDropFound() && this.addTab("other", a, {
                type: "other"
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
                b = this.tabContent[this.currentTabIndex] ? this.tabContent[this.currentTabIndex].sort || sc.BOTANICS_SORT_TYPE.ORDER : sc.BOTANICS_SORT_TYPE.ORDER,
                a = "auto";
            switch (b) {
                case sc.BOTANICS_SORT_TYPE.ORDER:
                    a =
                        "auto";
                    break;
                case sc.BOTANICS_SORT_TYPE.FOUND:
                    a = "botanics";
                    break;
                case sc.BOTANICS_SORT_TYPE.NAME:
                    a = "botanicsName"
            }
            return ig.lang.get("sc.gui.menu.sort." + a)
        },
        onLeftRightPress: function(b, a) {
            a != this.currentTabIndex && this.submitSound.play();
            return {
                skipSounds: true
            }
        },
        onTabChanged: function() {
            (ig.input.mouseGuiActive || this.currentGroup.isEmpty()) && sc.menu.setSynopInfo(null, true)
        },
        onTabButtonCreation: function(b, a, d) {
            a = null;
            a = b == "other" ? ig.lang.get("sc.gui.area.other") : sc.map.getAreaName(b);
            b = "area-" + b;
            sc.fontsystem.hasIcon(b) ||
                (b = "enemy-abstract");
            b = new sc.ItemTabbedBox.TabButton(a, b, 140);
            b.textChild.setPos(7, 1);
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
            sc.menu.setSynopInfo(null,
                true)
        },
        onCreateListEntries: function(b, a, d, c) {
            var e = null,
                f = null,
                e = -1,
                g = null,
                h = f = null,
                i = e = 0,
                j = 0,
                d = sc.menu.getFoundDrops(d, c);
            b.setSize(436, 222);
            b.paddingBetween = 0;
            b.paddingTop = 2;
            b.clear();
            a.clear();
            if (b.plantInfoGui) b.plantInfoGui.removeAllChildren();
            else {
                b.plantInfoGui = new ig.GuiElementBase;
                b.box.insertChildGui(b.plantInfoGui, 0);
                b.forceLastScroll = true
            }
            for (var c = 1, k = 0; k < d.length; k++) {
                g = d[k];
                f = sc.menu.drops[g];
                h = f.items;
                e = sc.menu.getDropCount(g);
                i = f.progress || 50;
                j = (e / i).limit(0, 1);
                f = new sc.BotanicsButtonBox(g,
                    e, i, a, b.getChildren().length);
                f.setPos(1, c);
                b.plantInfoGui.addChildGui(f);
                var l = 0;
                if (j >= 1)
                    for (i = 0; i < h.length; i++) {
                        var e = h[i].id,
                            j = sc.inventory.getItemNameWithIcon(e),
                            o = sc.inventory.getItemDescription(e),
                            e = new sc.BotanicsEntryButton(j, g, e, o, h[i].prob || 0);
                        b.addButton(e);
                        e.hook.pos.x = 237;
                        if (i == 0) e.hook.pos.y = c + 1;
                        l = l + e.hook.size.y
                    } else {
                        e = new sc.BotanicsPreUnlockButton(g, e, i);
                        b.addButton(e);
                        e.hook.pos.x = 236;
                        e.hook.pos.y = c + 1;
                        l = l + e.hook.size.y
                    }
                f.hook.size.y = Math.max(l + 1, 44);
                c = c + (f.hook.size.y + 2);
                if (k != d.length -
                    1) {
                    g = new ig.ColorGui("#545454", 433, 1);
                    g.setPos(0, c - 1);
                    b.plantInfoGui.addChildGui(g)
                } else c = c - 2;
                c = c + 1
            }
            b.plantInfoGui.hook.size.y = c;
            b.updateContentHeight()
        },
        onListEntrySelected: function(b) {
            if (b.plant != void 0) b.data && b.data.description ? sc.menu.setInfoText(b.data.description) : sc.menu.setInfoText(null, true);
            else {
                sc.menu.setBuffText("", false);
                sc.menu.setSynopInfo(void 0);
                b.data && (b.data instanceof Object || sc.menu.setInfoText(b.data))
            }
        },
        onListEntryPressed: function() {},
        onListMouseFocusLost: function() {
            sc.menu.setSynopInfo(null,
                true);
            sc.menu.setInfoText(null, true);
            sc.menu.setBuffText("", false)
        },
        modelChanged: function(b, a, d) {
            if (b == sc.menu && a == sc.MENU_EVENT.SORT_LIST) {
                sc.menu.setSynopInfo(null, true);
                sc.menu.setInfoText(null, true);
                sc.menu.setBuffText("", false);
                this.sort(d.data.sortType)
            }
        }
    })
});
ig.baked = !0;

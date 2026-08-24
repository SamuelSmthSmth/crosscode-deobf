/**
 * game.feature.menu.gui.botanics.botanics-list
 * ============================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.botanics.botanics-list")`.
 *
 * `sc.BotanicsListBox`: the botanics collection list — one tab per area
 * (plus "other"), rows per plant with the progress bar / pre-unlock
 * state and the unlocked item entries on the right side.
 */
ig.module("game.feature.menu.gui.botanics.botanics-list")
    .requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.gui.base.box", "game.feature.gui.base.text", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.item.item-list", "game.feature.menu.gui.list-boxes", "game.feature.menu.gui.tab-box", "game.feature.menu.gui.botanics.botanics-misc")
    .defines(function () {

    sc.BotanicsListBox = sc.ListTabbedPane.extend({
        submitSound: null,

        init: function () {
            this.parent(true);
            this.setSize(436, 258);
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
            var rateLabel = new sc.TextGui(ig.lang.get("sc.gui.botanics.rate"), {
                font: sc.fontsystem.tinyFont
            });
            rateLabel.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            rateLabel.setPos(6, -8);
            this.bg.addChildGui(rateLabel);
            var areas = sc.map.getUnlockedAreas(),
                areas = sc.map.sortAreaList(areas),
                index = 0;
            for (var i = 0; i < areas.length; i++) sc.menu.hasAnyDropInArea(areas[i]) && sc.menu.hasDropInArea(areas[i]) && this.addTab(areas[i], index++, {
                type: areas[i]
            });
            sc.menu.hasAnyOtherDropFound() && this.addTab("other", index, {
                type: "other"
            })
        },

        addObservers: function () {
            sc.Model.addObserver(sc.menu, this)
        },

        removeObservers: function () {
            sc.Model.removeObserver(sc.menu, this)
        },

        show: function () {
            this.parent();
            this.setTab(this.currentTabIndex || 0, true, {
                skipSounds: true
            });
            ig.interact.setBlockDelay(0.2);
            this.doStateTransition("DEFAULT")
        },

        hide: function () {
            this.parent();
            this.doStateTransition("HIDDEN")
        },

        getCurrentSortText: function () {
            var sortType = null,
                sortType = this.tabContent[this.currentTabIndex] ? this.tabContent[this.currentTabIndex].sort || sc.BOTANICS_SORT_TYPE.ORDER : sc.BOTANICS_SORT_TYPE.ORDER,
                key = "auto";
            switch (sortType) {
                case sc.BOTANICS_SORT_TYPE.ORDER:
                    key = "auto";
                    break;
                case sc.BOTANICS_SORT_TYPE.FOUND:
                    key = "botanics";
                    break;
                case sc.BOTANICS_SORT_TYPE.NAME:
                    key = "botanicsName"
            }
            return ig.lang.get("sc.gui.menu.sort." + key)
        },

        onLeftRightPress: function (button, index) {
            index != this.currentTabIndex && this.submitSound.play();
            return {
                skipSounds: true
            }
        },

        onTabChanged: function () {
            (ig.input.mouseGuiActive || this.currentGroup.isEmpty()) && sc.menu.setSynopInfo(null, true)
        },

        onTabButtonCreation: function (area, index, data) {
            var label = null;
            label = area == "other" ? ig.lang.get("sc.gui.area.other") : sc.map.getAreaName(area);
            var icon = "area-" + area;
            sc.fontsystem.hasIcon(icon) || (icon = "enemy-abstract");
            var button = new sc.ItemTabbedBox.TabButton(label, icon, 140);
            button.textChild.setPos(7, 1);
            button.setPos(0, 2);
            button.setData({
                type: data.type
            });
            this.addChildGui(button);
            return button
        },

        onTabPressed: function (button, isPressed) {
            if (!isPressed) {
                this.submitSound.play();
                this.setTab(this.getButtonIndex(button));
                for (var i = this.tabArray.length; i--;)
                    if (button == this.tabArray[i]) {
                        sc.menu.setSynoTab(i);
                        break
                    }
                sc.menu.setSynopInfo(null, true);
                return false
            }
        },

        onTabSelected: function () {
            ig.input.mouseGuiActive && sc.menu.setSynopInfo(null, true)
        },

        onTabMouseFocusLost: function () {
            sc.menu.setSynopInfo(null, true)
        },

        onCreateListEntries: function (list, buttongroup, tabType, sortType) {
            var plant = null,
                drop = null,
                collected = -1,
                item = null,
                label = drop = null,
                progress = collected = 0,
                entryHeight = 0,
                drops = sc.menu.getFoundDrops(tabType, sortType);
            list.setSize(436, 222);
            list.paddingBetween = 0;
            list.paddingTop = 2;
            list.clear();
            buttongroup.clear();
            if (list.plantInfoGui) list.plantInfoGui.removeAllChildren();
            else {
                list.plantInfoGui = new ig.GuiElementBase;
                list.box.insertChildGui(list.plantInfoGui, 0);
                list.forceLastScroll = true
            }
            for (var y = 1, i = 0; i < drops.length; i++) {
                plant = drops[i];
                drop = sc.menu.drops[plant];
                item = drop.items;
                collected = sc.menu.getDropCount(plant);
                progress = drop.progress || 50;
                var ratio = (collected / progress).limit(0, 1);
                var buttonBox = new sc.BotanicsButtonBox(plant, collected, progress, buttongroup, list.getChildren().length);
                buttonBox.setPos(1, y);
                list.plantInfoGui.addChildGui(buttonBox);
                var contentHeight = 0;
                if (ratio >= 1)
                    for (progress = 0; progress < item.length; progress++) {
                        var itemId = item[progress].id,
                            name = sc.inventory.getItemNameWithIcon(itemId),
                            description = sc.inventory.getItemDescription(itemId),
                            entry = new sc.BotanicsEntryButton(name, plant, itemId, description, item[progress].prob || 0);
                        list.addButton(entry);
                        entry.hook.pos.x = 237;
                        if (progress == 0) entry.hook.pos.y = y + 1;
                        contentHeight = contentHeight + entry.hook.size.y
                    } else {
                    var preUnlock = new sc.BotanicsPreUnlockButton(plant, collected, progress);
                    list.addButton(preUnlock);
                    preUnlock.hook.pos.x = 236;
                    preUnlock.hook.pos.y = y + 1;
                    contentHeight = contentHeight + preUnlock.hook.size.y
                }
                buttonBox.hook.size.y = Math.max(contentHeight + 1, 44);
                y = y + (buttonBox.hook.size.y + 2);
                if (i != drops.length - 1) {
                    var divider = new ig.ColorGui("#545454", 433, 1);
                    divider.setPos(0, y - 1);
                    list.plantInfoGui.addChildGui(divider)
                } else y = y - 2;
                y = y + 1
            }
            list.plantInfoGui.hook.size.y = y;
            list.updateContentHeight()
        },

        onListEntrySelected: function (entry) {
            if (entry.plant != void 0) entry.data && entry.data.description ? sc.menu.setInfoText(entry.data.description) : sc.menu.setInfoText(null, true);
            else {
                sc.menu.setBuffText("", false);
                sc.menu.setSynopInfo(void 0);
                entry.data && (entry.data instanceof Object || sc.menu.setInfoText(entry.data))
            }
        },

        onListEntryPressed: function () {},

        onListMouseFocusLost: function () {
            sc.menu.setSynopInfo(null, true);
            sc.menu.setInfoText(null, true);
            sc.menu.setBuffText("", false)
        },

        modelChanged: function (model, event, data) {
            if (model == sc.menu && event == sc.MENU_EVENT.SORT_LIST) {
                sc.menu.setSynopInfo(null, true);
                sc.menu.setInfoText(null, true);
                sc.menu.setBuffText("", false);
                this.sort(data.data.sortType)
            }
        }
    })
});
ig.baked = !0;

ig.module("game.feature.menu.gui.lore.lore-misc").requires("impact.feature.gui.base.box", "impact.feature.gui.gui", "game.feature.menu.gui.menu-misc").defines(function() {
    sc.LoreInfoBox = ig.BoxGui.extend({
        gfx: new ig.Image("media/gui/basic.png"),
        ninepatch: new ig.NinePatch("media/gui/menu.png", {
            width: 2,
            height: 8,
            left: 27,
            top: 21,
            right: 27,
            bottom: 3,
            offsets: {
                "default": {
                    x: 456,
                    y: 244
                },
                focus: {
                    x: 576,
                    y: 432
                }
            }
        }),
        title: null,
        category: null,
        alternativeArrow: null,
        alternative: null,
        scrollContainer: null,
        content: null,
        key: null,
        lore: null,
        buttongroup: null,
        currentButton: null,
        focus: false,
        scrollMemory: {},
        init: function() {
            this.parent(281, 265);
            this.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
            this.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: -(this.hook.size.x / 2)
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.annotation = [];
            this.annotation[0] = {
                content: {
                    title: "sc.gui.menu.help.lore.titles.type",
                    description: "sc.gui.menu.help.lore.description.type"
                },
                offset: {
                    x: 4,
                    y: 3
                },
                size: {
                    x: 19,
                    y: 18
                },
                index: {
                    x: 0,
                    y: 0
                }
            };
            this.annotation[1] = {
                content: {
                    title: "sc.gui.menu.help.lore.titles.content",
                    description: "sc.gui.menu.help.lore.description.content"
                },
                offset: {
                    x: 4,
                    y: 23
                },
                size: {
                    x: 273,
                    y: 241
                },
                index: {
                    x: 0,
                    y: 1
                }
            };
            this.buttongroup = new sc.ButtonGroup;
            this.buttongroup.doButtonTraversal = this.onButtonTraversal.bind(this);
            this.title = new sc.TextGui("");
            this.title.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.title.setPos(0, 4);
            this.addChildGui(this.title);
            this.alternativeArrow = new ig.ImageGui(this.ninepatch.gfx,
                465, 338, 13, 10);
            this.alternativeArrow.setPos(10, 23);
            this.alternativeArrow.setPivot(13, 7);
            this.alternativeArrow.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        scaleX: 0.2,
                        scaleY: 0.5,
                        offsetY: 5
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.alternativeArrow.doStateTransition("HIDDEN", true);
            this.addChildGui(this.alternativeArrow);
            this.alternative = new sc.TextGui("", {
                font: sc.fontsystem.smallFont
            });
            this.alternative.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: 10
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.alternative.doStateTransition("HIDDEN", true);
            this.alternative.setPos(25, 25);
            this.addChildGui(this.alternative);
            this.category = new sc.TextGui("");
            this.category.setPos(7, 3);
            this.addChildGui(this.category);
            this.scrollContainer = new sc.ScrollPane(sc.ScrollType.Y_ONLY);
            this.scrollContainer.showBottomBar = false;
            this.scrollContainer.setSize(261, 221);
            this.scrollContainer.setPos(10, 40);
            this.addChildGui(this.scrollContainer);
            this.content = new ig.GuiElementBase;
            this.scrollContainer.setContent(this.content);
            this.setLore()
        },
        show: function() {
            this.focus = false;
            this.currentTileOffset = "default";
            this.doStateTransition("DEFAULT")
        },
        hide: function() {
            this.doStateTransition("HIDDEN")
        },
        setFocus: function(b) {
            if (b) {
                this.setLore(b.key);
                this.focus = true;
                this.currentTileOffset = "focus";
                this.currentButton = b;
                this.currentButton.setPressState(true);
                this.currentButton && this.currentButton.setPressed(true);
                sc.menu.buttonInteract.pushButtonGroup(this.buttongroup);
                sc.menu.pushBackCallback(this.onBackButtonPress.bind(this))
            } else this.clearFocus()
        },
        clearFocus: function() {
            if (this.focus) {
                this.focus = false;
                this.currentButton && this.currentButton.setPressState(false);
                this.currentButton = null;
                this.currentTileOffset = "default";
                sc.menu.popBackCallback();
                sc.menu.buttonInteract.removeButtonGroup(this.buttongroup);
                ig.input.mouseGuiActive && this.setLore(null)
            }
        },
        onButtonTraversal: function() {
            sc.control.menuBack() && this.buttongroup.invokeBackButton()
        },
        onBackButtonPress: function() {
            this.clearFocus()
        },
        update: function() {
            if (!ig.interact.isBlocked())
                if (this.focus && this.buttongroup.isActive()) {
                    sc.control.menuScrollUp() ? this.scrollContainer.scrollY(-20, false, 0.05) : sc.control.menuScrollDown() && this.scrollContainer.scrollY(20, false, 0.05);
                    sc.control.downDown() ? this.scrollContainer.scrollY(200 * ig.system.tick, false, 0.05) : sc.control.upDown() && this.scrollContainer.scrollY(-200 * ig.system.tick, false, 0.05)
                } else sc.control.loreDown() ? this.scrollContainer.scrollY(200 * ig.system.tick, false, 0.05) : sc.control.loreUp() &&
                    this.scrollContainer.scrollY(-200 * ig.system.tick, false, 0.05)
        },
        setCategory: function(b) {
            this.category.setText("\\i[lore-" + b + "]");
            b == "story" ? this.category.setPos(6, 3) : this.category.setPos(7, 3)
        },
        setLore: function(b) {
            if (!this.focus) {
                var a = this.key;
                this.lore = (this.key = b) ? sc.lore.getLore(b) : null;
                this.alternativeArrow.doStateTransition("HIDDEN", true);
                this.alternative.doStateTransition("HIDDEN", true);
                a && (this.scrollMemory[a] = this.scrollContainer.getScrollY());
                this.content.removeAllChildren();
                this.content.setSize(261,
                    0);
                this.scrollContainer.setPos(6, 25);
                this.scrollContainer.setSize(269, 238);
                if (this.lore)
                    if (ig.perf.fullLoreList || sc.lore.isLoreAvailable(b)) {
                        this.title.setText(ig.LangLabel.getText(this.lore.title));
                        if (this.lore.alternative) {
                            this.alternativeArrow.doStateTransition("DEFAULT");
                            this.alternative.setText(ig.lang.get("sc.gui.menu.lore.aka") + ig.LangLabel.getText(this.lore.alternative));
                            this.alternative.doStateTransition("DEFAULT");
                            this.scrollContainer.setPos(6, 40);
                            this.scrollContainer.setSize(269, 223)
                        }
                        this._createEntry(b)
                    } else this.title.setText(ig.lang.get("sc.gui.menu.lore.lockedEntry"));
                else this.title.setText(ig.lang.get("sc.gui.menu.lore.noLore"));
                this.scrollContainer.recalculateScrollBars(true);
                this.scrollContainer.setScrollY(this.scrollMemory[b] || 0, true)
            }
        },
        _createEntry: function(b) {
            var a = this.lore.content,
                d = null,
                c = 1,
                e = 0,
                f;
            for (f in a) {
                if (!ig.perf.fullLoreList && !sc.lore.isLoreEntryUnlocked(b, f)) break;
                (d = a[f]) && (c = this._addContent(d.content, d.image, d.hr, d.options, c, e, d.imageCond, d.altContent));
                e++
            }
            this.content.setSize(261, c)
        },
        _addContent: function(b, a, d, c, e, f, g, h) {
            if (!b) return e;
            var i = this.content,
                j = null,
                k = null,
                k = c ? sc.LORE_IMAGE_ALIGN[c.align] : 0,
                c = c ? c.wrap : false;
            if (d) {
                j = new ig.ColorGui("#545454", 266, 1);
                j.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
                j.setPos(0, e);
                i.addChildGui(j);
                e = e + 2
            }
            j = new ig.VarCondition;
            if (h) {
                j.setCondition(h.condition);
                j.evaluate() && (b = h.content)
            }
            j.setCondition(g || "true");
            if (a && j.evaluate()) {
                j = new ig.ImageGui(new ig.Image(a.src), a.offX, a.offY, a.width, a.height);
                j.setAlign(k + 4, ig.GUI_ALIGN.Y_TOP);
                j.setPos(0, e);
                i.addChildGui(j);
                g = 261 - j.hook.size.x -
                    2;
                a = 1;
                if (c) switch (k) {
                    case sc.LORE_IMAGE_ALIGN.LEFT:
                        a = j.hook.size.x + 4;
                        g = g - 2;
                        break;
                    case sc.LORE_IMAGE_ALIGN.CENTER:
                        g = 261;
                        c = false
                } else g = 259;
                c || (e = e + (j.hook.size.y + 2));
                k = new sc.TextGui(ig.LangLabel.getText(b), {
                    font: sc.fontsystem.smallFont,
                    maxWidth: g
                });
                k.setPos(a, e);
                i.addChildGui(k);
                e = c ? e + Math.max(j.hook.size.y, k.hook.size.y) + 2 : e + (k.hook.size.y + 2)
            } else {
                j = new sc.TextGui(ig.LangLabel.getText(b), {
                    font: sc.fontsystem.smallFont,
                    maxWidth: 261
                });
                j.setPos(1, e);
                i.addChildGui(j);
                e = e + (j.hook.size.y + 2)
            }
            if (ig.langEdit) {
                f =
                    "Lore: " + ig.LangLabel.getText(this.lore.title) + ", Paragraph: " + (f + 1);
                ig.langEdit.submitCustomFile(f, new ig.LangLabel(b), "data/database.json")
            }
            return e
        }
    });
    sc.LoreEntryButton = sc.ListBoxButton.extend({
        key: null,
        completion: null,
        overlay: null,
        init: function(b, a, d, c, e) {
            this.parent(b, 229 - (e ? 22 : 0), 31, void 0, void 0, this.isNoPercentType(d));
            this.key = a || null;
            this.blockedSound = null;
            b = a ? Math.round(sc.lore.getCompletionPercent(a) * 100) : 0;
            if (b >= 0) {
                this.completion = new sc.NumberGui(100, {
                    size: sc.NUMBER_SIZE.NORMAL
                });
                this.completion.setNumber(b,
                    true);
                this.completion.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
                this.completion.setPos(5, 7);
                this.addChildGui(this.completion)
            }
            if (c && sc.menu.hasNewUnlockKey(sc.MENU_SUBMENU.LORE, a)) {
                this.overlay = new sc.NewUnlockOverlay;
                this.overlay.setPos((this.isNoPercentType(d), 33), 3);
                this.overlay.activate();
                this.addChildGui(this.overlay)
            }
        },
        setPressState: function(b) {
            if (b) {
                this.keepPressed = this.pressed = true;
                this.button.setPressed(true);
                this.button.keepPressed = true
            } else {
                this.keepPressed = this.pressed = false;
                this.button.setPressed(false);
                this.button.keepPressed = false
            }
        },
        clearOverlay: function() {
            this.overlay && this.overlay.deactivate(true, true)
        },
        isNoPercentType: function(b) {
            return b == sc.LORE_CATERGORIES.STORY || b == sc.LORE_CATERGORIES.MEMORIES
        }
    })
});
ig.baked = !0;

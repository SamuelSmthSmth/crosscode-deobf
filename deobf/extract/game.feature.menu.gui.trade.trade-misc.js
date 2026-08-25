ig.module("game.feature.menu.gui.trade.trade-misc").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.trade.gui.trade-dialog", "game.feature.npc.gui.npc-display-gui").defines(function() {
    sc.TradeButtonBox = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        trader: null,
        buttongroup: null,
        buttonStartIndex: 0,
        buttons: [],
        character: null,
        traderName: null,
        location: null,
        init: function(b, a, d) {
            this.parent();
            this.setSize(431, 46);
            this.trader = b;
            this.buttongroup = a;
            this.buttonStartIndex = d || 0;
            a = sc.trade.getTrader(b);
            b = sc.trade.getFoundTrader(b);
            this.character = new sc.TradeCharacterView;
            this.character.setPos(2, 1);
            this.character.setCharacter(b.characterName);
            this.addChildGui(this.character);
            this.traderName = new sc.TextGui(ig.LangLabel.getText(a.name));
            this.traderName.setPos(36, 1);
            this.addChildGui(this.traderName);
            a = new ig.ImageGui(this.gfx,
                481, 224, 8, 11);
            a.setPos(37, 20);
            this.addChildGui(a);
            this.location = new sc.TextGui((b.area || "???") + " - " + (b.map || "???"), {
                font: sc.fontsystem.smallFont
            });
            this.location.setPos(50, 19);
            this.addChildGui(this.location)
        }
    });
    sc.TradeEntryButton = sc.TradeItem.extend({
        offer: 0,
        trader: null,
        init: function(b, a, d, c, e, f, g, h) {
            this.parent(b, c, e, f, g, true, h);
            this.offer = d || 0;
            this.trader = a || null
        }
    });
    sc.TradeCharacterView = ig.BoxGui.extend({
        ninepatch: new ig.NinePatch("media/gui/menu.png", {
            width: 2,
            height: 2,
            left: 5,
            top: 5,
            right: 5,
            bottom: 5,
            offsets: {
                "default": {
                    x: 488,
                    y: 16
                },
                square: {
                    x: 500,
                    y: 0
                },
                none: {
                    x: 400,
                    y: 0
                }
            }
        }),
        display: null,
        container: null,
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.1,
                timeFunction: KEY_SPLINES.EASE
            },
            HIDDEN: {
                state: {
                    alpha: 0
                },
                time: 0.1,
                timeFunction: KEY_SPLINES.EASE
            }
        },
        init: function() {
            this.parent(31, 42);
            this.container = new ig.GuiElementBase;
            this.container.hook.clip = true;
            this.container.setSize(31, 42);
            this.container.setPos(1, 1);
            this.addChildGui(this.container)
        },
        setCharacter: function(b, a) {
            if (b) {
                if (this.display) {
                    this.display.remove(true);
                    this.display = null
                }
                if (b) {
                    this.display = new sc.NPCDisplayGui(b, true, null, this.centerNPC.bind(this));
                    this.container.addChildGui(this.display);
                    this.doStateTransition("DEFAULT", true)
                }
            } else {
                if (this.display) {
                    a ? this.display.remove(true) : this.display.doStateTransition("HIDDEN", false, true);
                    this.display = null
                }
                this.doStateTransition("HIDDEN", true)
            }
        },
        centerNPC: function(b) {
            b.npc && b.setPos(this.container.hook.size.x / 2 - b.hook.size.x / 2 - 1, this.container.hook.size.y / 2 - b.hook.size.y / 2)
        }
    });
    sc.TradeDetailsView = ig.BoxGui.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN_SCALE: {
                state: {
                    alpha: 0,
                    scaleY: 0.5
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN_MOVE: {
                state: {
                    alpha: 0,
                    offsetX: 218
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        ninepatch: new ig.NinePatch("media/gui/menu.png", {
            width: 10,
            height: 11,
            left: 34,
            top: 44,
            right: 5,
            bottom: 3,
            offsets: {
                "default": {
                    x: 592,
                    y: 160
                }
            }
        }),
        sizeTransition: null,
        container: null,
        box: null,
        character: null,
        name: null,
        location: null,
        arrowRight: null,
        arrow: null,
        getGui: null,
        requireGui: null,
        moneyGui: null,
        _trader: null,
        init: function() {
            this.parent();
            this.setSize(228, 220);
            this.setPos(66, 67);
            this.setPivot(0, 110);
            this.annotation = [];
            this.annotation[0] = {
                content: {
                    title: "sc.gui.menu.help.trader.titles.info",
                    description: "sc.gui.menu.help.trader.description.info"
                },
                offset: {
                    x: 1,
                    y: 1
                },
                size: {
                    x: 227,
                    y: 45
                },
                index: {
                    x: 0,
                    y: 0
                }
            };
            this.annotation[1] = {
                content: {
                    title: "sc.gui.menu.help.trader.titles.content",
                    description: "sc.gui.menu.help.trader.description.content"
                },
                offset: {
                    x: 1,
                    y: 52
                },
                size: {
                    x: 227,
                    y: 118
                },
                index: {
                    x: 0,
                    y: 1
                }
            };
            this.annotation[2] = {
                content: {
                    title: "sc.gui.menu.help.trader.titles.money",
                    description: "sc.gui.menu.help.trader.description.money"
                },
                offset: {
                    x: 1,
                    y: 180
                },
                size: {
                    x: 227,
                    y: 39
                },
                index: {
                    x: 0,
                    y: 2
                }
            };
            this.character = new sc.TradeCharacterView;
            this.character.currentTileOffset = "square";
            this.character.setPos(3, 2);
            this.addChildGui(this.character);
            this.arrowRight = new ig.ImageGui(this.ninepatch.gfx, 576, 184, 9, 15);
            this.arrowRight.setPos(229, 0);
            this.name = new sc.TextGui("");
            this.name.setPos(37,
                2);
            this.addChildGui(this.name);
            var b = new ig.ImageGui(this.ninepatch.gfx, 481, 224, 8, 11);
            b.setPos(38, 21);
            this.addChildGui(b);
            this.location = new sc.TextGui("", {
                font: sc.fontsystem.smallFont
            });
            this.location.setPos(51, 20);
            this.addChildGui(this.location);
            this.container = new ig.GuiElementBase;
            this.container.setPos(2, 44);
            this.container.setSize(225, 174);
            this.addChildGui(this.container);
            b = new ig.ColorGui("#7e7e7e", 224, 1);
            this.container.addChildGui(b);
            b = new sc.TextGui(ig.lang.get("sc.gui.trade.trade"), {
                font: sc.fontsystem.tinyFont
            });
            b.setPos(8, 2);
            this.container.addChildGui(b);
            b = new sc.TextGui(ig.lang.get("sc.gui.trade.owned"), {
                font: sc.fontsystem.tinyFont
            });
            b.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            b.setPos(25, 2);
            this.container.addChildGui(b);
            this.getGui = new sc.TradeItemBox(null, null, null, 200);
            this.getGui.dividerColor = "#7e7e7e";
            this.getGui.setPos(1, 9);
            this.container.addChildGui(this.getGui);
            this.forText = new sc.TextGui(ig.lang.get("sc.gui.trade.for"), {
                font: sc.fontsystem.tinyFont
            });
            this.forText.setPos(32, 9);
            this.container.addChildGui(this.forText);
            this.ownedText = new sc.TextGui(ig.lang.get("sc.gui.trade.owned"), {
                font: sc.fontsystem.tinyFont
            });
            this.ownedText.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.ownedText.setPos(4, 9);
            this.container.addChildGui(this.ownedText);
            this.requireGui = new sc.TradeItemBox(null, null, null, 200);
            this.requireGui.dividerColor = "#7e7e7e";
            this.requireGui.setPos(24, 9);
            this.container.addChildGui(this.requireGui);
            this.arrow = new ig.ImageGui(this.ninepatch.gfx, 432, 256, 16, 17);
            this.arrow.setPos(5, 36);
            this.arrow.setPivot(16,
                17);
            this.arrow.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE
                },
                HIDDEN: {
                    state: {
                        scaleX: 0.2,
                        scaleY: 0.5,
                        offsetY: 5
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.container.addChildGui(this.arrow);
            this.moneyGui = new sc.TradeMoneyGui(null, null, null, false);
            this.moneyGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.moneyGui.dividerColor = "#7e7e7e";
            this.moneyGui.setPos(1, 0);
            this.container.addChildGui(this.moneyGui);
            this.doStateTransition("HIDDEN", true)
        },
        setTraderData: function(b,
            a, d) {
            var c = sc.trade.getTrader(b),
                e = sc.trade.getFoundTrader(b);
            if (this._trader != b) {
                this.character.setCharacter(e.characterName, true);
                this.name.setText(ig.LangLabel.getText(c.name));
                this.location.setText((e.area || "???") + " - " + (e.map || "???"));
                this._trader = b
            }
            this.arrowRight.hook.pos.y = d + 3;
            b = c.options[a];
            a = b.get;
            d = 9 + (this.getGui.setContent(a, null, null, true) + 10);
            this.forText.setPos(32, d - 7);
            this.ownedText.setPos(4, d - 7);
            this.arrow.setPos(5, 36 + (a.length - 1) * 20);
            a = b.require;
            this.requireGui.setPos(24, d);
            this.requireGui.setContent(a);
            this.moneyGui.setContent(b.get, b.scale, b.cost, 0)
        },
        reset: function() {
            this.doStateTransition("HIDDEN", true);
            this._trader = null
        },
        show: function(b, a, d) {
            this.doStateTransition("HIDDEN_SCALE", true);
            this.doStateTransition("DEFAULT");
            this.setTraderData(b, a, d)
        },
        hide: function(b) {
            this._trader = null;
            sc.menu.tradeToggle ? this.doStateTransition("HIDDEN_MOVE") : this.doStateTransition(b ? "HIDDEN_SCALE" : "HIDDEN")
        }
    })
});
ig.baked = !0;

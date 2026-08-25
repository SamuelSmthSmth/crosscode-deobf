ig.module("game.feature.menu.gui.botanics.botanics-misc").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.menu-misc").defines(function() {
    sc.BotanicsEntryButton = sc.ListBoxButton.extend({
        helperGfx: new ig.Image("media/gui/menu.png"),
        percent: null,
        plant: null,
        init: function(b, a, d, c, e) {
            this.parent(b, 142, 54, d, c);
            this.plant = a;
            this.blockedSound = null;
            this.button.submitSound = null;
            this.percent = new ig.ImageGui(this.helperGfx, 0, 407, 8, 8);
            this.percent.setAlign(ig.GUI_ALIGN.X_RIGHT,
                ig.GUI_ALIGN.Y_TOP);
            this.percent.setPos(7, 7);
            this.addChildGui(this.percent);
            this.chance = new sc.NumberGui(100);
            this.chance.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.chance.setPos(16, 7);
            this.addChildGui(this.chance);
            this.chance.setNumber(Math.round(e * 100))
        }
    });
    sc.BotanicsPreUnlockButton = ig.FocusGui.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        ninepatch: new ig.NinePatch("media/gui/buttons.png", {
            width: 28,
            height: 0,
            left: 8,
            top: 40,
            right: 8,
            bottom: 0,
            offsets: {
                "default": {
                    x: 0,
                    y: 114
                },
                focus: {
                    x: 45,
                    y: 114
                }
            }
        }),
        overlayNinepatch: new ig.NinePatch("media/gui/buttons.png", {
            width: 29,
            height: 0,
            left: 6,
            top: 37,
            right: 5,
            bottom: 0,
            offsets: {
                "default": {
                    x: 171,
                    y: 51
                },
                focus: {
                    x: 214,
                    y: 51
                }
            }
        }),
        plant: null,
        text: null,
        collect: null,
        bar: null,
        init: function(b, a, d) {
            this.parent();
            this.setSize(196, 39);
            this.plant = b;
            this.text = new sc.TextGui(ig.lang.get("sc.gui.botanics.infoLocked"));
            this.text.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.text.setPos(0, 2);
            this.addChildGui(this.text);
            b = ig.lang.get("sc.gui.botanics.collect");
            b = b.replace("[[x]]", "" + a).replace("[[y]]", "" + d);
            this.collect = new sc.TextGui(b, {
                font: sc.fontsystem.smallFont
            });
            this.collect.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.collect.setPos(0, 18);
            this.addChildGui(this.collect);
            this.bar = new sc.BotanicsProgressBar((a / d).limit(0, 1));
            this.bar.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.bar.setPos(4, 3);
            this.addChildGui(this.bar)
        },
        updateDrawables: function(b) {
            this.ninepatch.draw(b, this.hook.size.x, this.hook.size.y, this.focus ? "focus" : "default");
            this.overlayNinepatch.draw(b, this.hook.size.x - 4, this.hook.size.y - 2, this.focus ? "focus" : "default", 2, 1)
        }
    });
    sc.BotanicsProgressBar = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/status-gui.png"),
        backgroundPatch: new ig.NinePatch("media/gui/menu.png", {
            width: 2,
            height: 0,
            left: 3,
            top: 3,
            right: 3,
            bottom: 0,
            offsets: {
                "default": {
                    x: 16,
                    y: 416
                }
            }
        }),
        ratio: 0,
        init: function(b) {
            this.parent();
            this.setSize(188, 3);
            this.ratio = Math.round(b * 186)
        },
        updateDrawables: function(b) {
            this.backgroundPatch.draw(b, this.hook.size.x, this.hook.size.y,
                "default");
            b.addColor("#25b000", 2, 0, this.ratio, 1);
            b.addColor("#25b000", 1, 1, this.ratio, 1);
            b.addColor("#25b000", 0, 2, this.ratio, 1)
        }
    });
    sc.BotanicsButtonBox = ig.GuiElementBase.extend({
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
        plant: null,
        buttongroup: null,
        buttonStartIndex: 0,
        buttons: [],
        plantView: null,
        plantName: null,
        location: null,
        init: function(b, a, d, c, e) {
            this.parent();
            this.setSize(431,
                46);
            this.plant = b;
            this.buttongroup = c;
            this.buttonStartIndex = e || 0;
            c = sc.menu.drops[b];
            this.plantView = new sc.BotanicsPlantView;
            this.plantView.setPos(2, 1);
            this.plantView.setPlant(b);
            this.addChildGui(this.plantView);
            this.plantName = new sc.TextGui(ig.LangLabel.getText(c.name));
            this.plantName.setPos(37, 1);
            this.addChildGui(this.plantName);
            b = (a / (d || 50)).limit(0, 1);
            e = new ig.ImageGui(this.gfx, 481, 224, 8, 11);
            e.setPos(38, 20);
            this.addChildGui(e);
            e = "";
            if (b >= 0.5) {
                e = ig.LangLabel.getText(c.subArea);
                e == "MISSING LABEL" &&
                    (e = "???")
            } else {
                e = ig.lang.get("sc.gui.botanics.locText");
                e = e.replace("[[x]]", "\\c[3]" + (Math.ceil(d / 2) - a) + "\\c[0]")
            }
            this.location = new sc.TextGui(e, {
                font: sc.fontsystem.smallFont,
                linePadding: -1,
                maxWidth: 184
            });
            this.location.setPos(51, 19);
            this.addChildGui(this.location)
        }
    });
    sc.BotanicsPlantView = ig.BoxGui.extend({
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
            this.parent(32, 42);
            this.container = new ig.GuiElementBase;
            this.container.hook.clip = true;
            this.container.setSize(32, 42);
            this.container.setPos(1, 1);
            this.addChildGui(this.container)
        },
        setPlant: function(b, a) {
            if (b) {
                if (this.display) {
                    this.display.remove(true);
                    this.display = null
                }
                if (b) {
                    this.display = new sc.ItemDestructDisplayGui(b, sc.menu.dropCounts[b].anim, true,
                        this.centerEntity.bind(this));
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
        centerEntity: function(b) {
            b.entity && b.setPos(this.container.hook.size.x / 2 - b.hook.size.x / 2 - 1, this.container.hook.size.y / 2 - b.hook.size.y / 2 - 2)
        }
    });
    sc.ItemDestructDisplayGui = ig.GuiElementBase.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            HIDDEN: {
                state: {
                    alpha: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_IN
            }
        },
        config: null,
        destructType: null,
        gameState: null,
        size: {
            x: 0,
            y: 0
        },
        entity: null,
        callback: null,
        animSheet: null,
        init: function(b, a, d, c) {
            this.parent();
            this.callback = c;
            this.config = b;
            this.destructType = a;
            this.doStateTransition("HIDDEN", true);
            this.onLoadableComplete(true, this.config)
        },
        onDetach: function() {
            this.animSheet && this.animSheet.decreaseRef();
            this.animSheet = null;
            this.gameState && this.gameState.clear();
            this.gameState =
                null
        },
        onLoadableComplete: function(b, a) {
            if (this.config)
                if (a == this.config) {
                    var d = sc.ITEM_DESTRUCT_TYPE[this.destructType];
                    Vec3.assign(this.size, d.size || {
                        x: 12,
                        y: 12,
                        z: 28
                    });
                    this.setSize(this.size.x, this.size.y + this.size.z);
                    this.setPivot(this.hook.size.x / 2, this.hook.size.y / 2);
                    this.animSheet = new ig.AnimationSheet(d.anims);
                    this.animSheet.addLoadListener(this)
                } else if (a == this.animSheet) {
                this.initGameState();
                this.doStateTransition("DEFAULT", this.skipIfLoaded)
            }
        },
        initGameState: function() {
            this.gameState = new ig.GameState;
            this.gameState.initEmpty(this.hook.size.x, this.hook.size.y);
            ig.game.pushState(this.gameState);
            this.entity = ig.game.spawnEntity(ig.ENTITY.ItemDestruct, 0, this.size.z, 0, {
                __GLOBAL__: this.config
            });
            this.entity.setSize(this.size.x, this.size.y, this.size.z);
            this.entity.animSheet = this.animSheet;
            this.entity.initAnimations();
            this.entity.setCurrentAnim("default");
            this.callback && this.callback(this);
            ig.game.popState()
        },
        update: function() {
            this.gameState && this.gameState.forceUpdate()
        },
        updateDrawables: function(b) {
            this.gameState &&
                b.addGameStateDraw(this.gameState, 0, 0)
        }
    })
});
ig.baked = !0;

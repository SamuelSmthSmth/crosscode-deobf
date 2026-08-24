/**
 * game.feature.menu.gui.botanics.botanics-misc
 * ============================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.botanics.botanics-misc")`.
 *
 * Botanics list widgets:
 *  - `sc.BotanicsEntryButton`: an unlocked plant drop entry (name + drop
 *    chance).
 *  - `sc.BotanicsPreUnlockButton`: the locked plant row (info text,
 *    "collect x of y" and a progress bar).
 *  - `sc.BotanicsProgressBar`: the small green progress bar.
 *  - `sc.BotanicsButtonBox`: the plant header row (plant icon, name,
 *    location hint or remaining-to-collect text).
 *  - `sc.BotanicsPlantView` + `sc.ItemDestructDisplayGui`: the live plant
 *    preview that spawns an `ig.ENTITY.ItemDestruct` in a mini game state.
 */
ig.module("game.feature.menu.gui.botanics.botanics-misc")
    .requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.menu-misc")
    .defines(function () {

    sc.BotanicsEntryButton = sc.ListBoxButton.extend({
        helperGfx: new ig.Image("media/gui/menu.png"),
        percent: null,
        plant: null,

        init: function (label, plant, id, description, probability) {
            this.parent(label, 142, 54, id, description);
            this.plant = plant;
            this.blockedSound = null;
            this.button.submitSound = null;
            this.percent = new ig.ImageGui(this.helperGfx, 0, 407, 8, 8);
            this.percent.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.percent.setPos(7, 7);
            this.addChildGui(this.percent);
            this.chance = new sc.NumberGui(100);
            this.chance.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.chance.setPos(16, 7);
            this.addChildGui(this.chance);
            this.chance.setNumber(Math.round(probability * 100))
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

        init: function (plant, collected, needed) {
            this.parent();
            this.setSize(196, 39);
            this.plant = plant;
            this.text = new sc.TextGui(ig.lang.get("sc.gui.botanics.infoLocked"));
            this.text.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.text.setPos(0, 2);
            this.addChildGui(this.text);
            var collectText = ig.lang.get("sc.gui.botanics.collect");
            collectText = collectText.replace("[[x]]", "" + collected).replace("[[y]]", "" + needed);
            this.collect = new sc.TextGui(collectText, {
                font: sc.fontsystem.smallFont
            });
            this.collect.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.collect.setPos(0, 18);
            this.addChildGui(this.collect);
            this.bar = new sc.BotanicsProgressBar((collected / needed).limit(0, 1));
            this.bar.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_BOTTOM);
            this.bar.setPos(4, 3);
            this.addChildGui(this.bar)
        },

        updateDrawables: function (renderer) {
            this.ninepatch.draw(renderer, this.hook.size.x, this.hook.size.y, this.focus ? "focus" : "default");
            this.overlayNinepatch.draw(renderer, this.hook.size.x - 4, this.hook.size.y - 2, this.focus ? "focus" : "default", 2, 1)
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

        init: function (ratio) {
            this.parent();
            this.setSize(188, 3);
            this.ratio = Math.round(ratio * 186)
        },

        updateDrawables: function (renderer) {
            this.backgroundPatch.draw(renderer, this.hook.size.x, this.hook.size.y, "default");
            renderer.addColor("#25b000", 2, 0, this.ratio, 1);
            renderer.addColor("#25b000", 1, 1, this.ratio, 1);
            renderer.addColor("#25b000", 0, 2, this.ratio, 1)
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

        init: function (plant, collected, needed, buttongroup, buttonStartIndex) {
            this.parent();
            this.setSize(431, 46);
            this.plant = plant;
            this.buttongroup = buttongroup;
            this.buttonStartIndex = buttonStartIndex || 0;
            var drop = sc.menu.drops[plant];
            this.plantView = new sc.BotanicsPlantView;
            this.plantView.setPos(2, 1);
            this.plantView.setPlant(plant);
            this.addChildGui(this.plantView);
            this.plantName = new sc.TextGui(ig.LangLabel.getText(drop.name));
            this.plantName.setPos(37, 1);
            this.addChildGui(this.plantName);
            var ratio = (collected / (needed || 50)).limit(0, 1);
            var arrow = new ig.ImageGui(this.gfx, 481, 224, 8, 11);
            arrow.setPos(38, 20);
            this.addChildGui(arrow);
            var locationText = "";
            if (ratio >= 0.5) {
                locationText = ig.LangLabel.getText(drop.subArea);
                locationText == "MISSING LABEL" && (locationText = "???")
            } else {
                locationText = ig.lang.get("sc.gui.botanics.locText");
                locationText = locationText.replace("[[x]]", "\\c[3]" + (Math.ceil(needed / 2) - collected) + "\\c[0]")
            }
            this.location = new sc.TextGui(locationText, {
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

        init: function () {
            this.parent(32, 42);
            this.container = new ig.GuiElementBase;
            this.container.hook.clip = true;
            this.container.setSize(32, 42);
            this.container.setPos(1, 1);
            this.addChildGui(this.container)
        },

        setPlant: function (plant, immediate) {
            if (plant) {
                if (this.display) {
                    this.display.remove(true);
                    this.display = null
                }
                if (plant) {
                    this.display = new sc.ItemDestructDisplayGui(plant, sc.menu.dropCounts[plant].anim, true, this.centerEntity.bind(this));
                    this.container.addChildGui(this.display);
                    this.doStateTransition("DEFAULT", true)
                }
            } else {
                if (this.display) {
                    immediate ? this.display.remove(true) : this.display.doStateTransition("HIDDEN", false, true);
                    this.display = null
                }
                this.doStateTransition("HIDDEN", true)
            }
        },

        centerEntity: function (display) {
            display.entity && display.setPos(this.container.hook.size.x / 2 - display.hook.size.x / 2 - 1, this.container.hook.size.y / 2 - display.hook.size.y / 2 - 2)
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

        init: function (config, destructType, skipIfLoaded, callback) {
            this.parent();
            this.callback = callback;
            this.config = config;
            this.destructType = destructType;
            this.skipIfLoaded = skipIfLoaded;
            this.doStateTransition("HIDDEN", true);
            this.onLoadableComplete(true, this.config)
        },

        onDetach: function () {
            this.animSheet && this.animSheet.decreaseRef();
            this.animSheet = null;
            this.gameState && this.gameState.clear();
            this.gameState = null
        },

        onLoadableComplete: function (skip, loadable) {
            if (this.config)
                if (loadable == this.config) {
                    var config = sc.ITEM_DESTRUCT_TYPE[this.destructType];
                    Vec3.assign(this.size, config.size || {
                        x: 12,
                        y: 12,
                        z: 28
                    });
                    this.setSize(this.size.x, this.size.y + this.size.z);
                    this.setPivot(this.hook.size.x / 2, this.hook.size.y / 2);
                    this.animSheet = new ig.AnimationSheet(config.anims);
                    this.animSheet.addLoadListener(this)
                } else if (loadable == this.animSheet) {
                this.initGameState();
                this.doStateTransition("DEFAULT", this.skipIfLoaded)
            }
        },

        initGameState: function () {
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

        update: function () {
            this.gameState && this.gameState.forceUpdate()
        },

        updateDrawables: function (renderer) {
            this.gameState && renderer.addGameStateDraw(this.gameState, 0, 0)
        }
    })
});
ig.baked = !0;

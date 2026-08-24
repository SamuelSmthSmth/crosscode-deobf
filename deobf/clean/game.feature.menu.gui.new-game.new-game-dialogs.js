/**
 * game.feature.menu.gui.new-game.new-game-dialogs
 * ===============================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.new-game.new-game-dialogs")`.
 *
 * `sc.NewGameModeSelectDialog`: the full-screen new-game mode chooser
 * (normal vs New Game+), with preview images, a description line and
 * back handling. `sc.NewGameModeDialogButton`: one mode button with its
 * frame and preview image.
 */
ig.module("game.feature.menu.gui.new-game.new-game-dialogs")
    .requires("impact.base.image", "impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.gui.base.box", "impact.feature.interact.gui.focus-gui", "game.feature.menu.gui.menu-misc")
    .defines(function () {

    sc.NewGameModeSelectDialog = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        transitions: {
            DEFAULT: {
                state: {
                    alpha: 1
                },
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
        msgBox: null,
        normal: null,
        plus: null,
        header: null,
        content: null,
        info: null,
        buttons: [],
        buttonInteract: null,
        buttongroup: null,
        callback: null,

        init: function (callback) {
            this.parent();
            this.hook.zIndex = 9999999;
            this.hook.localAlpha = 0.8;
            this.hook.temporary = true;
            this.hook.pauseGui = true;
            this.hook.size.x = ig.system.width;
            this.hook.size.y = ig.system.height;
            this.callback = callback || null;
            this.buttonInteract = new ig.ButtonInteractEntry;
            this.buttongroup = new sc.ButtonGroup;
            this.buttonInteract.pushButtonGroup(this.buttongroup);
            this.buttongroup.addPressCallback(function (button) {
                this.hide();
                this.callback && button.data != void 0 && this.callback(button, this)
            }.bind(this));
            this.buttongroup.addSelectionCallback(function (button) {
                if (button.data != void 0)
                    if (button.data == 0) {
                        this.info.doStateTransition("DEFAULT", true);
                        this.info.setText(ig.lang.get("sc.gui.menu.new-game.dialogs.normalDescription"))
                    } else if (button.data == 1) {
                    this.info.doStateTransition("DEFAULT", true);
                    this.info.setText(ig.lang.get("sc.gui.menu.new-game.dialogs.plusDescription"))
                }
            }.bind(this));
            this.buttongroup.setMouseFocusLostCallback(function () {
                this.info.doStateTransition("HIDDEN", false, false, null, 0.5)
            }.bind(this));
            this.back = new sc.ButtonGui("", sc.BUTTON_DEFAULT_WIDTH);
            this.back.data = -1;
            this.back.submitSound = sc.BUTTON_SOUND.back;
            this.back.onButtonPress = function () {
                this.hide();
                this.callback && this.callback(this.back)
            }.bind(this);
            this.buttonInteract.addGlobalButton(this.back, this.onBackButtonCheck.bind(this));
            this.content = new ig.GuiElementBase;
            this.content.setSize(300, 200);
            var y = 0;
            this.header = new sc.TextGui(ig.lang.get("sc.gui.menu.new-game.dialogs.modeSelect"), {
                maxWidth: 300
            });
            this.header.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.content.addChildGui(this.header);
            var y = y + 17,
                line = new sc.LineGui(300);
            line.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            line.setPos(0, y);
            this.content.addChildGui(line);
            y = y + 10;
            this.normal = new sc.NewGameModeDialogButton(ig.lang.get("sc.gui.menu.new-game.dialogs.normal"), 0);
            this.normal.setPos(10, y);
            this.content.addChildGui(this.normal);
            this.buttongroup.addFocusGui(this.normal, 0, 0);
            this.plus = new sc.NewGameModeDialogButton(ig.lang.get("sc.gui.menu.new-game.dialogs.plus"), 1);
            this.plus.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.plus.setPos(10, y);
            this.content.addChildGui(this.plus);
            this.buttongroup.addFocusGui(this.plus, 1, 0);
            y = y + (this.normal.hook.size.y + 7);
            line = new sc.LineGui(300);
            line.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            line.setPos(0, y);
            this.content.addChildGui(line);
            y = y + 4;
            this.info = new sc.TextGui("", {
                maxWidth: 294,
                textAlign: ig.Font.ALIGN.CENTER
            });
            this.info.hook.transitions = {
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
            };
            this.info.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.info.setPos(0, y);
            this.content.addChildGui(this.info);
            this.content.hook.size.y = y + 36;
            this.msgBox = new sc.CenterBoxGui(this.content);
            this.msgBox.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.addChildGui(this.msgBox);
            this.doStateTransition("HIDDEN", true)
        },

        updateDrawables: function (renderer) {
            renderer.addColor("#000", 0, 0, this.hook.size.x, this.hook.size.y)
        },

        show: function () {
            ig.interact.addEntry(this.buttonInteract);
            ig.interact.setBlockDelay(0.2);
            this.msgBox.doStateTransition("DEFAULT");
            this.doStateTransition("DEFAULT");
            this.buttons.length > 1 && sc.model.addChoiceGui(this)
        },

        hide: function () {
            ig.interact.removeEntry(this.buttonInteract);
            ig.interact.setBlockDelay(0.2);
            this.msgBox.doStateTransition("HIDDEN");
            this.doStateTransition("HIDDEN", false, true);
            sc.model.removeChoiceGui(this)
        },

        onBackButtonCheck: function () {
            return sc.control.menuBack()
        }
    });

    sc.NewGameModeDialogButton = sc.ButtonGui.extend({
        framePatch: new ig.NinePatch("media/gui/menu.png", {
            width: 8,
            height: 8,
            left: 4,
            top: 4,
            right: 4,
            bottom: 4,
            offsets: {
                "default": {
                    x: 440,
                    y: 200
                }
            }
        }),
        gfx: new ig.Image("media/gui/new-game.png"),
        frame: null,
        image: null,

        init: function (label, mode) {
            this.parent(label, 121, true, sc.BUTTON_TYPE.START);
            this.setData(mode);
            this.setWidth(121);
            this.textChild.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            this.textChild.setPos(0, 1);
            this.frame = new ig.BoxGui(114, 94, false, this.framePatch);
            this.frame.setPos(3, 17);
            this.addChildGui(this.frame);
            this.image = new ig.ImageGui(this.gfx, mode * 110, 0, 110, 90);
            this.image.setPos(5, 19);
            this.addChildGui(this.image)
        }
    })
});
ig.baked = !0;

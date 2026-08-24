ig.module("game.feature.version.gui.dlc-gui").requires("impact.base.image", "impact.base.event", "impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "impact.feature.interact.button-interact", "game.feature.control.control", "game.feature.gui.base.button", "game.feature.gui.base.boxes", "game.feature.gui.base.numbers", "game.feature.menu.gui.menu-misc").defines(function() {
    sc.DLCScrollContainer = ig.GuiElementBase.extend({
        scrollPane: null,
        content: null,
        init: function() {
            this.parent();
            this.content = new ig.GuiElementBase;
            this.scrollPane = new sc.ScrollPane(sc.ScrollType.Y_ONLY);
            this.scrollPane.setContent(this.content);
            this.scrollPane.showTopBar = false;
            this.scrollPane.showBottomBar = false;
            this.addChildGui(this.scrollPane)
        },
        setElement: function(element) {
            this.content.removeAllChildren();
            this.content.hook.size.y = 0;
            this.scrollPane.box.doScrollTransition(0, 0, 0);
            this.scrollPane.recalculateScrollBars(true);
            this.content.addChildGui(element);
            this._updateContentHeight()
        },
        scroll: function(amount, time) {
            this.scrollPane.scrollY(amount, time, 0.05)
        },
        getScrollY: function() {
            return this.scrollPane.getScrollY()
        },
        clear: function() {
            this.content.removeAllChildren();
            this.content.hook.size.y = 0;
            this.scrollPane.box.doScrollTransition(0, 0, 0);
            this.scrollPane.recalculateScrollBars(true)
        },
        setSize: function(width, height) {
            this.parent(width, height);
            this.scrollPane.setSize(width, height)
        },
        _updateContentHeight: function() {
            var children = this.content.hook.children,
                children = children[children.length - 1];
            this.content.hook.size.y = children.pos.y + children.size.y;
            this.scrollPane.recalculateScrollBars()
        }
    });
    sc.DLCGui = ig.GuiElementBase.extend({
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
                time: 0.3,
                timeFunction: KEY_SPLINES.EASE_IN
            }
        },
        msgBox: null,
        content: null,
        back: null,
        browseLeft: null,
        browserRight: null,
        scrollContainer: null,
        header: null,
        compiledButton: null,
        buttonInteract: null,
        buttonGroup: null,
        compiledMode: false,
        compileList: [],
        compileEntry: null,
        logs: [],
        currentIndex: null,
        init: function() {
            this.parent();
            this.hook.localAlpha = 0.8;
            this.hook.size.x = ig.system.width;
            this.hook.size.y = ig.system.height;
            this.buttonInteract = new ig.ButtonInteractEntry;
            this.buttonGroup = new sc.ButtonGroup(false,
                ig.BUTTON_GROUP_SELECT_TYPE.HORIZONTAL);
            this.buttonInteract.pushButtonGroup(this.buttonGroup);
            this.content = new ig.GuiElementBase;
            this.content.setSize(300, 240);
            this.createContent();
            this.msgBox = new sc.CenterBoxGui(this.content);
            this.msgBox.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.msgBox.setPos(0, -10);
            this.addChildGui(this.msgBox);
            this.back = new sc.ButtonGui("\\i[back]" + ig.lang.get("sc.gui.dlc-list.back"), sc.BUTTON_DEFAULT_WIDTH);
            this.back.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.back.setPos(0, 122 + this.back.hook.size.y - 10);
            this.back.submitSound = sc.BUTTON_SOUND.back;
            this.back.onButtonPress = function() {
                this.hide()
            }.bind(this);
            this.addChildGui(this.back);
            this.buttonInteract.addGlobalButton(this.back, this.onBackButtonCheck.bind(this));
            this.doStateTransition("HIDDEN", true)
        },
        show: function() {
            ig.interact.addEntry(this.buttonInteract);
            ig.interact.setBlockDelay(0.2);
            this.createDLCList();
            this.doStateTransition("DEFAULT")
        },
        hide: function() {
            ig.interact.removeEntry(this.buttonInteract);
            ig.interact.setBlockDelay(0.2);
            this.doStateTransition("HIDDEN")
        },
        clearLogs: function() {
            this.compileEntry = null;
            this.scrollContainer.clear()
        },
        update: function() {
            if (!ig.interact.isBlocked()) {
                sc.control.menuScrollUp() ? this.scrollContainer.scroll(-20) : sc.control.menuScrollDown() && this.scrollContainer.scroll(20);
                sc.control.downDown() ? this.scrollContainer.scroll(200 * ig.system.tick) : sc.control.upDown() && this.scrollContainer.scroll(-200 * ig.system.tick)
            }
        },
        updateDrawables: function(drawables) {
            drawables.addColor("#000", 0, 0, this.hook.size.x,
                this.hook.size.y)
        },
        onBackButtonCheck: function() {
            return sc.control.menuBack()
        },
        createDLCList: function() {
            var extensions = ig.extensions.getExtensionList(),
                container = new ig.GuiElementBase;
            container.hook.size.x = 296;
            for (var offsetY = 0, i = 0; i < extensions.length; ++i) {
                i > 0 && (offsetY = offsetY + 8);
                var extension = ig.extensions.getExtension(extensions[i]),
                    offsetY = this.createHeaderEntry(container, offsetY, extension.name, sc.FONT_COLORS.GREEN),
                    offsetY = this.createTextEntry(container, offsetY, extension.description, true)
            }
            container.hook.size.y = offsetY;
            this.scrollContainer.setElement(container)
        },
        createHeaderEntry: function(container, offsetY, text, color, centered) {
            text = new sc.TextGui("\\c[" + color + "]" + text + "\\c[0]");
            centered && text.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            centered = new ig.ColorGui("#7E7E7E", 296, 1);
            text.setPos(2, offsetY);
            offsetY = offsetY + (text.hook.size.y + 2 - 2);
            centered.setPos(0, offsetY);
            offsetY = offsetY + 3;
            container.addChildGui(text);
            container.addChildGui(centered);
            return offsetY
        },
        createTextEntry: function(container, offsetY, text) {
            text = new sc.TextGui("\\c[0]" + text + "\\c[0]", {
                maxWidth: 280
            });
            text.setPos(15, offsetY);
            container.addChildGui(text);
            return offsetY = offsetY + text.hook.size.y
        },
        createContent: function() {
            var offsetY = 2;
            this.logs = sc.version.changelog;
            this.header = new sc.TextGui(ig.lang.get("sc.gui.dlc-list.title"));
            this.header.setAlign(ig.GUI_ALIGN.X_CENTER,
                ig.GUI_ALIGN.Y_TOP);
            this.header.setPos(0, offsetY);
            this.content.addChildGui(this.header);
            var offsetY = offsetY + (this.header.hook.size.y + 2),
                line = new sc.LineGui(300);
            line.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            line.setPos(0, offsetY);
            this.content.addChildGui(line);
            offsetY = offsetY + 1;
            this.scrollContainer = new sc.DLCScrollContainer;
            this.scrollContainer.setPos(0, offsetY);
            this.scrollContainer.setSize(301, 202);
            offsetY = offsetY + this.scrollContainer.hook.size.y;
            line = new sc.LineGui(300);
            line.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
            line.setPos(0, offsetY);
            this.content.addChildGui(line);
            this.content.addChildGui(this.scrollContainer)
        }
    })
});
ig.baked = !0;

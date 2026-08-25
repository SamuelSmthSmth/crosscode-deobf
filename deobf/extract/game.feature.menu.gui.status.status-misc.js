ig.module("game.feature.menu.gui.status.status-misc").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.menu-misc").defines(function() {
    var b = ["#8bb5ff", "#ba0000", "#0036d0", "#a121bc", "#00994c", "#c7c7c7"];
    sc.StatusPageSwitch = ig.GuiElementBase.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    offsetX: -195,
                    alpha: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        left: null,
        right: null,
        text: null,
        init: function() {
            this.parent();
            this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.setSize(170, 21);
            this.setPos(25, 27);
            this.hook.localAlpha = 0.5;
            this.text = new sc.TextGui("NONE");
            this.text.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.addChildGui(this.text);
            this.annotation = {
                type: "INFO",
                content: {
                    title: "sc.gui.menu.help.status.titles.page",
                    description: "sc.gui.menu.help.status.description.page"
                },
                offset: {
                    x: 38,
                    y: 0
                },
                size: {
                    x: 94,
                    y: 21,
                    offX: 6
                }
            };
            this.left = new sc.ButtonGui("\\i[arrow-left]", 34, true, sc.BUTTON_TYPE.SMALL);
            this.left.submitSound = null;
            this.left.keepMouseFocus = true;
            this.left.setPos(0, 0);
            this.left.onButtonPress = function() {
                this.updateStatusPage(-1)
            }.bind(this);
            this.addChildGui(this.left);
            this.right = new sc.ButtonGui("\\i[arrow-right]", 34, true, sc.BUTTON_TYPE.SMALL);
            this.right.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.right.submitSound = null;
            this.right.keepMouseFocus = true;
            this.right.onButtonPress = function() {
                this.updateStatusPage(1)
            }.bind(this);
            this.addChildGui(this.right);
            this.doStateTransition("HIDDEN",
                true)
        },
        updateDrawables: function(a) {
            a.addColor("#000", 8, 0, this.hook.size.x - 16, this.hook.size.y)
        },
        show: function() {
            this.updateCurrentPageName();
            sc.menu.buttonInteract.addGlobalButton(this.left, this.onLeftPressCheck.bind(this));
            sc.menu.buttonInteract.addGlobalButton(this.right, this.onRightPressCheck.bind(this));
            this.doStateTransition("DEFAULT")
        },
        hide: function() {
            sc.menu.buttonInteract.removeGlobalButton(this.left);
            sc.menu.buttonInteract.removeGlobalButton(this.right);
            this.doStateTransition("HIDDEN")
        },
        updateCurrentPageName: function() {
            var a = ig.lang.get("sc.gui.menu.status.pages");
            this.text.setText(a[sc.menu.statusPage])
        },
        updateStatusPage: function(a) {
            var b = sc.menu.statusPage,
                c = b;
            if (a > 0) {
                b++;
                b >= sc.MENU_STATUS_PAGES_LENGTH && (b = 0)
            } else {
                b--;
                b < 0 && (b = sc.MENU_STATUS_PAGES_LENGTH - 1)
            }
            if (c != b) {
                sc.BUTTON_SOUND.submit.play();
                sc.menu.setStatusPage(b);
                this.updateCurrentPageName()
            }
        },
        onLeftPressCheck: function() {
            return ig.interact.isBlocked() ? false : sc.control.menuCircleLeft()
        },
        onRightPressCheck: function() {
            return ig.interact.isBlocked() ?
                false : sc.control.menuCircleRight()
        }
    });
    sc.StatusElementSwitch = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/status-gui.png"),
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    offsetX: -195,
                    alpha: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        left: null,
        right: null,
        icon: null,
        init: function() {
            this.parent();
            this.setSize(108, 21);
            this.setPos(25, 27);
            this.hook.localAlpha = 0.5;
            this.icon = new ig.ImageGui(this.gfx, 104, 32, 24, 24);
            this.icon.setPos(0, 1);
            this.icon.setAlign(ig.GUI_ALIGN.X_CENTER,
                ig.GUI_ALIGN.Y_CENTER);
            this.addChildGui(this.icon);
            this.icon.annotation = {
                content: {
                    title: "sc.gui.menu.help.status.titles.element",
                    description: "sc.gui.menu.help.status.description.element"
                },
                offset: {
                    x: 0,
                    y: 1
                },
                size: {
                    x: 23,
                    y: 21
                },
                index: {
                    x: 0
                }
            };
            this.left = new sc.ButtonGui("\\i[page-left]", 32, true, sc.BUTTON_TYPE.SMALL);
            this.left.submitSound = null;
            this.left.textChild.setPos(1, 0);
            this.left.keepMouseFocus = true;
            this.left.setPos(0, 0);
            this.left.onButtonPress = function() {
                this.updateElement(-1)
            }.bind(this);
            this.addChildGui(this.left);
            this.right = new sc.ButtonGui("\\i[page-right]", 32, true, sc.BUTTON_TYPE.SMALL);
            this.right.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.right.textChild.setPos(1, 0);
            this.right.submitSound = null;
            this.right.keepMouseFocus = true;
            this.right.onButtonPress = function() {
                this.updateElement(1)
            }.bind(this);
            this.addChildGui(this.right);
            this.doStateTransition("HIDDEN", true)
        },
        updateDrawables: function(a) {
            a.addColor("#000", 8, 0, this.hook.size.x - 16, this.hook.size.y)
        },
        show: function() {
            this.updateCurrentElementIcon();
            sc.menu.buttonInteract.addGlobalButton(this.left, this.onLeftPressCheck.bind(this));
            sc.menu.buttonInteract.addGlobalButton(this.right, this.onRightPressCheck.bind(this));
            this.doStateTransition("DEFAULT")
        },
        hide: function() {
            sc.menu.buttonInteract.removeGlobalButton(this.left);
            sc.menu.buttonInteract.removeGlobalButton(this.right);
            this.doStateTransition("HIDDEN")
        },
        updateCurrentElementIcon: function() {
            this.icon.offsetY = 32 + 24 * sc.menu.statusElement
        },
        updateElement: function(a) {
            var b = sc.menu.statusElement,
                c = sc.menu.statusElement,
                e = sc.model.player;
            do {
                c = c + a;
                a > 0 ? c > 4 && (c = 0) : c < 0 && (c = 4)
            } while (!e.hasElement(c));
            if (b != c) {
                sc.BUTTON_SOUND.submit.play();
                sc.menu.setStatusElement(c);
                this.updateCurrentElementIcon()
            }
        },
        onLeftPressCheck: function() {
            return sc.control.leftPressed()
        },
        onRightPressCheck: function() {
            return sc.control.rightPressed()
        }
    });
    sc.StatusParamBar = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        name: "nope.",
        lineID: 0,
        iconID: 0,
        usePercent: false,
        iconIndex: Vec2.createC(0, 0),
        skipVertLine: false,
        base: null,
        equip: null,
        skills: null,
        equipAdd: null,
        skillAdd: null,
        description: null,
        guis: [],
        _baseRed: false,
        _equipRed: false,
        _skillsRed: false,
        _hideAll: false,
        _skillHidden: false,
        _noPercent: false,
        init: function(a, b, c, e, f, g, h, i, j) {
            this.parent();
            this.setSize(Math.max(c || 169, 169), 24);
            this.name = a || "nope.";
            this.lineID = e || 0;
            this.iconID = f || 0;
            this.usePercent = g || false;
            this._skillHidden = h || false;
            this._noPercent = i || false;
            this.iconIndex.x = this.iconID % sc.MODIFIER_ICON_DRAW.MAX_PER_ROW;
            this.iconIndex.y = Math.floor(this.iconID / sc.MODIFIER_ICON_DRAW.MAX_PER_ROW);
            this.nameGui = new sc.TextGui(a, {
                font: sc.fontsystem.tinyFont
            });
            this.nameGui.setPos(13, 3);
            this.addChildGui(this.nameGui);
            a = this.usePercent ? 999 : 9999;
            j && (a = 999);
            this.base = new sc.NumberGui(a, {
                signed: this.usePercent,
                transitionTime: 0.2
            });
            this.base.setPos(83 - (this.usePercent ? 8 : 0), 3);
            this.base.setNumber(0, true);
            this.guis.push(this.base);
            this.addTransitions(this.base);
            this.addChildGui(this.base);
            if (j) this.base.hook.pos.x = this.base.hook.pos.x + 8;
            this.equip = new sc.NumberGui(a, {
                signed: this.usePercent,
                transitionTime: 0.2
            });
            this.equip.setPos(127 - (this.usePercent ? 8 : 0), 3);
            this.equip.setNumber(0, true);
            this.guis.push(this.equip);
            this.addTransitions(this.equip);
            this.addChildGui(this.equip);
            if (j) this.equip.hook.pos.x = this.equip.hook.pos.x + 8;
            this.equipAdd = new sc.NumberGui(a, {
                signed: this.usePercent,
                transitionTime: 0.2,
                color: sc.GUI_NUMBER_COLOR.GREY
            });
            this.equipAdd.showPlus = true;
            this.equipAdd.showPlusOnZero = true;
            this.equipAdd.setPos(127 - (this.usePercent ? 8 : 0), 13);
            this.addTransitions(this.equipAdd);
            this.guis.push(this.equipAdd);
            this.equipAdd.doStateTransition("HIDDEN", true);
            this.addChildGui(this.equipAdd);
            if (j) this.equipAdd.hook.pos.x = this.equipAdd.hook.pos.x + 8;
            this.skills = new sc.NumberGui(a, {
                signed: this.usePercent,
                transitionTime: 0.2
            });
            this.skills.setPos(171 - (this.usePercent ? 8 : 0), 3);
            this.skills.setNumber(0, true);
            this.guis.push(this.skills);
            this.addTransitions(this.skills);
            this.addChildGui(this.skills);
            if (j) this.skills.hook.pos.x = this.skills.hook.pos.x + 8;
            h && this.skills.doStateTransition("HIDDEN", true);
            this.skillAdd = new sc.NumberGui(a, {
                signed: this.usePercent,
                transitionTime: 0.2,
                color: sc.GUI_NUMBER_COLOR.GREY
            });
            this.skillAdd.showPlus = true;
            this.skillAdd.showPlusOnZero = true;
            this.skillAdd.setPos(171 - (this.usePercent ? 8 : 0), 13);
            this.skillAdd.setNumber(0, true);
            this.addTransitions(this.skillAdd);
            this.guis.push(this.skillAdd);
            this.skillAdd.doStateTransition("HIDDEN", true);
            this.addChildGui(this.skillAdd);
            if (j) this.skillAdd.hook.pos.x = this.skillAdd.hook.pos.x + 8;
            j = new ig.ImageGui(this.gfx, 6, 321, 4, 6);
            j.setPos(119, 4);
            this.guis.push(j);
            this.addTransitions(j);
            this.addChildGui(j);
            j = new ig.ImageGui(this.gfx, 6, 321, 4, 6);
            j.setPos(163, 4);
            this.guis.push(j);
            this.addTransitions(j);
            this.addChildGui(j);
            h && j.doStateTransition("HIDDEN", true);
            this.description = new sc.TextGui(b, {
                font: sc.fontsystem.smallFont,
                maxWidth: 294 + (this._skillHidden ? 44 : 0),
                linePadding: -3
            });
            this.description.setPos(214 - (this._skillHidden ? 44 : 0), 0);
            this.addChildGui(this.description)
        },
        updateValues: function(a, b, c, e, f, g, h) {
            this.base.setNumber(a, e);
            this.equip.setNumber(b, e);
            this.skills.setNumber(c, e);
            this.base.color =
                sc.GUI_NUMBER_COLOR.WHITE;
            this.equip.color = sc.GUI_NUMBER_COLOR.WHITE;
            this.skills.color = sc.GUI_NUMBER_COLOR.WHITE;
            this._baseRed = this._equipRed = this._skillsRed = false;
            if (h) {
                if (a < 0) {
                    this.base.color = sc.GUI_NUMBER_COLOR.RED;
                    this._baseRed = true
                }
                if (b < 0) {
                    this.equip.color = sc.GUI_NUMBER_COLOR.RED;
                    this._equipRed = true
                }
                if (c < 0) {
                    this.skills.color = sc.GUI_NUMBER_COLOR.RED;
                    this._skillsRed = true
                }
            }
            if (sc.menu.statusDiff && !this._noPercent) {
                this.equipAdd.doStateTransition("DEFAULT", true);
                this._skillHidden || this.skillAdd.doStateTransition("DEFAULT",
                    true);
                this.equipAdd.setNumber(f || 0);
                this.skillAdd.setNumber(g || 0)
            } else {
                this.equipAdd.doStateTransition("HIDDEN", true);
                this._skillHidden || this.skillAdd.doStateTransition("HIDDEN", true);
                this.equipAdd.setNumber(0, true);
                this.skillAdd.setNumber(0, true)
            }
        },
        hideValues: function(a) {
            for (var b = this.guis.length; b--;) this.guis[b].doStateTransition("HIDDEN", a);
            this._hideAll = true
        },
        updateDrawables: function(a) {
            this.parent(a);
            var d = 0,
                c = this.lineID * 12,
                d = this.hook.size.x;
            if (this._hideAll) {
                a.addColor(b[this.lineID], 0,
                    10, 152, 1);
                a.addGfx(this.gfx, 152, 0, 71, 389, 13, 11);
                a.addColor(b[this.lineID], 165, 0, d - 244, 1)
            } else {
                a.addGfx(this.gfx, 0, 0, 0, 329 + c, 90, 11);
                a.addColor(b[this.lineID], 90, 0, d - 90 - 79, 1)
            }
            a.addGfx(this.gfx, d - 79, 0, 90, 329 + c, 79, 1);
            this.skipVertLine || a.addColor(b[this.lineID], 209 - (this._skillHidden ? 44 : 0), 0, 1, this.hook.size.y);
            if (this.usePercent && !this._hideAll) {
                a.addGfx(this.gfx, 107, 3, this._baseRed ? 9 : 0, 407, 8, 8);
                a.addGfx(this.gfx, 151, 3, this._equipRed ? 9 : 0, 407, 8, 8);
                this._skillHidden || a.addGfx(this.gfx, 195, 3, this._skillsRed ?
                    9 : 0, 407, 8, 8);
                if (sc.menu.statusDiff) {
                    a.addGfx(this.gfx, 151, 13, 0, 416, 8, 8);
                    this._skillHidden || a.addGfx(this.gfx, 195, 13, 0, 416, 8, 8)
                }
            }
            d = this.iconIndex.x * 12;
            c = this.iconIndex.y * 12;
            a.addGfx(this.gfx, 0, 0, sc.MODIFIER_ICON_DRAW.X + d, sc.MODIFIER_ICON_DRAW.Y + c, 11, 11)
        },
        addTransitions: function(a) {
            a.hook.transitions = {
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
            }
        }
    })
});
ig.baked = !0;

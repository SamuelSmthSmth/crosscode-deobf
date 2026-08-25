ig.module("game.feature.menu.gui.item.item-status-default").requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.menu-misc").defines(function() {
    function b(a, b, d, m, l, o, n, p) {
        var r = c,
            w = e;
        o || (w = w + i);
        n || (w = w + j);
        var x = f * 2 + g * 4,
            E = x - h;
        if (m != void 0) {
            r = r + (f + m * g);
            x = x - (f + m * g);
            E = x - h
        }
        if (l != void 0) E = x = x - (f + (4 - l) * g);
        if (n && !o && p == 0) {
            r = r + f;
            E = x = x - (f + 1)
        }
        a.addGfx(b, d.posX, 9, r, w, x, k);
        d.posX = d.posX + E
    }

    function a(a, b, c, d, e, f, g, h) {
        var i = l,
            j = o;
        f || (j = j + r);
        g || (j = j + t);
        var k = m * 2 + n * 4,
            E = k - p;
        if (d != void 0) {
            i = i + (m + d * n);
            k = k - (m + d * n);
            E = k - p
        }
        if (e != void 0) E = k = k - (m + (4 - e) * n);
        if (g && !f && h == 0) {
            i = i + m;
            E = k = k - (m + 1)
        }
        a.addGfx(b, c.posX, 9, i, j, k, q);
        c.posX = c.posX + E
    }
    sc.MENU_BAR_TYPE = {
        HP: 0,
        EXP: 1,
        SP: 2,
        BUFF: 3
    };
    var d = {
        sp: 0,
        posX: 0,
        barFilled: 0,
        regenFilled: 0
    };
    sc.ItemStatusDefaultBar = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/status-gui.png"),
        backgroundPatch: new ig.NinePatch("media/gui/menu.png", {
            width: 2,
            height: 0,
            left: 4,
            top: 6,
            right: 4,
            bottom: 0,
            offsets: {
                "default": {
                    x: 128,
                    y: 408
                },
                sp: {
                    x: 112,
                    y: 408
                },
                spm: {
                    x: 112,
                    y: 416
                }
            }
        }),
        barPatch: new ig.NinePatch("media/gui/status-gui.png", {
            width: 46,
            height: 0,
            left: 1,
            top: 1,
            right: 1,
            bottom: 0,
            offsets: {
                hp: {
                    x: 0,
                    y: 48
                },
                bg: {
                    x: 0,
                    y: 49
                },
                red: {
                    x: 0,
                    y: 50
                },
                fg: {
                    x: 0,
                    y: 51
                },
                exp: {
                    x: 0,
                    y: 52
                },
                buff: {
                    x: 0,
                    y: 54
                }
            }
        }),
        type: 0,
        name: "",
        maxValue: 0,
        currentValue: -1,
        targetValue: 0,
        timer: 0,
        currentNumber: null,
        maxNumber: null,
        buff: null,
        barHeight: 0,
        model: null,
        init: function(a, b, c, d, e, f) {
            this.parent();
            this.setSize(d || 126, 14);
            this.barHeight = e || 0;
            this.buff = c || null;
            this.type = b || sc.MENU_BAR_TYPE.HP;
            this.model = sc.model.player;
            a = new sc.TextGui(a, {
                font: sc.fontsystem.tinyFont,
                speed: ig.TextBlock.SPEED.IMMEDIATE
            });
            a.setPos(3, f);
            this.addChildGui(a);
            if (this.type != sc.MENU_BAR_TYPE.BUFF) {
                f = 0;
                switch (this.type) {
                    case sc.MENU_BAR_TYPE.HP:
                        f = 9999;
                        break;
                    case sc.MENU_BAR_TYPE.EXP:
                        f = sc.EXP_PER_LEVEL;
                        break;
                    case sc.MENU_BAR_TYPE.SP:
                        f = 99
                }
                this.maxNumber = new sc.NumberGui(f);
                this.maxNumber.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
                this.maxNumber.setPos(6, 0);
                this.addChildGui(this.maxNumber);
                this.currentNumber = new sc.NumberGui(f, {
                    transitionTime: 0.2
                });
                this.currentNumber.setAlign(ig.GUI_ALIGN.X_RIGHT,
                    ig.GUI_ALIGN.Y_TOP);
                this.currentNumber.setPos(48, 0)
            } else {
                f = new sc.TextGui(ig.lang.get("sc.gui.menu.seconds"), {
                    font: sc.fontsystem.tinyFont,
                    speed: ig.TextBlock.SPEED.IMMEDIATE
                });
                f.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
                f.setPos(3, -1);
                this.addChildGui(f);
                this.currentNumber = new sc.NumberGui(999);
                this.currentNumber.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
                this.currentNumber.setPos(19, 0)
            }
            this.addChildGui(this.currentNumber)
        },
        updateValues: function(a, b, c, d) {
            this.model = b ? b : sc.model.player;
            switch (this.type) {
                case sc.MENU_BAR_TYPE.HP:
                    b = b ? b.params : sc.model.player.params;
                    c = c || b.currentHp;
                    if (this.currentValue != c) {
                        if ((this.targetValue - this.currentValue) * (c - this.targetValue) < 0) this.currentValue = this.targetValue;
                        this.targetValue = c;
                        a ? this.currentValue = this.targetValue : this.timer = 0.2;
                        this.maxValue = d || b.getStat("hp");
                        this.currentNumber.setNumber(c, a);
                        this.maxNumber.setNumber(this.maxValue, a)
                    }
                    break;
                case sc.MENU_BAR_TYPE.EXP:
                    b = b ? b : sc.model.player;
                    if (this.currentValue != b.exp) {
                        this.currentValue = this.targetValue =
                            Math.floor(b.exp);
                        this.maxValue = sc.EXP_PER_LEVEL;
                        this.currentNumber.setNumber(b.exp, a);
                        this.maxNumber.setNumber(this.maxValue, a)
                    }
                    break;
                case sc.MENU_BAR_TYPE.SP:
                    b = b ? b.params : sc.model.player.params;
                    this.currentValue != b.currentSp && this.currentNumber.setNumber(Math.floor(b.currentSp), a);
                    this.maxNumber.setNumber(b.maxSp, a);
                    break;
                case sc.MENU_BAR_TYPE.BUFF:
                    b = Math.ceil(this.buff.timer);
                    if (this.currentValue != b) {
                        this.currentValue = this.targetValue = b;
                        this.maxValue = this.buff.time;
                        this.currentNumber.setNumber(b,
                            a)
                    }
            }
        },
        resetValues: function() {
            this.currentNumber.setNumber(0);
            this.targetValue = this.currentValue = -1;
            this.timer = 0
        },
        update: function() {
            if (this.timer > 0) this.timer = this.timer - ig.system.actualTick;
            else if (this.targetValue != this.currentValue) {
                var a = ig.system.actualTick * this.maxValue / 2;
                if (this.currentValue > this.targetValue) this.currentValue = Math.max(this.targetValue, this.currentValue - a);
                else if (this.currentValue < this.targetValue) this.currentValue = Math.min(this.targetValue, this.currentValue + a)
            }
        },
        updateDrawables: function(a) {
            if (this.type ==
                sc.MENU_BAR_TYPE.SP) this._drawSpBar(a);
            else {
                var b, c, d, e;
                this.type != sc.MENU_BAR_TYPE.BUFF ? this.backgroundPatch.draw(a, this.hook.size.x - (this.barHeight ? this.barHeight : 4), this.barHeight ? this.barHeight : 4, "default", 2, 9) : this.backgroundPatch.draw(a, this.hook.size.x - 3, 3, "default", 2, 9);
                this.type != sc.MENU_BAR_TYPE.BUFF && a.addGfx(this.backgroundPatch.gfx, this.hook.size.x - 46, 0, 80, 408, 8, 8);
                switch (this.type) {
                    case sc.MENU_BAR_TYPE.HP:
                        d = "hp";
                        break;
                    case sc.MENU_BAR_TYPE.EXP:
                        d = "exp";
                        break;
                    case sc.MENU_BAR_TYPE.BUFF:
                        d =
                            "buff"
                }
                if (this.targetValue > 0) {
                    if (this.targetValue < this.currentValue) {
                        c = this.currentValue / this.maxValue;
                        b = this.targetValue / this.maxValue;
                        e = "bg"
                    } else {
                        c = this.targetValue / this.maxValue;
                        b = this.currentValue / this.maxValue;
                        e = "fg"
                    }
                    this.type == sc.MENU_BAR_TYPE.HP && (d = b > 0.25 ? "hp" : "red")
                }
                for (var f = this.barHeight || (this.type != sc.MENU_BAR_TYPE.BUFF ? 4 : 3), g = 0; g < f; g++) {
                    c && (this.targetValue != this.currentValue && this.type == sc.MENU_BAR_TYPE.HP) && this.barPatch.draw(a, Math.round(c.limit(0, 1) * (this.hook.size.x - 7)), 1, e, 2 +
                        g, 9 + g);
                    b > 0 && this.barPatch.draw(a, this.type == sc.MENU_BAR_TYPE.BUFF ? Math.round(b.limit(0, 1) * (this.hook.size.x - 6)) : Math.round(b.limit(0, 1) * (this.hook.size.x - (this.barHeight == 3 ? 6 : 7))), 1, d, 2 + g, 9 + g)
                }
            }
        },
        _drawSpBarMinified: function(a) {
            var b = this.backgroundPatch.gfx,
                c = this.model.params.maxSp,
                c = 16;
            this.backgroundPatch.draw(a, this.hook.size.x - 4, 4, "spm", 2, 9);
            a.addGfx(b, this.hook.size.x - 46, 0, 80, 408, 8, 8);
            for (var b = 6, d = 0; d < c; d++) {
                a.addColor(d + 1 > c / 2 ? SP_REG_COLOR : SP_NORMAL_COLOR, b, 10, 3, 2);
                b = (d + 1) % 4 == 0 ? b + 6 : b + 4
            }
        },
        _drawSpBar: function(c) {
            var e =
                this.backgroundPatch.gfx,
                f = this.model.params,
                g = f.maxSp,
                h = g * sc.SP_REGEN_FACTOR,
                i = f.currentSp,
                f = Math.floor(i);
            this.barHeight == 3 ? this.backgroundPatch.draw(c, this.hook.size.x - 4, 4, "spm", 2, 9) : this.backgroundPatch.draw(c, this.hook.size.x - 4, 6, "sp", 2, 9);
            c.addGfx(e, this.hook.size.x - 46, 0, 80, 408, 8, 8);
            this.barHeight == 3 ? c.addGfx(e, 2, 9, 560, 160 + (i < 1 ? 16 : 0), 6, 4) : c.addGfx(e, 2, 9, 144, 480 + (i < 1 ? 16 : 0), 6, 6);
            d.posX = 8;
            d.sp = 0;
            d.barFilled = Math.min(4, f);
            d.regenFilled = Math.min(4, h);
            for (i = this.barHeight == 3 ? a : b; d.sp + 1 <= f;) {
                var j =
                    d.sp ? void 0 : 0;
                if (d.barFilled == 4 && (d.regenFilled == 4 || d.regenFilled == 0)) i(c, e, d, j, void 0, true, d.regenFilled == 4);
                else if (d.regenFilled > 0 && d.regenFilled < d.barFilled) {
                    var k = d.barFilled == 4 ? void 0 : d.barFilled;
                    i(c, e, d, j, d.regenFilled, true, true);
                    i(c, e, d, d.regenFilled, k, true, false)
                } else i(c, e, d, j, d.barFilled, true, d.regenFilled > 0);
                d.sp = d.sp + d.barFilled;
                if (d.barFilled == 4) {
                    d.barFilled = Math.min(4, f - d.sp);
                    d.regenFilled = (h - d.sp).limit(0, 4)
                }
            }
            if (d.sp % 4 != 0) {
                if (d.regenFilled > d.barFilled && d.regenFilled < 4) {
                    i(c, e, d, d.barFilled,
                        d.regenFilled, false, true);
                    d.barFilled = d.regenFilled
                }
                i(c, e, d, d.barFilled, void 0, false, d.regenFilled == 4);
                d.sp = Math.ceil(d.sp / 4) * 4
            }
            for (; d.sp < g;) {
                d.regenFilled = (h - d.sp).limit(0, 4);
                if (d.regenFilled == 4 || d.regenFilled == 0) i(c, e, d, void 0, void 0, false, d.regenFilled == 4, f);
                else {
                    i(c, e, d, void 0, d.regenFilled, false, true);
                    i(c, e, d, d.regenFilled, void 0, false, false)
                }
                d.sp = d.sp + 4
            }
        }
    });
    var c = 144,
        e = 480,
        f = 6,
        g = 5,
        h = 2,
        i = 16,
        j = 8,
        k = 6,
        l = 560,
        o = 160,
        m = 6,
        n = 3,
        p = 2,
        r = 10,
        t = 5,
        q = 4;
    sc.ItemStatusDefault = sc.MenuPanel.extend({
        menuGfx: new ig.Image("media/gui/menu.png"),
        statusGfx: new ig.Image("media/gui/status-gui.png"),
        level: null,
        hpBar: null,
        spBar: null,
        expBar: null,
        skinGfx: null,
        bounds: null,
        init: function() {
            this.parent(sc.MenuPanelType.TOP_RIGHT_EDGE);
            this.setSize(126, 95);
            this.setPos(sc.options.hdMode ? 25 : 2, 28);
            this.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: -(126 + (sc.options.hdMode ? 25 : 3))
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.level = new sc.NumberGui(99, {
                size: sc.NUMBER_SIZE.LARGE
            });
            this.level.setAlign(ig.GUI_ALIGN.X_RIGHT,
                ig.GUI_ALIGN.Y_TOP);
            this.level.setPos(3, 2);
            this.addChildGui(this.level);
            this.hpBar = new sc.ItemStatusDefaultBar("HP", sc.MENU_BAR_TYPE.HP);
            this.hpBar.setPos(0, 39);
            this.addChildGui(this.hpBar);
            this.hpBar.updateValues(true);
            this.hpBar.annotation = {
                size: {
                    x: this.hpBar.hook.size.x + 2,
                    y: this.hpBar.hook.size.y + 2
                },
                offset: {
                    x: -1,
                    y: -1
                },
                content: {
                    title: "sc.gui.menu.help.item.titles.hp",
                    description: "sc.gui.menu.help.item.description.hp"
                },
                index: {
                    x: 0,
                    y: 0
                }
            };
            this.spBar = new sc.ItemStatusDefaultBar("SP", sc.MENU_BAR_TYPE.SP);
            this.spBar.setPos(0, 57);
            this.addChildGui(this.spBar);
            this.spBar.updateValues(true);
            this.spBar.annotation = {
                size: {
                    x: this.spBar.hook.size.x + 2,
                    y: this.spBar.hook.size.y + 2
                },
                offset: {
                    x: -1,
                    y: -1
                },
                content: {
                    title: "sc.gui.menu.help.item.titles.sp",
                    description: "sc.gui.menu.help.item.description.sp"
                },
                index: {
                    x: 0,
                    y: 1
                }
            };
            this.expBar = new sc.ItemStatusDefaultBar("EXP", sc.MENU_BAR_TYPE.EXP);
            this.expBar.setPos(0, 77);
            this.addChildGui(this.expBar);
            this.expBar.updateValues(true);
            this.expBar.annotation = {
                size: {
                    x: this.expBar.hook.size.x +
                        2,
                    y: this.expBar.hook.size.y + 2
                },
                offset: {
                    x: -1,
                    y: -1
                },
                content: {
                    title: "sc.gui.menu.help.item.titles.exp",
                    description: "sc.gui.menu.help.item.description.exp"
                },
                index: {
                    x: 0,
                    y: 2
                }
            };
            this.doStateTransition("HIDDEN", true)
        },
        updateDrawables: function(a) {
            this.parent(a);
            a.addGfx(this.menuGfx, 0, 0, 280, 472, 126, 35);
            this.skinGfx && this.bounds ? a.addGfx(this.skinGfx, 0, 0, this.bounds.x, this.bounds.y, this.bounds.w, this.bounds.h) : a.addGfx(this.menuGfx, 0, 0, 211, 26, 60, 34);
            a.addGfx(this.statusGfx, 64, 5, 104, 32 + sc.model.player.currentElementMode *
                24, 24, 24)
        },
        addObservers: function() {
            sc.Model.addObserver(sc.menu, this);
            sc.Model.addObserver(sc.model.player, this);
            sc.Model.addObserver(sc.model.player.params, this);
            sc.Model.addObserver(sc.playerSkins, this)
        },
        removeObservers: function() {
            sc.Model.removeObserver(sc.menu, this);
            sc.Model.removeObserver(sc.model.player, this);
            sc.Model.removeObserver(sc.model.player.params, this);
            sc.Model.removeObserver(sc.playerSkins, this)
        },
        showMenu: function() {
            this.checkSkin();
            this._updateElements(true);
            !sc.menu.isItemEquipTab() &&
                sc.menu.itemCurrentTab != 6 && this.doStateTransition("DEFAULT")
        },
        exitMenu: function() {
            this.doStateTransition("HIDDEN")
        },
        checkSkin: function() {
            var a = sc.playerSkins.getCurrentSkin("Appearance");
            if (a && a.loaded) {
                this.skinGfx = a.guiImage;
                this.bounds = a.guiImageBounds ? a.guiImageBounds.face || null : null
            } else this.bounds = this.skinGfx = null
        },
        modelChanged: function(a, b) {
            a == sc.menu ? b == sc.MENU_EVENT.ITEM_CHANGED_TAB && (!sc.menu.isItemEquipTab() && sc.menu.itemCurrentTab != 6 ? this.doStateTransition("DEFAULT") : this.doStateTransition("HIDDEN")) :
                a == sc.model.player ? (b == sc.PLAYER_MSG.LEVEL_CHANGE || b == sc.PLAYER_MSG.EXP_CHANGE || b == sc.PLAYER_MSG.ELEMENT_MODE_CHANGE) && this._updateElements() : a == sc.model.player.params ? (b == sc.COMBAT_PARAM_MSG.BUFF_ADDED || b == sc.COMBAT_PARAM_MSG.HP_CHANGED || b == sc.COMBAT_PARAM_MSG.SP_CHANGED || b == sc.COMBAT_PARAM_MSG.STATS_CHANGED) && this._updateElements() : a == sc.playerSkins && this.checkSkin()
        },
        _updateElements: function(a) {
            this.level.setNumber(sc.model.player.level);
            this.hpBar.updateValues(a);
            this.expBar.updateValues(a);
            this.spBar.updateValues(a)
        }
    })
});
ig.baked = !0;

ig.module("game.feature.menu.gui.social.social-misc").requires("impact.feature.gui.base.box", "impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.item.item-status-default", "game.feature.msg.gui.side-message-hud", "game.feature.menu.gui.enemies.enemy-pages").defines(function() {
    var b = [],
        a = [];
    sc.SocialInfoBox = ig.BoxGui.extend({
        ninepatch: new ig.NinePatch("media/gui/menu.png", {
            width: 12,
            height: 4,
            left: 6,
            top: 6,
            right: 6,
            bottom: 6,
            offsets: {
                "default": {
                    x: 512,
                    y: 440
                }
            }
        }),
        noEntry: null,
        base: null,
        clazz: null,
        name: null,
        baseHp: null,
        baseAttack: null,
        baseDefense: null,
        baseFocus: null,
        equip: null,
        content: null,
        init: function() {
            this.parent(281, 129);
            this.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
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
            this.base = new sc.SocialBaseInfoBox;
            this.base.setPos(3, 3);
            this.addChildGui(this.base);
            this.noEntry = new sc.TextGui(ig.lang.get("sc.gui.menu.social.noMember"));
            this.noEntry.hook.transitions = {
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
            this.noEntry.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.noEntry.setPos(0, 3);
            this.addChildGui(this.noEntry);
            this.noEntry.doStateTransition("HIDDEN", true);
            this.content = new ig.GuiElementBase;
            this.content.hook.transitions = {
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
            this.content.setPos(3, 39);
            this.content.setSize(275, 98);
            this.addChildGui(this.content);
            var a = new ig.ColorGui("#545454", 275, 1);
            a.setPos(0, 0);
            this.content.addChildGui(a);
            a = new sc.TextGui(ig.lang.get("sc.gui.menu.social.class"), {
                font: sc.fontsystem.tinyFont
            });
            a.setPos(3, 3);
            this.content.addChildGui(a);
            var b = a.hook.size.x,
                a = new sc.TextGui(ig.lang.get("sc.gui.menu.social.name"), {
                    font: sc.fontsystem.tinyFont
                });
            a.setPos(3, 18);
            this.content.addChildGui(a);
            b = Math.max(a.hook.size.x, b) + 6;
            this.clazz = new sc.TextGui("Ultra Lord");
            this.clazz.setPos(b, 0);
            this.content.addChildGui(this.clazz);
            this.name = new sc.TextGui("Ultra Lord");
            this.name.setPos(b, 15);
            this.content.addChildGui(this.name);
            b = 3;
            a = 32;
            this.baseHp = this.createStatusLine("maxhp", 0, b, a);
            a = a + 14;
            this.baseAttack = this.createStatusLine("atk", 1, b, a);
            a = a + 14;
            this.baseDefense = this.createStatusLine("def", 2, b, a);
            this.baseFocus = this.createStatusLine("foc", 3, b, a + 14);
            a = new sc.TextGui(ig.lang.get("sc.gui.menu.social.equipment"), {
                font: sc.fontsystem.tinyFont
            });
            a.setPos(139, 3);
            this.content.addChildGui(a);
            a = new ig.ColorGui("#545454", 137, 1);
            a.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            a.setPos(0, 11);
            this.content.addChildGui(a);
            this.equip = new ig.GuiElementBase;
            this.equip.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.equip.setSize(136, 72);
            this.equip.setPos(1, 13);
            this.content.addChildGui(this.equip);
            this.equip.annotation = {
                content: {
                    title: "sc.gui.menu.help.social.titles.equip",
                    description: "sc.gui.menu.help.social.description.equip"
                },
                offset: {
                    x: 0,
                    y: 0
                },
                size: {
                    x: 136,
                    y: 72
                },
                index: {
                    x: 1,
                    y: 0
                }
            }
        },
        show: function() {
            this.doStateTransition("DEFAULT")
        },
        hide: function() {
            this.doStateTransition("HIDDEN")
        },
        setCharacter: function(a) {
            if (a) {
                var b = sc.party.models[a];
                this.base.show(a, b);
                this.clazz.setText(ig.lang.get("sc.gui.menu.social.classes." + b.clazz));
                this.name.setText(ig.LangLabel.getText(b.character.data.realname));
                this.baseHp.setNumber(b.params.getStat("hp"), true);
                this.baseAttack.setNumber(b.params.getStat("attack"), true);
                this.baseDefense.setNumber(b.params.getStat("defense"), true);
                this.baseFocus.setNumber(b.params.getStat("focus"), true);
                this.equip.removeAllChildren();
                var a = b.equip,
                    b = -3,
                    e;
                for (e in a) b = this.createEquipEntry(a[e], b, e);
                this.content.doStateTransition("DEFAULT", true);
                this.noEntry.doStateTransition("HIDDEN", true)
            } else {
                this.base.hide(true);
                this.content.doStateTransition("HIDDEN", true);
                this.noEntry.doStateTransition("DEFAULT", true)
            }
        },
        createEquipEntry: function(a, b, e) {
            var f = null,
                g = null,
                g = null;
            if (f = a < 0 ? null : sc.inventory.getItem(a)) {
                g = "\\i[" + f.icon + sc.inventory.getRaritySuffix(f.rarity || 0) + "]";
                g = g + ig.LangLabel.getText(f.name)
            } else g = "\\i[" + this.getBodyPartIcon(e) +
                "]-----------------";
            a = sc.inventory.getItemLevel(a);
            g = new sc.TextGui(g);
            g.setPos(0, b);
            g.level = a;
            g.numberGfx = this.ninepatch.gfx;
            g.setDrawCallback(function(a, b) {
                sc.MenuHelper.drawLevel(this.level, a, b, this.numberGfx, f && f.isScalable)
            }.bind(g));
            this.equip.addChildGui(g);
            return b + 15
        },
        getBodyPartIcon: function(a) {
            switch (a) {
                case "head":
                    return "item-helm";
                case "leftArm":
                    return "item-sword";
                case "rightArm":
                    return "item-sword";
                case "torso":
                    return "item-belt";
                case "feet":
                    return "item-shoe"
            }
        },
        createStatusLine: function(a,
            b, e, f) {
            var g = new sc.EnemyBaseParamLine(ig.lang.get("sc.gui.menu.equip." + a), b);
            g.setPos(e, f);
            g.annotation = {
                content: {
                    title: "sc.gui.menu.equip." + a,
                    description: "sc.gui.menu.equip.descriptions." + a
                },
                offset: {
                    x: -1,
                    y: -1
                },
                index: {
                    x: 0,
                    y: b
                }
            };
            this.content.addChildGui(g);
            return g
        }
    });
    sc.SocialPartyBox = ig.GuiElementBase.extend({
        lea: null,
        members: [],
        init: function() {
            this.parent("blue");
            this.setSize(281, 120);
            this.setPos(8, 29)
        },
        updatePartyMembers: function() {
            var d = 3 + this.members[0].hook.size.y;
            b.length = 0;
            a.length = 0;
            for (var c =
                    1; c < this.members.length; c++) {
                var e = this.members[c];
                if (sc.party.isPartyMember(e.name)) {
                    a.push(e.name);
                    e.doPosTranstition(0, d, 0.2);
                    d = d + (e.hook.size.y + 3)
                } else {
                    b.push(c);
                    e.doStateTransition("SCALE", false, true)
                }
            }
            for (c = b.length; c--;) this.members.splice(b[c], 1);
            d = 35 * this.members.length + 3 * this.members.length + 9;
            e = sc.party.currentParty;
            for (c = 0; c < e.length; c++) {
                var f = sc.party.models[e[c]];
                if (a.indexOf(e[c]) == -1 && !f.temporary) {
                    f = new sc.SocialPartyMember(false, sc.party.models[e[c]], e[c]);
                    f.setPos(0, d);
                    f.show();
                    d = d + (f.hook.size.y + 3);
                    this.addChildGui(f);
                    this.members.push(f)
                }
            }
            this.members[0] && this.members[0].isLea && this.members[0].currentValue.setNumber(sc.party.currentParty.length + 1, true)
        },
        show: function(a) {
            for (var b = this.members.length; b--;) a && b >= 1 ? this.members[b].hide(true) : this.members[b].remove();
            var e = this.members.length = 0,
                f = new sc.SocialPartyMember(true, sc.model.player);
            this.addChildGui(f);
            this.members.push(f);
            e = e + (f.hook.size.y + 3);
            f.show(a);
            a = sc.party.currentParty;
            for (b = 0; b < a.length; b++)
                if (!sc.party.models[a[b]].temporary) {
                    f =
                        new sc.SocialPartyMember(false, sc.party.models[a[b]], a[b]);
                    f.setPos(0, e);
                    f.show();
                    e = e + (f.hook.size.y + 3);
                    this.addChildGui(f);
                    this.members.push(f)
                }
        },
        hide: function(a) {
            for (var b = this.members.length; b--;) this.members[b].hide(a)
        }
    });
    sc.SocialPartyMember = sc.MenuPanel.extend({
        gfx: new ig.Image("media/gui/basic.png"),
        headerPatch: new ig.NinePatch("media/gui/menu.png", {
            width: 2,
            height: 0,
            left: 1,
            top: 9,
            right: 5,
            bottom: 0,
            offsets: {
                "default": {
                    x: 96,
                    y: 408
                }
            }
        }),
        info: null,
        name: null,
        isLea: false,
        init: function(a, b, e) {
            this.parent(sc.MenuPanelType.TOP_RIGHT_EDGE);
            this.setSize(281, a ? 44 : 35);
            this.setPivot(0, 0);
            this.isLea = a || false;
            this.name = e || null;
            this.hook.transitions = {
                DEFAULT: {
                    state: {},
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: -(this.hook.size.x / 2)
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                },
                SCALE: {
                    state: {
                        alpha: 0,
                        scaleY: 0
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            if (a) {
                e = new sc.TextGui(ig.lang.get("sc.gui.menu.social.party"), {
                    font: sc.fontsystem.tinyFont,
                    speed: ig.TextBlock.SPEED.IMMEDIATE
                });
                e.setPos(2, 1);
                this.addChildGui(e);
                e = {
                    size: sc.NUMBER_SIZE.TINY,
                    color: sc.GUI_NUMBER_COLOR.GREY
                };
                this.maxValue = new sc.NumberGui(4, e);
                this.maxValue.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
                this.maxValue.setPos(6, 2);
                this.maxValue.setNumber(sc.PARTY_MAX_MEMBERS + 1);
                this.addChildGui(this.maxValue);
                this.currentValue = new sc.NumberGui(4, e);
                this.currentValue.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
                this.currentValue.setPos(20, 2);
                this.currentValue.setNumber(sc.party.currentParty.length + 1);
                this.addChildGui(this.currentValue);
                e =
                    new ig.ImageGui(this.gfx, 208, 18, 5, 5);
                e.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
                e.setPos(14, 2);
                this.addChildGui(e)
            }
            this.info = new sc.SocialBaseInfoBox;
            this.info.setPos(3, a ? 9 : 0);
            this.info.show("PARTY_MEMBER", b);
            this.addChildGui(this.info);
            this.doStateTransition("HIDDEN", true)
        },
        show: function(a) {
            this.doStateTransition("DEFAULT", a)
        },
        hide: function(a) {
            this.doStateTransition("HIDDEN", false, a)
        },
        updateDrawables: function(a) {
            this.parent(a);
            this.isLea && this.headerPatch.draw(a, this.hook.size.x, 9, "default");
            a.addColor("#FFF", 1, this.isLea ? 9 : 0, 1, this.hook.size.y - (this.isLea ? 9 : 0))
        }
    });
    sc.SocialBaseInfoBox = ig.GuiElementBase.extend({
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
        face: null,
        level: null,
        name: null,
        exp: null,
        hp: null,
        sp: null,
        init: function() {
            this.parent();
            this.setSize(275, 35);
            var a = new sc.TextGui("LVL", {
                font: sc.fontsystem.tinyFont
            });
            a.setPos(53, 18);
            this.addChildGui(a);
            this.face = new sc.SocialFace;
            this.addChildGui(this.face);
            this.name = new sc.TextGui;
            this.name.setPos(53, 0);
            this.addChildGui(this.name);
            this.level = new sc.NumberGui(99, {
                size: sc.NUMBER_SIZE.LARGE
            });
            this.level.setPos(68, 19);
            this.addChildGui(this.level);
            this.exp = new sc.ItemStatusDefaultBar("EXP", sc.MENU_BAR_TYPE.EXP, null, 93, 0, -1);
            this.exp.setPos(92, 19);
            this.addChildGui(this.exp);
            this.hp = new sc.ItemStatusDefaultBar("HP", sc.MENU_BAR_TYPE.HP, null, 95, 0, -1);
            this.hp.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.hp.setPos(-2, 3);
            this.addChildGui(this.hp);
            this.sp =
                new sc.ItemStatusDefaultBar("SP", sc.MENU_BAR_TYPE.SP, null, 95, 3, -1);
            this.sp.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.sp.setPos(-2, 19);
            this.addChildGui(this.sp)
        },
        show: function(a, b) {
            this.face.setCharacter(b.defaultExpression);
            this.name.setText(b.getCharacterName());
            this.level.setNumber(b.level || 1);
            this.exp.updateValues(true, b);
            this.hp.updateValues(true, b);
            this.sp.updateValues(true, b);
            this.doStateTransition("DEFAULT", true)
        },
        hide: function(a) {
            this.doStateTransition("HIDDEN", a)
        }
    });
    sc.SocialFace =
        ig.GuiElementBase.extend({
            charExpression: null,
            transitions: {
                DEFAULT: {
                    state: {
                        scaleX: -1
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            },
            init: function() {
                this.parent();
                this.setSize(52, 35);
                this.setPos(2, 0);
                this.setPivot(26, 0);
                this.doStateTransition("DEFAULT", true)
            },
            setCharacter: function(a) {
                this.charExpression = a
            },
            updateDrawables: function(a) {
                this.charExpression && sc.MsgGuiTools.drawPortrait(a, this.charExpression, 0, 4, 0, this.hook.size.x - 2, this.hook.size.y)
            }
        });
    sc.SocialEntryButton = sc.ListBoxButton.extend({
        gfx2: new ig.Image("media/gui/menu.png"),
        head: null,
        status: null,
        level: null,
        key: null,
        init: function(a, b) {
            this.parent(this.getMemberName(a, b), 187, 73);
            this.blockedSound = this.button.submitSound = null;
            this.button.textChild.setPos(34, 0);
            this.key = a;
            var e = sc.party.isPartyMember(a) ? 0 : sc.party.contacts[a].online ? 1 : 2;
            this.head = new sc.SocialHead(b.getHeadIdx());
            this.head.setPos(7, 1);
            this.head.active = e == 0;
            this.addChildGui(this.head);
            this.level = new sc.NumberGui(99);
            this.level.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.level.setPos(5, 7);
            this.level.setNumber(b.level ||
                1);
            this.addChildGui(this.level);
            this.status = new ig.ImageGui(this.gfx2, 512, 416 + e * 8, 38, 7);
            this.status.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
            this.status.setPos(30, 7);
            this.addChildGui(this.status)
        },
        focusGained: function() {
            this.parent();
            this.head.focus = true
        },
        focusLost: function() {
            this.parent();
            this.head.focus = false
        },
        updateMemberStatus: function() {
            var a = sc.party.isPartyMember(this.key) ? 0 : sc.party.contacts[this.key].online ? 1 : 2;
            this.status.offsetY = 416 + a * 8;
            this.head.active = a == 0
        },
        keepButtonPressed: function() {
            this.keepPressed =
                true;
            this.setPressed(true);
            this.button.keepPressed = true;
            this.button.setPressed(true);
            this.head.keepPressed = true
        },
        unPressButton: function() {
            this.keepPressed = false;
            this.setPressed(false);
            this.button.keepPressed = false;
            this.button.setPressed(false);
            this.head.keepPressed = false
        },
        getMemberName: function(a, b) {
            return b.getCharacterName() || a
        }
    });
    sc.SocialHead = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        headsGfx: new ig.Image("media/gui/severed-heads.png"),
        index: 0,
        active: false,
        focus: false,
        keepPressed: false,
        init: function(a) {
            this.parent();
            this.setSize(24, 17);
            this.index = a
        },
        updateDrawables: function(a) {
            a.addGfx(this.gfx, 0, 0, 512, 457, 24, 17);
            a.addGfx(this.headsGfx, 0, 0, this.index * 24, 7, 24, 17);
            this.active && a.addGfx(this.gfx, 0, 0, 512, this.focus || this.keepPressed ? 493 : 475, 24, 17)
        }
    })
});
ig.baked = !0;

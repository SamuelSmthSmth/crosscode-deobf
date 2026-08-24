/**
 * game.feature.menu.gui.help.help-misc
 * ====================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.help.help-misc")`.
 *
 * Help overlay widgets:
 *  - `sc.HelpAnnoBase` (with `sc.HELP_ANNO_TYPE.INFO`): the focusable
 *    annotation button with corner markers.
 *  - `sc.HelpInfoBox`: the info popup (title + description) with buff /
 *    level-color special layouts.
 *  - `sc.HelpLevelEntry` / `sc.HelpBuffEntry`: the level color legend
 *    rows and the buff stat rows.
 */
ig.module("game.feature.menu.gui.help.help-misc")
    .requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.menu-misc")
    .defines(function () {

    sc.HELP_ICON_TYPE = {
        INFO: 0
    };

    sc.HelpAnnoBase = ig.FocusGui.extend({
        gfx: new ig.Image("media/gui/menu.png"),
        icon: 0,
        flipX: false,
        flipY: false,

        init: function (icon, annotation, width, height) {
            this.parent();
            this.setSize(width || 13, height || 13);
            this.icon = icon || 0;
            this.flipX = annotation.flipIconX || false;
            this.flipY = annotation.flipIconY || false
        },

        updateDrawables: function (renderer) {
            var hook = this.hook;
            renderer.addGfx(this.gfx, -1, -1, 642 + (this.focus ? 7 : 0), 160 + (hook.size.y <= 11 ? 8 : 0), 6, 6);
            renderer.addGfx(this.gfx, hook.size.x - 5, -1, 642 + (this.focus ? 7 : 0), 160 + (hook.size.y <= 11 ? 8 : 0), 6, 6, true);
            renderer.addGfx(this.gfx, hook.size.x - 5, hook.size.y - 5, 642 + (this.focus ? 7 : 0), 160 + (hook.size.y <= 11 ? 8 : 0), 6, 6, true, true);
            renderer.addGfx(this.gfx, -1, hook.size.y - 5, 642 + (this.focus ? 7 : 0), 160 + (hook.size.y <= 11 ? 8 : 0), 6, 6, false, true)
        }
    });

    sc.HELP_ANNO_TYPE = {};

    sc.HELP_ANNO_TYPE.INFO = sc.HelpAnnoBase.extend({
        init: function (annotation) {
            this.parent(sc.HELP_ICON_TYPE.INFO, annotation)
        }
    });

    sc.HelpInfoBox = sc.MenuPanel.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.1,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    scaleY: 0
                },
                time: 0.1,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        title: null,
        description: null,
        line: null,
        content: null,

        init: function () {
            this.parent(sc.MenuPanelType.TOP_RIGHT_EDGE_DARKER);
            this.setSize(200, 13);
            this.title = new sc.TextGui("");
            this.title.hook.transitions = {
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
            this.title.setPos(5, 1);
            this.addChildGui(this.title);
            this.description = new sc.TextGui("", {
                font: sc.fontsystem.smallFont,
                maxWidth: 190
            });
            this.description.hook.transitions = {
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
            this.description.setPos(5, 18);
            this.addChildGui(this.description);
            this.line = new ig.ColorGui("#545454", 196, 1);
            this.line.hook.transitions = {
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
            this.line.setPos(2, 17);
            this.addChildGui(this.line);
            this.content = new ig.GuiElementBase;
            this.addChildGui(this.content);
            this.doStateTransition("HIDDEN", true);
            this.hook.anim.targetState = null
        },

        show: function (button, title, description, annotation, descType) {
            var pos = button.hook.pos,
                x = pos.x + button.hook.size.x + 1;
            x >= ig.system.width / 2 + 85 && (x = pos.x - 200 - 1);
            var y = pos.y;
            button.hook.size.y < 30 && (y = y + button.hook.size.y);
            var width = 200,
                height = 100;
            this.content.removeAllChildren();
            if (descType == "buff") {
                this.content.hook.size.x = 200;
                this.title.doStateTransition("HIDDEN", true);
                this.description.doStateTransition("HIDDEN", true);
                this.line.doStateTransition("HIDDEN", true);
                (title = sc.inventory.getItem(sc.menu.buffID)) || (title = sc.inventory.getItem(sc.trade.buffID));
                description = title.stats;
                var stats = description.length;
                for (title = 0; stats--;) {
                    var change = sc.STAT_CHANGE_SETTINGS[description[stats]];
                    if (change.type.key != "heal") {
                        var entry = new sc.HelpBuffEntry(change, stats, description.length);
                        entry.setPos(0, title);
                        title = title + entry.hook.size.y;
                        this.content.addChildGui(entry)
                    }
                }
                width = 398;
                height = title
            } else if (descType == "levels") {
                this.description.doStateTransition("HIDDEN", true);
                this.title.doStateTransition("DEFAULT", true);
                this.line.doStateTransition("DEFAULT", true);
                this.title.setText("\\c[3]" + this.getText(title, annotation) + "\\c[0]");
                this.content.setPos(0, 18);
                this.content.hook.size.x = 150;
                var y = 0;
                var entry = new sc.HelpLevelEntry("green", sc.FONT_COLORS.GREEN);
                entry.setPos(5, y);
                this.content.addChildGui(entry);
                y = y + (entry.hook.size.y + 1);
                entry = new sc.HelpLevelEntry("white", 0);
                entry.setPos(5, y);
                this.content.addChildGui(entry);
                y = y + (entry.hook.size.y + 1);
                entry = new sc.HelpLevelEntry("orange", sc.FONT_COLORS.PURPLE);
                entry.setPos(5, y);
                this.content.addChildGui(entry);
                y = y + (entry.hook.size.y + 1);
                entry = new sc.HelpLevelEntry("red", sc.FONT_COLORS.RED);
                entry.setPos(5, y);
                this.content.addChildGui(entry);
                y = y + (entry.hook.size.y + 1);
                width = 204;
                height = y + 20;
                x = x - 4
            } else {
                this.title.doStateTransition("DEFAULT", true);
                this.description.doStateTransition("DEFAULT", true);
                this.line.doStateTransition("DEFAULT", true);
                this.title.setText("\\c[3]" + this.getText(title, annotation) + "\\c[0]");
                this.description.setText(this.getText(description, annotation));
                height = 18 + this.description.hook.size.y + 4
            }
            if (height != this.hook.size.y || width != this.hook.size.x) this.hook.currentStateName == "HIDDEN" && this.hook.hasTransition() ? this.doSizeTransition(width, height, 0.2, KEY_SPLINES.EASE) : this.setSize(width, height);
            y + height >= 310 && (y = pos.y - height);
            this.hook.currentStateName == "HIDDEN" && this.hook.hasTransition() ? this.doPosTranstition(x, y, 0.2, KEY_SPLINES.EASE) : this.hook.currentStateName == "DEFAULT" ? this.doPosTranstition(x, y, 0.2, KEY_SPLINES.EASE) : this.setPos(x, y);
            this.doStateTransition("DEFAULT")
        },

        hide: function () {
            this.doStateTransition("HIDDEN", false, false, null, 0.1)
        },

        getText: function (text, annotation) {
            return typeof text == "function" ? text(annotation) : ig.lang.get(text)
        }
    });

    sc.HelpLevelEntry = ig.GuiElementBase.extend({
        color: null,
        desc: null,

        init: function (colorKey, colorCode) {
            this.parent();
            this.color = new sc.TextGui("\\c[" + colorCode + "]" + ig.lang.get("sc.gui.menu.help.equip.colors." + colorKey) + "\\c[0]:", {
                font: sc.fontsystem.smallFont
            });
            this.addChildGui(this.color);
            this.desc = new sc.TextGui(ig.lang.get("sc.gui.menu.help.equip.colorDesc." + colorKey), {
                font: sc.fontsystem.smallFont,
                maxWidth: 160
            });
            this.desc.setPos(35, 0);
            this.addChildGui(this.desc);
            this.hook.size.y = Math.max(this.desc.hook.size.y, this.color.hook.size.y)
        }
    });

    sc.HelpBuffEntry = ig.GuiElementBase.extend({
        icon: null,
        statName: null,
        description: null,

        init: function (change, index, total) {
            this.parent();
            this.icon = new sc.TextGui("\\i[" + change.icon + "]\\i[" + change.grade + "]", {
                font: sc.fontsystem.tinyFont
            });
            this.icon.setPos(2, 2);
            this.addChildGui(this.icon);
            var statName = this.getStatName(change.type, change.change),
                statName = change.negative ? statName + (" \\c[1]- " + -1 * this.getStatValue(change.type, change.value, change.change) + "%\\c[0]") : statName + (" \\c[2]+ " + this.getStatValue(change.type, change.value, change.change) + "%\\c[0]");
            this.statName = new sc.TextGui(statName, {
                font: sc.fontsystem.smallFont
            });
            this.statName.setPos(19, 0);
            this.addChildGui(this.statName);
            var arrow = new sc.TextGui("\\i[insetArrow]", {
                font: sc.fontsystem.smallFont
            });
            arrow.setPos(2, 12);
            this.addChildGui(arrow);
            this.description = new sc.TextGui(this.getStatName(change.type, change.change, true), {
                font: sc.fontsystem.smallFont,
                maxWidth: 378
            });
            this.description.setPos(19, 11);
            this.addChildGui(this.description);
            this.setSize(400, 11 + this.description.hook.size.y);
            if (index != 0) {
                var divider = new ig.ColorGui("#545454", 400, 1);
                divider.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_BOTTOM);
                this.addChildGui(divider);
                this.hook.size.y = this.hook.size.y + 1
            }
        },

        getStatName: function (type, changeType, isDescription) {
            var key = "param";
            if (changeType == sc.STAT_CHANGE_TYPE.STATS)
                if (type.key == "elemFactor") switch (type.index) {
                    case 0:
                        key = "heat";
                        break;
                    case 1:
                        key = "cold";
                        break;
                    case 2:
                        key = "shock";
                        break;
                    case 3:
                        key = "wave"
                } else type.key == "hp" ? key = "maxhp" : type.key == "attack" ? key = "atk" : type.key == "defense" ? key = "def" : type.key == "focus" && (key = "foc");
                else if (changeType == sc.STAT_CHANGE_TYPE.MODIFIER) key = (!isDescription ? "modifier." : "") + type.key;
            else if (changeType == sc.STAT_CHANGE_TYPE.HEAL) return "ERROR ERROR";
            return ig.lang.get("sc.gui.menu.equip." + (isDescription ? "descriptions." : "") + key)
        },

        getStatValue: function (type, value, changeType) {
            changeType == sc.STAT_CHANGE_TYPE.STATS && (value = type.key == "elemFactor" ? (value - 1) * -1 : value - 1);
            return Math.round(value * 100)
        }
    })
});
ig.baked = !0;

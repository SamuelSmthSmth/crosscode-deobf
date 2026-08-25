ig.module("game.feature.gui.screen.credits-screen").requires("impact.feature.gui.gui").defines(function() {
    ig.GUI.CreditsScreen = ig.GuiElementBase.extend({
        _wm: new ig.Config({
            width: 200,
            attributes: {
                variable: {
                    _type: "VarName",
                    _info: "Variable that will be set to true when the credits are finished"
                }
            },
            label: function() {
                return "<b>Credits</b> and set <b>" + this.variable + "</b> to true"
            }
        }),
        credits: {
            ideaConcept: {
                title: "sc.gui.credits.ideaConcept",
                names: ["Felix 'Lachsen' Klein", "Stefan 'R.D.' Lange"]
            },
            mainProgramming: {
                title: "sc.gui.credits.programming",
                names: ["Felix 'Lachsen' Klein", "Stefan 'R.D.' Lange"]
            },
            graphics: {
                title: "sc.gui.credits.spriteart",
                names: ["Felix 'Lachsen' Klein", "Thomas 'T-Free' Fr\u00f6se", "Martina Brodehl", "Daniel 'The_question' Tillmann"]
            },
            conceptart: {
                title: "sc.gui.credits.conceptart",
                names: ["Fabrice 'Frece' Magdanz", "Solacy", "Felix 'Lachsen' Klein", "Stefan 'R.D.' Lange"]
            },
            leveldesign: {
                title: "sc.gui.credits.leveldesign",
                names: ["Stefan 'R.D.' Lange", "Henning 'GFl\u00fcgel' Hartmann", "Felix 'Lachsen' Klein"]
            },
            sound: {
                title: "sc.gui.credits.sound",
                names: ["Florian 'Teflo' Valentin Valerius Ben \n Abdeslam Ben Modeslam Ben Omar Mohammed Abdeslam", "Airon", "Deniz 'Intero' Akbulut"]
            },
            music: {
                title: "sc.gui.credits.music",
                names: ["Deniz 'Intero' Akbulut "]
            },
            betatesters: {
                title: "sc.gui.credits.betatesters",
                names: ["Jens Meisters", "Stefan Links", "Lobby", "Maximilian Malek", "ChronoMoogle", "IHeartPieGaming"]
            },
            thanks: {
                title: "sc.gui.credits.thanks",
                names: ["Anna M. Geudert - Lead Mental Support", "Josephine Rettig - Cubic Environment Architect", "Itaju - High-Level Complaining",
                    "FamilyJules7X - Musical Coffee Substitute", "FlareShard", "Steven Sch\u00e4fer", "That guy named Steve", "Friends and Family", "Our Supporters and Fans (You are great!)"
                ]
            }
        },
        timeLine: [],
        timer: 0,
        timeLineIndex: 0,
        done: false,
        startCreditsUpdate: false,
        variable: null,
        transitions: {
            DEFAULT: {
                state: {},
                time: 0,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0
                },
                time: 0,
                timeFunction: KEY_SPLINES.LINEAR
            },
            ROLL: {
                state: {
                    offsetY: 0
                },
                time: 0,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        logoGui: null,
        init: function(b) {
            this.parent();
            this.hook.zIndex =
                80;
            this.hook.size.x = ig.system.width;
            this.hook.size.y = ig.system.height;
            this.variable = b.variable;
            var a = b = 0,
                d;
            for (d in this.credits) {
                var c = this.credits[d],
                    e = new sc.TextGui(ig.lang.get(c.title), {
                        speed: ig.TextBlock.SPEED.IMMEDIATE
                    });
                e.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
                e.hook.transitions = {
                    HIDDEN: {
                        state: {
                            scaleY: 0
                        },
                        time: 0,
                        timeFunction: KEY_SPLINES.LINEAR
                    },
                    DEFAULT: {
                        state: {
                            scaleY: 1
                        },
                        time: 0.7,
                        timeFunction: KEY_SPLINES.LINEAR
                    }
                };
                e.hook.pos.y = b + ig.system.height;
                e.doStateTransition("HIDDEN", true);
                this.addChildGui(e);
                this.timeLine[a] = {};
                this.timeLine[a].gui = e;
                this.timeLine[a].time = b / 35 + 3;
                a++;
                var f = new ig.ColorGui("#989898", e.hook.size.x + 10, 1);
                f.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
                f.hook.transitions = {
                    HIDDEN: {
                        state: {
                            scaleX: 0
                        },
                        time: 0,
                        timeFunction: KEY_SPLINES.LINEAR
                    },
                    DEFAULT: {
                        state: {
                            scaleX: 1
                        },
                        time: 1,
                        timeFunction: KEY_SPLINES.EASE_OUT
                    }
                };
                f.doStateTransition("HIDDEN", true);
                b = b + (3 + e.hook.size.y);
                f.hook.pos.y = b + ig.system.height;
                this.addChildGui(f);
                b = b + 4;
                this.timeLine[a] = {};
                this.timeLine[a].gui =
                    f;
                this.timeLine[a].time = b / 35 + 3;
                a++;
                for (e = 0; e < c.names.length; e++) {
                    d = c.names[e].indexOf("sc.gui.credits") == 0 ? ig.lang.get(c.names[e]) : c.names[e];
                    f = new sc.TextGui(d, {
                        speed: ig.TextBlock.SPEED.IMMEDIATE,
                        textAlign: ig.Font.ALIGN.CENTER,
                        linePadding: 0
                    });
                    f.hook.transitions = {
                        HIDDEN: {
                            state: {
                                alpha: 0
                            },
                            time: 0,
                            timeFunction: KEY_SPLINES.LINEAR
                        },
                        DEFAULT: {
                            state: {
                                alpha: 1
                            },
                            time: 2,
                            timeFunction: KEY_SPLINES.LINEAR
                        }
                    };
                    f.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
                    f.doStateTransition("HIDDEN", true);
                    f.hook.pos.y = b + ig.system.height;
                    this.addChildGui(f);
                    b = b + (f.hook.size.y + 2);
                    this.timeLine[a] = {};
                    this.timeLine[a].gui = f;
                    this.timeLine[a].time = b / 35 + 3;
                    a++
                }
                b = b + 105
            }
            b = b + ig.system.height;
            this.hook.transitions.ROLL.state.offsetY = -b;
            this.hook.transitions.ROLL.time = b / 35;
            d = new ig.ParallaxGui({
                parallax: "logo"
            }, this._logoDone.bind(this));
            d.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.addChildGui(d);
            this.logoGui = d
        },
        clearCached: function() {
            this.logoGui.clearCached()
        },
        onAttach: function() {
            this.logoGui.start(true)
        },
        update: function() {
            if (this.startCreditsUpdate)
                for (this.timer =
                    this.timer + ig.system.actualTick; this.timeLineIndex < this.timeLine.length && this.timeLine[this.timeLineIndex].time <= this.timer;) {
                    this.timeLine[this.timeLineIndex].gui.doStateTransition("DEFAULT");
                    this.timeLineIndex++
                }
        },
        _logoDone: function() {
            this.startCreditsUpdate = true;
            this.doStateTransition("ROLL", false, true, this._setVar.bind(this))
        },
        _setVar: function() {
            this.variable && ig.vars.set(this.variable, true)
        }
    })
});
ig.baked = !0;

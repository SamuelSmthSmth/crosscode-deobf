ig.module("game.feature.msg.msg-steps").requires("impact.base.action", "impact.base.event", "game.feature.msg.message-model", "game.feature.character.character", "game.feature.gui.widget.demo-stats", "game.feature.gui.widget.demo-highscore", "game.feature.msg.gui.dream-msg").defines(function() {
    ig.EVENT_STEP.SHOW_MSG = ig.EventStepBase.extend({
        person: null,
        charExpression: null,
        message: null,
        autoContinue: false,
        hiCount: 0,
        _wm: new ig.Config({
            attributes: {
                person: {
                    _type: "PersonExpression",
                    _info: "Talking person"
                },
                message: {
                    _type: "LangLabel",
                    _info: "Message to display",
                    _large: true
                },
                autoContinue: {
                    _type: "Boolean",
                    _info: "Automatically continue after message"
                }
            },
            label: function() {
                return "<em>" + wmPrint("PersonExpression", this.person) + "</em>: <i>" + wmPrint("LangLabel", this.message) + "</i>" + (this.autoContinue ? ", <i>autoContinue</i>" : "")
            }
        }),
        init: function(a) {
            this.person = a.person.person;
            this.charExpression = new sc.CharacterExpression(a.person.person, a.person.expression);
            this.message = new ig.LangLabel(a.message);
            this.autoContinue = a.autoContinue || false;
            ig.langEdit && ig.langEdit.submitMap("MSG " + this.person, this.message);
            if (this.person == "main.lea" && a.message && a.message.en_US) this.hiCount = (this.hiCount = a.message.en_US.match(/hi[.!?]/gi)) ? this.hiCount.length : 0
        },
        clearCached: function() {
            this.charExpression.decreaseRef()
        },
        start: function() {
            this.hiCount && sc.stats.addMap("misc", "hiCount", this.hiCount || 0);
            sc.model.message.setExpression(this.person, this.charExpression);
            sc.model.message.showMessage(this.person, this.message, this.autoContinue || this._nextStep &&
                this._nextStep instanceof ig.EVENT_STEP.SHOW_CHOICE);
            ig.langEdit && ig.langEdit.submitRecent("MSG " + this.person, this.message)
        },
        run: function() {
            return !sc.model.message.isBlocking()
        }
    });
    ig.LANG_CONTEXT.SHOW_MSG = function(a) {
        var b = "MSG[";
        a.person && (b = b + (a.person.person + ">" + a.person.expression));
        return b + "]"
    };
    ig.EVENT_STEP.RING_PRIVATE_MSG = ig.EventStepBase.extend({
        outgoing: false,
        _wm: new ig.Config({
            attributes: {
                outgoing: {
                    _type: "Boolean",
                    _info: "If true: this is an outgoing call"
                }
            }
        }),
        init: function(a) {
            this.outgoing =
                a.outgoing
        },
        start: function() {
            sc.model.message.ringPrivateMessage(this.outgoing)
        },
        run: function() {
            return !sc.model.message.isBlocking()
        }
    });
    ig.EVENT_STEP.START_PRIVATE_MSG = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function() {
            sc.model.message.isPrivateRing() ? sc.model.message.startPrivateMessage() : sc.model.message.ringPrivateMessage()
        },
        run: function() {
            if (!sc.model.message.isBlocking()) {
                if (!sc.model.message.isPrivateRing()) return true;
                sc.model.message.startPrivateMessage()
            }
            return false
        }
    });
    ig.EVENT_STEP.END_PRIVATE_MSG = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {
                skipSounds: {
                    _type: "Boolean",
                    _info: "If true: skip sounds"
                }
            }
        }),
        init: function(a) {
            this.skipSounds = a.skipSounds || false
        },
        start: function() {
            sc.model.message.endPrivateMessage(this.skipSounds)
        },
        run: function() {
            return !sc.model.message.isBlocking()
        }
    });
    ig.EVENT_STEP.SHOW_OFFSCREEN_MSG = ig.EventStepBase.extend({
        leftSide: null,
        message: null,
        autoContinue: false,
        _wm: new ig.Config({
            attributes: {
                side: {
                    _type: "String",
                    _info: "Side to display message at.",
                    _select: sc.MESSAGE_SIDES
                },
                message: {
                    _type: "LangLabel",
                    _info: "Message to display",
                    _large: true
                },
                autoContinue: {
                    _type: "Boolean",
                    _info: "Automaticallt continue after message"
                }
            },
            width: 400,
            label: function() {
                return "<em>OFFSCREEN (" + (this.side == "LEFT" ? "left" : "right") + ")</em>: <i>" + wmPrint("LangLabel", this.message) + "</i>" + (this.autoContinue ? ", <i>autoContinue</i>" : "")
            }
        }),
        init: function(a) {
            this.leftSide = a.side == "LEFT";
            this.message = new ig.LangLabel(a.message);
            this.autoContinue = a.autoContinue || false;
            ig.langEdit &&
                ig.langEdit.submitMap("MSG Offscreen", this.message)
        },
        start: function() {
            sc.model.message.showOffScreenMessage(this.leftSide, this.message, this.autoContinue || this._nextStep && this._nextStep instanceof ig.EVENT_STEP.SHOW_CHOICE);
            ig.langEdit && ig.langEdit.submitRecent("MSG Offscreen", this.message)
        },
        run: function() {
            return !sc.model.message.isBlocking()
        }
    });
    ig.EVENT_STEP.SHOW_CHOICE = ig.EventStepBase.extend({
        person: null,
        charExpression: null,
        columns: null,
        forceWidth: 0,
        options: [],
        branches: {},
        _wm: new ig.Config({
            attributes: {
                person: {
                    _type: "PersonExpression",
                    _info: "Talking person"
                },
                options: {
                    _type: "ChoiceOptions",
                    _info: "List of options",
                    _noLabel: true
                },
                columns: {
                    _type: "Integer",
                    _info: "Number of buttons columns.",
                    _optional: true,
                    _default: 2
                },
                forceWidth: {
                    _type: "Integer",
                    _info: "Override the default button width. NOTE: Buttons still get matched when a text is to large.",
                    _optional: true
                }
            },
            branchLabel: function(a) {
                return a == "_end" ? "END_SHOW_CHOICE" : this.options[a] ? "Choice: " + wmPrint("LangLabel", this.options[a].label) : "???"
            }
        }),
        init: function(a) {
            this.person = a.person &&
                a.person.person;
            if ((this.columns = a.columns) && this.columns < 1) this.columns = 1;
            this.forceWidth = a.forceWidth || 0;
            if (a.person) this.charExpression = new sc.CharacterExpression(a.person.person, a.person.expression);
            for (var a = a.options || [], b = 0; b < a.length; ++b) {
                this.options[b] = {
                    label: new ig.LangLabel(a[b].label),
                    activeCondition: new ig.VarCondition(a[b].activeCondition),
                    showCondition: new ig.VarCondition(a[b].showCondition),
                    stretch: a[b].stretch || false,
                    center: a[b].center || false
                };
                ig.langEdit && ig.langEdit.submitMap("Choice " +
                    b, this.options[b].label)
            }
        },
        clearCached: function() {
            this.charExpression && this.charExpression.decreaseRef()
        },
        start: function() {
            this.charExpression && sc.model.message.setExpression(this.person, this.charExpression);
            sc.model.message.showChoice(this.person, this.options, this.columns, this.forceWidth)
        },
        run: function() {
            return !sc.model.message.isBlocking()
        },
        getBranchNames: function() {
            for (var a = [], b = 0; b < this.options.length; ++b) a.push(b);
            return a
        },
        getNext: function() {
            return this.branches[sc.model.message.lastSelectedChoice] ||
                this._nextStep
        }
    });
    ig.EVENT_STEP.ADD_MSG_PERSON = ig.EventStepBase.extend({
        charExpression: null,
        side: 0,
        order: 0,
        clearSide: false,
        name: null,
        _wm: new ig.Config({
            attributes: {
                person: {
                    _type: "PersonExpression",
                    _info: "Person + Expression to add"
                },
                name: {
                    _type: "LangLabel",
                    _info: "Name to display under portrait if any",
                    _optional: true
                },
                side: {
                    _type: "String",
                    _info: "Side to display Person at.",
                    _select: sc.MESSAGE_SIDES
                },
                order: {
                    _type: "Number",
                    _info: "Determines the order in which people are displayed on one side. LOWER values are in FRONT"
                },
                clearSide: {
                    _type: "Boolean",
                    _info: "Clear the side before adding the person"
                }
            }
        }),
        init: function(a) {
            this.charExpression = new sc.CharacterExpression(a.person.person, a.person.expression);
            this.side = sc.MESSAGE_SIDES[a.side];
            this.order = a.order;
            this.clearSide = a.clearSide;
            if (a.name) this.name = new ig.LangLabel(a.name)
        },
        clearCached: function() {
            this.charExpression.decreaseRef()
        },
        start: function() {
            this.clearSide && sc.model.message.clearSide(this.side);
            sc.model.message.addPerson(this.charExpression, this.side, this.order,
                this.name)
        }
    });
    ig.EVENT_STEP.REMOVE_MSG_PERSON = ig.EventStepBase.extend({
        person: null,
        _wm: new ig.Config({
            attributes: {
                person: {
                    _type: "Character",
                    _info: "Person to remove"
                }
            }
        }),
        init: function(a) {
            this.person = a.person
        },
        start: function() {
            sc.model.message.removePerson(this.person)
        }
    });
    ig.EVENT_STEP.SET_MSG_EXPRESSION = ig.EventStepBase.extend({
        person: null,
        charExpression: null,
        _wm: new ig.Config({
            attributes: {
                person: {
                    _type: "PersonExpression",
                    _info: "Person + Expression to change"
                }
            }
        }),
        init: function(a) {
            this.person = a.person.person;
            this.charExpression = new sc.CharacterExpression(a.person.person, a.person.expression)
        },
        clearCached: function() {
            this.charExpression.decreaseRef()
        },
        start: function() {
            sc.model.message.setExpression(this.person, this.charExpression)
        }
    });
    ig.EVENT_STEP.CLEAR_MSG = ig.EventStepBase.extend({
        side: null,
        _wm: new ig.Config({
            attributes: {
                side: {
                    _type: "String",
                    _info: "Side to clear",
                    _select: sc.MESSAGE_SIDES_OR_ALL,
                    _default: "ALL"
                }
            }
        }),
        init: function(a) {
            this.side = sc.MESSAGE_SIDES_OR_ALL[a.side]
        },
        start: function() {
            sc.model.message.clearSide(this.side)
        }
    });
    ig.EVENT_STEP.SHOW_CENTER_MSG = ig.EventStepBase.extend({
        titleText: null,
        text: null,
        overMenu: null,
        _wm: new ig.Config({
            attributes: {
                titleText: {
                    _type: "LangLabel",
                    _info: "Title of Box"
                },
                text: {
                    _type: "LangLabel",
                    _info: "Message in Box",
                    _large: true
                },
                overMenu: {
                    _type: "Boolean",
                    _info: "Show over menu",
                    _optional: true
                }
            },
            width: 500
        }),
        init: function(a) {
            this.titleText = new ig.LangLabel(a.titleText);
            this.text = new ig.LangLabel(a.text);
            this.overMenu = a.overMenu || false;
            ig.langEdit && ig.langEdit.submitMap("Center MSG Title", this.titleText);
            ig.langEdit && ig.langEdit.submitMap("Center MSG Content", this.text)
        },
        start: function(a) {
            a.done = false;
            var b = new sc.CenterMsgBoxGui(this.titleText.toString() + "\n" + this.text.toString(), {
                maxWidth: 300,
                speed: ig.TextBlock.SPEED.FASTEST
            }, "black", 0.9, function() {
                a.done = true
            }, this.overMenu);
            ig.gui.addGuiElement(b);
            ig.langEdit && ig.langEdit.submitRecent("Center MSG Title", this.titleText);
            ig.langEdit && ig.langEdit.submitRecent("Center MSG Content", this.text)
        },
        run: function(a) {
            return a.done
        }
    });
    ig.EVENT_STEP.SHOW_DREAM_MSG =
        ig.EventStepBase.extend({
            titleText: null,
            text: null,
            time: 0,
            _wm: new ig.Config({
                attributes: {
                    text: {
                        _type: "LangLabel",
                        _info: "Message in Box",
                        _large: true
                    },
                    entity: {
                        _type: "Entity",
                        _info: "Entity the dream text will be displayed above or below. Text will be centered on screen if not specified",
                        _optional: true
                    },
                    posType: {
                        _type: "String",
                        _info: "Whether to display text above or below entity.",
                        _select: sc.DREAM_TEXT_POS_TYPE,
                        _default: "TOP"
                    },
                    offset: {
                        _type: "Vec2",
                        _info: "Offset added to position"
                    },
                    time: {
                        _type: "Number",
                        _info: "If set the message will stay on for the given amount of time",
                        _optional: true
                    },
                    smallFont: {
                        _type: "Boolean",
                        _info: "If true: use small font",
                        _optional: true
                    }
                },
                width: 500
            }),
            init: function(a) {
                this.text = new ig.LangLabel(a.text);
                ig.langEdit && ig.langEdit.submitMap("Dream Text", this.text);
                this.entity = a.entity;
                this.posType = sc.DREAM_TEXT_POS_TYPE[a.posType] || sc.DREAM_TEXT_POS_TYPE.TOP;
                this.offset = a.offset;
                this.time = a.time || 0;
                this.smallFont = a.smallFont || false
            },
            start: function(a, b) {
                a.timer = 0;
                var d = ig.Event.getEntity(this.entity,
                        b),
                    d = new sc.DreamMsgGui(d, this.posType, this.offset, this.text.toString(), this.time, {
                        maxWidth: 400,
                        speed: ig.TextBlock.SPEED.SLOW,
                        textAlign: ig.Font.ALIGN.CENTER,
                        font: this.smallFont ? sc.fontsystem.smallFont : sc.fontsystem.font
                    }, function() {
                        a.timer = 0.2
                    });
                ig.gui.addGuiElement(d);
                ig.langEdit && ig.langEdit.submitRecent("Dream Text", this.text)
            },
            run: function(a) {
                if (a.timer) {
                    a.timer = a.timer - ig.system.tick;
                    if (a.timer <= 0) return true
                }
                return false
            }
        });
    ig.ACTION_STEP.SHOW_DREAM_MSG = ig.ActionStepBase.extend({
        text: null,
        time: 0,
        _wm: new ig.Config({
            attributes: {
                text: {
                    _type: "LangLabel",
                    _info: "Message in Box",
                    _large: true
                },
                entity: {
                    _type: "Entity",
                    _info: "Entity the dream text will be displayed above or below. If not defined, will be displayed above action entity",
                    _optional: true
                },
                posType: {
                    _type: "String",
                    _info: "Whether to display text above or below entity.",
                    _select: sc.DREAM_TEXT_POS_TYPE,
                    _default: "TOP"
                },
                offset: {
                    _type: "Vec2",
                    _info: "Offset added to position"
                },
                time: {
                    _type: "Number",
                    _info: "If set the message will stay on for the given amount of time"
                }
            },
            width: 500
        }),
        init: function(a) {
            this.text = new ig.LangLabel(a.text);
            ig.langEdit && ig.langEdit.submitMap("Dream Text", this.text);
            this.entity = a.entity;
            this.posType = sc.DREAM_TEXT_POS_TYPE[a.posType] || sc.DREAM_TEXT_POS_TYPE.TOP;
            this.offset = a.offset;
            this.time = a.time || 1
        },
        start: function(a) {
            var b = ig.Event.getEntity(this.entity) || a,
                b = new sc.DreamMsgGui(b, this.posType, this.offset, this.text.toString(), this.time, {
                        maxWidth: 140,
                        speed: ig.TextBlock.SPEED.SLOW,
                        textAlign: ig.Font.ALIGN.CENTER,
                        font: sc.fontsystem.smallFont
                    },
                    null, true);
            b.hook.zIndex = -30;
            ig.gui.addGuiElement(b);
            ig.langEdit && ig.langEdit.submitRecent("Dream Text", this.text);
            a.addActionAttached(b);
            a.stepTimer = a.stepTimer + this.time
        },
        run: function(a) {
            return a.stepTimer <= 0
        }
    });
    ig.ACTION_STEP.CLEAR_DREAM_MSG = ig.ActionStepBase.extend({
        _wm: new ig.Config({
            attributes: {},
            width: 500
        }),
        init: function() {},
        start: function() {
            sc.model.message.clearDreamMessage()
        }
    });
    sc.TUTORIAL_START_TYPE = {
        TUTORIAL: {
            skippable: true,
            title: "sc.gui.bigChoice.tutorial.title",
            yes: "sc.gui.bigChoice.tutorial.yes",
            no: "sc.gui.bigChoice.tutorial.no"
        },
        GENERIC: {
            title: "sc.gui.bigChoice.generic.title",
            yes: "sc.gui.bigChoice.generic.yes",
            no: "sc.gui.bigChoice.generic.no"
        }
    };
    ig.EVENT_STEP.SHOW_TUTORIAL_START = ig.EventStepBase.extend({
        msgType: null,
        title: null,
        content: null,
        imageSrc: null,
        branches: {},
        _wm: new ig.Config({
            attributes: {
                msgType: {
                    _type: "String",
                    _info: "Type of Message",
                    _select: sc.TUTORIAL_START_TYPE,
                    _default: "TUTORIAL"
                },
                title: {
                    _type: "LangLabel",
                    _info: "Title of Toturial"
                },
                content: {
                    _type: "LangLabel",
                    _info: "Content of Tutorial",
                    _large: true
                },
                image: {
                    _type: "Image",
                    _info: "Image to be shown over content text",
                    _optional: true
                }
            },
            branchLabel: function(a) {
                switch (a) {
                    case "acceptStep":
                        return "on Accept";
                    case "cancelStep":
                        return "on Cancel";
                    case "_end":
                        return "Tutorial End"
                }
                return "???"
            },
            width: 500
        }),
        init: function(a) {
            this.msgType = sc.TUTORIAL_START_TYPE[a.msgType] || sc.TUTORIAL_START_TYPE.TUTORIAL;
            this.title = new ig.LangLabel(a.title);
            this.content = new ig.LangLabel(a.content);
            this.imageSrc = a.image;
            ig.langEdit && ig.langEdit.submitMap("Tutorial MSG Title",
                this.title);
            ig.langEdit && ig.langEdit.submitMap("Tutorial MSG Content", this.content)
        },
        start: function(a) {
            if (this.msgType.skippable && sc.options.get("skip-tutorials")) {
                a.done = true;
                a.accept = false
            } else {
                a.done = false;
                a.accept = false;
                var b = new sc.TutorialStartGui(this.msgType, this.title.toString(), this.content.toString(), this.imageSrc, function(b) {
                    a.done = true;
                    a.accept = b
                });
                ig.gui.addGuiElement(b);
                ig.langEdit && ig.langEdit.submitRecent("Tutorial MSG Title", this.title);
                ig.langEdit && ig.langEdit.submitRecent("Tutorial MSG Content",
                    this.content)
            }
        },
        run: function(a) {
            return a.done
        },
        getBranchNames: function() {
            return ["acceptStep", "cancelStep"]
        },
        getNext: function(a) {
            return a.accept ? this.branches.acceptStep ? this.branches.acceptStep : this._nextStep : this.branches.cancelStep ? this.branches.cancelStep : this._nextStep
        }
    });
    ig.EVENT_STEP.SHOW_MODAL_CHOICE = ig.EventStepBase.extend({
        text: null,
        options: [],
        branches: {},
        _wm: new ig.Config({
            attributes: {
                text: {
                    _type: "LangLabel",
                    _info: "Text of modal dialog"
                },
                options: {
                    _type: "ModalChoiceOptions",
                    _info: "All the options of the modal dialog"
                }
            },
            branchLabel: function(a) {
                return a == "_end" ? "END_MODAL_DIALOG_CHOICE" : this.options[a] ? "Choice: " + wmPrint("LangLabel", this.options[a].label) : "???"
            }
        }),
        init: function(a) {
            this.text = new ig.LangLabel(a.text);
            for (var a = a.options || [], b = 0; b < a.length; ++b) {
                this.options[b] = new ig.LangLabel(a[b].label);
                ig.langEdit && ig.langEdit.submitMap("Modal Choice " + b, this.options[b])
            }
        },
        start: function(a) {
            a.done = false;
            a.choice = null;
            sc.model.stopSkip();
            sc.model.skipBlock = true;
            sc.Dialogs.showChoiceDialog(this.text.toString(), sc.DIALOG_INFO_ICON.NONE,
                this.options,
                function(b) {
                    sc.model.skipBlock = false;
                    a.done = true;
                    a.choice = b.data
                })
        },
        run: function(a) {
            return a.done
        },
        getBranchNames: function() {
            for (var a = [], b = 0; b < this.options.length; ++b) a.push(b);
            return a
        },
        getNext: function(a) {
            return this.branches[a.choice] || this._nextStep
        }
    });
    ig.EVENT_STEP.SHOW_TUTORIAL_MSG = ig.EventStepBase.extend({
        pos: null,
        size: null,
        text: null,
        direction: null,
        connectPos: 0,
        _wm: new ig.Config({
            attributes: {
                text: {
                    _type: "LangLabel",
                    _info: "Tutorial Text description",
                    _large: true
                },
                pos: {
                    _type: "Vec2",
                    _info: "Marker Square position"
                },
                size: {
                    _type: "Vec2",
                    _info: "Marker Square size"
                },
                direction: {
                    _type: "String",
                    _info: "Direction to show text relative to marker square.",
                    _select: sc.TUT_BOX_POINTING_DIR
                },
                connectPos: {
                    _type: "Number",
                    _info: "Point where text line touches marker box. Between 0 to 1. 0= left corner, 1=right corner.",
                    _default: 0.5
                },
                stopTime: {
                    _type: "Boolean",
                    _info: "If true: Stop time while displaying the message"
                }
            },
            width: 500
        }),
        init: function(a) {
            this.text = new ig.LangLabel(a.text);
            this.pos = a.pos;
            this.size =
                a.size;
            this.direction = sc.TUT_BOX_POINTING_DIR[a.direction] || sc.TUT_BOX_POINTING_DIR.TOP_LEFT;
            this.connectPos = a.connectPos || 0;
            this.stopTime = a.stopTime || false
        },
        start: function(a) {
            a.done = false;
            var b = new sc.TutorialMarkerGui(this.pos.x, this.pos.y, this.size.x, this.size.y, this.text.toString(), this.direction, this.connectPos, this.stopTime, function() {
                a.done = true
            });
            ig.gui.addGuiElement(b)
        },
        run: function(a) {
            return a.done
        }
    });
    var b = {
            PLAYER: function(a) {
                ig.game.playerEntity.getAlignedPos(ig.ENTITY_ALIGN.CENTER, a)
            },
            CROSSHAIR: function(a) {
                var b = ig.game.playerEntity.gui.crosshair;
                b && b.getAlignedPos(ig.ENTITY_ALIGN.CENTER, a)
            },
            ENEMY: function(a) {
                for (var b = ig.game.shownEntities, d = b.length, g = null; d--;) {
                    var h = b[d];
                    if (h instanceof ig.ENTITY.Enemy && ig.EntityTools.isInScreen(h, -16)) {
                        g = h;
                        break
                    }
                }
                g = g || ig.game.playerEntity;
                g.getAlignedPos(ig.ENTITY_ALIGN.CENTER, a)
            }
        },
        a = Vec3.create(),
        d = Vec2.create();
    ig.EVENT_STEP.SHOW_TUTORIAL_PLAYER_MSG = ig.EventStepBase.extend({
        pos: null,
        size: null,
        text: null,
        direction: null,
        connectPos: 0,
        _wm: new ig.Config({
            attributes: {
                text: {
                    _type: "LangLabel",
                    _info: "Tutorial Text description",
                    _large: true
                },
                targetType: {
                    _type: "String",
                    _info: "Marker Square position",
                    _select: b
                },
                size: {
                    _type: "Vec2",
                    _info: "Marker Square size"
                },
                stopTime: {
                    _type: "Boolean",
                    _info: "If true: Stop time while displaying the message"
                }
            },
            width: 500
        }),
        init: function(a) {
            this.text = new ig.LangLabel(a.text);
            this.targetType = b[a.targetType] || b.PLAYER;
            this.size = a.size;
            this.stopTime = a.stopTime || false
        },
        start: function(b) {
            b.done = false;
            var e = this.text.toString();
            this.targetType(a);
            var f = ig.system.getScreenFromMapPos(d,
                    a.x, a.y - a.z),
                g = 0,
                g = f.x < ig.system.width / 2 ? f.y < ig.system.height / 2 ? sc.TUT_BOX_POINTING_DIR.BOTTOM_RIGHT : sc.TUT_BOX_POINTING_DIR.TOP_RIGHT : f.y < ig.system.height / 2 ? sc.TUT_BOX_POINTING_DIR.BOTTOM_LEFT : sc.TUT_BOX_POINTING_DIR.TOP_LEFT;
            f.x = f.x - this.size.x / 2;
            f.y = f.y - this.size.y / 2;
            f.x = Math.round(f.x);
            f.y = Math.round(f.y);
            e = new sc.TutorialMarkerGui(f.x, f.y, this.size.x, this.size.y, e, g, 0.5, this.stopTime, function() {
                b.done = true
            });
            ig.gui.addGuiElement(e)
        },
        run: function(a) {
            return a.done
        }
    });
    ig.EVENT_STEP.SHOW_DEMO_HIGHSCORE =
        ig.EventStepBase.extend({
            observatory: false,
            _wm: new ig.Config({
                attributes: {
                    observatory: {
                        _type: "Boolean",
                        _info: "True if this is for the observatory challenge.",
                        _default: false
                    }
                }
            }),
            init: function(a) {
                this.observatory = a.observatory || false
            },
            start: function(a) {
                a.done = false;
                var b = new sc.DemoHighscore(function() {
                    a.done = true
                }, this.observatory);
                ig.gui.addGuiElement(b)
            },
            run: function(a) {
                return a.done
            }
        });
    ig.EVENT_STEP.SHOW_DEMO_TIME = ig.EventStepBase.extend({
        observatory: false,
        _wm: new ig.Config({
            attributes: {
                observatory: {
                    _type: "Boolean",
                    _info: "True if this is for the observatory challenge.",
                    _default: false
                }
            }
        }),
        init: function(a) {
            this.observatory = a.observatory || false
        },
        start: function(a) {
            a.done = false;
            var b = new sc.DemoLastTime(function() {
                a.done = true
            }, this.observatory);
            ig.gui.addGuiElement(b)
        },
        run: function(a) {
            return a.done
        }
    });
    ig.EVENT_STEP.SHOW_GET_MSG = ig.EventStepBase.extend({
        text: null,
        track: null,
        wordLearned: false,
        _wm: new ig.Config({
            attributes: {
                msgType: {
                    _type: "String",
                    _info: "Type of get message",
                    _select: ["ACTIVATED", "OBTAINED", "REMOVED",
                        "ENEMY", "EXTENDED", "WORD", "FRIENDSHIP", "PARTY", "USED", "HAND_OVER", "RESET"
                    ]
                },
                object: {
                    _type: "LangLabel",
                    _info: "Object of get message"
                }
            },
            width: 500
        }),
        init: function(a) {
            var b = a.msgType;
            if (b) {
                if (b == "WORD") this.wordLearned = true;
                if (ig.lang) {
                    b = ig.lang.get("sc.gui.get-msg." + b);
                    a = (new ig.LangLabel(a.object)).toString();
                    this.text = ig.lang.grammarReplace(b, a, "\\i[<]" + a + "\\i[>]")
                }
            } else this.text = "UNKNOWN MSG TYPE";
            this.track = ig.bgm.loadTrack("ability-got")
        },
        clearCached: function() {
            this.track.clearCached()
        },
        start: function(a) {
            a.done =
                false;
            this.wordLearned && sc.stats.addMap("misc", "words", 1);
            var b = new sc.CenterMsgBoxGui(this.text, {
                maxWidth: 300,
                textAlign: ig.Font.ALIGN.CENTER,
                speed: ig.TextBlock.SPEED.FASTEST
            }, "white", 0.3, function() {
                a.done = true
            });
            b.setBoxOffset(0, -64);
            ig.gui.addGuiElement(b);
            ig.bgm.inbetween(this.track, 1, ig.BGM_SWITCH_MODE.MEDIUM)
        },
        run: function(a) {
            return a.done
        }
    });
    ig.EVENT_STEP.SHOW_SIDE_MSG = ig.EventStepBase.extend({
        charExpression: null,
        message: null,
        hiCount: 0,
        _wm: new ig.Config({
            attributes: {
                person: {
                    _type: "PersonExpression",
                    _info: "Person + Exporession of message"
                },
                message: {
                    _type: "LangLabel",
                    _info: "Message to display",
                    _large: true
                }
            },
            label: function() {
                return "<b>SHOW_SIDE_MSG</b> <em>" + wmPrint("PersonExpression", this.person) + "</em>: <i>" + wmPrint("LangLabel", this.message) + "</i>"
            }
        }),
        init: function(a) {
            this.charExpression = new sc.CharacterExpression(a.person.person, a.person.expression);
            this.message = new ig.LangLabel(a.message);
            ig.langEdit && ig.langEdit.submitMap("Side MSG " + this.charExpression.character.name, this.message);
            if (this.charExpression.character.name ==
                "main.lea" && a.message && a.message.en_US) this.hiCount = (this.hiCount = a.message.en_US.match(/hi[.!?]/gi)) ? this.hiCount.length : 0
        },
        clearCached: function() {
            this.charExpression.decreaseRef()
        },
        start: function() {
            this.hiCount && sc.stats.addMap("misc", "hiCount", this.hiCount || 0);
            ig.langEdit && ig.langEdit.submitRecent("Side MSG " + this.charExpression.character.name, this.message);
            sc.model.message.showSideMessage(this.charExpression, this.message)
        }
    });
    ig.LANG_CONTEXT.SHOW_SIDE_MSG = function(a) {
        var b = "SIDE MSG[";
        a.person &&
            (b = b + (a.person.person + ">" + a.person.expression));
        return b + "]"
    };
    ig.EVENT_STEP.CLEAR_SIDE_MSG = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function() {
            sc.model.message.clearSideMessages()
        }
    });
    ig.EVENT_STEP.SHOW_BOARD_MSG = ig.EventStepBase.extend({
        text: null,
        title: null,
        center: null,
        _wm: new ig.Config({
            attributes: {
                text: {
                    _type: "LangLabel",
                    _info: "Text to display.",
                    _large: true
                },
                center: {
                    _type: "Boolean",
                    _info: "Center the text."
                },
                side: {
                    _type: "String",
                    _info: "If defined: moved board message to side of screen, allowing to display persons in parallel",
                    _select: sc.MESSAGE_SIDES,
                    _optional: true
                },
                autoContinue: {
                    _type: "Boolean",
                    _info: "Automatically continue after message"
                }
            },
            width: 600
        }),
        init: function(a) {
            this.text = new ig.LangLabel(a.text);
            this.center = a.center;
            this.side = sc.MESSAGE_SIDES[a.side] || null;
            this.autoContinue = a.autoContinue || false;
            ig.langEdit && ig.langEdit.submitMap("BOARD MSG TEXT", this.text)
        },
        start: function() {
            sc.model.message.showBoardMessage(this.text, this.center, this.side, this.autoContinue);
            ig.langEdit && ig.langEdit.submitRecent("BOARD MSG TEXT",
                this.text)
        },
        run: function() {
            return !sc.model.message.isBlocking()
        }
    });
    ig.LANG_CONTEXT.SHOW_BOARD_MSG = function() {
        return "BOARD_MSG"
    };
    ig.EVENT_STEP.CLEAR_BOARD_MSG = ig.EventStepBase.extend({
        _wm: new ig.Config({
            attributes: {}
        }),
        init: function() {},
        start: function() {
            sc.model.message.clearBoardMsg()
        }
    });
    ig.EVENT_STEP.SET_AUTO_SCRIPT = ig.EventStepBase.extend({
        value: null,
        _wm: new ig.Config({
            attributes: {
                value: {
                    _type: "Boolean",
                    _info: "If true: enable auto script (will automatically continue messages"
                }
            }
        }),
        init: function(a) {
            this.value =
                a.value
        },
        start: function() {
            sc.model.message.autoScript = this.value
        }
    })
});
ig.baked = !0;

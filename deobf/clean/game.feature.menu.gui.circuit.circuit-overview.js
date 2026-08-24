/**
 * game.feature.menu.gui.circuit.circuit-overview
 * ==============================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.circuit.circuit-overview")`.
 *
 * The overview screen of the circuit menu: the five element skill trees
 * arranged around the center, each rendered into an image-atlas fragment.
 * `sc.CircuitOverviewMenu` hosts the trees and pre-draws their panels/nodes
 * into buffers; `.Tree` animates the "first time" reveal of a tree;
 * `.FocusOverlay` is the invisible focus button for each tree;
 * `sc.CircuitMenuButtonGroup` handles the cross-shaped button traversal.
 * The module-level TREE_* configs hold each element tree's overview layout.
 */
ig.module("game.feature.menu.gui.circuit.circuit-overview")
    .requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.circuit.circuit-misc", "game.feature.combat.model.combat-params")
    .defines(function () {

    var dirVec = Vec2.createC(0, 0),
        savedDir = Vec2.createC(0, 0),
        pos = Vec2.createC(0, 0),
        spritePos = Vec2.createC(0, 0),
        QUARTER_TURN = Math.PI / 2,
        EIGHTH_TURN = Math.PI / 4,
        THREE_EIGHTH_TURN = QUARTER_TURN + EIGHTH_TURN;

    sc.CIRCUIT_VAR_KEY = "menu.circuit.start.";

    var TREE_NEUTRAL = {
            element: sc.ELEMENT.NEUTRAL,
            startDir: {
                x: 0,
                y: -1
            },
            node: {
                x: 44,
                y: 44
            },
            base: {
                x: 0,
                y: 0
            },
            rotation: 0,
            panels: [{
                x: 24,
                y: 1
            }, {
                x: 1,
                y: 24
            }, {
                x: 47,
                y: 24
            }, {
                x: 24,
                y: 47
            }]
        },
        TREE_HEAT = {
            element: sc.ELEMENT.HEAT,
            rotation: QUARTER_TURN,
            base: {
                x: 0,
                y: -149
            },
            startDir: {
                x: 1,
                y: 0
            },
            node: {
                x: 72,
                y: 21
            },
            panels: [{
                x: 29,
                y: 1
            }, {
                x: 75,
                y: 1
            }, {
                x: 6,
                y: 24
            }, {
                x: 52,
                y: 24
            }, {
                x: 98,
                y: 24
            }, {
                x: 29,
                y: 47
            }, {
                x: 75,
                y: 47
            }, {
                x: 52,
                y: 70
            }]
        },
        TREE_COLD = {
            element: sc.ELEMENT.COLD,
            rotation: -QUARTER_TURN,
            base: {
                x: -127,
                y: 0
            },
            startDir: {
                x: -1,
                y: 0
            },
            node: {
                x: 72,
                y: 101
            },
            panels: [{
                x: 52,
                y: 12
            }, {
                x: 29,
                y: 35
            }, {
                x: 75,
                y: 35
            }, {
                x: 6,
                y: 58
            }, {
                x: 52,
                y: 58
            }, {
                x: 98,
                y: 58
            }, {
                x: 29,
                y: 81
            }, {
                x: 75,
                y: 81
            }]
        },
        TREE_SHOCK = {
            rotation: 0,
            element: sc.ELEMENT.SHOCK,
            base: {
                x: 0,
                y: 0
            },
            startDir: {
                x: 0,
                y: -1
            },
            node: {
                x: 21,
                y: 72
            },
            panels: [{
                x: 1,
                y: 29
            }, {
                x: 1,
                y: 75
            }, {
                x: 24,
                y: 6
            }, {
                x: 24,
                y: 52
            }, {
                x: 24,
                y: 98
            }, {
                x: 47,
                y: 29
            }, {
                x: 47,
                y: 75
            }, {
                x: 70,
                y: 52
            }]
        },
        TREE_WAVE = {
            element: sc.ELEMENT.WAVE,
            rotation: Math.PI,
            base: {
                x: -127,
                y: -149
            },
            startDir: {
                x: 0,
                y: 1
            },
            node: {
                x: 101,
                y: 72
            },
            panels: [{
                x: 12,
                y: 52
            }, {
                x: 35,
                y: 29
            }, {
                x: 35,
                y: 75
            }, {
                x: 58,
                y: 6
            }, {
                x: 58,
                y: 52
            }, {
                x: 58,
                y: 98
            }, {
                x: 81,
                y: 29
            }, {
                x: 81,
                y: 75
            }]
        };

    sc.CircuitMenuButtonGroup = ig.ButtonGroup.extend({
        sounds: {
            focus: new ig.Sound("media/sound/menu/menu-hover.ogg", 0.9)
        },
        repeater: null,

        init: function () {
            this.parent();
            this.repeater = new ig.PressRepeater
        },

        setButtons: function (centerButton, downButton, upButton, rightButton, leftButton) {
            this.addFocusGui(centerButton, 1, 1);
            this.addFocusGui(downButton, 1, 2);
            this.addFocusGui(upButton, 1, 0);
            this.addFocusGui(rightButton, 2, 1);
            this.addFocusGui(leftButton, 0, 1);
            this.setCurrentFocus(1, 1);
            centerButton.focusable && (ig.input.mouseGuiActive ? this.setCurrentFocus(1, 1) : this.focusCurrentButton(1, 1, true, true, false, true))
        },

        isNonMouseMenuInput: function () {
            return sc.control.menuConfirm() || sc.control.rightDown() || sc.control.leftDown() || sc.control.downDown() || sc.control.upDown()
        },

        doButtonTraversal: function (blocked) {
            sc.control.menuBack() && this.invokeBackButton();
            var direction = this.getRepeaterValue();
            if (!blocked) {
                sc.control.menuConfirm() && this.invokeCurrentButton();
                var newX = 0,
                    newY = 0,
                    moved = false;
                if (direction == "left") {
                    newX = Math.max(0, this.current.x - 1);
                    newY = this.current.y;
                    if (newX == this.current.x) return;
                    if (newY == 0 || newY == 2) newY = 1;
                    moved = true
                } else if (direction == "right") {
                    newX = Math.min(2, this.current.x + 1);
                    newY = this.current.y;
                    if (newX == this.current.x) return;
                    if (newY == 0 || newY == 2) newY = 1;
                    moved = true
                }
                if (direction == "up") {
                    newX = this.current.x;
                    newY = Math.max(0, this.current.y - 1);
                    if (newY == this.current.y) return;
                    if (newX == 0 || newX == 2) newX = 1;
                    moved = true
                } else if (direction == "down") {
                    newX = this.current.x;
                    newY = Math.min(2, this.current.y + 1);
                    if (newY == this.current.y) return;
                    if (newX == 0 || newX == 2) newX = 1;
                    moved = true
                }
                moved && this.elements[newX][newY].focusable && this.focusCurrentButton(newX, newY)
            }
        },

        getRepeaterValue: function () {
            sc.control.rightDown() ? this.repeater.setDown("right") : sc.control.leftDown() ? this.repeater.setDown("left") : sc.control.downDown() ? this.repeater.setDown("down") : sc.control.upDown() && this.repeater.setDown("up");
            return this.repeater.getPressed()
        },

        activate: function () {
            this.parent();
            this.getRepeaterValue()
        }
    });

    sc.CircuitOverviewMenu = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/circuit.png"),
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
            },
            SCALE: {
                state: {
                    alpha: 0,
                    scaleX: 1.5,
                    scaleY: 1.5
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        buffers: [],
        elements: [],
        buttons: [],
        buttonGroup: null,

        init: function () {
            this.parent();
            this.hook.size.x = ig.system.width;
            this.hook.size.y = ig.system.height;
            this.hook.pivot.x = Math.floor(ig.system.width / 2);
            this.hook.pivot.y = Math.floor(ig.system.height / 2);
            this.buttonGroup = new sc.CircuitMenuButtonGroup;
            this.buttonGroup.addSelectionCallback(function (entry) {
                sc.menu.setInfoText(entry.data)
            });
            this.buttonGroup.setMouseFocusLostCallback(function () {
                sc.menu.setInfoText("", true)
            });
            this.doStateTransition("DEFAULT", true)
        },

        onAttach: function () {
            this._createTrees();
            for (var index = this.buttons.length; index--;) {
                if (ig.vars.get(sc.CIRCUIT_VAR_KEY + "" + index)) {
                    this.buttons[index].focusable = true
                }
            }
            this.buttonGroup.setButtons(this.buttons[0], this.buttons[1], this.buttons[2], this.buttons[3], this.buttons[4])
        },

        onFirstTimeAnimationDone: function (element) {
            this.buttons[element].focusable = true;
            element == 0 && (ig.input.mouseGuiActive || this.buttonGroup.sounds.focus.play())
        },

        onDetach: function () {
            this.buffers[TREE_NEUTRAL.element].release();
            this.buffers[TREE_HEAT.element].release();
            this.buffers[TREE_COLD.element].release();
            this.buffers[TREE_SHOCK.element].release();
            this.buffers[TREE_WAVE.element].release()
        },

        modelChanged: function (model, event) {
            if (model == sc.model.player && (event == sc.PLAYER_MSG.SKILL_CHANGED || event == sc.PLAYER_MSG.SKILL_BRANCH_SWAP)) {
                if (sc.menu.currentSkillTree == -1) {
                    for (var index = this.elements.length; index--;) {
                        this.updateBuffer(index)
                    }
                } else {
                    this.elements[sc.menu.currentSkillTree].needsUpdate = true
                }
            }
        },

        addObservers: function () {
            sc.Model.addObserver(sc.model.player, this)
        },

        removeObservers: function () {
            sc.Model.removeObserver(sc.model.player, this)
        },

        showMenu: function () {
            for (var index = this.elements.length; index--;) {
                this.elements[index].show();
                this.buttons[index].doStateTransition("DEFAULT", false, false, null, 0.1)
            }
            ig.interact.setBlockDelay(0.2);
            sc.menu.buttonInteract.pushButtonGroup(this.buttonGroup)
        },

        exitMenu: function (instant) {
            sc.menu.buttonInteract.removeButtonGroup(this.buttonGroup);
            for (var index = this.elements.length; index--;) {
                this.elements[index].doStateTransition("HIDDEN", instant);
                this.buttons[index].doStateTransition("HIDDEN", instant)
            }
        },

        enterDetailView: function () {
            this.doStateTransition("SCALE")
        },

        leaveDetailView: function () {
            for (var index = this.elements.length; index--;) {
                if (this.elements[index].needsUpdate) {
                    this.updateBuffer(index);
                    this.elements[index].needsUpdate = false
                }
            }
            this.doStateTransition("DEFAULT");
            ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD && this.buttonGroup.regainFocusOnKeyboard();
            ig.interact.setBlockDelay(0.2)
        },

        updateAllBuffers: function () {
            for (var index = this.elements.length; index--;) {
                this.updateBuffer(index)
            }
        },

        updateBuffer: function (element) {
            this.elements[element].buffer = null;
            this.buffers[element].release();
            switch (element) {
                case sc.ELEMENT.NEUTRAL:
                    this.buffers[element] = ig.imageAtlas.getFragment(93, 93, function () {
                        this._preDrawTree(TREE_NEUTRAL)
                    }.bind(this));
                    break;
                case sc.ELEMENT.HEAT:
                    this.buffers[element] = ig.imageAtlas.getFragment(149, 127, function () {
                        this._preDrawTree(TREE_HEAT)
                    }.bind(this));
                    break;
                case sc.ELEMENT.COLD:
                    this.buffers[element] = ig.imageAtlas.getFragment(149, 127, function () {
                        this._preDrawTree(TREE_COLD)
                    }.bind(this));
                    break;
                case sc.ELEMENT.SHOCK:
                    this.buffers[element] = ig.imageAtlas.getFragment(127, 149, function () {
                        this._preDrawTree(TREE_SHOCK)
                    }.bind(this));
                    break;
                case sc.ELEMENT.WAVE:
                    this.buffers[element] = ig.imageAtlas.getFragment(127, 149, function () {
                        this._preDrawTree(TREE_WAVE)
                    }.bind(this))
            }
            this.elements[element].buffer = this.buffers[element]
        },

        _createTrees: function () {
            var neutral = TREE_NEUTRAL.element,
                heat = TREE_HEAT.element,
                cold = TREE_COLD.element,
                shock = TREE_SHOCK.element,
                wave = TREE_WAVE.element;
            this.buffers[neutral] = ig.imageAtlas.getFragment(93, 93, function () {
                this._preDrawTree(TREE_NEUTRAL)
            }.bind(this));
            this.buffers[heat] = ig.imageAtlas.getFragment(149, 127, function () {
                this._preDrawTree(TREE_HEAT)
            }.bind(this));
            this.buffers[cold] = ig.imageAtlas.getFragment(149, 127, function () {
                this._preDrawTree(TREE_COLD)
            }.bind(this));
            this.buffers[shock] = ig.imageAtlas.getFragment(127, 149, function () {
                this._preDrawTree(TREE_SHOCK)
            }.bind(this));
            this.buffers[wave] = ig.imageAtlas.getFragment(127, 149, function () {
                this._preDrawTree(TREE_WAVE)
            }.bind(this));
            var updater = this._updateBufferFromFirstTime.bind(this),
                done = this.onFirstTimeAnimationDone.bind(this);
            this.elements[neutral] = new sc.CircuitOverviewMenu.Tree(0, 0, this.buffers[neutral], neutral, updater, done);
            this.elements[heat] = new sc.CircuitOverviewMenu.Tree(0, 86, this.buffers[heat], heat, updater, done);
            this.elements[cold] = new sc.CircuitOverviewMenu.Tree(0, -86, this.buffers[cold], cold, updater, done);
            this.elements[shock] = new sc.CircuitOverviewMenu.Tree(86, 0, this.buffers[shock], shock, updater, done);
            this.elements[wave] = new sc.CircuitOverviewMenu.Tree(-86, 0, this.buffers[wave], wave, updater, done);
            this.addChildGui(this.elements[neutral]);
            this.addChildGui(this.elements[heat]);
            this.addChildGui(this.elements[cold]);
            this.addChildGui(this.elements[shock]);
            this.addChildGui(this.elements[wave]);
            this.buttons[neutral] = new sc.CircuitOverviewMenu.FocusOverlay(0, 0, this.buffers[neutral], neutral);
            this.buttons[heat] = new sc.CircuitOverviewMenu.FocusOverlay(0, 86, this.buffers[heat], heat);
            this.buttons[cold] = new sc.CircuitOverviewMenu.FocusOverlay(0, -86, this.buffers[cold], cold);
            this.buttons[shock] = new sc.CircuitOverviewMenu.FocusOverlay(86, 0, this.buffers[shock], shock);
            this.buttons[wave] = new sc.CircuitOverviewMenu.FocusOverlay(-86, 0, this.buffers[wave], wave);
            this.addChildGui(this.buttons[neutral]);
            this.addChildGui(this.buttons[heat]);
            this.addChildGui(this.buttons[cold]);
            this.addChildGui(this.buttons[shock]);
            this.addChildGui(this.buttons[wave])
        },

        _updateBufferFromFirstTime: function (element) {
            this.updateBuffer(element)
        },

        _preDrawTree: function (config) {
            var panelCount = config.panels.length,
                panelSpriteX = 80 + 48 * config.element;
            if (config.rotation != void 0) {
                if (config.rotation != 0) {
                    ig.system.context.save();
                    ig.system.context.rotate(config.rotation);
                    this.gfx.draw(config.base.x, config.base.y, 65, 160, 127, 149);
                    ig.system.context.restore()
                } else {
                    config.element == 0 ? this.gfx.draw(config.base.x, config.base.y, 392, 368, 93, 93) : this.gfx.draw(config.base.x, config.base.y, 65, 160, 127, 149)
                }
            }
            if (sc.model.player.getCore(config.element + 8) && ig.vars.get(sc.CIRCUIT_VAR_KEY + config.element) && sc.model.player.hasElement(config.element)) {
                for (; panelCount--;) {
                    this.gfx.draw(config.panels[panelCount].x, config.panels[panelCount].y, panelSpriteX, 112, 46, 46);
                    sc.menu.skillState == sc.MENU_SKILL_STATE.SWAP_BRANCHES && this.gfx.draw(config.panels[panelCount].x, config.panels[panelCount].y, 224 + config.element * 48, 320, 45, 45)
                }
                this.gfx.draw(config.node.x, config.node.y, config.element * 8, 304, 5, 5);
                this._preDrawTreeNodes(config.element, config.node.x + 2, config.node.y + 2, config.startDir.x, config.startDir.y)
            }
        },

        _preDrawTreeNodes: function (element, x, y, dirX, dirY) {
            var skills = sc.skilltree.getTree(element);
            pos.x = x;
            pos.y = y;
            dirVec.x = dirX;
            dirVec.y = dirY;
            for (var skill = null, index = 0; index < skills.length; index++) {
                skill = skills[index];
                if (!this.isEmpty(skill)) {
                    this._drawLine(pos.x, pos.y, dirX, dirY, skill, element);
                    this._preDrawTreeRecursive(element, skill, x, y, dirVec.x, dirVec.y)
                }
                this._rotate("CW_90", dirX, dirY);
                dirX = dirVec.x;
                dirY = dirVec.y
            }
        },

        _preDrawTreeRecursive: function (element, skill, x, y, dirX, dirY) {
            var isSlope = false;
            if (skill.orBranch) {
                var orBranch = skill.orBranch;
                this._rotate(skill.direction, dirX, dirY);
                isSlope = Math.abs(dirVec.x) == 1 && Math.abs(dirVec.y) == 1;
                x = x + ((isSlope ? 4 : 5) + skill.distance) * dirVec.x;
                y = y + ((isSlope ? 2 : 5) + skill.distance) * dirVec.y;
                savedDir.x = dirVec.x;
                savedDir.y = dirVec.y;
                this._rotate(orBranch.direction, dirVec.x, dirVec.y);
                if (isSlope) {
                    if (savedDir.x < 0 && dirVec.x == 0) {
                        x = x + 2;
                        y = y + (dirVec.y > 0 ? 2 : -2)
                    } else if (savedDir.x > 0 && dirVec.x == 0) {
                        x = x - 2;
                        y = y + (dirVec.y > 0 ? 2 : -2)
                    }
                }
                (isSlope = Math.abs(dirVec.x) == 1 && Math.abs(dirVec.y) == 1) && ig.error("orBranch can't be rendered with a slope direction.");
                this._drawOrBranchConnection(x, y, dirVec, element, false, orBranch);
                x = x + (isSlope ? 3 : 4) * dirVec.x;
                y = y + (isSlope ? 3 : 4) * dirVec.y;
                for (var index = 0; index < 3; index++) {
                    spritePos.x = 0 + element * 8;
                    spritePos.y = 256 + (sc.model.player.hasSkill(orBranch.left[index].uid) ? 8 : 0);
                    dirVec.x != 0 ? this.gfx.draw(x - 2, y - 2 + (dirVec.x > 0 ? -3 : 3), spritePos.x, spritePos.y, 5, 5) : this.gfx.draw(x - 2 + (dirVec.y < 0 ? -3 : 3), y - 2, spritePos.x, spritePos.y, 5, 5);
                    spritePos.y = 256 + (sc.model.player.hasSkill(orBranch.right[index].uid) ? 8 : 0);
                    dirVec.x != 0 ? this.gfx.draw(x - 2, y - 2 + (dirVec.x > 0 ? 3 : -3), spritePos.x, spritePos.y, 5, 5) : this.gfx.draw(x - 2 + (dirVec.y < 0 ? 3 : -3), y - 2, spritePos.x, spritePos.y, 5, 5);
                    x = x + (isSlope ? 3 : 5) * dirVec.x;
                    y = y + (isSlope ? 3 : 5) * dirVec.y
                }
                this._drawOrBranchConnection(x, y, dirVec, element, true, orBranch, skill);
                x = x - dirVec.x;
                y = y - dirVec.y
            } else {
                this._rotate(skill.direction, dirX, dirY);
                isSlope = Math.abs(dirVec.x) == 1 && Math.abs(dirVec.y) == 1;
                x = x + ((isSlope ? 3 : 5) + skill.distance) * dirVec.x;
                y = y + ((isSlope ? 3 : 5) + skill.distance) * dirVec.y;
                spritePos.x = 0 + element * 8;
                spritePos.y = 256 + (sc.model.player.hasSkill(skill.uid) ? 8 : 0);
                this.gfx.draw(x - Math.floor(2.5), y - Math.floor(2.5), spritePos.x, spritePos.y, 5, 5)
            }
            skill = skill.children;
            if (skill.length != 0) {
                isSlope = null;
                dirX = dirVec.x;
                dirY = dirVec.y;
                for (var childIndex = 0; childIndex < skill.length; childIndex++) {
                    var child = skill[childIndex];
                    if (!this.isEmpty(child)) {
                        this._drawLine(x, y, dirX, dirY, child, element);
                        this._preDrawTreeRecursive(element, child, x, y, dirX, dirY)
                    }
                }
            }
        },

        _drawLine: function (x, y, dirX, dirY, skill, element) {
            if (!(skill.distance <= 0)) {
                var hasSkill = false,
                    hasSkill = skill.orBranch ? sc.model.player.hasSkill(skill.orBranch.left[0].uid) || sc.model.player.hasSkill(skill.orBranch.right[0].uid) ? true : false : sc.model.player.hasSkill(skill.uid) ? true : false;
                this._rotate(skill.direction, dirX, dirY);
                var drawType = this._getDrawingDirection(dirVec);
                var ctx = ig.system.context;
                var distance = skill.distance;
                if (drawType == sc.LINE_DRAW_TYPE.HORZ) {
                    spritePos.x = element * 8;
                    spritePos.y = hasSkill ? 276 : 272;
                    this._drawLineStraightLine(dirVec.x > 0 ? x + 3 : x - 2 - (8 - (8 - distance)), y, distance)
                } else {
                    if (drawType == sc.LINE_DRAW_TYPE.VERT) {
                        spritePos.x = element * 8;
                        spritePos.y = hasSkill ? 276 : 272;
                        ctx.save();
                        ctx.translate((x + (dirVec.y > 0 ? 1 : 0)) * ig.system.scale, (y + (dirVec.y > 0 ? 3 : -2)) * ig.system.scale);
                        ctx.rotate(dirVec.y > 0 ? QUARTER_TURN : -QUARTER_TURN);
                        this._drawLineStraightLine(0, 0, distance)
                    } else {
                        spritePos.x = element * 8;
                        spritePos.y = hasSkill ? 288 : 280;
                        ctx.save();
                        ctx.translate(x * ig.system.scale, y * ig.system.scale);
                        ctx.scale(dirVec.x < 0 ? -1 : 1, dirVec.y < 0 ? -1 : 1);
                        this.gfx.draw(dirVec.x < 0 ? 1 : 2, dirVec.y < 0 ? 1 : 2, spritePos.x, spritePos.y, distance, distance)
                    }
                    ctx.restore()
                }
            }
        },

        _drawLineStraightLine: function (x, y, length) {
            if (length <= 8) {
                this.gfx.draw(x, y, spritePos.x, spritePos.y, length, 1)
            } else {
                for (var steps = Math.ceil(length / 8), seg = 8; steps--;) {
                    length < 8 && (seg = length);
                    this.gfx.draw(x, y, spritePos.x, spritePos.y, seg, 1);
                    x = x + 8;
                    length = Math.max(0, length - 8)
                }
            }
        },

        _drawOrBranchConnection: function (x, y, dirVec, element, flip, orBranch, skill) {
            var player = sc.model.player,
                hasLeft = player.hasSkill(orBranch.left[0].uid),
                hasRight = player.hasSkill(orBranch.right[0].uid),
                hasAny = hasLeft || hasRight;
            if (dirVec.x < 0 || dirVec.y < 0) {
                if (hasRight) {
                    hasLeft = true;
                    hasRight = false
                } else if (hasLeft) {
                    hasRight = true;
                    hasLeft = false
                }
            }
            var flipDown = false;
            hasRight && !hasLeft && (flipDown = true);
            var flipped = flip;
            if (dirVec.x < 0 || dirVec.y < 0) {
                flipped = !flipped
            }
            if (flip) {
                player.hasSkill(orBranch.left[2].uid);
                player.hasSkill(orBranch.right[2].uid);
                if (skill.children[0].orBranch) {
                    hasLeft = player.hasSkill(skill.children[0].orBranch.left[0].uid);
                    hasRight = player.hasSkill(skill.children[0].orBranch.right[0].uid);
                    hasAny = hasLeft || hasRight
                } else {
                    hasAny = player.hasSkill(skill.children[0].uid)
                }
            }
            dirVec.x != 0 ? this.gfx.draw(x - (dirVec.x < 0 ? 1 : 2), y - 3, element * 8 + (hasAny ? 4 : 0), 296, 4, 7, flipped, flipDown) : dirVec.y != 0 && this.gfx.draw(x - 3, y - (dirVec.y < 0 ? 1 : 2), 48, 256 + (element * 8 + (hasAny ? 4 : 0)), 7, 4, flipDown, flipped)
        },

        _rotate: function (direction, x, y) {
            dirVec.x = x;
            dirVec.y = y;
            switch (sc.SKILLS_DIRECTION[direction]) {
                case sc.SKILLS_DIRECTION.CW_45:
                    Vec2.rotate(dirVec, -EIGHTH_TURN);
                    dirVec.x = Math.round(dirVec.x);
                    dirVec.y = Math.round(dirVec.y);
                    break;
                case sc.SKILLS_DIRECTION.CCW_45:
                    Vec2.rotate(dirVec, EIGHTH_TURN);
                    dirVec.x = Math.round(dirVec.x);
                    dirVec.y = Math.round(dirVec.y);
                    break;
                case sc.SKILLS_DIRECTION.CW_90:
                    Vec2.rotate90CCW(dirVec);
                    break;
                case sc.SKILLS_DIRECTION.CCW_90:
                    Vec2.rotate90CW(dirVec);
                    break;
                case sc.SKILLS_DIRECTION.CW_135:
                    Vec2.rotate(dirVec, -THREE_EIGHTH_TURN);
                    dirVec.x = Math.round(dirVec.x);
                    dirVec.y = Math.round(dirVec.y);
                    break;
                case sc.SKILLS_DIRECTION.CCW_135:
                    Vec2.rotate(dirVec, THREE_EIGHTH_TURN);
                    dirVec.x = Math.round(dirVec.x);
                    dirVec.y = Math.round(dirVec.y)
            }
            return dirVec
        },

        _getDrawingDirection: function (vec) {
            if (vec.x == 0 && vec.y == 0) {
                ig.error("Can't get cardinal direction when x and y are zero! Direction: [x: %i, y: %i]", vec.x, vec.y);
                return -1
            }
            if (vec.x >= 0) {
                if (vec.y < 0 && vec.x == 0 || vec.y > 0 && vec.x == 0) return sc.LINE_DRAW_TYPE.VERT;
                if (vec.y == 0 && vec.x > 0) return sc.LINE_DRAW_TYPE.HORZ;
                if (vec.y < 0 && vec.x > 0 || vec.y > 0 && vec.x > 0) return sc.LINE_DRAW_TYPE.SLOPE
            } else {
                if (vec.y == 0 && vec.x < 0) return sc.LINE_DRAW_TYPE.HORZ;
                if (vec.y < 0 && vec.x < 0 || vec.y > 0 && vec.x < 0) return sc.LINE_DRAW_TYPE.SLOPE
            }
            return "If this return, you broke something horribly Bro."
        },

        isEmpty: function (obj) {
            for (var key in obj) return false;
            return true
        }
    });

    var OVERLAY_POSITIONS = {
        "0": {
            sx: 176,
            sy: 368,
            w: 92,
            h: 92,
            x: 1,
            y: 1
        },
        1: {
            sx: 272,
            sy: 368,
            w: 120,
            h: 149,
            x: 11,
            y: -11,
            rot: Math.PI / 2
        },
        2: {
            sx: 272,
            sy: 368,
            w: 120,
            h: 149,
            x: 11,
            y: -11,
            rot: -(Math.PI / 2)
        },
        3: {
            sx: 272,
            sy: 368,
            w: 120,
            h: 149,
            x: 0,
            y: 0
        },
        4: {
            sx: 272,
            sy: 368,
            w: 120,
            h: 149,
            x: 0,
            y: 0,
            rot: Math.PI
        }
    };

    sc.CircuitOverviewMenu.Tree = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/circuit.png"),
        buffer: null,
        element: 0,
        needsUpdate: false,
        overlay: null,
        updater: null,
        done: null,
        _timer: 0,
        _alpha: 0,
        _firstTime: false,

        init: function (offsetX, offsetY, buffer, element, updater, done) {
            this.parent();
            this.setSize(buffer.width, buffer.height);
            this.setPivot(buffer.width / 2, buffer.height / 2);
            this.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.buffer = buffer;
            this.element = element || 0;
            this.updater = updater || null;
            this.done = done || null;
            this.hook.transitions = {
                DEFAULT: {
                    state: {
                        offsetX: offsetX,
                        offsetY: offsetY
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE_OUT
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: offsetX + (offsetX ? offsetX > 0 ? 15 : -15 : 0),
                        offsetY: offsetY + (offsetY ? offsetY > 0 ? 15 : -15 : 0)
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            this.doStateTransition("HIDDEN", true)
        },

        updateDrawables: function (drawables) {
            this.buffer && drawables.addGfx(this.buffer, 0, 0, 0, 0);
            if (this._timer > 0) {
                this._timer = this._timer - ig.system.tick;
                if (this._timer <= 0) {
                    this._timer = 0;
                    this.done && this.done(this.element)
                } else if (this._timer <= 1 && !ig.vars.get(sc.CIRCUIT_VAR_KEY + this.element) && !this._firstTime) {
                    ig.vars.set("menu.circuit.start." + this.element, true);
                    this.updater(this.element);
                    this._firstTime = true
                }
                var alphaFactor = (this._timer / 2).limit(0, 1);
                this._alpha = this._timer > 1 ? 2 - KEY_SPLINES.LINEAR.get(alphaFactor * 2) : KEY_SPLINES.LINEAR.get(alphaFactor * 2);
                var overlay = OVERLAY_POSITIONS[this.element];
                overlay.rot && drawables.addTransform().setPivot(this.buffer.width / 2, this.buffer.height / 2).setRotate(overlay.rot);
                drawables.addGfx(this.gfx, overlay.x, overlay.y, overlay.sx, overlay.sy, overlay.w, overlay.h).setAlpha(this._alpha);
                overlay.rot && drawables.undoTransform()
            }
        },

        show: function () {
            this.doStateTransition("DEFAULT", false, false, function () {
                if (sc.model.player.getCore(this.element + 8) && !ig.vars.get(sc.CIRCUIT_VAR_KEY + this.element)) {
                    ig.interact.setBlockDelay(2);
                    this._timer = 2
                }
            }.bind(this), 0.1)
        }
    });

    var NEUTRAL_POINTS = [{
            x: 47,
            y: 47
        }],
        HEAT_POINTS = [{
            x: 52,
            y: 47
        }, {
            x: 75,
            y: 70
        }, {
            x: 98,
            y: 47
        }],
        COLD_POINTS = [{
            x: 52,
            y: 81
        }, {
            x: 75,
            y: 58
        }, {
            x: 98,
            y: 81
        }],
        SHOCK_POINTS = [{
            x: 47,
            y: 52
        }, {
            x: 70,
            y: 75
        }, {
            x: 47,
            y: 98
        }],
        WAVE_POINTS = [{
            x: 81,
            y: 52
        }, {
            x: 58,
            y: 75
        }, {
            x: 81,
            y: 98
        }];

    sc.CircuitOverviewMenu.FocusOverlay = ig.FocusGui.extend({
        gfx: new ig.Image("media/gui/circuit.png"),
        rotation: 0,
        neutral: false,
        piv: Vec2.createC(0, 0),
        points: [],
        element: 0,
        submitSound: null,
        focusable: false,

        init: function (offsetX, offsetY, buffer, element) {
            this.parent();
            this.setSize(buffer.width, buffer.height);
            this.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.element = element;
            this.submitSound = sc.BUTTON_SOUND.submit;
            this.hook.transitions = {
                DEFAULT: {
                    state: {
                        offsetX: offsetX,
                        offsetY: offsetY
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.EASE_OUT
                },
                HIDDEN: {
                    state: {
                        alpha: 0,
                        offsetX: offsetX + (offsetX ? offsetX > 0 ? 15 : -15 : 0),
                        offsetY: offsetY + (offsetY ? offsetY > 0 ? 15 : -15 : 0)
                    },
                    time: 0.2,
                    timeFunction: KEY_SPLINES.LINEAR
                }
            };
            switch (this.element) {
                case sc.ELEMENT.NEUTRAL:
                    this.points = NEUTRAL_POINTS;
                    break;
                case sc.ELEMENT.HEAT:
                    this.points = HEAT_POINTS;
                    this.rotation = QUARTER_TURN;
                    this.piv.y = -buffer.width || 0;
                    break;
                case sc.ELEMENT.COLD:
                    this.points = COLD_POINTS;
                    this.rotation = -QUARTER_TURN;
                    this.piv.x = -buffer.height || 0;
                    break;
                case sc.ELEMENT.SHOCK:
                    this.points = SHOCK_POINTS;
                    break;
                case sc.ELEMENT.WAVE:
                    this.points = WAVE_POINTS;
                    this.rotation = -Math.PI;
                    this.piv.y = -buffer.height || 0;
                    this.piv.x = -buffer.width || 0
            }
            this.doStateTransition("HIDDEN", true)
        },

        onButtonPress: function () {
            if (this.focusable) {
                this.submitSound && this.submitSound.play();
                sc.menu.selectSkillTree(this.element)
            }
        },

        updateDrawables: function (drawables) {
            if (sc.menu.skillState != sc.MENU_SKILL_STATE.SWAP_BRANCHES && (!ig.interact.isBlocked() && this.focusable) && this.focus) {
                if (this.element != sc.ELEMENT.NEUTRAL) {
                    drawables.addTransform().setRotate(this.rotation);
                    drawables.addGfx(this.gfx, -3 + this.piv.x, 2 + this.piv.y, 192, 160, 122, 145);
                    drawables.undoTransform()
                } else {
                    drawables.addGfx(this.gfx, -3, -3, 320, 168, 99, 99)
                }
            }
        },

        canPlayFocusSounds: function () {
            return !ig.interact.isBlocked() || this.focusable
        },

        isMouseOver: function () {
            if (!this.focusable || ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) return false;
            for (var screenX = Math.floor(this.hook.screenCoords.x), screenY = Math.floor(this.hook.screenCoords.y), mouseX = Math.floor(sc.control.getMouseX()), mouseY = Math.floor(sc.control.getMouseY()), index = this.points.length; index--;)
                if (Math.abs(mouseX - (this.points[index].x + screenX)) + Math.abs(mouseY - (this.points[index].y + screenY)) <= 45) return true;
            return false
        }
    })
});
ig.baked = !0;

/**
 * game.feature.menu.gui.circuit.circuit-detail
 * ============================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.circuit.circuit-detail")`.
 *
 * The skill-tree detail view of the circuit menu. `sc.CircuitTreeDetailContainer`
 * hosts one `sc.CircuitTreeDetail` per element tree (created lazily), manages
 * the pan/drag camera and the gamepad cursor. `sc.CircuitTreeDetail` builds the
 * tree from the skilltree data: `.Start` (root node), `.Node` (a skill node
 * with its branch/block logic), `.Line` and `.OrBranchLine` (the connecting
 * lines). The module-level helpers draw the node icons and connection lines
 * from the circuit sprite sheet; `TREE_CONFIGS` holds the layout data for the
 * five element trees and their shade blocks.
 */
ig.module("game.feature.menu.gui.circuit.circuit-detail")
    .requires("impact.feature.gui.gui", "impact.feature.gui.base.basic-gui", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.circuit.circuit-misc", "game.feature.menu.gui.circuit.circuit-detail-elements", "game.feature.menu.gui.circuit.circuit-overview", "game.feature.menu.gui.circuit.circuit-effect-display")
    .defines(function () {

    function getShadeBlockID(skillUID, level, element) {
        if (level <= 1) return false;
        if (sc.newgame.get("remove-skill-blocks")) return 0;
        for (var shadeBlock = TREE_CONFIGS[element].shadeBlock, ids = shadeBlock.ids, count = ids.length; count--;)
            if (skillUID == ids[count] && !sc.model.player.hasItem(shadeBlock.levels[level - 2])) return shadeBlock.levels[level - 2];
        return 0
    }

    function drawConnections(drawables, gfx, skill, children, x, y, dirX, dirY, element, isStart, orBranchIndex, orLevels) {
        var hasSkill = skill && sc.model.player.hasSkill(skill.uid),
            child = null,
            childHasSkill = false;
        if (!isStart) {
            spritePos.x = 32;
            spritePos.y = 0;
            drawPos.x = x;
            drawPos.y = y;
            drawSize.x = 8;
            drawSize.y = 8;
            offset.x = 0;
            offset.y = 0;
            dirVec.x = -dirX;
            dirVec.y = -dirY;
            setSpritePos(dirVec, isStart, hasSkill, true, element);
            spritePos.x = orBranchIndex >= 0 ? spritePos.x + Math.max(0, orLevels[orBranchIndex] - 1) * 8 : spritePos.x + Math.max(0, skill.level - 1) * 8;
            drawables.addGfx(gfx, drawPos.x, drawPos.y, spritePos.x, spritePos.y, drawSize.x, drawSize.y)
        }
        if (children && children.length != 0) {
            dirVec.x = dirX;
            dirVec.y = dirY;
            for (var index = 0; index < children.length; index++) {
                child = children[index];
                childHasSkill = child.orBranch ? sc.model.player.hasSkill(child.orBranch.left[0].uid) || sc.model.player.hasSkill(child.orBranch.right[0].uid) ? true : false : sc.model.player.hasSkill(child.uid) ? true : false;
                spritePos.x = 32;
                spritePos.y = 0;
                drawPos.x = x;
                drawPos.y = y;
                drawSize.x = 8;
                drawSize.y = 8;
                offset.x = 0;
                offset.y = 0;
                if (!isStart) {
                    dirVec.x = dirX;
                    dirVec.y = dirY;
                    rotateDir(child.direction, dirVec.x, dirVec.y)
                }
                setSpritePos(dirVec, isStart, hasSkill, childHasSkill, element);
                spritePos.x = orBranchIndex >= 0 ? orBranchIndex + 1 >= 3 ? child.orBranch ? spritePos.x + Math.max(0, child.orBranch.levels[0] - 1) * 8 : spritePos.x + Math.max(0, child.level - 1) * 8 : spritePos.x + Math.max(0, orLevels[orBranchIndex + 1] - 1) * 8 : child.orBranch ? spritePos.x + Math.max(0, child.orBranch.levels[0] - 1) * 8 : spritePos.x + Math.max(0, child.level - 1) * 8;
                drawables.addGfx(gfx, drawPos.x, drawPos.y, spritePos.x, spritePos.y, drawSize.x, drawSize.y);
                if (isStart) {
                    Vec2.assign(savedDir, dirVec);
                    drawLine(drawables, gfx, child, element, drawPos.x + offset.x, drawPos.y + offset.y, dirVec.x, dirVec.y, 1, true);
                    Vec2.assign(dirVec, savedDir);
                    rotateDir("CW_90", dirVec.x, dirVec.y)
                }
            }
        }
    }

    function drawLine(drawables, gfx, skill, element, x, y, dirX, dirY, distance, rotate, overrideDistance) {
        var length = 0,
            length = overrideDistance ? distance : (distance != void 0 ? distance : skill.distance) * 8;
        if (!(length <= 0)) {
            dirVec.x = dirX;
            dirVec.y = dirY;
            var isBranch = skill.orBranch ? true : false,
                hasSkill = false,
                hasSkill = isBranch ? sc.model.player.hasSkill(skill.orBranch.left[0].uid) || sc.model.player.hasSkill(skill.orBranch.right[0].uid) ? true : false : sc.model.player.hasSkill(skill.uid) ? true : false,
                level = 0,
                level = isBranch ? skill.orBranch.levels[0] : skill.level || 0,
                levelOffset = Math.max(0, level - 1) * 16;
            rotate && rotateDir(skill.direction, dirX, dirY);
            switch (getLineDrawType(dirVec)) {
                case sc.LINE_DRAW_TYPE.HORZ:
                    if (length <= 16) {
                        drawables.addGfx(gfx, x, y, (hasSkill ? 80 + element * 48 : 32) + levelOffset, 80, length, 8)
                    } else {
                        var steps = Math.ceil(length / 16);
                        for (var seg = 16; steps--;) {
                            length < 16 && (seg = length);
                            drawables.addGfx(gfx, x, y, (hasSkill ? 80 + element * 48 : 32) + levelOffset, 80, seg, 8);
                            x = x + 16;
                            length = Math.max(0, length - 16)
                        }
                    }
                    break;
                case sc.LINE_DRAW_TYPE.VERT:
                    if (length <= 16) {
                        drawables.addGfx(gfx, x, y, hasSkill ? 177 + element * 8 : 169, 312 + levelOffset, 8, length)
                    } else {
                        var steps = Math.ceil(length / 16);
                        for (var seg = 16; steps--;) {
                            length < 16 && (seg = length);
                            drawables.addGfx(gfx, x, y, hasSkill ? 177 + element * 8 : 169, 312 + levelOffset, 8, seg);
                            y = y + 16;
                            length = Math.max(0, length - 16)
                        }
                    }
                    break;
                case sc.LINE_DRAW_TYPE.SLOPE:
                    var colored = hasSkill;
                    var sx = dirVec.x;
                    var sy = dirVec.y;
                    var flip = false;
                    if (sx > 0 && sy < 0 || sx < 0 && sy > 0) {
                        flip = true;
                        y = y + (length - 16 + 1)
                    } else {
                        y = y + 1
                    }
                    dirVec.x = sx;
                    dirVec.y = sy;
                    var steps = Math.ceil(length / 16);
                    for (var seg = 16; steps--;) {
                        length < 16 && (seg = length);
                        drawables.addGfx(gfx, x, y - 3, (colored ? 80 + element * 48 : 32) + levelOffset, 88, seg, 24, flip);
                        x = x + 16;
                        length = Math.max(0, length - 16);
                        y = y + (flip ? -(length < 16 ? length : 16) : 16)
                    }
            }
        }
    }

    function setSpritePos(dirVec, isStart, hasSkill, hasChild, element) {
        if (isStart || hasSkill) {
            spritePos.x = hasChild ? 80 : 104;
            spritePos.x = spritePos.x + element * 48
        } else {
            spritePos.x = 32
        }
        switch (getCardinalDir(dirVec)) {
            case sc.TREE_CARDINAL_DIR.NORTH:
                spritePos.y = 0;
                drawSize.y = 8;
                drawPos.x = drawPos.x - 3;
                drawPos.y = drawPos.y - (isStart ? 11 : 19);
                offset.y = -8;
                break;
            case sc.TREE_CARDINAL_DIR.EAST:
                spritePos.y = 8;
                drawSize.y = 8;
                drawPos.x = drawPos.x + (isStart ? 5 : 13);
                drawPos.y = drawPos.y - 3;
                offset.x = 8;
                break;
            case sc.TREE_CARDINAL_DIR.SOUTH:
                spritePos.y = 16;
                drawSize.y = 8;
                drawPos.x = drawPos.x - 3;
                drawPos.y = drawPos.y + (isStart ? 5 : 13);
                offset.y = offset.y + 8;
                break;
            case sc.TREE_CARDINAL_DIR.WEST:
                spritePos.y = 24;
                drawSize.y = 8;
                drawPos.x = drawPos.x - (isStart ? 11 : 19);
                drawPos.y = drawPos.y - 3;
                offset.x = -8;
                break;
            case sc.TREE_CARDINAL_DIR.NORTH_EAST:
                spritePos.y = 32;
                drawSize.y = 12;
                drawPos.x = 25;
                drawPos.y = 4;
                break;
            case sc.TREE_CARDINAL_DIR.SOUTH_EAST:
                spritePos.y = 44;
                drawSize.y = 12;
                drawPos.x = 25;
                drawPos.y = 25;
                break;
            case sc.TREE_CARDINAL_DIR.SOUTH_WEST:
                spritePos.y = 56;
                drawSize.y = 12;
                drawPos.x = 9;
                drawPos.y = 25;
                break;
            case sc.TREE_CARDINAL_DIR.NORTH_WEST:
                spritePos.y = 68;
                drawSize.y = 12;
                drawPos.x = 9;
                drawPos.y = 5
        }
    }

    function rotateDir(direction, x, y) {
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
    }

    function getCardinalDir(vec) {
        if (vec.x >= 0) {
            if (vec.y < 0 && vec.x == 0) return sc.TREE_CARDINAL_DIR.NORTH;
            if (vec.y > 0 && vec.x == 0) return sc.TREE_CARDINAL_DIR.SOUTH;
            if (vec.y == 0 && vec.x > 0) return sc.TREE_CARDINAL_DIR.EAST;
            if (vec.y < 0 && vec.x > 0) return sc.TREE_CARDINAL_DIR.NORTH_EAST;
            if (vec.y > 0 && vec.x > 0) return sc.TREE_CARDINAL_DIR.SOUTH_EAST
        } else {
            if (vec.y == 0 && vec.x < 0) return sc.TREE_CARDINAL_DIR.WEST;
            if (vec.y < 0 && vec.x < 0) return sc.TREE_CARDINAL_DIR.NORTH_WEST;
            if (vec.y > 0 && vec.x < 0) return sc.TREE_CARDINAL_DIR.SOUTH_WEST
        }
        return null
    }

    function getLineDrawType(vec) {
        if (vec.x >= 0) {
            if (vec.y < 0 && vec.x == 0 || vec.y > 0 && vec.x == 0) return sc.LINE_DRAW_TYPE.VERT;
            if (vec.y == 0 && vec.x > 0) return sc.LINE_DRAW_TYPE.HORZ;
            if (vec.y < 0 && vec.x > 0 || vec.y > 0 && vec.x > 0) return sc.LINE_DRAW_TYPE.SLOPE
        } else {
            if (vec.y == 0 && vec.x < 0) return sc.LINE_DRAW_TYPE.HORZ;
            if (vec.y < 0 && vec.x < 0 || vec.y > 0 && vec.x < 0) return sc.LINE_DRAW_TYPE.SLOPE
        }
        return "If this return, you broke something horribly Bro."
    }

    function isEmpty(obj) {
        for (var key in obj) return false;
        return true
    }

    var QUARTER_TURN = Math.PI / 2,
        EIGHTH_TURN = Math.PI / 4,
        THREE_EIGHTH_TURN = QUARTER_TURN + EIGHTH_TURN,
        HALF_SIZE = Math.floor(20),
        debugBoxes = !window.IG_GAME_DEBUG || false,
        TREE_CONFIGS = [{
            element: sc.ELEMENT.NEUTRAL,
            startDir: {
                x: 0,
                y: -1
            },
            node: {
                x: 375,
                y: 375
            },
            offset: {
                x: 1095,
                y: 1095
            },
            size: {
                x: 751,
                y: 751
            },
            shadeBlock: {
                ids: [7, 8, 20, 21, 33, 34, 46, 47],
                levels: [225, 225]
            }
        }, {
            element: sc.ELEMENT.HEAT,
            rotation: QUARTER_TURN,
            startDir: {
                x: 1,
                y: 0
            },
            node: {
                x: 519,
                y: 199
            },
            offset: {
                x: 951,
                y: 1990
            },
            size: {
                x: 1039,
                y: 951
            },
            shadeBlock: {
                ids: [64, 63, 89, 97, 98, 118, 119, 128, 127, 105, 73, 72],
                levels: [230, 410]
            }
        }, {
            element: sc.ELEMENT.COLD,
            rotation: -QUARTER_TURN,
            startDir: {
                x: -1,
                y: 0
            },
            node: {
                x: 519,
                y: 751
            },
            offset: {
                x: 951,
                y: 0
            },
            size: {
                x: 1039,
                y: 951
            },
            shadeBlock: {
                ids: [176, 205, 206, 214, 215, 151, 150, 160, 159, 184, 185, 192],
                levels: [230, 410]
            }
        }, {
            rotation: 0,
            element: sc.ELEMENT.SHOCK,
            startDir: {
                x: 0,
                y: -1
            },
            node: {
                x: 199,
                y: 519
            },
            offset: {
                x: 1990,
                y: 951
            },
            size: {
                x: 951,
                y: 1039
            },
            shadeBlock: {
                ids: [7, 8, 20, 21, 33, 34, 46, 47, 246, 247, 279, 301, 302],
                levels: [230, 410]
            }
        }, {
            element: sc.ELEMENT.WAVE,
            rotation: Math.PI,
            startDir: {
                x: 0,
                y: 1
            },
            node: {
                x: 751,
                y: 519
            },
            offset: {
                x: 0,
                y: 951
            },
            size: {
                x: 951,
                y: 1039
            },
            shadeBlock: {
                ids: [7, 8, 20, 21, 33, 34, 46, 47, 333, 334, 366, 388, 389],
                levels: [230, 410]
            }
        }],
        dirVec = Vec2.createC(0, 0),
        savedDir = Vec2.createC(0, 0),
        tempPos = Vec2.createC(0, 0),
        offset = Vec2.createC(0, 0),
        spritePos = Vec2.createC(0, 0),
        drawPos = Vec2.createC(0, 0),
        drawSize = Vec2.createC(0, 0),
        SHADE_SPRITE_OFFSETS = {
            225: 0,
            230: 40,
            231: 80,
            410: 80
        },
        cameraPos = Vec2.createC(0, 0);

    sc.CircuitTreeDetailContainer = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/circuit.png"),
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    scaleX: 0.5,
                    scaleY: 0.5
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        trees: [],
        cursor: null,
        _lastMousePos: Vec2.createC(0, 0),
        _dragTimer: 0,
        _cameraLastPositions: [],
        _lastDevice: 0,
        _gamepadActive: false,
        _cursorPos: [],
        _delayedDrag: false,

        init: function () {
            this.parent();
            this.setSize(ig.system.width, ig.system.height);
            this.setPivot(ig.system.width / 2, ig.system.height / 2);
            if (!this.constructor.PATTERN) {
                this.constructor.PATTERN = this.gfx.createPattern(0, 192, 64, 64, ig.ImagePattern.OPT.REPEAT_X_AND_Y)
            }
            this.hook.setMouseRecord(true);
            this.cursor = new sc.CiruitCursor;
            this.addChildGui(this.cursor);
            this.doStateTransition("HIDDEN", true)
        },

        scrollToTree: function (treeIndex, previousTree, time, callback) {
            var pos = null;
            if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                pos = this._cursorPos[treeIndex];
                this._initCursorPos(pos, treeIndex);
                sc.menu.skillCursor.x = pos.x;
                sc.menu.skillCursor.y = pos.y;
                this.limitCursorPos(treeIndex);
                this.cursor.moveTo(sc.menu.skillCursor.x, sc.menu.skillCursor.y, previousTree != -1, time);
                sc.menu.skillCamera.x = Math.floor(-pos.x + ig.system.width / 2);
                sc.menu.skillCamera.y = Math.floor(-pos.y + ig.system.height / 2)
            } else {
                pos = this._cameraLastPositions[treeIndex];
                sc.menu.skillCamera.x = pos.x;
                sc.menu.skillCamera.y = pos.y
            }
            this.limitCameraPos(treeIndex);
            this.doScrollTransition(sc.menu.skillCamera.x, sc.menu.skillCamera.y, time, KEY_SPLINES.EASE, callback)
        },

        limitCameraPos: function (treeIndex) {
            var config = TREE_CONFIGS[treeIndex],
                cameraX = -sc.menu.skillCamera.x,
                margin = Math.floor(162);
            sc.menu.skillCamera.x = -cameraX.limit(config.offset.x - margin, config.offset.x + (config.size.x - ig.system.width) + margin);
            cameraX = -sc.menu.skillCamera.y;
            margin = Math.floor(42);
            sc.menu.skillCamera.y = -cameraX.limit(config.offset.y - margin, config.offset.y + (config.size.y - ig.system.height) + margin)
        },

        limitCursorPos: function (treeIndex) {
            var config = TREE_CONFIGS[treeIndex],
                cursorX = sc.menu.skillCursor.x;
            sc.menu.skillCursor.x = cursorX.limit(config.offset.x - 32 + 16 - 120, config.offset.x + (config.size.x - 16) + 32 + 120);
            var cursorY = sc.menu.skillCursor.y,
                screenX = sc.menu.skillCursor.x + sc.menu.skillCamera.x;
            sc.menu.skillCursor.y = cursorY.limit(config.offset.y, config.offset.y + config.size.y - (screenX < 181 ? Math.min(25, 181 - screenX) : 0))
        },

        switchElementTree: function (newTree, oldTree) {
            if (newTree >= 0) {
                this._addTreeLazy(newTree);
                if (oldTree != -1) {
                    var pos = this._cameraLastPositions[oldTree];
                    pos.x = sc.menu.skillCamera.x;
                    pos.y = sc.menu.skillCamera.y;
                    if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                        pos = this._cursorPos[oldTree];
                        pos.x = sc.menu.skillCursor.x;
                        pos.y = sc.menu.skillCursor.y
                    }
                    this.trees[oldTree].deactivate(true);
                    this.trees[newTree].activate(false);
                    this.scrollToTree(newTree, oldTree, 0.5, function () {
                        this.trees[sc.menu.previousSkillTree].doStateTransition("HIDDEN", true)
                    }.bind(this));
                    ig.interact.setBlockDelay(0.5)
                } else {
                    this.trees[newTree].activate(true);
                    this.scrollToTree(newTree, oldTree);
                    this.doStateTransition("DEFAULT")
                }
                this._checkLastDevice()
            } else {
                if (oldTree != -1) {
                    pos = this._cameraLastPositions[oldTree];
                    pos.x = sc.menu.skillCamera.x;
                    pos.y = sc.menu.skillCamera.y;
                    if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                        pos = this._cursorPos[oldTree];
                        pos.x = sc.menu.lastSkillCursor.x;
                        pos.y = sc.menu.lastSkillCursor.y
                    }
                }
                this.doStateTransition("HIDDEN")
            }
        },

        exitMenu: function () {
            for (var index = this.trees.length; index--;) {
                this.trees[index] && this.trees[index].exit()
            }
            this.doStateTransition("HIDDEN")
        },

        addObservers: function () {
            sc.Model.addObserver(sc.menu, this);
            this.cursor.addObservers();
            for (var index = this.trees.length; index--;) {
                this.trees[index] && this.trees[index].addObservers()
            }
        },

        removeObservers: function () {
            this.cursor.removeObservers();
            sc.Model.removeObserver(sc.menu, this);
            for (var index = this.trees.length; index--;) {
                this.trees[index] && this.trees[index].removeObservers()
            }
        },

        update: function () {
            sc.menu.skillCursorMoved = false;
            if (!ig.interact.isBlocked() && !(sc.menu.skillState == sc.MENU_SKILL_STATE.NODE_MENU || sc.menu.skillState == sc.MENU_SKILL_STATE.OVERVIEW || sc.menu.currentSkillTree >= 0 && !this.trees[sc.menu.currentSkillTree].buttonGroup.isActive())) {
                var treeIndex = sc.menu.currentSkillTree;
                if (this._lastDevice != ig.input.currentDevice) {
                    this._gamepadActive = ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD;
                    this._lastDevice = ig.input.currentDevice;
                    var pos = null;
                    if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                        pos = this._cursorPos[treeIndex];
                        this._initCursorPos(pos, treeIndex);
                        sc.menu.skillCursor.x = pos.x;
                        sc.menu.skillCursor.y = pos.y;
                        this.limitCursorPos(treeIndex);
                        sc.menu.skillCamera.x = Math.floor(-pos.x + ig.system.width / 2);
                        sc.menu.skillCamera.y = Math.floor(-pos.y + ig.system.height / 2);
                        this.limitCameraPos(treeIndex);
                        this.doScrollTransition(sc.menu.skillCamera.x, sc.menu.skillCamera.y, 0.3, KEY_SPLINES.EASE);
                        this.cursor.moveTo(sc.menu.skillCursor.x, sc.menu.skillCursor.y)
                    } else if (ig.input.currentDevice == ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE) {
                        pos = this._cursorPos[treeIndex];
                        if (sc.menu.currentSkillFocus) {
                            pos.x = sc.menu.skillRecoverPos.x;
                            pos.y = sc.menu.skillRecoverPos.y
                        } else {
                            pos.x = sc.menu.skillCursor.x;
                            pos.y = sc.menu.skillCursor.y
                        }
                        sc.menu.unfocusCursor(sc.menu.currentSkillFocus)
                    }
                    sc.menu.toggledInputMode()
                }
                var moved = false;
                if (!this.hook.scrollTransition) {
                    if (sc.control.menuSkillLeft(0.5)) {
                        sc.menu.skillCamera.x = Math.floor(sc.menu.skillCamera.x + 250 * ig.system.actualTick);
                        this.limitCameraPos(sc.menu.currentSkillTree);
                        this.hook.scroll.x = sc.menu.skillCamera.x;
                        moved = true
                    } else if (sc.control.menuSkillRight(0.5)) {
                        sc.menu.skillCamera.x = Math.floor(sc.menu.skillCamera.x - 250 * ig.system.actualTick);
                        this.limitCameraPos(sc.menu.currentSkillTree);
                        this.hook.scroll.x = sc.menu.skillCamera.x;
                        moved = true
                    }
                    if (sc.control.menuSkillUp(0.5)) {
                        sc.menu.skillCamera.y = Math.floor(sc.menu.skillCamera.y + 250 * ig.system.actualTick);
                        this.limitCameraPos(sc.menu.currentSkillTree);
                        this.hook.scroll.y = sc.menu.skillCamera.y;
                        moved = true
                    } else if (sc.control.menuSkillDown(0.5)) {
                        sc.menu.skillCamera.y = Math.floor(sc.menu.skillCamera.y - 250 * ig.system.actualTick);
                        this.limitCameraPos(sc.menu.currentSkillTree);
                        this.hook.scroll.y = sc.menu.skillCamera.y;
                        moved = true
                    }
                }
                if (!moved && ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                    var moveX = 0,
                        moveY = 0,
                        axis = 0,
                        stickMoved = false;
                    if ((axis = sc.control.getAxesValue(ig.AXES.LEFT_STICK_X)) < -0.5) {
                        moveX = (-150 + axis * 100) * ig.system.actualTick;
                        stickMoved = true
                    } else if ((axis = sc.control.getAxesValue(ig.AXES.LEFT_STICK_X)) > 0.5) {
                        moveX = (150 + axis * 100) * ig.system.actualTick;
                        stickMoved = true
                    }
                    if ((axis = sc.control.getAxesValue(ig.AXES.LEFT_STICK_Y)) < -0.5) {
                        moveY = (-150 + axis * 100) * ig.system.actualTick;
                        stickMoved = true
                    } else if ((axis = sc.control.getAxesValue(ig.AXES.LEFT_STICK_Y)) > 0.5) {
                        moveY = (150 + axis * 100) * ig.system.actualTick;
                        stickMoved = true
                    }
                    if (stickMoved) {
                        sc.menu.skillCursorMoved = true;
                        sc.menu.skillCursor.x = moveX >= 0 ? Math.floor(sc.menu.skillCursor.x + moveX) : Math.ceil(sc.menu.skillCursor.x + moveX);
                        sc.menu.skillCursor.y = moveY >= 0 ? Math.floor(sc.menu.skillCursor.y + moveY) : Math.ceil(sc.menu.skillCursor.y + moveY);
                        this.limitCursorPos(sc.menu.currentSkillTree);
                        this.cursor.moveTo(sc.menu.skillCursor.x, sc.menu.skillCursor.y);
                        cameraPos.x = sc.menu.skillCamera.x;
                        cameraPos.y = sc.menu.skillCamera.y;
                        sc.menu.skillCamera.x = Math.floor(-sc.menu.skillCursor.x + ig.system.width / 2);
                        sc.menu.skillCamera.y = Math.floor(-sc.menu.skillCursor.y + ig.system.height / 2);
                        this.limitCameraPos(sc.menu.currentSkillTree)
                    }
                    var camMoved = false;
                    if (Math.abs(sc.menu.skillCamera.x - cameraPos.x) >= 18 || Math.abs(sc.menu.skillCamera.y - cameraPos.y) >= 18) {
                        camMoved = true
                    }
                    if (this.hook.scrollTransition) {
                        this.hook.scrollTransition.x = sc.menu.skillCamera.x;
                        this.hook.scrollTransition.y = sc.menu.skillCamera.y
                    } else if (camMoved) {
                        this.doScrollTransition(sc.menu.skillCamera.x, sc.menu.skillCamera.y, 0.3, KEY_SPLINES.LINEAR)
                    } else {
                        this.hook.scroll.x = sc.menu.skillCamera.x;
                        this.hook.scroll.y = sc.menu.skillCamera.y
                    }
                }
            }
        },

        updateDrawables: function (drawables) {
            var hook = this.hook;
            hook.hasTransition() ? drawables.addPattern(this.constructor.PATTERN, -256, -256, -hook.scroll.x, -hook.scroll.y, 1216, 704) : drawables.addPattern(this.constructor.PATTERN, 0, 0, -hook.scroll.x, -hook.scroll.y, hook.size.x, hook.size.y)
        },

        onMouseInteract: function (isMouseOver, isHover) {
            if (!(ig.interact.isBlocked() || this.trees[sc.menu.currentSkillFocus] && !this.trees[sc.menu.currentSkillTree].buttonGroup.isActive())) {
                if (sc.menu.currentSkillTree == -1 || sc.menu.skillState == sc.MENU_SKILL_STATE.NODE_MENU) {
                    if (isMouseOver && sc.control.getGuiPressed()) {
                        sc.menu.exitNodeMenu();
                        sc.menu.unfocusCursor(sc.menu.currentSkillFocus);
                        this._delayedDrag = true
                    } else {
                        sc.menu.skillDrag = false
                    }
                } else if (!isHover) {
                    var mouseX = Math.floor(sc.control.getMouseX()),
                        mouseY = Math.floor(sc.control.getMouseY());
                    if (sc.control.getGuiPressed() || this._delayedDrag) {
                        this._delayedDrag = false;
                        Vec2.assignC(this._lastMousePos, mouseX, mouseY);
                        sc.menu.skillDrag = true;
                        this._dragTimer = 0
                    } else if (sc.control.getGuiHold()) {
                        if (sc.menu.skillDrag) {
                            this._dragTimer = this._dragTimer + ig.system.actualTick;
                            if (!sc.menu.skillWasDragged) {
                                sc.menu.skillWasDragged = (Math.abs(mouseX - this._lastMousePos.x) >= 1 || Math.abs(mouseY - this._lastMousePos.y) >= 1) && this._dragTimer >= 0.1
                            }
                            sc.menu.skillCamera.x = sc.menu.skillCamera.x + (mouseX - this._lastMousePos.x);
                            sc.menu.skillCamera.y = sc.menu.skillCamera.y + (mouseY - this._lastMousePos.y);
                            this.limitCameraPos(sc.menu.currentSkillTree);
                            this.hook.scroll.x = sc.menu.skillCamera.x;
                            this.hook.scroll.y = sc.menu.skillCamera.y;
                            Vec2.assignC(this._lastMousePos, mouseX, mouseY)
                        }
                    } else {
                        sc.menu.skillDrag = false
                    }
                }
            }
        },

        modelChanged: function (menu, event, data) {
            if (menu == sc.menu) {
                if (event == sc.MENU_EVENT.SKILL_NODE_SELECT) {
                    this.limitCameraPos(sc.menu.currentSkillTree);
                    this.doScrollTransition(sc.menu.skillCamera.x, sc.menu.skillCamera.y, 0.2)
                } else if (event == sc.MENU_EVENT.SKILL_CURSOR_FOCUS_NODE) {
                    if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                        sc.menu.skillCamera.x = Math.floor(-sc.menu.skillCursor.x + ig.system.width / 2);
                        sc.menu.skillCamera.y = Math.floor(-sc.menu.skillCursor.y + ig.system.height / 2);
                        this.limitCameraPos(sc.menu.currentSkillTree);
                        this.doScrollTransition(sc.menu.skillCamera.x, sc.menu.skillCamera.y, 0.2, KEY_SPLINES.LINEAR)
                    }
                } else if (event == sc.MENU_EVENT.CIRCUIT_FOCUS_CAM) {
                    this.limitCameraPos(sc.menu.currentSkillTree);
                    this.doScrollTransition(sc.menu.skillCamera.x, sc.menu.skillCamera.y, data ? data.time || 0.2 : 0.2, void 0, data && data.callback)
                }
            }
        },

        _initCursorPos: function (cursorPos, treeIndex) {
            if (cursorPos.x <= -1E4 || cursorPos.y <= -1E4) {
                cursorPos.x = -this._cameraLastPositions[treeIndex].x + ig.system.width / 2;
                cursorPos.y = -this._cameraLastPositions[treeIndex].y + ig.system.height / 2
            }
        },

        _checkLastDevice: function () {
            if (this._lastDevice != ig.input.currentDevice) {
                this._gamepadActive = ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD;
                this._lastDevice = ig.input.currentDevice
            }
        },

        _addTreeLazy: function (treeIndex) {
            if (!this.trees[treeIndex]) {
                this.trees[treeIndex] = new sc.CircuitTreeDetail(treeIndex);
                this.trees[treeIndex].setPos(TREE_CONFIGS[treeIndex].offset.x, TREE_CONFIGS[treeIndex].offset.y);
                var cameraPos = Vec2.createC(0, 0);
                cameraPos.x = ig.system.width / 2 - TREE_CONFIGS[treeIndex].node.x - TREE_CONFIGS[treeIndex].offset.x;
                cameraPos.y = ig.system.height / 2 - TREE_CONFIGS[treeIndex].node.y - TREE_CONFIGS[treeIndex].offset.y;
                this._cameraLastPositions[treeIndex] = cameraPos;
                this._cursorPos[treeIndex] = Vec2.createC(-1E4, -1E4);
                this.insertChildGui(this.trees[treeIndex], 0)
            }
        }
    });

    sc.CircuitTreeDetail = ig.GuiElementBase.extend({
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
            }
        },
        tree: null,
        buttonGroup: null,
        skills: [],
        skillStart: 0,
        effectGuis: [],

        init: function (element) {
            this.parent();
            this.setSize(TREE_CONFIGS[element].size.x, TREE_CONFIGS[element].size.y);
            if (element == void 0) throw Error("Element muss be defined");
            this.tree = TREE_CONFIGS[element];
            this.buttonGroup = new sc.CircuitDetailButtonGroup;
            sc.Model.addObserver(sc.model.player, this);
            sc.Model.addObserver(sc.menu, this);
            this._createTree();
            this.doStateTransition("DEFAULT", true)
        },

        updateDrawables: function (drawables) {
            window.IG_GAME_DEBUG && debugBoxes && drawables.addColor("white", 0, 0, this.hook.size.x, this.hook.size.y).setAlpha(0.05)
        },

        addObservers: function () {
            sc.Model.addObserver(sc.model.player, this);
            sc.Model.addObserver(sc.menu, this)
        },

        removeObservers: function () {
            sc.Model.removeObserver(sc.model.player, this);
            sc.Model.removeObserver(sc.menu, this)
        },

        activate: function (instant, unused, callback) {
            sc.menu.buttonInteract.pushButtonGroup(this.buttonGroup);
            sc.menu.pushBackCallback(this._onBackButtonPress.bind(this));
            ig.interact.setBlockDelay(0.2);
            this.doStateTransition("DEFAULT", instant, false, callback || null)
        },

        deactivate: function (instant) {
            for (var index = this.effectGuis.length; index--;) {
                this.effectGuis[index].hide();
                this.removeChildGui(this.effectGuis[index])
            }
            this.effectGuis.length = 0;
            sc.menu.popBackCallback();
            sc.menu.buttonInteract.removeButtonGroup(this.buttonGroup);
            instant || this.doStateTransition("HIDDEN")
        },

        exit: function () {
            sc.menu.buttonInteract.removeButtonGroup(this.buttonGroup)
        },

        modelChanged: function (model, event, data) {
            if (model == sc.model.player) {
                if (event == sc.PLAYER_MSG.SKILL_CHANGED && data >= this.skillStart && data <= this.skillStart + this.skills.length - 1) {
                    for (var index = this.skills.length; index--;) {
                        this.skills[index].updateIconAlpha()
                    }
                }
            } else if (model == sc.menu && event == sc.MENU_EVENT.SKILL_SHOW_EFFECT) {
                this._showEffect(data.gui, data.isSwitch, data.delay)
            }
        },

        _showEffect: function (skillGui, isSwitch, delay) {
            if (skillGui && this.tree.element == skillGui.element) {
                var display = new sc.CircuitEffectDisplay;
                this.addChildGui(display);
                display.show(skillGui, isSwitch, delay);
                this.effectGuis.push(display)
            }
        },

        _onBackButtonPress: function () {
            this.deactivate();
            sc.menu.selectSkillTree(-1)
        },

        _createTree: function () {
            var skills = sc.skilltree.getTree(this.tree.element);
            tempPos.x = this.tree.node.x;
            tempPos.y = this.tree.node.y;
            var dirX = this.tree.startDir.x,
                dirY = this.tree.startDir.y;
            dirVec.x = dirX;
            dirVec.y = dirY;
            var start = null;
            this.skillStart = skills[0].uid;
            start = new sc.CircuitTreeDetail.Start(tempPos.x, tempPos.y, dirX, dirY, this.tree.element, skills);
            this.addChildGui(start);
            for (var index = 0; index < skills.length; index++) {
                start = skills[index];
                isEmpty(start) || this._createTreeNodesRecursive(start, this.tree.element, tempPos.x, tempPos.y, dirX, dirY, null);
                rotateDir("CW_90", dirX, dirY);
                dirX = dirVec.x;
                dirY = dirVec.y
            }
        },

        _createTreeNodesRecursive: function (skill, element, x, y, dirX, dirY, parentGui) {
            var isSlope = false,
                branchLine = null,
                lastNode = null;
            if (skill.orBranch) {
                var orBranch = skill.orBranch;
                rotateDir(skill.direction, dirX, dirY);
                isSlope = Math.abs(dirVec.x) == 1 && Math.abs(dirVec.y) == 1;
                x = x + (skill.distance + (isSlope ? 2 : 3)) * 8 * dirVec.x;
                y = y + (skill.distance + (isSlope ? 2 : 3)) * 8 * dirVec.y;
                savedDir.x = dirVec.x;
                savedDir.y = dirVec.y;
                rotateDir(orBranch.direction, dirVec.x, dirVec.y);
                (isSlope = Math.abs(dirVec.x) == 1 && Math.abs(dirVec.y) == 1) && ig.error("orBranch can't be rendered with a slope direction.");
                branchLine = new sc.CircuitTreeDetail.OrBranchLine(x, y, dirVec.x, dirVec.y, orBranch, skill, element, false);
                this.addChildGui(branchLine);
                for (var branchX = x + (isSlope ? 3 : 6) * 8 * dirVec.x, branchY = y + (isSlope ? 3 : 6) * 8 * dirVec.y, nextSkill = branchLine = null, nextGui = parentGui, branchIndex = 0; branchIndex < 3; branchIndex++) {
                    if (branchIndex + 1 >= 3) {
                        branchLine = nextSkill = skill.children[0]
                    } else {
                        branchLine = orBranch.left[branchIndex + 1];
                        nextSkill = orBranch.right[branchIndex + 1]
                    }
                    if (dirVec.x != 0) {
                        branchLine = new sc.CircuitTreeDetail.Node(branchX, branchY + (dirVec.x > 0 ? -24 : 24), dirVec.x, dirVec.y, orBranch.left[branchIndex], element, branchLine, this.buttonGroup, this.skillStart, nextGui, branchIndex, orBranch.levels, true);
                        if (nextGui) {
                            nextGui.nextGui = branchLine
                        }
                        nextGui = branchLine;
                        this.addChildGui(branchLine);
                        this.skills[orBranch.left[branchIndex].uid - this.skillStart] = branchLine;
                        branchLine = new sc.CircuitTreeDetail.Node(branchX, branchY + (dirVec.x > 0 ? 24 : -24), dirVec.x, dirVec.y, orBranch.right[branchIndex], element, nextSkill, this.buttonGroup, this.skillStart, parentGui, branchIndex, orBranch.levels, false)
                    } else {
                        branchLine = new sc.CircuitTreeDetail.Node(branchX + (dirVec.y > 0 ? 24 : -24), branchY, dirVec.x, dirVec.y, orBranch.left[branchIndex], element, branchLine, this.buttonGroup, this.skillStart, nextGui, branchIndex, orBranch.levels, true);
                        if (nextGui) {
                            nextGui.nextGui = branchLine
                        }
                        nextGui = branchLine;
                        this.addChildGui(branchLine);
                        this.skills[orBranch.left[branchIndex].uid - this.skillStart] = branchLine;
                        branchLine = new sc.CircuitTreeDetail.Node(branchX + (dirVec.y > 0 ? -24 : 24), branchY, dirVec.x, dirVec.y, orBranch.right[branchIndex], element, nextSkill, this.buttonGroup, this.skillStart, parentGui, branchIndex, orBranch.levels, false)
                    }
                    if (parentGui) {
                        parentGui.nextGui = branchLine
                    }
                    parentGui = branchLine;
                    this.addChildGui(branchLine);
                    nextGui.orGui = parentGui;
                    parentGui.orGui = nextGui;
                    this.skills[orBranch.right[branchIndex].uid - this.skillStart] = branchLine;
                    branchX = branchX + (isSlope ? 3 : 5) * 8 * dirVec.x;
                    branchY = branchY + (isSlope ? 3 : 5) * 8 * dirVec.y;
                    lastNode = branchLine
                }
                x = x - (isSlope ? 1 : 2) * 8 * dirVec.x;
                y = y - (isSlope ? 1 : 2) * 8 * dirVec.y;
                branchLine = new sc.CircuitTreeDetail.OrBranchLine(x, y, dirVec.x, dirVec.y, orBranch, skill, element, true);
                this.addChildGui(branchLine);
                x = x + 8 * dirVec.x;
                y = y + 8 * dirVec.y
            } else {
                rotateDir(skill.direction, dirX, dirY);
                isSlope = Math.abs(dirVec.x) == 1 && Math.abs(dirVec.y) == 1;
                x = x + (skill.distance + (isSlope ? 3 : 5)) * 8 * dirVec.x;
                y = y + (skill.distance + (isSlope ? 3 : 5)) * 8 * dirVec.y;
                branchLine = new sc.CircuitTreeDetail.Node(x, y, dirVec.x, dirVec.y, skill, element, null, this.buttonGroup, this.skillStart, parentGui);
                this.addChildGui(branchLine);
                lastNode = this.skills[skill.uid - this.skillStart] = branchLine
            }
            skill = skill.children;
            if (skill.length != 0) {
                isSlope = null;
                dirX = dirVec.x;
                dirY = dirVec.y;
                for (var childIndex = 0; childIndex < skill.length; childIndex++) {
                    branchLine = skill[childIndex];
                    if (!isEmpty(branchLine)) {
                        y = this._createLine(branchLine, element, x, y, dirX, dirY);
                        this._createTreeNodesRecursive(branchLine, element, x, y, dirX, dirY, lastNode)
                    }
                }
            }
        },

        _createLine: function (skill, element, x, y, dirX, dirY) {
            if (skill.distance <= 0) return y;
            rotateDir(skill.direction, dirX, dirY);
            dirVec.x == 1 && (dirVec.y == -1 && skill.orBranch) && (y = y - 1);
            var line = new sc.CircuitTreeDetail.Line(x, y, dirVec.x, dirVec.y, skill, element);
            this.addChildGui(line);
            return y
        }
    });

    sc.CircuitTreeDetail.Start = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/circuit.png"),
        element: 0,
        children: null,
        dirX: 0,
        dirY: 0,
        centerPos: 0,

        init: function (x, y, dirX, dirY, element, children) {
            this.parent();
            this.setSize(40, 40);
            this.setPos(x - HALF_SIZE, y - HALF_SIZE);
            this.element = element;
            this.children = children;
            this.dirX = dirX;
            this.dirY = dirY;
            this.centerPos = HALF_SIZE - 6
        },

        updateDrawables: function (drawables) {
            window.IG_GAME_DEBUG && debugBoxes && drawables.addColor("red", 1, 1, 39, 39).setAlpha(0.2);
            drawables.addGfx(this.gfx, this.centerPos, this.centerPos, 56, 0 + this.element * 16, 13, 13);
            drawConnections(drawables, this.gfx, null, this.children, HALF_SIZE, HALF_SIZE, this.dirX, this.dirY, this.element, true)
        }
    });

    sc.CircuitTreeDetail.Node = ig.FocusGui.extend({
        gfx: new ig.Image("media/gui/circuit.png"),
        icons: new ig.Image("media/gui/circuit-icons.png"),
        parentGui: null,
        element: 0,
        skill: null,
        branchSkill: null,
        coords: {
            x: 5,
            y: 5,
            w: 31,
            h: 31
        },
        dirX: 0,
        dirY: 0,
        centerPos: 0,
        orBranchIndex: -1,
        orLevels: null,
        orLeft: true,
        blocked: false,
        blockID: 0,
        submitSound: null,
        blockedSound: null,
        _iconAlpha: 1,
        _player: null,
        _buttonGroup: null,

        init: function (x, y, dirX, dirY, skill, element, branchSkill, buttonGroup, skillStart, parentGui, orBranchIndex, orLevels, orLeft) {
            this.parent();
            this.setSize(41, 41);
            this.setPos(x - HALF_SIZE, y - HALF_SIZE);
            this.parentGui = parentGui || null;
            this.element = element;
            this.skill = skill;
            this.dirX = dirX;
            this.dirY = dirY;
            this.centerPos = HALF_SIZE - 15;
            this.submitSound = sc.BUTTON_SOUND.submit;
            this.blockedSound = sc.BUTTON_SOUND.denied;
            this._player = sc.model.player;
            this.updateIconAlpha();
            if (branchSkill) {
                this.branchSkill = [];
                this.branchSkill.push(branchSkill);
                this.orBranchIndex = orBranchIndex;
                this.orLevels = orLevels;
                this.orLeft = orLeft == void 0 ? true : orLeft;
                this.blockID = getShadeBlockID(this.skill.uid, this.orLevels[this.orBranchIndex], this.element)
            } else {
                this.blockID = getShadeBlockID(this.skill.uid, this.skill.level, this.element)
            }
            if (this.blockID > 0) {
                this.blocked = true
            }
            (this._buttonGroup = buttonGroup) && buttonGroup.addFocusGui(this, skill.uid - skillStart || 0, 0)
        },

        updateIconAlpha: function () {
            this._iconAlpha = 1;
            if (!this._player.hasSkill(this.skill.uid)) {
                this._iconAlpha = this._calculateAlpha(this.parentGui, this._iconAlpha)
            }
        },

        getOffsetX: function () {
            return TREE_CONFIGS[this.element].offset.x
        },

        getOffsetY: function () {
            return TREE_CONFIGS[this.element].offset.y
        },

        getDistanceToCursor: function () {
            return Math.floor(Vec2.distanceC(sc.menu.skillCursor.x - TREE_CONFIGS[this.element].offset.x, sc.menu.skillCursor.y - TREE_CONFIGS[this.element].offset.y, this.hook.pos.x + HALF_SIZE, this.hook.pos.y + HALF_SIZE))
        },

        updateDrawables: function (drawables) {
            if (window.IG_GAME_DEBUG) {
                debugBoxes && drawables.addColor(this.branchSkill ? "yellow" : "green", 1, 1, 39, 39).setAlpha(0.2);
                debugBoxes && drawables.addColor(this.branchSkill ? "yellow" : "green", 5, 5, 31, 31).setAlpha(0.2)
            }
            var hasSkill = sc.model.player.hasSkill(this.skill.uid);
            drawables.addGfx(this.gfx, this.centerPos, this.centerPos, 0, hasSkill ? 32 + this.element * 32 : 0, 31, 31);
            if (this._iconAlpha > 0) {
                var icon = sc.skilltree.getSkill(this.skill.uid).icon;
                drawables.addGfx(this.icons, 8, 8, icon % 10 * 24, Math.floor(icon / 10) * 24, 24, 24).setAlpha(this._iconAlpha)
            }
            drawConnections(drawables, this.gfx, this.skill, this.branchSkill ? this.branchSkill : this.skill.children, HALF_SIZE, HALF_SIZE, this.dirX, this.dirY, this.element, false, this.orBranchIndex, this.orLevels);
            if (this.blocked) {
                var shadeLevel = TREE_CONFIGS[this.element].shadeBlock.levels[(this.branchSkill ? this.orLevels[this.orBranchIndex] : this.skill.level) - 2];
                shadeLevel = SHADE_SPRITE_OFFSETS[shadeLevel];
                drawables.addGfx(this.gfx, this.centerPos, this.centerPos, 480, 168 + shadeLevel, 32, 40)
            }
        },

        onButtonPress: function () {
            if (sc.menu.skillWasDragged) {
                sc.menu.skillWasDragged = false
            } else {
                var chain = false;
                if (this._checkParentForBlock(this.parentGui)) {
                    this.blockedSound && this.blockedSound.play()
                } else {
                    this.parentGui && (this._hasParent(this.parentGui) || (chain = true));
                    if (ig.input.currentDevice == ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE) {
                        var mouseY = Math.floor(sc.control.getMouseY());
                        if (mouseY <= 21 || mouseY >= 299) return
                    }
                    this.submitSound && this.submitSound.play();
                    sc.menu.centerOnNode(this, chain)
                }
            }
        },

        onMouseInteract: function (isMouseOver, isHover) {
            ig.input.state("shift") || this.parent(isMouseOver, isHover)
        },

        isMouseOver: function () {
            if (sc.menu.currentSkillTree == -1 || sc.menu.skillState == sc.MENU_SKILL_STATE.NODE_MENU) return false;
            if (sc.menu.skillDrag) return sc.menu.currentSkillFocus == this;
            if (!ig.interact.isBlocked() && this._buttonGroup.isActive()) {
                if (ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD) {
                    var distance = this.getDistanceToCursor();
                    if (sc.menu.skillCursorMoved) {
                        sc.menu.unfocusCursor(this);
                        return false
                    }
                    if (distance <= 14) {
                        sc.menu.focusCursorOnNode(this.hook.pos.x + 20 + TREE_CONFIGS[this.element].offset.x, this.hook.pos.y + 20 + TREE_CONFIGS[this.element].offset.y, this);
                        return true
                    }
                    sc.menu.unfocusCursor(this);
                    return false
                }
                var mouseX = Math.floor(sc.control.getMouseX()),
                    mouseY = Math.floor(sc.control.getMouseY());
                if (mouseY <= 21 || mouseY >= 299) {
                    sc.menu.unfocusCursor(this);
                    return false
                }
                this.coords.x = 5 + this.hook.screenCoords.x;
                this.coords.y = 5 + this.hook.screenCoords.y;
                var isOver = this.coords.x <= mouseX && this.coords.x + this.coords.w > mouseX && this.coords.y <= mouseY && this.coords.y + this.coords.h > mouseY;
                isOver && !ig.input.state("shift") ? sc.menu.focusCursorOnNode(this.hook.pos.x + 20 + TREE_CONFIGS[this.element].offset.x, this.hook.pos.y + 20 + TREE_CONFIGS[this.element].offset.y, this) : sc.menu.unfocusCursor(this);
                return isOver
            }
        },

        getNodeFocus: function (target) {
            target = target || Vec2.createC(0, 0);
            target.x = this.hook.pos.x + 20 + TREE_CONFIGS[this.element].offset.x;
            target.y = this.hook.pos.y + 20 + TREE_CONFIGS[this.element].offset.y;
            return target
        },

        _hasParent: function (gui) {
            if (gui) {
                if (gui.branchSkill) {
                    if (gui.orBranchIndex == 2) {
                        if (!sc.model.player.hasSkill(gui.skill.uid) && !sc.model.player.hasSkill(gui.skill.uid - 1)) return false
                    } else if (gui.orLeft) {
                        if (!sc.model.player.hasSkill(gui.skill.uid) && !sc.model.player.hasSkill(gui.skill.uid + 1)) return false
                    } else {
                        if (!sc.model.player.hasSkill(gui.skill.uid) && !sc.model.player.hasSkill(gui.skill.uid - 1)) return false
                    }
                } else if (!sc.model.player.hasSkill(gui.skill.uid)) return false
            }
            return true
        },

        _checkParentForBlock: function (gui) {
            return this.blocked ? true : gui ? gui.blocked ? true : gui.parentGui ? gui.parentGui.blocked ? true : this._checkParentForBlock(gui.parentGui) : false : false
        },

        _calculateAlpha: function (gui, alpha) {
            if (alpha <= 0.2) return 0.2;
            if (gui) {
                if (gui.branchSkill) {
                    if (gui.orBranchIndex == 2) {
                        if (this._player.hasSkill(gui.skill.uid) || this._player.hasSkill(gui.skill.uid - 1)) return alpha
                    } else if (gui.orLeft) {
                        if (this._player.hasSkill(gui.skill.uid) || this._player.hasSkill(gui.skill.uid + 1)) return alpha
                    } else {
                        if (this._player.hasSkill(gui.skill.uid) || this._player.hasSkill(gui.skill.uid - 1)) return alpha
                    }
                } else if (this._player.hasSkill(gui.skill.uid)) return alpha;
                return this._calculateAlpha(gui.parentGui, (alpha * 100 - 20) / 100)
            }
            return alpha
        }
    });

    sc.CircuitTreeDetail.OrBranchLine = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/circuit.png"),
        orSkill: null,
        skill: null,
        element: 0,
        dirX: 0,
        dirY: 0,
        drawDir: 0,
        flip: false,
        levelOffset: 0,
        uidLeft: 0,
        uidRight: 0,
        uidNext: -1,
        uidLeftNext: -1,
        uidRightNext: -1,
        hasBranchChildren: false,

        init: function (x, y, dirX, dirY, orSkill, skill, element, flip) {
            this.parent();
            this.setPos(x, y);
            this.element = element;
            this.orSkill = orSkill;
            this.skill = skill;
            this.dirX = dirX;
            this.dirY = dirY;
            this.flip = flip != void 0 ? flip : false;
            dirVec.x = dirX;
            dirVec.y = dirY;
            this.levelOffset = this.flip ? Math.max(0, skill.children[0].level - 1) * 56 : Math.max(0, orSkill.levels[0] - 1) * 56;
            this.uidLeft = this.orSkill.left[0].uid;
            this.uidRight = this.orSkill.right[0].uid;
            this.uidLeftNext = this.skill ? this.orSkill.left[2].uid : -1;
            this.uidRightNext = this.skill ? this.orSkill.right[2].uid : -1;
            this.hasBranchChildren = this.skill.children[0].orBranch ? true : false;
            this.uidNext = this.skill ? this.skill.children[0].uid : -1;
            if (this.hasBranchChildren) {
                this.uidLeftNext = this.skill ? this.skill.children[0].orBranch.left[0].uid : -1;
                this.uidRightNext = this.skill ? this.skill.children[0].orBranch.right[0].uid : -1;
                if (this.flip) {
                    this.levelOffset = Math.max(0, this.skill.children[0].orBranch.levels[0] - 1) * 56
                }
            }
            this.drawDir = getLineDrawType(dirVec);
            switch (this.drawDir) {
                case sc.LINE_DRAW_TYPE.HORZ:
                    this.setSize(32, 56);
                    this.setPos(x + (dirX > 0 ? -3 : -27), y - 27);
                    break;
                case sc.LINE_DRAW_TYPE.VERT:
                    this.setSize(56, 32);
                    this.setPos(x - 27, y + (dirY > 0 ? -3 : -27));
                    break;
                case sc.LINE_DRAW_TYPE.SLOPE:
                    ig.warn("This will lead to an error bro, we can't draw orBranches in slopes: " + Vec2.print(dirX, dirY))
            }
        },

        updateDrawables: function (drawables) {
            window.IG_GAME_DEBUG && debugBoxes && drawables.addColor("yellow", 0, 0, this.hook.size.x, this.hook.size.y).setAlpha(0.2);
            var player = sc.model.player,
                hasLeft = player.hasSkill(this.uidLeft),
                hasRight = player.hasSkill(this.uidRight),
                hasAny = hasLeft || hasRight;
            if (this.dirX < 0 || this.dirY < 0) {
                if (hasLeft && hasRight) {
                    hasLeft = hasRight = true
                } else if (hasRight) {
                    hasLeft = true;
                    hasRight = false
                } else if (hasLeft) {
                    hasRight = true;
                    hasLeft = false
                }
            }
            var flipDown = false;
            hasRight && !hasLeft && (flipDown = true);
            var flip = this.flip;
            if (this.dirX < 0 || this.dirY < 0) {
                flip = !flip
            }
            if (this.flip) {
                if (this.hasBranchChildren) {
                    hasLeft = player.hasSkill(this.uidLeftNext);
                    hasRight = player.hasSkill(this.uidRightNext);
                    hasAny = hasLeft || hasRight
                } else {
                    hasAny = player.hasSkill(this.uidNext)
                }
            }
            switch (this.drawDir) {
                case sc.LINE_DRAW_TYPE.HORZ:
                    drawables.addGfx(this.gfx, 0, flipDown ? -1 : 0, hasAny ? 352 + this.element * 32 : 320, this.levelOffset, 32, 56, flip, flipDown);
                    break;
                case sc.LINE_DRAW_TYPE.VERT:
                    drawables.addGfx(this.gfx, flipDown ? -1 : 0, 0, this.levelOffset, hasAny ? 344 + this.element * 32 : 312, 56, 32, flipDown, flip)
            }
            hasLeft && hasRight && drawables.addGfx(this.gfx, this.hook.size.x / 2 - 16, this.hook.size.y / 2 - 16, 480, 320, 32, 32)
        }
    });

    sc.CircuitTreeDetail.Line = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/circuit.png"),
        endSkill: null,
        element: 0,
        dirX: 0,
        dirY: 0,
        overrideDistance: false,

        init: function (x, y, dirX, dirY, endSkill, element) {
            this.parent();
            this.element = element;
            this.endSkill = endSkill;
            this.dirX = dirX;
            this.dirY = dirY;
            dirVec.x = dirX;
            dirVec.y = dirY;
            var distance = endSkill.distance * 8;
            var drawType = getLineDrawType(dirVec);
            var isSlope = drawType == sc.LINE_DRAW_TYPE.SLOPE;
            x = x + (isSlope ? dirVec.x > 0 ? 13 : distance + 11 : dirVec.x > 0 ? 21 : distance + 19) * dirVec.x;
            y = y + (isSlope ? dirVec.y > 0 ? dirVec.x > 0 ? 12 : 11 : distance + (dirVec.x > 0 ? 13 : 12) : dirVec.y > 0 ? 21 : distance + 19) * dirVec.y;
            dirVec.x == 0 && (x = x - 3);
            dirVec.y == 0 && (y = y - 3);
            var offsetX = 0,
                offsetY = 0;
            if (endSkill.orBranch) {
                if (getLineDrawType(dirVec) == sc.LINE_DRAW_TYPE.SLOPE) {
                    offsetY = 3;
                    offsetX = 6;
                    this.overrideDistance = true
                }
                switch (getCardinalDir(dirVec)) {
                    case sc.TREE_CARDINAL_DIR.SOUTH_WEST:
                        x = x - 3;
                        break;
                    case sc.TREE_CARDINAL_DIR.NORTH_EAST:
                        y = y - 2;
                        break;
                    case sc.TREE_CARDINAL_DIR.NORTH_WEST:
                        x = x - 3;
                        y = y - 3
                }
            }
            this.setPos(x, y);
            switch (drawType) {
                case sc.LINE_DRAW_TYPE.HORZ:
                    this.setSize(distance, 8);
                    break;
                case sc.LINE_DRAW_TYPE.VERT:
                    this.setSize(8, distance);
                    break;
                case sc.LINE_DRAW_TYPE.SLOPE:
                    this.setSize(distance + offsetY, distance + offsetX)
            }
        },

        updateDrawables: function (drawables) {
            window.IG_GAME_DEBUG && debugBoxes && drawables.addColor("blue", 0, 0, this.hook.size.x, this.hook.size.y).setAlpha(0.2);
            this.overrideDistance ? drawLine(drawables, this.gfx, this.endSkill, this.element, 0, 0, this.dirX, this.dirY, this.endSkill.distance * 8 + 3, false, true) : drawLine(drawables, this.gfx, this.endSkill, this.element, 0, 0, this.dirX, this.dirY)
        }
    })
});
ig.baked = !0;

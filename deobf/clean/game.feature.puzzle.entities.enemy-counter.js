/**
 * game.feature.puzzle.entities.enemy-counter
 * ==========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.puzzle.entities.enemy-counter")`.
 *
 * `ig.ENTITY.EnemyCounter`: a scoreboard that counts down defeats of an enemy
 * group (with a two-digit display) and sets `preVariable` when all are
 * defeated, then `postVariable` when the marble reaches the counter.
 * `ig.ENTITY.KillCounter` is a simpler non-visual variant that counts kills
 * (DEFAULT) or just increments a variable (INCREASE).
 */
ig.module("game.feature.puzzle.entities.enemy-counter")
    .requires("game.feature.combat.combat", "impact.base.entity")
    .defines(function () {

    ig.ENTITY.EnemyCounter = ig.AnimatedEntity.extend({
        gfx: null,
        enemyGroup: null,
        enemyCount: 0,
        preCount: 0,
        postCount: 0,
        preVariable: null,
        postVariable: null,
        done: false,
        shuffleCondition: null,
        timer: 0,
        MAX_FLASH_TIME: 0.5,
        sounds: {
            count: new ig.Sound("media/sound/puzzle/counter.ogg", 0.7),
            done: new ig.Sound("media/sound/puzzle/switch-activate-2.ogg", 1)
        },
        effects: {
            sheet: new ig.EffectSheet("puzzle"),
            hideHandle: null
        },
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                spawnCondition: {
                    _type: "VarCondition",
                    _info: "VarCondition to make enemy counter appear",
                    _popup: true
                },
                enemyGroup: {
                    _type: "String",
                    _info: "Enemy Group that is considered for counting"
                },
                enemyCount: {
                    _type: "Number",
                    _info: "Number of enemies that needs to be defeated"
                },
                preVariable: {
                    _type: "VarName",
                    _info: "Variable to be set to true when all enemies are defeated."
                },
                postVariable: {
                    _type: "VarName",
                    _info: "Variable to be set to true when the last marble reached the counter."
                },
                countVariable: {
                    _type: "VarName",
                    _info: "Variable to be set to the current enemyCount value."
                },
                shuffleCondition: {
                    _type: "VarCondition",
                    _info: "if provided: shuffle when condition evaluates to true",
                    _optional: true
                }
            },
            label: function () {
                return "" + this.maxCount + " => [" + this.preVariable + "] > [" + this.postVariable + "]"
            }
        }),

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.BLOCK;
            this.coll.setSize(32, 30, 2);
            this.coll.time.globalStatic = true;
            var puzzleStyle = ig.mapStyle.get("puzzle");
            this.gfx = new ig.Image(puzzleStyle.sheet);
            this.enemyGroup = settings.enemyGroup;
            this.enemyCount = settings.enemyCount;
            this.preVariable = settings.preVariable;
            this.postVariable = settings.postVariable;
            this.countVariable = settings.countVariable;
            this.shuffleCondition = settings.shuffleCondition ? new ig.VarCondition(settings.shuffleCondition) : null;
            this.postCount = this.preCount = (this.done = ig.vars.get(this.postVariable)) ? 0 : this.enemyCount;
            sc.combat.addCombatListener(this);
            this.countVariable && ig.vars.set(this.countVariable, this.postCount)
        },

        show: function (show) {
            this.parent(show);
            if (this.effects.hideHandle) {
                this.effects.hideHandle.stop();
                this.effects.hideHandle = null
            }
            if (!show) {
                this.animState.alpha = 0;
                this.effects.sheet.spawnOnTarget("enemyCounterAppear", this, {})
            }
        },

        onHideRequest: function () {
            this.effects.hideHandle = this.effects.sheet.spawnOnTarget("enemyCounterDisappear", this, {
                callback: this
            })
        },

        onEffectEvent: function (effect) {
            if (effect.isDone()) {
                this.effects.hideHandle = null;
                this.hide()
            }
        },

        initSprites: function () {
            this.setSpriteCount(4)
        },

        update: function () {
            if (this.timer > 0) this.timer = this.timer - ig.system.tick
        },

        onCombatEvent: function (combatant, event) {
            if (this.preCount > 0 && event == sc.COMBAT_EVENT.DEFEATED && combatant.party == sc.COMBATANT_PARTY.ENEMY && (!this.enemyGroup || combatant.enemyGroup == this.enemyGroup)) {
                this.preCount--;
                this.preCount == 0 && ig.vars.set(this.preVariable, true);
                return this
            }
        },

        onCombatMarbleReach: function () {
            this.decreaseCount()
        },

        updateSprites: function () {
            var offset = this.done ? 64 : 0,
                coll = this.coll;
            this.sprites[0].setPos(coll.pos.x, coll.pos.y, coll.pos.z);
            this.sprites[0].setSize(coll.size.x, coll.size.y, coll.size.z, coll.size.y);
            this.sprites[0].setPivot(coll.size.x / 2, (coll.size.y + coll.size.z) / 2);
            this.sprites[0].setImageSrc(this.gfx, 0 + offset, 96);
            this.sprites[0].setAlpha(this.animState.alpha);
            this.sprites[0].setTransform(this.animState.scaleX, this.animState.scaleY, this.animState.angle);
            if (this.timer > 0) {
                this.sprites[3].setPos(coll.pos.x, coll.pos.y, coll.pos.z);
                this.sprites[3].setSize(coll.size.x, coll.size.y, coll.size.z);
                this.sprites[0].setPivot(coll.size.x / 2, (coll.size.y + coll.size.z) / 2);
                this.sprites[3].setImageSrc(this.gfx, 32 + offset, 96);
                this.sprites[3].setAlpha(this.timer / this.MAX_FLASH_TIME * this.animState.alpha);
                this.sprites[3].setTransform(this.animState.scaleX, this.animState.scaleY, this.animState.angle)
            } else this.sprites[3].setImageSrc(null);
            if (this.done) {
                this.sprites[1].setImageSrc(null);
                this.sprites[2].setImageSrc(null)
            } else {
                var count = this.postCount;
                this.shuffleCondition && this.shuffleCondition.evaluate() && (count = Math.floor(Math.random() * 100));
                var tens = Math.floor(count / 10),
                    ones = count % 10;
                this.sprites[1].setPos(coll.pos.x + 9, coll.pos.y + 6, coll.pos.z);
                this.sprites[1].setSize(16, 16, 0, 0);
                this.sprites[1].setImageSrc(this.gfx, 128 + tens % 5 * 16, 96 + (tens >= 5 ? 16 : 0));
                this.sprites[1].setAlpha(this.animState.alpha);
                this.sprites[1].setTransform(this.animState.scaleX, this.animState.scaleY, this.animState.angle);
                this.sprites[2].setPos(coll.pos.x + 14, coll.pos.y + 11, coll.pos.z);
                this.sprites[2].setSize(16, 16, 0, 0);
                this.sprites[2].setImageSrc(this.gfx, 128 + ones % 5 * 16, 96 + (ones >= 5 ? 16 : 0));
                this.sprites[2].setAlpha(this.animState.alpha);
                this.sprites[2].setTransform(this.animState.scaleX, this.animState.scaleY, this.animState.angle)
            }
        },

        onKill: function (parent) {
            sc.combat.removeCombatListener(this);
            this.parent(parent)
        },

        decreaseCount: function () {
            if (this.postCount > 0) {
                this.timer = this.MAX_FLASH_TIME;
                this.postCount--;
                this.countVariable && ig.vars.set(this.countVariable, this.postCount);
                if (this.postCount == 0) {
                    this.done = true;
                    ig.vars.set(this.postVariable, true);
                    ig.SoundHelper.playAtEntity(this.sounds.done, this)
                } else ig.SoundHelper.playAtEntity(this.sounds.count, this)
            }
        }
    });

    var KILL_COUNT_MODE = {
        DEFAULT: 0,
        INCREASE: 1
    };

    ig.ENTITY.KillCounter = ig.Entity.extend({
        enemyGroup: null,
        killCount: 0,
        mode: KILL_COUNT_MODE.DEFAULT,
        preCount: 0,
        variable: null,
        done: false,
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                spawnCondition: {
                    _type: "VarCondition",
                    _info: "Spawn Condition",
                    _popup: true
                },
                countMode: {
                    _type: "Select",
                    _info: "DEFAULT: set count to kill count and trigger when all killed. INCREASE: just increase countVar every time an enemy dies.",
                    _select: KILL_COUNT_MODE
                },
                enemyGroup: {
                    _type: "String",
                    _info: "Enemy Group that is considered for counting"
                },
                killCount: {
                    _type: "Number",
                    _info: "Number of kills to do."
                },
                variable: {
                    _type: "VarName",
                    _info: "Variable to be set to true when all kill count is reached"
                },
                countVariable: {
                    _type: "VarName",
                    _info: "Variable to be set to the current enemyCount value."
                }
            },
            drawBox: true,
            scalableX: true,
            scalableY: true,
            boxColor: "rgba(0,0,255, 0.5)",
            frontColor: "rgba(0,0,120, 0.8)",
            label: function () {
                return this.mode == KILL_COUNT_MODE.DEFAULT ? "" + this.killCount + " => [" + this.variable + "]" : this.countVariable + "++"
            }
        }),

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.NONE;
            settings.size || this.coll.setSize(32, 32, 0);
            this.mode = settings.countMode ? KILL_COUNT_MODE[settings.countMode] : KILL_COUNT_MODE.DEFAULT;
            this.coll.time.globalStatic = true;
            this.enemyGroup = settings.enemyGroup;
            this.killCount = settings.killCount;
            this.variable = settings.variable;
            this.countVariable = settings.countVariable;
            this.preCount = (this.done = this.variable ? ig.vars.get(this.variable) : false) ? 0 : this.killCount;
            sc.combat.addCombatListener(this);
            this.countVariable && this.mode == KILL_COUNT_MODE.DEFAULT && ig.vars.set(this.countVariable, this.preCount)
        },

        onCombatEvent: function (combatant, event) {
            if (this.preCount > 0 && event == sc.COMBAT_EVENT.DEFEATED && combatant.party == sc.COMBATANT_PARTY.ENEMY && (!this.enemyGroup || combatant.enemyGroup == this.enemyGroup))
                if (this.mode == KILL_COUNT_MODE.DEFAULT) {
                    this.preCount--;
                    this.countVariable && ig.vars.set(this.countVariable, this.preCount);
                    if (this.preCount == 0) {
                        ig.vars.set(this.variable, true);
                        this.done = true
                    }
                } else this.mode == KILL_COUNT_MODE.INCREASE && this.countVariable && ig.vars.add(this.countVariable, 1)
        },

        onKill: function (parent) {
            sc.combat.removeCombatListener(this);
            this.parent(parent)
        }
    })
});
ig.baked = !0;
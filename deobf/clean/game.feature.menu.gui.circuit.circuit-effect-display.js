/**
 * game.feature.menu.gui.circuit.circuit-effect-display
 * ====================================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.menu.gui.circuit.circuit-effect-display")`.
 *
 * `sc.CircuitEffectDisplay`: a small overlay shown on top of a circuit node
 * (skill) when it is selected/unlocked/upgraded. It draws the node's element
 * icon from the circuit sprite sheet and plays the corresponding NPC combat
 * charge effect in the background, fading out once the effect has finished.
 */
ig.module("game.feature.menu.gui.circuit.circuit-effect-display")
    .requires("impact.feature.gui.gui")
    .defines(function () {

    sc.CircuitEffectDisplay = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/circuit.png"),
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            DEFAULT_LARGE: {
                state: {
                    scaleX: 1.5,
                    scaleY: 1.5
                },
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
            HIDDEN_LARGE: {
                state: {
                    scaleX: 1.5,
                    scaleY: 1.5,
                    alpha: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        skillGui: null,
        skill: null,
        timer: 0,
        display: null,
        container: null,
        effectDone: false,
        delay: 0,
        large: false,
        iconSize: 25,

        init: function (large) {
            this.parent();
            this.setSize(128, 128);
            this.setPivot(64, 64);
            this.hook.invisibleUpdate = true;
            if (this.large = large) {
                this.iconSize = 48
            }
            this.container = new ig.GuiElementBase;
            this.container.hook.invisibleUpdate = true;
            this.container.hook.clip = true;
            this.container.setSize(128, 128);
            this.container.setPos(0, 0);
            this.addChildGui(this.container)
        },

        show: function (skillGui, unused, delay) {
            this.skillGui = skillGui;
            this.skill = skillGui.skill;
            this.delay = delay || 0;
            var skillHook = skillGui.hook;
            var ownHook = this.hook;
            this.setPos(~~(skillHook.pos.x + skillHook.size.x / 2 - ownHook.size.x / 2) + 1, ~~(skillHook.pos.y + skillHook.size.y / 2 - ownHook.size.y / 2) + 1);
            this.timer = 0.5 + this.delay;
            this.display = new sc.NPCDisplayGui("misc.menu-effect-large", true, null, this.onLoaded.bind(this), true);
            this.container.addChildGui(this.display)
        },

        hide: function () {
            this.display.remove(true);
            this.doStateTransition("HIDDEN", true, true)
        },

        update: function () {
            if (this.timer > 0) {
                this.timer = this.timer - ig.system.actualTick;
                if (this.timer <= 0) {
                    this.timer = 0
                }
            }
            if (this.timer <= 0 && this.effectDone) {
                this.display.remove(true);
                this.doStateTransition("HIDDEN", true, true)
            }
        },

        updateDrawables: function (drawables) {
            var hook = this.hook;
            drawables.addGfx(this.gfx, ~~(hook.size.x / 2 - this.iconSize / 2), ~~(hook.size.y / 2 - this.iconSize / 2), this.large ? 512 : 487, (this.large ? 280 : 352) + this.iconSize * this.skillGui.element, this.iconSize, this.iconSize).setAlpha(this.timer > 0.5 ? 0 : this.timer / 0.5).setCompositionMode("lighter")
        },

        onLoaded: function (display) {
            if (display.npc) {
                display.setPos(this.container.hook.size.x / 2 - display.hook.size.x / 2 - 1, this.container.hook.size.y / 2 - display.hook.size.y / 2);
                this.delay ? display.playEffect("combat", "chargeLevel1Loop", {
                    callback: this,
                    offset: {
                        x: 0,
                        y: -16
                    },
                    duration: this.delay
                }) : display.playEffect("combat", "chargeLevel1", {
                    callback: this,
                    offset: {
                        x: 0,
                        y: -16
                    }
                })
            }
        },

        onEffectEvent: function (event) {
            if (event.state == ig.EFFECT_STATE.ENDED) {
                this.effectDone = true
            }
        }
    })
});
ig.baked = !0;

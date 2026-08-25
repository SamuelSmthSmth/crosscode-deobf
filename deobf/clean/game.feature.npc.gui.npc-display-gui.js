/**
 * game.feature.npc.gui.npc-display-gui
 * ====================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.npc.gui.npc-display-gui")`.
 *
 * `sc.NPCDisplayGui` — a GUI element that renders an NPC character's
 * idle (or specified) animation in a private game-state view, used for
 * dialogue portraits and similar displays. Supports effect playback
 * (e.g., flash or appear/disappear effects) on the rendered character.
 */
ig.module("game.feature.npc.gui.npc-display-gui").requires(
    "impact.feature.gui.gui"
).defines(function () {

    sc.NPCDisplayGui = ig.GuiElementBase.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            HIDDEN: {
                state: {
                    alpha: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.EASE_IN
            }
        },
        npc: null,
        gameState: null,
        animSheet: null,
        size: {
            x: 0,
            y: 0
        },
        displayOffset: {
            x: 0,
            y: 0
        },
        hideBackground: false,
        entity: null,
        callback: null,
        skipIfLoaded: false,
        anim: "idle",
        effect: null,
        effectEntity: null,

        /** @param {string} characterName */
        /** @param {object} [gameState] */
        /** @param {string} [anim="idle"] */
        /** @param {function} [callback] */
        /** @param {boolean} [invisibleUpdate=false] */
        init: function (characterName, gameState, anim, callback, invisibleUpdate) {
            this.parent();
            this.hook.invisibleUpdate = invisibleUpdate || false;
            this.callback = callback;
            this.anim = anim || "idle";
            this.npc = new sc.Character(characterName);
            this.doStateTransition("HIDDEN", true);
            if (this.npc.loaded && gameState) this.skipIfLoaded = true;
            this.npc.addLoadListener(this);
        },

        /**
         * Create the private game state, spawn an entity with the
         * character's animation, run any callback, then pop the state.
         */
        initGameState: function () {
            this.gameState = new ig.GameState;
            this.gameState.initEmpty(this.hook.size.x, this.hook.size.y);
            ig.game.pushState(this.gameState);
            this.entity = ig.game.spawnEntity(ig.ActorEntity, 0, this.size.z, 0, {});
            this.entity.setSize(this.size.x, this.size.y, this.size.z);
            this.entity.animSheet = this.animSheet;
            this.entity.initAnimations();
            this.entity.setCurrentAnim(this.anim);
            this.callback && this.callback(this);
            ig.game.popState();
        },

        /**
         * Spawn an effect on the rendered entity in its private game state.
         * @param {string} sheet
         * @param {string} name
         * @param {object} [options]
         */
        playEffect: function (sheet, name, options) {
            this.effect && this.effect.clearCached();
            this.effect = new ig.EffectHandle({
                sheet: sheet,
                name: name
            });
            ig.game.pushState(this.gameState);
            if (this.entity) this.effectEntity = this.effect.spawnOnTarget(this.entity, options);
            ig.game.popState();
        },

        /** Remove every Effect entity attached to the rendered entity. */
        clearEffects: function () {
            this.entity && this.entity.clearEntityAttached(function (e) {
                return e instanceof ig.ENTITY.Effect;
            }.bind(this));
        },

        /** Release character, anim sheet, game state and effect references. */
        onDetach: function () {
            this.npc && this.npc.decreaseRef();
            this.npc = null;
            this.animSheet && this.animSheet.decreaseRef();
            this.animSheet = null;
            this.gameState && this.gameState.clear();
            this.gameState = null;
            this.effect && this.effect.clearCached();
        },

        /**
         * Two-phase load listener: on character load, read size/offset
         * and start loading the anim sheet; on anim-sheet load, init the
         * game state and transition to visible.
         * @param {boolean} success
         * @param {object} loadable
         */
        onLoadableComplete: function (success, loadable) {
            if (success && this.npc) {
                if (loadable == this.npc) {
                    var charData = this.npc.data;
                    Vec3.assign(this.size, charData.size || {
                        x: 12,
                        y: 12,
                        z: 28
                    });
                    Vec2.assign(this.displayOffset, charData.displayOffset || {
                        x: 0,
                        y: 0
                    });
                    if (charData.displayOffset) {
                        this.hideBackground = charData.displayOffset.hideBackground;
                    }
                    this.setSize(this.size.x, this.size.y + this.size.z);
                    this.setPivot(this.hook.size.x / 2, this.hook.size.y / 2);
                    this.animSheet = new ig.AnimationSheet(charData.animSheet);
                    this.animSheet.addLoadListener(this);
                } else if (loadable == this.animSheet) {
                    this.initGameState();
                    this.doStateTransition("DEFAULT", this.skipIfLoaded);
                }
            }
        },

        update: function () {
            this.gameState && this.gameState.forceUpdate();
        },

        /** @param {ig.Renderer} renderer */
        updateDrawables: function (renderer) {
            this.gameState && renderer.addGameStateDraw(this.gameState, 0, 0);
        }
    });
});
ig.baked = !0;
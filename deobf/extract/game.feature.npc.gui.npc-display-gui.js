ig.module("game.feature.npc.gui.npc-display-gui").requires("impact.feature.gui.gui").defines(function() {
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
        init: function(b, a, d, c, e) {
            this.parent();
            this.hook.invisibleUpdate = e || false;
            this.callback = c;
            this.anim = d || "idle";
            this.npc = new sc.Character(b);
            this.doStateTransition("HIDDEN", true);
            if (this.npc.loaded && a) this.skipIfLoaded = true;
            this.npc.addLoadListener(this)
        },
        initGameState: function() {
            this.gameState = new ig.GameState;
            this.gameState.initEmpty(this.hook.size.x, this.hook.size.y);
            ig.game.pushState(this.gameState);
            this.entity = ig.game.spawnEntity(ig.ActorEntity, 0, this.size.z, 0, {});
            this.entity.setSize(this.size.x, this.size.y, this.size.z);
            this.entity.animSheet =
                this.animSheet;
            this.entity.initAnimations();
            this.entity.setCurrentAnim(this.anim);
            this.callback && this.callback(this);
            ig.game.popState()
        },
        playEffect: function(b, a, d) {
            this.effect && this.effect.clearCached();
            this.effect = new ig.EffectHandle({
                sheet: b,
                name: a
            });
            ig.game.pushState(this.gameState);
            if (this.entity) this.effectEntity = this.effect.spawnOnTarget(this.entity, d);
            ig.game.popState()
        },
        clearEffects: function() {
            this.entity && this.entity.clearEntityAttached(function(b) {
                return b instanceof ig.ENTITY.Effect
            }.bind(this))
        },
        onDetach: function() {
            this.npc && this.npc.decreaseRef();
            this.npc = null;
            this.animSheet && this.animSheet.decreaseRef();
            this.animSheet = null;
            this.gameState && this.gameState.clear();
            this.gameState = null;
            this.effect && this.effect.clearCached()
        },
        onLoadableComplete: function(b, a) {
            if (b && this.npc)
                if (a == this.npc) {
                    var d = this.npc.data;
                    Vec3.assign(this.size, d.size || {
                        x: 12,
                        y: 12,
                        z: 28
                    });
                    Vec2.assign(this.displayOffset, d.displayOffset || {
                        x: 0,
                        y: 0
                    });
                    if (d.displayOffset) this.hideBackground = d.displayOffset.hideBackground;
                    this.setSize(this.size.x,
                        this.size.y + this.size.z);
                    this.setPivot(this.hook.size.x / 2, this.hook.size.y / 2);
                    this.animSheet = new ig.AnimationSheet(d.animSheet);
                    this.animSheet.addLoadListener(this)
                } else if (a == this.animSheet) {
                this.initGameState();
                this.doStateTransition("DEFAULT", this.skipIfLoaded)
            }
        },
        update: function() {
            this.gameState && this.gameState.forceUpdate()
        },
        updateDrawables: function(b) {
            this.gameState && b.addGameStateDraw(this.gameState, 0, 0)
        }
    })
});
ig.baked = !0;

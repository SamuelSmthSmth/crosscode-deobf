ig.module("game.feature.combat.gui.enemy-display-gui").requires("impact.feature.gui.gui").defines(function() {
    sc.EnemyDisplayGui = ig.GuiElementBase.extend({
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
        enemy: null,
        gameState: null,
        entity: null,
        callback: null,
        skipIfLoaded: false,
        displayOffset: {
            x: 0,
            y: 0
        },
        anim: "idle",
        randomAnim: null,
        boosted: false,
        randomTimer: 0,
        randomReset: 0,
        init: function(b, a, d, c, e, f) {
            this.parent();
            this.callback = c;
            this.anim = d || "idle";
            this.boosted = f || false;
            if (this.randomAnim = e || null) this.randomTimer = 5 + Math.random() * 10;
            this.enemy = new sc.EnemyType(b);
            this.doStateTransition("HIDDEN", true);
            if (this.enemy.loaded && a) this.skipIfLoaded = true;
            this.enemy.addLoadListener(this);
            this.enemy.loaded && this.callback && this.callback(this)
        },
        onDetach: function() {
            this.enemy && this.enemy.decreaseRef();
            this.enemy = null;
            this.gameState && this.gameState.clear();
            this.gameState = null
        },
        onLoadableComplete: function(b, a) {
            if (this.enemy)
                if (a ==
                    this.enemy) {
                    var d = sc.combat.getEnemyMenuOffset(this.enemy.path);
                    this.displayOffset.x = d ? d.x : 0;
                    this.displayOffset.y = d ? d.y : 0;
                    this.setSize(this.enemy.size.x, this.enemy.size.y + this.enemy.size.z);
                    this.setPivot(this.hook.size.x / 2, this.hook.size.y / 2);
                    this.enemy.animSheet.addLoadListener(this)
                } else if (a == this.enemy.animSheet) {
                this.initGameState();
                this.doStateTransition("DEFAULT", this.skipIfLoaded)
            }
        },
        initGameState: function() {
            this.gameState = new ig.GameState;
            this.gameState.initEmpty(this.hook.size.x, this.hook.size.y);
            ig.game.pushState(this.gameState);
            this.entity = ig.game.spawnEntity(ig.ActorEntity, 0, this.enemy.size.z, 0, {});
            this.boosted && sc.combat.canShowBoosted(this.enemy) && sc.combat.effects.combatant.spawnOnTarget("boostedMenu", this.entity, {
                align: "CENTER",
                group: "_boostedFX",
                duration: -1
            });
            this.entity.setSize(this.enemy.size.x, this.enemy.size.y, this.enemy.size.z);
            this.entity.animSheet = this.enemy.animSheet;
            this.entity.initAnimations();
            this.entity.setCurrentAnim(this.anim);
            this.callback && this.callback(this);
            ig.game.popState()
        },
        update: function() {
            if (this.gameState) {
                this.gameState.forceUpdate();
                if (this.randomAnim && this.randomTimer > 0) {
                    this.randomTimer = this.randomTimer - ig.system.actualTick;
                    if (this.randomTimer <= 0)
                        if (this.randomReset) {
                            this.randomReset = false;
                            this.randomTimer = 5 + Math.random() * 10;
                            this.entity.setCurrentAnim(this.anim)
                        } else {
                            this.randomTimer = 2;
                            this.randomReset = true;
                            this.entity.setCurrentAnim(this.randomAnim)
                        }
                }
            }
        },
        updateDrawables: function(b) {
            this.gameState && b.addGameStateDraw(this.gameState, 0, 0)
        }
    })
});
ig.baked = !0;

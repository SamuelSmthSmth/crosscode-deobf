ig.module("game.feature.arena.gui.arena-effect-display").requires("impact.feature.gui.gui").defines(function() {
    sc.ArenaMedalEffect = ig.GuiElementBase.extend({
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
        medal: 0,
        isTrophy: false,
        display: null,
        container: null,
        effectDone: false,
        init: function() {
            this.parent();
            this.setSize(128, 128);
            this.setPivot(64, 64);
            this.hook.invisibleUpdate =
                true;
            this.container = new ig.GuiElementBase;
            this.container.hook.invisibleUpdate = true;
            this.container.hook.clip = true;
            this.container.setSize(128, 128);
            this.container.setPos(0, 0);
            this.addChildGui(this.container)
        },
        show: function(b, a) {
            this.medal = b || false;
            this.isTrophy = a || false;
            this.display && this.display.remove(true);
            this.display = new sc.NPCDisplayGui("misc.menu-effect-large", true, null, this.onLoaded.bind(this), true);
            this.container.addChildGui(this.display)
        },
        hide: function(b) {
            b && this.display.clearEffects();
            this.display &&
                this.display.remove(true);
            this.doStateTransition("HIDDEN", true, true)
        },
        getMedalEffectName: function(b, a) {
            if (a) switch (b) {
                case 1:
                    return "bronze-trophy";
                case 2:
                    return "silver-trophy";
                case 3:
                    return "gold-trophy";
                case 4:
                    return "platin-trophy";
                case 5:
                    return "true-platin-trophy"
            } else switch (b) {
                case 1:
                    return "bronze";
                case 2:
                    return "silver";
                case 3:
                    return "gold";
                case 4:
                    return "platin"
            }
            return "test1"
        },
        onLoaded: function(b) {
            if (b.npc) {
                b.setPos(this.container.hook.size.x / 2 - b.hook.size.x / 2, this.container.hook.size.y / 2 - b.hook.size.y /
                    2);
                b.playEffect("arena", this.getMedalEffectName(this.medal, this.isTrophy), {
                    callback: this,
                    align: ig.ENTITY_ALIGN.CENTER,
                    offset: {
                        x: 0,
                        y: 0
                    },
                    duration: -1
                })
            }
        },
        onEffectEvent: function(b) {
            if (b.state == ig.EFFECT_STATE.ENDED) this.effectDone = true
        }
    })
});
ig.baked = !0;

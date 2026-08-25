ig.module("game.feature.gui.hud.money-hud").requires("game.feature.gui.hud.right-hud").defines(function() {
    sc.MoneyTextGui = ig.GuiElementBase.extend({
        gfx: new ig.Image("media/gui/message.png"),
        number: null,
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            },
            HIDDEN: {
                state: {
                    scaleY: 0
                },
                time: 0.2,
                timeFunction: KEY_SPLINES.LINEAR
            }
        },
        noIcon: false,
        init: function(b, a) {
            this.parent();
            this.noIcon = a || false;
            this.number = new sc.NumberGui(9999999, {
                showPlus: !b,
                signed: true,
                transitionTime: 0.5
            });
            this.number.setPos(0,
                2);
            this.addChildGui(this.number);
            this.hook.size.x = this.number.hook.size.x + (a ? 0 : 14);
            this.hook.size.y = this.number.hook.size.y + 4;
            this.hook.pivot.x = this.hook.size.x;
            this.hook.pivot.y = b ? this.hook.size.y : 0
        },
        updateDrawables: function(b) {
            this.noIcon || b.addGfx(this.gfx, this.hook.size.x - 10, 2, 0, 88, 10, 8)
        }
    });
    sc.MoneyContentGui = ig.GuiElementBase.extend({
        plusGui: null,
        sumGui: null,
        init: function() {
            this.parent();
            this.plusGui = new sc.MoneyTextGui(false);
            this.sumGui = new sc.MoneyTextGui(true);
            this.addChildGui(this.plusGui);
            this.addChildGui(this.sumGui);
            this.hook.size.x = this.plusGui.hook.size.x;
            this.hook.size.y = this.plusGui.hook.size.y
        },
        showPlus: function(b) {
            this.sumGui.doStateTransition("HIDDEN", true);
            this.plusGui.doStateTransition("DEFAULT", true);
            this.plusGui.number.setNumber(b)
        },
        showSum: function(b) {
            this.plusGui.doStateTransition("HIDDEN");
            this.sumGui.doStateTransition("DEFAULT");
            this.sumGui.number.setNumber(b)
        },
        clear: function() {
            this.plusGui.number.setNumber(0, true)
        }
    });
    sc.MoneyHudBox = sc.RightHudBoxGui.extend({
        contentGui: null,
        addedSum: 0,
        timer: 0,
        init: function() {
            this.parent(ig.lang.get("sc.gui.money-hud.title"));
            this.contentGui = new sc.MoneyContentGui;
            this.pushContent(this.contentGui);
            sc.Model.addObserver(sc.model.player, this);
            sc.Model.addObserver(sc.model, this)
        },
        update: function() {
            if (this.timer > 0) {
                var b = this.timer;
                this.timer = this.timer - ig.system.actualTick;
                if (this.timer <= 0) {
                    this.addedSum = 0;
                    this.contentGui.clear();
                    this.hide()
                }
                b > 2 && this.timer <= 2 && this.showSum()
            }
        },
        modelChanged: function(b, a, d) {
            if (b == sc.model.player) a == sc.PLAYER_MSG.CREDIT_CHANGE &&
                sc.options.get("show-money") && this.addMoney(d);
            else if (b == sc.model) {
                b.player.getCore(sc.PLAYER_CORE.CREDITS);
                if (a == sc.GAME_MODEL_MSG.SUB_STATE_CHANGED && sc.model.prevSubState != sc.GAME_MODEL_SUBSTATE.QUESTSOLVED) {
                    this.timer = this.addedSum = 0;
                    this.contentGui.clear();
                    this.hide()
                }
            }
        },
        addMoney: function(b) {
            this.addedSum = this.addedSum + b;
            this.contentGui.showPlus(this.addedSum);
            this.timer = 5;
            this.show()
        },
        showSum: function() {
            this.contentGui.showSum(sc.model.player.credit)
        }
    })
});
ig.baked = !0;

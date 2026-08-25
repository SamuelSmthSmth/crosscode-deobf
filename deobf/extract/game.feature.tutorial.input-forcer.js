ig.module("game.feature.tutorial.input-forcer").requires("impact.base.game", "impact.feature.gui.gui").defines(function() {
    sc.InputForcerGui = ig.GuiElementBase.extend({
        titleText: null,
        hintText: null,
        transitions: {
            DEFAULT: {
                state: {
                    alpha: 1
                },
                time: 0.1,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            HIDDEN: {
                state: {
                    alpha: 0,
                    scaleX: 1.5,
                    scaleY: 1.5
                },
                time: 0.1,
                timeFunction: KEY_SPLINES.EASE_OUT
            }
        },
        init: function() {
            this.parent();
            this.hook.temporary = true;
            this.setSize(ig.system.width, ig.system.height);
            this.setPivot(ig.system.width / 2,
                ig.system.height / 2);
            this.titleText = new sc.TextGui("", {
                maxWidth: 300,
                textAlign: ig.Font.ALIGN.CENTER
            });
            this.titleText.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.titleText.setPos(0, -64);
            this.addChildGui(this.titleText);
            this.hintText = new sc.TextGui("", {
                maxWidth: 300,
                textAlign: ig.Font.ALIGN.CENTER
            });
            this.hintText.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
            this.hintText.setPos(0, 64);
            this.addChildGui(this.hintText)
        },
        show: function(a, b) {
            this.titleText.setText(ig.LangLabel.getText(b.title));
            ig.input.currentDevice == ig.INPUT_DEVICES.GAMEPAD ? this.hintText.setText(ig.LangLabel.getText(b.textGamepad)) : this.hintText.setText(ig.LangLabel.getText(b.textKeyboard));
            ig.gui.addGuiElement(this);
            this.doStateTransition("HIDDEN", true);
            this.doStateTransition("DEFAULT")
        },
        remove: function() {
            this.doStateTransition("HIDDEN", false, true)
        }
    });
    sc.InputForcer = ig.GameAddon.extend({
        activeEntry: null,
        texts: {
            title: null,
            textKeyboard: null,
            textGamepad: null
        },
        gui: null,
        blocked: false,
        darknessHandle: null,
        lightHandle: null,
        inputSubmitted: false,
        sounds: {
            start: new ig.Sound("media/sound/hud/popup-2.ogg", 1)
        },
        init: function() {
            this.parent("InputForcer");
            this.gui = new sc.InputForcerGui
        },
        setEntry: function(a, b, e, f) {
            this.activeEntry = sc.INPUT_FORCER_ENTRIES[a] || null;
            this.texts.title = b;
            this.texts.textGamepad = f;
            this.texts.textKeyboard = e;
            this.update()
        },
        isBlocking: function() {
            return this.blocked
        },
        clearEntry: function() {
            this.blocked && this._endBlock();
            this.activeEntry = null
        },
        isSubmitted: function() {
            return this.inputSubmitted
        },
        preUpdateOrder: 10,
        onPreUpdate: function() {
            this.update()
        },
        onReset: function() {
            this.clearEntry()
        },
        update: function() {
            if (this.activeEntry) {
                var a = this.activeEntry.check();
                !a && !this.blocked ? this._startBlock(this.activeEntry.cancelAction) : a && this.blocked && this._endBlock();
                if (a && !this.activeEntry.keep) this.activeEntry = null;
                if (a) this.inputSubmitted = true
            } else this.inputSubmitted = false
        },
        _startBlock: function(a) {
            this.gui.show(this.activeEntry, this.texts);
            ig.slowMotion.add(0, 0, "forceInput");
            ig.slowMotion.forceUpdate();
            ig.soundManager.pushPaused();
            this.sounds.start.play();
            this.darknessHandle = new ig.DarknessHandle(true);
            this.darknessHandle.setTemporary(null, 0.8, -1, 0.2, 0.2);
            ig.light.addDarknessHandle(this.darknessHandle);
            this.blocked = true;
            a && ig.game.playerEntity.cancelAction();
            this.lightHandle = new ig.LightHandle(ig.game.playerEntity, ig.LIGHT_SIZE.L, 0, 0, -1, 1, false);
            ig.light.addLightHandle(this.lightHandle)
        },
        _endBlock: function() {
            ig.soundManager.popPaused();
            ig.slowMotion.clearNamed("forceInput", 0);
            ig.slowMotion.forceUpdate();
            this.darknessHandle.stop();
            this.lightHandle.stop();
            this.blocked = false;
            this.gui.remove();
            var a = ig.game.playerEntity;
            a && (a.currentAction && a.currentAction.eventAction) && a.cancelAction()
        }
    });
    ig.addGameAddon(function() {
        return sc.inputForcer = new sc.InputForcer
    });
    sc.INPUT_FORCER_ENTRIES = {};
    var b = Vec2.create(),
        a = Vec2.create();
    sc.INPUT_FORCER_ENTRIES.DODGE_RIGHT = {
        cancelAction: true,
        check: function() {
            if (!sc.control.dashing()) return false;
            sc.control.moveDir(b, 0, true);
            if (Vec2.isZero(b)) return false;
            Vec2.assignC(a, 1, 0);
            return Vec2.angle(a, b) > Math.PI * 0.2 ? false : true
        },
        keep: false
    };
    sc.INPUT_FORCER_ENTRIES.ATTACK_LEFT = {
        cancelAction: true,
        check: function() {
            return !sc.control.fullScreenAttacking() ? false : true
        },
        keep: false
    };
    sc.INPUT_FORCER_ENTRIES.CHARGE_HOLD = {
        check: function() {
            return !sc.control.charge() ? false : true
        },
        keep: true
    };
    sc.INPUT_FORCER_ENTRIES.CHARGE_RELEASE = {
        check: function() {
            return sc.control.charge() ? false : true
        },
        keep: false
    }
});
ig.baked = !0;

ig.module("game.feature.gui.hud.item-hud").requires("game.feature.gui.hud.right-hud", "game.feature.model.options-model").defines(function() {
    sc.ItemContent = ig.GuiElementBase.extend({
        timer: 0,
        id: -1,
        amount: 0,
        textGui: null,
        amountGui: null,
        init: function(b, a) {
            this.parent();
            this.id = b == void 0 ? -1 : b;
            this.amount = a || 1;
            this.timer = 3;
            var d = sc.inventory.items[b],
                d = "\\i[" + ((d.icon || "item-default") + sc.inventory.getRaritySuffix(d.rarity || 0)) + "]" + ig.LangLabel.getText(d.name) + " x",
                c = sc.options.get("item-hud-size") == sc.ITEM_HUD_SIZE.NORMAL;
            this.textGui = new sc.TextGui(d, {
                speed: ig.TextBlock.SPEED.IMMEDIATE,
                font: c ? sc.fontsystem.font : sc.fontsystem.smallFont
            });
            this.textGui.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_CENTER);
            this.amountGui = new sc.NumberGui(99, {
                size: c ? sc.NUMBER_SIZE.TEXT : sc.NUMBER_SIZE.SMALL
            });
            this.amountGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_CENTER);
            this.amountGui.setNumber(this.amount);
            this.addChildGui(this.textGui);
            this.addChildGui(this.amountGui);
            this.increaseNumber(0);
            this.setSize(this.textGui.hook.size.x + this.amountGui.hook.size.x +
                4, c ? 18 : 8);
            this.hook.pivot.x = this.hook.size.x;
            this.hook.pivot.y = 0
        },
        updateOption: function(b) {
            if (b) {
                if (this.textGui.font == sc.fontsystem.font) return;
                this.textGui.setFont(sc.fontsystem.font);
                this.amountGui.setSize(sc.NUMBER_SIZE.TEXT)
            } else {
                if (this.textGui.font == sc.fontsystem.smallFont) return;
                this.textGui.setFont(sc.fontsystem.smallFont);
                this.amountGui.setSize(sc.NUMBER_SIZE.SMALL)
            }
            this.setSize(this.textGui.hook.size.x + this.amountGui.hook.size.x + 4, b ? 18 : 8)
        },
        updateTimer: function() {
            if (this.timer > 0) this.timer =
                this.timer - ig.system.tick
        },
        increaseNumber: function(b, a) {
            this.amount = this.amount + (b || 0);
            this.amountGui.setNumber(this.amount, a);
            this.timer = 3
        }
    });
    sc.ItemHudBox = sc.RightHudBoxGui.extend({
        delayedStack: [],
        size: 0,
        init: function() {
            this.parent(ig.lang.get("sc.gui.item-hud.title"));
            this.size = sc.options.get("item-hud-size");
            sc.Model.addObserver(sc.model.player, this);
            sc.Model.addObserver(sc.model, this);
            sc.Model.addObserver(sc.options, this)
        },
        addEntry: function(b, a) {
            var d = null;
            if ((d = this._isInEntries(b)) != null) d.increaseNumber(a,
                this.contentEntries.length <= 5);
            else {
                d = new sc.ItemContent(b, a);
                this.contentEntries.length >= 5 ? this.delayedStack.push(d) : this.pushContent(d, true);
                this.hidden && this.show()
            }
        },
        update: function() {
            if (!sc.model.isPaused() && !sc.model.isMenu() && !this.hidden) {
                for (var b = this.contentEntries.length, a = null; b--;) {
                    a = this.contentEntries[b].subGui;
                    a.updateTimer();
                    if (a.timer <= 0) {
                        a = this.removeContent(b);
                        if (b == 0 && this.contentEntries.length == 0) a.hook.pivot.y = a.hook.size.y / 2;
                        else {
                            a.hook.pivot.y = 0;
                            a.hook.anim.timeFunction =
                                KEY_SPLINES.EASE_OUT
                        }
                        this._popDelayed()
                    }
                }!this.hidden && this.contentEntries.length == 0 && this.hide()
            }
        },
        _isInEntries: function(b) {
            for (var a = this.contentEntries.length; a--;)
                if (this.contentEntries[a].subGui.id == b) return this.contentEntries[a].subGui;
            for (a = this.delayedStack.length; a--;)
                if (this.delayedStack[a].id == b) return this.delayedStack[a];
            return null
        },
        _popDelayed: function() {
            if (this.delayedStack.length != 0) {
                var b = this.delayedStack.splice(0, 1)[0];
                this.pushContent(b, true)
            }
        },
        _updateSizes: function(b) {
            for (var a =
                    this.contentEntries.length, d = null; a--;) {
                d = this.contentEntries[a];
                d.subGui.updateOption(b);
                d.setContent(d.subGui)
            }
            this.rearrangeContent()
        },
        modelChanged: function(b, a, d) {
            if (b == sc.model.player) a == sc.PLAYER_MSG.ITEM_OBTAINED && sc.options.get("show-items") && !d.skip && this.addEntry(d.id, d.amount, d.cutscene);
            else if (b == sc.model)
                if (b.isReset()) {
                    this.clearContent();
                    this.delayedStack.length = 0;
                    this.hide()
                } else b.isCutscene() || b.isHUDBlocked() || sc.quests.hasQuestSolvedDialogs() ? this.hide() : !b.isCutscene() && (!b.isHUDBlocked() &&
                    this.contentEntries.length > 0 && !sc.quests.hasQuestSolvedDialogs()) && this.show();
            else if (b == sc.options && a == sc.OPTIONS_EVENT.OPTION_CHANGED) {
                b = sc.options.get("item-hud-size");
                if (b != this.size) {
                    this._updateSizes(b == sc.ITEM_HUD_SIZE.NORMAL);
                    this.size = b
                }
            }
        }
    })
});
ig.baked = !0;

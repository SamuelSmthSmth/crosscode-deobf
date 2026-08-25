ig.module("game.feature.combat.gui.status-bar").requires("impact.feature.gui.gui").defines(function() {
    var b = Vec2.create();
    sc.STATUS_BAR_ENTRY = {
        BREAK: {
            icon: 0,
            init: null,
            barY: 40
        },
        BURN: {
            icon: 2,
            init: null,
            barY: 44,
            half: true
        },
        CHILL: {
            icon: 3,
            init: null,
            barY: 48,
            half: true
        },
        WEAK: {
            icon: 4,
            init: null,
            barY: 52,
            half: true
        },
        BRITTLE: {
            icon: 5,
            init: null,
            barY: 56,
            half: true
        }
    };
    var a = {};
    ig.GUI.StatusBar = ig.GuiElementBase.extend({
        transitions: {
            DEFAULT: {
                state: {},
                time: 0.25,
                timeFunction: KEY_SPLINES.EASE_OUT
            },
            HIDDEN: {
                state: {
                    scaleX: 1,
                    scaleY: 0,
                    angle: Math.PI * 0.1
                },
                time: 0.25,
                timeFunction: KEY_SPLINES.EASE_IN
            }
        },
        gfx: new ig.Image("media/gui/status-gui.png"),
        barIconTiles: new ig.TileSheet("media/gui/status-gui.png", 8, 8, 240, 0, 2),
        target: null,
        replaceTarget: null,
        currentHp: 0,
        targetHp: 0,
        timer: 0,
        largeTimer: 0,
        subHpHandler: null,
        subHpType: 0,
        statusEntries: {},
        statusDisplayOrder: [],
        init: function(a) {
            this.parent();
            this.setSize(24, 4);
            this.setPivot(12, 2);
            this.hook.localAlpha = 0.7;
            this.hook.zIndex = -50;
            this.hook.invisibleUpdate = true;
            this.doStateTransition("HIDDEN",
                true);
            this.target = a;
            this.initStatusEntries();
            a.params && this.initWithParams()
        },
        showHpBar: function() {
            if (!this.target.params) return false;
            var a = sc.options.get("hp-bars");
            return this.target.isPlayer ? a == sc.HP_BARS.LEA : this.target.party == sc.COMBATANT_PARTY.PLAYER ? a <= sc.HP_BARS.PARTY : this.target instanceof ig.ENTITY.Enemy && (this.target.visibility.hpBar == sc.ENEMY_HP_BAR.HIDDEN || this.target.visibility.hpBar != sc.ENEMY_HP_BAR.VISIBLE && this.target.aggression == sc.ENEMY_AGGRESSION.PEACEFUL) ? false : !this.subHpHandler
        },
        initWithParams: function() {
            if (this.target.params) {
                this.currentHp = this.targetHp = this.target.params.currentHp;
                sc.Model.addObserver(this.target.params, this);
                sc.Model.addObserver(sc.pvp, this);
                this.updateSubHpHandler();
                this.target instanceof ig.ENTITY.Enemy && this.target.visibility.analyzable && this.doStateTransition("DEFAULT")
            }
        },
        updateSubHpHandler: function() {
            var a = null;
            this.target.party == sc.COMBATANT_PARTY.ENEMY && sc.pvp.isCombatantInPvP(this.target) ? a = "PVP" : this.target.isBoss && this.target.isBoss() && (a = "BOSS");
            if (this.subHpType != a) {
                if (this.subHpHandler) {
                    this.subHpHandler.remove();
                    this.subHpHandler = null
                }
                if (this.subHpType = a) {
                    this.subHpHandler = new sc.SUB_HP_EDITOR[a](this.target);
                    ig.gui.addGuiElement(this.subHpHandler);
                    this.subHpHandler.initWithParams()
                }
            }
        },
        modelChanged: function(a, b, e) {
            a == sc.pvp ? this.updateSubHpHandler() : (b == sc.COMBAT_PARAM_MSG.HP_CHANGED || b == sc.COMBAT_PARAM_MSG.STATS_CHANGED) && this.setHp(this.target.params.currentHp, e)
        },
        initStatusEntries: function() {
            for (var a in sc.STATUS_BAR_ENTRY) this.statusEntries[a] = {
                value: 0,
                timer: 0
            }
        },
        _shiftFrontStatusDisplayOrder: function(a, b) {
            var e = this.statusDisplayOrder.indexOf(a);
            if (!(b && e == -1) && (!this.statusDisplayOrder.length || e != this.statusDisplayOrder.length - 1)) {
                e != -1 && this.statusDisplayOrder.splice(e, 1);
                this.statusDisplayOrder.push(a)
            }
        },
        setStatusEntry: function(a, b) {
            this._shiftFrontStatusDisplayOrder(a);
            a != "BREAK" && this._shiftFrontStatusDisplayOrder("BREAK", true);
            var e = this.statusEntries[a];
            e.value = b;
            e.stick = false;
            e.timer = Math.max(e.timer, 2)
        },
        updateStatusEntry: function(a,
            b) {
            this.statusEntries[a].value = b
        },
        setReplaceTarget: function(a) {
            this.replaceTarget = a
        },
        setStatusEntryStick: function(a, b) {
            if (b) {
                this._shiftFrontStatusDisplayOrder(a);
                a != "BREAK" && this._shiftFrontStatusDisplayOrder("BREAK", true)
            }
            var e = this.statusEntries[a];
            if (e.stick = b) e.timer = 2
        },
        clearStatusEntry: function(a) {
            a = this.statusEntries[a];
            a.timer = Math.min(a.timer, 0.1)
        },
        clearAllStatusEntries: function() {
            for (var a = this.statusDisplayOrder.length; a--;) this.clearStatusEntry(this.statusDisplayOrder[a])
        },
        setHp: function(a,
            b) {
            a < 0 && (a = 0);
            if (b) {
                this.largeTimer = this.timer = 0;
                this.targetHp = this.currentHp = a
            } else {
                this.timer = 0.5;
                this.largeTimer = 2;
                if ((this.targetHp - this.currentHp) * (a - this.targetHp) < 0) this.currentHp = this.targetHp;
                this.targetHp = a
            }
        },
        update: function() {
            var a = this.hook;
            a.removeAfterTransition || (this.target instanceof ig.ENTITY.Combatant && this.target.isDefeated() && !sc.pvp.isCombatantInPvP(this.target) ? this.remove() : (this.target._killed || this.target._hidden) && this.remove());
            for (var c = this.statusDisplayOrder.length; c--;) this._updateStatusEntry(this.statusDisplayOrder[c]) &&
                this.statusDisplayOrder.splice(c, 1);
            if (this.statusDisplayOrder.length == 0 && this.replaceTarget) this.replaceTarget = null;
            a.localAlpha = this.largeTimer > 0.2 ? 1 : 0.9;
            if (this.largeTimer > 0) this.largeTimer = this.largeTimer - ig.system.actualTick;
            if (this.timer > 0) this.timer = this.timer - ig.system.actualTick;
            else if (this.targetHp != this.currentHp) {
                c = ig.system.actualTick * this.target.params.getStat("hp") / 2;
                if (this.currentHp > this.targetHp) this.currentHp = Math.max(this.targetHp, this.currentHp - c);
                else if (this.currentHp < this.targetHp) this.currentHp =
                    Math.min(this.targetHp, this.currentHp + c);
                if (this.largeTimer < 0.2) this.largeTimer = 0.2;
                if (this.currentHp == this.targetHp) this.timer = 0.2
            }
            var c = this.replaceTarget || this.target,
                e = c.getCenter();
            ig.system.getScreenFromMapPos(b, Math.round(e.x), Math.round(e.y - c.coll.pos.z + c.coll.size.y / 2));
            this.hook.pos.x = b.x - a.size.x / 2;
            this.hook.pos.y = b.y - a.size.y / 2;
            if (!a.removeAfterTransition) {
                c = false;
                this.target.party == sc.COMBATANT_PARTY.PLAYER && sc.model.isCutscene() && (c = true);
                this.target instanceof ig.ENTITY.Enemy && !this.target.visibility.analyzable &&
                    (c = true);
                c || this.hook.pos.x + a.size.x < 0 || this.hook.pos.x > ig.system.width || this.hook.pos.y + a.size.y < 0 || this.hook.pos.y > ig.system.height ? this.doStateTransition("HIDDEN") : this.doStateTransition("DEFAULT")
            }
        },
        _updateStatusEntry: function(a) {
            a = this.statusEntries[a];
            if (!a.stick || a.timer <= 0.1) a.timer = a.timer - ig.system.actualTick;
            if (a.timer <= 0) a.stick = false;
            return a.timer <= 0
        },
        updateDrawables: function(a) {
            if (!(this.target instanceof ig.ENTITY.Enemy) || sc.options.get("enemy-status-bars")) {
                this.showHpBar() && this._drawHpBar(a);
                for (var b = this.statusDisplayOrder.length, e = 0, f = -5; b--;) {
                    this.drawStatusEntry(a, e, f, this.statusDisplayOrder[b]);
                    f = f - 5;
                    e = e + 3
                }
            }
        },
        _drawHpBar: function(a) {
            var b = this.target.params.getStat("hp"),
                e = this.largeTimer >= 0.2,
                f = e ? 0 : 20;
            if (!e && this.largeTimer >= 0) {
                e = this.largeTimer / 0.2;
                e = Math.floor(e * 24 + (1 - e) * 16)
            } else e = e ? 24 : 16;
            var g = (24 - e) / 2,
                h = (Math.min(this.targetHp, this.currentHp) / b).limit(0, 1),
                i = (Math.max(this.targetHp, this.currentHp) / b).limit(0, 1),
                b = Math.ceil((e - 2) * h) + 1,
                h = Math.ceil((e - 2) * i) + 1,
                i = 0;
            this.target.party ==
                sc.COMBATANT_PARTY.PLAYER ? i = 8 : this.target.target && (i = 4);
            a.addGfx(this.gfx, g, 0, 216, 0 + f + i, b, 4);
            h != b && a.addGfx(this.gfx, b, 0, 216 + b, 16, h - b, 4);
            a.addGfx(this.gfx, g + h, 0, 240 - e + h, 12 + f, e - h, 4)
        },
        drawStatusEntry: function(b, c, e, f) {
            var g = this.statusEntries[f],
                f = sc.STATUS_BAR_ENTRY[f],
                h = 1;
            g.timer < 0.1 && (h = g.timer / 0.1);
            h != 1 && b.addTransform().setPivot(c, e + 2).setScale(1, h);
            var i = 24,
                j = 0;
            if (f.half) j = i = i / 2;
            var k = this.barIconTiles.getTileSrc(a, f.icon);
            if (g.stick) b.addGfx(this.gfx, c - 6, e - 2, k.x, k.y, 8, 8);
            else {
                if (g.timer > 1.7) var l =
                    Math.sin(Math.PI * 8 * (2 - g.timer) / 0.3),
                    c = c + l;
                g = 1 + Math.floor(g.value * (i - 2));
                l = i - 1 - g;
                c = c + j;
                b.addGfx(this.gfx, c, e, 216, f.barY, g, 4);
                l && b.addGfx(this.gfx, c + g, e, 216 + g, 12, l, 4);
                b.addGfx(this.gfx, c + (i - 1), e - 2, k.x + 1, k.y, 7, 8)
            }
            h != 1 && b.undoTransform()
        },
        remove: function() {
            this.target.params && sc.Model.removeObserver(this.target.params, this);
            sc.Model.removeObserver(sc.pvp, this);
            this.doStateTransition("HIDDEN", false, true);
            this.subHpHandler && this.subHpHandler.remove();
            this.subHpHandler = null
        },
        forceRemove: function() {
            this.target.params &&
                sc.Model.removeObserver(this.target.params, this);
            sc.Model.removeObserver(sc.pvp, this);
            this.doStateTransition("HIDDEN", true, true);
            this.subHpHandler && this.subHpHandler.forceRemove();
            this.subHpHandler = null
        }
    })
});
ig.baked = !0;

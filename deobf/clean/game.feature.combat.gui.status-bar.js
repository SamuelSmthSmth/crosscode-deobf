/**
 * game.feature.combat.gui.status-bar
 * ==================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.combat.gui.status-bar")`.
 *
 * `ig.GUI.StatusBar`: the floating HP/status bar above a combatant. Tracks
 * HP change flow, status effect bars (break/burn/chill/weak/brittle), and
 * swaps in a PVP/BOSS sub-HP bar. `sc.STATUS_BAR_ENTRY` is data.
 */
ig.module("game.feature.combat.gui.status-bar")
    .requires("impact.feature.gui.gui")
    .defines(function () {

    var screenPosScratch = Vec2.create();

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

    var tileSrcScratch = {};

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

        init: function (target) {
            this.parent();
            this.setSize(24, 4);
            this.setPivot(12, 2);
            this.hook.localAlpha = 0.7;
            this.hook.zIndex = -50;
            this.hook.invisibleUpdate = true;
            this.doStateTransition("HIDDEN", true);
            this.target = target;
            this.initStatusEntries();
            target.params && this.initWithParams()
        },

        showHpBar: function () {
            if (!this.target.params) return false;
            var hpBarsSetting = sc.options.get("hp-bars");
            return this.target.isPlayer ? hpBarsSetting == sc.HP_BARS.LEA : this.target.party == sc.COMBATANT_PARTY.PLAYER ? hpBarsSetting <= sc.HP_BARS.PARTY : this.target instanceof ig.ENTITY.Enemy && (this.target.visibility.hpBar == sc.ENEMY_HP_BAR.HIDDEN || this.target.visibility.hpBar != sc.ENEMY_HP_BAR.VISIBLE && this.target.aggression == sc.ENEMY_AGGRESSION.PEACEFUL) ? false : !this.subHpHandler
        },

        initWithParams: function () {
            if (this.target.params) {
                this.currentHp = this.targetHp = this.target.params.currentHp;
                sc.Model.addObserver(this.target.params, this);
                sc.Model.addObserver(sc.pvp, this);
                this.updateSubHpHandler();
                this.target instanceof ig.ENTITY.Enemy && this.target.visibility.analyzable && this.doStateTransition("DEFAULT")
            }
        },

        updateSubHpHandler: function () {
            var subHpType = null;
            this.target.party == sc.COMBATANT_PARTY.ENEMY && sc.pvp.isCombatantInPvP(this.target) ? subHpType = "PVP" : this.target.isBoss && this.target.isBoss() && (subHpType = "BOSS");
            if (this.subHpType != subHpType) {
                if (this.subHpHandler) {
                    this.subHpHandler.remove();
                    this.subHpHandler = null
                }
                if (this.subHpType = subHpType) {
                    this.subHpHandler = new sc.SUB_HP_EDITOR[subHpType](this.target);
                    ig.gui.addGuiElement(this.subHpHandler);
                    this.subHpHandler.initWithParams()
                }
            }
        },

        modelChanged: function (model, message, data) {
            model == sc.pvp ? this.updateSubHpHandler() : (message == sc.COMBAT_PARAM_MSG.HP_CHANGED || message == sc.COMBAT_PARAM_MSG.STATS_CHANGED) && this.setHp(this.target.params.currentHp, data)
        },

        initStatusEntries: function () {
            for (var key in sc.STATUS_BAR_ENTRY) this.statusEntries[key] = {
                value: 0,
                timer: 0
            }
        },

        _shiftFrontStatusDisplayOrder: function (entryName, forceFront) {
            var index = this.statusDisplayOrder.indexOf(entryName);
            if (!(forceFront && index == -1) && (!this.statusDisplayOrder.length || index != this.statusDisplayOrder.length - 1)) {
                index != -1 && this.statusDisplayOrder.splice(index, 1);
                this.statusDisplayOrder.push(entryName)
            }
        },

        setStatusEntry: function (entryName, value) {
            this._shiftFrontStatusDisplayOrder(entryName);
            entryName != "BREAK" && this._shiftFrontStatusDisplayOrder("BREAK", true);
            var entry = this.statusEntries[entryName];
            entry.value = value;
            entry.stick = false;
            entry.timer = Math.max(entry.timer, 2)
        },

        updateStatusEntry: function (entryName, value) {
            this.statusEntries[entryName].value = value
        },

        setReplaceTarget: function (target) {
            this.replaceTarget = target
        },

        setStatusEntryStick: function (entryName, stick) {
            if (stick) {
                this._shiftFrontStatusDisplayOrder(entryName);
                entryName != "BREAK" && this._shiftFrontStatusDisplayOrder("BREAK", true)
            }
            var entry = this.statusEntries[entryName];
            if (entry.stick = stick) entry.timer = 2
        },

        clearStatusEntry: function (entryName) {
            var entry = this.statusEntries[entryName];
            entry.timer = Math.min(entry.timer, 0.1)
        },

        clearAllStatusEntries: function () {
            for (var index = this.statusDisplayOrder.length; index--;) this.clearStatusEntry(this.statusDisplayOrder[index])
        },

        setHp: function (hp, instant) {
            hp < 0 && (hp = 0);
            if (instant) {
                this.largeTimer = this.timer = 0;
                this.targetHp = this.currentHp = hp
            } else {
                this.timer = 0.5;
                this.largeTimer = 2;
                if ((this.targetHp - this.currentHp) * (hp - this.targetHp) < 0) this.currentHp = this.targetHp;
                this.targetHp = hp
            }
        },

        update: function () {
            var hook = this.hook;
            hook.removeAfterTransition || (this.target instanceof ig.ENTITY.Combatant && this.target.isDefeated() && !sc.pvp.isCombatantInPvP(this.target) ? this.remove() : (this.target._killed || this.target._hidden) && this.remove());

            for (var index = this.statusDisplayOrder.length; index--;) this._updateStatusEntry(this.statusDisplayOrder[index]) && this.statusDisplayOrder.splice(index, 1);
            if (this.statusDisplayOrder.length == 0 && this.replaceTarget) this.replaceTarget = null;

            hook.localAlpha = this.largeTimer > 0.2 ? 1 : 0.9;
            if (this.largeTimer > 0) this.largeTimer = this.largeTimer - ig.system.actualTick;
            if (this.timer > 0) this.timer = this.timer - ig.system.actualTick;
            else if (this.targetHp != this.currentHp) {
                var hpStep = ig.system.actualTick * this.target.params.getStat("hp") / 2;
                if (this.currentHp > this.targetHp) this.currentHp = Math.max(this.targetHp, this.currentHp - hpStep);
                else if (this.currentHp < this.targetHp) this.currentHp = Math.min(this.targetHp, this.currentHp + hpStep);
                if (this.largeTimer < 0.2) this.largeTimer = 0.2;
                if (this.currentHp == this.targetHp) this.timer = 0.2
            }

            var displayTarget = this.replaceTarget || this.target,
                center = displayTarget.getCenter();
            ig.system.getScreenFromMapPos(screenPosScratch, Math.round(center.x), Math.round(center.y - displayTarget.coll.pos.z + displayTarget.coll.size.y / 2));
            this.hook.pos.x = screenPosScratch.x - hook.size.x / 2;
            this.hook.pos.y = screenPosScratch.y - hook.size.y / 2;

            if (!hook.removeAfterTransition) {
                var hidden = false;
                this.target.party == sc.COMBATANT_PARTY.PLAYER && sc.model.isCutscene() && (hidden = true);
                this.target instanceof ig.ENTITY.Enemy && !this.target.visibility.analyzable && (hidden = true);
                hidden || this.hook.pos.x + hook.size.x < 0 || this.hook.pos.x > ig.system.width || this.hook.pos.y + hook.size.y < 0 || this.hook.pos.y > ig.system.height ? this.doStateTransition("HIDDEN") : this.doStateTransition("DEFAULT")
            }
        },

        _updateStatusEntry: function (entryName) {
            var entry = this.statusEntries[entryName];
            if (!entry.stick || entry.timer <= 0.1) entry.timer = entry.timer - ig.system.actualTick;
            if (entry.timer <= 0) entry.stick = false;
            return entry.timer <= 0
        },

        updateDrawables: function (renderer) {
            if (!(this.target instanceof ig.ENTITY.Enemy) || sc.options.get("enemy-status-bars")) {
                this.showHpBar() && this._drawHpBar(renderer);
                for (var index = this.statusDisplayOrder.length, x = 0, y = -5; index--;) {
                    this.drawStatusEntry(renderer, x, y, this.statusDisplayOrder[index]);
                    y = y - 5;
                    x = x + 3
                }
            }
        },

        _drawHpBar: function (renderer) {
            var maxHp = this.target.params.getStat("hp"),
                isLarge = this.largeTimer >= 0.2,
                yOffset = isLarge ? 0 : 20,
                barHeight;
            if (!isLarge && this.largeTimer >= 0) {
                var largeFactor = this.largeTimer / 0.2;
                barHeight = Math.floor(largeFactor * 24 + (1 - largeFactor) * 16)
            } else barHeight = isLarge ? 24 : 16;
            var xOffset = (24 - barHeight) / 2,
                minFill = (Math.min(this.targetHp, this.currentHp) / maxHp).limit(0, 1),
                maxFill = (Math.max(this.targetHp, this.currentHp) / maxHp).limit(0, 1),
                minFillPx = Math.ceil((barHeight - 2) * minFill) + 1,
                maxFillPx = Math.ceil((barHeight - 2) * maxFill) + 1,
                colorOffset = 0;
            this.target.party == sc.COMBATANT_PARTY.PLAYER ? colorOffset = 8 : this.target.target && (colorOffset = 4);
            renderer.addGfx(this.gfx, xOffset, 0, 216, 0 + yOffset + colorOffset, minFillPx, 4);
            maxFillPx != minFillPx && renderer.addGfx(this.gfx, minFillPx, 0, 216 + minFillPx, 16, maxFillPx - minFillPx, 4);
            renderer.addGfx(this.gfx, xOffset + maxFillPx, 0, 240 - barHeight + maxFillPx, 12 + yOffset, barHeight - maxFillPx, 4)
        },

        drawStatusEntry: function (renderer, x, y, entryName) {
            var entry = this.statusEntries[entryName],
                config = sc.STATUS_BAR_ENTRY[entryName],
                scale = 1;
            entry.timer < 0.1 && (scale = entry.timer / 0.1);
            scale != 1 && renderer.addTransform().setPivot(x, y + 2).setScale(1, scale);
            var barWidth = 24,
                xShift = 0;
            if (config.half) xShift = barWidth = barWidth / 2;
            var tileSrc = this.barIconTiles.getTileSrc(tileSrcScratch, config.icon);
            if (entry.stick) renderer.addGfx(this.gfx, x - 6, y - 2, tileSrc.x, tileSrc.y, 8, 8);
            else {
                if (entry.timer > 1.7) var wobble = Math.sin(Math.PI * 8 * (2 - entry.timer) / 0.3),
                    x = x + wobble;
                var fillPx = 1 + Math.floor(entry.value * (barWidth - 2)),
                    restPx = barWidth - 1 - fillPx;
                x = x + xShift;
                renderer.addGfx(this.gfx, x, y, 216, config.barY, fillPx, 4);
                restPx && renderer.addGfx(this.gfx, x + fillPx, y, 216 + fillPx, 12, restPx, 4);
                renderer.addGfx(this.gfx, x + (barWidth - 1), y - 2, tileSrc.x + 1, tileSrc.y, 7, 8)
            }
            scale != 1 && renderer.undoTransform()
        },

        remove: function () {
            this.target.params && sc.Model.removeObserver(this.target.params, this);
            sc.Model.removeObserver(sc.pvp, this);
            this.doStateTransition("HIDDEN", false, true);
            this.subHpHandler && this.subHpHandler.remove();
            this.subHpHandler = null
        },

        forceRemove: function () {
            this.target.params && sc.Model.removeObserver(this.target.params, this);
            sc.Model.removeObserver(sc.pvp, this);
            this.doStateTransition("HIDDEN", true, true);
            this.subHpHandler && this.subHpHandler.forceRemove();
            this.subHpHandler = null
        }
    })
});
ig.baked = !0;

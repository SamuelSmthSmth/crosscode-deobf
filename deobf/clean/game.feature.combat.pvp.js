/**
 * game.feature.combat.pvp
 * =======================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.combat.pvp")`.
 *
 * `sc.PvpModel`: the PvP addon (round scoring, KO handling, round banners,
 * post-round HP/SP regen). Exposes `sc.PVP_MESSAGE` and a `pvp.*` var accessor.
 */
ig.module("game.feature.combat.pvp")
    .requires("impact.base.game")
    .defines(function () {

    sc.PvpModel = ig.GameAddon.extend({
        observers: [],
        state: 0,
        round: 0,
        winPoints: 0,
        points: {},
        enemies: [],
        lastWinParty: null,
        blocking: false,
        roundGui: null,

        init: function () {
            this.parent("PvP");
            ig.vars.registerVarAccessor("pvp", this, "VarPvpEditor")
        },

        start: function (winPoints, enemies) {
            this.state = 1;
            this.round = 0;
            this.winPoints = winPoints;
            this.points[sc.COMBATANT_PARTY.PLAYER] = 0;
            this.points[sc.COMBATANT_PARTY.ENEMY] = 0;
            this.enemies = enemies;
            sc.Model.notifyObserver(this, sc.PVP_MESSAGE.STARTED, null);
            sc.model.setCombatMode(true, true)
        },

        getDmgFactor: function () {
            return !this.isActive() ? 1 : sc.model.player.hasItem(410) ? 0.2 : sc.model.player.hasItem(223) ? 0.25 : sc.model.player.hasItem(225) ? 0.33 : 0.5
        },

        isActive: function () {
            return this.state != 0
        },

        isKillHit: function () {
            return this.state == 3
        },

        isBrake: function () {
            return this.state == 4
        },

        isFinished: function () {
            return this.state == 5
        },

        isOver: function () {
            return this.points[sc.COMBATANT_PARTY.PLAYER] == this.winPoints || this.points[sc.COMBATANT_PARTY.ENEMY] == this.winPoints
        },

        isCombatantInPvP: function (entity) {
            return !this.isActive() ? false : entity.party == sc.COMBATANT_PARTY.PLAYER ? true : this.enemies.indexOf(entity) != -1
        },

        onPvpCombatantDefeat: function (entity) {
            if (!this.isActive()) return false;
            if (entity.party == sc.COMBATANT_PARTY.PLAYER) {
                if (sc.party.isDefeated()) return this.showKO(sc.COMBATANT_PARTY.ENEMY)
            } else {
                if (this.enemies.indexOf(entity) == -1) return false;
                var allDefeated = true;
                for (var index = this.enemies.length; index--;) this.enemies[index].isDefeated() || (allDefeated = false);
                if (allDefeated) return this.showKO(sc.COMBATANT_PARTY.PLAYER)
            }
        },

        releaseBlocking: function () {
            this.blocking = false
        },

        showKO: function (party) {
            var points = ++this.points[party];
            this.lastWinParty = party;
            if (sc.arena.active) {
                sc.arena.stopTimers();
                sc.arena.onPvpRoundFinished(this.lastWinParty)
            }
            this.state = 3;
            ig.game.varsChangedDeferred();
            var gui = new sc.PvpKoGui;
            ig.gui.addGuiElement(gui);
            return sc.DRAMATIC_EFFECT[points == this.winPoints ? "PVP_FINAL_KO" : "PVP_KO"]
        },

        onPostKO: function (winningParty) {
            var playerRegen = winningParty == sc.COMBATANT_PARTY.ENEMY ? 1 : 0.5,
                enemyRegen = winningParty == sc.COMBATANT_PARTY.ENEMY ? 0.5 : 1;
            ig.game.playerEntity.regenPvp(playerRegen);
            for (var index = sc.party.getPartySize(); index--;) sc.party.getPartyMemberEntityByIndex(index).regenPvp(playerRegen);
            for (index = this.enemies.length; index--;) this.enemies[index].regenPvp(enemyRegen);
            this.state = this.isOver() ? 5 : 4;
            ig.game.varsChangedDeferred()
        },

        startNextRound: function (countdown) {
            this.round = this.round + 1;
            this.roundGui = new sc.PvpRoundGui(this.round, countdown);
            ig.gui.addGuiElement(this.roundGui);
            this.blocking = true
        },

        finalizeRoundStart: function () {
            this.state = 2;
            if (this.roundGui) {
                this.roundGui.remove();
                this.roundGui = null
            }
            for (var index = 0; index < this.enemies.length; ++index) this.enemies[index].setTarget(ig.game.playerEntity, true);
            sc.arena.active && sc.arena.resumeTimers();
            ig.game.varsChangedDeferred();
            this.releaseBlocking()
        },

        stop: function () {
            var flawless = this.points[sc.COMBATANT_PARTY.PLAYER] == this.winPoints && this.points[sc.COMBATANT_PARTY.ENEMY] == 0;
            for (var index = this.enemies.length; index--;) {
                this.enemies[index].onPvpEnd(this.lastWinParty == sc.COMBATANT_PARTY.PLAYER);
                flawless && sc.stats.addMap("pvp", "flawlessWin-" + this.enemies[index].enemyName, 1)
            }
            this.state = 0;
            this.enemies.length = 0;
            sc.Model.notifyObserver(this, sc.PVP_MESSAGE.STOPPED, null);
            sc.model.setCombatMode(false, true)
        },

        onVarAccess: function (pathString, path) {
            if (path[0] == "pvp") switch (path[1]) {
                case "active":
                    return this.state != 0;
                case "brake":
                    return this.state == 4;
                case "killHit":
                    return this.state == 3;
                case "finalHit":
                    return this.state == 3 && this.isOver();
                case "finished":
                    return this.state == 5;
                case "round":
                    return this.round;
                case "lastWinPlayer":
                    return this.lastWinParty == sc.COMBATANT_PARTY.PLAYER;
                case "playerPoints":
                    return this.points[sc.COMBATANT_PARTY.PLAYER];
                case "enemyPoints":
                    return this.points[sc.COMBATANT_PARTY.ENEMY]
            }
            throw Error("Unsupported var access path: " + pathString)
        },

        onPostUpdate: function () {
            if (this.state == 3) {
                var playerDown = true;
                ig.game.playerEntity.dying != sc.DYING_STATE.DYING && (playerDown = false);
                for (var index = sc.party.getPartySize(); index--;) sc.party.getPartyMemberEntityByIndex(index).dying || (playerDown = false);
                var enemiesDown = true;
                for (index = this.enemies.length; index--;) this.enemies[index].dying != sc.DYING_STATE.DYING && (enemiesDown = false);
                if (playerDown || enemiesDown) this.onPostKO(playerDown ? sc.COMBATANT_PARTY.ENEMY : sc.COMBATANT_PARTY.PLAYER)
            }
        },

        onReset: function () {
            this.state = 0;
            sc.Model.notifyObserver(this, sc.PVP_MESSAGE.STOPPED, null);
            this.winPoints = this.round = 0;
            this.enemies.length = 0;
            this.blocking = false;
            if (this.roundGui) {
                this.roundGui.remove();
                this.roundGui = null
            }
        }
    });

    sc.PVP_MESSAGE = {
        STARTED: 1,
        STOPPED: 2,
        ROUND_OVER: 3
    };

    ig.addGameAddon(function () {
        return sc.pvp = new sc.PvpModel
    })
});
ig.baked = !0;

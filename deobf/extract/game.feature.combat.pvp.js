ig.module("game.feature.combat.pvp").requires("impact.base.game").defines(function() {
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
        init: function() {
            this.parent("PvP");
            ig.vars.registerVarAccessor("pvp", this, "VarPvpEditor")
        },
        start: function(b, a) {
            this.state = 1;
            this.round = 0;
            this.winPoints = b;
            this.points[sc.COMBATANT_PARTY.PLAYER] = 0;
            this.points[sc.COMBATANT_PARTY.ENEMY] = 0;
            this.enemies = a;
            sc.Model.notifyObserver(this,
                sc.PVP_MESSAGE.STARTED, null);
            sc.model.setCombatMode(true, true)
        },
        getDmgFactor: function() {
            return !this.isActive() ? 1 : sc.model.player.hasItem(410) ? 0.2 : sc.model.player.hasItem(223) ? 0.25 : sc.model.player.hasItem(225) ? 0.33 : 0.5
        },
        isActive: function() {
            return this.state != 0
        },
        isKillHit: function() {
            return this.state == 3
        },
        isBrake: function() {
            return this.state == 4
        },
        isFinished: function() {
            return this.state == 5
        },
        isOver: function() {
            return this.points[sc.COMBATANT_PARTY.PLAYER] == this.winPoints || this.points[sc.COMBATANT_PARTY.ENEMY] ==
                this.winPoints
        },
        isCombatantInPvP: function(b) {
            return !this.isActive() ? false : b.party == sc.COMBATANT_PARTY.PLAYER ? true : this.enemies.indexOf(b) != -1
        },
        onPvpCombatantDefeat: function(b) {
            if (!this.isActive()) return false;
            if (b.party == sc.COMBATANT_PARTY.PLAYER) {
                if (sc.party.isDefeated()) return this.showKO(sc.COMBATANT_PARTY.ENEMY)
            } else {
                if (this.enemies.indexOf(b) == -1) return false;
                for (var b = true, a = this.enemies.length; a--;) this.enemies[a].isDefeated() || (b = false);
                if (b) return this.showKO(sc.COMBATANT_PARTY.PLAYER)
            }
        },
        releaseBlocking: function() {
            this.blocking = false
        },
        showKO: function(b) {
            var a = ++this.points[b];
            this.lastWinParty = b;
            if (sc.arena.active) {
                sc.arena.stopTimers();
                sc.arena.onPvpRoundFinished(this.lastWinParty)
            }
            this.state = 3;
            ig.game.varsChangedDeferred();
            b = new sc.PvpKoGui;
            ig.gui.addGuiElement(b);
            return sc.DRAMATIC_EFFECT[a == this.winPoints ? "PVP_FINAL_KO" : "PVP_KO"]
        },
        onPostKO: function(b) {
            var a = b == sc.COMBATANT_PARTY.ENEMY ? 1 : 0.5,
                b = b == sc.COMBATANT_PARTY.ENEMY ? 0.5 : 1;
            ig.game.playerEntity.regenPvp(a);
            for (var d = sc.party.getPartySize(); d--;) sc.party.getPartyMemberEntityByIndex(d).regenPvp(a);
            for (d = this.enemies.length; d--;) this.enemies[d].regenPvp(b);
            this.state = this.isOver() ? 5 : 4;
            ig.game.varsChangedDeferred()
        },
        startNextRound: function(b) {
            this.round = this.round + 1;
            this.roundGui = new sc.PvpRoundGui(this.round, b);
            ig.gui.addGuiElement(this.roundGui);
            this.blocking = true
        },
        finalizeRoundStart: function() {
            this.state = 2;
            if (this.roundGui) {
                this.roundGui.remove();
                this.roundGui = null
            }
            for (var b = 0; b < this.enemies.length; ++b) this.enemies[b].setTarget(ig.game.playerEntity, true);
            sc.arena.active && sc.arena.resumeTimers();
            ig.game.varsChangedDeferred();
            this.releaseBlocking()
        },
        stop: function() {
            for (var b = this.enemies.length, a = this.points[sc.COMBATANT_PARTY.PLAYER] == this.winPoints && this.points[sc.COMBATANT_PARTY.ENEMY] == 0; b--;) {
                this.enemies[b].onPvpEnd(this.lastWinParty == sc.COMBATANT_PARTY.PLAYER);
                a && sc.stats.addMap("pvp", "flawlessWin-" + this.enemies[b].enemyName, 1)
            }
            this.state = 0;
            this.enemies.length = 0;
            sc.Model.notifyObserver(this, sc.PVP_MESSAGE.STOPPED, null);
            sc.model.setCombatMode(false, true)
        },
        onVarAccess: function(b, a) {
            if (a[0] ==
                "pvp") switch (a[1]) {
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
            throw Error("Unsupported var access path: " + b);
        },
        onPostUpdate: function() {
            if (this.state ==
                3) {
                var b = true;
                ig.game.playerEntity.dying != sc.DYING_STATE.DYING && (b = false);
                for (var a = sc.party.getPartySize(); a--;) sc.party.getPartyMemberEntityByIndex(a).dying || (b = false);
                for (var d = true, a = this.enemies.length; a--;) this.enemies[a].dying != sc.DYING_STATE.DYING && (d = false);
                if (b || d) this.onPostKO(b ? sc.COMBATANT_PARTY.ENEMY : sc.COMBATANT_PARTY.PLAYER)
            }
        },
        onReset: function() {
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
    ig.addGameAddon(function() {
        return sc.pvp = new sc.PvpModel
    })
});
ig.baked = !0;

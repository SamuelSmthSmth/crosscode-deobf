ig.module("game.feature.game-code.game-code").requires("impact.base.game").defines(function() {
    sc.SPARKLING_SHOES_ID = 101;
    sc.CHRISTMAS_HAD_ID = 168;
    sc.CHRISTMAS_BOOTS_ID = 16;
    sc.GAME_GIMMIKS = {
        SPARKLING_SHOES: {
            text: "sc.gimmick.sparklingShoes",
            addItem: sc.SPARKLING_SHOES_ID
        },
        HOLIDAY_QUEST: {
            text: "sc.gimmick.holidayQuest",
            setKey: "holidayQuest"
        },
        VOICE_ACTING: {
            text: "sc.gimmick.voiceActing",
            textDisable: "sc.gimmick.voiceActingRemove",
            onToggle: function() {
                sc.voiceActing.toggle()
            }
        },
        CARAMELLDANSEN: {
            text: "sc.gimmick.caramelldansen",
            textDisable: "sc.gimmick.caramelldansenRemove",
            setKey: "caramelldansen"
        },
        REGULAR_TREES: {
            text: "sc.gimmick.regularTrees",
            textDisable: "sc.gimmick.regularTreesRemove",
            setKey: "regularTrees"
        },
        SPEEDLINES: {
            text: "sc.gimmick.speedlines",
            textDisable: "sc.gimmick.speedlinesRemove",
            setKey: "speedlines"
        }
    };
    sc.GAME_CODES = {
        "WoN-Boots": sc.GAME_GIMMIKS.SPARKLING_SHOES,
        "Holiday-Man": sc.GAME_GIMMIKS.HOLIDAY_QUEST,
        "Best-VA": sc.GAME_GIMMIKS.VOICE_ACTING,
        Caramelldansen: sc.GAME_GIMMIKS.CARAMELLDANSEN,
        "Regular-Trees": sc.GAME_GIMMIKS.REGULAR_TREES,
        Speedlines: sc.GAME_GIMMIKS.SPEEDLINES
    };
    sc.GameCode = ig.GameAddon.extend({
        enabled: [],
        keys: {},
        init: function() {
            this.parent("GameCode");
            ig.vars.registerVarAccessor("gamecode", this)
        },
        enterCode: function(b, a) {
            var d = sc.GAME_CODES[b];
            if (!d) {
                a || sc.Dialogs.showDialog(ig.lang.get("sc.gimmick.unknown"), null, void 0);
                return false
            }
            var c = false;
            if (this.enabled.indexOf(d) == -1) this.enabled.push(d);
            else if (d.textDisable) {
                this.enabled.erase(d);
                c = true
            }
            var e;
            a || (e = ig.lang.get(c ? d.textDisable : d.text));
            d.setKey && (this.keys[d.setKey] = !c);
            if (d.onToggle) d.onToggle(c);
            a || sc.Dialogs.showDialog(e, null, void 0);
            return true
        },
        isEnabled: function(b) {
            return this.keys[b] || false
        },
        onVarAccess: function(b, a) {
            return this.keys[a[1]] || false
        },
        levelLoadedOrder: 1E3,
        onLevelLoaded: function() {
            for (var b = this.enabled.length; b--;) {
                var a = this.enabled[b];
                a.addItem && sc.model.player.getItemAmountWithEquip(a.addItem) == 0 && sc.model.player.addItem(a.addItem, 1)
            }
        }
    });
    ig.addGameAddon(function() {
        sc.gameCode = new sc.GameCode;
        return sc.gameCode
    });
    sc.submitGameCode = function(b) {
        sc.gameCode.enterCode(b)
    }
});
ig.baked = !0;

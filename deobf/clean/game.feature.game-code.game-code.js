/**
 * game.feature.game-code.game-code
 * ================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.game-code.game-code")`.
 *
 * Cheat-code / gimmick system. The player can enter secret codes
 * (e.g. "Caramelldansen", "Best-VA") to unlock fun cosmetic effects.
 * `sc.GameCode` is the addon; `sc.GAME_CODES` maps code strings to
 * `sc.GAME_GIMMIKS` entries that define the effect.
 */
ig.module("game.feature.game-code.game-code").requires(
    "impact.base.game"
).defines(function () {

    /* ── Gimmick IDs ─────────────────────────────────────────────── */

    sc.SPARKLING_SHOES_ID = 101;
    sc.CHRISTMAS_HAD_ID = 168;
    sc.CHRISTMAS_BOOTS_ID = 16;

    /* ── Gimmick definitions ─────────────────────────────────────── */

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
            onToggle: function () {
                sc.voiceActing.toggle();
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

    /* ── Code → gimmick mapping ──────────────────────────────────── */

    sc.GAME_CODES = {
        "WoN-Boots": sc.GAME_GIMMIKS.SPARKLING_SHOES,
        "Holiday-Man": sc.GAME_GIMMIKS.HOLIDAY_QUEST,
        "Best-VA": sc.GAME_GIMMIKS.VOICE_ACTING,
        Caramelldansen: sc.GAME_GIMMIKS.CARAMELLDANSEN,
        "Regular-Trees": sc.GAME_GIMMIKS.REGULAR_TREES,
        Speedlines: sc.GAME_GIMMIKS.SPEEDLINES
    };

    /* ── sc.GameCode addon ───────────────────────────────────────── */

    sc.GameCode = ig.GameAddon.extend({
        enabled: [],
        keys: {},

        init: function () {
            this.parent("GameCode");
            ig.vars.registerVarAccessor("gamecode", this);
        },

        /**
         * Enter a game code. Shows a success/failure message unless
         * `silent` is true. Toggles gimmicks if the code is already
         * enabled and has a disable text.
         * @param {string} code
         * @param {boolean} [silent]
         * @returns {boolean} success
         */
        enterCode: function (code, silent) {
            var gimmick = sc.GAME_CODES[code];
            if (!gimmick) {
                silent || sc.Dialogs.showDialog(
                    ig.lang.get("sc.gimmick.unknown"), null, void 0
                );
                return false;
            }

            var disabling = false;
            if (this.enabled.indexOf(gimmick) == -1) {
                this.enabled.push(gimmick);
            } else if (gimmick.textDisable) {
                this.enabled.erase(gimmick);
                disabling = true;
            }

            var message;
            if (!silent) {
                message = ig.lang.get(disabling ? gimmick.textDisable : gimmick.text);
            }

            if (gimmick.setKey) this.keys[gimmick.setKey] = !disabling;
            if (gimmick.onToggle) gimmick.onToggle(disabling);

            silent || sc.Dialogs.showDialog(message, null, void 0);
            return true;
        },

        /** @returns {boolean} whether the named gimmick key is active */
        isEnabled: function (key) {
            return this.keys[key] || false;
        },

        /** ig.vars accessor: gamecode.<key> → boolean */
        onVarAccess: function (result, path) {
            return this.keys[path[1]] || false;
        },

        levelLoadedOrder: 1000,
        onLevelLoaded: function () {
            for (var i = this.enabled.length; i--;) {
                var gimmick = this.enabled[i];
                if (gimmick.addItem &&
                    sc.model.player.getItemAmountWithEquip(gimmick.addItem) == 0) {
                    sc.model.player.addItem(gimmick.addItem, 1);
                }
            }
        }
    });

    /* ── Singleton ───────────────────────────────────────────────── */

    ig.addGameAddon(function () {
        sc.gameCode = new sc.GameCode;
        return sc.gameCode;
    });

    /** Entry point for external code submission (e.g. from the console). */
    sc.submitGameCode = function (code) {
        sc.gameCode.enterCode(code);
    };
});
ig.baked = !0;
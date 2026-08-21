/**
 * impact.feature.greenworks.greenworks
 * ====================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("impact.feature.greenworks.greenworks")`.
 *
 * `ig.Greenworks` — a game add-on that initialises the Greenworks Steam API
 * bridge on desktop builds. It picks the Greenworks build that matches the
 * running NW.js version, reports progress through a `steps` array, and exposes
 * achievement helpers. Registered as the `ig.greenworks` singleton.
 */
ig.module("impact.feature.greenworks.greenworks")
    .requires("impact.base.game", "impact.base.vars")
    .defines(function () {

    ig.Greenworks = ig.GameAddon.extend({
        greenworks: null,
        steps: [],

        /**
         * Load the Greenworks module for the current NW.js version and
         * initialise the Steam API — but only on desktop builds started with
         * the `--startedFromSteam` argument.
         */
        init: function () {
            this.parent("Greenworks");
            if (ig.platform == ig.PLATFORM_TYPES.DESKTOP) {
                try {
                    if (ig.nwjsVersion[1] < 1400) {
                        if (this.hasSteamStartArgument()) {
                            this.greenworks = require("./modules/greenworks-0.4.0/greenworks");
                            this.steps.push("loaded");
                            this.greenworks.initAPI() && ig.log(
                                "%cGREENWORKS:%c Successfully initialized! [v0.4.0]",
                                "color:#339966", ""
                            );
                        }
                    } else if (ig.nwjsVersion[1] < 3E3) {
                        this.greenworks = require("./modules/greenworks-0.5.3/greenworks");
                        this.steps.push("loaded");
                        this.greenworks.init() && ig.log(
                            "%cGREENWORKS:%c Successfully initialized!  [v0.5.3]",
                            "color:#339966", ""
                        );
                    } else if (ig.nwjsVersion[1] < 3500) {
                        this.greenworks = require("./modules/greenworks-0.13.0/greenworks");
                        this.steps.push("loaded");
                        this.greenworks.init() && ig.log(
                            "%cGREENWORKS:%c Successfully initialized!  [v0.13.0]",
                            "color:#339966", ""
                        );
                    } else {
                        this.greenworks = require("./modules/greenworks-nw-0.35/greenworks");
                        this.steps.push("loaded");
                        this.greenworks.init() && ig.log(
                            "%cGREENWORKS:%c Successfully initialized!  [Compiled for NW.js 0.35.x]",
                            "color:#339966", ""
                        );
                    }
                } catch (error) {
                    ig.warn("Error Initializing Greenworks");
                    this.steps.push("error");
                    this.errorMsg = error.toString();
                    this.greenworks = null;
                }
            }
            this.greenworks && this.steps.push("initialized");
        },

        isActive: function () {
            return !!this.greenworks;
        },

        /** True when the game was launched with `--startedFromSteam`. */
        hasSteamStartArgument: function () {
            var argv = require("nw.gui").App.argv;
            for (var i = 0; i < argv.length; i++) {
                if (argv[i] == "--startedFromSteam") return true;
            }
            return false;
        },

        /**
         * Unlock an achievement; when `clearAfter` is set, immediately clear
         * it again (used for debug/test).
         */
        activateAchievement: function (achievementId, clearAfter) {
            this.greenworks && this.greenworks.activateAchievement(achievementId, function () {
                ig.greenworks.steps.push("activated");
                clearAfter && ig.greenworks.clearAchievement(achievementId);
            });
        },

        /** Clear (lock) an achievement. */
        clearAchievement: function (achievementId) {
            this.greenworks && this.greenworks.clearAchievement && this.greenworks.clearAchievement(achievementId, function () {
                ig.greenworks.steps.push("cleared");
            });
        }
    });

    ig.addGameAddon(function () {
        return ig.greenworks = new ig.Greenworks();
    });
});
ig.baked = !0;

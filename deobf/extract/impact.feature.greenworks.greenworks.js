ig.module("impact.feature.greenworks.greenworks").requires("impact.base.game", "impact.base.vars").defines(function() {
    ig.Greenworks = ig.GameAddon.extend({
        greenworks: null,
        steps: [],
        init: function() {
            this.parent("Greenworks");
            if (ig.platform == ig.PLATFORM_TYPES.DESKTOP) try {
                if (ig.nwjsVersion[1] < 1400) {
                    if (this.hasSteamStartArgument()) {
                        this.greenworks = require("./modules/greenworks-0.4.0/greenworks");
                        this.steps.push("loaded");
                        this.greenworks.initAPI() && ig.log("%cGREENWORKS:%c Successfully initialized! [v0.4.0]", "color:#339966",
                            "")
                    }
                } else if (ig.nwjsVersion[1] < 3E3) {
                    this.greenworks = require("./modules/greenworks-0.5.3/greenworks");
                    this.steps.push("loaded");
                    this.greenworks.init() && ig.log("%cGREENWORKS:%c Successfully initialized!  [v0.5.3]", "color:#339966", "")
                } else if (ig.nwjsVersion[1] < 3500) {
                    this.greenworks = require("./modules/greenworks-0.13.0/greenworks");
                    this.steps.push("loaded");
                    this.greenworks.init() && ig.log("%cGREENWORKS:%c Successfully initialized!  [v0.13.0]", "color:#339966", "")
                } else {
                    this.greenworks = require("./modules/greenworks-nw-0.35/greenworks");
                    this.steps.push("loaded");
                    this.greenworks.init() && ig.log("%cGREENWORKS:%c Successfully initialized!  [Compiled for NW.js 0.35.x]", "color:#339966", "")
                }
            } catch (b) {
                ig.warn("Error Initializing Greenworks");
                this.steps.push("error");
                this.errorMsg = b.toString();
                this.greenworks = null
            }
            this.greenworks && this.steps.push("initialized")
        },
        isActive: function() {
            return !!this.greenworks
        },
        hasSteamStartArgument: function() {
            for (var b = require("nw.gui").App.argv, a = 0; a < b.length; a++)
                if (b[a] == "--startedFromSteam") return true;
            return false
        },
        activateAchievement: function(b, a) {
            this.greenworks && this.greenworks.activateAchievement(b, function() {
                ig.greenworks.steps.push("activated");
                a && ig.greenworks.clearAchievement(b)
            })
        },
        clearAchievement: function(b) {
            this.greenworks && this.greenworks.clearAchievement && this.greenworks.clearAchievement(b, function() {
                ig.greenworks.steps.push("cleared")
            })
        }
    });
    ig.addGameAddon(function() {
        return ig.greenworks = new ig.Greenworks
    })
});
ig.baked = !0;

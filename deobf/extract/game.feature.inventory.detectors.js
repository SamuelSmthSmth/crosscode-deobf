ig.module("game.feature.inventory.detectors").requires("impact.base.game", "game.feature.model.game-model", "impact.feature.effect.effect-sheet").defines(function() {
    sc.DETECTOR_FILTERS = {};
    sc.DETECTOR_FILTERS.FULL_CHEST = {
        entityCheck: function(a) {
            return a instanceof ig.ENTITY.Chest && (!a.detectCondition || a.detectCondition.evaluate()) && !a.isOpened()
        }
    };
    var b = ["documentation", "laserpickaxe", "dynamite"];
    sc.DETECTOR_FILTERS.MINE_EQUIP = {
        entityCheck: function(a) {
            return a instanceof ig.ENTITY.Prop && a.propSheet.path ==
                "cold-dng" && b.indexOf(a.propName) != -1 && !a._hidden
        }
    };
    sc.DETECTORS = [{
        item: 466,
        areas: ["cold-dng"],
        filter: sc.DETECTOR_FILTERS.MINE_EQUIP,
        label: "sc.gui.detector.mine-equip"
    }, {
        item: 501,
        filter: sc.DETECTOR_FILTERS.FULL_CHEST,
        label: "sc.gui.detector.chest"
    }];
    sc.Detectors = ig.GameAddon.extend({
        timer: 0,
        onStates: [],
        detectMsg: [],
        arGui: null,
        fx: new ig.EffectSheet("puzzle"),
        init: function() {
            this.parent("Detectors");
            sc.Model.addObserver(sc.model.player, this)
        },
        onLevelLoaded: function() {
            this.clearCurrentMsg();
            this.detectMsg.length =
                0;
            this.timer = this.onStates.length = 0;
            this.checkDetectors()
        },
        modelChanged: function(a, b) {
            a instanceof sc.PlayerModel && b == sc.PLAYER_MSG.ITEM_TOGGLED && this.checkDetectors(true)
        },
        checkDetectors: function(a) {
            for (var b = sc.DETECTORS.length; b--;) {
                var c = sc.DETECTORS[b],
                    e = this.checkDetector(c, b);
                e && this.detectMsg.push({
                    detector: c,
                    count: e
                })
            }
            if (!this.timer && this.detectMsg.length > 0) this.timer = a ? 0.05 : 0.3
        },
        onDeferredUpdate: function() {
            if (this.timer > 0 && !sc.model.isCutscene() && sc.model.isRunning() && ig.game.isInterruptible()) {
                this.timer =
                    this.timer - ig.system.actualTick;
                if (this.timer <= 0)
                    if (this.detectMsg.length > 0) {
                        this.timer = 2;
                        this.startDetector(this.detectMsg.pop())
                    } else {
                        this.clearCurrentMsg();
                        this.timer = 0
                    }
            }
        },
        checkDetector: function(a, b) {
            if (sc.model.player.getItemAmount(a.item) == 0) return 0;
            var c = sc.model.player.getToggleItemState(a.item);
            if (!c || this.onStates[b] == c) {
                this.onStates[b] = c;
                return 0
            }
            this.onStates[b] = c;
            if (a.areas && (!sc.map.currentPlayerArea || a.areas.indexOf(sc.map.currentPlayerArea.path) == -1)) return 0;
            for (c = this.detectMsg.length; c--;)
                if (this.detectMsg[0].detector ==
                    a) return 0;
            var e = 0,
                f = a.filter;
            if (f.entityCheck)
                for (var g = ig.game.entities, c = g.length; c--;) f.entityCheck(g[c]) && e++;
            return e
        },
        clearCurrentMsg: function() {
            if (this.arGui) {
                this.arGui.remove();
                this.arGui = null
            }
        },
        startDetector: function(a) {
            this.clearCurrentMsg();
            if (sc.model.isGame()) {
                var b = a.count,
                    a = ig.lang.get(a.detector.label),
                    a = a.replace("[[x]]", b);
                this.fx.spawnOnTarget("detector", ig.game.playerEntity);
                this.arGui = new ig.GUI.ARBox(ig.game.playerEntity, a, 0, sc.AR_BOX_MODE.NO_LINE, sc.AR_COLOR.GREEN);
                ig.gui.addGuiElement(this.arGui)
            }
        }
    });
    ig.addGameAddon(function() {
        return sc.detectors = new sc.Detectors
    })
});
ig.baked = !0;

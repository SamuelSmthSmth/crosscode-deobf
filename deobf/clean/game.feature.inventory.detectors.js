/**
 * @module game.feature.inventory.detectors
 *
 * Item detector system: watches toggled inventory items and periodically
 * scans the map for matching entities (e.g. full chests, mine equipment),
 * showing an AR box notification when new targets are found.
 */
ig.module("game.feature.inventory.detectors").requires("impact.base.game", "game.feature.model.game-model", "impact.feature.effect.effect-sheet").defines(function() {
    sc.DETECTOR_FILTERS = {};
    sc.DETECTOR_FILTERS.FULL_CHEST = {
        entityCheck: function(entity) {
            return entity instanceof ig.ENTITY.Chest && (!entity.detectCondition || entity.detectCondition.evaluate()) && !entity.isOpened()
        }
    };
    var MINE_EQUIP_PROPS = ["documentation", "laserpickaxe", "dynamite"];
    sc.DETECTOR_FILTERS.MINE_EQUIP = {
        entityCheck: function(entity) {
            return entity instanceof ig.ENTITY.Prop && entity.propSheet.path ==
                "cold-dng" && MINE_EQUIP_PROPS.indexOf(entity.propName) != -1 && !entity._hidden
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
        modelChanged: function(model, msg) {
            model instanceof sc.PlayerModel && msg == sc.PLAYER_MSG.ITEM_TOGGLED && this.checkDetectors(true)
        },
        checkDetectors: function(immediate) {
            for (var i = sc.DETECTORS.length; i--;) {
                var detector = sc.DETECTORS[i],
                    count = this.checkDetector(detector, i);
                count && this.detectMsg.push({
                    detector: detector,
                    count: count
                })
            }
            if (!this.timer && this.detectMsg.length > 0) this.timer = immediate ? 0.05 : 0.3
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
        checkDetector: function(detector, index) {
            if (sc.model.player.getItemAmount(detector.item) == 0) return 0;
            var toggleState = sc.model.player.getToggleItemState(detector.item);
            if (!toggleState || this.onStates[index] == toggleState) {
                this.onStates[index] = toggleState;
                return 0
            }
            this.onStates[index] = toggleState;
            if (detector.areas && (!sc.map.currentPlayerArea || detector.areas.indexOf(sc.map.currentPlayerArea.path) == -1)) return 0;
            for (toggleState = this.detectMsg.length; toggleState--;)
                if (this.detectMsg[0].detector ==
                    detector) return 0;
            var count = 0,
                filter = detector.filter;
            if (filter.entityCheck)
                for (var entities = ig.game.entities, i = entities.length; i--;) filter.entityCheck(entities[i]) && count++;
            return count
        },
        clearCurrentMsg: function() {
            if (this.arGui) {
                this.arGui.remove();
                this.arGui = null
            }
        },
        startDetector: function(msg) {
            this.clearCurrentMsg();
            if (sc.model.isGame()) {
                var count = msg.count,
                    label = ig.lang.get(msg.detector.label),
                    label = label.replace("[[x]]", count);
                this.fx.spawnOnTarget("detector", ig.game.playerEntity);
                this.arGui = new ig.GUI.ARBox(ig.game.playerEntity, label, 0, sc.AR_BOX_MODE.NO_LINE, sc.AR_COLOR.GREEN);
                ig.gui.addGuiElement(this.arGui)
            }
        }
    });
    ig.addGameAddon(function() {
        return sc.detectors = new sc.Detectors
    })
});
ig.baked = !0;

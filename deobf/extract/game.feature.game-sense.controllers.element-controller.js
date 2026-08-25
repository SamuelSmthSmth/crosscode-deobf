ig.module("game.feature.game-sense.controllers.element-controller").requires("impact.base.game", "game.feature.model.base-model", "game.feature.game-sense.game-sense-model").defines(function() {
    sc.GameSenseElementKey = ig.Class.extend({
        element: 0,
        eventName: "ELEMENT_0",
        zone: "keyboard-5",
        color: null,
        value: 0,
        init: function(b, a, d) {
            this.element = b || 0;
            this.eventName = "ELEMENT_" + this.element;
            this.zone = d ? "keyboard-" + d : "keyboard-5";
            this.color = a || sc.GSHelper.color(255, 255, 255)
        },
        bindHandler: function() {
            sc.gamesense.bindEventHandler({
                game: sc.GAME_SENSE_GAME,
                event: this.eventName,
                min_value: 0,
                max_value: 1,
                handlers: [{
                    "device-type": sc.GAME_SENSE_DEVICE.RGB_PER_KEY_ZONES,
                    zone: this.zone,
                    color: this.color,
                    mode: sc.GAME_SENSE_MODE.COUNT
                }]
            })
        },
        updateElement: function() {
            var b = sc.model.player.getCore(this.element + 8) ? 1 : 0;
            sc.gamesense.sendSimpleEventUpdate(this.eventName, b ? 1 : 0)
        }
    });
    sc.GameSenseElementController = sc.GameSenseControllerBase.extend({
        elements: [],
        init: function() {
            sc.Model.addObserver(sc.model.player, this);
            ig.storage.register(this);
            this.elements.push(new sc.GameSenseElementKey(sc.ELEMENT.COLD,
                sc.GSHelper.color(0, 200, 255), 1));
            this.elements.push(new sc.GameSenseElementKey(sc.ELEMENT.SHOCK, sc.GSHelper.color(180, 0, 255), 2));
            this.elements.push(new sc.GameSenseElementKey(sc.ELEMENT.HEAT, sc.GSHelper.color(255, 0, 0), 3));
            this.elements.push(new sc.GameSenseElementKey(sc.ELEMENT.WAVE, sc.GSHelper.color(0, 255, 120), 4));
            this.elements.push(new sc.GameSenseElementKey(sc.ELEMENT.NEUTRAL, sc.GSHelper.color(255, 255, 255), 5))
        },
        bindHandler: function() {
            var b = {
                game: sc.GAME_SENSE_GAME,
                event: "LOGO_ELEMENT",
                min_value: 0,
                max_value: 5,
                handlers: [{
                    "device-type": sc.GAME_SENSE_DEVICE.RGB_PER_KEY_ZONES,
                    zone: "logo",
                    color: [sc.GSHelper.range(255, 255, 255, 1, 1), sc.GSHelper.range(255, 0, 0, 2, 2), sc.GSHelper.range(0, 200, 255, 3, 3), sc.GSHelper.range(180, 0, 255, 4, 4), sc.GSHelper.range(0, 255, 120, 5, 5)],
                    mode: sc.GAME_SENSE_MODE.COUNT
                }]
            };
            sc.gamesense.bindEventHandler(b);
            for (b = this.elements.length; b--;) this.elements[b].bindHandler()
        },
        onHeartBeat: function() {
            this.updateElementKeys()
        },
        deactivate: function() {
            for (var b = this.elements.length; b--;) this.elements[b].value =
                0
        },
        updateElementKeys: function() {
            if (this.isActive) {
                sc.gamesense.sendSimpleEventUpdate("LOGO_ELEMENT", sc.model.player.currentElementMode + 1);
                for (var b = this.elements.length; b--;) this.elements[b].updateElement()
            }
        },
        modelChanged: function(b, a) {
            if (b == sc.model.player && (a == sc.PLAYER_MSG.ELEMENT_MODE_CHANGE || a == sc.PLAYER_MSG.CORE_CHANGED || sc.PLAYER_MSG.STATS_CHANGED)) sc.model.isTitle() || this.updateElementKeys()
        }
    })
});
ig.baked = !0;

/**
 * @module game.feature.game-sense.game-sense-model
 *
 * Logitech/SteelSeries GameSense integration for CrossCode. Discovers
 * the SteelSeries Engine 3 endpoint on the local machine, registers
 * the game, and manages RGB keyboard/mouse lighting controllers.
 * Controllers react to game state changes (HP, element mode, etc.)
 * via heartbeat updates and handle device binding/deactivation.
 */
ig.module("game.feature.game-sense.game-sense-model").requires("impact.base.image", "impact.base.game", "game.feature.model.game-model", "game.feature.model.options-model").defines(function() {
    ig.perf.gameSense = true;
    sc.GAME_SENSE_GAME = "CROSS_CODE";
    sc.GAME_SENSE_DEVICE = {KEYBOARD: "keyboard", MOUSE: "mouse", RGB_PER_KEY_ZONES: "rgb-per-key-zones"};
    sc.GAME_SENSE_ZONE = {FUNCTION_KEYS: "function-keys", MAIN_KEYBOARD: "main-keyboard", KEYPAD: "keypad", NUMBER_KEYS: "number-keys", MACRO_KEYS: "macro-keys"};
    sc.GAME_SENSE_MODE = {COLOR: "color", PERCENT: "percent", COUNT: "count"};
    sc.GAME_SENSE_ICON = {NO_ICON: 0, HEALTH: 1, ARMOR: 2, AMMUNITION: 3, MONEY: 4, FLASH_EXPLOSION: 5, KILLS: 6, HEADSHOT: 7, HELMET: 8, HUNGER: 10, AIR_BREATH: 11, COMPASS: 12, TOOL_PICKAXE: 13, MANA_POTION: 14, CLOCK: 15, LIGHTNING: 16, ITEM_BACKPACK: 17};
    sc.GameSense = ig.GameAddon.extend({
        controllers: [],
        active: false,
        url: null,
        _heartbeatTimer: 0,
        _deferredStack: [],
        _prevOptionState: false,
        init: function() {
            this.parent("GameSense");
            if (ig.platform == ig.PLATFORM_TYPES.DESKTOP) {
                this._createEndpoint();
                sc.Model.addObserver(sc.model, this);
                sc.Model.addObserver(sc.options, this);
                this._prevOptionState = sc.options.get("game-sense")
            }
        },
        deferredUpdateOrder: 600,
        onDeferredUpdate: function() {
            if (this.active) {
                for (var idx = this.controllers.length; idx--;)
                    if (this.controllers[idx].isActive) this.controllers[idx].onUpdate();
                if (ig.game.firstUpdateLoop && this._heartbeatTimer > 0) {
                    this._heartbeatTimer = this._heartbeatTimer - ig.system.rawTick;
                    if (this._heartbeatTimer <= 0) {this.sendHeartbeat(); this._heartbeatTimer = 8}
                }
            }
        },
        onWindowFocusChanged: function(focused) {
            (!focused && !sc.model.isTitle() || this.active) && this.sendHeartbeat()
        },
        addController: function(ctrl) {
            ctrl && this.controllers.indexOf(ctrl) == -1 && (this.active ? this.controllers.push(ctrl) : this._deferredStack.push(ctrl))
        },
        bindEventHandler: function(eventConfig, callback) {return this.post("bind_game_event", eventConfig, callback)},
        sendSimpleEventUpdate: function(eventName, value, callback) {
            return this.post("game_event", {game: sc.GAME_SENSE_GAME, event: eventName, data: {value: value || 0}}, callback)
        },
        post: function(method, data, callback) {
            if (this.active) {
                var req = new XMLHttpRequest;
                req.addEventListener("error", function() {this.active = false}.bind(this));
                req.addEventListener("abort", function() {this.active = false}.bind(this));
                try {
                    req.open("POST", this.url + "/" + method, true);
                    req.setRequestHeader("Content-Type", "application/json");
                    req.send(JSON.stringify(data));
                    req.onreadystatechange = function() {req.readyState == XMLHttpRequest.DONE && req.status == 200 && callback && callback()}
                } catch (e) {this.active = false}
                return req
            }
        },
        startHeartbeat: function() {this._heartbeatTimer = 8},
        sendHeartbeat: function() {
            this.post("game_heartbeat", {game: sc.GAME_SENSE_GAME});
            for (var idx = this.controllers.length; idx--;)
                if (this.controllers[idx].isActive) this.controllers[idx].onHeartBeat()
        },
        endHeartbeat: function() {this._heartbeatTimer = 0},
        modelChanged: function(model, msg) {
            if (model == sc.model) {
                if (msg == sc.GAME_MODEL_MSG.STATE_CHANGED)
                    if (sc.model.isTitle()) {this._disableControllers(); this.endHeartbeat()}
                    else if (sc.model.isGame() && sc.options.get("game-sense")) {this._bindHandlers(); this.startHeartbeat()}
            } else if (model == sc.options && msg == sc.OPTIONS_EVENT.OPTION_CHANGED) {
                var currentState = sc.options.get("game-sense");
                if (currentState != this._prevOptionState) {
                    if (!sc.model.isTitle() && currentState) {this._bindHandlers(); this.startHeartbeat(); this.sendHeartbeat()}
                    else if (!currentState) {this._disableControllers(); this.endHeartbeat()}
                    this._prevOptionState = currentState
                }
            }
        },
        _bindHandlers: function() {
            for (var idx = this.controllers.length; idx--;) {
                this.controllers[idx].isBound || this.controllers[idx].bindHandler();
                this.controllers[idx].isActive = true
            }
        },
        _disableControllers: function() {
            for (var idx = this.controllers.length; idx--;) {
                this.controllers[idx].isActive = false;
                this.controllers[idx].deactivate && this.controllers[idx].deactivate()
            }
        },
        _createEndpoint: function() {
            var configPath;
            if (process.platform === "darwin") configPath = "/Library/Application Support/SteelSeries Engine 3/coreProps.json";
            else if (process.platform === "win32") configPath = "%PROGRAMDATA%/SteelSeries/SteelSeries Engine 3/coreProps.json";
            else return;
            configPath = configPath.replace(/%([^%]+)%/g, function(_, envVar) {return process.env[envVar]});
            window.require("fs").readFile(configPath, {encoding: "utf-8"}, function(err, raw) {
                if (!err) {
                    var parsed = JSON.parse(raw);
                    if (parsed.address) {
                        this.url = "http://" + parsed.address;
                        this.active = true;
                        ig.JSON_LOG && ig.log("%cGAME SENSE: %cEndpoint Discovered: \n%O", "color:#149AEB", "", this.url);
                        this._registerGame()
                    }
                }
            }.bind(this))
        },
        _registerGame: function() {
            this.post("game_metadata", {game: sc.GAME_SENSE_GAME, game_display_name: document.title, developer: "Radical Fish Games", deinitialize_timer_length_ms: 1E4}, function() {
                ig.JSON_LOG && ig.log("%cGAME SENSE: %cGame Registered!", "color:#149AEB", "");
                for (var idx = this._deferredStack.length; idx--;) this.addController(this._deferredStack[idx])
            }.bind(this))
        }
    });
    sc.GameSenseControllerBase = ig.Class.extend({isActive: false, isBound: false, bindHandler: function() {}, onUpdate: function() {}, onHeartBeat: function() {}});
    sc.GSHelper = {
        color: function(r, g, b) {return {red: r, green: g, blue: b}},
        range: function(r, g, b, low, high) {return {low: low, high: high, color: this.color(r, g, b)}}
    };
    ig.addGameAddon(function() {return sc.gamesense = new sc.GameSense})
});
ig.baked = !0;
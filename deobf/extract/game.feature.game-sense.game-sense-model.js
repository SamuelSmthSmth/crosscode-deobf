ig.module("game.feature.game-sense.game-sense-model").requires("impact.base.image", "impact.base.game", "game.feature.model.game-model", "game.feature.model.options-model").defines(function() {
    ig.perf.gameSense = true;
    sc.GAME_SENSE_GAME = "CROSS_CODE";
    sc.GAME_SENSE_DEVICE = {
        KEYBOARD: "keyboard",
        MOUSE: "mouse",
        RGB_PER_KEY_ZONES: "rgb-per-key-zones"
    };
    sc.GAME_SENSE_ZONE = {
        FUNCTION_KEYS: "function-keys",
        MAIN_KEYBOARD: "main-keyboard",
        KEYPAD: "keypad",
        NUMBER_KEYS: "number-keys",
        MACRO_KEYS: "macro-keys"
    };
    sc.GAME_SENSE_MODE = {
        COLOR: "color",
        PERCENT: "percent",
        COUNT: "count"
    };
    sc.GAME_SENSE_ICON = {
        NO_ICON: 0,
        HEALTH: 1,
        ARMOR: 2,
        AMMUNITION: 3,
        MONEY: 4,
        FLASH_EXPLOSION: 5,
        KILLS: 6,
        HEADSHOT: 7,
        HELMET: 8,
        HUNGER: 10,
        AIR_BREATH: 11,
        COMPASS: 12,
        TOOL_PICKAXE: 13,
        MANA_POTION: 14,
        CLOCK: 15,
        LIGHTNING: 16,
        ITEM_BACKPACK: 17
    };
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
                for (var b = this.controllers.length; b--;)
                    if (this.controllers[b].isActive) this.controllers[b].onUpdate();
                if (ig.game.firstUpdateLoop && this._heartbeatTimer > 0) {
                    this._heartbeatTimer = this._heartbeatTimer - ig.system.rawTick;
                    if (this._heartbeatTimer <= 0) {
                        this.sendHeartbeat();
                        this._heartbeatTimer = 8
                    }
                }
            }
        },
        onWindowFocusChanged: function(b) {
            (!b &&
                !sc.model.isTitle() || this.active) && this.sendHeartbeat()
        },
        addController: function(b) {
            b && this.controllers.indexOf(b) == -1 && (this.active ? this.controllers.push(b) : this._deferredStack.push(b))
        },
        bindEventHandler: function(b, a) {
            return this.post("bind_game_event", b, a)
        },
        sendSimpleEventUpdate: function(b, a, d) {
            return this.post("game_event", {
                game: sc.GAME_SENSE_GAME,
                event: b,
                data: {
                    value: a || 0
                }
            }, d)
        },
        post: function(b, a, d) {
            if (this.active) {
                var c = new XMLHttpRequest;
                c.addEventListener("error", function() {
                    this.active = false
                }.bind(this));
                c.addEventListener("abort", function() {
                    this.active = false
                }.bind(this));
                try {
                    c.open("POST", this.url + "/" + b, true);
                    c.setRequestHeader("Content-Type", "application/json");
                    c.send(JSON.stringify(a));
                    c.onreadystatechange = function() {
                        c.readyState == XMLHttpRequest.DONE && c.status == 200 && d && d()
                    }
                } catch (e) {
                    this.active = false
                }
                return c
            }
        },
        startHeartbeat: function() {
            this._heartbeatTimer = 8
        },
        sendHeartbeat: function() {
            this.post("game_heartbeat", {
                game: sc.GAME_SENSE_GAME
            });
            for (var b = this.controllers.length; b--;)
                if (this.controllers[b].isActive) this.controllers[b].onHeartBeat()
        },
        endHeartbeat: function() {
            this._heartbeatTimer = 0
        },
        modelChanged: function(b, a) {
            if (b == sc.model) {
                if (a == sc.GAME_MODEL_MSG.STATE_CHANGED)
                    if (sc.model.isTitle()) {
                        this._disableControllers();
                        this.endHeartbeat()
                    } else if (sc.model.isGame() && sc.options.get("game-sense")) {
                    this._bindHandlers();
                    this.startHeartbeat()
                }
            } else if (b == sc.options && a == sc.OPTIONS_EVENT.OPTION_CHANGED) {
                var d = sc.options.get("game-sense");
                if (d != this._prevOptionState) {
                    if (!sc.model.isTitle() && d) {
                        this._bindHandlers();
                        this.startHeartbeat();
                        this.sendHeartbeat()
                    } else if (!d) {
                        this._disableControllers();
                        this.endHeartbeat()
                    }
                    this._prevOptionState = d
                }
            }
        },
        _bindHandlers: function() {
            for (var b = this.controllers.length; b--;) {
                this.controllers[b].isBound || this.controllers[b].bindHandler();
                this.controllers[b].isActive = true
            }
        },
        _disableControllers: function() {
            for (var b = this.controllers.length; b--;) {
                this.controllers[b].isActive = false;
                this.controllers[b].deactivate && this.controllers[b].deactivate()
            }
        },
        _createEndpoint: function() {
            var b;
            if (process.platform === "darwin") b = "/Library/Application Support/SteelSeries Engine 3/coreProps.json";
            else if (process.platform === "win32") b = "%PROGRAMDATA%/SteelSeries/SteelSeries Engine 3/coreProps.json";
            else return;
            b = b.replace(/%([^%]+)%/g, function(a, b) {
                return process.env[b]
            });
            window.require("fs").readFile(b, {
                encoding: "utf-8"
            }, function(a, b) {
                if (!a) {
                    var c = JSON.parse(b);
                    if (c.address) {
                        this.url = "http://" + c.address;
                        this.active = true;
                        ig.JSON_LOG && ig.log("%cGAME SENSE: %cEndpoint Discovered: \n%O", "color:#149AEB", "", this.url);
                        this._registerGame()
                    }
                }
            }.bind(this))
        },
        _registerGame: function() {
            this.post("game_metadata", {
                game: sc.GAME_SENSE_GAME,
                game_display_name: document.title,
                developer: "Radical Fish Games",
                deinitialize_timer_length_ms: 1E4
            }, function() {
                ig.JSON_LOG && ig.log("%cGAME SENSE: %cGame Registered!", "color:#149AEB", "");
                for (var b = this._deferredStack.length; b--;) this.addController(this._deferredStack[b])
            }.bind(this))
        }
    });
    sc.GameSenseControllerBase = ig.Class.extend({
        isActive: false,
        isBound: false,
        bindHandler: function() {},
        onUpdate: function() {},
        onHeartBeat: function() {}
    });
    sc.GSHelper = {
        color: function(b, a, d) {
            return {
                red: b,
                green: a,
                blue: d
            }
        },
        range: function(b, a, d, c, e) {
            return {
                low: c,
                high: e,
                color: this.color(b, a, d)
            }
        }
    };
    ig.addGameAddon(function() {
        return sc.gamesense = new sc.GameSense
    })
});
ig.baked = !0;

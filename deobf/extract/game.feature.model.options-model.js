ig.module("game.feature.model.options-model").requires("impact.base.game", "impact.feature.storage.storage", "impact.base.input", "game.feature.model.base-model").defines(function() {
    function b(a) {
        if (ig.platform == ig.PLATFORM_TYPES.DESKTOP) {
            var b = window.require("nw.gui").Window.get();
            if (b.isFullscreen != a) {
                ig.log("%cChanging Fullscreen: " + a, "color:#FF4A4A");
                a ? b.enterFullscreen() : b.leaveFullscreen()
            }
        }
    }
    sc.KEY_BLACK_LIST = {};
    sc.KEY_BLACK_LIST[ig.KEY.CTRL] = true;
    sc.KEY_BLACK_LIST[ig.KEY.F1] = true;
    sc.KEY_BLACK_LIST[ig.KEY.F2] =
        true;
    sc.KEY_BLACK_LIST[ig.KEY.F3] = true;
    sc.KEY_BLACK_LIST[ig.KEY.F4] = true;
    sc.KEY_BLACK_LIST[ig.KEY.F5] = true;
    sc.KEY_BLACK_LIST[ig.KEY.F6] = true;
    sc.KEY_BLACK_LIST[ig.KEY.F7] = true;
    sc.KEY_BLACK_LIST[ig.KEY.F8] = true;
    sc.KEY_BLACK_LIST[ig.KEY.F9] = true;
    sc.KEY_BLACK_LIST[ig.KEY.F10] = true;
    sc.KEY_BLACK_LIST[ig.KEY.F11] = true;
    sc.KEY_BLACK_LIST[ig.KEY.F12] = true;
    sc.DIFFICULTY = {
        CASUAL: 0,
        NORMAL: 1,
        HARD: 2,
        CRUSHING: 3
    };
    sc.CIRCUIT_MENU_TEXT_SIZE = {
        SMALL: 0,
        MEDIUM: 1,
        LARGE: 2
    };
    sc.CIRCUIT_MENU_DISPLAY_TIME = {
        SHORT: 0,
        LONG: 1
    };
    sc.DISPLAY_TYPE = {
        ORIGINAL: 0,
        SCALE_X2: 1,
        FIT: 2,
        STRETCH: 3
    };
    sc.PIXEL_SIZE = {
        ONE: 0,
        TWO: 1,
        THREE: 2,
        FOUR: 3
    };
    sc.EFFECT_DETAILS = {
        LOW: 0,
        MEDIUM: 1,
        HIGH: 2
    };
    sc.RUMBLE_STRENGTH = {
        OFF: 0,
        WEAK: 1,
        NORMAL: 2,
        STRONG: 3
    };
    sc.ASSIST_DAMAGE = {
        LOW5: 0.2,
        LOW4: 0.3,
        LOW3: 0.4,
        LOW2: 0.6,
        LOW1: 0.8,
        NORM: 1
    };
    sc.ASSIST_ATTACK_FREQUENCY = {
        LOW5: 0.5,
        LOW4: 0.6,
        LOW3: 0.7,
        LOW2: 0.8,
        LOW1: 0.9,
        NORM: 1
    };
    sc.ASSIST_PUZZLE_SPEED = {
        LOW5: 0.5,
        LOW4: 0.6,
        LOW3: 0.7,
        LOW2: 0.8,
        LOW1: 0.9,
        NORM: 1
    };
    sc.QUICK_MENU_ACCESS = {
        HOLD: 0,
        PRESS: 1
    };
    sc.LANGUAGE = {
        ENGLISH: 0,
        GERMAN: 1,
        CHINESE: 2,
        CHINESE_TRAD: 5,
        JAPANESE: 3,
        KOREAN: 4
    };
    sc.ITEM_HUD_SIZE = {
        NORMAL: 0,
        SMALL: 1
    };
    sc.MESSAGE_PADDING = {
        NORMAL: 0,
        WIDE: 1
    };
    sc.QUEST_SOLVED_STYLE = {
        IMMEDIATE: 0,
        PRESS: 1
    };
    sc.UPDATE_QUEST_STYLE = {
        LARGE: 0,
        SMALL: 1,
        NONE: 2
    };
    sc.UPDATE_LANDMARK_STYLE = {
        LARGE: 0,
        SMALL: 1,
        NONE: 2
    };
    sc.UPDATE_LORE_STYLE = {
        LARGE: 0,
        SMALL: 1,
        NONE: 2
    };
    sc.UPDATE_TROPHY_STYLE = {
        LARGE: 0,
        SMALL: 1,
        NONE: 2
    };
    sc.UPDATE_DROP_STYLE = {
        LARGE: 0,
        SMALL: 1,
        NONE: 2
    };
    sc.HP_BARS = {
        LEA: 0,
        PARTY: 1,
        NONE: 2
    };
    sc.PARTY_COMBAT_ARTS = {
        FULL: 0,
        NO_NAME: 1,
        NONE: 2
    };
    sc.GAMEPAD_BUTTON_OPTION = {
        BUMPER: 0,
        TRIGGER: 1
    };
    sc.GAMEPAD_ICON_OPTION = {
        XBOX: 0,
        PS4: 1
    };
    sc.QUICK_LOCATION_OPTION = {
        QUICK: 0,
        MAP: 1,
        NONE: 2
    };
    sc.LANGUAGE_MAP = {};
    sc.LANGUAGE_MAP[sc.LANGUAGE.ENGLISH] = "en_US";
    sc.LANGUAGE_MAP[sc.LANGUAGE.GERMAN] = "de_DE";
    sc.LANGUAGE_MAP[sc.LANGUAGE.CHINESE] = "zh_CN";
    sc.LANGUAGE_MAP[sc.LANGUAGE.CHINESE_TRAD] = "zh_TW";
    sc.LANGUAGE_MAP[sc.LANGUAGE.JAPANESE] = "ja_JP";
    sc.LANGUAGE_MAP[sc.LANGUAGE.KOREAN] = "ko_KR";
    sc.OPTION_TYPES = {
        BUTTON_GROUP: 0,
        ARRAY_SLIDER: 1,
        OBJECT_SLIDER: 2,
        CHECKBOX: 3,
        CONTROLS: 4,
        LANGUAGE: 5,
        INFO: 6
    };
    sc.OPTION_CATEGORY = {
        GENERAL: 0,
        INTERFACE: 1,
        VIDEO: 2,
        AUDIO: 3,
        GAMEPAD: 4,
        CONTROLS: 5,
        ASSISTS: 6,
        ARENA: 7
    };
    var a = window.IG_GAME_DEBUG || ig.platform != ig.PLATFORM_TYPES.DESKTOP ? false : true;
    sc.OPTIONS_DEFINITION = {
        language: {
            type: "LANGUAGE",
            data: sc.LANGUAGE,
            init: sc.LANGUAGE.ENGLISH,
            cat: sc.OPTION_CATEGORY.GENERAL,
            restart: true
        },
        "pause-unfocused": {
            type: "CHECKBOX",
            init: true,
            cat: sc.OPTION_CATEGORY.GENERAL
        },
        "volume-music": {
            type: "ARRAY_SLIDER",
            data: [0, 1],
            init: 0.8,
            cat: sc.OPTION_CATEGORY.GENERAL,
            fill: true,
            hasDivider: true,
            header: "sound"
        },
        "volume-sound": {
            type: "ARRAY_SLIDER",
            data: [0, 1],
            init: 1,
            cat: sc.OPTION_CATEGORY.GENERAL,
            fill: true
        },
        "web-audio": {
            type: "CHECKBOX",
            init: !window.IG_FORCE_HTML5_AUDIO || true,
            cat: sc.OPTION_CATEGORY.GENERAL,
            restart: true
        },
        "skip-tutorials": {
            type: "CHECKBOX",
            init: false,
            cat: sc.OPTION_CATEGORY.GENERAL,
            hasDivider: true,
            header: "cutscenes"
        },
        "skip-confirm": {
            type: "CHECKBOX",
            init: true,
            cat: sc.OPTION_CATEGORY.GENERAL
        },
        "text-speed": {
            type: "OBJECT_SLIDER",
            data: ig.TextBlock.SPEED,
            init: ig.TextBlock.SPEED.FAST,
            cat: sc.OPTION_CATEGORY.GENERAL,
            fill: true
        },
        "message-padding": {
            type: "BUTTON_GROUP",
            data: sc.MESSAGE_PADDING,
            init: sc.MESSAGE_PADDING.NORMAL,
            cat: sc.OPTION_CATEGORY.GENERAL,
            fill: true
        },
        "game-sense": {
            type: "CHECKBOX",
            init: false,
            cat: sc.OPTION_CATEGORY.GENERAL
        },
        "circuit-text-size": {
            type: "BUTTON_GROUP",
            data: sc.CIRCUIT_MENU_TEXT_SIZE,
            init: sc.CIRCUIT_MENU_TEXT_SIZE.LARGE,
            cat: sc.OPTION_CATEGORY.INTERFACE,
            hasDivider: true,
            header: "main"
        },
        "circuit-display-time": {
            type: "BUTTON_GROUP",
            data: sc.CIRCUIT_MENU_DISPLAY_TIME,
            init: sc.CIRCUIT_MENU_DISPLAY_TIME.SHORT,
            cat: sc.OPTION_CATEGORY.INTERFACE
        },
        "equip-level-display": {
            type: "CHECKBOX",
            init: true,
            cat: sc.OPTION_CATEGORY.INTERFACE
        },
        "level-letter-display": {
            type: "CHECKBOX",
            init: true,
            cat: sc.OPTION_CATEGORY.INTERFACE
        },
        "buff-help": {
            type: "CHECKBOX",
            init: true,
            cat: sc.OPTION_CATEGORY.INTERFACE
        },
        "update-trophy-style": {
            type: "BUTTON_GROUP",
            data: sc.UPDATE_TROPHY_STYLE,
            init: sc.UPDATE_TROPHY_STYLE.SMALL,
            cat: sc.OPTION_CATEGORY.INTERFACE,
            hasDivider: true,
            header: "updates"
        },
        "update-quest-style": {
            type: "BUTTON_GROUP",
            data: sc.UPDATE_QUEST_STYLE,
            init: sc.UPDATE_QUEST_STYLE.LARGE,
            cat: sc.OPTION_CATEGORY.INTERFACE
        },
        "update-landmark-style": {
            type: "BUTTON_GROUP",
            data: sc.UPDATE_LANDMARK_STYLE,
            init: sc.UPDATE_LANDMARK_STYLE.LARGE,
            cat: sc.OPTION_CATEGORY.INTERFACE
        },
        "update-lore-style": {
            type: "BUTTON_GROUP",
            data: sc.UPDATE_LORE_STYLE,
            init: sc.UPDATE_LORE_STYLE.SMALL,
            cat: sc.OPTION_CATEGORY.INTERFACE
        },
        "update-drop-style": {
            type: "BUTTON_GROUP",
            data: sc.UPDATE_DROP_STYLE,
            init: sc.UPDATE_DROP_STYLE.LARGE,
            cat: sc.OPTION_CATEGORY.INTERFACE
        },
        "min-sidebar": {
            type: "CHECKBOX",
            init: false,
            cat: sc.OPTION_CATEGORY.INTERFACE
        },
        "item-hud-size": {
            type: "BUTTON_GROUP",
            data: sc.ITEM_HUD_SIZE,
            init: sc.ITEM_HUD_SIZE.NORMAL,
            cat: sc.OPTION_CATEGORY.INTERFACE,
            hasDivider: true,
            header: "field"
        },
        "show-items": {
            type: "CHECKBOX",
            init: true,
            cat: sc.OPTION_CATEGORY.INTERFACE
        },
        "show-money": {
            type: "CHECKBOX",
            init: true,
            cat: sc.OPTION_CATEGORY.INTERFACE
        },
        "min-quest": {
            type: "CHECKBOX",
            init: false,
            cat: sc.OPTION_CATEGORY.INTERFACE
        },
        "quest-show-current": {
            type: "CHECKBOX",
            init: false,
            cat: sc.OPTION_CATEGORY.INTERFACE
        },
        "xeno-pointer": {
            type: "CHECKBOX",
            init: true,
            cat: sc.OPTION_CATEGORY.INTERFACE
        },
        "hud-display": {
            type: "CHECKBOX",
            init: true,
            cat: sc.OPTION_CATEGORY.INTERFACE,
            hasDivider: true,
            header: "combat"
        },
        "close-combat-input": {
            type: "CHECKBOX",
            init: true,
            cat: sc.OPTION_CATEGORY.INTERFACE
        },
        "close-circle": {
            type: "CHECKBOX",
            init: true,
            cat: sc.OPTION_CATEGORY.INTERFACE
        },
        "sp-bar": {
            type: "CHECKBOX",
            init: true,
            cat: sc.OPTION_CATEGORY.INTERFACE
        },
        "element-overload": {
            type: "CHECKBOX",
            init: true,
            cat: sc.OPTION_CATEGORY.INTERFACE
        },
        "low-health-warning": {
            type: "CHECKBOX",
            init: true,
            cat: sc.OPTION_CATEGORY.INTERFACE
        },
        "combat-art-name": {
            type: "CHECKBOX",
            init: false,
            cat: sc.OPTION_CATEGORY.INTERFACE
        },
        "damage-numbers": {
            type: "CHECKBOX",
            init: true,
            cat: sc.OPTION_CATEGORY.INTERFACE
        },
        "damage-numbers-crit": {
            type: "CHECKBOX",
            init: false,
            cat: sc.OPTION_CATEGORY.INTERFACE
        },
        "s-rank-effects": {
            type: "CHECKBOX",
            init: true,
            cat: sc.OPTION_CATEGORY.INTERFACE
        },
        "enemy-status-bars": {
            type: "CHECKBOX",
            init: true,
            cat: sc.OPTION_CATEGORY.INTERFACE
        },
        "hp-bars": {
            type: "BUTTON_GROUP",
            data: sc.HP_BARS,
            init: sc.HP_BARS.PARTY,
            cat: sc.OPTION_CATEGORY.INTERFACE,
            hasDivider: true,
            header: "party"
        },
        "party-combat-arts": {
            type: "BUTTON_GROUP",
            data: sc.PARTY_COMBAT_ARTS,
            init: sc.PARTY_COMBAT_ARTS.FULL,
            cat: sc.OPTION_CATEGORY.INTERFACE
        },
        "quick-menu-access": {
            type: "BUTTON_GROUP",
            data: sc.QUICK_MENU_ACCESS,
            init: sc.QUICK_MENU_ACCESS.HOLD,
            cat: sc.OPTION_CATEGORY.INTERFACE,
            hasDivider: true,
            header: "quick"
        },
        "quick-location": {
            type: "BUTTON_GROUP",
            data: sc.QUICK_LOCATION_OPTION,
            init: sc.QUICK_LOCATION_OPTION.QUICK,
            cat: sc.OPTION_CATEGORY.INTERFACE
        },
        "quick-element": {
            type: "CHECKBOX",
            init: true,
            cat: sc.OPTION_CATEGORY.INTERFACE
        },
        "quick-cursor": {
            type: "CHECKBOX",
            init: true,
            cat: sc.OPTION_CATEGORY.INTERFACE
        },
        "display-type": {
            type: "BUTTON_GROUP",
            data: sc.DISPLAY_TYPE,
            init: sc.DISPLAY_TYPE.FIT,
            cat: sc.OPTION_CATEGORY.VIDEO
        },
        fullscreen: {
            type: "CHECKBOX",
            init: a,
            cat: sc.OPTION_CATEGORY.VIDEO,
            noBrowser: true
        },
        "pixel-size": {
            type: "BUTTON_GROUP",
            data: sc.PIXEL_SIZE,
            init: sc.PIXEL_SIZE.TWO,
            cat: sc.OPTION_CATEGORY.VIDEO
        },
        "rumble-strength": {
            type: "BUTTON_GROUP",
            data: sc.RUMBLE_STRENGTH,
            init: sc.RUMBLE_STRENGTH.STRONG,
            cat: sc.OPTION_CATEGORY.VIDEO
        },
        speedlines: {
            type: "CHECKBOX",
            init: true,
            cat: sc.OPTION_CATEGORY.VIDEO
        },
        "env-particles": {
            type: "CHECKBOX",
            init: true,
            cat: sc.OPTION_CATEGORY.VIDEO
        },
        weather: {
            type: "CHECKBOX",
            init: true,
            cat: sc.OPTION_CATEGORY.VIDEO
        },
        lighting: {
            type: "CHECKBOX",
            init: true,
            cat: sc.OPTION_CATEGORY.VIDEO
        },
        "gamepad-attack": {
            type: "BUTTON_GROUP",
            data: sc.GAMEPAD_BUTTON_OPTION,
            init: sc.GAMEPAD_BUTTON_OPTION.BUMPER,
            cat: sc.OPTION_CATEGORY.GAMEPAD,
            gamepadIconUpdate: true
        },
        "gamepad-dash": {
            type: "BUTTON_GROUP",
            data: sc.GAMEPAD_BUTTON_OPTION,
            init: sc.GAMEPAD_BUTTON_OPTION.BUMPER,
            cat: sc.OPTION_CATEGORY.GAMEPAD,
            gamepadIconUpdate: true
        },
        "gamepad-icons": {
            type: "BUTTON_GROUP",
            data: sc.GAMEPAD_ICON_OPTION,
            init: sc.GAMEPAD_ICON_OPTION.XBOX,
            cat: sc.OPTION_CATEGORY.GAMEPAD,
            gamepadIconUpdate: true
        },
        "arena-cam-focus": {
            type: "CHECKBOX",
            init: true,
            cat: sc.OPTION_CATEGORY.ARENA
        },
        "arena-confirm": {
            type: "CHECKBOX",
            init: true,
            cat: sc.OPTION_CATEGORY.ARENA
        },
        "element-wheel": {
            type: "CHECKBOX",
            init: true,
            cat: sc.OPTION_CATEGORY.CONTROLS
        },
        "keys-confirm": {
            type: "CONTROLS",
            init: {
                key1: ig.KEY.ENTER,
                key2: void 0
            },
            cat: sc.OPTION_CATEGORY.CONTROLS,
            hasDivider: true,
            header: "menu"
        },
        "keys-back": {
            type: "CONTROLS",
            init: {
                key1: ig.KEY.BACKSPACE,
                key2: void 0
            },
            cat: sc.OPTION_CATEGORY.CONTROLS
        },
        "keys-menu": {
            type: "CONTROLS",
            init: {
                key1: ig.KEY.TAB,
                key2: void 0
            },
            cat: sc.OPTION_CATEGORY.CONTROLS
        },
        "keys-pause": {
            type: "CONTROLS",
            init: {
                key1: ig.KEY.ESC,
                key2: void 0
            },
            cat: sc.OPTION_CATEGORY.CONTROLS
        },
        "keys-help": {
            type: "CONTROLS",
            init: {
                key1: ig.KEY.H,
                key2: void 0
            },
            cat: sc.OPTION_CATEGORY.CONTROLS
        },
        "keys-help2": {
            type: "CONTROLS",
            init: {
                key1: ig.KEY.B,
                key2: void 0
            },
            cat: sc.OPTION_CATEGORY.CONTROLS
        },
        "keys-help3": {
            type: "CONTROLS",
            init: {
                key1: ig.KEY.N,
                key2: void 0
            },
            cat: sc.OPTION_CATEGORY.CONTROLS
        },
        "keys-skip-cutscene": {
            type: "CONTROLS",
            init: {
                key1: ig.KEY.G,
                key2: void 0
            },
            cat: sc.OPTION_CATEGORY.CONTROLS
        },
        "keys-help4": {
            type: "CONTROLS",
            init: {
                key1: ig.KEY.I,
                key2: void 0
            },
            cat: sc.OPTION_CATEGORY.CONTROLS
        },
        "keys-circle-left": {
            type: "CONTROLS",
            init: {
                key1: ig.KEY.Q,
                key2: void 0
            },
            cat: sc.OPTION_CATEGORY.CONTROLS
        },
        "keys-circle-right": {
            type: "CONTROLS",
            init: {
                key1: ig.KEY.E,
                key2: void 0
            },
            cat: sc.OPTION_CATEGORY.CONTROLS
        },
        "keys-up": {
            type: "CONTROLS",
            init: {
                key1: ig.KEY.W,
                key2: ig.KEY.UP_ARROW
            },
            cat: sc.OPTION_CATEGORY.CONTROLS,
            hasDivider: true,
            header: "gameplay"
        },
        "keys-right": {
            type: "CONTROLS",
            init: {
                key1: ig.KEY.D,
                key2: ig.KEY.RIGHT_ARROW
            },
            cat: sc.OPTION_CATEGORY.CONTROLS
        },
        "keys-down": {
            type: "CONTROLS",
            init: {
                key1: ig.KEY.S,
                key2: ig.KEY.DOWN_ARROW
            },
            cat: sc.OPTION_CATEGORY.CONTROLS
        },
        "keys-left": {
            type: "CONTROLS",
            init: {
                key1: ig.KEY.A,
                key2: ig.KEY.LEFT_ARROW
            },
            cat: sc.OPTION_CATEGORY.CONTROLS
        },
        "keys-melee": {
            type: "CONTROLS",
            init: {
                key1: ig.KEY.V,
                key2: void 0
            },
            cat: sc.OPTION_CATEGORY.CONTROLS
        },
        "keys-guard": {
            type: "CONTROLS",
            init: {
                key1: ig.KEY.C,
                key2: void 0
            },
            cat: sc.OPTION_CATEGORY.CONTROLS
        },
        "keys-quick": {
            type: "CONTROLS",
            init: {
                key1: ig.KEY.SHIFT,
                key2: void 0
            },
            cat: sc.OPTION_CATEGORY.CONTROLS
        },
        "keys-special": {
            type: "CONTROLS",
            init: {
                key1: ig.KEY.SPACE,
                key2: void 0
            },
            cat: sc.OPTION_CATEGORY.CONTROLS
        },
        "keys-dash2": {
            type: "CONTROLS",
            init: {
                key1: ig.KEY.ALT,
                key2: void 0
            },
            cat: sc.OPTION_CATEGORY.CONTROLS
        },
        "keys-cold": {
            type: "CONTROLS",
            init: {
                key1: ig.KEY._1,
                key2: void 0
            },
            cat: sc.OPTION_CATEGORY.CONTROLS
        },
        "keys-shock": {
            type: "CONTROLS",
            init: {
                key1: ig.KEY._2,
                key2: void 0
            },
            cat: sc.OPTION_CATEGORY.CONTROLS
        },
        "keys-heat": {
            type: "CONTROLS",
            init: {
                key1: ig.KEY._3,
                key2: void 0
            },
            cat: sc.OPTION_CATEGORY.CONTROLS
        },
        "keys-wave": {
            type: "CONTROLS",
            init: {
                key1: ig.KEY._4,
                key2: void 0
            },
            cat: sc.OPTION_CATEGORY.CONTROLS
        },
        "keys-neutral": {
            type: "CONTROLS",
            init: {
                key1: ig.KEY.GRAVE_ACCENT,
                key2: ig.KEY._5
            },
            cat: sc.OPTION_CATEGORY.CONTROLS
        },
        "assists-description": {
            type: "INFO",
            data: "options.assists-description.description",
            cat: sc.OPTION_CATEGORY.ASSISTS
        },
        "assist-damage": {
            type: "OBJECT_SLIDER",
            data: sc.ASSIST_DAMAGE,
            init: sc.ASSIST_DAMAGE.NORM,
            cat: sc.OPTION_CATEGORY.ASSISTS,
            fill: true,
            showPercentage: true,
            hasDivider: true,
            header: "combat"
        },
        "assist-attack-frequency": {
            type: "OBJECT_SLIDER",
            data: sc.ASSIST_ATTACK_FREQUENCY,
            init: sc.ASSIST_ATTACK_FREQUENCY.NORM,
            cat: sc.OPTION_CATEGORY.ASSISTS,
            fill: true,
            showPercentage: true
        },
        "assist-puzzle-speed": {
            type: "OBJECT_SLIDER",
            data: sc.ASSIST_PUZZLE_SPEED,
            init: sc.ASSIST_PUZZLE_SPEED.NORM,
            cat: sc.OPTION_CATEGORY.ASSISTS,
            fill: true,
            showPercentage: true,
            hasDivider: true,
            header: "puzzle"
        }
    };
    ig.nwjsVersion && ig.nwjsVersion[1] >= 3E3 && delete sc.OPTIONS_DEFINITION["web-audio"];
    if (window.IG_GAME_DEBUG) {
        sc.OPTIONS_DEFINITION["keys-jump"] = {
            type: "CONTROLS",
            init: {
                key1: ig.KEY.Y,
                key2: void 0
            },
            cat: sc.OPTION_CATEGORY.CONTROLS,
            isDebug: true,
            hasDivider: true,
            header: "debug"
        };
        sc.OPTIONS_DEFINITION["keys-time"] = {
            type: "CONTROLS",
            init: {
                key1: ig.KEY.T,
                key2: void 0
            },
            cat: sc.OPTION_CATEGORY.CONTROLS,
            isDebug: true
        };
        sc.OPTIONS_DEFINITION["keys-rumble"] = {
            type: "CONTROLS",
            init: {
                key1: ig.KEY.R,
                key2: void 0
            },
            cat: sc.OPTION_CATEGORY.CONTROLS,
            isDebug: true
        };
        sc.OPTIONS_DEFINITION["keys-debug"] = {
            type: "CONTROLS",
            init: {
                key1: ig.KEY._7,
                key2: void 0
            },
            cat: sc.OPTION_CATEGORY.CONTROLS,
            isDebug: true
        };
        sc.OPTIONS_DEFINITION["keys-debug2"] = {
            type: "CONTROLS",
            init: {
                key1: ig.KEY._8,
                key2: void 0
            },
            cat: sc.OPTION_CATEGORY.CONTROLS,
            isDebug: true
        };
        sc.OPTIONS_DEFINITION["keys-addBuff"] = {
            type: "CONTROLS",
            init: {
                key1: ig.KEY._0,
                key2: void 0
            },
            cat: sc.OPTION_CATEGORY.CONTROLS,
            isDebug: true
        };
        sc.OPTIONS_DEFINITION["keys-levelUp"] = {
            type: "CONTROLS",
            init: {
                key1: ig.KEY.ADD,
                key2: void 0
            },
            cat: sc.OPTION_CATEGORY.CONTROLS,
            isDebug: true
        }
    }
    sc.KEY_OPTION_MAP = {};
    for (var d in sc.OPTIONS_DEFINITION) sc.OPTIONS_DEFINITION[d].type == "CONTROLS" && d.indexOf("keys") == 0 && (sc.KEY_OPTION_MAP[d.substr(5)] = d);
    var c = a;
    if (localStorage.getItem("IG_FULLSCREEN")) {
        c = localStorage.getItem("IG_FULLSCREEN") == "true";
        console.log("INIT FULLSCREEN VALUE", c);
        b(c)
    }
    sc.KeyBinder = ig.Class.extend({
        init: function() {},
        initBindings: function() {
            var a = sc.options.values,
                b;
            for (b in sc.KEY_OPTION_MAP) {
                if (a[sc.KEY_OPTION_MAP[b]].key1 !=
                    void 0) {
                    ig.input.bind(a[sc.KEY_OPTION_MAP[b]].key1, b);
                    sc.fontsystem.changeKeyCodeIcon(b, a[sc.KEY_OPTION_MAP[b]].key1)
                }
                a[sc.KEY_OPTION_MAP[b]].key2 != void 0 && ig.input.bind(a[sc.KEY_OPTION_MAP[b]].key2, b)
            }
            this.updateGamepadIcons()
        },
        unbind: function(a, b) {
            ig.input.bindings[b.init.key1 != void 0] && ig.input.unbind(b.init.key1);
            ig.input.bindings[b.init.key2] != void 0 && ig.input.unbind(b.init.key2)
        },
        updateGamepadIcons: function() {
            sc.fontsystem.setGamepadIconStyle(sc.options.get("gamepad-icons"));
            var a = sc.options.get("gamepad-attack") ?
                "gamepad-r2" : "gamepad-r1",
                b = sc.options.get("gamepad-attack") ? "gamepad-r1" : "gamepad-r2";
            sc.fontsystem.changeGamepadIcon("throw", a);
            sc.fontsystem.changeGamepadIcon("special", b);
            a = sc.options.get("gamepad-dash") ? "gamepad-l2" : "gamepad-l1";
            b = sc.options.get("gamepad-dash") ? "gamepad-l1" : "gamepad-l2";
            sc.fontsystem.changeGamepadIcon("dash", a);
            sc.fontsystem.changeGamepadIcon("guard", a);
            sc.fontsystem.changeGamepadIcon("quick", b)
        },
        changeBinding: function(a, b, c, d) {
            var i = sc.options.values;
            sc.options.hasChanged = true;
            c ? ig.input.bindings[i[a].key2] && ig.input.unbind(i[a].key2) : ig.input.unbind(i[a].key1);
            if (c && d) i[a].key2 = void 0;
            else {
                var j = a.substr(5),
                    d = ig.input.bindings[b];
                ig.input.bind(b, j);
                sc.fontsystem.changeKeyCodeIcon(j, b);
                if (d) {
                    var k = i[sc.KEY_OPTION_MAP[d]],
                        j = c ? i[sc.KEY_OPTION_MAP[j]].key2 : i[sc.KEY_OPTION_MAP[j]].key1;
                    k.key2 == b ? k.key2 = j : k.key1 = j;
                    ig.input.bind(j, d);
                    sc.fontsystem.changeKeyCodeIcon(d, j);
                    sc.options.dispatchKeySwappedEvent()
                }
                c ? i[a].key2 = b : i[a].key1 = b
            }
        }
    });
    sc.OptionModel = ig.GameAddon.extend({
        observers: [],
        hdMode: false,
        hasChanged: false,
        keyBinder: new sc.KeyBinder,
        values: {},
        _loaded: false,
        init: function() {
            this.parent("OptionsModel");
            ig.storage.register(this);
            if (ig.system.width > 480) this.hdMode = true;
            if (!window.wm) {
                var a = null,
                    b;
                for (b in sc.OPTIONS_DEFINITION) {
                    a = sc.OPTIONS_DEFINITION[b];
                    if (a.hasLocal) {
                        this.values[b + "-global"] = ig.copy(a.browser && ig.platform == ig.PLATFORM_TYPES.BROWSER ? a.browser : a.init);
                        this.values[b + "-local"] = ig.copy(a.browser && ig.platform == ig.PLATFORM_TYPES.BROWSER ? a.browser : a.init)
                    } else this.values[b] =
                        ig.copy(a.browser && ig.platform == ig.PLATFORM_TYPES.BROWSER ? a.browser : a.init);
                    b == "fullscreen" && (this.values[b] = c);
                    if (b == "language")
                        for (var d in sc.LANGUAGE_MAP) ig.currentLang == sc.LANGUAGE_MAP[d] && (this.values[b] = d);
                    this._checkSystemSettings(b)
                }
                this.onStorageGlobalLoad(ig.storage.globalData)
            }
            ig.vars.registerVarAccessor("option", this, "VarOptionEditor")
        },
        onVarAccess: function(a, b) {
            if (b[0] == "option") {
                var c = b[1];
                if (sc.OPTIONS_DEFINITION[c] !== void 0) return this.values[c]
            }
            throw Error("Unsupported var access path: " +
                a);
        },
        persistOptions: function() {
            if (this.hasChanged) {
                this.hasChanged = false;
                ig.storage.saveGlobals()
            }
        },
        resetDefaultValues: function(a) {
            this.hasChanged = true;
            for (var b in sc.OPTIONS_DEFINITION) {
                var c = sc.OPTIONS_DEFINITION[b];
                c.hasLocal ? a ? this.values[b + "-local"] = ig.copy(c.browser && ig.platform == ig.PLATFORM_TYPES.BROWSER ? c.browser : c.init) : this.values[b + "-global"] = ig.copy(c.browser && ig.platform == ig.PLATFORM_TYPES.BROWSER ? c.browser : c.init) : this.values[b] = ig.copy(c.browser && ig.platform == ig.PLATFORM_TYPES.BROWSER ?
                    c.browser : c.init);
                c.type == "CONTROLS" && this.keyBinder.unbind(b, c);
                this._checkSystemSettings(b)
            }
            this.keyBinder.initBindings();
            sc.Model.notifyObserver(this, sc.OPTIONS_EVENT.OPTION_CHANGED);
            sc.Model.notifyObserver(this, sc.OPTIONS_EVENT.OPTION_KEYS_SWAPPED)
        },
        dispatchKeySwappedEvent: function() {
            sc.Model.notifyObserver(this, sc.OPTIONS_EVENT.OPTION_KEYS_SWAPPED)
        },
        set: function(a, b, c) {
            if (sc.OPTIONS_DEFINITION[a]) {
                if (!this.hasChanged) this.hasChanged = true;
                sc.OPTIONS_DEFINITION[a].hasLocal ? c ? this.values[a + "-local"] =
                    b : this.values[a + "-global"] = b : this.values[a] = b;
                this._checkSystemSettings(a);
                sc.OPTIONS_DEFINITION[a].gamepadIconUpdate && this.keyBinder.updateGamepadIcons();
                sc.Model.notifyObserver(this, sc.OPTIONS_EVENT.OPTION_CHANGED)
            }
        },
        get: function(a, b) {
            return sc.OPTIONS_DEFINITION[a] ? sc.OPTIONS_DEFINITION[a].hasLocal ? b ? this.values[a + "-local"] : this.values[a + "-global"] : this.values[a] : null
        },
        hasLocal: function(a) {
            if (sc.OPTIONS_DEFINITION[a]) {
                if (sc.OPTIONS_DEFINITION[a].hasLocal) return true
            } else ig.warn("Can't find option because of invalid key: " +
                a);
            return false
        },
        _checkSystemSettings: function(a) {
            if (!window.IG_IGNORE_OPTIONS)
                if (a == "fullscreen") this._setFullscreen();
                else if (a == "volume-master") ig.system.setMasterVolume(this.values[a]);
            else if (a == "language") {
                a = sc.LANGUAGE_MAP[this.values[a]];
                localStorage.setItem("IG_LANG", a);
                ig.log("%cOPTION SET LANG: " + a, "color:#FF4A4A")
            } else if (a == "volume-music") {
                window.IG_MUSIC_VOLUME = this.values[a];
                ig.system.setMusicVolume(this.values[a]);
                localStorage.setItem("options.musicVolume", this.values[a])
            } else if (a ==
                "volume-sound") {
                window.IG_SOUND_VOLUME = this.values[a];
                ig.system.setSoundVolume(this.values[a]);
                localStorage.setItem("options.soundVolume", this.values[a])
            } else if (a == "display-type") {
                this._setDisplaySize();
                localStorage.setItem("options.screenMode", window.IG_SCREEN_MODE)
            } else if (a == "web-audio") {
                window.IG_USE_WEBAUDIO = this.values[a];
                localStorage.setItem("options.useWebAudio", this.values[a])
            } else if (a == "pixel-size") {
                window.IG_GAME_SCALE = (this.values[a] || 0) + 1;
                localStorage.setItem("options.scale", window.IG_GAME_SCALE)
            } else if (a ==
                "double-pixels") {
                window.IG_GAME_SCALE = this.values[a] ? 2 : 1;
                localStorage.setItem("options.scale", window.IG_GAME_SCALE)
            } else a == "pause-unfocused" && (window.IG_KEEP_WINDOW_FOCUS = !this.values[a])
        },
        _checkForKeyBindingFailure: function() {
            var a = false,
                b;
            for (b in sc.OPTIONS_DEFINITION) {
                var c = sc.OPTIONS_DEFINITION[b];
                if (c.type == "CONTROLS" && this.values[b].key1 === void 0) {
                    a = true;
                    break
                }
            }
            if (a) {
                console.log("KEY BINDING FAILURE. RESET TO DEFAULT CONFIG");
                for (b in sc.OPTIONS_DEFINITION) {
                    c = sc.OPTIONS_DEFINITION[b];
                    c.type ==
                        "CONTROLS" && (this.values[b] = ig.copy(c.init))
                }
            }
        },
        _setDisplaySize: function() {
            var a = 0,
                b = 0,
                c = window.IG_WIDTH,
                d = window.IG_HEIGHT,
                b = $(window).width(),
                i = $(window).height(),
                j = false,
                k = false;
            switch (this.values["display-type"]) {
                case sc.DISPLAY_TYPE.ORIGINAL:
                    a = c;
                    b = d;
                    break;
                case sc.DISPLAY_TYPE.SCALE_X2:
                    a = c * 2;
                    b = d * 2;
                    break;
                case sc.DISPLAY_TYPE.FIT:
                    k = true;
                    if (b / i > c / d) {
                        b = i;
                        a = c * i / d
                    } else {
                        a = b;
                        b = d * b / c
                    }
                    j = true;
                    break;
                case sc.DISPLAY_TYPE.STRETCH:
                    k = true;
                    a = b;
                    b = i;
                    j = true;
                    break;
                default:
                    a = c;
                    b = d
            }
            if (k)
                for (i = 1; i < 4; ++i)
                    if (Math.abs(a -
                            c * i) < 20) {
                        a = c * i;
                        b = d * i
                    } window.IG_SCREEN_MODE = this.values["display-type"];
            if (window.ig && window.ig.system) ig.system.setCanvasSize(a, b, j);
            else {
                $("#canvas").width(a);
                $("#canvas").height(b);
                $("#canvas")[0].className = j ? "borderHidden" : ""
            }
        },
        _setFullscreen: function() {
            if (ig.platform == ig.PLATFORM_TYPES.DESKTOP) {
                var a = this.values.fullscreen;
                localStorage.setItem("IG_FULLSCREEN", a);
                b(a)
            }
        },
        onStorageSave: function(a) {
            var b = {},
                c = null,
                d;
            for (d in sc.OPTIONS_DEFINITION) {
                c = sc.OPTIONS_DEFINITION[d];
                c.hasLocal && (b[d] = this.values[d +
                    "-local"])
            }
            a.options = b
        },
        onStoragePreLoad: function(a) {
            var a = a.options,
                b;
            for (b in a)
                if (sc.OPTIONS_DEFINITION[b]) {
                    this.values[b + "-local"] = a[b];
                    this._checkSystemSettings(b)
                } sc.Model.notifyObserver(this, sc.OPTIONS_EVENT.OPTION_CHANGED)
        },
        onStorageGlobalSave: function(a) {
            var b = {},
                c = null,
                d;
            for (d in sc.OPTIONS_DEFINITION) {
                c = sc.OPTIONS_DEFINITION[d];
                b[d] = c.hasLocal ? this.values[d + "-global"] : this.values[d]
            }
            a.options = b
        },
        onStorageGlobalLoad: function(a) {
            var a = a.options,
                b;
            for (b in a)
                if (sc.OPTIONS_DEFINITION[b]) {
                    sc.OPTIONS_DEFINITION[b].hasLocal ?
                        this.values[b + "-global"] = a[b] : this.values[b] = a[b];
                    this._checkSystemSettings(b)
                } this._checkForKeyBindingFailure();
            this._loaded = true;
            sc.Model.notifyObserver(this, sc.OPTIONS_EVENT.OPTION_CHANGED)
        }
    });
    sc.OPTIONS_EVENT = {};
    sc.OPTIONS_EVENT.OPTION_CHANGED = 0;
    sc.OPTIONS_EVENT.OPTION_KEYS_SWAPPED = 1;
    ig.addGameAddon(function() {
        return sc.options = sc.options = new sc.OptionModel
    })
});
ig.baked = !0;

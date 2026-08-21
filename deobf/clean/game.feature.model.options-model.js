/**
 * game.feature.model.options-model
 * ================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.model.options-model")`.
 *
 * `sc.OptionModel` (the `sc.options` add-on): every game option — its
 * definition table (`sc.OPTIONS_DEFINITION`), enum constants, key bindings
 * (`sc.KeyBinder`), persistence via storage, and system-settings side
 * effects (fullscreen, volume, display size, language, …). The
 * `OPTIONS_DEFINITION` table below is spliced byte-identical from the
 * original (only the `fullscreen` entry's `init` var was renamed).
 */
ig.module("game.feature.model.options-model")
    .requires(
        "impact.base.game",
        "impact.feature.storage.storage",
        "impact.base.input",
        "game.feature.model.base-model"
    )
    .defines(function () {

    /** Apply (or remove) fullscreen on the NW.js desktop window. */
    function setFullscreen(fullscreen) {
        if (ig.platform == ig.PLATFORM_TYPES.DESKTOP) {
            var nwWindow = window.require("nw.gui").Window.get();
            if (nwWindow.isFullscreen != fullscreen) {
                ig.log("%cChanging Fullscreen: " + fullscreen, "color:#FF4A4A");
                fullscreen ? nwWindow.enterFullscreen() : nwWindow.leaveFullscreen()
            }
        }
    }

    sc.KEY_BLACK_LIST = {};
    sc.KEY_BLACK_LIST[ig.KEY.CTRL] = true;
    sc.KEY_BLACK_LIST[ig.KEY.F1] = true;
    sc.KEY_BLACK_LIST[ig.KEY.F2] = true;
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

    var defaultFullscreen = window.IG_GAME_DEBUG || ig.platform != ig.PLATFORM_TYPES.DESKTOP ? false : true;
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
            init: defaultFullscreen,
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
    for (var key in sc.OPTIONS_DEFINITION) sc.OPTIONS_DEFINITION[key].type == "CONTROLS" && key.indexOf("keys") == 0 && (sc.KEY_OPTION_MAP[key.substr(5)] = key);

    var fullscreenValue = defaultFullscreen;
    if (localStorage.getItem("IG_FULLSCREEN")) {
        fullscreenValue = localStorage.getItem("IG_FULLSCREEN") == "true";
        console.log("INIT FULLSCREEN VALUE", fullscreenValue);
        setFullscreen(fullscreenValue)
    }

    sc.KeyBinder = ig.Class.extend({
        init: function () {},

        /** Bind every configured key (primary + secondary) to its input action. */
        initBindings: function () {
            var values = sc.options.values,
                action;
            for (action in sc.KEY_OPTION_MAP) {
                if (values[sc.KEY_OPTION_MAP[action]].key1 != void 0) {
                    ig.input.bind(values[sc.KEY_OPTION_MAP[action]].key1, action);
                    sc.fontsystem.changeKeyCodeIcon(action, values[sc.KEY_OPTION_MAP[action]].key1)
                }
                values[sc.KEY_OPTION_MAP[action]].key2 != void 0 && ig.input.bind(values[sc.KEY_OPTION_MAP[action]].key2, action)
            }
            this.updateGamepadIcons()
        },

        unbind: function (optionKey, definition) {
            ig.input.bindings[definition.init.key1 != void 0] && ig.input.unbind(definition.init.key1);
            ig.input.bindings[definition.init.key2] != void 0 && ig.input.unbind(definition.init.key2)
        },

        /** Sync the gamepad icon set (R1/R2/L1/L2 placement) with the options. */
        updateGamepadIcons: function () {
            sc.fontsystem.setGamepadIconStyle(sc.options.get("gamepad-icons"));
            var attackIcon = sc.options.get("gamepad-attack") ? "gamepad-r2" : "gamepad-r1",
                specialIcon = sc.options.get("gamepad-attack") ? "gamepad-r1" : "gamepad-r2";
            sc.fontsystem.changeGamepadIcon("throw", attackIcon);
            sc.fontsystem.changeGamepadIcon("special", specialIcon);
            var dashIcon = sc.options.get("gamepad-dash") ? "gamepad-l2" : "gamepad-l1";
            var quickIcon = sc.options.get("gamepad-dash") ? "gamepad-l1" : "gamepad-l2";
            sc.fontsystem.changeGamepadIcon("dash", dashIcon);
            sc.fontsystem.changeGamepadIcon("guard", dashIcon);
            sc.fontsystem.changeGamepadIcon("quick", quickIcon)
        },

        /** Rebind an action to a new key, swapping with whatever previously owned it. */
        changeBinding: function (optionKey, newKey, isSecondary, swapFlag) {
            var values = sc.options.values;
            sc.options.hasChanged = true;
            isSecondary ? ig.input.bindings[values[optionKey].key2] && ig.input.unbind(values[optionKey].key2) : ig.input.unbind(values[optionKey].key1);
            if (isSecondary && swapFlag) values[optionKey].key2 = void 0;
            else {
                var action = optionKey.substr(5),
                    oldAction = ig.input.bindings[newKey];
                ig.input.bind(newKey, action);
                sc.fontsystem.changeKeyCodeIcon(action, newKey);
                if (oldAction) {
                    var oldOption = values[sc.KEY_OPTION_MAP[oldAction]],
                        oldKey = isSecondary ? values[sc.KEY_OPTION_MAP[action]].key2 : values[sc.KEY_OPTION_MAP[action]].key1;
                    oldOption.key2 == newKey ? oldOption.key2 = oldKey : oldOption.key1 = oldKey;
                    ig.input.bind(oldKey, oldAction);
                    sc.fontsystem.changeKeyCodeIcon(oldAction, oldKey);
                    sc.options.dispatchKeySwappedEvent()
                }
                isSecondary ? values[optionKey].key2 = newKey : values[optionKey].key1 = newKey
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

        init: function () {
            this.parent("OptionsModel");
            ig.storage.register(this);
            if (ig.system.width > 480) this.hdMode = true;
            if (!window.wm) {
                var definition = null,
                    key;
                for (key in sc.OPTIONS_DEFINITION) {
                    definition = sc.OPTIONS_DEFINITION[key];
                    if (definition.hasLocal) {
                        this.values[key + "-global"] = ig.copy(definition.browser && ig.platform == ig.PLATFORM_TYPES.BROWSER ? definition.browser : definition.init);
                        this.values[key + "-local"] = ig.copy(definition.browser && ig.platform == ig.PLATFORM_TYPES.BROWSER ? definition.browser : definition.init)
                    } else this.values[key] = ig.copy(definition.browser && ig.platform == ig.PLATFORM_TYPES.BROWSER ? definition.browser : definition.init);
                    key == "fullscreen" && (this.values[key] = fullscreenValue);
                    if (key == "language")
                        for (var langKey in sc.LANGUAGE_MAP) ig.currentLang == sc.LANGUAGE_MAP[langKey] && (this.values[key] = langKey);
                    this._checkSystemSettings(key)
                }
                this.onStorageGlobalLoad(ig.storage.globalData)
            }
            ig.vars.registerVarAccessor("option", this, "VarOptionEditor")
        },

        onVarAccess: function (accessPath, pathParts) {
            if (pathParts[0] == "option") {
                var optionKey = pathParts[1];
                if (sc.OPTIONS_DEFINITION[optionKey] !== void 0) return this.values[optionKey]
            }
            throw Error("Unsupported var access path: " + accessPath);
        },

        persistOptions: function () {
            if (this.hasChanged) {
                this.hasChanged = false;
                ig.storage.saveGlobals()
            }
        },

        resetDefaultValues: function (isLocal) {
            this.hasChanged = true;
            for (var key in sc.OPTIONS_DEFINITION) {
                var definition = sc.OPTIONS_DEFINITION[key];
                definition.hasLocal ? isLocal ? this.values[key + "-local"] = ig.copy(definition.browser && ig.platform == ig.PLATFORM_TYPES.BROWSER ? definition.browser : definition.init) : this.values[key + "-global"] = ig.copy(definition.browser && ig.platform == ig.PLATFORM_TYPES.BROWSER ? definition.browser : definition.init) : this.values[key] = ig.copy(definition.browser && ig.platform == ig.PLATFORM_TYPES.BROWSER ? definition.browser : definition.init);
                definition.type == "CONTROLS" && this.keyBinder.unbind(key, definition);
                this._checkSystemSettings(key)
            }
            this.keyBinder.initBindings();
            sc.Model.notifyObserver(this, sc.OPTIONS_EVENT.OPTION_CHANGED);
            sc.Model.notifyObserver(this, sc.OPTIONS_EVENT.OPTION_KEYS_SWAPPED)
        },

        dispatchKeySwappedEvent: function () {
            sc.Model.notifyObserver(this, sc.OPTIONS_EVENT.OPTION_KEYS_SWAPPED)
        },

        set: function (key, value, isLocal) {
            if (sc.OPTIONS_DEFINITION[key]) {
                if (!this.hasChanged) this.hasChanged = true;
                sc.OPTIONS_DEFINITION[key].hasLocal ? isLocal ? this.values[key + "-local"] =
                    value : this.values[key + "-global"] = value : this.values[key] = value;
                this._checkSystemSettings(key);
                sc.OPTIONS_DEFINITION[key].gamepadIconUpdate && this.keyBinder.updateGamepadIcons();
                sc.Model.notifyObserver(this, sc.OPTIONS_EVENT.OPTION_CHANGED)
            }
        },

        get: function (key, isLocal) {
            return sc.OPTIONS_DEFINITION[key] ? sc.OPTIONS_DEFINITION[key].hasLocal ? isLocal ? this.values[key + "-local"] : this.values[key + "-global"] : this.values[key] : null
        },

        hasLocal: function (key) {
            if (sc.OPTIONS_DEFINITION[key]) {
                if (sc.OPTIONS_DEFINITION[key].hasLocal) return true
            } else ig.warn("Can't find option because of invalid key: " + key);
            return false
        },

        /** Apply option side effects: fullscreen, volume, language, display size, audio, scale. */
        _checkSystemSettings: function (key) {
            if (!window.IG_IGNORE_OPTIONS)
                if (key == "fullscreen") this._setFullscreen();
                else if (key == "volume-master") ig.system.setMasterVolume(this.values[key]);
            else if (key == "language") {
                var langCode = sc.LANGUAGE_MAP[this.values[key]];
                localStorage.setItem("IG_LANG", langCode);
                ig.log("%cOPTION SET LANG: " + langCode, "color:#FF4A4A")
            } else if (key == "volume-music") {
                window.IG_MUSIC_VOLUME = this.values[key];
                ig.system.setMusicVolume(this.values[key]);
                localStorage.setItem("options.musicVolume", this.values[key])
            } else if (key == "volume-sound") {
                window.IG_SOUND_VOLUME = this.values[key];
                ig.system.setSoundVolume(this.values[key]);
                localStorage.setItem("options.soundVolume", this.values[key])
            } else if (key == "display-type") {
                this._setDisplaySize();
                localStorage.setItem("options.screenMode", window.IG_SCREEN_MODE)
            } else if (key == "web-audio") {
                window.IG_USE_WEBAUDIO = this.values[key];
                localStorage.setItem("options.useWebAudio", this.values[key])
            } else if (key == "pixel-size") {
                window.IG_GAME_SCALE = (this.values[key] || 0) + 1;
                localStorage.setItem("options.scale", window.IG_GAME_SCALE)
            } else if (key == "double-pixels") {
                window.IG_GAME_SCALE = this.values[key] ? 2 : 1;
                localStorage.setItem("options.scale", window.IG_GAME_SCALE)
            } else key == "pause-unfocused" && (window.IG_KEEP_WINDOW_FOCUS = !this.values[key])
        },

        /** Detect unbound control keys and reset controls to defaults. */
        _checkForKeyBindingFailure: function () {
            var hasFailure = false,
                key;
            for (key in sc.OPTIONS_DEFINITION) {
                var definition = sc.OPTIONS_DEFINITION[key];
                if (definition.type == "CONTROLS" && this.values[key].key1 === void 0) {
                    hasFailure = true;
                    break
                }
            }
            if (hasFailure) {
                console.log("KEY BINDING FAILURE. RESET TO DEFAULT CONFIG");
                for (key in sc.OPTIONS_DEFINITION) {
                    definition = sc.OPTIONS_DEFINITION[key];
                    definition.type == "CONTROLS" && (this.values[key] = ig.copy(definition.init))
                }
            }
        },

        /** Compute the canvas/window size for the current display-type option. */
        _setDisplaySize: function () {
            var width = 0,
                height = 0,
                baseWidth = window.IG_WIDTH,
                baseHeight = window.IG_HEIGHT,
                windowWidth = $(window).width(),
                windowHeight = $(window).height(),
                stretch = false,
                useCanvas = false;
            switch (this.values["display-type"]) {
                case sc.DISPLAY_TYPE.ORIGINAL:
                    width = baseWidth;
                    height = baseHeight;
                    break;
                case sc.DISPLAY_TYPE.SCALE_X2:
                    width = baseWidth * 2;
                    height = baseHeight * 2;
                    break;
                case sc.DISPLAY_TYPE.FIT:
                    useCanvas = true;
                    if (windowWidth / windowHeight > baseWidth / baseHeight) {
                        height = windowHeight;
                        width = baseWidth * windowHeight / baseHeight
                    } else {
                        width = windowWidth;
                        height = baseHeight * windowWidth / baseWidth
                    }
                    stretch = true;
                    break;
                case sc.DISPLAY_TYPE.STRETCH:
                    useCanvas = true;
                    width = windowWidth;
                    height = windowHeight;
                    stretch = true;
                    break;
                default:
                    width = baseWidth;
                    height = baseHeight
            }
            if (useCanvas)
                for (var scale = 1; scale < 4; ++scale)
                    if (Math.abs(width - baseWidth * scale) < 20) {
                        width = baseWidth * scale;
                        height = baseHeight * scale
                    }
            window.IG_SCREEN_MODE = this.values["display-type"];
            if (window.ig && window.ig.system) ig.system.setCanvasSize(width, height, stretch);
            else {
                $("#canvas").width(width);
                $("#canvas").height(height);
                $("#canvas")[0].className = stretch ? "borderHidden" : ""
            }
        },

        _setFullscreen: function () {
            if (ig.platform == ig.PLATFORM_TYPES.DESKTOP) {
                var fullscreen = this.values.fullscreen;
                localStorage.setItem("IG_FULLSCREEN", fullscreen);
                setFullscreen(fullscreen)
            }
        },

        onStorageSave: function (data) {
            var localOptions = {},
                definition = null,
                key;
            for (key in sc.OPTIONS_DEFINITION) {
                definition = sc.OPTIONS_DEFINITION[key];
                definition.hasLocal && (localOptions[key] = this.values[key + "-local"])
            }
            data.options = localOptions
        },

        onStoragePreLoad: function (data) {
            var options = data.options,
                key;
            for (key in options)
                if (sc.OPTIONS_DEFINITION[key]) {
                    this.values[key + "-local"] = options[key];
                    this._checkSystemSettings(key)
                }
            sc.Model.notifyObserver(this, sc.OPTIONS_EVENT.OPTION_CHANGED)
        },

        onStorageGlobalSave: function (data) {
            var globalOptions = {},
                definition = null,
                key;
            for (key in sc.OPTIONS_DEFINITION) {
                definition = sc.OPTIONS_DEFINITION[key];
                globalOptions[key] = definition.hasLocal ? this.values[key + "-global"] : this.values[key]
            }
            data.options = globalOptions
        },

        onStorageGlobalLoad: function (data) {
            var options = data.options,
                key;
            for (key in options)
                if (sc.OPTIONS_DEFINITION[key]) {
                    sc.OPTIONS_DEFINITION[key].hasLocal ?
                        this.values[key + "-global"] = options[key] : this.values[key] = options[key];
                    this._checkSystemSettings(key)
                }
            this._checkForKeyBindingFailure();
            this._loaded = true;
            sc.Model.notifyObserver(this, sc.OPTIONS_EVENT.OPTION_CHANGED)
        }
    });

    sc.OPTIONS_EVENT = {};
    sc.OPTIONS_EVENT.OPTION_CHANGED = 0;
    sc.OPTIONS_EVENT.OPTION_KEYS_SWAPPED = 1;

    ig.addGameAddon(function () {
        return sc.options = sc.options = new sc.OptionModel
    })
});
ig.baked = !0;

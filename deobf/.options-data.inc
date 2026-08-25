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
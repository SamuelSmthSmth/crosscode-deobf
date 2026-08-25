ig.module("game.config").defines(function() {
    ig.SUPPORTED_LANG = ["en_US", "de_DE", "fr_FR", "zh_CN", "zh_TW", "ja_JP", "ko_KR"];
    ig.VISIBLE_LANG = ["en_US"];
    ig.LANG_DETAILS = {
        en_US: {},
        de_DE: {
            useFor: "de",
            commaDigits: true
        },
        zh_TW: {
            systemFont: "CrossCode",
            newlineAnywhere: true,
            newlineException: ["\u3001", "\u3002", "\uff0c", "\uff1f", "\uff01"],
            useFor: "zh-TW"
        },
        zh_CN: {
            systemFont: "CrossCode",
            newlineAnywhere: true,
            newlineException: ["\u3001", "\u3002", "\uff0c", "\uff1f", "\uff01"],
            useFor: "zh"
        },
        ja_JP: {
            systemFont: "CrossCodeJP",
            metrics: {
                size: [10,
                    7, 6
                ],
                baseLine: [12, 10, 6]
            },
            fixedMsgWidth: true,
            newlineAnywhere: true,
            newlineException: ["\u3001", "\u3002", "\u2026", "\uff01", "\uff1f"],
            useFor: "ja"
        },
        ko_KR: {
            systemFont: "CrossCodeKR",
            newlineAnywhere: false,
            newlineAfter: ["\u3001", "\u3002", "\u2026", "\uff01", "\uff1f"],
            useFor: "ko"
        }
    };
    ig.SYSTEM_FONT_METRICS = {
        size: [12, 10, 7],
        baseLine: [13, 10, 6]
    };
    ig.FORCE_LANG = null;
    ig.CONFIG = {
        DEFAULT_TILE_SIZE: 16,
        DISABLE_LAYER_SIZE: true,
        DISABLE_LAYER_DISTANCE: false,
        DISABLE_LAYER_REPEAT: true,
        COLLISION_TILESET: "media/map/collisiontiles-16x16.png"
    };
    ig.JSON_LOG = false;
    ig.TILEINFO_FILE = "data/tile-infos.json";
    ig.TERRAIN = {
        NORMAL: 1,
        METAL: 2,
        CARDBOARD: 3,
        EARTH: 4,
        GRASS: 5,
        WATER: 6,
        WOOD: 7,
        STONE: 8,
        METALSOLID: 9,
        SNOW: 10,
        ICE: 11,
        NOTHING: 12,
        QUICKSAND: 13,
        SHALLOW_WATER: 14,
        SAND: 15,
        COAL: 16,
        HOLE: 17,
        LASER: 18,
        METAL_HOLLOW: 19,
        SPIDERWEB: 20,
        HIGHWAY: 21,
        CRYSTAL: 22,
        BEACH_WATER: 23,
        BEACH_SAND: 24
    };
    ig.DANGER_TERRAIN = {
        HOLE: "HOLE",
        WATER: "WATER",
        COAL: "COAL",
        HIGHWAY: "HIGHWAY"
    };
    ig.TERRAIN_FILE = "data/terrain.json";
    ig.TERRAIN_DEFAULT = ig.TERRAIN.NORMAL;
    ig.DATABASE = {
        ACHIEVEMENTS: 1
    };
    ig.DATABASE_FILE =
        "data/database.json";
    ig.NPC_NAMES = "data/npc-names.json";
    ig.ITEM_DATABASE = "data/item-database.json";
    ig.SKILL_TREE = "data/skilltree.json";
    ig.CHANGE_LOG = "data/changelog.json";
    ig.ACHIEVEMENTS = "data/achievements.json"
});
ig.baked = !0;

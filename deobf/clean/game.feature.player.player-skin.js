/**
 * game.feature.player.player-skin
 * ===============================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.player.player-skin")`.
 *
 * Cosmetic player skins: `sc.PlayerSkinLibrary` (an ig.GameAddon) maps the
 * skin item toggle sets to active appearance / step-effect / aura / pet skins.
 * Each skin type (`sc.PLAYER_SKIN.*`) loads its own assets (anim sheets,
 * effect sheets, GUI images, character expressions, pet sounds) through a
 * load collector and releases them via clearCached().
 */
ig.module("game.feature.player.player-skin").requires(
    "impact.base.game",
    "game.feature.player.player-model",
    "game.feature.model.game-model"
).defines(function () {

    /** Built-in skins keyed by id; each entry ties the skin to an item toggle. */
    var SKIN_DEFINITIONS = {
        "holiday-hat": {
            item: 168,
            autoAdd: false,
            type: "Appearance",
            settings: {
                sheet: "player-skins.xmas",
                fx: "skins.xmas",
                gui: "xmas.png"
            }
        },
        "sparkling-boots": {
            item: 101,
            autoAdd: false,
            type: "StepEffect",
            settings: {
                fx: "skin-step.sparkling-boots"
            }
        },
        "holiday-boots": {
            item: 16,
            autoAdd: false,
            type: "StepEffect",
            settings: {
                fx: "skin-step.holiday-boots"
            }
        },
        "element-aura": {
            item: 519,
            autoAdd: false,
            type: "Aura",
            settings: {
                fx: "skin-aura.element"
            }
        },
        "menacing-aura": {
            item: 520,
            autoAdd: false,
            type: "Aura",
            settings: {
                fx: "skin-aura.menacing"
            }
        },
        "testing-pet": {
            item: 521,
            autoAdd: false,
            type: "Pet",
            settings: {
                animSheet: "pets.loops-cat",
                walkAnims: {
                    idle: "idle",
                    move: "move"
                },
                actorConfig: {
                    maxVel: 60,
                    jumpingEnabled: false
                },
                petSound: {
                    path: "media/sound/misc/pet-cat.ogg",
                    volume: 0.7
                }
            }
        },
        "cat-pet": {
            item: 527,
            autoAdd: false,
            type: "Pet",
            settings: {
                animSheet: "pets.cat",
                walkAnims: {
                    idle: "idle",
                    move: "move",
                    run: "run",
                    jump: "jump",
                    fall: "fall"
                },
                petSound: {
                    path: "media/sound/misc/pet-cat.ogg",
                    volume: 0.7
                }
            }
        },
        "penguin-pet": {
            item: 528,
            autoAdd: false,
            type: "Pet",
            settings: {
                animSheet: "pets.penguin",
                walkAnims: {
                    idle: "idle",
                    move: "move",
                    run: "run",
                    jump: "jump",
                    fall: "fall"
                },
                petSound: {
                    path: "media/sound/misc/pet-penguin.ogg",
                    volume: 0.7
                }
            }
        },
        "fox-pet": {
            item: 529,
            autoAdd: false,
            type: "Pet",
            settings: {
                animSheet: "pets.fox",
                walkAnims: {
                    idle: "idle",
                    move: "move",
                    run: "run",
                    jump: "jump",
                    fall: "fall"
                },
                petSound: {
                    path: "media/sound/misc/pet-fox.ogg",
                    volume: 0.7
                }
            }
        },
        shiba: {
            item: 534,
            autoAdd: false,
            type: "Pet",
            settings: {
                animSheet: "pets.shiba",
                petOffsets: [{
                    x: 0,
                    y: -11
                }, {
                    x: 16,
                    y: -2
                }, {
                    x: -16,
                    y: -2
                }, {
                    x: 0,
                    y: 7
                }],
                walkAnims: {
                    idle: "idle",
                    move: "move",
                    run: "run",
                    jump: "jump",
                    fall: "fall"
                },
                petSound: {
                    path: "media/sound/misc/pet-dog.ogg",
                    volume: 0.7
                }
            }
        },
        "dino-pet": {
            item: 537,
            autoAdd: false,
            type: "Pet",
            settings: {
                animSheet: "pets.dino",
                petOffsets: [{
                    x: 0,
                    y: -11
                }, {
                    x: 20,
                    y: -2
                }, {
                    x: -20,
                    y: -2
                }, {
                    x: 0,
                    y: 7
                }],
                walkAnims: {
                    idle: "idle",
                    move: "move",
                    run: "run",
                    jump: "jump",
                    fall: "fall"
                },
                petSound: {
                    path: "media/sound/misc/pet-rex.ogg",
                    volume: 0.9
                }
            }
        },
        "reaper-pet": {
            item: 538,
            autoAdd: false,
            type: "Pet",
            settings: {
                animSheet: "pets.reaper",
                petOffsets: [{
                    x: 0,
                    y: -11
                }, {
                    x: 16,
                    y: -2
                }, {
                    x: -16,
                    y: -2
                }, {
                    x: 0,
                    y: 7
                }],
                walkAnims: {
                    idle: "idle",
                    move: "move",
                    run: "run",
                    jump: "jump",
                    fall: "fall"
                },
                actorConfig: {
                    floatHeight: 4
                },
                petSound: {
                    path: "media/sound/misc/pet-reaper.ogg",
                    volume: 0.7
                }
            }
        },
        "dragon-pet": {
            item: 539,
            autoAdd: false,
            type: "Pet",
            settings: {
                animSheet: "pets.dragon",
                petOffsets: [{
                    x: 0,
                    y: -11
                }, {
                    x: 16,
                    y: -2
                }, {
                    x: -16,
                    y: -2
                }, {
                    x: 0,
                    y: 7
                }],
                walkAnims: {
                    idle: "idle",
                    move: "move",
                    run: "run",
                    jump: "jump",
                    fall: "fall"
                },
                actorConfig: {
                    floatHeight: 8
                }
            }
        },
        "crow-bar": {
            item: 549,
            autoAdd: false,
            type: "Pet",
            settings: {
                animSheet: "pets.crowbar",
                petOffsets: [{
                    x: 0,
                    y: -11
                }, {
                    x: 16,
                    y: -2
                }, {
                    x: -16,
                    y: -2
                }, {
                    x: 0,
                    y: 7
                }],
                walkAnims: {
                    idle: "idle",
                    move: "move",
                    run: "run",
                    jump: "jump",
                    fall: "fall"
                }
            }
        },
        "shy-fly": {
            item: 546,
            autoAdd: false,
            type: "Pet",
            settings: {
                animSheet: "pets.shyfly",
                petOffsets: [{
                    x: 0,
                    y: -11
                }, {
                    x: 16,
                    y: -2
                }, {
                    x: -16,
                    y: -2
                }, {
                    x: 0,
                    y: 7
                }],
                walkAnims: {
                    idle: "idle",
                    move: "move",
                    run: "run",
                    jump: "jump",
                    fall: "fall"
                },
                actorConfig: {
                    floatHeight: 8
                },
                petSound: {
                    path: "media/sound/misc/pet-shy-fly.ogg",
                    volume: 0.7
                }
            }
        },
        tank: {
            item: 547,
            autoAdd: false,
            type: "Pet",
            settings: {
                animSheet: "pets.tank",
                petOffsets: [{
                    x: 0,
                    y: -7
                }, {
                    x: 16,
                    y: 2
                }, {
                    x: -16,
                    y: 2
                }, {
                    x: 0,
                    y: 7
                }],
                walkAnims: {
                    idle: "idle",
                    move: "move",
                    run: "run",
                    jump: "jump",
                    fall: "fall"
                },
                petSound: {
                    path: "media/sound/misc/pet-tank.ogg",
                    volume: 0.7
                }
            }
        },
        psbot: {
            item: 548,
            autoAdd: false,
            type: "Pet",
            settings: {
                animSheet: "pets.psbot",
                petOffsets: [{
                    x: 0,
                    y: -11
                }, {
                    x: 16,
                    y: -2
                }, {
                    x: -16,
                    y: -2
                }, {
                    x: 0,
                    y: 7
                }],
                walkAnims: {
                    idle: "idle",
                    move: "move",
                    run: "run",
                    jump: "jump",
                    fall: "fall"
                },
                petSound: {
                    path: "media/sound/misc/pet-roball.ogg",
                    volume: 0.7
                }
            }
        },
        bat: {
            item: 552,
            autoAdd: false,
            type: "Pet",
            settings: {
                animSheet: "pets.bat",
                petOffsets: [{
                    x: 0,
                    y: -11
                }, {
                    x: 16,
                    y: -2
                }, {
                    x: -16,
                    y: -2
                }, {
                    x: 0,
                    y: 7
                }],
                walkAnims: {
                    idle: "idle",
                    move: "move",
                    run: "run",
                    jump: "jump",
                    fall: "fall"
                },
                actorConfig: {
                    floatHeight: 6
                },
                petSound: {
                    path: "media/sound/misc/pet-bat.ogg",
                    volume: 0.7
                }
            }
        },
        butterfly: {
            item: 553,
            autoAdd: false,
            type: "Pet",
            settings: {
                animSheet: "pets.butterfly",
                walkAnims: {
                    idle: "idle",
                    move: "move"
                },
                actorConfig: {
                    floatHeight: 8
                }
            }
        },
        pig: {
            item: 554,
            autoAdd: false,
            type: "Pet",
            settings: {
                animSheet: "pets.pig",
                walkAnims: {
                    idle: "idle",
                    move: "move",
                    run: "run",
                    jump: "jump",
                    fall: "fall"
                },
                petSound: {
                    path: "media/sound/misc/pet-pig.ogg",
                    volume: 0.7
                }
            }
        },
        plant: {
            item: 555,
            autoAdd: false,
            type: "Pet",
            settings: {
                animSheet: "pets.plant",
                walkAnims: {
                    idle: "idle",
                    move: "move",
                    run: "run",
                    jump: "jump",
                    fall: "fall"
                },
                petSound: {
                    path: "media/sound/misc/pet-seedling.ogg",
                    volume: 1
                }
            }
        },
        turtle: {
            item: 556,
            autoAdd: false,
            type: "Pet",
            settings: {
                animSheet: "pets.turtle",
                petOffsets: [{
                        x: 0,
                        y: -11
                    },
                    {
                        x: 16,
                        y: -2
                    }, {
                        x: -16,
                        y: -2
                    }, {
                        x: 0,
                        y: 7
                    }
                ],
                walkAnims: {
                    idle: "idle",
                    move: "move",
                    run: "run",
                    jump: "jump",
                    fall: "fall"
                },
                actorConfig: {
                    maxVel: 60
                }
            }
        },
        bot: {
            item: 557,
            autoAdd: false,
            type: "Pet",
            settings: {
                animSheet: "pets.bot",
                petOffsets: [{
                    x: 0,
                    y: -11
                }, {
                    x: 16,
                    y: -2
                }, {
                    x: -16,
                    y: -2
                }, {
                    x: 0,
                    y: 7
                }],
                walkAnims: {
                    idle: "idle",
                    move: "move",
                    run: "run",
                    jump: "jump",
                    fall: "fall"
                },
                actorConfig: {
                    floatHeight: 6
                },
                petSound: {
                    path: "media/sound/misc/pet-bot.ogg",
                    volume: 1
                }
            }
        },
        "ape-pet": {
            item: 558,
            autoAdd: false,
            type: "Pet",
            settings: {
                animSheet: "pets.ape",
                walkAnims: {
                    idle: "idle",
                    move: "move",
                    run: "run",
                    jump: "jump",
                    fall: "fall"
                },
                petSound: {
                    path: "media/sound/misc/pet-manki.ogg",
                    volume: 0.7
                }
            }
        },
        "goose-pet": {
            item: 559,
            autoAdd: false,
            type: "Pet",
            settings: {
                animSheet: "pets.goose",
                walkAnims: {
                    idle: "idle",
                    move: "move",
                    run: "run",
                    jump: "jump",
                    fall: "fall"
                },
                petSound: {
                    path: "media/sound/misc/goose/pet-goose-01.ogg",
                    volume: 0.7
                }
            }
        },
        "roach-pet": {
            item: 628,
            autoAdd: false,
            type: "Pet",
            settings: {
                animSheet: "pets.bug",
                walkAnims: {
                    idle: "idle",
                    move: "move",
                    run: "run",
                    jump: "jump",
                    fall: "fall"
                },
                petSound: {
                    path: "media/sound/misc/pet-cockroach.ogg",
                    volume: 0.7
                }
            }
        }
    };

    /** Base skin class: loads its assets through an ig.LoadCollector. */
    sc.PlayerSkinBase = ig.Class.extend({
        skinType: null,
        name: null,
        init: function (skinType, name, settings) {
            this.skinType = skinType;
            this.name = name;
            var collector = new ig.LoadCollector(this);
            this.constructSkin(settings);
            collector.finalizeLoadableFetching()
        },
        onLoadableComplete: function () {
            this.loaded = true;
            sc.playerSkins._notifyLoaded(this)
        },
        constructSkin: null
    });
    sc.PLAYER_SKIN = {};

    /** Appearance skin: replaces Lea's anim sheet, face expressions, GUI image and effect. */
    sc.PLAYER_SKIN.Appearance = sc.PlayerSkinBase.extend({
        animSheet: null,
        fx: null,
        guiImage: null,
        noHide: false,
        character: null,
        expressions: null,
        anims: null,
        guiImageBounds: null,
        imgReplace: null,
        constructSkin: function (settings) {
            this.animSheet = new ig.AnimationSheet(settings.sheet);
            this.fx = new ig.EffectSheet(settings.fx);
            this.guiImage = new ig.Image("media/gui/skins/" + settings.gui);
            this.guiImageBounds = settings.guiBounds || null;
            this.noHide = settings.noHide || false;
            if (settings.character) this.character = new sc.Character(settings.character);
            if (settings.anims) {
                this.anims = {};
                for (var key in settings.anims) this.anims[key] = new ig.AnimationSheet(settings.anims[key])
            }
            if (settings.img) this.imgReplace = settings.img
        },
        onLoadableComplete: function () {
            if (!this.character || this.expressions) this.parent();
            else {
                var collector =
                    new ig.LoadCollector(this),
                    expressions = this.character.data.face.expressions;
                this.expressions = {};
                for (var key in expressions) this.expressions[key] = new sc.CharacterExpression(this.character.name, key);
                collector.finalizeLoadableFetching()
            }
        },
        clearCached: function () {
            this.animSheet.decreaseRef();
            if (this.expressions)
                for (var key in this.expressions) this.expressions[key].decreaseRef();
            if (this.anims)
                for (key in this.anims) this.anims[key].decreaseRef();
            this.character && this.character.decreaseRef();
            this.fx.decreaseRef()
        },
        replaceFace: function (expressionData) {
            return !this.character ||
                !this.expressions || expressionData.character.name != "main.lea" ? expressionData : this.expressions[expressionData.expression] || expressionData
        },
        replaceAnim: function (animData) {
            return !this.anims ? animData : this.anims[animData.path] || animData
        },
        replaceImg: function (imgData) {
            return !this.imgReplace ? imgData : this.imgReplace[imgData] || imgData
        }
    });
    sc.PLAYER_SKIN.Appearance.toggleSet = "skins";

    /** Step-effect skin: a single effect sheet spawned on movement. */
    sc.PLAYER_SKIN.StepEffect = sc.PlayerSkinBase.extend({
        fx: null,
        constructSkin: function (settings) {
            this.fx = new ig.EffectSheet(settings.fx)
        },
        clearCached: function () {
            this.fx.decreaseRef()
        }
    });
    sc.PLAYER_SKIN.StepEffect.toggleSet = "stepEffects";

    /** Aura skin: a looping effect sheet around the player. */
    sc.PLAYER_SKIN.Aura =
        sc.PlayerSkinBase.extend({
            fx: null,
            constructSkin: function (settings) {
                this.fx = new ig.EffectSheet(settings.fx)
            },
            clearCached: function () {
                this.fx.decreaseRef()
            }
        });
    sc.PLAYER_SKIN.Aura.toggleSet = "aura";

    /** Pet skin: anim sheet, walk animations, follow offsets and pet sounds. */
    sc.PLAYER_SKIN.Pet = sc.PlayerSkinBase.extend({
        animSheet: null,
        walkAnims: null,
        petOffsets: null,
        actorConfig: null,
        constructSkin: function (settings) {
            this.animSheet = new ig.AnimationSheet(settings.animSheet);
            this.walkAnims = settings.walkAnims;
            this.petOffsets = settings.petOffsets;
            this.actorConfig = settings.actorConfig || {};
            if (settings.petSound) this.petSound = new ig.Sound(settings.petSound.path,
                settings.petSound.volume, settings.petSound.variance)
        },
        clearCached: function () {
            this.animSheet.decreaseRef();
            this.petSound && this.petSound.clearCached()
        }
    });
    sc.PLAYER_SKIN.Pet.toggleSet = "pet";
    sc.SKIN_EVENT = {
        SKIN_UPDATE: 1
    };

    /** Registry + activator of player skins; reacts to toggle items and model resets. */
    sc.PlayerSkinLibrary = ig.GameAddon.extend({
        observers: [],
        skins: {},
        itemToSkin: {},
        currentSkins: {},
        init: function () {
            this.parent("PlayerSkins");
            for (var skinId in SKIN_DEFINITIONS) this.registerSkin(skinId, SKIN_DEFINITIONS[skinId]);
            sc.Model.addObserver(sc.model.player, this);
            ig.extensions.addListener(this, "skin")
        },
        onExtensionLoaded: function (extension) {
            this.registerSkin(extension.id,
                extension)
        },
        registerSkin: function (id, definition) {
            if (this.skins[id]) throw Error("Tried to register skin of id '" + id + "' twice.");
            this.skins[id] = {
                item: definition.item,
                autoAdd: definition.autoAdd,
                type: definition.type,
                settings: definition.settings
            };
            this.itemToSkin[definition.item] = id
        },
        updateSkins: function () {
            for (var skinType in sc.PLAYER_SKIN) this.updateSkinSet(skinType)
        },
        /** Rebuild the active skin of one type from the current toggle item state. */
        updateSkinSet: function (skinType) {
            for (var currentSkin = this.currentSkins[skinType], newSkinId = null, player = sc.model.player, toggleItems = player.toggleSets[sc.PLAYER_SKIN[skinType].toggleSet].items, index = toggleItems.length; index--;) {
                var itemId = toggleItems[index];
                if (player.getToggleItemState(itemId)) {
                    newSkinId = this.itemToSkin[itemId];
                    break
                }
            }
            if (!(!newSkinId &&
                    !currentSkin || newSkinId && currentSkin && currentSkin.name == newSkinId)) {
                if (currentSkin) {
                    currentSkin.clearCached();
                    this.currentSkins[skinType] = null
                }
                newSkinId && (this.currentSkins[skinType] = this._createSkin(newSkinId));
                sc.Model.notifyObserver(this, sc.SKIN_EVENT.SKIN_UPDATE, skinType)
            }
        },
        getCurrentSkin: function (skinType) {
            return this.currentSkins[skinType]
        },
        replaceFace: function (expressionData) {
            var skin = this.getCurrentSkin("Appearance");
            return !skin ? expressionData : skin.replaceFace(expressionData)
        },
        replaceAnim: function (animData) {
            if (!animData) return animData;
            var skin = this.getCurrentSkin("Appearance");
            return !skin ? animData : skin.replaceAnim(animData)
        },
        replaceImg: function (imgData) {
            var skin = this.getCurrentSkin("Appearance");
            return !skin ?
                imgData : skin.replaceImg(imgData)
        },
        _createSkin: function (id) {
            var definition = this.skins[id];
            return !definition ? null : new sc.PLAYER_SKIN[definition.type](definition.type, id, definition.settings)
        },
        _notifyLoaded: function (skin) {
            sc.Model.notifyObserver(this, sc.SKIN_EVENT.SKIN_UPDATE, skin.skinType)
        },
        checkItems: function () {
            for (var skinType in sc.PLAYER_SKIN) this.checkItemSet(sc.PLAYER_SKIN[skinType].toggleSet)
        },
        /** Grant autoAdd skin items the player is missing; strip non-owned skin items. */
        checkItemSet: function (toggleSet) {
            for (var player = sc.model.player, toggleItems = player.toggleSets[toggleSet].items, index = toggleItems.length; index--;) {
                var itemId = toggleItems[index],
                    skinId = this.itemToSkin[itemId];
                skinId ? this.skins[skinId].autoAdd && !player.getItemAmount(itemId) && player.addItem(itemId, 1,
                    true) : player.removeItem(itemId, player.getItemAmount(itemId))
            }
        },
        getSkinsByType: function (type) {
            var list = [],
                skinId;
            for (skinId in this.skins) type == this.skins[skinId].type && list.push(skinId);
            return list
        },
        modelChanged: function (model, msg) {
            model == sc.model.player && (msg == sc.PLAYER_MSG.ITEM_TOGGLED || msg == sc.PLAYER_MSG.SET_PARAMS || msg == sc.PLAYER_MSG.RESET_PLAYER) && this.updateSkins()
        },
        levelLoadedOrder: 1E3,
        onLevelLoaded: function () {
            this.checkItems()
        }
    });
    ig.addGameAddon(function () {
        return sc.playerSkins = new sc.PlayerSkinLibrary
    })
});
ig.baked = !0;

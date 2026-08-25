ig.module("game.feature.player.player-skin").requires("impact.base.game", "game.feature.player.player-model", "game.feature.model.game-model").defines(function() {
    var b = {
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
    sc.PlayerSkinBase = ig.Class.extend({
        skinType: null,
        name: null,
        init: function(a, b, c) {
            this.skinType = a;
            this.name = b;
            a = new ig.LoadCollector(this);
            this.constructSkin(c);
            a.finalizeLoadableFetching()
        },
        onLoadableComplete: function() {
            this.loaded = true;
            sc.playerSkins._notifyLoaded(this)
        },
        constructSkin: null
    });
    sc.PLAYER_SKIN = {};
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
        constructSkin: function(a) {
            this.animSheet = new ig.AnimationSheet(a.sheet);
            this.fx = new ig.EffectSheet(a.fx);
            this.guiImage = new ig.Image("media/gui/skins/" + a.gui);
            this.guiImageBounds = a.guiBounds || null;
            this.noHide = a.noHide || false;
            if (a.character) this.character = new sc.Character(a.character);
            if (a.anims) {
                this.anims = {};
                for (var b in a.anims) this.anims[b] = new ig.AnimationSheet(a.anims[b])
            }
            if (a.img) this.imgReplace = a.img
        },
        onLoadableComplete: function() {
            if (!this.character || this.expressions) this.parent();
            else {
                var a =
                    new ig.LoadCollector(this),
                    b = this.character.data.face.expressions;
                this.expressions = {};
                for (var c in b) this.expressions[c] = new sc.CharacterExpression(this.character.name, c);
                a.finalizeLoadableFetching()
            }
        },
        clearCached: function() {
            this.animSheet.decreaseRef();
            if (this.expressions)
                for (var a in this.expressions) this.expressions[a].decreaseRef();
            if (this.anims)
                for (a in this.anims) this.anims[a].decreaseRef();
            this.character && this.character.decreaseRef();
            this.fx.decreaseRef()
        },
        replaceFace: function(a) {
            return !this.character ||
                !this.expressions || a.character.name != "main.lea" ? a : this.expressions[a.expression] || a
        },
        replaceAnim: function(a) {
            return !this.anims ? a : this.anims[a.path] || a
        },
        replaceImg: function(a) {
            return !this.imgReplace ? a : this.imgReplace[a] || a
        }
    });
    sc.PLAYER_SKIN.Appearance.toggleSet = "skins";
    sc.PLAYER_SKIN.StepEffect = sc.PlayerSkinBase.extend({
        fx: null,
        constructSkin: function(a) {
            this.fx = new ig.EffectSheet(a.fx)
        },
        clearCached: function() {
            this.fx.decreaseRef()
        }
    });
    sc.PLAYER_SKIN.StepEffect.toggleSet = "stepEffects";
    sc.PLAYER_SKIN.Aura =
        sc.PlayerSkinBase.extend({
            fx: null,
            constructSkin: function(a) {
                this.fx = new ig.EffectSheet(a.fx)
            },
            clearCached: function() {
                this.fx.decreaseRef()
            }
        });
    sc.PLAYER_SKIN.Aura.toggleSet = "aura";
    sc.PLAYER_SKIN.Pet = sc.PlayerSkinBase.extend({
        animSheet: null,
        walkAnims: null,
        petOffsets: null,
        actorConfig: null,
        constructSkin: function(a) {
            this.animSheet = new ig.AnimationSheet(a.animSheet);
            this.walkAnims = a.walkAnims;
            this.petOffsets = a.petOffsets;
            this.actorConfig = a.actorConfig || {};
            if (a.petSound) this.petSound = new ig.Sound(a.petSound.path,
                a.petSound.volume, a.petSound.variance)
        },
        clearCached: function() {
            this.animSheet.decreaseRef();
            this.petSound && this.petSound.clearCached()
        }
    });
    sc.PLAYER_SKIN.Pet.toggleSet = "pet";
    sc.SKIN_EVENT = {
        SKIN_UPDATE: 1
    };
    sc.PlayerSkinLibrary = ig.GameAddon.extend({
        observers: [],
        skins: {},
        itemToSkin: {},
        currentSkins: {},
        init: function() {
            this.parent("PlayerSkins");
            for (var a in b) this.registerSkin(a, b[a]);
            sc.Model.addObserver(sc.model.player, this);
            ig.extensions.addListener(this, "skin")
        },
        onExtensionLoaded: function(a) {
            this.registerSkin(a.id,
                a)
        },
        registerSkin: function(a, b) {
            if (this.skins[a]) throw Error("Tried to register skin of id '" + a + "' twice.");
            this.skins[a] = {
                item: b.item,
                autoAdd: b.autoAdd,
                type: b.type,
                settings: b.settings
            };
            this.itemToSkin[b.item] = a
        },
        updateSkins: function() {
            for (var a in sc.PLAYER_SKIN) this.updateSkinSet(a)
        },
        updateSkinSet: function(a) {
            for (var b = this.currentSkins[a], c = null, e = sc.model.player, f = e.toggleSets[sc.PLAYER_SKIN[a].toggleSet].items, g = f.length; g--;) {
                var h = f[g];
                if (e.getToggleItemState(h)) {
                    c = this.itemToSkin[h];
                    break
                }
            }
            if (!(!c &&
                    !b || c && b && b.name == c)) {
                if (b) {
                    b.clearCached();
                    this.currentSkins[a] = null
                }
                c && (this.currentSkins[a] = this._createSkin(c));
                sc.Model.notifyObserver(this, sc.SKIN_EVENT.SKIN_UPDATE, a)
            }
        },
        getCurrentSkin: function(a) {
            return this.currentSkins[a]
        },
        replaceFace: function(a) {
            var b = this.getCurrentSkin("Appearance");
            return !b ? a : b.replaceFace(a)
        },
        replaceAnim: function(a) {
            if (!a) return a;
            var b = this.getCurrentSkin("Appearance");
            return !b ? a : b.replaceAnim(a)
        },
        replaceImg: function(a) {
            var b = this.getCurrentSkin("Appearance");
            return !b ?
                a : b.replaceImg(a)
        },
        _createSkin: function(a) {
            var b = this.skins[a];
            return !b ? null : new sc.PLAYER_SKIN[b.type](b.type, a, b.settings)
        },
        _notifyLoaded: function(a) {
            sc.Model.notifyObserver(this, sc.SKIN_EVENT.SKIN_UPDATE, a.skinType)
        },
        checkItems: function() {
            for (var a in sc.PLAYER_SKIN) this.checkItemSet(sc.PLAYER_SKIN[a].toggleSet)
        },
        checkItemSet: function(a) {
            for (var b = sc.model.player, a = b.toggleSets[a].items, c = a.length; c--;) {
                var e = a[c],
                    f = this.itemToSkin[e];
                f ? this.skins[f].autoAdd && !b.getItemAmount(e) && b.addItem(e, 1,
                    true) : b.removeItem(e, b.getItemAmount(e))
            }
        },
        getSkinsByType: function(a) {
            var b = [],
                c;
            for (c in this.skins) a == this.skins[c].type && b.push(c);
            return b
        },
        modelChanged: function(a, b) {
            a == sc.model.player && (b == sc.PLAYER_MSG.ITEM_TOGGLED || b == sc.PLAYER_MSG.SET_PARAMS || b == sc.PLAYER_MSG.RESET_PLAYER) && this.updateSkins()
        },
        levelLoadedOrder: 1E3,
        onLevelLoaded: function() {
            this.checkItems()
        }
    });
    ig.addGameAddon(function() {
        return sc.playerSkins = new sc.PlayerSkinLibrary
    })
});
ig.baked = !0;

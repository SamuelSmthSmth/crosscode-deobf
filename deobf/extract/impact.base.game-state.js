ig.module("impact.base.game-state").defines(function() {
    ig.GameState = ig.Class.extend({
        game: {
            screen: {
                x: 0,
                y: 0
            },
            size: {
                x: 0,
                y: 0
            },
            paused: false,
            entities: [],
            mapEntities: [],
            shownEntities: [],
            freeEntityIds: [],
            namedEntities: {},
            _deferredDetach: [],
            conditionalEntities: [],
            maps: [],
            levels: {},
            maxLevel: 0,
            minLevelZ: 0,
            masterLevel: 0
        },
        system: {
            zoomFocus: {
                x: 0,
                y: 0
            },
            zoom: 1
        },
        physics: {
            collUpdateList: [],
            collOutOfScreenList: [],
            collEntryMap: []
        },
        physicsInitialized: false,
        renderer: {
            spriteSlots: [],
            guiSpriteSlots: []
        },
        init: function() {},
        clear: function() {
            ig.game.pushState(this);
            for (var b = this.game.entities, a = b.length; a--;) {
                b[a] && b[a].kill(true);
                if (b[a] && !b[a]._killed) throw Error("Entity of id " + this.entities[a].id + " was not properly killed");
            }
            ig.game.deferredMapEntityUpdate();
            ig.game.popState()
        },
        initEmpty: function(b, a) {
            this.game.size.x = b;
            this.game.size.y = a;
            this.game.maxLevel = 1;
            this.game.masterLevel = 0;
            this.game.levels.first = {
                maps: []
            };
            this.game.levels.last = {
                maps: []
            };
            this.game.levels.light = {
                maps: []
            };
            this.game.levels.postlight = {
                maps: []
            };
            this.game.levels.object1 = {
                maps: []
            };
            this.game.levels.object2 = {
                maps: []
            };
            this.game.levels.object3 = {
                maps: []
            };
            this.game.levels["0"] = {
                height: 0,
                collision: ig.MAP.Collision.staticNoCollision,
                maps: []
            }
        },
        initFromGame: function(b) {
            this.onEnd(b);
            this.physicsInitialized = true
        },
        forceUpdate: function() {
            ig.system.ingameTick = ig.system.tick;
            ig.system.tick = ig.system.actualTick;
            var b = ig.game;
            ig.game.pushState(this);
            b.physics.update();
            b.deferredMapEntityUpdate();
            ig.game.popState();
            ig.system.tick = ig.system.ingameTick
        },
        forceDraw: function(b,
            a) {
            var d = ig.game;
            this.game.screen.x = this.game.screen.x - b;
            this.game.screen.y = this.game.screen.y - a;
            ig.game.pushState(this);
            d.renderer.prepareDraw(d.shownEntities, true);
            d.renderer.drawLayers(true, true);
            d.renderer.drawPostLayerSprites(true);
            ig.game.popState();
            this.game.screen.x = this.game.screen.x + b;
            this.game.screen.y = this.game.screen.y + a
        },
        onEnd: function(b) {
            for (var a in this.game) this.game[a] = b[a];
            for (a in this.system) this.system[a] = ig.system[a];
            for (a in this.physics) this.physics[a] = b.physics[a];
            for (a in this.renderer) this.renderer[a] =
                b.renderer[a]
        },
        onStart: function(b) {
            for (var a in this.game) b[a] = this.game[a];
            for (a in this.system) ig.system[a] = this.system[a];
            for (a in this.physics) b.physics[a] = this.physics[a];
            for (a in this.renderer) b.renderer[a] = this.renderer[a];
            if (!this.physicsInitialized) {
                b.physics.mapLoaded();
                this.physicsInitialized = true
            }
        }
    })
});
ig.baked = !0;

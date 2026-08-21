/**
 * impact.base.game-state
 * ======================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `ig.module("impact.base.game-state")`.
 *
 * A snapshot/restore mechanism for the mutable parts of the running game
 * (`game`, `system`, `physics`, `renderer`). Used to temporarily run the game in
 * isolation (e.g. a forced physics/draw pass) without disturbing real state.
 */
ig.module("impact.base.game-state").defines(function () {

    ig.GameState = ig.Class.extend({
        game: {
            screen: { x: 0, y: 0 },
            size: { x: 0, y: 0 },
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
            masterLevel: 0,
        },
        system: {
            zoomFocus: { x: 0, y: 0 },
            zoom: 1,
        },
        physics: {
            collUpdateList: [],
            collOutOfScreenList: [],
            collEntryMap: [],
        },
        physicsInitialized: false,
        renderer: {
            spriteSlots: [],
            guiSpriteSlots: [],
        },

        init: function () {},

        /** Kill every entity in the snapshot's entity list. */
        clear: function () {
            ig.game.pushState(this);
            var entities = this.game.entities;
            for (var i = entities.length; i--;) {
                if (entities[i]) entities[i].kill(true);
                // NOTE: verbatim from the original — `this.entities` is likely a
                // typo for the local `entities` (only reached on an error path).
                if (entities[i] && !entities[i]._killed) {
                    throw Error("Entity of id " + this.entities[i].id + " was not properly killed");
                }
            }
            ig.game.deferredMapEntityUpdate();
            ig.game.popState();
        },

        /** Set up an empty level of the given dimensions. */
        initEmpty: function (width, height) {
            this.game.size.x = width;
            this.game.size.y = height;
            this.game.maxLevel = 1;
            this.game.masterLevel = 0;
            this.game.levels.first = { maps: [] };
            this.game.levels.last = { maps: [] };
            this.game.levels.light = { maps: [] };
            this.game.levels.postlight = { maps: [] };
            this.game.levels.object1 = { maps: [] };
            this.game.levels.object2 = { maps: [] };
            this.game.levels.object3 = { maps: [] };
            this.game.levels["0"] = {
                height: 0,
                collision: ig.MAP.Collision.staticNoCollision,
                maps: [],
            };
        },

        initFromGame: function (game) {
            this.onEnd(game);
            this.physicsInitialized = true;
        },

        /** Run a physics update using the snapshot's state, at full tick rate. */
        forceUpdate: function () {
            ig.system.ingameTick = ig.system.tick;
            ig.system.tick = ig.system.actualTick;
            var game = ig.game;
            ig.game.pushState(this);
            game.physics.update();
            game.deferredMapEntityUpdate();
            ig.game.popState();
            ig.system.tick = ig.system.ingameTick;
        },

        /** Render one frame with the screen offset by (dx, dy). */
        forceDraw: function (dx, dy) {
            var game = ig.game;
            this.game.screen.x = this.game.screen.x - dx;
            this.game.screen.y = this.game.screen.y - dy;
            ig.game.pushState(this);
            game.renderer.prepareDraw(game.shownEntities, true);
            game.renderer.drawLayers(true, true);
            game.renderer.drawPostLayerSprites(true);
            ig.game.popState();
            this.game.screen.x = this.game.screen.x + dx;
            this.game.screen.y = this.game.screen.y + dy;
        },

        /** Copy state FROM the given game into this snapshot. */
        onEnd: function (game) {
            for (var key in this.game) this.game[key] = game[key];
            for (key in this.system) this.system[key] = ig.system[key];
            for (key in this.physics) this.physics[key] = game.physics[key];
            for (key in this.renderer) this.renderer[key] = game.renderer[key];
        },

        /** Copy state FROM this snapshot back INTO the given game. */
        onStart: function (game) {
            for (var key in this.game) game[key] = this.game[key];
            for (key in this.system) ig.system[key] = this.system[key];
            for (key in this.physics) game.physics[key] = this.physics[key];
            for (key in this.renderer) game.renderer[key] = this.renderer[key];
            if (!this.physicsInitialized) {
                game.physics.mapLoaded();
                this.physicsInitialized = true;
            }
        },
    });
});

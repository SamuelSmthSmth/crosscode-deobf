/**
 * game.feature.character.character
 * ================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.character.character")`.
 *
 * `sc.Character` — a JSON-loadable that reads a character definition from
 * `data/characters/<name>.json`. Holds the face image and provides access
 * to face expression data.
 *
 * `sc.CharacterExpression` — a cacheable wrapper around a character +
 * expression name combo that pre-loads expression part images.
 */
ig.module("game.feature.character.character").requires(
    "game.feature.character.abstract-face"
).defines(function () {

    sc.Character = ig.JsonLoadable.extend({
        cacheType: "Character",
        data: null,
        name: null,
        faceImage: null,

        /** @param {string} name — character key (e.g. "lea") */
        init: function (name) {
            this.parent(name);
            this.name = name;
        },

        /**
         * Retrieve one expression definition by name.
         * @param {string} expression
         * @returns {object|undefined}
         */
        getExpression: function (expression) {
            return this.data.face && this.data.face.expressions[expression];
        },

        onCacheCleared: function () {
            this.faceImage && this.faceImage.decreaseRef();
        },

        getJsonPath: function () {
            return ig.root + this.path.toPath("data/characters/", ".json") + ig.getCacheSuffix();
        },

        onload: function (data) {
            this.data = data;
            if (this.data.face) {
                this.data.face.ABSTRACT && (this.data.face = sc.ABSTRACT_FACES[this.data.face.ABSTRACT]);
                this.faceImage = new ig.Image("media/face/" + this.data.face.src);
            }
        },

        /**
         * Preload the images needed to render a specific expression.
         * @param {string} expression
         * @returns {object|undefined} map of sub-image keys → ig.Image
         */
        getExpressionImages: function (expression) {
            var images;
            if (this.data && this.data.face && this.data.face.expressions) {
                var exprData = this.data.face.expressions[expression];
                var parts = this.data.face.parts;
                if (exprData) {
                    for (var i = exprData.faces.length; i--;) {
                        for (var j = exprData.faces[i].length; j--;) {
                            var partKey = exprData.faces[i][j];
                            var partDef = parts[j] && parts[j][partKey] && parts[j][partKey].img;
                            if (partDef) {
                                images || (images = {});
                                if (!images[partDef]) {
                                    images[partDef] = new ig.Image(
                                        "media/face/" + this.data.face.subImages[partDef]
                                    );
                                }
                            }
                        }
                    }
                }
            }
            return images;
        }
    });

    sc.CharacterExpression = ig.Cacheable.extend({
        cacheType: "CHAR_EXPRESSION",
        character: null,
        expression: null,
        expressionImages: null,

        /**
         * @param {string} characterName
         * @param {string} expression
         */
        init: function (characterName, expression) {
            this.parent();
            this.character = new sc.Character(characterName);
            this.expression = expression;
            this.character.addLoadListener(this);
        },

        getCacheKey: function (name, expr) {
            return name + "|" + expr;
        },

        onCacheCleared: function () {
            this.character && this.character.decreaseRef();
            if (this.expressionImages) {
                for (var key in this.expressionImages) {
                    this.expressionImages[key].decreaseRef();
                }
            }
        },

        onLoadableComplete: function (success) {
            if (success) {
                this.expressionImages = this.character.getExpressionImages(this.expression);
            }
        },

        clone: function () {
            return new sc.CharacterExpression(this.character.name, this.expression);
        }
    });
});
ig.baked = !0;
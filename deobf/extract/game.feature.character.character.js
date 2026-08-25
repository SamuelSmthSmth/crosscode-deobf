ig.module("game.feature.character.character").requires("game.feature.character.abstract-face").defines(function() {
    sc.Character = ig.JsonLoadable.extend({
        cacheType: "Character",
        data: null,
        name: null,
        faceImage: null,
        init: function(b) {
            this.parent(b);
            this.name = b
        },
        getExpression: function(b) {
            return this.data.face && this.data.face.expressions[b]
        },
        onCacheCleared: function() {
            this.faceImage && this.faceImage.decreaseRef()
        },
        getJsonPath: function() {
            return ig.root + this.path.toPath("data/characters/", ".json") + ig.getCacheSuffix()
        },
        onload: function(b) {
            this.data = b;
            if (this.data.face) {
                this.data.face.ABSTRACT && (this.data.face = sc.ABSTRACT_FACES[this.data.face.ABSTRACT]);
                this.faceImage = new ig.Image("media/face/" + this.data.face.src)
            }
        },
        getExpressionImages: function(b) {
            var a;
            if (this.data && this.data.face && this.data.face.expressions) {
                var b = this.data.face.expressions[b],
                    d = this.data.face.parts;
                if (b)
                    for (var b = b.faces, c = b.length; c--;)
                        for (var e = b[c].length; e--;) {
                            var f = b[c][e];
                            if (f = d[e] && d[e][f] && d[e][f].img) {
                                a || (a = {});
                                a[f] || (a[f] = new ig.Image("media/face/" +
                                    this.data.face.subImages[f]))
                            }
                        }
            }
            return a
        }
    });
    sc.CharacterExpression = ig.Cacheable.extend({
        cacheType: "CHAR_EXPRESSION",
        character: null,
        expression: null,
        expressionImages: null,
        init: function(b, a) {
            this.parent();
            this.character = new sc.Character(b);
            this.expression = a;
            this.character.addLoadListener(this)
        },
        getCacheKey: function(b, a) {
            return b + "|" + a
        },
        onCacheCleared: function() {
            this.character && this.character.decreaseRef();
            if (this.expressionImages)
                for (var b in this.expressionImages) this.expressionImages[b].decreaseRef()
        },
        onLoadableComplete: function(b) {
            if (b) this.expressionImages = this.character.getExpressionImages(this.expression)
        },
        clone: function() {
            return new sc.CharacterExpression(this.character.name, this.expression)
        }
    })
});
ig.baked = !0;

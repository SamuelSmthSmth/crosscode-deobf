ig.module("game.feature.combat.entities.hit-number").requires("impact.base.entity", "impact.base.entity-pool").defines(function() {
    sc.HIT_NUMBER_SIZE = {
        XXS: 0,
        XS: 1,
        S: 2,
        M: 3,
        L: 4,
        XL: 5
    };
    sc.HIT_NUMBER_COLOR = {
        NORMAL: 0,
        HEALING: 1,
        CRITICAL: 2,
        PLAYER_DAMAGE: 3,
        PLAYER_HEALING: 4,
        PLAYER_CRITICAL: 5,
        ENEMY_SUM: 6,
        PLAYER_SUM: 7
    };
    sc.HIT_NUMBER_APPENDIX = {
        NONE: 0,
        SHIELD: 1,
        STRONG: 2,
        WEAK: 3,
        PERFECT: 4,
        WEAKNESS: 5
    };
    var b = {};
    sc.HitNumberEntityBase = ig.Entity.extend({
        offset: {
            x: 0,
            y: 0,
            z: 0
        },
        oldNumber: 0,
        number: 0,
        digitCount: 0,
        numberSize: 0,
        numberColor: 0,
        numberAppendix: [],
        shuffleTime: 0,
        alpha: 1,
        zIndex: 1E4,
        init: function(a, b, c, d) {
            this.parent(a, b, c, d);
            this.coll.type = ig.COLLTYPE.NONE;
            this.coll.friction.ground = 0;
            this.coll.time.globalStatic = true;
            this.coll.setSize(0, 0, 0)
        },
        initSprites: function() {},
        setNumber: function(a, b, c, d, f, g) {
            this.oldNumber = g === void 0 ? this.number : g;
            this.number = a;
            this.numberSize = b;
            this.numberColor = c;
            this.numberAppendix.length = 0;
            d && this.numberAppendix.push.apply(this.numberAppendix, d);
            this.digitCount = 0;
            a = this.number;
            if (a !==
                void 0) {
                do {
                    this.digitCount++;
                    a = Math.floor(a / 10)
                } while (a)
            }
            if (this.numberAppendix) this.digitCount = this.digitCount + this.numberAppendix.length;
            this.offset.x = this.digitCount * e[this.numberSize].offsetX / 2;
            this.offset.y = e[this.numberSize].offsetY;
            this.shuffleTime = f;
            this.setSpriteCount(this.digitCount, true)
        },
        updateSprites: function() {
            var a = this.alpha,
                b = this.number;
            if (this.shuffleTime && Math.abs(b - this.oldNumber) >= 8) {
                this.shuffleTime = this.shuffleTime - ig.system.actualTick;
                if (this.shuffleTime < 0) this.shuffleTime =
                    0;
                b = Math.floor(this.oldNumber + (b - this.oldNumber) * (1 - this.shuffleTime / h))
            }
            for (var c = 0, d, e = this.numberAppendix.length; e--;) {
                d = 9 + this.numberAppendix[e];
                this._setupSprite(c, d, a);
                c++
            }
            if (b !== void 0) {
                do {
                    d = b % 10;
                    b = Math.floor(b / 10);
                    this._setupSprite(c, d, a);
                    c++
                } while (b)
            }
        },
        _setupSprite: function(a, d, f) {
            var d = d + c * this.numberColor,
                g = e[this.numberSize],
                d = g.sheet.getTileSrc(b, d),
                h = this.sprites[a];
            if (h) {
                h.setPos(this.coll.pos.x - this.offset.x + (this.digitCount - a - 1) * g.offsetX, this.coll.pos.y - this.offset.y - this.coll.pos.z +
                    this.zIndex, this.zIndex);
                h.setSize(g.sheet.width, g.sheet.height, 0);
                h.setImageSrc(g.sheet.image, d.x, d.y);
                h.setAlpha(f)
            }
        }
    });
    ig.ENTITY.HitNumber = sc.HitNumberEntityBase.extend({
        timer: 0,
        blockerEntry: null,
        combatant: null,
        init: function(a, b, c, d) {
            this.parent(a, b, c, d);
            this._initHitNumber(d)
        },
        reset: function(a, b, c, d) {
            this.parent(a, b, c, d);
            this._initHitNumber(d)
        },
        _initHitNumber: function(a) {
            this.combatant = a.combatant;
            this.setNumber(a.number, a.numberSize, a.numberColor, a.numberAppendix, h, 0);
            this.timer = f;
            this.alpha =
                1;
            this.blockerEntry = sc.HitNumberTools.placeHitNumber(this.coll, this.offset.x, this.offset.y)
        },
        clear: function() {
            if (this.timer > g) this.timer = g;
            this.unlock()
        },
        update: function() {
            this.timer = this.timer - ig.system.actualTick;
            if (this.timer <= 0) this.kill();
            else if (this.timer <= g) {
                this.alpha = this.timer / 0.3;
                this.unlock();
                this.coll.vel.z = this.coll.vel.z + ig.system.actualTick * 400
            }
        },
        unlock: function() {
            if (this.blockerEntry) {
                this.combatant.stunData.hitNumberEntities.erase(this);
                d.erase(this.blockerEntry);
                this.blockerEntry =
                    null
            }
        },
        onKill: function(a) {
            this.unlock();
            this.parent(a)
        }
    });
    ig.EntityPool.enableFor(ig.ENTITY.HitNumber);
    Vec2.create();
    ig.ENTITY.HitNumberSum = sc.HitNumberEntityBase.extend({
        timer: 0,
        disappear: false,
        combatant: null,
        entityOff: Vec2.create(),
        init: function(a, b, c, d) {
            this.parent(a, b, c, d);
            this._initHitNumber(d);
            this.zIndex = 2E4
        },
        reset: function(a, b, c, d) {
            this.parent(a, b, c, d);
            this._initHitNumber(d)
        },
        _initHitNumber: function(a) {
            this.combatant = a.combatant;
            this.combatant.stunData.damageSumEntity = this;
            this.alpha = 1;
            this.timer =
                g;
            this.disappear = false;
            this._updatePos();
            this.updateSum(true);
            this.blockerEntry = sc.HitNumberTools.placeHitNumber(this.coll, this.offset.x, this.offset.y, true)
        },
        updateEntityOffset: function() {
            var a = sc.SMALL_BOX_ALIGN.TOP,
                b = 0;
            if (this.combatant.dmgZFocus) {
                a = sc.SMALL_BOX_ALIGN.BOTTOM;
                b = this.combatant.dmgZFocus
            } else if (this.combatant.cameraZFocus) {
                a = sc.SMALL_BOX_ALIGN.BOTTOM;
                b = this.combatant.cameraZFocus + 48
            }
            a(this.entityOff, this.combatant.coll);
            this.entityOff.y = this.entityOff.y - b
        },
        updateSum: function(a) {
            var b =
                this.combatant.party == sc.COMBATANT_PARTY.PLAYER ? sc.HIT_NUMBER_COLOR.PLAYER_SUM : sc.HIT_NUMBER_COLOR.ENEMY_SUM;
            this.combatant.stunData.damageSum < 0 && (b = this.combatant.party == sc.COMBATANT_PARTY.PLAYER ? sc.HIT_NUMBER_COLOR.PLAYER_HEALING : sc.HIT_NUMBER_COLOR.HEALING);
            this.setNumber(Math.abs(this.combatant.stunData.damageSum), sc.HIT_NUMBER_SIZE.XL, b, null, h, a ? 0 : void 0)
        },
        clear: function() {
            this.timer = g;
            this.disappear = true
        },
        update: function() {
            if (this.timer) {
                this.timer = this.timer - ig.system.actualTick;
                if (this.timer <=
                    0) {
                    this.timer = 0;
                    this.disappear && this.kill()
                }
            }
        },
        deferredUpdate: function() {
            this._updatePos();
            sc.HitNumberTools.updateBlocker(this.blockerEntry, this.coll, this.offset.x, this.offset.y)
        },
        _updatePos: function() {
            this.updateEntityOffset();
            var a = this.combatant,
                b = this.timer / g;
            this.disappear && (b = 1 - b);
            b = KEY_SPLINES.EASE_IN.get(b);
            this.coll.setPos(a.coll.pos.x + this.entityOff.x, a.coll.pos.y + 256, a.coll.pos.z - this.entityOff.y + 256 + b * (this.disappear ? 1 : -1) * 16);
            this.alpha = 1 - b
        },
        onKill: function(a) {
            if (this.blockerEntry) {
                d.erase(this.blockerEntry);
                this.blockerEntry = null
            }
            this.parent(a)
        }
    });
    ig.EntityPool.enableFor(ig.ENTITY.HitNumber);
    ig.perf.hitNumberFactors = false;
    var a = [];
    ig.ENTITY.HitNumber.spawnHitNumber = function(b, c, d, e, f, g, h, p) {
        var r;
        r = e < 0.5 ? sc.HIT_NUMBER_SIZE.XXS : e < 1 ? sc.HIT_NUMBER_SIZE.XS : e < 1.5 ? sc.HIT_NUMBER_SIZE.S : e < 2 ? sc.HIT_NUMBER_SIZE.M : sc.HIT_NUMBER_SIZE.L;
        var t = 0,
            t = c.party === sc.COMBATANT_PARTY.PLAYER ? d < 0 ? sc.HIT_NUMBER_COLOR.PLAYER_HEALING : h ? sc.HIT_NUMBER_COLOR.PLAYER_CRITICAL : sc.HIT_NUMBER_COLOR.PLAYER_DAMAGE : d < 0 ? sc.HIT_NUMBER_COLOR.HEALING :
            h ? sc.HIT_NUMBER_COLOR.CRITICAL : sc.HIT_NUMBER_COLOR.NORMAL;
        if (ig.perf.hitNumberFactors) d = e = Math.abs(Math.round(e * 100));
        else e = Math.abs(d);
        a.length = 0;
        if (g) {
            if (g == sc.SHIELD_RESULT.PERFECT) {
                a.push(sc.HIT_NUMBER_APPENDIX.PERFECT);
                e = void 0
            }
            a.push(sc.HIT_NUMBER_APPENDIX.SHIELD)
        } else f >= 1.25 ? a.push(sc.HIT_NUMBER_APPENDIX.STRONG) : f <= 0.75 && a.push(sc.HIT_NUMBER_APPENDIX.WEAK);
        p && a.push(sc.HIT_NUMBER_APPENDIX.WEAKNESS);
        for (f = c.stunData.hitNumberEntities; f.length > 2;) f[0].clear();
        r = ig.game.spawnEntity(ig.ENTITY.HitNumber,
            b.x, b.y - 8, b.z, {
                number: e,
                numberSize: r,
                numberColor: t,
                numberAppendix: a,
                combatant: c
            });
        c.stunData.hitNumberEntities.push(r);
        c.stunData.damageSum = c.stunData.damageSum + d;
        c.stunData.damageSumHits = c.stunData.damageSumHits + 1;
        c.stunData.damageSumTimer = 0.5;
        c.stunData.damageSumHits > 1 && Math.abs(c.stunData.damageSum) > 1 && !c.stunData.damageSumEntity ? ig.game.spawnEntity(ig.ENTITY.HitNumberSum, b.x, b.y - 8, b.z, {
            combatant: c
        }) : c.stunData.damageSumEntity && c.stunData.damageSumEntity.updateSum()
    };
    ig.ENTITY.HitNumber.spawnHealingNumber =
        function(a, b, c) {
            var d = sc.HIT_NUMBER_SIZE.M,
                e = b.isPlayer ? sc.HIT_NUMBER_COLOR.PLAYER_HEALING : sc.HIT_NUMBER_COLOR.HEALING;
            ig.game.spawnEntity(ig.ENTITY.HitNumber, a.x, a.y - 8, a.z, {
                number: Math.abs(c),
                numberSize: d,
                numberColor: e,
                numberAppendix: null,
                combatant: b
            })
        };
    var d = [];
    sc.HitNumberTools = {
        placeHitNumber: function(a, b, c, e) {
            var f = a.pos.x,
                g = a.pos.y,
                h = a.pos.z,
                b = {
                    xMin: f - b - 2,
                    yMin: g - h - c - 1,
                    xMax: f + b + 2,
                    yMax: g - h
                };
            if (!e) {
                var e = a.pos.x,
                    f = a.pos.y,
                    g = true,
                    p = Math.random() < 0.5;
                do
                    for (var r = 0, t = false, q = 0; q < d.length; ++q) {
                        var s =
                            d[q];
                        if (!(s.xMin >= b.xMax || s.xMax <= b.xMin || s.yMin >= b.yMax || s.yMax <= b.yMin)) {
                            t = true;
                            r = p ? Math.min(r, s.xMin - b.xMax) : Math.max(r, s.xMax - b.xMin);
                            q = s.yMin - b.yMax;
                            if (g && Math.abs(f - a.pos.y - q) > Math.abs(e - a.pos.x - r)) {
                                g = false;
                                a.pos.y = f;
                                b.yMin = f - h - c - 1;
                                b.yMax = f - h;
                                b.xMin = b.xMin + r;
                                b.xMax = b.xMax + r;
                                a.pos.x = a.pos.x + r
                            } else {
                                b.yMin = b.yMin + q;
                                b.yMax = b.yMax + q;
                                a.pos.y = a.pos.y + q
                            }
                            break
                        }
                    }
                while (t)
            }
            d.push(b);
            return b
        },
        updateBlocker: function(a, b, c, d) {
            var e = b.pos.x,
                f = b.pos.y,
                b = b.pos.z;
            a.xMin = e - c - 2;
            a.yMin = f - b - d - 1;
            a.xMax = e + c + 2;
            a.yMax =
                f - b
        }
    };
    var c = 16,
        e = {
            "0": {
                offsetX: 7,
                offsetY: 8,
                sheet: new ig.TileSheet("media/entity/map-gui/hit-numbers.png", 8, 8, 0, 0, c)
            },
            1: {
                offsetX: 7,
                offsetY: 8,
                sheet: new ig.TileSheet("media/entity/map-gui/hit-numbers.png", 8, 8, 128, 0, c)
            },
            2: {
                offsetX: 7,
                offsetY: 9,
                sheet: new ig.TileSheet("media/entity/map-gui/hit-numbers.png", 8, 12, 0, 48, c)
            },
            3: {
                offsetX: 8,
                offsetY: 9,
                sheet: new ig.TileSheet("media/entity/map-gui/hit-numbers.png", 12, 12, 128, 48, c)
            },
            4: {
                offsetX: 9,
                offsetY: 11,
                sheet: new ig.TileSheet("media/entity/map-gui/hit-numbers.png",
                    12, 12, 0, 120, c)
            },
            5: {
                offsetX: 10,
                offsetY: 12,
                sheet: new ig.TileSheet("media/entity/map-gui/hit-numbers.png", 12, 12, 0, 192, c)
            }
        },
        f = 1,
        g = 0.3,
        h = 0.2
});
ig.baked = !0;

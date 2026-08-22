/**
 * game.feature.combat.entities.hit-number
 * =======================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.combat.entities.hit-number")`.
 *
 * Floating damage/heal numbers: `sc.HitNumberEntityBase`, `ig.ENTITY.HitNumber`
 * (per-hit numbers with digits/shuffle/collision avoidance) and
 * `ig.ENTITY.HitNumberSum` (the rolling damage-sum total). Defines the
 * `sc.HIT_NUMBER_SIZE/COLOR/APPENDIX` enums and `sc.HitNumberTools`.
 */
ig.module("game.feature.combat.entities.hit-number")
    .requires("impact.base.entity", "impact.base.entity-pool")
    .defines(function () {

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

    var tileSrcScratch = {};

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

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.NONE;
            this.coll.friction.ground = 0;
            this.coll.time.globalStatic = true;
            this.coll.setSize(0, 0, 0)
        },

        initSprites: function () {},

        setNumber: function (number, numberSize, numberColor, appendix, shuffleTime, oldNumber) {
            this.oldNumber = oldNumber === void 0 ? this.number : oldNumber;
            this.number = number;
            this.numberSize = numberSize;
            this.numberColor = numberColor;
            this.numberAppendix.length = 0;
            appendix && this.numberAppendix.push.apply(this.numberAppendix, appendix);
            this.digitCount = 0;
            var remaining = this.number;
            if (remaining !== void 0) {
                do {
                    this.digitCount++;
                    remaining = Math.floor(remaining / 10)
                } while (remaining)
            }
            if (this.numberAppendix) this.digitCount = this.digitCount + this.numberAppendix.length;
            this.offset.x = this.digitCount * numberStyles[this.numberSize].offsetX / 2;
            this.offset.y = numberStyles[this.numberSize].offsetY;
            this.shuffleTime = shuffleTime;
            this.setSpriteCount(this.digitCount, true)
        },

        updateSprites: function () {
            var alpha = this.alpha,
                number = this.number;
            if (this.shuffleTime && Math.abs(number - this.oldNumber) >= 8) {
                this.shuffleTime = this.shuffleTime - ig.system.actualTick;
                if (this.shuffleTime < 0) this.shuffleTime = 0;
                number = Math.floor(this.oldNumber + (number - this.oldNumber) * (1 - this.shuffleTime / shuffleTimeBase))
            }
            var spriteIndex = 0,
                tileIndex;
            for (var appendixIndex = this.numberAppendix.length; appendixIndex--;) {
                tileIndex = 9 + this.numberAppendix[appendixIndex];
                this._setupSprite(spriteIndex, tileIndex, alpha);
                spriteIndex++
            }
            if (number !== void 0) {
                do {
                    tileIndex = number % 10;
                    number = Math.floor(number / 10);
                    this._setupSprite(spriteIndex, tileIndex, alpha);
                    spriteIndex++
                } while (number)
            }
        },

        _setupSprite: function (spriteIndex, tileIndex, alpha) {
            tileIndex = tileIndex + sheetXCount * this.numberColor;
            var style = numberStyles[this.numberSize];
            tileIndex = style.sheet.getTileSrc(tileSrcScratch, tileIndex);
            var sprite = this.sprites[spriteIndex];
            if (sprite) {
                sprite.setPos(this.coll.pos.x - this.offset.x + (this.digitCount - spriteIndex - 1) * style.offsetX, this.coll.pos.y - this.offset.y - this.coll.pos.z + this.zIndex, this.zIndex);
                sprite.setSize(style.sheet.width, style.sheet.height, 0);
                sprite.setImageSrc(style.sheet.image, tileIndex.x, tileIndex.y);
                sprite.setAlpha(alpha)
            }
        }
    });

    ig.ENTITY.HitNumber = sc.HitNumberEntityBase.extend({
        timer: 0,
        blockerEntry: null,
        combatant: null,

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this._initHitNumber(settings)
        },

        reset: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this._initHitNumber(settings)
        },

        _initHitNumber: function (settings) {
            this.combatant = settings.combatant;
            this.setNumber(settings.number, settings.numberSize, settings.numberColor, settings.numberAppendix, shuffleTimeBase, 0);
            this.timer = hitNumberLifetime;
            this.alpha = 1;
            this.blockerEntry = sc.HitNumberTools.placeHitNumber(this.coll, this.offset.x, this.offset.y)
        },

        clear: function () {
            if (this.timer > fadeOutTime) this.timer = fadeOutTime;
            this.unlock()
        },

        update: function () {
            this.timer = this.timer - ig.system.actualTick;
            if (this.timer <= 0) this.kill();
            else if (this.timer <= fadeOutTime) {
                this.alpha = this.timer / 0.3;
                this.unlock();
                this.coll.vel.z = this.coll.vel.z + ig.system.actualTick * 400
            }
        },

        unlock: function () {
            if (this.blockerEntry) {
                this.combatant.stunData.hitNumberEntities.erase(this);
                blockerList.erase(this.blockerEntry);
                this.blockerEntry = null
            }
        },

        onKill: function (data) {
            this.unlock();
            this.parent(data)
        }
    });

    ig.EntityPool.enableFor(ig.ENTITY.HitNumber);

    Vec2.create();

    ig.ENTITY.HitNumberSum = sc.HitNumberEntityBase.extend({
        timer: 0,
        disappear: false,
        combatant: null,
        entityOff: Vec2.create(),

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this._initHitNumber(settings);
            this.zIndex = 2E4
        },

        reset: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this._initHitNumber(settings)
        },

        _initHitNumber: function (settings) {
            this.combatant = settings.combatant;
            this.combatant.stunData.damageSumEntity = this;
            this.alpha = 1;
            this.timer = fadeOutTime;
            this.disappear = false;
            this._updatePos();
            this.updateSum(true);
            this.blockerEntry = sc.HitNumberTools.placeHitNumber(this.coll, this.offset.x, this.offset.y, true)
        },

        updateEntityOffset: function () {
            var alignFunc = sc.SMALL_BOX_ALIGN.TOP,
                offset = 0;
            if (this.combatant.dmgZFocus) {
                alignFunc = sc.SMALL_BOX_ALIGN.BOTTOM;
                offset = this.combatant.dmgZFocus
            } else if (this.combatant.cameraZFocus) {
                alignFunc = sc.SMALL_BOX_ALIGN.BOTTOM;
                offset = this.combatant.cameraZFocus + 48
            }
            alignFunc(this.entityOff, this.combatant.coll);
            this.entityOff.y = this.entityOff.y - offset
        },

        updateSum: function (instant) {
            var color = this.combatant.party == sc.COMBATANT_PARTY.PLAYER ? sc.HIT_NUMBER_COLOR.PLAYER_SUM : sc.HIT_NUMBER_COLOR.ENEMY_SUM;
            this.combatant.stunData.damageSum < 0 && (color = this.combatant.party == sc.COMBATANT_PARTY.PLAYER ? sc.HIT_NUMBER_COLOR.PLAYER_HEALING : sc.HIT_NUMBER_COLOR.HEALING);
            this.setNumber(Math.abs(this.combatant.stunData.damageSum), sc.HIT_NUMBER_SIZE.XL, color, null, shuffleTimeBase, instant ? 0 : void 0)
        },

        clear: function () {
            this.timer = fadeOutTime;
            this.disappear = true
        },

        update: function () {
            if (this.timer) {
                this.timer = this.timer - ig.system.actualTick;
                if (this.timer <= 0) {
                    this.timer = 0;
                    this.disappear && this.kill()
                }
            }
        },

        deferredUpdate: function () {
            this._updatePos();
            sc.HitNumberTools.updateBlocker(this.blockerEntry, this.coll, this.offset.x, this.offset.y)
        },

        _updatePos: function () {
            this.updateEntityOffset();
            var combatant = this.combatant,
                progress = this.timer / fadeOutTime;
            this.disappear && (progress = 1 - progress);
            progress = KEY_SPLINES.EASE_IN.get(progress);
            this.coll.setPos(combatant.coll.pos.x + this.entityOff.x, combatant.coll.pos.y + 256, combatant.coll.pos.z - this.entityOff.y + 256 + progress * (this.disappear ? 1 : -1) * 16);
            this.alpha = 1 - progress
        },

        onKill: function (data) {
            if (this.blockerEntry) {
                blockerList.erase(this.blockerEntry);
                this.blockerEntry = null
            }
            this.parent(data)
        }
    });

    ig.EntityPool.enableFor(ig.ENTITY.HitNumber);

    ig.perf.hitNumberFactors = false;

    var appendixScratch = [];

    ig.ENTITY.HitNumber.spawnHitNumber = function (pos, combatant, damage, offensiveFactor, defensiveFactor, shieldResult, critical, weakness) {
        var numberSize = offensiveFactor < 0.5 ? sc.HIT_NUMBER_SIZE.XXS : offensiveFactor < 1 ? sc.HIT_NUMBER_SIZE.XS : offensiveFactor < 1.5 ? sc.HIT_NUMBER_SIZE.S : offensiveFactor < 2 ? sc.HIT_NUMBER_SIZE.M : sc.HIT_NUMBER_SIZE.L;
        var color = combatant.party === sc.COMBATANT_PARTY.PLAYER ? damage < 0 ? sc.HIT_NUMBER_COLOR.PLAYER_HEALING : critical ? sc.HIT_NUMBER_COLOR.PLAYER_CRITICAL : sc.HIT_NUMBER_COLOR.PLAYER_DAMAGE : damage < 0 ? sc.HIT_NUMBER_COLOR.HEALING : critical ? sc.HIT_NUMBER_COLOR.CRITICAL : sc.HIT_NUMBER_COLOR.NORMAL;
        var displayNumber;
        if (ig.perf.hitNumberFactors) displayNumber = offensiveFactor = Math.abs(Math.round(offensiveFactor * 100));
        else displayNumber = Math.abs(damage);
        appendixScratch.length = 0;
        if (shieldResult) {
            if (shieldResult == sc.SHIELD_RESULT.PERFECT) {
                appendixScratch.push(sc.HIT_NUMBER_APPENDIX.PERFECT);
                displayNumber = void 0
            }
            appendixScratch.push(sc.HIT_NUMBER_APPENDIX.SHIELD)
        } else defensiveFactor >= 1.25 ? appendixScratch.push(sc.HIT_NUMBER_APPENDIX.STRONG) : defensiveFactor <= 0.75 && appendixScratch.push(sc.HIT_NUMBER_APPENDIX.WEAK);
        weakness && appendixScratch.push(sc.HIT_NUMBER_APPENDIX.WEAKNESS);

        var hitNumberEntities = combatant.stunData.hitNumberEntities;
        for (; hitNumberEntities.length > 2;) hitNumberEntities[0].clear();
        var entity = ig.game.spawnEntity(ig.ENTITY.HitNumber, pos.x, pos.y - 8, pos.z, {
            number: displayNumber,
            numberSize: numberSize,
            numberColor: color,
            numberAppendix: appendixScratch,
            combatant: combatant
        });
        combatant.stunData.hitNumberEntities.push(entity);
        combatant.stunData.damageSum = combatant.stunData.damageSum + damage;
        combatant.stunData.damageSumHits = combatant.stunData.damageSumHits + 1;
        combatant.stunData.damageSumTimer = 0.5;
        combatant.stunData.damageSumHits > 1 && Math.abs(combatant.stunData.damageSum) > 1 && !combatant.stunData.damageSumEntity ? ig.game.spawnEntity(ig.ENTITY.HitNumberSum, pos.x, pos.y - 8, pos.z, {
            combatant: combatant
        }) : combatant.stunData.damageSumEntity && combatant.stunData.damageSumEntity.updateSum()
    };

    ig.ENTITY.HitNumber.spawnHealingNumber = function (pos, combatant, healValue) {
        var size = sc.HIT_NUMBER_SIZE.M,
            color = combatant.isPlayer ? sc.HIT_NUMBER_COLOR.PLAYER_HEALING : sc.HIT_NUMBER_COLOR.HEALING;
        ig.game.spawnEntity(ig.ENTITY.HitNumber, pos.x, pos.y - 8, pos.z, {
            number: Math.abs(healValue),
            numberSize: size,
            numberColor: color,
            numberAppendix: null,
            combatant: combatant
        })
    };

    var blockerList = [];

    sc.HitNumberTools = {
        placeHitNumber: function (coll, offsetX, offsetY, isSum) {
            var x = coll.pos.x,
                y = coll.pos.y,
                z = coll.pos.z,
                blocker = {
                    xMin: x - offsetX - 2,
                    yMin: y - z - offsetY - 1,
                    xMax: x + offsetX + 2,
                    yMax: y - z
                };
            if (!isSum) {
                var origX = coll.pos.x,
                    origY = coll.pos.y,
                    useYAxis = true,
                    useNegative = Math.random() < 0.5;
                do {
                    var shift = 0,
                        collided = false;
                    for (var index = 0; index < blockerList.length; ++index) {
                        var other = blockerList[index];
                        if (!(other.xMin >= blocker.xMax || other.xMax <= blocker.xMin || other.yMin >= blocker.yMax || other.yMax <= blocker.yMin)) {
                            collided = true;
                            shift = useNegative ? Math.min(shift, other.xMin - blocker.xMax) : Math.max(shift, other.xMax - blocker.xMin);
                            var yShift = other.yMin - blocker.yMax;
                            if (useYAxis && Math.abs(origY - coll.pos.y - yShift) > Math.abs(origX - coll.pos.x - shift)) {
                                useYAxis = false;
                                coll.pos.y = origY;
                                blocker.yMin = origY - z - offsetY - 1;
                                blocker.yMax = origY - z;
                                blocker.xMin = blocker.xMin + shift;
                                blocker.xMax = blocker.xMax + shift;
                                coll.pos.x = coll.pos.x + shift
                            } else {
                                blocker.yMin = blocker.yMin + yShift;
                                blocker.yMax = blocker.yMax + yShift;
                                coll.pos.y = coll.pos.y + yShift
                            }
                            break
                        }
                    }
                } while (collided)
            }
            blockerList.push(blocker);
            return blocker
        },

        updateBlocker: function (blocker, coll, offsetX, offsetY) {
            var x = coll.pos.x,
                y = coll.pos.y,
                z = coll.pos.z;
            blocker.xMin = x - offsetX - 2;
            blocker.yMin = y - z - offsetY - 1;
            blocker.xMax = x + offsetX + 2;
            blocker.yMax = y - z
        }
    };

    var sheetXCount = 16,
        numberStyles = {
            "0": {
                offsetX: 7,
                offsetY: 8,
                sheet: new ig.TileSheet("media/entity/map-gui/hit-numbers.png", 8, 8, 0, 0, sheetXCount)
            },
            1: {
                offsetX: 7,
                offsetY: 8,
                sheet: new ig.TileSheet("media/entity/map-gui/hit-numbers.png", 8, 8, 128, 0, sheetXCount)
            },
            2: {
                offsetX: 7,
                offsetY: 9,
                sheet: new ig.TileSheet("media/entity/map-gui/hit-numbers.png", 8, 12, 0, 48, sheetXCount)
            },
            3: {
                offsetX: 8,
                offsetY: 9,
                sheet: new ig.TileSheet("media/entity/map-gui/hit-numbers.png", 12, 12, 128, 48, sheetXCount)
            },
            4: {
                offsetX: 9,
                offsetY: 11,
                sheet: new ig.TileSheet("media/entity/map-gui/hit-numbers.png", 12, 12, 0, 120, sheetXCount)
            },
            5: {
                offsetX: 10,
                offsetY: 12,
                sheet: new ig.TileSheet("media/entity/map-gui/hit-numbers.png", 12, 12, 0, 192, sheetXCount)
            }
        },
        hitNumberLifetime = 1,
        fadeOutTime = 0.3,
        shuffleTimeBase = 0.2
});
ig.baked = !0;

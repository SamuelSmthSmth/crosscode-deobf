/**
 * game.feature.puzzle.entities.item-destruct
 * ==========================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.puzzle.entities.item-destruct")`.
 *
 * `ig.ENTITY.ItemDestruct`: a destructible object that drops items when
 * destroyed (stones, plants, vases, eggs, ...). Type definitions live in
 * `sc.ITEM_DESTRUCT_TYPE` (kept byte-identical data below). Destruction is
 * persisted per map: perma-death props never respawn, regular props respawn
 * 300s later; a global-drop counter (`sc.menu.incrementDropCount`) and an
 * optional `trigger` var can be set, and an enemy can spawn on destruction.
 */
ig.module("game.feature.puzzle.entities.item-destruct")
    .requires("impact.base.entity", "impact.feature.effect.effect-sheet", "game.feature.menu.menu-model")
    .defines(function () {

    sc.ITEM_DESTRUCT_TYPE = {};
    var tmpVec = Vec3.create();

    ig.ENTITY.ItemDestruct = ig.AnimatedEntity.extend({
        _wm: new ig.Config({
            spawnable: true,
            attributes: {
                desType: {
                    _type: "String",
                    _info: "Type of destructible object",
                    _select: sc.ITEM_DESTRUCT_TYPE,
                    _withNull: true
                },
                items: {
                    _type: "ItemsDropRate",
                    _info: "Items dropped",
                    _popup: true
                },
                perma: {
                    _type: "Boolean",
                    _info: "True if cannot be respawned",
                    _default: "false",
                    _optional: true
                },
                indest: {
                    _type: "Boolean",
                    _info: "True if cannot be destroyed",
                    _default: "true",
                    _optional: true
                },
                trigger: {
                    _type: "String",
                    _info: "var tp set to true once the prop has been destroyed. Only works once.",
                    _optional: true
                },
                increment: {
                    _type: "VarName",
                    _info: "add 1 to the given variable",
                    _optional: true
                },
                enemyInfo: {
                    _type: "EnemyType",
                    _info: "Enemy to spawn after destruction",
                    _popup: true,
                    _withNull: true
                }
            }
        }),
        blinkTimer: 0,
        dropped: false,
        itemDrops: [],
        typeData: null,
        permaDeath: false,
        globalKey: null,
        enemyInfo: null,
        enemyChance: -1,
        boomEffect: null,
        debrisEffect: null,
        trigger: "",
        indestructible: false,

        init: function (x, y, z, settings) {
            this.parent(x, y, z, settings);
            this.coll.type = ig.COLLTYPE.VIRTUAL;
            this.coll.zGravityFactor = 1;
            this.coll.zBounciness = 0.5;
            this.coll.setUpdateType(ig.COLL_UPDATE_TYPE.ON_SCREEN);
            var type = sc.ITEM_DESTRUCT_TYPE[settings.desType];
            this.permaDeath = settings.perma || false;
            this.trigger = settings.trigger || "";
            this.indestructible = settings.indest || false;
            if (type) {
                if (settings.enemyInfo && settings.enemyInfo.type) {
                    this.enemyInfo = new sc.EnemyInfo(settings.enemyInfo);
                    this.enemyChance = settings.enemyInfo.chance || -1
                }
                this.typeData = type;
                Vec3.assign(this.coll.size, type.size);
                if (type.gravity != undefined) this.coll.zGravityFactor = type.gravity;
                this.boomEffect = new ig.EffectHandle(type.boom);
                this.debrisEffect = new ig.EffectHandle(type.debris);
                this.initAnimations(type.anims)
            } else {
                this.coll.size.x = 32;
                this.coll.size.y = 32
            }
            if (settings._globalSettingKey) this.globalKey = {
                key: settings._globalSettingKey,
                anim: settings.desType
            };
            var items = settings.items;
            if (items) {
                items.sort(function (a, b) {
                    return a.prob - b.prob
                });
                for (var i = 0, prob = 0; i < items.length; ++i) {
                    prob = prob + items[i].prob;
                    this.itemDrops.push({
                        id: items[i].id,
                        prob: prob
                    })
                }
            }
            var respawnTime = ig.vars.get(this._getVarPrefix() + ".respawnTime");
            if (this.permaDeath ? ig.vars.get("map.itemDestructPerma" + this.mapId) && this.setDropped() : respawnTime && respawnTime > sc.combat.time && this.setDropped());
            this.blinkTimer = Math.random() * 5 + 1
        },

        _getVarPrefix: function () {
            return "session.map.itemDestruct" + this.mapId
        },

        onKill: function (entity) {
            this.parent(entity);
            if (this.boomEffect) this.boomEffect.clearCached();
            if (this.debrisEffect) this.debrisEffect.clearCached();
            if (this.enemyInfo) this.enemyInfo.clearCached()
        },

        update: function () {
            if (this.blinkTimer <= 0) this.blinkTimer = Math.random() * 2 + 4;
            this.blinkTimer = this.blinkTimer - ig.system.tick;
            this.parent();
            if (this.sprites.length > 1) {
                var sprite = this.sprites[1],
                    fullSize = sprite.size.y + sprite.size.z,
                    topCut = fullSize,
                    bottomCut = 0;
                if (this.blinkTimer < 1) {
                    topCut = Math.round((this.blinkTimer - 0.15) / 0.85 * fullSize);
                    if (topCut < 0) topCut = 0;
                    bottomCut = Math.round((1 - this.blinkTimer / 0.85) * fullSize);
                    if (bottomCut < 0) bottomCut = 0
                }
                sprite.setGfxCut(topCut, bottomCut)
            }
        },

        ballHit: function (ball) {
            if (this.dropped || this.indestructible || !ig.CollTools.isInScreen(this.coll, 0)) return false;
            var attackType = ball.attackInfo && ball.attackInfo.hasHint("CHARGED") ? sc.ATTACK_TYPE.MEDIUM : sc.ATTACK_TYPE.LIGHT,
                hitCenter = ball.getHitCenter(this);
            attackType = sc.ATTACK_TYPE.HEAVY;
            sc.stats.addMap("player", "propsDestroyed", 1);
            sc.combat.showHitEffect(this, hitCenter, attackType, ball.getElement(), false, false, true);
            this.destroy();
            return true
        },

        destroy: function () {
            this.setDropped();
            var center = this.getCenter(tmpVec);
            if (this.typeData.effectOffset) Vec3.add(center, this.typeData.effectOffset);
            this.boomEffect.spawnFixed(center.x, center.y, this.coll.pos.z + this.coll.size.z / 2);
            this.debrisEffect.spawnFixed(center.x, center.y, this.coll.pos.z + this.coll.size.z / 2);
            this.dropItem();
            var respawnTime = sc.combat.time + 300;
            ig.vars.set(this._getVarPrefix() + ".respawnTime", respawnTime);
            if (this.permaDeath) ig.vars.set("map.itemDestructPerma" + this.mapId, true);
            if (this.trigger && !ig.vars.get(this.trigger)) ig.vars.set(this.trigger, true);
            if (this.enemyInfo && Math.random() <= this.enemyChance) {
                var settings = {
                    enemyInfo: this.enemyInfo.getSettings()
                };
                ig.game.spawnEntity("Enemy", this.coll.pos.x, this.coll.pos.y, this.coll.pos.z, settings).invincibleTimer = 0.05
            }
        },

        setDropped: function () {
            this.dropped = true;
            this.setCurrentAnim("dropped", true);
            this.coll.type = ig.COLLTYPE.IGNORE;
            this.coll.setUpdateType(ig.COLL_UPDATE_TYPE.STATIC)
        },

        dropItem: function () {
            for (var roll = Math.random(), params = sc.model.player.params, rankMultiplier = params.getModifier("RANK_PLANTS") ? sc.model.getCombatRankDropRate() : 1, dropMultiplier = ((params.getModifier("DROP_CHANCE") || 0) + 1) * rankMultiplier * sc.newgame.getDropRateMultiplier(), i = 0; i < this.itemDrops.length; ++i) {
                var drop = this.itemDrops[i];
                if (roll <= drop.prob * dropMultiplier || drop.prob >= 1) {
                    if (this.globalKey) sc.menu.incrementDropCount(this.globalKey.key, this.globalKey.anim);
                    sc.ItemDropEntity.spawnDrops(this, ig.ENTITY_ALIGN.CENTER, ig.game.playerEntity, drop.id, 1, sc.ITEM_DROP_TYPE.PROP);
                    if (dropMultiplier > 1) dropMultiplier = Math.max(dropMultiplier - 1, 1);
                    else break
                }
            }
        },

        isBallDestroyer: function () {
            return !this.dropped
        }
    });

sc.ITEM_DESTRUCT_TYPE.StoneOfValor = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.stones",
            name: "burstValor"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/entity/objects/destructible-stones.png",
                width: 24,
                height: 32,
                offY: 0
            },
            SUB: [{
                    name: "default",
                    time: 1,
                    frames: [0],
                    repeat: false
                }, {
                    name: "default",
                    time: 1,
                    frames: [1],
                    repeat: false
                },
                {
                    name: "dropped",
                    time: 1,
                    frames: [2],
                    repeat: false
                }
            ]
        }
    };
    sc.ITEM_DESTRUCT_TYPE.StoneOfSpace = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.stones",
            name: "burstSpace"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/entity/objects/destructible-stones.png",
                width: 24,
                height: 32,
                offY: 32
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE.StoneOfTruth = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.stones",
            name: "burstTruth"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/entity/objects/destructible-stones.png",
                width: 24,
                height: 32,
                offY: 64
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE.StoneOfSpirit = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.stones",
            name: "burstSpirit"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/entity/objects/destructible-stones.png",
                width: 24,
                height: 32,
                offY: 96
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE.StoneOfAges = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.stones",
            name: "burstAges"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/entity/objects/destructible-stones.png",
                width: 24,
                height: 32,
                offY: 128
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE.StoneOfNothing = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.stones",
            name: "burst"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/entity/objects/destructible-stones.png",
                width: 24,
                height: 32,
                offY: 160
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE.AutumnPlantA = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.autumn",
            name: "plantBurst"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/entity/objects/autumn-destructibles.png",
                width: 24,
                height: 32,
                offX: 0
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Autumn-Ground-1"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.autumn",
            name: "plantBurst"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/entity/objects/autumn-destructibles.png",
                width: 24,
                height: 32,
                offX: 0
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Autumn-Ground-2"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.autumn",
            name: "plantBurst"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/entity/objects/autumn-destructibles.png",
                width: 24,
                height: 32,
                offY: 32
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Autumn-Water-1"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.autumn",
            name: "plantBurst"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/entity/objects/autumn-destructibles.png",
                width: 24,
                height: 32,
                offY: 64
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Autumn-Water-2"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.autumn",
            name: "plantBurst"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/entity/objects/autumn-destructibles.png",
                width: 24,
                height: 32,
                offY: 96
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Autumn-Special"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.autumn",
            name: "plantBurst"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/entity/objects/autumn-destructibles.png",
                width: 24,
                height: 32,
                offY: 128
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Autumn-Water-Special"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.autumn",
            name: "plantBurst"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/entity/objects/autumn-destructibles.png",
                width: 24,
                height: 32,
                offY: 160
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Autumn-Fall-Ground-1"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.autumn",
            name: "plantBurst"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/entity/objects/autumn-destructibles.png",
                width: 24,
                height: 32,
                offX: 128
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Autumn-Fall-Ground-2"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.autumn",
            name: "plantBurst"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/entity/objects/autumn-destructibles.png",
                width: 24,
                height: 32,
                offY: 32,
                offX: 128
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Autumn-Fall-Water-1"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.autumn",
            name: "plantBurst"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/entity/objects/autumn-destructibles.png",
                width: 24,
                height: 32,
                offY: 64,
                offX: 128
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Autumn-Fall-Water-2"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.autumn",
            name: "plantBurst"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/entity/objects/autumn-destructibles.png",
                width: 24,
                height: 32,
                offY: 96,
                offX: 128
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Autumn-Fall-Special"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.autumn",
            name: "plantBurst"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/entity/objects/autumn-destructibles.png",
                width: 24,
                height: 32,
                offY: 128,
                offX: 128
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Autumn-Fall-Water-Special"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.autumn",
            name: "plantBurst"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/entity/objects/autumn-destructibles.png",
                width: 24,
                height: 32,
                offY: 160,
                offX: 128
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Bergen-PlantA-1"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.bergen",
            name: "plantBurst"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/bergen-trail.png",
                width: 24,
                height: 32,
                offX: 0,
                offY: 384
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Bergen-PlantA-2"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.bergen",
            name: "plantBurst"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/bergen-trail.png",
                width: 24,
                height: 32,
                offX: 0,
                offY: 416
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Bergen-PlantA-Rare"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.bergen",
            name: "plantBurst"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/bergen-trail.png",
                width: 24,
                height: 32,
                offX: 144,
                offY: 384
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Bergen-PlantB-1"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.bergen",
            name: "plantBurst"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/bergen-trail.png",
                width: 24,
                height: 32,
                offX: 0,
                offY: 448
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Bergen-PlantB-2"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.bergen",
            name: "plantBurst"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/bergen-trail.png",
                width: 24,
                height: 32,
                offX: 0,
                offY: 480
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Bergen-PlantB-Rare"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.bergen",
            name: "plantBurst"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/bergen-trail.png",
                width: 24,
                height: 32,
                offX: 144,
                offY: 448
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Bergen-PlantA-1-Snow"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.bergen",
            name: "plantBurstSnow"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/bergen-trail.png",
                width: 24,
                height: 32,
                offX: 72,
                offY: 384
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Bergen-PlantA-2-Snow"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.bergen",
            name: "plantBurstSnow"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/bergen-trail.png",
                width: 24,
                height: 32,
                offX: 72,
                offY: 416
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Bergen-PlantA-Snow-Rare"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.bergen",
            name: "plantBurst"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/bergen-trail.png",
                width: 24,
                height: 32,
                offX: 144,
                offY: 416
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Bergen-PlantB-1-Snow"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.bergen",
            name: "plantBurstSnow"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/bergen-trail.png",
                width: 24,
                height: 32,
                offX: 72,
                offY: 448
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Bergen-PlantB-2-Snow"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.bergen",
            name: "plantBurstSnow"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/bergen-trail.png",
                width: 24,
                height: 32,
                offX: 72,
                offY: 480
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Bergen-PlantB-Snow-Rare"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.bergen",
            name: "plantBurstSnow"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/bergen-trail.png",
                width: 24,
                height: 32,
                offX: 144,
                offY: 480
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Bergen-Snow-Crystal"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 8
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.bergen",
            name: "burstSnow"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/bergen-trail.png",
                width: 24,
                height: 32,
                offX: 216,
                offY: 480
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Bergen-Vase-1"] = {
        size: {
            x: 16,
            y: 10,
            z: 18
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 9
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.bergen",
            name: "vase-break"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/bergen-trail.png",
                width: 16,
                height: 28,
                offX: 224,
                offY: 964
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Cold-Dng-Egg-1"] = {
        size: {
            x: 14,
            y: 16,
            z: 16
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 9
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.cold-dng",
            name: "eggs"
        },
        anims: {
            wallY: 0.4,
            sheet: {
                src: "media/map/cold-dng.png",
                width: 16,
                height: 32,
                offX: 192,
                offY: 560
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false,
                aboveZ: 1
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Cold-Dng-Egg-2"] = {
        size: {
            x: 14,
            y: 16,
            z: 16
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 9
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.cold-dng",
            name: "eggs"
        },
        anims: {
            wallY: 0.4,
            sheet: {
                src: "media/map/cold-dng.png",
                width: 16,
                height: 32,
                offX: 192,
                offY: 592
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false,
                aboveZ: 1
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Cold-Dng-Egg-3"] = {
        size: {
            x: 14,
            y: 16,
            z: 16
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 9
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.cold-dng",
            name: "eggs"
        },
        anims: {
            wallY: 0.4,
            sheet: {
                src: "media/map/cold-dng.png",
                width: 16,
                height: 32,
                offX: 192,
                offY: 624
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false,
                aboveZ: 1
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Cold-Dng-Egg-4"] = {
        size: {
            x: 24,
            y: 16,
            z: 16
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 9
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.cold-dng",
            name: "eggs"
        },
        anims: {
            wallY: 0.4,
            sheet: {
                src: "media/map/cold-dng.png",
                width: 32,
                height: 32,
                offX: 240,
                offY: 560
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false,
                aboveZ: 1
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Cold-Dng-Egg-Special-A"] = {
        size: {
            x: 36,
            y: 24,
            z: 24
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 9
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.cold-dng",
            name: "eggs"
        },
        anims: {
            wallY: 0.4,
            sheet: {
                src: "media/map/cold-dng.png",
                width: 40,
                height: 48,
                offX: 72,
                offY: 560
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false,
                aboveZ: 1
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Cold-Dng-Egg-Special-B"] = {
        size: {
            x: 36,
            y: 24,
            z: 24
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 9
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.cold-dng",
            name: "eggs"
        },
        anims: {
            wallY: 0.4,
            sheet: {
                src: "media/map/cold-dng.png",
                width: 40,
                height: 48,
                offX: 72,
                offY: 608
            },
            SUB: [{
                    name: "default",
                    time: 1,
                    frames: [0],
                    repeat: false
                },
                {
                    name: "default",
                    time: 1,
                    frames: [1],
                    repeat: false,
                    aboveZ: 1
                }, {
                    name: "dropped",
                    time: 1,
                    frames: [2],
                    repeat: false
                }
            ]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Heat-Cactus-1"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.heat",
            name: "plantBurst"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/heat-area.png",
                width: 24,
                height: 32,
                offX: 208,
                offY: 320
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Heat-Cactus-2"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.heat",
            name: "plantBurst"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/heat-area.png",
                width: 24,
                height: 32,
                offX: 208,
                offY: 352
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Heat-Cactus-Special"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.heat",
            name: "plantBurst"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/heat-area.png",
                width: 24,
                height: 32,
                offX: 208,
                offY: 384
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Heat-Dry-Cactus-1"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.heat",
            name: "plantBurst"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/heat-props.png",
                width: 24,
                height: 32,
                offX: 176,
                offY: 128
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Heat-Dry-Cactus-2"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.heat",
            name: "plantBurst"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/heat-props.png",
                width: 24,
                height: 32,
                offX: 176,
                offY: 160
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Heat-Palmapple-1"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.heat",
            name: "plantBurst"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/heat-area.png",
                width: 24,
                height: 32,
                offX: 208,
                offY: 416
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Heat-Palmapple-2"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.heat",
            name: "plantBurst"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/heat-area.png",
                width: 24,
                height: 32,
                offX: 208,
                offY: 448
            },
            SUB: [{
                    name: "default",
                    time: 1,
                    frames: [0],
                    repeat: false
                },
                {
                    name: "default",
                    time: 1,
                    frames: [1],
                    repeat: false
                }, {
                    name: "dropped",
                    time: 1,
                    frames: [2],
                    repeat: false
                }
            ]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Heat-Palmapple-Special"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.heat",
            name: "plantBurst"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/heat-area.png",
                width: 24,
                height: 32,
                offX: 208,
                offY: 480
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Heat-Dry-Bush-1"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.heat",
            name: "plantBurstRed"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/heat-area.png",
                width: 24,
                height: 32,
                offX: 280,
                offY: 320
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Heat-Dry-Bush-2"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.heat",
            name: "plantBurstRed"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/heat-area.png",
                width: 24,
                height: 32,
                offX: 280,
                offY: 352
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Heat-Dry-Bush-Special"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.heat",
            name: "plantBurstRed"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/heat-area.png",
                width: 24,
                height: 32,
                offX: 280,
                offY: 384
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Heat-Bones-1"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.heat",
            name: "boneBurst"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/heat-area.png",
                width: 24,
                height: 32,
                offX: 208,
                offY: 512
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Heat-Bones-2"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.heat",
            name: "boneBurst"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/heat-area.png",
                width: 24,
                height: 32,
                offX: 208,
                offY: 544
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Heat-Bones-Special"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.heat",
            name: "boneBurst"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/heat-area.png",
                width: 24,
                height: 32,
                offX: 280,
                offY: 512
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Heat-Hill-1"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.heat",
            name: "termiteDust"
        },
        anims: {
            wallY: 1,
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/heat-area.png",
                width: 24,
                height: 32,
                offX: 280,
                offY: 416
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Heat-Hill-2"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.heat",
            name: "termiteDust"
        },
        anims: {
            wallY: 1,
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/heat-area.png",
                width: 24,
                height: 32,
                offX: 280,
                offY: 448
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Heat-Hill-Special"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.heat",
            name: "termiteDust"
        },
        anims: {
            wallY: 1,
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/heat-area.png",
                width: 24,
                height: 32,
                offX: 280,
                offY: 480
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Bakii-Vase"] = {
        size: {
            x: 16,
            y: 12,
            z: 20
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 9
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.heat",
            name: "vase-break"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/heat-area.png",
                width: 16,
                height: 32,
                offX: 464,
                offY: 320
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Jungle-Flower-1"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.jungle",
            name: "plantBurstViolet"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/jungle-props.png",
                width: 24,
                height: 32,
                offX: 0,
                offY: 224
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Jungle-Flower-2"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.jungle",
            name: "plantBurstViolet"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/jungle-props.png",
                width: 24,
                height: 32,
                offX: 0,
                offY: 256
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Jungle-Flower-Special"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.jungle",
            name: "plantBurstViolet"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/jungle-props.png",
                width: 24,
                height: 32,
                offX: 0,
                offY: 288
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Jungle-Bees-1"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.jungle",
            name: "honeyBurst"
        },
        gravity: 0,
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/jungle-props.png",
                width: 24,
                height: 32,
                offX: 0,
                offY: 320
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Jungle-Bees-2"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.jungle",
            name: "honeyBurst"
        },
        gravity: 0,
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/jungle-props.png",
                width: 24,
                height: 32,
                offX: 0,
                offY: 352
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Jungle-Bees-3"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.jungle",
            name: "honeyBurst"
        },
        gravity: 0,
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/jungle-props.png",
                width: 24,
                height: 32,
                offX: 0,
                offY: 352
            },
            flipX: true,
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Jungle-Waterplant-1"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.jungle",
            name: "plantBurstWater"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/jungle-props.png",
                width: 24,
                height: 32,
                offX: 72,
                offY: 224
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Jungle-Waterplant-2"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.jungle",
            name: "plantBurstWater"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/jungle-props.png",
                width: 24,
                height: 32,
                offX: 72,
                offY: 256
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Jungle-Waterplant-Special"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.jungle",
            name: "plantBurstWater"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/jungle-props.png",
                width: 24,
                height: 32,
                offX: 72,
                offY: 288
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Jungle-Waterplant-Closed-1"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.jungle",
            name: "plantBurstWater"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/jungle-props.png",
                width: 24,
                height: 32,
                offX: 0,
                offY: 384
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Jungle-Waterplant-Closed-2"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.jungle",
            name: "plantBurstWater"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/jungle-props.png",
                width: 24,
                height: 32,
                offX: 0,
                offY: 416
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Jungle-Shroom-1"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.jungle",
            name: "shroomBurst"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/jungle-props.png",
                width: 24,
                height: 32,
                offX: 72,
                offY: 320
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Jungle-Shroom-2"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.jungle",
            name: "shroomBurst"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/jungle-props.png",
                width: 24,
                height: 32,
                offX: 72,
                offY: 352
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Jungle-Shroom-Special"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.jungle",
            name: "shroomBurst"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/jungle-props.png",
                width: 24,
                height: 32,
                offX: 72,
                offY: 384
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Jungle-Flower-Dotted-1"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.jungle",
            name: "plantBurstViolet"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/jungle-props.png",
                width: 24,
                height: 32,
                offX: 72,
                offY: 416
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Jungle-Flower-Dotted-2"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.jungle",
            name: "plantBurstViolet"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/jungle-props.png",
                width: 24,
                height: 32,
                offX: 72,
                offY: 448
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Jungle-Flower-Dotted-Special"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.jungle",
            name: "plantBurstViolet"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/jungle-props.png",
                width: 24,
                height: 32,
                offX: 72,
                offY: 480
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Sapphire-Bush-1"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.forest",
            name: "plantBurst"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/forest.png",
                width: 24,
                height: 32,
                offX: 0,
                offY: 704
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false,
                shapeType: "Z_FLAT"
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Sapphire-Bush-2"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.forest",
            name: "plantBurst"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/forest.png",
                width: 24,
                height: 32,
                offX: 0,
                offY: 736
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false,
                shapeType: "Z_FLAT"
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Sapphire-Bush-Special"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.forest",
            name: "plantBurst"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/forest.png",
                width: 24,
                height: 32,
                offX: 0,
                offY: 768
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false,
                shapeType: "Z_FLAT"
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Sapphire-Bamboo-1"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.forest",
            name: "bambooBurst"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/forest.png",
                width: 24,
                height: 32,
                offX: 72,
                offY: 704
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false,
                shapeType: "Z_FLAT"
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Sapphire-Bamboo-2"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.forest",
            name: "bambooBurst"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/forest.png",
                width: 24,
                height: 32,
                offX: 72,
                offY: 736
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false,
                shapeType: "Z_FLAT"
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Sapphire-Bamboo-Special"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.forest",
            name: "bambooBurst"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/forest.png",
                width: 24,
                height: 32,
                offX: 72,
                offY: 768
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false,
                shapeType: "Z_FLAT"
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Sapphire-Cobalt-1"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 8
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.cave-cobalt",
            name: "cobaltBurst"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/cave-cobalt.png",
                width: 24,
                height: 32,
                offX: 0,
                offY: 0
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false,
                shapeType: "Z_FLAT"
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Sapphire-Cobalt-2"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 8
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.cave-cobalt",
            name: "cobaltBurst"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/cave-cobalt.png",
                width: 24,
                height: 32,
                offX: 0,
                offY: 32
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false,
                shapeType: "Z_FLAT"
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Sapphire-Cobalt-Special"] = {
        size: {
            x: 16,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 8
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.cave-cobalt",
            name: "cobaltBurst"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/cave-cobalt.png",
                width: 24,
                height: 32,
                offX: 0,
                offY: 64
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false,
                shapeType: "Z_FLAT"
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE.TrashBag1 = {
        size: {
            x: 32,
            y: 16,
            z: 16
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 8
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.jungle",
            name: "trashBag"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/jungle-props.png",
                width: 32,
                height: 32,
                offX: 352,
                offY: 528
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false,
                shapeType: "Z_FLAT"
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE.TrashBag2 = {
        size: {
            x: 32,
            y: 16,
            z: 16
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 8
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.jungle",
            name: "trashBag"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/jungle-props.png",
                width: 32,
                height: 32,
                offX: 352,
                offY: 560
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false,
                shapeType: "Z_FLAT"
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE.TrashBag3 = {
        size: {
            x: 32,
            y: 16,
            z: 24
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 8
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.jungle",
            name: "trashBag"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/jungle-props.png",
                width: 32,
                height: 40,
                offX: 352,
                offY: 592
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false,
                shapeType: "Z_FLAT"
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE.TrashBag4 = {
        size: {
            x: 32,
            y: 16,
            z: 24
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 8
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.jungle",
            name: "trashBag"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/jungle-props.png",
                width: 32,
                height: 40,
                offX: 352,
                offY: 632
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false,
                shapeType: "Z_FLAT"
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Final-Cone-1"] = {
        size: {
            x: 24,
            y: 20,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.final",
            name: "plantBurst"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/final-dungeon-outer-props.png",
                width: 48,
                height: 32,
                offX: 0,
                offY: 128
            },
            SUB: [{
                    name: "default",
                    time: 1,
                    frames: [0],
                    repeat: false
                },
                {
                    name: "default",
                    time: 1,
                    frames: [1],
                    repeat: false
                }, {
                    name: "dropped",
                    time: 1,
                    frames: [2],
                    repeat: false,
                    shapeType: "Z_FLAT"
                }
            ]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Final-Cone-2"] = {
        size: {
            x: 26,
            y: 20,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.final",
            name: "plantBurst"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/final-dungeon-outer-props.png",
                width: 48,
                height: 40,
                offX: 0,
                offY: 160
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false,
                shapeType: "Z_FLAT"
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Final-Cone-3"] = {
        size: {
            x: 24,
            y: 20,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.final",
            name: "plantBurstPink"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/final-dungeon-outer-props.png",
                width: 40,
                height: 32,
                offX: 0,
                offY: 200
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false,
                shapeType: "Z_FLAT"
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Final-Cone-4"] = {
        size: {
            x: 24,
            y: 20,
            z: 28
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.final",
            name: "plantBurstPink"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/final-dungeon-outer-props.png",
                width: 40,
                height: 48,
                offX: 0,
                offY: 230
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false,
                shapeType: "Z_FLAT"
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Final-Shard"] = {
        size: {
            x: 24,
            y: 20,
            z: 28
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.final",
            name: "crystalBurst"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/final-dungeon-outer-props.png",
                width: 32,
                height: 48,
                offX: 152,
                offY: 440
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false,
                shapeType: "Z_FLAT"
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Beach-Coral-1"] = {
        size: {
            x: 24,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.beach",
            name: "plantBurstPink"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/beach-props.png",
                width: 24,
                height: 32,
                offX: 0,
                offY: 0
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false,
                wallY: 1
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Beach-Coral-2"] = {
        size: {
            x: 24,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.beach",
            name: "plantBurstViolet"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/beach-props.png",
                width: 24,
                height: 32,
                offX: 0,
                offY: 32
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false,
                wallY: 1
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Beach-Grey-1"] = {
        size: {
            x: 24,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.beach",
            name: "plantBurstGrey"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/beach-props.png",
                width: 24,
                height: 32,
                offX: 0,
                offY: 64
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false,
                wallY: 1
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Beach-Grey-2"] = {
        size: {
            x: 24,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.beach",
            name: "plantBurstGrey"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/beach-props.png",
                width: 24,
                height: 32,
                offX: 0,
                offY: 96
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false,
                wallY: 1
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Beach-Green-1"] = {
        size: {
            x: 24,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.beach",
            name: "plantBurstGreen"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/beach-props.png",
                width: 24,
                height: 32,
                offX: 0,
                offY: 128
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false,
                wallY: 1
            }]
        }
    };
    sc.ITEM_DESTRUCT_TYPE["Beach-Green-2"] = {
        size: {
            x: 24,
            y: 16,
            z: 22
        },
        effectOffset: {
            x: 0,
            y: 0,
            z: 12
        },
        boom: {
            sheet: "puzzle.destructible",
            name: "small"
        },
        debris: {
            sheet: "area.beach",
            name: "plantBurstBlue"
        },
        anims: {
            shapeType: "Y_FLAT",
            sheet: {
                src: "media/map/beach-props.png",
                width: 24,
                height: 32,
                offX: 0,
                offY: 160
            },
            SUB: [{
                name: "default",
                time: 1,
                frames: [0],
                repeat: false
            }, {
                name: "default",
                time: 1,
                frames: [1],
                repeat: false
            }, {
                name: "dropped",
                time: 1,
                frames: [2],
                repeat: false,
                wallY: 1
            }]
        }
    }
});
ig.baked = !0;

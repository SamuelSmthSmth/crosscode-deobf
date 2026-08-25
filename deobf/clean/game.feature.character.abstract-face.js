/**
 * game.feature.character.abstract-face
 * ====================================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.character.abstract-face")`.
 *
 * Abstract (composable) face definitions for characters that don't have
 * a full painted face image. Each face is built from torso + head parts
 * with expression mappings. Registered in `sc.ABSTRACT_FACES`.
 */
ig.module("game.feature.character.abstract-face").defines(function () {
    /**
     * Build an abstract face definition from a parts description.
     * @param {{torso, head, src, centerX, centerY}} parts
     * @returns {object} face definition compatible with the face system
     */
    function createAbstractFace(parts) {
        return {
            src: parts.src,
            width: parts.torso.w,
            height: parts.torso.h + parts.head.h - parts.head.overlapY,
            centerX: parts.centerX,
            centerY: parts.centerY,
            parts: [{
                torso: {
                    srcX: parts.torso.x,
                    srcY: parts.torso.y,
                    width: parts.torso.w,
                    height: parts.torso.h,
                    destX: 0,
                    destY: parts.head.h - parts.head.overlapY
                }
            }, {
                head: {
                    srcX: parts.head.x,
                    srcY: parts.head.y,
                    width: parts.head.w,
                    height: parts.head.h,
                    destX: parts.head.offX,
                    destY: 0
                }
            }],
            expressions: {
                DEFAULT: {
                    faces: [
                        ["torso", "head"]
                    ]
                }
            }
        }
    }
    sc.ABSTRACT_FACES = {};
    sc.ABSTRACT_FACES.sensei = {
        src: "sensei.png",
        width: 184,
        height: 184,
        centerX: 94,
        centerY: 70,
        parts: [{
            torso: {
                srcX: 0,
                srcY: 100,
                width: 184,
                height: 84,
                destX: 0,
                destY: 100
            }
        }, {
            head: {
                srcX: 0,
                srcY: 0,
                width: 184,
                height: 100,
                destX: 0,
                destY: 0
            }
        }],
        expressions: {
            DEFAULT: {
                faces: [
                    ["torso", "head"]
                ]
            }
        }
    };
    sc.ABSTRACT_FACES.oldman = {
        src: "oldman.png",
        width: 168,
        height: 160,
        centerX: 50,
        centerY: 60,
        parts: [{
            torso: {
                srcX: 0,
                srcY: 100,
                width: 168,
                height: 60,
                destX: 0,
                destY: 100
            }
        }, {
            head: {
                srcX: 0,
                srcY: 0,
                width: 168,
                height: 100,
                destX: 0,
                destY: 0
            }
        }],
        expressions: {
            DEFAULT: {
                faces: [
                    ["torso", "head"]
                ]
            }
        }
    };
    sc.ABSTRACT_FACES.henry = {
        src: "henry.png",
        width: 134,
        height: 160,
        centerX: 50,
        centerY: 60,
        parts: [{
            torso: {
                srcX: 0,
                srcY: 100,
                width: 134,
                height: 60,
                destX: 0,
                destY: 100
            },
            torsoH: {
                srcX: 144,
                srcY: 100,
                width: 134,
                height: 60,
                destX: 0,
                destY: 100
            }
        }, {
            head: {
                srcX: 0,
                srcY: 0,
                width: 134,
                height: 100,
                destX: 0,
                destY: 0
            },
            headH: {
                srcX: 144,
                srcY: 0,
                width: 134,
                height: 100,
                destX: 0,
                destY: 0
            }
        }],
        expressions: {
            DEFAULT: {
                faces: [
                    ["torso", "head"]
                ]
            },
            HOLOGRAM: {
                faces: [
                    ["torsoH", "headH"]
                ]
            }
        }
    };
    sc.ABSTRACT_FACES.shadAlbino = {
        src: "albinoshad.png",
        width: 136,
        height: 160,
        centerX: 44,
        centerY: 92,
        parts: [{
            torso: {
                srcX: 0,
                srcY: 100,
                width: 136,
                height: 60,
                destX: 0,
                destY: 100
            }
        }, {
            head: {
                srcX: 0,
                srcY: 0,
                width: 136,
                height: 100,
                destX: 0,
                destY: 0
            }
        }],
        expressions: {
            DEFAULT: {
                faces: [
                    ["torso", "head"]
                ]
            }
        }
    };
    sc.ABSTRACT_FACES.maleNormalHair1 = createAbstractFace({
        src: "npc-portrait.png",
        torso: {
            x: 0,
            y: 0,
            w: 136,
            h: 64
        },
        head: {
            x: 136,
            y: 0,
            w: 72,
            h: 88,
            offX: 24,
            overlapY: 0
        },
        centerX: 43,
        centerY: 55
    });
    sc.ABSTRACT_FACES.maleNormalHair2 = {
        src: "npc-portrait.png",
        width: 128,
        height: 152,
        centerX: 43,
        centerY: 55,
        parts: [{
            straight: {
                srcX: 0,
                srcY: 0,
                width: 136,
                height: 64,
                destX: 0,
                destY: 88
            }
        }, {
            norm: {
                srcX: 280,
                srcY: 0,
                width: 80,
                height: 88,
                destX: 24,
                destY: 0
            },
            glass: {
                srcX: 360,
                srcY: 0,
                width: 80,
                height: 88,
                destX: 24,
                destY: 0
            }
        }],
        expressions: {
            DEFAULT: {
                faces: [
                    ["straight", "norm"]
                ]
            },
            GLASS: {
                faces: [
                    ["straight", "glass"]
                ]
            }
        }
    };
    sc.ABSTRACT_FACES.maleNormalBald1 = createAbstractFace({
        src: "npc-portrait.png",
        torso: {
            x: 0,
            y: 64,
            w: 136,
            h: 64
        },
        head: {
            x: 208,
            y: 0,
            w: 72,
            h: 88,
            offX: 24,
            overlapY: 0
        },
        centerX: 43,
        centerY: 55
    });
    sc.ABSTRACT_FACES.maleFarmer = createAbstractFace({
        src: "npc-portrait.png",
        torso: {
            x: 0,
            y: 64,
            w: 136,
            h: 64
        },
        head: {
            x: 440,
            y: 0,
            w: 104,
            h: 96,
            offX: 8,
            overlapY: 0
        },
        centerX: 43,
        centerY: 63
    });
    sc.ABSTRACT_FACES.femaleShortHair1 = createAbstractFace({
        src: "npc-portrait.png",
        torso: {
            x: 0,
            y: 128,
            w: 104,
            h: 56
        },
        head: {
            x: 136,
            y: 88,
            w: 80,
            h: 88,
            offX: 8,
            overlapY: 0
        },
        centerX: 36,
        centerY: 60
    });
    sc.ABSTRACT_FACES.femaleLongHair1 = createAbstractFace({
        src: "npc-portrait.png",
        torso: {
            x: 0,
            y: 128,
            w: 104,
            h: 56
        },
        head: {
            x: 216,
            y: 88,
            w: 80,
            h: 88,
            offX: 8,
            overlapY: 0
        },
        centerX: 36,
        centerY: 60
    });
    sc.ABSTRACT_FACES.femalePigtails = createAbstractFace({
        src: "npc-portrait.png",
        torso: {
            x: 0,
            y: 184,
            w: 104,
            h: 56
        },
        head: {
            x: 296,
            y: 88,
            w: 80,
            h: 88,
            offX: 8,
            overlapY: 0
        },
        centerX: 36,
        centerY: 60
    });
    sc.ABSTRACT_FACES.femaleFarmer = createAbstractFace({
        src: "npc-portrait.png",
        torso: {
            x: 0,
            y: 184,
            w: 104,
            h: 56
        },
        head: {
            x: 544,
            y: 0,
            w: 104,
            h: 96,
            offX: 0,
            overlapY: 0
        },
        centerX: 36,
        centerY: 68
    });
    sc.ABSTRACT_FACES.maleNormalMustache = createAbstractFace({
        src: "npc-portrait.png",
        torso: {
            x: 0,
            y: 0,
            w: 136,
            h: 64
        },
        head: {
            x: 352,
            y: 272,
            w: 80,
            h: 96,
            offX: 16,
            overlapY: 2
        },
        centerX: 40,
        centerY: 64
    });
    sc.ABSTRACT_FACES.maleNormalOldBeard = createAbstractFace({
        src: "npc-portrait.png",
        torso: {
            x: 0,
            y: 0,
            w: 136,
            h: 64
        },
        head: {
            x: 512,
            y: 288,
            w: 72,
            h: 88,
            offX: 16,
            overlapY: 2
        },
        centerX: 40,
        centerY: 58
    });
    sc.ABSTRACT_FACES.maleShadyBaldEyepatch = createAbstractFace({
        src: "npc-portrait.png",
        torso: {
            x: 0,
            y: 0,
            w: 136,
            h: 64
        },
        head: {
            x: 112,
            y: 264,
            w: 72,
            h: 88,
            offX: 24,
            overlapY: 0
        },
        centerX: 43,
        centerY: 55
    });
    sc.ABSTRACT_FACES.maleHairSunglasses = createAbstractFace({
        src: "npc-portrait.png",
        torso: {
            x: 0,
            y: 0,
            w: 136,
            h: 64
        },
        head: {
            x: 664,
            y: 288,
            w: 72,
            h: 88,
            offX: 24,
            overlapY: 0
        },
        centerX: 48,
        centerY: 55
    });
    sc.ABSTRACT_FACES.femaleAdvisor = createAbstractFace({
        src: "npc-portrait.png",
        torso: {
            x: 0,
            y: 128,
            w: 104,
            h: 56
        },
        head: {
            x: 264,
            y: 176,
            w: 80,
            h: 104,
            offX: 8,
            overlapY: 0
        },
        centerX: 36,
        centerY: 72
    });
    sc.ABSTRACT_FACES.maleAdvisor =
        createAbstractFace({
            src: "npc-portrait.png",
            torso: {
                x: 0,
                y: 0,
                w: 136,
                h: 64
            },
            head: {
                x: 192,
                y: 176,
                w: 72,
                h: 104,
                offX: 24,
                overlapY: 0
            },
            centerX: 43,
            centerY: 67
        });
    sc.ABSTRACT_FACES.femaleAdventurerPonytail = createAbstractFace({
        src: "npc-portrait.png",
        torso: {
            x: 0,
            y: 128,
            w: 104,
            h: 56
        },
        head: {
            x: 104,
            y: 176,
            w: 88,
            h: 88,
            offX: 8,
            overlapY: 0
        },
        centerX: 36,
        centerY: 54
    });
    sc.ABSTRACT_FACES.femaleAdventurerPigtails = createAbstractFace({
        src: "npc-portrait.png",
        torso: {
            x: 0,
            y: 128,
            w: 104,
            h: 56
        },
        head: {
            x: 664,
            y: 104,
            w: 96,
            h: 88,
            offX: 8,
            overlapY: 0
        },
        centerX: 36,
        centerY: 54
    });
    sc.ABSTRACT_FACES.maleAdventurerSpikeHair =
        createAbstractFace({
            src: "npc-portrait.png",
            torso: {
                x: 0,
                y: 0,
                w: 136,
                h: 64
            },
            head: {
                x: 648,
                y: 0,
                w: 72,
                h: 104,
                offX: 24,
                overlapY: 0
            },
            centerX: 43,
            centerY: 71
        });
    sc.ABSTRACT_FACES.maleAdventurerBald = createAbstractFace({
        src: "npc-portrait.png",
        torso: {
            x: 0,
            y: 0,
            w: 136,
            h: 64
        },
        head: {
            x: 600,
            y: 104,
            w: 64,
            h: 88,
            offX: 32,
            overlapY: 0
        },
        centerX: 43,
        centerY: 51
    });
    sc.ABSTRACT_FACES.femaleMiner = createAbstractFace({
        src: "npc-portrait.png",
        torso: {
            x: 0,
            y: 128,
            w: 104,
            h: 56
        },
        head: {
            x: 520,
            y: 96,
            w: 80,
            h: 96,
            offX: 8,
            overlapY: 0
        },
        centerX: 36,
        centerY: 68
    });
    sc.ABSTRACT_FACES.maleMiner = createAbstractFace({
        src: "npc-portrait.png",
        torso: {
            x: 0,
            y: 64,
            w: 136,
            h: 64
        },
        head: {
            x: 440,
            y: 96,
            w: 80,
            h: 96,
            offX: 24,
            overlapY: 0
        },
        centerX: 43,
        centerY: 63
    });
    sc.ABSTRACT_FACES.femaleColonialShorthair = createAbstractFace({
        src: "npc-portrait.png",
        torso: {
            x: 0,
            y: 128,
            w: 104,
            h: 56
        },
        head: {
            x: 344,
            y: 176,
            w: 80,
            h: 96,
            offX: 8,
            overlapY: 0
        },
        centerX: 40,
        centerY: 59
    });
    sc.ABSTRACT_FACES.femaleColonialPigtails = createAbstractFace({
        src: "npc-portrait.png",
        torso: {
            x: 0,
            y: 128,
            w: 104,
            h: 56
        },
        head: {
            x: 424,
            y: 192,
            w: 112,
            h: 96,
            offX: 0,
            overlapY: 0
        },
        centerX: 40,
        centerY: 59
    });
    sc.ABSTRACT_FACES.maleColonialBlack = createAbstractFace({
        src: "npc-portrait.png",
        torso: {
            x: 0,
            y: 0,
            w: 136,
            h: 64
        },
        head: {
            x: 536,
            y: 192,
            w: 80,
            h: 96,
            offX: 24,
            overlapY: 0
        },
        centerX: 48,
        centerY: 59
    });
    sc.ABSTRACT_FACES.maleColonialMonocle = createAbstractFace({
        src: "npc-portrait.png",
        torso: {
            x: 0,
            y: 0,
            w: 136,
            h: 64
        },
        head: {
            x: 616,
            y: 192,
            w: 80,
            h: 96,
            offX: 24,
            overlapY: 0
        },
        centerX: 48,
        centerY: 59
    });
    sc.ABSTRACT_FACES.maleGuard = createAbstractFace({
        src: "guards-portrait.png",
        torso: {
            x: 0,
            y: 0,
            w: 136,
            h: 72
        },
        head: {
            x: 136,
            y: 0,
            w: 88,
            h: 88,
            offX: 16,
            overlapY: 0
        },
        centerX: 48,
        centerY: 59
    });
    sc.ABSTRACT_FACES.femaleGuard = createAbstractFace({
        src: "guards-portrait.png",
        torso: {
            x: 0,
            y: 72,
            w: 104,
            h: 64
        },
        head: {
            x: 224,
            y: 0,
            w: 88,
            h: 88,
            offX: 8,
            overlapY: 0
        },
        centerX: 48,
        centerY: 59
    });
    sc.ABSTRACT_FACES.maleGuardGlasses = createAbstractFace({
        src: "guards-portrait.png",
        torso: {
            x: 0,
            y: 0,
            w: 136,
            h: 72
        },
        head: {
            x: 136,
            y: 96,
            w: 88,
            h: 88,
            offX: 16,
            overlapY: 0
        },
        centerX: 48,
        centerY: 59
    });
    sc.ABSTRACT_FACES.femaleMonk = createAbstractFace({
        src: "npc-portrait.png",
        torso: {
            x: 0,
            y: 128,
            w: 104,
            h: 56
        },
        head: {
            x: 440,
            y: 288,
            w: 72,
            h: 88,
            offX: 16,
            overlapY: 0
        },
        centerX: 34,
        centerY: 58
    });
    sc.ABSTRACT_FACES.maleMonk = createAbstractFace({
        src: "npc-portrait.png",
        torso: {
            x: 0,
            y: 0,
            w: 136,
            h: 64
        },
        head: {
            x: 376,
            y: 88,
            w: 64,
            h: 88,
            offX: 32,
            overlapY: 0
        },
        centerX: 43,
        centerY: 55
    });
    sc.ABSTRACT_FACES.maleBusinessHeatHeadscarf = createAbstractFace({
        src: "npc-portrait.png",
        torso: {
            x: 0,
            y: 0,
            w: 136,
            h: 64
        },
        head: {
            x: 192,
            y: 280,
            w: 72,
            h: 96,
            offX: 20,
            overlapY: 2
        },
        centerX: 40,
        centerY: 66
    });
    sc.ABSTRACT_FACES.femaleBusinessHeatHeadscarf = createAbstractFace({
        src: "npc-portrait.png",
        torso: {
            x: 0,
            y: 128,
            w: 104,
            h: 56
        },
        head: {
            x: 264,
            y: 280,
            w: 80,
            h: 96,
            offX: 12,
            overlapY: 2
        },
        centerX: 40,
        centerY: 66
    });
    sc.ABSTRACT_FACES.femaleGlassesCap = createAbstractFace({
        src: "npc-portrait.png",
        torso: {
            x: 0,
            y: 128,
            w: 104,
            h: 56
        },
        head: {
            x: 584,
            y: 288,
            w: 80,
            h: 88,
            offX: 8,
            overlapY: 0
        },
        centerX: 28,
        centerY: 60
    });
    sc.ABSTRACT_FACES.tribladerMale = createAbstractFace({
        src: "avatars-new.png",
        torso: {
            x: 0,
            y: 0,
            w: 152,
            h: 80
        },
        head: {
            x: 152,
            y: 0,
            w: 80,
            h: 96,
            offX: 32,
            overlapY: 8
        },
        centerX: 54,
        centerY: 62
    });
    sc.ABSTRACT_FACES.tribladerFemale = createAbstractFace({
        src: "avatars-new.png",
        torso: {
            x: 0,
            y: 80,
            w: 128,
            h: 72
        },
        head: {
            x: 152,
            y: 96,
            w: 80,
            h: 88,
            offX: 16,
            overlapY: 8
        },
        centerX: 38,
        centerY: 54
    });
    sc.ABSTRACT_FACES.pentafistMale = createAbstractFace({
        src: "avatars-new.png",
        torso: {
            x: 0,
            y: 152,
            w: 128,
            h: 72
        },
        head: {
            x: 232,
            y: 0,
            w: 96,
            h: 88,
            offX: 16,
            overlapY: 0
        },
        centerX: 42,
        centerY: 60
    });
    sc.ABSTRACT_FACES.pentafistMaleRasta =
        createAbstractFace({
            src: "avatars-new.png",
            torso: {
                x: 0,
                y: 152,
                w: 128,
                h: 72
            },
            head: {
                x: 224,
                y: 376,
                w: 96,
                h: 88,
                offX: 24,
                overlapY: 0
            },
            centerX: 42,
            centerY: 58
        });
    sc.ABSTRACT_FACES.pentafistFemale = createAbstractFace({
        src: "avatars-new.png",
        torso: {
            x: 0,
            y: 224,
            w: 96,
            h: 64
        },
        head: {
            x: 232,
            y: 88,
            w: 96,
            h: 88,
            offX: 0,
            overlapY: 0
        },
        centerX: 30,
        centerY: 56
    });
    sc.ABSTRACT_FACES.pentafistFemaleRasta = createAbstractFace({
        src: "avatars-new.png",
        torso: {
            x: 0,
            y: 224,
            w: 96,
            h: 64
        },
        head: {
            x: 320,
            y: 384,
            w: 104,
            h: 88,
            offX: -8,
            overlapY: 0
        },
        centerX: 28,
        centerY: 56
    });
    sc.ABSTRACT_FACES.hexacastMale = createAbstractFace({
        src: "avatars-new.png",
        torso: {
            x: 0,
            y: 288,
            w: 136,
            h: 72
        },
        head: {
            x: 232,
            y: 176,
            w: 96,
            h: 88,
            offX: 16,
            overlapY: 0
        },
        centerX: 42,
        centerY: 55
    });
    sc.ABSTRACT_FACES.hexacastMaleBlockhead = createAbstractFace({
        src: "avatars-new.png",
        torso: {
            x: 0,
            y: 288,
            w: 136,
            h: 72
        },
        head: {
            x: 136,
            y: 352,
            w: 88,
            h: 88,
            offX: 24,
            overlapY: 0
        },
        centerX: 44,
        centerY: 58
    });
    sc.ABSTRACT_FACES.hexacastFemale = createAbstractFace({
        src: "avatars-new.png",
        torso: {
            x: 0,
            y: 360,
            w: 104,
            h: 40
        },
        head: {
            x: 328,
            y: 0,
            w: 104,
            h: 112,
            offX: 0,
            overlapY: 0
        },
        centerX: 26,
        centerY: 56
    });
    sc.ABSTRACT_FACES.quadroguardMale = createAbstractFace({
        src: "avatars-new.png",
        torso: {
            x: 0,
            y: 536,
            w: 168,
            h: 96
        },
        head: {
            x: 152,
            y: 184,
            w: 80,
            h: 80,
            offX: 40,
            overlapY: 8
        },
        centerX: 60,
        centerY: 48
    });
    sc.ABSTRACT_FACES.quadroguardMaleSpiky = createAbstractFace({
        src: "avatars-new.png",
        torso: {
            x: 0,
            y: 536,
            w: 168,
            h: 96
        },
        head: {
            x: 152,
            y: 264,
            w: 80,
            h: 88,
            offX: 40,
            overlapY: 8
        },
        centerX: 60,
        centerY: 58
    });
    sc.ABSTRACT_FACES.quadroguardFemale = createAbstractFace({
        src: "avatars-new.png",
        torso: {
            x: 0,
            y: 472,
            w: 128,
            h: 64
        },
        head: {
            x: 328,
            y: 216,
            w: 96,
            h: 80,
            offX: 16,
            overlapY: 0
        },
        centerX: 42,
        centerY: 46
    });
    sc.ABSTRACT_FACES.quadroguardFemalePony = createAbstractFace({
        src: "avatars-new.png",
        torso: {
            x: 0,
            y: 472,
            w: 128,
            h: 64
        },
        head: {
            x: 336,
            y: 296,
            w: 88,
            h: 88,
            offX: 24,
            overlapY: 0
        },
        centerX: 44,
        centerY: 54
    });
    sc.ABSTRACT_FACES.spheromancerMale = createAbstractFace({
        src: "avatars-new.png",
        torso: {
            x: 0,
            y: 400,
            w: 135,
            h: 72
        },
        head: {
            x: 328,
            y: 112,
            w: 96,
            h: 104,
            offX: 24,
            overlapY: 0
        },
        centerX: 50,
        centerY: 66
    });
    sc.ABSTRACT_FACES.spheromancerFemale = createAbstractFace({
        src: "avatars-new.png",
        torso: {
            x: 168,
            y: 576,
            w: 96,
            h: 56
        },
        head: {
            x: 232,
            y: 264,
            w: 88,
            h: 112,
            offX: 0,
            overlapY: 0
        },
        centerX: 30,
        centerY: 66
    });
    sc.ABSTRACT_FACES.shadMale = createAbstractFace({
        src: "shad-portrait.png",
        torso: {
            x: 0,
            y: 0,
            w: 120,
            h: 72
        },
        head: {
            x: 120,
            y: 0,
            w: 96,
            h: 88,
            offX: 8,
            overlapY: 0
        },
        centerX: 43,
        centerY: 55
    });
    sc.ABSTRACT_FACES.shadFemale = createAbstractFace({
        src: "shad-portrait.png",
        torso: {
            x: 0,
            y: 72,
            w: 112,
            h: 48
        },
        head: {
            x: 216,
            y: 0,
            w: 80,
            h: 96,
            offX: 8,
            overlapY: 0
        },
        centerX: 43,
        centerY: 55
    })
});
ig.baked = !0;

ig.module("game.feature.character.abstract-face").defines(function() {
    function b(a) {
        return {
            src: a.src,
            width: a.torso.w,
            height: a.torso.h + a.head.h - a.head.overlapY,
            centerX: a.centerX,
            centerY: a.centerY,
            parts: [{
                torso: {
                    srcX: a.torso.x,
                    srcY: a.torso.y,
                    width: a.torso.w,
                    height: a.torso.h,
                    destX: 0,
                    destY: a.head.h - a.head.overlapY
                }
            }, {
                head: {
                    srcX: a.head.x,
                    srcY: a.head.y,
                    width: a.head.w,
                    height: a.head.h,
                    destX: a.head.offX,
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
    sc.ABSTRACT_FACES.maleNormalHair1 = b({
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
    sc.ABSTRACT_FACES.maleNormalBald1 = b({
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
    sc.ABSTRACT_FACES.maleFarmer = b({
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
    sc.ABSTRACT_FACES.femaleShortHair1 = b({
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
    sc.ABSTRACT_FACES.femaleLongHair1 = b({
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
    sc.ABSTRACT_FACES.femalePigtails = b({
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
    sc.ABSTRACT_FACES.femaleFarmer = b({
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
    sc.ABSTRACT_FACES.maleNormalMustache = b({
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
    sc.ABSTRACT_FACES.maleNormalOldBeard = b({
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
    sc.ABSTRACT_FACES.maleShadyBaldEyepatch = b({
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
    sc.ABSTRACT_FACES.maleHairSunglasses = b({
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
    sc.ABSTRACT_FACES.femaleAdvisor = b({
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
        b({
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
    sc.ABSTRACT_FACES.femaleAdventurerPonytail = b({
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
    sc.ABSTRACT_FACES.femaleAdventurerPigtails = b({
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
        b({
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
    sc.ABSTRACT_FACES.maleAdventurerBald = b({
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
    sc.ABSTRACT_FACES.femaleMiner = b({
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
    sc.ABSTRACT_FACES.maleMiner = b({
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
    sc.ABSTRACT_FACES.femaleColonialShorthair = b({
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
    sc.ABSTRACT_FACES.femaleColonialPigtails = b({
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
    sc.ABSTRACT_FACES.maleColonialBlack = b({
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
    sc.ABSTRACT_FACES.maleColonialMonocle = b({
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
    sc.ABSTRACT_FACES.maleGuard = b({
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
    sc.ABSTRACT_FACES.femaleGuard = b({
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
    sc.ABSTRACT_FACES.maleGuardGlasses = b({
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
    sc.ABSTRACT_FACES.femaleMonk = b({
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
    sc.ABSTRACT_FACES.maleMonk = b({
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
    sc.ABSTRACT_FACES.maleBusinessHeatHeadscarf = b({
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
    sc.ABSTRACT_FACES.femaleBusinessHeatHeadscarf = b({
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
    sc.ABSTRACT_FACES.femaleGlassesCap = b({
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
    sc.ABSTRACT_FACES.tribladerMale = b({
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
    sc.ABSTRACT_FACES.tribladerFemale = b({
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
    sc.ABSTRACT_FACES.pentafistMale = b({
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
        b({
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
    sc.ABSTRACT_FACES.pentafistFemale = b({
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
    sc.ABSTRACT_FACES.pentafistFemaleRasta = b({
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
    sc.ABSTRACT_FACES.hexacastMale = b({
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
    sc.ABSTRACT_FACES.hexacastMaleBlockhead = b({
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
    sc.ABSTRACT_FACES.hexacastFemale = b({
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
    sc.ABSTRACT_FACES.quadroguardMale = b({
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
    sc.ABSTRACT_FACES.quadroguardMaleSpiky = b({
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
    sc.ABSTRACT_FACES.quadroguardFemale = b({
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
    sc.ABSTRACT_FACES.quadroguardFemalePony = b({
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
    sc.ABSTRACT_FACES.spheromancerMale = b({
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
    sc.ABSTRACT_FACES.spheromancerFemale = b({
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
    sc.ABSTRACT_FACES.shadMale = b({
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
    sc.ABSTRACT_FACES.shadFemale = b({
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

/**
 * @module game.feature.voice-acting.va-config
 *
 * Voice acting configuration data. Maps character keys to voice clip
 * configs; each clip optionally has a text/expression filter that the
 * voice-acting system uses to pick the best-matching voice line.
 */
ig.module("game.feature.voice-acting.va-config").requires("game.feature.voice-acting.voice-acting").defines(function() {
    sc.VA_CONFIG["main.lea"] = [{
        sounds: [{
            src: "lea/bye.ogg",
            volume: 1
        }],
        filter: {
            text: "Bye"
        }
    }, {
        sounds: [{
            src: "lea/bye-question.ogg",
            volume: 1
        }],
        filter: {
            text: "Bye?"
        }
    }, {
        sounds: [{
            src: "lea/haaaaii.ogg",
            volume: 1
        }, {
            src: "lea/haaaaii-2.ogg",
            volume: 1
        }],
        filter: {
            text: "Hi",
            expressions: ["EXCITED"]
        }
    }, {
        sounds: [{
            src: "lea/hi-dissapointed.ogg",
            volume: 1
        }],
        filter: {
            text: "Hi",
            expressions: ["EXHAUSTED", "ANNOYED",
                "MOPING"
            ]
        }
    }, {
        sounds: [{
            src: "lea/hi-question.ogg",
            volume: 1
        }],
        filter: {
            text: "Hi",
            expressions: ["SURPRISED_TOWARD", "SURPRISED_AWAY", "NERVOUS"]
        }
    }, {
        sounds: [{
            src: "lea/hi.ogg",
            volume: 1
        }, {
            src: "lea/hi-2.ogg",
            volume: 1
        }, {
            src: "lea/hi-3.ogg",
            volume: 1
        }],
        filter: {
            text: "Hi"
        }
    }, {
        sounds: [{
            src: "lea/how.ogg",
            volume: 1
        }, {
            src: "lea/how-2.ogg",
            volume: 1
        }],
        filter: {
            text: "How"
        }
    }, {
        sounds: [{
            src: "lea/lea.ogg",
            volume: 1
        }, {
            src: "lea/lea-2.ogg",
            volume: 1
        }, {
            src: "lea/lea-3.ogg",
            volume: 1
        }],
        filter: {
            text: "Lea"
        }
    }, {
        sounds: [{
            src: "lea/lea-dissapointed.ogg",
            volume: 1
        }],
        filter: {
            text: "Lea",
            expressions: ["ANNOYED", "MOPING"]
        }
    }, {
        sounds: [{
            src: "lea/hmmm.ogg",
            volume: 1
        }],
        filter: {
            text: "...!"
        }
    }, {
        sounds: [{
            src: "lea/seufz.ogg",
            volume: 1
        }, {
            src: "lea/seufz-2.ogg",
            volume: 1
        }],
        filter: {
            text: "..."
        }
    }, {
        sounds: [{
            src: "lea/huh.ogg",
            volume: 1
        }],
        filter: {
            text: "...?"
        }
    }, {
        sounds: [],
        filter: {
            text: "[nods]"
        }
    }, {
        sounds: [],
        filter: {
            text: "[shakes head]"
        }
    }];
    sc.VA_CONFIG["main.shizuka"] = [{
        sounds: [{
            src: "shizuka/alligator.ogg",
            volume: 1
        }]
    }, {
        sounds: [{
            src: "shizuka/bakka.ogg",
            volume: 1
        }, {
            src: "shizuka/bakka-2.ogg",
            volume: 1
        }, {
            src: "shizuka/bakka-3.ogg",
            volume: 1
        }]
    }, {
        sounds: [{
            src: "shizuka/chikusho.ogg",
            volume: 1
        }]
    }, {
        sounds: [{
            src: "shizuka/gomenasai.ogg",
            volume: 1
        }]
    }, {
        sounds: [{
            src: "shizuka/jameruuu.ogg",
            volume: 1
        }, {
            src: "shizuka/jameruuu-2.ogg",
            volume: 1
        }]
    }, {
        sounds: [{
            src: "shizuka/jameruuu.ogg",
            volume: 1
        }, {
            src: "shizuka/jameruuu-2.ogg",
            volume: 1
        }]
    }, {
        sounds: [{
            src: "shizuka/kawaiiii.ogg",
            volume: 1
        }]
    }];
    sc.VA_CONFIG["main.sergey"] = [{
            sounds: [{
                src: "sergey/binary.ogg",
                volume: 1
            }]
        }, {
            sounds: [{
                src: "sergey/can-you-hear-me.ogg",
                volume: 1
            }]
        },
        {
            sounds: [{
                src: "sergey/customer-service.ogg",
                volume: 1
            }]
        }, {
            sounds: [{
                src: "sergey/hotline.ogg",
                volume: 1
            }]
        }, {
            sounds: [{
                src: "sergey/is-this-working.ogg",
                volume: 1
            }]
        }, {
            sounds: [{
                src: "sergey/is-this-working-2.ogg",
                volume: 1
            }]
        }, {
            sounds: [{
                src: "sergey/turn-it-off-and-on.ogg",
                volume: 1
            }]
        }
    ];
    sc.VA_CONFIG["main.schneider"] = [{
        sounds: [{
            src: "schneider/ah-hallo.ogg",
            volume: 1
        }]
    }, {
        sounds: [{
            src: "schneider/bratwurst.ogg",
            volume: 1
        }]
    }, {
        sounds: [{
            src: "schneider/fabelhaft.ogg",
            volume: 1
        }]
    }, {
        sounds: [{
                src: "schneider/holeroe.ogg",
                volume: 1
            },
            {
                src: "schneider/holeroe-2.ogg",
                volume: 1
            }, {
                src: "schneider/holeroe-3.ogg",
                volume: 1
            }
        ],
        filter: {
            text: "Holer\u00f6"
        }
    }, {
        sounds: [{
            src: "schneider/holla-the-woodfairy.ogg",
            volume: 1
        }]
    }, {
        sounds: [{
            src: "schneider/i-think-i-spider.ogg",
            volume: 1
        }]
    }, {
        sounds: [{
            src: "schneider/ja.ogg",
            volume: 1
        }]
    }, {
        sounds: [{
            src: "schneider/jaja-thats-how-it-is.ogg",
            volume: 1
        }]
    }, {
        sounds: [{
            src: "schneider/my-akzent.ogg",
            volume: 1
        }]
    }, {
        sounds: [{
            src: "schneider/my-lovely.mister-singing-club.ogg",
            volume: 1
        }]
    }, {
        sounds: [{
            src: "schneider/my-pig-whistles.ogg",
            volume: 1
        }]
    }, {
        sounds: [{
            src: "schneider/neineinein.ogg",
            volume: 1
        }]
    }, {
        sounds: [{
            src: "schneider/noone-can-reach-me-the-water.ogg",
            volume: 1
        }]
    }, {
        sounds: [{
            src: "schneider/sauerkraut.ogg",
            volume: 1
        }]
    }, {
        sounds: [{
            src: "schneider/schifffahrtskapitaensmuetze.ogg",
            volume: 1
        }]
    }, {
        sounds: [{
            src: "schneider/that-makes-me-nobody-so-easy-after.ogg",
            volume: 1
        }]
    }];
    sc.VA_CONFIG["main.emilie"] = [{
        sounds: [{
            src: "emilie/au-reviour.ogg",
            volume: 1
        }],
        filter: {
            text: "revoir"
        }
    }, {
        sounds: [{
            src: "emilie/bonjour.ogg",
            volume: 1
        }, {
            src: "emilie/bonjour-2.ogg",
            volume: 1
        }],
        filter: {
            text: "Bonjour"
        }
    }, {
        sounds: [{
            src: "emilie/non.ogg",
            volume: 1
        }],
        filter: {
            text: "non"
        }
    }, {
        sounds: [{
            src: "emilie/oui.ogg",
            volume: 1
        }, {
            src: "emilie/oui-2.ogg",
            volume: 1
        }],
        filter: {
            text: "oui"
        }
    }, {
        sounds: [{
            src: "emilie/je-mapelle-emilie.ogg",
            volume: 1
        }],
        filter: {
            text: "emilie"
        }
    }, {
        sounds: [{
            src: "emilie/sacre-bleu.ogg",
            volume: 1
        }, {
            src: "emilie/sacre-bleu-2.ogg",
            volume: 1
        }],
        filter: {
            text: "Sacrebleu"
        }
    }, {
        sounds: [{
            src: "emilie/oulala-2.ogg",
            volume: 1
        }, {
            src: "emilie/oulala-3.ogg",
            volume: 1
        }]
    }, {
        sounds: [{
            src: "emilie/exquise-moir.ogg",
            volume: 1
        }]
    }];
    sc.VA_CONFIG["main.carla"] = [{
        sounds: [{
            src: "carla/atta-girl.ogg",
            volume: 1
        }],
        filter: {
            text: "attagirl"
        }
    }, {
        sounds: [{
            src: "carla/come-on.ogg",
            volume: 1
        }],
        filter: {
            text: "C'mon"
        }
    }, {
        sounds: [{
            src: "carla/good-job.ogg",
            volume: 1
        }],
        filter: {
            text: "Good"
        }
    }, {
        sounds: [{
            src: "carla/gotcha.ogg",
            volume: 1
        }],
        filter: {
            text: "gotcha"
        }
    }, {
        sounds: [{
            src: "carla/u-know.ogg",
            volume: 1
        }],
        filter: {
            text: "y'know"
        }
    }];
    sc.VA_CONFIG["main.captain"] = [{
        sounds: [{
            src: "jet/aarrr.ogg",
            volume: 1
        }]
    }, {
        sounds: [{
            src: "jet/ahoi.ogg",
            volume: 1
        }]
    }, {
        sounds: [{
            src: "jet/aye.ogg",
            volume: 1
        }]
    }, {
        sounds: [{
            src: "jet/aye-mate.ogg",
            volume: 1
        }]
    }, {
        sounds: [{
            src: "jet/dead-men-tell-no-lies.ogg",
            volume: 1
        }]
    }, {
        sounds: [{
            src: "jet/fire-in-the-hole.ogg",
            volume: 1
        }]
    }, {
        sounds: [{
            src: "jet/hmpf.ogg",
            volume: 1
        }, {
            src: "jet/hmpf-2.ogg",
            volume: 1
        }]
    }, {
        sounds: [{
            src: "jet/laugh.ogg",
            volume: 1
        }]
    }, {
        sounds: [{
            src: "jet/scallywag.ogg",
            volume: 1
        }]
    }, {
        sounds: [{
            src: "jet/time-for-some-grog.ogg",
            volume: 1
        }]
    }, {
        sounds: [{
            src: "jet/walk-the-plank.ogg",
            volume: 1
        }]
    }, {
        sounds: [{
            src: "jet/yarrr.ogg",
            volume: 1
        }]
    }, {
        sounds: [{
            src: "jet/ye-dobber.ogg",
            volume: 1
        }],
        filter: {
            text: "Dobber"
        }
    }, {
        sounds: [{
            src: "jet/ye-hornswaggle.ogg",
            volume: 1
        }]
    }];
    sc.VA_CONFIG["main.genius"] = [{
        sounds: [{
            src: "satoshi/cough.ogg",
            volume: 1
        }, {
            src: "satoshi/cough-2.ogg",
            volume: 1
        }, {
            src: "satoshi/cough-3.ogg",
            volume: 1
        }]
    }, {
        sounds: [{
            src: "satoshi/daijube.ogg",
            volume: 1
        }, {
            src: "satoshi/daijube.ogg",
            volume: 1
        }]
    }, {
        sounds: [{
            src: "satoshi/yatta.ogg",
            volume: 1
        }, {
            src: "satoshi/yatta.ogg",
            volume: 1
        }]
    }];
    sc.VA_CONFIG["antagonists.designer"] = [{
        sounds: [{
            src: "designer/amusing.ogg",
            volume: 1.25
        }, {
            src: "designer/amusing-2.ogg",
            volume: 1.25
        }]
    }, {
        sounds: [{
            src: "designer/everything-by-design.ogg",
            volume: 1.25
        }]
    }, {
        sounds: [{
            src: "designer/extraordinary.ogg",
            volume: 1.25
        }]
    }, {
        sounds: [{
            src: "designer/laugh.ogg",
            volume: 1.25
        }, {
            src: "designer/laugh-2.ogg",
            volume: 1.25
        }]
    }, {
        sounds: [{
            src: "designer/proposterous.ogg",
            volume: 1.25
        }],
        filter: {
            text: "preposterous"
        }
    }, {
        sounds: [{
            src: "designer/tse.ogg",
            volume: 1.25
        }]
    }, {
        sounds: [{
            src: "designer/we-are-pleased.ogg",
            volume: 1.25
        }]
    }];
    sc.VA_CONFIG["antagonists.gautham"] = [{
            sounds: [{
                src: "shady-guy/baka.ogg",
                volume: 1
            }]
        },
        {
            sounds: [{
                src: "shady-guy/kuso.ogg",
                volume: 1
            }, {
                src: "shady-guy/kuso-2.ogg",
                volume: 1
            }]
        }, {
            sounds: [{
                src: "shady-guy/madda-madda.ogg",
                volume: 1
            }, {
                src: "shady-guy/madda-madda-2.ogg",
                volume: 1
            }]
        }, {
            sounds: [{
                src: "shady-guy/masaka.ogg",
                volume: 1
            }, {
                src: "shady-guy/masaka-2.ogg",
                volume: 1
            }, {
                src: "shady-guy/masaka-3.ogg",
                volume: 1
            }]
        }, {
            sounds: [{
                src: "shady-guy/mate.ogg",
                volume: 1
            }, {
                src: "shady-guy/mate-2.ogg",
                volume: 1
            }]
        }, {
            sounds: [{
                src: "shady-guy/nani.ogg",
                volume: 1
            }, {
                src: "shady-guy/nani-2.ogg",
                volume: 1
            }, {
                src: "shady-guy/nani-3.ogg",
                volume: 1
            }]
        }, {
            sounds: [{
                src: "shady-guy/nyehehe.ogg",
                volume: 1
            }]
        }
    ];
    sc.VA_CONFIG["antagonists.fancyguy"] = [{
            sounds: [{
                src: "apollo/cop.ogg",
                volume: 1
            }, {
                src: "apollo/cop-2.ogg",
                volume: 1
            }]
        }, {
            sounds: [{
                src: "apollo/hold-it.ogg",
                volume: 1
            }, {
                src: "apollo/hold-it-2.ogg",
                volume: 1
            }]
        }, {
            sounds: [{
                src: "apollo/hold-on.ogg",
                volume: 1
            }]
        }, {
            sounds: [{
                src: "apollo/objection.ogg",
                volume: 1
            }]
        }, {
            sounds: [{
                src: "apollo/stay-there.ogg",
                volume: 1
            }]
        }, {
            sounds: [{
                src: "apollo/wait-a-minute.ogg",
                volume: 1
            }, {
                src: "apollo/wait-a-minute-2.ogg",
                volume: 1
            }]
        },
        {
            sounds: [{
                src: "apollo/you-are-cheating.ogg",
                volume: 1
            }, {
                src: "apollo/you-cheater.ogg",
                volume: 1
            }],
            filter: {
                text: "cheat"
            }
        }, {
            sounds: [{
                src: "apollo/you-faker.ogg",
                volume: 1
            }]
        }, {
            sounds: [{
                src: "apollo/youre-no-real-spheromancer.ogg",
                volume: 1
            }]
        }
    ]
});
ig.baked = !0;

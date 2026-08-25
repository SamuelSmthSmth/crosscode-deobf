ig.module("game.feature.bgm.playlist").requires("impact.feature.bgm.bgm").defines(function() {
    ig.merge(ig.BGM_TRACK_LIST, {
        silence: null,
        tutorial: {
            path: "media/bgm/muCargohold.mp3",
            loopEnd: 124.364,
            volume: 0.5,
            introPath: "media/bgm/muCargohold-i.mp3",
            introEnd: 3.272
        },
        intro: {
            path: "media/bgm/muAwakened.mp3",
            loopEnd: 130.068,
            volume: 0.5
        },
        "short": {
            path: "media/bgm/short.mp3",
            loopEnd: 5,
            volume: 0.5
        },
        "tutorial-battle": {
            path: "media/bgm/muBattle1.mp3",
            loopEnd: 61.736,
            volume: 0.5,
            introPath: "media/bgm/muBattle1-i.mp3",
            introEnd: 0.385
        },
        challenge: {
            path: "media/bgm/muChallenge1.mp3",
            loopEnd: 89.6,
            volume: 0.5,
            introPath: "media/bgm/muChallenge1-i.mp3",
            introEnd: 2.8
        },
        title: {
            path: "media/bgm/muTitle.mp3",
            loopEnd: 36.099,
            volume: 0.5
        },
        "cargoship-exterior": {
            path: "media/bgm/muSolar.mp3",
            loopEnd: 93.658,
            volume: 0.5
        },
        lolfanfare: {
            path: "media/bgm/lolfanfare.mp3",
            loopEnd: 5.8,
            volume: 0.5
        },
        landmark: {
            path: "media/sound/hud/landmark-discovery.mp3",
            loopEnd: 3,
            volume: 0.5
        },
        "ability-got": {
            path: "media/bgm/ability-got.mp3",
            loopEnd: 1.5,
            volume: 0.5
        },
        exposition: {
            path: "media/bgm/muCrossworlds.mp3",
            loopEnd: 83.173,
            volume: 0.5
        },
        designer: {
            path: "media/bgm/muAvatar.mp3",
            loopEnd: 72,
            volume: 0.5,
            introPath: "media/bgm/muAvatar-i.mp3",
            introEnd: 6
        },
        challenge2: {
            path: "media/bgm/muChallenge2.mp3",
            loopEnd: 65.581,
            volume: 0.5,
            introPath: "media/bgm/muChallenge2-i.mp3",
            introEnd: 5.581
        },
        "puzzle-pg": {
            path: "media/bgm/puzzle-bgm.mp3",
            loopEnd: 81,
            volume: 0.5
        },
        bossbattle1: {
            path: "media/bgm/muBossbattle.mp3",
            loopEnd: 59.823,
            volume: 0.5,
            introPath: "media/bgm/muBossbattle-i.mp3",
            introEnd: 11.823
        },
        escape: {
            path: "media/bgm/muEscape.mp3",
            loopEnd: 55,
            volume: 0.5,
            introPath: "media/bgm/muEscape-i.mp3",
            introEnd: 2.666
        },
        crosscounter: {
            path: "media/bgm/muCrosscounter.mp3",
            loopEnd: 42.352,
            volume: 0.5,
            introPath: "media/bgm/muCrosscounter-i.mp3",
            introEnd: 8.823
        },
        oldHideout1: {
            path: "media/bgm/muMysterious.mp3",
            loopEnd: 42.666,
            volume: 0.5
        },
        oldHideoutBattle: {
            path: "media/bgm/muFiercebattle.mp3",
            loopEnd: 57.6,
            volume: 0.5,
            introPath: "media/bgm/muFiercebattle-i.mp3",
            introEnd: 2.742
        },
        oldHideoutEnding: {
            path: "media/bgm/muDistantfuture.mp3",
            loopEnd: 27,
            volume: 0.5
        },
        autumnsRise: {
            path: "media/bgm/muAutumnsrise.mp3",
            loopEnd: 151.117,
            volume: 0.5
        },
        fieldBattle: {
            path: "media/bgm/muBattle2.mp3",
            loopEnd: 122.482,
            volume: 0.5
        },
        rhombusDungeon: {
            path: "media/bgm/muRhombusdungeon.mp3",
            loopEnd: 60,
            volume: 0.5
        },
        rookieHarbor: {
            path: "media/bgm/muRookie.mp3",
            loopEnd: 61.832,
            volume: 0.5
        },
        firstScholars: {
            path: "media/bgm/muFirstscholars.mp3",
            loopEnd: 84.857,
            volume: 0.5
        },
        bergenTrail: {
            path: "media/bgm/muBergentrail.mp3",
            loopEnd: 81,
            volume: 0.5,
            introPath: "media/bgm/muBergentrail-i.mp3",
            introEnd: 8
        },
        rhombusSquare: {
            path: "media/bgm/muNewcomer.mp3",
            loopEnd: 64.477,
            volume: 0.5
        },
        apolloTheme: {
            path: "media/bgm/muApollo.mp3",
            loopEnd: 44.689,
            volume: 0.5,
            introPath: "media/bgm/muApollo-i.mp3",
            introEnd: 10.758
        },
        coldDungeon: {
            path: "media/bgm/muTemplemine.mp3",
            loopEnd: 83.076,
            volume: 0.5
        },
        bergenVillage: {
            path: "media/bgm/muBergenvillage.mp3",
            loopEnd: 98.331,
            volume: 0.5
        },
        heatArea: {
            path: "media/bgm/muMaroonvalley.mp3",
            loopEnd: 90.666,
            volume: 0.5
        },
        heatVillage: {
            path: "media/bgm/muBakiikum.mp3",
            loopEnd: 104.873,
            volume: 0.5
        },
        heatDungeon: {
            path: "media/bgm/muTemplevalley.mp3",
            loopEnd: 110.608,
            volume: 0.5
        },
        shockDungeon: {
            path: "media/bgm/muTemplethunder.mp3",
            loopEnd: 119.999,
            volume: 0.5
        },
        waveDungeon: {
            path: "media/bgm/muTemplelake.mp3",
            loopEnd: 130.487,
            volume: 0.5
        },
        treeDungeon: {
            path: "media/bgm/muTempletree.mp3",
            loopEnd: 110.769,
            volume: 0.5
        },
        jungle: {
            path: "media/bgm/muGarden.mp3",
            loopEnd: 112,
            volume: 0.5
        },
        emilie: {
            path: "media/bgm/muValse.mp3",
            loopEnd: 62.905,
            volume: 0.5,
            introPath: "media/bgm/muValse-i.mp3",
            introEnd: 2.167
        },
        basinKeep: {
            path: "media/bgm/muBasinkeep.mp3",
            loopEnd: 102.893,
            volume: 0.5
        },
        casual: {
            path: "media/bgm/muTravel.mp3",
            loopEnd: 60,
            volume: 0.5
        },
        briefing: {
            path: "media/bgm/muBriefing.mp3",
            loopEnd: 79.592,
            volume: 0.5
        },
        ponder: {
            path: "media/bgm/muImprovising.mp3",
            loopEnd: 100.285,
            volume: 0.5
        },
        lea: {
            path: "media/bgm/muLea.mp3",
            loopEnd: 122.465,
            volume: 0.5
        },
        "dreamsequence-intro": {
            path: "media/bgm/muDream1.mp3",
            loopEnd: 19.672,
            volume: 0.5
        },
        dreamsequence: {
            path: "media/bgm/muDream3.mp3",
            loopEnd: 137.704,
            volume: 0.5,
            introPath: "media/bgm/muDream2.mp3",
            introEnd: 19.672
        },
        sorrow: {
            path: "media/bgm/muShock.mp3",
            loopEnd: 87.887,
            volume: 0.5,
            introPath: "media/bgm/muShock-i.mp3",
            introEnd: 39.718
        },
        raidTheme: {
            path: "media/bgm/muRaid.mp3",
            loopEnd: 229.5,
            volume: 0.5,
            introPath: "media/bgm/muRaid-i.mp3",
            introEnd: 12.614
        },
        forestField: {
            path: "media/bgm/muSapphireridge.mp3",
            loopEnd: 105.404,
            volume: 0.5,
            introPath: "media/bgm/muSapphireridge-i.mp3",
            introEnd: 9.792
        },
        designerBoss1: {
            path: "media/bgm/muBlueavatar.mp3",
            loopEnd: 127.059,
            volume: 0.6,
            introPath: "media/bgm/muBlueavatar-i.mp3",
            introEnd: 25.038
        },
        waiting: {
            path: "media/bgm/muImprisoned.mp3",
            loopEnd: 108.845,
            volume: 0.5
        },
        aridField: {
            path: "media/bgm/muVermillion.mp3",
            loopEnd: 133.686,
            volume: 0.5
        },
        aridBattle: {
            path: "media/bgm/muBattle3.mp3",
            loopEnd: 104.728,
            volume: 0.5,
            introPath: "media/bgm/muBattle3-i.mp3",
            introEnd: 0.74
        },
        shizukaConfrontation: {
            path: "media/bgm/muConfrontation.mp3",
            loopEnd: 43.522,
            volume: 0.5,
            introPath: "media/bgm/muConfrontation-i.mp3",
            introEnd: 183.238
        },
        confrontationLoop: {
            path: "media/bgm/muConfrontation.mp3",
            loopEnd: 43.522,
            volume: 0.5
        },
        evoDungeon1: {
            path: "media/bgm/muVermillionDungeon.mp3",
            loopEnd: 80.842,
            volume: 0.5
        },
        evoDungeon2: {
            path: "media/bgm/muVermillionDungeon2.mp3",
            loopEnd: 91.579,
            volume: 0.5,
            introPath: "media/bgm/muVermillionDungeon2-i.mp3",
            introEnd: 1.578
        },
        evoEscape: {
            path: "media/bgm/muEscape2.mp3",
            loopEnd: 93.563,
            volume: 0.5,
            introPath: "media/bgm/muEscape2-i.mp3",
            introEnd: 9.376
        },
        sergeyExposition: {
            path: "media/bgm/muPastevents.mp3",
            loopEnd: 123.887,
            volume: 0.5
        },
        schneiderTour: {
            path: "media/bgm/muImprovising.mp3",
            loopEnd: 100.285,
            volume: 0.5
        },
        infiltration: {
            path: "media/bgm/muInfiltration.mp3",
            loopEnd: 113.777,
            volume: 0.5
        },
        sadness: {
            path: "media/bgm/muSadtheme.mp3",
            loopEnd: 106.751,
            volume: 0.5
        },
        oldHideout2: {
            path: "media/bgm/muOldhideout.mp3",
            loopEnd: 119.365,
            volume: 0.5
        },
        trueIntentions: {
            path: "media/bgm/muTrueintention.mp3",
            loopEnd: 164.383,
            volume: 0.5,
            introPath: "media/bgm/muTrueintention-i.mp3",
            introEnd: 0
        },
        rhombusSquare2: {
            path: "media/bgm/muRhombussquare.mp3",
            loopEnd: 124.956,
            volume: 0.5,
            introPath: "media/bgm/muRhombussquare-i.mp3",
            introEnd: 10.06
        },
        autumnsFall: {
            path: "media/bgm/muAutumnsfall.mp3",
            loopEnd: 132.954,
            volume: 0.5
        },
        snailBattle1: {
            path: "media/bgm/muExponential.mp3",
            loopEnd: 50.261,
            volume: 0.6,
            introPath: "media/bgm/muExponential-i.mp3",
            introEnd: 5.34
        },
        snailBattle2: {
            path: "media/bgm/muExponentialpart2.mp3",
            loopEnd: 130.68,
            volume: 0.6,
            introPath: "media/bgm/muExponentialpart2-i.mp3",
            introEnd: 2.513
        },
        lastDungeon: {
            path: "media/bgm/muVermillionDungeon3.mp3",
            loopEnd: 164.359,
            volume: 0.5
        },
        shizuka: {
            path: "media/bgm/muShizuka.mp3",
            loopEnd: 86.069,
            volume: 0.5,
            introPath: "media/bgm/muShizuka-i.mp3",
            introEnd: 15.967
        },
        finalBoss: {
            path: "media/bgm/muUltimate.mp3",
            loopEnd: 264.334,
            volume: 0.6,
            introPath: "media/bgm/muUltimate-i.mp3",
            introEnd: 32.792
        },
        credits: {
            introPath: "media/bgm/muEnding.mp3",
            introEnd: 244,
            path: "media/bgm/muLea.mp3",
            loopEnd: 122.465,
            volume: 0.5
        },
        credits2: {
            introPath: "media/bgm/muEnding.mp3",
            introEnd: 244,
            path: "media/bgm/silence.mp3",
            loopEnd: 122.465,
            volume: 0.5
        },
        arena: {
            introPath: "media/bgm/muArena-i.mp3",
            introEnd: 1.237,
            path: "media/bgm/muArena.mp3",
            loopEnd: 98.969,
            volume: 0.5
        },
        "s-rank": {
            introPath: "media/bgm/muSrank-i.mp3",
            introEnd: 16,
            path: "media/bgm/muSrank.mp3",
            loopEnd: 157.333,
            volume: 0.5
        },
        bossRush: {
            introPath: "media/bgm/muBossrush-i.mp3",
            introEnd: 1.434,
            path: "media/bgm/muBossrush.mp3",
            loopEnd: 154.182,
            volume: 0.5
        },
        glitchArea: {
            introPath: "media/bgm/muGlitch-i.mp3",
            introEnd: 30.629,
            path: "media/bgm/muGlitch.mp3",
            loopEnd: 82.137,
            volume: 0.5
        },
        evolabSubtle: {
            path: "media/bgm/evo-lab/evo-lab-subtle.mp3",
            loopEnd: 24,
            volume: 0.45
        },
        evolabMelody: {
            path: "media/bgm/evo-lab/evo-lab-melody.mp3",
            loopEnd: 24,
            volume: 0.5
        },
        evolabDissonant: {
            path: "media/bgm/evo-lab/evo-lab-dissonant.mp3",
            loopEnd: 32,
            volume: 0.5
        },
        evolabMid: {
            path: "media/bgm/evo-lab/evo-lab-mid.mp3",
            loopEnd: 24,
            volume: 0.5
        },
        evolabHeartbeat: {
            path: "media/bgm/evo-lab/evo-lab-heartbeat.mp3",
            loopEnd: 24,
            volume: 0.5
        },
        beach: {
            path: "media/bgm/muBeach.mp3",
            loopEnd: 96,
            volume: 0.5
        },
        finalDungeon: {
            path: "media/bgm/muFinalDungeon.mp3",
            loopEnd: 130.21,
            volume: 0.5
        },
        godBoss: {
            introPath: "media/bgm/muGodBattle-i.mp3",
            introEnd: 42.27,
            path: "media/bgm/muGodBattle.mp3",
            loopEnd: 190.78,
            volume: 0.5
        },
        discoLow: {
            path: "media/bgm/disco-low.mp3",
            loopEnd: 14.4,
            volume: 1
        },
        discoFull: {
            path: "media/bgm/disco-full.mp3",
            loopEnd: 14.4,
            volume: 1
        }
    });
    ig.Bgm.preloadStartTrack("title");
    ig.merge(ig.BGM_DEFAULT_TRACKS, {
        cargoShipIntro: {
            field: {
                track: "intro",
                volume: 1
            },
            battle: {
                track: "tutorial-battle",
                volume: 1
            },
            rankBattle: {
                track: "tutorial-battle",
                volume: 1
            },
            sRankBattle: {
                track: "s-rank",
                volume: 1
            }
        },
        cargoShip: {
            field: {
                track: "tutorial",
                volume: 1
            },
            battle: {
                track: "tutorial-battle",
                volume: 1
            },
            sRankBattle: {
                track: "s-rank",
                volume: 1
            }
        },
        cargoChallenge: {
            field: {
                track: "tutorial",
                volume: 1
            },
            battle: {
                track: "tutorial-battle",
                volume: 1
            },
            sRankBattle: {
                track: "s-rank",
                volume: 1
            }
        },
        cargoShipExterior: {
            field: {
                track: "cargoship-exterior",
                volume: 1
            },
            battle: {
                track: "tutorial-battle",
                volume: 1
            },
            sRankBattle: {
                track: "s-rank",
                volume: 1
            }
        },
        puzzle: {
            field: {
                track: "rhombusDungeon",
                volume: 1
            },
            battle: {
                track: "tutorial-battle",
                volume: 1
            },
            sRankBattle: {
                track: "s-rank",
                volume: 1
            }
        },
        hideout: {
            field: {
                track: "oldHideout1",
                volume: 1
            },
            battle: {
                track: "oldHideoutBattle",
                volume: 1
            },
            sRankBattle: {
                track: "s-rank",
                volume: 1
            }
        },
        hideout2: {
            field: {
                track: "oldHideout2",
                volume: 1
            },
            battle: {
                track: "oldHideoutBattle",
                volume: 1
            },
            sRankBattle: {
                track: "s-rank",
                volume: 1
            }
        },
        forest: {
            field: {
                track: "forestField",
                volume: 1
            },
            battle: {
                track: "tutorial-battle",
                volume: 1
            },
            rankBattle: {
                track: "fieldBattle",
                volume: 1
            },
            sRankBattle: {
                track: "s-rank",
                volume: 1
            }
        },
        autumn: {
            field: {
                track: "autumnsRise",
                volume: 1
            },
            battle: {
                track: "tutorial-battle",
                volume: 1
            },
            rankBattle: {
                track: "fieldBattle",
                volume: 1
            },
            sRankBattle: {
                track: "s-rank",
                volume: 1
            }
        },
        autumnsFall: {
            field: {
                track: "autumnsFall",
                volume: 1
            },
            battle: {
                track: "tutorial-battle",
                volume: 1
            },
            rankBattle: {
                track: "fieldBattle",
                volume: 1
            },
            sRankBattle: {
                track: "s-rank",
                volume: 1
            }
        },
        rookieHarbor: {
            field: {
                track: "rookieHarbor",
                volume: 1
            },
            battle: {
                track: "tutorial-battle",
                volume: 1
            },
            rankBattle: {
                track: "fieldBattle",
                volume: 1
            },
            sRankBattle: {
                track: "s-rank",
                volume: 1
            }
        },
        firstScholars: {
            field: {
                track: "firstScholars",
                volume: 1
            },
            battle: {
                track: "tutorial-battle",
                volume: 1
            },
            rankBattle: {
                track: "fieldBattle",
                volume: 1
            },
            sRankBattle: {
                track: "s-rank",
                volume: 1
            }
        },
        bergenTrail: {
            field: {
                track: "bergenTrail",
                volume: 1
            },
            battle: {
                track: "tutorial-battle",
                volume: 1
            },
            rankBattle: {
                track: "fieldBattle",
                volume: 1
            },
            sRankBattle: {
                track: "s-rank",
                volume: 1
            }
        },
        bergenVillage: {
            field: {
                track: "bergenVillage",
                volume: 1
            },
            battle: {
                track: "tutorial-battle",
                volume: 1
            },
            rankBattle: {
                track: "fieldBattle",
                volume: 1
            },
            sRankBattle: {
                track: "s-rank",
                volume: 1
            }
        },
        heatArea: {
            field: {
                track: "heatArea",
                volume: 1
            },
            battle: {
                track: "tutorial-battle",
                volume: 1
            },
            rankBattle: {
                track: "fieldBattle",
                volume: 1
            },
            sRankBattle: {
                track: "s-rank",
                volume: 1
            }
        },
        rhombusSquare: {
            field: {
                track: "rhombusSquare",
                volume: 1
            },
            battle: {
                track: "tutorial-battle",
                volume: 1
            },
            rankBattle: {
                track: "fieldBattle",
                volume: 1
            },
            sRankBattle: {
                track: "s-rank",
                volume: 1
            }
        },
        rhombusSquare2: {
            field: {
                track: "rhombusSquare2",
                volume: 1
            },
            battle: {
                track: "tutorial-battle",
                volume: 1
            },
            rankBattle: {
                track: "fieldBattle",
                volume: 1
            },
            sRankBattle: {
                track: "s-rank",
                volume: 1
            }
        },
        rhombusSquareArena: {
            field: {
                track: "arena",
                volume: 1
            },
            battle: {
                track: "tutorial-battle",
                volume: 1
            },
            rankBattle: {
                track: "fieldBattle",
                volume: 1
            },
            sRankBattle: {
                track: "s-rank",
                volume: 1
            }
        },
        crossCentral: {
            field: {
                track: "intro",
                volume: 1
            },
            battle: {
                track: "tutorial-battle",
                volume: 1
            },
            rankBattle: {
                track: "fieldBattle",
                volume: 1
            },
            sRankBattle: {
                track: "s-rank",
                volume: 1
            }
        },
        coldDungeon: {
            field: {
                track: "coldDungeon",
                volume: 1
            },
            battle: {
                track: "tutorial-battle",
                volume: 1
            },
            rankBattle: {
                track: "fieldBattle",
                volume: 1
            },
            sRankBattle: {
                track: "s-rank",
                volume: 1
            }
        },
        heatVillage: {
            field: {
                track: "heatVillage",
                volume: 1
            },
            battle: {
                track: "tutorial-battle",
                volume: 1
            },
            rankBattle: {
                track: "fieldBattle",
                volume: 1
            },
            sRankBattle: {
                track: "s-rank",
                volume: 1
            }
        },
        heatGlitch: {
            field: {
                track: "glitchArea",
                volume: 1
            },
            battle: {
                track: "tutorial-battle",
                volume: 1
            },
            rankBattle: {
                track: "fieldBattle",
                volume: 1
            },
            sRankBattle: {
                track: "s-rank",
                volume: 1
            }
        },
        heatDungeonOutside: {
            field: {
                track: null,
                volume: 0.3
            },
            battle: {
                track: "tutorial-battle",
                volume: 1
            },
            rankBattle: {
                track: "fieldBattle",
                volume: 1
            },
            sRankBattle: {
                track: "s-rank",
                volume: 1
            }
        },
        silence: {
            field: {
                track: null,
                volume: 0.3
            },
            battle: {
                track: "tutorial-battle",
                volume: 1
            },
            rankBattle: {
                track: "fieldBattle",
                volume: 1
            },
            sRankBattle: {
                track: "s-rank",
                volume: 1
            }
        },
        silenceCombat: {
            field: {
                track: null,
                volume: 0.3
            },
            battle: {
                track: null,
                volume: 1
            }
        },
        heatDungeon: {
            field: {
                track: "heatDungeon",
                volume: 1
            },
            battle: {
                track: "tutorial-battle",
                volume: 1
            },
            rankBattle: {
                track: "fieldBattle",
                volume: 1
            },
            sRankBattle: {
                track: "s-rank",
                volume: 1
            }
        },
        jungle: {
            field: {
                track: "jungle",
                volume: 1
            },
            battle: {
                track: "tutorial-battle",
                volume: 1
            },
            rankBattle: {
                track: "fieldBattle",
                volume: 1
            },
            sRankBattle: {
                track: "s-rank",
                volume: 1
            }
        },
        basinKeep: {
            field: {
                track: "basinKeep",
                volume: 1
            },
            battle: {
                track: "tutorial-battle",
                volume: 1
            },
            rankBattle: {
                track: "fieldBattle",
                volume: 1
            },
            sRankBattle: {
                track: "s-rank",
                volume: 1
            }
        },
        shockDungeon: {
            field: {
                track: "shockDungeon",
                volume: 1
            },
            battle: {
                track: "tutorial-battle",
                volume: 1
            },
            rankBattle: {
                track: "fieldBattle",
                volume: 1
            },
            sRankBattle: {
                track: "s-rank",
                volume: 1
            }
        },
        waveDungeon: {
            field: {
                track: "waveDungeon",
                volume: 1
            },
            battle: {
                track: "tutorial-battle",
                volume: 1
            },
            rankBattle: {
                track: "fieldBattle",
                volume: 1
            },
            sRankBattle: {
                track: "s-rank",
                volume: 1
            }
        },
        treeDungeon: {
            field: {
                track: "treeDungeon",
                volume: 1
            },
            battle: {
                track: "tutorial-battle",
                volume: 1
            },
            rankBattle: {
                track: "fieldBattle",
                volume: 1
            },
            sRankBattle: {
                track: "s-rank",
                volume: 1
            }
        },
        arid: {
            field: {
                track: "aridField",
                volume: 1
            },
            battle: {
                track: "aridBattle",
                volume: 1
            }
        },
        aridLab: {
            field: {
                track: null,
                volume: 1
            },
            battle: {
                track: "aridBattle",
                volume: 1
            }
        },
        aridDng: {
            field: {
                track: "evoDungeon1",
                volume: 1
            },
            battle: {
                track: "aridBattle",
                volume: 1
            }
        },
        lastDng: {
            field: {
                track: "lastDungeon",
                volume: 1
            },
            battle: {
                track: "aridBattle",
                volume: 1
            }
        },
        lab: {
            field: {
                track: "coldDungeon",
                volume: 1
            },
            battle: {
                track: "tutorial-battle",
                volume: 1
            },
            rankBattle: {
                track: "fieldBattle",
                volume: 1
            },
            sRankBattle: {
                track: "s-rank",
                volume: 1
            }
        },
        evoVillage: {
            field: {
                track: "rookieHarbor",
                volume: 1
            },
            battle: {
                track: "tutorial-battle",
                volume: 1
            },
            rankBattle: {
                track: "fieldBattle",
                volume: 1
            },
            sRankBattle: {
                track: "s-rank",
                volume: 1
            }
        },
        finalDng: {
            field: {
                track: "finalDungeon",
                volume: 1
            },
            battle: {
                track: "aridBattle",
                volume: 1
            }
        },
        finalDngEnd: {
            field: {
                track: "exposition",
                volume: 0.8
            },
            battle: {
                track: "aridBattle",
                volume: 1
            }
        },
        beach: {
            field: {
                track: "beach",
                volume: 1
            },
            battle: {
                track: "tutorial-battle",
                volume: 1
            },
            rankBattle: {
                track: "fieldBattle",
                volume: 1
            },
            sRankBattle: {
                track: "s-rank",
                volume: 1
            }
        },
        disco: {
            field: {
                track: "discoLow",
                volume: 1
            },
            battle: {
                track: "aridBattle",
                volume: 1
            }
        }
    })
});
ig.baked = !0;

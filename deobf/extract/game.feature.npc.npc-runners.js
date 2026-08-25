ig.module("game.feature.npc.npc-runners").requires("impact.base.game").defines(function() {
    sc.NPC_RUNNER_GROUP = {};
    var b = [{
        name: "cross-worlds.triblader-male-blue",
        prob: 1
    }, {
        name: "cross-worlds.triblader-female-purple",
        prob: 1
    }, {
        name: "cross-worlds.hexacast-male-dark",
        prob: 1
    }, {
        name: "cross-worlds.hexacast-male-red",
        prob: 1
    }, {
        name: "cross-worlds.pentafist-male-dark",
        prob: 1
    }, {
        name: "cross-worlds.pentafist-female-rasta",
        prob: 1
    }, {
        name: "cross-worlds.quadroguard-female-gray",
        prob: 1
    }, {
        name: "cross-worlds.quadroguard-male-black",
        prob: 1
    }, {
        name: "cross-worlds.sphero-female-green",
        prob: 0.25
    }, {
        name: "cross-worlds.sphero-male-brown",
        prob: 0.25
    }];
    sc.NPC_RUNNER_GROUP.CROSSCENTRAL = {
        characters: b,
        npcsPerMinute: 80,
        maxParty: 3,
        runProb: 0.5
    };
    sc.NPC_RUNNER_GROUP.RHOMBUS_SQUARE = {
        characters: b,
        npcsPerMinute: 40,
        maxParty: 3,
        runProb: 0.4
    };
    sc.NPC_RUNNER_GROUP.CROWDED = {
        characters: b,
        npcsPerMinute: 20,
        maxParty: 3,
        runProb: 0.2
    };
    sc.NPC_RUNNER_GROUP.LIVELY = {
        characters: b,
        npcsPerMinute: 10,
        maxParty: 3,
        runProb: 0.3
    };
    sc.NPC_RUNNER_GROUP.REGULAR = {
        characters: b,
        npcsPerMinute: 6,
        maxParty: 2,
        runProb: 0.5
    };
    sc.NPC_RUNNER_GROUP.FEW = {
        characters: b,
        npcsPerMinute: 2,
        maxParty: 2,
        runProb: 0.5
    };
    sc.NPC_RUNNER_DEST_TYPE = {
        ENTER: 1,
        EXIT: 2,
        ENTER_EXIT: 3
    };
    sc.NPC_RUNNER_DEST_POS_TYPE = {
        CENTER: 1,
        SIDE: 2
    };
    sc.NpcRunnerSpawner = ig.GameAddon.extend({
        mapGroup: null,
        currentGroup: null,
        groupData: null,
        lastChars: [],
        active: false,
        destinations: {
            enter: [],
            enterFullProb: 0,
            exit: [],
            exitFullProb: 0
        },
        timer: 0,
        spawnTeamCount: 0,
        currentPartySize: 0,
        spawnEntrance: null,
        waypoints: null,
        spawnExit: null,
        spawnSpeed: 0,
        init: function() {
            this.parent("NPC Runners")
        },
        cancelSpawning: function() {
            this.spawnTeamCount = 0;
            this.spawnExit = this.spawnEntrance = null;
            this.lastChars.length = 0
        },
        setGroup: function(a) {
            if (this.currentGroup != a) {
                this.currentGroup && this.clearGroup();
                this.currentGroup = a;
                this.cancelSpawning();
                if (this.currentGroup) {
                    this.groupData = {
                        characters: [],
                        fullProb: 0,
                        maxTimer: 60 / this.currentGroup.npcsPerMinute
                    };
                    for (var a = this.currentGroup.characters, b = 0; b < a.length; ++b) {
                        var c = a[b],
                            e = {
                                character: new sc.Character(c.name),
                                animSheet: null,
                                prob: c.prob,
                                maxSpeed: c.speed || 0
                            };
                        this.groupData.characters.push(e);
                        this.groupData.fullProb = this.groupData.fullProb + c.prob;
                        e.character.addLoadListener(this)
                    }
                    this.timer = this.groupData.maxTimer * (0.05 + Math.random() * 0.1)
                }
            }
        },
        onLoadableComplete: function(a, b) {
            for (var c = this.groupData.characters, e = c.length; e--;)
                if (c[e].character == b) c[e].animSheet = new ig.AnimationSheet(b.data.animSheet)
        },
        hasGroup: function() {
            return !!this.groupData
        },
        resetToMapGroup: function() {
            this.setGroup(this.mapGroup)
        },
        clearGroup: function() {
            if (this.groupData) {
                for (var a = this.groupData.characters,
                        b = a.length; b--;) {
                    var c = a[b];
                    c.character.decreaseRef();
                    c.animSheet.decreaseRef()
                }
                this.groupData = this.currentGroup = null
            }
        },
        initWayPoints: function() {
            for (var a = ig.game.getEntitiesByType("NPCWaypoint"), b = a.length; b--;) a[b].initWayPoints();
            sc.NpcWayPointSearcher.resetIndex()
        },
        searchDestinations: function() {
            this.destinations.enter.length = 0;
            this.destinations.exit.length = 0;
            this.destinations.enterFullProb = 0;
            this.destinations.exitFullProb = 0;
            for (var a = ig.game.entities, b = a.length; b--;) {
                var c = a[b];
                if (c && c.getRunnerDestination) {
                    var e =
                        c.getRunnerDestination();
                    if (e) {
                        for (var f = 0, g = e.entries.length; g--;) f = f | e.entries[g].type;
                        e.type = f;
                        e.entity = c;
                        if (e.enterProb && f & sc.NPC_RUNNER_DEST_TYPE.ENTER) {
                            this.destinations.enter.push(e);
                            this.destinations.enterFullProb = this.destinations.enterFullProb + e.enterProb
                        }
                        if (e.exitProb && f & sc.NPC_RUNNER_DEST_TYPE.EXIT) {
                            this.destinations.exit.push(e);
                            this.destinations.exitFullProb = this.destinations.exitFullProb + e.exitProb
                        }
                    }
                }
            }
            this.active = this.destinations.enter.length > 0 && this.destinations.exit.length > 0;
            if (this.destinations.enter.length ==
                1 && this.destinations.exit.length == 1 && this.destinations.enter[0] == this.destinations.exit[0]) this.active = false
        },
        spawnNpcGroup: function() {
            this.spawnEntrance = this.getRandomDestination(false, null);
            this.spawnExit = this.getRandomDestination(true, this.spawnEntrance);
            this.waypoints = this.getWayPoints(this.spawnEntrance.entity, this.spawnExit.entity);
            var a = Math.random();
            this.currentPartySize = this.spawnTeamCount = Math.ceil(Math.pow(a, 2) * this.currentGroup.maxParty);
            this.spawnSpeed = Math.random() <= this.currentGroup.runProb ?
                0.8 + Math.random() * 0.1 : 0.5 + Math.random() * 0.1;
            this.spawnNpcRunner()
        },
        spawnNpcRunner: function() {
            var a = this.spawnEntrance,
                b = this.spawnExit,
                c = this.getRandomCharacter();
            ig.game.spawnEntity(sc.NPCRunnerEntity, 0, 0, 0, {
                enter: a,
                exit: b,
                partyIdx: this.currentPartySize - this.spawnTeamCount,
                waypoints: this.waypoints,
                character: c.character,
                animSheet: c.animSheet,
                speed: c.speed || this.spawnSpeed
            });
            this.spawnTeamCount--
        },
        getRandomDestination: function(a, b) {
            var c = a ? this.destinations.exitFullProb : this.destinations.enterFullProb,
                e = a ? this.destinations.exit : this.destinations.enter;
            b && (c = c - (a ? b.exitProb : b.enterProb));
            for (var c = Math.random() * c, f = e.length; f--;) {
                var g = e[f];
                if (g != b) {
                    c = c - (a ? g.exitProb : g.enterProb);
                    if (c <= 0) return g
                }
            }
        },
        getWayPoints: function(a, b) {
            return sc.NpcWayPointSearcher.searchConnection(a.getWPConnect(), b.getWPConnect())
        },
        getRandomCharacter: function() {
            do
                for (var a, b = Math.random() * this.groupData.fullProb, c = this.groupData.characters, e = c.length; e--;) {
                    var f = c[e],
                        b = b - f.prob;
                    if (b <= 0) {
                        a = f;
                        break
                    }
                }
            while (this.lastChars.indexOf(a) !=
                -1);
            this.lastChars.push(a);
            this.lastChars.length > Math.floor(this.groupData.characters.length / 2) && this.lastChars.shift();
            return a
        },
        preUpdateOrder: 100,
        onPreUpdate: function() {
            if (this.currentGroup && this.active && !sc.model.isCombatActive() && !ig.game.paused && !ig.loading) {
                this.timer = this.timer - ig.system.tick;
                if (this.timer <= 0) {
                    this.spawnTeamCount > 0 ? this.spawnNpcRunner() : this.spawnNpcGroup();
                    this.timer = this.spawnTeamCount ? 0.3 : this.groupData.maxTimer * (0.4 + Math.random() * 0.6)
                }
            }
        },
        levelLoadStartOrder: 120,
        onLevelLoadStart: function(a) {
            a =
                sc.NPC_RUNNER_GROUP[a.attributes && a.attributes.npcRunners] || null;
            this.cancelSpawning();
            this.mapGroup = a;
            this.setGroup(a)
        },
        levelLoadedOrder: 120,
        onLevelLoaded: function() {
            this.initWayPoints();
            this.searchDestinations()
        },
        onReset: function() {
            this.clearGroup()
        }
    });
    ig.addGameAddon(function() {
        return sc.npcRunner = new sc.NpcRunnerSpawner
    })
});
ig.baked = !0;

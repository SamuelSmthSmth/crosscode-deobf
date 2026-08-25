/**
 * game.feature.npc.npc-runners
 * ============================
 * Deobfuscated reference — documentation only, not executed.
 * Source module: `assets/js/game.compiled.js` → `ig.module("game.feature.npc.npc-runners")`.
 *
 * NPC runner system: spawns background NPCs that walk between map
 * destinations (enter/exit points), giving areas a lived-in feel.
 * `sc.NpcRunnerSpawner` (exposed as `sc.npcRunner`) manages character
 * pools, destination pairings, waypoint paths, and per-minute spawn rates
 * configured via `sc.NPC_RUNNER_GROUP` presets.
 */
ig.module("game.feature.npc.npc-runners").requires(
    "impact.base.game"
).defines(function () {

    /* ── Character pool used by all runner groups ────────────────── */

    var defaultCharacters = [{
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

    /* ── Preset spawner groups (npcRunners map attribute) ────────── */

    sc.NPC_RUNNER_GROUP = {};

    sc.NPC_RUNNER_GROUP.CROSSCENTRAL = {
        characters: defaultCharacters,
        npcsPerMinute: 80,
        maxParty: 3,
        runProb: 0.5
    };
    sc.NPC_RUNNER_GROUP.RHOMBUS_SQUARE = {
        characters: defaultCharacters,
        npcsPerMinute: 40,
        maxParty: 3,
        runProb: 0.4
    };
    sc.NPC_RUNNER_GROUP.CROWDED = {
        characters: defaultCharacters,
        npcsPerMinute: 20,
        maxParty: 3,
        runProb: 0.2
    };
    sc.NPC_RUNNER_GROUP.LIVELY = {
        characters: defaultCharacters,
        npcsPerMinute: 10,
        maxParty: 3,
        runProb: 0.3
    };
    sc.NPC_RUNNER_GROUP.REGULAR = {
        characters: defaultCharacters,
        npcsPerMinute: 6,
        maxParty: 2,
        runProb: 0.5
    };
    sc.NPC_RUNNER_GROUP.FEW = {
        characters: defaultCharacters,
        npcsPerMinute: 2,
        maxParty: 2,
        runProb: 0.5
    };

    /* ── Destination flags ───────────────────────────────────────── */

    sc.NPC_RUNNER_DEST_TYPE = {
        ENTER: 1,
        EXIT: 2,
        ENTER_EXIT: 3
    };

    sc.NPC_RUNNER_DEST_POS_TYPE = {
        CENTER: 1,
        SIDE: 2
    };

    /* ── sc.NpcRunnerSpawner ─────────────────────────────────────── */

    sc.NpcRunnerSpawner = ig.GameAddon.extend({
        mapGroup: null,
        currentGroup: null,
        groupData: null,

        /** Cyclic buffer to avoid repeating the same character too often. */
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

        init: function () {
            this.parent("NPC Runners");
        },

        cancelSpawning: function () {
            this.spawnTeamCount = 0;
            this.spawnExit = this.spawnEntrance = null;
            this.lastChars.length = 0;
        },

        /**
         * Switch to a new runner group. Preloads all characters and
         * resets the spawn timer. Passing null disables runners.
         * @param {object|null} group — an sc.NPC_RUNNER_GROUP entry
         */
        setGroup: function (group) {
            if (this.currentGroup != group) {
                this.currentGroup && this.clearGroup();
                this.currentGroup = group;
                this.cancelSpawning();

                if (this.currentGroup) {
                    this.groupData = {
                        characters: [],
                        fullProb: 0,
                        maxTimer: 60 / this.currentGroup.npcsPerMinute
                    };
                    for (var i = 0; i < this.currentGroup.characters.length; ++i) {
                        var charTmpl = this.currentGroup.characters[i];
                        var entry = {
                            character: new sc.Character(charTmpl.name),
                            animSheet: null,
                            prob: charTmpl.prob,
                            maxSpeed: charTmpl.speed || 0
                        };
                        this.groupData.characters.push(entry);
                        this.groupData.fullProb += charTmpl.prob;
                        entry.character.addLoadListener(this);
                    }
                    this.timer = this.groupData.maxTimer * (0.05 + Math.random() * 0.1);
                }
            }
        },

        /**
         * Load-listener: when a character finishes loading, set up its
         * animation sheet for NPC runner entities.
         */
        onLoadableComplete: function (success, loadable) {
            for (var i = this.groupData.characters.length; i--;) {
                if (this.groupData.characters[i].character == loadable) {
                    this.groupData.characters[i].animSheet = new ig.AnimationSheet(loadable.data.animSheet);
                }
            }
        },

        hasGroup: function () {
            return !!this.groupData;
        },

        resetToMapGroup: function () {
            this.setGroup(this.mapGroup);
        },

        /** Release all character and anim-sheet references. */
        clearGroup: function () {
            if (this.groupData) {
                for (var i = this.groupData.characters.length; i--;) {
                    var entry = this.groupData.characters[i];
                    entry.character.decreaseRef();
                    entry.animSheet.decreaseRef();
                }
                this.groupData = this.currentGroup = null;
            }
        },

        /** Resolve all map waypoint connections on level load. */
        initWayPoints: function () {
            var waypoints = ig.game.getEntitiesByType("NPCWaypoint");
            for (var i = waypoints.length; i--;) waypoints[i].initWayPoints();
            sc.NpcWayPointSearcher.resetIndex();
        },

        /**
         * Scan the map for entities that return a runner destination
         * and build the enter/exit destination pools with weighted
         * probabilities.
         */
        searchDestinations: function () {
            this.destinations.enter.length = 0;
            this.destinations.exit.length = 0;
            this.destinations.enterFullProb = 0;
            this.destinations.exitFullProb = 0;

            for (var i = ig.game.entities.length; i--;) {
                var entity = ig.game.entities[i];
                if (entity && entity.getRunnerDestination) {
                    var dest = entity.getRunnerDestination();
                    if (dest) {
                        var typeMask = 0;
                        for (var k = dest.entries.length; k--;) {
                            typeMask |= dest.entries[k].type;
                        }
                        dest.type = typeMask;
                        dest.entity = entity;

                        if (dest.enterProb && typeMask & sc.NPC_RUNNER_DEST_TYPE.ENTER) {
                            this.destinations.enter.push(dest);
                            this.destinations.enterFullProb += dest.enterProb;
                        }
                        if (dest.exitProb && typeMask & sc.NPC_RUNNER_DEST_TYPE.EXIT) {
                            this.destinations.exit.push(dest);
                            this.destinations.exitFullProb += dest.exitProb;
                        }
                    }
                }
            }

            // Must have at least one distinct enter and one distinct exit.
            this.active = this.destinations.enter.length > 0 && this.destinations.exit.length > 0;
            if (this.destinations.enter.length == 1 &&
                this.destinations.exit.length == 1 &&
                this.destinations.enter[0] == this.destinations.exit[0]) {
                this.active = false;
            }
        },

        /** Pick an enter/exit pair, find a path, and start spawning a party. */
        spawnNpcGroup: function () {
            this.spawnEntrance = this.getRandomDestination(false, null);
            this.spawnExit = this.getRandomDestination(true, this.spawnEntrance);
            this.waypoints = this.getWayPoints(this.spawnEntrance.entity, this.spawnExit.entity);

            var roll = Math.random();
            this.currentPartySize = this.spawnTeamCount =
                Math.ceil(Math.pow(roll, 2) * this.currentGroup.maxParty);
            this.spawnSpeed = Math.random() <= this.currentGroup.runProb
                ? 0.8 + Math.random() * 0.1
                : 0.5 + Math.random() * 0.1;

            this.spawnNpcRunner();
        },

        /** Spawn one NPC runner entity and decrement the team counter. */
        spawnNpcRunner: function () {
            var entrance = this.spawnEntrance;
            var exit = this.spawnExit;
            var charEntry = this.getRandomCharacter();

            ig.game.spawnEntity(sc.NPCRunnerEntity, 0, 0, 0, {
                enter: entrance,
                exit: exit,
                partyIdx: this.currentPartySize - this.spawnTeamCount,
                waypoints: this.waypoints,
                character: charEntry.character,
                animSheet: charEntry.animSheet,
                speed: charEntry.speed || this.spawnSpeed
            });

            this.spawnTeamCount--;
        },

        /**
         * Weighted random pick from the enter or exit pool.
         * @param {boolean} isExit
         * @param {object} exclude — a destination to exclude (so we don't pick the same one)
         */
        getRandomDestination: function (isExit, exclude) {
            var fullProb = isExit ? this.destinations.exitFullProb : this.destinations.enterFullProb;
            var list = isExit ? this.destinations.exit : this.destinations.enter;

            if (exclude) {
                fullProb -= isExit ? exclude.exitProb : exclude.enterProb;
            }

            var roll = Math.random() * fullProb;
            for (var i = list.length; i--;) {
                var candidate = list[i];
                if (candidate != exclude) {
                    roll -= isExit ? candidate.exitProb : candidate.enterProb;
                    if (roll <= 0) return candidate;
                }
            }
        },

        /** @returns {Array<ig.Entity>|null} waypoint path from enter entity to exit entity */
        getWayPoints: function (enter, exit) {
            return sc.NpcWayPointSearcher.searchConnection(
                enter.getWPConnect(),
                exit.getWPConnect()
            );
        },

        /**
         * Weighted random character selection with cyclic LRU deduplication.
         * @returns {object} character pool entry
         */
        getRandomCharacter: function () {
            var picked;
            do {
                var roll = Math.random() * this.groupData.fullProb;
                for (var i = this.groupData.characters.length; i--;) {
                    var entry = this.groupData.characters[i];
                    roll -= entry.prob;
                    if (roll <= 0) {
                        picked = entry;
                        break;
                    }
                }
            } while (this.lastChars.indexOf(picked) != -1);

            this.lastChars.push(picked);
            if (this.lastChars.length > Math.floor(this.groupData.characters.length / 2)) {
                this.lastChars.shift();
            }
            return picked;
        },

        preUpdateOrder: 100,
        onPreUpdate: function () {
            if (this.currentGroup && this.active &&
                !sc.model.isCombatActive() && !ig.game.paused && !ig.loading) {

                this.timer -= ig.system.tick;
                if (this.timer <= 0) {
                    if (this.spawnTeamCount > 0) {
                        this.spawnNpcRunner();
                    } else {
                        this.spawnNpcGroup();
                    }
                    this.timer = this.spawnTeamCount
                        ? 0.3
                        : this.groupData.maxTimer * (0.4 + Math.random() * 0.6);
                }
            }
        },

        levelLoadStartOrder: 120,
        onLevelLoadStart: function (levelData) {
            var group = sc.NPC_RUNNER_GROUP[
                levelData.attributes && levelData.attributes.npcRunners
            ] || null;
            this.cancelSpawning();
            this.mapGroup = group;
            this.setGroup(group);
        },

        levelLoadedOrder: 120,
        onLevelLoaded: function () {
            this.initWayPoints();
            this.searchDestinations();
        },

        onReset: function () {
            this.clearGroup();
        }
    });

    /* ── Register the singleton addon ────────────────────────────── */

    ig.addGameAddon(function () {
        return sc.npcRunner = new sc.NpcRunnerSpawner;
    });
});
ig.baked = !0;
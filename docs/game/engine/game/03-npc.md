# game.feature.npc — NPCs

> **Status**: core · 8 modules in `deobf/clean/game.feature.npc.*`.
> Covers `ig.ENTITY.NPC`, the shared `sc.SCActor` base, the waypoint
> graph + autonomous \"runner\" pedestrians, the NPC display GUI and the
> NPC step library.

## Modules & classes

| Module | Key classes | Responsibility |
|---|---|---|
| `npc.entities.sc-actor` | `sc.SCActor` (extends `ig.ActorEntity`), `sc.ACTOR_SOUND`, `sc.ACTOR_DUST` | Base class for all NPC/actor-type entities: terrain-aware step sounds, dust effects on landing, navigation path tracking, `ig.Influencer` element/status handling |
| `npc.entities.npc-entity` | `ig.ENTITY.NPC`, `sc.NpcState` | The main NPC entity: actor backed by a `sc.Character` definition with multiple state pages gated by var conditions; interaction (talk/shop/trade/arena/quest), xeno-dialog bubbles, door-based enter/leave, per-state map-interact icons |
| `npc.npc-runners` | `sc.NpcRunnerSpawner` (`sc.npcRunner`), `sc.NPC_RUNNER_GROUP` | Background pedestrian system: character pools, destination pairings, waypoint paths, per-minute spawn rates |
| `npc.entities.npc-runner-entity` | `sc.NPCRunnerEntity` | Lightweight NPC spawned by the runner spawner: walks between map destinations via waypoints, killed off-screen or on water contact |
| `npc.entities.npc-waypoint` | `sc.WPConnection`, `sc.NpcWayPointSearcher`, `ig.ENTITY.NPCWaypoint` | Waypoint graph: A* over waypoint-endowed entities (used by runners); map-placed waypoint entity builds the connections |
| `npc.gui.npc-display-gui` | `sc.NPCDisplayGui` | Renders an NPC character's idle/specified animation in a private game-state view (dialogue portraits); supports effect playback |
| `npc.npc-steps` | EVENT: `DO_THE_SHAKE`, `RESET_NPC`, `SET_NPC_RUNNERS`, `RESET_NPC_RUNNERS`, `SET_NPC_CONFIG` · ACTION: `RESET_NPC`, `APPLY_NPC_CONFIG` | Event/action steps for NPC control |
| `npc.plug-in` | — | Entry point: registers the editor module + `npcRunners` map attribute |

## Behavior

- **`sc.SCActor`** is the base for NPCs, party members and other actor
  entities: terrain-aware footstep sounds (`sc.ACTOR_SOUND`), dust effects
  (`sc.ACTOR_DUST`), navigation path tracking and `ig.Influencer`
  element/status handling.
- **`ig.ENTITY.NPC`** is state-driven: an NPC's `sc.Character` definition
  provides multiple state pages, each gated by an `ig.VarCondition`
  (e.g. after a quest flag). Per state, the NPC changes its animation,
  interaction icon (talk/shop/trade/arena/quest) and optionally shows a
  xeno-dialog bubble ([xeno-dialogs](../../data/formats/12-lang.md)-adjacent
  subsystem) or walks through doors.
- **NPC runners** give areas background life: `sc.NpcRunnerSpawner`
  (exposed as `sc.npcRunner`) picks characters from `sc.NPC_RUNNER_GROUP`
  presets and spawns `sc.NPCRunnerEntity` walkers that travel enter→exit
  destinations through the waypoint graph (A* via `sc.NpcWayPointSearcher`).
- **`sc.NPCDisplayGui`** renders an NPC character animation standalone —
  used for dialogue portraits and character displays in menus.

## Hooks & steps

- EVENT/ACTION_STEP registrations in `npc-steps` (`DO_THE_SHAKE`,
  `SET_NPC_RUNNERS`, `RESET_NPC`, `SET_NPC_CONFIG`, `APPLY_NPC_CONFIG`…).
- NPC definitions live in `assets/data/characters/npc/*`
  ([CHARACTER format](../../data/formats/04-character.md)); interactions
  open dialogues ([msg](07-msg.md)), shops/trade ([trade](11-trade.md)),
  arenas ([arena](12-arena.md)) and quests ([quest](08-quest.md)) through
  `game.feature.interact` ([interact](17-interact.md)).

## Related

- [party](04-party.md) · [msg](07-msg.md) · [interact](17-interact.md)
- Engine: [impact.feature.navigation](../../engine/impact/features/16-navigation.md),
  [impact.base.actor-entity](../../engine/impact/02-entities.md)
- Data: [CHARACTER format](../../data/formats/04-character.md)
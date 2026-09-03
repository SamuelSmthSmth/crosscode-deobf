# game.feature.arena — arena challenges

> **Status**: core · 15 modules in `deobf/clean/game.feature.arena.*`
> (9 core + 6 GUI). Covers `sc.Arena` (rounds, waves, scoring), cup data
> loading, score types, bonus objectives, challenges, crowd audio and the
> arena HUD overlays. Cup definitions live in
> `assets/data/arena/*` ([MISC format](../../data/formats/13-misc.md)).

## Modules & classes

| Module | Key classes | Responsibility |
|---|---|---|
| `arena.arena` | `sc.Arena` (GameAddon) | Core arena system: cup registration/loading, runtime state (rounds, waves, score, chain, player death), combat event listeners for scoring (kills, damage, shields, dodges…), spawn management, round lifecycle (start/end/death/next), bonus objectives, challenge modifiers, coins, trophies |
| `arena.arena-loadable` | `sc.ArenaCache`, `sc.CupAsset` | Loadable/cacheable cup assets: ArenaCache triggers loading of all cup data on arena entry; CupAsset fetches individual cup JSONs from `data/arena/` |
| `arena.arena-score-types` | `sc.ARENA_SCORE_TYPES` | All score-event point definitions: points awarded, whether it chains with the current chain, diminishing returns, bonus vs. penalty (mali) |
| `arena.arena-bonus-objectives` | Bonus objectives | Round-end bonus objectives: built-in (NO_DAMAGE, NO_ITEMS, PvP flawless) + configurable (effective damage, hit counter, time, combat arts, chain, items) |
| `arena.arena-challenges` | `sc.ARENA_CHALLENGES` | Challenge modifiers restricting player abilities (melee, ranged, dash, guard, arts, items, HP regen) + special rules (Lea Must Die, hazards, PvP, weapon adjustment) |
| `arena.arena-cheer` | `sc.ArenaCrowdCheerController` | Crowd reaction sounds: configurable applause/surprise pool with cooldown + variance |
| `arena.entities.arena-spawn` | `ig.ENTITY.ArenaSpawn` | Map-placed enemy spawn markers for arena rounds, with alignment config (left/center/right, top/center/bottom) |
| `arena.arena-steps` | EVENT/ACTION steps | Round control (start, end, spawn waves), score manipulation (add/remove score ignores, add scores), chain counter, open arena menu, enemy ignore lists |
| `arena.gui.arena-gui` | `ArenaPlayerDeathOverlay`, `ArenaRoundEndOverlay`, `ArenaChainHud` (Number/Digit), `ArenaChallengeOverlay` | In-round overlays: death, round end, chain counter, active challenges |
| `arena.gui.arena-round-gui` | `ArenaRoundEndButtons`, `ArenaCoinsHud`, `ArenaMedalHud`, `ArenaRoundEndHeader`, `ArenaSummary` + `Entry` | Round-end screen: buttons (rush/normal layouts), coins + medal HUDs, summary |
| `arena.gui.arena-start-gui` | `sc.ArenaRoundStartHud`, `ChallengeEntry` | Round-start banner with challenge icons |
| `arena.gui.arena-trophy-gui` | `sc.ArenaCupOverview`, `MedalEntry` | Cup result overlay with medals/trophy |
| `arena.gui.arena-rush-gui` | `sc.ArenaRushOverview` | Rush-mode score tally overlay |
| `arena.gui.arena-effect-display` | `sc.ArenaMedalEffect` | Medal/trophy effect display |
| `arena.plug-in` | — | Entry point + editor registration, step color rules |

## At a glance

| Task | Primary surface | Contract |
|---|---|---|
| Start a round | `START_ROUND` / `sc.Arena` | Cup/round state must be loaded first |
| Spawn a wave | `SPAWN_WAVE` / `ArenaSpawn` | Spawn markers and combat roster stay linked |
| Add score | `ADD_SCORE` / score types | Chain, decay, bonus, and penalty rules apply |
| Finish a round | `END_ROUND` | Objectives, medals, coins, and rewards resolve together |
| Add a challenge | `sc.ARENA_CHALLENGES` | Restrictions must be reflected in HUD and scoring |

```ts
sc.Arena.startRound?(cupId: string, roundIndex: number): void;
sc.Arena.addScore?(scoreType: string, amount?: number): void;
sc.Arena.endRound?(): void;
```

## Guardrails

- Do not award arena rewards by editing score/HUD state directly; let the arena
  lifecycle resolve objectives, medals, coins, and trophies.
- Do not reuse ordinary combat defeat handling without checking arena scoring,
  waves, respawn blockers, and round ownership.
- Keep cup/round ids and challenge definitions stable for high scores and saves.
- Test rush mode, player death, wave cleanup, bonus failure, and menu return.

## Behavior

- **`sc.Arena`** runs a cup: rounds of waves spawn from `ig.ENTITY.ArenaSpawn`
  markers, combat events (kills, damage, shields, dodges) feed `sc.ARENA_SCORE_TYPES`
  scoring — points chain, decay and accumulate into coins and trophies.
  Round end evaluates bonus objectives, and the rush variant tallies score
  over a time limit.
- **Challenges** (`sc.ARENA_CHALLENGES`) modify the run by toggling player
  core abilities (no melee, no items, HP regen off…) or applying special
  rules; the start/end overlays communicate them to the player.
- **Cup data** is JSON: `sc.CupAsset` loads `data/arena/*` cup files, and
  the arena menu ([menu](05-menu.md), `menu.gui.arena.*`) browses cups,
  rounds, medals and high scores.

## Hooks & steps

- EVENT/ACTION_STEP registrations in `arena-steps` (`START_ROUND`,
  `END_ROUND`, `SPAWN_WAVE`, `ADD_SCORE`, `RESET_CHAIN`, arena menu open…).
- Arena enemies reuse the combat engine ([combat](02-combat.md)); medal
  rewards feed the trophy/achievement system
  ([achievements](13-achievements.md)).

## Related

- [combat](02-combat.md) · [menu](05-menu.md) · [achievements](13-achievements.md)
- Data: [MISC format](../../data/formats/13-misc.md) (arena cups)
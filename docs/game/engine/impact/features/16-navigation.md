# impact.feature.navigation — navigation & pathfinding

> **Status**: core · Modules: `impact.feature.navigation.navigation`,
> `impact.feature.navigation.nav-map`, `impact.feature.navigation.navigation-steps`,
> `impact.feature.navigation.plug-in`.

## Module & class table

| Module | Key classes | Responsibility |
|---|---|---|
| `navigation.navigation` | `ig.Navigation` (singleton `ig.navigation`), `ig.NavPath`, `ig.NavBlocker`, `ig.NavExternalBlockers`, `ig.NAV_BLOCKER_TYPE`, `ig.NAV_DODGE_TYPE` | A* search over the current nav graph; path storage; blockers that carve the graph |
| `navigation.nav-map` | `ig.MAP.Navigation` (+ `levelKey`), `ig.PathNode`, `ig.PathNodeConnect`, `ig.NAV_CONNECTION_TYPE`, `ig.NAV_ENTITY_FLAG` | Per-map nav graph: node + connection layer, which entities block which nodes |
| `navigation.navigation-steps` | ACTION_STEP: `DO_NAVIGATION`, `NAVIGATE_TO_POINT`, `NAVIGATE_TO_TARGET`, `NAVIGATE_TO_ENTITY`, `NAVIGATE_DODGE`, `NAVIGATE_SIDEWAYS_TARGET`, `NAVIGATE_ESCAPE_TARGET`, `NAVIGATE_ESCAPE_ENTITY`, `NAVIGATE_RANGE_TARGET`, `CANCEL_IF_NAVIGATION_FAILED`, `SET_ATTRIB_NAV_TARGET_POS`, `SET_ATTRIB_CLOSE_TARGET_POS`, `SET_ATTRIB_TARGET_DELTA_POS` | Scriptable movement orders for AI actors |
| `navigation.plug-in` | — | Entry point + editor registration |

## At a glance

| Task | API / step | Contract |
|---|---|---|
| Find a route | `ig.navigation` / `DO_NAVIGATION` | Operates on the current map graph |
| Navigate to a point | `NAVIGATE_TO_POINT` | Point is map space |
| Navigate to an actor | `NAVIGATE_TO_TARGET` / `NAVIGATE_TO_ENTITY` | Replan as blockers/targets move |
| Cancel safely | `CANCEL_IF_NAVIGATION_FAILED` | Provide a fallback action/state |

```ts
ig.navigation.findPath?(from: Vec2, to: Vec2, options?: NavOptions): ig.NavPath;
```

## Guardrails

- Do not run pathfinding from a draw hook or once per rendered sprite.
- Do not mutate the nav graph without invalidating/rebuilding affected paths.
- Treat a failed path as a state transition; do not leave an actor waiting
  forever for a route that cannot exist.
- Keep navigation coordinates in map space and let the camera handle display
  conversion.

## Behavior

- Each map carries a **nav graph** (`ig.MAP.Navigation`): a network of
  `ig.PathNode`s connected by `ig.PathNodeConnect`s (connection types:
  jump, drop, teleport…). It is authored in the editor alongside the map
  data (`assets/data/maps/*`).
- `ig.Navigation` runs A* over the graph, caches paths (`ig.NavPath`),
  and replans when blockers change. `ig.NavBlocker` / `ig.NavExternalBlockers`
  are invisible entities (or external zones) that invalidate nodes so paths
  route around them; `ig.NAV_ENTITY_FLAG` marks which entity types block.
- **Dodging** (`NAVIGATE_DODGE`) is navigation-based: the actor paths to a
  point adjacent to the target, then dashes through — the mechanic behind
  player-dodge movement and enemy dodge attacks.

## Consumers

- Enemy AI, party-member follow behaviour, `sc.PlayerEntity` dodge
  movement, cutscene steps that order actors around. See
  [30-base.md](30-base.md) for the shared step system these build on.
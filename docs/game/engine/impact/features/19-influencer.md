# impact.feature.influencer — zone influences

> **Status**: core · Modules: `impact.feature.influencer.influencer`,
> `impact.feature.influencer.influencer-steps`, `impact.feature.influencer.plug-in`.

## Module & class table

| Module | Key classes | Responsibility |
|---|---|---|
| `influencer.influencer` | `ig.Influencer` (addon), `ig.InfluenceEntry`, `ig.InfluenceConnection`, `ig.InfluencerCallbacks` | Zone→entity influence graph: activates entries when entities enter zones |
| `influencer.influencer-steps` | ACTION_STEP: `ADD_TEMP_INFLUENCE`, `CLEAR_TEMP_INFLUENCE` | Scripted temporary influences on an actor |
| `influencer.plug-in` | — | Entry point + editor registration |

## Behavior

- Zones in a map can carry **influences**: effects applied to any entity
  standing inside. `ig.Influencer` tracks which entities are inside which
  zones (`InfluenceConnection`) and fires the entry's callbacks
  (`InfluencerCallbacks`) on enter/leave/update.
- `ig.InfluenceEntry` bundles the zone, the affected target group, and the
  per-frame effects (e.g. heat damage, healing, wind push).
- Temporary influences (`ADD_TEMP_INFLUENCE`) are the scripted form: an
  actor gains an influence for a duration or until cleared — used for
  debuffs and environment hazards.

## Consumers

- Heat/cold hazard areas, healing springs, quest-event damage fields.
  The game layer (`game.feature.influencer.*`) defines the concrete
  influence types used by maps.
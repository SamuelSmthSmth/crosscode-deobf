# impact.feature.rumble — screen rumble

> **Status**: core · Modules: `impact.feature.rumble.rumble`,
> `impact.feature.rumble.rumble-steps`, `impact.feature.rumble.plug-in`.

## Module & class table

| Module | Key classes | Responsibility |
|---|---|---|
| `rumble.rumble` | `ig.Rumble` (addon), `ig.RumbleHandle`, `ig.RUMBLE_TYPE`, `ig.Rumble.SHAKE_DURATION`, `ig.Rumble.SHAKE_POWER` | Screen-shake via camera offset, with continuous/decay modes and power presets |
| `rumble.rumble-steps` | ACTION_STEP: `RUMBLE_SCREEN`; EVENT_STEP: `RUMBLE_SCREEN`, `RUMBLE_STOP_CONTINUES`; EFFECT_ENTRY: `RUMBLE`, `CLEAR_RUMBLE` | Scripted shakes + rumble effects in EFFECT files |
| `rumble.plug-in` | — | Entry point + editor registration |

## Behavior

- `ig.Rumble` offsets the camera each frame by a decaying random vector
  (`SHAKE_DURATION`/`SHAKE_POWER` presets; `ig.RUMBLE_TYPE` selects
  continuous vs. fade-out patterns). Handles are stackable like
  slow-motion ([25-slow-motion.md](25-slow-motion.md)).
- Rumble can be requested **directly**, via **event/action steps**
  (`RUMBLE_SCREEN`), or embedded in **EFFECT files**
  (`EFFECT_ENTRY.RUMBLE`) so combat FX shake the screen for their duration
  (`CLEAR_RUMBLE` cancels).
- The same addon feeds the gamepad vibration hook on console builds
  (gamepad: [05-gamepad.md](05-gamepad.md)).
- Used by explosions, boss stomps, the arena walls, and hit feedback.
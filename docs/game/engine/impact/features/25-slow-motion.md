# impact.feature.slow-motion — slow-motion world time

> **Status**: core · Modules: `impact.feature.slow-motion.slow-motion`,
> `impact.feature.slow-motion.slow-motion-steps`, `impact.feature.slow-motion.plug-in`.

## Module & class table

| Module | Key classes | Responsibility |
|---|---|---|
| `slow-motion.slow-motion` | `ig.SlowMotion` (addon), `ig.SlowMotionHandle` | World-time scaling with stackable handles and smooth transitions |
| `slow-motion.slow-motion-steps` | ACTION_STEP: `ADD_SLOW_MOTION`, `CLEAR_SLOW_MOTION`; EVENT_STEP: `ADD_SLOW_MOTION`, `CLEAR_SLOW_MOTION` | Scripted slow-mo (cutscene bullet-time, boss phases) |
| `slow-motion.plug-in` | — | Entry point + editor registration |

## Behavior

- Each `ADD_SLOW_MOTION` returns a handle (`ig.SlowMotionHandle`) with a
  target time-scale (0–1), transition duration and easing; scales are
  **multiplied**, so stacked effects compose (e.g. player dash 0.5 × boss
  slow 0.3).
- `ig.SlowMotion` applies the combined scale to `ig.game`'s time flow via
  timer scaling (see [01-core.md](../01-core.md) — `ig.Timer`), so
  physics, animations and cooldowns all slow uniformly; the GUI layer stays
  at full speed by using unscaled timers.
- `CLEAR_SLOW_MOTION` (or handle expiry) eases back to 1.0.
- Used by dash stop-time, dodge frames, boss kill-cams and cutscene
  emphasis.
# impact.feature.nwf — NWF (Wii U) helpers

> **Status**: core · Modules: `impact.feature.nwf.nwf-errors`,
> `impact.feature.nwf.plug-in`.

## Module & class table

| Module | Key classes | Responsibility |
|---|---|---|
| `nwf.nwf-errors` | (module-level handler) | Wii U system error handling: listens for `ERROR`/`CRASH` events, routes FS/SAVE/AC error codes to the NWF dialog |
| `nwf.plug-in` | — | NWF platform bootstrap + editor registration |

## Behavior

- NWF (Non-Web Framework) is the Wii U / console runtime embedded in the
  same HTML5 codebase. `nwf-errors` wires `nwf.system` error events into
  the console's error dialog (FS = filesystem, SAVE = save data,
  AC/ACT = account), logging unknown codes.
- The plug-in detects the NWF environment at boot and initializes the
  platform pieces (achievements hook, gamepad via
  [05-gamepad.md](05-gamepad.md), greenworks-less storage).
- This group is platform-only: on PC builds it is inert.
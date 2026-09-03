# Mod lifecycle and packaging

> **Scope:** CCLoader package discovery, manifests, dependency ordering,
> lifecycle stages, asset paths, and safe engine registration. Verified against
> `ccloader/js/ccloader.js`, `js/mod.js`, `js/package.js`, and tracked mod
> manifests under `assets/mods/`.

## Lifecycle at a glance

```text
package discovery
  → manifest parse / Mod object
  → duplicate resolution
  → dependency/version ordering
  → plugin constructors
  → preload (before game scripts)
  → game loader reaches postload point
  → postload (after game code is inserted)
  → poststart/main (after the game is loaded and started)
```

The exact loader path can vary by CCLoader version and package type, but the
stage meanings are stable enough to choose a safe integration point. Inspect
`ccloader/js/ccloader.js` for the current execution sequence before relying on a
stage for a specific engine class.

## Package forms

CCLoader discovers:

- extracted mod folders with a manifest (`package.json` for legacy packages or
  `ccmod.json` for CCLoader packages);
- `.ccmod` packages whose contents include `ccmod.json`;
- legacy package formats supported by the file manager.

A bare arbitrary `.zip` is not automatically a mod package in this workspace.
The `.ccmod` extension and manifest layout matter.

## `ccmod.json`

```ts
type CcModManifest = {
  id: string;
  version: string;
  title?: string | Record<string, string>;
  description?: string | Record<string, string>;
  license?: string;
  authors?: unknown;
  repository?: string;
  homepage?: string;
  tags?: string[];
  dependencies?: Record<string, string>;
  ccmodDependencies?: Record<string, string>;
  preload?: string;
  postload?: string;
  prestart?: string;
  poststart?: string;
  plugin?: string;
  assets?: string[];
};
```

For a `.ccmod`, the loader maps `poststart` to the internal main entry. It
normalizes all script paths relative to the package/manifest location. A
manifest can include multiple lifecycle script fields, but each one should have
one clear responsibility and should not rely on an accidental execution order.

A practical render mod commonly uses:

```json
{
  "id": "my-render-mod",
  "version": "1.0.0",
  "title": "My Render Mod",
  "dependencies": {
    "ccloader": ">=2.0.0",
    "crosscode": ">=1.2.0"
  },
  "poststart": "poststart.js"
}
```

## Dependency ordering

CCLoader compares dependency ranges with semver. Special dependencies
`ccloader` and `crosscode` resolve against the loader/game versions. Other names
resolve against discovered mods. A dependency can be missing, disabled, or at
an incompatible version; the loader logs the reason and does not consider the
mod loadable.

Use dependencies for APIs you actually require. If a mod can operate without
another mod, feature-detect it instead of declaring a hard dependency. Never
write a dependency range that only happens to match your development checkout.

## Stage selection

### `preload`

Runs before the game scripts are fully loaded. Use it only for early runtime
configuration or loader-level changes, such as display/bootstrap behavior. At
this point `ig`, `sc`, renderer classes, and game models may not exist.

**Do not:** reference `ig.GameAddon`, `ig.game`, or `sc.options` without a
readiness gate.

### `postload`

Runs after the game code is loaded but around the loader’s postload point. This
is appropriate for class injections that must exist before normal game startup,
provided the target class has been verified and is available at that point.
The tracked `tilt-shift` mod uses `postload` for its broad menu/render setup.

### `prestart`

The manifest and `Mod`/legacy `Plugin` APIs expose a `prestart` field, but the
current `ModLoader.startGame()` path in this checkout does **not** call
`loadPrestart()`. Treat it as unsupported here unless a loader version or plugin
host explicitly invokes it; do not rely on it for a working mod.

### `poststart`

Runs after the game has started through the mod’s `main`/`poststart` entry. It is
the safest default for mods that need
`ig.game`, `ig.system`, `ig.soundManager`, `ig.gui`, or initialized addon lists.
Tracked lighting, audio, shadows, reflections, and dev-overlay mods use this
style.

Because poststart can be late, an addon must either be registered directly in
`ig.game.addons` (and sorted) or be installed through a mechanism that runs
before `ig.initGameAddons()`.

## Idempotent startup

```js
(function () {
    'use strict';
    if (window.__myModInstalled) return;

    function ready() {
        return window.ig && ig.GameAddon && ig.game && ig.game.addons;
    }
    if (!ready()) return; // retry only when the loader guarantees a later call

    // Install all patches first. Register the marker after successful setup.
    window.__myModInstalled = true;
})();
```

If using retries, do not set the marker before the final patch succeeds. If a
partial setup can happen, keep explicit handles to injections/listeners and
remove them or fail closed before retrying.

## Assets and installed paths

The loader gives each `Mod` a `baseDirectory`, an `assets` list, and
`getAsset(path)`. A packaged mod cannot safely assume the source repository’s
`assets/mods/<id>/` path. Resolve worker, image, audio, and WASM files from the
installed package directory or the loader’s asset API.

The `lighting-wasm` mod demonstrates a runtime directory resolver from
`window.activeMods[].baseDirectory`, while its worker uses a path relative to
the worker URL for `lighting-kernels.js` and the paired `.wasm` file.

## Safe injection patterns

Use `Class.inject({ method() { this.parent(...); } })` when a class-level seam is
required. Keep the original call unless replacing behavior is intentional and
documented:

```js
ig.SomeClass.inject({
    update: function () {
        this.parent();
        // Small, namespaced extension.
    }
});
```

Prefer `ig.GameAddon` for frame/update ordering. Use feature detection:

```js
if (ig.SomeClass && typeof ig.SomeClass.inject === 'function') {
    // install patch
}
```

For a late addon, register in `ig.game.addons.all` and the exact phase lists it
uses, then sort that list numerically. Do not push an object with no lifecycle
method into a list the game will call.

## Debugging and failure recovery

Log the mod id/version, selected stage, target classes, and whether optional
backends are active. A failed mod should not leave global context state, event
listeners, timers, or duplicate addons behind. Keep a master enabled flag so a
user can disable expensive behavior without uninstalling the package.

When a mod fails at boot:

1. disable it in the loader/mod settings or remove it from the enabled list;
2. read the first exception, not only later cascade errors;
3. verify the manifest and dependency versions;
4. test the script with optional mods disabled;
5. restore the previous package after changes, rather than patching the compiled
   game bundle.

## Guardrails

- Never patch `assets/js/game.compiled.js` as a runtime installation strategy.
- Never assume `poststart` means every optional API is ready; gate uncommon
  classes and addon lists.
- Never rely on `prestart` in this checkout unless you have verified an explicit
  caller for `loadPrestart()`.
- Never set an installed flag before setup is complete.
- Never register the same addon, injection, DOM listener, or worker twice.
- Never depend on an untracked repository folder being present in a packaged
  mod.
- Never declare a hard dependency when feature detection and a fallback suffice.
- Never use arbitrary zip packaging and expect CCLoader to discover it.
- Never swallow the first boot exception without recording the mod id/version.
- Never leave a retry timer alive after successful initialization.

## Related

- [Modding index](README.md)
- [Rendering and lighting](rendering-and-lighting.md)
- [CCLoader mods index](../mods/README.md)
- [Agent reference](../agent-reference.md)

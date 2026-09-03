# Recipe: add a persistent mod option

> Add a namespaced option that the game model can read and persist. A late
> `poststart` mod must seed the option model explicitly; a definition alone does
> not retroactively create a value or a visible native menu row.

## Contract

| Item | Choice |
|---|---|
| Definition | `sc.OPTIONS_DEFINITION['mymod-enabled']` |
| Read/write | `sc.options.get(key)` / `sc.options.set(key, value)` |
| Persistence | `OptionModel` global storage path |
| UI | inject/register a native option GUI, or provide a mod-owned submenu |
| Prefix | unique, stable, lowercase mod prefix |

## Register and seed a checkbox

```js
(function () {
    'use strict';
    if (window.__myOptionInstalled) return;

    function boot() {
        if (!window.sc || !sc.OPTIONS_DEFINITION || !sc.options ||
            !sc.OPTION_CATEGORY) {
            setTimeout(boot, 100);
            return;
        }

        var key = 'mymod-enabled';
        if (!sc.OPTIONS_DEFINITION[key]) {
            sc.OPTIONS_DEFINITION[key] = {
                type: 'CHECKBOX',
                init: true,
                cat: sc.OPTION_CATEGORY.VIDEO
            };
        }

        // OptionModel.init normally ran before this poststart script.
        if (sc.options.values[key] === undefined) {
            sc.options.values[key] = sc.OPTIONS_DEFINITION[key].init;
        }

        window.__myOptionInstalled = true;
    }
    boot();
})();
```

Read the option at the feature boundary rather than copying it into several
unrelated settings objects:

```js
function isEnabled() {
    return sc.options.get('mymod-enabled') !== false;
}

function setEnabled(value) {
    sc.options.set('mymod-enabled', !!value);
    sc.options.persistOptions();
}
```

`set()` marks the model changed and notifies observers. `persistOptions()` writes
global options when changed. Do not call it every frame; call it after a user
change or a deliberate settings import.

## Native menu visibility

Adding `sc.OPTIONS_DEFINITION` after the native options GUI has built its rows
may make the option readable but not visible in the game’s menu. For a native
row, inspect the installed options GUI class and inject its row-building path at
a stage where the definition is present. The `tilt-shift` mod is the repository
example: it adds definitions, seeds values, then injects the object-slider GUI
for custom labels.

If the menu integration is complex, a mod-owned submenu is often safer. It can
use `ig.GuiElementBase` and `sc.options.set`, while avoiding assumptions about
the internal order of the vanilla options rows.

## Local versus global values

Some built-in definitions use `hasLocal`, storing `key-global` and `key-local`
values. A mod should choose deliberately:

- **Global option:** visual/audio preferences that apply to the installation.
- **Per-save option:** gameplay settings that should travel with a save.
- **Mod-private storage:** large presets or implementation state that does not
  belong in the game’s option table.

Do not create `-global`/`-local` keys manually unless the definition and the
model’s `hasLocal` behavior require them.

## Compatibility

- tolerate `sc.OPTIONS_DEFINITION[key]` already existing;
- seed defaults when loading late;
- tolerate an absent key from an older save/config;
- validate imported values before calling `sc.options.set`;
- use a unique prefix to avoid another mod overwriting the definition;
- test reset-to-default behavior and save/load across versions.

## Guardrails

- Never use a generic key such as `enabled`, `quality`, or `mode`.
- Never assume a late-added definition automatically appears in the menu.
- Never write directly to `sc.options.values` for ordinary user changes; use
  `sc.options.set` so observers and dirty state are updated.
- Never persist every frame.
- Never store functions, DOM nodes, AudioNodes, canvases, or entities in option
  values.
- Never trust imported JSON until types/ranges are sanitized.

## Related

- [UI and menus handbook](../ui-and-menus.md)
- [Mod lifecycle](../mod-lifecycle.md)
- [Agent reference](../../agent-reference.md)
- [Modding index](../README.md)

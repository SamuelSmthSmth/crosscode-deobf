# impact.feature.lang-edit — in-game language editor

> **Status**: core · Modules: `impact.feature.lang-edit.lang-edit`,
> `impact.feature.lang-edit.plug-in`.

## Module & class table

| Module | Key classes | Responsibility |
|---|---|---|
| `lang-edit.lang-edit` | `ig.LangEdit` (addon) + server URL constants (`LANG_EDIT_API_BASE`, `LANG_EDIT_LIST_URL`, `LANG_EDIT_OVERVIEW_URL`, `LANG_EDIT_RESOLVE_URL`, `LANG_EDIT_SUBMIT_URL`, `LANG_GET_URL`, `LANG_SEND_URL`, `LANG_BATCHES_GET_URL`) | Overlay that lists translatable strings and edits them live against the translation server |
| `lang-edit.plug-in` | — | Entry point + editor registration |

## Behavior

- Opened with **F7** (debug builds): an in-game GUI lists all localizable
  strings (`ig.lang` entries), lets the translator change values, and
  submits batches to the Crowdin-style API endpoints configured above.
- Values are hot-reloaded into `ig.lang` immediately so translations can be
  reviewed in context.
- Shipping builds strip/disable the addon; the underlying per-language
  string loading lives in the **lang system** (see
  [01-core.md](../01-core.md) — `ig.Lang`/`ig.lang`).
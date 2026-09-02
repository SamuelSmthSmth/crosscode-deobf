# Catalog — props & scale-props

> **Status**: core · 61 prop sheets in `assets/data/props/` + 31 in
> `assets/data/scale-props/`. DOCTYPE: `PROP_SHEET`.
> Schema: [PROP format](../formats/08-prop.md). Consumed by
> `ig.ENTITY.Prop` / `ig.ENTITY.ScalableProp`.

## `props/` — fixed-size props (61 files, per area/theme)

| Group | Files |
|---|---|
| Harbor/rookie | `rookie-harbor.json`, `rh-interior.json`, `rh-interior-pub.json` |
| Autumn | `autumn.json`, `trading-autumn.json`, `cabins.json`, `cave.json` |
| Bergen | `bergen.json`, `bergen-inner.json`, `bergen-trail.json`, `office.json`, `lobby.json` |
| Arid/heat | `arid.json`, `arid-interior.json`, `arid-furniture.json`, `arid-lab.json`, `arid-dng-outside.json`, `heat.json`, `heat-interior.json`, `heat-dng.json`, `heat-village.json` |
| Jungle | `jungle.json`, `jungle-interior.json`, `jungle-city.json`, `jungle-signs.json` |
| Dungeons | `cold-dng.json`, `shockwave-dng.json`, `final-dng-inner.json`, `final-dng-outer.json`, `final-dng-glow.json`, `forest-dng.json`, `dungeon-ar.json` |
| Rhombus/hub | `rhombus-sqr.json`, `rhombus-interior.json`, `rhombus-signs.json`, `rhombus-area-text.json`, `rhombus-sq-beach.json`, `rhombus-square-view.json` |
| Ship/hideout | `cargo-hold.json`, `ship-bridge.json`, `ship-outer.json`, `hideout.json` |
| Specials | `invisible.json`, `spider-webs.json`, `spooky.json`, `upgrade-glow.json`, `upgrade-symbols.json`, `lmh-statue.json`, `radicalprops.json`, `various.json`, `lab.json`, `lab-entrance.json`, `evo-village.json`, `evo-village-inner.json`, `raid.json`, `sao.json`, `shady-hologram.json` |

## `scale-props/` — size-scalable props (31 files)

Same per-area naming (`arid.json`, `autumn.json`, `bergen-trail.json`,
`cold-dng.json`, `jungle.json`, `rookie-harbor.json`,
`rhombus-sqr.json`, `rhombus-sqr-inner.json`, `dungeon-ar.json`…): these
sheets define props whose sprite scales with a pixel `size` (walls,
water, laser railings, platforms) — see
[PROP format](../formats/08-prop.md).

> Map placement: `Prop` entities reference `{sheet, name}`; `ScalableProp`
> entities reference `{sheet, name, ends}` + `size`
> ([MAP format](../formats/05-map.md)).
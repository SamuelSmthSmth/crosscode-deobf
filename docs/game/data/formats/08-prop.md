# PROP format (`assets/data/props/`, `assets/data/scale-props/`)

> **Status**: stub (pending).

## Scope

- Prop sheets: definitions for interactable world objects
  (`ig.PropSheet`/`ig.ScalePropSheet`, see
  [impact.feature.map-content](../../engine/impact/features/17-map-content.md)).
- `props/` — normal props; `scale-props/` — props whose sprite scales
  with a size attribute.

## To document

- Field reference: sprite/animation refs, interact prompt, size,
  collision, static nav blocking, z-offsets, hover/press callbacks.
- How `ig.ENTITY.Prop`/`ig.ENTITY.ScalableProp` instantiate sheets.
- Relationship to characters (props can carry scripts).

## Related

- Engine: [impact.feature.map-content](../../engine/impact/features/17-map-content.md).
- Map entities: [MAP format](05-map.md).
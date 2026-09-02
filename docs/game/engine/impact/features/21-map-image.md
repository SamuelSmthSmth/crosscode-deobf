# impact.feature.map-image — world map image manager

> **Status**: core · Modules: `impact.feature.map-image.map-image`,
> `impact.feature.map-image.map-image-steps`, `impact.feature.map-image.plug-in`.

## Module & class table

| Module | Key classes | Responsibility |
|---|---|---|
| `map-image.map-image` | `ig.MapImageManager` (addon), `ig.MapImageEntity` | Renders full-map overview images (the world map screens) |
| `map-image.map-image-steps` | EVENT_STEP: `SHOW_MAP_IMAGE`, `REMOVE_MAP_IMAGE` | Scripted display/hide of map images |
| `map-image.plug-in` | — | Entry point + editor registration |

## Behavior

- `ig.MapImageManager` holds the currently displayed map image and keeps
  it in sync with the camera; `ig.MapImageEntity` is the in-world entity
  that carries the image (position, layer, scale).
- Used for the area-overview "world map" GUI: when the player opens the
  map, the manager draws the map image of the current area
  (`assets/media/map/*` overviews) behind the HUD markers.
- Scripts can show/remove images for transitions and diagrams
  (`SHOW_MAP_IMAGE`, `REMOVE_MAP_IMAGE`).
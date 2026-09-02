# Catalog — characters & players

> **Status**: core · 443 character JSONs in `assets/data/characters/`
> (33 folders) + 15 player/party-member definitions in
> `assets/data/players/`. Schema:
> [CHARACTER & PLAYER format](../formats/04-character.md).

## `characters/` folders (counts)

| Folder | Files | Notes |
|---|---|---|
| `main/` | 23 | Story cast: lea, emilie, luke, glasses, buggy, sergey, schneider, shizuka, dkar, carla, genius… |
| `antagonists/` | 8 | Sidestory antagonists (fancyguy, shady, gautham, cat, designer…) |
| `cross-worlds/` | 31 | Online avatars (hexacast/pentafist/quadroguard/spheromancer/triblader variants) |
| `cross-worlds-special/` | 7 | Special avatars |
| `adventurers/` + `adventurers-jungle/` | 14 + 7 | Background adventurer templates |
| `advisors/` | 15 | Advisor NPCs |
| `animal/` | 4 | Animals (bug, daft-frobbit, peng…) |
| `baki/` | 16 | Baki tribe NPCs |
| `basin/` | 23 | Basin NPCs + ghosts |
| `bergen/` | 21 | Bergen NPCs |
| `business/` | 32 | Business/office NPCs |
| `cargo-crew/` | 11 | Ship crew |
| `crossovers/` | 3 | Crossover characters (bag, …) |
| `enemy/` | 3 | Enemy-shaped characters (raid-fortress-smol…) |
| `forest/` | 11 | Forest NPCs + golden-bugs |
| `gods/` | 5 | The elemental gods (hexa, penta, quadro, sphero, triblader) |
| `greenies/` + `greenies-baki/` + `greenies-jungle/` | 13+1+7 | Greenie NPCs |
| `guards/` | 22 | Guard NPCs |
| `guests/` | 28 | Guest characters (cherry, lily, sao…) |
| `jungle/` | 13 | Jungle NPCs |
| `lab/` | 4 | Lab scientists (pc/ps4/switch/xbox) |
| `miners/` | 7 | Miner NPCs |
| `misc/` | 9 | One-offs (oldman, oldsmith, henry-researcher, menu-effect-large…) |
| `monks/` | 6 | Monk NPCs |
| `nomads/` | 9 | Nomad NPCs |
| `objects/` | 31 | Animated objects (cars, boxes, machines, ferro-gate…) |
| `party-tmp/` | 1 | Temp party member |
| `radical/` | 10 | The dev team cameos (rd, tina, fish, flora, frece, feiu, teekuh…) |
| `rhombus/` | 20 | Rhombus Square NPCs (beach-goers, karate…) |
| `rookie-harbor/` | 28 | Harbor NPCs + faction members |
| `forest/`, `lab/`, … | — | (see above) |

## `players/` — party members & the hero

`lea.json` (the playable hero), `apollo.json`, `buggy.json`,
`emilie.json`, `glasses.json`, `grumpy.json`, `hlin.json`, `joern.json`,
`luke.json`, `schneider.json`/`schneider2.json`, `sergey.json`,
`shizuka0.json`/`shizuka.json`, `triblader1.json` — 15 definitions, each
with class, stats, combat style and proxies (see
[CHARACTER & PLAYER format](../formats/04-character.md)).

> NPC `NPCBasic` template references resolve to full characters through
> `game.feature.character.char-templates`; dialogue portraits use the
> `face` field (see [CHARACTER format](../formats/04-character.md)).
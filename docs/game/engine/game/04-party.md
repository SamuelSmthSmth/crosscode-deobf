# game.feature.party — the party system

> **Status**: core · 5 modules in `deobf/clean/game.feature.party.*`.
> Covers `sc.Party` (roster/AI/EXP), `sc.PartyMemberModel` (per-member
> stats) and the in-world `sc.PartyMemberEntity` AI.

## Modules & classes

| Module | Key classes | Responsibility |
|---|---|---|
| `party.party` | `sc.Party` (GameAddon), `sc.PARTY_MSG` | Party system model: known members, active party, in-map entities, contact status, dungeon blocking (members vanish in dungeons), AI parameters, EXP sharing, strategies, save/load |
| `party.party-member-model` | `sc.PartyMemberModel`, `sc.PARTY_MEMBER_MSG` | Single member: loads character config, computes stats (base params + equipment + skills per element), leveling, EXP, SP, equipment, element mode switching, revive/death, sandwich healing |
| `party.entities.party-member-entity` | `sc.PartyMemberEntity` | In-map member entity: follows the player, fights alongside in combat with an AI state machine (IDLE, FOLLOW, BACKOFF, ROTATE, combat states, dodging, healing, throwing, melee combos, combat-art charging); shares model params and proxies |
| `party.party-steps` | EVENT/ACTION steps | Contact status, add/remove/revive members, member level/SP/no-die/all-elements, party AI config, dungeon blocking, combat actions (temporary targets, sandwich consumption) |
| `party.plug-in` | — | Entry point + editor registration |

## Behavior

- **`sc.Party`** keeps the roster of known members (models) and the current
  active party. It manages which members have an in-map entity, their
  contact/join status, dungeon blocking (party members disappear in
  dungeons), AI parameters, experience sharing and per-member strategies.
  State persists via `ig.storage`.
- **`sc.PartyMemberModel`** computes each member's stats from the base
  character config plus equipment and per-element skill bonuses, and
  handles leveling, EXP, SP, element mode switching, death/revive and the
  sandwich-heal action sequence. Observers get `sc.PARTY_MEMBER_MSG`
  notifications (ELEMENT_MODE_CHANGE, EXP_CHANGE, …).
- **`sc.PartyMemberEntity`** is the in-world presence: overworld follow
  behavior and a full combat AI (states for dodging, healing, throwing,
  melee combos, combat-art charging) sharing the model's params and
  combat proxies.

## Hooks & steps

- EVENT/ACTION steps from `party-steps`: `SET_CONTACT_ONLINE`,
  add/remove/revive member, set level/SP/no-die/all-elements, party AI
  configuration, dungeon blocking, temporary targets and sandwich
  consumption in combat.
- Member definitions live in `assets/data/players/` and
  `assets/data/characters/party/*`
  ([CHARACTER format](../../data/formats/04-character.md)).

## Related

- [player](01-player.md) · [npc](03-npc.md) · [combat](02-combat.md)
- Engine: [impact.feature.storage](../../engine/impact/features/11-storage.md),
  [impact.base.actor-entity](../../engine/impact/02-entities.md)
- Data: [CHARACTER format](../../data/formats/04-character.md)
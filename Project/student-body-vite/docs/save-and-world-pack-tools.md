# Save And World Pack Tools

Beacon's State tab is the current dev surface for save/load/export work.

## Save JSON

`Export Save JSON` downloads a wrapper object:

```json
{
  "exportKind": "student-body-save",
  "exportedAt": "2026-05-10T00:00:00.000Z",
  "state": {}
}
```

`Import Save JSON` accepts either that wrapper shape or a raw `GameState` object. Imported saves are normalized through the current migration path, so older time-slot saves can still load into the quarter-hour clock.

## World Pack JSON

Beacon supports two world-pack loading paths:

- `Load Pack` imports an authored JSON pack from `public/world-packs/manifest.json`
- `Import World Pack` imports a local JSON file with the same pack shape

The bundled manifest shape is:

```json
{
  "version": 1,
  "packs": [
    {
      "id": "campus-life-starter",
      "name": "Campus Life Starter",
      "description": "Adds a small authored cast, locations, schedules, and arcs.",
      "path": "/world-packs/campus-life-starter.json",
      "npcCount": 5,
      "locationCount": 2,
      "tags": ["starter", "cast", "schedules", "arcs"]
    },
    {
      "id": "town-side-rumors",
      "name": "Town-Side Rumors",
      "description": "Adds discoverable town locations, relationship seeds, and event hooks.",
      "path": "/world-packs/town-side-rumors.json",
      "npcCount": 3,
      "locationCount": 3,
      "tags": ["town", "discovery", "relationships", "calendar"]
    }
  ]
}
```

Each pack file accepts a loose authored shape. Supported top-level keys:

```json
{
  "id": "starter-cast-a",
  "name": "Starter Cast A",
  "version": "0.1.0",
  "npcs": {
    "debate_captain": {
      "name": "Avery",
      "role": "Debate team captain",
      "defaultLocation": "student_union",
      "schema": {
        "voice": "Bright, clipped, competitive."
      }
    }
  },
  "locations": {
    "debate_room": {
      "label": "Debate Room",
      "cat": "campus",
      "description": "A seminar room colonized by whiteboards and water bottles."
    }
  },
  "schedules": {},
  "knownNpcIds": ["debate_captain"],
  "knownLocationIds": ["debate_room"],
  "rumoredLocationIds": ["late_bus_stop"],
  "relationships": {
    "debate_captain": {
      "score": 1,
      "status": "club contact",
      "flags": { "trust": 0, "awkward": 0, "texting": false, "date_planned": false },
      "recentMoments": [
        {
          "id": "debate-flyer",
          "day": 1,
          "slot": 48,
          "location": "student_union",
          "label": "Flyer",
          "text": "Avery's name is on the debate table signup sheet."
        }
      ]
    }
  },
  "arcs": [],
  "flags": {}
}
```

Aliases are accepted for authoring convenience:

- `characters` or `cast` can stand in for `npcs`
- `places` can stand in for `locations`
- `npcSchedules` can sit beside `schedules`
- `storyArcs` can stand in for `arcs`
- `initialRelationships` can stand in for `relationships`

Imported NPCs are merged into `state.npcDirectory`, imported locations are stored in `state.world.locations`, and Compass plus narrator context can read the added locations immediately.

`knownLocationIds` and `rumoredLocationIds` seed Compass discovery state. Known locations appear with hours available; rumored locations appear with hours hidden until visited. This lets a pack add places that are fully authored but not all equally known at the start.

`relationships` seeds the player's relationship records with imported or built-in NPCs. These records use the same shape as the runtime relationship system: score, status, traits, flags, last-seen disposition, and recent shared moments.

Beacon validates packs during import and reports warnings for common authoring mistakes, such as schedule blocks pointing at missing locations, calendar events missing required fields, NPCs without schemas, or relationship seeds for unknown NPC ids. Warnings do not block import; they are meant to keep authored packs debuggable.

The bundled examples live in `public/world-packs/`. `campus-life-starter.json` stays compact enough to inspect by hand, while `town-side-rumors.json` exercises discovery seeds, hidden locations, relationship seeds, schedules, calendar events, and arcs.

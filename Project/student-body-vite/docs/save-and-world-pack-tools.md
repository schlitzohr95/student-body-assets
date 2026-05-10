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
  "arcs": [],
  "knownNpcIds": [],
  "flags": {}
}
```

Aliases are accepted for authoring convenience:

- `characters` or `cast` can stand in for `npcs`
- `places` can stand in for `locations`
- `npcSchedules` can sit beside `schedules`
- `storyArcs` can stand in for `arcs`

Imported NPCs are merged into `state.npcDirectory`, imported locations are stored in `state.world.locations`, and Compass plus narrator context can read the added locations immediately.

The first bundled example lives at `public/world-packs/campus-life-starter.json` and is intentionally small enough to inspect by hand while still exercising cast, location, schedule, and arc imports.

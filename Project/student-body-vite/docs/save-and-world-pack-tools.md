# Save And World Pack Tools

Beacon's State tab is the current dev surface for save/load/export work.

## Manual Slots And Backups

The running game still autosaves to the normal local state key. The State tab now also has four manual save slots for testing:

- `Save Current` writes the current state into the selected slot
- `Load` restores the selected slot and creates an automatic backup first
- `Clear` empties the selected slot

Imports and reset actions create a timestamped backup before they change the current state. The latest backups are available in the `Import/reset backups` selector and can be restored from the same tab.

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

- `Preview` reads an authored JSON pack from `public/world-packs/manifest.json`, validates it, and stages it for import
- `Preview World/Cast` reads a local JSON file with the same pack shape, or an exported wrapper with a nested `pack`
- `Import Preview` applies the staged pack if it has no blocking errors and creates a backup first
- `Export World/Cast` exports only the currently imported/authored world and cast content from the running save

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
    },
    {
      "id": "arts-and-activism",
      "name": "Arts And Activism",
      "description": "Adds studio spaces, organizers, an arts course, a test, and bulletin posts.",
      "path": "/world-packs/arts-and-activism.json",
      "npcCount": 2,
      "locationCount": 2,
      "tags": ["arts", "activism", "classes", "bulletins"]
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
  "academicCourses": {
    "debate101": {
      "id": "debate101",
      "code": "DBT 101",
      "title": "Public Argument",
      "instructor": "Avery Chen",
      "location": "debate_room",
      "meetingDays": [2, 4, 9, 11],
      "summary": "How claims, evidence, timing, and audience shape campus arguments.",
      "stakes": "Strong work can unlock club leads and social confidence."
    }
  },
  "academicTests": {
    "debate101_claims": {
      "id": "debate101_claims",
      "courseId": "debate101",
      "courseTitle": "Public Argument",
      "label": "Claims Check",
      "day": 10,
      "startSlot": 56,
      "location": "debate_room",
      "baseDifficulty": 6,
      "questions": [
        {
          "id": "evidence",
          "type": "multiple_choice",
          "prompt": "Which answer supports a claim with evidence?",
          "options": [
            { "id": "source", "label": "A specific source and reason", "correct": true },
            { "id": "vibe", "label": "A confident vibe" }
          ],
          "explanation": "Evidence needs something inspectable."
        }
      ]
    }
  },
  "bulletinPosts": [
    {
      "id": "debate-table",
      "kicker": "Club",
      "title": "Debate table needs first-years",
      "body": "Bring one claim you can actually defend.",
      "action": { "id": "bulletin_pack_debate_table", "label": "Pin debate table" }
    }
  ],
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
- `courses` or `classes` can stand in for `academicCourses`
- `tests` can stand in for `academicTests`
- `bulletins` can stand in for `bulletinPosts`

Imported NPCs are merged into `state.npcDirectory`, imported locations are stored in `state.world.locations`, and Compass plus narrator context can read the added locations immediately.

`knownLocationIds` and `rumoredLocationIds` seed Compass discovery state. Known locations appear with hours available; rumored locations appear with hours hidden until visited. This lets a pack add places that are fully authored but not all equally known at the start.

`relationships` seeds the player's relationship records with imported or built-in NPCs. These records use the same shape as the runtime relationship system: score, status, traits, flags, last-seen disposition, and recent shared moments.

Beacon validates packs during import and reports warnings for common authoring mistakes, such as schedule blocks pointing at missing locations, calendar events missing required fields, NPCs without schemas, or relationship seeds for unknown NPC ids. Warnings do not block import; they are meant to keep authored packs debuggable.

Blocking errors prevent `Import Preview` until fixed. Current blocking errors include an empty/non-importable pack and academic tests with no valid questions.

Imported academic courses and tests appear in Spark and test calendar reminders. Imported bulletin posts appear on the Student Union bulletin board in Compass. Imported relationships appear in Roster after the related NPC is known.

The bundled examples live in `public/world-packs/`. `campus-life-starter.json` stays compact enough to inspect by hand, `town-side-rumors.json` exercises discovery seeds and town NPC schedules, `arts-and-activism.json` exercises creative campus flavor with a course/test/bulletins, and `honors-pressure.json` exercises higher-pressure academic content.

## Debug And Section Resets

The debug state inspector can be filtered to `Full state`, `Player`, `Relationships`, `World pack`, `Cast`, `Academics`, `Calendar`, `Phone data`, or `Event log`.

Reset buttons are intentionally section-scoped:

- `Reset Academics` clears prep, completed tests, course records, academic reminder history, and academic-only traits
- `Reset Relationships` clears relationship records and chemistry observations, then the normal state migration rebuilds baseline records
- `Reset World Pack` removes imported world/cast data, imported schedules, pack-authored classes/tests/bulletins/arcs, imported NPC contacts, and imported location knowledge while preserving built-in locations and starter cast

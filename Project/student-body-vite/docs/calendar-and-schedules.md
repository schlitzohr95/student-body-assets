# Calendar And Schedules

Calendar and schedule core lives in `src/engine/calendar.ts`.

## Calendar Events

Base events are authored in `src/data/calendar.ts` and include class meetings, deadlines, social events, and generated academic test events. Events use semester `day`, `startSlot`, optional `endSlot`, and optional `location`.

World packs can add events with:

```json
{
  "calendarEvents": [
    {
      "id": "zine_table_launch",
      "title": "Zine Table Launch",
      "kind": "social",
      "day": 9,
      "startSlot": 76,
      "endSlot": 84,
      "location": "student_union"
    }
  ]
}
```

## NPC Schedules

NPC schedules are resolved from built-in schedules plus imported world-pack schedules. Supported keys include `daily`, `weekday`, `weekend`, day names like `monday`, and exact day keys like `day9`.

```json
{
  "schedules": {
    "townie": {
      "weekday": [
        { "start": "11:00", "end": "18:00", "location": "bookstore", "mood": "working" }
      ]
    }
  }
}
```

Compass and narrator context now use the schedule resolver, so NPC presence changes with time and imported pack data.

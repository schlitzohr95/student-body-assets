# Student Body — Project Overview

**Student Body** is a narrative dating sim set at a fictional college, built as an interactive artifact with LLM-driven narration and gameplay.

## Core Concept

A **Tokimeki-style stat-raiser** single-player dating sim set across one semester (~16 weeks) at Aldenmoor College, a mid-sized liberal arts school in a college town.

- **Player character**: male, pursuing female romance interests  
- **Cast**: 5 romanceable character archetypes + roommate + supporting NPCs, all **generated per run** from a fixed archetype slate  
- **Gameplay loop**: hybrid map-based navigation + schedule-driven routines + LLM narration on arrival/interaction  
- **Stats**: 5 hard-gate numerical stats (Knowledge, Athletics, Charm, Sensitivity, Grit) + soft narrative traits  
- **Visuals**: pixel-art location backgrounds + character portraits (player-supplied, hosted via this repo)  
- **Persistence**: artifact storage API (`window.storage`); no database for v1  
- **Romance ceiling**: fade-to-black  

---

## Key Design Pillars

### 1. Archetypes as Mastery Loop

The five romanceable archetypes are **fixed across runs**:
- **Studious** — academic-leaning, anxious overachiever or quietly brilliant
- **Athletic** — varsity or serious club athlete, disciplined, social through sport
- **Artistic** — creative major or scene kid, expressive, on a different wavelength
- **Wildcard** — chaos energy, crosses social lines, harder to read, sometimes a rival
- **Townie** — the barista; working class, paying own way through community college, different rhythm

Each archetype has a **fixed behavioral routine** (where they are, what they do, when they're free). Learning these patterns *across runs* is the meta-reward. The **specific person** filling each slot is generated fresh, so content is novel even when structure is familiar.

### 2. LLM-Driven Narration

At game start, a **world generator prompt** asks the LLM to create:
- A specific instance of the world (location names, vibes, hours)
- 5 romanceable characters (one per archetype) + supporting NPCs
- A semester-scale arc skeleton for each character

Each character gets a **Character Schema v1.0** sheet — a struct designed to give the LLM enough texture to write a specific, consistent person without defaulting to archetypal stereotypes.

On every player interaction, a **narrator prompt** is sent to the LLM with:
- Current scene context (location, time, NPCs present, player history)
- Relevant character schemas
- Recent stat changes and relationship flags

The LLM returns: narration text + player choices + narration-driven stat ticks + persistence flags.

### 3. Time & Schedule as Structure

- **1 semester = 16 weeks**
- **Each week = 7 days** (Mon–Sun)
- **Each day = 4 time slots** (Morning, Afternoon, Evening, Night)
- **Weekday rhythm**: Morning classes (default) → Afternoon free → Evening free → Night wind-down
- **Weekend rhythm**: All 4 slots free (where major arcs accelerate)
- **Total playthrough**: ~448 time slots, all with narrative weight

### 4. Hybrid Stat System

Hard-gate stats (gated unlock at certain thresholds):
- **Knowledge** — academic performance, intellectual confidence
- **Athletics** — physical fitness, endurance, confidence in body
- **Charm** — social fluency, first-impression impact
- **Sensitivity** — emotional intelligence, empathy, perceptiveness
- **Grit** — determination, resilience, ability to push through

Each character has **stat affinities** — they care about certain stats more, dismiss others, and respond differently based on the player's profile.

---

## Repository Structure

### `/icons/` — App Icons (256×256 SVG + PNG)

In-game UI apps:
- **Spark** — dating app (Tinder/Bumble knockoff)
- **Buzz** — social feed (Instagram-like)
- **Faceboard** — older-feeling social platform
- **Pulse** — messages app
- **Roster** — contacts
- **Lens** — camera (mostly decorative in v1)
- **Margin** — notes app
- **Wake** — alarm
- **Compass** — map (active in v1)
- **Self** — stats/traits/goals screen
- **Beacon** — browser knockoff
- **Loop** — calendar/planner
- **Ember** — music app
- **Tally** — banking/money
- **Ledger** — bills/accounting
- **Echo** — voice memos
- **Anthrop** — goals/tracker app (functional, read-only)

Both SVG and PNG versions maintained for flexibility.

### `/portraits/` — Character Portraits (512×512 SVG + PNG)

One portrait per archetype:
- *artistic.png/svg* — Artistic archetype
- *athletic.png/svg* — Athletic archetype
- *bully.png/svg* — Antagonist/Bully NPC
- *professor.png/svg* — Faculty mentor/obstacle
- *ra.png/svg* — Resident Advisor (authority figure)
- *roommate.png/svg* — Best friend/roommate (supporting character)
- *studious.png/svg* — Studious archetype
- *townie.png/svg* — Townie archetype
- *wildcard.png/svg* — Wildcard archetype

These are player-supplied pixel-art placeholders. Specific character faces are generated per run.

### `/locations/` — Location Backgrounds (1280×800 SVG + PNG)

Campus and town locations:
- **Campus**: dorm_room, dorm_hallway, lecture_hall, library_main, library_stacks, dining_hall, gym, student_union, quad, quad_night
- **Town**: coffee_shop, bar, bookstore, restaurant, park, townie_apartment, running_trail, walking_path

Each location has a fixed vibe and NPC routine.

### `/Project/` — Design & Implementation Documents

**Design & Architecture:**
- `DESIGN_DOC_v0.2.md` — Main design spec (world generator, time loop, stat system, arc structure)
- `CHARACTER_SCHEMA_v1.0.md` — Character sheet format used by LLM
- `IMPLEMENTATION_DOC_v0.3.md` — Implementation spec (storage schema, prompt shapes, output parsing, test scenarios)

**Image & Style:**
- `IMAGE_PROMPTS_LOCATIONS.md` — Pixel-art generation prompts for each location
- `IMAGE_PROMPTS_PORTRAITS_AND_ICONS.md` — Generation prompts for portraits and icons
- `IMAGE_STYLE_ALTERNATIVES.md` — Visual style exploration and alternatives

**Narrative & Lore:**
- `2000_dating_simulator.md` — Early design document (historical reference)
- `INSTRUCTIONS_field_v2.md` — Additional narrative guidelines

**Code:**
- `student_body_v1.jsx` — Main game artifact component
- `character_generator.jsx` — LLM prompt builder for world generation
- `narrator_harness.jsx` — LLM prompt builder for narration
- `generator_tester.jsx` — Test harness for generator output
- `image_registry.jsx` — Asset tracking and URL resolution

---

## How It Works: The Turns

### Game Start → World Generation

1. Player clicks "New Game"
2. `character_generator.jsx` builds a prompt with:
   - Archetype specifications (slot definitions + Character Schema v1.0 template)
   - Tone anchors (mid-sized college, lived-in town, adult characters)
   - Failure-mode safeguards (avoid stereotypes, require specificity, build roommate-Studious chemistry thread)
3. LLM returns a structured JSON: college name, all 5 romance characters, supporting NPCs, location roster, semester calendar
4. `student_body_v1.jsx` stores this in `window.storage` under `studentbody:world`

### Per-Turn Gameplay

1. Player sees the map, chooses a location, or triggers a scheduled event
2. `narrator_harness.jsx` builds a prompt with:
   - Current scene state (location, time, who's there, weather/vibe)
   - Relevant character schemas from `studentbody:world`
   - Player's stats, relationship flags, recent choices
   - Conditional narrative branches (romance progress, arc milestones)
3. LLM returns:
   - Narration text for the scene
   - 2–4 player choice buttons
   - Implicit stat ticks or relationship updates
   - Dialogue from NPCs
   - Persistence flags (new facts about characters, unlocked scenes, changed schedules)
4. `student_body_v1.jsx` parses output, updates `studentbody:player_state`, advances time, re-renders UI

### Apps & HUD

- **Roster app** → Lists all unlocked NPCs + their current location/availability
- **Anthrop app** → Reads `studentbody:player_stats` + recent arc progress, displays a one-page summary of "your semester so far + what you should focus on"
- **Compass app** → Map UI; tapping a location costs 1 time slot, triggers the narration cycle
- **Pulse app** → Uncompleted v1; messages would be sent by NPCs as side-channel notifications

---

## Asset Pipeline

### Image Hosting

All images live in this repo (`student-body-assets`). They are **public GitHub URLs**, not embedded in the artifact code.

Example access:
```
https://raw.githubusercontent.com/schlitzohr95/student-body-assets/main/locations/dorm_room.png
```

### Image Registry

`image_registry.jsx` maps archetype/location keys to URLs:
```javascript
{
  locations: {
    dorm_room: "https://raw.githubusercontent.com/.../locations/dorm_room.png",
    lecture_hall: "https://raw.githubusercontent.com/.../locations/lecture_hall.png",
    // ...
  },
  archetypes: {
    studious: "https://raw.githubusercontent.com/.../portraits/studious.png",
    // ...
  },
  icons: {
    spark: "https://raw.githubusercontent.com/.../icons/spark.png",
    // ...
  }
}
```

On every scene render, `student_body_v1.jsx` looks up the appropriate image and loads it as an `<img>` tag or background.

### Adding/Updating Assets

1. Create or update the PNG/SVG file in the repo (e.g., `locations/new_place.png`)
2. Commit & push to `main`
3. Update `image_registry.jsx` with the new entry if it's a new location/character
4. The next time a scene references that asset, it loads automatically

---

## Stat System & Character Affinities

Each character has:
- **Primary affinity** — the stat they care about most (gates their romance arc)
- **Secondary affinity** — second stat they respond to
- **Dismissive of** — a stat they don't care about or see through

Example: The Studious character has **Knowledge** as primary affinity, **Sensitivity** as secondary, **Athletics** as dismissive. Her romance arc requires you to demonstrate intellectual engagement (Knowledge) and emotional perceptiveness (Sensitivity). High Athletics won't impress her.

---

## Version & Status

- **Design**: v0.2 (locked in)
- **Implementation spec**: v0.3 (working)
- **Character schema**: v1.0 (locked in)
- **Code**: Early builds; artifact deployed in Claude.

---

## Key Files to Read Next

1. **For design intent**: `Project/DESIGN_DOC_v0.2.md`
2. **For character creation**: `Project/CHARACTER_SCHEMA_v1.0.md`
3. **For LLM integration**: `Project/IMPLEMENTATION_DOC_v0.3.md`
4. **For visuals**: `Project/IMAGE_PROMPTS_LOCATIONS.md`

---

## Quick Reference

| Aspect | Details |
|--------|---------|
| **Setting** | Aldenmoor College, mid-sized liberal arts, college town, 1 semester |
| **Player** | Male, 18–22, choosing between 5 generated female romance interests |
| **Length** | 16 weeks, 448 time slots |
| **Core Loop** | Map → Choose location → Arrive → LLM narrates → Spend time slot → Stat/relationship tick → Repeat |
| **Assets** | Pixel-art locations (1280×800), portraits (512×512), icons (256×256) |
| **Stats** | 5 hard-gate + soft narrative traits |
| **Romance** | Fade-to-black; each archetype has a romance arc gated by primary stat |
| **Narration** | LLM-driven; character schemas + scene context → dialogue + choices + implicit updates |
| **Storage** | `window.storage` artifact API, no database |
| **Deployment** | Interactive Claude artifact |

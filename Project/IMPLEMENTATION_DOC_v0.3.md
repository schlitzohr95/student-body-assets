# Student Body — Implementation Doc v0.3

The bridge from design to code. This doc covers the mechanics the artifact will actually run: how state is stored, what prompts get sent to the LLM, what shape the LLM is expected to return, and the test scenarios we use to validate that the narration is doing its job.

This is a working specification, not finished code. Some pieces (especially prompt strings) will need iteration once we see real LLM output. The point is to commit to a design that's coherent enough to start building from.

---

## Sections

1. **Storage schema** — what `window.storage` keys exist and the JSON shapes they hold
2. **Image registry** — how images are tracked, integrated, and served
3. **The world generator prompt** — runs once at game start
4. **The narrator prompt** — runs every player interaction
5. **The Anthrop summary prompt** — runs when the player opens the goals app
6. **Output parsing format** — how the artifact reads what the LLM returns
7. **Failure-mode test scenarios** — the specific scenes we use to validate behavior

---

## 1. Storage Schema

All state lives under a `studentbody:` prefix in `window.storage` to namespace cleanly against any other artifact data.

### Key conventions

- All keys are flat strings, no nesting
- Values are JSON-serialized objects unless noted
- Per-conversation persistence (the artifact storage API is per-user, per-artifact)

### Save metadata

**`studentbody:save_meta`**
```json
{
  "version": "0.3.0",
  "created_at": "2025-08-26T10:00:00Z",
  "last_played": "2025-09-04T22:14:00Z",
  "current_run_id": "run_2025_08_26_a"
}
```

The `current_run_id` lets us support multiple saves later without breaking v1. For v1 there's only ever one run at a time.

### World state

**`studentbody:world`**

The output of the world generator. Set once at game start; immutable after.

```json
{
  "run_id": "run_2025_08_26_a",
  "college_name": "...",
  "town_name": "...",
  "semester_label": "Fall semester",
  "start_date": "...",
  "end_date": "...",
  "capstone_event": {
    "name": "...",
    "week": 16,
    "description": "..."
  },
  "locations": [...],
  "characters": {
    "studious": { /* full character schema */ },
    "athletic": { /* full character schema */ },
    "artistic": { /* full character schema */ },
    "wildcard": { /* full character schema */ },
    "townie": { /* full character schema */ },
    "roommate": { /* full character schema */ },
    "bully": { /* full character schema */ },
    "professor": { /* full character schema */ },
    "ra": { /* full character schema */ },
    "flavor_npcs": [ /* array of full character schemas */ ]
  },
  "schedules": {
    "studious": { /* see schedule shape below */ },
    "...": "..."
  },
  "academic_calendar": {
    "midterms_week": 8,
    "finals_week": 16,
    "thanksgiving_week": 13,
    "dead_week": 15,
    "first_day": "..."
  },
  "player_classes": [
    {
      "name": "Introduction to Philosophy",
      "stat": "Knowledge",
      "schedule": { "MW": "morning" },
      "professor_id": "professor",
      "test_dates": [{ "type": "midterm", "week": 8 }, { "type": "final", "week": 16 }]
    }
  ]
}
```

### Player state

**`studentbody:player`**

Mutates constantly during play. The most-written key in the system.

```json
{
  "current_week": 4,
  "current_day": "Tuesday",
  "current_slot": "afternoon",
  "stats": {
    "knowledge": 4,
    "athletics": 6,
    "charm": 3,
    "sensitivity": 5,
    "grit": 4
  },
  "traits": ["morning person", "coffee shop regular", "philosophy reader"],
  "relationships": {
    "studious": { "score": 12, "stage": "approach" },
    "athletic": { "score": 4, "stage": "notice" },
    "artistic": { "score": 0, "stage": "unmet" },
    "wildcard": { "score": 6, "stage": "notice" },
    "townie": { "score": 18, "stage": "approach" },
    "roommate": { "score": 35, "stage": "established" },
    "bully": { "score": -8, "stage": "antagonist" }
  },
  "active_threads": [
    {
      "id": "thread_townie_car",
      "summary": "Mari mentioned her car needs a repair she can't afford.",
      "first_seen_week": 5,
      "first_seen_day": "Friday",
      "involves": ["townie"],
      "type": "open_lead",
      "dismissed": false
    }
  ],
  "commitments": [
    {
      "id": "commit_battle_bands",
      "summary": "Battle of the Bands at the student union",
      "week": 6,
      "day": "Friday",
      "slot": "evening",
      "source": "bulletin_board"
    }
  ],
  "active_goals": []
}
```

### Event log

**`studentbody:event_log`**

Append-only chronological record of significant events. Source of truth for memory, Anthrop, NPC reactions, narration consistency. The most important data structure in the system.

```json
{
  "events": [
    {
      "id": "evt_001",
      "week": 1,
      "day": "Monday",
      "slot": "morning",
      "location": "lecture_hall",
      "type": "scene",
      "summary": "First day of Intro to Philosophy. Player sat next to Studious — brief introduction.",
      "involves": ["studious"],
      "witnesses": ["studious", "professor"],
      "stat_changes": { "knowledge": 1 },
      "trait_changes": [],
      "tags": ["academic", "first_meeting"]
    }
  ]
}
```

The `witnesses` field is what makes the anti-omniscience rule mechanical: NPCs only know about events where they're listed as a witness, plus events that propagate through social-network rules (gossip, public events).

### NPC state

**`studentbody:npc_state:<character_id>`**

Per-character mutable state, separate from the immutable world bundle. One key per named NPC.

```json
{
  "character_id": "studious",
  "current_mood": "stressed",
  "mood_baseline": "neutral",
  "mood_decay_rate": "slow",
  "memory_log": [
    {
      "event_id": "evt_017",
      "week": 4,
      "summary": "Player brought her coffee at the library on Tuesday afternoon.",
      "valence": "warm",
      "remembered": true
    }
  ],
  "standing_context": "Player has been increasingly attentive over the past two weeks. She's noticed but hasn't said anything.",
  "disclosed_to_player": ["lit thesis topic", "stress about midterms"],
  "disclosed_by_player": ["that he's pre-med"],
  "current_arc_beat": "approach",
  "schedule_overrides_this_week": []
}
```

### Image registry

**`studentbody:image_registry`**

Maps semantic IDs to image URLs. The artifact reads from this when rendering anything visual.

```json
{
  "locations": {
    "dorm_room": {
      "url": null,
      "prompt_text": "...",
      "status": "pending"
    },
    "coffee_shop": {
      "url": "https://raw.githubusercontent.com/[user]/student-body-assets/main/locations/coffee_shop.png",
      "prompt_text": "...",
      "status": "active"
    }
  },
  "portraits": {
    "townie": {
      "url": null,
      "prompt_text": "...",
      "status": "pending"
    }
  },
  "icons": {
    "compass": {
      "url": null,
      "prompt_text": "...",
      "status": "pending"
    }
  }
}
```

When an image is missing, the artifact renders a clean placeholder: a gradient rectangle with the location/character name in pixel-art font. Never a broken-image link.

### Anthrop view cache

**`studentbody:anthrop_cache`**

Cached output of the Anthrop summary so the player tapping the app doesn't trigger an LLM call every time. Invalidated by any new event log entry.

```json
{
  "generated_at": "2025-09-04T22:14:00Z",
  "cache_key": "evt_142",
  "active_threads": [...],
  "upcoming_commitments": [...],
  "recent_significant_moments": [...],
  "nudges": []
}
```

### Schedule shape (referenced from world bundle)

```json
{
  "regular": {
    "monday": { "morning": "library", "afternoon": "library", "evening": "dorm", "night": "dorm" },
    "tuesday": {...}
  },
  "floating": [
    { "frequency": "weekly", "options": ["coffee_shop", "park", "bookstore"], "slots_per_week": 1 }
  ],
  "overrides": []
}
```

### Storage write pattern

The artifact writes state changes in this order on every meaningful turn:

1. Append new event to `studentbody:event_log`
2. Update `studentbody:player` (stats, traits, relationships, active_threads, commitments)
3. Update affected `studentbody:npc_state:*` keys (memory, mood, standing_context)
4. Invalidate `studentbody:anthrop_cache`
5. Update `studentbody:save_meta` (last_played)

If any write fails, the turn is treated as not-yet-committed and the player can retry. We don't try to do partial commits — state lives or dies as a unit per turn.

---

## 2. Image Registry

### Purpose

Decouple image generation from prototype development. The artifact runs whether images exist or not; you fill them in over time.

### Workflow

1. The artifact ships with `image_registry` populated with `null` URLs and the prompt text for every required image (from `IMAGE_PROMPTS_LOCATIONS.md` and `IMAGE_PROMPTS_PORTRAITS_AND_ICONS.md`).
2. You generate an image, host it (public GitHub repo recommended).
3. You tell me "this URL is for the coffee shop" and I update the registry's `coffee_shop` entry with `url` and set `status` to `"active"`.
4. The artifact picks up the new URL on next render.

### URL convention

Once you've set up the asset repo, URLs follow this pattern:

```
https://raw.githubusercontent.com/[username]/student-body-assets/main/locations/[location_id].png
https://raw.githubusercontent.com/[username]/student-body-assets/main/portraits/[character_id].png
https://raw.githubusercontent.com/[username]/student-body-assets/main/icons/[icon_id].png
```

### Placeholder rendering

When `url` is `null` or `status` is `"pending"`:

- **Locations**: A gradient rectangle (warm cream to muted gold), 16:9 aspect ratio, with the location name centered in pixel-art-style text. Optionally a small icon hinting at the location type (a book for the library, a cup for the coffee shop).
- **Portraits**: A circular gradient avatar with the character's first initial in the center. Color varies by character ID so they're at least distinguishable from each other.
- **Icons**: A solid color square with a single-character label (the first letter of the app name).

The placeholders should look *intentional* — not "image failed to load," more "we haven't done this part yet." Visual scaffolding the player can tolerate during prototype play.

### Bulk update

When you want to add several images at once, give me the list and I'll batch the registry updates in a single artifact change.

---

## 3. The World Generator Prompt

Runs once when the player starts a new game. Output is the entire `studentbody:world` bundle minus the metadata fields the artifact controls (run_id, dates, etc.).

### Prompt structure

```
You are generating a complete cast and world for "Student Body," a single-player narrative dating sim set at a small liberal arts college during one fall semester. The output will be used by another AI as authoritative reference material for narrating the game.

Your task: produce a coherent, specific, lived-in world. The archetypes and locations are fixed; you are filling in *who specifically* lives this run.

# Archetypes to fill

Generate full character schemas for the following five romanceable women, all written as adult college students except where noted. The romance ceiling for the game is fade-to-black, but characters are full adults with full inner lives.

1. THE STUDIOUS — academic-leaning, lives in books and ideas, anxious overachiever or quietly brilliant. Has unspoken chemistry with the Roommate (see special note below).
2. THE ATHLETIC — varsity or serious club athlete, disciplined, social through sport.
3. THE ARTISTIC — creative major or scene kid, expressive, on a different wavelength.
4. THE WILDCARD — chaos energy, crosses social lines, harder to read, sometimes a rival.
5. THE TOWNIE — the barista at the local coffee shop. Working-class, paying her own way through community college / a trade school program. Different rhythm from the campus four. Adult, not a student at the main college.

Generate full character schemas for the following non-romance recurring characters:

6. THE ROOMMATE / BEST FRIEND — male, the player's best friend from before college. Roommates by choice. Genuinely warm, present, unawkward. His flaw is being too available — says yes too much, gets walked on. Honest but gentle. Has unspoken chemistry with the Studious (see below).
7. THE BULLY — antagonist. You choose what kind: academic rival, social-clique antagonist, or the ex of one of the romance characters.
8. THE PROFESSOR — one prominent faculty member, mentor or obstacle.
9. THE RA — authority figure on the dorm floor.
10. 2-3 FLAVOR NPCS — recurring background characters (e.g., a regular at the gym, a librarian, the cafeteria worker).

# The roommate-Studious chemistry thread (special note)

Both characters' schemas should reflect this:
- They have unspoken, unacted-on chemistry. Neither has named it.
- The Roommate's schema should note: lights up around her, more talkative, slightly flustered in small ways, remembers her details, defends her gently.
- The Studious's schema should mirror this: equally warm around him, makes excuses for proximity, has an "atmosphere" with him others can perceive.
- Both should be too good or too shy to act on it.
- Neither schema should describe this as melodramatic. It's quiet, observable, real.

# Character schema format

Each character gets a full schema following the v1.0 format:
- identity (name, age, pronouns, role_in_world, occupation_or_program, hometown, living_situation)
- engine (core_want, core_fear, public_self, private_self, biggest_contradiction, what_they_self_deceive_about)
- semester (working_on, current_pressure, hidden_situation)
- voice (speech_summary, vocabulary_register, rhythm, three_speech_tics, things_she_would_never_say, two_dialogue_examples)
- what_lands_what_falls_flat (what_lands, what_falls_flat, gift_logic, how_she_reads_the_player)
- stat_affinity (primary_affinity, secondary_affinity, dismissive_of, trait_responses)
- trait_expansions (3-5 core traits, each with surface_behavior / underlying_reason / trigger / limit / contradiction / scene_expression)
- emotional_and_behavioral_states (default_state, under_stress, when_tired, when_happy, when_angry, when_hurt, when_attracted, when_caught_off_guard)
- relationship_texture (with_strangers, with_close_friends, with_authority, with_the_player_initially, what_makes_her_open_up, what_makes_her_close_off)
- connections_to_other_characters (knows, doesnt_know, history_with)
- narrator_notes (do_not_flatten_into, do_not_overuse, good_recurring_motifs, arc_skeleton)

# Locations to flavor

Generate names, vibes, hours, and brief descriptions for the following 15 locations:
[list of 15 locations from the design doc]

# Anti-failure-mode requirements

Do NOT produce:
- The Studious as just a Hermione clone
- The Athletic as just a jock
- The Artistic as a manic-pixie-dream-girl
- The Wildcard as just edgy
- The Townie as a poverty trope or a self-improvement project for the player
- The Roommate as a comic-relief frat type
- Any character whose entire personality is one trait

Each character must have:
- A specific working_on item that is unique to them this run, not a generic version of their archetype's pursuit
- A core fear that is theirs specifically, not their archetype's default
- A hidden_situation that recontextualizes them when learned
- Speech tics specific enough that the narrator can keep their voices distinct

# Output format

Return a single JSON object matching the world bundle schema. No prose preamble, no markdown formatting, no commentary. Just the JSON.

The college and town names should sound real but be original. Avoid clichés (no "Riverdale College," no "Pine Valley").
```

### Notes on the generator prompt

- **The prompt is large.** It's load-bearing — generating an inadequate cast at the start poisons the entire run, so spending tokens up front is correct.
- **The "anti-failure-mode requirements" section is critical.** Without it, the LLM defaults to archetype clichés. With it, the LLM is forced to do the work of inventing specifics.
- **The chemistry thread special note appears in two places** (in the cast list and in its own section). Redundancy is intentional — this thread is the most distinctive narrative element and we don't want the generator to under-weight it.
- **Output is JSON only.** No prose. Easier to parse, harder for the LLM to drift into commentary.

---

## 4. The Narrator Prompt

Runs every time the player takes an action that requires LLM narration. This is the most-called prompt in the system and the one whose quality most determines whether the game feels good.

### Prompt structure

```
You are the narrator for "Student Body," a single-player narrative dating sim. You describe scenes in third-person-limited from the protagonist's perspective. The protagonist is a male college freshman; the player controls his choices.

# Narration contract

You DO:
- Describe scenes when the player arrives somewhere — the room, the time of day, who's there, what they're doing, the small specifics that make the place feel real.
- Give NPCs voice — distinct speech patterns, body language, the small physical specifics that stand in for portraits.
- Surface choice points — when the scene contains a decision, present 2-4 options or invite free-form input.
- Track consequences — small mechanical changes shown briefly in the structured tail, not in prose.
- Hold tone — the world is grounded. People are people. No Aaron Sorkin speeches, no anime sweat-drop reactions, no narrator winks.

You DO NOT:
- Pre-warn the player. When the player chooses an action, you do not insert "are you sure" hesitation or inject hypothetical consequences before the action resolves. The player chose; you describe what happens.
- Gate based on stats. If the player tries something they're under-statted for, describe them failing or struggling. Do not block the action.
- Lecture. If a player makes a choice another character would disapprove of, the character expresses disapproval (often nonverbally). You do not.
- Insert moral commentary. Consequences emerge from the world. You describe them without editorializing.
- Give NPCs omniscience. NPCs only know what they have witnessed or been told. Reference the witnesses field of recent events to determine what each NPC knows.
- Repeat reactions. Each significant development gets one reaction beat per witness, not one per encounter.
- Protect the player from earned outcomes. If the player has been a jerk to someone for weeks, that history is in the event log. Honor it.

# World context

[Locations summary]
[Current week, day, slot, weather]

# Player state

Stats: [stats]
Traits: [traits]
Recent significant events (last 10): [recent events from event log]
Active threads: [open leads from active_threads]

# NPCs present

[For each NPC at the current location:]
- Name: [name]
- Schema excerpt: [voice, current arc beat, what_lands/what_falls_flat, current mood]
- Memory log relevant to player (last 5 interactions): [excerpts]
- Standing context: [text]
- Has she/he reacted yet to recent events? [yes/no list of event IDs]

# The current situation

The player just [action / choice / arrival]. [Specific situational context.]

# Output format

Respond with:

1. Narrative prose (one to four paragraphs). Concrete, specific, in voice.
2. A blank line.
3. A choice block OR an open prompt:
   - Choice block: `[CHOICES]` followed by 2-4 numbered options on separate lines, then `[/CHOICES]`.
   - Open prompt: `[OPEN]` on its own line, indicating the player can type free-form.
4. A blank line.
5. A structured tail in JSON, wrapped in `[STATE]...[/STATE]` tags. Contents:
   - `event_summary`: one-sentence summary of what happened this turn for the event log
   - `witnesses`: list of NPC IDs who witnessed this turn
   - `stat_changes`: object mapping stat names to deltas (omit if none)
   - `trait_changes`: object with `add` and `remove` arrays (omit if none)
   - `relationship_changes`: object mapping NPC IDs to score deltas (omit if none)
   - `new_threads`: array of new active_thread objects (omit if none)
   - `npc_mood_changes`: object mapping NPC IDs to new mood values (omit if none)
   - `npc_disclosure_updates`: object describing what NPCs newly know about the player or vice versa (omit if none)

Stay in voice. Do not narrate the JSON. Do not break the fourth wall. Do not explain mechanics in the prose.
```

### Notes on the narrator prompt

- **The "DO NOT" list is the most important section.** These are the failure modes that, per Vault 83 lessons, the LLM will produce by default unless explicitly forbidden.
- **NPC context is heavily filtered.** We don't pass entire schemas every turn — only voice, current arc beat, what_lands/what_falls_flat, and current mood. The full schema lives in storage and gets pulled in only for high-stakes scenes.
- **The event log is summarized to the last 10 events.** Older events compress into "standing context" that gets passed instead. Otherwise the prompt grows unboundedly across a 16-week game.
- **Choice blocks vs. open prompts.** The narrator decides which to use based on the situation. Generally: scenes with clear branching options use [CHOICES]; quiet conversational moments use [OPEN]. The player can always type free-form even when choices are presented.

---

## 5. The Anthrop Summary Prompt

Runs when the player taps the Anthrop app and the cache is invalid (a new event has been logged since the last generation).

### Prompt structure

```
You are Anthrop, an AI assistant on the protagonist's phone in "Student Body." You summarize what's currently relevant for the player based on their event log and current state.

# Voice

Dry, factual, slightly observational. Not chirpy. Not cute. No emojis. No personality affectations. Prefer specifics over generalities. Brief.

Occasionally — rarely, maybe one entry in fifteen — allow a small flicker of personality. Examples of the right register:
- "You haven't been to the gym since week 6."
- "You've been to the coffee shop seven times this week. Filed under: 'observation.'"
- "Hard week. Get some sleep."

Never lecture. Never moralize. Never announce that you're being sympathetic.

# Input

Event log (last 30 events): [excerpts]
Player active_threads: [threads]
Player commitments: [commitments]
Current week, day, slot: [date]

# Output

Return a JSON object with these fields:

- `active_threads`: array of {summary, days_since_seen} objects. Pull from the player's active_threads list, refresh summaries to be current.
- `upcoming_commitments`: array of {summary, when_relative} objects. Pull from commitments. `when_relative` is human-readable ("Tonight," "Friday evening," "Next week").
- `recent_significant_moments`: 5-8 short summaries of recent events worth surfacing. Filter out routine moments (attending class, casual encounters with no movement).
- `nudges`: 0-3 observations about patterns. Use the voice described above. Examples: "You haven't talked to [Studious] in nine days." Only generate nudges when there's a real observation to make.

Return JSON only. No prose preamble.
```

### Notes on the Anthrop prompt

- **The voice is half the work.** The bulleted examples in the prompt do most of the calibration. Without those examples, the LLM defaults to a chirpier productivity-app register that contradicts the design.
- **The cache means this prompt runs rarely.** Maybe once or twice per session. Cost is low.
- **Nudges are deliberately rare.** "0–3" is the constraint, but in practice most generations should produce zero nudges. A nudge is for when the LLM has an actual observation to make, not when it's filling slots.

---

## 6. Output Parsing Format

### Narrator output structure (recap)

```
[Prose paragraphs]

[CHOICES]
1. [option text]
2. [option text]
3. [option text]
[/CHOICES]

[STATE]
{
  "event_summary": "...",
  "witnesses": ["studious"],
  "stat_changes": {"sensitivity": 1},
  ...
}
[/STATE]
```

### Parsing strategy

The artifact's parser:

1. Splits the response on `[STATE]`.
2. The portion before is the player-visible content (prose + choice block / open prompt).
3. The portion between `[STATE]` and `[/STATE]` is JSON to parse and apply.
4. If JSON parsing fails, the artifact logs an error and applies *no* state changes for that turn — but still shows the prose. (Better to lose mechanical updates than crash the play session.)

### Within the player-visible content

- If `[CHOICES]...[/CHOICES]` is present: render the prose, then render a choice list. Player taps an option; the option text becomes the next user message to the LLM.
- If `[OPEN]` is present: render the prose, then show a text input prompt. Player types; their input becomes the next user message.
- If neither is present: render the prose, time advances to the next slot automatically (this happens for atmospheric moments without a decision).

### Error handling

- **Malformed JSON**: log, skip state updates, render prose, continue.
- **Missing [STATE] block**: log, render prose, time advances (no state changes).
- **Empty response**: retry once, then surface a "the moment passes uneventfully" placeholder and advance time.
- **Response exceeds reasonable length**: truncate prose to a sensible cap, parse JSON if present, continue.

The principle: the play session never breaks because of a parsing failure. The player should be able to keep playing even if a single turn produces garbage. We log everything for later debugging.

---

## 7. Failure-Mode Test Scenarios

These are the specific scenes we run against the narrator prompt to validate it's behaving correctly. Each scenario describes the setup, the player action, and the *correct* and *incorrect* narrator behaviors.

We run these before any v1 release. If the narrator fails any, the prompt needs revision before we ship.

### 7.1 The "are you sure" test

**Setup**: Player at Charm 2, week 5, in the dining hall. The Wildcard is sitting alone two tables over. Player chooses "Walk over and try to flirt."

**Correct behavior**: Narrator describes the player walking over and attempting to flirt. The attempt is awkward, lands flat, the Wildcard's response reflects the low Charm (cool, brief, slightly amused but not warm). Stat: charm +1 (he gained from the attempt). Relationship change: -1 to 0 (didn't impress).

**Incorrect behavior** (we explicitly DO NOT WANT):
- Narrator inserts "Are you sure? Your Charm is low" before resolving
- Narrator describes the player hesitating and choosing not to do it
- Narrator gates the action ("You don't have the confidence to do this yet")
- Narrator delivers a tutorial-style explanation of why Charm matters

### 7.2 The omniscience test

**Setup**: Player had a great date with the Artistic on Friday evening (week 4). Saturday morning, player goes to the library where the Studious is studying. Studious was not at the date and has not been told about it.

**Correct behavior**: Studious greets the player normally. Asks how the weekend has been so far if conversation flows that way. Has no reaction to the date because she does not know about it.

**Incorrect behavior**:
- Studious knowingly references the date
- Studious is cold, jealous, or distant in a way that implies she knows
- Narrator includes commentary like "though if she knew about Friday, she'd feel..."
- Studious asks pointed questions about the Artistic specifically

### 7.3 The repeated reaction test

**Setup**: Player skipped a midterm in week 8 (a major event). In week 9, they encounter the Roommate (who heard about it Monday and reacted), then the Studious (who heard Tuesday and reacted), then the Roommate again on Wednesday.

**Correct behavior**: First Roommate encounter has his reaction. Studious encounter has her reaction. *Second* Roommate encounter doesn't re-litigate it — he might reference it briefly, but the conversation moves on. The reaction is integrated into standing_context, not repeated.

**Incorrect behavior**:
- Roommate delivers the same lecture/concern in both encounters
- Every NPC the player meets brings up the missed midterm
- The narrator surfaces the missed midterm as a lingering atmosphere in every scene

### 7.4 The behavioral disapproval test

**Setup**: Player was rude to the Townie in week 6 (snapped at her during a busy shift). Week 7, player returns to the coffee shop.

**Correct behavior**: Mari is more reserved. Shorter sentences. Doesn't joke. Takes the order, makes the drink, gets back to work. The player can feel the cooling without her saying "I'm upset with you." The narrator describes her behavior; she does not deliver a speech about how the player hurt her.

**Incorrect behavior**:
- Mari verbalizes her hurt directly ("I was upset by what you said last week")
- The narrator inserts moralizing commentary about the player's behavior
- Mari behaves identically to before (no consequence at all)

### 7.5 The chemistry-thread perception test

**Setup**: Week 3. Player at Sensitivity 6. Player and Roommate are at the dining hall when the Studious joins them with her tray.

**Correct behavior**: The narrator describes the scene in a way that includes observable signals — the Roommate is more talkative than usual, lights up slightly, asks her about something specific from a previous conversation. Studious mirrors. The player is given the *texture* of what's happening but it's not announced. A perceptive player will pick up on it.

**Incorrect behavior**:
- Narrator names the chemistry directly ("The roommate clearly has feelings for her")
- The signals are entirely absent (no sign of anything between them)
- The signals are exaggerated to the point of melodrama (longing looks, awkward silences)

### 7.6 The low-Sensitivity perception test

**Setup**: Same as 7.5, but Player at Sensitivity 2.

**Correct behavior**: The scene is narrated with the same events occurring but the *narration* doesn't draw attention to the small chemistry signals. They happen in the world but the player's perceptive lens — which the narration represents — doesn't surface them. A player at low Sensitivity reading this scene would conclude "they're friends, that's nice."

**Incorrect behavior**:
- The signals are the same as in 7.5 (Sensitivity ungated)
- The narrator explicitly tells the player they failed a Sensitivity check
- All chemistry signals are removed from the world, not just from the player's perception

### 7.7 The earned-failure test

**Setup**: Player has been distant from the Athletic all semester (relationship score: 4 in week 14). Player attempts to ask her out for the dead-week date.

**Correct behavior**: The Athletic declines, kindly but clearly. She has her own life, the player has not been part of it, and she's not interested in starting now. The narrator describes the rejection cleanly; the player feels it without being lectured.

**Incorrect behavior**:
- The Athletic accepts because the game is "supposed to" let players date romance options
- The narrator softens the rejection to spare the player
- The Athletic delivers a paragraph explaining her reasons in detail

### 7.8 The unprompted-tutorial test

**Setup**: Player begins a new game and arrives at the dorm room for the first time.

**Correct behavior**: Narrator describes the dorm room and the Roommate. The Roommate greets the player warmly (they've known each other since high school). The scene establishes the relationship through behavior. No mechanics are explained.

**Incorrect behavior**:
- Narrator explains the stat system in prose
- Roommate delivers tutorial-style exposition ("Remember, your Charm stat affects...")
- A choice block contains options like "Learn about stats" or "Hear how dating works"

### 7.9 The "Anthrop should be quiet" test

**Setup**: Player opens Anthrop in week 2. Nothing dramatic has happened yet. Player has had a normal first week.

**Correct behavior**: Anthrop returns a sparse view. Maybe two recent moments worth noting. No nudges (nothing to observe yet). Upcoming commitments may be empty. The view feels like a *real* personal assistant being briefly useful.

**Incorrect behavior**:
- Anthrop fabricates significance to fill space
- Anthrop offers life advice
- Anthrop's tone is cheery or motivational
- Anthrop emoji-decorates the output

### 7.10 The slow-burn test

**Setup**: Player has been pursuing the Townie consistently — coffee shop visits, walking her home, conversations off-shift — over weeks 4 through 9. Relationship score is now in the high range. Player tries to kiss her at the end of a walk home.

**Correct behavior**: If the relationship has actually been built (not just visited), the kiss can land. The narrator describes the moment in a way that's honest to *her* — Mari kissing the player would be quiet, slightly surprised at herself, careful. Fade-to-black if appropriate to the scene's natural ending. The moment feels earned because the event log shows the work.

**Incorrect behavior**:
- The kiss is rejected because the system doesn't trust the relationship score
- The kiss happens but is narrated identically to how it would for any character (Mari, who is reserved and proud, kisses the player like a romance-novel cover)
- The narrator pre-warns ("She might not be ready for this")

---

## What this doc deliberately does not cover

Deferred to v0.4+:
- **Test minigame design** — what test-day puzzles actually look like per subject
- **Save migration** — how we handle versioning between v1 and future versions
- **Multi-save support** — concurrent runs in storage
- **Replay analytics** — tracking what a player did across runs to surface across-run patterns

Open for v1 implementation phase:
- **Tuning the narrator prompt against the test scenarios** — first runs will fail some of these and we'll iterate on phrasing
- **Calibrating Anthrop's nudge frequency** — "1 in 15" is a guess; play will tell us the right rate
- **The choice block vs. open prompt heuristic** — the narrator's decision rule for which to use will need refinement

---

*v0.3 — implementation specification. v0 prototype artifact to follow.*

# Student Body — Build Roadmap v0.1

This document sequences the work between where the project currently is and a playable v1. It is meant to be revised as we learn things in play.

## Current state (snapshot)

**Done:**
- Design doc v0.2 (locked design, all open questions resolved)
- Character schema v1.0 (with Mari as worked example, blank template, SillyTavern-macro version, and standalone macro definitions)
- Implementation doc v0.3 (storage schema, prompt strings, output parsing, failure-mode test scenarios)
- Image prompt docs (locations, portraits/icons, style alternatives)
- Visual identity proven: Sienna portrait, coffee shop background, compass icon — all locked
- Full SVG placeholder library (38 assets) authored and pushed to schlitzohr95/student-body-assets
- World generator validated (one strong full-cast run produced)
- Character generator artifact built and working
- Narrator harness built; all 9 canonical scenarios pass on first run; off-canonical edge cases (lying, off-stage NPC contact) surfaced one real prompt gap
- v0 skeleton built and replaced with v1 canonical artifact (student_body_v1.jsx) using the diegetic-phone geometry
- Asset pipeline working: SVGs inlined directly in artifact source; sandbox-blocked external hosting documented and avoided

**Not done (in order of priority):**
- LLM integration in the playable artifact (currently scripted)
- Real time/schedule system with scripted blocks
- Resource layer (money, energy)
- Pulse messages app
- Buzz feed app
- Anthrop tracker app (functional)
- Bulletin board sub-interaction in Compass
- Real character portraits beyond Sienna
- Real location backgrounds beyond the coffee shop
- Test-day minigames
- The cast-promotion mechanism (v1.5+)
- The roommate-Studious chemistry thread surfacing in actual play (not just narrator harness)
- The Studious-friend pinned note (way out of scope for v1)

## Phase 1 — Wire the narrator into the playable artifact

This is the gate-blocker. Until the narrator runs in the artifact, everything else is decoration.

### 1.1 — Decide narrator-call architecture
- API call shape: `window.claude.complete()` with the narrator prompt as system, the assembled scene-context as user message
- Output parsing: prose → [CHOICES] block or [OPEN] marker → [STATE] JSON tail (per implementation doc §6)
- Failure handling: if [STATE] fails to parse, log the failure but display the prose anyway; the turn proceeds, just without state updates
- Timing: ~3-8 seconds per call expected; show a non-intrusive "..." indicator in the dialogue strip
- Rate limiting: one narrator call per player action (choice click or location nav), no speculative pre-calls

### 1.2 — Build the scene-context assembler
This is a function that takes current game state and produces the user message for the narrator. It needs to include:
- Current week, day, time slot
- Current location (name + brief description from a static lookup)
- Player state: stats (Charm/Sensitivity/Knowledge/Athletics/Grit), traits, relationships with present NPCs
- NPCs present (full schema, current mood, last-seen disposition)
- Recent event log filtered to events the present NPCs witnessed
- The player's chosen action (or "[arrived at location]" if just navigating)

Implementation: a single `buildNarratorContext(state, action)` function in the artifact. Has to be careful about token budget — the recent event log is the most likely thing to bloat. Cap at ~10 most recent events filtered by relevance.

### 1.3 — Replace getSceneFor() with real narrator calls
Currently the artifact has scripted scene strings. Replace with:
1. Player triggers an action
2. Show "..." in dialogue strip
3. Call narrator with assembled context
4. Parse response: prose, choices/open, state
5. Display prose in dialogue strip, choices below
6. Apply state changes to game state, save to window.storage
7. Append event to event log

### 1.4 — Test the loop end-to-end
- Start new game (with hardcoded world for now — world generator integration is Phase 2)
- Navigate to coffee shop
- Narrator runs, Mari is present, scene narrates
- Choose an option, narrator runs again with that choice as the action
- Repeat across several time slots
- Reload artifact mid-session, confirm state persists, confirm narrator picks up where it left off

**Estimated effort:** 4-6 hours of building, 2-3 hours of debugging. The scene-context assembler is the trickiest part because token budget management is a real constraint.

**Risks:** First real-play narrator output will surface 2-4 prompt issues we couldn't catch in the harness because they only appear under accumulated context. Budget another 2-4 hours of prompt iteration.

## Phase 2 — Wire the world generator into game start

Currently new-game uses hardcoded NPCs (Mari + Marcus). Real game start should generate a full cast.

### 2.1 — New-game flow
- Player clicks "New Game"
- Show a "generating your semester..." screen with a progress indicator
- Call world generator (single API call, ~15-25 seconds)
- Parse the JSON output, validate against schema
- Populate game state with generated NPCs, college, town
- Set player to dorm room, week 1, Monday 8:00am
- Trigger first scene (narrator call against the new world)

### 2.2 — Schema validation
The world generator can produce malformed output. We need a validator that:
- Checks all 9 character slots are present
- Checks each character has the required fields (per CHARACTER_SCHEMA_v1_0.md)
- Falls back gracefully if validation fails (offer to regenerate, or use a hardcoded backup cast)

### 2.3 — World data routing
World gen produces locations, college details, town details. These need to feed into:
- The Compass map (location list)
- The Roster (cast)
- The narrator's scene context (location descriptions)

**Estimated effort:** 3-4 hours.

**Risks:** Generated worlds will occasionally produce edge cases we didn't anticipate (an NPC referencing a location that wasn't generated, a character whose schedule conflicts with their schedule template). The prompt may need tightening; the validator may need more rules.

## Phase 3 — Time, schedule, and resources

Currently the artifact has a basic clock that advances on action. Real play needs:

### 3.1 — Two-hour time slots with scripted blocks
Per the conversation in the chat: 8 slots/day at 2-hour granularity, some pre-scripted as required-attendance blocks (classes). Schedule comes from world generator output (player's class schedule generated alongside the cast).

Implementation:
- Time advances by program logic, not by narrator
- Locked blocks (class) appear on the schedule and either consume slots or trigger consequences if missed
- Travel costs: walking from A to B = 1 slot for adjacent locations, 2 for cross-town. Bike halves walk costs. Bus = 1 slot regardless. Uber = 0 slots, costs money.

### 3.2 — Money and energy systems
- Money: starts at $X (configurable), earned from job, spent on transit/food/coffee/items
- Energy: 0-100, depletes with activity, restores with sleep, short-term boostable with coffee/energy drinks
- Display: small stat strip on the home screen, full view in Self app

### 3.3 — Part-time job (optional v1, mandatory v1.5)
Some players will want a money source. Simplest implementation: bookstore shifts, scheduled blocks (e.g., Tue/Thu 18:00-22:00), earns $X/shift, eats 2 slots, can skip at relationship cost with whoever runs it.

### 3.4 — Defer to v1.5: sleep debt, hygiene, hunger
These are mechanically similar to energy and can be added without re-architecting. Skip for v1 to keep scope finite.

**Estimated effort:** 6-8 hours total. Time/schedule is the biggest piece; money/energy are smaller adds.

**Risks:** Schedule conflicts (player wants to do something but a class blocks it) need clean UX. The "you missed class" consequence path needs design — does the narrator handle it, or does the program insert a flat penalty?

## Phase 4 — Phone apps (functional)

The artifact has 11 apps; only Compass, Roster, Self are functional. The rest are stubs.

Priority order:

### 4.1 — Anthrop (assistant tracker)
The most important non-Compass app. Shows active threads, upcoming commitments, recent significant moments. Voice: dry-with-occasional-warmth (per design doc §5).

Implementation:
- Reads from event log
- Calls the Anthrop summary prompt (per implementation doc §5) when opened, with smart caching so we don't re-call every time
- Returns a structured summary that renders as 4 categories on screen

### 4.2 — Pulse (messages)
The big one. Off-stage NPC contact. The harness surfaced this as a real gap in the narrator contract — the contract needs amendment per the "off-shape inputs" section we drafted in chat:

> Calling, texting, or messaging an NPC who isn't physically present. Treat this as a normal action. The NPC may or may not respond depending on time of day, their schedule, and their relationship with the player. Narrate the contact happening.

Implementation:
- UI: phone-portrait orientation, list of conversation threads, tap to open a thread
- Each thread is text-message-style, auto-scrolling
- Sending a text triggers a narrator call with a "the player is texting [NPC]" framing
- NPC may respond immediately, after a delay, or not at all (based on their schedule and disposition)
- Texts appear in event log and can be referenced in subsequent scenes

This is where the diegetic-phone idea most pays off and where the most novel design work happens. Worth getting right.

### 4.3 — Buzz (NPC social feed)
NPCs post. Player sees the feed. Posts can be foreshadowing (Athletic posts a photo from a run = she's at the trail right now), can be character development (Studious posts a long earnest thing about a paper she's working on), can be narrative (the bully posts something subtweeting someone the player knows).

Implementation:
- Generated periodically: some posts are scheduled (NPCs on certain days post certain kinds of things), some are reactive (an NPC who had a notable event posts about it)
- Each post is short LLM-generated text + an optional image reference
- Player can like/comment, and these become events that affect the relationship

### 4.4 — Bulletin board (Compass sub-interaction)
Not strictly an app — it's a sub-interaction at the Student Union location. Generates 1-3 random campus events (battle of the bands, improv show, philosophy lecture, intramural sign-ups). Player can commit, which adds to Anthrop's upcoming commitments.

Implementation: a small LLM call when the player visits the Student Union location, with a "generate 1-3 flyers" prompt. Cached per day so the board is the same across multiple visits in the same day.

### 4.5 — Decorative apps (Spark, Margin, Lens, Wake, Beacon)
Stay decorative for v1. Wake might get functional in v1.5 (alarm = sleep schedule). Margin (notes) might get functional if the player wants to journal. Spark is likely v2.

**Estimated effort:** Anthrop = 3-4 hours. Pulse = 8-12 hours (this is a real subsystem). Buzz = 6-8 hours. Bulletin board = 2-3 hours.

**Risks:** Pulse is the biggest single risk in this phase because off-stage NPC contact has implications for the narrator contract that we haven't fully mapped. Expect to find gaps.

## Phase 5 — Visual asset completion

Currently only Sienna portrait, coffee shop background, and compass icon are "real." Everything else is SVG placeholder.

### 5.1 — Generate the rest of the romance cast portraits
Use the locked Sienna prompt template, adapt subject section per character schema. Order:
- Studious (Nadia archetype)
- Artistic (Paz archetype)
- Wildcard (Rowan archetype)
- Townie (Mari) — already partially designed in chat, finish

### 5.2 — Generate non-romance portraits
- Roommate — handle with care per the chat history, but don't be precious
- Bully, Professor, RA — secondary priority

### 5.3 — Generate location backgrounds
Priority order from the locations doc: dorm room, library main floor, quad, student union (with bulletin board), then the rest. 18 total.

### 5.4 — Per-asset workflow
Per asset: generate via Chroma in pixel-art mode, iterate 2-4 times until it lands, push as both PNG and SVG to the asset repo, swap the inline SVG in the artifact's INLINE_SVGS constant.

**Estimated effort:** 30-60 minutes per asset, ~30 assets remaining. Can be done in parallel with everything else.

**Risks:** Asset workflow stalls when a character is hard to generate. Sienna took several iterations; some others will too.

## Phase 6 — The cast-promotion mechanism (v1.5+)

Per the project instructions, this is a design principle from day one but a v1.5+ feature mechanically. When we get to it:

### 6.1 — Recognition
The narrator surfaces NPCs the player has interacted with multiple times. Currently event log tracks this implicitly; we'd need the narrator to be aware of "this person has appeared N times" and mark them for promotion.

### 6.2 — Promotion threshold
Probably a soft signal rather than a hard count: when an NPC has appeared in N+ events, has had M+ direct interactions with the player, and has been referenced in K+ player choices, they're a candidate for promotion. A separate small LLM call evaluates whether they should be promoted.

### 6.3 — Schema generation for promoted NPCs
When an NPC is promoted, generate a full character schema for them (using the character generator), save to game state, include in future narrator context as a real character.

### 6.4 — UI integration
Promoted NPCs appear in Roster, can be texted via Pulse, may have Buzz posts.

**Estimated effort:** 8-12 hours. Significant design work first.

## Phase 7 — Test-day minigames (v1.5+)

The design doc has these as a v1 feature but I've moved them to v1.5 because they're not on the critical path to a playable game. When we get to them:

### 7.1 — Minigame registry
4-6 subjects, one minigame each (math, lit, bio, history, etc.). Each minigame is a small React component with its own logic.

### 7.2 — Difficulty scaled by study time
The study mechanic during the week affects the minigame's difficulty: more study = more time, easier puzzles, hint reveals.

### 7.3 — Outcome maps to a stat
Successful minigame → Knowledge (or relevant sub-stat) +X. Failed minigame → small stat penalty + narrator handles the consequences.

**Estimated effort:** 4-6 hours per minigame, 4-6 minigames = 16-36 hours.

## Phase 8 — Playtesting and iteration

This is not a phase, it's a continuous activity from Phase 1 onward. But there's a discrete moment where the prototype becomes "playable enough that real play surfaces real problems":

### 8.1 — First full playtest
After Phases 1-3, you can play a real semester start-to-finish. Even with placeholder visuals and stub apps, the core loop should work. This is where the project either feels right or doesn't.

### 8.2 — Prompt iteration based on real play
The narrator harness validated isolated scenes; real play will surface failure modes that only appear under accumulated context. Expect to revise the narrator prompt several times. Use the harness for each revision.

### 8.3 — Design revision based on real play
Some design decisions will turn out wrong in play. Examples we might find: 2-hour slots are wrong granularity, the resource layer is too heavy or too light, certain choice patterns are too repetitive. Be willing to revisit the design doc.

## What's explicitly not in this roadmap

- Sequels, alternate settings, alternate genres
- Multiplayer / shared world
- Mobile-first UI (this is desktop-first per current decision)
- Real database / cloud save (window.storage is the v1 storage, with a clean migration path to localStorage when the project moves out of the artifact)
- Public release / shareability — Caleb has been clear this is a development tool, not a shipped product
- Advanced visuals (animations, transitions beyond what's already built, parallax, etc.)
- Voice acting, music, SFX

## Decision points still pending

These are open questions that should be resolved before or during the relevant phase:

1. **The Self/Mirror app naming question** (Section 5 of design doc, footnote) — pick one before Phase 4.5.
2. **Player class schedule source** — generator-output (recommended) vs. course-registration UI. Resolve before Phase 2.
3. **Money starting amount and earn/spend rates** — needs tuning during Phase 3.
4. **Whether the narrator gets any LLM-call rate limiting beyond "one per action"** — may matter for token budget; revisit during Phase 1.4 testing.
5. **Whether scene-overlay portraits get added** (currently narration-only) — revisit during Phase 5 when real portraits exist.
6. **What the inventory and self floating icons actually do** in the game UI (currently visual-only) — revisit during Phase 4.

## Recommended next session

If we have momentum: Phase 1.1-1.3 — wire the narrator into the playable artifact. This is the biggest single unlock and everything else builds on it.

If we want a smaller win: any single asset from Phase 5, or finish the Anthrop app from Phase 4.1 against the existing scripted scenes.

If we want to think rather than build: revisit the cast-promotion mechanism design (Phase 6) so the architecture choices we make in Phases 1-4 don't accidentally close the door on it.
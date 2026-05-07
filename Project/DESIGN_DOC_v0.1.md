# Project [Codename TBD] — Design Doc v0.1

A Tokimeki-style stat-raiser dating sim, set in a college town, with LLM-driven narration and NPCs. Single-player. One semester (~16 weeks). Five romanceable archetypes filled per run by an LLM generator. Map-based navigation, schedule-driven NPC routines, hybrid stat system. Pixel-art location backgrounds and character portraits supplied by the player. Academic test-day minigames. Fade-to-black romance ceiling. Persistence via the artifact storage API.

This doc covers the design before any code is written. Implementation details (storage schema, image generation strategy, exact API call shapes) are deferred to a v0.2 technical doc.

---

## 1. The World Generator

### What runs at game start

When the player begins a new game, the LLM is asked to generate the *specific instance* of the world for this run. The archetypes, locations, and structure are fixed. The names, faces, personalities, majors, schedules, and quirks are not.

### What's fixed (designed up front)

- **The college**: name is generated, but it's a mid-sized liberal arts school in a small-to-mid college town. Single campus, walkable, ringed by townie businesses.
- **The 5 romance archetypes** (slot definitions, not specific people):
  - **Studious** — academic-leaning, lives in books and ideas, anxious overachiever or quietly brilliant
  - **Athletic** — varsity or serious club athlete, disciplined, social through sport
  - **Artistic** — creative major or scene kid, expressive, on a different wavelength
  - **Wildcard** — chaos energy, crosses social lines, harder to read, sometimes a rival
  - **Townie** — the barista. Working class, paying her own way through community college / trade school, on the grind. Different rhythm from the campus four.
- **Non-romance archetype slots** (recurring NPCs the player encounters but can't date):
  - **The Roommate** — your assigned dorm roommate, becomes a friend or thorn
  - **The Bully** — antagonist, makes specific characters' lives harder
  - **The Professor** — at least one prominent faculty member, mentor or obstacle
  - **The RA** — authority figure on the dorm floor
  - **The Best Friend** — someone you click with platonically, source of advice and gossip
  - 2–3 additional **flavor NPCs** the generator decides on (a regular at the gym, a librarian, the cafeteria worker who knows everyone, etc.)
- **The location set** — ~12–15 locations across campus and the adjacent town. Designed up front; the generator names and flavors them but doesn't invent the slate.
- **The semester structure** — 16 weeks, classes meet on a fixed weekly cadence, midterms in week 8, finals in week 16.

### What the generator produces per run

A structured world bundle the artifact stores and refers back to. For each romanceable character:

- **Name, age, year, major, hometown** (or for the townie: program, employer, situation)
- **Core fear / core want** — the engine of their arc
- **Public self vs. private self** — what they show vs. what's actually going on
- **What they're working on this semester** — a specific arc-level pursuit (a thesis, a recital, a championship, a transfer application, a pharmacy tech certification exam, etc.)
- **Three speech tics or verbal habits** — small specifics the LLM uses to keep their voice consistent
- **What lands vs. what falls flat** — gift logic, gesture logic, conversational topics they warm to or close off around
- **Stat affinity profile** — which of the player's stats this character notices and values
- **Schedule** — where they are, by day and time slot, across a typical week
- **One secret** — something the player can only learn deep into the arc that recontextualizes them

For each location: name, vibe, hours, who tends to be there when, the pixel-art prompt.

For each non-romance NPC: name, role, relationship to the romanceable cast, schedule, function in the player's story.

### The generator's prompt structure (sketch)

The prompt that generates the run will:

1. Specify the archetype slate with detailed character schemas to fill in
2. Provide tonal anchors (mid-sized college, lived-in town, no high-school energy, no quirky-for-quirky's-sake)
3. Require structured JSON output matching the schema
4. Forbid certain failure modes explicitly (the Studious One being just Hermione, the Athletic One being just a jock, the Townie being a poverty trope)
5. Require *specificity* — the working-on items should be unique to this character, not interchangeable

### Why generated-from-archetypes (not hand-authored, not free)

The archetype slate is the *mastery loop*: across runs, the player learns that the Studious type tends to study at the library afternoons, that the Athletic type's free time is post-practice evenings, that the Townie's only off-shift is Sunday. That meta-knowledge is the reward for replay. The specific person filling the slot is fresh each run, so the *content* is novel even when the *structure* is familiar. This is the single most important design decision in the doc and everything else follows from it.

---

## 2. The Core Loop

### Time structure

- **A semester is 16 weeks.**
- **Each week is 7 days** (Mon–Sun).
- **Each day has 4 time slots**: Morning, Afternoon, Evening, Night.
- That's **448 time slots** across a full playthrough. Plenty of room for arcs, but every slot has weight.

### Default weekday rhythm

On a typical weekday, time advances semi-automatically:

- **Morning slot**: classes are in session. The player either attends (default), skips (with consequences), or has a free block depending on their schedule. Attendance is narrated briefly with occasional NPC interactions, choice points, or stat ticks.
- **Afternoon slot**: free. Player chooses. This is the main *agency* slot of the weekday.
- **Evening slot**: free. Second main agency slot.
- **Night slot**: usually narrated as wind-down (study, sleep, occasional event). Player can sometimes choose to go out, with stat consequences if they over-do it.

### Weekend rhythm

Saturday and Sunday have no morning class block. All four slots are free. This is when arcs accelerate — longer dates, away-from-campus excursions, the major events.

### The player's per-slot decision

When a slot is "free," the player sees the map and chooses where to go. On arrival, the LLM narrates the scene based on:

- Who's there (per the schedule system + any in-progress arcs)
- The player's current stats and recent history
- Time of day, week of semester, weather/season flavor
- Any pending events queued for this slot

The narration ends with either a natural close (player leaves, time advances) or a choice point (the LLM offers 2–4 paths, or the player types free-form input).

### Activity slots produce

- **Stat changes** (small, mostly +1 to one stat, occasionally larger for milestone moments)
- **Relationship changes** with anyone present
- **Trait/tag accumulation** (player gets descriptors: "morning runner", "philosophy reader", "late-night studier")
- **Event flags** (anything that needs to be remembered: "saw Studious crying outside the library Tuesday week 4")

### What a typical week looks like for the player

Roughly: 5 weekdays of classes-plus-two-free-blocks, two weekend days of full agency. ~20 free slots per week. Of those, the player will probably spend ~6–10 on stat building (gym, library, hobby, work-study), ~6–10 on social/relationship pursuit, and the rest on rest, exploration, or chasing leads from earlier events.

### Pacing levers

The semester has natural acceleration points:

- **Week 1–3**: introductions, world legibility, low stakes
- **Week 4–7**: arcs visibly developing, first major event (homecoming-equivalent week 5–6)
- **Week 8**: midterms — first hard test gate, first relationship inflection point
- **Week 9–11**: mid-semester arcs, deeper commitments, secrets surfacing
- **Week 12–14**: Thanksgiving-equivalent break, choice of who to spend it with, arcs converge
- **Week 15**: dead week, the last big window before finals
- **Week 16**: finals + the semester capstone event (formal, end-of-semester party, whatever the world generator names)

---

## 3. The Stat / Trait System

### Hard-gate stats (small set, mechanical)

These are numbers the game checks against thresholds. Roughly five:

- **Knowledge** — academic performance, intellectual confidence. Gates: passing courses, conversational depth with Studious, certain scholarship/internship events.
- **Athletics** — physical fitness and coordination. Gates: completing physical activities (intramurals, hikes, the 5k event), Athletic affinity.
- **Charm** — social ease, presence, conversational confidence. Gates: high-stakes social moments, asking people out, Wildcard affinity.
- **Sensitivity** — emotional perceptiveness, ability to read a room. Gates: reaching the deep layers of any character's arc, Townie affinity (she can tell when someone's faking interest), Artistic affinity.
- **Grit** — discipline, follow-through, work ethic. Gates: holding down a job, completing semester-long pursuits, Townie respect (she sees this one clearly).

Each stat ranges 0–10 at start and can climb to ~20 by semester end with focused effort. Most players will end with 2–3 stats high and 2–3 stats neglected — that's the design.

### Soft traits (larger set, narrative)

Stats answer "can the player do this." Traits answer "who is the player becoming." Traits are tags the LLM accumulates and references in narration:

- Examples: `morning person`, `night owl`, `bookish`, `gym regular`, `coffee shop regular`, `vegetarian`, `parties hard`, `homebody`, `flirts easily`, `slow to open up`, `philosophical streak`, `pragmatist`, `cinephile`, `running club regular`
- Traits are earned through repeated behavior (3+ uses) or single significant choices
- The LLM is given the trait list as character context and uses it to color narration ("you, a confirmed night owl, find the 8am lecture especially brutal")
- Traits can compound or conflict ("flirts easily" + "slow to open up" produces a specific narrative texture)

### Why hybrid

Pure hard gates make the LLM a number-checker and produce 1994-style "you need 7 Charisma to flirt" mechanics. Pure soft traits make stats feel decorative — why grind the gym if it just adds an adjective? The hybrid: stats matter for concrete things and gate the *structural* progression (you can't pass Bio without studying, you can't ask out the Athletic without a baseline). Traits matter for *texture* and shape how every scene reads. Both are visible to the LLM; both feed into how NPCs perceive the player.

### How stats change

Almost all stat gain is small and incremental. Most slot activities give +1 to a single stat. Some give +1 to two stats (running with a friend = Athletics + relationship). Milestone moments (finishing a thesis, winning a competition) give larger bumps. Stats can also *decrease* — neglecting sleep, partying through midterms, losing a fight all have consequences.

### Visibility

The player sees stats numerically in their stat panel. Traits are listed as a tag cloud. Both are always one tap away in the phone UI (a "Self" app or similar).

---

## 4. The NPC Simulation

### Schedules

Every named NPC has a weekly schedule: where they are by day and slot. Schedules are realistic — the Studious is at the library Tuesday/Thursday afternoons, the Athletic is at practice Mon/Wed/Fri evenings, the Townie is at the coffee shop most weekdays 6am–2pm and Saturdays 8am–4pm.

Schedules have **regular slots** (weekly recurring) and **floating slots** (variable day/time, generated weekly). Floating slots create the "I never know exactly when I'll run into them" texture.

Schedules are **broken or shifted** by ongoing events: midterms week pushes everyone toward study spaces, a romantic milestone with the player can shift their patterns, a personal crisis can take them out of rotation entirely.

### Memory

Each NPC has a memory log specific to the player:

- **Cumulative relationship score** (numeric, hidden from player)
- **Recent significant moments** (last ~5–10 interactions worth remembering)
- **Standing context** — what they currently know about the player, what they currently feel, what's pending between you
- **Disclosed information** — what the player has told them, what they've told the player

Memory is what gets passed to the LLM in narration prompts so the NPC's behavior is consistent with history. *The player gave Studious a coffee she remembered a week ago* is a tiny moment that the LLM should reference if the player runs into her again that week.

### Mood

Each NPC has a current mood state that decays toward baseline but spikes from events. Mood affects how they respond to encounters — a great workout puts the Athletic in a generous mood for the rest of the day, a bad shift puts the Townie in a closed-off mood until Sunday. Mood is one variable, not a system; it's mostly a way to make consecutive interactions feel different.

### Anti-omniscience rule

NPCs **do not** know things they haven't been told or witnessed. If the player has a great date with the Artistic on Friday, the Studious doesn't know about it Monday unless someone told her. This is a load-bearing rule that prevents the "every NPC reacts to your latest move" failure mode. Information spreads through:

- **Direct disclosure** (player tells someone)
- **Witnessing** (NPC was present)
- **Social network** (best friends share gossip; rivals notice things; the bully hears everything because he's nosy)
- **Public events** (winning a campus election everyone knows; a fight in the dining hall everyone heard about)

### Single reaction per development

When something significant happens, each NPC reacts to it *once* — the next time the player sees them. After that, it's integrated into their standing context, not re-litigated. This prevents the "every NPC re-runs the lecture every time you see them" failure mode.

### Behavioral, not verbal, disapproval

When an NPC disapproves of the player's choices, this is shown through behavior — being less available, shorter responses, declining invites, looking away — rather than long verbal critiques. The LLM is told: characters express their feelings the way real people do, mostly indirectly. Lectures are reserved for characters whose role is to lecture (the Professor occasionally; the RA on real dorm policy issues).

---

## 5. The Phone Metaphor

The phone is the player's primary UI for non-map information. Each app does something *mechanical*, not just decorative.

### Apps in v1

- **Messages** — text conversations with anyone whose number you have. Async; you can text someone and they'll respond within a slot or two depending on their availability. Messages are LLM-narrated. Used for arranging plans, casual contact, late-night vulnerability moments.
- **Contacts** — list of everyone you've met. Tap a contact for their name, what you know about them, your current standing, recent shared moments. Acts as the player's memory aid.
- **Self** — your own stats, traits, current goals/leads, calendar of upcoming events you've committed to.
- **Feed** — a fake social app where NPCs post occasionally. Pictures of the campus, study selfies, the Athletic posting after a meet, the Artistic sharing work, the Townie rarely posting and then suddenly something raw at 1am. This is *texture* — most posts don't require player action, but they keep the world feeling alive between encounters and occasionally surface arc hooks ("Studious posted at midnight: 'I don't know what I'm doing here'").
- **Map** — the navigation interface. Locations show as icons, with indicators for who's likely there and whether it's open.

### Apps deferred to v1.5+

- **Dating app** — could exist as a way to meet additional non-romanceable flirts for low-stakes practice; deferred because it adds writing load and isn't core to the Tokimeki loop
- **Calendar/planner** — deferred; the Self app handles upcoming events for now
- **News** — campus news feed for events; deferred, world events surface through Feed and direct invites instead

### What the phone is *not*

The phone is not a control panel for the game. The player navigates by tapping the map, not by typing commands into the phone. The phone is a *layer* — information, communication, social texture — sitting on top of the world the player is actually moving through.

---

## 6. The Narration Contract

This is the most important section in the doc. Everything else can be salvaged if the narration is right; nothing else matters if the narration is wrong.

### What the narrator is

The narrator is a third-person-limited voice describing the player's experience as they move through the semester. It is *not* an omniscient overseer, *not* a dungeon master with rules to enforce, *not* a moralist, *not* a coach. It is the texture of being the protagonist.

### What the narrator does

- **Describes scenes when the player arrives somewhere** — the room, the time of day, who's there, what they're doing, the small specifics that make the place feel real
- **Gives NPCs voice** — distinct speech patterns, body language, the small physical specifics that stand in for portraits
- **Surfaces choice points** — when the scene contains a decision, present 2–4 options *or* invite free-form input
- **Tracks consequences** — small mechanical changes (stats, relationship, traits) shown briefly, usually after the scene resolves
- **Holds tone** — the world is grounded. People are people. No Aaron Sorkin speeches, no anime sweat-drop reactions, no narrator winks.

### What the narrator does *not* do

This list is informed by the failure modes documented in the Vault 83 work and applies just as forcefully here:

- **The narrator does not pre-warn the player.** When the player chooses an action, the narrator does not insert "are you sure" hesitation or inject hypothetical consequences before the action resolves. The player chose; the narrator describes what happens.
- **The narrator does not gate based on stats it can see.** If the player tries something they're under-statted for, the narrator describes them *failing or struggling*, not the action being blocked. (Hard gates are mechanical and handled at the system level — explicit "you need X to attempt this" — not snuck in via narration.)
- **The narrator does not lecture.** If a player makes a choice another character would disapprove of, the *character* expresses disapproval (often nonverbally). The narrator does not.
- **The narrator does not insert moral commentary.** Consequences emerge from the world; the narrator describes them without editorializing. If a choice leads somewhere bad, that's bad enough.
- **The narrator does not give NPCs omniscience.** See Section 4. If a character would not plausibly know something, they don't know it.
- **The narrator does not repeat itself.** Each significant development gets one reaction beat per witness, not one per encounter.
- **The narrator does not protect the player from earned outcomes.** If the player has been a jerk to someone for 8 weeks, the confession scene fails. Narrator describes the failure honestly.

### Framing precision (per Vault 83 lessons)

Instructions describing narrator behavior are written *descriptively* (what the narrator does) rather than in ways that can be misread as directives to *produce* the unwanted behavior. "The narrator describes consequences as they emerge from the world" — not "the narrator should make the player face consequences."

### What gets passed to the LLM on each turn

A structured prompt containing:

- **System context**: the narration contract, world rules, current week + day + time
- **World state**: relevant location, who's present and their schedule reasoning
- **Player state**: stats, traits, recent significant events, current goals
- **NPC state for anyone present**: their schema, current mood, memory log relevant to this player, current arc state
- **The specific situation**: what the player just did or chose
- **Output format**: narrative paragraph(s), then any choice points, then any system updates (stat changes, flags, etc.) in a structured tail the artifact parses

### Output format the artifact expects

The LLM responds with a structured shape — narrative prose followed by a JSON tail describing mechanical updates. The artifact parses the tail to update state and renders the prose in the chat-like main view. (Exact format is a v0.2 implementation detail.)

---

## 7. Calendar & Arc Structure

### The semester clock

The semester is the game's pressure source. Every choice trades a slot the player will not get back. By week 12, the player should feel the squeeze.

### Beat structure

Each romanceable arc is a 16-week shape with rough beats:

- **Weeks 1–3 — Notice**: meet, register, first real conversation. The character becomes a *person* to the player rather than an archetype.
- **Weeks 4–6 — Approach**: deliberate pursuit begins. First one-on-one event. Stat affinity starts mattering.
- **Weeks 7–9 — Friction**: a complication. The character's *core fear* surfaces or their secret edges into view. The player either earns trust or loses ground.
- **Weeks 10–12 — Depth**: if they're still in it, the relationship becomes real. Vulnerable moments. Plans together that extend past the semester.
- **Weeks 13–15 — Stakes**: Thanksgiving choice, final approach decision, who do you spend the dead week with.
- **Week 16 — Capstone**: the semester-end event. Confession, breakup, choice point, depending on how it's gone.

The LLM is given the arc skeleton and *current beat* for each character, so it knows what stage of the arc this scene is in and writes accordingly. The player can pursue 1–3 arcs realistically in 16 weeks; pursuing more dilutes everything.

### Non-romance arcs

The semester also contains:

- **Academic arc** — coursework, midterms, finals, possibly a specific class/professor that becomes a story (cf. the Professor archetype)
- **Antagonist arc** — the Bully has a structure: presence, escalation, confrontation, resolution
- **Self arc** — the player's own thread, which can be career-flavored (a job, an internship, a club presidency) or hobby-flavored (band, art, sport) or just the becoming-someone arc

The capstone event (week 16) is shaped by which arcs the player invested in. A player who chased the Studious and won a literary prize has a different finals week than a player who ran the marathon and had a falling-out with the Athletic.

---

## What this doc deliberately does not cover

- **Storage schema** — keys, value shapes, persistence patterns (v0.2)
- **Image registry implementation** — how prompts surface, how images are integrated, fallbacks (v0.2)
- **Exact LLM prompt strings** — the narration prompt, the generator prompt, the parsing format (v0.2)
- **Minigame design** — what the test-day puzzles actually are per subject, the difficulty curve, the studying-helps mechanic (v0.3)
- **Codename and visual identity** — the project doesn't have a name yet; we should pick one before v1 ships
- **Failure-mode test scenarios** — a separate document of "scenes that have historically broken LLM-driven games" we test against (v0.2)

---

## Open questions for review

1. Is the 5-archetype slate right, or do you want a different cast composition?
2. Is "Notice / Approach / Friction / Depth / Stakes / Capstone" the right arc shape, or does it need to be tighter / looser?
3. Are there phone apps you'd want in v1 that I cut?
4. Do you want a non-romanceable "best friend" character to be the player's confidant *by default*, or earned through play?
5. The Bully — do you want this as a fixed antagonist, or generator-determined per run (could be an academic rival, a social-clique antagonist, an ex of one of the romance characters, etc.)?
6. Should the player character have a *defined* gender / orientation, or be configurable, and does that affect the romanceable cast composition?

---

*v0.1 — design only. Implementation doc to follow once this is reviewed.*

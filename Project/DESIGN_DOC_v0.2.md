# Project Student Body — Design Doc v0.2

A Tokimeki-style stat-raiser dating sim, set in a college town, with LLM-driven narration and NPCs. Single-player. One semester (~16 weeks). Five romanceable archetypes filled per run by an LLM generator. Map-based navigation, schedule-driven NPC routines, hybrid stat system. Pixel-art location backgrounds and character portraits supplied by the player. Academic test-day minigames. Fade-to-black romance ceiling. Persistence via the artifact storage API.

This doc covers the design before any code is written. Implementation details (storage schema, image generation strategy, exact API call shapes) are deferred to the v0.3 implementation doc.

**v0.2 changelog:** Folded in roommate-as-default-best-friend, his characterization, the chemistry-with-Studious thread, the player gender lock-in, the apps revisions (Anthrop as functional, bulletin board replacing Loop), and the cut of the original "open questions" section since all six are resolved.

---

## Locked-in design decisions

- **Setting**: college town, mid-sized liberal arts school, single campus + adjacent town
- **Length**: one semester, 16 weeks, finals week 16
- **Player character**: male, pursuing female romance interests (classic Tokimeki framing). Cast is written as adult college students; the Townie is an adult community college student. Romance ceiling is fade-to-black.
- **Cast composition**: 5 romanceable archetypes (Studious, Athletic, Artistic, Wildcard, Townie) filled by generator per run
- **Mastery loop**: archetype roster is fixed across runs; specific person filling the slot is generated each run
- **Loop**: hybrid — schedule structure, free-form events, map-based navigation, LLM narration on arrival/interaction
- **Stats**: hybrid — five hard-gate numerical stats (Knowledge, Athletics, Charm, Sensitivity, Grit) + a wider set of soft narrative traits
- **Visuals**: pixel-art location backgrounds + character portraits, supplied by player, integrated via image registry
- **Minigames**: academic test-day minigames only for v1; everything else handled in narration
- **Persistence**: artifact storage API (`window.storage`); no database for v1
- **Image hosting**: public GitHub repo for assets, referenced via URL

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
- **The non-romance archetype slots**:
  - **The Roommate / Best Friend** — the player's best friend from before college, now his roommate by choice. Default confidant. Has his own arc. (See Section 4 for full characterization.)
  - **The Bully** — antagonist, generator-determined per run (could be an academic rival, social-clique antagonist, or the ex of one of the romance characters)
  - **The Professor** — at least one prominent faculty member, mentor or obstacle
  - **The RA** — authority figure on the dorm floor
  - 2–3 additional **flavor NPCs** (a regular at the gym, a librarian, the cafeteria worker who knows everyone, etc.)
- **The location set** — ~12–15 locations across campus and the adjacent town, including: dorm, lecture halls, library, dining hall, quad, gym, student union (with bulletin board), the coffee shop, a bar, a bookstore, a park, the one good restaurant, the Townie's apartment building, the running trail
- **The semester structure** — 16 weeks, classes meet on a fixed weekly cadence, midterms in week 8, finals in week 16, semester capstone event in week 16

### What the generator produces per run

A structured world bundle the artifact stores and refers back to. For each named character, a populated **Character Schema v1.0** sheet (see separate doc).

For each location: name, vibe, hours, who tends to be there when, the pixel-art prompt.

For each non-romance NPC: schema sheet, with arc skeleton scaled to their narrative role.

### Generator prompt structure (sketch)

The generator prompt will:

1. Specify the archetype slate with the schema as the fill target
2. Provide tonal anchors (mid-sized college, lived-in town, no high-school energy, no quirky-for-quirky's-sake)
3. Require structured JSON output matching the schema
4. Forbid certain failure modes explicitly (the Studious One being just Hermione, the Athletic One being just a jock, the Townie being a poverty trope, the Roommate being a comic-relief frat type)
5. Require *specificity* — the working-on items should be unique to this character, not interchangeable
6. Note the **roommate-Studious chemistry thread** (see Section 4) so the generator builds it into both characters' schemas with consistent texture

### Why generated-from-archetypes

The archetype slate is the *mastery loop*: across runs, the player learns that the Studious type tends to study at the library afternoons, that the Athletic's free time is post-practice evenings, that the Townie's only off-shift is Sunday. That meta-knowledge is the reward for replay. The specific person filling the slot is fresh each run, so the *content* is novel even when the *structure* is familiar.

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
- **Afternoon slot**: free. Player chooses. Main agency slot.
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
- **Event flags** (anything that needs to be remembered)

### Weekly shape

Roughly: 5 weekdays of classes-plus-two-free-blocks, two weekend days of full agency. ~20 free slots per week. Of those, the player will probably spend ~6–10 on stat building, ~6–10 on social/relationship pursuit, and the rest on rest, exploration, or chasing leads from earlier events.

### Pacing levers

- **Week 1–3**: introductions, world legibility, low stakes
- **Week 4–7**: arcs visibly developing, first major event
- **Week 8**: midterms — first hard test gate, first relationship inflection point
- **Week 9–11**: mid-semester arcs, deeper commitments, secrets surfacing
- **Week 12–14**: Thanksgiving-equivalent break, choice of who to spend it with
- **Week 15**: dead week, the last big window before finals
- **Week 16**: finals + the semester capstone event

---

## 3. The Stat / Trait System

### Hard-gate stats

Five stats, ranges 0–10 at start, climb to ~20 by semester end with focused effort:

- **Knowledge** — academic performance, intellectual confidence. Gates: passing courses, conversational depth with Studious, certain scholarship/internship events.
- **Athletics** — physical fitness and coordination. Gates: completing physical activities, Athletic affinity.
- **Charm** — social ease, presence, conversational confidence. Gates: high-stakes social moments, asking people out, Wildcard affinity.
- **Sensitivity** — emotional perceptiveness, ability to read a room. Gates: reaching the deep layers of any character's arc, Townie affinity, Artistic affinity, **noticing the roommate-Studious chemistry**.
- **Grit** — discipline, follow-through, work ethic. Gates: holding down a job, completing semester-long pursuits, Townie respect.

Most players will end with 2–3 stats high and 2–3 stats neglected — that's the design.

### Soft traits

Tags the LLM accumulates and references in narration. Examples: `morning person`, `night owl`, `bookish`, `gym regular`, `coffee shop regular`, `vegetarian`, `parties hard`, `homebody`, `flirts easily`, `slow to open up`, `philosophical streak`, `pragmatist`.

Earned through repeated behavior (3+ uses) or single significant choices. Visible to the LLM as character context. Can compound or conflict.

### How stats change

Almost all stat gain is small and incremental. Most slot activities give +1 to a single stat. Some give +1 to two stats. Milestone moments give larger bumps. Stats can also decrease — neglecting sleep, partying through midterms, losing a fight all have consequences.

### Visibility

Player sees stats numerically and traits as a tag cloud in the **Self/Mirror** phone app.

---

## 4. The NPC Simulation

### The Roommate / Best Friend

The most carefully-drawn non-romance character in the project, and a major load-bearing piece of the social design.

**Setup**: Player and Roommate have known each other since high school. Came to college together. Roommates by choice, against the conventional wisdom of "don't live with your best friend." Their friendship has its own private vocabulary, rituals, and rhythm. They got along well enough before college that they bet on living together and it's worked.

**Characterization**:
- **Genuinely warm, present, unawkward.** Not socially anxious, not a recluse — well-liked because he's *good*. The friction in his life isn't social difficulty; it's the cost of being that good in a world that takes it.
- **His flaw is being too available.** Says yes too often. Justifies it for everyone. Volunteers for things he doesn't want to do because someone needs help and he can. Gets walked on by people who aren't even being malicious about it — they just learned that he'll always say yes. A virtue overextended.
- **His honesty is gentle, not sharp.** Tells the truth and helps the player find a way forward in the same breath. *"Yeah, that was not a great decision. But you'll see her tomorrow and can explain."* Not cynical. Doesn't pile on. Doesn't soften the truth — just doesn't weaponize it.
- **He has his own arc.** Not romance. Something he's working on: a major decision, a family thing, a class he's struggling in, a club he's overcommitted to. The player can witness it and occasionally help. His arc is *his*, not a player-service mechanism.
- **He can be wrong.** Gives bad advice sometimes — not because he's foolish but because he's also a 19-year-old figuring it out. Has to apologize occasionally. Real friend, not a wisdom dispenser.

**Mechanics**:
- Free interaction every Morning and Night slot in the dorm (no schedule friction)
- Available as a confidant when the player has a question — the natural person to ask "should I text her? was that flirting? did I mess up?"
- Can be invited to bulletin-board events; investing in him deepens the friendship and may help him with his own situation
- His arc reaches a small capstone in week 16 regardless of player investment, but its *quality* depends on how present the player has been

**The reward isn't getting him to participate in things.** It's noticing when he's overextending himself and being the friend who occasionally tells him to put himself first. The arc-level success is him saying *no* — to a club he doesn't want, to a favor that isn't his job, eventually maybe even to the player.

### The Roommate–Studious Chemistry Thread

A first-class feature of the design, not a hidden Easter egg. The most distinctive narrative element in the project.

**The setup**: The Roommate has unspoken, unacted-on chemistry with the Studious. He hasn't named it to himself or to anyone. She likes him too — equally unspoken, equally half-aware. They've been orbiting each other since the semester started. Both are slightly too good or too shy to act on it.

**Early texture (weeks 1–6, before player begins pursuing her)**:
The chemistry is *visible* but not announced. Specifically:
- He **lights up** when she's around. His energy bumps up; he's a little funnier.
- He's **more talkative** with her, not less. Engaged, not flustered-shy.
- He gets **a little flustered** in specific small ways: a beat slower when she compliments something he said, a small smile he tries to play off, a moment where he loses his place in a sentence.
- He **goes places she's likely to be** — agrees to library afternoons quicker on her days, doesn't propose them.
- He **defends her gently** when someone makes a casual dismissive comment.
- He **remembers things about her** — surfaces a detail about her recital next week that the player didn't tell him about.

She **mirrors this**. Equally warm around him, makes excuses for proximity, remembers his details, has an *atmosphere* with him in the room that the player can perceive entering.

**Player perception is gated by Sensitivity**:
- Low Sensitivity: may register "those two are friends, that's nice" and miss the rest entirely
- Mid Sensitivity: notices intermittently, may name it to themselves around weeks 4–6
- High Sensitivity: notices early and clearly

**The shift to quieter / sadder happens after the player begins pursuing her**:
- He gets quieter when her name comes up
- His "go for it, you should ask her out" has weight behind it
- He still supports the player. Still cares. The cracks are *small* and never weaponized. He'd be embarrassed if he knew the player saw them at all.

**Critically**: there is no required resolution. The player can:
- Pursue her anyway and accept that the friendship has a quiet weight in it
- Pursue her *and* talk to the roommate about it
- Realize what's happening and step back, then nudge the roommate toward her — possibly successfully
- Decide they like her enough to pursue honestly and have a real conversation with the roommate
- Miss the whole texture entirely

The system does not punish any of these choices. It just shows the player what each costs.

**Pinned design note (filed for later, not for v1 implementation prep): The Studious has a friend in the same general nerd-dork register, *not a copy*, her own person. If the player nudges the roommate-Studious connection along, the Studious might propose a double-date and bring her friend. Whether anything develops there is downstream of play.**

### Schedules

Every named NPC has a weekly schedule: where they are by day and slot. Schedules are realistic — Studious at the library Tuesday/Thursday afternoons, Athletic at practice Mon/Wed/Fri evenings, Townie at the coffee shop most weekdays 6am–2pm and Saturdays 8am–4pm.

Schedules have **regular slots** (weekly recurring) and **floating slots** (variable day/time, generated weekly).

Schedules are **broken or shifted** by ongoing events: midterms week pushes everyone toward study spaces, a romantic milestone with the player can shift their patterns, a personal crisis can take them out of rotation entirely.

### Memory

Each NPC has a memory log specific to the player:
- **Cumulative relationship score** (numeric, hidden)
- **Recent significant moments** (last ~5–10 interactions worth remembering)
- **Standing context** — what they currently know, currently feel, what's pending
- **Disclosed information** — what the player has told them, what they've told the player

Memory feeds the LLM in narration prompts. *The player gave Studious a coffee she remembered a week ago* should surface if the player runs into her again that week.

### Mood

Each NPC has a current mood state that decays toward baseline but spikes from events. Mood affects how they respond to encounters. One variable, not a system; it's mostly a way to make consecutive interactions feel different.

### Anti-omniscience rule

NPCs **do not** know things they haven't been told or witnessed. If the player has a great date with the Artistic on Friday, the Studious doesn't know about it Monday unless someone told her. Information spreads through:
- **Direct disclosure** (player tells someone)
- **Witnessing** (NPC was present)
- **Social network** (best friends share gossip; rivals notice things; the bully hears everything)
- **Public events** (winning a campus election everyone knows; a fight in the dining hall everyone heard about)

### Single reaction per development

When something significant happens, each NPC reacts to it *once* — the next time the player sees them. After that it's integrated into their standing context, not re-litigated.

### Behavioral, not verbal, disapproval

When an NPC disapproves of the player's choices, this shows through behavior — being less available, shorter responses, declining invites, looking away — rather than long verbal critiques. Lectures are reserved for characters whose role is to lecture.

---

## 5. The Phone Metaphor

The phone is the player's primary UI for non-map information. Each app does something *mechanical*, not just decorative.

### v1 functional apps (six total)

- **Compass** — the navigation interface. Locations show as icons, with indicators for who's likely there and whether it's open. Includes the **bulletin board** sub-interaction at the student union.
- **Pulse** — messages app. Async text conversations with anyone whose number you have. LLM-narrated. Used for arranging plans, casual contact, late-night vulnerability moments.
- **Roster** — contacts. List of everyone you've met. Tap a contact for their name, what you know about them, your current standing, recent shared moments. Player's memory aid.
- **Self / Mirror** — your own stats, traits, and active leads. (Internal name TBD; "Self" is the design name, "Mirror" is a candidate for the in-fiction name. Decide before v1 ship.)
- **Buzz** — fake social feed where NPCs post. Mix of pictures, short text, occasional life updates. Studious posts at midnight: *"I don't know what I'm doing here."* Athletic posts after a meet. Artistic shares work. Townie rarely posts and then suddenly something raw at 1am. The Roommate posts almost never; when he does, it's a photo of food. Most posts don't require action — they keep the world feeling alive between encounters and occasionally surface arc hooks.
- **Anthrop** — goals and tracker. The player's in-fiction AI assistant. Surfaces:
  - **Active threads** — open hooks the player has noticed but not resolved. *"Studious mentioned a deadline she's stressed about — Thursday."*
  - **Stat goals** (player-set, optional)
  - **Upcoming commitments** — date Friday, midterm Monday, the thing the roommate asked you to come to next week
  - **Recent significant moments** — rolling 5–10 item log
  - **Gentle nudges** — *"You haven't talked to [name] in nine days."* Not lectures. Just observations.
  
  **Voice**: dry, factual, slightly observational. Not chirpy. Not cute. No emojis, no personality affectations. Occasional flickers of mild personality (rare — maybe 1 in 15 entries) that earn their place. Examples:
  - *"You haven't been to the gym since week 6."*
  - *"You've been to the coffee shop seven times this week. Filed under: 'observation.'"*
  - *"Hard week. Get some sleep."*
  
  Anthrop is functionally a *view* over the existing event log — same data the narrator uses, filtered and surfaced for the player.

### v1 decorative apps (icon only, may activate later)

- **Spark** — dating app (Tinder/Bumble knockoff). Possible v1.5 hook for low-stakes flirts or arc texture for one of the romance characters.
- **Margin** — notes. Possible v1.5 study mechanic.
- **Lens** — camera. Possible v1.5 photo mechanic and Buzz integration.
- **Wake** — alarm. Possible v1.5 morning-routine mechanic.
- **Beacon** — browser. Possible v1.5 in-fiction lookup.

### The bulletin board (Compass sub-interaction)

A physical bulletin board at the student union. Player can visit and check it; the LLM generates 1–3 flyers based on current week, recent events, and what hasn't happened yet.

Flyers can be:
- Battle of the bands
- Improv show
- Poetry reading
- Pickup basketball tournament
- Study group forming for orgo
- Intramural sign-ups
- A protest
- A guest lecture
- A club meeting
- A charity 5k
- A film screening

Each flyer has a *tone* (handmade, photocopied, professionally printed, conspicuously slick) that hints at who's hosting. Player can tap a flyer to commit (added to Anthrop's upcoming commitments), or note it and decide later.

The bulletin board is also where the cast organically appears. Athletic at intramural sign-ups. Artistic posting an improv flyer. Studious at the philosophy department lecture. Wildcard at the protest. Roommate at whatever's caught his interest this week. Townie isn't there — she's working — and that's a feature.

### Apps deferred entirely

- Email (texts cover async; nobody under 25 emails their friends)
- Weather (narration handles it)
- Fitness tracker (gym/running activities handle stats; an app would just duplicate)
- News (Buzz carries campus news mixed with social posts)

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
- **The narrator does not gate based on stats it can see.** If the player tries something they're under-statted for, the narrator describes them *failing or struggling*, not the action being blocked. (Hard gates are mechanical and handled at the system level, not snuck in via narration.)
- **The narrator does not lecture.** If a player makes a choice another character would disapprove of, the *character* expresses disapproval (often nonverbally). The narrator does not.
- **The narrator does not insert moral commentary.** Consequences emerge from the world; the narrator describes them without editorializing.
- **The narrator does not give NPCs omniscience.** See Section 4.
- **The narrator does not repeat itself.** Each significant development gets one reaction beat per witness, not one per encounter.
- **The narrator does not protect the player from earned outcomes.** If the player has been a jerk to someone for 8 weeks, the confession scene fails. Narrator describes the failure honestly.

### Framing precision

Instructions describing narrator behavior are written *descriptively* (what the narrator does) rather than in ways that can be misread as directives to *produce* the unwanted behavior. "The narrator describes consequences as they emerge from the world" — not "the narrator should make the player face consequences."

### What gets passed to the LLM on each turn

A structured prompt containing:
- **System context**: the narration contract, world rules, current week + day + time
- **World state**: relevant location, who's present and their schedule reasoning
- **Player state**: stats, traits, recent significant events, current goals
- **NPC state for anyone present**: relevant excerpts from their schema, current mood, memory log relevant to this player, current arc state
- **The specific situation**: what the player just did or chose
- **Output format**: narrative paragraph(s), then any choice points, then any system updates in a structured tail the artifact parses

Exact prompt strings and parsing format are v0.3 implementation details.

---

## 7. Calendar & Arc Structure

### The semester clock

The semester is the game's pressure source. Every choice trades a slot the player will not get back. By week 12, the player should feel the squeeze.

### Beat structure

Each romanceable arc is a 16-week shape with rough beats:

- **Weeks 1–3 — Notice**: meet, register, first real conversation. The character becomes a *person* to the player rather than an archetype.
- **Weeks 4–6 — Approach**: deliberate pursuit begins. First one-on-one event. Stat affinity starts mattering.
- **Weeks 7–9 — Friction**: a complication. The character's *core fear* surfaces or their secret edges into view. The player either earns trust or loses ground.
- **Weeks 10–12 — Depth**: if they're still in it, the relationship becomes real. Vulnerable moments.
- **Weeks 13–15 — Stakes**: Thanksgiving choice, final approach decision, who the player spends the dead week with.
- **Week 16 — Capstone**: the semester-end event. Confession, breakup, choice point, depending on how it's gone.

### Non-romance arcs

The semester also contains:
- **Academic arc** — coursework, midterms, finals, possibly a specific class/professor that becomes a story
- **Antagonist arc** — the Bully's structure: presence, escalation, confrontation, resolution
- **Roommate arc** — his own thing, semester-long, capstones in week 16 regardless of player investment but in different forms depending on it
- **Self arc** — the player's own thread, which can be career-flavored, hobby-flavored, or just becoming-someone

The capstone event (week 16) is shaped by which arcs the player invested in. A player who chased the Studious and won a literary prize has a different finals week than a player who ran the marathon and had a falling-out with the Athletic.

---

## What this doc deliberately does not cover

Deferred to v0.3 (implementation doc):
- **Storage schema** — keys, value shapes, persistence patterns
- **Image registry implementation** — how prompts surface, how images are integrated, fallbacks
- **Exact LLM prompt strings** — generator prompt, narrator prompt, parsing format
- **Failure-mode test scenarios** — scenes that break LLM-driven games, tested explicitly

Deferred to v0.4+ (later):
- **Minigame design** — what the test-day puzzles actually are per subject, the difficulty curve, the studying-helps mechanic
- **Visual identity** — logo, color palette, typography. Codename is locked: *Student Body*.

---

*v0.2 — design only. Implementation doc (v0.3) to follow.*

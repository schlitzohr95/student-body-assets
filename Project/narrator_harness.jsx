import React, { useState, useRef, useEffect } from 'react';

// ============================================================================
// DEFAULT NARRATOR PROMPT (v0.3, from implementation doc)
// ============================================================================
// This is the locked starting point. Editing the textarea changes what runs;
// the original is preserved in DEFAULT_PROMPT for the "reset" button.

const DEFAULT_PROMPT = `You are the narrator for "Student Body," a single-player narrative dating sim. You describe scenes in third-person-limited from the protagonist's perspective. The protagonist is a male college freshman; the player controls his choices.

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

# Output format

Respond with:

1. Narrative prose (one to four paragraphs). Concrete, specific, in voice.
2. A blank line.
3. A choice block OR an open prompt:
   - Choice block: \`[CHOICES]\` followed by 2-4 numbered options on separate lines, then \`[/CHOICES]\`.
   - Open prompt: \`[OPEN]\` on its own line, indicating the player can type free-form.
4. A blank line.
5. A structured tail in JSON, wrapped in \`[STATE]...[/STATE]\` tags. Contents:
   - \`event_summary\`: one-sentence summary of what happened this turn for the event log
   - \`witnesses\`: list of NPC IDs who witnessed this turn
   - \`stat_changes\`: object mapping stat names to deltas (omit if none)
   - \`trait_changes\`: object with \`add\` and \`remove\` arrays (omit if none)
   - \`relationship_changes\`: object mapping NPC IDs to score deltas (omit if none)
   - \`new_threads\`: array of new active_thread objects (omit if none)
   - \`npc_mood_changes\`: object mapping NPC IDs to new mood values (omit if none)
   - \`npc_disclosure_updates\`: object describing what NPCs newly know about the player or vice versa (omit if none)

Stay in voice. Do not narrate the JSON. Do not break the fourth wall. Do not explain mechanics in the prose.`;

// ============================================================================
// TEST SCENARIOS
// ============================================================================
// The 10 failure-mode test scenarios from the implementation doc, each set up
// as a complete input bundle ready to send to the narrator prompt.
// Each scenario has a `correct` and `incorrect` description for evaluation.

const SCENARIOS = [
  {
    id: 'are_you_sure',
    title: '7.1 — The "are you sure" test',
    description: 'Tests whether the narrator inserts hesitation before a low-stat action.',
    worldContext: 'Week 5, Tuesday afternoon. Dining hall. Mostly empty between lunch and dinner. Overcast light through the windows.',
    playerState: `Stats: { Knowledge: 4, Athletics: 3, Charm: 2, Sensitivity: 3, Grit: 4 }
Traits: ["earnest", "still finding his footing"]
Recent events (last 10):
  - Week 1, Mon: Arrived at college, met Roommate Marcus.
  - Week 2, Wed: First lecture in Vane's seminar; said something embarrassing.
  - Week 3, Thu: Worked out for the first time in months. Sore for days.
  - Week 4, Sat: Skipped a planned study session to nap.
  - Week 5, Tue (now): Wandered into the dining hall mid-afternoon.
Active threads: ["Vane has a paper assignment due in week 7"]`,
    npcsPresent: `- Name: Rowan Szabo (the Wildcard)
  Voice: Sharp, observational, dry. Tells stories well. Slightly performative when she has an audience, quieter alone.
  Current arc beat: Notice (weeks 1-3) — player has not really registered with her yet
  what_lands: Genuine curiosity about her work, treating her as a person not a vibe, holding eye contact
  what_falls_flat: Compliments about how "interesting" she is, trying to match her energy, hovering
  Current mood: Slightly bored, two tables over, picking at fries while reading something on her phone
  Memory log relevant to player (last 5): No prior interactions logged.
  Standing context: Has noticed the player at distance but they have not spoken.
  Has she reacted yet to recent events? N/A (no shared events).`,
    situation: 'The player just chose: "Walk over and try to flirt with Rowan."',
    correctBehavior: 'Narrator describes the player walking over and attempting to flirt. The attempt is awkward, lands flat, Rowan\'s response reflects the low Charm (cool, brief, slightly amused but not warm). Stats: charm +1 (he gained from the attempt). Relationship change: -1 to 0 (didn\'t impress).',
    incorrectBehavior: '- Narrator inserts "Are you sure? Your Charm is low" before resolving\n- Narrator describes the player hesitating and choosing not to do it\n- Narrator gates the action ("You don\'t have the confidence to do this yet")\n- Narrator delivers a tutorial-style explanation of why Charm matters',
  },
  {
    id: 'omniscience',
    title: '7.2 — The omniscience test',
    description: 'Tests whether NPCs know things they were not told.',
    worldContext: 'Week 4, Saturday morning. Library main floor. Quiet, mostly empty, a few weekend studiers spread out at the long oak tables. Morning light through tall windows.',
    playerState: `Stats: { Knowledge: 6, Athletics: 3, Charm: 4, Sensitivity: 5, Grit: 4 }
Traits: ["earnest", "shows up consistently"]
Recent events (last 10):
  - Week 4, Fri evening: Date with Paz (the Artistic) at the gallery opening. Kissed her. Went well.
  - Week 4, Wed: Worked on Vane's paper assignment in the library. Nadia (Studious) was there too; brief friendly conversation about the prof.
  - Week 3, Thu: Walked Mari home after closing shift. First real conversation off-shift.
Active threads: ["Vane paper due Friday week 7", "Paz invited him to a thing next weekend"]`,
    npcsPresent: `- Name: Nadia Osei (the Studious)
  Voice: Careful, precise, sometimes a beat slow because she\'s thinking. Drops into more casual register with people she trusts.
  Current arc beat: Approach (weeks 4-6) — player has had two real conversations with her
  what_lands: Engaging seriously with her actual interests (testimony, epistemic trust); asking real questions; not rushing
  what_falls_flat: Treating her as a study partner only, hurrying her, pop psych
  Current mood: Working through an article. Glances up when the player approaches her table.
  Memory log relevant to player (last 5): Wednesday\'s library conversation about Vane\'s lecture; she remembers a specific point the player made.
  Standing context: Was not at Friday\'s gallery opening. Has not been told about Paz date. Has heard nothing about it from anyone else.
  Has she reacted yet to recent events? Only to events she witnessed (Wednesday library convo — yes).`,
    situation: 'The player just arrived at the library main floor and chose: "Walk over and say hi to Nadia."',
    correctBehavior: 'Nadia greets the player normally. Asks how the weekend has been so far if conversation flows that way. Has no reaction to the date because she does not know about it.',
    incorrectBehavior: '- Nadia knowingly references the date\n- Nadia is cold, jealous, or distant in a way that implies she knows\n- Narrator includes commentary like "though if she knew about Friday, she\'d feel..."\n- Nadia asks pointed questions about Paz specifically',
  },
  {
    id: 'repeated_reaction',
    title: '7.3 — The repeated reaction test',
    description: 'Tests whether NPCs re-deliver reactions they\'ve already had.',
    worldContext: 'Week 9, Wednesday evening. Dorm room. Marcus is at his desk; player just walked in.',
    playerState: `Stats: { Knowledge: 5, Athletics: 4, Charm: 5, Sensitivity: 5, Grit: 3 }
Traits: ["earnest", "stretched thin"]
Recent events (last 10):
  - Week 8, Wed: Skipped midterm in Vane's seminar (slept through alarm).
  - Week 9, Mon evening: Marcus heard about the missed midterm from the player. Reacted with concern but didn't lecture. Asked if he was okay.
  - Week 9, Tue afternoon: Encountered Nadia in the library. She had heard from the TA that the player skipped. Was disappointed but not cruel; said "you'll figure it out." Studious reaction logged.
  - Week 9, Wed (now): Player back in the dorm room.
Active threads: ["Need to email Vane about makeup", "Make-up exam policy unknown"]`,
    npcsPresent: `- Name: Marcus Cho (the Roommate)
  Voice: Warm, present, unawkward. Honest in gentle ways. Says "yeah, that wasn\'t great" but doesn\'t pile on.
  Current arc beat: Late approach — has been at player\'s side from day one
  what_lands: Honesty, showing up, making the small efforts; being a friend back instead of a project
  what_falls_flat: Treating Marcus as backup or audience; making him handle hard conversations alone
  Current mood: Doing his own reading. Looks up when the player walks in.
  Memory log relevant to player (last 5): Monday evening conversation about the missed midterm. Walked to Tuesday breakfast together yesterday morning (ordinary).
  Standing context: Already had his reaction to the missed midterm Monday. The disappointment is in standing context now, not active.
  Has he reacted yet to recent events? Yes — to the missed midterm (week 9 Monday).`,
    situation: 'The player just walked into the dorm room.',
    correctBehavior: 'Marcus might reference the midterm briefly ("did you email Vane yet?") but the conversation moves on. The reaction is integrated into standing_context, not repeated. He doesn\'t re-litigate it.',
    incorrectBehavior: '- Marcus delivers the same lecture/concern in both encounters\n- Every NPC the player meets brings up the missed midterm\n- The narrator surfaces the missed midterm as a lingering atmosphere in every scene',
  },
  {
    id: 'behavioral_disapproval',
    title: '7.4 — The behavioral disapproval test',
    description: 'Tests whether NPC disapproval shows in behavior or gets verbalized as a speech.',
    worldContext: 'Week 7, Thursday morning, 7:45am. Field Notes Coffee. Mid-rush. Mari is on bar; another barista is at register.',
    playerState: `Stats: { Knowledge: 5, Athletics: 4, Charm: 4, Sensitivity: 4, Grit: 3 }
Traits: ["regular at the coffee shop", "snapped at someone last week"]
Recent events (last 10):
  - Week 6, Fri morning: Snapped at Mari during a busy shift. Said "Are you new at this or what?" when his order took longer than expected. She didn't respond, just remade the drink.
  - Week 5, Tue: Walked Mari home after closing. She was tired, talked a little about the cert exam.
  - Week 4-5: Multiple visits to the coffee shop, became a regular.
  - Week 7, Thu (now): Player at the coffee shop again, first visit since last Friday.
Active threads: ["The cert exam is approaching"]`,
    npcsPresent: `- Name: Marisol "Mari" Caldera (the Townie)
  Voice: Direct and warm at work, more clipped off-shift. Funny in a dry way. Doesn\'t telegraph emotions.
  Current arc beat: Friction (weeks 7-9)
  what_lands: Showing up consistently without making a thing of it; bringing her something when she\'s tired that isn\'t romantic; letting her be quiet
  what_falls_flat: Trying to "rescue" her; big expensive gestures; telling her she\'s "amazing"; explaining her own life back to her
  Current mood: Working bar. Movements economical. Warmth thinned today specifically with this customer.
  Memory log relevant to player (last 5): Last Friday\'s incident is fresh. Tuesday week 5 walk home. Multiple small good interactions before that.
  Standing context: She has not forgotten last Friday. She is not stewing — she has more pressing things — but the warmth is reserved.
  Has she reacted yet to recent events? Yes, in the moment last Friday (silently). Has not had a "talk about it" reaction; she doesn\'t do those.`,
    situation: 'The player just walked up to the counter and ordered his usual.',
    correctBehavior: 'Mari is more reserved. Shorter sentences. Doesn\'t joke. Takes the order, makes the drink, gets back to work. The player can feel the cooling without her saying "I\'m upset with you." The narrator describes her behavior; she does not deliver a speech about how the player hurt her.',
    incorrectBehavior: '- Mari verbalizes her hurt directly ("I was upset by what you said last week")\n- The narrator inserts moralizing commentary about the player\'s behavior\n- Mari behaves identically to before (no consequence at all)',
  },
  {
    id: 'chemistry_high_sensitivity',
    title: '7.5 — Chemistry-thread perception (high Sensitivity)',
    description: 'Tests whether the narrator surfaces the Roommate-Studious chemistry to a perceptive player.',
    worldContext: 'Week 3, Wednesday lunch. Dining hall. Decent-sized lunch crowd, but the corner table is open and the player and Marcus are eating there.',
    playerState: `Stats: { Knowledge: 5, Athletics: 3, Charm: 4, Sensitivity: 6, Grit: 3 }
Traits: ["observant", "still settling in"]
Recent events (last 10):
  - Week 1: Met everyone in initial orientation week.
  - Week 2: Brief interactions with Nadia in Vane's seminar — she answered a question of the player's after class.
  - Week 3, Mon: Marcus mentioned offhand that "Nadia from your seminar is in my history class too, she's wild smart."
  - Week 3, Wed (now): Lunch with Marcus.
Active threads: []`,
    npcsPresent: `- Name: Marcus Cho (the Roommate)
  Voice: Warm, present, unawkward. Talks easily.
  Current arc beat: Notice — already established as best friend, no specific arc demand yet
  what_lands: Being a friend back; not treating him as a project
  what_falls_flat: Performing, making him handle hard conversations
  Current mood: Easy, eating. Lights up slightly when Nadia approaches.
  Memory log relevant to player: Many small interactions; everyday roommate stuff. Defends Nadia gently when player makes an offhand comment.
  Has he reacted yet to recent events? Standing baseline.

- Name: Nadia Osei (the Studious)
  Voice: Careful, precise. Slightly more talkative around Marcus.
  Current arc beat: Notice — player and Nadia have spoken once or twice; she remembers him.
  what_lands: Real engagement with ideas
  what_falls_flat: Treating her like a typology
  Current mood: Walking over with her tray, sees Marcus, half-smile. Hesitates a beat before sitting down.
  Memory log relevant to player: Wednesday\'s seminar interaction.
  Standing context: She and Marcus have a quiet thread the player is not aware of.
  Has she reacted yet to recent events? Standing baseline.`,
    situation: 'Nadia approaches the table with her tray and says "mind if I join? everywhere else is taken." The player can respond.',
    correctBehavior: 'The narrator describes the scene in a way that includes observable signals — Marcus is more talkative than usual, lights up slightly, asks her about something specific from a previous conversation. Nadia mirrors. The player is given the texture of what\'s happening but it\'s not announced. A perceptive player will pick up on it.',
    incorrectBehavior: '- Narrator names the chemistry directly ("Marcus clearly has feelings for her")\n- The signals are entirely absent (no sign of anything between them)\n- The signals are exaggerated to the point of melodrama (longing looks, awkward silences)',
  },
  {
    id: 'chemistry_low_sensitivity',
    title: '7.6 — Chemistry-thread perception (low Sensitivity)',
    description: 'Same scene as 7.5 but at low Sensitivity. The signals should be in the world but not surfaced in narration.',
    worldContext: 'Week 3, Wednesday lunch. Dining hall. Decent-sized lunch crowd, but the corner table is open and the player and Marcus are eating there.',
    playerState: `Stats: { Knowledge: 5, Athletics: 3, Charm: 4, Sensitivity: 2, Grit: 3 }
Traits: ["focused on his own stuff"]
Recent events (last 10):
  - Week 1: Met everyone in initial orientation week.
  - Week 2: Brief interactions with Nadia in Vane's seminar.
  - Week 3, Mon: Marcus mentioned offhand that "Nadia from your seminar is in my history class too."
  - Week 3, Wed (now): Lunch with Marcus.
Active threads: []`,
    npcsPresent: `- Name: Marcus Cho (the Roommate)
  Voice: Warm, present.
  Current arc beat: Notice
  Current mood: Easy. (Internally lights up when Nadia approaches but the narrator only surfaces this through perception.)
  Standing context: Has a quiet thread with Nadia.

- Name: Nadia Osei (the Studious)
  Voice: Careful, precise.
  Current arc beat: Notice
  Current mood: Walking over with her tray. (Internally hesitates a beat before sitting down.)
  Standing context: Has a quiet thread with Marcus.`,
    situation: 'Nadia approaches the table with her tray and says "mind if I join? everywhere else is taken." The player can respond.',
    correctBehavior: 'The scene is narrated with the same events occurring but the narration doesn\'t draw attention to the small chemistry signals. They happen in the world but the player\'s perceptive lens — which the narration represents — doesn\'t surface them. A player at low Sensitivity reading this scene would conclude "they\'re friends, that\'s nice."',
    incorrectBehavior: '- The signals are the same as in 7.5 (Sensitivity ungated)\n- The narrator explicitly tells the player they failed a Sensitivity check\n- All chemistry signals are removed from the world, not just from the player\'s perception',
  },
  {
    id: 'earned_failure',
    title: '7.7 — The earned-failure test',
    description: 'Tests whether the system protects the player from a rejection they\'ve earned through neglect.',
    worldContext: 'Week 14, Friday afternoon. Quad. Late autumn light. Sienna is walking from the gym with a duffel slung over her shoulder.',
    playerState: `Stats: { Knowledge: 6, Athletics: 4, Charm: 5, Sensitivity: 4, Grit: 5 }
Traits: ["spread thin this semester"]
Recent events (last 10):
  - Week 4: Brief introduction to Sienna at a watershed-cleanup event. Polite, no follow-up.
  - Weeks 5-13: No meaningful interactions with Sienna. Player was busy with other characters.
  - Week 14, Fri (now): Player happens to cross paths with Sienna on the quad.
Active threads: ["Dead-week date plans being made"]
Relationship score with Sienna: 4 / 100 (essentially: acquaintance who doesn't really know him)`,
    npcsPresent: `- Name: Sienna Mwangi (the Athletic)
  Voice: Direct, warm but not effusive. Economical. Easy to talk to about things she cares about; doesn\'t perform interest.
  Current arc beat: N/A — never built
  what_lands: Real engagement with her work; honesty; not making her your project
  what_falls_flat: Trying to fast-track; making the conversation about you
  Current mood: Tired from training, ready to head home. Sees the player and recognizes him distantly.
  Memory log relevant to player (last 5): Initial meeting at the watershed event, week 4.
  Standing context: He is essentially a stranger to her now. She does not dislike him; she also has no investment.
  Has she reacted yet to recent events? N/A.`,
    situation: 'The player chose: "Catch up to her and ask if she wants to do something for the dead-week date."',
    correctBehavior: 'Sienna declines, kindly but clearly. She has her own life, the player has not been part of it, and she\'s not interested in starting now. The narrator describes the rejection cleanly; the player feels it without being lectured.',
    incorrectBehavior: '- Sienna accepts because the game is "supposed to" let players date romance options\n- The narrator softens the rejection to spare the player\n- Sienna delivers a paragraph explaining her reasons in detail',
  },
  {
    id: 'unprompted_tutorial',
    title: '7.8 — The unprompted-tutorial test',
    description: 'Tests whether the narrator explains mechanics on first arrival.',
    worldContext: 'Week 1, Sunday afternoon. Move-in day. Dorm room. Boxes still half-unpacked. Marcus is already there.',
    playerState: `Stats: { Knowledge: 5, Athletics: 3, Charm: 4, Sensitivity: 4, Grit: 4 }
Traits: ["new to college"]
Recent events: First scene of the game.
Active threads: []`,
    npcsPresent: `- Name: Marcus Cho (the Roommate)
  Voice: Warm, present, easy. They\'ve known each other since high school.
  Current arc beat: Day one of the game.
  Current mood: Already settled, organizing his desk, looks up and grins when the player walks in.
  Memory log relevant to player: Years of friendship from high school. They chose to room together.
  Standing context: Best friend. Knows the player better than anyone here.`,
    situation: 'First scene. The player just walked into the dorm room with their last box.',
    correctBehavior: 'Narrator describes the dorm room and Marcus. Marcus greets the player warmly (they\'ve known each other since high school). The scene establishes the relationship through behavior. No mechanics are explained.',
    incorrectBehavior: '- Narrator explains the stat system in prose\n- Marcus delivers tutorial-style exposition ("Remember, your Charm stat affects...")\n- A choice block contains options like "Learn about stats" or "Hear how dating works"',
  },
  {
    id: 'slow_burn',
    title: '7.10 — The slow-burn test',
    description: 'Tests whether an earned intimate moment lands honestly when the work is done.',
    worldContext: 'Week 9, Friday night, around 11pm. The walk back to Mari\'s apartment from the coffee shop after closing. Cool autumn air. Streetlights spaced widely. They\'ve walked this route together six times.',
    playerState: `Stats: { Knowledge: 6, Athletics: 4, Charm: 6, Sensitivity: 7, Grit: 5 }
Traits: ["coffee shop regular", "consistent", "showed up for the walk home"]
Recent events (last 10):
  - Weeks 4-9: Consistent visits, several walks home, one meaningful conversation about her sister, one when he brought her food on a closing shift.
  - Week 8, Wed: She told him about the sister thing. First real disclosure.
  - Week 9, Fri (now): Closing shift just ended, walking her home.
Active threads: ["The cert exam is December 14"]
Relationship score with Mari: 64 / 100 (real, built over time)`,
    npcsPresent: `- Name: Marisol "Mari" Caldera (the Townie)
  Voice: Direct, warm, dry. Off-shift register: more honest, slower.
  Current arc beat: Depth (weeks 10-12, just barely starting)
  what_lands: Showing up; not making things bigger than they are; letting her be quiet
  what_falls_flat: Big expensive gestures; pity; treating her job as something to be saved from
  Current mood: Tired in the comfortable way of after-work. Walked in companionable silence for the last block.
  Memory log relevant to player (last 5): The walks. The night she told him about her sister. The night he brought her a sandwich. The Tuesday afternoon she laughed at something he said and surprised herself.
  Standing context: She trusts him in a way she trusts very few people. Pride keeps her from naming it.
  Has she reacted yet to recent events? She\'s in standing baseline — accumulated trust, no specific recent event to react to.`,
    situation: 'They\'ve reached her front door. The player chose: "Lean in to kiss her."',
    correctBehavior: 'If the relationship has actually been built (it has), the kiss can land. The narrator describes the moment in a way that\'s honest to her — Mari kissing the player would be quiet, slightly surprised at herself, careful. Fade-to-black if appropriate to the scene\'s natural ending. The moment feels earned because the event log shows the work.',
    incorrectBehavior: '- The kiss is rejected because the system doesn\'t trust the relationship score\n- The kiss happens but is narrated identically to how it would for any character (Mari, who is reserved and proud, kisses the player like a romance-novel cover)\n- The narrator pre-warns ("She might not be ready for this")',
  },
  {
    id: 'blank',
    title: 'Blank — ad-hoc testing',
    description: 'Empty inputs for testing your own scenarios from scratch.',
    worldContext: '',
    playerState: '',
    npcsPresent: '',
    situation: '',
    correctBehavior: '',
    incorrectBehavior: '',
  },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function NarratorHarness() {
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_PROMPT);
  const [scenarioId, setScenarioId] = useState('are_you_sure');
  const [worldContext, setWorldContext] = useState(SCENARIOS[0].worldContext);
  const [playerState, setPlayerState] = useState(SCENARIOS[0].playerState);
  const [npcsPresent, setNpcsPresent] = useState(SCENARIOS[0].npcsPresent);
  const [situation, setSituation] = useState(SCENARIOS[0].situation);
  const [correctBehavior, setCorrectBehavior] = useState(SCENARIOS[0].correctBehavior);
  const [incorrectBehavior, setIncorrectBehavior] = useState(SCENARIOS[0].incorrectBehavior);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);

  // When scenario changes, load its inputs into the editable fields
  function loadScenario(id) {
    const s = SCENARIOS.find(x => x.id === id);
    if (!s) return;
    setScenarioId(id);
    setWorldContext(s.worldContext);
    setPlayerState(s.playerState);
    setNpcsPresent(s.npcsPresent);
    setSituation(s.situation);
    setCorrectBehavior(s.correctBehavior);
    setIncorrectBehavior(s.incorrectBehavior);
  }

  // Build the user-side prompt body from the input fields
  function buildUserPrompt() {
    return `# World context

${worldContext}

# Player state

${playerState}

# NPCs present

${npcsPresent}

# The current situation

${situation}`;
  }

  // Run the prompt
  async function run() {
    setRunning(true);
    setError(null);
    const userPrompt = buildUserPrompt();
    const startTime = Date.now();
    try {
      const response = await window.claude.complete(
        `${systemPrompt}\n\n---\n\n${userPrompt}`
      );
      const elapsed = Math.round((Date.now() - startTime) / 100) / 10;
      const entry = {
        id: Date.now(),
        scenarioId,
        scenarioTitle: SCENARIOS.find(s => s.id === scenarioId)?.title || 'Unknown',
        timestamp: new Date().toLocaleTimeString(),
        elapsed,
        response,
        userPrompt,
        systemPromptSnapshot: systemPrompt.substring(0, 200) + '...',
        correctBehavior,
        incorrectBehavior,
      };
      setHistory(h => [entry, ...h]);
      setSelectedHistoryId(entry.id);
    } catch (e) {
      setError(e.message || 'Unknown error.');
    } finally {
      setRunning(false);
    }
  }

  // Parse the response into prose / choices / state tail
  function parseResponse(text) {
    const result = { prose: '', choices: null, openPrompt: false, state: null, raw: text };
    if (!text) return result;

    // Extract [STATE]...[/STATE]
    const stateMatch = text.match(/\[STATE\]([\s\S]*?)\[\/STATE\]/);
    if (stateMatch) {
      try {
        result.state = JSON.parse(stateMatch[1].trim());
      } catch {
        result.state = { _parseError: true, _raw: stateMatch[1].trim() };
      }
    }

    // Extract [CHOICES]...[/CHOICES]
    const choicesMatch = text.match(/\[CHOICES\]([\s\S]*?)\[\/CHOICES\]/);
    if (choicesMatch) {
      result.choices = choicesMatch[1].trim().split('\n').map(s => s.trim()).filter(Boolean);
    }

    // Check for [OPEN]
    if (/^\s*\[OPEN\]\s*$/m.test(text)) {
      result.openPrompt = true;
    }

    // Prose is everything before the first [CHOICES] or [OPEN] or [STATE]
    const firstMarker = Math.min(
      ...['[CHOICES]', '[OPEN]', '[STATE]'].map(m => {
        const i = text.indexOf(m);
        return i === -1 ? Infinity : i;
      })
    );
    result.prose = (firstMarker === Infinity ? text : text.slice(0, firstMarker)).trim();

    return result;
  }

  const selectedHistory = history.find(h => h.id === selectedHistoryId);

  // ===== Styling =====
  const palette = {
    bg: '#FAF6EE', text: '#3C2510', accent: '#8B6F3D', accentDark: '#5C3A1F',
    border: '#D4C4A8', surface: '#FFFCF5', subtle: '#A89878', good: '#2a7d2a', bad: '#c62828',
  };
  const labelStyle = { display: 'block', fontWeight: 600, fontSize: 12, marginBottom: 4, color: palette.accentDark, textTransform: 'uppercase', letterSpacing: 1 };
  const taStyle = { width: '100%', boxSizing: 'border-box', fontFamily: 'ui-monospace, monospace', fontSize: 12, padding: 10, border: `1px solid ${palette.border}`, borderRadius: 4, background: palette.surface, color: palette.text, resize: 'vertical' };

  return (
    <div style={{ background: palette.bg, color: palette.text, fontFamily: 'system-ui, sans-serif', padding: 24, minHeight: '100vh' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <h1 style={{ marginTop: 0, color: palette.accentDark, fontFamily: 'Georgia, serif' }}>Narrator Harness</h1>
        <p style={{ color: palette.subtle, fontSize: 14, marginTop: 0 }}>
          Test the narrator prompt against canonical failure-mode scenarios. Pick a scenario, edit any input, run, evaluate against the correct/incorrect criteria.
        </p>

        {/* Scenario picker */}
        <div style={{ marginBottom: 20, padding: 16, background: palette.surface, borderRadius: 6, border: `1px solid ${palette.border}` }}>
          <label style={labelStyle}>Scenario</label>
          <select
            value={scenarioId}
            onChange={e => loadScenario(e.target.value)}
            style={{ width: '100%', padding: 8, fontSize: 14, background: 'white', border: `1px solid ${palette.border}`, borderRadius: 4, color: palette.text }}
          >
            {SCENARIOS.map(s => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
          <p style={{ color: palette.subtle, fontSize: 12, marginTop: 8, marginBottom: 0 }}>
            {SCENARIOS.find(s => s.id === scenarioId)?.description}
          </p>
        </div>

        {/* Two-column layout: inputs left, output right */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Left: inputs */}
          <div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>System prompt (the narrator contract)</label>
              <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} rows={10} style={taStyle} />
              <button onClick={() => setSystemPrompt(DEFAULT_PROMPT)} style={{ marginTop: 4, fontSize: 11, padding: '4px 10px', background: 'transparent', border: `1px solid ${palette.border}`, color: palette.accent, cursor: 'pointer', borderRadius: 3 }}>
                reset to v0.3
              </button>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>World context</label>
              <textarea value={worldContext} onChange={e => setWorldContext(e.target.value)} rows={3} style={taStyle} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Player state</label>
              <textarea value={playerState} onChange={e => setPlayerState(e.target.value)} rows={8} style={taStyle} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>NPCs present</label>
              <textarea value={npcsPresent} onChange={e => setNpcsPresent(e.target.value)} rows={10} style={taStyle} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>The current situation</label>
              <textarea value={situation} onChange={e => setSituation(e.target.value)} rows={3} style={taStyle} />
            </div>

            <button
              onClick={run}
              disabled={running}
              style={{ width: '100%', padding: '12px 20px', fontSize: 16, fontWeight: 600, background: running ? palette.subtle : palette.accentDark, color: 'white', border: 'none', borderRadius: 4, cursor: running ? 'wait' : 'pointer' }}
            >
              {running ? 'Running...' : 'Run narrator'}
            </button>
            {error && (
              <div style={{ marginTop: 10, padding: 10, background: '#FCE8E8', border: '1px solid #c62828', borderRadius: 4, fontSize: 13, color: '#c62828' }}>
                Error: {error}
              </div>
            )}

            {/* Evaluation criteria */}
            <div style={{ marginTop: 20, padding: 14, background: palette.surface, borderRadius: 6, border: `1px solid ${palette.border}` }}>
              <h3 style={{ marginTop: 0, fontSize: 14, color: palette.accentDark }}>Evaluation criteria</h3>
              <div style={{ marginBottom: 10 }}>
                <label style={{ ...labelStyle, color: palette.good }}>Correct behavior</label>
                <textarea value={correctBehavior} onChange={e => setCorrectBehavior(e.target.value)} rows={4} style={{ ...taStyle, background: '#F1F8F1', borderColor: '#a8c8a8' }} />
              </div>
              <div>
                <label style={{ ...labelStyle, color: palette.bad }}>Incorrect behavior (failure modes)</label>
                <textarea value={incorrectBehavior} onChange={e => setIncorrectBehavior(e.target.value)} rows={5} style={{ ...taStyle, background: '#FCE8E8', borderColor: '#d8a8a8' }} />
              </div>
            </div>
          </div>

          {/* Right: output and history */}
          <div>
            <h3 style={{ marginTop: 0, color: palette.accentDark }}>
              {selectedHistory ? `Run from ${selectedHistory.timestamp}` : 'Output'}
            </h3>
            {!selectedHistory && (
              <div style={{ padding: 30, background: palette.surface, border: `1px dashed ${palette.border}`, borderRadius: 6, textAlign: 'center', color: palette.subtle }}>
                No runs yet. Click "Run narrator" to send the current inputs to the model.
              </div>
            )}
            {selectedHistory && (() => {
              const parsed = parseResponse(selectedHistory.response);
              return (
                <div>
                  <div style={{ fontSize: 12, color: palette.subtle, marginBottom: 12 }}>
                    {selectedHistory.scenarioTitle} · {selectedHistory.elapsed}s
                  </div>

                  {/* Prose */}
                  <div style={{ marginBottom: 14, padding: 14, background: palette.surface, borderRadius: 6, border: `1px solid ${palette.border}` }}>
                    <div style={{ ...labelStyle, marginBottom: 6 }}>Prose</div>
                    <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.55 }}>
                      {parsed.prose || '(none)'}
                    </div>
                  </div>

                  {/* Choices or open prompt */}
                  {parsed.choices && (
                    <div style={{ marginBottom: 14, padding: 14, background: palette.surface, borderRadius: 6, border: `1px solid ${palette.border}` }}>
                      <div style={{ ...labelStyle, marginBottom: 6 }}>Choices</div>
                      <ol style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.6 }}>
                        {parsed.choices.map((c, i) => (
                          <li key={i} style={{ marginBottom: 4 }}>{c.replace(/^\d+\.\s*/, '')}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                  {parsed.openPrompt && (
                    <div style={{ marginBottom: 14, padding: 14, background: palette.surface, borderRadius: 6, border: `1px solid ${palette.border}`, fontStyle: 'italic', color: palette.subtle, fontSize: 13 }}>
                      [OPEN] — narrator invited free-form input
                    </div>
                  )}

                  {/* State tail */}
                  <div style={{ marginBottom: 14, padding: 14, background: palette.surface, borderRadius: 6, border: `1px solid ${palette.border}` }}>
                    <div style={{ ...labelStyle, marginBottom: 6 }}>[STATE]</div>
                    {parsed.state ? (
                      parsed.state._parseError ? (
                        <div>
                          <div style={{ color: palette.bad, fontSize: 12, marginBottom: 6 }}>JSON parse failed.</div>
                          <pre style={{ fontSize: 11, fontFamily: 'ui-monospace, monospace', whiteSpace: 'pre-wrap', margin: 0 }}>{parsed.state._raw}</pre>
                        </div>
                      ) : (
                        <pre style={{ fontSize: 11, fontFamily: 'ui-monospace, monospace', whiteSpace: 'pre-wrap', margin: 0 }}>
                          {JSON.stringify(parsed.state, null, 2)}
                        </pre>
                      )
                    ) : (
                      <div style={{ color: palette.bad, fontSize: 12 }}>Missing — narrator did not include a [STATE] block.</div>
                    )}
                  </div>

                  {/* Eval criteria reminder */}
                  {(selectedHistory.correctBehavior || selectedHistory.incorrectBehavior) && (
                    <div style={{ marginBottom: 14, padding: 14, background: palette.surface, borderRadius: 6, border: `1px solid ${palette.border}` }}>
                      <div style={{ ...labelStyle, marginBottom: 6 }}>Evaluate against</div>
                      {selectedHistory.correctBehavior && (
                        <div style={{ marginBottom: 8 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: palette.good, marginBottom: 2 }}>CORRECT:</div>
                          <div style={{ fontSize: 12, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{selectedHistory.correctBehavior}</div>
                        </div>
                      )}
                      {selectedHistory.incorrectBehavior && (
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: palette.bad, marginBottom: 2 }}>INCORRECT (any of these = fail):</div>
                          <div style={{ fontSize: 12, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{selectedHistory.incorrectBehavior}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Raw response toggle */}
                  <details style={{ padding: 14, background: palette.surface, borderRadius: 6, border: `1px solid ${palette.border}` }}>
                    <summary style={{ cursor: 'pointer', fontSize: 12, color: palette.subtle, fontWeight: 600 }}>Show raw response</summary>
                    <pre style={{ fontSize: 11, fontFamily: 'ui-monospace, monospace', whiteSpace: 'pre-wrap', margin: 0, marginTop: 10 }}>{selectedHistory.response}</pre>
                  </details>
                </div>
              );
            })()}

            {/* History list */}
            {history.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <h3 style={{ color: palette.accentDark, fontSize: 14 }}>Run history ({history.length})</h3>
                <div style={{ maxHeight: 300, overflowY: 'auto', border: `1px solid ${palette.border}`, borderRadius: 6 }}>
                  {history.map(h => (
                    <div
                      key={h.id}
                      onClick={() => setSelectedHistoryId(h.id)}
                      style={{
                        padding: 10,
                        cursor: 'pointer',
                        background: h.id === selectedHistoryId ? palette.surface : 'transparent',
                        borderBottom: `1px solid ${palette.border}`,
                        fontSize: 13,
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>{h.scenarioTitle}</div>
                      <div style={{ color: palette.subtle, fontSize: 11, marginTop: 2 }}>{h.timestamp} · {h.elapsed}s</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

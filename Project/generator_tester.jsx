import React, { useState, useRef, useEffect } from 'react';

// ============================================================================
// DEFAULT GENERATOR PROMPT (v0.3)
// ============================================================================
// This is the locked starting point. Editing the textarea changes what runs;
// the original is preserved in DEFAULT_PROMPT for the "reset" button.

const DEFAULT_PROMPT = `You are generating a complete cast and world for "Student Body," a single-player narrative dating sim set at a small liberal arts college during one fall semester. The output will be used by another AI as authoritative reference material for narrating the game.

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

# The roommate-Studious chemistry thread (special note)

Both characters' schemas should reflect this:
- They have unspoken, unacted-on chemistry. Neither has named it.
- The Roommate's schema should note: lights up around her, more talkative, slightly flustered in small ways, remembers her details, defends her gently.
- The Studious's schema should mirror this: equally warm around him, makes excuses for proximity, has an "atmosphere" with him others can perceive.
- Both should be too good or too shy to act on it.
- Neither schema should describe this as melodramatic. It's quiet, observable, real.

# Character schema format (for each character)

Return each character as a JSON object with these top-level keys:
- identity: { name, age, pronouns, role_in_world, occupation_or_program, hometown, living_situation }
- engine: { core_want, core_fear, public_self, private_self, biggest_contradiction, what_they_self_deceive_about }
- semester: { working_on, current_pressure, hidden_situation }
- voice: { speech_summary, vocabulary_register, rhythm, three_speech_tics (array of 3), things_she_would_never_say (array of 3-4), two_dialogue_examples (array of 2 objects with situation and line) }
- what_lands_what_falls_flat: { what_lands (array of 3-4), what_falls_flat (array of 3-4), gift_logic, how_she_reads_the_player }
- stat_affinity: { primary_affinity, secondary_affinity, dismissive_of, trait_responses_positive (array), trait_responses_negative (array) }
- trait_expansions (array of 3-4 objects): { trait, surface_behavior, underlying_reason, trigger, limit, contradiction, scene_expression }
- emotional_states: { default_state, under_stress, when_tired, when_happy, when_angry, when_hurt, when_attracted, when_caught_off_guard }
- relationship_texture: { with_strangers, with_close_friends, with_authority, with_the_player_initially, what_makes_her_open_up, what_makes_her_close_off }
- connections: { knows (array of {character, relationship}), doesnt_know (array), history_with (array of {character, history}) }
- narrator_notes: { do_not_flatten_into (array), do_not_overuse (array), good_recurring_motifs (array), arc_skeleton: { notice, approach, friction, depth, stakes, capstone } }

For male characters use he/him and adjust pronouns accordingly. The Roommate is male.

# College and town

Generate names for the college and town. Sound real but be original. Avoid clichés ("Riverdale College," "Pine Valley"). Provide a 2-sentence description of each.

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

Return a single JSON object with these top-level keys:
{
  "college": { "name": "...", "description": "..." },
  "town": { "name": "...", "description": "..." },
  "characters": {
    "studious": { ...full schema... },
    "athletic": { ...full schema... },
    "artistic": { ...full schema... },
    "wildcard": { ...full schema... },
    "townie": { ...full schema... },
    "roommate": { ...full schema... },
    "bully": { ...full schema... },
    "professor": { ...full schema... },
    "ra": { ...full schema... }
  }
}

Return JSON only. No prose preamble, no markdown formatting, no commentary.`;

// ============================================================================
// STYLE
// ============================================================================

const styles = {
  root: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #F7EFDD 0%, #EFE3C7 100%)",
    fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
    color: "#3C2510",
    padding: "32px 24px 80px",
  },
  inner: { maxWidth: "1200px", margin: "0 auto" },
  header: { borderBottom: "1px solid #8B6F3D", paddingBottom: "20px", marginBottom: "24px" },
  pretitle: { fontSize: "11px", letterSpacing: "3px", color: "#8B6F3D", marginBottom: "8px" },
  title: { fontFamily: "Georgia, serif", fontSize: "38px", fontWeight: "400", fontStyle: "italic", margin: "0 0 8px 0", color: "#3C2510" },
  subtitle: { fontSize: "13px", color: "#6B4F2D", margin: 0 },
  panel: { background: "#FAF3E0", border: "1px solid #8B6F3D", borderRadius: "4px", padding: "16px", marginBottom: "20px" },
  panelHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" },
  panelTitle: { fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", fontWeight: "600", color: "#3C2510" },
  textarea: { width: "100%", minHeight: "240px", fontFamily: "ui-monospace, monospace", fontSize: "12px", lineHeight: "1.6", padding: "12px", background: "#FFF8E7", border: "1px solid #C9B998", borderRadius: "2px", color: "#3C2510", resize: "vertical", boxSizing: "border-box" },
  controls: { display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" },
  btn: (variant) => ({
    padding: "8px 16px",
    fontSize: "11px",
    letterSpacing: "1.5px",
    fontFamily: "ui-monospace, monospace",
    fontWeight: "600",
    background: variant === "primary" ? "#3C2510" : "transparent",
    color: variant === "primary" ? "#F7EFDD" : "#3C2510",
    border: "1px solid #3C2510",
    borderRadius: "2px",
    cursor: "pointer",
    textTransform: "uppercase",
  }),
  btnDisabled: { opacity: 0.4, cursor: "not-allowed" },
  status: { fontSize: "11px", color: "#6B4F2D", marginTop: "8px", fontStyle: "italic" },
  err: { fontSize: "12px", color: "#8E3A3A", marginTop: "8px", padding: "8px", background: "#F7E5E5", border: "1px solid #8E3A3A", borderRadius: "2px" },
  runTabs: { display: "flex", gap: "4px", marginBottom: "12px", flexWrap: "wrap" },
  runTab: (active) => ({
    padding: "4px 10px",
    fontSize: "10px",
    fontFamily: "ui-monospace, monospace",
    background: active ? "#3C2510" : "#E8D4B5",
    color: active ? "#F7EFDD" : "#3C2510",
    border: "1px solid #8B6F3D",
    borderRadius: "2px",
    cursor: "pointer",
  }),
  worldHeader: { borderBottom: "1px solid #C9B998", paddingBottom: "16px", marginBottom: "20px" },
  worldName: { fontFamily: "Georgia, serif", fontSize: "26px", fontStyle: "italic", margin: "0 0 4px 0" },
  worldDesc: { fontSize: "12px", color: "#6B4F2D", margin: 0, lineHeight: "1.6" },
  charGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "16px" },
  charCard: { background: "#FAF3E0", border: "1px solid #8B6F3D", borderRadius: "4px", padding: "16px", display: "flex", flexDirection: "column", gap: "8px" },
  charSlot: { fontSize: "10px", letterSpacing: "2px", color: "#8B6F3D", textTransform: "uppercase" },
  charName: { fontFamily: "Georgia, serif", fontSize: "20px", fontStyle: "italic", margin: 0 },
  charMeta: { fontSize: "11px", color: "#6B4F2D", margin: 0 },
  charBody: { display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" },
  charField: { display: "flex", flexDirection: "column", gap: "2px" },
  fieldLabel: { fontSize: "9px", letterSpacing: "1.5px", color: "#8B6F3D", textTransform: "uppercase", fontWeight: "600" },
  fieldValue: { fontSize: "12px", lineHeight: "1.5", color: "#3C2510" },
  fieldList: { fontSize: "12px", lineHeight: "1.6", color: "#3C2510", margin: 0, paddingLeft: "16px" },
  fieldQuote: { fontSize: "12px", lineHeight: "1.5", color: "#3C2510", fontStyle: "italic", borderLeft: "2px solid #C9B998", paddingLeft: "10px", margin: 0 },
  expandBtn: { fontSize: "10px", color: "#8B6F3D", background: "transparent", border: "none", padding: "4px 0", cursor: "pointer", textAlign: "left", textTransform: "uppercase", letterSpacing: "1.5px", fontFamily: "inherit" },
  expandedSection: { marginTop: "8px", paddingTop: "8px", borderTop: "1px dashed #C9B998", display: "flex", flexDirection: "column", gap: "10px" },
  traitBlock: { background: "#FFF8E7", border: "1px solid #C9B998", borderRadius: "2px", padding: "8px" },
  traitName: { fontSize: "11px", fontWeight: "700", color: "#3C2510", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "1px" },
  traitField: { display: "flex", gap: "6px", fontSize: "11px", lineHeight: "1.5", marginBottom: "2px" },
  traitFieldLabel: { fontSize: "9px", color: "#8B6F3D", textTransform: "uppercase", letterSpacing: "1px", flexShrink: 0, width: "85px", paddingTop: "2px" },
  rawJsonToggle: { marginTop: "16px" },
  rawJson: { fontSize: "10px", lineHeight: "1.5", padding: "12px", background: "#FFF8E7", border: "1px solid #C9B998", borderRadius: "2px", color: "#3C2510", maxHeight: "400px", overflow: "auto", whiteSpace: "pre", marginTop: "8px" },
  emptyState: { padding: "48px 24px", textAlign: "center", color: "#8B6F3D", fontSize: "13px", fontStyle: "italic" },
};

// ============================================================================
// COMPONENTS
// ============================================================================

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div style={styles.charField}>
      <div style={styles.fieldLabel}>{label}</div>
      <div style={styles.fieldValue}>{value}</div>
    </div>
  );
}

function FieldList({ label, items }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={styles.charField}>
      <div style={styles.fieldLabel}>{label}</div>
      <ul style={styles.fieldList}>
        {items.map((item, i) => <li key={i}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>)}
      </ul>
    </div>
  );
}

function TraitExpansion({ trait }) {
  return (
    <div style={styles.traitBlock}>
      <div style={styles.traitName}>{trait.trait}</div>
      {trait.surface_behavior && <div style={styles.traitField}><span style={styles.traitFieldLabel}>Surface</span><span>{trait.surface_behavior}</span></div>}
      {trait.underlying_reason && <div style={styles.traitField}><span style={styles.traitFieldLabel}>Why</span><span>{trait.underlying_reason}</span></div>}
      {trait.trigger && <div style={styles.traitField}><span style={styles.traitFieldLabel}>Trigger</span><span>{trait.trigger}</span></div>}
      {trait.limit && <div style={styles.traitField}><span style={styles.traitFieldLabel}>Limit</span><span>{trait.limit}</span></div>}
      {trait.contradiction && <div style={styles.traitField}><span style={styles.traitFieldLabel}>Contradiction</span><span>{trait.contradiction}</span></div>}
      {trait.scene_expression && <div style={styles.traitField}><span style={styles.traitFieldLabel}>In scene</span><span>{trait.scene_expression}</span></div>}
    </div>
  );
}

function CharacterCard({ slot, character }) {
  const [expanded, setExpanded] = useState(false);
  const id = character?.identity || {};
  const eng = character?.engine || {};
  const sem = character?.semester || {};
  const voice = character?.voice || {};
  const lands = character?.what_lands_what_falls_flat || {};
  const stat = character?.stat_affinity || {};
  const states = character?.emotional_states || {};
  const rel = character?.relationship_texture || {};
  const notes = character?.narrator_notes || {};
  const arc = notes?.arc_skeleton || {};

  return (
    <div style={styles.charCard}>
      <div style={styles.charSlot}>{slot}</div>
      <h3 style={styles.charName}>{id.name || "(unnamed)"}</h3>
      <p style={styles.charMeta}>
        {[id.age && `${id.age}`, id.pronouns, id.occupation_or_program].filter(Boolean).join(" · ")}
      </p>

      <div style={styles.charBody}>
        <Field label="Hometown" value={id.hometown} />
        <Field label="Living" value={id.living_situation} />
        <Field label="Core want" value={eng.core_want} />
        <Field label="Core fear" value={eng.core_fear} />
        <Field label="Public self" value={eng.public_self} />
        <Field label="Private self" value={eng.private_self} />
        <Field label="Biggest contradiction" value={eng.biggest_contradiction} />
        <Field label="Self-deceives about" value={eng.what_they_self_deceive_about} />
        <Field label="Working on" value={sem.working_on} />
        <Field label="Hidden situation" value={sem.hidden_situation} />
      </div>

      <button style={styles.expandBtn} onClick={() => setExpanded(!expanded)}>
        {expanded ? "▾ collapse" : "▸ expand voice, traits, arc"}
      </button>

      {expanded && (
        <div style={styles.expandedSection}>
          <Field label="Voice summary" value={voice.speech_summary} />
          <Field label="Rhythm" value={voice.rhythm} />
          <FieldList label="Speech tics" items={voice.three_speech_tics} />
          <FieldList label="Things she would never say" items={voice.things_she_would_never_say} />
          {voice.two_dialogue_examples && (
            <div style={styles.charField}>
              <div style={styles.fieldLabel}>Dialogue examples</div>
              {voice.two_dialogue_examples.map((ex, i) => (
                <div key={i} style={{ marginBottom: "8px" }}>
                  <div style={{ fontSize: "10px", color: "#8B6F3D", marginBottom: "2px" }}>{ex.situation}</div>
                  <p style={styles.fieldQuote}>{ex.line}</p>
                </div>
              ))}
            </div>
          )}
          <FieldList label="What lands" items={lands.what_lands} />
          <FieldList label="What falls flat" items={lands.what_falls_flat} />
          <Field label="Gift logic" value={lands.gift_logic} />
          <Field label="Reads the player by" value={lands.how_she_reads_the_player} />
          <Field label="Stat: primary affinity" value={stat.primary_affinity} />
          <Field label="Stat: secondary affinity" value={stat.secondary_affinity} />
          <Field label="Stat: dismissive of" value={stat.dismissive_of} />

          {character?.trait_expansions && character.trait_expansions.length > 0 && (
            <div style={styles.charField}>
              <div style={styles.fieldLabel}>Trait expansions</div>
              {character.trait_expansions.map((t, i) => <TraitExpansion key={i} trait={t} />)}
            </div>
          )}

          <Field label="Default state" value={states.default_state} />
          <Field label="Under stress" value={states.under_stress} />
          <Field label="When attracted" value={states.when_attracted} />
          <Field label="What opens her up" value={rel.what_makes_her_open_up} />
          <Field label="What closes her off" value={rel.what_makes_her_close_off} />

          <FieldList label="Do not flatten into" items={notes.do_not_flatten_into} />
          <FieldList label="Do not overuse" items={notes.do_not_overuse} />
          <FieldList label="Good motifs" items={notes.good_recurring_motifs} />

          {arc && Object.keys(arc).length > 0 && (
            <div style={styles.charField}>
              <div style={styles.fieldLabel}>Arc skeleton</div>
              <ul style={styles.fieldList}>
                {arc.notice && <li><strong>Notice:</strong> {arc.notice}</li>}
                {arc.approach && <li><strong>Approach:</strong> {arc.approach}</li>}
                {arc.friction && <li><strong>Friction:</strong> {arc.friction}</li>}
                {arc.depth && <li><strong>Depth:</strong> {arc.depth}</li>}
                {arc.stakes && <li><strong>Stakes:</strong> {arc.stakes}</li>}
                {arc.capstone && <li><strong>Capstone:</strong> {arc.capstone}</li>}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function WorldDisplay({ world }) {
  const [showRaw, setShowRaw] = useState(false);
  if (!world) return null;
  const characters = world.characters || {};
  const order = ["studious", "athletic", "artistic", "wildcard", "townie", "roommate", "bully", "professor", "ra"];

  return (
    <div>
      <div style={styles.worldHeader}>
        <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#8B6F3D", marginBottom: "4px" }}>COLLEGE</div>
        <h2 style={styles.worldName}>{world.college?.name || "(unnamed)"}</h2>
        <p style={styles.worldDesc}>{world.college?.description}</p>
        <div style={{ marginTop: "12px", fontSize: "10px", letterSpacing: "2px", color: "#8B6F3D" }}>TOWN</div>
        <h2 style={styles.worldName}>{world.town?.name || "(unnamed)"}</h2>
        <p style={styles.worldDesc}>{world.town?.description}</p>
      </div>

      <div style={styles.charGrid}>
        {order.map((slot) => {
          const ch = characters[slot];
          if (!ch) return null;
          return <CharacterCard key={slot} slot={slot} character={ch} />;
        })}
      </div>

      <div style={styles.rawJsonToggle}>
        <button style={styles.expandBtn} onClick={() => setShowRaw(!showRaw)}>
          {showRaw ? "▾ hide raw JSON" : "▸ show raw JSON"}
        </button>
        {showRaw && <pre style={styles.rawJson}>{JSON.stringify(world, null, 2)}</pre>}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN
// ============================================================================

export default function GeneratorTester() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [runs, setRuns] = useState([]); // { id, label, world, raw, error, timestamp, promptSnapshot }
  const [activeRunId, setActiveRunId] = useState(null);
  const [running, setRunning] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const promptRef = useRef(null);

  const activeRun = runs.find(r => r.id === activeRunId);

  async function runGeneration() {
    setRunning(true);
    setStatusMsg("Calling Claude…");
    const runId = `run_${Date.now()}`;
    const promptSnapshot = prompt;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 32000,
          messages: [{ role: "user", content: promptSnapshot }],
        }),
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      const text = data.content
        .filter(b => b.type === "text")
        .map(b => b.text)
        .join("\n");

      // Detect truncation up front so the user gets a clear message
      const wasTruncated = data.stop_reason === "max_tokens";

      setStatusMsg("Parsing JSON…");
      const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();

      let world;
      try {
        world = JSON.parse(cleaned);
      } catch (parseErr) {
        const truncationNote = wasTruncated
          ? `Output hit max_tokens (${data.usage?.output_tokens || "?"} tokens generated) and was cut off mid-JSON. Try increasing max_tokens, or shortening the prompt to produce less verbose output. `
          : "";
        const newRun = {
          id: runId, label: `Run ${runs.length + 1}`, world: null, raw: text,
          error: `${truncationNote}JSON parse failed: ${parseErr.message}`,
          timestamp: new Date().toLocaleTimeString(), promptSnapshot,
          truncated: wasTruncated,
        };
        setRuns([newRun, ...runs]);
        setActiveRunId(runId);
        setStatusMsg("");
        setRunning(false);
        return;
      }

      const newRun = {
        id: runId, label: `Run ${runs.length + 1}`, world, raw: text, error: null,
        timestamp: new Date().toLocaleTimeString(), promptSnapshot,
        truncated: wasTruncated,
      };
      setRuns([newRun, ...runs]);
      setActiveRunId(runId);
      setStatusMsg(`Generated in ${data.usage?.output_tokens || "?"} output tokens${wasTruncated ? " (hit max_tokens)" : ""}`);
    } catch (err) {
      const newRun = {
        id: runId, label: `Run ${runs.length + 1}`, world: null, raw: null,
        error: err.message, timestamp: new Date().toLocaleTimeString(), promptSnapshot,
      };
      setRuns([newRun, ...runs]);
      setActiveRunId(runId);
      setStatusMsg("");
    }
    setRunning(false);
  }

  function resetPrompt() { setPrompt(DEFAULT_PROMPT); }
  function loadRunPrompt(run) { setPrompt(run.promptSnapshot); }

  return (
    <div style={styles.root}>
      <div style={styles.inner}>
        <header style={styles.header}>
          <div style={styles.pretitle}>STUDENT BODY · GENERATOR TEST HARNESS</div>
          <h1 style={styles.title}>World Generator</h1>
          <p style={styles.subtitle}>Edit the prompt, run it, see the output. Each run is saved.</p>
        </header>

        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <div style={styles.panelTitle}>The prompt</div>
            <div style={{ fontSize: "10px", color: "#8B6F3D" }}>{prompt.length.toLocaleString()} chars</div>
          </div>
          <textarea
            ref={promptRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            style={styles.textarea}
            disabled={running}
          />
          <div style={styles.controls}>
            <button onClick={runGeneration} disabled={running} style={{ ...styles.btn("primary"), ...(running ? styles.btnDisabled : {}) }}>
              {running ? "Running…" : "▶ Run generation"}
            </button>
            <button onClick={resetPrompt} disabled={running} style={{ ...styles.btn(), ...(running ? styles.btnDisabled : {}) }}>
              Reset to default
            </button>
          </div>
          {statusMsg && <div style={styles.status}>{statusMsg}</div>}
        </div>

        {runs.length > 0 && (
          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <div style={styles.panelTitle}>Run history</div>
              <div style={{ fontSize: "10px", color: "#8B6F3D" }}>{runs.length} run{runs.length !== 1 ? "s" : ""}</div>
            </div>
            <div style={styles.runTabs}>
              {runs.map((r) => (
                <button key={r.id} onClick={() => setActiveRunId(r.id)} style={styles.runTab(activeRunId === r.id)}>
                  {r.label} · {r.timestamp} {r.error ? "✗" : "✓"}
                </button>
              ))}
            </div>
            {activeRun && (
              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                <button style={styles.btn()} onClick={() => loadRunPrompt(activeRun)}>
                  Load this run's prompt
                </button>
              </div>
            )}
          </div>
        )}

        {activeRun && activeRun.error && (
          <div style={styles.panel}>
            <div style={styles.panelTitle}>Error</div>
            <div style={styles.err}>{activeRun.error}</div>
            {activeRun.raw && (
              <details style={{ marginTop: "12px" }}>
                <summary style={{ cursor: "pointer", fontSize: "11px", color: "#8B6F3D" }}>show raw response</summary>
                <pre style={styles.rawJson}>{activeRun.raw}</pre>
              </details>
            )}
          </div>
        )}

        {activeRun && activeRun.world && <WorldDisplay world={activeRun.world} />}

        {!activeRun && (
          <div style={styles.emptyState}>
            No runs yet. Hit "Run generation" to call Claude with the prompt above.
          </div>
        )}
      </div>
    </div>
  );
}

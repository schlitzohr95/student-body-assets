import React, { useState, useEffect, useMemo } from 'react';

// ============================================================================
// ARCHETYPE CONFIG
// ============================================================================

const ARCHETYPES = {
  studious:  { label: "Studious",          romance: true,  defaultPronouns: "she/her", description: "academic-leaning, lives in books and ideas, anxious overachiever or quietly brilliant" },
  athletic:  { label: "Athletic",          romance: true,  defaultPronouns: "she/her", description: "varsity or serious club athlete, disciplined, social through sport" },
  artistic:  { label: "Artistic",          romance: true,  defaultPronouns: "she/her", description: "creative major or scene kid, expressive, on a different wavelength" },
  wildcard:  { label: "Wildcard",          romance: true,  defaultPronouns: "she/her", description: "chaos energy, crosses social lines, harder to read, sometimes a rival" },
  townie:    { label: "Townie (barista)",  romance: true,  defaultPronouns: "she/her", description: "working-class, paying her own way through community college / a trade school program, different rhythm from the campus four" },
  roommate:  { label: "Roommate / Best Friend", romance: false, defaultPronouns: "he/him", description: "the player's best friend from before college, roommates by choice, warm-present-unawkward, flaw is being too available, has unspoken chemistry with the Studious" },
  bully:     { label: "Bully",             romance: false, defaultPronouns: "he/him", description: "antagonist — academic rival, social-clique antagonist, or ex of one of the romance characters" },
  professor: { label: "Professor",         romance: false, defaultPronouns: "they/them", description: "prominent faculty member, mentor or obstacle" },
  ra:        { label: "RA",                romance: false, defaultPronouns: "they/them", description: "authority figure on the dorm floor" },
  flavor:    { label: "Flavor NPC",        romance: false, defaultPronouns: "they/them", description: "recurring background character (gym regular, librarian, cafeteria worker, etc.) — gets a lighter schema" },
  custom:    { label: "Custom (free-form)", romance: false, defaultPronouns: "they/them", description: "anything that doesn't fit the standard slate — describe entirely in your direction below" },
};

// ============================================================================
// PROMPT ASSEMBLY
// ============================================================================

const FULL_SCHEMA = `Return the character as a JSON object with these top-level keys:
- identity: { name, age, pronouns, role_in_world, occupation_or_program, hometown, living_situation }
- engine: { core_want, core_fear, public_self, private_self, biggest_contradiction, what_they_self_deceive_about }
- semester: { working_on, current_pressure, hidden_situation }
- voice: { speech_summary, vocabulary_register, rhythm, three_speech_tics (array of 3), things_they_would_never_say (array of 3-4), two_dialogue_examples (array of 2 objects with situation and line) }
- what_lands_what_falls_flat: { what_lands (array of 3-4), what_falls_flat (array of 3-4), gift_logic, how_they_read_the_player }
- stat_affinity: { primary_affinity, secondary_affinity, dismissive_of, trait_responses_positive (array), trait_responses_negative (array) }
- trait_expansions (array of 3-4 objects): { trait, surface_behavior, underlying_reason, trigger, limit, contradiction, scene_expression }
- emotional_states: { default_state, under_stress, when_tired, when_happy, when_angry, when_hurt, when_attracted, when_caught_off_guard }
- relationship_texture: { with_strangers, with_close_friends, with_authority, with_the_player_initially, what_makes_them_open_up, what_makes_them_close_off }
- connections: { knows (array of {character, relationship}), doesnt_know (array), history_with (array of {character, history}) }
- narrator_notes: { do_not_flatten_into (array), do_not_overuse (array), good_recurring_motifs (array), arc_skeleton: { notice, approach, friction, depth, stakes, capstone } }

Arc skeleton beats should be one phrase each, not full sentences. The "knows" and "history_with" arrays can reference generic categories (e.g., "the studious type", "the bully") rather than specific named characters — this character is being generated standalone.`;

const FLAVOR_SCHEMA = `Return a LIGHTER character schema as JSON with these top-level keys:
- identity: { name, age, pronouns, role_in_world, occupation_or_program, hometown }
- engine: { core_want, core_fear, public_self, private_self }
- voice: { speech_summary, three_speech_tics (array of 3), one_dialogue_example (object with situation and line) }
- trait_expansions (array of 1-2 objects): { trait, surface_behavior, underlying_reason, scene_expression }
- relationship_texture: { with_the_player_initially, what_makes_them_open_up }
- narrator_notes: { do_not_flatten_into (array), good_recurring_motifs (array) }

This is a recurring background character, not a fully developed romance or anchor character. Don't pad — fewer fields, real specificity.`;

const ANTI_FAILURE = `Anti-failure-mode requirements:
- The character must NOT be a flat archetype clone
- working_on must be a SPECIFIC unique pursuit, not a generic version of the archetype's typical concerns
- core_fear must be theirs specifically, not their archetype's default
- hidden_situation must recontextualize them when learned (not "her parents are divorcing" — something that makes you reread the public_self differently)
- speech tics must be specific verbal habits, not generic adjectives`;

function buildPrompt({ archetype, isRomance, userDirection, constraints, existingCharacter }) {
  const archInfo = ARCHETYPES[archetype];
  const isFlavor = archetype === "flavor";
  const isCustom = archetype === "custom";

  let prompt = `You are generating a single character for "Student Body," a single-player narrative dating sim set at Aldenmoor College, a small liberal arts college, during one fall semester.

This character is generated standalone. Do not assume anything about the rest of the cast. Make this character interesting on their own merits; the user will weave them together with others later if they choose.

# This character

`;

  if (isCustom) {
    prompt += `This is a custom character not on the standard archetype slate. The user-provided direction below describes who they should be.\n\n`;
  } else {
    prompt += `Archetype slot: ${archInfo.label}\nArchetype baseline: ${archInfo.description}\nRomance status: ${isRomance ? "ROMANCEABLE — full schema, the player can pursue them" : "NON-ROMANCE — full schema, but when_attracted and gift_logic should reflect a friendship/professional/antagonist relationship rather than a romance"}\nDefault pronouns: ${archInfo.defaultPronouns} (the user direction may override)\n\n`;
  }

  if (userDirection && userDirection.trim()) {
    prompt += `# User direction\n\nThe user has provided this direction. Honor the spirit of it; fill in everything they didn't specify.\n\n${userDirection.trim()}\n\n`;
  }

  if (constraints && constraints.trim()) {
    prompt += `# Specific constraints\n\n${constraints.trim()}\n\n`;
  }

  if (existingCharacter && existingCharacter.trim()) {
    prompt += `# Existing version to revise\n\nAn existing version of this character is below. Modify it according to the user direction and constraints above. Preserve what works; change what they asked you to change. Keep fields they didn't ask about close to the original.\n\n${existingCharacter.trim()}\n\n`;
  }

  prompt += `# Schema\n\n${isFlavor ? FLAVOR_SCHEMA : FULL_SCHEMA}\n\n`;

  if (!isFlavor) prompt += `# Anti-failure-mode requirements\n\n${ANTI_FAILURE}\n\n`;

  prompt += `# Output\n\nReturn a single JSON object containing the character schema. No prose preamble, no markdown, no commentary. Just the JSON.`;

  return prompt;
}

// ============================================================================
// STYLE
// ============================================================================

const styles = {
  root: { minHeight: "100vh", background: "linear-gradient(180deg, #F7EFDD 0%, #EFE3C7 100%)", fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace", color: "#3C2510", padding: "32px 24px 80px" },
  inner: { maxWidth: "1240px", margin: "0 auto" },
  header: { borderBottom: "1px solid #8B6F3D", paddingBottom: "20px", marginBottom: "24px" },
  pretitle: { fontSize: "11px", letterSpacing: "3px", color: "#8B6F3D", marginBottom: "8px" },
  title: { fontFamily: "Georgia, serif", fontSize: "38px", fontWeight: "400", fontStyle: "italic", margin: "0 0 8px 0", color: "#3C2510" },
  subtitle: { fontSize: "13px", color: "#6B4F2D", margin: 0 },
  twoCol: { display: "grid", gridTemplateColumns: "minmax(360px, 420px) 1fr", gap: "24px" },
  panel: { background: "#FAF3E0", border: "1px solid #8B6F3D", borderRadius: "4px", padding: "16px", marginBottom: "16px" },
  panelTitle: { fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", fontWeight: "600", color: "#3C2510", marginBottom: "12px" },
  formGroup: { marginBottom: "14px" },
  label: { display: "block", fontSize: "10px", letterSpacing: "1.5px", textTransform: "uppercase", color: "#6B4F2D", marginBottom: "4px", fontWeight: "600" },
  hint: { fontSize: "10px", color: "#8B6F3D", marginTop: "3px", fontStyle: "italic" },
  select: { width: "100%", padding: "8px", fontFamily: "ui-monospace, monospace", fontSize: "12px", background: "#FFF8E7", border: "1px solid #C9B998", borderRadius: "2px", color: "#3C2510", boxSizing: "border-box" },
  textarea: { width: "100%", fontFamily: "ui-monospace, monospace", fontSize: "12px", lineHeight: "1.6", padding: "10px", background: "#FFF8E7", border: "1px solid #C9B998", borderRadius: "2px", color: "#3C2510", resize: "vertical", boxSizing: "border-box" },
  archetypeDesc: { fontSize: "11px", color: "#6B4F2D", fontStyle: "italic", marginTop: "6px", lineHeight: "1.5", padding: "8px", background: "#F2E6CC", borderRadius: "2px", borderLeft: "2px solid #C9B998" },
  controls: { display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" },
  btn: (variant, disabled) => ({ padding: "8px 16px", fontSize: "11px", letterSpacing: "1.5px", fontFamily: "ui-monospace, monospace", fontWeight: "600", background: variant === "primary" ? "#3C2510" : "transparent", color: variant === "primary" ? "#F7EFDD" : "#3C2510", border: "1px solid #3C2510", borderRadius: "2px", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1, textTransform: "uppercase" }),
  status: { fontSize: "11px", color: "#6B4F2D", marginTop: "8px", fontStyle: "italic" },
  err: { fontSize: "12px", color: "#8E3A3A", marginTop: "8px", padding: "8px", background: "#F7E5E5", border: "1px solid #8E3A3A", borderRadius: "2px" },
  outputPanel: { background: "#FAF3E0", border: "1px solid #8B6F3D", borderRadius: "4px", padding: "20px", minHeight: "400px" },
  emptyState: { padding: "60px 24px", textAlign: "center", color: "#8B6F3D", fontSize: "13px", fontStyle: "italic" },
  versionTabs: { display: "flex", gap: "4px", marginBottom: "16px", flexWrap: "wrap" },
  versionTab: (active) => ({ padding: "4px 10px", fontSize: "10px", fontFamily: "ui-monospace, monospace", background: active ? "#3C2510" : "#E8D4B5", color: active ? "#F7EFDD" : "#3C2510", border: "1px solid #8B6F3D", borderRadius: "2px", cursor: "pointer" }),
  charSlot: { fontSize: "10px", letterSpacing: "2px", color: "#8B6F3D", textTransform: "uppercase", marginBottom: "4px" },
  charName: { fontFamily: "Georgia, serif", fontSize: "26px", fontStyle: "italic", margin: "0 0 4px 0" },
  charMeta: { fontSize: "12px", color: "#6B4F2D", margin: "0 0 16px 0" },
  charField: { display: "flex", flexDirection: "column", gap: "3px", marginBottom: "10px" },
  fieldLabel: { fontSize: "9px", letterSpacing: "1.5px", color: "#8B6F3D", textTransform: "uppercase", fontWeight: "600" },
  fieldValue: { fontSize: "12px", lineHeight: "1.5", color: "#3C2510" },
  fieldList: { fontSize: "12px", lineHeight: "1.6", color: "#3C2510", margin: 0, paddingLeft: "16px" },
  sectionHeader: { fontSize: "10px", letterSpacing: "2px", color: "#8B6F3D", textTransform: "uppercase", margin: "20px 0 8px 0", paddingBottom: "4px", borderBottom: "1px dashed #C9B998" },
  traitBlock: { background: "#FFF8E7", border: "1px solid #C9B998", borderRadius: "2px", padding: "10px", marginBottom: "8px" },
  traitName: { fontSize: "11px", fontWeight: "700", color: "#3C2510", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "1px" },
  traitField: { display: "flex", gap: "6px", fontSize: "11px", lineHeight: "1.5", marginBottom: "3px" },
  traitFieldLabel: { fontSize: "9px", color: "#8B6F3D", textTransform: "uppercase", letterSpacing: "1px", flexShrink: 0, width: "85px", paddingTop: "2px" },
  rawJson: { fontSize: "10px", lineHeight: "1.5", padding: "12px", background: "#FFF8E7", border: "1px solid #C9B998", borderRadius: "2px", color: "#3C2510", maxHeight: "400px", overflow: "auto", whiteSpace: "pre", marginTop: "8px" },
  expandBtn: { fontSize: "10px", color: "#8B6F3D", background: "transparent", border: "none", padding: "4px 0", cursor: "pointer", textAlign: "left", textTransform: "uppercase", letterSpacing: "1.5px", fontFamily: "inherit" },
  fieldQuote: { fontSize: "12px", lineHeight: "1.5", color: "#3C2510", fontStyle: "italic", borderLeft: "2px solid #C9B998", paddingLeft: "10px", margin: "4px 0" },
  reviseBanner: { fontSize: "11px", padding: "8px", background: "#E8D4B5", border: "1px solid #8B6F3D", borderRadius: "2px", marginBottom: "12px", color: "#3C2510" },
};

// ============================================================================
// CHARACTER DISPLAY
// ============================================================================

function Field({ label, value }) {
  if (!value) return null;
  return <div style={styles.charField}><div style={styles.fieldLabel}>{label}</div><div style={styles.fieldValue}>{value}</div></div>;
}

function FieldList({ label, items }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={styles.charField}>
      <div style={styles.fieldLabel}>{label}</div>
      <ul style={styles.fieldList}>
        {items.map((item, i) => <li key={i}>{typeof item === 'string' ? item : (item.character ? `${item.character}: ${item.relationship || item.history}` : JSON.stringify(item))}</li>)}
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

function CharacterDisplay({ character, slot }) {
  const [showRaw, setShowRaw] = useState(false);
  if (!character) return null;
  const id = character.identity || {};
  const eng = character.engine || {};
  const sem = character.semester || {};
  const voice = character.voice || {};
  const lands = character.what_lands_what_falls_flat || {};
  const stat = character.stat_affinity || {};
  const states = character.emotional_states || {};
  const rel = character.relationship_texture || {};
  const conn = character.connections || {};
  const notes = character.narrator_notes || {};
  const arc = notes.arc_skeleton || {};
  const neverSays = voice.things_they_would_never_say || voice.things_she_would_never_say || voice.things_he_would_never_say;
  const reads = lands.how_they_read_the_player || lands.how_she_reads_the_player || lands.how_he_reads_the_player;
  const opens = rel.what_makes_them_open_up || rel.what_makes_her_open_up || rel.what_makes_him_open_up;
  const closes = rel.what_makes_them_close_off || rel.what_makes_her_close_off || rel.what_makes_him_close_off;

  return (
    <div>
      <div style={styles.charSlot}>{slot}</div>
      <h2 style={styles.charName}>{id.name || "(unnamed)"}</h2>
      <p style={styles.charMeta}>{[id.age && `${id.age}`, id.pronouns, id.occupation_or_program].filter(Boolean).join(" · ")}</p>

      <div style={styles.sectionHeader}>identity</div>
      <Field label="Hometown" value={id.hometown} />
      <Field label="Living" value={id.living_situation} />
      <Field label="Role" value={id.role_in_world} />

      <div style={styles.sectionHeader}>the engine</div>
      <Field label="Core want" value={eng.core_want} />
      <Field label="Core fear" value={eng.core_fear} />
      <Field label="Public self" value={eng.public_self} />
      <Field label="Private self" value={eng.private_self} />
      <Field label="Biggest contradiction" value={eng.biggest_contradiction} />
      <Field label="Self-deceives about" value={eng.what_they_self_deceive_about} />

      {(sem.working_on || sem.hidden_situation) && (
        <>
          <div style={styles.sectionHeader}>this semester</div>
          <Field label="Working on" value={sem.working_on} />
          <Field label="Current pressure" value={sem.current_pressure} />
          <Field label="Hidden situation" value={sem.hidden_situation} />
        </>
      )}

      <div style={styles.sectionHeader}>voice</div>
      <Field label="Speech summary" value={voice.speech_summary} />
      <Field label="Rhythm" value={voice.rhythm} />
      <FieldList label="Speech tics" items={voice.three_speech_tics} />
      <FieldList label="Things they would never say" items={neverSays} />
      {voice.two_dialogue_examples && (
        <div style={styles.charField}>
          <div style={styles.fieldLabel}>Dialogue examples</div>
          {voice.two_dialogue_examples.map((ex, i) => (
            <div key={i} style={{ marginBottom: "6px" }}>
              <div style={{ fontSize: "10px", color: "#8B6F3D", marginBottom: "2px" }}>{ex.situation}</div>
              <p style={styles.fieldQuote}>{ex.line}</p>
            </div>
          ))}
        </div>
      )}
      {voice.one_dialogue_example && (
        <div style={styles.charField}>
          <div style={styles.fieldLabel}>Dialogue example</div>
          <div style={{ fontSize: "10px", color: "#8B6F3D", marginBottom: "2px" }}>{voice.one_dialogue_example.situation}</div>
          <p style={styles.fieldQuote}>{voice.one_dialogue_example.line}</p>
        </div>
      )}

      {(lands.what_lands || lands.what_falls_flat) && (
        <>
          <div style={styles.sectionHeader}>what lands · what falls flat</div>
          <FieldList label="What lands" items={lands.what_lands} />
          <FieldList label="What falls flat" items={lands.what_falls_flat} />
          <Field label="Gift logic" value={lands.gift_logic} />
          <Field label="Reads the player by" value={reads} />
        </>
      )}

      {stat.primary_affinity && (
        <>
          <div style={styles.sectionHeader}>stat affinity</div>
          <Field label="Primary" value={stat.primary_affinity} />
          <Field label="Secondary" value={stat.secondary_affinity} />
          <Field label="Dismissive of" value={stat.dismissive_of} />
        </>
      )}

      {character.trait_expansions && character.trait_expansions.length > 0 && (
        <>
          <div style={styles.sectionHeader}>trait expansions</div>
          {character.trait_expansions.map((t, i) => <TraitExpansion key={i} trait={t} />)}
        </>
      )}

      {Object.keys(states).length > 0 && (
        <>
          <div style={styles.sectionHeader}>emotional states</div>
          <Field label="Default" value={states.default_state} />
          <Field label="Under stress" value={states.under_stress} />
          <Field label="When tired" value={states.when_tired} />
          <Field label="When happy" value={states.when_happy} />
          <Field label="When angry" value={states.when_angry} />
          <Field label="When hurt" value={states.when_hurt} />
          <Field label="When attracted" value={states.when_attracted} />
          <Field label="When caught off guard" value={states.when_caught_off_guard} />
        </>
      )}

      {Object.keys(rel).length > 0 && (
        <>
          <div style={styles.sectionHeader}>relationship texture</div>
          <Field label="With strangers" value={rel.with_strangers} />
          <Field label="With close friends" value={rel.with_close_friends} />
          <Field label="With authority" value={rel.with_authority} />
          <Field label="With the player initially" value={rel.with_the_player_initially} />
          <Field label="What opens them up" value={opens} />
          <Field label="What closes them off" value={closes} />
        </>
      )}

      {(conn.knows || conn.history_with) && (
        <>
          <div style={styles.sectionHeader}>connections</div>
          <FieldList label="Knows" items={conn.knows} />
          <FieldList label="Doesn't know" items={conn.doesnt_know} />
          <FieldList label="History with" items={conn.history_with} />
        </>
      )}

      {(notes.do_not_flatten_into || notes.good_recurring_motifs) && (
        <>
          <div style={styles.sectionHeader}>narrator notes</div>
          <FieldList label="Do not flatten into" items={notes.do_not_flatten_into} />
          <FieldList label="Do not overuse" items={notes.do_not_overuse} />
          <FieldList label="Good motifs" items={notes.good_recurring_motifs} />
        </>
      )}

      {arc && Object.keys(arc).length > 0 && (
        <>
          <div style={styles.sectionHeader}>arc skeleton</div>
          <ul style={styles.fieldList}>
            {arc.notice && <li><strong>Notice:</strong> {arc.notice}</li>}
            {arc.approach && <li><strong>Approach:</strong> {arc.approach}</li>}
            {arc.friction && <li><strong>Friction:</strong> {arc.friction}</li>}
            {arc.depth && <li><strong>Depth:</strong> {arc.depth}</li>}
            {arc.stakes && <li><strong>Stakes:</strong> {arc.stakes}</li>}
            {arc.capstone && <li><strong>Capstone:</strong> {arc.capstone}</li>}
          </ul>
        </>
      )}

      <button style={styles.expandBtn} onClick={() => setShowRaw(!showRaw)}>
        {showRaw ? "▾ hide raw JSON" : "▸ show raw JSON"}
      </button>
      {showRaw && <pre style={styles.rawJson}>{JSON.stringify(character, null, 2)}</pre>}
    </div>
  );
}

// ============================================================================
// MAIN
// ============================================================================

export default function CharacterGenerator() {
  const [archetype, setArchetype] = useState("studious");
  const [isRomance, setIsRomance] = useState(true);
  const [userDirection, setUserDirection] = useState("");
  const [constraints, setConstraints] = useState("");
  const [existingCharacter, setExistingCharacter] = useState("");
  const [reviseMode, setReviseMode] = useState(false);

  const [versions, setVersions] = useState([]);
  const [activeVersionId, setActiveVersionId] = useState(null);
  const [running, setRunning] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const archInfo = ARCHETYPES[archetype];
  const activeVersion = versions.find(v => v.id === activeVersionId);

  useEffect(() => { setIsRomance(archInfo.romance); }, [archetype]);

  const builtPrompt = useMemo(() => buildPrompt({
    archetype, isRomance, userDirection, constraints,
    existingCharacter: reviseMode ? existingCharacter : null,
  }), [archetype, isRomance, userDirection, constraints, existingCharacter, reviseMode]);

  async function generate() {
    setRunning(true);
    setStatusMsg("Calling Claude…");
    const versionId = `v_${Date.now()}`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 8000,
          messages: [{ role: "user", content: builtPrompt }],
        }),
      });

      if (!response.ok) throw new Error(`API ${response.status}: ${await response.text()}`);
      const data = await response.json();
      const text = data.content.filter(b => b.type === "text").map(b => b.text).join("\n");
      const wasTruncated = data.stop_reason === "max_tokens";
      const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();

      let character;
      try { character = JSON.parse(cleaned); }
      catch (parseErr) {
        setVersions([{ id: versionId, label: `v${versions.length + 1}`, character: null, raw: text, error: `${wasTruncated ? `Hit max_tokens (${data.usage?.output_tokens} tokens). ` : ""}JSON parse failed: ${parseErr.message}`, timestamp: new Date().toLocaleTimeString(), archetype, isRomance, userDirection, constraints }, ...versions]);
        setActiveVersionId(versionId);
        setStatusMsg("");
        setRunning(false);
        return;
      }

      setVersions([{ id: versionId, label: `v${versions.length + 1}`, character, raw: text, error: null, timestamp: new Date().toLocaleTimeString(), archetype, isRomance, userDirection, constraints }, ...versions]);
      setActiveVersionId(versionId);
      setStatusMsg(`${data.usage?.output_tokens || "?"} output tokens${wasTruncated ? " (hit max_tokens)" : ""}`);
    } catch (err) {
      setVersions([{ id: versionId, label: `v${versions.length + 1}`, character: null, raw: null, error: err.message, timestamp: new Date().toLocaleTimeString(), archetype, isRomance, userDirection, constraints }, ...versions]);
      setActiveVersionId(versionId);
      setStatusMsg("");
    }
    setRunning(false);
  }

  function reviseFromActive() {
    if (!activeVersion?.character) return;
    setReviseMode(true);
    setExistingCharacter(JSON.stringify(activeVersion.character, null, 2));
    setArchetype(activeVersion.archetype);
    setIsRomance(activeVersion.isRomance);
    setUserDirection("");
    setConstraints("");
  }

  function exitReviseMode() {
    setReviseMode(false);
    setExistingCharacter("");
  }

  function clearForm() {
    setUserDirection("");
    setConstraints("");
    exitReviseMode();
  }

  return (
    <div style={styles.root}>
      <div style={styles.inner}>
        <header style={styles.header}>
          <div style={styles.pretitle}>STUDENT BODY · CHARACTER GENERATOR</div>
          <h1 style={styles.title}>Per-character generation</h1>
          <p style={styles.subtitle}>One character at a time. Each generated standalone — no cross-character pressure. Iterate freely.</p>
        </header>

        <div style={styles.twoCol}>
          <div>
            <div style={styles.panel}>
              <div style={styles.panelTitle}>1 · The slot</div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Archetype</label>
                <select style={styles.select} value={archetype} onChange={(e) => setArchetype(e.target.value)} disabled={running}>
                  {Object.entries(ARCHETYPES).map(([key, info]) => <option key={key} value={key}>{info.label}</option>)}
                </select>
                <div style={styles.archetypeDesc}>{archInfo.description}</div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Romance status</label>
                <select style={styles.select} value={isRomance ? "yes" : "no"} onChange={(e) => setIsRomance(e.target.value === "yes")} disabled={running}>
                  <option value="yes">Romanceable</option>
                  <option value="no">Non-romance</option>
                </select>
                <div style={styles.hint}>Default for this archetype: {archInfo.romance ? "romanceable" : "non-romance"}</div>
              </div>
            </div>

            <div style={styles.panel}>
              <div style={styles.panelTitle}>2 · Your direction (optional)</div>
              <div style={styles.formGroup}>
                <label style={styles.label}>What do you have in mind?</label>
                <textarea
                  style={{ ...styles.textarea, minHeight: "120px" }}
                  value={userDirection}
                  onChange={(e) => setUserDirection(e.target.value)}
                  disabled={running}
                  placeholder={`Free-form direction. Examples:\n\n"Swimmer rather than runner. Recovering from an injury she's not talking about. Major in marine biology — she actually cares about it."\n\n"The bully is the ex of one of the romance characters. Not openly cruel — undermines through framing."\n\n"Make her funnier than the others. Comedy major. Performs improv at the student union on Thursdays."\n\nLeave blank to let the generator surprise you.`}
                />
                <div style={styles.hint}>The generator will fill in everything you don't specify.</div>
              </div>
            </div>

            <div style={styles.panel}>
              <div style={styles.panelTitle}>3 · Constraints (optional)</div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Specific things to require or forbid</label>
                <textarea
                  style={{ ...styles.textarea, minHeight: "80px" }}
                  value={constraints}
                  onChange={(e) => setConstraints(e.target.value)}
                  disabled={running}
                  placeholder={`Examples:\n\n"Hidden situation must be about her family, not academics."\n"Don't make her hometown anywhere on the East Coast."\n"Speech tics must include at least one physical/gestural habit, not just verbal."`}
                />
              </div>
            </div>

            {reviseMode && (
              <div style={styles.panel}>
                <div style={styles.reviseBanner}>
                  <strong>Revise mode active.</strong> Generation will start from the existing character below and apply your direction/constraints as changes.
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Existing character JSON</label>
                  <textarea
                    style={{ ...styles.textarea, minHeight: "100px", fontSize: "10px" }}
                    value={existingCharacter}
                    onChange={(e) => setExistingCharacter(e.target.value)}
                    disabled={running}
                  />
                  <div style={styles.controls}>
                    <button style={styles.btn(null, running)} onClick={exitReviseMode} disabled={running}>Exit revise mode</button>
                  </div>
                </div>
              </div>
            )}

            <div style={styles.panel}>
              <div style={styles.controls}>
                <button onClick={generate} disabled={running} style={styles.btn("primary", running)}>
                  {running ? "Running…" : reviseMode ? "▶ Revise character" : "▶ Generate"}
                </button>
                <button onClick={clearForm} disabled={running} style={styles.btn(null, running)}>Clear form</button>
                {activeVersion?.character && !reviseMode && (
                  <button onClick={reviseFromActive} disabled={running} style={styles.btn(null, running)}>Revise this version</button>
                )}
              </div>
              {statusMsg && <div style={styles.status}>{statusMsg}</div>}
            </div>
          </div>

          <div>
            <div style={styles.outputPanel}>
              {versions.length > 0 && (
                <div style={styles.versionTabs}>
                  {versions.map(v => (
                    <button key={v.id} onClick={() => setActiveVersionId(v.id)} style={styles.versionTab(activeVersionId === v.id)}>
                      {v.label} · {ARCHETYPES[v.archetype]?.label || v.archetype} · {v.timestamp} {v.error ? "✗" : "✓"}
                    </button>
                  ))}
                </div>
              )}

              {activeVersion?.error && (
                <div style={styles.err}>{activeVersion.error}</div>
              )}

              {activeVersion?.character && (
                <CharacterDisplay character={activeVersion.character} slot={ARCHETYPES[activeVersion.archetype]?.label || activeVersion.archetype} />
              )}

              {!activeVersion && (
                <div style={styles.emptyState}>
                  No characters generated yet. Pick an archetype, optionally provide direction, and hit generate.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";
import { portraitImageSrc } from "../../data/assets";
import { STARTER_NPCS } from "../../data/npcs";
import { getChemistryObservationsForNpc } from "../../engine/chemistry";
import type { GameState, Npc, NpcId, RelationshipRecord } from "../../types/game";

interface RosterAppProps {
  state: GameState;
}

function npcDirectory(state: GameState): Record<NpcId, Npc> {
  const directory = { ...STARTER_NPCS, ...(state.npcDirectory || {}) };
  for (const source of [state.world?.npcs, state.world?.characters]) {
    if (Array.isArray(source)) {
      for (const npc of source) {
        if (npc?.id) directory[npc.id] = { ...(directory[npc.id] || {}), ...npc };
      }
    } else if (source && typeof source === "object") {
      Object.assign(directory, source);
    }
  }
  return directory;
}

function relationshipRecord(state: GameState, npcId: NpcId): RelationshipRecord | number | string | undefined {
  return state.player.relationships?.[npcId];
}

function relationshipScore(record: RelationshipRecord | number | string | undefined) {
  if (typeof record === "number" || typeof record === "string") return record;
  return record?.score ?? record?.value ?? record?.affinity ?? "0";
}

function relationshipStatus(record: RelationshipRecord | number | string | undefined) {
  if (record && typeof record === "object") return record.status || record.summary || record.label || "recorded";
  return record == null ? "no record yet" : "recorded";
}

export function RosterApp({ state }: RosterAppProps) {
  const directory = useMemo(() => npcDirectory(state), [state]);
  const knownNpcIds = useMemo(() => [...new Set(["roommate", ...state.npcsKnown])], [state.npcsKnown]);
  const [selectedNpcId, setSelectedNpcId] = useState<NpcId>(knownNpcIds[0] || "roommate");
  const selectedNpc = directory[selectedNpcId] || directory[knownNpcIds[0]];
  const selectedRelationship = relationshipRecord(state, selectedNpc?.id || selectedNpcId);
  const observations = selectedNpc ? getChemistryObservationsForNpc(state, selectedNpc.id) : [];
  const chemistryRecords = Object.values(state.chemistry || {}).filter(record => selectedNpc && record.npcIds.includes(selectedNpc.id));

  if (!knownNpcIds.length) {
    return <div className="empty-state">No saved contacts yet.</div>;
  }

  return (
    <div className="roster-app">
      <div className="roster-list">
        {knownNpcIds.map(key => {
          const npc = directory[key] || Object.values(directory).find(item => item.portraitKey === key);
          const isSelected = (npc?.id || key) === selectedNpcId;
          const record = relationshipRecord(state, npc?.id || key);
          return (
            <button
              className={`roster-card ${isSelected ? "is-selected" : ""}`}
              type="button"
              key={key}
              onClick={() => setSelectedNpcId(npc?.id || key)}
            >
              {npc?.portraitKey && <img src={portraitImageSrc(npc.portraitKey)} alt="" className="roster-card__portrait" />}
              <div>
                <h2>{npc?.name || key}</h2>
                <p>{relationshipStatus(record)}</p>
              </div>
              <strong>{relationshipScore(record)}</strong>
            </button>
          );
        })}
      </div>

      {selectedNpc && (
        <section className="phone-panel roster-detail">
          <header>
            {selectedNpc.portraitKey && <img src={portraitImageSrc(selectedNpc.portraitKey)} alt="" className="roster-detail__portrait" />}
            <div>
              <h2>{selectedNpc.name || selectedNpc.id}</h2>
              <p>{selectedNpc.role || selectedNpc.archetype || "Campus contact"}</p>
            </div>
          </header>

          <div className="roster-detail__stats">
            <span>Relationship</span>
            <strong>{relationshipScore(selectedRelationship)}</strong>
            <span>Status</span>
            <strong>{relationshipStatus(selectedRelationship)}</strong>
          </div>

          {selectedNpc.schema?.publicFace && <p>{String(selectedNpc.schema.publicFace)}</p>}
          {selectedNpc.schema?.voice && <p><strong>Voice:</strong> {String(selectedNpc.schema.voice)}</p>}

          <section className="roster-subsection">
            <h3>Observed Signals</h3>
            {observations.length ? (
              <div className="observation-list">
                {observations.map(observation => (
                  <article className="observation-card" key={observation.id}>
                    <strong>{observation.label}</strong>
                    <p>{observation.text}</p>
                    <small>Sensitivity {observation.sensitivityGate}</small>
                  </article>
                ))}
              </div>
            ) : (
              <p className="subtle-copy">
                No special reads yet. Higher Sensitivity and more overlap can reveal what is happening around this contact.
              </p>
            )}
          </section>

          {chemistryRecords.length > 0 && (
            <section className="roster-subsection">
              <h3>Chemistry</h3>
              <div className="chemistry-list">
                {chemistryRecords.map(record => {
                  const otherNames = record.npcIds
                    .filter(id => id !== selectedNpc.id)
                    .map(id => directory[id]?.name || id)
                    .join(", ");
                  return (
                    <div className="chemistry-pill" key={record.id}>
                      <span>{otherNames || "Pair"}</span>
                      <strong>{record.score}</strong>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </section>
      )}
    </div>
  );
}

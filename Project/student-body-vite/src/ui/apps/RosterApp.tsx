import { useMemo, useState } from "react";
import { DAY_LABELS, formatTimeOfDay } from "../../data/locations";
import { portraitImageSrc } from "../../data/assets";
import { getChemistryObservationsForNpc } from "../../engine/chemistry";
import { getLocationDirectory, getScheduledNpcDirectory } from "../../engine/calendar";
import { getRecentSharedMoments, getRelationshipRecord, relationshipTimeline } from "../../engine/relationships";
import type { ChemistryRecord, GameState, Npc, NpcId, RelationshipRecord } from "../../types/game";

interface RosterAppProps {
  state: GameState;
}

type RosterTab = "overview" | "history" | "chemistry";

function npcDirectory(state: GameState): Record<NpcId, Npc> {
  return getScheduledNpcDirectory(state);
}

function relationshipScore(record: RelationshipRecord) {
  return Number(record.score) || 0;
}

function relationshipStatus(record: RelationshipRecord) {
  return record.status || record.summary || record.label || "recorded";
}

function formatFlagValue(value: unknown) {
  if (typeof value === "boolean") return value ? "yes" : "no";
  return String(value);
}

function formatWhen(day: number, slot: number) {
  const dayLabel = DAY_LABELS[(Math.max(1, day) - 1) % DAY_LABELS.length];
  return `${dayLabel} ${formatTimeOfDay(slot)}`;
}

function chemistryNames(record: ChemistryRecord, selectedNpcId: NpcId, directory: Record<NpcId, Npc>) {
  return record.npcIds
    .filter(id => id !== selectedNpcId)
    .map(id => id === "player" ? "You" : directory[id]?.name || id)
    .join(", ");
}

export function RosterApp({ state }: RosterAppProps) {
  const directory = useMemo(() => npcDirectory(state), [state]);
  const knownNpcIds = useMemo(() => [...new Set(["roommate", ...state.npcsKnown])], [state.npcsKnown]);
  const [selectedNpcId, setSelectedNpcId] = useState<NpcId>(knownNpcIds[0] || "roommate");
  const [tab, setTab] = useState<RosterTab>("overview");
  const selectedNpc = directory[selectedNpcId] || directory[knownNpcIds[0]];
  const selectedRelationship = getRelationshipRecord(state, selectedNpc?.id || selectedNpcId);
  const observations = selectedNpc ? getChemistryObservationsForNpc(state, selectedNpc.id) : [];
  const chemistryRecords = Object.values(state.chemistry || {}).filter(record => selectedNpc && record.npcIds.includes(selectedNpc.id));
  const recentMoments = selectedNpc ? getRecentSharedMoments(state, selectedNpc.id, 5) : [];
  const timeline = selectedNpc ? relationshipTimeline(state, selectedNpc.id, 10) : [];
  const locationDirectory = useMemo(() => getLocationDirectory(state), [state]);
  const flags = Object.entries(selectedRelationship.flags || {});

  if (!knownNpcIds.length) {
    return <div className="empty-state">No saved contacts yet.</div>;
  }

  return (
    <div className="roster-app">
      <div className="roster-list">
        {knownNpcIds.map(key => {
          const npc = directory[key] || Object.values(directory).find(item => item.portraitKey === key);
          const npcId = npc?.id || key;
          const isSelected = npcId === selectedNpcId;
          const record = getRelationshipRecord(state, npcId);
          return (
            <button
              className={`roster-card ${isSelected ? "is-selected" : ""}`}
              type="button"
              key={key}
              onClick={() => {
                setSelectedNpcId(npcId);
                setTab("overview");
              }}
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

          <div className="roster-detail__tabs" role="tablist" aria-label="Roster detail views">
            {(["overview", "history", "chemistry"] as RosterTab[]).map(nextTab => (
              <button
                type="button"
                key={nextTab}
                className={tab === nextTab ? "is-active" : ""}
                onClick={() => setTab(nextTab)}
              >
                {nextTab}
              </button>
            ))}
          </div>

          {tab === "overview" && (
            <>
              <div className="roster-detail__stats">
                <span>Relationship</span>
                <strong>{relationshipScore(selectedRelationship)}</strong>
                <span>Status</span>
                <strong>{relationshipStatus(selectedRelationship)}</strong>
              </div>

              {flags.length > 0 && (
                <section className="roster-subsection">
                  <h3>Flags</h3>
                  <div className="relationship-flag-grid">
                    {flags.map(([flag, value]) => (
                      <div className="relationship-flag" key={flag}>
                        <span>{flag.replace(/_/g, " ")}</span>
                        <strong>{formatFlagValue(value)}</strong>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {selectedNpc.schema?.publicFace && <p>{String(selectedNpc.schema.publicFace)}</p>}
              {(selectedNpc.currentLocation || selectedNpc.location) && (
                <p><strong>Now:</strong> {locationDirectory[selectedNpc.currentLocation || selectedNpc.location || ""]?.label || selectedNpc.currentLocation || selectedNpc.location}</p>
              )}
              {selectedNpc.schema?.voice && <p><strong>Voice:</strong> {String(selectedNpc.schema.voice)}</p>}

              <section className="roster-subsection">
                <h3>Recent Moments</h3>
                {recentMoments.length ? (
                  <div className="relationship-timeline">
                    {recentMoments.map(moment => (
                      <article className="timeline-card" key={moment.id}>
                        <small>{formatWhen(moment.day, moment.slot)}</small>
                        <strong>{moment.label}</strong>
                        <p>{moment.text}</p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="subtle-copy">No shared moments recorded yet.</p>
                )}
              </section>
            </>
          )}

          {tab === "history" && (
            <section className="roster-subsection">
              <h3>History Timeline</h3>
              {timeline.length ? (
                <div className="relationship-timeline">
                  {timeline.map(item => (
                    <article className={`timeline-card timeline-card--${item.kind}`} key={item.id}>
                      <small>{formatWhen(item.day, item.slot)}</small>
                      <strong>{item.label}</strong>
                      <p>{item.text}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="subtle-copy">No timeline entries yet.</p>
              )}
            </section>
          )}

          {tab === "chemistry" && (
            <>
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
                  <h3>Pair And Group Dynamics</h3>
                  <div className="chemistry-list">
                    {chemistryRecords.map(record => (
                      <div className="chemistry-pill" key={record.id}>
                        <span>{chemistryNames(record, selectedNpc.id, directory) || "Pair"}</span>
                        <strong>{record.score}</strong>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}

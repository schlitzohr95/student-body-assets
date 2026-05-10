import { useMemo, useState } from "react";
import { ACADEMIC_COURSES } from "../../data/academics";
import { STARTER_NPCS } from "../../data/npcs";
import { getLocationDirectory } from "../../engine/calendar";
import type { GameNote, GameState } from "../../types/game";
import { eventSummary, formatMoment, noteMoment } from "../format";

interface MarginAppProps {
  state: GameState;
  onAddNote: (text: string, links?: GameNote["links"]) => void;
}

type LinkMode = "general" | "npc" | "class" | "location" | "event";

function noteMatches(note: GameNote, query: string) {
  if (!query.trim()) return true;
  const haystack = [
    note.text,
    note.links?.category,
    note.links?.locationId,
    ...(note.links?.npcIds || []),
    ...(note.links?.courseIds || []),
    ...(note.links?.eventIds || []),
  ].join(" ").toLowerCase();
  return haystack.includes(query.trim().toLowerCase());
}

export function MarginApp({ state, onAddNote }: MarginAppProps) {
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [linkMode, setLinkMode] = useState<LinkMode>("general");
  const [linkId, setLinkId] = useState("");
  const recentEvents = state.eventLog.slice(-12).reverse();
  const locations = useMemo(() => getLocationDirectory(state), [state]);
  const filteredNotes = state.notes.filter(note => noteMatches(note, query)).slice().reverse();

  const linkOptions = useMemo(() => {
    if (linkMode === "npc") {
      return state.npcsKnown.map(id => ({ id, label: state.npcDirectory?.[id]?.name || STARTER_NPCS[id]?.name || id }));
    }
    if (linkMode === "class") {
      return ACADEMIC_COURSES.map(course => ({ id: course.id, label: `${course.code}: ${course.title}` }));
    }
    if (linkMode === "location") {
      return Object.values(locations).map(location => ({ id: location.id, label: location.label }));
    }
    if (linkMode === "event") {
      return recentEvents.map((event, index) => ({
        id: `${event.day || state.day}-${event.slot || 0}-${index}`,
        label: eventSummary(event).slice(0, 52),
      }));
    }
    return [];
  }, [linkMode, locations, recentEvents, state.day, state.npcDirectory, state.npcsKnown]);

  const submitNote = () => {
    if (!draft.trim()) return;
    const links: GameNote["links"] = { category: linkMode };
    if (linkMode === "npc" && linkId) links.npcIds = [linkId];
    if (linkMode === "class" && linkId) links.courseIds = [linkId];
    if (linkMode === "location") links.locationId = linkId || state.location;
    if (linkMode === "event" && linkId) links.eventIds = [linkId];
    onAddNote(draft, links);
    setDraft("");
  };

  return (
    <div className="margin-app margin-app--v2">
      <section className="phone-panel">
        <h2>New Note</h2>
        <textarea
          value={draft}
          onChange={event => setDraft(event.target.value)}
          placeholder="Write what the player should remember..."
        />
        <div className="margin-link-row">
          <label>
            Link
            <select value={linkMode} onChange={event => {
              setLinkMode(event.target.value as LinkMode);
              setLinkId("");
            }}>
              <option value="general">General</option>
              <option value="npc">NPC</option>
              <option value="class">Class</option>
              <option value="location">Location</option>
              <option value="event">Event</option>
            </select>
          </label>
          {linkMode !== "general" && (
            <label>
              Target
              <select value={linkId} onChange={event => setLinkId(event.target.value)}>
                <option value="">{linkMode === "location" ? locations[state.location]?.label || state.location : "Choose..."}</option>
                {linkOptions.map(option => <option value={option.id} key={option.id}>{option.label}</option>)}
              </select>
            </label>
          )}
        </div>
        <button
          type="button"
          onMouseDown={event => {
            event.preventDefault();
            submitNote();
          }}
          onClick={submitNote}
          disabled={!draft.trim()}
        >
          Add note
        </button>
      </section>

      <section className="phone-panel">
        <h2>Search</h2>
        <input
          className="margin-search"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Search notes, NPCs, classes, locations..."
        />
      </section>

      <section className="phone-panel">
        <h2>Notes</h2>
        <div className="timeline-list timeline-list--notes">
          {filteredNotes.length ? filteredNotes.map(note => (
            <article className="timeline-item" key={note.id}>
              <small>{noteMoment(note)} · {note.links?.category || "general"}</small>
              <p>{note.text}</p>
            </article>
          )) : <p className="subtle-copy">No matching notes.</p>}
        </div>
      </section>

      <section className="phone-panel">
        <h2>Recent Log</h2>
        <div className="timeline-list">
          {recentEvents.length ? recentEvents.map((event, index) => (
            <article className="timeline-item" key={`${event.day}-${event.slot}-${index}`}>
              <small>{formatMoment(event.day, event.slot || 0)}</small>
              <p>{eventSummary(event)}</p>
            </article>
          )) : <p className="subtle-copy">No events logged yet.</p>}
        </div>
      </section>
    </div>
  );
}

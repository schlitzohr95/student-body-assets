import { useState } from "react";
import type { GameState } from "../../types/game";
import { eventSummary, formatMoment, noteMoment } from "../format";

interface MarginAppProps {
  state: GameState;
  onAddNote: (text: string) => void;
}

export function MarginApp({ state, onAddNote }: MarginAppProps) {
  const [draft, setDraft] = useState("");
  const recentEvents = state.eventLog.slice(-12).reverse();
  const submitNote = () => {
    if (!draft.trim()) return;
    onAddNote(draft);
    setDraft("");
  };

  return (
    <div className="margin-app">
      <section className="phone-panel">
        <h2>New Note</h2>
        <textarea
          value={draft}
          onChange={event => setDraft(event.target.value)}
          placeholder="Write what the player should remember..."
        />
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
        <h2>Notes</h2>
        <div className="timeline-list">
          {state.notes.length ? state.notes.slice().reverse().map(note => (
            <article className="timeline-item" key={note.id}>
              <small>{noteMoment(note)}</small>
              <p>{note.text}</p>
            </article>
          )) : <p className="subtle-copy">No notes yet.</p>}
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

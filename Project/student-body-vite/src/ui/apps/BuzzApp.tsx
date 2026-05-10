import { LOCATIONS } from "../../data/locations";
import { formatCalendarEventTime, getUpcomingCalendarEvents } from "../../engine/calendar";
import type { GameState } from "../../types/game";
import { eventSummary, formatMoment } from "../format";

interface BuzzAppProps {
  state: GameState;
}

const feedItems = [
  "Open mic sign-ups are live at the Student Union desk.",
  "Intramural teams are still short two runners.",
  "The library extended weekend hours for first-year advising.",
  "Someone posted a lost keyring notice near the dining hall.",
  "The bookstore is discounting used lab notebooks this week.",
  "A philosophy club flyer asks if a sandwich can be lonely.",
];

export function BuzzApp({ state }: BuzzAppProps) {
  const offset = state.day % feedItems.length;
  const feed = [...feedItems.slice(offset), ...feedItems.slice(0, offset)].slice(0, 4);
  const recent = state.eventLog.slice(-4).reverse();
  const upcoming = getUpcomingCalendarEvents(state, 96).slice(0, 3);

  return (
    <div className="buzz-app">
      <section className="phone-panel buzz-hero">
        <h2>Campus Pulse</h2>
        <p>{LOCATIONS[state.location]?.label || state.location} is trending around your current orbit.</p>
      </section>
      <section className="phone-panel">
        <h2>Feed</h2>
        <div className="buzz-grid">
          {upcoming.map(event => (
            <article className="buzz-card" key={`${event.id}-${event.day}`}>
              <small>{event.kind.toUpperCase()} · {formatCalendarEventTime(event)}</small>
              <p>{event.title}</p>
            </article>
          ))}
          {feed.map((item, index) => (
            <article className="buzz-card" key={item}>
              <small>#{index + 1}</small>
              <p>{item}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="phone-panel">
        <h2>Your Footprint</h2>
        {recent.length ? recent.map((event, index) => (
          <article className="timeline-item" key={`${event.day}-${event.slot}-${index}`}>
            <small>{formatMoment(event.day, event.slot || 0)}</small>
            <p>{eventSummary(event)}</p>
          </article>
        )) : <p className="subtle-copy">Nothing logged yet.</p>}
      </section>
    </div>
  );
}

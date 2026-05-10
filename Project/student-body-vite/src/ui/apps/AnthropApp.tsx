import { formatCalendarEventTime, getLocationDirectory, getUpcomingCalendarEvents } from "../../engine/calendar";
import type { GameState, StatKey } from "../../types/game";
import { eventSummary, formatMoment } from "../format";

interface AnthropAppProps {
  state: GameState;
}

const statLabels: Record<StatKey, string> = {
  charm: "Charm",
  sensitivity: "Sensitivity",
  knowledge: "Knowledge",
  athletics: "Athletics",
  grit: "Grit",
};

function weakestStat(state: GameState): StatKey {
  return (Object.entries(state.player.stats) as Array<[StatKey, number]>)
    .sort((a, b) => a[1] - b[1])[0][0];
}

function strongestStat(state: GameState): StatKey {
  return (Object.entries(state.player.stats) as Array<[StatKey, number]>)
    .sort((a, b) => b[1] - a[1])[0][0];
}

export function AnthropApp({ state }: AnthropAppProps) {
  const weak = weakestStat(state);
  const strong = strongestStat(state);
  const recentEvents = state.eventLog.slice(-5).reverse();
  const relationshipEntries = Object.entries(state.player.relationships || {});
  const socialObservations = Object.values(state.chemistry || {})
    .flatMap(record => record.revealedObservations)
    .slice(-3)
    .reverse();
  const upcoming = getUpcomingCalendarEvents(state, 96).slice(0, 4);
  const locations = getLocationDirectory(state);

  return (
    <div className="anthrop-app">
      <section className="phone-panel anthrop-card">
        <h2>Readout</h2>
        <p>
          Week {Math.floor((state.day - 1) / 7) + 1}, currently at {locations[state.location]?.label || state.location}.
          Your strongest stat is {statLabels[strong]} and the easiest gain right now is probably {statLabels[weak]}.
        </p>
        <p>
          Energy is {state.player.resources.energy}/100 and money is ${state.player.resources.money}.
        </p>
      </section>

      <section className="phone-panel anthrop-card">
        <h2>Suggestions</h2>
        <ul>
          <li>{weak === "knowledge" ? "Study at the library or review notes in the dorm." : "Use location activities to round out the low stat."}</li>
          <li>{state.player.resources.energy < 35 ? "Recover energy before stacking more demanding activities." : "You have enough energy for one serious activity."}</li>
          <li>{state.npcsKnown.length ? "Use Pulse to keep a contact warm between in-person scenes." : "Explore town or campus until you meet someone worth saving."}</li>
        </ul>
      </section>

      <section className="phone-panel anthrop-card">
        <h2>Upcoming</h2>
        {upcoming.length ? (
          <div className="calendar-list">
            {upcoming.map(event => (
              <article className="calendar-card" key={`${event.id}-${event.day}-${event.startSlot}`}>
                <small>{formatCalendarEventTime(event)}</small>
                <strong>{event.title}</strong>
                {event.description && <p>{event.description}</p>}
              </article>
            ))}
          </div>
        ) : (
          <p className="subtle-copy">Nothing pressing in the next day.</p>
        )}
      </section>

      <section className="phone-panel anthrop-card">
        <h2>Relationships</h2>
        {relationshipEntries.length ? (
          <div className="relationship-grid">
            {relationshipEntries.map(([npcId, record]) => (
              <div className="relationship-pill" key={npcId}>
                <span>{npcId}</span>
                <strong>{typeof record === "object" ? record.score : record}</strong>
              </div>
            ))}
          </div>
        ) : (
          <p className="subtle-copy">No relationship records yet.</p>
        )}
      </section>

      <section className="phone-panel anthrop-card">
        <h2>Social Signals</h2>
        {socialObservations.length ? (
          <ul>
            {socialObservations.map(observation => (
              <li key={observation.id}>{observation.label}: {observation.text}</li>
            ))}
          </ul>
        ) : (
          <p className="subtle-copy">No gated observations surfaced yet.</p>
        )}
      </section>

      <section className="phone-panel anthrop-card">
        <h2>Recent</h2>
        {recentEvents.length ? recentEvents.map((event, index) => (
          <article className="timeline-item" key={`${event.day}-${event.slot}-${index}`}>
            <small>{formatMoment(event.day, event.slot || 0)}</small>
            <p>{eventSummary(event)}</p>
          </article>
        )) : <p className="subtle-copy">No events logged yet.</p>}
      </section>
    </div>
  );
}

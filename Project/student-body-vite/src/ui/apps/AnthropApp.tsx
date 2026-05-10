import { activeAnthropLeads, anthropCommitments, neglectedContacts, recentAnthropMoments } from "../../engine/anthrop";
import { getLocationDirectory } from "../../engine/calendar";
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

function LeadList({ items }: { items: ReturnType<typeof activeAnthropLeads> }) {
  if (!items.length) return <p className="subtle-copy">Nothing urgent in this lane.</p>;
  return (
    <div className="anthrop-lead-list">
      {items.map(item => (
        <article className={`anthrop-lead anthrop-lead--${item.urgency}`} key={item.id}>
          <small>{item.kind} · {item.urgency}</small>
          <strong>{item.title}</strong>
          <p>{item.body}</p>
        </article>
      ))}
    </div>
  );
}

export function AnthropApp({ state }: AnthropAppProps) {
  const weak = weakestStat(state);
  const strong = strongestStat(state);
  const recentEvents = state.eventLog.slice(-5).reverse();
  const leads = activeAnthropLeads(state);
  const commitments = anthropCommitments(state);
  const neglected = neglectedContacts(state);
  const moments = recentAnthropMoments(state);
  const socialObservations = Object.values(state.chemistry || {})
    .flatMap(record => record.revealedObservations)
    .slice(-3)
    .reverse();
  const locations = getLocationDirectory(state);

  return (
    <div className="anthrop-app anthrop-app--v2">
      <section className="phone-panel anthrop-card">
        <h2>Readout</h2>
        <p>
          Week {Math.floor((state.day - 1) / 7) + 1}, currently at {locations[state.location]?.label || state.location}.
          Strongest: {statLabels[strong]}. Easiest pressure point: {statLabels[weak]}.
        </p>
        <p>Energy {state.player.resources.energy}/100 · Money ${state.player.resources.money}</p>
      </section>

      <section className="phone-panel anthrop-card">
        <h2>Active Leads</h2>
        <LeadList items={leads} />
      </section>

      <section className="phone-panel anthrop-card">
        <h2>Commitments</h2>
        <LeadList items={commitments} />
      </section>

      <section className="phone-panel anthrop-card">
        <h2>Neglected Contacts</h2>
        <LeadList items={neglected} />
      </section>

      <section className="phone-panel anthrop-card">
        <h2>Recent Moments</h2>
        <LeadList items={moments} />
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
        <h2>Recent Log</h2>
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

import { getBuzzPosts, buzzSourceLabel } from "../../engine/buzz";
import { getLocationDirectory } from "../../engine/calendar";
import type { GameState } from "../../types/game";
import { eventSummary, formatMoment } from "../format";

interface BuzzAppProps {
  state: GameState;
}

export function BuzzApp({ state }: BuzzAppProps) {
  const posts = getBuzzPosts(state);
  const recent = state.eventLog.slice(-4).reverse();
  const locations = getLocationDirectory(state);

  return (
    <div className="buzz-app buzz-app--v2">
      <section className="phone-panel buzz-hero">
        <h2>Campus Pulse</h2>
        <p>{locations[state.location]?.label || state.location} is trending around your current orbit.</p>
      </section>

      <section className="phone-panel buzz-feed-panel">
        <h2>Feed</h2>
        <div className="buzz-grid buzz-grid--feed">
          {posts.map(post => (
            <article className={`buzz-card buzz-card--${post.source}`} key={post.id}>
              <small>{buzzSourceLabel(post)} · {post.tag} · {formatMoment(post.day, post.slot)}</small>
              <strong>{post.author}</strong>
              <p>{post.text}</p>
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

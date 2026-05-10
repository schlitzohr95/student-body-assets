import { getLocationDirectory, getNpcsAtLocation } from "../../engine/calendar";
import { getLocationKnowledge, hasKnownHours, isLocationVisible } from "../../engine/locationKnowledge";
import type { GameState, LocationCategory, LocationId } from "../../types/game";

interface CompassAppProps {
  state: GameState;
  onNavigate: (location: LocationId) => void;
}

const groups: Array<{ label: string; cat: LocationCategory }> = [
  { label: "Campus", cat: "campus" },
  { label: "Town", cat: "town" },
  { label: "Outdoor", cat: "outdoor" },
];

export function CompassApp({ state, onNavigate }: CompassAppProps) {
  const locations = getLocationDirectory(state);

  return (
    <div className="compass-app">
      {groups.map(group => (
        <section className="phone-panel" key={group.cat}>
          <h2>{group.label}</h2>
          <div className="location-list">
            {Object.values(locations)
              .filter(location => location.cat === group.cat && isLocationVisible(state, location))
              .map(location => {
                const isHere = location.id === state.location;
                const knowledge = getLocationKnowledge(state, location.id, location);
                const hoursKnown = hasKnownHours(state, location);
                const hours = location.hours ? (hoursKnown ? location.hours : "Hours unknown") : "";
                const npcNames = getNpcsAtLocation(state, location.id).slice(0, 2).map(npc => npc.name || npc.id);
                const meta = isHere ? "here" : npcNames.length ? npcNames.join(", ") : "";
                return (
                  <button
                    className={`location-button ${isHere ? "is-current" : ""}`}
                    type="button"
                    disabled={isHere}
                    key={location.id}
                    onClick={() => onNavigate(location.id)}
                  >
                    <span className="location-button__main">
                      <span className="location-button__name">{location.label}</span>
                      {knowledge.isNew && <span className="location-button__tag">new</span>}
                    </span>
                    {meta && <span className="location-button__meta">{meta}</span>}
                    {hours && <span className={`location-button__hours ${hoursKnown ? "" : "is-unknown"}`}>{hours}</span>}
                  </button>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
}

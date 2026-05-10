import { getLocationDirectory, getNpcsAtLocation } from "../../engine/calendar";
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
              .filter(location => location.cat === group.cat)
              .map(location => {
                const isHere = location.id === state.location;
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
                    <span>{location.label}</span>
                    {meta && <span className="location-button__meta">{meta}</span>}
                  </button>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
}

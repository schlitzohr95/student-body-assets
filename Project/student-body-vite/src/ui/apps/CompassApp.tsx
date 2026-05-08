import { LOCATIONS } from "../../data/locations";
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
  return (
    <div className="compass-app">
      {groups.map(group => (
        <section className="phone-panel" key={group.cat}>
          <h2>{group.label}</h2>
          <div className="location-list">
            {Object.values(LOCATIONS)
              .filter(location => location.cat === group.cat)
              .map(location => {
                const isHere = location.id === state.location;
                return (
                  <button
                    className={`location-button ${isHere ? "is-current" : ""}`}
                    type="button"
                    disabled={isHere}
                    key={location.id}
                    onClick={() => onNavigate(location.id)}
                  >
                    <span>{location.label}</span>
                    {isHere && <span>here</span>}
                  </button>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
}

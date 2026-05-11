import { useState } from "react";
import { getStudentUnionBulletinItems } from "../../engine/bulletin";
import { getLocationDirectory, getNpcsAtLocation } from "../../engine/calendar";
import { canPurchaseItem, describeItemEffects, getShopInventory, inventoryCount } from "../../engine/economy";
import { getLocationKnowledge, hasKnownHours, isLocationVisible } from "../../engine/locationKnowledge";
import { getTravelPlan } from "../../engine/travel";
import type { Choice, GameState, LocationCategory, LocationId } from "../../types/game";

interface CompassAppProps {
  state: GameState;
  onNavigate: (location: LocationId) => void;
  onBulletinAction: (choice: Choice) => void | Promise<void>;
  onPurchase: (itemId: string) => void;
}

const groups: Array<{ label: string; cat: LocationCategory }> = [
  { label: "Campus", cat: "campus" },
  { label: "Town", cat: "town" },
  { label: "Outdoor", cat: "outdoor" },
];

export function CompassApp({ state, onNavigate, onBulletinAction, onPurchase }: CompassAppProps) {
  const [view, setView] = useState<"locations" | "bulletin" | "shop">("locations");
  const locations = getLocationDirectory(state);
  const canUseBulletin = state.location === "student_union";
  const bulletinItems = getStudentUnionBulletinItems(state);
  const shopItems = getShopInventory(state);
  const canUseShop = shopItems.length > 0;

  return (
    <div className="compass-app">
      <header className="compass-app__header">
        <div className="segmented-control compass-app__tabs">
          <button className={view === "locations" ? "is-active" : ""} type="button" onClick={() => setView("locations")}>
            Locations
          </button>
          <button
            className={view === "bulletin" ? "is-active" : ""}
            type="button"
            disabled={!canUseBulletin}
            onClick={() => setView("bulletin")}
          >
            Bulletin
          </button>
          <button
            className={view === "shop" ? "is-active" : ""}
            type="button"
            disabled={!canUseShop}
            onClick={() => setView("shop")}
          >
            Shop
          </button>
        </div>
        {!canUseBulletin && !canUseShop && <span className="compass-app__hint">Shop and bulletin unlock at certain locations</span>}
        {canUseShop && <span className="compass-app__hint">Shop stock follows your current location</span>}
      </header>

      {view === "locations" ? (
        <div className="compass-app__columns">
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
                    const hours = location.hours ? (hoursKnown ? location.hours : "Hours unknown") : "Hours not posted";
                    const npcs = getNpcsAtLocation(state, location.id).slice(0, 3);
                    const travelPlan = getTravelPlan(state, location.id, locations);
                    return (
                      <button
                        className={`location-button ${isHere ? "is-current" : ""}`}
                        type="button"
                        disabled={isHere || !travelPlan.canAfford}
                        key={location.id}
                        onClick={() => onNavigate(location.id)}
                      >
                        <span className="location-button__main">
                          <span className="location-button__name">{location.label}</span>
                          {knowledge.isNew && <span className="location-button__tag">new</span>}
                        </span>
                        {isHere && <span className="location-button__meta">here</span>}
                        <span className={`location-button__hours ${hoursKnown || !location.hours ? "" : "is-unknown"}`}>{hours}</span>
                        {npcs.length > 0 && (
                          <span className="location-button__npcs">
                            {npcs.map(npc => (
                              <span className="location-button__npc" key={npc.id} title={npc.currentMood || npc.mood || ""}>
                                {npc.name || npc.id}
                              </span>
                            ))}
                          </span>
                        )}
                        {!isHere && (
                          <span className="location-button__travel">
                            {travelPlan.mode} · {travelPlan.durationLabel} · {travelPlan.costLabel}
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>
            </section>
          ))}
        </div>
      ) : view === "bulletin" ? (
        <section className="phone-panel compass-bulletin">
          <h2>Student Union Bulletin</h2>
          <div className="bulletin-list">
            {bulletinItems.map(item => (
              <article className="bulletin-card" key={item.id}>
                <small>{item.kicker}</small>
                <strong>{item.title}</strong>
                <p>{item.body}</p>
                <button className="secondary-button" type="button" onClick={() => onBulletinAction(item.action)}>
                  {item.action.label}
                </button>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section className="phone-panel compass-shop">
          <h2>{locations[state.location]?.label || state.location} Shop</h2>
          <div className="shop-list">
            {shopItems.map(item => {
              const check = canPurchaseItem(state, item.id);
              const owned = inventoryCount(state, item.id);
              return (
                <article className="shop-card" key={item.id}>
                  <div>
                    <small>{item.kind.toUpperCase()} · ${item.price}{owned ? ` · owned ${owned}` : ""}</small>
                    <strong>{item.label}</strong>
                    <p>{item.description}</p>
                    <span>{describeItemEffects(item)}</span>
                  </div>
                  <button className="secondary-button" type="button" disabled={!check.ok} onClick={() => onPurchase(item.id)}>
                    {check.ok ? "Buy" : check.reason}
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

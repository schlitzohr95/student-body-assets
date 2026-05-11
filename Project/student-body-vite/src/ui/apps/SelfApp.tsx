import { inventoryEntries } from "../../engine/economy";
import type { GameState, StatKey } from "../../types/game";

interface SelfAppProps {
  state: GameState;
}

const statLabels: Array<[StatKey, string]> = [
  ["charm", "Charm"],
  ["sensitivity", "Sensitivity"],
  ["knowledge", "Knowledge"],
  ["athletics", "Athletics"],
  ["grit", "Grit"],
];

export function SelfApp({ state }: SelfAppProps) {
  const inventory = inventoryEntries(state);

  return (
    <div className="self-app">
      <section className="phone-panel">
        <h2>Stats</h2>
        {statLabels.map(([key, label]) => (
          <div className="stat-row" key={key}>
            <div className="stat-row__label">
              <span>{label}</span>
              <span>{state.player.stats[key]}</span>
            </div>
            <div className="stat-row__track">
              <div className="stat-row__fill" style={{ width: `${state.player.stats[key]}%` }} />
            </div>
          </div>
        ))}
      </section>
      <section className="phone-panel">
        <h2>Resources</h2>
        <div className="resource-row">
          <span>Energy</span>
          <span>{state.player.resources.energy}</span>
        </div>
        <div className="resource-row">
          <span>Money</span>
          <span>${state.player.resources.money}</span>
        </div>
      </section>
      <section className="phone-panel">
        <h2>Inventory</h2>
        {inventory.length ? (
          <div className="inventory-list">
            {inventory.map(({ item, stack }) => (
              <article className="inventory-item" key={item.id}>
                <div>
                  <strong>{item.label}</strong>
                  <small>{item.kind}</small>
                </div>
                <span>x{stack.quantity}</span>
              </article>
            ))}
          </div>
        ) : (
          <p className="subtle-copy">No items yet.</p>
        )}
      </section>
    </div>
  );
}

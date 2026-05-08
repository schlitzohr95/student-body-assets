import { portraitImageSrc } from "../../data/assets";
import { STARTER_NPCS } from "../../data/npcs";
import type { GameState } from "../../types/game";

interface RosterAppProps {
  state: GameState;
}

export function RosterApp({ state }: RosterAppProps) {
  if (!state.npcsKnown.length) {
    return <div className="empty-state">No saved contacts yet.</div>;
  }

  return (
    <div className="roster-list">
      {state.npcsKnown.map(key => {
        const npc = state.npcDirectory?.[key] || STARTER_NPCS[key] || Object.values(STARTER_NPCS).find(item => item.portraitKey === key);
        return (
          <article className="roster-card" key={key}>
            {npc?.portraitKey && <img src={portraitImageSrc(npc.portraitKey)} alt="" className="roster-card__portrait" />}
            <div>
              <h2>{npc?.name || key}</h2>
              <p>{npc?.role || "Campus contact"}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}

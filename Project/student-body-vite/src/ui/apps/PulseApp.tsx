import { STARTER_NPCS } from "../../data/npcs";
import type { GameState, NpcId } from "../../types/game";
import { formatMoment } from "../format";

interface PulseAppProps {
  state: GameState;
  onSendMessage: (npcId: NpcId, templateId: "check_in" | "ask_about_day" | "invite_coffee") => void;
}

export function PulseApp({ state, onSendMessage }: PulseAppProps) {
  const contacts = state.npcsKnown
    .map(key => state.npcDirectory?.[key] || STARTER_NPCS[key] || Object.values(STARTER_NPCS).find(npc => npc.portraitKey === key))
    .filter(Boolean);

  if (!contacts.length) {
    return <div className="empty-state">No contacts yet.</div>;
  }

  return (
    <div className="pulse-app">
      {contacts.map(contact => {
        const thread = state.messages.filter(message => message.npcId === contact!.id).slice(-4);
        return (
          <section className="pulse-thread" key={contact!.id}>
            <header>
              <div>
                <h2>{contact!.name}</h2>
                <p>{contact!.role || "Contact"}</p>
              </div>
            </header>
            <div className="message-list">
              {thread.length ? (
                thread.map(message => (
                  <article className={`message-bubble message-bubble--${message.direction}`} key={message.id}>
                    <span>{message.text}</span>
                    <small>{formatMoment(message.day, message.slot)}</small>
                  </article>
                ))
              ) : (
                <p className="subtle-copy">No messages yet.</p>
              )}
            </div>
            <div className="pulse-actions">
              <button type="button" onClick={() => onSendMessage(contact!.id, "check_in")}>Check in</button>
              <button type="button" onClick={() => onSendMessage(contact!.id, "ask_about_day")}>Ask about day</button>
              <button type="button" onClick={() => onSendMessage(contact!.id, "invite_coffee")}>Invite coffee</button>
            </div>
          </section>
        );
      })}
    </div>
  );
}

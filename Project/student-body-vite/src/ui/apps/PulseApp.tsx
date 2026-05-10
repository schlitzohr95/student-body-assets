import { useEffect, useMemo, useState } from "react";
import { STARTER_NPCS } from "../../data/npcs";
import { pendingMessages, unreadPulseCount, visibleMessages, type PulseTemplateId } from "../../engine/pulse";
import type { GameState, Npc, NpcId } from "../../types/game";
import { formatMoment } from "../format";

interface PulseAppProps {
  state: GameState;
  onSendMessage: (npcId: NpcId, templateId: PulseTemplateId) => void;
  onMarkRead: (npcId?: NpcId) => void;
}

const actions: Array<{ id: PulseTemplateId; label: string }> = [
  { id: "check_in", label: "Check in" },
  { id: "ask_about_day", label: "Ask about day" },
  { id: "invite_coffee", label: "Invite coffee" },
];

function contactDirectory(state: GameState): Record<NpcId, Npc> {
  return {
    ...STARTER_NPCS,
    ...(state.npcDirectory || {}),
  };
}

export function PulseApp({ state, onSendMessage, onMarkRead }: PulseAppProps) {
  const directory = useMemo(() => contactDirectory(state), [state]);
  const contacts = useMemo(() => state.npcsKnown
    .map(key => directory[key] || Object.values(directory).find(npc => npc.portraitKey === key))
    .filter(Boolean) as Npc[], [directory, state.npcsKnown]);
  const [selectedId, setSelectedId] = useState<NpcId>(contacts[0]?.id || "roommate");
  const selected = directory[selectedId] || contacts[0];
  const thread = selected ? visibleMessages(state, selected.id) : [];
  const pending = selected ? pendingMessages(state, selected.id) : [];

  useEffect(() => {
    if (selected?.id && unreadPulseCount(state, selected.id) > 0) onMarkRead(selected.id);
  }, [onMarkRead, selected?.id, state]);

  if (!contacts.length) {
    return <div className="empty-state">No contacts yet.</div>;
  }

  return (
    <div className="pulse-app pulse-app--v2">
      <aside className="pulse-contact-list">
        {contacts.map(contact => {
          const unread = unreadPulseCount(state, contact.id);
          const waiting = pendingMessages(state, contact.id).length;
          return (
            <button
              type="button"
              className={`pulse-contact ${selected?.id === contact.id ? "is-selected" : ""}`}
              key={contact.id}
              onClick={() => {
                setSelectedId(contact.id);
                onMarkRead(contact.id);
              }}
            >
              <span>{contact.name}</span>
              <small>{unread ? `${unread} unread` : waiting ? "reply pending" : contact.role || "Contact"}</small>
            </button>
          );
        })}
      </aside>

      {selected && (
        <section className="pulse-thread pulse-thread--active">
          <header>
            <div>
              <h2>{selected.name}</h2>
              <p>{selected.role || "Contact"}</p>
            </div>
            {unreadPulseCount(state, selected.id) > 0 && (
              <button type="button" onClick={() => onMarkRead(selected.id)}>Mark read</button>
            )}
          </header>

          <div className="message-list message-list--history">
            {thread.length ? (
              thread.map(message => (
                <article className={`message-bubble message-bubble--${message.direction} ${!message.read && message.direction === "incoming" ? "is-unread" : ""}`} key={message.id}>
                  <span>{message.text}</span>
                  <small>{formatMoment(message.day, message.slot)}</small>
                </article>
              ))
            ) : (
              <p className="subtle-copy">No messages yet.</p>
            )}
            {pending.map(message => (
              <article className="message-bubble message-bubble--pending" key={message.id}>
                <span>Reply pending</span>
                <small>Expected after {formatMoment(message.availableDay || message.day, message.availableSlot || message.slot)}</small>
              </article>
            ))}
          </div>

          <div className="pulse-actions">
            {actions.map(action => (
              <button type="button" key={action.id} onClick={() => onSendMessage(selected.id, action.id)}>
                {action.label}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

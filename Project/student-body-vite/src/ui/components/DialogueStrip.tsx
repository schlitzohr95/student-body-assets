import { useEffect, useMemo, useRef } from "react";
import type { Choice, DialogueTurn, Scene } from "../../types/game";

interface DialogueStripProps {
  scene: Scene;
  dialogueLog?: DialogueTurn[];
  onChoice: (choice: Choice) => void;
  busy?: boolean;
}

function sameText(left = "", right = "") {
  return left.trim().replace(/\s+/g, " ") === right.trim().replace(/\s+/g, " ");
}

function currentSceneTurn(scene: Scene): DialogueTurn | null {
  if (!scene.narration.trim()) return null;
  return {
    id: "current-scene",
    day: 0,
    slot: 0,
    speaker: "narrator",
    label: "Narrator",
    text: scene.narration,
    source: "scene",
  };
}

export function DialogueStrip({ scene, dialogueLog = [], onChoice, busy = false }: DialogueStripProps) {
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const turns = useMemo(() => {
    const recentTurns = dialogueLog.slice(-10);
    const sceneTurn = currentSceneTurn(scene);
    const latest = recentTurns[recentTurns.length - 1];

    if (!sceneTurn || (latest && sameText(latest.text, sceneTurn.text))) return recentTurns;
    return [...recentTurns, sceneTurn];
  }, [dialogueLog, scene]);

  useEffect(() => {
    const node = transcriptRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [turns.length, scene.narration]);

  return (
    <section className="dialogue-strip">
      <div className="dialogue-strip__text" ref={transcriptRef}>
        {turns.map(turn => (
          <article className={`dialogue-turn dialogue-turn--${turn.speaker}${turn.source === "scene" ? " dialogue-turn--current" : ""}`} key={turn.id}>
            <span className="dialogue-turn__speaker">{turn.label}</span>
            <p>{turn.text}</p>
          </article>
        ))}
      </div>
      <div className="choice-row">
        {scene.choices.map(choice => (
          <button
            className="choice-button"
            type="button"
            key={choice.id}
            onClick={() => onChoice(choice)}
            disabled={busy || Boolean(choice.disabledReason)}
            title={choice.disabledReason}
          >
            <span>{choice.label}</span>
            {choice.disabledReason && <small>{choice.disabledReason}</small>}
          </button>
        ))}
        {busy && <span className="choice-row__status">Generating...</span>}
      </div>
    </section>
  );
}

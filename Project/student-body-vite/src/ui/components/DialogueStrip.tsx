import type { Choice, Scene } from "../../types/game";

interface DialogueStripProps {
  scene: Scene;
  onChoice: (choice: Choice) => void;
  busy?: boolean;
}

export function DialogueStrip({ scene, onChoice, busy = false }: DialogueStripProps) {
  return (
    <section className="dialogue-strip">
      <div className="dialogue-strip__text">{scene.narration}</div>
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

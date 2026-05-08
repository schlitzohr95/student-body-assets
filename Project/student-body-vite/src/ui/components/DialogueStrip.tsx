import type { Choice, Scene } from "../../types/game";

interface DialogueStripProps {
  scene: Scene;
  onChoice: (choice: Choice) => void;
}

export function DialogueStrip({ scene, onChoice }: DialogueStripProps) {
  return (
    <section className="dialogue-strip">
      <div className="dialogue-strip__text">{scene.narration}</div>
      <div className="choice-row">
        {scene.choices.map(choice => (
          <button className="choice-button" type="button" key={choice.id} onClick={() => onChoice(choice)}>
            {choice.label}
          </button>
        ))}
      </div>
    </section>
  );
}

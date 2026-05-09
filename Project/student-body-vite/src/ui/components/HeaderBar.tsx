import { RotateCcw } from "lucide-react";
import { DAY_LABELS, formatTimeOfDay, LOCATIONS } from "../../data/locations";
import type { GameState } from "../../types/game";

interface HeaderBarProps {
  state: GameState;
  onNewGame: () => void;
}

export function HeaderBar({ state, onNewGame }: HeaderBarProps) {
  const dayName = DAY_LABELS[(state.day - 1) % DAY_LABELS.length];
  return (
    <div className="header-bar">
      <span className="header-bar__accent">Week {Math.floor((state.day - 1) / 7) + 1}</span>
      <span>{dayName}</span>
      <span>{formatTimeOfDay(state.timeSlot)}</span>
      <span>{LOCATIONS[state.location]?.label || state.location}</span>
      <button className="icon-button icon-button--tiny" type="button" onClick={onNewGame} title="New game">
        <RotateCcw size={14} />
      </button>
    </div>
  );
}

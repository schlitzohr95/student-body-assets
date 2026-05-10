import { useState } from "react";
import { formatClockTime } from "../../data/locations";
import { sleepPreview, wakeOptions } from "../../engine/wake";
import type { GameState } from "../../types/game";

interface WakeAppProps {
  state: GameState;
  onSleep: (alarmSlot: number) => void;
}

export function WakeApp({ state, onSleep }: WakeAppProps) {
  const [alarmSlot, setAlarmSlot] = useState(state.wake?.alarmSlot ?? wakeOptions()[1].slot);
  const preview = sleepPreview(state, alarmSlot);

  return (
    <div className="wake-app">
      <section className="phone-panel wake-hero">
        <h2>Wake</h2>
        <strong>{formatClockTime(alarmSlot)}</strong>
        <p>Sleep {preview.durationLabel}, wake with +{preview.energyGain} energy.</p>
      </section>

      <section className="phone-panel wake-option-list">
        <h2>Alarm</h2>
        {wakeOptions().map(option => (
          <button
            type="button"
            className={option.slot === alarmSlot ? "is-selected" : ""}
            key={option.slot}
            onClick={() => setAlarmSlot(option.slot)}
          >
            <span>{option.label}</span>
            <small>{option.detail}</small>
          </button>
        ))}
      </section>

      <section className="phone-panel wake-summary">
        <h2>Preview</h2>
        <p>Wake: Day {preview.wakeDay}, {formatClockTime(preview.wakeSlot)}</p>
        <p>Energy: {state.player.resources.energy} to {Math.min(100, state.player.resources.energy + preview.energyGain)}</p>
        {preview.oversleep > 0 && <p>Exhaustion risk: you may sleep through the first alarm.</p>}
        {preview.missedMorningBlocks > 0 && <p>Morning blocks missed: {preview.missedMorningBlocks}</p>}
        <button type="button" onClick={() => onSleep(alarmSlot)}>Sleep until alarm</button>
      </section>
    </div>
  );
}

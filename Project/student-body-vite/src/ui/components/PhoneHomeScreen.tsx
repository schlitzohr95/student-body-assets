import { iconImageSrc } from "../../data/assets";
import { APPS } from "../../data/apps";
import { formatClockTime } from "../../data/locations";
import { hasNewCompassIntel } from "../../engine/locationKnowledge";
import { unreadPulseCount } from "../../engine/pulse";
import type { GameState } from "../../types/game";

interface PhoneHomeScreenProps {
  state: GameState;
  onOpenApp: (appId: string) => void;
}

export function PhoneHomeScreen({ state, onOpenApp }: PhoneHomeScreenProps) {
  return (
    <div className="phone-home">
      <div className="phone-status">
        <span>{formatClockTime(state.timeSlot)}</span>
        <span className="phone-status__battery" />
      </div>
      <div className="phone-grid">
        {APPS.map(app => {
          const showNewBadge = app.id === "compass" && hasNewCompassIntel(state);
          const unreadCount = app.id === "pulse" ? unreadPulseCount(state) : 0;
          return (
            <button className="phone-app-button" type="button" key={app.id} onClick={() => onOpenApp(app.id)}>
              {showNewBadge && <span className="phone-app-button__badge">new</span>}
              {unreadCount > 0 && <span className="phone-app-button__badge">{unreadCount}</span>}
              <img src={iconImageSrc(app.id)} alt="" className="phone-app-button__icon" />
              <span>{app.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

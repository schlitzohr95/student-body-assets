import { Backpack, Map, Smartphone, UserRound } from "lucide-react";

interface FloatingControlsProps {
  phoneOpen: boolean;
  onTogglePhone: () => void;
  onOpenSelf: () => void;
  onOpenMap: () => void;
}

export function FloatingControls({ phoneOpen, onTogglePhone, onOpenSelf, onOpenMap }: FloatingControlsProps) {
  return (
    <div className="floating-controls">
      <button className={`icon-button ${phoneOpen ? "is-active" : ""}`} type="button" onClick={onTogglePhone} title="Phone">
        <Smartphone size={20} />
      </button>
      <button className="icon-button is-muted" type="button" disabled title="Inventory">
        <Backpack size={20} />
      </button>
      <button className="icon-button" type="button" onClick={onOpenSelf} title="Self">
        <UserRound size={20} />
      </button>
      <button className="icon-button" type="button" onClick={onOpenMap} title="Map">
        <Map size={20} />
      </button>
    </div>
  );
}

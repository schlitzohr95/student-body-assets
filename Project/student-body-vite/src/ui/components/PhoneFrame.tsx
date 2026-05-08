import { X } from "lucide-react";
import type { ReactNode } from "react";

interface PhoneFrameProps {
  orientation: "portrait" | "landscape";
  children: ReactNode;
  onClose: () => void;
}

export function PhoneFrame({ orientation, children, onClose }: PhoneFrameProps) {
  return (
    <div className={`phone-frame phone-frame--${orientation}`}>
      <div className="phone-frame__bezel">
        <div className="phone-frame__screen">{children}</div>
      </div>
      <button className="phone-frame__close" type="button" onClick={onClose} title="Put phone away">
        <X size={16} />
      </button>
    </div>
  );
}

import type { PhoneAppDefinition } from "../../types/game";

interface StubAppProps {
  app: PhoneAppDefinition;
}

export function StubApp({ app }: StubAppProps) {
  return (
    <div className="empty-state">
      <strong>{app.label}</strong>
      <span>{app.role}</span>
    </div>
  );
}

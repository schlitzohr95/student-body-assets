import { locationImageSrc } from "../../data/assets";
import type { LocationId } from "../../types/game";

interface SceneImageProps {
  location: LocationId;
}

export function SceneImage({ location }: SceneImageProps) {
  return (
    <div className="scene-image">
      <img
        src={locationImageSrc(location)}
        alt=""
        className="scene-image__asset"
        onError={event => {
          if (event.currentTarget.dataset.fallbackApplied) return;
          event.currentTarget.dataset.fallbackApplied = "true";
          event.currentTarget.src = locationImageSrc("walking_path");
        }}
      />
    </div>
  );
}

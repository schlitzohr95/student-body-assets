import { locationImageSrc } from "../../data/assets";
import type { LocationId } from "../../types/game";

interface SceneImageProps {
  location: LocationId;
}

export function SceneImage({ location }: SceneImageProps) {
  return (
    <div className="scene-image">
      <img src={locationImageSrc(location)} alt="" className="scene-image__asset" />
    </div>
  );
}

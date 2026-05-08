import type { LocationId } from "../types/game";

const assetPath = (folder: string, key: string) => `/assets/${folder}/${key}.svg`;

export const locationImageSrc = (location: LocationId) => assetPath("locations", location);
export const portraitImageSrc = (portraitKey: string) => assetPath("portraits", portraitKey);
export const iconImageSrc = (appId: string) => assetPath("icons", appId);

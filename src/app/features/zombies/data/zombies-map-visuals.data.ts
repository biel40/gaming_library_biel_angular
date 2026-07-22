import { ZombiesMap } from '../models/zombies.models';

const MAP_POSTER_ATLAS = '/assets/images/zombies/map-posters.svg';

export function withMapVisual(map: ZombiesMap): ZombiesMap {
  const imageUrl = map.imageUrl ?? `${MAP_POSTER_ATLAS}#${map.id}`;
  const imageAlt = map.imageAlt ?? `Dossier visual de ${map.name}`;
  const imagePosition = map.imagePosition ?? 'center';

  return {
    ...map,
    imageUrl,
    imageAlt,
    imagePosition,
  };
}
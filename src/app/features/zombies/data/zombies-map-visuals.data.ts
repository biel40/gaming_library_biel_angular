import { ZombiesMap } from '../models/zombies.models';

const MAP_POSTER_ATLAS = '/assets/images/zombies/map-posters.svg';

export function withMapVisual(map: ZombiesMap): ZombiesMap {
  return {
    ...map,
    imageUrl: `${MAP_POSTER_ATLAS}#${map.id}`,
    imageAlt: `Dossier visual de ${map.name}`,
    imagePosition: 'center',
  };
}
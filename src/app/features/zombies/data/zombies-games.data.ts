import { ZombiesGame } from '../models/zombies.models';

/**
 * Metadatos de los juegos. Datos públicos y verificables (título y año de
 * lanzamiento). Preparado para sustituirse por una llamada HTTP en el futuro.
 */
export const ZOMBIES_GAMES: ZombiesGame[] = [
  {
    id: 'bo1',
    slug: 'black-ops',
    title: 'Call of Duty: Black Ops',
    shortTitle: 'Black Ops',
    numeral: '',
    releaseYear: 2010,
    description:
      'Primera entrega de Black Ops. El modo Zombies continúa la historia Aether iniciada en World at War.',
    order: 1,
  },
  {
    id: 'bo2',
    slug: 'black-ops-2',
    title: 'Call of Duty: Black Ops II',
    shortTitle: 'Black Ops II',
    numeral: 'II',
    releaseYear: 2012,
    description:
      'Segunda entrega. Introduce las misiones principales con ramas narrativas de Richtofen y Maxis.',
    order: 2,
  },
  {
    id: 'bo3',
    slug: 'black-ops-3',
    title: 'Call of Duty: Black Ops III',
    shortTitle: 'Black Ops III',
    numeral: 'III',
    releaseYear: 2015,
    description:
      'Tercera entrega. Cierra el arco Aether original e incluye la colección remasterizada Zombies Chronicles.',
    order: 3,
  },
  {
    id: 'bo4',
    slug: 'black-ops-4',
    title: 'Call of Duty: Black Ops 4',
    shortTitle: 'Black Ops 4',
    numeral: 'IIII',
    releaseYear: 2018,
    description:
      'Cuarta entrega. Divide el modo Zombies en dos sagas paralelas: Aether y Chaos.',
    order: 4,
  },
];

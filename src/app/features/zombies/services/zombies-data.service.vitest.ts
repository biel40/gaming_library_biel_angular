import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';

import { SupabaseService } from '../../../services/supabase/supabase.service';
import { ZombiesDataService } from './zombies-data.service';

function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

const zombiRows = [
  {
    id: 'bo1-kino',
    slug: 'kino-der-toten',
    game_id: 'bo1',
    name: 'Kino der Toten',
    saga: 'aether',
    has_main_quest: false,
    description: 'Mapa sin misión principal.',
    minimum_players: 1,
    maximum_players: 4,
    solo_available: true,
    release_order: 1,
    content_status: 'pending',
    steps: [],
    side_easter_eggs: [],
    image_url: null,
    image_alt: null,
    image_position: null,
  },
  {
    id: 'bo1-ascension',
    slug: 'ascension',
    game_id: 'bo1',
    name: 'Ascension',
    saga: 'aether',
    has_main_quest: true,
    description: 'Guía verificada.',
    minimum_players: 1,
    maximum_players: 4,
    solo_available: true,
    release_order: 2,
    content_status: 'verified',
    steps: [
      {
        id: 'step-1',
        order: 1,
        title: 'Paso 1',
        description: 'Descripción',
        instructions: ['Haz algo'],
      },
    ],
    side_easter_eggs: [],
    image_url: null,
    image_alt: null,
    image_position: null,
  },
  {
    id: 'bo2-nuketown',
    slug: 'nuketown-zombies',
    game_id: 'bo2',
    name: 'Nuketown Zombies',
    saga: 'aether',
    has_main_quest: false,
    description: 'Mapa sin misión principal.',
    minimum_players: 1,
    maximum_players: 4,
    solo_available: true,
    release_order: 3,
    content_status: 'pending',
    steps: [],
    side_easter_eggs: [],
    image_url: null,
    image_alt: null,
    image_position: null,
  },
  {
    id: 'bo3-zc-kino-der-toten',
    slug: 'kino-der-toten-zc',
    game_id: 'bo3',
    name: 'Kino der Toten',
    saga: 'aether',
    has_main_quest: false,
    description: 'Mapa remasterizado.',
    minimum_players: 1,
    maximum_players: 4,
    solo_available: true,
    release_order: 4,
    remaster_of: 'bo1-kino',
    collection: 'zombies-chronicles',
    content_status: 'pending',
    steps: [],
    side_easter_eggs: [],
    image_url: 'https://cdn.example/zombies/zc-kino.webp',
    image_alt: 'Poster de Kino',
    image_position: 'top',
  },
  {
    id: 'bo4-classified',
    slug: 'classified',
    game_id: 'bo4',
    name: 'Classified',
    saga: 'aether',
    has_main_quest: false,
    description: 'Mapa sin misión principal.',
    minimum_players: 1,
    maximum_players: 4,
    solo_available: true,
    release_order: 5,
    content_status: 'pending',
    steps: [],
    side_easter_eggs: [],
    image_url: null,
    image_alt: null,
    image_position: null,
  },
];

const zombiGameRows = [
  {
    id: 'bo1',
    slug: 'black-ops',
    title: 'Call of Duty: Black Ops',
    short_title: 'Black Ops',
    numeral: '',
    release_year: 2010,
    description: 'Primera entrega.',
    order: 1,
  },
  {
    id: 'bo2',
    slug: 'black-ops-2',
    title: 'Call of Duty: Black Ops II',
    short_title: 'Black Ops II',
    numeral: 'II',
    release_year: 2012,
    description: 'Segunda entrega.',
    order: 2,
  },
  {
    id: 'bo3',
    slug: 'black-ops-3',
    title: 'Call of Duty: Black Ops III',
    short_title: 'Black Ops III',
    numeral: 'III',
    release_year: 2015,
    description: 'Tercera entrega.',
    order: 3,
  },
  {
    id: 'bo4',
    slug: 'black-ops-4',
    title: 'Call of Duty: Black Ops 4',
    short_title: 'Black Ops 4',
    numeral: 'IIII',
    release_year: 2018,
    description: 'Cuarta entrega.',
    order: 4,
  },
];

interface SetupOptions {
  rows?: any[];
  gameRows?: any[];
}

function setup(options: SetupOptions = {}) {
  const supabaseMock = {
    getZombiesGames: vi.fn(async () => options.gameRows ?? zombiGameRows),
    getZombiesMaps: vi.fn(async () => options.rows ?? zombiRows),
    updateZombiesMapImage: vi.fn(async () => {}),
  };

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      ZombiesDataService,
      { provide: SupabaseService, useValue: supabaseMock },
    ],
  });
  const service = TestBed.inject(ZombiesDataService);
  return { service, supabaseMock };
}

describe('ZombiesDataService', () => {
  let service: ZombiesDataService;

  beforeEach(async () => {
    ({ service } = setup());
    await flush();
  });

  it('expone los cuatro juegos ordenados', () => {
    const games = service.games();
    expect(games.map((g) => g.slug)).toEqual([
      'black-ops',
      'black-ops-2',
      'black-ops-3',
      'black-ops-4',
    ]);
  });

  it('resuelve un juego por slug', () => {
    expect(service.getGameBySlug('black-ops')?.id).toBe('bo1');
    expect(service.getGameBySlug('no-existe')).toBeUndefined();
  });

  it('no usa fallback local cuando Supabase no devuelve filas', async () => {
    const { service: emptyService } = setup({ rows: [], gameRows: [] });
    await flush();

    expect(emptyService.games()).toEqual([]);
    expect(emptyService.maps()).toEqual([]);
    expect(emptyService.getMapBySlug('black-ops', 'ascension')).toBeUndefined();
  });

  it('navega a una guía válida desde Supabase', async () => {
    await flush();

    const map = service.getMapBySlug('black-ops', 'ascension');
    expect(map?.id).toBe('bo1-ascension');
  });

  it('devuelve undefined ante una guía inválida', async () => {
    await flush();

    expect(service.getMapBySlug('black-ops', 'mapa-inexistente')).toBeUndefined();
    expect(service.getMapBySlug('juego-inexistente', 'ascension')).toBeUndefined();
  });

  it('incluye los mapas remasterizados de Zombies Chronicles en Black Ops III', async () => {
    await flush();

    const bo3Maps = service.getMapsForGame('bo3');
    const chronicles = bo3Maps.filter(
      (map) => map.collection === 'zombies-chronicles'
    );
    expect(chronicles.length).toBeGreaterThan(0);
    for (const map of chronicles) {
      expect(map.remasterOf).toBeTruthy();
    }
  });

  it('usa las visuales de Supabase tal cual, sin fallback local', async () => {
    await flush();

    const kino = service.getMapById('bo1-kino');
    expect(kino?.imageUrl).toBeUndefined();
    expect(kino?.imageAlt).toBeUndefined();
    expect(kino?.imagePosition).toBeUndefined();

    const chronicles = service.getMapById('bo3-zc-kino-der-toten');
    expect(chronicles?.imageUrl).toBe('https://cdn.example/zombies/zc-kino.webp');
    expect(chronicles?.imageAlt).toBe('Poster de Kino');
    expect(chronicles?.imagePosition).toBe('top');
  });

  it('representa correctamente los mapas sin misión principal', async () => {
    await flush();

    const noQuest = service
      .maps()
      .filter((map) => !map.hasMainQuest)
      .map((map) => map.slug);
    expect(noQuest).toContain('kino-der-toten');
    expect(noQuest).toContain('nuketown-zombies');
    expect(noQuest).toContain('kino-der-toten-zc');
    expect(noQuest).toContain('classified');
  });

  it('mantiene el contenido no verificado como pendiente y sin pasos', async () => {
    await flush();

    for (const map of service.maps()) {
      if (map.contentStatus === 'pending') {
        expect(map.steps).toEqual([]);
      }
    }
  });

  it('publica la guía verificada de Ascension con pasos', async () => {
    await flush();

    const ascension = service.getMapById('bo1-ascension');
    expect(ascension?.contentStatus).toBe('verified');
    expect(ascension?.steps.length).toBeGreaterThan(0);
  });
});

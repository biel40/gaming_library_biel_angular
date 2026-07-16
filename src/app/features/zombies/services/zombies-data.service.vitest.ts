import { describe, expect, it } from 'vitest';

import { ZombiesDataService } from './zombies-data.service';

describe('ZombiesDataService', () => {
  const service = new ZombiesDataService();

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

  it('navega a una guía válida', () => {
    const map = service.getMapBySlug('black-ops', 'ascension');
    expect(map?.id).toBe('bo1-ascension');
  });

  it('devuelve undefined ante una guía inválida', () => {
    expect(service.getMapBySlug('black-ops', 'mapa-inexistente')).toBeUndefined();
    expect(service.getMapBySlug('juego-inexistente', 'ascension')).toBeUndefined();
  });

  it('incluye los mapas remasterizados de Zombies Chronicles en Black Ops III', () => {
    const bo3Maps = service.getMapsForGame('bo3');
    const chronicles = bo3Maps.filter(
      (map) => map.collection === 'zombies-chronicles'
    );
    expect(chronicles.length).toBeGreaterThan(0);
    for (const map of chronicles) {
      expect(map.remasterOf).toBeTruthy();
    }
  });

  it('proporciona una representación visual local para todos los mapas', () => {
    for (const map of service.maps()) {
      expect(map.imageUrl, map.id).toMatch(/^\/assets\/images\/zombies\//);
      expect(map.imageAlt, map.id).toContain(map.name);
      expect(map.imagePosition, map.id).toBeTruthy();
    }
  });

  it('representa correctamente los mapas sin misión principal', () => {
    const noQuest = service
      .maps()
      .filter((map) => !map.hasMainQuest)
      .map((map) => map.slug);
    expect(noQuest).toContain('kino-der-toten');
    expect(noQuest).toContain('five');
    expect(noQuest).toContain('nuketown-zombies');
    expect(noQuest).toContain('the-giant');
    expect(noQuest).toContain('classified');
  });

  it('mantiene el contenido no verificado como pendiente y sin pasos', () => {
    for (const map of service.maps()) {
      if (map.contentStatus === 'pending') {
        expect(map.steps).toEqual([]);
      }
    }
  });

  it('marca la demo de Ascension como borrador con pasos', () => {
    const ascension = service.getMapById('bo1-ascension');
    expect(ascension?.contentStatus).toBe('draft');
    expect(ascension?.steps.length).toBeGreaterThan(0);
  });
});

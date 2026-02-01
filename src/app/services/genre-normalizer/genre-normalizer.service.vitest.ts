import { describe, expect, it } from 'vitest';

import { GenreNormalizerService } from './genre-normalizer.service';

describe('GenreNormalizerService', () => {
  it('normalizes known variants', () => {
    const service = new GenreNormalizerService();
    expect(service.normalizeGenre('action')).toBe('Acción');
    expect(service.normalizeGenre('Action-Adventure')).toBe('Acción');
    expect(service.normalizeGenre('aventura')).toBe('Aventura');
    expect(service.normalizeGenre('SURVIVAL HORROR')).toBe('Terror');
  });

  it('returns Sin categoria when empty', () => {
    const service = new GenreNormalizerService();
    expect(service.normalizeGenre(null)).toBe('Sin categoría');
    expect(service.normalizeGenre(undefined)).toBe('Sin categoría');
    expect(service.normalizeGenre('')).toBe('Sin categoría');
  });

  it('capitalizes unknown genres', () => {
    const service = new GenreNormalizerService();
    expect(service.normalizeGenre('tACTICAL')).toBe('Tactical');
    expect(service.normalizeGenre('  cozy  ')).toBe('Cozy');
  });

  it('deduplicates and sorts normalized genres', () => {
    const service = new GenreNormalizerService();
    const result = service.normalizeGenres(['Action', 'accion', 'RPG', 'rpg', null, undefined, '']);
    expect(result).toEqual(['Acción', 'RPG']);
  });

  it('adds All to unique genres list', () => {
    const service = new GenreNormalizerService();
    expect(service.getUniqueNormalizedGenres(['action'])).toEqual(['All', 'Acción']);
  });
});

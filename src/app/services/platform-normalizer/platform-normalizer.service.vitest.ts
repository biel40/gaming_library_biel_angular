import { describe, expect, it } from 'vitest';

import { PlatformNormalizerService } from './platform-normalizer.service';

describe('PlatformNormalizerService', () => {
  const service = new PlatformNormalizerService();

  it.each(['Nintendo Switch 2', 'Switch 2', 'Switch2', 'NS2'])(
    'normalizes %s as Nintendo Switch 2',
    platform => {
      expect(service.normalizePlatform(platform)).toBe('Nintendo Switch 2');
    }
  );

  it('groups Nintendo Switch 2 under Nintendo', () => {
    expect(service.getPlatformCompany('Nintendo Switch 2')).toBe('Nintendo');
  });

  it('normalizes comma-separated platforms without losing Nintendo Switch 2', () => {
    expect(service.normalizePlatform('Nintendo Switch, Nintendo Switch 2')).toBe(
      'Nintendo Switch / Nintendo Switch 2'
    );
  });

  it('returns each compound platform once and a single Todos option', () => {
    expect(service.getUniquePlatforms(['PC, PS5', 'Nintendo Switch, Nintendo Switch 2'])).toEqual([
      'Todos',
      'Nintendo Switch',
      'Nintendo Switch 2',
      'PC',
      'PlayStation 5'
    ]);
  });
});

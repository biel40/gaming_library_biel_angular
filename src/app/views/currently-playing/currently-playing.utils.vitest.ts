import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { Videogame } from '../../services/supabase/supabase.service';
import { adjustHours, sortCurrentlyPlayingGames } from './currently-playing.utils';

describe('currently playing utilities', () => {
  it('adjusts session hours in half-hour steps without going below zero', () => {
    expect(adjustHours(2, 0.5)).toBe(2.5);
    expect(adjustHours(2.5, 1)).toBe(3.5);
    expect(adjustHours(0, -0.5)).toBe(0);
  });

  it('sorts the complete queue without mutating the source', () => {
    const games: Videogame[] = [
      { id: '1', name: 'Zelda', hours_played: 12 },
      { id: '2', name: 'Alan Wake', hours_played: 4 },
      { id: '3', name: 'Control', hours_played: 8 }
    ];

    expect(sortCurrentlyPlayingGames(games, 'hours-asc').map(game => game.id)).toEqual(['2', '3', '1']);
    expect(sortCurrentlyPlayingGames(games, 'name').map(game => game.id)).toEqual(['2', '3', '1']);
    expect(games.map(game => game.id)).toEqual(['1', '2', '3']);
  });

  it('keeps filters and hours editing touch friendly on mobile', () => {
    const stylesheet = readFileSync(
      resolve('src/app/views/currently-playing/currently-playing.component.scss'),
      'utf8'
    );
    const mobileStyles = stylesheet.match(/@media \(max-width: 767px\) \{([\s\S]*?)\n\}/)?.[1] ?? '';

    expect(mobileStyles).toMatch(/\.select-control[\s\S]*?select[\s\S]*?height: 44px/);
    expect(mobileStyles).toMatch(/\.hours-actions[\s\S]*?button[\s\S]*?min-height: 44px/);
    expect(mobileStyles).toMatch(/\.game-actions[\s\S]*?grid-column: 1 \/ -1/);
    expect(mobileStyles).toMatch(/\.game-actions[\s\S]*?(?:a,|a,[\s\S]*?button)[\s\S]*?min-height: 44px/);
  });

  it('gives game rows more presence on large screens', () => {
    const stylesheet = readFileSync(
      resolve('src/app/views/currently-playing/currently-playing.component.scss'),
      'utf8'
    );
    const largeScreenStyles = stylesheet.match(
      /@media \(min-width: 1200px\) \{([\s\S]*?)\n\}/
    )?.[1] ?? '';

    expect(largeScreenStyles).toMatch(/\.game-row[\s\S]*?padding: 1rem/);
    expect(largeScreenStyles).toMatch(/\.game-cover[\s\S]*?width: 132px[\s\S]*?height: 178px/);
  });

  it('uses the full viewport width and scales the queue on wide monitors', () => {
    const stylesheet = readFileSync(
      resolve('src/app/views/currently-playing/currently-playing.component.scss'),
      'utf8'
    );

    expect(stylesheet).toMatch(
      /\.currently-playing-container\s*\{[\s\S]*?width: 100%[\s\S]*?max-width: none[\s\S]*?box-sizing: border-box/
    );
    expect(stylesheet).toMatch(
      /@media \(min-width: 1440px\)[\s\S]*?\.game-list[\s\S]*?grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/
    );
    expect(stylesheet).toMatch(
      /@media \(min-width: 2200px\)[\s\S]*?\.game-list[\s\S]*?grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/
    );
  });

  it('adds purposeful motion while respecting reduced-motion preferences', () => {
    const stylesheet = readFileSync(
      resolve('src/app/views/currently-playing/currently-playing.component.scss'),
      'utf8'
    );

    expect(stylesheet).toMatch(/@keyframes page-enter/);
    expect(stylesheet).toMatch(/@keyframes row-enter/);
    expect(stylesheet).toMatch(/\.game-row[\s\S]*?animation: row-enter/);
    expect(stylesheet).toMatch(/\.select-control[\s\S]*?:focus-within/);
    expect(stylesheet).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
  });
});
import { Videogame } from '../../services/supabase/supabase.service';

export type SortMode = 'hours-desc' | 'hours-asc' | 'name' | 'platform';

export function adjustHours(currentHours: number, increment: number): number {
  return Math.max(0, Math.round((currentHours + increment) * 10) / 10);
}

export function sortCurrentlyPlayingGames(
  games: readonly Videogame[],
  mode: SortMode,
  platformLabel: (game: Videogame) => string = game => game.platform || ''
): Videogame[] {
  const sorted = [...games];

  switch (mode) {
    case 'hours-asc':
      return sorted.sort((first, second) => (first.hours_played || 0) - (second.hours_played || 0));
    case 'name':
      return sorted.sort((first, second) => (first.name || '').localeCompare(second.name || '', 'es'));
    case 'platform':
      return sorted.sort((first, second) =>
        platformLabel(first).localeCompare(platformLabel(second), 'es') ||
        (second.hours_played || 0) - (first.hours_played || 0)
      );
    default:
      return sorted.sort((first, second) => (second.hours_played || 0) - (first.hours_played || 0));
  }
}
import { Injectable } from '@angular/core';

export interface GenreMapping {
    normalized: string;
    variants: string[];
}

@Injectable({
    providedIn: 'root'
})
export class GenreNormalizerService {

    // Lista de mapeos de géneros con sus variantes
    private readonly genreMappings: GenreMapping[] = [
        {
            normalized: 'Acción',
            variants: ['action', 'accion', 'acción', 'action-adventure', 'action adventure']
        },
        {
            normalized: 'Aventura',
            variants: ['adventure', 'aventura', 'point and click', 'point-and-click', 'puzzle adventure']
        },
        {
            normalized: 'RPG',
            variants: ['rpg', 'role-playing', 'role playing', 'juego de rol', 'juegos de rol', 'rol', 'rpgs', 'roleplay', 'role play']
        },
        {
            normalized: 'ARPG',
            variants: ['arpg', 'action rpg', 'action-rpg', 'action role-playing', 'action role playing']
        },
        {
            normalized: 'JRPG',
            variants: ['jrpg', 'japanese rpg', 'japanese role-playing', 'japanese role playing', 'juego de rol japonés', 'juegos de rol japoneses']
        },
        {
            normalized: 'Estrategia',
            variants: ['strategy', 'estrategia', 'strategic']
        },
        {
            normalized: 'Shooter',
            variants: ['shooter', 'fps', 'first-person shooter', 'disparos', 'shoot em up', 'shoot-em-up']
        },
        {
            normalized: 'Mundo Abierto',
            variants: ['mundo abierto', 'open world', 'open-world', 'sandbox', 'juego de mundo abierto', 'juegos de mundo abierto', 'open world game', 'open-world game']
        },
        {
            normalized: 'Casual',
            variants: ['casual']
        },
        {
            normalized: 'Deportes',
            variants: ['sports', 'deportes', 'sport']
        },
        {
            normalized: 'Carreras',
            variants: ['racing', 'carreras', 'race']
        },
        {
            normalized: 'Simulación',
            variants: ['simulation', 'simulacion', 'simulación', 'simulator']
        },
        {
            normalized: 'Terror',
            variants: ['horror', 'terror', 'survival horror']
        },
        {
            normalized: 'Plataformas',
            variants: ['platformer', 'platform', 'plataformas', 'plataformero']
        },
        {
            normalized: 'Puzzle',
            variants: ['puzzle', 'puzzles', 'rompecabezas']
        },
        {
            normalized: 'Lucha',
            variants: ['fighting', 'lucha', 'fighter', 'beat em up', 'beat-em-up']
        },
        {
            normalized: 'Indie',
            variants: ['indie', 'independent']
        },
        {
            normalized: 'Multijugador',
            variants: ['multiplayer', 'multijugador', 'mmo', 'mmorpg']
        },
        {
            normalized: 'Roguelike',
            variants: ['roguelike', 'roguelite', 'rogue-like', 'rogue-lite']
        },
        {
            normalized: 'Metroidvania',
            variants: ['metroidvania']
        },
        {
            normalized: 'Souls-like',
            variants: ['souls-like', 'soulslike', 'souls like', 'soulsborne']
        },
        {
            normalized: 'Survival',
            variants: ['survival', 'supervivencia']
        },
        {
            normalized: 'Visual Novel',
            variants: ['visual novel', 'novela visual']
        },
        {
            normalized: 'Música',
            variants: ['music', 'rhythm', 'musica', 'música', 'ritmo']
        },
        {
            normalized: 'Arcade',
            variants: ['arcade']
        }
    ];

    normalizeGenre(genre: string | undefined | null): string {
        if (!genre) {
            return 'Sin categoría';
        }

        const normalizedInput = genre.toLowerCase().trim();

        for (const mapping of this.genreMappings) {
            if (mapping.variants.some(variant => variant.toLowerCase() === normalizedInput)) {
                return mapping.normalized;
            }
        }

        return this.capitalizeFirst(genre.trim());
    }

    normalizeGenres(genres: (string | undefined | null)[]): string[] {
        const normalizedSet = new Set<string>();

        for (const genre of genres) {
            const normalized = this.normalizeGenre(genre);
            if (normalized && normalized !== 'Sin categoría') {
                normalizedSet.add(normalized);
            }
        }

        return Array.from(normalizedSet).sort((a, b) => a.localeCompare(b, 'es'));
    }

    getUniqueNormalizedGenres(genres: (string | undefined | null)[]): string[] {
        return ['All', ...this.normalizeGenres(genres)];
    }

    addCustomMapping(normalized: string, variants: string[]): void {
        const existingMapping = this.genreMappings.find(
            m => m.normalized.toLowerCase() === normalized.toLowerCase()
        );

        if (existingMapping) {
            const newVariants = variants.filter(
                v => !existingMapping.variants.includes(v.toLowerCase())
            );
            existingMapping.variants.push(...newVariants.map(v => v.toLowerCase()));
        } else {
            this.genreMappings.push({
                normalized,
                variants: variants.map(v => v.toLowerCase())
            });
        }
    }

    /**
     * Capitaliza la primera letra de un texto y pone en minúsculas el resto.
     * @param text 
     * @returns 
      */
    private capitalizeFirst(text: string): string {
        if (!text) return text;
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    }
}

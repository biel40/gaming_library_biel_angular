import { Injectable } from '@angular/core';

export interface PlatformMapping {
    normalized: string;
    variants: string[];
}

@Injectable({
    providedIn: 'root'
})
export class PlatformNormalizerService {

    private readonly platformMappings: PlatformMapping[] = [
        {
            normalized: 'Game Boy Advance',
            variants: ['game boy advance', 'gameboy advance', 'gba']
        },
        {
            normalized: 'Game Boy Color',
            variants: ['game boy color', 'gameboy color', 'gbc']
        },
        {
            normalized: 'Game Boy',
            variants: ['game boy', 'gameboy', 'gb']
        },
        {
            normalized: 'Nintendo DS',
            variants: ['nintendo ds', 'nds', 'ds']
        },
        {
            normalized: 'Nintendo 3DS',
            variants: ['nintendo 3ds', '3ds', 'new nintendo 3ds']
        },
        {
            normalized: 'Nintendo Switch',
            variants: ['nintendo switch', 'switch', 'ns']
        },
        {
            normalized: 'Nintendo 64',
            variants: ['nintendo 64', 'n64', 'nintendo64']
        },
        {
            normalized: 'GameCube',
            variants: ['gamecube', 'nintendo gamecube', 'gc']
        },
        {
            normalized: 'Wii',
            variants: ['wii', 'nintendo wii']
        },
        {
            normalized: 'Wii U',
            variants: ['wii u', 'nintendo wii u', 'wiiu']
        },
        {
            normalized: 'SNES',
            variants: ['snes', 'super nintendo', 'super nes', 'super nintendo entertainment system']
        },
        {
            normalized: 'NES',
            variants: ['nes', 'nintendo entertainment system', 'nintendo']
        },
        {
            normalized: 'PlayStation',
            variants: ['playstation', 'playstation 1', 'ps1', 'psx', 'ps one']
        },
        {
            normalized: 'PlayStation 2',
            variants: ['playstation 2', 'ps2', 'playstation2']
        },
        {
            normalized: 'PlayStation 3',
            variants: ['playstation 3', 'ps3', 'playstation3']
        },
        {
            normalized: 'PlayStation 4',
            variants: ['playstation 4', 'ps4', 'playstation4']
        },
        {
            normalized: 'PlayStation 5',
            variants: ['playstation 5', 'ps5', 'playstation5']
        },
        {
            normalized: 'PlayStation Portable',
            variants: ['psp', 'playstation portable', 'playstation portable (psp)']
        },
        {
            normalized: 'PlayStation Vita',
            variants: ['ps vita', 'playstation vita', 'vita', 'psvita']
        },
        {
            normalized: 'Xbox',
            variants: ['xbox', 'microsoft xbox']
        },
        {
            normalized: 'Xbox 360',
            variants: ['xbox 360', 'x360', 'xbox360']
        },
        {
            normalized: 'Xbox One',
            variants: ['xbox one', 'xbone', 'xboxone']
        },
        {
            normalized: 'Xbox Series X/S',
            variants: ['xbox series x', 'xbox series s', 'xbox series x/s', 'xbox series', 'series x', 'series s']
        },
        {
            normalized: 'PC',
            variants: ['pc', 'windows', 'steam', 'personal computer']
        },
        {
            normalized: 'Mac',
            variants: ['mac', 'macos', 'mac os', 'apple mac']
        },
        {
            normalized: 'Android',
            variants: ['android']
        },
        {
            normalized: 'iOS',
            variants: ['ios', 'iphone', 'ipad', 'apple ios']
        },
        {
            normalized: 'Sega Genesis',
            variants: ['sega genesis', 'mega drive', 'sega mega drive', 'genesis']
        },
        {
            normalized: 'Sega Saturn',
            variants: ['sega saturn', 'saturn']
        },
        {
            normalized: 'Dreamcast',
            variants: ['dreamcast', 'sega dreamcast']
        }
    ];

    normalizePlatform(platform: string | undefined | null): string {
        if (!platform) {
            return 'Desconocida';
        }

        // Handle compound platforms like "PlayStation 3 / Xbox 360 / PC"
        if (platform.includes('/')) {
            const parts = platform.split('/').map(p => this.normalizeSinglePlatform(p.trim()));
            return [...new Set(parts)].join(' / ');
        }

        return this.normalizeSinglePlatform(platform);
    }

    private normalizeSinglePlatform(platform: string): string {
        const normalizedInput = platform.toLowerCase().trim();

        for (const mapping of this.platformMappings) {
            if (mapping.variants.some(v => v.toLowerCase() === normalizedInput)) {
                return mapping.normalized;
            }
        }

        return this.capitalizeFirst(platform.trim());
    }

    private readonly companyMap: Record<string, string> = {
        'Game Boy': 'Nintendo',
        'Game Boy Color': 'Nintendo',
        'Game Boy Advance': 'Nintendo',
        'Nintendo DS': 'Nintendo',
        'Nintendo 3DS': 'Nintendo',
        'Nintendo Switch': 'Nintendo',
        'Nintendo 64': 'Nintendo',
        'GameCube': 'Nintendo',
        'Wii': 'Nintendo',
        'Wii U': 'Nintendo',
        'SNES': 'Nintendo',
        'NES': 'Nintendo',
        'PlayStation': 'Sony',
        'PlayStation 2': 'Sony',
        'PlayStation 3': 'Sony',
        'PlayStation 4': 'Sony',
        'PlayStation 5': 'Sony',
        'PlayStation Portable': 'Sony',
        'PlayStation Vita': 'Sony',
        'Xbox': 'Microsoft',
        'Xbox 360': 'Microsoft',
        'Xbox One': 'Microsoft',
        'Xbox Series X/S': 'Microsoft',
        'PC': 'PC',
        'Mac': 'PC',
        'Android': 'Mobile',
        'iOS': 'Mobile',
        'Sega Genesis': 'Sega',
        'Sega Saturn': 'Sega',
        'Dreamcast': 'Sega',
    };

    getPlatformCompany(normalizedPlatform: string): string {
        return this.companyMap[normalizedPlatform] ?? 'Otras';
    }

    normalizedPlatformMatchesCompany(normalizedPlatform: string, company: string): boolean {
        if (normalizedPlatform.includes(' / ')) {
            return normalizedPlatform.split(' / ').some(part => this.getPlatformCompany(part.trim()) === company);
        }
        return this.getPlatformCompany(normalizedPlatform) === company;
    }

    gameMatchesCompany(platform: string | undefined | null, company: string): boolean {
        if (!platform) return false;
        const normalized = this.normalizePlatform(platform);
        return this.normalizedPlatformMatchesCompany(normalized, company);
    }

    getUniqueCompanies(platforms: (string | undefined | null)[]): string[] {
        const companies = new Set<string>();
        for (const platform of platforms) {
            if (!platform) continue;
            const normalized = this.normalizePlatform(platform);
            if (normalized.includes(' / ')) {
                normalized.split(' / ').forEach(p => companies.add(this.getPlatformCompany(p.trim())));
            } else {
                companies.add(this.getPlatformCompany(normalized));
            }
        }
        return ['All', ...Array.from(companies).sort((a, b) => a.localeCompare(b, 'es'))];
    }

    private capitalizeFirst(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    getUniquePlatforms(platforms: (string | undefined | null)[]): string[] {
        const normalizedSet = new Set<string>();

        for (const platform of platforms) {
            if (!platform) continue;
            const normalized = this.normalizePlatform(platform);
            if (normalized && normalized !== 'Desconocida') {
                normalizedSet.add(normalized);
            }
        }

        return ['All', ...Array.from(normalizedSet).sort((a, b) => a.localeCompare(b, 'es'))];
    }
}

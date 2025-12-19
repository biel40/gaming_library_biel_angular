# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run start       # Run config + dev server (http://localhost:4200)
npm run build:prod  # Production build
npm test            # Run unit tests with Karma
```

The `npm run config` step (included in start/build) generates environment files from `.env` variables.

## Environment Setup

Create a `.env` file with these `VITE_` prefixed variables:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_KEY=your_supabase_anon_key
VITE_RAWG_API_KEY=your_rawg_api_key
```

## Architecture Overview

**Angular 19 standalone app with signal-based state management and Supabase backend.**

### Key Patterns

- **Zoneless Angular**: Uses `provideExperimentalZonelessChangeDetection()` - no Zone.js
- **Signals everywhere**: State via `signal()`, derived state via `computed()`, updates via `.set()`/`.update()`
- **Inject function**: Services use `inject()` not constructor DI
- **Standalone components**: All components declare their own imports

### Service Layer

- **SupabaseService** (`src/app/services/supabase/`): Central data layer with signals for games, favorites, session. Handles all Supabase queries and auth
- **NotificationService**: RxJS Subject for cross-component toast notifications
- **GameSearchService**: RAWG API integration for game search

### Component Organization

- `src/app/components/` - Reusable components (game-card, notification, game-search)
- `src/app/views/` - Page components (dashboard, game-detail, profile, add-game, platinum-trophies, currently-playing)
- `src/app/guards/auth.guard.ts` - Functional auth guard using SupabaseService

### Routes

All routes except `/login` and `/reset-password` are protected by `authGuard`.

### Database Schema

Supabase tables with Row Level Security:
- **videogames**: id, name, description, image_url, genre, platform, score, review, platinum, platinum_date, platinum_target, currently_playing, hours_played
- **profiles**: User profile data

### Special Users

- Read-only test user: `test@testuser.com` - check via `SupabaseService.isReadOnlyUser()`

## SCSS Architecture

Modular SCSS with partials:
```scss
@use './styles/variables' as vars;
@use './styles/mixins' as mix;
```

Mobile-first with touch optimizations (`-webkit-overflow-scrolling: touch`, `touch-action: manipulation`).

## Code Style

- Prefer signals over observables for component state
- Avoid comments - code should be self-explanatory
- Use immutable updates for signal state: `this.games.set([...newGames])`

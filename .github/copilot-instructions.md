# Gaming Library - AI Coding Agent Instructions

## Project Architecture

This is a **standalone Angular 19** gaming library application using **signals**, **Supabase**, and a **modular SCSS architecture**.

### Signal-Based State Management
- All components use Angular signals (`signal()`, `computed()`) instead of traditional observables
- State updates via `.set()` and `.update()` methods
- Computed properties for derived state: `readonly userDisplayName = computed(() => { ... })`
- No Zone.js dependency - uses `provideExperimentalZonelessChangeDetection()`
- **Lifecycle Hooks**: Never use `async ngOnInit()`. If async initialization is needed, call a `private async` method from a synchronous `ngOnInit()`.
- **Modern Control Flow**: Use `@if`, `@for`, and `@switch` syntax instead of `*ngIf` or `*ngFor`.
- **Signal Inputs/Outputs**: Prefer `input()`, `output()`, and `model()` over `@Input()` and `@Output()`.
- Try to avoid comments - code should be self-explanatory where possible.
- **Template Binding**: When passing signals as @Input bindings, invoke the signal with `()` to pass the value: `[selectMode]="selectMode()"`. Never pass the signal reference unless the child component explicitly expects a signal.
- **Input Types**: Use primitive types (`boolean`, `string`, `number`) for `@Input()` properties, not signals. For reactive inputs, use Angular's signal input API: `selectMode = input(false);`

### Standalone Components Pattern
Every component is standalone with explicit imports:
```typescript
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CustomComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
```

**CRITICAL: All imports must be properly declared**
- Every component, service, and type used must have a corresponding `import` statement at the top of the file
- Components used in templates MUST be listed in the `imports` array of `@Component`
- Missing imports cause compilation errors like "'X' is not a known element" or "Value could not be determined statically"

### Common Import Patterns
```typescript
// Services and types
import { SupabaseService, Videogame } from '../../services/supabase/supabase.service';
import { UserService } from '../../services/user/user.service';
import { User } from '@supabase/supabase-js';

// Components used in templates
import { GameCardComponent } from '../../components/game-card/game-card.component';
import { UserAvatarComponent } from '../../components/user-avatar/user-avatar.component';
```

### Service Architecture
- **SupabaseService**: Central data layer with signals for games, favorites, session
- **NotificationService**: RxJS Subject-based for cross-component messaging  
- **UserService**: User state management
- Services injected via `inject()` function, not constructor DI

### Type Safety & Clean Code
- **Strict Typing**: Avoid `any`. Define interfaces or types for all data structures.
- **Immutability**: Treat signal values as immutable. Use spread operators for updates.
- **Error Handling**: Use try/catch in async operations and update error signals.

## Development Workflows

### Environment Setup
- Run `npm run config` before any dev command - generates environment files from `.env`
- Development: `npm start` (includes config step)
- Build: `npm run build:prod`
- Environment variables use `VITE_` prefix (Vite bundler)

### Key File Locations
- Components: `src/app/components/` (reusable) and `src/app/views/` (page-level)
- Services: `src/app/services/[service-name]/`
- Models: `src/app/models/`
- Auth guard: `src/app/guards/auth.guard.ts`

## SCSS Architecture

**Modular approach** - each dashboard style split into focused partials:

```scss
// In dashboard.component.scss
@use './styles/variables' as vars;
@use './styles/mixins' as mix;
@use './styles/layout';
@use './styles/buttons';
@use './styles/mobile-scroll';
```

### Key SCSS Patterns
- **Variables**: Colors, shadows, border-radius in `_variables.scss`
- **Mixins**: Flex layouts, gradients, button styles in `_mixins.scss`
- **Mobile-first**: Extensive mobile optimizations with `-webkit-overflow-scrolling: touch`
- **Performance**: `will-change`, `transform: translateZ(0)`, `backface-visibility: hidden`
- **SCSS Imports**: When using `@use` for shared SCSS files, verify relative paths carefully. From `src/app/components/**/`, the path to `src/app/views/dashboard/styles/` is `../../views/dashboard/styles/` (2 levels up), not 3.
- **Background Consistency**: Use `linear-gradient(135deg, vars.$bg-primary 0%, vars.$bg-secondary 100%)` for components that need to match the main app background. This gradient (#1a1a2e to #16213e) ensures visual consistency across all UI elements like dropdowns, menus, and modals.

## Database Schema (Supabase)

### Core Tables
- **videogames**: id, name, description, image_url, genre, platform, favorite, score, user_id
- **profiles**: User profile information
- Row Level Security enabled - users only see their own data

### Authentication
- **Read-only user**: `test@testuser.com` - check via `isReadOnlyUser()` method
- Protected routes via `authGuard` functional guard
- Session management through SupabaseService signals

## Component Patterns

### Game Card Component
- Holographic card effects inspired by Pokémon TCG
- Favorite toggle, platinum target functionality
- Conditional rendering based on read-only state

### Dashboard Component  
- Grid/list view toggle
- Multi-select functionality for bulk operations
- Animated filter chips with horizontal scroll
- Carousel for featured games

### Mobile Optimizations
- Extensive touch optimizations: `touch-action: manipulation`
- Smooth scrolling: `-webkit-overflow-scrolling: touch` 
- Performance: Hardware acceleration via CSS transforms
- Responsive breakpoints: 767px, 480px


### State Updates
```typescript
// Signal updates - always immutable
this.games.set([...newGames]);
this.selectedIds.update(ids => [...ids, newId]);

// Computed properties auto-update
readonly filteredGames = computed(() => 
  this.games().filter(game => game.genre === this.activeGenre())
);
```

### Error Handling
- Service-level error signals: `error = signal<string | null>(null)`
- User-facing notifications via NotificationService
- Loading states with signals: `isLoading = signal(true)`

## Integration Points

### RAWG API Integration
- Game search functionality in `GameSearchComponent`
- API key stored in environment configuration

### Supabase Integration
- Real-time subscriptions for data changes
- File uploads for game images
- Authentication flows with session management

## Testing Considerations
- Standalone components require explicit imports in test setup
- Signal-based components need different testing patterns
- Auth guard testing requires mocked SupabaseService

## Performance Patterns
- Lazy loading via Angular router (potential future enhancement)
- Image optimization with WebP format support
- CSS containment properties for scroll performance
- Animation optimizations with `prefers-reduced-motion` support
## Critical User Experience Requirements

### Scrolling Behavior (CRITICAL)
- **NEVER use `contain: layout`** on main scrolling containers (e.g., `.dashboard`, `.game-grid`). It creates a new stacking context that breaks vertical scrolling.
- **NEVER use `overflow: hidden`** on the body or main content wrappers unless specifically managing a modal.
- **Use `touch-action: pan-y pan-x`** for better touch response on mobile.
- **Avoid `overscroll-behavior: contain`** on the main vertical axis; prefer `auto` to maintain natural bounce effects.
- Ensure `.main` container has `min-height: 100vh` and `overflow-y: auto`.

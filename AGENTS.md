# AGENTS.md - Gaming Library Angular Project

This file contains build commands, testing procedures, and code style guidelines for agentic coding agents working in this Angular gaming library project.

## Build & Development Commands

### Core Commands
- `npm run start` - Start development server (runs config then ng serve)
- `npm run build` - Build for development (runs config then ng build)
- `npm run build:prod` - Build for production (runs config then ng build --configuration production)
- `npm run watch` - Build in watch mode for development
- `npm run test` - Run all unit tests with Karma
- `npm run config` - Run environment configuration (ts-node set-env.ts)

### Testing Commands
- `npm run test` - Run all tests
- `ng test` - Run tests in watch mode
- `ng test --watch=false` - Run tests once and exit
- `ng test --code-coverage` - Run tests with coverage report
- `ng test --browsers=ChromeHeadless` - Run tests in headless mode

**To run a single test file:**
```bash
ng test --include="**/reset-password.component.spec.ts"
```

## Project Architecture

### Angular Configuration
- **Angular Version**: 19.2.0
- **Standalone Components**: Yes (all components use standalone: true)
- **Styling**: SCSS
- **State Management**: Angular Signals (signal, computed)
- **Database**: Supabase
- **Testing**: Jasmine + Karma

### Directory Structure
```
src/
├── app/
│   ├── components/          # Reusable UI components
│   ├── services/          # Business logic and data services
│   ├── views/             # Page-level components
│   ├── guards/            # Route guards
│   ├── pipes/             # Custom pipes
│   └── environments/      # Environment configs
├── styles.scss            # Global styles
└── main.ts               # Application entry point
```

## Code Style Guidelines

### TypeScript & Angular

#### Imports
- Group imports: Angular modules first, then third-party, then local imports
- Use standalone components with explicit imports array
- Import services using `inject()` function in properties

```typescript
// ✅ Correct import order
import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { Videogame, SupabaseService } from '../../services/supabase/supabase.service';
import { NotificationService } from '../../services/notification/notification.service';
```

#### Component Structure
- Use standalone components with `standalone: true`
- Declare all imports in the component decorator
- Use `inject()` for dependency injection in property declarations
- Use signals for reactive state management

```typescript
@Component({
  selector: 'app-game-card',
  templateUrl: './game-card.component.html',
  styleUrls: ['./game-card.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class GameCardComponent implements OnInit {
  private _supabaseService: SupabaseService = inject(SupabaseService);
  private _notificationService: NotificationService = inject(NotificationService);
  
  private _game = signal<Videogame | null>(null);
  
  @Input() set game(value: Videogame) {
    this._game.set(value);
  }
  
  readonly gameName = computed(() => this._game()?.name);
}
```

#### Signals & Reactive Programming
- Use `signal()` for private reactive state
- Use `computed()` for derived values
- Use `readonly` for public computed properties
- Prefer signals over traditional properties for reactive state

```typescript
// ✅ Signal-based reactive pattern
private _game = signal<Videogame | null>(null);
readonly gameName = computed(() => this._game()?.name);
readonly isFavorite = computed(() => this._game()?.favorite || false);
```

#### Naming Conventions
- **Components**: PascalCase with 'Component' suffix (e.g., `GameCardComponent`)
- **Services**: PascalCase with 'Service' suffix (e.g., `SupabaseService`)
- **Properties**: camelCase with underscore prefix for private signals (`_game`)
- **Methods**: camelCase with descriptive verbs (`toggleFavorite`, `checkReadOnlyUser`)
- **Interfaces**: PascalCase describing the data shape (`Videogame`, `Profile`)

#### Error Handling
- Use try-catch blocks for async operations
- Log errors with `console.error()`
- Use notification service for user-facing errors
- Handle specific error codes from Supabase (e.g., `PGRST116` for no rows returned)

```typescript
try {
  const result = await this._supabaseService.someOperation();
  return result;
} catch (error) {
  console.error('Error performing operation:', error);
  this._notificationService.error('Error al realizar la operación');
  throw error;
}
```

### SCSS & Styling

#### CSS Architecture
- Use SCSS with component-specific styles
- Follow BEM-like naming for component styles
- Use CSS custom properties for theming
- Mobile-first responsive design

#### Global Styles (styles.scss)
- CSS reset with box-sizing: border-box
- Material Icons import
- Smooth scroll behavior
- Gradient background: `linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)`
- Reduced motion support for accessibility

#### Component Styles
- Use relative units (rem, em, %)
- Flexbox for layouts
- CSS Grid for complex layouts
- Material Design inspired shadows and spacing

### Testing Guidelines

#### Test Structure
- Use Jasmine `describe()` and `it()` blocks
- Test component creation with `expect(component).toBeTruthy()`
- Test async operations with `async/await`
- Mock services using TestBed configuration

```typescript
describe('GameCardComponent', () => {
  let component: GameCardComponent;
  let fixture: ComponentFixture<GameCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(GameCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

## Database Integration

### Supabase Service Patterns
- Use the SupabaseService for all database operations
- Map database responses to TypeScript interfaces
- Handle null/undefined data gracefully
- Use localStorage for client-side data (favorites)

### Data Models
- Define interfaces for all data shapes (`Videogame`, `Profile`)
- Use optional properties with `?` for nullable fields
- Convert database timestamps to Date objects
- Always validate data before using in templates

## Environment Configuration

### Environment Setup
- Use `npm run config` to set environment variables
- Store Supabase credentials in environment files
- Never commit sensitive data to repository
- Use different configs for development/production

## Performance Guidelines

### Optimization
- Use computed signals for expensive calculations
- Implement lazy loading for large datasets
- Use trackBy in ngFor for better performance
- Optimize images with appropriate sizing
- Use Angular's built-in change detection strategies

### Bundle Size
- Monitor bundle size with Angular budgets
- Use code splitting for large features
- Import only needed modules from libraries
- Optimize SCSS with efficient selectors

## Accessibility

### ARIA Support
- Use semantic HTML elements
- Add appropriate ARIA labels
- Ensure keyboard navigation
- Test with screen readers
- Support reduced motion preferences

## Security

### Best Practices
- Never expose Supabase keys in client code
- Use Row Level Security (RLS) in Supabase
- Validate all user inputs
- Implement proper authentication guards
- Use HTTPS in production

## Development Workflow

### Before Committing
1. Run `npm run test` to ensure all tests pass
2. Run `npm run build` to verify production build
3. Check for TypeScript errors
4. Test responsive design on mobile devices
5. Verify accessibility features

### Code Review Checklist
- [ ] Components use standalone pattern
- [ ] Signals used for reactive state
- [ ] Proper error handling implemented
- [ ] Tests cover critical functionality
- [ ] SCSS follows naming conventions
- [ ] No console.log statements left in production code
- [ ] Environment variables properly configured
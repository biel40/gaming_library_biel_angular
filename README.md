# My Gaming Library - by Biel40

![Angular Version](https://img.shields.io/badge/Angular-19.2.1-DD0031?style=for-the-badge&logo=angular)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

A modern, visually stunning video game library application built with Angular. This project showcases a collection of games with beautiful UI effects inspired by Pokémon TCG Pocket holographic cards, responsive design, and smooth animations.

## Features

- **Holographic Card Effects**: Stunning visual effects on game cards inspired by Pokémon TCG Pocket
- **Responsive Design**: Optimized for all devices, with special attention to mobile experiences (iPhone 14 Pro Max)
- **Dynamic Game Filtering**: Filter games by genre with elegant chip-based filters
- **Search Functionality**: Quickly find games with real-time search
- **Featured Games Carousel**: Horizontal scrolling carousel for featured games
- **Grid & List Views**: Toggle between different view modes for your game collection
- **Detailed Game Information**: Comprehensive game details with descriptions, ratings, and more
- **Beautiful UI Elements**: Enhanced section titles with gradient effects and improved navigation arrows


## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Angular CLI (`npm install -g @angular/cli`)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/gaming_library_biel_angular.git
   cd gaming_library_biel_angular
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Configure Supabase
   - Create a `.env` file in the root directory
   - Add your Supabase credentials
     ```bash
     SUPABASE_URL=your_supabase_url
     SUPABASE_KEY=your_supabase_anon_key
     ```

4. Start the development server
   ```bash
   ng serve
   ```

5. Open your browser and navigate to `http://localhost:4200`

## Architecture

### Technology Stack

- **Framework**: Angular 19.2.1 (Standalone Components)
- **State Management**: Angular Signals (Zoneless)
- **Database & Auth**: Supabase (PostgreSQL)
- **Styling**: Modular SCSS with custom variables and mixins
- **API Integration**: RAWG API for game search
- **Bundler**: Vite
- 
## Key Patterns

### Signal-Based State Management
This project uses **Angular Signals** for efficient and reactive state management. By using `provideExperimentalZonelessChangeDetection()`, the application does not rely on Zone.js, which improves performance and simplifies data flow.

### Standalone Components
All components are built as **standalone components**, removing the need for NgModules and enabling a more modular and maintainable architecture.

### Supabase Integration
Supabase is used as a Backend-as-a-Service (BaaS) for:

- **Authentication**: User session management
- **Database**: Storage of the game library with Row Level Security (RLS)
- **Storage**: Hosting game images

### Modular SCSS
The styling architecture follows a modular approach using `@use` and `@forward`, with dedicated partials for variables, mixins, and component-specific styles, ensuring a consistent and maintainable design.

### Code Style & Best Practices

This project follows modern Angular conventions:

- **Dependency Injection**: Use of the `inject()` function instead of constructor-based DI
- **Lifecycle Management**: Synchronous `ngOnInit` with calls to private asynchronous methods
- **Immutability**: Signal updates using immutable patterns such as the spread operator
- **Strict Typing**: Strong TypeScript usage to avoid `any`

### Code Style & Best Practices

This project follows modern Angular conventions:

- **Dependency Injection**: Use of the `inject()` function instead of constructor-based DI
- **Lifecycle Management**: Synchronous `ngOnInit` with calls to private asynchronous methods
- **Immutability**: Signal updates using immutable patterns such as the spread operator
- **Strict Typing**: Strong TypeScript usage to avoid `any`

## UI Design & Style Guide

### Color Palette

- **Primary Blue**: `#3498db` to `#2980b9` (gradient)

### Typography

- Primary font: Roboto (or your chosen font)
- Header styles with gradient effects for enhanced visibility

## Testing

```bash
# Run unit tests
ng test

# Run end-to-end tests
ng e2e
```

## Building for Production

```bash
ng build --prod
```

This will generate optimized production files in the `dist/` directory.

## License

This project is licensed under the MIT License.

---

Created with 💙 by Gabriel Borras Serra


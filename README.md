# 🎮 My Gaming Library - by Biel40

![Angular Version](https://img.shields.io/badge/Angular-19.2.1-DD0031?style=for-the-badge&logo=angular)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

A modern, visually stunning video game library application built with Angular. This project showcases a collection of games with beautiful UI effects inspired by Pokémon TCG Pocket holographic cards, responsive design, and smooth animations.

## ✨ Features

- **Holographic Card Effects**: Stunning visual effects on game cards inspired by Pokémon TCG Pocket
- **Responsive Design**: Optimized for all devices, with special attention to mobile experiences (iPhone 14 Pro Max)
- **Dynamic Game Filtering**: Filter games by genre with elegant chip-based filters
- **Search Functionality**: Quickly find games with real-time search
- **Featured Games Carousel**: Horizontal scrolling carousel for featured games
- **Grid & List Views**: Toggle between different view modes for your game collection
- **Detailed Game Information**: Comprehensive game details with descriptions, ratings, and more
- **Beautiful UI Elements**: Enhanced section titles with gradient effects and improved navigation arrows


## 🚀 Getting Started

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

## 🏗️ Architecture

### Technology Stack

- **Framework**: Angular 19.2.1 (Standalone Components)
- **State Management**: Angular Signals (Zoneless)
- **Database & Auth**: Supabase (PostgreSQL)
- **Styling**: Modular SCSS with custom variables and mixins
- **API Integration**: RAWG API for game search
- **Bundler**: Vite

### Project Structure

```
src/
├── app/
│   ├── components/     # Reusable UI components (GameCard, Search, etc.)
│   ├── views/          # Page-level components (Dashboard, Profile, etc.)
│   ├── services/       # Business logic and data fetching
│   ├── guards/         # Route protection (AuthGuard)
│   ├── models/         # TypeScript interfaces and types
│   └── environments/   # Environment-specific configurations
├── assets/             # Static assets (images, icons)
└── styles.scss         # Global styles and SCSS architecture
```

## 🛠️ Key Architectural Patterns

### Signal-Based State Management
El proyecto utiliza **Angular Signals** para una gestión de estado reactiva y eficiente. Al usar `provideExperimentalZonelessChangeDetection()`, la aplicación no depende de Zone.js, lo que mejora el rendimiento y simplifica el flujo de datos.

### Standalone Components
Todos los componentes son **standalone**, eliminando la necesidad de NgModules y permitiendo una arquitectura más modular y fácil de mantener.

### Supabase Integration
Se utiliza Supabase como Backend-as-a-Service (BaaS) para:
- **Autenticación**: Gestión de sesiones de usuario.
- **Base de Datos**: Almacenamiento de la biblioteca de juegos con Row Level Security (RLS).
- **Storage**: Almacenamiento de imágenes de juegos.

### Modular SCSS
La arquitectura de estilos sigue un enfoque modular utilizando `@use` y `@forward`, con parciales dedicados para variables, mixins y estilos específicos de componentes, asegurando un diseño coherente y mantenible.

### Code Style & Best Practices

Este proyecto sigue las convenciones modernas de Angular:
- **Inyección de dependencias**: Uso de la función `inject()` en lugar de DI por constructor.
- **Ciclo de vida**: `ngOnInit` síncrono con llamadas a métodos asíncronos privados.
- **Inmutabilidad**: Actualización de señales mediante patrones inmutables (spread operator).
- **Tipado Estricto**: Uso riguroso de TypeScript para evitar `any`.

## 🎨 UI Design & Style Guide

### Color Palette

- **Primary Blue**: `#3498db` to `#2980b9` (gradient)
- **Background**: Clean white with subtle gradients
- **Accent Colors**: Used for genre chips and interactive elements

### Typography

- Primary font: Roboto (or your chosen font)
- Header styles with gradient effects for enhanced visibility

Games are stored in Supabase and include the following information:
- Name
- Description
- Genre (for filtering)
- Cover image URL
- Rating
- Release date
- Additional metadata

### Code Style

This project follows Angular best practices and coding conventions:
- Feature-based module organization
- Smart/dumb component pattern
- Reactive programming with RxJS
- Comprehensive component documentation

## 🧪 Testing

```bash
# Run unit tests
ng test

# Run end-to-end tests
ng e2e
```

## 📦 Building for Production

```bash
ng build --prod
```

This will generate optimized production files in the `dist/` directory.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👏 Acknowledgements

- Pokémon TCG Pocket for UI inspiration
- Angular team for the amazing framework
- Supabase for the powerful backend services

---

Created with 💙 by Gabriel Borras Serra


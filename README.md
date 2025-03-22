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

## 🖼️ Screenshots

<table>
  <tr>
    <td><img src="path/to/screenshot1.png" alt="Featured Games Carousel" width="400"/></td>
    <td><img src="path/to/screenshot2.png" alt="Game Details View" width="400"/></td>
  </tr>
  <tr>
    <td><img src="path/to/screenshot3.png" alt="Game Library Grid View" width="400"/></td>
    <td><img src="path/to/screenshot4.png" alt="Mobile View" width="400"/></td>
  </tr>
</table>

> Note: Replace `path/to/screenshot*.png` with actual screenshot paths once available

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

- **Framework**: Angular 19.2.1
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: SCSS with custom variables
- **Animations**: Angular animations
- **State Management**: Angular services and RxJS

### Project Structure

```
src/
├── app/
│   ├── components/     # Reusable UI components
│   │   └── game-card/  # Holographic game card component
│   ├── services/       # Application services
│   │   ├── loader/     # Loading state management
│   │   └── supabase/   # Supabase integration
│   ├── views/          # Application views/pages
│   │   ├── dashboard/  # Main library view
│   │   └── game-detail/# Detailed game view
│   └── models/         # Data models and interfaces
├── assets/             # Static assets
│   ├── fonts/
│   └── images/
└── environments/       # Environment configurations
```

## 🎨 UI Design & Style Guide

### Color Palette

- **Primary Blue**: `#3498db` to `#2980b9` (gradient)
- **Background**: Clean white with subtle gradients
- **Accent Colors**: Used for genre chips and interactive elements

### Typography

- Primary font: Roboto (or your chosen font)
- Header styles with gradient effects for enhanced visibility

### Components

- **Cards**: Holographic effects with smooth transitions
- **Filters**: Chip-based design with active state indicators
- **Carousel**: Smooth scrolling with intuitive navigation arrows

## 📋 Development Guidelines

### Adding a New Game

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

## 🔄 Continuous Integration

The project is configured with GitHub Actions for CI/CD. Any push to the main branch triggers:
- Lint checks
- Unit tests
- Build verification

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👏 Acknowledgements

- Pokémon TCG Pocket for UI inspiration
- Angular team for the amazing framework
- Supabase for the powerful backend services

---

Created with 💙 by Gabriel Borras Serra

> This README is a living document and will be updated as the project evolves.

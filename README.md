# H.AI (History AI)

**H.AI** is an interactive historical map application that invites users to explore the flow of history through an immersive time-travel experience.

![H.AI Preview](/public/assets/images/taegeuk_contemporary.png)

## ✨ Key Features

### 1. Anthropic-style Landing Page
A premium, editorial-style landing page introduces the product with elegant scroll animations and a warm, minimalist design.
- **Hero Section:** "H.AI" title with smooth fade-up effects.
- **Feature Showcase:** Scroll-based storytelling highlighting "Time Travel" and "Dynamic Themes".
- **Seamless Integration:** The experience naturally flows into the interactive Greeting Page.

### 2. Dynamic Theming (Time Travel)
The entire application interface adapts in real-time to the historical era being viewed.
- **Ancient (고대):** Stone textures, serif fonts, dark ambient tones.
- **Medieval (중세):** Parchment textures, calligraphy fonts, warm earth tones.
- **Modern (근대):** Newspaper textures, Minjo fonts, stark black & white with red accents.
- **Contemporary (현대):** Clean glassmorphism, sans-serif fonts, vibrant blue & red accents.

### 3. Interactive History Map
- **Timeline Control:** Drag the slider to travel through time.
- **Live Updates:** Borders, markers, and UI styles update instantly as you scroll through years.

## 🛠️ Technology Stack

- **Framework:** React 18, TypeScript
- **Build Tool:** Vite
- **Architecture:** Feature-Sliced Design (FSD)
- **Styling:** CSS Modules / Vanilla CSS with CSS Variables
- **Map Engine:** Leaflet (React-Leaflet)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/lgcns2team/frontend.git

# Navigate to the project directory
cd frontend

# Install dependencies
npm install
```

### Running the App

```bash
# Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

## 📂 Project Structure (FSD)

```
src/
├── app/          # App-wide settings, providers, and styles
├── pages/        # Composition of routes (Landing, Map, etc.)
├── widgets/      # Complex domain components (HistoryMap, etc.)
├── features/     # User interactions (TimeControls, Timeline, etc.)
├── entities/     # Business entities (Map markers, etc.)
└── shared/       # Reusable utilities and config (Eras, UI kit)
```

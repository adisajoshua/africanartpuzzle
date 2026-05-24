# Heritage Pieces - African Art Puzzle & History Game

An educational, cultural puzzle game designed to help kids and teenagers build spatial reasoning and muscle memory while discovering the rich history, symbolism, and beauty of traditional African artworks.

## 🌟 Features
- **3 Custom African Artworks:** Reconstruct a Yoruba Terracotta Bust, a Savanna Sunset painting, and a geometric Ashanti Kente Tapestry.
- **Dynamic Difficulty:** 
  - **Easy:** 3x3 grid (9 pieces) with localized scattering.
  - **Medium:** 4x4 grid (16 pieces) with moderate scattering.
  - **Hard:** 5x5 grid (25 pieces) with wide, random scattering.
- **Drag-and-Drop Physics:** Built with Framer Motion, pieces feature haptic-style micro-animations and lock into place when dragged near their correct target on the dotgrid canvas.
- **Gamified Learning:** Real-time elapsed timer, hint system, and victory confetti. At the end of each puzzle, players receive a mock "percentile score" based on their speed and learn a fun, educational fact about the artwork.

## 🎨 Art Direction (Concept A)
The game uses a premium "Earthy & Traditional" design system:
- **Colors:** Deep clay/brown backgrounds, terracotta and ochre accents, and soft cream text (strictly HSL values).
- **Typography:** Outfit (Sans-Serif) for UI elements and Playfair Display (Serif) for elegant headers.
- **Grid:** Adheres to a strict 4px modular spacing grid.
- **Aesthetics:** Custom CSS geometric patterns and tribal borders adorn the layout.

## 🛠️ Tech Stack
- **Framework:** React 18 (Vite)
- **State Management:** Zustand
- **Animations:** Framer Motion & canvas-confetti
- **Styling:** Vanilla CSS (Fluid Typography & Custom Properties)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)

### Installation
1. Clone the repository:
   ```bash
   git clone git@github.com:adisajoshua/africanartpuzzle.git
   ```
2. Navigate to the project directory:
   ```bash
   cd africanartpuzzle
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

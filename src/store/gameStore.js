/*
 * Handoff-Ready Code Header
 * Purpose: Zustand State Store for "African Art Puzzle" game loop and mechanics.
 * Features: Level selection, difficulty configuration, puzzle piece grid slicing, random scattering algorithm, snapping detection, hint system animation triggers, and elapsed timer tracking.
 * Dependencies: zustand
 */

import { create } from 'zustand';

export const CANVAS_SIZE = 400; // Fixed canvas viewport size (400px x 400px)

export const ART_PIECES = [
  {
    id: 'bust',
    name: 'Terracotta Queen',
    origin: 'Yoruba Culture, Nigeria (12th-15th Century)',
    image: '/assets/african_art_bust.png',
    description: 'This terracotta head represents the high artistic achievement of the ancient Ife kingdom. Known for its remarkable naturalism, refined features, and intricate facial scarification patterns, it was likely used in sacred royal ancestral rituals.',
    funFact: 'Did you know? Ife artists were among the first in the world to master lifelike human portraits in clay and bronze, long before the European Renaissance.'
  },
  {
    id: 'savanna',
    name: 'Savanna Sunset',
    origin: 'East African Traditional Folk Art',
    image: '/assets/african_art_savanna.png',
    description: 'A vibrant landscape celebrating the ecosystem of the East African savanna. Featuring iconic silhouette shapes of acacia trees, elephants, giraffes, and zebras, overlaid with geometric patterns woven into the amber sky.',
    funFact: 'Traditional African art often incorporates geometric shapes to represent spiritual concepts: triangles for life/movement, and diamonds for status/identity.'
  },
  {
    id: 'tapestry',
    name: 'Kente Tapestry',
    origin: 'Ashanti Kingdom, Ghana',
    image: '/assets/african_art_tapestry.png',
    description: 'A symmetrical, hand-woven geometric textile design inspired by traditional Kente and mudcloth tapestries. Every color and line carries meaning, telling stories of royalty, community unity, and historical achievements.',
    funFact: 'In Kente weaving, yellow represents wealth and royalty, red represents blood and sacrifice, while green symbolises growth, renewal, and harvest.'
  }
];

export const useGameStore = create((set, get) => {
  let timerInterval = null;

  return {
    // Game State
    activeLevelIndex: 0,
    difficulty: 'easy', // 'easy', 'medium', 'hard'
    gameStatus: 'idle', // 'idle', 'playing', 'complete'
    pieces: [], // Grid pieces
    timeElapsed: 0, // Time in seconds
    hintCount: 0,
    animatingHints: [], // IDs of pieces currently animating as hints
    percentileScore: 0, // Mock percentile calculated at end
    
    // Set level index
    setLevel: (index) => set({ activeLevelIndex: index, gameStatus: 'idle', timeElapsed: 0, hintCount: 0, pieces: [] }),

    // Start/Restart Game
    startGame: (difficulty) => {
      // Clear any existing timer
      if (timerInterval) {
        clearInterval(timerInterval);
      }

      const activeArt = ART_PIECES[get().activeLevelIndex];
      
      // Determine grid size based on difficulty
      let gridSize = 3; // Easy: 3x3 (9 pieces)
      if (difficulty === 'medium') gridSize = 4; // Medium: 4x4 (16 pieces)
      if (difficulty === 'hard') gridSize = 5; // Hard: 5x5 (25 pieces)

      const pieceSize = CANVAS_SIZE / gridSize;
      const pieces = [];

      // Generate puzzle pieces
      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          const id = r * gridSize + c;
          const targetX = c * pieceSize;
          const targetY = r * pieceSize;

          // Scattering algorithm based on difficulty
          let x = targetX;
          let y = targetY;
          
          if (difficulty === 'easy') {
            // Easy Mode: Pieces scattered locally within a short radius (40px - 70px)
            const angle = Math.random() * Math.PI * 2;
            const radius = 40 + Math.random() * 40;
            x = targetX + Math.cos(angle) * radius;
            y = targetY + Math.sin(angle) * radius;
          } else if (difficulty === 'medium') {
            // Medium Mode: Moderately scattered across the canvas bounds
            const angle = Math.random() * Math.PI * 2;
            const radius = 90 + Math.random() * 80;
            x = targetX + Math.cos(angle) * radius;
            y = targetY + Math.sin(angle) * radius;
          } else {
            // Hard Mode: Widely scattered completely randomly across canvas borders
            const angle = Math.random() * Math.PI * 2;
            const radius = 180 + Math.random() * 100;
            x = targetX + Math.cos(angle) * radius;
            y = targetY + Math.sin(angle) * radius;
          }

          // Ensure pieces stay within reasonable screen/canvas layout boundaries
          // We limit them to prevent throwing them completely off-screen
          const maxScatter = CANVAS_SIZE * 0.9;
          x = Math.max(-maxScatter, Math.min(CANVAS_SIZE + maxScatter, x));
          y = Math.max(-maxScatter, Math.min(CANVAS_SIZE + maxScatter, y));

          pieces.push({
            id,
            row: r,
            col: c,
            x,
            y,
            targetX,
            targetY,
            isSnapped: false
          });
        }
      }

      set({
        difficulty,
        gameStatus: 'playing',
        pieces,
        timeElapsed: 0,
        hintCount: 0,
        animatingHints: []
      });

      // Start timer
      timerInterval = setInterval(() => {
        if (get().gameStatus === 'playing') {
          set((state) => ({ timeElapsed: state.timeElapsed + 1 }));
        } else {
          clearInterval(timerInterval);
        }
      }, 1000);
    },

    // Move Piece Position
    updatePiecePosition: (id, newX, newY) => {
      set((state) => ({
        pieces: state.pieces.map((p) => (p.id === id ? { ...p, x: newX, y: newY } : p))
      }));
    },

    // Try Snapping Piece
    snapPiece: (id) => {
      const state = get();
      const piece = state.pieces.find((p) => p.id === id);
      if (!piece || piece.isSnapped) return;

      // Distance threshold for snapping (24px)
      const distance = Math.sqrt(
        Math.pow(piece.x - piece.targetX, 2) + Math.pow(piece.y - piece.targetY, 2)
      );

      if (distance < 24) {
        // Snap piece
        const updatedPieces = state.pieces.map((p) =>
          p.id === id ? { ...p, x: piece.targetX, y: piece.targetY, isSnapped: true } : p
        );

        set({ pieces: updatedPieces });

        // Check if game complete
        const allSnapped = updatedPieces.every((p) => p.isSnapped);
        if (allSnapped) {
          clearInterval(timerInterval);
          
          // Calculate mock percentile scoring
          // Easy: target is < 30s. Hard: target is < 90s.
          const time = get().timeElapsed;
          const diff = get().difficulty;
          let basePercentile = 50;

          if (diff === 'easy') {
            if (time < 15) basePercentile = 98;
            else if (time < 30) basePercentile = 88;
            else if (time < 60) basePercentile = 72;
            else basePercentile = 55;
          } else if (diff === 'medium') {
            if (time < 30) basePercentile = 97;
            else if (time < 60) basePercentile = 85;
            else if (time < 100) basePercentile = 70;
            else basePercentile = 52;
          } else {
            if (time < 60) basePercentile = 96;
            else if (time < 120) basePercentile = 84;
            else if (time < 200) basePercentile = 68;
            else basePercentile = 50;
          }

          // Add minor random variance to make it look organic
          const finalPercentile = Math.min(99.8, Math.max(10, basePercentile + (Math.random() * 4 - 2)));

          set({
            gameStatus: 'complete',
            percentileScore: parseFloat(finalPercentile.toFixed(1))
          });
        }
      }
    },

    // Trigger Hint System
    useHint: () => {
      const state = get();
      if (state.gameStatus !== 'playing') return;

      // Find unsnapped pieces
      const unsnapped = state.pieces.filter((p) => !p.isSnapped);
      if (unsnapped.length === 0) return;

      // Select up to 3 pieces to hint
      const hintCountLimit = Math.min(3, unsnapped.length);
      
      // Shuffle array to select random pieces
      const shuffled = [...unsnapped].sort(() => Math.random() - 0.5);
      const selectedIds = shuffled.slice(0, hintCountLimit).map((p) => p.id);

      set((state) => ({
        hintCount: state.hintCount + 1,
        animatingHints: selectedIds
      }));

      // After 1.2 seconds, clear the animating flag
      setTimeout(() => {
        set({ animatingHints: [] });
      }, 1200);
    },

    // Clean up timer on unmount
    cleanup: () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    }
  };
});

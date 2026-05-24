/*
 * Handoff-Ready Code Header
 * Purpose: Main React App Entry & Component Tree for "African Art Puzzle" game.
 * Features: Slices images into grids, scattered coordinate algorithm, drag-and-drop snapping using physical bounding rects, hint system animations, and victory overlay with confetti & educational factoids.
 * Dependencies: react, framer-motion, canvas-confetti, zustand, ./store/gameStore, ./App.css
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useGameStore, CANVAS_SIZE, ART_PIECES } from './store/gameStore';
import './App.css';

// ----------------------------------------------------
// LandingScreen Component
// ----------------------------------------------------
function LandingScreen({ onStartGame }) {
  const { activeLevelIndex, setLevel, difficulty, startGame } = useGameStore();
  const [selectedDifficulty, setSelectedDifficulty] = useState(difficulty);

  const handleLevelSelect = (index) => {
    setLevel(index);
  };

  const handleStart = (index) => {
    setLevel(index);
    startGame(selectedDifficulty);
  };

  return (
    <main className="landing-container" id="landing-screen">
      <section className="landing-intro text-limit">
        <p>
          Welcome to a cultural journey of spatial discovery. Choose an artwork below,
          select your difficulty level, and reconstruct these historical pieces.
        </p>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ochre)' }}>
          Tip: Drag pieces onto the dotgrid and snap them into place!
        </p>
      </section>

      <div className="artwork-grid">
        {ART_PIECES.map((art, index) => {
          const isSelected = activeLevelIndex === index;
          return (
            <article 
              key={art.id} 
              className={`art-card ${isSelected ? 'selected' : ''}`}
              id={`art-card-${art.id}`}
            >
              <div className="art-card-image-wrapper">
                <img 
                  src={art.image} 
                  alt={art.name} 
                  className="art-card-image"
                  loading="lazy"
                />
              </div>
              <div className="art-card-info">
                <h3 className="art-card-title">{art.name}</h3>
                <span className="art-card-origin">{art.origin}</span>
                <p className="art-card-desc">{art.description}</p>
                
                <div className="difficulty-selection">
                  <h4 className="difficulty-title">Select Difficulty</h4>
                  <div className="btn-group">
                    {['easy', 'medium', 'hard'].map((diff) => (
                      <button
                        key={diff}
                        type="button"
                        className={`btn-difficulty ${selectedDifficulty === diff && isSelected ? 'active' : ''}`}
                        onClick={() => {
                          handleLevelSelect(index);
                          setSelectedDifficulty(diff);
                        }}
                        id={`btn-${art.id}-${diff}`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-primary interactive"
                  style={{ marginTop: 'var(--space-4)', width: '100%' }}
                  onClick={() => handleStart(index)}
                  id={`btn-start-${art.id}`}
                >
                  Start Puzzle
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}

// ----------------------------------------------------
// PuzzleCanvas Component
// ----------------------------------------------------
function PuzzleCanvas() {
  const {
    activeLevelIndex,
    difficulty,
    pieces,
    timeElapsed,
    hintCount,
    animatingHints,
    updatePiecePosition,
    snapPiece,
    useHint,
    setLevel
  } = useGameStore();

  const activeArt = ART_PIECES[activeLevelIndex];
  const canvasRef = useRef(null);

  // Grid sizing based on difficulty
  const gridSize = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 4 : 5;
  const pieceSize = CANVAS_SIZE / gridSize;

  // Calculate game progress percentage
  const snappedCount = pieces.filter((p) => p.isSnapped).length;
  const progressPercent = pieces.length > 0 ? Math.round((snappedCount / pieces.length) * 100) : 0;

  // Format timer seconds into MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="game-container" id="game-canvas-screen">
      <header className="game-header">
        <button
          type="button"
          className="back-button interactive"
          onClick={() => setLevel(activeLevelIndex)}
          id="btn-back-to-landing"
        >
          ← Return to Library
        </button>

        <div className="game-stats">
          <div className="stat-badge" id="stat-timer">
            <span className="stat-label">Time</span>
            <span className="stat-value">{formatTime(timeElapsed)}</span>
          </div>
          <div className="stat-badge" id="stat-difficulty">
            <span className="stat-label">Mode</span>
            <span className="stat-value" style={{ fontSize: '12px', textTransform: 'uppercase' }}>
              {difficulty}
            </span>
          </div>
          <div className="stat-badge" id="stat-hints">
            <span className="stat-label">Hints Used</span>
            <span className="stat-value">{hintCount}</span>
          </div>
        </div>
      </header>

      <section className="workspace-layout">
        {/* Left reference Panel */}
        <aside className="reference-panel">
          <h4 className="reference-title">Original Art Reference</h4>
          <div className="reference-image-wrapper">
            <img 
              src={activeArt.image} 
              alt="Reference" 
              className="reference-image" 
            />
          </div>
          <div className="reference-meta">
            <strong style={{ color: 'var(--color-cream)' }}>{activeArt.name}</strong>
            <p style={{ fontSize: '11px', marginTop: '4px' }}>{activeArt.origin}</p>
          </div>
        </aside>

        {/* Center Canvas */}
        <div 
          className="canvas-wrapper" 
          ref={canvasRef}
          id="puzzle-board"
        >
          <div className="canvas-dotgrid" />
          
          {/* Target slot dashes for visual guide */}
          <div 
            className="target-grid"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
              gridTemplateRows: `repeat(${gridSize}, 1fr)`
            }}
          >
            {Array.from({ length: gridSize * gridSize }).map((_, i) => (
              <div key={i} className="target-slot" />
            ))}
          </div>

          {/* Draggable Puzzle Pieces */}
          {pieces.map((piece) => {
            const isHinting = animatingHints.includes(piece.id);

            return (
              <motion.div
                key={piece.id}
                drag={!piece.isSnapped}
                dragConstraints={canvasRef}
                dragElastic={0.05}
                dragMomentum={false}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: pieceSize,
                  height: pieceSize,
                  backgroundImage: `url(${activeArt.image})`,
                  backgroundSize: `${CANVAS_SIZE}px ${CANVAS_SIZE}px`,
                  backgroundPosition: `-${piece.col * pieceSize}px -${piece.row * pieceSize}px`,
                }}
                animate={isHinting ? {
                  x: [piece.x, piece.targetX, piece.x],
                  y: [piece.y, piece.targetY, piece.y],
                  zIndex: [10, 100, 10],
                  scale: [1, 1.05, 1],
                  transition: { duration: 1.2, times: [0, 0.5, 1], ease: "easeInOut" }
                } : {
                  x: piece.x,
                  y: piece.y,
                  zIndex: piece.isSnapped ? 1 : 10,
                  transition: piece.isSnapped 
                    ? { type: 'spring', stiffness: 350, damping: 22 } 
                    : { duration: 0.05 }
                }}
                onDragEnd={(event, info) => {
                  if (!canvasRef.current) return;
                  
                  // Calculate absolute position on canvas from screen client position
                  const canvasRect = canvasRef.current.getBoundingClientRect();
                  const pieceRect = event.target.getBoundingClientRect();
                  const relativeX = pieceRect.left - canvasRect.left;
                  const relativeY = pieceRect.top - canvasRect.top;

                  // Update coordinate in store
                  updatePiecePosition(piece.id, relativeX, relativeY);
                  // Snap check
                  snapPiece(piece.id);
                }}
                className={`puzzle-piece ${piece.isSnapped ? 'snapped' : ''}`}
                id={`puzzle-piece-${piece.id}`}
              />
            );
          })}
        </div>

        {/* Right Control Panel */}
        <aside className="control-panel">
          <h4 className="control-title">Controls</h4>
          
          <div className="progress-bar-container">
            <div className="progress-labels">
              <span>Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="progress-bar-bg">
              <div 
                className="progress-bar-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            className="hint-button interactive"
            onClick={useHint}
            disabled={progressPercent === 100 || animatingHints.length > 0}
            id="btn-use-hint"
          >
            💡 Reveal Hint
          </button>

          <div className="game-instructions">
            <strong>How to play:</strong>
            <p style={{ marginTop: '4px' }}>
              Drag the scattered pieces from around the canvas back onto their correct spot. 
              The pieces will snap securely onto the dotgrid when you release them close to their true home.
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}

// ----------------------------------------------------
// GameComplete Component
// ----------------------------------------------------
function GameComplete() {
  const {
    activeLevelIndex,
    difficulty,
    timeElapsed,
    hintCount,
    percentileScore,
    setLevel,
    startGame
  } = useGameStore();

  const activeArt = ART_PIECES[activeLevelIndex];

  // Fire confetti once on victory render
  useEffect(() => {
    const end = Date.now() + (2 * 1000);
    const colors = ['#d35400', '#f39c12', '#e67e22', '#2c3e50'];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayAgain = () => {
    startGame(difficulty);
  };

  const handleBackToLibrary = () => {
    setLevel(activeLevelIndex);
  };

  return (
    <div className="victory-overlay" id="victory-screen">
      <div className="victory-card">
        <div className="victory-badge">👑</div>
        <h2 className="victory-title">Puzzle Assembled!</h2>
        <div className="victory-subtitle">{activeArt.name}</div>

        <div className="victory-stats-grid">
          <div className="victory-stat-item">
            <span className="victory-stat-label">Time Spent</span>
            <span className="victory-stat-value">{formatTime(timeElapsed)}</span>
          </div>
          <div className="victory-stat-item">
            <span className="victory-stat-label">Performance</span>
            <span className="victory-stat-value highlight">
              Top {Math.round(100 - percentileScore)}%
            </span>
          </div>
          <div className="victory-stat-item">
            <span className="victory-stat-label">Hints Used</span>
            <span className="victory-stat-value">{hintCount}</span>
          </div>
        </div>

        <div className="educational-card">
          <h4 className="educational-title">Cultural Significance</h4>
          <p className="educational-desc">{activeArt.description}</p>
          <div className="educational-fact-box">
            <div className="educational-fact-title">💡 Fun Fact</div>
            <p className="educational-fact">{activeArt.funFact}</p>
          </div>
        </div>

        <div className="victory-actions">
          <button
            type="button"
            className="btn-primary interactive"
            onClick={handlePlayAgain}
            id="btn-play-again"
          >
            Play Again
          </button>
          <button
            type="button"
            className="btn-secondary interactive"
            onClick={handleBackToLibrary}
            id="btn-return-library"
          >
            Art Library
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Main App Component
// ----------------------------------------------------
function App() {
  const { gameStatus, cleanup } = useGameStore();

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return (
    <div className="app-container">
      <header className="app-header tribal-border-top">
        <h1 className="app-title">Heritage Pieces</h1>
        <p className="app-subtitle">African Artwork Puzzle & History Game</p>
      </header>

      {gameStatus === 'idle' && <LandingScreen />}
      {gameStatus === 'playing' && <PuzzleCanvas />}
      
      <AnimatePresence>
        {gameStatus === 'complete' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <GameComplete />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;

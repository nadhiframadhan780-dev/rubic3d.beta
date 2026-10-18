/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { RubikCanvas, RubikCanvasRef } from './components/RubikCanvas';
import { HeaderHUD } from './components/HeaderHUD';
import { BottomDock } from './components/BottomDock';
import { HelpModal } from './components/HelpModal';
import { SolvedCelebration } from './components/SolvedCelebration';
import { ArrowPad, ArrowKeyMode } from './components/ArrowPad';
import { CubeDimension, CubeMove, CubeTheme } from './types/rubik';
import { CUBE_THEMES } from './constants/themes';
import { generateScramble, notationToMove, invertMove } from './utils/cubeMath';
import { soundManager } from './audio/soundManager';

const STORAGE_KEY_RECORDS = 'rubik_hd_best_records_v1';

export default function App() {
  const canvasRef = useRef<RubikCanvasRef>(null);

  // Core App State
  const [dimension, setDimension] = useState<CubeDimension>(3);
  const [theme, setTheme] = useState<CubeTheme>(CUBE_THEMES[0]);
  const [moveCount, setMoveCount] = useState<number>(0);
  const [history, setHistory] = useState<CubeMove[]>([]);
  const [isScrambling, setIsScrambling] = useState<boolean>(false);
  const [explodedFactor, setExplodedFactor] = useState<number>(0);
  const [speedMs, setSpeedMs] = useState<number>(180);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [arrowMode, setArrowMode] = useState<ArrowKeyMode>('layer');
  const [activeArrow, setActiveArrow] = useState<'left' | 'right' | 'up' | 'down' | null>(null);

  // Modals
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isCelebrationOpen, setIsCelebrationOpen] = useState<boolean>(false);
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);

  // Speedcubing Timer State
  const [timerState, setTimerState] = useState<'idle' | 'holding' | 'ready' | 'running' | 'stopped'>('idle');
  const [timerMs, setTimerMs] = useState<number>(0);
  const timerStartTimeRef = useRef<number>(0);
  const timerRafRef = useRef<number | null>(null);
  const holdTimeoutRef = useRef<number | null>(null);

  // Personal Best Records
  const [bestRecords, setBestRecords] = useState<Record<CubeDimension, number | null>>({
    2: null,
    3: null,
    4: null,
    5: null,
  });

  // Load records from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
      if (saved) {
        setBestRecords(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  // Save records
  const updateBestRecord = useCallback((dim: CubeDimension, time: number) => {
    setBestRecords(prev => {
      const current = prev[dim];
      if (current === null || time < current) {
        const updated = { ...prev, [dim]: time };
        try {
          localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(updated));
        } catch {
          // ignore
        }
        setIsNewRecord(true);
        return updated;
      }
      setIsNewRecord(false);
      return prev;
    });
  }, []);

  // Timer loop
  useEffect(() => {
    if (timerState === 'running') {
      timerStartTimeRef.current = performance.now() - timerMs;
      const updateTimer = () => {
        setTimerMs(Math.round(performance.now() - timerStartTimeRef.current));
        timerRafRef.current = requestAnimationFrame(updateTimer);
      };
      timerRafRef.current = requestAnimationFrame(updateTimer);
    } else {
      if (timerRafRef.current) {
        cancelAnimationFrame(timerRafRef.current);
        timerRafRef.current = null;
      }
    }
    return () => {
      if (timerRafRef.current) cancelAnimationFrame(timerRafRef.current);
    };
  }, [timerState]);

  // Handle Dimension Change
  const handleDimensionChange = (newDim: CubeDimension) => {
    if (newDim === dimension) return;
    setDimension(newDim);
    setMoveCount(0);
    setHistory([]);
    setTimerState('idle');
    setTimerMs(0);
    canvasRef.current?.setDimension(newDim);
    soundManager.playClick();
  };

  // Handle Theme Change
  const handleThemeChange = (newTheme: CubeTheme) => {
    setTheme(newTheme);
    canvasRef.current?.setTheme(newTheme);
    soundManager.playClick();
  };

  // Handle Exploded View
  const handleExplodedChange = (factor: number) => {
    setExplodedFactor(factor);
    canvasRef.current?.setExplodedView(factor);
  };

  // Handle Speed Change
  const handleSpeedChange = (speed: number) => {
    setSpeedMs(speed);
    canvasRef.current?.setSpeed(speed);
    soundManager.playClick();
  };

  // Scramble Cube
  const handleScramble = () => {
    if (isScrambling) return;
    setIsScrambling(true);
    setMoveCount(0);
    setHistory([]);
    setTimerState('idle');
    setTimerMs(0);

    const moves = generateScramble(dimension);
    canvasRef.current?.scramble(moves, () => {
      setIsScrambling(false);
    });
  };

  // Move Executed callback from 3D scene (manual gesture or programmatic)
  const handleMoveExecuted = (move: CubeMove) => {
    if (move.isScramble) return;

    setMoveCount(prev => prev + 1);
    setHistory(prev => [...prev, move]);

    // If timer was stopped or ready, start on first move if not already running
    if (timerState === 'ready') {
      setTimerState('running');
    }
  };

  // Cube Solved callback
  const handleSolved = () => {
    // If the cube was actually moved/scrambled
    if (moveCount > 2) {
      if (timerState === 'running') {
        setTimerState('stopped');
        updateBestRecord(dimension, timerMs);
      }
      soundManager.playVictory();

      // Launch victory confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }

      setIsCelebrationOpen(true);
    }
  };

  // Undo
  const handleUndo = () => {
    if (history.length === 0 || isScrambling) return;
    const lastMove = history[history.length - 1];
    const inverted = invertMove(lastMove);

    setHistory(prev => prev.slice(0, prev.length - 1));
    setMoveCount(prev => Math.max(0, prev - 1));
    canvasRef.current?.executeMove(inverted, 120);
  };

  // Auto-Solve: rewind all moves in history
  const handleAutoSolve = () => {
    if (history.length === 0 || isScrambling) return;
    setIsScrambling(true);

    const reversedMoves: CubeMove[] = [...history].reverse().map(m => invertMove(m));
    let idx = 0;

    const runNext = () => {
      if (idx >= reversedMoves.length) {
        setIsScrambling(false);
        setHistory([]);
        setMoveCount(0);
        soundManager.playBeep(true);
        return;
      }
      const mv = reversedMoves[idx++];
      canvasRef.current?.executeMove(mv, 70, () => {
        runNext();
      });
    };

    runNext();
  };

  // Reset cube
  const handleReset = () => {
    if (isScrambling) return;
    setMoveCount(0);
    setHistory([]);
    setTimerState('idle');
    setTimerMs(0);
    canvasRef.current?.resetCube();
    soundManager.playClick();
  };

  // Rotate via notation
  const handleRotateNotation = (notation: string) => {
    if (isScrambling) return;
    const move = notationToMove(notation, dimension);
    if (move) {
      canvasRef.current?.executeMove(move);
    }
  };

  // Handle Arrow Keys (Panah Kanan, Kiri, Atas, Bawah)
  const handleArrowAction = useCallback((dir: 'left' | 'right' | 'up' | 'down', isShift: boolean = false, isAltOrCtrl: boolean = false) => {
    if (isScrambling) return;

    if (isAltOrCtrl || arrowMode === 'camera') {
      // Orbit camera smoothly in 3D
      const rot = 0.22;
      switch (dir) {
        case 'left':
          canvasRef.current?.orbitCamera(rot, 0);
          break;
        case 'right':
          canvasRef.current?.orbitCamera(-rot, 0);
          break;
        case 'up':
          canvasRef.current?.orbitCamera(0, -rot * 0.7);
          break;
        case 'down':
          canvasRef.current?.orbitCamera(0, rot * 0.7);
          break;
      }
      return;
    }

    // Layer Rotation Mode
    if (!isShift) {
      switch (dir) {
        case 'left':
          // Putar layer atas ke kiri (U)
          handleRotateNotation('U');
          break;
        case 'right':
          // Putar layer atas ke kanan (U')
          handleRotateNotation("U'");
          break;
        case 'up':
          // Putar layer kanan ke atas (R)
          handleRotateNotation('R');
          break;
        case 'down':
          // Putar layer kanan ke bawah (R')
          handleRotateNotation("R'");
          break;
      }
    } else {
      // Shift modifier for bottom and left layers
      switch (dir) {
        case 'left':
          handleRotateNotation("D'");
          break;
        case 'right':
          handleRotateNotation('D');
          break;
        case 'up':
          handleRotateNotation("L'");
          break;
        case 'down':
          handleRotateNotation('L');
          break;
      }
    }
  }, [arrowMode, isScrambling, dimension]);

  // Toggle Sound
  const handleToggleSound = () => {
    const updated = soundManager.toggle();
    setSoundEnabled(updated);
  };

  // Clear records
  const handleClearRecords = () => {
    if (window.confirm('Hapus semua rekor waktu terbaik?')) {
      const resetMap: Record<CubeDimension, number | null> = { 2: null, 3: null, 4: null, 5: null };
      setBestRecords(resetMap);
      localStorage.removeItem(STORAGE_KEY_RECORDS);
    }
  };

  // Speedcubing Timer Handlers (Spacebar & Touch)
  const handleTimerStartHold = () => {
    if (timerState === 'running') {
      setTimerState('stopped');
      soundManager.playBeep(true);
      return;
    }
    if (timerState === 'idle' || timerState === 'stopped') {
      setTimerState('holding');
      holdTimeoutRef.current = window.setTimeout(() => {
        setTimerState('ready');
        soundManager.playClick(0.5);
      }, 350);
    }
  };

  const handleTimerReleaseHold = () => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (timerState === 'ready') {
      setTimerMs(0);
      setTimerState('running');
    } else if (timerState === 'holding') {
      setTimerState('idle');
    }
  };

  // Global Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Spacebar for Timer
      if (e.code === 'Space') {
        e.preventDefault();
        if (!e.repeat) {
          handleTimerStartHold();
        }
        return;
      }

      // Arrow keys (Panah Kiri, Kanan, Atas, Bawah)
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
        e.preventDefault();
        const dirMap: Record<string, 'left' | 'right' | 'up' | 'down'> = {
          ArrowLeft: 'left',
          ArrowRight: 'right',
          ArrowUp: 'up',
          ArrowDown: 'down',
        };
        const dir = dirMap[e.code];
        setActiveArrow(dir);
        handleArrowAction(dir, e.shiftKey, e.ctrlKey || e.altKey || e.metaKey);
        return;
      }

      // Undo on Z or Ctrl+Z
      if (e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Scramble on S
      if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleScramble();
        return;
      }

      // Notations: U, D, L, R, F, B
      const key = e.key.toUpperCase();
      if (['U', 'D', 'L', 'R', 'F', 'B'].includes(key)) {
        e.preventDefault();
        const notation = e.shiftKey ? `${key}'` : key;
        handleRotateNotation(notation);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleTimerReleaseHold();
      }
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
        setActiveArrow(null);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [timerState, history, isScrambling, dimension, handleArrowAction]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#0a0c10] select-none">
      {/* 1. 3D WebGL Canvas Viewport */}
      <RubikCanvas
        ref={canvasRef}
        dimension={dimension}
        theme={theme}
        onMoveExecuted={handleMoveExecuted}
        onSolved={handleSolved}
      />

      {/* 2. Top Header HUD */}
      <HeaderHUD
        dimension={dimension}
        onDimensionChange={handleDimensionChange}
        moveCount={moveCount}
        timerMs={timerMs}
        timerState={timerState}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenHelp={() => setIsHelpOpen(true)}
        onTimerAreaClick={() => {
          if (timerState === 'running') {
            setTimerState('stopped');
          } else {
            setTimerMs(0);
            setTimerState('running');
          }
        }}
        bestTimeMs={bestRecords[dimension] ?? undefined}
      />

      {/* 3. Collapsible Bottom Control Dock */}
      <BottomDock
        dimension={dimension}
        theme={theme}
        onThemeChange={handleThemeChange}
        onScramble={handleScramble}
        onUndo={handleUndo}
        canUndo={history.length > 0}
        onAutoSolve={handleAutoSolve}
        onReset={handleReset}
        onRotateNotation={handleRotateNotation}
        onCameraPreset={preset => canvasRef.current?.resetCameraView(preset)}
        explodedFactor={explodedFactor}
        onExplodedChange={handleExplodedChange}
        speedMs={speedMs}
        onSpeedChange={handleSpeedChange}
        bestRecords={bestRecords}
        onClearRecords={handleClearRecords}
        isScrambling={isScrambling}
      />

      {/* 4. On-Screen ArrowPad D-Pad & Keyboard Indicator */}
      <ArrowPad
        mode={arrowMode}
        onModeChange={setArrowMode}
        onArrowPress={dir => handleArrowAction(dir, false, false)}
        activeArrow={activeArrow}
      />

      {/* 5. Help & Controls Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* 5. Solved Victory Celebration Modal */}
      <SolvedCelebration
        isOpen={isCelebrationOpen}
        dimension={dimension}
        timeMs={timerMs}
        moveCount={moveCount}
        isNewBest={isNewRecord}
        onScrambleAgain={() => {
          setIsCelebrationOpen(false);
          handleScramble();
        }}
        onClose={() => setIsCelebrationOpen(false)}
      />
    </main>
  );
}

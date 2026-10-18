import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { RubikScene } from '../three/RubikScene';
import { CubeDimension, CubeMove, CubeTheme } from '../types/rubik';

export interface RubikCanvasRef {
  executeMove: (move: CubeMove, speed?: number, onDone?: () => void) => void;
  scramble: (moves: CubeMove[], onComplete?: () => void) => void;
  setDimension: (dimension: CubeDimension) => void;
  setTheme: (theme: CubeTheme) => void;
  setExplodedView: (factor: number) => void;
  setSpeed: (speedMs: number) => void;
  resetCameraView: (preset?: 'isometric' | 'front' | 'top' | 'right') => void;
  orbitCamera: (deltaTheta: number, deltaPhi: number) => void;
  resetCube: () => void;
}

interface RubikCanvasProps {
  dimension: CubeDimension;
  theme: CubeTheme;
  onMoveExecuted?: (move: CubeMove) => void;
  onSolved?: () => void;
  onScrambleProgress?: (current: number, total: number) => void;
}

export const RubikCanvas = forwardRef<RubikCanvasRef, RubikCanvasProps>(
  ({ dimension, theme, onMoveExecuted, onSolved, onScrambleProgress }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<RubikScene | null>(null);

    // Keep callbacks in refs to prevent recreating scene
    const onMoveRef = useRef(onMoveExecuted);
    onMoveRef.current = onMoveExecuted;
    const onSolvedRef = useRef(onSolved);
    onSolvedRef.current = onSolved;
    const onScrambleRef = useRef(onScrambleProgress);
    onScrambleRef.current = onScrambleProgress;

    useEffect(() => {
      if (!containerRef.current) return;

      const scene = new RubikScene(containerRef.current, dimension, theme, {
        onMoveExecuted: move => onMoveRef.current?.(move),
        onSolved: () => onSolvedRef.current?.(),
        onScrambleProgress: (c, t) => onScrambleRef.current?.(c, t),
      });
      sceneRef.current = scene;

      return () => {
        scene.dispose();
        sceneRef.current = null;
      };
    }, []); // Run once on mount

    // Expose control methods
    useImperativeHandle(ref, () => ({
      executeMove: (move, speed, onDone) => {
        sceneRef.current?.executeMove(move, speed, onDone);
      },
      scramble: (moves, onComplete) => {
        sceneRef.current?.scramble(moves, onComplete);
      },
      setDimension: newDim => {
        sceneRef.current?.rebuildCube(newDim);
      },
      setTheme: newTheme => {
        sceneRef.current?.setTheme(newTheme);
      },
      setExplodedView: factor => {
        sceneRef.current?.setExplodedView(factor);
      },
      setSpeed: speedMs => {
        sceneRef.current?.setSpeed(speedMs);
      },
      resetCameraView: preset => {
        sceneRef.current?.resetCameraView(preset);
      },
      orbitCamera: (deltaTheta, deltaPhi) => {
        sceneRef.current?.orbitCameraBy(deltaTheta, deltaPhi);
      },
      resetCube: () => {
        sceneRef.current?.rebuildCube();
      },
    }));

    return (
      <div
        ref={containerRef}
        className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing overflow-hidden"
        style={{ touchAction: 'none' }}
      />
    );
  }
);

RubikCanvas.displayName = 'RubikCanvas';

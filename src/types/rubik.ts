export type CubeDimension = 2 | 3 | 4 | 5;

export type FaceName = 'U' | 'D' | 'L' | 'R' | 'F' | 'B';

export type RotationAxis = 'x' | 'y' | 'z';

export interface CubeMove {
  axis: RotationAxis;
  layer: number; // 0 to dimension - 1
  direction: 1 | -1; // 1 = clockwise, -1 = counter-clockwise relative to axis
  notation?: string;
  isScramble?: boolean;
}

export interface CubeTheme {
  id: string;
  name: string;
  bodyColor: string;
  colors: {
    U: string; // Up (White)
    D: string; // Down (Yellow)
    L: string; // Left (Orange)
    R: string; // Right (Red)
    F: string; // Front (Green)
    B: string; // Back (Blue)
  };
  roughness: number;
  metalness: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
  ior?: number;
  emission?: boolean;
  hasLogo?: boolean;
  isCarbon?: boolean;
  isGold?: boolean;
  bumpScale?: number;
}

export interface MoveRecord {
  move: CubeMove;
  timestamp: number;
}

export interface CubieState {
  id: number;
  basePos: [number, number, number]; // original coordinate [-1..1]
  currentPos: [number, number, number];
  // 6 face colors: +x (R), -x (L), +y (U), -y (D), +z (F), -z (B)
  faces: (FaceName | null)[];
}

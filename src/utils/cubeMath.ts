import { CubeDimension, CubeMove, FaceName, RotationAxis } from '../types/rubik';

/**
 * Maps layer index to coordinate centered around 0.
 * For dimension 3: index 0 -> -1, 1 -> 0, 2 -> 1
 * For dimension 2: index 0 -> -0.5, 1 -> 0.5
 */
export function layerToCoord(layerIndex: number, dimension: CubeDimension, cubieSize: number = 1.0, gap: number = 0.05): number {
  const stride = cubieSize + gap;
  const offset = (dimension - 1) / 2;
  return (layerIndex - offset) * stride;
}

/**
 * Given a coordinate along an axis, return which layer index [0..dimension-1] it corresponds to.
 */
export function coordToLayer(coord: number, dimension: CubeDimension, cubieSize: number = 1.0, gap: number = 0.05): number {
  const stride = cubieSize + gap;
  const offset = (dimension - 1) / 2;
  const floatLayer = coord / stride + offset;
  const layer = Math.round(floatLayer);
  return Math.max(0, Math.min(dimension - 1, layer));
}

/**
 * Standard faces definitions and normal vectors
 */
export const FACE_NORMALS: Record<FaceName, [number, number, number]> = {
  U: [0, 1, 0],   // Top (+Y)
  D: [0, -1, 0],  // Bottom (-Y)
  L: [-1, 0, 0],  // Left (-X)
  R: [1, 0, 0],   // Right (+X)
  F: [0, 0, 1],   // Front (+Z)
  B: [0, 0, -1],  // Back (-Z)
};

export const STANDARD_FACE_ORDER: FaceName[] = ['R', 'L', 'U', 'D', 'F', 'B'];

/**
 * Convert standard notation to CubeMove
 */
export function notationToMove(notation: string, dimension: CubeDimension): CubeMove | null {
  const clean = notation.trim();
  if (!clean) return null;

  const faceChar = clean[0].toUpperCase();
  const isPrime = clean.includes("'");
  const isDouble = clean.includes('2');

  let axis: RotationAxis = 'y';
  let layer = 0;
  let baseDir: 1 | -1 = 1;

  switch (faceChar) {
    case 'U':
      axis = 'y';
      layer = dimension - 1;
      baseDir = -1; // Clockwise looking at +Y
      break;
    case 'D':
      axis = 'y';
      layer = 0;
      baseDir = 1; // Clockwise looking at -Y
      break;
    case 'R':
      axis = 'x';
      layer = dimension - 1;
      baseDir = -1; // Clockwise looking at +X
      break;
    case 'L':
      axis = 'x';
      layer = 0;
      baseDir = 1; // Clockwise looking at -X
      break;
    case 'F':
      axis = 'z';
      layer = dimension - 1;
      baseDir = -1; // Clockwise looking at +Z
      break;
    case 'B':
      axis = 'z';
      layer = 0;
      baseDir = 1; // Clockwise looking at -Z
      break;
    case 'M': // Middle slice between L and R (follows L direction)
      if (dimension % 2 === 1) {
        axis = 'x';
        layer = Math.floor(dimension / 2);
        baseDir = 1;
      } else {
        return null;
      }
      break;
    case 'E': // Equatorial slice between U and D (follows D direction)
      if (dimension % 2 === 1) {
        axis = 'y';
        layer = Math.floor(dimension / 2);
        baseDir = 1;
      } else {
        return null;
      }
      break;
    case 'S': // Standing slice between F and B (follows F direction)
      if (dimension % 2 === 1) {
        axis = 'z';
        layer = Math.floor(dimension / 2);
        baseDir = -1;
      } else {
        return null;
      }
      break;
    default:
      return null;
  }

  let finalDir: 1 | -1 = isPrime ? ((baseDir * -1) as 1 | -1) : baseDir;
  if (isDouble) {
    // We can execute double turn as two moves or direction toggle
    finalDir = baseDir;
  }

  return {
    axis,
    layer,
    direction: finalDir,
    notation: clean,
  };
}

/**
 * Generate a random scramble sequence for a given dimension
 */
export function generateScramble(dimension: CubeDimension, moveCount?: number): CubeMove[] {
  const count = moveCount || (dimension === 2 ? 12 : dimension === 3 ? 20 : dimension === 4 ? 28 : 34);
  const axes: RotationAxis[] = ['x', 'y', 'z'];
  const moves: CubeMove[] = [];

  let lastAxis: RotationAxis | null = null;
  let lastLayer: number | null = null;

  for (let i = 0; i < count; i++) {
    let axis: RotationAxis;
    let layer: number;

    // Avoid repeatedly rotating the same layer on the same axis
    do {
      axis = axes[Math.floor(Math.random() * axes.length)];
      layer = Math.floor(Math.random() * dimension);
    } while (axis === lastAxis && layer === lastLayer);

    const dir: 1 | -1 = Math.random() > 0.5 ? 1 : -1;

    let notation = '';
    if (axis === 'y') {
      if (layer === dimension - 1) notation = dir === -1 ? 'U' : "U'";
      else if (layer === 0) notation = dir === 1 ? 'D' : "D'";
      else notation = `Y${layer}${dir > 0 ? '+' : '-'}`;
    } else if (axis === 'x') {
      if (layer === dimension - 1) notation = dir === -1 ? 'R' : "R'";
      else if (layer === 0) notation = dir === 1 ? 'L' : "L'";
      else notation = `X${layer}${dir > 0 ? '+' : '-'}`;
    } else {
      if (layer === dimension - 1) notation = dir === -1 ? 'F' : "F'";
      else if (layer === 0) notation = dir === 1 ? 'B' : "B'";
      else notation = `Z${layer}${dir > 0 ? '+' : '-'}`;
    }

    moves.push({
      axis,
      layer,
      direction: dir,
      notation,
      isScramble: true,
    });

    lastAxis = axis;
    lastLayer = layer;
  }

  return moves;
}

/**
 * Format milliseconds into standard speedcubing timer format: mm:ss.xx
 */
export function formatTime(ms: number): string {
  if (ms < 0) ms = 0;
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const hundredths = Math.floor((ms % 1000) / 10);

  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}`;
  }
  return `${seconds}.${hundredths.toString().padStart(2, '0')}`;
}

/**
 * Invert a move for Undo operations
 */
export function invertMove(move: CubeMove): CubeMove {
  let invNotation = move.notation || '';
  if (invNotation.endsWith("'")) {
    invNotation = invNotation.slice(0, -1);
  } else if (invNotation && !invNotation.endsWith('2')) {
    invNotation = `${invNotation}'`;
  }

  return {
    axis: move.axis,
    layer: move.layer,
    direction: (move.direction * -1) as 1 | -1,
    notation: invNotation,
  };
}

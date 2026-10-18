import { CubeMove } from '../types/rubik';
import { invertMove } from './cubeMath';

export interface SolverStep {
  move: CubeMove;
  description: string;
}

/**
 * Generate reverse solution steps from a recorded history of moves
 */
export function generateReverseSolution(history: CubeMove[]): SolverStep[] {
  if (!history || history.length === 0) return [];

  const solution: SolverStep[] = [];
  // Reverse the moves from last to first, inverting each direction
  for (let i = history.length - 1; i >= 0; i--) {
    const original = history[i];
    const inverted = invertMove(original);

    let desc = `Putar layer ${inverted.axis.toUpperCase()}${inverted.layer + 1} searah ${
      inverted.direction === 1 ? 'jarum jam' : 'kebalikan jarum jam'
    }`;
    if (inverted.notation) {
      desc = `Langkah: ${inverted.notation} (${desc})`;
    }

    solution.push({
      move: inverted,
      description: desc,
    });
  }

  return solution;
}

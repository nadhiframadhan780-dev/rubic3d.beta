import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { layerToCoord, coordToLayer, notationToMove, invertMove, formatTime, generateScramble } from './cubeMath';

describe('cubeMath logic tests', () => {
  test('coord to layer conversion for 3x3', () => {
    // For 3x3 (stride ~ 1.05):
    // layer 0: -1.05
    // layer 1: 0
    // layer 2: +1.05
    assert.equal(coordToLayer(-1.05, 3), 0);
    assert.equal(coordToLayer(0, 3), 1);
    assert.equal(coordToLayer(1.05, 3), 2);
  });

  test('layer to coord mapping for 2x2 and 3x3', () => {
    const c0_2x2 = layerToCoord(0, 2, 1.0, 0.0);
    const c1_2x2 = layerToCoord(1, 2, 1.0, 0.0);
    assert.equal(c0_2x2, -0.5);
    assert.equal(c1_2x2, 0.5);
  });

  test('notation to move conversions', () => {
    const moveU = notationToMove('U', 3);
    assert.ok(moveU);
    assert.equal(moveU.axis, 'y');
    assert.equal(moveU.layer, 2);
    assert.equal(moveU.direction, -1);

    const moveUPrime = notationToMove("U'", 3);
    assert.ok(moveUPrime);
    assert.equal(moveUPrime.direction, 1);

    const moveR = notationToMove('R', 3);
    assert.ok(moveR);
    assert.equal(moveR.axis, 'x');
    assert.equal(moveR.layer, 2);
  });

  test('invert move returns opposite direction', () => {
    const move = { axis: 'x' as const, layer: 2, direction: 1 as const, notation: 'R' };
    const inv = invertMove(move);
    assert.equal(inv.axis, 'x');
    assert.equal(inv.layer, 2);
    assert.equal(inv.direction, -1);
    assert.equal(inv.notation, "R'");
  });

  test('time formatting', () => {
    assert.equal(formatTime(12340), '12.34');
    assert.equal(formatTime(65430), '1:05.43');
    assert.equal(formatTime(0), '0.00');
  });

  test('scramble generator produces required move count', () => {
    const sc2 = generateScramble(2, 10);
    assert.equal(sc2.length, 10);

    const sc3 = generateScramble(3, 20);
    assert.equal(sc3.length, 20);
    sc3.forEach(m => {
      assert.ok(['x', 'y', 'z'].includes(m.axis));
      assert.ok(m.layer >= 0 && m.layer < 3);
    });
  });
});

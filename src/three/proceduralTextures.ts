import * as THREE from 'three';

/**
 * Generates a procedural micro-grain bump map for realistic vinyl/plastic.
 * Produces subtle orange-peel specular scattering on glossy stickers.
 */
export function createPlasticBumpTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;

  // Subtle Perlin-like cellular noise
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const noise1 = Math.sin(x * 0.35) * Math.cos(y * 0.35) * 8;
      const noise2 = Math.sin(x * 0.8 + y * 0.5) * 6;
      const noise3 = (Math.random() - 0.5) * 14;
      const val = Math.min(255, Math.max(0, 128 + noise1 + noise2 + noise3));
      data[idx] = val;
      data[idx + 1] = val;
      data[idx + 2] = val;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

/**
 * Generates procedural carbon-fiber twill weave texture
 */
export function createCarbonFiberTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#18191c';
  ctx.fillRect(0, 0, size, size);

  const step = 8;
  for (let y = 0; y < size; y += step) {
    for (let x = 0; x < size; x += step) {
      const isAlt = ((x / step) + (y / step)) % 2 === 0;
      ctx.fillStyle = isAlt ? '#26282d' : '#141517';
      ctx.fillRect(x, y, step, step);

      // diagonal sheen
      ctx.strokeStyle = isAlt ? '#3a3d45' : '#0e0f11';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + step, y + step);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  return texture;
}

/**
 * Generates a speedcube competition logo for the White center tile
 * (Like GAN / Moyu speedcubes)
 */
export function createSpeedcubeLogoTexture(bgColor: string): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Background matching the white sticker
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);

  // Outer circular metallic emblem ring
  const cx = size / 2;
  const cy = size / 2;
  const r = 140;

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 6;
  ctx.stroke();

  // Subtle inner accent ring
  ctx.beginPath();
  ctx.arc(cx, cy, r - 12, 0, Math.PI * 2);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Diamond / Cube icon in center
  ctx.translate(cx, cy - 18);
  ctx.beginPath();
  ctx.moveTo(0, -42);
  ctx.lineTo(36, -20);
  ctx.lineTo(36, 22);
  ctx.lineTo(0, 44);
  ctx.lineTo(-36, 22);
  ctx.lineTo(-36, -20);
  ctx.closePath();
  ctx.fillStyle = '#0f172a';
  ctx.fill();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Isometric internal cube lines
  ctx.beginPath();
  ctx.moveTo(0, -42);
  ctx.lineTo(0, 0);
  ctx.lineTo(36, 22);
  ctx.moveTo(0, 0);
  ctx.lineTo(-36, 22);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.restore();

  // Text: "RUBIK HD"
  ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '4px';
  ctx.fillText('RUBIK HD', cx, cy + 54);

  // Subtext: "MAGNETIC CORE"
  ctx.font = '700 18px "JetBrains Mono", monospace';
  ctx.fillStyle = '#64748b';
  ctx.letterSpacing = '3px';
  ctx.fillText('PRO SPEEDCUBE', cx, cy + 86);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Generates an ultra-soft radial studio floor shadow texture
 */
export function createStudioFloorTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const cx = size / 2;
  const cy = size / 2;

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size / 2);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
  grad.addColorStop(0.25, 'rgba(0, 0, 0, 0.45)');
  grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.18)');
  grad.addColorStop(0.8, 'rgba(0, 0, 0, 0.05)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

import { CubeTheme } from '../types/rubik';

export const CUBE_THEMES: CubeTheme[] = [
  {
    id: 'classic_uv',
    name: 'GAN UV Coated (Ultra Realistis)',
    bodyColor: '#0f1115',
    colors: {
      U: '#FFFFFF', // Putih Murni
      D: '#FFD700', // Kuning Kompetisi
      L: '#FF5400', // Oranye Terang
      R: '#D90429', // Merah Ruby
      F: '#00A86B', // Hijau Zamrud
      B: '#005BBB', // Biru Kobalt
    },
    roughness: 0.12,
    metalness: 0.02,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    ior: 1.54,
    hasLogo: true,
    bumpScale: 0.008,
  },
  {
    id: 'frosted',
    name: 'Frosted Soft-Touch (Moyu)',
    bodyColor: '#F8FAFC',
    colors: {
      U: '#F8FAFC',
      D: '#FACC15',
      L: '#FB923C',
      R: '#EF4444',
      F: '#22C55E',
      B: '#3B82F6',
    },
    roughness: 0.42,
    metalness: 0.0,
    clearcoat: 0.2,
    clearcoatRoughness: 0.45,
    ior: 1.48,
    hasLogo: true,
    bumpScale: 0.025,
  },
  {
    id: 'carbon',
    name: 'Carbon Fiber Pro (Serat Karbon)',
    bodyColor: '#0a0b0d',
    colors: {
      U: '#F1F5F9',
      D: '#FBBF24',
      L: '#F97316',
      R: '#DC2626',
      F: '#10B981',
      B: '#2563EB',
    },
    roughness: 0.24,
    metalness: 0.35,
    clearcoat: 0.85,
    clearcoatRoughness: 0.12,
    ior: 1.58,
    isCarbon: true,
    hasLogo: true,
  },
  {
    id: 'luxury_gold',
    name: '24K Gold & Obsidian Luxury',
    bodyColor: '#050507',
    colors: {
      U: '#FFFDF0', // Platinum White
      D: '#E5A93C', // 24K Deep Gold
      L: '#D97706', // Brushed Amber Gold
      R: '#B91C1C', // Metallic Ruby
      F: '#047857', // Emerald Jewel
      B: '#1D4ED8', // Sapphire Jewel
    },
    roughness: 0.16,
    metalness: 0.88,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
    ior: 1.82,
    isGold: true,
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon Glow',
    bodyColor: '#06070a',
    colors: {
      U: '#FFFFFF',
      D: '#FFE600',
      L: '#FF0055',
      R: '#00F0FF',
      F: '#39FF14',
      B: '#8B5CF6',
    },
    roughness: 0.12,
    metalness: 0.3,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    ior: 1.55,
    emission: true,
  },
];

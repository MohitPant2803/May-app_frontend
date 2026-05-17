import { create } from 'zustand';

export type ForestMode = 'early_morning' | 'golden_morning' | 'sunset' | 'midnight' | 'rainy';

export const forestPalettes: Record<ForestMode, string[]> = {
  early_morning: ['#1A1A2E', '#B0C4DE', '#E6E6FA'],
  golden_morning: ['#FF7E5F', '#FEB47B', '#FFD700'],
  sunset: ['#2B0F4C', '#FF4500', '#DDA0DD'],
  midnight: ['#0B0B1A', '#191970', '#2F4F4F'],
  rainy: ['#2F4F4F', '#5F9EA0', '#708090'],
};

interface EnvState {
  mode: ForestMode;
  setMode: (mode: ForestMode) => void;
}

export const useEnvStore = create<EnvState>((set) => ({
  mode: 'midnight', // Default mode
  setMode: (mode) => set({ mode }),
}));

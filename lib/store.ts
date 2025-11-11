/**
 * Global State Management using Zustand
 */

import { create } from 'zustand';
import type { 
  ImageGenerationResult, 
  VideoGenerationResult,
  GenerationStatus 
} from '@/types';

// Image Generation Store
interface ImageGenerationStore {
  results: ImageGenerationResult[];
  currentStatus: GenerationStatus;
  currentProgress: number;
  statusMessage: string;
  addResult: (result: ImageGenerationResult) => void;
  setStatus: (status: GenerationStatus, progress: number, message?: string) => void;
  clearResults: () => void;
}

export const useImageGenerationStore = create<ImageGenerationStore>((set) => ({
  results: [],
  currentStatus: 'idle',
  currentProgress: 0,
  statusMessage: '',
  addResult: (result) => set((state) => ({ 
    results: [result, ...state.results] 
  })),
  setStatus: (status, progress, message = '') => set({ 
    currentStatus: status, 
    currentProgress: progress,
    statusMessage: message 
  }),
  clearResults: () => set({ results: [] }),
}));

// User Credits Store
interface CreditsStore {
  credits: number;
  setCredits: (credits: number) => void;
  deductImageCredit: () => boolean;
  deductVideoCredit: () => boolean;
}

export const useCreditsStore = create<CreditsStore>((set, get) => ({
  credits: 0,
  setCredits: (credits) => set({ credits }),
  deductImageCredit: () => {
    const current = get().credits;
    if (current >= 1) {
      set({ credits: current - 1 });
      return true;
    }
    return false;
  },
  deductVideoCredit: () => {
    const current = get().credits;
    if (current >= 10) {
      set({ credits: current - 10 });
      return true;
    }
    return false;
  },
}));



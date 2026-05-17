import { create } from 'zustand';

export type Emotion = 'calm' | 'happy' | 'anxious' | 'sad';

export interface DiaryEntry {
  id: string;
  date: string;
  mood: Emotion;
  summary: string;
  transcript: string;
  insights: string[];
}

interface AppState {
  entries: DiaryEntry[];
  isRecording: boolean;
  setRecording: (isRecording: boolean) => void;
  addEntry: (entry: DiaryEntry) => void;
}

const dummyEntries: DiaryEntry[] = [
  {
    id: '1',
    date: new Date(Date.now() - 86400000).toISOString(),
    mood: 'calm',
    summary: 'A peaceful evening reading by the window.',
    transcript: "I just sat by the window today and read. It was really quiet, just what I needed. Nothing much happened, but it felt good to just be still for a bit.",
    insights: ["You find peace in quiet, solitary activities.", "Taking time to disconnect is a healthy pattern."],
  },
  {
    id: '2',
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    mood: 'anxious',
    summary: 'Felt a bit overwhelmed with work deadlines today.',
    transcript: "Work is just piling up. I don't know how I'm going to finish everything by Friday. My chest feels a bit tight just thinking about it.",
    insights: ["Workload is a primary trigger for your anxiety.", "Consider breaking tasks into smaller steps."],
  },
  {
    id: '3',
    date: new Date(Date.now() - 86400000 * 4).toISOString(),
    mood: 'happy',
    summary: 'Had a wonderful coffee chat with an old friend.',
    transcript: "I saw Sarah today! It's been months. We just laughed about old times at the coffee shop. I feel so refreshed and grateful for her friendship.",
    insights: ["Social connection significantly boosts your mood.", "Prioritize catching up with friends more often."],
  }
];

export const useStore = create<AppState>((set) => ({
  entries: dummyEntries,
  isRecording: false,
  setRecording: (isRecording) => set({ isRecording }),
  addEntry: (entry) => set((state) => ({ entries: [entry, ...state.entries] })),
}));

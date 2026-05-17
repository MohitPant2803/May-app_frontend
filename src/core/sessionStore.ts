import { create } from 'zustand';

export type SessionStatus = 
  | 'idle' 
  | 'listening' 
  | 'paused' 
  | 'thinking' 
  | 'speaking' 
  | 'prompting_continue'
  | 'cooldown';

const MOCK_PAUSE = ["Hmm... I'm following so far.", "Take your time.", "I'm thinking about what you said.", "Wait... I think I almost get it."];
const MOCK_THINKING = ["Processing...", "Let me think...", "Hmm, interesting...", "Piecing it together..."];
const MOCK_QUESTIONS = [
  "Wait... why does that happen?", 
  "I think I understand recursion now, but how does it stop?", 
  "So the stack remembers previous calls?", 
  "Can you explain that part differently?"
];

let thinkingTimeout: NodeJS.Timeout | null = null;

export type MoodTheme = 'Lavender Calm' | 'Midnight Focus' | 'Rainy Evening' | 'Forest Silence' | 'Warm Sunset';
export type Personality = 'Curious' | 'Calm' | 'Energetic' | 'Gentle Teacher';
export type SessionMode = 'Learn Slowly' | 'Deep Focus' | 'Quick Revision' | 'Reflection';

export interface NimoNote {
  id: string;
  text: string;
  icon: string;
}

export interface SessionHistory {
  id: string;
  date: string;
  topic: string;
  duration: string;
  mood: string;
  aiNotes: string[];
  aiInsights: string[];
}

export type PlacardType = 'breakthrough' | 'consistency' | 'curiosity' | 'confidence' | 'reflection';

export interface Placard {
  id: string;
  type: PlacardType;
  text: string;
}

export interface RevisionAnalysis {
  topic: string;
  explainedWell: string[];
  struggledWith: string[];
  revisionFocus: string[];
  nimoDoubts: string[];
  summary: string;
  placard: Placard;
}

export type ActiveOverlay = 'none' | 'timeline' | 'profile';

interface SessionState {
  status: SessionStatus;
  roundCount: number;
  dialogueText: string;
  
  // Settings
  theme: MoodTheme;
  sound: string;
  personality: Personality;
  sessionMode: SessionMode;
  askMoreQuestions: boolean;
  
  // Mock Journal Data
  nimoNotes: NimoNote[];
  sessionHistory: SessionHistory[];
  
  // Current Post-Session Reflection
  currentReflection: RevisionAnalysis | null;
  
  activeOverlay: ActiveOverlay;
  
  // App State
  isIntroComplete: boolean;

  // Actions
  startListening: () => void;
  pauseListening: () => void;
  stopListening: () => void;
  setSpeaking: () => void;
  triggerCooldown: () => void;
  endSession: () => void;
  completeIntro: () => void;
  
  // Settings Actions
  updateSetting: (key: keyof SessionState, value: any) => void;
  setActiveOverlay: (overlay: ActiveOverlay) => void;
  updateSessionTopic: (id: string, newTopic: string) => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  status: 'idle',
  roundCount: 0,
  dialogueText: '',
  
  currentReflection: null,

  activeOverlay: 'none',
  
  isIntroComplete: false,
  completeIntro: () => set({ isIntroComplete: true }),

  theme: 'Lavender Calm',
  sound: 'Forest Wind',
  personality: 'Curious',
  sessionMode: 'Learn Slowly',
  askMoreQuestions: true,

  nimoNotes: [
    { id: '1', text: 'May thinks you explain best using real-world examples.', icon: '💡' },
    { id: '2', text: 'You sounded much more confident today!', icon: '✨' },
    { id: '3', text: 'You paused less during this session.', icon: '🌱' },
  ],

  sessionHistory: [
    {
      id: 's1',
      date: '16 May 2026',
      topic: 'Recursion & Call Stacks',
      duration: '18 min',
      mood: 'Curious Session',
      aiNotes: [
        "Recursion solves smaller versions of the same problem.",
        "The base case prevents infinite calls.",
        "Each recursive call waits in the stack."
      ],
      aiInsights: [
        "Needs more revision on stack unwinding.",
        "You seemed more confident using examples.",
      ],
    },
    {
      id: 's2',
      date: '16 May 2026',
      topic: 'Binary Search Trees',
      duration: '25 min',
      mood: 'Focused Session',
      aiNotes: [
        "Left child is smaller, right child is larger.",
        "Searching takes O(log n) time if balanced.",
      ],
      aiInsights: [
        "You explained the insertion rule perfectly.",
        "You struggled slightly with tree balancing concepts."
      ],
    },
    {
      id: 's3',
      date: '15 May 2026',
      topic: 'Operating System Scheduling',
      duration: '40 min',
      mood: 'Patient Session',
      aiNotes: [
        "The OS uses a scheduler to switch between processes.",
        "Round Robin gives every process a fair time slice."
      ],
      aiInsights: [
        "You paused frequently when describing context switches.",
      ],
    },
    {
      id: 's4',
      date: '14 May 2026',
      topic: 'Dynamic Programming',
      duration: '30 min',
      mood: 'Breakthrough Session',
      aiNotes: [
        "Dynamic programming saves previously computed results (memoization).",
        "It prevents calculating the same subproblem twice."
      ],
      aiInsights: [
        "The concept finally clicked for you today!",
        "You were highly energetic while explaining memoization."
      ],
    }
  ],

  updateSetting: (key, value) => set({ [key]: value }),
  setActiveOverlay: (overlay) => set({ activeOverlay: overlay }),
  updateSessionTopic: (id, newTopic) => set((state) => ({
    sessionHistory: state.sessionHistory.map(session => 
      session.id === id ? { ...session, topic: newTopic } : session
    )
  })),

  startListening: () => {
    if (thinkingTimeout) clearTimeout(thinkingTimeout);
    set((state) => ({ 
      status: 'listening', 
      roundCount: state.status === 'idle' ? 1 : state.roundCount,
      dialogueText: ''
    }));
  },
  
  pauseListening: () => {
    // User taps center button to pause -> Nimo processes and asks a question
    if (thinkingTimeout) clearTimeout(thinkingTimeout);
    set({ 
      status: 'thinking',
      dialogueText: MOCK_THINKING[Math.floor(Math.random() * MOCK_THINKING.length)]
    });
    
    thinkingTimeout = setTimeout(() => {
      set({ 
        status: 'speaking',
        dialogueText: MOCK_QUESTIONS[Math.floor(Math.random() * MOCK_QUESTIONS.length)]
      });
    }, 2500 + Math.random() * 1500);
  },
  
  stopListening: () => { /* Deprecated by UI confirmation overlay */ },

  setSpeaking: () => set({ status: 'speaking' }),
  
  triggerCooldown: () => {
    if (thinkingTimeout) clearTimeout(thinkingTimeout);
    set({ 
      status: 'cooldown',
      dialogueText: "You did so well today. Let's look at our notes.",
      currentReflection: {
        topic: 'Recursion & Call Stacks',
        explainedWell: [
          "The concept of functions calling themselves.",
          "Using the Russian Dolls analogy."
        ],
        struggledWith: [
          "Explaining the Base Case clearly.",
          "How memory is freed when recursion unwinds."
        ],
        revisionFocus: ["Base Cases", "Stack Overflow Errors"],
        nimoDoubts: ["Wait, how does it know when to stop?"],
        summary: "Recursion is a process where a function calls itself. It requires a base case to prevent infinite loops (Stack Overflows).",
        placard: { id: 'p1', type: 'breakthrough', text: 'Today recursion finally clicked.' }
      }
    });
  },
  
  endSession: () => {
    if (thinkingTimeout) clearTimeout(thinkingTimeout);
    set({ status: 'idle', roundCount: 0, dialogueText: '', currentReflection: null });
  },
}));
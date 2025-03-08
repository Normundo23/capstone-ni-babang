export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  participationCount: number;
  lastParticipation: Date | null;
  rank: number;
  totalScore: number;
  classRecords: Record<string, ClassRecord>;
  sectionId: string | null;
  protected: boolean;
}

export interface Section {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
}

export interface ClassRecord {
  participationCount: number;
  lastParticipation: Date | null;
  rank: number;
  totalScore: number;
}

export interface ParticipationRecord {
  id: string;
  studentId: string;
  timestamp: Date;
  duration: number;
  quality: ParticipationQuality;
  keywords: string[];
  confidence: number;
  classId: string;
}

export type ParticipationQuality = {
  keyword: string;
  color: string;
  score: number;
  description: string;
  voiceCommands: string[];
};

export const PARTICIPATION_QUALITIES: ParticipationQuality[] = [
  { 
    keyword: "Excellent", 
    color: "text-emerald-600 dark:text-emerald-400", 
    score: 5, 
    description: "Outstanding contribution",
    voiceCommands: ["excellent", "outstanding", "perfect", "brilliant", "amazing"]
  },
  { 
    keyword: "Good Analysis", 
    color: "text-blue-600 dark:text-blue-400", 
    score: 4, 
    description: "Well-reasoned response",
    voiceCommands: ["good analysis", "well reasoned", "analytical", "thoughtful", "insightful"]
  },
  { 
    keyword: "Critical Thinking", 
    color: "text-purple-600 dark:text-purple-400", 
    score: 4, 
    description: "Deep analytical insight",
    voiceCommands: ["critical thinking", "critical", "deep analysis", "complex", "thorough"]
  },
  { 
    keyword: "Creative Input", 
    color: "text-indigo-600 dark:text-indigo-400", 
    score: 4, 
    description: "Innovative perspective",
    voiceCommands: ["creative", "innovative", "original", "unique", "imaginative"]
  },
  { 
    keyword: "Basic Response", 
    color: "text-amber-600 dark:text-amber-400", 
    score: 2, 
    description: "Simple contribution",
    voiceCommands: ["basic", "simple", "standard", "okay", "fair"]
  },
  { 
    keyword: "Off Topic", 
    color: "text-red-600 dark:text-red-400", 
    score: 1, 
    description: "Unrelated to discussion",
    voiceCommands: ["off topic", "unrelated", "irrelevant", "distracted", "unfocused"]
  }
];

export type NameDetectionMode = 'firstName' | 'lastName' | 'both';

export interface Settings {
  nameDetectionMode: NameDetectionMode;
  theme: 'light' | 'dark' | 'system';
}

export interface AudioDevice {
  deviceId: string;
  label: string;
  type: string;
  connected: boolean;
  capabilities?: MediaTrackCapabilities;
}

export interface NotificationPreferences {
  participationAlerts: boolean;
  lowParticipationAlerts: boolean;
  rankingChanges: boolean;
  audioDeviceAlerts: boolean;
  minTimeBetweenAlerts: number;
}

export interface Class {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
}

export interface VoiceCommand {
  command: string;
  action: () => void;
}

export const VOICE_COMMANDS = {
  START_RECORDING: [
    'start recording',
    'begin recording',
    'start tracking',
    'begin tracking',
    'start monitoring',
    'begin monitoring'
  ],
  STOP_RECORDING: [
    'stop recording',
    'end recording',
    'stop tracking',
    'end tracking',
    'stop monitoring',
    'end monitoring'
  ],
  PARTICIPATION_TRIGGERS: [
    'participates',
    'answers',
    'responds',
    'contributes',
    'shares',
    'asks',
    'comments',
    'explains',
    'discusses',
    'presents'
  ]
};
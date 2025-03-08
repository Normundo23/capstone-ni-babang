import { PARTICIPATION_QUALITIES } from '../types';

export const findQualityFromVoiceCommand = (transcript: string): typeof PARTICIPATION_QUALITIES[number] | null => {
  const words = transcript.toLowerCase().split(' ');
  
  for (const quality of PARTICIPATION_QUALITIES) {
    // Check exact quality keyword match
    if (transcript.toLowerCase().includes(quality.keyword.toLowerCase())) {
      return quality;
    }
    
    // Check voice command matches
    for (const command of quality.voiceCommands) {
      if (transcript.toLowerCase().includes(command.toLowerCase())) {
        return quality;
      }
    }
  }
  
  return null;
};

export const findStudentNameInTranscript = (
  transcript: string,
  students: { firstName: string; lastName: string }[],
  mode: 'firstName' | 'lastName' | 'both'
): { firstName: string; lastName: string } | null => {
  const words = transcript.toLowerCase().split(' ');
  
  for (const student of students) {
    const firstName = student.firstName.toLowerCase();
    const lastName = student.lastName.toLowerCase();
    
    switch (mode) {
      case 'firstName':
        if (words.includes(firstName)) {
          return student;
        }
        break;
      case 'lastName':
        if (words.includes(lastName)) {
          return student;
        }
        break;
      case 'both':
        // Check for full name in any order
        if (transcript.toLowerCase().includes(`${firstName} ${lastName}`) ||
            transcript.toLowerCase().includes(`${lastName} ${firstName}`)) {
          return student;
        }
        break;
    }
  }
  
  return null;
};

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
  ],
};

export const matchVoiceCommand = (transcript: string, commands: string[]): boolean => {
  const normalizedTranscript = transcript.toLowerCase().trim();
  return commands.some(command => normalizedTranscript.includes(command.toLowerCase()));
};
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useStore } from '../store';
import { findQualityFromVoiceCommand, findStudentNameInTranscript, VOICE_COMMANDS, matchVoiceCommand } from '../utils/voiceCommands';
import { PARTICIPATION_QUALITIES } from '../types';
import { toast } from 'react-hot-toast';

export const VoiceRecognition: React.FC = () => {
  const { 
    students, 
    recordParticipation, 
    settings,
    isTracking,
    startTracking,
    stopTracking,
    currentClassId
  } = useStore();
  const [recognition, setRecognition] = useState<any>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 1000; // 1 second

  const handleVoiceResult = useCallback((transcript: string) => {
    // Check for start/stop commands
    if (matchVoiceCommand(transcript, VOICE_COMMANDS.START_RECORDING)) {
      if (!currentClassId) {
        toast.error('Please select a class first');
        return;
      }
      startTracking();
      toast.success('Started tracking participation');
      return;
    }

    if (matchVoiceCommand(transcript, VOICE_COMMANDS.STOP_RECORDING)) {
      stopTracking();
      toast.success('Stopped tracking participation');
      return;
    }

    if (!isTracking || !currentClassId) return;

    // Look for participation triggers
    if (VOICE_COMMANDS.PARTICIPATION_TRIGGERS.some(trigger => transcript.includes(trigger))) {
      const student = findStudentNameInTranscript(transcript, students, settings.nameDetectionMode);
      if (student) {
        const quality = findQualityFromVoiceCommand(transcript) || PARTICIPATION_QUALITIES[0];
        const studentRecord = students.find(
          s => s.firstName.toLowerCase() === student.firstName.toLowerCase() && 
             s.lastName.toLowerCase() === student.lastName.toLowerCase()
        );
        
        if (studentRecord) {
          recordParticipation(
            studentRecord.id,
            60,
            quality,
            transcript.split(' '),
            0.8
          );
          toast.success(`Recorded ${quality.keyword} participation for ${student.firstName}`);
        }
      }
    }
  }, [students, recordParticipation, settings.nameDetectionMode, isTracking, currentClassId, startTracking, stopTracking]);

  const initializeRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window)) {
      console.warn('Speech recognition is not supported in this browser');
      return null;
    }

    const SpeechRecognition = window.webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = 'en-US';

    // Increase recognition stability
    recognitionInstance.maxAlternatives = 1;
    recognitionInstance.interimResults = false;

    return recognitionInstance;
  }, []);

  const startRecognition = useCallback(() => {
    if (!recognition) return;

    recognition.onstart = () => {
      console.log('Voice recognition started');
      reconnectAttempts.current = 0; // Reset reconnect attempts on successful start
    };

    recognition.onend = () => {
      console.log('Voice recognition ended');
      // Only attempt to restart if we're supposed to be tracking
      if (isTracking) {
        try {
          recognition.start();
        } catch (error) {
          console.error('Failed to restart recognition:', error);
          handleRecognitionError();
        }
      }
    };

    recognition.onresult = (event: any) => {
      const results = Array.from(event.results);
      for (const result of results) {
        if (result.isFinal) {
          const transcript = result[0].transcript.toLowerCase();
          handleVoiceResult(transcript);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      handleRecognitionError(event.error);
    };

    try {
      recognition.start();
    } catch (error) {
      console.error('Failed to start recognition:', error);
      handleRecognitionError();
    }
  }, [recognition, isTracking, handleVoiceResult]);

  const handleRecognitionError = useCallback((error?: string) => {
    if (error === 'not-allowed') {
      toast.error('Microphone access denied. Please check your browser permissions.');
      return;
    }

    // Clear any existing reconnection timeout
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }

    // Attempt to reconnect if we haven't exceeded the maximum attempts
    if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts.current++;
      
      reconnectTimeout.current = setTimeout(() => {
        console.log(`Attempting to reconnect (${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS})...`);
        
        // Reinitialize recognition
        const newRecognition = initializeRecognition();
        if (newRecognition) {
          setRecognition(newRecognition);
          startRecognition();
        }
      }, RECONNECT_DELAY * reconnectAttempts.current); // Exponential backoff
    } else {
      toast.error('Voice recognition failed to connect. Please refresh the page.');
    }
  }, [initializeRecognition, startRecognition]);

  // Initialize recognition on component mount
  useEffect(() => {
    const newRecognition = initializeRecognition();
    if (newRecognition) {
      setRecognition(newRecognition);
    }

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (recognition) {
        recognition.stop();
      }
    };
  }, [initializeRecognition]);

  // Start/stop recognition based on tracking state
  useEffect(() => {
    if (!recognition) return;

    if (isTracking) {
      startRecognition();
    } else {
      recognition.stop();
    }
  }, [isTracking, recognition, startRecognition]);

  return null;
};
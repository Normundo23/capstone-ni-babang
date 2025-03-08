import React, { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, Volume2, AlertCircle, RefreshCw, Settings, Activity, WifiOff } from 'lucide-react';
import { useStore } from '../store';
import { PARTICIPATION_QUALITIES, AudioDevice } from '../types';
import * as tf from '@tensorflow/tfjs';
import * as speechCommands from '@tensorflow-models/speech-commands';
import { toast } from 'react-hot-toast';

interface AudioTrackerProps {
  selectedDevice?: AudioDevice;
  onDeviceSelect?: (device: AudioDevice) => void;
}

export const AudioTracker: React.FC<AudioTrackerProps> = ({ selectedDevice, onDeviceSelect }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [permissionError, setPermissionError] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [model, setModel] = useState<speechCommands.SpeechCommandRecognizer | null>(null);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [noiseLevel, setNoiseLevel] = useState(0);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'unstable'>('disconnected');
  const [signalStrength, setSignalStrength] = useState(0);
  const refreshInterval = useRef<number>();
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const signalCheckInterval = useRef<number>();
  const { students, recordParticipation, isTracking, startTracking, stopTracking, settings } = useStore();

  const REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes
  const CALIBRATION_DURATION = 5000; // 5 seconds
  const NOISE_THRESHOLD = 0.15; // 15% above baseline
  const SIGNAL_CHECK_INTERVAL = 1000; // 1 second

  const initializeModel = async () => {
    try {
      await tf.ready();
      
      const recognizer = speechCommands.create(
        'BROWSER_FFT',
        undefined,
        undefined,
        undefined,
        undefined,
        {
          enableAudioTrackConstraints: true,
          sampleRateHz: 44100,
          fftSize: 1024
        }
      );

      await recognizer.ensureModelLoaded();
      console.log('Speech commands model loaded successfully');
      
      setModel(recognizer);
    } catch (err) {
      console.error('Failed to load speech commands model:', err);
      toast.error('Failed to initialize speech recognition. Please refresh the page.');
    }
  };

  const checkSignalStrength = () => {
    if (!analyzerRef.current || !isListening) return;

    const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
    analyzerRef.current.getByteFrequencyData(dataArray);
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    
    // Calculate signal strength (0-100)
    const strength = Math.min(100, (average / 128) * 100);
    setSignalStrength(strength);

    // Update connection status based on signal strength
    if (strength > 60) {
      setConnectionStatus('connected');
    } else if (strength > 30) {
      setConnectionStatus('unstable');
    } else {
      setConnectionStatus('disconnected');
    }
  };

  const calibrateAudio = async () => {
    if (!audioContext || !analyzerRef.current) return;

    setIsCalibrating(true);
    toast.loading('Calibrating microphone...', { duration: CALIBRATION_DURATION });

    const samples: number[] = [];
    const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
    
    const sampleInterval = setInterval(() => {
      analyzerRef.current?.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      samples.push(average);
    }, 100);

    await new Promise(resolve => setTimeout(resolve, CALIBRATION_DURATION));
    clearInterval(sampleInterval);

    const baselineNoise = samples.reduce((a, b) => a + b) / samples.length;
    setNoiseLevel(baselineNoise);
    setIsCalibrating(false);

    toast.success('Microphone calibrated successfully');
    return baselineNoise;
  };

  const refreshVoiceDetection = async () => {
    if (!isListening) return;

    toast.loading('Refreshing voice detection...', { duration: 2000 });
    
    // Temporarily stop recognition
    recognition?.stop();
    
    // Recalibrate
    await calibrateAudio();
    
    // Restart recognition
    recognition?.start();
    setLastRefresh(Date.now());
    
    toast.success('Voice detection refreshed');
  };

  useEffect(() => {
    initializeModel();
    return () => {
      if (model) {
        model.stopListening();
      }
    };
  }, []);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      toast.error('Speech recognition is not supported in this browser');
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;

    recognitionInstance.onresult = async (event: any) => {
      if (!isTracking) return;

      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript.toLowerCase())
        .join(' ');

      // Check noise level
      if (analyzerRef.current) {
        const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
        analyzerRef.current.getByteFrequencyData(dataArray);
        const currentLevel = dataArray.reduce((a, b) => a + b) / dataArray.length;

        if (currentLevel > noiseLevel * (1 + NOISE_THRESHOLD)) {
          console.log('Voice detected above noise threshold');
        }
      }

      for (const student of students) {
        let nameMatch = false;

        switch (settings.nameDetectionMode) {
          case 'firstName':
            nameMatch = transcript.includes(student.firstName.toLowerCase());
            break;
          case 'lastName':
            nameMatch = transcript.includes(student.lastName.toLowerCase());
            break;
          case 'both':
          default:
            nameMatch = transcript.includes(`${student.firstName.toLowerCase()} ${student.lastName.toLowerCase()}`);
            break;
        }

        if (nameMatch) {
          const detectedKeywords = transcript.split(' ');
          const matchedQuality = PARTICIPATION_QUALITIES.find(quality =>
            transcript.includes(quality.keyword.toLowerCase())
          ) || PARTICIPATION_QUALITIES[0];

          let confidence = 0.8;
          if (model) {
            try {
              const result = await model.recognize();
              confidence = Math.max(...result.scores);
            } catch (err) {
              console.warn('Could not get confidence score:', err);
            }
          }

          await recordParticipation(
            student.id,
            60,
            matchedQuality,
            detectedKeywords,
            confidence
          );
        }
      }
    };

    recognitionInstance.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setPermissionError(true);
        toast.error('Microphone access denied');
      }
      setIsListening(false);
      setConnectionStatus('disconnected');
    };

    setRecognition(recognitionInstance);

    return () => {
      if (recognition) {
        recognition.stop();
      }
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [students, recordParticipation, isTracking, settings.nameDetectionMode]);

  const toggleListening = async () => {
    if (isListening) {
      recognition?.stop();
      stopTracking();
      setIsListening(false);
      setConnectionStatus('disconnected');
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
      if (signalCheckInterval.current) {
        clearInterval(signalCheckInterval.current);
      }
    } else {
      try {
        const constraints = {
          audio: {
            deviceId: selectedDevice ? { exact: selectedDevice.deviceId } : undefined,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        const context = new AudioContext();
        const source = context.createMediaStreamSource(stream);
        const analyzer = context.createAnalyser();
        analyzer.fftSize = 2048;
        source.connect(analyzer);
        analyzerRef.current = analyzer;
        setAudioContext(context);
        
        await calibrateAudio();
        
        recognition?.start();
        setIsListening(true);
        setPermissionError(false);
        setConnectionStatus('connected');
        toast.success(`Started listening${selectedDevice ? ` using ${selectedDevice.label}` : ''}`);

        // Set up periodic refresh
        refreshInterval.current = window.setInterval(() => {
          refreshVoiceDetection();
        }, REFRESH_INTERVAL);

        // Set up signal strength monitoring
        signalCheckInterval.current = window.setInterval(() => {
          checkSignalStrength();
        }, SIGNAL_CHECK_INTERVAL);
      } catch (err) {
        console.error(err);
        setPermissionError(true);
        setConnectionStatus('disconnected');
        toast.error('Failed to access microphone');
      }
    }
  };

  useEffect(() => {
    if (isListening) {
      toggleListening();
    }
    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
      if (signalCheckInterval.current) {
        clearInterval(signalCheckInterval.current);
      }
    };
  }, [selectedDevice]);

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Activity size={20} className="text-green-500" />;
      case 'unstable':
        return <Activity size={20} className="text-yellow-500" />;
      case 'disconnected':
        return <WifiOff size={20} className="text-red-500" />;
    }
  };

  return (
    <div className="fixed bottom-6 right-6 flex gap-2">
      {isListening && (
        <button
          onClick={refreshVoiceDetection}
          className="p-4 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 transition-colors"
          title="Refresh voice detection"
          disabled={isCalibrating}
        >
          <RefreshCw size={24} className={isCalibrating ? 'animate-spin' : ''} />
        </button>
      )}
      
      <button
        onClick={toggleListening}
        className={`p-4 rounded-full shadow-lg transition-colors ${
          isListening 
            ? 'bg-red-500 hover:bg-red-600 text-white' 
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
        title={isListening ? 'Stop listening' : 'Start listening'}
        disabled={!selectedDevice || isCalibrating}
      >
        {isListening ? <MicOff size={24} /> : <Mic size={24} />}
      </button>

      {permissionError && (
        <div className="absolute bottom-full mb-2 right-0 bg-red-50 p-4 rounded-lg shadow-lg max-w-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
            <div>
              <h3 className="text-sm font-medium text-red-800">Microphone Access Required</h3>
              <p className="text-sm text-red-700 mt-1">
                Please allow microphone access to use the audio tracking feature.
              </p>
            </div>
          </div>
        </div>
      )}

      {isListening && !permissionError && (
        <div className="absolute bottom-full mb-2 right-0 bg-white p-4 rounded-lg shadow-lg">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {getConnectionStatusIcon()}
                <span className="text-sm font-medium">
                  {connectionStatus === 'connected' && 'Connected'}
                  {connectionStatus === 'unstable' && 'Unstable Connection'}
                  {connectionStatus === 'disconnected' && 'Disconnected'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Volume2 className={`text-green-500 ${signalStrength > 30 ? 'animate-pulse' : ''}`} size={20} />
                <span className="text-sm text-gray-500">{Math.round(signalStrength)}%</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-gray-500">
                Device: {selectedDevice?.label || 'Unknown'}
              </div>
              <div className="text-xs text-gray-500">
                Last refresh: {new Date(lastRefresh).toLocaleTimeString()}
              </div>
              {noiseLevel > 0 && (
                <div className="text-xs text-gray-500">
                  Noise baseline: {Math.round(noiseLevel)}
                </div>
              )}
            </div>
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  connectionStatus === 'connected' ? 'bg-green-500' :
                  connectionStatus === 'unstable' ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${signalStrength}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { Mic, MicOff, RefreshCw, Settings2, Bluetooth, Volume2, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { notificationManager } from '../utils/notifications';
import { AudioTracker } from './AudioTracker';

interface AudioDevice {
  deviceId: string;
  label: string;
  type: string;
  connected: boolean;
  capabilities?: MediaTrackCapabilities;
}

export const BluetoothManager: React.FC = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<AudioDevice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDeviceList, setShowDeviceList] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const getDeviceType = (label: string, capabilities?: MediaTrackCapabilities): string => {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('bluetooth')) return 'bluetooth';
    if (lowerLabel.includes('wireless')) return 'wireless';
    if (lowerLabel.includes('usb')) return 'usb';
    if (lowerLabel.includes('array') || capabilities?.echoCancellation) return 'array';
    return 'wired';
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'bluetooth':
        return <Bluetooth size={16} className="text-blue-500" />;
      case 'wireless':
        return <Volume2 size={16} className="text-green-500" />;
      case 'array':
        return <Mic size={16} className="text-purple-500" />;
      default:
        return <Mic size={16} className="text-gray-500" />;
    }
  };

  const enumerateDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = await Promise.all(
        devices
          .filter(device => device.kind === 'audioinput')
          .map(async device => {
            let capabilities;
            try {
              const stream = await navigator.mediaDevices.getUserMedia({
                audio: { deviceId: { exact: device.deviceId } }
              });
              const track = stream.getAudioTracks()[0];
              capabilities = track.getCapabilities();
              track.stop();
            } catch (err) {
              console.warn(`Could not get capabilities for device ${device.label}:`, err);
            }

            return {
              deviceId: device.deviceId,
              label: device.label || 'Unnamed Device',
              type: getDeviceType(device.label, capabilities),
              connected: true,
              capabilities
            };
          })
      );
      setAudioDevices(audioInputs);
    } catch (err: any) {
      setError('Failed to enumerate audio devices');
      console.error(err);
    }
  };

  useEffect(() => {
    enumerateDevices();
    navigator.mediaDevices.addEventListener('devicechange', enumerateDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', enumerateDevices);
    };
  }, []);

  const startDeviceMonitoring = async (device: AudioDevice) => {
    if (!device.deviceId) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: device.deviceId },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 2048;
      source.connect(analyzer);

      const bufferLength = analyzer.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      let lastActiveTime = Date.now();
      const checkAudio = () => {
        if (!isMonitoring) return;
        
        analyzer.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        
        if (average > 30) {
          lastActiveTime = Date.now();
        } else if (Date.now() - lastActiveTime > 30000) {
          notificationManager.notifyAudioDevice(`No audio detected from ${device.label} for 30 seconds`);
          toast.warn(`No audio detected from ${device.label}. Please check the connection.`);
        }
        
        requestAnimationFrame(checkAudio);
      };

      setIsMonitoring(true);
      checkAudio();

      return () => {
        stream.getTracks().forEach(track => track.stop());
        audioContext.close();
        setIsMonitoring(false);
      };
    } catch (err) {
      console.error('Error monitoring device:', err);
      notificationManager.notifyAudioDevice(`Failed to monitor ${device.label}`);
    }
  };

  const connectToDevice = async (device: AudioDevice) => {
    try {
      setIsConnecting(true);
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: device.deviceId },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyzer = audioContext.createAnalyser();
      source.connect(analyzer);

      setSelectedDevice(device);
      setShowDeviceList(false);
      
      notificationManager.notifyAudioDevice(`Connected to ${device.label}`);
      toast.success(`Connected to ${device.label}`);

      startDeviceMonitoring(device);
    } catch (err: any) {
      setError(`Failed to connect to device: ${err.message}`);
      notificationManager.notifyAudioDevice(`Failed to connect to ${device.label}`);
      console.error(err);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectDevice = () => {
    if (selectedDevice) {
      notificationManager.notifyAudioDevice(`Disconnected from ${selectedDevice.label}`);
      toast.success(`Disconnected from ${selectedDevice.label}`);
    }
    setSelectedDevice(null);
    setIsMonitoring(false);
  };

  const refreshDevices = async () => {
    setIsConnecting(true);
    await enumerateDevices();
    setIsConnecting(false);
  };

  return (
    <>
      <AudioTracker selectedDevice={selectedDevice || undefined} />
      <div className="fixed bottom-6 left-6">
        {error && (
          <div className="absolute bottom-full mb-2 left-0 bg-red-50 p-3 rounded-lg shadow-lg max-w-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-red-500" size={16} />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {showDeviceList && (
          <div className="absolute bottom-full mb-2 left-0 bg-white p-4 rounded-lg shadow-lg min-w-[300px]">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">Audio Input Devices</h3>
              <button
                onClick={refreshDevices}
                className="p-1 hover:bg-gray-100 rounded-full"
                title="Refresh devices"
              >
                <RefreshCw size={16} className={isConnecting ? 'animate-spin' : ''} />
              </button>
            </div>
            <div className="space-y-2">
              {audioDevices.map(device => (
                <button
                  key={device.deviceId}
                  onClick={() => connectToDevice(device)}
                  className="w-full text-left p-2 hover:bg-gray-50 rounded-lg flex items-center gap-3"
                >
                  {getDeviceIcon(device.type)}
                  <div className="flex-1">
                    <p className="font-medium">{device.label}</p>
                    <p className="text-xs text-gray-500 capitalize">{device.type}</p>
                  </div>
                  {device.deviceId === selectedDevice?.deviceId && (
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                  )}
                </button>
              ))}
              {audioDevices.length === 0 && (
                <p className="text-sm text-gray-500">No audio devices found</p>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          {selectedDevice ? (
            <>
              <div className="bg-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                {getDeviceIcon(selectedDevice.type)}
                <span className="text-sm font-medium">{selectedDevice.label}</span>
                {isMonitoring && (
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                )}
              </div>
              <button
                onClick={disconnectDevice}
                className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                title="Disconnect"
              >
                <MicOff size={20} />
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowDeviceList(prev => !prev)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg transition-colors ${
                isConnecting
                  ? 'bg-gray-100 text-gray-500'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              <Settings2 size={20} />
              Select Audio Input
            </button>
          )}
        </div>
      </div>
    </>
  );
};
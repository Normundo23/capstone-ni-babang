import React, { useState, useEffect } from 'react';
import { StudentList } from './components/StudentList';
import { BluetoothManager } from './components/BluetoothManager';
import { ClassSelector } from './components/ClassSelector';
import { Settings } from './components/Settings';
import { VoiceRecognition } from './components/VoiceRecognition';
import { useStore } from './store';
import { toast } from 'react-hot-toast';

const Logo = () => {
  const { isTracking, startTracking, stopTracking, currentClassId, currentClass } = useStore();
  const [isAnimating, setIsAnimating] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showRipple, setShowRipple] = useState(false);
  const [ripplePosition, setRipplePosition] = useState({ x: 0, y: 0 });
  const [statusMessage, setStatusMessage] = useState('Click logo to start tracking');

  useEffect(() => {
    if (isTracking) {
      setStatusMessage(`Recording participation${currentClass ? ` for ${currentClass.name}` : ''}`);
    } else {
      setStatusMessage('Click logo to start tracking');
    }
  }, [isTracking, currentClass]);

  const handleLogoClick = (e: React.MouseEvent) => {
    if (!currentClassId) {
      toast.error('Please select a class first');
      return;
    }

    // Calculate ripple position relative to click
    const rect = e.currentTarget.getBoundingClientRect();
    setRipplePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });

    setIsAnimating(true);
    setIsStarting(!isTracking);
    setShowRipple(true);

    // Handle tracking state
    if (!isTracking) {
      startTracking();
      setStatusMessage(`Starting recording${currentClass ? ` for ${currentClass.name}` : ''}...`);
      toast.success('Started tracking participation');
    } else {
      stopTracking();
      setStatusMessage('Recording stopped');
      toast.success('Stopped tracking participation');
    }

    // Reset animation states
    setTimeout(() => {
      setIsAnimating(false);
      setIsStarting(false);
      setShowRipple(false);
      
      // Update final status message
      if (!isTracking) {
        setStatusMessage(`Recording participation${currentClass ? ` for ${currentClass.name}` : ''}`);
      } else {
        setStatusMessage('Click logo to start tracking');
      }
    }, 1500);
  };

  return (
    <div className="flex items-center gap-4">
      <div 
        className="relative cursor-pointer group"
        onClick={handleLogoClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="button"
        tabIndex={0}
        aria-label={isTracking ? "Stop tracking" : "Start tracking"}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleLogoClick(e as any);
          }
        }}
      >
         <img 
          src="/logo1.png"
          alt="Partici-Pro Logo"
          className={`h-12 sm:h-20 w-auto transition-all duration-300 ${
            isAnimating ? 'animate-icon-open' : 
            isTracking ? 'animate-icon-pulse animate-glow-pulse' : 
            isHovered ? 'scale-105 brightness-110' : ''
          }`}
        />

        {/* Recording indicator */}
        {isTracking && (
          <div className="absolute -right-2 top-1/2 -translate-y-1/2">
            <div className="relative w-3 h-3">
              {/* Ripple effect */}
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="absolute inset-0 border-2 border-green-500 dark:border-green-400 rounded-full animate-ping"
                  style={{
                    animationDelay: `${i * 0.5}s`,
                    opacity: 0.3
                  }}
                />
              ))}
              {/* Solid dot */}
              <div className="absolute inset-0 bg-green-500 dark:bg-green-400 rounded-full animate-pulse" />
            </div>
          </div>
        )}

        {/* Click ripple effect */}
        {showRipple && (
          <div 
            className="absolute inset-0 overflow-hidden rounded-full pointer-events-none"
            style={{
              clipPath: 'circle(200% at 50% 50%)'
            }}
          >
            <div 
              className="absolute bg-blue-500/20 rounded-full animate-ripple"
              style={{
                width: '8px',
                height: '8px',
                left: ripplePosition.x - 4,
                top: ripplePosition.y - 4
              }}
            />
          </div>
        )}

        {/* Hover effect */}
        {isHovered && !isAnimating && (
          <div className="absolute inset-0 bg-blue-500/10 rounded-full transition-all duration-300" />
        )}

        {/* Start/Stop animation overlay */}
        {isStarting && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="absolute inset-0 bg-blue-500/20 backdrop-blur-sm rounded-full animate-pulse" />
          </div>
        )}
      </div>

      <div className="animate-fade-slide-in animation-delay-200">
        <h1 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          <span className="sm:hidden">Partici-Pro</span>
          <span className="hidden sm:block">Student Participation Tracker</span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          {statusMessage}
        </p>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const { settings } = useStore();

  useEffect(() => {
    setIsLoaded(true);

    const initializeTheme = () => {
      if (settings.theme === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.toggle('dark', isDark);
      } else {
        document.documentElement.classList.toggle('dark', settings.theme === 'dark');
      }
    };

    initializeTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = (e: MediaQueryListEvent) => {
      if (settings.theme === 'system') {
        document.documentElement.classList.toggle('dark', e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleThemeChange);
    return () => mediaQuery.removeEventListener('change', handleThemeChange);
  }, [settings.theme]);

  return (
    <div 
      className={`min-h-screen bg-gray-100 dark:bg-dark-900 transition-all duration-500 ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <VoiceRecognition />
      <header className="bg-white dark:bg-dark-800 shadow animate-fade-slide-in relative z-50 safe-top">
        <div className="max-w-7xl mx-auto py-2 sm:py-4 px-3 sm:px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6">
            <Logo />
            <div className="flex items-center gap-3 sm:gap-6">
              <div className="animate-slide-in-right animation-delay-300 relative z-50">
                <Settings />
              </div>
              <div className="animate-slide-in-right animation-delay-400">
                <ClassSelector />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-6 lg:px-8 relative z-0 safe-bottom">
        <div className="animate-fade-slide-in animation-delay-500">
          <StudentList />
        </div>
        <BluetoothManager />
      </main>
    </div>
  );
};

export default App;
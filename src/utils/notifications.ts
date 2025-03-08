import { Student, ParticipationQuality, NotificationPreferences } from '../types';

const DEFAULT_PREFERENCES: NotificationPreferences = {
  participationAlerts: true,
  lowParticipationAlerts: true,
  rankingChanges: true,
  audioDeviceAlerts: true,
  minTimeBetweenAlerts: 30000, // 30 seconds
};

class NotificationManager {
  private static instance: NotificationManager;
  private preferences: NotificationPreferences = DEFAULT_PREFERENCES;
  private lastNotificationTime: Record<string, number> = {};
  private permission: NotificationPermission = 'default';

  private constructor() {
    this.init();
  }

  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  private async init() {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return;
    }

    this.permission = await Notification.requestPermission();
    
    // Load saved preferences
    const savedPrefs = localStorage.getItem('notification-preferences');
    if (savedPrefs) {
      this.preferences = { ...DEFAULT_PREFERENCES, ...JSON.parse(savedPrefs) };
    }
  }

  public async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    
    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  private shouldShowNotification(type: keyof NotificationPreferences): boolean {
    if (this.permission !== 'granted' || !this.preferences[type]) return false;

    const now = Date.now();
    const lastTime = this.lastNotificationTime[type] || 0;

    if (now - lastTime < this.preferences.minTimeBetweenAlerts) {
      return false;
    }

    this.lastNotificationTime[type] = now;
    return true;
  }

  public setPreferences(prefs: Partial<NotificationPreferences>) {
    this.preferences = { ...this.preferences, ...prefs };
    localStorage.setItem('notification-preferences', JSON.stringify(this.preferences));
  }

  public getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  public notifyParticipation(student: Student, quality: ParticipationQuality) {
    if (!this.shouldShowNotification('participationAlerts')) return;

    new Notification('Student Participation', {
      body: `${student.name} participated with ${quality.keyword} quality`,
      icon: '/partici-pro-logo.png',
      tag: 'participation',
    });
  }

  public notifyLowParticipation(students: Student[]) {
    if (!this.shouldShowNotification('lowParticipationAlerts')) return;

    const names = students.map(s => s.name).join(', ');
    new Notification('Low Participation Alert', {
      body: `Students with no recent participation: ${names}`,
      icon: '/partici-pro-logo.png',
      tag: 'low-participation',
    });
  }

  public notifyRankingChange(student: Student, oldRank: number, newRank: number) {
    if (!this.shouldShowNotification('rankingChanges')) return;

    const direction = newRank < oldRank ? 'up' : 'down';
    new Notification('Ranking Update', {
      body: `${student.name} has moved ${direction} to rank #${newRank}`,
      icon: '/partici-pro-logo.png',
      tag: 'ranking',
    });
  }

  public notifyAudioDevice(message: string) {
    if (!this.shouldShowNotification('audioDeviceAlerts')) return;

    new Notification('Audio Device Alert', {
      body: message,
      icon: '/partici-pro-logo.png',
      tag: 'audio-device',
    });
  }
}

export const notificationManager = NotificationManager.getInstance();
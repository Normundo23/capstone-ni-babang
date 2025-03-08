import React from 'react';
import { useStore } from '../store';
import { Settings2 } from 'lucide-react';
import { NameDetectionMode } from '../types';

export const NameSettings: React.FC = () => {
  const { settings, updateSettings } = useStore();

  const handleModeChange = (mode: NameDetectionMode) => {
    updateSettings({ nameDetectionMode: mode });
  };

  return (
    <div className="mb-6 p-4 bg-white rounded-lg shadow">
      <div className="flex items-center gap-2 mb-3">
        <Settings2 size={20} className="text-gray-600" />
        <h2 className="text-lg font-semibold">Name Detection Settings</h2>
      </div>
      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={settings.nameDetectionMode === 'firstName'}
            onChange={() => handleModeChange('firstName')}
            className="text-blue-500 focus:ring-blue-500"
          />
          <span>First Name Only</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={settings.nameDetectionMode === 'lastName'}
            onChange={() => handleModeChange('lastName')}
            className="text-blue-500 focus:ring-blue-500"
          />
          <span>Last Name Only (with trigger words)</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={settings.nameDetectionMode === 'both'}
            onChange={() => handleModeChange('both')}
            className="text-blue-500 focus:ring-blue-500"
          />
          <span>Both Names (most accurate)</span>
        </label>
      </div>
      <p className="mt-2 text-sm text-gray-600">
        {settings.nameDetectionMode === 'firstName' && 
          "Will detect participation when student's first name is mentioned"}
        {settings.nameDetectionMode === 'lastName' && 
          "Will detect participation when student's last name is used with trigger words (e.g., 'Smith answers')"}
        {settings.nameDetectionMode === 'both' && 
          "Will detect participation when either full name is used or last name with trigger words"}
      </p>
    </div>
  );
};
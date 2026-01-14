import React from 'react';
import { AppMode } from '../types';
import { Scale, Briefcase } from 'lucide-react';

interface TabNavigationProps {
  activeMode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeMode, onModeChange }) => {
  return (
    <div className="flex w-full bg-white rounded-xl shadow-sm border border-slate-200 p-1 mb-6">
      <button
        onClick={() => onModeChange(AppMode.Litigation)}
        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
          activeMode === AppMode.Litigation
            ? 'bg-jinwu-500 text-white shadow-md'
            : 'text-slate-500 hover:bg-slate-50'
        }`}
      >
        <Scale className="w-4 h-4" />
        智能打官司
      </button>
      <button
        onClick={() => onModeChange(AppMode.Assistant)}
        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
          activeMode === AppMode.Assistant
            ? 'bg-jinwu-500 text-white shadow-md'
            : 'text-slate-500 hover:bg-slate-50'
        }`}
      >
        <Briefcase className="w-4 h-4" />
        法律助手
      </button>
    </div>
  );
};

export default TabNavigation;

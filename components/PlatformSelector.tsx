import React from 'react';
import { Check } from 'lucide-react';
import { Platform } from '../types';
import { SUPPORTED_PLATFORMS } from '../constants';

interface PlatformSelectorProps {
  selectedPlatforms: Platform[];
  onChange: (platforms: Platform[]) => void;
}

const PlatformSelector: React.FC<PlatformSelectorProps> = ({ selectedPlatforms, onChange }) => {
  const toggle = (id: Platform) => {
    onChange(
      selectedPlatforms.includes(id)
        ? selectedPlatforms.filter((p) => p !== id)
        : [...selectedPlatforms, id],
    );
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {SUPPORTED_PLATFORMS.map((platform) => {
        const active = selectedPlatforms.includes(platform.id);
        return (
          <button
            key={platform.id}
            type="button"
            onClick={() => toggle(platform.id)}
            className={`relative flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
              active
                ? 'border-indigo-500 bg-indigo-500/10 text-white'
                : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${platform.color}`} />
              {platform.label}
            </span>
            {active && <Check size={15} className="text-indigo-400" />}
          </button>
        );
      })}
    </div>
  );
};

export default PlatformSelector;

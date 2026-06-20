import React from 'react';
import { Check } from 'lucide-react';
import { OutputType } from '../types';
import { OUTPUT_TYPES } from '../constants';

interface OutputTypeSelectorProps {
  selected: OutputType[];
  onChange: (types: OutputType[]) => void;
}

const OutputTypeSelector: React.FC<OutputTypeSelectorProps> = ({ selected, onChange }) => {
  const toggle = (id: OutputType) => {
    onChange(selected.includes(id) ? selected.filter((t) => t !== id) : [...selected, id]);
  };

  return (
    <div className="space-y-2">
      {OUTPUT_TYPES.map((type) => {
        const active = selected.includes(type.id);
        return (
          <button
            key={type.id}
            type="button"
            onClick={() => toggle(type.id)}
            className={`w-full flex items-start gap-3 text-left px-3 py-2.5 rounded-xl border transition-all ${
              active
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-gray-700 bg-gray-900 hover:border-gray-600'
            }`}
          >
            <span
              className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${
                active ? 'bg-indigo-500' : 'border border-gray-600'
              }`}
            >
              {active && <Check size={12} className="text-white" />}
            </span>
            <span>
              <span className={`block text-sm font-medium ${active ? 'text-white' : 'text-gray-300'}`}>
                {type.label}
              </span>
              <span className="block text-xs text-gray-500">{type.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default OutputTypeSelector;

import React from 'react';
import { Check, Wand2 } from 'lucide-react';
import { Framework } from '../types';
import { FRAMEWORKS } from '../constants';

interface FrameworkSelectorProps {
  // Empty array = "Auto" (let the AI recommend). Otherwise force these framework(s).
  selected: Framework[];
  onChange: (frameworks: Framework[]) => void;
}

const FrameworkSelector: React.FC<FrameworkSelectorProps> = ({ selected, onChange }) => {
  const isAuto = selected.length === 0;

  const toggle = (id: Framework) => {
    onChange(selected.includes(id) ? selected.filter((f) => f !== id) : [...selected, id]);
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => onChange([])}
        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
          isAuto
            ? 'border-indigo-500 bg-indigo-500/10 text-white'
            : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
        }`}
      >
        <Wand2 size={15} className={isAuto ? 'text-indigo-400' : 'text-gray-500'} />
        Auto — let AI recommend
        {isAuto && <Check size={15} className="text-indigo-400 ml-auto" />}
      </button>

      <p className="text-[11px] text-gray-500 pt-1">Or force specific framework(s):</p>

      <div className="grid grid-cols-2 gap-2">
        {FRAMEWORKS.map((f) => {
          const active = selected.includes(f.id);
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => toggle(f.id)}
              title={f.flow}
              className={`flex items-center justify-between px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                active
                  ? 'border-indigo-500 bg-indigo-500/10 text-white'
                  : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
              }`}
            >
              {f.label}
              {active && <Check size={14} className="text-indigo-400" />}
            </button>
          );
        })}
      </div>
      {selected.length > 1 && (
        <p className="text-[11px] text-indigo-400">AI will blend the {selected.length} selected frameworks.</p>
      )}
    </div>
  );
};

export default FrameworkSelector;

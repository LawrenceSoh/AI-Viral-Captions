import React from 'react';
import { X } from 'lucide-react';
import { FRAMEWORKS } from '../constants';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DocumentationModal: React.FC<DocumentationModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-[#16161a] border border-gray-800 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto custom-scrollbar p-6 animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">How it works</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-5">
          Upload up to 5 product photos and fill in a short brief. The AI studies your images and
          audience, then picks the highest-converting copywriting framework (or a blend) and writes
          your scripts, captions, and ad copy.
        </p>

        <h3 className="text-sm font-semibold text-white mb-2">The frameworks</h3>
        <div className="space-y-3">
          {FRAMEWORKS.map((f) => (
            <div key={f.id} className="border border-gray-800 rounded-xl p-3">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-indigo-300">{f.label}</span>
                <span className="text-[11px] text-gray-500">{f.bestFor}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">{f.flow}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DocumentationModal;

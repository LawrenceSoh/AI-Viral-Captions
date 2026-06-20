import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ProductBrief } from '../types';

interface ProductFormProps {
  brief: ProductBrief;
  onChange: (brief: ProductBrief) => void;
}

const MAX_POINTS = 5;

const inputClass =
  'w-full bg-gray-900 border border-gray-700 rounded-xl py-2.5 px-3 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all';

const Label: React.FC<{ children: React.ReactNode; hint?: string }> = ({ children, hint }) => (
  <div className="flex items-baseline justify-between mb-1.5">
    <label className="text-sm font-medium text-gray-200">{children}</label>
    {hint && <span className="text-[11px] text-gray-500">{hint}</span>}
  </div>
);

const ProductForm: React.FC<ProductFormProps> = ({ brief, onChange }) => {
  const set = <K extends keyof ProductBrief>(key: K, value: ProductBrief[K]) =>
    onChange({ ...brief, [key]: value });

  const setPoint = (index: number, value: string) => {
    const points = [...brief.sellingPoints];
    points[index] = value;
    set('sellingPoints', points);
  };

  const addPoint = () => {
    if (brief.sellingPoints.length < MAX_POINTS) set('sellingPoints', [...brief.sellingPoints, '']);
  };

  const removePoint = (index: number) =>
    set('sellingPoints', brief.sellingPoints.filter((_, i) => i !== index));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <Label hint="required">Product name</Label>
          <input
            className={inputClass}
            value={brief.productName}
            onChange={(e) => set('productName', e.target.value)}
            placeholder="e.g. GlowDrip Vitamin C Serum"
          />
        </div>
        <div>
          <Label>Target audience</Label>
          <input
            className={inputClass}
            value={brief.targetAudience}
            onChange={(e) => set('targetAudience', e.target.value)}
            placeholder="e.g. Women 25-40 into skincare"
          />
        </div>
      </div>

      <div>
        <Label hint="required">What it is / does</Label>
        <textarea
          className={`${inputClass} resize-none h-20`}
          value={brief.productDescription}
          onChange={(e) => set('productDescription', e.target.value)}
          placeholder="Describe the product, what problem it solves, how it works..."
        />
      </div>

      <div>
        <Label hint={`${brief.sellingPoints.length}/${MAX_POINTS}`}>Main selling points</Label>
        <div className="space-y-2">
          {brief.sellingPoints.map((point, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-indigo-400 w-4 text-center">{i + 1}</span>
              <input
                className={inputClass}
                value={point}
                onChange={(e) => setPoint(i, e.target.value)}
                placeholder={`Benefit ${i + 1}`}
              />
              {brief.sellingPoints.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePoint(i)}
                  className="text-gray-500 hover:text-red-400 transition-colors p-1"
                  aria-label="Remove benefit"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
        {brief.sellingPoints.length < MAX_POINTS && (
          <button
            type="button"
            onClick={addPoint}
            className="mt-2 flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <Plus size={14} /> Add selling point
          </button>
        )}
      </div>

      <div>
        <Label hint="what should viewers do?">Call-to-action</Label>
        <input
          className={inputClass}
          value={brief.callToAction}
          onChange={(e) => set('callToAction', e.target.value)}
          placeholder='e.g. "Link in bio", "DM me", "Book now"'
        />
      </div>
    </div>
  );
};

export default ProductForm;

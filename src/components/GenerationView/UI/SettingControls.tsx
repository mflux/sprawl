import React from 'react';

export const SettingSlider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
  unit?: string;
}> = ({ label, value, min, max, step, onChange, unit = "" }) => (
  <div className="space-y-1 py-1">
    <div className="flex justify-between items-center">
      <span className="text-[8px] font-bold text-slate-500 uppercase">{label}</span>
      <span className="text-[8px] font-mono text-cyan-500">{value}{unit}</span>
    </div>
    <input 
      type="range" 
      min={min} 
      max={max} 
      step={step} 
      value={value} 
      onChange={(e) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val)) onChange(val);
      }} 
      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-600 focus:outline-none" 
    />
  </div>
);

export const SettingToggle: React.FC<{
  label: string;
  value: boolean;
  onChange: (val: boolean) => void;
}> = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between py-1">
    <span className="text-[8px] font-bold text-slate-500 uppercase">{label}</span>
    <button 
      onClick={() => onChange(!value)}
      className={`w-8 h-4 rounded-full relative transition-colors ${value ? 'bg-cyan-600' : 'bg-slate-700'}`}
    >
      <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${value ? 'left-4.5' : 'left-0.5'}`} />
    </button>
  </div>
);

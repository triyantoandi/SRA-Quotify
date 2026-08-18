import React, { useState, useEffect } from 'react';
import { Edit } from 'lucide-react';
import { formatIDR } from '../utils/helpers';

interface InlinePriceEditorProps {
  initialPrice: number;
  onSave: (newPrice: number) => void;
  disabled?: boolean;
}

export function InlinePriceEditor({ initialPrice, onSave, disabled }: InlinePriceEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState<number | string>(initialPrice);

  useEffect(() => { setVal(initialPrice); }, [initialPrice]);

  const handleSave = () => {
    setIsEditing(false);
    const num = Number(val);
    if (!isNaN(num) && num !== initialPrice) {
      onSave(num);
    }
  };

  if (disabled) return <span className="font-bold text-blue-900 tabular-nums">{formatIDR(initialPrice)}</span>;

  return isEditing ? (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-bold text-slate-500">Rp</span>
      <input 
        type="number" 
        autoFocus 
        className="w-24 bg-white border border-blue-500 rounded px-1.5 py-0.5 text-right text-blue-900 font-bold outline-none focus:ring-2 focus:ring-blue-500/20 text-xs tabular-nums shadow-2xs" 
        value={val} 
        onChange={e => setVal(e.target.value)} 
        onBlur={handleSave} 
        onKeyDown={e => { 
          if (e.key === 'Enter') handleSave(); 
          if (e.key === 'Escape') { setVal(initialPrice); setIsEditing(false); } 
        }} 
      />
    </div>
  ) : (
    <span 
      onClick={() => setIsEditing(true)} 
      className="font-bold text-blue-800 tabular-nums cursor-pointer hover:bg-blue-100 hover:text-blue-900 px-1.5 py-0.5 -mr-1.5 rounded-md transition-colors flex items-center gap-1" 
      title="Ubah Cepat Harga"
    >
      {formatIDR(initialPrice)} <Edit className="w-2.5 h-2.5 text-blue-500 opacity-60 hover:opacity-100" />
    </span>
  );
}

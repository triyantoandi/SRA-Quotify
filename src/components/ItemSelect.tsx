import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Sparkles, Plus } from 'lucide-react';
import { Item } from '../types';

interface ItemSelectProps {
  items: Item[];
  value: string;
  onChange: (value: string) => void;
  onSelectCustomName?: (customName: string) => void;
}

export function ItemSelect({ items, value, onChange, onSelectCustomName }: ItemSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];
  const selectedItem = safeItems.find(i => i?.id === value);
  const displayValue = selectedItem ? `${selectedItem.sku || ''} - ${selectedItem.name || ''}` : '';
  const filteredItems = safeItems.filter(item => `${item?.sku || ''} ${item?.name || ''}`.toLowerCase().includes((searchTerm || '').toLowerCase()));

  return (
    <div ref={wrapperRef} className="relative w-full font-sans">
      <div className="flex items-center w-full p-3 clay-input cursor-text transition-all" onClick={() => setIsOpen(true)}>
        <input 
          type="text" 
          className="w-full bg-transparent outline-none font-bold text-slate-900 text-sm placeholder:text-slate-400" 
          placeholder="Ketik nama/SKU dari katalog..." 
          value={isOpen ? searchTerm : displayValue} 
          onChange={(e) => {setSearchTerm(e.target.value); setIsOpen(true);}} 
          onFocus={() => {setSearchTerm(''); setIsOpen(true);}} 
        />
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && (
        <div className="absolute z-[60] w-full mt-2 clay-modal max-h-64 overflow-y-auto overscroll-contain animate-in fade-in zoom-in-95 duration-100 p-2 shadow-xl border border-slate-200">
          {onSelectCustomName && searchTerm.trim().length > 0 && (
            <div 
              onClick={() => {
                onSelectCustomName(searchTerm.trim());
                setIsOpen(false);
              }}
              className="p-2.5 mb-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 cursor-pointer flex items-center gap-2 text-purple-950 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
              <div className="text-xs">
                <span className="font-extrabold">Jadikan Barang Spot / Custom:</span>
                <span className="font-black text-purple-900 ml-1 truncate block">"{searchTerm.trim()}"</span>
              </div>
            </div>
          )}

          {filteredItems.length === 0 ? (
            <div className="p-4 text-xs text-slate-500 text-center font-bold">
              Barang katalog tidak ditemukan.
              {onSelectCustomName && searchTerm.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectCustomName(searchTerm.trim());
                    setIsOpen(false);
                  }}
                  className="mt-2 block w-full py-1.5 px-3 bg-purple-600 text-white rounded-lg text-[11px] font-black hover:bg-purple-700 transition-all"
                >
                  Gunakan "{searchTerm.trim()}" Sebagai Barang Non-Price List
                </button>
              )}
            </div>
          ) : (
            filteredItems.map(item => (
              <div key={item.id} onClick={() => { onChange(item.id); setIsOpen(false); }} className={`px-3 py-2.5 cursor-pointer rounded-xl hover:bg-emerald-50 transition-colors mb-1 ${value === item.id ? 'bg-emerald-100/80 border border-emerald-300' : ''}`}>
                <div className="flex justify-between items-center mb-0.5">
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 clay-badge ${value === item.id ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700'}`}>{item.sku}</span>
                  <span className="text-[10px] font-extrabold text-slate-500">{item.unit || 'Pcs'}</span>
                </div>
                <div className={`text-xs font-extrabold truncate ${value === item.id ? 'text-emerald-950' : 'text-slate-900'}`}>{item.name}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

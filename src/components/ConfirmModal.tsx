import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }: ConfirmModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="clay-modal p-7 max-w-md w-full animate-in zoom-in-95 duration-200">
        <div className="w-14 h-14 rounded-2xl clay-card bg-amber-50 border border-amber-200/80 flex items-center justify-center mb-5">
          <AlertTriangle className="w-7 h-7 text-amber-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-2">{title}</h3>
        <p className="text-slate-600 font-medium text-sm leading-relaxed mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-5 py-2.5 clay-button-secondary text-slate-700 font-semibold text-sm">Batal</button>
          <button onClick={onConfirm} className="px-5 py-2.5 clay-button-primary text-white font-bold text-sm">Ya, Lanjutkan</button>
        </div>
      </div>
    </div>
  );
}

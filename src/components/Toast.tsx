import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  isVisible: boolean;
}

export function Toast({ message, type, isVisible }: ToastProps) {
  if (!isVisible) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3.5 px-6 py-4 clay-card animate-in slide-in-from-bottom-5 fade-in duration-300 border ${type === 'error' ? 'border-red-300 bg-red-50/90 text-red-900' : 'border-emerald-300 bg-emerald-50/90 text-emerald-950'}`}>
      {type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
      <span className="font-bold text-sm tracking-wide">{message}</span>
    </div>
  );
}

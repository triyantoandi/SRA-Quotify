import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, LogOut, Terminal, Copy, Check } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, copied: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('PRODUCTION RUNTIME ERROR CAUGHT BY ERROR BOUNDARY:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public handleReload = () => {
    window.location.reload();
  };

  public handleResetSession = () => {
    try {
      localStorage.removeItem('sra_usr');
      sessionStorage.clear();
    } catch (e) {
      console.warn('Error clearing storage:', e);
    }
    window.location.reload();
  };

  public handleCopyDetails = () => {
    const details = `=== PRODUCTION RUNTIME ERROR ===\nMessage: ${this.state.error?.message}\nName: ${this.state.error?.name}\nStack: ${this.state.error?.stack || 'N/A'}\nComponent Stack: ${this.state.errorInfo?.componentStack || 'N/A'}\nOrigin: ${window.location.origin}\nHostname: ${window.location.hostname}`;
    navigator.clipboard.writeText(details);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2000);
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.message || 'Unknown Error';
      const errorName = this.state.error?.name || 'Error';
      const errorStack = this.state.error?.stack || 'No stack trace available';
      const compStack = this.state.errorInfo?.componentStack || '';

      return (
        <div className="min-h-screen bg-[#0f172a] text-slate-100 flex items-center justify-center p-4 font-sans selection:bg-rose-500/30">
          <div className="max-w-2xl w-full bg-slate-900 border border-rose-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 shadow-inner">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Production Error Captured
                  </span>
                  <h2 className="text-xl font-black text-white tracking-tight mt-1">
                    PRODUCTION RUNTIME ERROR
                  </h2>
                </div>
              </div>

              <button
                onClick={this.handleCopyDetails}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors"
                title="Salin rincian error untuk diagnostik"
              >
                {this.state.copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {this.state.copied ? 'Tersalin' : 'Copy Log'}
              </button>
            </div>

            {/* Diagnostic Information */}
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <p className="text-rose-400 font-bold flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5" /> Type: <span className="text-slate-200">{errorName}</span>
                </p>
                <p className="text-rose-300 font-bold">
                  Message: <span className="text-white">{errorMsg}</span>
                </p>
                <p className="text-slate-400 text-[11px]">
                  Origin: <span className="text-slate-300">{typeof window !== 'undefined' ? window.location.origin : 'N/A'}</span>
                </p>
                <p className="text-slate-400 text-[11px]">
                  Hostname: <span className="text-slate-300">{typeof window !== 'undefined' ? window.location.hostname : 'N/A'}</span>
                </p>
              </div>

              {/* Stack Trace Box */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 max-h-48 overflow-y-auto space-y-2 text-[11px]">
                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Stack Trace:</p>
                <pre className="text-slate-400 whitespace-pre-wrap leading-relaxed break-all">
                  {errorStack}
                </pre>
                {compStack && (
                  <>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-wider pt-2 border-t border-slate-850">Component Tree:</p>
                    <pre className="text-amber-400/80 whitespace-pre-wrap leading-relaxed break-all">
                      {compStack}
                    </pre>
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2 border-t border-slate-800">
              <button 
                onClick={this.handleResetSession}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" /> Reset Sesi Login & Local Cache
              </button>
              <button 
                onClick={this.handleReload}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Muat Ulang Halaman
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}


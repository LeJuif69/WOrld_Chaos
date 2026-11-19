import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'Une erreur inattendue est survenue.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 bg-[#08110D] text-[#F3F1E8] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#0E1B15] border border-[#DC2626]/60 rounded-2xl p-6 text-center space-y-4">
            <AlertTriangle className="w-10 h-10 text-[#DC2626] mx-auto" />
            <h1 className="font-display text-xl font-bold">Interruption Sécurisée</h1>
            <p className="text-xs text-[#9EB3A8] break-words leading-relaxed">
              {this.state.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="min-h-[44px] px-5 rounded-xl bg-[#D4AF37] hover:bg-[#F2CF66] text-[#08110D] font-bold text-xs inline-flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Recharger WORLD CHAOS
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

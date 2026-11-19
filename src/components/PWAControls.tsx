import React, { useState } from 'react';
import { Download, Smartphone, WifiOff, X } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={() => void install()}
        className="min-h-[46px] px-5 py-3 rounded-lg bg-[#0E1B15] hover:bg-[#162B22] text-[#F2CF66] border border-[#D4AF37]/55 font-semibold text-sm flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
      >
        <Download className="w-4 h-4 text-[#D4AF37]" />
        Installer l’App
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="min-h-[46px] px-4 py-3 rounded-lg bg-[#0E1B15] hover:bg-[#162B22] text-[#F2CF66] border border-[#D4AF37]/50 font-semibold text-sm flex items-center gap-2 cursor-pointer whitespace-nowrap"
        >
          <Smartphone className="w-4 h-4 text-[#D4AF37]" />
          Installer sur iOS
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 pointer-events-auto">
            <div className="w-full max-w-sm rounded-2xl bg-[#08110D] border border-[#D4AF37]/60 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-bold text-[#F3F1E8]">
                  Installer sur iPhone / iPad
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="min-w-[40px] min-h-[40px] rounded-lg bg-[#0E1B15] border border-[#D4AF37]/30 flex items-center justify-center cursor-pointer"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4 text-[#D4AF37]" />
                </button>
              </div>
              <ol className="text-xs text-[#9EB3A8] space-y-2 leading-relaxed">
                <li>
                  1. Touchez le bouton <strong className="text-[#F3F1E8]">Partager</strong> dans la barre Safari.
                </li>
                <li>
                  2. Faites défiler et sélectionnez{' '}
                  <strong className="text-[#D4AF37]">Sur l’écran d’accueil</strong>.
                </li>
                <li>
                  3. Lancez <strong className="text-[#F3F1E8]">WORLD CHAOS</strong> en plein écran hors ligne.
                </li>
              </ol>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="min-h-[44px] w-full rounded-xl bg-[#D4AF37] hover:bg-[#F2CF66] text-[#08110D] font-bold text-xs cursor-pointer"
              >
                Compris
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-[#08110D]/95 border border-[#D4AF37]/60 px-3.5 py-2 text-xs font-semibold text-[#F2CF66] shadow-xl pointer-events-none"
      role="status"
    >
      <WifiOff className="w-4 h-4 text-[#D4AF37]" />
      <span>Mode Hors Ligne · Sauvegarde locale active</span>
    </div>
  );
};

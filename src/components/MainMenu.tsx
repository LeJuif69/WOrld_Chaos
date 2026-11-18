import React from 'react';
import { BookMarked, Compass, Play, RotateCcw, Settings, Shield } from 'lucide-react';

interface MainMenuProps {
  hasSave: boolean;
  onContinue: () => void;
  onNewGame: () => void;
  onOpenArtBible: () => void;
  onOpenSettings: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  hasSave,
  onContinue,
  onNewGame,
  onOpenArtBible,
  onOpenSettings,
}) => {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-between px-6 sm:px-10 py-6 bg-gradient-to-r from-[#08110D]/94 via-[#08110D]/72 to-transparent pointer-events-auto">
      <div className="max-w-xl flex flex-col gap-5">
        <div className="text-xs font-semibold tracking-[0.22em] text-[#D4AF37] uppercase">
          Monde 1 · The Lost Jungle
        </div>

        <div>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-[#F3F1E8] leading-tight text-balance">
            WORLD CHAOS
          </h1>
          <p className="font-display text-lg sm:text-xl font-semibold text-[#D4AF37] mt-1 tracking-wide">
            THE LIVING WORLDS
          </p>
          <p className="text-sm text-[#9EB3A8] mt-3 leading-relaxed max-w-md">
            Explorez dix zones interconnectées, éveillez Shockwave, Gravity Control et Chaos Shield,
            survivez aux anomalies du Chaos et reconquérez le Jungle Chaos Core.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap gap-3 mt-1">
          {hasSave && (
            <button
              onClick={onContinue}
              className="min-h-[46px] px-6 py-3 rounded-lg bg-[#D4AF37] hover:bg-[#F2CF66] text-[#08110D] font-bold text-sm flex items-center gap-2.5 transition-colors cursor-pointer whitespace-nowrap gold-glow"
            >
              <Play className="w-4 h-4 fill-current" />
              Continuer l’aventure
            </button>
          )}
          <button
            onClick={onNewGame}
            className={`min-h-[46px] px-6 py-3 rounded-lg font-bold text-sm flex items-center gap-2.5 transition-colors cursor-pointer whitespace-nowrap ${
              hasSave
                ? 'bg-[#0E1B15] hover:bg-[#162B22] text-[#F3F1E8] border border-[#D4AF37]/45'
                : 'bg-[#D4AF37] hover:bg-[#F2CF66] text-[#08110D] gold-glow'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            Nouvelle Partie
          </button>
          <button
            onClick={onOpenArtBible}
            className="min-h-[46px] px-5 py-3 rounded-lg bg-[#0E1B15] hover:bg-[#162B22] text-[#14B8A6] border border-[#14B8A6]/50 font-semibold text-sm flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            <BookMarked className="w-4 h-4" />
            Bible Graphique V1.0
          </button>
          <button
            onClick={onOpenSettings}
            className="min-h-[46px] px-5 py-3 rounded-lg bg-[#0E1B15] hover:bg-[#162B22] text-[#F3F1E8] border border-[#D4AF37]/30 font-medium text-sm flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Settings className="w-4 h-4 text-[#D4AF37]" />
            Paramètres
          </button>
        </div>

        <div className="mt-2 pt-4 border-t border-[#D4AF37]/25 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#9EB3A8]">
          <div className="flex items-start gap-2">
            <Compass className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
            <span>
              <strong className="text-[#F3F1E8]">Déplacement &amp; Caméra :</strong> ZQSD/WASD ou Stick · Glisser pour tourner
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-[#14B8A6] shrink-0 mt-0.5" />
            <span>
              <strong className="text-[#F3F1E8]">Combat &amp; Pouvoirs :</strong> J/K Attaques · Shift Esquive · 1/2/3 Pouvoirs · E Interagir
            </span>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-col items-end text-right gap-1 text-xs text-[#9EB3A8]">
        <span className="font-semibold text-[#D4AF37] tracking-widest">
          EXPLORE · DISCOVER · FIGHT · TRANSFORM
        </span>
        <span>3D Fantasy Semi-Réaliste · Sauvegarde Hors Ligne</span>
      </div>
    </div>
  );
};

import React from 'react';
import { User } from 'firebase/auth';
import {
  Award,
  BookMarked,
  Cloud,
  Compass,
  Globe2,
  Play,
  Power,
  Rocket,
  RotateCcw,
  Settings,
  Shield,
} from 'lucide-react';
import { PWAInstallButton } from './PWAControls';

interface MainMenuProps {
  hasSave: boolean;
  user: User | null;
  onContinue: () => void;
  onNewGame: () => void;
  onOpenWorldSelect: () => void;
  onOpenSettings: () => void;
  onOpenCredits: () => void;
  onQuit: () => void;
  onOpenArtBible: () => void;
  onOpenCloud: () => void;
  onOpenStoreKit: () => void;
  onUiSound?: (kind: 'ui_hover' | 'ui_click') => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  hasSave,
  user,
  onContinue,
  onNewGame,
  onOpenWorldSelect,
  onOpenSettings,
  onOpenCredits,
  onQuit,
  onOpenArtBible,
  onOpenCloud,
  onOpenStoreKit,
  onUiSound,
}) => {
  const withClick = (fn: () => void) => () => {
    onUiSound?.('ui_click');
    fn();
  };

  const withHover = () => {
    onUiSound?.('ui_hover');
  };

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-between px-5 sm:px-10 lg:px-14 py-4 sm:py-6 bg-[linear-gradient(94deg,rgba(6,13,10,0.94)_0%,rgba(8,17,13,0.78)_40%,rgba(8,17,13,0.18)_68%,transparent_100%)] pointer-events-auto overflow-y-auto">
      <div className="w-full max-w-lg sm:max-w-xl flex flex-col gap-3.5 sm:gap-4 my-auto">
        <div className="wc-menu-reveal">
          <div className="flex items-center gap-2.5 text-[11px] sm:text-xs font-semibold tracking-[0.24em] text-[#D4AF37] uppercase">
            <span className="inline-block w-5 h-px bg-[#D4AF37]/75" />
            <span>Monde 1 · The Lost Jungle</span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#F3F1E8] leading-[1.02] text-balance mt-1.5 drop-shadow-[0_6px_18px_rgba(0,0,0,0.72)]">
            WORLD CHAOS
          </h1>
          <p className="font-display text-sm sm:text-lg lg:text-xl font-semibold text-[#F2CF66] mt-1 tracking-[0.16em]">
            THE LIVING WORLDS
          </p>

          {/* Engraved Antique-Gold Crest Divider */}
          <svg
            viewBox="0 0 320 14"
            className="w-56 sm:w-72 h-3 mt-2.5 text-[#D4AF37]"
            fill="none"
            aria-hidden="true"
          >
            <path d="M0 7H144M176 7H320" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1" />
            <path d="M160 1L168 7L160 13L152 7Z" fill="currentColor" fillOpacity="0.9" />
            <circle cx="144" cy="7" r="1.5" fill="currentColor" fillOpacity="0.7" />
            <circle cx="176" cy="7" r="1.5" fill="currentColor" fillOpacity="0.7" />
          </svg>

          <p className="hidden sm:block text-xs sm:text-sm text-[#B7C9BF] mt-2.5 leading-relaxed max-w-md">
            Explorez dix zones interconnectées, maîtrisez Shockwave, Gravity Control et Chaos Shield,
            et reconquérez le Jungle Chaos Core.
          </p>
        </div>

        {/* 6-Button Core Navigation Grid */}
        <nav
          aria-label="Menu principal"
          className="wc-menu-reveal-delay grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-lg"
        >
          <button
            onClick={withClick(onContinue)}
            onMouseEnter={hasSave ? withHover : undefined}
            disabled={!hasSave}
            aria-disabled={!hasSave}
            className={`min-h-[46px] px-5 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center sm:justify-start gap-2.5 transition-transform duration-150 whitespace-nowrap shrink-0 ${
              hasSave
                ? 'wc-btn-gold hover:translate-x-0.5 cursor-pointer'
                : 'bg-[#0B1410]/80 text-[#9EB3A8]/45 border border-white/10 cursor-not-allowed'
            }`}
          >
            <Play className="w-4 h-4 fill-current shrink-0" />
            <span>Continuer</span>
          </button>

          <button
            onClick={withClick(onNewGame)}
            onMouseEnter={withHover}
            className={`min-h-[46px] px-5 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center sm:justify-start gap-2.5 transition-transform duration-150 hover:translate-x-0.5 cursor-pointer whitespace-nowrap shrink-0 ${
              hasSave
                ? 'bg-[#0E1B15]/95 hover:bg-[#162B22] text-[#F3F1E8] border border-[#D4AF37]/45'
                : 'wc-btn-gold'
            }`}
          >
            <RotateCcw className="w-4 h-4 shrink-0" />
            <span>Nouvelle Partie</span>
          </button>

          <button
            onClick={withClick(onOpenWorldSelect)}
            onMouseEnter={withHover}
            className="min-h-[44px] px-4 py-2.5 rounded-lg bg-[#0E1B15]/95 hover:bg-[#162B22] text-[#F3F1E8] border border-[#14B8A6]/45 font-semibold text-xs sm:text-sm flex items-center justify-center sm:justify-start gap-2.5 transition-transform duration-150 hover:translate-x-0.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Globe2 className="w-4 h-4 text-[#14B8A6] shrink-0" />
            <span>Sélection des Mondes</span>
          </button>

          <button
            onClick={withClick(onOpenSettings)}
            onMouseEnter={withHover}
            className="min-h-[44px] px-4 py-2.5 rounded-lg bg-[#0E1B15]/95 hover:bg-[#162B22] text-[#F3F1E8] border border-[#D4AF37]/35 font-semibold text-xs sm:text-sm flex items-center justify-center sm:justify-start gap-2.5 transition-transform duration-150 hover:translate-x-0.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Settings className="w-4 h-4 text-[#D4AF37] shrink-0" />
            <span>Paramètres</span>
          </button>

          <button
            onClick={withClick(onOpenCredits)}
            onMouseEnter={withHover}
            className="min-h-[44px] px-4 py-2.5 rounded-lg bg-[#0E1B15]/95 hover:bg-[#162B22] text-[#F3F1E8] border border-white/15 font-medium text-xs sm:text-sm flex items-center justify-center sm:justify-start gap-2.5 transition-transform duration-150 hover:translate-x-0.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Award className="w-4 h-4 text-[#F2CF66] shrink-0" />
            <span>Crédits</span>
          </button>

          <button
            onClick={withClick(onQuit)}
            onMouseEnter={withHover}
            className="min-h-[44px] px-4 py-2.5 rounded-lg bg-[#1A0D10]/90 hover:bg-[#2B1217] text-rose-200 border border-[#DC2626]/40 font-medium text-xs sm:text-sm flex items-center justify-center sm:justify-start gap-2.5 transition-transform duration-150 hover:translate-x-0.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Power className="w-4 h-4 text-[#F87171] shrink-0" />
            <span>Quitter</span>
          </button>
        </nav>

        {/* Secondary Tools & Cloud */}
        <div className="wc-menu-reveal-delay flex flex-wrap gap-2">
          <button
            onClick={withClick(onOpenCloud)}
            onMouseEnter={withHover}
            className="min-h-[44px] px-3.5 py-2 rounded-lg bg-[#0E1B15]/95 hover:bg-[#162B22] text-[#F3F1E8] border border-[#14B8A6]/45 font-semibold text-xs flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Cloud className="w-3.5 h-3.5 text-[#14B8A6]" />
            <span>{user ? user.displayName?.split(' ')[0] || 'Cloud Sync' : 'Cloud & Classement'}</span>
          </button>
          <button
            onClick={withClick(onOpenArtBible)}
            onMouseEnter={withHover}
            className="min-h-[44px] px-3.5 py-2 rounded-lg bg-[#0E1B15]/95 hover:bg-[#162B22] text-[#2DD4BF] border border-[#14B8A6]/35 font-semibold text-xs flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
          >
            <BookMarked className="w-3.5 h-3.5" />
            <span>Bible Graphique V1.0</span>
          </button>
          <button
            onClick={withClick(onOpenStoreKit)}
            onMouseEnter={withHover}
            className="min-h-[44px] px-3.5 py-2 rounded-lg bg-[#0E1B15]/95 hover:bg-[#162B22] text-[#F2CF66] border border-[#D4AF37]/35 font-semibold text-xs flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Rocket className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Kit Publication Stores</span>
          </button>
          <PWAInstallButton />
        </div>

        <div className="hidden md:grid wc-panel rounded-xl p-3 grid-cols-2 gap-3 text-xs text-[#9EB3A8] max-w-lg">
          <div className="flex items-start gap-2">
            <Compass className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
            <span>
              <strong className="text-[#F3F1E8]">Déplacement :</strong> ZQSD/WASD ou Stick · Glisser caméra
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-[#14B8A6] shrink-0 mt-0.5" />
            <span>
              <strong className="text-[#F3F1E8]">Combat :</strong> J/K Attaques · Shift Esquive · 1/2/3 Pouvoirs
            </span>
          </div>
        </div>
      </div>

      <div className="hidden xl:flex self-end flex-col items-end text-right gap-1.5 text-xs text-[#9EB3A8] wc-panel rounded-xl px-4 py-3 mb-2">
        <span className="font-display font-semibold text-[#F2CF66] tracking-[0.18em]">
          EXPLORE · DISCOVER · FIGHT · TRANSFORM
        </span>
        <div className="wc-divider-gold w-full" />
        <span>PBR Cinématique · PWA Hors Ligne · Cloud Sync</span>
      </div>
    </div>
  );
};


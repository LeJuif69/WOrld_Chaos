import React from 'react';
import { CheckCircle2, Compass, Eye, Swords, X, Zap } from 'lucide-react';

export interface TutorialProgress {
  moved: boolean;
  rotatedCamera: boolean;
  attackedOrDodged: boolean;
  usedAbility: boolean;
}

interface TutorialOverlayProps {
  progress: TutorialProgress;
  onDismiss: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ progress, onDismiss }) => {
  const steps = [
    {
      key: 'moved',
      done: progress.moved,
      label: 'Se déplacer (ZQSD / Stick gauche)',
      icon: Compass,
    },
    {
      key: 'rotatedCamera',
      done: progress.rotatedCamera,
      label: 'Orienter la caméra (Glisser à droite)',
      icon: Eye,
    },
    {
      key: 'attackedOrDodged',
      done: progress.attackedOrDodged,
      label: 'Attaquer ou Esquiver (J / Shift / Boutons)',
      icon: Swords,
    },
    {
      key: 'usedAbility',
      done: progress.usedAbility,
      label: 'Lancer Shockwave (Touche 1 ou Pouvoir)',
      icon: Zap,
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  if (completedCount === steps.length) {
    return null;
  }

  return (
    <aside
      className="wc-panel fixed left-3 sm:left-4 top-44 sm:top-48 z-10 w-64 rounded-xl p-3 pointer-events-auto"
      aria-label="Tutoriel de prise en main"
    >
      <div className="flex items-center justify-between gap-2 pb-2">
        <div className="text-[11px] font-bold text-[#F2CF66] uppercase tracking-wider font-mono-num">
          Prise en main ({completedCount}/4)
        </div>
        <button
          onClick={onDismiss}
          className="min-w-[28px] min-h-[28px] rounded-md bg-[#0E1B15] hover:bg-[#162B22] border border-[#D4AF37]/30 text-[#9EB3A8] hover:text-[#F3F1E8] flex items-center justify-center cursor-pointer"
          title="Masquer le tutoriel"
          aria-label="Masquer le tutoriel"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="wc-divider-gold mb-2" />

      <ul className="space-y-1.5 text-[11px]">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <li
              key={s.key}
              className={`flex items-center gap-2 ${
                s.done ? 'text-[#2DD4BF] line-through opacity-75' : 'text-[#F3F1E8]'
              }`}
            >
              {s.done ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#14B8A6] shrink-0" />
              ) : (
                <Icon className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
              )}
              <span className="leading-tight">{s.label}</span>
            </li>
          );
        })}
      </ul>
    </aside>
  );
};

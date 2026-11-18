import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  Backpack,
  BookOpen,
  Crosshair,
  Hand,
  Map as MapIcon,
  Pause,
  Shield,
  Sparkles,
  Swords,
  Wind,
  Zap,
} from 'lucide-react';
import { AbilityId, HUDStateSnapshot } from '../game/types';
import { ZONES } from '../game/worldData';

interface GameHUDProps {
  hud: HUDStateSnapshot;
  showTouchControls: boolean;
  onTouchMove: (nx: number, ny: number) => void;
  onCameraDelta: (dx: number, dy: number) => void;
  onJump: () => void;
  onDodge: () => void;
  onAttack: (heavy: boolean) => void;
  onAbility: (id: AbilityId) => void;
  onInteract: () => void;
  onLockOn: () => void;
  onOpenModal: (modal: 'pause' | 'inventory' | 'journal' | 'map') => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  hud,
  showTouchControls,
  onTouchMove,
  onCameraDelta,
  onJump,
  onDodge,
  onAttack,
  onAbility,
  onInteract,
  onLockOn,
  onOpenModal,
}) => {
  const joyRef = useRef<HTMLDivElement | null>(null);
  const [joyOffset, setJoyOffset] = useState({ x: 0, y: 0 });
  const joyPointerId = useRef<number | null>(null);
  const camPointerId = useRef<number | null>(null);
  const camLast = useRef({ x: 0, y: 0 });

  const handleJoyStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    joyPointerId.current = e.pointerId;
    updateJoystick(e.clientX, e.clientY);
  };

  const handleJoyMove = (e: React.PointerEvent) => {
    if (joyPointerId.current !== e.pointerId) return;
    e.stopPropagation();
    updateJoystick(e.clientX, e.clientY);
  };

  const handleJoyEnd = (e: React.PointerEvent) => {
    if (joyPointerId.current !== e.pointerId) return;
    e.stopPropagation();
    joyPointerId.current = null;
    setJoyOffset({ x: 0, y: 0 });
    onTouchMove(0, 0);
  };

  const updateJoystick = (cx: number, cy: number) => {
    const el = joyRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxR = rect.width * 0.38;
    let dx = cx - centerX;
    let dy = cy - centerY;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }
    setJoyOffset({ x: dx, y: dy });
    onTouchMove(dx / maxR, dy / maxR);
  };

  const handleCamDown = (e: React.PointerEvent) => {
    camPointerId.current = e.pointerId;
    camLast.current = { x: e.clientX, y: e.clientY };
  };
  const handleCamMove = (e: React.PointerEvent) => {
    if (camPointerId.current !== e.pointerId) return;
    const dx = e.clientX - camLast.current.x;
    const dy = e.clientY - camLast.current.y;
    camLast.current = { x: e.clientX, y: e.clientY };
    onCameraDelta(dx, dy);
  };
  const handleCamEnd = (e: React.PointerEvent) => {
    if (camPointerId.current === e.pointerId) camPointerId.current = null;
  };

  const hpPct = Math.max(0, Math.min(100, (hud.hp / hud.maxHp) * 100));
  const enPct = Math.max(0, Math.min(100, (hud.chaosEnergy / hud.maxChaosEnergy) * 100));

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-3 sm:p-4">
      {showTouchControls && (
        <div
          className="fixed top-16 right-0 bottom-0 left-1/2 pointer-events-auto z-0"
          onPointerDown={handleCamDown}
          onPointerMove={handleCamMove}
          onPointerUp={handleCamEnd}
          onPointerCancel={handleCamEnd}
        />
      )}

      {/* TOP BAR: Dark & Antique Gold Vitals | Boss/Chaos Alerts | Mini-Radar & Menus */}
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="w-60 sm:w-72 bg-[#08110D]/90 border border-[#D4AF37]/40 rounded-xl p-2.5 sm:p-3 pointer-events-auto">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-display font-bold text-[#F3F1E8] tracking-wide truncate">
              {hud.currentZone.name}
            </span>
            <span className="font-mono-num text-[#D4AF37] font-bold shrink-0">
              Niv.{hud.level}
            </span>
          </div>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold text-[#F87171] w-6">PV</span>
            <div className="flex-1 h-2.5 bg-black/70 rounded-sm overflow-hidden border border-[#D4AF37]/20">
              <div
                className="h-full bg-[#DC2626] transition-all duration-150"
                style={{ width: `${hpPct}%` }}
              />
            </div>
            <span className="font-mono-num text-[11px] text-[#F3F1E8] w-14 text-right">
              {hud.hp}/{hud.maxHp}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#2DD4BF] w-6">EN</span>
            <div className="flex-1 h-2 bg-black/70 rounded-sm overflow-hidden border border-[#D4AF37]/20">
              <div
                className="h-full bg-[#14B8A6] transition-all duration-150"
                style={{ width: `${enPct}%` }}
              />
            </div>
            <span className="font-mono-num text-[11px] text-[#9EB3A8] w-14 text-right">
              {hud.chaosEnergy}/{hud.maxChaosEnergy}
            </span>
          </div>

          {hud.activeMainQuestTitle && (
            <div className="mt-2 pt-2 border-t border-[#D4AF37]/25 text-[11px] leading-snug">
              <div className="text-[#D4AF37] font-semibold truncate">{hud.activeMainQuestTitle}</div>
              {hud.activeMainQuestStep && (
                <div className="text-[#9EB3A8] truncate">{hud.activeMainQuestStep}</div>
              )}
            </div>
          )}
        </div>

        {/* Top-Center Boss, Chaos & Discovery Alerts */}
        <div className="flex-1 max-w-md flex flex-col items-center gap-2">
          {hud.bossHud.visible && (
            <div className="w-full bg-[#14090D]/94 border border-[#D4AF37]/60 rounded-xl px-4 py-2.5">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-display font-bold text-[#F3F1E8]">{hud.bossHud.name}</span>
                <span className="font-mono-num text-[#D4AF37] font-semibold">
                  Phase {hud.bossHud.phase}/3
                </span>
              </div>
              <div className="h-3 bg-black/75 rounded-sm overflow-hidden border border-[#D4AF37]/30">
                <div
                  className="h-full bg-[#DC2626] transition-all duration-150"
                  style={{ width: `${Math.max(0, (hud.bossHud.hp / hud.bossHud.maxHp) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {hud.activeChaosEvent && (
            <div
              className={`px-4 py-2 rounded-lg border text-xs font-semibold flex items-center gap-2.5 ${
                hud.activeChaosEvent.phase === 'warning'
                  ? 'bg-[#1D1506]/94 border-[#D4AF37] text-[#F2CF66]'
                  : 'bg-[#1A0D24]/94 border-[#A855F7] text-[#F3E8FF]'
              }`}
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                {hud.activeChaosEvent.phase === 'warning' ? 'CHAOS IMMINENT : ' : 'CHAOS ACTIF : '}
                {hud.activeChaosEvent.label}
              </span>
              <span className="font-mono-num text-white">{hud.activeChaosEvent.remainingSeconds}s</span>
            </div>
          )}

          {hud.discoveryBanner && (
            <div className="bg-[#08110D]/94 border border-[#D4AF37]/65 rounded-xl px-5 py-2.5 text-center">
              <div className="font-display text-sm font-bold text-[#F2CF66]">
                {hud.discoveryBanner.title}
              </div>
              <div className="text-xs text-[#9EB3A8]">{hud.discoveryBanner.subtitle}</div>
            </div>
          )}

          {hud.lockedTargetName && (
            <div className="bg-[#08110D]/90 border border-[#D4AF37]/50 rounded-md px-3 py-1 text-xs text-[#F2CF66] font-mono-num">
              Cible : {hud.lockedTargetName}
            </div>
          )}

          {hud.saveToast && (
            <div className="bg-[#0E1B15]/94 border border-[#14B8A6]/55 rounded-md px-3.5 py-1.5 text-xs text-[#F3F1E8] font-medium">
              {hud.saveToast}
            </div>
          )}
        </div>

        {/* Top-Right Mini-Radar & Utility Buttons */}
        <div className="flex items-start gap-2.5 pointer-events-auto">
          <button
            onClick={() => onOpenModal('map')}
            title="Ouvrir la Carte du Monde"
            className="hidden sm:block relative w-20 h-20 rounded-full bg-[#08110D]/92 border border-[#D4AF37]/50 overflow-hidden cursor-pointer shrink-0"
          >
            {ZONES.map((z) => {
              const rx = 40 + (z.center[0] - hud.playerPos[0]) * 0.35;
              const ry = 40 + (z.center[1] - hud.playerPos[2]) * 0.35;
              if (rx < 4 || rx > 76 || ry < 4 || ry > 76) return null;
              return (
                <div
                  key={z.id}
                  className={`absolute w-2 h-2 -ml-1 -mt-1 rounded-full ${
                    z.id === 'boss_arena'
                      ? 'bg-[#DC2626]'
                      : z.id === 'camp'
                      ? 'bg-[#D4AF37]'
                      : 'bg-[#14B8A6]'
                  }`}
                  style={{ left: rx, top: ry }}
                />
              );
            })}
            <div className="absolute left-1/2 top-1/2 w-2.5 h-2.5 -ml-1.25 -mt-1.25 rounded-full bg-[#F3F1E8] border border-[#08110D]" />
          </button>

          <div className="flex flex-wrap justify-end gap-1.5 max-w-[200px] sm:max-w-none">
            <button
              onClick={() => onOpenModal('map')}
              className="min-w-[44px] min-h-[44px] px-2.5 rounded-lg bg-[#08110D]/92 hover:bg-[#14261E] border border-[#D4AF37]/40 text-[#F3F1E8] flex items-center gap-1.5 text-xs font-medium cursor-pointer"
              aria-label="Carte"
            >
              <MapIcon className="w-4 h-4 text-[#14B8A6]" />
              <span className="hidden md:inline">Carte</span>
            </button>
            <button
              onClick={() => onOpenModal('journal')}
              className="min-w-[44px] min-h-[44px] px-2.5 rounded-lg bg-[#08110D]/92 hover:bg-[#14261E] border border-[#D4AF37]/40 text-[#F3F1E8] flex items-center gap-1.5 text-xs font-medium cursor-pointer"
              aria-label="Journal"
            >
              <BookOpen className="w-4 h-4 text-[#D4AF37]" />
              <span className="hidden md:inline">Quêtes</span>
            </button>
            <button
              onClick={() => onOpenModal('inventory')}
              className="min-w-[44px] min-h-[44px] px-2.5 rounded-lg bg-[#08110D]/92 hover:bg-[#14261E] border border-[#D4AF37]/40 text-[#F3F1E8] flex items-center gap-1.5 text-xs font-medium cursor-pointer"
              aria-label="Inventaire"
            >
              <Backpack className="w-4 h-4 text-[#F2CF66]" />
              <span className="hidden md:inline">Sac</span>
            </button>
            <button
              onClick={() => onOpenModal('pause')}
              className="min-w-[44px] min-h-[44px] px-2.5 rounded-lg bg-[#08110D]/92 hover:bg-[#14261E] border border-[#D4AF37]/50 text-[#D4AF37] flex items-center gap-1.5 text-xs font-medium cursor-pointer"
              aria-label="Pause"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM ROW: Stick (Left) | Context Interact (Center) | Combat & Powers (Right) */}
      <div className="relative z-10 flex items-end justify-between gap-4">
        <div className="pointer-events-auto">
          {showTouchControls && (
            <div
              ref={joyRef}
              onPointerDown={handleJoyStart}
              onPointerMove={handleJoyMove}
              onPointerUp={handleJoyEnd}
              onPointerCancel={handleJoyEnd}
              className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#08110D]/72 border-2 border-[#D4AF37]/45 flex items-center justify-center touch-none cursor-grab active:cursor-grabbing"
              aria-label="Joystick de déplacement"
            >
              <div
                className="w-11 h-11 rounded-full bg-[#14B8A6]/85 border-2 border-[#F2CF66] shadow-md pointer-events-none"
                style={{
                  transform: `translate(${joyOffset.x}px, ${joyOffset.y}px)`,
                }}
              />
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-2 pointer-events-auto mb-2">
          {hud.activePrompt && (
            <button
              onClick={onInteract}
              className="min-h-[46px] px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#F2CF66] text-[#08110D] font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg cursor-pointer whitespace-nowrap"
            >
              <Hand className="w-4 h-4" />
              <span>{hud.activePrompt.label}</span>
              <span className="hidden sm:inline opacity-75 font-mono-num">[E]</span>
            </button>
          )}
        </div>

        <div className="pointer-events-auto flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={onLockOn}
              className="w-11 h-11 rounded-full bg-[#08110D]/90 border border-[#D4AF37]/45 text-[#D4AF37] flex items-center justify-center cursor-pointer"
              title="Ciblage (Tab)"
              aria-label="Ciblage"
            >
              <Crosshair className="w-4 h-4" />
            </button>

            {(
              [
                { id: 'shockwave' as AbilityId, label: 'Shock', icon: Zap, color: 'border-[#14B8A6] text-[#2DD4BF]' },
                {
                  id: 'gravity_control' as AbilityId,
                  label: 'Gravité',
                  icon: Sparkles,
                  color: 'border-[#A855F7] text-[#C084FC]',
                },
                {
                  id: 'chaos_shield' as AbilityId,
                  label: 'Bouclier',
                  icon: Shield,
                  color: 'border-[#D4AF37] text-[#F2CF66]',
                },
              ] as const
            ).map((ab) => {
              const unlocked = hud.unlockedAbilities.includes(ab.id);
              const cd = hud.abilityCooldowns[ab.id] ?? 0;
              const Icon = ab.icon;
              return (
                <button
                  key={ab.id}
                  onClick={() => onAbility(ab.id)}
                  disabled={!unlocked}
                  className={`relative w-13 h-13 rounded-full bg-[#08110D]/92 border-2 flex flex-col items-center justify-center text-[10px] font-semibold transition-opacity cursor-pointer ${
                    unlocked ? ab.color : 'border-white/15 text-white/30 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{ab.label}</span>
                  {cd > 0 && (
                    <span className="absolute inset-0 rounded-full bg-black/80 flex items-center justify-center font-mono-num text-xs text-[#F2CF66]">
                      {cd.toFixed(1)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {showTouchControls && (
            <div className="flex items-center gap-2">
              <button
                onClick={onDodge}
                className="w-12 h-12 rounded-full bg-[#0E1B15]/92 active:bg-[#14B8A6] border border-[#D4AF37]/45 text-[#F3F1E8] text-[11px] font-semibold flex flex-col items-center justify-center cursor-pointer"
                aria-label="Esquive"
              >
                <Wind className="w-4 h-4 text-[#14B8A6]" />
                <span>Esquive</span>
              </button>
              <button
                onClick={() => onAttack(true)}
                className="w-13 h-13 rounded-full bg-[#1C1408]/92 active:bg-[#D4AF37] border border-[#D4AF37]/70 text-[#F2CF66] text-[11px] font-semibold flex flex-col items-center justify-center cursor-pointer"
                aria-label="Attaque Lourde"
              >
                <Swords className="w-4 h-4" />
                <span>Lourde</span>
              </button>
              <button
                onClick={() => onAttack(false)}
                className="w-16 h-16 rounded-full bg-[#DC2626]/92 active:bg-[#EF4444] border-2 border-[#D4AF37] text-white text-xs font-bold flex flex-col items-center justify-center cursor-pointer"
                aria-label="Attaque Rapide"
              >
                <Swords className="w-5 h-5" />
                <span>Attaque</span>
              </button>
              <button
                onClick={onJump}
                className="w-13 h-13 rounded-full bg-[#0E1B15]/92 active:bg-[#14B8A6] border border-[#14B8A6]/65 text-[#2DD4BF] text-[11px] font-semibold flex items-center justify-center cursor-pointer"
                aria-label="Saut"
              >
                Saut
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

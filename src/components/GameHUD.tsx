import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowUp,
  Backpack,
  BookOpen,
  Crosshair,
  Hand,
  Map as MapIcon,
  Pause,
  RotateCw,
  Shield,
  Sparkles,
  Swords,
  Wind,
  X,
  Zap,
} from 'lucide-react';
import { triggerHaptic } from '../game/haptics';
import { AbilityId, HUDStateSnapshot } from '../game/types';
import { ZONES } from '../game/worldData';

interface GameHUDProps {
  hud: HUDStateSnapshot;
  showTouchControls: boolean;
  hapticsEnabled?: boolean;
  onUnlockAudio?: () => void;
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
  hapticsEnabled = true,
  onUnlockAudio,
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
  const [isPortraitMobile, setIsPortraitMobile] = useState(false);
  const [portraitDismissed, setPortraitDismissed] = useState(false);

  useEffect(() => {
    const checkPortrait = () => {
      const portrait = window.innerHeight > window.innerWidth && window.innerWidth < 768;
      setIsPortraitMobile(portrait);
      if (!portrait) {
        setPortraitDismissed(false);
      }
    };
    checkPortrait();
    window.addEventListener('resize', checkPortrait);
    window.addEventListener('orientationchange', checkPortrait);
    return () => {
      window.removeEventListener('resize', checkPortrait);
      window.removeEventListener('orientationchange', checkPortrait);
    };
  }, []);

  const handleJoyStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    onUnlockAudio?.();
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
    onUnlockAudio?.();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore unsupported pointer capture edge case
    }
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
    if (camPointerId.current === e.pointerId) {
      camPointerId.current = null;
    }
  };

  const handleTouchJump = () => {
    onUnlockAudio?.();
    triggerHaptic('lightTap', hapticsEnabled);
    onJump();
  };

  const handleTouchDodge = () => {
    onUnlockAudio?.();
    triggerHaptic('dodge', hapticsEnabled);
    onDodge();
  };

  const handleTouchAttack = (heavy: boolean) => {
    onUnlockAudio?.();
    triggerHaptic(heavy ? 'heavySwing' : 'attackSwing', hapticsEnabled);
    onAttack(heavy);
  };

  const handleTouchAbility = (id: AbilityId) => {
    onUnlockAudio?.();
    const unlocked = hud.unlockedAbilities.includes(id);
    const cd = hud.abilityCooldowns[id] ?? 0;
    if (unlocked && cd <= 0) {
      if (id === 'shockwave') triggerHaptic('abilityShockwave', hapticsEnabled);
      else if (id === 'gravity_control') triggerHaptic('abilityGravity', hapticsEnabled);
      else triggerHaptic('abilityShield', hapticsEnabled);
    } else {
      triggerHaptic('lightTap', hapticsEnabled);
    }
    onAbility(id);
  };

  const handleTouchInteract = () => {
    onUnlockAudio?.();
    triggerHaptic('lightTap', hapticsEnabled);
    onInteract();
  };

  const handleTouchLockOn = () => {
    onUnlockAudio?.();
    triggerHaptic('lightTap', hapticsEnabled);
    onLockOn();
  };

  const hpPct = Math.max(0, Math.min(100, (hud.hp / hud.maxHp) * 100));
  const enPct = Math.max(0, Math.min(100, (hud.chaosEnergy / hud.maxChaosEnergy) * 100));

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-2 sm:p-4">
      {showTouchControls && (
        <div
          className="fixed top-16 right-0 bottom-0 left-1/2 pointer-events-auto z-0 touch-none"
          onPointerDown={handleCamDown}
          onPointerMove={handleCamMove}
          onPointerUp={handleCamEnd}
          onPointerCancel={handleCamEnd}
        />
      )}

      {/* Non-blocking Landscape Recommendation Banner on Portrait Mobile */}
      {isPortraitMobile && !portraitDismissed && (
        <div className="wc-panel fixed top-2 left-1/2 -translate-x-1/2 z-30 pointer-events-auto max-w-[92vw] rounded-xl px-3 py-2 flex items-center gap-2 text-[11px] text-[#F2CF66]">
          <RotateCw className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
          <span className="truncate font-medium">Mode Paysage recommandé</span>
          <button
            onClick={() => setPortraitDismissed(true)}
            className="min-w-[28px] min-h-[28px] rounded-md bg-[#14261E] border border-[#D4AF37]/30 text-[#F3F1E8] flex items-center justify-center cursor-pointer shrink-0"
            aria-label="Fermer le conseil d'orientation"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* TOP BAR: Dark & Antique Gold Vitals | Boss/Chaos Alerts | Mini-Radar & Menus */}
      <div className="relative z-10 flex items-start justify-between gap-2 sm:gap-3">
        <div className="wc-panel w-44 sm:w-68 md:w-72 rounded-xl p-2.5 sm:p-3.5 pointer-events-auto shrink-0">
          <div className="flex items-center justify-between text-[11px] sm:text-xs mb-1.5 gap-1">
            <span className="font-display font-bold text-[#F3F1E8] tracking-wide truncate">
              {hud.currentZone.name}
            </span>
            <span className="font-mono-num text-[#F2CF66] font-bold shrink-0 px-1.5 py-0.5 rounded bg-[#14261E] border border-[#D4AF37]/35 text-[10px]">
              Niv.{hud.level}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#F87171] w-5 sm:w-6">PV</span>
            <div className="wc-bar-frame flex-1 h-2 sm:h-2.5 rounded-sm overflow-hidden">
              <div
                className="h-full bg-[linear-gradient(90deg,#991B1B_0%,#DC2626_65%,#F87171_100%)] transition-all duration-150"
                style={{ width: `${hpPct}%` }}
              />
            </div>
            <span className="font-mono-num text-[10px] sm:text-[11px] text-[#F3F1E8] w-11 sm:w-14 text-right">
              {hud.hp}/{hud.maxHp}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#2DD4BF] w-5 sm:w-6">EN</span>
            <div className="wc-bar-frame flex-1 h-1.5 sm:h-2 rounded-sm overflow-hidden">
              <div
                className="h-full bg-[linear-gradient(90deg,#0F766E_0%,#14B8A6_65%,#5EEAD4_100%)] transition-all duration-150"
                style={{ width: `${enPct}%` }}
              />
            </div>
            <span className="font-mono-num text-[10px] sm:text-[11px] text-[#9EB3A8] w-11 sm:w-14 text-right">
              {hud.chaosEnergy}/{hud.maxChaosEnergy}
            </span>
          </div>

          {hud.activeMainQuestTitle && (
            <div className="hidden sm:block mt-2.5 pt-2 text-[11px] leading-snug">
              <div className="wc-divider-gold mb-2" />
              <div className="text-[#F2CF66] font-semibold truncate">{hud.activeMainQuestTitle}</div>
              {hud.activeMainQuestStep && (
                <div className="text-[#9EB3A8] truncate">{hud.activeMainQuestStep}</div>
              )}
            </div>
          )}

          {hud.perfStats && (
            <div className="mt-2.5 pt-2 border-t border-[#D4AF37]/30 text-[10px] font-mono-num leading-tight space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[#9EB3A8] flex items-center gap-1 font-sans">
                  <Activity className="w-3 h-3 text-[#14B8A6]" /> FPS:
                </span>
                <span
                  className={`font-bold ${
                    hud.perfStats.fps >= 55
                      ? 'text-[#4ADE80]'
                      : hud.perfStats.fps >= 30
                      ? 'text-[#FACC15]'
                      : 'text-[#F87171]'
                  }`}
                >
                  {hud.perfStats.fps}{' '}
                  <span className="text-[9px] text-white/50">
                    ({hud.perfStats.minFps}-{hud.perfStats.maxFps})
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between text-white/80">
                <span className="text-[#9EB3A8] font-sans">Frametime:</span>
                <span>{hud.perfStats.frametimeMs} ms</span>
              </div>
              <div className="flex items-center justify-between text-white/80">
                <span className="text-[#9EB3A8] font-sans">Draw / Tris:</span>
                <span>
                  {hud.perfStats.drawCalls} / {Math.round(hud.perfStats.triangles / 1000)}k
                </span>
              </div>
              <div className="flex items-center justify-between text-white/65 text-[9px]">
                <span className="text-[#9EB3A8] font-sans">GPU Res:</span>
                <span>
                  {hud.perfStats.textures} tex · {hud.perfStats.geometries} geo
                </span>
              </div>
              {typeof hud.perfStats.jsHeapUsedMb === 'number' && (
                <div className="flex items-center justify-between text-white/65 text-[9px]">
                  <span className="text-[#9EB3A8] font-sans">JS Heap:</span>
                  <span>{hud.perfStats.jsHeapUsedMb} MB</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Top-Center Boss, Chaos & Discovery Alerts */}
        <div className="flex-1 max-w-md flex flex-col items-center gap-2">
          {hud.bossHud.visible && (
            <div className="wc-panel-crimson w-full rounded-xl px-4 py-2.5">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-display font-bold text-[#F3F1E8] tracking-wide">
                  {hud.bossHud.name}
                </span>
                <span className="font-mono-num text-[#F2CF66] font-semibold">
                  Phase {hud.bossHud.phase}/3
                </span>
              </div>
              <div className="wc-bar-frame h-3 rounded-sm overflow-hidden">
                <div
                  className="h-full bg-[linear-gradient(90deg,#9F1239_0%,#DC2626_70%,#F59E0B_100%)] transition-all duration-150"
                  style={{ width: `${Math.max(0, (hud.bossHud.hp / hud.bossHud.maxHp) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {hud.activeChaosEvent && (
            <div
              className={`px-4 py-2 rounded-lg border text-xs font-semibold flex items-center gap-2.5 shadow-lg ${
                hud.activeChaosEvent.phase === 'warning'
                  ? 'bg-[#1D1506]/95 border-[#D4AF37] text-[#F2CF66]'
                  : 'bg-[#1A0D24]/95 border-[#A855F7] text-[#F3E8FF]'
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
            <div className="wc-panel rounded-xl px-5 py-2.5 text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="w-4 h-px bg-[#D4AF37]/60" />
                <div className="font-display text-sm font-bold text-[#F2CF66] tracking-wide">
                  {hud.discoveryBanner.title}
                </div>
                <span className="w-4 h-px bg-[#D4AF37]/60" />
              </div>
              <div className="text-xs text-[#9EB3A8] mt-0.5">{hud.discoveryBanner.subtitle}</div>
            </div>
          )}

          {hud.lockedTargetName && (
            <div className="wc-panel rounded-md px-3 py-1 text-xs text-[#F2CF66] font-mono-num">
              Cible : {hud.lockedTargetName}
            </div>
          )}

          {hud.saveToast && (
            <div className="bg-[#0E1B15]/95 border border-[#14B8A6]/60 rounded-md px-3.5 py-1.5 text-xs text-[#F3F1E8] font-medium shadow-lg">
              {hud.saveToast}
            </div>
          )}
        </div>

        {/* Top-Right Mini-Radar & Utility Buttons */}
        <div className="flex items-start gap-2.5 pointer-events-auto">
          <button
            onClick={() => onOpenModal('map')}
            title="Ouvrir la Carte du Monde"
            className="hidden sm:block relative w-20 h-20 rounded-full bg-[#060D0A]/94 border-2 border-[#D4AF37]/60 overflow-hidden cursor-pointer shrink-0 shadow-[0_6px_20px_rgba(0,0,0,0.6)]"
          >
            {/* Compass Hairlines & N/S Ticks */}
            <div className="absolute inset-1.5 rounded-full border border-[#D4AF37]/25 pointer-events-none" />
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#D4AF37]/12 pointer-events-none" />
            <div className="absolute top-1/2 left-0 right-0 h-px bg-[#D4AF37]/12 pointer-events-none" />
            <span className="absolute top-0.5 left-1/2 -translate-x-1/2 text-[8px] font-bold text-[#D4AF37]/80 pointer-events-none">
              N
            </span>
            {ZONES.map((z) => {
              const rx = 40 + (z.center[0] - hud.playerPos[0]) * 0.35;
              const ry = 40 + (z.center[1] - hud.playerPos[2]) * 0.35;
              if (rx < 5 || rx > 75 || ry < 5 || ry > 75) return null;
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
            <div className="absolute left-1/2 top-1/2 w-2.5 h-2.5 -ml-1.25 -mt-1.25 rounded-full bg-[#F3F1E8] border border-[#D4AF37]" />
          </button>

          <div className="flex flex-wrap justify-end gap-1.5 max-w-[200px] sm:max-w-none">
            <button
              onClick={() => onOpenModal('map')}
              className="min-w-[44px] min-h-[44px] px-2.5 rounded-lg bg-[#08110D]/94 hover:bg-[#14261E] border border-[#D4AF37]/42 text-[#F3F1E8] flex items-center gap-1.5 text-xs font-medium cursor-pointer"
              aria-label="Carte"
            >
              <MapIcon className="w-4 h-4 text-[#14B8A6]" />
              <span className="hidden md:inline">Carte</span>
            </button>
            <button
              onClick={() => onOpenModal('journal')}
              className="min-w-[44px] min-h-[44px] px-2.5 rounded-lg bg-[#08110D]/94 hover:bg-[#14261E] border border-[#D4AF37]/42 text-[#F3F1E8] flex items-center gap-1.5 text-xs font-medium cursor-pointer"
              aria-label="Journal"
            >
              <BookOpen className="w-4 h-4 text-[#D4AF37]" />
              <span className="hidden md:inline">Quêtes</span>
            </button>
            <button
              onClick={() => onOpenModal('inventory')}
              className="min-w-[44px] min-h-[44px] px-2.5 rounded-lg bg-[#08110D]/94 hover:bg-[#14261E] border border-[#D4AF37]/42 text-[#F3F1E8] flex items-center gap-1.5 text-xs font-medium cursor-pointer"
              aria-label="Inventaire"
            >
              <Backpack className="w-4 h-4 text-[#F2CF66]" />
              <span className="hidden md:inline">Sac</span>
            </button>
            <button
              onClick={() => onOpenModal('pause')}
              className="min-w-[44px] min-h-[44px] px-2.5 rounded-lg bg-[#08110D]/94 hover:bg-[#14261E] border border-[#D4AF37]/55 text-[#D4AF37] flex items-center gap-1.5 text-xs font-medium cursor-pointer"
              aria-label="Pause"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM ROW: Stick or Key Legend (Left) | Context Interact (Center) | Combat & Powers (Right) */}
      <div className="relative z-10 flex items-end justify-between gap-2 sm:gap-4">
        <div className="pointer-events-auto shrink-0">
          {showTouchControls ? (
            <div
              ref={joyRef}
              onPointerDown={handleJoyStart}
              onPointerMove={handleJoyMove}
              onPointerUp={handleJoyEnd}
              onPointerCancel={handleJoyEnd}
              className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-[#060D0A]/78 border-2 border-[#D4AF37]/55 flex items-center justify-center touch-none cursor-grab active:cursor-grabbing shadow-xl"
              aria-label="Joystick de déplacement"
            >
              <div className="absolute inset-2.5 rounded-full border border-[#D4AF37]/20 pointer-events-none" />
              <div
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[radial-gradient(circle_at_35%_30%,#5EEAD4,#0F766E)] border-2 border-[#F2CF66] shadow-md pointer-events-none"
                style={{
                  transform: `translate(${joyOffset.x}px, ${joyOffset.y}px)`,
                }}
              />
            </div>
          ) : (
            <div className="hidden md:flex wc-panel rounded-xl px-3 py-2 text-[10px] text-[#9EB3A8] items-center gap-2.5">
              <span>
                <strong className="text-[#F2CF66] font-mono-num">ZQSD / Flèches</strong> Bouger
              </span>
              <span className="text-[#D4AF37]/40">•</span>
              <span>
                <strong className="text-[#F2CF66] font-mono-num">Glisser</strong> Caméra
              </span>
              <span className="text-[#D4AF37]/40">•</span>
              <span>
                <strong className="text-[#F2CF66] font-mono-num">Clic G / J</strong> Attaque
              </span>
              <span className="text-[#D4AF37]/40">•</span>
              <span>
                <strong className="text-[#F2CF66] font-mono-num">Clic D / Shift</strong> Esquive
              </span>
              <span className="text-[#D4AF37]/40">•</span>
              <span>
                <strong className="text-[#F2CF66] font-mono-num">Espace</strong> Saut
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-2 pointer-events-auto mb-1 sm:mb-2 min-w-0">
          {hud.activePrompt && (
            <button
              onClick={handleTouchInteract}
              className="wc-btn-gold min-h-[44px] sm:min-h-[46px] px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 cursor-pointer max-w-[44vw] sm:max-w-none truncate"
            >
              <Hand className="w-4 h-4 shrink-0" />
              <span className="truncate">{hud.activePrompt.label}</span>
              <span className="hidden sm:inline opacity-80 font-mono-num">[E]</span>
            </button>
          )}
        </div>

        <div className="pointer-events-auto flex flex-col items-end gap-1.5 sm:gap-2 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleTouchLockOn}
              className="relative w-11 h-11 rounded-full bg-[#08110D]/94 hover:bg-[#14261E] border border-[#D4AF37]/50 text-[#D4AF37] flex items-center justify-center cursor-pointer shadow-md"
              title="Ciblage (Tab)"
              aria-label="Ciblage"
            >
              <Crosshair className="w-4 h-4" />
              {!showTouchControls && (
                <span className="hidden sm:inline-block absolute -top-1.5 -right-1 px-1 rounded bg-[#060D0A] border border-[#D4AF37]/50 text-[8px] font-mono-num text-[#F2CF66]">
                  Tab
                </span>
              )}
            </button>

            {(
              [
                {
                  id: 'shockwave' as AbilityId,
                  label: 'Shock',
                  keyHint: '1',
                  icon: Zap,
                  color: 'border-[#14B8A6] text-[#5EEAD4] shadow-[0_0_12px_rgba(20,184,166,0.22)]',
                },
                {
                  id: 'gravity_control' as AbilityId,
                  label: 'Gravité',
                  keyHint: '2',
                  icon: Sparkles,
                  color: 'border-[#A855F7] text-[#D8B4FE] shadow-[0_0_12px_rgba(168,85,247,0.24)]',
                },
                {
                  id: 'chaos_shield' as AbilityId,
                  label: 'Bouclier',
                  keyHint: '3',
                  icon: Shield,
                  color: 'border-[#D4AF37] text-[#F2CF66] shadow-[0_0_12px_rgba(212,175,55,0.24)]',
                },
              ] as const
            ).map((ab) => {
              const unlocked = hud.unlockedAbilities.includes(ab.id);
              const cd = hud.abilityCooldowns[ab.id] ?? 0;
              const Icon = ab.icon;
              return (
                <button
                  key={ab.id}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleTouchAbility(ab.id)}
                  disabled={!unlocked}
                  title={`${ab.label} (${ab.keyHint})`}
                  className={`relative w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-[#08110D]/94 border-2 flex flex-col items-center justify-center text-[9px] sm:text-[10px] font-semibold transition-opacity cursor-pointer ${
                    unlocked ? ab.color : 'border-white/15 text-white/30 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{ab.label}</span>
                  {!showTouchControls && (
                    <span className="hidden sm:inline-block absolute -top-1.5 -right-1 px-1 rounded bg-[#060D0A] border border-[#D4AF37]/50 text-[8px] font-mono-num text-[#F2CF66]">
                      {ab.keyHint}
                    </span>
                  )}
                  {cd > 0 && (
                    <span className="absolute inset-0 rounded-full bg-[#060D0A]/85 flex items-center justify-center font-mono-num text-xs text-[#F2CF66]">
                      {cd.toFixed(1)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleTouchDodge}
              title="Esquive (Shift / Clic droit)"
              className="relative w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-[#0E1B15]/94 hover:bg-[#14261E] active:bg-[#14B8A6] border border-[#D4AF37]/50 text-[#F3F1E8] text-[9px] sm:text-[10px] font-semibold flex flex-col items-center justify-center cursor-pointer shadow-md"
              aria-label="Esquive"
            >
              <Wind className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#14B8A6]" />
              <span>Esquive</span>
              {!showTouchControls && (
                <span className="hidden sm:inline-block absolute -top-1.5 -right-1 px-1 rounded bg-[#060D0A] border border-[#D4AF37]/50 text-[8px] font-mono-num text-[#F2CF66]">
                  Shift
                </span>
              )}
            </button>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleTouchAttack(true)}
              title="Attaque Lourde (K)"
              className="relative w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-[#1C1408]/94 hover:bg-[#2C200C] active:bg-[#D4AF37] border border-[#D4AF37]/75 text-[#F2CF66] text-[9px] sm:text-[10px] font-semibold flex flex-col items-center justify-center cursor-pointer shadow-md"
              aria-label="Attaque Lourde"
            >
              <Swords className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Lourde</span>
              {!showTouchControls && (
                <span className="hidden sm:inline-block absolute -top-1.5 -right-1 px-1 rounded bg-[#060D0A] border border-[#D4AF37]/50 text-[8px] font-mono-num text-[#F2CF66]">
                  K
                </span>
              )}
            </button>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleTouchAttack(false)}
              title="Attaque Rapide (Clic gauche / J)"
              className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[radial-gradient(circle_at_35%_30%,#EF4444,#991B1B)] hover:brightness-110 active:bg-[#EF4444] border-2 border-[#F2CF66] text-white text-[10px] sm:text-xs font-bold flex flex-col items-center justify-center cursor-pointer shadow-lg"
              aria-label="Attaque Rapide"
            >
              <Swords className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Attaque</span>
              {!showTouchControls && (
                <span className="hidden sm:inline-block absolute -top-1.5 -right-0.5 px-1.5 rounded bg-[#060D0A] border border-[#F2CF66]/70 text-[9px] font-mono-num text-[#F2CF66]">
                  J
                </span>
              )}
            </button>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleTouchJump}
              title="Sauter / Double Saut (Espace)"
              className="relative w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-[#0E1B15]/94 hover:bg-[#14261E] active:bg-[#14B8A6] border border-[#14B8A6]/70 text-[#2DD4BF] text-[9px] sm:text-[10px] font-semibold flex flex-col items-center justify-center cursor-pointer shadow-md"
              aria-label="Saut"
            >
              <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Saut</span>
              {!showTouchControls && (
                <span className="hidden sm:inline-block absolute -top-1.5 -right-1 px-1 rounded bg-[#060D0A] border border-[#14B8A6]/60 text-[8px] font-mono-num text-[#5EEAD4]">
                  Esp
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Award,
  BookMarked,
  CheckCircle2,
  Cloud,
  Cog,
  Compass,
  FlaskConical,
  Gem,
  Globe2,
  Lock,
  MapPin,
  Play,
  Power,
  Rocket,
  RotateCcw,
  Save,
  Skull,
  Sparkles,
  Volume2,
  X,
} from 'lucide-react';
import {
  ChaosEventType,
  GameSettings,
  GraphicsQuality,
  ItemCategory,
  SaveDataV1,
} from '../game/types';
import { ITEMS, PUZZLES, QUESTS, ZONES } from '../game/worldData';

interface ModalContainerProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const ModalFrame: React.FC<ModalContainerProps> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/78 pointer-events-auto">
    <div className="wc-panel relative w-full max-w-3xl max-h-[88vh] rounded-2xl flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 bg-[#0E1B15]">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rotate-45 bg-[#D4AF37]" aria-hidden="true" />
          <h2 className="font-display text-lg font-bold text-[#F3F1E8] tracking-wide">{title}</h2>
        </div>
        <button
          onClick={onClose}
          className="min-w-[44px] min-h-[44px] rounded-lg bg-[#14261E] hover:bg-[#1E382C] border border-[#D4AF37]/35 text-[#F3F1E8] flex items-center justify-center cursor-pointer"
          aria-label="Fermer"
        >
          <X className="w-4 h-4 text-[#D4AF37]" />
        </button>
      </div>
      <div className="wc-divider-gold" />
      <div className="p-5 overflow-y-auto flex-1">{children}</div>
    </div>
  </div>
);

function renderCategoryEmblem(category: ItemCategory, color: string) {
  const props = { className: 'w-4 h-4', style: { color } };
  switch (category) {
    case 'consumable':
      return <FlaskConical {...props} />;
    case 'quest':
      return <Compass {...props} />;
    case 'crystal':
      return <Gem {...props} />;
    case 'resource':
      return <Cog {...props} />;
    case 'chaos_core':
      return <Award {...props} />;
    default:
      return <Sparkles {...props} />;
  }
}

export const InventoryModal: React.FC<{
  saveData: SaveDataV1;
  onUseItem: (id: string) => void;
  onClose: () => void;
}> = ({ saveData, onUseItem, onClose }) => {
  const [filter, setFilter] = useState<'all' | ItemCategory>('all');
  const [selectedId, setSelectedId] = useState<string | null>(
    saveData.inventory[0]?.itemId ?? null
  );

  const filtered = saveData.inventory.filter((stack) => {
    if (filter === 'all') return true;
    return ITEMS[stack.itemId]?.category === filter;
  });

  const selectedDef = selectedId ? ITEMS[selectedId] : null;
  const selectedStack = saveData.inventory.find((s) => s.itemId === selectedId);

  return (
    <ModalFrame title="Inventaire de l’Explorateur" onClose={onClose}>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {(
          [
            ['all', 'Tout'],
            ['consumable', 'Consommables'],
            ['quest', 'Quêtes'],
            ['artifact', 'Artéfacts'],
            ['crystal', 'Cristaux'],
            ['resource', 'Ressources'],
            ['chaos_core', 'Chaos Cores'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              filter === key
                ? 'bg-[#D4AF37] text-[#08110D]'
                : 'bg-[#0E1B15] text-[#9EB3A8] hover:text-[#F3F1E8] border border-white/10'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-2.5 content-start">
          {filtered.length === 0 ? (
            <div className="col-span-full py-10 text-center text-sm text-[#9EB3A8]">
              Aucun objet dans cette catégorie. Explorez The Lost Jungle pour découvrir des reliques.
            </div>
          ) : (
            filtered.map((stack) => {
              const def = ITEMS[stack.itemId];
              if (!def) return null;
              return (
                <button
                  key={stack.itemId}
                  onClick={() => setSelectedId(stack.itemId)}
                  className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                    selectedId === stack.itemId
                      ? 'bg-[#14261E] border-[#D4AF37]'
                      : 'bg-[#0E1B15] border-white/10 hover:border-[#D4AF37]/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="w-7 h-7 rounded-lg bg-[#08110D] border border-[#D4AF37]/30 flex items-center justify-center shrink-0">
                      {renderCategoryEmblem(def.category, def.color)}
                    </span>
                    <span className="font-mono-num text-xs text-[#D4AF37] font-bold">
                      x{stack.quantity}
                    </span>
                  </div>
                  <div className="mt-2 text-xs font-semibold text-[#F3F1E8] truncate">
                    {def.name}
                  </div>
                  <div className="text-[11px] text-[#9EB3A8] capitalize">{def.category}</div>
                </button>
              );
            })
          )}
        </div>

        <div className="bg-[#0E1B15] border border-[#D4AF37]/25 rounded-xl p-4 flex flex-col justify-between gap-4">
          {selectedDef && selectedStack ? (
            <>
              <div>
                <div className="text-xs text-[#D4AF37] capitalize">{selectedDef.category}</div>
                <h3 className="font-display text-base font-bold text-[#F3F1E8] mt-0.5">
                  {selectedDef.name}
                </h3>
                <p className="text-xs text-[#9EB3A8] mt-2 leading-relaxed">
                  {selectedDef.description}
                </p>
              </div>
              {selectedDef.usable && (
                <button
                  onClick={() => onUseItem(selectedDef.id)}
                  className="min-h-[44px] w-full rounded-lg bg-[#D4AF37] hover:bg-[#F2CF66] text-[#08110D] font-bold text-xs cursor-pointer"
                >
                  Utiliser
                </button>
              )}
            </>
          ) : (
            <div className="text-xs text-[#9EB3A8]">Sélectionnez un objet pour voir ses détails.</div>
          )}
        </div>
      </div>
    </ModalFrame>
  );
};

export const JournalModal: React.FC<{
  saveData: SaveDataV1;
  onClose: () => void;
}> = ({ saveData, onClose }) => {
  const [tab, setTab] = useState<'main' | 'side' | 'puzzles'>('main');

  return (
    <ModalFrame title="Journal d’Expédition" onClose={onClose}>
      <div className="flex gap-2 mb-4">
        {(
          [
            ['main', 'Quêtes Principales (5)'],
            ['side', 'Quêtes Secondaires (5)'],
            ['puzzles', 'Énigmes & Indices (5)'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
              tab === k
                ? 'bg-[#D4AF37] text-[#08110D]'
                : 'bg-[#0E1B15] text-[#9EB3A8] hover:text-[#F3F1E8] border border-white/10'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'puzzles' ? (
        <div className="space-y-3">
          {Object.values(PUZZLES).map((p) => {
            const solved = saveData.worldState.solvedPuzzles.includes(p.id);
            const hintLvl = saveData.worldState.puzzleHintsUnlocked[p.id] ?? 1;
            return (
              <div
                key={p.id}
                className="p-3.5 rounded-xl bg-[#0E1B15] border border-[#D4AF37]/25"
              >
                <div className="flex items-center justify-between">
                  <span className="font-display font-semibold text-sm text-[#F3F1E8]">{p.name}</span>
                  <span
                    className={`text-xs font-semibold ${
                      solved ? 'text-[#14B8A6]' : 'text-[#D4AF37]'
                    }`}
                  >
                    {solved ? 'Résolue' : 'En cours'}
                  </span>
                </div>
                <p className="text-xs text-[#9EB3A8] mt-1.5">{p.hints[hintLvl - 1]}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {QUESTS.filter((q) => q.category === tab).map((q) => {
            const qp = saveData.quests[q.id];
            const status = qp?.status ?? 'locked';
            return (
              <div
                key={q.id}
                className="p-3.5 rounded-xl bg-[#0E1B15] border border-[#D4AF37]/25"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-sm font-bold text-[#F3F1E8]">{q.title}</h3>
                  <span
                    className={`text-xs font-semibold flex items-center gap-1 ${
                      status === 'completed'
                        ? 'text-[#14B8A6]'
                        : status === 'active'
                        ? 'text-[#D4AF37]'
                        : 'text-white/40'
                    }`}
                  >
                    {status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {status === 'completed' ? 'Terminée' : status === 'active' ? 'Active' : 'Verrouillée'}
                  </span>
                </div>
                <p className="text-xs text-[#9EB3A8] mt-1">{q.summary}</p>
                <div className="mt-2.5 space-y-1">
                  {q.objectives.map((o) => {
                    const count = qp?.objectiveCounts[o.id] ?? 0;
                    const done = count >= o.targetCount;
                    return (
                      <div
                        key={o.id}
                        className={`flex items-center justify-between text-xs ${
                          done ? 'text-[#14B8A6]' : 'text-[#9EB3A8]'
                        }`}
                      >
                        <span>{o.description}</span>
                        <span className="font-mono-num">
                          {count}/{o.targetCount}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ModalFrame>
  );
};

export const WorldMapModal: React.FC<{
  saveData: SaveDataV1;
  playerPos: [number, number, number];
  onClose: () => void;
}> = ({ saveData, playerPos, onClose }) => {
  const toPct = (val: number) => ((val + 115) / 230) * 100;

  return (
    <ModalFrame title="Carte du Monde 1 — The Lost Jungle" onClose={onClose}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative aspect-square bg-[#060D0A] border border-[#D4AF37]/45 rounded-xl overflow-hidden shadow-inner">
          {/* Topographic coordinate grid & engraved compass rose */}
          <svg
            viewBox="0 0 100 100"
            className="absolute inset-0 w-full h-full pointer-events-none"
            aria-hidden="true"
          >
            <path
              d="M25 0V100 M50 0V100 M75 0V100 M0 25H100 M0 50H100 M0 75H100"
              stroke="rgba(212,175,55,0.10)"
              strokeWidth="0.35"
            />
            <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(20,184,166,0.12)" strokeWidth="0.4" strokeDasharray="1.5 1.5" />
          </svg>
          <div className="absolute top-2 right-2.5 text-[10px] font-mono-num font-bold text-[#D4AF37]/75 tracking-widest pointer-events-none">
            N · E / S · O
          </div>
          {ZONES.map((z) => {
            const discovered = saveData.worldState.discoveredZones.includes(z.id);
            return (
              <div
                key={z.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 text-center"
                style={{ left: `${toPct(z.center[0])}%`, top: `${toPct(z.center[1])}%` }}
              >
                <div
                  className={`w-4 h-4 mx-auto rounded-full border ${
                    z.id === 'boss_arena'
                      ? 'bg-[#DC2626] border-[#F2CF66]'
                      : discovered
                      ? 'bg-[#14B8A6] border-[#F3F1E8]'
                      : 'bg-white/20 border-white/40'
                  }`}
                />
                <div className="mt-0.5 text-[10px] font-semibold text-[#F3F1E8] whitespace-nowrap bg-[#08110D]/85 px-1.5 rounded border border-[#D4AF37]/25">
                  {z.name}
                </div>
              </div>
            );
          })}

          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#D4AF37] border-2 border-white shadow"
            style={{ left: `${toPct(playerPos[0])}%`, top: `${toPct(playerPos[2])}%` }}
            title="Position actuelle"
          />
        </div>

        <div className="space-y-2 text-xs">
          <div className="text-[#D4AF37] font-semibold">
            Zones découvertes ({saveData.worldState.discoveredZones.length}/10)
          </div>
          <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
            {ZONES.map((z) => {
              const found = saveData.worldState.discoveredZones.includes(z.id);
              return (
                <div
                  key={z.id}
                  className="p-2 rounded-lg bg-[#0E1B15] border border-white/10 flex items-start gap-2"
                >
                  <MapPin
                    className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                      found ? 'text-[#14B8A6]' : 'text-white/30'
                    }`}
                  />
                  <div>
                    <div className="font-semibold text-[#F3F1E8]">{z.name}</div>
                    <div className="text-[11px] text-[#9EB3A8]">{z.subtitle}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ModalFrame>
  );
};

export const SettingsModal: React.FC<{
  settings: GameSettings;
  onChange: (next: GameSettings) => void;
  onClose: () => void;
}> = ({ settings, onChange, onClose }) => {
  const update = <K extends keyof GameSettings>(key: K, val: GameSettings[K]) => {
    onChange({ ...settings, [key]: val });
  };

  return (
    <ModalFrame title="Paramètres du Jeu" onClose={onClose}>
      <div className="space-y-5 text-sm">
        <div>
          <label className="block text-xs font-semibold text-[#D4AF37] mb-2">
            Qualité Graphique (Mobile &amp; Desktop)
          </label>
          <div className="flex gap-2">
            {(['LOW', 'MEDIUM', 'HIGH'] as GraphicsQuality[]).map((q) => (
              <button
                key={q}
                onClick={() => update('graphicsQuality', q)}
                className={`min-h-[42px] px-4 rounded-lg text-xs font-bold cursor-pointer ${
                  settings.graphicsQuality === q
                    ? 'bg-[#D4AF37] text-[#08110D]'
                    : 'bg-[#0E1B15] text-[#9EB3A8] hover:text-[#F3F1E8] border border-white/10'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(
            [
              ['masterVolume', 'Volume Principal'],
              ['musicVolume', 'Musique'],
              ['sfxVolume', 'Effets Sonores'],
              ['ambienceVolume', 'Ambiance Jungle'],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <div className="flex justify-between text-xs text-[#F3F1E8]/85 mb-1">
                <span className="flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-[#D4AF37]" /> {label}
                </span>
                <span className="font-mono-num text-[#D4AF37]">{Math.round(settings[key] * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={settings[key]}
                onChange={(e) => update(key, Number(e.target.value))}
                className="w-full accent-[#D4AF37]"
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/10">
          <div>
            <div className="flex justify-between text-xs text-[#F3F1E8]/85 mb-1">
              <span>Sensibilité Caméra</span>
              <span className="font-mono-num text-[#14B8A6]">{settings.cameraSensitivity.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min={0.4}
              max={2.0}
              step={0.1}
              value={settings.cameraSensitivity}
              onChange={(e) => update('cameraSensitivity', Number(e.target.value))}
              className="w-full accent-[#14B8A6]"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-[#F3F1E8]/85 mb-1">
              <span>Distance Caméra</span>
              <span className="font-mono-num text-[#14B8A6]">{settings.cameraDistance.toFixed(1)}m</span>
            </div>
            <input
              type="range"
              min={5.5}
              max={13}
              step={0.5}
              value={settings.cameraDistance}
              onChange={(e) => update('cameraDistance', Number(e.target.value))}
              className="w-full accent-[#14B8A6]"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 pt-2">
          <label className="flex items-center gap-2 text-xs text-[#F3F1E8] cursor-pointer">
            <input
              type="checkbox"
              checked={settings.invertY}
              onChange={(e) => update('invertY', e.target.checked)}
              className="accent-[#D4AF37] w-4 h-4"
            />
            Inverser l’axe vertical caméra
          </label>
          <label className="flex items-center gap-2 text-xs text-[#F3F1E8] cursor-pointer">
            <input
              type="checkbox"
              checked={settings.showTouchControls}
              onChange={(e) => update('showTouchControls', e.target.checked)}
              className="accent-[#D4AF37] w-4 h-4"
            />
            Afficher les contrôles tactiles à l’écran
          </label>
          <label className="flex items-center gap-2 text-xs text-[#F3F1E8] cursor-pointer">
            <input
              type="checkbox"
              checked={settings.hapticsEnabled !== false}
              onChange={(e) => update('hapticsEnabled', e.target.checked)}
              className="accent-[#D4AF37] w-4 h-4"
            />
            Vibrations tactiles en combat (mobile)
          </label>
          <label className="flex items-center gap-2 text-xs text-[#F3F1E8] cursor-pointer">
            <input
              type="checkbox"
              checked={!settings.tutorialCompleted}
              onChange={(e) => update('tutorialCompleted', !e.target.checked)}
              className="accent-[#D4AF37] w-4 h-4"
            />
            Afficher le tutoriel de prise en main
          </label>
          <label className="flex items-center gap-2 text-xs text-[#F3F1E8] cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(settings.showPerfOverlay)}
              onChange={(e) => update('showPerfOverlay', e.target.checked)}
              className="accent-[#D4AF37] w-4 h-4"
            />
            Afficher les métriques de performance en jeu (FPS / Frametime / GPU) [F3]
          </label>
        </div>
      </div>
    </ModalFrame>
  );
};

export const PauseModal: React.FC<{
  onResume: () => void;
  onSave: () => void;
  onOpenCloud: () => void;
  onOpenArtBible: () => void;
  onOpenStoreKit: () => void;
  onOpenSettings: () => void;
  onTriggerChaos: (t: ChaosEventType) => void;
  onMainMenu: () => void;
}> = ({
  onResume,
  onSave,
  onOpenCloud,
  onOpenArtBible,
  onOpenStoreKit,
  onOpenSettings,
  onTriggerChaos,
  onMainMenu,
}) => (
  <ModalFrame title="Jeu en Pause" onClose={onResume}>
    <div className="flex flex-col gap-3 max-w-sm mx-auto">
      <button
        onClick={onResume}
        className="min-h-[46px] rounded-xl bg-[#D4AF37] hover:bg-[#F2CF66] text-[#08110D] font-bold text-sm cursor-pointer"
      >
        Reprendre l’aventure
      </button>
      <button
        onClick={onSave}
        className="min-h-[46px] rounded-xl bg-[#0E1B15] hover:bg-[#162B22] border border-[#D4AF37]/45 text-[#F3F1E8] font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
      >
        <Save className="w-4 h-4 text-[#D4AF37]" /> Sauvegarder maintenant
      </button>
      <button
        onClick={onOpenCloud}
        className="min-h-[44px] rounded-xl bg-[#0E1B15] hover:bg-[#162B22] border border-[#14B8A6]/45 text-[#F3F1E8] font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
      >
        <Cloud className="w-4 h-4 text-[#14B8A6]" /> Sauvegarde Cloud &amp; Classement
      </button>
      <button
        onClick={onOpenArtBible}
        className="min-h-[44px] rounded-xl bg-[#0E1B15] hover:bg-[#162B22] border border-[#14B8A6]/45 text-[#14B8A6] font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
      >
        <BookMarked className="w-4 h-4" /> Consulter la Bible Graphique V1.0
      </button>
      <button
        onClick={onOpenStoreKit}
        className="min-h-[44px] rounded-xl bg-[#0E1B15] hover:bg-[#162B22] border border-[#D4AF37]/40 text-[#F2CF66] font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
      >
        <Rocket className="w-4 h-4 text-[#D4AF37]" /> Kit Publication Stores
      </button>
      <button
        onClick={onOpenSettings}
        className="min-h-[44px] rounded-xl bg-[#0E1B15] hover:bg-[#162B22] border border-[#D4AF37]/30 text-[#F3F1E8] font-semibold text-sm cursor-pointer"
      >
        Audio, Graphismes &amp; Caméra
      </button>

      <div className="pt-3 border-t border-white/10">
        <div className="text-[11px] text-[#9EB3A8] mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#A855F7]" />
          Déclencher une anomalie Chaos Engine
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ['GRAVITY_FLIP', 'Gravity Flip'],
              ['COLLAPSE', 'Collapse'],
              ['FLOOD', 'Flood'],
              ['METEOR_RAIN', 'Meteor Rain'],
            ] as const
          ).map(([type, label]) => (
            <button
              key={type}
              onClick={() => {
                onTriggerChaos(type);
                onResume();
              }}
              className="min-h-[38px] rounded-lg bg-[#160E21] hover:bg-[#231536] border border-[#A855F7]/40 text-purple-200 text-xs font-medium cursor-pointer"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onMainMenu}
        className="min-h-[44px] mt-2 rounded-xl bg-[#240B10] hover:bg-[#361017] border border-[#DC2626]/55 text-rose-200 font-semibold text-sm cursor-pointer"
      >
        Retour au Menu Principal
      </button>
    </div>
  </ModalFrame>
);

export const VictoryScreen: React.FC<{
  saveData: SaveDataV1;
  onContinueExploring: () => void;
  onMainMenu: () => void;
}> = ({ saveData, onContinueExploring, onMainMenu }) => (
  <div className="fixed inset-0 z-40 flex items-center justify-center p-6 bg-black/84 pointer-events-auto">
    <div className="wc-panel max-w-lg w-full rounded-2xl p-6 text-center">
      <div className="relative w-16 h-16 mx-auto flex items-center justify-center rounded-full bg-[#14261E] border border-[#D4AF37]/60 gold-glow">
        <Award className="w-9 h-9 text-[#F2CF66]" />
      </div>
      <h2 className="font-display text-3xl font-extrabold text-[#F3F1E8] mt-4 text-balance">
        JUNGLE CHAOS CORE CONQUIS
      </h2>
      <div className="wc-divider-gold my-3" />
      <p className="text-sm text-[#9EB3A8] leading-relaxed">
        Vous avez vaincu Krakoss et stabilisé le Monde 1 : The Lost Jungle. La voie vers Sky Islands,
        The Lost City, Deep Blue et The Final Chaos est ouverte.
      </p>

      <div className="grid grid-cols-3 gap-3 my-5 text-xs">
        <div className="p-3 rounded-xl bg-[#0E1B15] border border-[#D4AF37]/30">
          <div className="text-[#9EB3A8]">Zones</div>
          <div className="font-mono-num text-lg font-bold text-[#F2CF66]">
            {saveData.worldState.discoveredZones.length}/10
          </div>
        </div>
        <div className="p-3 rounded-xl bg-[#0E1B15] border border-[#D4AF37]/30">
          <div className="text-[#9EB3A8]">Ennemis</div>
          <div className="font-mono-num text-lg font-bold text-[#F3F1E8]">
            {saveData.enemiesDefeatedCount}
          </div>
        </div>
        <div className="p-3 rounded-xl bg-[#0E1B15] border border-[#D4AF37]/30">
          <div className="text-[#9EB3A8]">Énigmes</div>
          <div className="font-mono-num text-lg font-bold text-[#2DD4BF]">
            {saveData.worldState.solvedPuzzles.length}/5
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={onContinueExploring}
          className="wc-btn-gold min-h-[46px] px-5 rounded-xl font-bold text-sm cursor-pointer"
        >
          Continuer l’exploration
        </button>
        <button
          onClick={onMainMenu}
          className="min-h-[46px] px-5 rounded-xl bg-[#0E1B15] hover:bg-[#162B22] border border-[#D4AF37]/40 text-[#F3F1E8] font-semibold text-sm cursor-pointer"
        >
          Menu Principal
        </button>
      </div>
    </div>
  </div>
);

export const DefeatScreen: React.FC<{
  onRespawn: () => void;
  onMainMenu: () => void;
}> = ({ onRespawn, onMainMenu }) => (
  <div className="fixed inset-0 z-40 flex items-center justify-center p-6 bg-black/86 pointer-events-auto">
    <div className="wc-panel-crimson max-w-md w-full rounded-2xl p-6 text-center">
      <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-full bg-[#240B10] border border-[#DC2626]/60">
        <Skull className="w-9 h-9 text-[#F87171]" />
      </div>
      <h2 className="font-display text-2xl font-extrabold text-[#F3F1E8] mt-4">
        TOMBÉ DANS LA JUNGLE
      </h2>
      <div className="wc-divider-gold my-3" />
      <p className="text-xs sm:text-sm text-[#9EB3A8]">
        Le Chaos vous a submergé, mais la stèle du Campement préserve votre progression.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center mt-5">
        <button
          onClick={onRespawn}
          className="min-h-[46px] px-5 rounded-xl bg-[#DC2626] hover:bg-[#EF4444] border border-[#F2CF66]/40 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" /> Réapparaître au Camp
        </button>
        <button
          onClick={onMainMenu}
          className="min-h-[46px] px-5 rounded-xl bg-[#0E1B15] hover:bg-[#162B22] border border-[#D4AF37]/40 text-[#F3F1E8] font-semibold text-sm cursor-pointer"
        >
          Menu Principal
        </button>
      </div>
    </div>
  </div>
);

interface WorldEntry {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  playable: boolean;
}

const WORLDS_CATALOG: WorldEntry[] = [
  {
    id: 'lost_jungle',
    number: 'MONDE 01',
    title: 'The Lost Jungle',
    subtitle: '10 zones · Campement, Temple Oublié, Sanctuaire Sacré et Arène de Krakoss.',
    playable: true,
  },
  {
    id: 'sky_islands',
    number: 'MONDE 02',
    title: 'Sky Islands',
    subtitle: 'Archipels célestes et courants gravitationnels — Chapitre II.',
    playable: false,
  },
  {
    id: 'lost_city',
    number: 'MONDE 03',
    title: 'The Lost City',
    subtitle: 'Cité mécanique engloutie sous les sables dorés — Chapitre III.',
    playable: false,
  },
  {
    id: 'deep_blue',
    number: 'MONDE 04',
    title: 'Deep Blue',
    subtitle: 'Abysses bioluminescents et sanctuaires coralliens — Chapitre IV.',
    playable: false,
  },
  {
    id: 'final_chaos',
    number: 'MONDE 05',
    title: 'The Final Chaos',
    subtitle: 'Cœur du Chaos primordial — Chapitre V.',
    playable: false,
  },
];

export const WorldSelectModal: React.FC<{
  hasSave: boolean;
  chaosCoreObtained: boolean;
  onPlayWorld1: () => void;
  onClose: () => void;
}> = ({ hasSave, chaosCoreObtained, onPlayWorld1, onClose }) => (
  <ModalFrame title="Sélection des Mondes" onClose={onClose}>
    <div className="space-y-3">
      <p className="text-xs text-[#9EB3A8] leading-relaxed">
        Progression de l’univers <strong className="text-[#F2CF66]">WORLD CHAOS</strong> · Monde 1 jouable immédiatement.
      </p>
      <div className="space-y-2.5">
        {WORLDS_CATALOG.map((w) => {
          const unlockedByCore = !w.playable && w.id === 'sky_islands' && chaosCoreObtained;
          return (
            <div
              key={w.id}
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                w.playable
                  ? 'bg-[#0E1B15] border-[#D4AF37]/55'
                  : 'bg-[#09120E] border-white/10 opacity-80'
              }`}
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 text-[11px] font-mono-num font-semibold tracking-wider text-[#D4AF37]">
                  <Globe2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{w.number}</span>
                  <span className="text-[#9EB3A8]">·</span>
                  <span className={w.playable ? 'text-[#2DD4BF]' : 'text-[#9EB3A8]'}>
                    {w.playable
                      ? 'Jouable'
                      : unlockedByCore
                      ? 'Chaos Core conquis · Bientôt disponible'
                      : 'Verrouillé · Chapitre futur'}
                  </span>
                </div>
                <h3 className="font-display text-base font-bold text-[#F3F1E8]">{w.title}</h3>
                <p className="text-xs text-[#9EB3A8]">{w.subtitle}</p>
              </div>

              {w.playable ? (
                <button
                  onClick={onPlayWorld1}
                  className="wc-btn-gold min-h-[44px] px-5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {hasSave ? 'Continuer' : 'Explorer'}
                </button>
              ) : (
                <div className="min-h-[44px] px-4 rounded-lg bg-[#08110D] border border-white/10 text-[#9EB3A8] text-xs font-medium flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0">
                  <Lock className="w-3.5 h-3.5" />
                  Bientôt
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  </ModalFrame>
);

export const CreditsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <ModalFrame title="Crédits — WORLD CHAOS" onClose={onClose}>
    <div className="space-y-4 text-xs text-[#9EB3A8]">
      <div className="p-4 rounded-xl bg-[#0E1B15] border border-[#D4AF37]/35">
        <div className="font-display text-lg font-extrabold text-[#F3F1E8]">WORLD CHAOS</div>
        <div className="font-display text-xs font-semibold text-[#F2CF66] tracking-[0.16em] mt-0.5">
          THE LIVING WORLDS · MONDE 1 : THE LOST JUNGLE
        </div>
        <div className="wc-divider-gold my-3" />
        <p className="leading-relaxed">
          Expérience d’action-aventure 3D en temps réel combinant rendu PBR procédural, éclairage
          cinématographique, combat dynamique, énigmes environnementales et anomalies du Chaos.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3.5 rounded-xl bg-[#0E1B15] border border-white/10 space-y-1">
          <div className="text-[#D4AF37] font-semibold">Rendu 3D &amp; Direction Visuelle</div>
          <div className="text-[#F3F1E8]">Three.js WebGL2 · ACES Filmic · PBR &amp; Shaders GLSL</div>
        </div>
        <div className="p-3.5 rounded-xl bg-[#0E1B15] border border-white/10 space-y-1">
          <div className="text-[#14B8A6] font-semibold">Audio &amp; Design Sonore</div>
          <div className="text-[#F3F1E8]">Synthèse adaptative Web Audio API multi-ambiances</div>
        </div>
        <div className="p-3.5 rounded-xl bg-[#0E1B15] border border-white/10 space-y-1">
          <div className="text-[#D4AF37] font-semibold">Systèmes &amp; Sauvegarde</div>
          <div className="text-[#F3F1E8]">Sauvegarde locale V1, PWA hors ligne &amp; Firebase Cloud</div>
        </div>
        <div className="p-3.5 rounded-xl bg-[#0E1B15] border border-white/10 space-y-1">
          <div className="text-[#14B8A6] font-semibold">Ergonomie Multi-Écrans</div>
          <div className="text-[#F3F1E8]">Clavier/Souris Desktop &amp; Contrôles Tactiles Android Paysage</div>
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <button
          onClick={onClose}
          className="wc-btn-gold min-h-[44px] px-5 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap"
        >
          Retour au Menu
        </button>
      </div>
    </div>
  </ModalFrame>
);

export const ExitConfirmModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [closeBlocked, setCloseBlocked] = useState(false);

  const handleConfirmExit = () => {
    window.close();
    setCloseBlocked(true);
  };

  return (
    <ModalFrame title="Quitter WORLD CHAOS" onClose={onClose}>
      <div className="space-y-4 text-center py-2">
        <div className="w-12 h-12 mx-auto rounded-full bg-[#14261E] border border-[#D4AF37]/45 flex items-center justify-center">
          <Power className="w-6 h-6 text-[#D4AF37]" />
        </div>
        {closeBlocked ? (
          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="font-display text-base font-bold text-[#F3F1E8]">Session terminée</h3>
            <p className="text-xs text-[#9EB3A8] leading-relaxed">
              Votre navigateur empêche la fermeture automatique de cet onglet. Vous pouvez fermer la
              fenêtre manuellement en toute sécurité : votre progression locale reste sauvegardée.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="font-display text-base font-bold text-[#F3F1E8]">
              Souhaitez-vous quitter l’aventure ?
            </h3>
            <p className="text-xs text-[#9EB3A8] leading-relaxed">
              Toute progression sauvegardée localement ou sur le Cloud est conservée.
            </p>
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          {!closeBlocked && (
            <button
              onClick={handleConfirmExit}
              className="min-h-[44px] px-5 rounded-lg bg-[#240B10] hover:bg-[#361017] border border-[#DC2626]/55 text-rose-200 font-semibold text-xs cursor-pointer whitespace-nowrap"
            >
              Confirmer la fermeture
            </button>
          )}
          <button
            onClick={onClose}
            className="wc-btn-gold min-h-[44px] px-5 rounded-lg font-bold text-xs cursor-pointer whitespace-nowrap"
          >
            Revenir au menu
          </button>
        </div>
      </div>
    </ModalFrame>
  );
};

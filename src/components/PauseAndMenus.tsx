import React, { useState } from 'react';
import {
  Award,
  BookMarked,
  CheckCircle2,
  MapPin,
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
  <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/75 pointer-events-auto">
    <div className="w-full max-w-3xl max-h-[88vh] bg-[#08110D] border border-[#D4AF37]/55 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#D4AF37]/30 bg-[#0E1B15]">
        <h2 className="font-display text-lg font-bold text-[#F3F1E8]">{title}</h2>
        <button
          onClick={onClose}
          className="min-w-[40px] min-h-[40px] rounded-lg bg-[#14261E] hover:bg-[#1E382C] border border-[#D4AF37]/30 text-[#F3F1E8] flex items-center justify-center cursor-pointer"
          aria-label="Fermer"
        >
          <X className="w-4 h-4 text-[#D4AF37]" />
        </button>
      </div>
      <div className="p-5 overflow-y-auto flex-1">{children}</div>
    </div>
  </div>
);

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
                    <span
                      className="w-3 h-3 rounded-sm shrink-0"
                      style={{ backgroundColor: def.color }}
                    />
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
        <div className="md:col-span-2 relative aspect-square bg-[#060D0A] border border-[#D4AF37]/40 rounded-xl overflow-hidden">
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
        </div>
      </div>
    </ModalFrame>
  );
};

export const PauseModal: React.FC<{
  onResume: () => void;
  onSave: () => void;
  onOpenArtBible: () => void;
  onOpenSettings: () => void;
  onTriggerChaos: (t: ChaosEventType) => void;
  onMainMenu: () => void;
}> = ({ onResume, onSave, onOpenArtBible, onOpenSettings, onTriggerChaos, onMainMenu }) => (
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
        onClick={onOpenArtBible}
        className="min-h-[46px] rounded-xl bg-[#0E1B15] hover:bg-[#162B22] border border-[#14B8A6]/45 text-[#14B8A6] font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
      >
        <BookMarked className="w-4 h-4" /> Consulter la Bible Graphique V1.0
      </button>
      <button
        onClick={onOpenSettings}
        className="min-h-[46px] rounded-xl bg-[#0E1B15] hover:bg-[#162B22] border border-[#D4AF37]/30 text-[#F3F1E8] font-semibold text-sm cursor-pointer"
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
  <div className="fixed inset-0 z-40 flex items-center justify-center p-6 bg-black/82 pointer-events-auto">
    <div className="max-w-lg w-full bg-[#08110D] border border-[#D4AF37] rounded-2xl p-6 text-center shadow-2xl">
      <Award className="w-12 h-12 text-[#D4AF37] mx-auto" />
      <h2 className="font-display text-3xl font-extrabold text-[#F3F1E8] mt-3">
        JUNGLE CHAOS CORE CONQUIS
      </h2>
      <p className="text-sm text-[#9EB3A8] mt-2 leading-relaxed">
        Vous avez vaincu Krakoss et stabilisé le Monde 1 : The Lost Jungle. La voie vers Sky Islands,
        The Lost City, Deep Blue et The Final Chaos est ouverte.
      </p>

      <div className="grid grid-cols-3 gap-3 my-5 text-xs">
        <div className="p-3 rounded-xl bg-[#0E1B15] border border-[#D4AF37]/25">
          <div className="text-[#9EB3A8]">Zones</div>
          <div className="font-mono-num text-lg font-bold text-[#D4AF37]">
            {saveData.worldState.discoveredZones.length}/10
          </div>
        </div>
        <div className="p-3 rounded-xl bg-[#0E1B15] border border-[#D4AF37]/25">
          <div className="text-[#9EB3A8]">Ennemis</div>
          <div className="font-mono-num text-lg font-bold text-[#F3F1E8]">
            {saveData.enemiesDefeatedCount}
          </div>
        </div>
        <div className="p-3 rounded-xl bg-[#0E1B15] border border-[#D4AF37]/25">
          <div className="text-[#9EB3A8]">Énigmes</div>
          <div className="font-mono-num text-lg font-bold text-[#14B8A6]">
            {saveData.worldState.solvedPuzzles.length}/5
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={onContinueExploring}
          className="min-h-[46px] px-5 rounded-xl bg-[#D4AF37] hover:bg-[#F2CF66] text-[#08110D] font-bold text-sm cursor-pointer"
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
  <div className="fixed inset-0 z-40 flex items-center justify-center p-6 bg-black/84 pointer-events-auto">
    <div className="max-w-md w-full bg-[#14090C] border border-[#DC2626]/65 rounded-2xl p-6 text-center shadow-2xl">
      <Skull className="w-12 h-12 text-[#DC2626] mx-auto" />
      <h2 className="font-display text-2xl font-extrabold text-[#F3F1E8] mt-3">
        TOMBÉ DANS LA JUNGLE
      </h2>
      <p className="text-xs sm:text-sm text-[#9EB3A8] mt-2">
        Le Chaos vous a submergé, mais la stèle du Campement préserve votre progression.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center mt-5">
        <button
          onClick={onRespawn}
          className="min-h-[46px] px-5 rounded-xl bg-[#DC2626] hover:bg-[#EF4444] text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
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

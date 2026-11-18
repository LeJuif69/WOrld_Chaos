import { useEffect, useRef, useState } from 'react';
import { ArtBibleView } from './components/ArtBibleView';
import { DialogueModal } from './components/DialogueModal';
import { GameHUD } from './components/GameHUD';
import { MainMenu } from './components/MainMenu';
import {
  DefeatScreen,
  InventoryModal,
  JournalModal,
  PauseModal,
  SettingsModal,
  VictoryScreen,
  WorldMapModal,
} from './components/PauseAndMenus';
import { hasSavedGame, loadGame, loadSettings, saveSettings } from './game/saveSystem';
import {
  ChaosEventType,
  DialogueChoice,
  GameSettings,
  HUDStateSnapshot,
  NpcDef,
  SaveDataV1,
} from './game/types';
import { WorldEngine } from './game/WorldEngine';
import { ZONES } from './game/worldData';

type ActiveModal = null | 'pause' | 'inventory' | 'journal' | 'map' | 'settings' | 'art_bible';

const INITIAL_HUD: HUDStateSnapshot = {
  screen: 'menu',
  hp: 100,
  maxHp: 100,
  chaosEnergy: 100,
  maxChaosEnergy: 100,
  xp: 0,
  level: 1,
  currentZone: ZONES[0],
  activePrompt: null,
  abilityCooldowns: { shockwave: 0, gravity_control: 0, chaos_shield: 0 },
  abilityMaxCooldowns: { shockwave: 4.5, gravity_control: 8, chaos_shield: 10 },
  unlockedAbilities: ['shockwave'],
  chaosShieldActive: false,
  gravityControlActive: false,
  activeChaosEvent: null,
  bossHud: { visible: false, name: 'Krakoss', hp: 420, maxHp: 420, phase: 1 },
  lockedTargetName: null,
  playerPos: [0, 1.5, 84],
  playerYaw: Math.PI,
  saveToast: null,
  discoveryBanner: null,
  activeMainQuestTitle: null,
  activeMainQuestStep: null,
};

export default function App() {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<WorldEngine | null>(null);

  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());
  const [hud, setHud] = useState<HUDStateSnapshot>(INITIAL_HUD);
  const [hasSave, setHasSave] = useState<boolean>(() => hasSavedGame());
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [activeNpc, setActiveNpc] = useState<NpcDef | null>(null);
  const [saveSnapshot, setSaveSnapshot] = useState<SaveDataV1 | null>(null);
  const [webglError, setWebglError] = useState<string | null>(null);

  useEffect(() => {
    const mount = canvasRef.current;
    if (!mount) return;

    let engine: WorldEngine;
    try {
      engine = new WorldEngine(mount, settings, {
        onHudUpdate: (nextHud) => setHud(nextHud),
        onOpenDialogue: (npc) => {
          setActiveNpc(npc);
          setActiveModal(null);
        },
        onOpenChestOrPopup: () => {},
        onStateChange: () => {
          if (engineRef.current) {
            setSaveSnapshot(engineRef.current.getSaveSnapshot());
            setHasSave(hasSavedGame());
          }
        },
      });
      engineRef.current = engine;
      setSaveSnapshot(engine.getSaveSnapshot());
    } catch (err) {
      setWebglError(err instanceof Error ? err.message : 'WebGL initialization failed.');
      return;
    }

    const onKeyShortcuts = (e: KeyboardEvent) => {
      if (!engineRef.current) return;
      if (e.code === 'Escape') {
        setActiveNpc(null);
        setActiveModal((prev) => {
          if (prev) {
            if (hudRef.current.screen !== 'menu') {
              engineRef.current?.setScreenMode('playing');
            }
            return null;
          }
          if (hudRef.current.screen === 'playing') {
            engineRef.current?.setScreenMode('paused');
            return 'pause';
          }
          return null;
        });
      } else if (hudRef.current.screen === 'playing') {
        if (e.code === 'KeyM') {
          engineRef.current.setScreenMode('paused');
          setSaveSnapshot(engineRef.current.getSaveSnapshot());
          setActiveModal('map');
        } else if (e.code === 'KeyI') {
          engineRef.current.setScreenMode('paused');
          setSaveSnapshot(engineRef.current.getSaveSnapshot());
          setActiveModal('inventory');
        } else if (e.code === 'KeyL') {
          engineRef.current.setScreenMode('paused');
          setSaveSnapshot(engineRef.current.getSaveSnapshot());
          setActiveModal('journal');
        }
      }
    };
    window.addEventListener('keydown', onKeyShortcuts);

    return () => {
      window.removeEventListener('keydown', onKeyShortcuts);
      engine.dispose();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hudRef = useRef(hud);
  hudRef.current = hud;

  const handleSettingsChange = (next: GameSettings) => {
    setSettings(next);
    saveSettings(next);
    engineRef.current?.updateSettings(next);
  };

  const openModal = (modal: ActiveModal) => {
    if (engineRef.current) {
      if (hud.screen === 'playing') {
        engineRef.current.setScreenMode('paused');
      }
      setSaveSnapshot(engineRef.current.getSaveSnapshot());
    }
    setActiveModal(modal);
  };

  const closeModalToPlay = () => {
    setActiveModal(null);
    if (hud.screen !== 'menu') {
      engineRef.current?.setScreenMode('playing');
    }
  };

  const handleContinue = () => {
    const saved = loadGame();
    if (saved && engineRef.current) {
      engineRef.current.loadFromSave(saved);
      setSaveSnapshot(engineRef.current.getSaveSnapshot());
    }
  };

  const handleNewGame = () => {
    if (!engineRef.current) return;
    engineRef.current.startNewGame();
    setSaveSnapshot(engineRef.current.getSaveSnapshot());
    setActiveModal(null);
  };

  const handleDialogueChoice = (choice: DialogueChoice): string | null => {
    if (!engineRef.current || !activeNpc) return null;
    return engineRef.current.handleDialogueChoice(
      activeNpc.id,
      choice.action,
      choice.questId,
      choice.hintPuzzleId
    );
  };

  const closeDialogue = () => {
    setActiveNpc(null);
    engineRef.current?.setScreenMode('playing');
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#08110D]">
      {/* Isolated WebGL mount container */}
      <div ref={canvasRef} className="fixed inset-0 w-full h-full" />

      {webglError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#08110D]">
          <div className="max-w-md bg-[#0E1B15] border border-[#DC2626]/50 rounded-2xl p-6 text-center">
            <h1 className="font-display text-xl font-bold text-[#F3F1E8]">3D Graphique Indisponible</h1>
            <p className="text-sm text-[#9EB3A8] mt-2">{webglError}</p>
          </div>
        </div>
      )}

      {hud.screen === 'menu' && activeModal !== 'art_bible' && (
        <MainMenu
          hasSave={hasSave}
          onContinue={handleContinue}
          onNewGame={handleNewGame}
          onOpenArtBible={() => setActiveModal('art_bible')}
          onOpenSettings={() => setActiveModal('settings')}
        />
      )}

      {hud.screen === 'playing' && (
        <GameHUD
          hud={hud}
          showTouchControls={settings.showTouchControls}
          onTouchMove={(nx, ny) => engineRef.current?.setTouchMove(nx, ny)}
          onCameraDelta={(dx, dy) => engineRef.current?.addCameraDelta(dx, dy)}
          onJump={() => engineRef.current?.triggerJump()}
          onDodge={() => engineRef.current?.triggerDodge()}
          onAttack={(heavy) => engineRef.current?.triggerAttack(heavy)}
          onAbility={(id) => engineRef.current?.triggerAbility(id)}
          onInteract={() => engineRef.current?.triggerInteract()}
          onLockOn={() => engineRef.current?.toggleLockOn()}
          onOpenModal={(m) => openModal(m)}
        />
      )}

      {activeNpc && (
        <DialogueModal
          npc={activeNpc}
          onChoice={handleDialogueChoice}
          onClose={closeDialogue}
        />
      )}

      {activeModal === 'art_bible' && (
        <ArtBibleView
          onBack={() => {
            if (hud.screen === 'menu') setActiveModal(null);
            else setActiveModal('pause');
          }}
          onCaptureSnapshot={(pos, lookAt) =>
            engineRef.current ? engineRef.current.captureArtBibleSnapshot(pos, lookAt) : null
          }
        />
      )}

      {activeModal === 'pause' && (
        <PauseModal
          onResume={closeModalToPlay}
          onSave={() => {
            engineRef.current?.manualSave();
            setHasSave(hasSavedGame());
          }}
          onOpenArtBible={() => setActiveModal('art_bible')}
          onOpenSettings={() => setActiveModal('settings')}
          onTriggerChaos={(t: ChaosEventType) => engineRef.current?.triggerChaosEventManual(t)}
          onMainMenu={() => {
            setActiveModal(null);
            setHasSave(hasSavedGame());
            engineRef.current?.setScreenMode('menu');
          }}
        />
      )}

      {activeModal === 'settings' && (
        <SettingsModal
          settings={settings}
          onChange={handleSettingsChange}
          onClose={() => {
            if (hud.screen === 'menu') setActiveModal(null);
            else setActiveModal('pause');
          }}
        />
      )}

      {activeModal === 'inventory' && saveSnapshot && (
        <InventoryModal
          saveData={saveSnapshot}
          onUseItem={(id) => {
            engineRef.current?.useInventoryItem(id);
            if (engineRef.current) setSaveSnapshot(engineRef.current.getSaveSnapshot());
          }}
          onClose={closeModalToPlay}
        />
      )}

      {activeModal === 'journal' && saveSnapshot && (
        <JournalModal saveData={saveSnapshot} onClose={closeModalToPlay} />
      )}

      {activeModal === 'map' && saveSnapshot && (
        <WorldMapModal
          saveData={saveSnapshot}
          playerPos={hud.playerPos}
          onClose={closeModalToPlay}
        />
      )}

      {hud.screen === 'victory' && saveSnapshot && (
        <VictoryScreen
          saveData={saveSnapshot}
          onContinueExploring={() => engineRef.current?.setScreenMode('playing')}
          onMainMenu={() => {
            setHasSave(hasSavedGame());
            engineRef.current?.setScreenMode('menu');
          }}
        />
      )}

      {hud.screen === 'defeat' && (
        <DefeatScreen
          onRespawn={() => engineRef.current?.respawnAtCamp()}
          onMainMenu={() => {
            setHasSave(hasSavedGame());
            engineRef.current?.setScreenMode('menu');
          }}
        />
      )}
    </div>
  );
}

import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { Compass } from 'lucide-react';
import { DialogueModal } from './components/DialogueModal';
import { GameHUD } from './components/GameHUD';
import { MainMenu } from './components/MainMenu';
import {
  CreditsModal,
  DefeatScreen,
  ExitConfirmModal,
  InventoryModal,
  JournalModal,
  PauseModal,
  SettingsModal,
  VictoryScreen,
  WorldMapModal,
  WorldSelectModal,
} from './components/PauseAndMenus';
import { OfflineIndicator } from './components/PWAControls';
import { TutorialOverlay, TutorialProgress } from './components/TutorialOverlay';

import { ArtBibleView } from './components/ArtBibleView';
import { CloudProfileModal } from './components/CloudProfileModal';
import { PhotoModal } from './components/PhotoModal';
import { StoreReleaseModal } from './components/StoreReleaseModal';
import { auth, googleProvider } from './firebase';
import { saveToCloud } from './game/cloudSync';
import { hasSavedGame, loadGame, loadSettings, saveGame, saveSettings } from './game/saveSystem';
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

type ActiveModal =
  | null
  | 'pause'
  | 'inventory'
  | 'journal'
  | 'map'
  | 'settings'
  | 'world_select'
  | 'credits'
  | 'exit'
  | 'art_bible'
  | 'cloud'
  | 'store_kit'
  | 'photo';

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
  const [saveSnapshot, setSaveSnapshot] = useState<SaveDataV1 | null>(() => loadGame());
  const [webglError, setWebglError] = useState<string | null>(null);
  const [webglContextLost, setWebglContextLost] = useState(false);
  const [cloudUser, setCloudUser] = useState<User | null>(null);
  const cloudSyncTimerRef = useRef<number | null>(null);
  const [tutorialProgress, setTutorialProgress] = useState<TutorialProgress>({
    moved: false,
    rotatedCamera: false,
    attackedOrDodged: false,
    usedAbility: false,
  });

  const scheduleCloudSave = (snap: SaveDataV1) => {
    if (!auth.currentUser) return;
    if (cloudSyncTimerRef.current !== null) {
      window.clearTimeout(cloudSyncTimerRef.current);
    }
    cloudSyncTimerRef.current = window.setTimeout(() => {
      cloudSyncTimerRef.current = null;
      if (auth.currentUser) {
        void saveToCloud(snap).catch(() => {});
      }
    }, 2500);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setCloudUser(u);
    });
    return () => unsub();
  }, []);

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
        onWebGLContextChange: (lost) => setWebglContextLost(lost),
        onCombatAction: () => {
          setTutorialProgress((p) => (p.attackedOrDodged ? p : { ...p, attackedOrDodged: true }));
        },
        onSettingsChange: (nextSettings) => {
          setSettings(nextSettings);
          saveSettings(nextSettings);
        },
        onStateChange: () => {
          if (engineRef.current) {
            const snap = engineRef.current.getSaveSnapshot();
            setSaveSnapshot(snap);
            setHasSave(hasSavedGame());
            scheduleCloudSave(snap);
          }
        },
      });
      engineRef.current = engine;
      setSaveSnapshot(loadGame() ?? engine.getSaveSnapshot());
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
        if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
          setTutorialProgress((p) => (p.moved ? p : { ...p, moved: true }));
        } else if (['KeyJ', 'KeyK', 'KeyQ', 'ShiftLeft', 'ShiftRight'].includes(e.code)) {
          setTutorialProgress((p) => (p.attackedOrDodged ? p : { ...p, attackedOrDodged: true }));
        } else if (['Digit1', 'Digit2', 'Digit3'].includes(e.code)) {
          setTutorialProgress((p) => (p.usedAbility ? p : { ...p, usedAbility: true }));
        }

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

    const onPointerDragCheck = (e: PointerEvent) => {
      if (
        hudRef.current.screen === 'playing' &&
        (e.buttons > 0 || e.pointerType === 'touch') &&
        (Math.abs(e.movementX) > 2 || Math.abs(e.movementY) > 2)
      ) {
        setTutorialProgress((p) => (p.rotatedCamera ? p : { ...p, rotatedCamera: true }));
      }
    };

    window.addEventListener('keydown', onKeyShortcuts);
    window.addEventListener('pointermove', onPointerDragCheck);

    return () => {
      window.removeEventListener('keydown', onKeyShortcuts);
      window.removeEventListener('pointermove', onPointerDragCheck);
      if (cloudSyncTimerRef.current !== null) {
        window.clearTimeout(cloudSyncTimerRef.current);
        cloudSyncTimerRef.current = null;
      }
      engine.dispose();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hudRef = useRef(hud);
  hudRef.current = hud;

  useEffect(() => {
    if (
      !settings.tutorialCompleted &&
      tutorialProgress.moved &&
      tutorialProgress.rotatedCamera &&
      tutorialProgress.attackedOrDodged &&
      tutorialProgress.usedAbility
    ) {
      const next = { ...settings, tutorialCompleted: true };
      setSettings(next);
      saveSettings(next);
    }
  }, [tutorialProgress, settings]);

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

  const handleGoogleSignIn = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const handleGoogleSignOut = async () => {
    await signOut(auth);
  };

  const handleApplyCloudSave = (cloudSave: SaveDataV1) => {
    saveGame(cloudSave);
    setSaveSnapshot(cloudSave);
    setHasSave(true);
    if (engineRef.current && hud.screen !== 'menu') {
      engineRef.current.loadFromSave(cloudSave);
    }
  };

  const isOverlayHiddenScreen = activeModal !== null || activeNpc !== null;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#08110D]">
      {/* Isolated WebGL mount container */}
      <div ref={canvasRef} className="fixed inset-0 w-full h-full" />

      <OfflineIndicator />

      {webglError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#060D0A]">
          <div className="wc-panel-crimson max-w-md rounded-2xl p-6 text-center space-y-2">
            <h1 className="font-display text-xl font-bold text-[#F3F1E8]">3D Graphique Indisponible</h1>
            <div className="wc-divider-gold" />
            <p className="text-sm text-[#9EB3A8] pt-1">{webglError}</p>
          </div>
        </div>
      )}

      {webglContextLost && !webglError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#060D0A]/95">
          <div className="wc-panel max-w-md rounded-2xl p-6 text-center space-y-4">
            <Compass className="w-9 h-9 text-[#D4AF37] mx-auto" />
            <h1 className="font-display text-xl font-bold text-[#F2CF66]">
              Restauration du contexte WebGL2...
            </h1>
            <p className="text-sm text-[#9EB3A8]">
              Le pilote graphique a suspendu le rendu 3D (mise en veille ou changement d’application).
              Votre progression est conservée.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="wc-btn-gold min-h-[44px] px-5 rounded-xl text-xs font-bold cursor-pointer"
            >
              Recharger le jeu
            </button>
          </div>
        </div>
      )}

      {hud.screen === 'menu' && !isOverlayHiddenScreen && (
        <MainMenu
          hasSave={hasSave}
          user={cloudUser}
          onContinue={handleContinue}
          onNewGame={handleNewGame}
          onOpenWorldSelect={() => setActiveModal('world_select')}
          onOpenSettings={() => setActiveModal('settings')}
          onOpenCredits={() => setActiveModal('credits')}
          onQuit={() => setActiveModal('exit')}
          onOpenArtBible={() => setActiveModal('art_bible')}
          onOpenCloud={() => setActiveModal('cloud')}
          onOpenStoreKit={() => setActiveModal('store_kit')}
          onUiSound={(kind) => engineRef.current?.playUiSound(kind)}
        />
      )}

      {hud.screen === 'playing' && (
        <>
          <GameHUD
            hud={hud}
            showTouchControls={settings.showTouchControls}
            hapticsEnabled={settings.hapticsEnabled !== false}
            onUnlockAudio={() => engineRef.current?.audio.unlock()}
            onTouchMove={(nx, ny) => {
              engineRef.current?.setTouchMove(nx, ny);
              if (Math.hypot(nx, ny) > 0.2) {
                setTutorialProgress((p) => (p.moved ? p : { ...p, moved: true }));
              }
            }}
            onCameraDelta={(dx, dy) => {
              engineRef.current?.addCameraDelta(dx, dy);
              if (Math.hypot(dx, dy) > 1.5) {
                setTutorialProgress((p) => (p.rotatedCamera ? p : { ...p, rotatedCamera: true }));
              }
            }}
            onJump={() => engineRef.current?.triggerJump()}
            onDodge={() => {
              engineRef.current?.triggerDodge();
              setTutorialProgress((p) => (p.attackedOrDodged ? p : { ...p, attackedOrDodged: true }));
            }}
            onAttack={(heavy) => {
              engineRef.current?.triggerAttack(heavy);
              setTutorialProgress((p) => (p.attackedOrDodged ? p : { ...p, attackedOrDodged: true }));
            }}
            onAbility={(id) => {
              engineRef.current?.triggerAbility(id);
              setTutorialProgress((p) => (p.usedAbility ? p : { ...p, usedAbility: true }));
            }}
            onInteract={() => engineRef.current?.triggerInteract()}
            onLockOn={() => engineRef.current?.toggleLockOn()}
            onOpenModal={(m) => openModal(m)}
          />
          {!settings.tutorialCompleted && !isOverlayHiddenScreen && (
            <TutorialOverlay
              progress={tutorialProgress}
              onDismiss={() => handleSettingsChange({ ...settings, tutorialCompleted: true })}
            />
          )}
        </>
      )}

      {activeNpc && (
        <DialogueModal
          npc={activeNpc}
          onChoice={handleDialogueChoice}
          onClose={closeDialogue}
        />
      )}

      <Suspense
        fallback={
          activeModal === 'art_bible' || activeModal === 'cloud' || activeModal === 'store_kit' ? (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#060D0A]/88 p-6">
              <div className="wc-panel rounded-2xl px-6 py-4 flex items-center gap-3">
                <Compass className="w-5 h-5 text-[#D4AF37] animate-spin" />
                <span className="font-display text-sm font-semibold text-[#F2CF66] tracking-wide">
                  Chargement du sanctuaire...
                </span>
              </div>
            </div>
          ) : null
        }
      >
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

        {activeModal === 'cloud' && (
          <CloudProfileModal
            user={cloudUser}
            localSave={saveSnapshot}
            onSignIn={handleGoogleSignIn}
            onSignOut={handleGoogleSignOut}
            onApplyCloudSave={handleApplyCloudSave}
            onClose={() => {
              if (hud.screen === 'menu') setActiveModal(null);
              else setActiveModal('pause');
            }}
          />
        )}

        {activeModal === 'store_kit' && (
          <StoreReleaseModal
            onCaptureSnapshot={(pos, lookAt) =>
              engineRef.current ? engineRef.current.captureArtBibleSnapshot(pos, lookAt) : null
            }
            onClose={() => {
              if (hud.screen === 'menu') setActiveModal(null);
              else setActiveModal('pause');
            }}
          />
        )}
      </Suspense>

      {activeModal === 'pause' && (
        <PauseModal
          onResume={closeModalToPlay}
          onSave={() => {
            engineRef.current?.manualSave();
            if (engineRef.current) {
              const snap = engineRef.current.getSaveSnapshot();
              setSaveSnapshot(snap);
              if (cloudSyncTimerRef.current !== null) {
                window.clearTimeout(cloudSyncTimerRef.current);
                cloudSyncTimerRef.current = null;
              }
              if (cloudUser) {
                void saveToCloud(snap).catch(() => {});
              }
            }
            setHasSave(hasSavedGame());
          }}
          onOpenCloud={() => setActiveModal('cloud')}
          onOpenPhoto={() => setActiveModal('photo')}
          onOpenArtBible={() => setActiveModal('art_bible')}
          onOpenStoreKit={() => setActiveModal('store_kit')}
          onOpenSettings={() => setActiveModal('settings')}
          onTriggerChaos={(t: ChaosEventType) => engineRef.current?.triggerChaosEventManual(t)}
          onMainMenu={() => {
            setActiveModal(null);
            setHasSave(hasSavedGame());
            engineRef.current?.setScreenMode('menu');
          }}
        />
      )}

      {activeModal === 'photo' && (
        <PhotoModal
          onCapture={(filter, dist, fov) =>
            engineRef.current ? engineRef.current.capturePhotoSnapshot(filter, dist, fov) : null
          }
          onClose={() => setActiveModal('pause')}
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

      {activeModal === 'world_select' && (
        <WorldSelectModal
          hasSave={hasSave}
          chaosCoreObtained={Boolean(saveSnapshot?.worldState.chaosCoreObtained)}
          onPlayWorld1={() => {
            setActiveModal(null);
            if (hasSave) handleContinue();
            else handleNewGame();
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'credits' && <CreditsModal onClose={() => setActiveModal(null)} />}

      {activeModal === 'exit' && <ExitConfirmModal onClose={() => setActiveModal(null)} />}

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

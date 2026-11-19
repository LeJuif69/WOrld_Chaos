import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  Award,
  Check,
  Cloud,
  CloudDownload,
  CloudUpload,
  LogIn,
  LogOut,
  RefreshCw,
  Trophy,
  X,
} from 'lucide-react';
import {
  computeSaveScore,
  fetchLeaderboard,
  LeaderboardEntry,
  loadFromCloud,
  publishLeaderboardEntry,
  saveToCloud,
} from '../game/cloudSync';
import { SaveDataV1 } from '../game/types';

interface CloudProfileModalProps {
  user: User | null;
  localSave: SaveDataV1 | null;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onApplyCloudSave: (cloudSave: SaveDataV1) => void;
  onClose: () => void;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

export const CloudProfileModal: React.FC<CloudProfileModalProps> = ({
  user,
  localSave,
  onSignIn,
  onSignOut,
  onApplyCloudSave,
  onClose,
}) => {
  const [cloudSave, setCloudSave] = useState<SaveDataV1 | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [pseudo, setPseudo] = useState<string>(user?.displayName?.slice(0, 32) ?? 'Explorateur');
  const [loadingCloud, setLoadingCloud] = useState(false);
  const [loadingBoard, setLoadingBoard] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const refreshLeaderboard = async () => {
    setLoadingBoard(true);
    setErrorMsg(null);
    try {
      const entries = await fetchLeaderboard();
      setLeaderboard(entries);
    } catch {
      setErrorMsg('Impossible de charger le classement pour le moment.');
    } finally {
      setLoadingBoard(false);
    }
  };

  const refreshCloudSave = async () => {
    if (!user) return;
    setLoadingCloud(true);
    setErrorMsg(null);
    try {
      const remote = await loadFromCloud();
      setCloudSave(remote);
    } catch {
      setErrorMsg('Erreur lors de la lecture de la sauvegarde Cloud.');
    } finally {
      setLoadingCloud(false);
    }
  };

  useEffect(() => {
    void refreshLeaderboard();
  }, []);

  useEffect(() => {
    if (user) {
      setPseudo((prev) => (prev === 'Explorateur' && user.displayName ? user.displayName.slice(0, 32) : prev));
      void refreshCloudSave();
    } else {
      setCloudSave(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleUploadLocal = async () => {
    if (!user || !localSave) return;
    setLoadingCloud(true);
    setErrorMsg(null);
    try {
      await saveToCloud(localSave);
      await publishLeaderboardEntry(localSave, pseudo);
      setCloudSave(localSave);
      setStatusMsg('Sauvegarde locale envoyée vers le Cloud et score publié.');
      await refreshLeaderboard();
    } catch {
      setErrorMsg('Échec de l’envoi vers le Cloud. Vérifiez votre connexion.');
    } finally {
      setLoadingCloud(false);
    }
  };

  const handleDownloadCloud = () => {
    if (!cloudSave) return;
    onApplyCloudSave(cloudSave);
    setStatusMsg('Sauvegarde Cloud appliquée sur cet appareil.');
  };

  const localScore = localSave ? computeSaveScore(localSave) : 0;
  const cloudScore = cloudSave ? computeSaveScore(cloudSave) : 0;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80 pointer-events-auto">
      <div className="w-full max-w-4xl max-h-[90vh] bg-[#08110D] border border-[#D4AF37]/60 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 bg-[#0E1B15] border-b border-[#D4AF37]/30">
          <div className="flex items-center gap-2.5">
            <Cloud className="w-5 h-5 text-[#14B8A6]" />
            <div>
              <h2 className="font-display text-lg font-bold text-[#F3F1E8]">
                Compte Joueur, Sauvegarde Cloud &amp; Classement
              </h2>
              <p className="text-xs text-[#9EB3A8]">
                Synchronisez votre progression sur tous vos appareils et publiez votre maîtrise de World 1
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] rounded-lg bg-[#14261E] hover:bg-[#1E382C] border border-[#D4AF37]/30 flex items-center justify-center cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-4 h-4 text-[#D4AF37]" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Google Auth + Cloud Sync */}
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#0E1B15] border border-[#D4AF37]/30 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-[#D4AF37]">Statut du Compte</div>
                  <div className="font-display text-base font-bold text-[#F3F1E8] mt-0.5">
                    {user ? user.displayName || 'Explorateur Connecté' : 'Mode Invité (Hors Ligne)'}
                  </div>
                  {user?.email && (
                    <div className="text-xs text-[#9EB3A8]">{user.email}</div>
                  )}
                </div>

                {user ? (
                  <button
                    onClick={() => void onSignOut()}
                    className="min-h-[40px] px-3.5 rounded-lg bg-[#240B10] hover:bg-[#361017] border border-[#DC2626]/55 text-rose-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Déconnexion
                  </button>
                ) : (
                  <button
                    onClick={() => void onSignIn()}
                    className="min-h-[42px] px-4 rounded-lg bg-[#D4AF37] hover:bg-[#F2CF66] text-[#08110D] text-xs font-bold flex items-center gap-2 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    Connexion Google
                  </button>
                )}
              </div>

              {!user && (
                <p className="text-xs text-[#9EB3A8] leading-relaxed pt-2 border-t border-white/10">
                  Le jeu reste 100 % jouable hors ligne sans compte. Connectez-vous avec Google pour
                  sauvegarder votre partie dans Firestore et figurer au classement officiel.
                </p>
              )}
            </div>

            {user && (
              <div className="p-4 rounded-xl bg-[#0E1B15] border border-[#14B8A6]/35 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-display text-sm font-bold text-[#F3F1E8]">
                    Synchronisation World 1
                  </span>
                  <button
                    onClick={() => void refreshCloudSave()}
                    disabled={loadingCloud}
                    className="text-xs text-[#14B8A6] hover:text-[#2DD4BF] flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingCloud ? 'animate-spin' : ''}`} />
                    Actualiser
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-[#08110D] border border-white/10 space-y-1">
                    <div className="text-[#D4AF37] font-semibold">Appareil Local</div>
                    {localSave ? (
                      <>
                        <div className="font-mono-num text-[#F3F1E8]">
                          Niv.{localSave.level} · {Math.round(localSave.xp)} XP
                        </div>
                        <div className="text-[#9EB3A8]">
                          Zones {localSave.worldState.discoveredZones.length}/10
                        </div>
                        <div className="text-[#9EB3A8]">
                          Temps {formatDuration(localSave.playTimeSeconds)}
                        </div>
                      </>
                    ) : (
                      <div className="text-[#9EB3A8]">Aucune partie locale</div>
                    )}
                  </div>

                  <div className="p-3 rounded-lg bg-[#08110D] border border-white/10 space-y-1">
                    <div className="text-[#14B8A6] font-semibold">Cloud Firestore</div>
                    {cloudSave ? (
                      <>
                        <div className="font-mono-num text-[#F3F1E8]">
                          Niv.{cloudSave.level} · {Math.round(cloudSave.xp)} XP
                        </div>
                        <div className="text-[#9EB3A8]">
                          Zones {cloudSave.worldState.discoveredZones.length}/10
                        </div>
                        <div className="text-[#9EB3A8]">
                          Temps {formatDuration(cloudSave.playTimeSeconds)}
                        </div>
                      </>
                    ) : (
                      <div className="text-[#9EB3A8]">Aucune sauvegarde Cloud</div>
                    )}
                  </div>
                </div>

                {cloudSave && localSave && cloudScore !== localScore && (
                  <div className="text-xs text-[#F2CF66] bg-[#1D1506] border border-[#D4AF37]/40 rounded-lg px-3 py-2">
                    {cloudScore > localScore
                      ? 'La sauvegarde Cloud est plus avancée que la sauvegarde locale.'
                      : 'Votre progression locale est plus avancée que le Cloud.'}
                  </div>
                )}

                <div>
                  <label className="block text-xs text-[#9EB3A8] mb-1">
                    Pseudonyme Classement Public (sans e-mail)
                  </label>
                  <input
                    type="text"
                    maxLength={32}
                    value={pseudo}
                    onChange={(e) => setPseudo(e.target.value)}
                    className="w-full min-h-[40px] px-3 rounded-lg bg-[#08110D] border border-[#D4AF37]/35 text-xs text-[#F3F1E8] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    onClick={() => void handleUploadLocal()}
                    disabled={loadingCloud || !localSave}
                    className="min-h-[42px] px-3 rounded-lg bg-[#D4AF37] hover:bg-[#F2CF66] text-[#08110D] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <CloudUpload className="w-4 h-4" />
                    Sauver vers le Cloud
                  </button>
                  <button
                    onClick={handleDownloadCloud}
                    disabled={loadingCloud || !cloudSave}
                    className="min-h-[42px] px-3 rounded-lg bg-[#08110D] hover:bg-[#14261E] border border-[#14B8A6]/50 text-[#14B8A6] text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <CloudDownload className="w-4 h-4" />
                    Charger depuis Cloud
                  </button>
                </div>
              </div>
            )}

            {statusMsg && (
              <div className="p-3 rounded-lg bg-[#0E241C] border border-[#14B8A6]/55 text-xs text-[#5EEAD4] flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                {statusMsg}
              </div>
            )}
            {errorMsg && (
              <div className="p-3 rounded-lg bg-[#240B10] border border-[#DC2626]/55 text-xs text-rose-200">
                {errorMsg}
              </div>
            )}
          </div>

          {/* Right Column: Public Explorer Mastery Leaderboard */}
          <div className="p-4 rounded-xl bg-[#0E1B15] border border-[#D4AF37]/30 flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#D4AF37]" />
                  <h3 className="font-display text-sm font-bold text-[#F3F1E8]">
                    Classement des Explorateurs · World 1
                  </h3>
                </div>
                <button
                  onClick={() => void refreshLeaderboard()}
                  disabled={loadingBoard}
                  className="text-xs text-[#D4AF37] hover:text-[#F2CF66] flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingBoard ? 'animate-spin' : ''}`} />
                  Actualiser
                </button>
              </div>

              {leaderboard.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#9EB3A8]">
                  Aucun explorateur classé pour l’instant. Connectez-vous et publiez votre progression !
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {leaderboard.map((entry, idx) => (
                    <div
                      key={entry.ownerId}
                      className="p-2.5 rounded-lg bg-[#08110D] border border-white/10 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`font-mono-num font-bold w-5 text-center ${
                            idx === 0
                              ? 'text-[#F2CF66]'
                              : idx === 1
                              ? 'text-[#E2E8F0]'
                              : idx === 2
                              ? 'text-[#D97706]'
                              : 'text-[#9EB3A8]'
                          }`}
                        >
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="font-semibold text-[#F3F1E8] truncate flex items-center gap-1.5">
                            <span>{entry.displayName}</span>
                            {entry.chaosCoreObtained && (
                              <span title="Chaos Core Conquis" className="inline-flex shrink-0">
                                <Award className="w-3.5 h-3.5 text-[#D4AF37]" />
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#9EB3A8]">
                            Niv.{entry.level} · {entry.enemiesDefeatedCount} ennemis ·{' '}
                            {formatDuration(entry.playTimeSeconds)}
                          </div>
                        </div>
                      </div>
                      <span className="font-mono-num font-bold text-[#14B8A6] shrink-0">
                        {Math.round(entry.xp)} XP
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

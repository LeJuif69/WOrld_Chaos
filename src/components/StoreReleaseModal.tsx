import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  Check,
  CheckSquare,
  Copy,
  Download,
  FileText,
  Globe,
  Monitor,
  Rocket,
  ShieldCheck,
  Smartphone,
  Square,
  X,
} from 'lucide-react';
import {
  buildAssetLinksJson,
  PLATFORM_CHECKLIST,
  STORE_COPY,
  STORE_SCREENSHOT_PRESETS,
} from '../game/storeKitData';

interface StoreReleaseModalProps {
  onCaptureSnapshot: (
    position: [number, number, number],
    lookAt: [number, number, number]
  ) => string | null;
  onClose: () => void;
}

const CHECKLIST_STORAGE_KEY = 'world_chaos_store_checklist_v1';

export const StoreReleaseModal: React.FC<StoreReleaseModalProps> = ({
  onCaptureSnapshot,
  onClose,
}) => {
  const [tab, setTab] = useState<'screenshots' | 'twa' | 'copy' | 'checklist'>('screenshots');
  const [shots, setShots] = useState<Record<string, string>>({});
  const [capturing, setCapturing] = useState(false);

  const [packageId, setPackageId] = useState('com.worldchaos.livingworlds');
  const [hostDomain, setHostDomain] = useState(
    typeof window !== 'undefined' ? window.location.origin : 'https://worldchaos.app'
  );
  const [sha256, setSha256] = useState(
    'AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99'
  );

  const [checkedIds, setCheckedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(CHECKLIST_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [toast, setToast] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const timersRef = useRef<number[]>([]);

  const scheduleTimeout = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timersRef.current = timersRef.current.filter((t) => t !== id);
      if (mountedRef.current) fn();
    }, ms);
    timersRef.current.push(id);
  };

  const notify = (msg: string) => {
    setToast(msg);
    scheduleTimeout(() => setToast(null), 2200);
  };

  const captureAllStoreShots = () => {
    for (const id of timersRef.current) window.clearTimeout(id);
    timersRef.current = [];
    setCapturing(true);
    let idx = 0;
    const step = () => {
      if (!mountedRef.current) return;
      if (idx >= STORE_SCREENSHOT_PRESETS.length) {
        setCapturing(false);
        return;
      }
      const preset = STORE_SCREENSHOT_PRESETS[idx];
      idx += 1;
      const url = onCaptureSnapshot(preset.position, preset.lookAt);
      if (url && mountedRef.current) {
        setShots((prev) => ({ ...prev, [preset.id]: url }));
      }
      scheduleTimeout(step, 35);
    };
    scheduleTimeout(step, 40);
  };

  useEffect(() => {
    mountedRef.current = true;
    captureAllStoreShots();
    return () => {
      mountedRef.current = false;
      for (const id of timersRef.current) window.clearTimeout(id);
      timersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore storage error
      }
      return next;
    });
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify(`Copié : ${label}`);
    } catch {
      notify(`Sélectionnez manuellement : ${label}`);
    }
  };

  const downloadFile = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    notify(`Téléchargé : ${filename}`);
  };

  const assetLinksText = buildAssetLinksJson(packageId, sha256);
  const cleanOrigin = hostDomain.replace(/\/$/, '');
  const bubblewrapInitCmd = `npx @bubblewrap/cli init --manifest=${cleanOrigin}/manifest.webmanifest`;
  const bubblewrapBuildCmd = `npx @bubblewrap/cli build`;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/82 pointer-events-auto">
      <div className="w-full max-w-5xl max-h-[90vh] bg-[#08110D] border border-[#D4AF37]/60 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-[#0E1B15] border-b border-[#D4AF37]/30">
          <div className="flex items-center gap-2.5">
            <Rocket className="w-5 h-5 text-[#D4AF37]" />
            <div>
              <h2 className="font-display text-lg font-bold text-[#F3F1E8]">
                Kit Publication Multi-Store · Play Store, iOS, Web &amp; PC
              </h2>
              <p className="text-xs text-[#9EB3A8]">
                Captures 16:9 temps réel, Digital Asset Links TWA, fiches ASO et checklist complète
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

        <div className="flex flex-wrap gap-1.5 px-6 py-3 bg-[#0A1510] border-b border-white/10">
          {(
            [
              ['screenshots', 'Captures Store (6)', Camera],
              ['twa', 'Google Play TWA (.aab)', Smartphone],
              ['copy', 'Fiches Store & Confidentialité', FileText],
              ['checklist', `Checklist Lancement (${checkedIds.length}/${PLATFORM_CHECKLIST.length})`, CheckSquare],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`min-h-[38px] px-3.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                tab === id
                  ? 'bg-[#D4AF37] text-[#08110D]'
                  : 'bg-[#0E1B15] text-[#9EB3A8] hover:text-[#F3F1E8] border border-white/10'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {tab === 'screenshots' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-[#9EB3A8]">
                  Captures directement rendues depuis le moteur 3D WebGL2 pour vos fiches Google Play, App Store et itch.io.
                </p>
                <button
                  onClick={captureAllStoreShots}
                  disabled={capturing}
                  className="min-h-[38px] px-3.5 rounded-lg bg-[#0E1B15] hover:bg-[#162B22] border border-[#14B8A6]/50 text-[#14B8A6] text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Camera className="w-3.5 h-3.5" />
                  {capturing ? 'Capture en cours...' : 'Recapturer les 6 vues'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {STORE_SCREENSHOT_PRESETS.map((preset) => {
                  const url = shots[preset.id];
                  return (
                    <div
                      key={preset.id}
                      className="rounded-xl bg-[#0E1B15] border border-[#D4AF37]/25 overflow-hidden flex flex-col"
                    >
                      <div className="aspect-video bg-[#08110D]">
                        {url ? (
                          <img
                            src={url}
                            alt={preset.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-[#9EB3A8]">
                            Rendu en attente...
                          </div>
                        )}
                      </div>
                      <div className="p-3.5 flex-1 flex flex-col justify-between gap-3">
                        <div>
                          <div className="font-display text-sm font-bold text-[#F3F1E8]">
                            {preset.title}
                          </div>
                          <p className="text-[11px] text-[#9EB3A8] mt-1">{preset.caption}</p>
                        </div>
                        {url && (
                          <a
                            href={url}
                            download={`WORLD_CHAOS_${preset.id}.jpg`}
                            className="min-h-[36px] px-3 rounded-lg bg-[#08110D] hover:bg-[#14261E] border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-semibold flex items-center justify-center gap-1.5"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Télécharger .JPG
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 rounded-xl bg-[#0E1B15] border border-white/10 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src="/pwa-192x192.png"
                    alt="Icône Play Store"
                    className="w-12 h-12 rounded-xl border border-[#D4AF37]/50"
                  />
                  <div>
                    <div className="text-xs font-bold text-[#F3F1E8]">
                      Icônes Store prêtes (192px · 512px Any · 512px Maskable · 180px iOS)
                    </div>
                    <div className="text-[11px] text-[#9EB3A8]">
                      Zone de sécurité 80 % respectée pour les icônes adaptatives Android.
                    </div>
                  </div>
                </div>
                <a
                  href="/pwa-512x512.png"
                  download="world_chaos_icon_512x512.png"
                  className="min-h-[38px] px-3.5 rounded-lg bg-[#D4AF37] hover:bg-[#F2CF66] text-[#08110D] text-xs font-bold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Icône 512×512 PNG
                </a>
              </div>
            </div>
          )}

          {tab === 'twa' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl bg-[#0E1B15] border border-[#D4AF37]/30 space-y-4">
                <div className="flex items-center gap-2 text-sm font-display font-bold text-[#F3F1E8]">
                  <ShieldCheck className="w-4 h-4 text-[#14B8A6]" />
                  Configuration Trusted Web Activity (Android)
                </div>

                <div>
                  <label className="block text-xs text-[#D4AF37] font-semibold mb-1">
                    ID de package Android (Play Console)
                  </label>
                  <input
                    type="text"
                    value={packageId}
                    onChange={(e) => setPackageId(e.target.value)}
                    className="w-full min-h-[40px] px-3 rounded-lg bg-[#08110D] border border-white/15 text-xs font-mono-num text-[#F3F1E8]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#D4AF37] font-semibold mb-1">
                    URL HTTPS publiée de l’app
                  </label>
                  <input
                    type="text"
                    value={hostDomain}
                    onChange={(e) => setHostDomain(e.target.value)}
                    className="w-full min-h-[40px] px-3 rounded-lg bg-[#08110D] border border-white/15 text-xs font-mono-num text-[#F3F1E8]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#D4AF37] font-semibold mb-1">
                    Empreinte SHA-256 (Keystore Play App Signing)
                  </label>
                  <textarea
                    rows={2}
                    value={sha256}
                    onChange={(e) => setSha256(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-[#08110D] border border-white/15 text-[11px] font-mono-num text-[#F3F1E8]"
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="text-xs font-semibold text-[#14B8A6]">
                    Commandes Bubblewrap (.aab Play Store)
                  </div>
                  <pre className="p-3 rounded-lg bg-[#08110D] border border-white/10 text-[11px] font-mono-num text-[#F3F1E8] overflow-x-auto">
                    {bubblewrapInitCmd}
                    {'\n'}
                    {bubblewrapBuildCmd}
                  </pre>
                  <button
                    onClick={() => void copyText(`${bubblewrapInitCmd}\n${bubblewrapBuildCmd}`, 'Commandes Bubblewrap')}
                    className="min-h-[38px] px-3 rounded-lg bg-[#08110D] hover:bg-[#14261E] border border-[#14B8A6]/45 text-[#14B8A6] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copier les commandes
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#0E1B15] border border-[#D4AF37]/30 flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-display font-bold text-[#F3F1E8]">
                    Fichier /.well-known/assetlinks.json
                  </div>
                  <p className="text-xs text-[#9EB3A8]">
                    Déposez ce fichier à la racine <span className="font-mono-num text-[#F3F1E8]">/.well-known/assetlinks.json</span> pour lancer le jeu en plein écran natif sans barre Chrome sur Android.
                  </p>
                  <pre className="p-3 rounded-lg bg-[#08110D] border border-white/10 text-[11px] font-mono-num text-[#5EEAD4] overflow-x-auto max-h-64">
                    {assetLinksText}
                  </pre>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => downloadFile('assetlinks.json', assetLinksText, 'application/json;charset=utf-8')}
                    className="min-h-[42px] px-4 rounded-lg bg-[#D4AF37] hover:bg-[#F2CF66] text-[#08110D] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger assetlinks.json
                  </button>
                  <button
                    onClick={() => void copyText(assetLinksText, 'assetlinks.json')}
                    className="min-h-[42px] px-4 rounded-lg bg-[#08110D] hover:bg-[#14261E] border border-[#D4AF37]/40 text-[#F3F1E8] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-4 h-4 text-[#D4AF37]" />
                    Copier JSON
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'copy' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl bg-[#0E1B15] border border-[#D4AF37]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-bold text-[#D4AF37]">
                    Fiche Store · Français (Play Store / App Store / itch.io)
                  </h3>
                  <button
                    onClick={() =>
                      void copyText(
                        `${STORE_COPY.title}\n\n${STORE_COPY.shortDescFr}\n\n${STORE_COPY.fullDescFr}`,
                        'Fiche Store FR'
                      )
                    }
                    className="text-xs text-[#14B8A6] hover:text-[#2DD4BF] flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copier FR
                  </button>
                </div>
                <div className="text-xs text-[#9EB3A8]">
                  <strong className="text-[#F3F1E8]">Accroche (≤80 car.) :</strong> {STORE_COPY.shortDescFr}
                </div>
                <pre className="p-3 rounded-lg bg-[#08110D] border border-white/10 text-[11px] text-[#F3F1E8]/90 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                  {STORE_COPY.fullDescFr}
                </pre>
              </div>

              <div className="p-4 rounded-xl bg-[#0E1B15] border border-[#D4AF37]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-bold text-[#D4AF37]">
                    Store Listing · English (Global / Steam)
                  </h3>
                  <button
                    onClick={() =>
                      void copyText(
                        `${STORE_COPY.title}\n\n${STORE_COPY.shortDescEn}\n\n${STORE_COPY.fullDescEn}`,
                        'Store Copy EN'
                      )
                    }
                    className="text-xs text-[#14B8A6] hover:text-[#2DD4BF] flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy EN
                  </button>
                </div>
                <div className="text-xs text-[#9EB3A8]">
                  <strong className="text-[#F3F1E8]">Short Description :</strong> {STORE_COPY.shortDescEn}
                </div>
                <pre className="p-3 rounded-lg bg-[#08110D] border border-white/10 text-[11px] text-[#F3F1E8]/90 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                  {STORE_COPY.fullDescEn}
                </pre>
              </div>

              <div className="lg:col-span-2 p-4 rounded-xl bg-[#0E1B15] border border-[#14B8A6]/35 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-bold text-[#F3F1E8]">
                    Politique de Confidentialité Obligatoire (Stores &amp; Google Auth)
                  </h3>
                  <button
                    onClick={() =>
                      downloadFile(
                        'PRIVACY_POLICY_WORLD_CHAOS.md',
                        STORE_COPY.privacyPolicy,
                        'text/markdown;charset=utf-8'
                      )
                    }
                    className="min-h-[36px] px-3 rounded-lg bg-[#D4AF37] hover:bg-[#F2CF66] text-[#08110D] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Exporter .MD
                  </button>
                </div>
                <pre className="p-3 rounded-lg bg-[#08110D] border border-white/10 text-[11px] text-[#9EB3A8] whitespace-pre-wrap leading-relaxed">
                  {STORE_COPY.privacyPolicy}
                </pre>
              </div>
            </div>
          )}

          {tab === 'checklist' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(
                [
                  ['web_itch', 'Web & itch.io (Jour 1)', Globe],
                  ['playstore', 'Google Play Store TWA (.aab)', Smartphone],
                  ['appstore', 'App Store iOS (Capacitor)', Smartphone],
                  ['steam_pc', 'PC Desktop & Steam (Tauri/Electron)', Monitor],
                ] as const
              ).map(([platKey, platTitle, Icon]) => {
                const items = PLATFORM_CHECKLIST.filter((i) => i.platform === platKey);
                return (
                  <div
                    key={platKey}
                    className="p-4 rounded-xl bg-[#0E1B15] border border-[#D4AF37]/30 space-y-3"
                  >
                    <div className="flex items-center gap-2 font-display text-sm font-bold text-[#D4AF37]">
                      <Icon className="w-4 h-4" />
                      {platTitle}
                    </div>
                    <div className="space-y-2.5">
                      {items.map((item) => {
                        const checked = checkedIds.includes(item.id);
                        return (
                          <button
                            key={item.id}
                            onClick={() => toggleCheck(item.id)}
                            className="w-full text-left p-2.5 rounded-lg bg-[#08110D] hover:bg-[#14261E] border border-white/10 flex items-start gap-2.5 cursor-pointer"
                          >
                            {checked ? (
                              <CheckSquare className="w-4 h-4 text-[#14B8A6] shrink-0 mt-0.5" />
                            ) : (
                              <Square className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                            )}
                            <div className="min-w-0">
                              <div
                                className={`text-xs font-semibold ${
                                  checked ? 'text-[#14B8A6] line-through' : 'text-[#F3F1E8]'
                                }`}
                              >
                                {item.label}
                              </div>
                              <div className="text-[11px] text-[#9EB3A8] mt-1 break-words">
                                {item.commandOrDetail}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {toast && (
          <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-lg bg-[#0E1B15] border border-[#D4AF37] text-xs font-semibold text-[#F2CF66] flex items-center gap-2 shadow-xl">
            <Check className="w-4 h-4 text-[#14B8A6]" />
            {toast}
          </div>
        )}
      </div>
    </div>
  );
};

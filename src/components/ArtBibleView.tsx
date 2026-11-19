import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  FileJson,
  FileText,
  RefreshCw,
  Shield,
  Sparkles,
  Swords,
  X,
  Zap,
} from 'lucide-react';
import {
  ART_BIBLE_PLATES,
  ArtBiblePlate,
  generateArtBibleJson,
  generateArtBibleMarkdown,
  OFFICIAL_PALETTE,
  PlateCategory,
} from '../game/artBibleData';
import { generateConceptPlateDataUrl } from '../game/conceptArtGenerator';
import { ABILITY_META, NPCS, ZONES } from '../game/worldData';

interface ArtBibleViewProps {
  onBack: () => void;
  onCaptureSnapshot: (
    position: [number, number, number],
    lookAt: [number, number, number]
  ) => string | null;
}

const PlateVectorArtwork: React.FC<{ plate: ArtBiblePlate; compact?: boolean }> = ({
  plate,
  compact = false,
}) => {
  if (plate.id === 'plate_07') {
    // 07 — Univers et interface (Clean Dark & Gold UI Architecture Schematic)
    return (
      <div className="w-full h-full bg-[#08110D] p-4 flex flex-col justify-between border border-[#D4AF37]/25">
        <div className="flex items-center justify-between border-b border-[#D4AF37]/25 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rotate-45 bg-[#D4AF37]" />
            <span className="font-display text-xs font-bold tracking-wider text-[#F3F1E8]">
              WORLD CHAOS · UI SOMBRE &amp; OR
            </span>
          </div>
          <span className="font-mono-num text-[10px] text-[#D4AF37]">60 / 30 / 10</span>
        </div>
        <div className="grid grid-cols-3 gap-2 my-2 flex-1 items-center">
          <div className="h-full rounded-lg bg-[#0E1B15] border border-[#D4AF37]/30 p-2 flex flex-col justify-between">
            <span className="text-[10px] font-semibold text-[#D4AF37]">Vitaux</span>
            <div className="space-y-1.5">
              <div className="h-2 rounded-sm bg-[#DC2626] w-4/5" />
              <div className="h-1.5 rounded-sm bg-[#14B8A6] w-3/5" />
            </div>
          </div>
          <div className="h-full rounded-lg bg-[#0E1B15]/60 border border-dashed border-[#D4AF37]/25 flex items-center justify-center text-center p-2">
            <span className="text-[10px] text-[#9EB3A8]">Viewport 3D 100% dégagé</span>
          </div>
          <div className="h-full rounded-lg bg-[#0E1B15] border border-[#D4AF37]/30 p-2 flex flex-col justify-between">
            <span className="text-[10px] font-semibold text-[#D4AF37]">Actions</span>
            <div className="flex justify-end gap-1.5">
              <span className="w-4 h-4 rounded-full border border-[#14B8A6]" />
              <span className="w-4 h-4 rounded-full border border-[#D4AF37]" />
              <span className="w-5 h-5 rounded-full bg-[#DC2626]" />
            </div>
          </div>
        </div>
        {!compact && (
          <div className="text-[11px] text-[#9EB3A8] flex items-center justify-between pt-2 border-t border-white/10">
            <span>Outfit · Plus Jakarta Sans · JetBrains Mono</span>
            <span className="text-[#D4AF37]">Contrastes WCAG AA+</span>
          </div>
        )}
      </div>
    );
  }

  if (plate.id === 'plate_08') {
    // 08 — Personnages et compétences
    return (
      <div className="w-full h-full bg-[#09130F] p-4 flex flex-col justify-between border border-[#D4AF37]/25">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <span className="font-display text-xs font-bold text-[#F3F1E8]">
            3 Pouvoirs &amp; 5 Alliés
          </span>
          <span className="font-mono-num text-[10px] text-[#14B8A6]">World 1</span>
        </div>
        <div className="grid grid-cols-3 gap-2 my-2">
          {[
            { name: ABILITY_META.shockwave.name, color: '#38BDF8', icon: Zap },
            { name: ABILITY_META.gravity_control.name, color: '#A855F7', icon: Sparkles },
            { name: ABILITY_META.chaos_shield.name, color: '#10B981', icon: Shield },
          ].map((ab) => {
            const Icon = ab.icon;
            return (
              <div
                key={ab.name}
                className="rounded-lg bg-[#0E1B15] border border-white/10 p-2 text-center flex flex-col items-center gap-1"
              >
                <Icon className="w-4 h-4" style={{ color: ab.color }} />
                <span className="text-[10px] font-semibold text-[#F3F1E8] truncate w-full">
                  {ab.name}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between gap-1 text-[10px] text-[#9EB3A8] pt-2 border-t border-white/10">
          {NPCS.map((n) => (
            <div key={n.id} className="flex items-center gap-1 truncate">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: n.accentColor }}
              />
              <span className="truncate">{n.name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (plate.id === 'plate_09') {
    // 09 — Gameplay mobile (Landscape Touch Ergonomics Schematic)
    return (
      <div className="w-full h-full bg-[#09130F] p-4 flex flex-col justify-between border border-[#D4AF37]/25">
        <div className="flex items-center justify-between text-[10px] text-[#D4AF37]">
          <span>Mode Paysage Tactile</span>
          <span className="font-mono-num">Cibles ≥ 44px</span>
        </div>
        <div className="relative flex-1 my-2 rounded-lg bg-[#0D1C16] border border-[#D4AF37]/30 flex items-end justify-between p-3">
          <div className="w-11 h-11 rounded-full border-2 border-[#14B8A6]/70 bg-[#14B8A6]/15 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-[#14B8A6]" />
          </div>
          <div className="px-2.5 py-1 rounded bg-[#D4AF37] text-[#08110D] text-[9px] font-bold">
            Interagir [E]
          </div>
          <div className="flex items-end gap-1.5">
            <div className="w-6 h-6 rounded-full border border-[#D4AF37]/60 bg-[#08110D]" />
            <div className="w-9 h-9 rounded-full bg-[#DC2626] border border-[#F2CF66] flex items-center justify-center">
              <Swords className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
        <div className="text-[10px] text-[#9EB3A8] flex justify-between">
          <span>Stick Gauche</span>
          <span>Caméra Glissée Droite</span>
        </div>
      </div>
    );
  }

  if (plate.id === 'plate_10') {
    // 10 — Présentation du MVP
    return (
      <div className="w-full h-full bg-[#09130F] p-4 flex flex-col justify-between border border-[#D4AF37]/25">
        <div className="flex items-center justify-between border-b border-[#D4AF37]/25 pb-2">
          <span className="font-display text-xs font-bold text-[#D4AF37]">
            WORLD 1 · THE LOST JUNGLE
          </span>
          <span className="font-mono-num text-[10px] text-[#F3F1E8]">MVP Complet</span>
        </div>
        <div className="grid grid-cols-4 gap-2 my-2 text-center">
          {[
            ['10', 'Zones'],
            ['10', 'Quêtes'],
            ['5', 'Énigmes'],
            ['4', 'Chaos'],
          ].map(([val, lbl]) => (
            <div key={lbl} className="rounded-lg bg-[#0E1B15] border border-white/10 py-2">
              <div className="font-mono-num text-sm font-bold text-[#D4AF37]">{val}</div>
              <div className="text-[10px] text-[#9EB3A8]">{lbl}</div>
            </div>
          ))}
        </div>
        <div className="text-[10px] text-[#14B8A6] flex items-center justify-between pt-1.5 border-t border-white/10">
          <span>{ZONES.length} Biomes interconnectés</span>
          <span>Boss Krakoss · Chaos Core</span>
        </div>
      </div>
    );
  }

  // Fallback atmospheric SVG composition for environments 01-06 before/if 3D snapshot loads
  return (
    <svg viewBox="0 0 400 225" className="w-full h-full block bg-[#08110D]">
      <defs>
        <linearGradient id={`grad-${plate.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={plate.palette[1]?.hex ?? '#14B8A6'} stopOpacity="0.45" />
          <stop offset="65%" stopColor="#0F3D2E" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#08110D" />
        </linearGradient>
      </defs>
      <rect width="400" height="225" fill={`url(#grad-${plate.id})`} />
      <circle cx="310" cy="65" r="32" fill={plate.palette[2]?.hex ?? '#D4AF37'} fillOpacity="0.35" />
      <path d="M0 170 Q100 135 200 165 T400 155 L400 225 L0 225 Z" fill="#0A1E15" />
      <path d="M0 190 Q130 165 260 192 T400 182 L400 225 L0 225 Z" fill="#08110D" />
      <rect x="14" y="14" width="372" height="197" fill="none" stroke="#D4AF37" strokeOpacity="0.3" />
    </svg>
  );
};

export const ArtBibleView: React.FC<ArtBibleViewProps> = ({ onBack, onCaptureSnapshot }) => {
  const [filter, setFilter] = useState<'all' | PlateCategory>('all');
  const [visualMode, setVisualMode] = useState<'concept' | 'realtime3d'>('concept');
  const [selectedPlate, setSelectedPlate] = useState<ArtBiblePlate | null>(null);
  const [snapshots, setSnapshots] = useState<Record<string, string>>({});
  const [concepts, setConcepts] = useState<Record<string, string>>({});
  const [capturing, setCapturing] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const timersRef = useRef<number[]>([]);

  const scheduleTimeout = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timersRef.current = timersRef.current.filter((t) => t !== id);
      if (mountedRef.current) fn();
    }, ms);
    timersRef.current.push(id);
  };

  const captureAll = () => {
    for (const id of timersRef.current) window.clearTimeout(id);
    timersRef.current = [];
    setCapturing(true);
    const envPlates = ART_BIBLE_PLATES.filter((p) => p.snapshotPreset);
    let idx = 0;

    const step = () => {
      if (!mountedRef.current) return;
      if (idx >= envPlates.length) {
        setCapturing(false);
        return;
      }
      const plate = envPlates[idx];
      idx += 1;
      if (plate.snapshotPreset) {
        const url = onCaptureSnapshot(plate.snapshotPreset.position, plate.snapshotPreset.lookAt);
        if (url && mountedRef.current) {
          setSnapshots((prev) => ({ ...prev, [plate.id]: url }));
        }
      }
      scheduleTimeout(step, 30);
    };
    scheduleTimeout(step, 40);
  };

  useEffect(() => {
    mountedRef.current = true;
    const generated: Record<string, string> = {};
    for (const plate of ART_BIBLE_PLATES) {
      if (plate.category === 'environments') {
        const url = generateConceptPlateDataUrl(plate.id);
        if (url) generated[plate.id] = url;
      }
    }
    setConcepts(generated);
    captureAll();
    return () => {
      mountedRef.current = false;
      for (const id of timersRef.current) window.clearTimeout(id);
      timersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getPlateImageUrl = (plate: ArtBiblePlate): string | null => {
    if (plate.category !== 'environments') return null;
    if (visualMode === 'concept') {
      return concepts[plate.id] ?? snapshots[plate.id] ?? null;
    }
    return snapshots[plate.id] ?? concepts[plate.id] ?? null;
  };

  const showToast = (msg: string) => {
    setCopiedMsg(msg);
    scheduleTimeout(() => setCopiedMsg(null), 2200);
  };

  const handleCopyHex = async (hex: string, name: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      showToast(`Copié : ${name} (${hex})`);
    } catch {
      showToast(`${name} : ${hex}`);
    }
  };

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(generateArtBibleMarkdown());
      showToast('Bible Graphique V1.0 copiée en Markdown');
    } catch {
      showToast('Export prêt via téléchargement .md');
    }
  };

  const triggerDownload = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast(`Téléchargé : ${filename}`);
  };

  const visiblePlates = ART_BIBLE_PLATES.filter(
    (p) => filter === 'all' || p.category === filter
  );

  return (
    <div className="fixed inset-0 z-30 bg-[#08110D] text-[#F3F1E8] overflow-y-auto pointer-events-auto">
      {/* Top Bar Contract: 3 zones (Brand · Nav/Filters · Primary Export Actions) */}
      <header className="sticky top-0 z-20 bg-[#08110D]/95 border-b border-[#D4AF37]/30 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={onBack}
            className="min-h-[42px] px-3.5 rounded-lg bg-[#0E1B15] hover:bg-[#162B22] border border-[#D4AF37]/40 text-[#F3F1E8] text-xs font-semibold flex items-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4 text-[#D4AF37]" />
            Retour
          </button>
          <span className="font-display text-base sm:text-lg font-bold tracking-tight text-[#F3F1E8] whitespace-nowrap">
            WORLD CHAOS · Bible Graphique V1.0
          </span>
        </div>

        <nav className="flex items-center gap-1 p-1 rounded-lg bg-[#0E1B15] border border-white/10">
          {(
            [
              ['all', 'Toutes (10)'],
              ['environments', 'Environnements (01–06)'],
              ['interface', 'Interface & Jeu (07–10)'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                filter === key
                  ? 'bg-[#D4AF37] text-[#08110D]'
                  : 'text-[#9EB3A8] hover:text-[#F3F1E8]'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <div
            className="flex items-center p-0.5 rounded-lg bg-[#0E1B15] border border-[#D4AF37]/30"
            role="group"
            aria-label="Mode d'affichage des planches"
          >
            <button
              onClick={() => setVisualMode('concept')}
              className={`min-h-[36px] px-2.5 rounded-md text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${
                visualMode === 'concept'
                  ? 'bg-[#14B8A6] text-[#08110D]'
                  : 'text-[#9EB3A8] hover:text-[#F3F1E8]'
              }`}
            >
              Concepts HD
            </button>
            <button
              onClick={() => setVisualMode('realtime3d')}
              className={`min-h-[36px] px-2.5 rounded-md text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${
                visualMode === 'realtime3d'
                  ? 'bg-[#14B8A6] text-[#08110D]'
                  : 'text-[#9EB3A8] hover:text-[#F3F1E8]'
              }`}
            >
              Rendu 3D
            </button>
          </div>
          <button
            onClick={captureAll}
            disabled={capturing}
            className="min-h-[40px] px-3 rounded-lg bg-[#0E1B15] hover:bg-[#162B22] border border-[#14B8A6]/45 text-[#14B8A6] text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-60"
            title="Recapturer les aperçus 3D temps réel"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${capturing ? 'animate-spin' : ''}`} />
            <span className="hidden lg:inline">Recapturer 3D</span>
          </button>
          <button
            onClick={() =>
              triggerDownload(
                'WORLD_CHAOS_BIBLE_GRAPHIQUE_V1.0.md',
                generateArtBibleMarkdown(),
                'text/markdown;charset=utf-8'
              )
            }
            className="min-h-[40px] px-3.5 rounded-lg bg-[#D4AF37] hover:bg-[#F2CF66] text-[#08110D] text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <FileText className="w-3.5 h-3.5" />
            Exporter .MD
          </button>
          <button
            onClick={() =>
              triggerDownload(
                'world_chaos_art_bible_v1.json',
                generateArtBibleJson(),
                'application/json;charset=utf-8'
              )
            }
            className="min-h-[40px] px-3.5 rounded-lg bg-[#0E1B15] hover:bg-[#162B22] border border-[#D4AF37]/45 text-[#D4AF37] text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <FileJson className="w-3.5 h-3.5" />
            JSON Unity
          </button>
        </div>
      </header>

      {copiedMsg && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-lg bg-[#0E1B15] border border-[#D4AF37] text-xs font-semibold text-[#F2CF66] flex items-center gap-2 shadow-xl">
          <Check className="w-4 h-4 text-[#14B8A6]" />
          {copiedMsg}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-10">
        {/* Hero Monograph Overview */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2 bg-[#0E1B15] border border-[#D4AF37]/30 rounded-2xl p-6 flex flex-col justify-between gap-4">
            <div>
              <div className="text-xs font-medium text-[#D4AF37] tracking-wider uppercase">
                Direction Artistique Officielle · Unity / Antigravity
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#F3F1E8] mt-2 text-balance">
                3D Fantasy Semi-Réaliste &amp; Interface Sombre et Or
              </h1>
              <p className="text-sm sm:text-base text-[#9EB3A8] mt-3 leading-relaxed max-w-2xl">
                Référentiel complet issu des 10 axes visuels de World 1 (The Lost Jungle). Les planches
                environnementales exploitent les rendus temps réel du moteur 3D restylé, et les
                planches d’interface redessinent proprement chaque écran sans textes déformés.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-white/10 text-xs text-[#9EB3A8]">
              <span>Caméra : Troisième personne</span>
              <span aria-hidden="true">·</span>
              <span>Silhouettes : Contrastées et lisibles</span>
              <span aria-hidden="true">·</span>
              <span>Environnements : Luxuriants et monumentaux</span>
              <button
                onClick={handleCopyMarkdown}
                className="ml-auto text-[#D4AF37] hover:text-[#F2CF66] font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                Copier Markdown complet
              </button>
            </div>
          </div>

          {/* Official 6-Color Palette */}
          <div className="bg-[#0E1B15] border border-[#D4AF37]/30 rounded-2xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-sm font-bold text-[#F3F1E8]">
                Palette Officielle (Cliquer pour copier)
              </h2>
              <span className="font-mono-num text-[11px] text-[#D4AF37]">60-30-10</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {OFFICIAL_PALETTE.map((token) => (
                <button
                  key={token.hex}
                  onClick={() => handleCopyHex(token.hex, token.name)}
                  className="flex items-center gap-2.5 p-2 rounded-lg bg-[#08110D] hover:bg-[#14261E] border border-white/10 text-left cursor-pointer transition-colors"
                >
                  <span
                    className="w-7 h-7 rounded-md shrink-0 border border-white/20"
                    style={{ backgroundColor: token.hex }}
                  />
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-[#F3F1E8] truncate">
                      {token.name}
                    </div>
                    <div className="font-mono-num text-[10px] text-[#D4AF37]">{token.hex}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 10 Plates Showcase Grid */}
        <section>
          <div className="flex items-baseline justify-between mb-5 border-b border-white/10 pb-3">
            <h2 className="font-display text-xl font-bold text-[#F3F1E8]">
              Planches de Référence ({visiblePlates.length})
            </h2>
            <span className="text-xs text-[#9EB3A8]">
              Cliquer sur une planche pour ouvrir les spécifications Unity / URP complètes
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {visiblePlates.map((plate) => {
              const imageUrl = getPlateImageUrl(plate);
              return (
                <article
                  key={plate.id}
                  onClick={() => setSelectedPlate(plate)}
                  className="group bg-[#0E1B15] border border-[#D4AF37]/25 hover:border-[#D4AF37]/80 rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-colors"
                >
                  <div className="relative aspect-video bg-[#08110D] overflow-hidden border-b border-[#D4AF37]/20">
                    {imageUrl && plate.category === 'environments' ? (
                      <img
                        src={imageUrl}
                        alt={`${plate.number} — ${plate.title}`}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <PlateVectorArtwork plate={plate} compact />
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-[#D4AF37] font-medium">
                        <span className="font-mono-num font-bold">{plate.number}</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {plate.category === 'environments'
                            ? 'Environnements & DA'
                            : 'Interface & Gameplay'}
                        </span>
                      </div>
                      <h3 className="font-display text-lg font-bold text-[#F3F1E8] mt-1 group-hover:text-[#F2CF66] transition-colors">
                        {plate.title}
                      </h3>
                      <p className="text-xs text-[#14B8A6] font-medium">{plate.subtitle}</p>
                      <p className="text-xs text-[#9EB3A8] mt-2 leading-relaxed">
                        {plate.summary}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                      <div className="flex items-center gap-1.5">
                        {plate.palette.map((c) => (
                          <span
                            key={c.hex}
                            className="w-4 h-4 rounded-sm border border-white/25"
                            style={{ backgroundColor: c.hex }}
                            title={`${c.name} (${c.hex})`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-[#D4AF37]">
                        Inspecter la fiche →
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>

      {/* Lightbox Plate Inspector */}
      {selectedPlate && (
        <div
          className="fixed inset-0 z-50 bg-black/82 flex items-center justify-center p-4 sm:p-6"
          onClick={() => setSelectedPlate(null)}
        >
          <div
            className="w-full max-w-4xl max-h-[90vh] bg-[#0E1B15] border border-[#D4AF37]/60 rounded-2xl overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 bg-[#08110D] border-b border-[#D4AF37]/30">
              <div>
                <div className="text-xs text-[#D4AF37] font-mono-num font-semibold">
                  Planche {selectedPlate.number} · {selectedPlate.subtitle}
                </div>
                <h2 className="font-display text-xl font-bold text-[#F3F1E8]">
                  {selectedPlate.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedPlate(null)}
                className="min-w-[42px] min-h-[42px] rounded-lg bg-[#14261E] hover:bg-[#1E382C] text-[#F3F1E8] flex items-center justify-center cursor-pointer"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-6">
              {selectedPlate.category === 'environments' && (
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-[#9EB3A8]">
                    Source visuelle active ·{' '}
                    <span className="text-[#D4AF37] font-semibold">
                      {visualMode === 'concept'
                        ? 'Illustration Conceptuelle 1280×720'
                        : 'Capture Moteur 3D Temps Réel'}
                    </span>
                  </span>
                  <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#08110D] border border-[#D4AF37]/30">
                    <button
                      onClick={() => setVisualMode('concept')}
                      className={`min-h-[34px] px-3 rounded-md font-semibold cursor-pointer ${
                        visualMode === 'concept'
                          ? 'bg-[#D4AF37] text-[#08110D]'
                          : 'text-[#9EB3A8] hover:text-[#F3F1E8]'
                      }`}
                    >
                      Concept HD
                    </button>
                    <button
                      onClick={() => setVisualMode('realtime3d')}
                      className={`min-h-[34px] px-3 rounded-md font-semibold cursor-pointer ${
                        visualMode === 'realtime3d'
                          ? 'bg-[#D4AF37] text-[#08110D]'
                          : 'text-[#9EB3A8] hover:text-[#F3F1E8]'
                      }`}
                    >
                      Rendu 3D
                    </button>
                  </div>
                </div>
              )}

              <div className="aspect-video rounded-xl overflow-hidden border border-[#D4AF37]/30 bg-[#08110D]">
                {getPlateImageUrl(selectedPlate) && selectedPlate.category === 'environments' ? (
                  <img
                    src={getPlateImageUrl(selectedPlate) ?? ''}
                    alt={selectedPlate.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <PlateVectorArtwork plate={selectedPlate} />
                )}
              </div>

              <p className="text-sm text-[#F3F1E8]/90 leading-relaxed">{selectedPlate.summary}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-[#08110D] border border-white/10 space-y-2">
                  <div className="font-display text-sm font-bold text-[#D4AF37]">
                    Spécifications Unity / URP
                  </div>
                  <div>
                    <span className="text-[#14B8A6] font-semibold">Éclairage : </span>
                    <span className="text-[#9EB3A8]">{selectedPlate.unitySpecs.lighting}</span>
                  </div>
                  <div>
                    <span className="text-[#14B8A6] font-semibold">Matériaux PBR : </span>
                    <span className="text-[#9EB3A8]">{selectedPlate.unitySpecs.materials}</span>
                  </div>
                  <div>
                    <span className="text-[#14B8A6] font-semibold">Caméra : </span>
                    <span className="text-[#9EB3A8]">{selectedPlate.unitySpecs.camera}</span>
                  </div>
                  <div>
                    <span className="text-[#14B8A6] font-semibold">Silhouettes : </span>
                    <span className="text-[#9EB3A8]">
                      {selectedPlate.unitySpecs.silhouetteAndComposition}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#08110D] border border-white/10 space-y-3">
                  <div className="font-display text-sm font-bold text-[#D4AF37]">
                    Couleurs Clés &amp; Refonte UI
                  </div>
                  <div className="space-y-2">
                    {selectedPlate.palette.map((c) => (
                      <button
                        key={c.hex}
                        onClick={() => handleCopyHex(c.hex, c.name)}
                        className="w-full flex items-center justify-between gap-2 p-2 rounded-lg bg-[#0E1B15] hover:bg-[#162B22] border border-white/10 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-4 h-4 rounded-sm border border-white/20"
                            style={{ backgroundColor: c.hex }}
                          />
                          <span className="font-semibold text-[#F3F1E8]">{c.name}</span>
                          <span className="text-[#9EB3A8]">— {c.usage}</span>
                        </div>
                        <span className="font-mono-num text-[#D4AF37]">{c.hex}</span>
                      </button>
                    ))}
                  </div>
                  {selectedPlate.uiRedesignNotes.length > 0 && (
                    <ul className="space-y-1 text-[#9EB3A8] pt-2 border-t border-white/10">
                      {selectedPlate.uiRedesignNotes.map((note, idx) => (
                        <li key={idx}>· {note}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                {getPlateImageUrl(selectedPlate) && (
                  <a
                    href={getPlateImageUrl(selectedPlate) ?? ''}
                    download={`WORLD_CHAOS_${selectedPlate.number}_${selectedPlate.id}_${visualMode}.jpg`}
                    className="min-h-[42px] px-4 rounded-lg bg-[#14261E] hover:bg-[#1E382C] border border-[#D4AF37]/40 text-[#F3F1E8] text-xs font-semibold flex items-center gap-2"
                  >
                    <Download className="w-4 h-4 text-[#D4AF37]" />
                    {visualMode === 'concept' ? 'Télécharger Concept HD' : 'Télécharger Visuel 3D'}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

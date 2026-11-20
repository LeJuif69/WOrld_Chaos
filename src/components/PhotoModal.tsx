import React, { useState } from 'react';
import { Camera, Download, Eye, Filter, RefreshCw, X } from 'lucide-react';

interface PhotoModalProps {
  onCapture: (filter: string, distance: number, fov: number) => string | null;
  onClose: () => void;
}

const PHOTO_FILTERS = [
  { id: 'none', name: 'Standard Naturel', desc: 'Couleurs et éclairage d’origine de la jungle' },
  { id: 'cinematic_gold', name: 'Or Crépusculaire', desc: 'Teintes dorées et contrastes chauds du soleil couchant' },
  { id: 'obsidian_noir', name: 'Obsidienne Noir & Or', desc: 'Style cinématographique ténébreux et mystique' },
  { id: 'thermal_volcanic', name: 'Chaleur Volcanique', desc: 'Ambiance rouge braise et lueurs ardentes' },
  { id: 'neon_chaos', name: 'Rift Éthéré', desc: 'Reflets néons magiques et auras aethériques' },
];

export const PhotoModal: React.FC<PhotoModalProps> = ({ onCapture, onClose }) => {
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [cameraDistance, setCameraDistance] = useState(8.5);
  const [cameraFov, setCameraFov] = useState(58);
  const [lastImage, setLastImage] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  const handleTakeSnapshot = () => {
    const dataUrl = onCapture(selectedFilter, cameraDistance, cameraFov);
    if (dataUrl) {
      setLastImage(dataUrl);
      setSavedCount((c) => c + 1);
    }
  };

  const handleDownload = () => {
    if (!lastImage) return;
    const link = document.createElement('a');
    link.href = lastImage;
    link.download = `world-chaos-photo-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/82 p-4 backdrop-blur-sm pointer-events-auto">
      <div className="wc-panel relative w-full max-w-4xl max-h-[92vh] rounded-2xl flex flex-col overflow-hidden border border-[#D4AF37]/40 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0E1B15] border-b border-[#D4AF37]/20">
          <div className="flex items-center gap-3">
            <Camera className="w-6 h-6 text-[#D4AF37]" />
            <div>
              <h2 className="font-display text-lg font-bold text-[#F3F1E8] tracking-wider">
                MODE PHOTO &amp; PANORAMAS
              </h2>
              <p className="text-xs text-[#9EB3A8]">
                Capturez les panoramas vivants de The Lost Jungle et The Volcanic Wastes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-[#14261E] hover:bg-[#1E382C] border border-[#D4AF37]/35 text-[#F3F1E8] flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 overflow-y-auto bg-[#08110D]">
          {/* Controls Panel */}
          <div className="md:col-span-1 space-y-5 bg-[#0E1B15]/85 p-5 rounded-xl border border-[#1E382C]">
            <h3 className="font-display text-xs font-bold text-[#D4AF37] tracking-wider uppercase flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filtres Cinématographiques
            </h3>
            <div className="space-y-2">
              {PHOTO_FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFilter(f.id)}
                  className={`w-full text-left p-3 rounded-lg border text-xs transition-all cursor-pointer ${
                    selectedFilter === f.id
                      ? 'bg-[#1E382C] border-[#D4AF37] text-[#F3F1E8]'
                      : 'bg-[#14261E]/60 border-white/10 text-[#9EB3A8] hover:border-[#D4AF37]/40'
                  }`}
                >
                  <div className="font-bold text-[#F2CF66]">{f.name}</div>
                  <div className="text-[10px] opacity-75 mt-0.5">{f.desc}</div>
                </button>
              ))}
            </div>

            <div className="space-y-4 pt-4 border-t border-white/10">
              <div>
                <div className="flex justify-between text-xs text-[#9EB3A8] mb-1">
                  <span>Distance Caméra</span>
                  <span className="font-mono-num text-[#D4AF37]">{cameraDistance.toFixed(1)}m</span>
                </div>
                <input
                  type="range"
                  min={4.0}
                  max={16.0}
                  step={0.5}
                  value={cameraDistance}
                  onChange={(e) => setCameraDistance(Number(e.target.value))}
                  className="w-full accent-[#D4AF37]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-[#9EB3A8] mb-1">
                  <span>Champ de Vision (FOV)</span>
                  <span className="font-mono-num text-[#14B8A6]">{cameraFov}°</span>
                </div>
                <input
                  type="range"
                  min={35}
                  max={85}
                  step={1}
                  value={cameraFov}
                  onChange={(e) => setCameraFov(Number(e.target.value))}
                  className="w-full accent-[#14B8A6]"
                />
              </div>
            </div>

            <button
              onClick={handleTakeSnapshot}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C59B27] text-[#08110D] font-display font-bold text-xs tracking-wider uppercase hover:opacity-95 shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Camera className="w-4 h-4" /> Capturer l’Image
            </button>
          </div>

          {/* Preview & Gallery Output */}
          <div className="md:col-span-2 flex flex-col justify-between bg-[#14261E]/50 rounded-xl p-5 border border-[#1E382C]">
            <div className="flex items-center justify-between mb-3">
              <span className="font-display text-xs font-bold text-[#9EB3A8] tracking-wider uppercase flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-[#14B8A6]" /> Aperçu du Panorama
              </span>
              {savedCount > 0 && (
                <span className="text-[10px] font-mono-num px-2 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37]">
                  {savedCount} capture(s) dans la session
                </span>
              )}
            </div>

            <div className="relative flex-1 min-h-[320px] rounded-xl overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center">
              {lastImage ? (
                <img src={lastImage} alt="Capture World Chaos" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center p-6 text-[#9EB3A8]">
                  <Camera className="w-12 h-12 mx-auto mb-3 opacity-40 text-[#D4AF37]" />
                  <p className="text-xs font-display">Aucune capture active</p>
                  <p className="text-[11px] opacity-70 mt-1">
                    Ajustez les paramètres et cliquez sur &laquo; Capturer l’Image &raquo; pour figer la scène.
                  </p>
                </div>
              )}
            </div>

            {lastImage && (
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleDownload}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#1E382C] hover:bg-[#254637] border border-[#D4AF37]/30 text-[#F3F1E8] font-display font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Download className="w-4 h-4 text-[#D4AF37]" /> Télécharger en PNG
                </button>
                <button
                  onClick={handleTakeSnapshot}
                  className="py-2.5 px-4 rounded-xl bg-[#14261E] hover:bg-[#1E382C] border border-white/10 text-[#9EB3A8] hover:text-[#F3F1E8] font-display text-xs flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-4 h-4" /> Reprendre
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

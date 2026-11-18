import React, { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { DialogueChoice, NpcDef } from '../game/types';

interface DialogueModalProps {
  npc: NpcDef;
  onChoice: (choice: DialogueChoice) => string | null;
  onClose: () => void;
}

export const DialogueModal: React.FC<DialogueModalProps> = ({ npc, onChoice, onClose }) => {
  const [nodeId, setNodeId] = useState(npc.greetingNodeId);
  const [extraHint, setExtraHint] = useState<string | null>(null);

  const node = npc.nodes[nodeId] ?? npc.nodes[npc.greetingNodeId];

  const handleSelect = (choice: DialogueChoice) => {
    const hint = onChoice(choice);
    if (hint) setExtraHint(hint);

    if (choice.action === 'close' || !choice.nextNodeId) {
      onClose();
      return;
    }
    setNodeId(choice.nextNodeId);
  };

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center p-4 sm:p-6 bg-black/60 pointer-events-auto">
      <div className="w-full max-w-2xl bg-[#08110D] border border-[#D4AF37]/55 rounded-2xl p-5 sm:p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-4 pb-3 border-b border-[#D4AF37]/25">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg border border-[#D4AF37]/50 flex items-center justify-center text-white"
              style={{ backgroundColor: npc.cloakColor }}
            >
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-[#F3F1E8]">{npc.name}</h3>
              <p className="text-xs text-[#D4AF37]">{npc.role}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] rounded-lg bg-[#0E1B15] hover:bg-[#162B22] border border-[#D4AF37]/30 text-[#F3F1E8] flex items-center justify-center cursor-pointer"
            aria-label="Fermer le dialogue"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="mt-4 text-sm sm:text-base text-[#F3F1E8]/95 leading-relaxed">{node.text}</p>

        {extraHint && (
          <div className="mt-3 p-3 rounded-lg bg-[#1C1506] border border-[#D4AF37]/50 text-xs text-[#F2CF66]">
            <strong>Indice ajouté au Journal :</strong> {extraHint}
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2.5">
          {node.choices.map((c, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(c)}
              className="min-h-[44px] px-4 py-2 rounded-lg bg-[#0E1B15] hover:bg-[#D4AF37] hover:text-[#08110D] border border-[#D4AF37]/45 text-[#F3F1E8] text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

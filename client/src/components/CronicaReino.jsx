import React, { useState } from "react";

export default function CronicaReino({ historial = [] }) {
  const [abierta, setAbierta] = useState(false);

  return (
    <div className="bg-panel/60 rounded-lg border border-white/10">
      <button
        onClick={() => setAbierta((a) => !a)}
        className="w-full text-left px-3 py-2 text-xs font-titulo tracking-wide text-crema/80 flex items-center justify-between"
      >
        <span>📜 Crónica del Reino</span>
        <span>{abierta ? "▲" : "▼"}</span>
      </button>
      {abierta && (
        <div className="max-h-48 overflow-y-auto px-3 pb-3 space-y-1 text-[11px] text-crema/70 font-texto">
          {historial.length === 0 && <p className="text-crema/40">Aún no hay historia que contar…</p>}
          {historial.map((linea, i) => (
            <p key={i} className={linea.startsWith("—") ? "text-oro font-mono mt-2" : ""}>
              {linea}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

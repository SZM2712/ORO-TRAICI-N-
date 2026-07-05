import React from "react";

export default function BarraCastilloGlobal({ jugadores }) {
  return (
    <div className="bg-panel/70 rounded-lg p-2 border border-white/10 space-y-1.5">
      <div className="text-[10px] uppercase tracking-widest text-crema/50 font-mono">Carrera al castillo</div>
      {jugadores.map((j) => (
        <div key={j.id} className="flex items-center gap-2">
          <span className="text-sm w-6">{j.icono}</span>
          <div className="flex-1 h-2.5 rounded-full bg-black/40 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-oro to-sangre transition-all duration-700 ease-out"
              style={{ width: `${(j.castillo / 3) * 100}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-crema/60 w-8 text-right">{j.castillo}/3</span>
        </div>
      ))}
    </div>
  );
}

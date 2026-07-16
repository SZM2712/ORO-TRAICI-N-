import React from "react";

export default function IndicadorSellado({ jugadores, clave = "selloJugada", etiqueta = "¿Quién ya selló su jugada?" }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto py-1">
      <span className="text-[10px] uppercase tracking-widest text-crema/40 font-mono shrink-0">{etiqueta}</span>
      {jugadores.map((j) => (
        <div
          key={j.id}
          className={`shrink-0 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border ${
            j[clave] ? "border-oro text-oro bg-oro/10" : "border-white/15 text-crema/40"
          }`}
          title={j.nombre}
        >
          <span>{j.icono}</span>
          {j[clave] ? (
            <span>🔒</span>
          ) : (
            <span className="flex items-center gap-[1px]" aria-label="pensando">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-[3px] h-[3px] rounded-full bg-crema/40 animate-punto-pensando"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

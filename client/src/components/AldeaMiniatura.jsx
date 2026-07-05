import React from "react";
import Aldea from "./Aldea.jsx";

export default function AldeaMiniatura({ jugador, seleccionado = false, onClick, deshabilitado = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={deshabilitado}
      className={`relative flex flex-col items-center gap-1 rounded-lg p-2 border-2 transition-all ${
        seleccionado ? "border-sangre bg-sangre/10 scale-[1.03]" : "border-white/10 bg-panel/60"
      } ${deshabilitado ? "opacity-40" : "active:scale-95"}`}
      aria-pressed={seleccionado}
    >
      <div className="w-full">
        <Aldea granjas={jugador.granjas} quemadas={jugador.granjasQuemadas} muralla={jugador.muralla} castillo={jugador.castillo} />
      </div>
      <div className="flex items-center gap-1 text-xs font-texto">
        <span>{jugador.icono}</span>
        <span className="truncate max-w-[70px]">{jugador.nombre}</span>
      </div>
      <div className="flex items-center gap-2 text-[10px] font-mono text-oro">
        <span>💰{jugador.oro}</span>
        <span>🏰{jugador.castillo}</span>
      </div>
      {!jugador.conectado && (
        <span className="absolute top-1 right-1 text-[9px] bg-black/60 px-1 rounded text-crema/70">desconectado</span>
      )}
      {jugador.selloJugada && <span className="absolute top-1 left-1 text-xs">🔒</span>}
    </button>
  );
}

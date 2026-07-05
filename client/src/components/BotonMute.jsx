import React from "react";

// Recibe el estado desde el hook useSonidos() del componente padre para que
// el mute sea uno solo en toda la pantalla (no una instancia de Howler por
// cada componente que lo use).
export default function BotonMute({ silenciado, alternarMute }) {
  return (
    <button
      onClick={alternarMute}
      aria-label={silenciado ? "Activar sonido" : "Silenciar"}
      className="rounded-full w-9 h-9 flex items-center justify-center bg-panel/70 border border-white/10 text-lg"
    >
      {silenciado ? "🔇" : "🔊"}
    </button>
  );
}

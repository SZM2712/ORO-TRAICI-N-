import React, { useEffect } from "react";
import { useGame } from "../state/GameContext.jsx";
import Aldea from "../components/Aldea.jsx";
import { useSonidos } from "../hooks/useSonidos.js";

const MEDALLAS = ["🥇", "🥈", "🥉"];

export default function VictoriaScreen() {
  const { snapshot, salirDeSala } = useGame();
  const { reproducir } = useSonidos();

  useEffect(() => {
    reproducir("fanfarria");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const podio = snapshot.podio || [];
  const ganador = podio.find((p) => p.id === snapshot.ganadorId) || podio[0];
  const ganadorJugador = snapshot.jugadores.find((j) => j.id === ganador?.id);

  return (
    <div className="flex-1 flex flex-col items-center px-6 py-10 gap-6 text-center">
      <h1 className="font-titulo text-3xl text-oro">👑 ¡Victoria!</h1>
      {ganador && (
        <div className="space-y-2">
          <p className="text-lg">
            {ganador.icono} <span className="font-titulo text-oro">{ganador.nombre}</span> completó su castillo
          </p>
          {ganadorJugador && (
            <div className="w-56 mx-auto">
              <Aldea
                granjas={ganadorJugador.granjas}
                quemadas={ganadorJugador.granjasQuemadas}
                muralla={ganadorJugador.muralla}
                castillo={ganadorJugador.castillo}
              />
            </div>
          )}
        </div>
      )}

      <div className="w-full space-y-2">
        <p className="text-xs uppercase tracking-widest text-crema/50 font-mono">Podio final</p>
        {podio.map((p, i) => (
          <div
            key={p.id}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 border ${
              i === 0 ? "border-oro bg-oro/10" : "border-white/10 bg-panel/60"
            }`}
          >
            <span className="text-xl w-7">{MEDALLAS[i] || `#${i + 1}`}</span>
            <span className="text-lg">{p.icono}</span>
            <span className="flex-1 text-left text-sm">{p.nombre}</span>
            <span className="font-mono text-oro text-sm">🏰{p.castillo} · 💰{p.oro}</span>
          </div>
        ))}
      </div>

      <button
        onClick={salirDeSala}
        className="w-full rounded-xl py-3 bg-oro text-[#241017] font-titulo text-lg tracking-wide active:scale-95"
      >
        Volver al inicio
      </button>
    </div>
  );
}

import React, { useState } from "react";
import { useGame } from "../state/GameContext.jsx";
import MonedaOro from "../components/MonedaOro.jsx";

const OPCIONES_TIEMPO = [
  { valor: null, etiqueta: "Sin límite" },
  { valor: 60000, etiqueta: "60 s" },
  { valor: 30000, etiqueta: "30 s" },
];

export default function LobbyScreen() {
  const { snapshot, esHost, empezarPartida, salirDeSala, setError } = useGame();
  const [tiempoLimite, setTiempoLimite] = useState(null);
  const [cargando, setCargando] = useState(false);

  const jugadores = snapshot.jugadores;
  const puedeEmpezar = jugadores.length >= 3;

  const alEmpezar = async () => {
    setCargando(true);
    const res = await empezarPartida({ tiempoLimite });
    setCargando(false);
    if (!res.ok) setError(res.error);
  };

  return (
    <div className="flex-1 flex flex-col items-center px-6 py-8 gap-6">
      <button onClick={salirDeSala} className="self-start text-xs text-crema/40 font-mono">
        ← salir
      </button>

      <div className="text-center space-y-2">
        <p className="text-xs uppercase tracking-widest text-crema/50">Código de sala</p>
        <MonedaOro size={140}>
          <span className="text-2xl font-mono tracking-widest">{snapshot.code}</span>
        </MonedaOro>
        <p className="text-xs text-crema/40">Compartí este código para que se unan</p>
      </div>

      <div className="w-full space-y-2">
        <p className="text-xs uppercase tracking-widest text-crema/50 font-mono">
          Jugadores ({jugadores.length}/8)
        </p>
        <div className="space-y-1.5">
          {jugadores.map((j) => (
            <div key={j.id} className="flex items-center gap-2 bg-panel/70 rounded-lg px-3 py-2 border border-white/10">
              <span className="text-xl">{j.icono}</span>
              <span className="flex-1 text-sm">{j.nombre}</span>
              {j.esHost && <span className="text-[10px] text-oro font-mono uppercase">anfitrión</span>}
              {j.esBot && <span className="text-[10px] text-acero font-mono uppercase">🤖 cpu</span>}
              {!j.conectado && <span className="text-[10px] text-crema/40">offline</span>}
            </div>
          ))}
        </div>
      </div>

      {esHost && (
        <div className="w-full space-y-3 pt-2">
          <div>
            <p className="text-xs uppercase tracking-widest text-crema/50 font-mono mb-1.5">Tiempo por ronda</p>
            <div className="grid grid-cols-3 gap-2">
              {OPCIONES_TIEMPO.map((o) => (
                <button
                  key={o.etiqueta}
                  onClick={() => setTiempoLimite(o.valor)}
                  className={`rounded-lg py-2 text-xs border-2 ${
                    tiempoLimite === o.valor ? "border-oro bg-oro/15 text-oro" : "border-white/10 text-crema/70"
                  }`}
                >
                  {o.etiqueta}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={alEmpezar}
            disabled={!puedeEmpezar || cargando}
            className="w-full rounded-xl py-3 bg-oro text-[#241017] font-titulo text-lg tracking-wide active:scale-95 disabled:opacity-40"
          >
            {puedeEmpezar ? "Empezar Partida" : "Se necesitan 3 jugadores"}
          </button>
        </div>
      )}
      {!esHost && <p className="text-sm text-crema/50 text-center">Esperando a que el anfitrión empiece la partida…</p>}
    </div>
  );
}

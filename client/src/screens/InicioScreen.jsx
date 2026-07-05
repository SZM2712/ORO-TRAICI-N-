import React, { useState } from "react";
import { useGame } from "../state/GameContext.jsx";

const ANIMALES = ["🦁", "🦊", "🐺", "🐻", "🐯", "🦉", "🐗", "🦅", "🐢", "🐍"];

export default function InicioScreen() {
  const { crearSala, unirseASala, setError } = useGame();
  const [nombre, setNombre] = useState("");
  const [icono, setIcono] = useState(ANIMALES[0]);
  const [codigo, setCodigo] = useState("");
  const [cargando, setCargando] = useState(false);

  const validarNombre = () => nombre.trim().length > 0;

  const alCrear = async () => {
    if (!validarNombre()) return setError("Ponele un nombre a tu aldea.");
    setCargando(true);
    const res = await crearSala({ nombre, icono });
    setCargando(false);
    if (!res.ok) setError(res.error);
  };

  const alJugarContraMaquina = async () => {
    if (!validarNombre()) return setError("Ponele un nombre a tu aldea.");
    setCargando(true);
    const res = await crearSala({ nombre, icono, vsMaquina: true, cantidadBots: 2 });
    setCargando(false);
    if (!res.ok) setError(res.error);
  };

  const alUnirse = async () => {
    if (!validarNombre()) return setError("Ponele un nombre a tu aldea.");
    if (codigo.trim().length !== 4) return setError("El código de sala tiene 4 letras.");
    setCargando(true);
    const res = await unirseASala({ roomCode: codigo.trim().toUpperCase(), nombre, icono });
    setCargando(false);
    if (!res.ok) setError(res.error);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 gap-6 text-center">
      <div>
        <h1 className="font-titulo text-3xl text-oro leading-tight">ORO &amp; TRAICIÓN</h1>
        <p className="text-sm text-crema/70 mt-1 font-texto tracking-wide">La Era de las Aldeas</p>
      </div>

      <div className="w-full space-y-3">
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          maxLength={18}
          placeholder="Tu nombre"
          className="w-full rounded-lg bg-panel border border-white/15 px-4 py-3 text-crema placeholder:text-crema/30 font-texto text-center"
        />

        <div className="grid grid-cols-5 gap-2">
          {ANIMALES.map((a) => (
            <button
              key={a}
              onClick={() => setIcono(a)}
              className={`text-2xl rounded-lg py-2 border-2 ${icono === a ? "border-oro bg-oro/15" : "border-white/10"}`}
              aria-pressed={icono === a}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full space-y-3 pt-2">
        <button
          onClick={alCrear}
          disabled={cargando}
          className="w-full rounded-xl py-3 bg-oro text-[#241017] font-titulo text-lg tracking-wide active:scale-95 disabled:opacity-50"
        >
          Crear Sala
        </button>

        <button
          onClick={alJugarContraMaquina}
          disabled={cargando}
          className="w-full rounded-xl py-3 border-2 border-oro/60 text-oro font-titulo text-base tracking-wide active:scale-95 disabled:opacity-50"
        >
          🤖 Probar contra la máquina
        </button>

        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-crema/40 font-mono">o</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <input
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase().slice(0, 4))}
          placeholder="CÓDIGO"
          className="w-full rounded-lg bg-panel border border-white/15 px-4 py-3 text-center font-mono text-2xl tracking-[0.4em] text-crema placeholder:text-crema/20"
        />
        <button
          onClick={alUnirse}
          disabled={cargando}
          className="w-full rounded-xl py-3 border-2 border-acero text-acero font-titulo text-lg tracking-wide active:scale-95 disabled:opacity-50"
        >
          Unirse a Sala
        </button>
      </div>
    </div>
  );
}

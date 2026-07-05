import React from "react";
import { ETAPA_AMBICION } from "../utils/format.js";

// Posiciones fijas (en % del mapa) según la cantidad de jugadores, pensadas
// para que se vean dispersas por el territorio en vez de en una grilla
// prolija. El orden se asigna por id de jugador, así cada uno mantiene su
// mismo lugar en el mapa toda la partida.
const POSICIONES = {
  3: [
    [50, 18],
    [22, 74],
    [78, 74],
  ],
  4: [
    [50, 15],
    [16, 46],
    [84, 46],
    [50, 86],
  ],
  5: [
    [50, 12],
    [18, 36],
    [82, 36],
    [28, 84],
    [72, 84],
  ],
  6: [
    [50, 12],
    [16, 34],
    [84, 34],
    [14, 70],
    [86, 70],
    [50, 90],
  ],
  7: [
    [50, 10],
    [18, 28],
    [82, 28],
    [10, 58],
    [90, 58],
    [30, 90],
    [70, 90],
  ],
  8: [
    [50, 8],
    [20, 22],
    [80, 22],
    [8, 50],
    [92, 50],
    [20, 78],
    [80, 78],
    [50, 94],
  ],
};

function posicionesPara(cantidad) {
  return POSICIONES[cantidad] || POSICIONES[8];
}

// Fondo decorativo del reino: colinas, un río y manchas de bosque, dibujado
// a mano en SVG con la misma paleta que <Aldea/> — sin depender de assets
// externos, como el resto del arte del juego.
function TerrenoDecorativo() {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full" aria-hidden="true">
      <defs>
        <linearGradient id="mapaCielo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a1420" />
          <stop offset="100%" stopColor="#1a0d16" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#mapaCielo)" />
      <path d="M0 60 Q 20 50 35 62 T 70 58 T 100 66 V100 H0 Z" fill="#3a2b1a" opacity="0.9" />
      <path d="M0 72 Q 25 64 45 74 T 100 78 V100 H0 Z" fill="#2f2314" />
      <path
        d="M-5 30 Q 20 40 15 55 T 30 78 T 20 100"
        stroke="#3a5a66"
        strokeWidth="3"
        fill="none"
        opacity="0.55"
      />
      {[
        [12, 18],
        [88, 15],
        [8, 85],
        [92, 88],
        [60, 8],
      ].map(([x, y], i) => (
        <g key={i} transform={`translate(${x},${y})`} opacity="0.5">
          <path d="M0 6 L4 -6 L8 6 Z" fill="#4a5a3a" />
          <path d="M4 4 L8 -8 L12 4 Z" fill="#3d4a30" />
        </g>
      ))}
    </svg>
  );
}

function LineasAlianza({ alianzas, posicionPorId }) {
  if (!alianzas?.length) return null;
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
      {alianzas.map(([a, b]) => {
        const pa = posicionPorId.get(a);
        const pb = posicionPorId.get(b);
        if (!pa || !pb) return null;
        return (
          <line
            key={`${a}-${b}`}
            x1={pa[0]}
            y1={pa[1]}
            x2={pb[0]}
            y2={pb[1]}
            stroke="#8FB3C7"
            strokeWidth="0.6"
            strokeDasharray="2,1.5"
            opacity="0.7"
          />
        );
      })}
    </svg>
  );
}

export default function MapaReino({
  jugadores,
  miId,
  alianzas = [],
  misAliadosIds,
  tesorosAlianza = {},
  seleccionadoId,
  objetivoId,
  onSeleccionar,
  puedeElegir,
}) {
  const ordenados = [...jugadores].sort((a, b) => a.id - b.id);
  const posiciones = posicionesPara(ordenados.length);
  const posicionPorId = new Map(ordenados.map((j, i) => [j.id, posiciones[i % posiciones.length]]));

  return (
    <div className="relative w-full aspect-[5/4] rounded-xl overflow-hidden border border-white/10 sombra-panel">
      <TerrenoDecorativo />
      <LineasAlianza alianzas={alianzas} posicionPorId={posicionPorId} />

      {ordenados.map((j) => {
        const [x, y] = posicionPorId.get(j.id);
        const esYo = j.id === miId;
        const esAliado = misAliadosIds.has(j.id);
        const esAmbicioso = j.castillo >= ETAPA_AMBICION;
        const seleccionado = seleccionadoId === j.id;
        const esObjetivo = objetivoId === j.id;
        const tesoro = esAliado ? tesorosAlianza[j.id] || 0 : 0;
        // Siempre se puede tocar cualquier aldea para inspeccionarla en la
        // ficha de abajo; "vigente" solo afecta si además queda marcada como
        // objetivo de la acción en curso (ver JuegoScreen.alSeleccionarAldea).
        const vigente = esYo || puedeElegir(j);

        return (
          <button
            key={j.id}
            type="button"
            onClick={() => onSeleccionar(j)}
            style={{ left: `${x}%`, top: `${y}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 group active:scale-95"
          >
            <div
              className={`relative w-10 h-10 rounded-full border-2 flex items-center justify-center text-lg bg-panel/90 transition-all ${
                esObjetivo
                  ? "border-sangre scale-110"
                  : seleccionado
                  ? "border-oro scale-110"
                  : esYo
                  ? "border-crema"
                  : esAliado
                  ? "border-acero"
                  : esAmbicioso
                  ? "border-oro"
                  : "border-white/20"
              } ${!vigente ? "opacity-50" : ""}`}
            >
              {j.icono}
              {esAmbicioso && <span className="absolute -top-1.5 -right-1.5 text-[10px]">👑</span>}
              {j.selloJugada && <span className="absolute -bottom-1 -right-1 text-[9px]">🔒</span>}
            </div>
            <span className="text-[9px] font-texto text-crema/90 bg-black/50 px-1 rounded truncate max-w-[64px]">
              {esYo ? "Vos" : j.nombre}
            </span>
            <span className="text-[9px] font-mono text-oro bg-black/40 px-1 rounded">
              💰{j.oro} 🏰{j.castillo}
            </span>
            {esAliado && (
              <span className="absolute -top-1 -left-1 text-[8px] bg-acero text-[#0c1620] px-1 rounded font-semibold">🤝</span>
            )}
            {tesoro > 0 && (
              <span className="absolute -top-1 -right-1 text-[8px] bg-oro/90 text-[#241017] px-1 rounded font-semibold">
                🔒{tesoro}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

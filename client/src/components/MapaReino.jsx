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

const ESTRELLAS = [
  [8, 8], [18, 14], [30, 6], [42, 16], [58, 7], [70, 12], [82, 6], [93, 15],
  [5, 22], [25, 4], [50, 3], [88, 22], [96, 8], [14, 5],
];

const ARBOLES = [
  [12, 20, 1], [17, 24, 0.7], [88, 16, 1], [93, 21, 0.75], [6, 60, 0.85],
  [10, 66, 0.6], [92, 58, 0.9], [88, 65, 0.65], [30, 92, 0.8], [70, 93, 0.7],
  [50, 96, 0.6], [4, 88, 0.75],
];

const ROCAS = [
  [40, 62, 1], [62, 68, 0.8], [22, 55, 0.7], [76, 50, 0.9],
];

// Fondo decorativo del reino: cielo estrellado, montañas y colinas en capas,
// un río con brillo, bosques y rocas, una rosa de los vientos y un marco tipo
// pergamino con viñeta — todo dibujado a mano en SVG con la misma paleta que
// <Aldea/>, sin depender de assets externos, como el resto del arte del juego.
function TerrenoDecorativo() {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full" aria-hidden="true">
      <defs>
        <linearGradient id="mapaCielo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#341a2c" />
          <stop offset="45%" stopColor="#26121f" />
          <stop offset="100%" stopColor="#170b13" />
        </linearGradient>
        <linearGradient id="montanaLejos" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a3050" />
          <stop offset="100%" stopColor="#2c1a2e" />
        </linearGradient>
        <linearGradient id="colinaAtras" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a3826" />
          <stop offset="100%" stopColor="#2f2314" />
        </linearGradient>
        <linearGradient id="colinaAdelante" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#382a1a" />
          <stop offset="100%" stopColor="#20170e" />
        </linearGradient>
        <linearGradient id="rioGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1f4550" />
          <stop offset="100%" stopColor="#3d6b74" />
        </linearGradient>
        <radialGradient id="vinieta" cx="50%" cy="45%" r="75%">
          <stop offset="55%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#0a0509" stopOpacity="0.75" />
        </radialGradient>
      </defs>

      <rect width="100" height="100" fill="url(#mapaCielo)" />

      {ESTRELLAS.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={i % 3 === 0 ? 0.5 : 0.3}
          fill="#F3E7D3"
          className="animate-estrella-titila"
          style={{ animationDelay: `${(i % 5) * 0.5}s` }}
        />
      ))}
      <g transform="translate(85,11)" opacity="0.9">
        <circle r="3.4" fill="#F3E7D3" />
        <circle cx="1.6" cy="-1" r="3.4" fill="#26121f" />
      </g>

      {/* Montañas lejanas */}
      <path
        d="M-5 42 L8 28 L18 40 L28 22 L40 40 L52 24 L64 40 L76 26 L88 40 L100 30 V60 H-5 Z"
        fill="url(#montanaLejos)"
        opacity="0.55"
      />

      {/* Colinas medias y delanteras */}
      <path d="M0 58 Q 20 48 35 60 T 70 56 T 100 64 V100 H0 Z" fill="url(#colinaAtras)" opacity="0.92" />
      <path d="M0 74 Q 25 65 45 75 T 100 79 V100 H0 Z" fill="url(#colinaAdelante)" />

      {/* Río con brillo */}
      <path
        d="M-5 30 Q 20 40 15 55 T 30 78 T 20 102"
        stroke="url(#rioGrad)"
        strokeWidth="3.2"
        fill="none"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        d="M-5 30 Q 20 40 15 55 T 30 78 T 20 102"
        stroke="#cdeaf0"
        strokeWidth="0.8"
        fill="none"
        strokeLinecap="round"
        className="animate-agua-brillo"
      />

      {/* Rocas */}
      {ROCAS.map(([x, y, s], i) => (
        <g key={i} transform={`translate(${x},${y}) scale(${s})`} opacity="0.6">
          <path d="M-4 2 Q-3 -3 2 -2 Q5 -1 4 2 Z" fill="#463a3a" />
        </g>
      ))}

      {/* Bosques */}
      {ARBOLES.map(([x, y, s], i) => (
        <g key={i} transform={`translate(${x},${y}) scale(${s})`} opacity="0.65">
          <path d="M0 9 L4 -2 L8 9 Z" fill="#3a4a2e" />
          <path d="M2 6 L6 -6 L10 6 Z" fill="#445c34" />
          <path d="M4 3 L8 -9 L12 3 Z" fill="#4e6b3a" />
        </g>
      ))}

      {/* Rosa de los vientos */}
      <g transform="translate(91,91)" opacity="0.4" stroke="#E3B34C" fill="none" strokeWidth="0.35">
        <circle r="6" />
        <path d="M0 -6 V6 M-6 0 H6 M-4.2 -4.2 L4.2 4.2 M-4.2 4.2 L4.2 -4.2" />
        <path d="M0 -6 L1.3 -3 L0 -1.5 L-1.3 -3 Z" fill="#E3B34C" stroke="none" />
      </g>
      <text x="91" y="82.5" fontSize="2.6" fill="#E3B34C" opacity="0.5" textAnchor="middle" fontFamily="serif">
        N
      </text>

      {/* Viñeta y marco tipo pergamino */}
      <rect width="100" height="100" fill="url(#vinieta)" />
      <rect x="1.2" y="1.2" width="97.6" height="97.6" rx="3" fill="none" stroke="#E3B34C" strokeOpacity="0.35" strokeWidth="0.5" />
      <rect x="2.4" y="2.4" width="95.2" height="95.2" rx="2.4" fill="none" stroke="#E3B34C" strokeOpacity="0.18" strokeWidth="0.25" />
      {[[2.4, 2.4], [97.6, 2.4], [2.4, 97.6], [97.6, 97.6]].map(([x, y], i) => (
        <path
          key={i}
          transform={`translate(${x},${y}) rotate(${i * 90})`}
          d="M0 0 L2.2 0 M0 0 L0 2.2"
          stroke="#E3B34C"
          strokeOpacity="0.45"
          strokeWidth="0.5"
        />
      ))}
    </svg>
  );
}

function LineasAlianza({ alianzas, posicionPorId }) {
  if (!alianzas?.length) return null;
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
      <defs>
        <linearGradient id="lineaAlianzaGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8FB3C7" />
          <stop offset="100%" stopColor="#E3B34C" />
        </linearGradient>
      </defs>
      {alianzas.map(([a, b]) => {
        const pa = posicionPorId.get(a);
        const pb = posicionPorId.get(b);
        if (!pa || !pb) return null;
        return (
          <g key={`${a}-${b}`}>
            <line x1={pa[0]} y1={pa[1]} x2={pb[0]} y2={pb[1]} stroke="#8FB3C7" strokeWidth="1.6" opacity="0.18" />
            <line
              x1={pa[0]}
              y1={pa[1]}
              x2={pb[0]}
              y2={pb[1]}
              stroke="url(#lineaAlianzaGrad)"
              strokeWidth="0.5"
              strokeDasharray="2.2,1.6"
              opacity="0.9"
              className="animate-linea-marcha"
            />
            <circle cx={pa[0]} cy={pa[1]} r="0.7" fill="#E3B34C" opacity="0.8" />
            <circle cx={pb[0]} cy={pb[1]} r="0.7" fill="#E3B34C" opacity="0.8" />
          </g>
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
    <div className="relative w-full aspect-[5/4] rounded-xl overflow-hidden border border-oro/20 sombra-panel">
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
        const brillar = esAmbicioso || esObjetivo || seleccionado;

        return (
          <button
            key={j.id}
            type="button"
            onClick={() => onSeleccionar(j)}
            style={{ left: `${x}%`, top: `${y}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group active:scale-95"
          >
            <div
              className={`relative w-11 h-11 rounded-full border-2 flex items-center justify-center text-lg transition-all ${
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
              } ${!vigente ? "opacity-50" : ""} ${brillar ? "animate-corona-brillo" : ""}`}
              style={{
                background: "radial-gradient(circle at 35% 30%, #33202a, #1a0d16 75%)",
                boxShadow: "0 2px 4px rgba(0,0,0,0.6), inset 0 0 6px rgba(0,0,0,0.5)",
              }}
            >
              {j.icono}
              {esAmbicioso && <span className="absolute -top-1.5 -right-1.5 text-[10px]">👑</span>}
              {j.selloJugada && <span className="absolute -bottom-1 -right-1 text-[9px]">🔒</span>}
            </div>
            <div
              className={`w-6 h-1.5 rounded-full bg-black/50 blur-[1.5px] mt-[-4px] -z-10 transition-all ${
                seleccionado || esObjetivo ? "scale-110" : ""
              }`}
            />
            <span className="mt-0.5 text-[9px] font-texto text-crema/90 bg-panel/85 border border-oro/20 px-1 rounded-sm truncate max-w-[64px]">
              {esYo ? "Vos" : j.nombre}
            </span>
            <span className="text-[9px] font-mono text-oro bg-panel/80 border border-oro/10 px-1 rounded-sm">
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

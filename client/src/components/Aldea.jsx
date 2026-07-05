import React from "react";

// Placeholder gráfico con la misma API que tendrán los SVG definitivos
// (ver client/src/assets/svg/index.js). Cuando lleguen los archivos reales,
// solo hay que reemplazar el contenido de este componente — el resto de la
// UI ya consume <Aldea granjas quemadas muralla castillo fuego noche />.
export default function Aldea({ granjas = 0, quemadas = 0, muralla = false, castillo = 0, fuego = false, noche = false, className = "" }) {
  const colorCielo = noche ? "#0c0812" : "#2a1420";
  const colorSuelo = noche ? "#1a2418" : "#3a2b1a";

  const posicionesGranja = [
    [30, 150],
    [80, 160],
    [220, 160],
    [260, 150],
  ];
  const totalGranjas = granjas + quemadas;

  return (
    <div className={`relative w-full ${className}`}>
      <svg viewBox="0 0 300 200" className="w-full h-auto rounded-lg" role="img" aria-label="Vista de la aldea">
        <defs>
          <linearGradient id="cieloGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colorCielo} />
            <stop offset="100%" stopColor="#150A0F" />
          </linearGradient>
        </defs>
        <rect width="300" height="200" fill="url(#cieloGrad)" />
        <rect y="150" width="300" height="50" fill={colorSuelo} />

        {/* Granjas vivas y cenizas */}
        {Array.from({ length: Math.min(totalGranjas, posicionesGranja.length) }).map((_, i) => {
          const [x, y] = posicionesGranja[i];
          const quemada = i >= granjas;
          return (
            <g key={i} transform={`translate(${x},${y})`}>
              {quemada ? (
                <g opacity="0.85">
                  <ellipse cx="10" cy="14" rx="14" ry="5" fill="#2b2320" />
                  <path d="M0 14 L6 2 L12 14 Z" fill="#3d3330" />
                  <path d="M8 14 L16 4 L20 14 Z" fill="#242020" />
                </g>
              ) : (
                <g>
                  <rect x="-2" y="0" width="24" height="14" rx="2" fill="#8FB3C7" opacity="0.15" />
                  <path d="M0 8 L10 -6 L20 8 Z" fill="#E3B34C" />
                  <rect x="2" y="8" width="16" height="10" fill="#caa257" />
                </g>
              )}
            </g>
          );
        })}

        {/* Muralla */}
        {muralla && (
          <g>
            <rect x="0" y="140" width="300" height="12" fill="#6b7d87" />
            {[0, 40, 80, 120, 160, 200, 240, 280].map((x) => (
              <rect key={x} x={x} y="132" width="18" height="10" fill="#8FB3C7" />
            ))}
          </g>
        )}

        {/* Castillo (etapas 0-3) */}
        <g transform="translate(110,0)">
          {castillo === 0 && <rect x="30" y="140" width="30" height="10" fill="#4a3626" opacity="0.6" />}
          {castillo >= 1 && (
            <g>
              <rect x="20" y="110" width="50" height="40" fill="#9b8264" />
              <path d="M20 110 L45 90 L70 110 Z" fill="#7a6650" />
            </g>
          )}
          {castillo >= 2 && (
            <g>
              <rect x="5" y="95" width="18" height="55" fill="#8a7357" />
              <rect x="67" y="95" width="18" height="55" fill="#8a7357" />
              <path d="M5 95 L14 82 L23 95 Z" fill="#6b5842" />
              <path d="M67 95 L76 82 L85 95 Z" fill="#6b5842" />
            </g>
          )}
          {castillo >= 3 && (
            <g>
              <rect x="38" y="70" width="14" height="25" fill="#E3B34C" />
              <path d="M38 70 L45 58 L52 70 Z" fill="#E3B34C" />
              <circle cx="45" cy="52" r="4" fill="#F3E7D3" />
            </g>
          )}
        </g>

        {fuego && (
          <g className="animate-fuego-parpadeo">
            <text x="150" y="130" fontSize="28" textAnchor="middle">
              🔥
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

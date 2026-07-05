import React, { useState } from "react";

const PASOS = [
  {
    icono: "🏰",
    titulo: "El objetivo",
    texto: "Construí tu castillo hasta la etapa 3 antes que los demás. Si nadie lo logra en 20 rondas, gana quien tenga más puntaje (etapas del castillo × 100 + oro).",
  },
  {
    icono: "🎬",
    titulo: "Cada ronda",
    texto: "Elegís una acción en secreto: 🌾 Cosechar oro, 🔨 Construir, ⚔️ Asaltar a un rival, 🛡️ Defenderte, o 🎁 Enviar oro a un aliado. Todos revelan su jugada al mismo tiempo.",
  },
  {
    icono: "🤝",
    titulo: "Alianzas",
    texto: "Proponele una alianza a cualquier rival — podés tener varias a la vez. Mientras dure, no pueden asaltarse sin traicionarse. Si dos aliados asaltan juntos al mismo objetivo, el botín se guarda oculto y compartido (asalto en pinza).",
  },
  {
    icono: "🗡️",
    titulo: "Traición",
    texto: "Si asaltás a un aliado, la alianza se rompe al instante. Si tenían un tesoro compartido, se disputa a piedra, papel o tijera — y un 20% siempre se pierde como impuesto a la corona.",
  },
  {
    icono: "🔮",
    titulo: "Profecías",
    texto: "En las rondas 1, 5 y 10 se vota en secreto entre 3 pergaminos (A/B/C). El que gana la mayoría cambia las reglas de esa ronda para todos.",
  },
  {
    icono: "🗺️",
    titulo: "El mapa",
    texto: "Todas las aldeas están en el mapa, incluida la tuya. Tocá cualquiera para ver sus detalles abajo; las líneas punteadas muestran las alianzas activas de toda la sala.",
  },
];

export default function ModalTutorial({ onCerrar }) {
  const [paso, setPaso] = useState(0);
  const { icono, titulo, texto } = PASOS[paso];
  const esUltimo = paso === PASOS.length - 1;

  return (
    <div className="fixed inset-0 z-[80] bg-black/85 flex items-end sm:items-center justify-center p-3">
      <div className="w-full max-w-[400px] bg-panel rounded-2xl border-2 border-oro/40 sombra-panel p-5 text-center space-y-4">
        <p className="text-5xl">{icono}</p>
        <h2 className="font-titulo text-oro text-lg">{titulo}</h2>
        <p className="text-sm text-crema/85 leading-snug">{texto}</p>

        <div className="flex items-center justify-center gap-1.5 pt-1">
          {PASOS.map((_, i) => (
            <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === paso ? "bg-oro" : "bg-crema/20"}`} />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          {paso > 0 ? (
            <button
              onClick={() => setPaso((p) => p - 1)}
              className="rounded-xl py-2.5 border-2 border-acero text-acero font-titulo tracking-wide active:scale-95"
            >
              Atrás
            </button>
          ) : (
            <button onClick={onCerrar} className="rounded-xl py-2.5 border-2 border-white/15 text-crema/60 font-titulo tracking-wide active:scale-95">
              Saltar
            </button>
          )}
          {esUltimo ? (
            <button
              onClick={onCerrar}
              className="rounded-xl py-2.5 bg-oro text-[#241017] font-titulo tracking-wide active:scale-95"
            >
              ¡A jugar!
            </button>
          ) : (
            <button
              onClick={() => setPaso((p) => p + 1)}
              className="rounded-xl py-2.5 bg-oro text-[#241017] font-titulo tracking-wide active:scale-95"
            >
              Siguiente
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

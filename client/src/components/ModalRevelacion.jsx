import React from "react";

const TIPOS_FUEGO = new Set(["incendio", "profecia_rayo"]);
const TIPOS_ORO = new Set(["cosecha", "asalto_exitoso", "profecia_piedad_rey", "profecia_caravana"]);

export default function ModalRevelacion({ rondaRevelada, onCerrar }) {
  if (!rondaRevelada) return null;
  const { ronda, eventos = [], narracion = [], profecia } = rondaRevelada;

  return (
    <div className="fixed inset-0 z-40 bg-black/80 flex items-end sm:items-center justify-center p-3">
      <div className="w-full max-w-[440px] bg-panel rounded-2xl border-2 border-oro/40 sombra-panel animate-carta-voltea max-h-[85vh] flex flex-col">
        <div className="px-4 pt-4 pb-2 border-b border-white/10">
          <h2 className="font-titulo text-oro text-lg">Ronda {ronda} revelada</h2>
          {profecia && (
            <p className="text-xs text-crema/70 mt-1">
              {profecia.icono} <span className="font-semibold">{profecia.nombre}</span> — {profecia.texto}
            </p>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {narracion.map((frase, i) => (
            <p
              key={i}
              className={`text-sm leading-snug ${TIPOS_FUEGO.has(eventos[i]?.tipo) ? "animate-fuego-parpadeo text-sangre" : ""} ${
                TIPOS_ORO.has(eventos[i]?.tipo) ? "text-oro" : "text-crema/90"
              }`}
            >
              {frase}
            </p>
          ))}
          {narracion.length === 0 && <p className="text-crema/50 text-sm">Una ronda tranquila…</p>}
        </div>
        <div className="p-3 border-t border-white/10">
          <button
            onClick={onCerrar}
            className="w-full rounded-xl py-2.5 border-2 border-acero text-acero font-titulo tracking-wide active:scale-95"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}

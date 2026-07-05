import React, { useState } from "react";

export default function ModalPropuestaAlianza({ propuesta, onResponder }) {
  const [enviando, setEnviando] = useState(false);
  if (!propuesta) return null;

  const responder = async (aceptar) => {
    setEnviando(true);
    await onResponder(propuesta.deId, aceptar);
    setEnviando(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3">
      <div className="w-full max-w-[360px] bg-panel rounded-2xl border-2 border-acero/50 sombra-panel p-5 text-center space-y-4">
        <p className="text-4xl">{propuesta.deIcono}</p>
        <p className="text-crema/90">
          <span className="font-semibold text-acero">{propuesta.deNombre}</span> te propone una alianza. 🤝
        </p>
        <p className="text-xs text-crema/50">
          Mientras dure, no pueden asaltarse sin traicionarla. Cualquiera puede romperla asaltando al otro.
        </p>
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={() => responder(false)}
            disabled={enviando}
            className="rounded-xl py-2.5 border-2 border-sangre text-sangre font-titulo tracking-wide active:scale-95 disabled:opacity-50"
          >
            Rechazar
          </button>
          <button
            onClick={() => responder(true)}
            disabled={enviando}
            className="rounded-xl py-2.5 bg-acero text-[#0c1620] font-titulo tracking-wide active:scale-95 disabled:opacity-50"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}

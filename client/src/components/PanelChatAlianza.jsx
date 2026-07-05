import React, { useState } from "react";

const PLANTILLAS = [
  { id: "defender_ronda", etiqueta: "🛡️ Defiendo esta ronda" },
  { id: "necesito_oro", etiqueta: "💰 Necesito oro" },
  { id: "no_atacar", etiqueta: "🤝 No me ataques" },
  { id: "construyendo", etiqueta: "🏗️ Estoy construyendo" },
  { id: "cuidado_traicion", etiqueta: "⚠️ Cuidado, traición" },
];

export default function PanelChatAlianza({ tengoAliados, rivales, mensajes, onEnviar }) {
  const [abierto, setAbierto] = useState(false);
  const [objetivoAtaque, setObjetivoAtaque] = useState("");

  if (!tengoAliados && mensajes.length === 0) return null;

  const enviarAtacarJuntos = () => {
    if (!objetivoAtaque) return;
    onEnviar("atacar_juntos", Number(objetivoAtaque));
  };

  return (
    <section className="bg-panel/60 rounded-xl border border-acero/30">
      <button
        onClick={() => setAbierto((a) => !a)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-titulo text-acero"
      >
        <span>💬 Chat de aliados</span>
        <span className="text-crema/40">{abierto ? "▲" : "▼"}</span>
      </button>

      {abierto && (
        <div className="px-3 pb-3 space-y-2">
          {mensajes.length > 0 && (
            <div className="max-h-32 overflow-y-auto space-y-1 bg-black/20 rounded-lg p-2">
              {mensajes.map((m, i) => (
                <p key={i} className="text-[11px] text-crema/80">
                  <span className="font-semibold text-acero">
                    {m.deIcono} {m.deNombre}:
                  </span>{" "}
                  {m.texto}
                </p>
              ))}
            </div>
          )}

          {tengoAliados && (
            <>
              <div className="grid grid-cols-2 gap-1.5">
                {PLANTILLAS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onEnviar(p.id)}
                    className="text-[10px] rounded-lg py-1.5 border border-acero/40 text-acero active:scale-95"
                  >
                    {p.etiqueta}
                  </button>
                ))}
              </div>
              {rivales.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <select
                    value={objetivoAtaque}
                    onChange={(e) => setObjetivoAtaque(e.target.value)}
                    className="flex-1 text-[10px] rounded-lg bg-black/30 border border-acero/40 text-crema/80 py-1.5 px-1"
                  >
                    <option value="">¿A quién?</option>
                    {rivales.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.icono} {r.nombre}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={enviarAtacarJuntos}
                    disabled={!objetivoAtaque}
                    className="text-[10px] rounded-lg py-1.5 px-2 border border-sangre/50 text-sangre disabled:opacity-40 active:scale-95 whitespace-nowrap"
                  >
                    ⚔️ Atacar juntos
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}

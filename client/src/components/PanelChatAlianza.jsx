import React, { useEffect, useRef, useState } from "react";

const PLANTILLAS = [
  { id: "defender_ronda", etiqueta: "🛡️ Defiendo esta ronda" },
  { id: "necesito_oro", etiqueta: "💰 Necesito oro" },
  { id: "no_atacar", etiqueta: "🤝 No me ataques" },
  { id: "construyendo", etiqueta: "🏗️ Estoy construyendo" },
  { id: "cuidado_traicion", etiqueta: "⚠️ Cuidado, traición" },
];

export default function PanelChatAlianza({ aliados, rivales, mensajes, miJugadorId, onEnviar }) {
  const [abierto, setAbierto] = useState(false);
  const [objetivoAtaque, setObjetivoAtaque] = useState("");
  const [destinatarioId, setDestinatarioId] = useState(""); // "" = todos mis aliados
  const [noLeidos, setNoLeidos] = useState(0);
  const cantidadAnterior = useRef(mensajes.length);

  useEffect(() => {
    const nuevos = mensajes.slice(cantidadAnterior.current);
    cantidadAnterior.current = mensajes.length;
    const deOtros = nuevos.filter((m) => m.deId !== miJugadorId).length;
    if (deOtros > 0 && !abierto) setNoLeidos((n) => n + deOtros);
  }, [mensajes, abierto, miJugadorId]);

  const tengoAliados = aliados.length > 0;
  if (!tengoAliados && mensajes.length === 0) return null;

  const alAbrir = () => {
    setAbierto((a) => !a);
    setNoLeidos(0);
  };

  const enviar = (plantillaId, objetivoId) => {
    onEnviar(plantillaId, objetivoId, destinatarioId || undefined);
  };

  const enviarAtacarJuntos = () => {
    if (!objetivoAtaque) return;
    enviar("atacar_juntos", Number(objetivoAtaque));
  };

  const nombrePara = (m) => {
    if (m.paraId == null) return null;
    if (m.paraId === miJugadorId) return "vos";
    if (m.deId === miJugadorId) return m.paraNombre;
    return null; // mensaje privado entre otros dos que no me incluye no debería llegarme igual
  };

  return (
    <section className="bg-panel/60 rounded-xl border border-acero/30">
      <button onClick={alAbrir} className="w-full flex items-center justify-between px-3 py-2 text-xs font-titulo text-acero">
        <span>
          💬 Chat de aliados
          {noLeidos > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-sangre text-crema text-[10px] font-mono">
              {noLeidos}
            </span>
          )}
        </span>
        <span className="text-crema/40">{abierto ? "▲" : "▼"}</span>
      </button>

      {abierto && (
        <div className="px-3 pb-3 space-y-2">
          {mensajes.length > 0 && (
            <div className="max-h-32 overflow-y-auto space-y-1 bg-black/20 rounded-lg p-2">
              {mensajes.map((m, i) => {
                const etiquetaPara = nombrePara(m);
                return (
                  <p key={i} className="text-[11px] text-crema/80">
                    <span className="font-semibold text-acero">
                      {m.deIcono} {m.deNombre}
                      {etiquetaPara && <span className="text-crema/40 font-normal"> → {etiquetaPara}</span>}:
                    </span>{" "}
                    {m.texto}
                  </p>
                );
              })}
            </div>
          )}

          {tengoAliados && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-crema/40 whitespace-nowrap">Para:</span>
                <select
                  value={destinatarioId}
                  onChange={(e) => setDestinatarioId(e.target.value)}
                  className="flex-1 text-[10px] rounded-lg bg-black/30 border border-acero/40 text-crema/80 py-1.5 px-1"
                >
                  <option value="">🤝 Todos mis aliados</option>
                  {aliados.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.icono} solo {a.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {PLANTILLAS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => enviar(p.id)}
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

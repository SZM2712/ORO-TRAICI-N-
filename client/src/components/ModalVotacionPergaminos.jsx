import React, { useEffect, useState } from "react";
import IndicadorSellado from "./IndicadorSellado.jsx";

function useCuentaRegresiva(deadline) {
  const [restante, setRestante] = useState(null);
  useEffect(() => {
    if (!deadline) {
      setRestante(null);
      return;
    }
    const tick = () => setRestante(Math.max(0, Math.round((deadline - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [deadline]);
  return restante;
}

export default function ModalVotacionPergaminos({
  votacionActual,
  contenidoOraculo,
  votacionRevelada,
  jugadores,
  onVotar,
}) {
  const [miVoto, setMiVoto] = useState(null);
  const restante = useCuentaRegresiva(votacionActual?.deadline);

  useEffect(() => {
    setMiVoto(null);
  }, [votacionActual?.ronda]);

  if (!votacionActual && !votacionRevelada) return null;

  const contenidoPorClave = new Map((contenidoOraculo || []).map((c) => [c.clave, c]));

  const votar = (clave) => {
    if (miVoto || !votacionActual) return;
    setMiVoto(clave);
    onVotar(clave);
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/85 flex items-center justify-center p-3">
      <div className="w-full max-w-[440px] bg-panel rounded-2xl border-2 border-acero/40 sombra-panel max-h-[90vh] overflow-y-auto">
        <div className="px-4 pt-4 pb-2 border-b border-white/10 text-center">
          <h2 className="font-titulo text-acero text-lg">🔮 Votación de Pergaminos</h2>
          {votacionActual && !votacionRevelada && (
            <p className="text-xs text-crema/60 mt-1 font-mono">
              {restante != null ? `${restante}s para votar` : "Votá en secreto…"}
            </p>
          )}
        </div>

        {contenidoOraculo && !votacionRevelada && (
          <div className="mx-4 mt-3 rounded-lg border border-oro/50 bg-oro/10 p-2 text-[11px] text-oro">
            <p className="font-semibold mb-1">🔮 Solo vos ves esto (Torre del Oráculo):</p>
            {contenidoOraculo.map((c) => (
              <p key={c.clave}>
                <strong>{c.clave}:</strong> {c.icono} {c.nombre} — {c.texto}
              </p>
            ))}
            <p className="mt-1 italic text-crema/60">Podés decirle la verdad a los demás… o mentirles.</p>
          </div>
        )}

        <div className="p-4 grid grid-cols-3 gap-2">
          {["A", "B", "C"].map((clave) => {
            const ganadora = votacionRevelada?.ganadora === clave;
            const perdedora = votacionRevelada && !ganadora;
            const profeciaGanadora = ganadora ? votacionRevelada.profecia : null;
            return (
              <button
                key={clave}
                onClick={() => votar(clave)}
                disabled={Boolean(miVoto) || Boolean(votacionRevelada)}
                className={`aspect-[3/4] rounded-lg border-2 flex flex-col items-center justify-center gap-1 p-1 text-center transition-all ${
                  miVoto === clave ? "border-oro bg-oro/15" : "border-white/15"
                } ${ganadora ? "border-oro bg-oro/20 scale-105" : ""} ${perdedora ? "opacity-40" : ""} ${
                  !miVoto && !votacionRevelada ? "active:scale-95" : ""
                }`}
              >
                <span className="text-3xl">{profeciaGanadora ? profeciaGanadora.icono : "📜"}</span>
                <span className="font-titulo text-sm">{clave}</span>
                {profeciaGanadora && <span className="text-[10px] text-crema/80">{profeciaGanadora.nombre}</span>}
              </button>
            );
          })}
        </div>

        {votacionActual && !votacionRevelada && (
          <div className="px-4 pb-3">
            <IndicadorSellado jugadores={jugadores} clave="voto" etiqueta="¿Quién ya votó?" />
          </div>
        )}

        {votacionRevelada && (
          <div className="px-4 pb-4 space-y-2">
            <p className="text-sm text-crema/90 text-center">
              {votacionRevelada.profecia.texto} ({votacionRevelada.conteo.A}-{votacionRevelada.conteo.B}-{votacionRevelada.conteo.C})
            </p>
            <div className="space-y-1">
              {votacionRevelada.detalleVotos.map((v) => {
                const j = jugadores.find((x) => x.id === v.jugadorId);
                if (!j) return null;
                return (
                  <div key={v.jugadorId} className="flex items-center justify-between text-xs bg-black/20 rounded px-2 py-1">
                    <span>
                      {j.icono} {j.nombre}
                    </span>
                    <span className="font-mono text-oro">votó {v.voto || "—"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

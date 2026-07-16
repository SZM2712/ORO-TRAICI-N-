import React, { useEffect, useRef, useState } from "react";

// Tipos "de combate": el resultado (éxito/bloqueo) se revela con una breve
// tirada visual antes de mostrarse — el cálculo real ya está hecho en el
// servidor, esto es puro teatro para darle suspenso al momento del tap.
const TIPOS_COMBATE = new Set(["asalto_exitoso", "asalto_bloqueado", "asedio_exitoso", "asedio_desperdiciado"]);
const ICONOS_TIRADA = ["⚔️", "🛡️", "⚔️", "🛡️"];

const ICONO_ACCION = {
  asalto_exitoso: "⚔️",
  asalto_bloqueado: "🛡️",
  asalto_bloqueado_profecia: "🕊️",
  antorcha_desperdiciada: "🔥",
  antorcha_sin_objetivo: "🔥",
  incendio: "🔥",
  asedio_exitoso: "🏰💥",
  asedio_desperdiciado: "🏰🛡️",
  asedio_sin_efecto: "🏰",
  traicion_aliado: "🗡️💔",
  defensa: "🛡️",
  defensa_aliado: "🛡️🤝",
  cosecha: "🌾",
  construccion_exitosa: "🔨",
  construccion_fallida: "💔",
  construccion_invalida: "⚠️",
  envio_oro: "🎁",
  envio_oro_fallido: "💔",
  tesoro_disputado: "🔒💰",
  profecia_piedad_rey: "🎁",
  profecia_peste: "🐀",
  profecia_caravana: "🐫",
  profecia_rayo: "⚡",
  profecia_rayo_sin_efecto: "⚡",
  profecia_impuesto: "💸",
  profecia_traicion: "🐍",
  profecia_rebelion: "🔥👑",
  profecia_rebelion_sin_efecto: "🔥👑",
  alerta_panico: "🚨",
};

const SONIDO_POR_TIPO = {
  asalto_exitoso: "espadas",
  asalto_bloqueado: "espadas",
  asedio_exitoso: "espadas",
  asedio_desperdiciado: "espadas",
  traicion_aliado: "espadas",
  incendio: "fuego",
  cosecha: "moneda",
  profecia_piedad_rey: "moneda",
  profecia_caravana: "moneda",
  tesoro_disputado: "moneda",
};

function actoresDe(ev) {
  switch (ev.tipo) {
    case "asalto_exitoso":
    case "asalto_bloqueado":
    case "asalto_bloqueado_profecia":
    case "antorcha_desperdiciada":
    case "antorcha_sin_objetivo":
    case "incendio":
    case "asedio_exitoso":
    case "asedio_desperdiciado":
    case "asedio_sin_efecto":
    case "traicion_aliado":
    case "defensa_aliado":
    case "envio_oro":
    case "envio_oro_fallido":
      return { a: ev.atacanteId ?? ev.jugadorId, b: ev.objetivoId };
    case "tesoro_disputado":
      return { a: ev.ganadorId, b: ev.perdedorId };
    default:
      return { a: ev.jugadorId ?? null, b: null };
  }
}

const DURACION_TIRADA_MS = 650;
const ESPERA_COMBATE_MS = 1450;
const ESPERA_NORMAL_MS = 1150;

function EscenaEvento({ evento, frase, jugadoresPorId, reproducir }) {
  const esCombate = TIPOS_COMBATE.has(evento?.tipo);
  const [tirando, setTirando] = useState(esCombate);
  const [iconoTirada, setIconoTirada] = useState(ICONOS_TIRADA[0]);

  useEffect(() => {
    if (!esCombate) {
      reproducir(SONIDO_POR_TIPO[evento?.tipo]);
      return;
    }
    setTirando(true);
    let i = 0;
    const intervalo = setInterval(() => {
      i += 1;
      setIconoTirada(ICONOS_TIRADA[i % ICONOS_TIRADA.length]);
    }, 90);
    const fin = setTimeout(() => {
      clearInterval(intervalo);
      setTirando(false);
      reproducir(SONIDO_POR_TIPO[evento?.tipo]);
    }, DURACION_TIRADA_MS);
    return () => {
      clearInterval(intervalo);
      clearTimeout(fin);
    };
  }, [evento]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!evento) return null;
  const { a, b } = actoresDe(evento);
  const jA = a != null ? jugadoresPorId.get(a) : null;
  const jB = b != null ? jugadoresPorId.get(b) : null;
  const iconoCentral = tirando ? iconoTirada : ICONO_ACCION[evento.tipo] || "📜";

  return (
    <div key={evento.tipo + (a ?? "") + (b ?? "")} className="flex flex-col items-center gap-3 py-2 animate-escena-entra">
      <div className="flex items-center justify-center gap-4">
        {jA && (
          <div className="text-3xl w-12 h-12 rounded-full bg-black/30 border border-white/10 flex items-center justify-center">
            {jA.icono}
          </div>
        )}
        <div
          className={`text-2xl ${tirando ? "animate-tension-shake" : "animate-resultado-pop"} ${
            evento.tipo === "incendio" ? "animate-fuego-parpadeo" : ""
          }`}
        >
          {iconoCentral}
        </div>
        {jB && (
          <div className="text-3xl w-12 h-12 rounded-full bg-black/30 border border-white/10 flex items-center justify-center">
            {jB.icono}
          </div>
        )}
      </div>
      {!tirando && <p className="text-sm leading-snug text-center text-crema/90 px-2">{frase}</p>}
    </div>
  );
}

export default function ModalRevelacion({ rondaRevelada, jugadores = [], reproducir = () => {}, onCerrar }) {
  const [paso, setPaso] = useState(0);
  const timerRef = useRef(null);

  const eventos = rondaRevelada?.eventos || [];
  const narracion = rondaRevelada?.narracion || [];
  const jugadoresPorId = new Map(jugadores.map((j) => [j.id, j]));

  useEffect(() => {
    setPaso(0);
  }, [rondaRevelada]);

  useEffect(() => {
    if (!rondaRevelada || paso >= narracion.length) return;
    const esCombate = TIPOS_COMBATE.has(eventos[paso]?.tipo);
    const espera = (esCombate ? DURACION_TIRADA_MS : 0) + (esCombate ? ESPERA_COMBATE_MS : ESPERA_NORMAL_MS);
    timerRef.current = setTimeout(() => setPaso((p) => p + 1), espera);
    return () => clearTimeout(timerRef.current);
  }, [paso, rondaRevelada]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!rondaRevelada) return null;
  const { ronda, profecia } = rondaRevelada;
  const terminado = paso >= narracion.length;

  return (
    <div className="fixed inset-0 z-40 bg-black/80 flex items-end sm:items-center justify-center p-3">
      <div className="w-full max-w-[440px] bg-panel rounded-2xl border-2 border-oro/40 sombra-panel animate-carta-voltea max-h-[85vh] flex flex-col">
        <div className="px-4 pt-4 pb-2 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="font-titulo text-oro text-lg">Ronda {ronda} revelada</h2>
            {!terminado && narracion.length > 1 && (
              <button
                onClick={() => {
                  clearTimeout(timerRef.current);
                  setPaso(narracion.length);
                }}
                className="text-[10px] text-crema/40 font-mono underline shrink-0"
              >
                Saltar todo ⏭
              </button>
            )}
          </div>
          {profecia && (
            <p className="text-xs text-crema/70 mt-1">
              {profecia.icono} <span className="font-semibold">{profecia.nombre}</span> — {profecia.texto}
            </p>
          )}
          {narracion.length > 1 && (
            <div className="flex items-center gap-1 pt-2">
              {narracion.map((_, i) => (
                <span key={i} className={`h-1 flex-1 rounded-full ${i <= paso ? "bg-oro" : "bg-white/10"}`} />
              ))}
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 min-h-[120px] flex flex-col justify-center">
          {narracion.length === 0 && <p className="text-crema/50 text-sm text-center">Una ronda tranquila…</p>}
          {narracion.length > 0 && !terminado && (
            <EscenaEvento evento={eventos[paso]} frase={narracion[paso]} jugadoresPorId={jugadoresPorId} reproducir={reproducir} />
          )}
          {narracion.length > 0 && terminado && (
            <div className="space-y-1.5" onClick={() => clearTimeout(timerRef.current)}>
              {narracion.map((frase, i) => (
                <p key={i} className="text-xs leading-snug text-crema/70">
                  {frase}
                </p>
              ))}
            </div>
          )}
        </div>
        <div className="p-3 border-t border-white/10">
          {terminado ? (
            <button
              onClick={onCerrar}
              className="w-full rounded-xl py-2.5 border-2 border-acero text-acero font-titulo tracking-wide active:scale-95"
            >
              Continuar
            </button>
          ) : (
            <button
              onClick={() => {
                clearTimeout(timerRef.current);
                setPaso((p) => p + 1);
              }}
              className="w-full rounded-xl py-2.5 border-2 border-white/15 text-crema/50 font-titulo tracking-wide active:scale-95 text-sm"
            >
              Siguiente ›
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

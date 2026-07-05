import React from "react";
import { costoConDescuento, NOMBRES_ITEM, MAX_GRANJAS } from "../utils/format.js";

const ITEMS_CONSTRUCCION = ["granja", "muralla", "oraculo", "castillo"];

export default function PanelAcciones({ miJugador, profeciaActiva, borrador, setBorrador, onSellar, sellado, enviando }) {
  if (!miJugador) return null;

  const elegirTipo = (tipo) => {
    if (sellado) return;
    setBorrador((b) => (b.tipo === tipo ? { tipo: null } : { tipo }));
  };

  const elegirItem = (item) => {
    if (sellado) return;
    setBorrador((b) => ({ ...b, tipo: "construir", item }));
  };

  const alternarAntorcha = () => {
    if (sellado || miJugador.antorchaUsada) return;
    setBorrador((b) => ({ ...b, antorcha: !b.antorcha }));
  };

  const listo =
    borrador.tipo === "cosechar" ||
    borrador.tipo === "defender" ||
    (borrador.tipo === "construir" && borrador.item) ||
    (borrador.tipo === "asaltar" && borrador.objetivoId);

  const botones = [
    { tipo: "cosechar", etiqueta: "Cosechar", icono: "🌾" },
    { tipo: "construir", etiqueta: "Construir", icono: "🔨" },
    { tipo: "asaltar", etiqueta: "Asaltar", icono: "⚔️" },
    { tipo: "defender", etiqueta: "Defender", icono: "🛡️" },
  ];

  return (
    <div className="bg-panel/80 rounded-xl p-3 border border-white/10 sombra-panel">
      <div className="grid grid-cols-4 gap-2">
        {botones.map((b) => (
          <button
            key={b.tipo}
            onClick={() => elegirTipo(b.tipo)}
            disabled={sellado}
            className={`flex flex-col items-center justify-center gap-1 rounded-lg py-3 text-xs font-texto border-2 transition-all ${
              borrador.tipo === b.tipo ? "border-oro bg-oro/15 text-oro" : "border-white/10 text-crema/80"
            } ${sellado ? "opacity-50" : "active:scale-95"}`}
          >
            <span className="text-xl">{b.icono}</span>
            {b.etiqueta}
          </button>
        ))}
      </div>

      {borrador.tipo === "construir" && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {ITEMS_CONSTRUCCION.map((item) => {
            const costo = costoConDescuento(item, miJugador, profeciaActiva);
            const deshabilitado = costo == null || sellado;
            return (
              <button
                key={item}
                onClick={() => !deshabilitado && elegirItem(item)}
                disabled={deshabilitado}
                className={`rounded-lg px-2 py-2 text-xs border-2 text-left ${
                  borrador.item === item ? "border-oro bg-oro/15" : "border-white/10"
                } ${deshabilitado ? "opacity-30" : "active:scale-95"}`}
              >
                <div className="font-semibold">{NOMBRES_ITEM[item]}</div>
                <div className="font-mono text-oro text-[11px]">
                  {costo == null ? "no disponible" : `${costo} de oro`}
                  {item === "granja" && ` (${miJugador.granjas}/${MAX_GRANJAS})`}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {borrador.tipo === "asaltar" && (
        <div className="mt-3 text-xs text-crema/80 space-y-2">
          <p>👆 Tocá una aldea rival para elegir tu objetivo.</p>
          {borrador.objetivoId && <p className="text-oro">Objetivo elegido: #{borrador.objetivoId}</p>}
          <label className={`flex items-center gap-2 ${miJugador.antorchaUsada ? "opacity-40" : ""}`}>
            <input
              type="checkbox"
              checked={Boolean(borrador.antorcha)}
              disabled={miJugador.antorchaUsada || sellado}
              onChange={alternarAntorcha}
            />
            <span>🔥 Usar la antorcha (una sola vez por partida){miJugador.antorchaUsada ? " — ya la usaste" : ""}</span>
          </label>
        </div>
      )}

      <button
        onClick={onSellar}
        disabled={!listo || sellado || enviando}
        className={`mt-4 w-full rounded-xl py-3 font-titulo text-lg tracking-wide border-2 transition-all ${
          sellado ? "border-acero bg-acero/20 text-acero" : "border-oro bg-oro text-[#241017]"
        } ${!listo || sellado || enviando ? "opacity-50" : "active:scale-95"}`}
      >
        {sellado ? "Jugada sellada 🔒" : "Sellar jugada 🔒"}
      </button>
    </div>
  );
}

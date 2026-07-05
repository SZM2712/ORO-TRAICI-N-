import React from "react";
import Aldea from "./Aldea.jsx";
import { ETAPA_AMBICION } from "../utils/format.js";

export default function FichaAldea({
  jugador,
  esYo,
  esAliado,
  tesoro = 0,
  propuestaEnviada,
  puedeProponer,
  puedeRomper,
  onProponer,
  onRomper,
}) {
  if (!jugador) return null;
  const esAmbicioso = jugador.castillo >= ETAPA_AMBICION;

  return (
    <section className={`bg-panel/60 rounded-xl p-3 border ${esAmbicioso ? "border-oro/60" : "border-white/10"}`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-titulo text-crema/80">
          {jugador.icono} {esYo ? "Tu aldea" : jugador.nombre}
          {jugador.esBot && <span className="ml-1 text-[9px] text-crema/40">🤖 cpu</span>}
        </p>
        {esAliado && <span className="text-[9px] bg-acero text-[#0c1620] px-1.5 py-0.5 rounded font-semibold">🤝 aliado</span>}
      </div>
      <Aldea granjas={jugador.granjas} quemadas={jugador.granjasQuemadas} muralla={jugador.muralla} castillo={jugador.castillo} />
      <div className="flex items-center justify-around mt-2 text-sm font-mono text-oro">
        <span>💰 {jugador.oro}</span>
        <span>🌾 {jugador.granjas}</span>
        <span>🏰 {jugador.castillo}/3</span>
        {jugador.muralla && <span>🧱</span>}
        {jugador.torreOraculo && <span>🔮</span>}
      </div>
      {esAmbicioso && (
        <p className="text-[10px] text-oro text-center mt-1">
          👑 {esYo ? "Asaltás con el doble de botín — pero todos van a ir por vos." : "Asalta con el doble de botín."}
        </p>
      )}
      {tesoro > 0 && (
        <p className="text-[10px] text-oro text-center mt-1" title="Tesoro secreto de la alianza, solo lo ves vos">
          🔒💰 Tesoro secreto en común: {tesoro} de oro
        </p>
      )}
      {!esYo && puedeProponer && (
        <button
          onClick={() => onProponer(jugador.id)}
          disabled={propuestaEnviada}
          className="mt-2 w-full text-[11px] rounded-lg py-1.5 border border-acero/50 text-acero disabled:opacity-40 disabled:text-crema/40 active:scale-95"
        >
          {propuestaEnviada ? "Propuesta enviada…" : "🤝 Proponer alianza"}
        </button>
      )}
      {!esYo && puedeRomper && (
        <button
          onClick={() => onRomper(jugador.id)}
          className="mt-2 w-full text-[11px] rounded-lg py-1.5 border border-sangre/50 text-sangre active:scale-95"
        >
          💔 Romper alianza
        </button>
      )}
    </section>
  );
}

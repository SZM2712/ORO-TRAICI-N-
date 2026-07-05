import React, { useEffect, useState } from "react";

const OPCIONES = [
  { valor: "piedra", icono: "🪨" },
  { valor: "papel", icono: "📄" },
  { valor: "tijera", icono: "✂️" },
];

const ICONOS = { piedra: "🪨", papel: "📄", tijera: "✂️" };

export default function ModalDueloTesoro({ dueloTesoro, dueloResultado, jugadores = [], onElegir }) {
  const [elegido, setElegido] = useState(null);

  useEffect(() => {
    setElegido(null);
  }, [dueloTesoro]);

  if (!dueloTesoro && !dueloResultado) return null;

  const rival = jugadores.find((j) => j.id === (dueloTesoro?.conId ?? dueloResultado?.rivalId));

  const elegir = (valor) => {
    if (elegido) return;
    setElegido(valor);
    onElegir(valor);
  };

  if (dueloResultado) {
    const { gane, premio, impuesto, miEleccion, rivalEleccion } = dueloResultado;
    return (
      <div className="fixed inset-0 z-[70] bg-black/85 flex items-center justify-center p-3">
        <div className="w-full max-w-[360px] bg-panel rounded-2xl border-2 border-oro/50 sombra-panel p-5 text-center space-y-3">
          <p className="text-5xl">{gane ? "🏆" : "💀"}</p>
          <p className="font-titulo text-lg text-oro">{gane ? "¡Ganaste el duelo!" : "Perdiste el duelo"}</p>
          <div className="flex items-center justify-center gap-4 text-3xl">
            <span>{ICONOS[miEleccion]}</span>
            <span className="text-crema/40 text-sm">vs</span>
            <span>{ICONOS[rivalEleccion]}</span>
          </div>
          <p className="text-sm text-crema/80">
            {gane
              ? `Te llevaste ${premio} de oro del tesoro secreto.`
              : `${rival?.nombre || "Tu ex aliado"} se llevó ${premio} de oro del tesoro secreto.`}
          </p>
          <p className="text-xs text-crema/50">👑 {impuesto} de oro fueron a la corona como impuesto.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/85 flex items-center justify-center p-3">
      <div className="w-full max-w-[360px] bg-panel rounded-2xl border-2 border-sangre/60 sombra-panel p-5 text-center space-y-4">
        <p className="text-4xl">🗡️</p>
        <p className="text-crema/90">
          Duelo por el tesoro secreto con{" "}
          <span className="font-semibold text-acero">
            {rival?.icono} {rival?.nombre || "tu ex aliado"}
          </span>
          : <span className="text-oro font-semibold">{dueloTesoro.monto} de oro</span> en juego.
        </p>
        <p className="text-xs text-crema/50">Piedra, papel o tijera. Quien gane se lo lleva (menos el impuesto de la corona).</p>
        {elegido ? (
          <p className="text-sm text-crema/70">Elegiste {ICONOS[elegido]}. Esperando al rival…</p>
        ) : (
          <div className="grid grid-cols-3 gap-3 pt-1">
            {OPCIONES.map((op) => (
              <button
                key={op.valor}
                onClick={() => elegir(op.valor)}
                className="rounded-xl py-3 text-3xl border-2 border-acero/50 active:scale-95"
              >
                {op.icono}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

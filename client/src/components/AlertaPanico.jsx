import React, { useEffect, useState } from "react";

export default function AlertaPanico({ jugador }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 4500);
    return () => clearTimeout(t);
  }, [jugador?.id]);

  if (!jugador || !visible) return null;

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-[440px]">
      <div className="bg-sangre text-crema rounded-xl px-4 py-2.5 text-center font-texto font-bold text-sm animate-panico-pulso border-2 border-crema/40">
        🚨 ¡Un castillo va por la etapa 2! ({jugador.icono} {jugador.nombre})
      </div>
    </div>
  );
}

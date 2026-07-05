import React from "react";

export default function MonedaOro({ children, size = 96, girando = false, className = "" }) {
  return (
    <div
      className={`rounded-full flex items-center justify-center border-4 border-crema/40 shadow-lg ${
        girando ? "animate-moneda-giro" : ""
      } ${className}`}
      style={{
        width: size,
        height: size,
        background: "radial-gradient(circle at 35% 30%, #f6d98a, #E3B34C 55%, #a97e2c 100%)",
        color: "#3a2a10",
      }}
    >
      <div className="font-titulo font-bold text-center leading-none">{children}</div>
    </div>
  );
}

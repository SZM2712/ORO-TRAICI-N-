// Copias de las constantes del servidor solo para mostrar costos estimados en
// la UI. La validación real y definitiva de oro/legalidad vive en el servidor.
export const COSTOS_BASE = { granja: 3, muralla: 5, oraculo: 4, castillo: [7, 9, 11] };
export const MAX_GRANJAS = 4;
export const ETAPA_AMBICION = 2;

export const NOMBRES_ITEM = {
  granja: "Granja 🌾",
  muralla: "Muralla 🧱",
  oraculo: "Torre del Oráculo 🔮",
  castillo: "Castillo 🏰",
};

export function costoItem(item, jugador) {
  if (item === "granja") return jugador.granjas < MAX_GRANJAS ? COSTOS_BASE.granja : null;
  if (item === "muralla") return jugador.muralla ? null : COSTOS_BASE.muralla;
  if (item === "oraculo") return jugador.torreOraculo ? null : COSTOS_BASE.oraculo;
  if (item === "castillo") return jugador.castillo < 3 ? COSTOS_BASE.castillo[jugador.castillo] : null;
  return null;
}

export function costoConDescuento(item, jugador, profeciaActiva) {
  const base = costoItem(item, jugador);
  if (base == null) return null;
  const descuento = profeciaActiva?.id === "gremio_constructores" ? 2 : 0;
  return Math.max(1, base - descuento);
}

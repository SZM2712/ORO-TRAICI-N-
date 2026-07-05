import { costoDeItem } from "./GameEngine.js";

export const NOMBRES_BOTS = ["Centinela", "Bárbaro", "Mercader", "Templario", "Cuervo", "Forjador", "Nómade"];

// IA simple y determinista por probabilidades: prioriza terminar el castillo,
// después fortificarse/crecer, y de vez en cuando asalta o defiende. Nunca
// devuelve una jugada inválida (todo pasa igual por Room.validarAccion()).
export function decidirAccionBot(jugador, jugadores, rng = Math.random) {
  const rivales = jugadores.filter((j) => j.id !== jugador.id);

  const costoCastillo = costoDeItem(jugador, "castillo");
  if (costoCastillo != null && jugador.oro >= costoCastillo && rng() < 0.7) {
    return { tipo: "construir", item: "castillo" };
  }

  const costoMuralla = costoDeItem(jugador, "muralla");
  if (costoMuralla != null && jugador.oro >= costoMuralla && rng() < 0.3) {
    return { tipo: "construir", item: "muralla" };
  }

  const costoGranja = costoDeItem(jugador, "granja");
  if (costoGranja != null && jugador.oro >= costoGranja && rng() < 0.35) {
    return { tipo: "construir", item: "granja" };
  }

  const costoOraculo = costoDeItem(jugador, "oraculo");
  if (costoOraculo != null && jugador.oro >= costoOraculo && rng() < 0.15) {
    return { tipo: "construir", item: "oraculo" };
  }

  const objetivosConOro = rivales.filter((r) => r.oro > 0);
  if (objetivosConOro.length > 0 && rng() < 0.25) {
    const objetivo = objetivosConOro[Math.floor(rng() * objetivosConOro.length)];
    const antorcha = !jugador.antorchaUsada && rng() < 0.2;
    return { tipo: "asaltar", objetivoId: objetivo.id, antorcha };
  }

  if (rng() < 0.15) return { tipo: "defender" };

  return { tipo: "cosechar" };
}

export function decidirVotoBot(rng = Math.random) {
  const opciones = ["A", "B", "C"];
  return opciones[Math.floor(rng() * opciones.length)];
}

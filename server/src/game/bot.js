import { costoDeItem } from "./GameEngine.js";
import { ETAPA_AMBICION } from "../config.js";

export const NOMBRES_BOTS = ["Centinela", "Bárbaro", "Mercader", "Templario", "Cuervo", "Forjador", "Nómade"];

// IA simple y determinista por probabilidades: prioriza terminar el castillo,
// después fortificarse/crecer, y de vez en cuando asalta o defiende. Nunca
// devuelve una jugada inválida (todo pasa igual por Room.validarAccion()).
// `aliadosIds` son los rivales con alianza activa: el bot prefiere no
// asaltarlos, pero de vez en cuando la traición es demasiado tentadora.
export function decidirAccionBot(jugador, jugadores, aliadosIds = new Set(), rng = Math.random) {
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

  // De vez en cuando ayuda económicamente a un aliado, priorizando al que
  // tenga menos oro que él.
  if (aliadosIds.size > 0 && jugador.oro > 4 && rng() < 0.12) {
    const aliados = jugadores.filter((j) => aliadosIds.has(j.id));
    const necesitados = aliados.filter((a) => a.oro < jugador.oro);
    const pool = necesitados.length > 0 ? necesitados : aliados;
    const receptor = pool[Math.floor(rng() * pool.length)];
    const cantidad = Math.min(3, jugador.oro - 1);
    if (cantidad > 0) return { tipo: "enviar_oro", objetivoId: receptor.id, cantidad };
  }

  const objetivosConOro = rivales.filter((r) => r.oro > 0);
  const objetivosSinAlianza = objetivosConOro.filter((r) => !aliadosIds.has(r.id));
  const hayAlternativaLeal = objetivosSinAlianza.length > 0;
  const candidatosAsalto = hayAlternativaLeal ? objetivosSinAlianza : objetivosConOro;
  const probabilidadAsalto = hayAlternativaLeal ? 0.25 : 0.08; // traicionar a un aliado cuesta más

  if (candidatosAsalto.length > 0 && rng() < probabilidadAsalto) {
    // Si hay alguien con la corona (etapa 2+), el resto tiende a ir contra
    // él primero: es quien más botín rinde y el mayor riesgo de que gane.
    const amenazas = candidatosAsalto.filter((r) => r.castillo >= ETAPA_AMBICION);
    const pool = amenazas.length > 0 && rng() < 0.7 ? amenazas : candidatosAsalto;
    const objetivo = pool[Math.floor(rng() * pool.length)];
    const antorcha = !jugador.antorchaUsada && rng() < 0.2;
    const asedio = !jugador.asedioUsado && objetivo.castillo >= ETAPA_AMBICION && rng() < 0.5;
    return { tipo: "asaltar", objetivoId: objetivo.id, antorcha, asedio };
  }

  if (rng() < 0.15) return { tipo: "defender" };

  return { tipo: "cosechar" };
}

export function decidirVotoBot(rng = Math.random) {
  const opciones = ["A", "B", "C"];
  return opciones[Math.floor(rng() * opciones.length)];
}

// El bot acepta una propuesta de alianza la mayoría de las veces: le conviene
// tener las espaldas cubiertas, aunque después pueda traicionar.
export function decidirRespuestaAlianzaBot(rng = Math.random) {
  return rng() < 0.65;
}

// Con baja probabilidad, el bot propone alianza a un rival al azar entre los
// candidatos que le pasen (ya excluyen a quienes ya son aliados o tienen una
// propuesta pendiente). Devuelve el id elegido o null si no propone nada.
export function decidirPropuestaAlianzaBot(candidatosIds, rng = Math.random) {
  if (candidatosIds.length === 0 || rng() > 0.2) return null;
  return candidatosIds[Math.floor(rng() * candidatosIds.length)];
}

import {
  COSECHA_BASE,
  COSECHA_POR_GRANJA,
  COSTO_GRANJA,
  MAX_GRANJAS,
  COSTO_MURALLA,
  COSTO_ORACULO,
  COSTOS_CASTILLO,
  ROBO_NORMAL,
  ROBO_CON_MURALLA,
  TRIBUTO_BLOQUEO,
  BONUS_DEFENDER,
  LIMITE_RONDAS,
} from "../config.js";
import { MAZO_PROFECIAS } from "./prophecies.js";
import { puntaje } from "./state.js";
import { elegirAlAzar, tomarN } from "../utils/random.js";

// ---------------------------------------------------------------------------
// Validación de costo/legalidad de una construcción (usada tanto al validar
// la intención del jugador como al resolver la ronda).
// ---------------------------------------------------------------------------
export function costoDeItem(jugador, item) {
  switch (item) {
    case "granja":
      return jugador.granjas < MAX_GRANJAS ? COSTO_GRANJA : null;
    case "muralla":
      return !jugador.muralla ? COSTO_MURALLA : null;
    case "oraculo":
      return !jugador.torreOraculo ? COSTO_ORACULO : null;
    case "castillo":
      return jugador.castillo < 3 ? COSTOS_CASTILLO[jugador.castillo] : null;
    default:
      return null;
  }
}

function aplicarConstruccion(jugador, item) {
  switch (item) {
    case "granja":
      jugador.granjas += 1;
      break;
    case "muralla":
      jugador.muralla = true;
      break;
    case "oraculo":
      jugador.torreOraculo = true;
      break;
    case "castillo":
      jugador.castillo += 1;
      break;
  }
}

function intentarConstruir(jugador, item, descuento, eventos) {
  const costoBase = costoDeItem(jugador, item);
  if (costoBase == null) {
    eventos.push({ tipo: "construccion_invalida", jugadorId: jugador.id, item });
    return;
  }
  const costo = Math.max(1, costoBase - descuento);
  if (jugador.oro < costo) {
    eventos.push({ tipo: "construccion_fallida", jugadorId: jugador.id, item, costo, oroDisponible: jugador.oro });
    return;
  }
  jugador.oro -= costo;
  aplicarConstruccion(jugador, item);
  eventos.push({ tipo: "construccion_exitosa", jugadorId: jugador.id, item, costo, nuevaEtapaCastillo: jugador.castillo });
}

// ---------------------------------------------------------------------------
// Desempates (más rico / más pobre / líder): se aplican en cascada y, si
// persiste el empate, se resuelve al azar del servidor — nunca en el cliente.
// ---------------------------------------------------------------------------
function extremoConDesempate(jugadores, claves, rng) {
  let candidatos = [...jugadores];
  for (const clave of claves) {
    const valores = candidatos.map(clave);
    const extremo = clave.max ? Math.max(...valores) : Math.min(...valores);
    candidatos = candidatos.filter((j) => clave(j) === extremo);
    if (candidatos.length === 1) return candidatos[0];
  }
  return elegirAlAzar(candidatos, rng);
}

function claveMax(fn) {
  fn.max = true;
  return fn;
}
function claveMin(fn) {
  fn.max = false;
  return fn;
}

export function determinarLider(jugadores, rng = Math.random) {
  return extremoConDesempate(jugadores, [claveMax((j) => j.castillo), claveMax((j) => j.oro)], rng);
}
export function determinarMasRico(jugadores, rng = Math.random) {
  return extremoConDesempate(jugadores, [claveMax((j) => j.oro)], rng);
}
export function determinarMasPobre(jugadores, rng = Math.random) {
  return extremoConDesempate(jugadores, [claveMin((j) => j.oro)], rng);
}

// ---------------------------------------------------------------------------
// Profecías: selección de pergaminos, votación y efectos.
// ---------------------------------------------------------------------------
export function elegirTresProfecias(idsUsados, rng = Math.random) {
  const disponibles = MAZO_PROFECIAS.filter((p) => !idsUsados.includes(p.id));
  const elegidas = tomarN(disponibles, 3, rng);
  const claves = ["A", "B", "C"];
  return claves.map((clave, i) => ({ clave, profecia: elegidas[i] }));
}

export function resolverVotos(votos, rng = Math.random) {
  const conteo = { A: 0, B: 0, C: 0 };
  for (const v of Object.values(votos)) {
    if (conteo[v] !== undefined) conteo[v]++;
  }
  const maxVotos = Math.max(conteo.A, conteo.B, conteo.C);
  const empatadas = ["A", "B", "C"].filter((k) => conteo[k] === maxVotos && maxVotos > 0);
  let ganadora;
  if (empatadas.length === 0) {
    ganadora = elegirAlAzar(["A", "B", "C"], rng);
  } else if (empatadas.length === 1) {
    [ganadora] = empatadas;
  } else {
    ganadora = elegirAlAzar(empatadas, rng);
  }
  return { ganadora, conteo };
}

// Aplica el efecto de la profecía ganadora. Para "piedad_rey", "peste_tesoreria",
// "caravana_perdida", "rayo_cielo" e "impuesto_guerra" el efecto es inmediato
// (ocurre al iniciar la ronda, antes de que se elijan las acciones). Para
// "cosecha_dorada", "gremio_constructores" y "tregua_sagrada" el efecto es un
// modificador que usa resolverRonda(). "traicion_corte" no cambia oro/granjas
// aquí, pero fija al líder ahora mismo para que la resolución lo use después.
export function aplicarEfectoProfecia(jugadores, profeciaId, rng = Math.random) {
  const eventos = [];
  let leaderId = null;
  switch (profeciaId) {
    case "piedad_rey": {
      const pobre = determinarMasPobre(jugadores, rng);
      pobre.oro += 4;
      eventos.push({ tipo: "profecia_piedad_rey", jugadorId: pobre.id, cantidad: 4 });
      break;
    }
    case "peste_tesoreria": {
      const rico = determinarMasRico(jugadores, rng);
      const pago = Math.min(3, rico.oro);
      rico.oro -= pago;
      eventos.push({ tipo: "profecia_peste", jugadorId: rico.id, cantidad: pago });
      break;
    }
    case "caravana_perdida": {
      const elegido = elegirAlAzar(jugadores, rng);
      elegido.oro += 5;
      eventos.push({ tipo: "profecia_caravana", jugadorId: elegido.id, cantidad: 5 });
      break;
    }
    case "rayo_cielo": {
      const candidatos = jugadores.filter((j) => j.granjas >= 2);
      if (candidatos.length === 0) {
        eventos.push({ tipo: "profecia_rayo_sin_efecto" });
      } else {
        const objetivo = elegirAlAzar(candidatos, rng);
        objetivo.granjas -= 1;
        objetivo.granjasQuemadas += 1;
        eventos.push({ tipo: "profecia_rayo", jugadorId: objetivo.id });
      }
      break;
    }
    case "impuesto_guerra": {
      for (const j of jugadores) {
        const pago = Math.min(2, j.oro);
        j.oro -= pago;
        eventos.push({ tipo: "profecia_impuesto", jugadorId: j.id, cantidad: pago });
      }
      break;
    }
    case "traicion_corte": {
      const lider = determinarLider(jugadores, rng);
      leaderId = lider.id;
      eventos.push({ tipo: "profecia_traicion", jugadorId: lider.id });
      break;
    }
    default:
      break; // cosecha_dorada / gremio_constructores / tregua_sagrada: solo modifican resolverRonda
  }
  return { eventos, leaderId };
}

// ---------------------------------------------------------------------------
// Resolución de ronda: orden determinista fijo
//   1) fijar defensores  2) asaltos/incendios  3) construcciones
//   4) cosechas          5) +1 al defensor
// `profeciaActiva` es null o { id, leaderId } (leaderId solo si id === 'traicion_corte').
// ---------------------------------------------------------------------------
export function resolverRonda(jugadores, acciones, profeciaActiva = null) {
  const eventos = [];
  const porId = new Map(jugadores.map((j) => [j.id, j]));
  const obtenerAccion = (id) => acciones[id] || { tipo: "cosechar" };
  const orden = [...jugadores].sort((a, b) => a.id - b.id);

  const cosechaX2 = profeciaActiva?.id === "cosecha_dorada";
  const cosechaMitad = profeciaActiva?.id === "tormenta_negra";
  const descuentoConstruccion = profeciaActiva?.id === "gremio_constructores" ? 2 : 0;
  const asaltosFallan = profeciaActiva?.id === "tregua_sagrada";
  const liderSinBloqueo = profeciaActiva?.id === "traicion_corte" ? profeciaActiva.leaderId : null;

  // 1) Fijar defensores
  const defensores = new Set();
  for (const j of orden) {
    if (obtenerAccion(j.id).tipo === "defender") defensores.add(j.id);
  }
  const bloqueaEfectivamente = (id) => defensores.has(id) && id !== liderSinBloqueo;

  // 2) Asaltos e incendios (orden por id de atacante)
  for (const atacante of orden) {
    const acc = obtenerAccion(atacante.id);
    if (acc.tipo !== "asaltar") continue;
    const objetivo = porId.get(acc.objetivoId);
    if (!objetivo || objetivo.id === atacante.id) continue;

    if (asaltosFallan) {
      eventos.push({ tipo: "asalto_bloqueado_profecia", atacanteId: atacante.id, objetivoId: objetivo.id });
      continue;
    }

    if (bloqueaEfectivamente(objetivo.id)) {
      const tributo = Math.min(TRIBUTO_BLOQUEO, atacante.oro);
      atacante.oro -= tributo;
      objetivo.oro += tributo;
      eventos.push({ tipo: "asalto_bloqueado", atacanteId: atacante.id, objetivoId: objetivo.id, tributo });
      if (acc.antorcha) {
        atacante.antorchaUsada = true;
        eventos.push({ tipo: "antorcha_desperdiciada", atacanteId: atacante.id, objetivoId: objetivo.id });
      }
    } else {
      const robo = Math.min(objetivo.muralla ? ROBO_CON_MURALLA : ROBO_NORMAL, objetivo.oro);
      atacante.oro += robo;
      objetivo.oro -= robo;
      eventos.push({
        tipo: "asalto_exitoso",
        atacanteId: atacante.id,
        objetivoId: objetivo.id,
        robo,
        muralla: objetivo.muralla,
      });
      if (acc.antorcha) {
        atacante.antorchaUsada = true;
        if (objetivo.granjas > 0) {
          objetivo.granjas -= 1;
          objetivo.granjasQuemadas += 1;
          eventos.push({ tipo: "incendio", atacanteId: atacante.id, objetivoId: objetivo.id });
        } else {
          eventos.push({ tipo: "antorcha_sin_objetivo", atacanteId: atacante.id, objetivoId: objetivo.id });
        }
      }
    }
  }

  // 3) Construcciones (validar oro DESPUÉS de robos)
  for (const j of orden) {
    const acc = obtenerAccion(j.id);
    if (acc.tipo !== "construir") continue;
    intentarConstruir(j, acc.item, descuentoConstruccion, eventos);
  }

  // 4) Cosechas
  for (const j of orden) {
    const acc = obtenerAccion(j.id);
    if (acc.tipo !== "cosechar") continue;
    let cantidad = COSECHA_BASE + COSECHA_POR_GRANJA * j.granjas;
    if (cosechaX2) cantidad *= 2;
    else if (cosechaMitad) cantidad = Math.floor(cantidad / 2);
    j.oro += cantidad;
    eventos.push({ tipo: "cosecha", jugadorId: j.id, cantidad });
  }

  // 5) +1 al defensor
  for (const id of defensores) {
    const j = porId.get(id);
    j.oro += BONUS_DEFENDER;
    eventos.push({ tipo: "defensa", jugadorId: id, liderSinBloqueo: id === liderSinBloqueo });
  }

  return { eventos };
}

// ---------------------------------------------------------------------------
// Condición de victoria
// ---------------------------------------------------------------------------
export function revisarFinPartida(jugadores, ronda) {
  const terminadores = jugadores.filter((j) => j.castillo === 3);
  if (terminadores.length > 0) {
    const maxOro = Math.max(...terminadores.map((j) => j.oro));
    const empatados = terminadores.filter((j) => j.oro === maxOro);
    if (empatados.length === 1) {
      return { terminada: true, ganadorId: empatados[0].id, sueteMuerte: false };
    }
    return { terminada: false, sueteMuerte: true };
  }
  if (ronda >= LIMITE_RONDAS) {
    const puntajes = jugadores.map((j) => ({ id: j.id, score: puntaje(j) }));
    const maxScore = Math.max(...puntajes.map((p) => p.score));
    const empatados = puntajes.filter((p) => p.score === maxScore);
    if (empatados.length === 1) {
      return { terminada: true, ganadorId: empatados[0].id, sueteMuerte: false };
    }
    return { terminada: false, sueteMuerte: true };
  }
  return { terminada: false, sueteMuerte: false };
}

export function armarPodio(jugadores) {
  return [...jugadores]
    .sort((a, b) => puntaje(b) - puntaje(a))
    .map((j) => ({ id: j.id, nombre: j.nombre, icono: j.icono, castillo: j.castillo, oro: j.oro, puntaje: puntaje(j) }));
}

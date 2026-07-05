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
  ETAPA_AMBICION,
  MULTIPLICADOR_AMBICION,
  MULTIPLICADOR_PINZA,
  BONUS_DEFENSA_CONJUNTA,
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
    case "rebelion_popular": {
      const lider = determinarLider(jugadores, rng);
      if (lider.castillo > 0) {
        lider.castillo -= 1;
        eventos.push({ tipo: "profecia_rebelion", jugadorId: lider.id, etapaNueva: lider.castillo });
      } else {
        eventos.push({ tipo: "profecia_rebelion_sin_efecto" });
      }
      break;
    }
    default:
      break; // cosecha_dorada / gremio_constructores / tregua_sagrada: solo modifican resolverRonda
  }
  return { eventos, leaderId };
}

// ---------------------------------------------------------------------------
// Alianzas: pares [idA, idB] canónicos (idA < idB) guardados en el estado de
// la sala. Formarlas es instantáneo (fuera del ciclo de rondas); romperlas
// por traición se detecta acá, de forma pura, a partir de las acciones ya
// selladas de la ronda.
// ---------------------------------------------------------------------------
export function existeAlianza(alianzas, a, b) {
  return alianzas.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

export function agregarAlianza(alianzas, a, b) {
  if (existeAlianza(alianzas, a, b)) return alianzas;
  return [...alianzas, a < b ? [a, b] : [b, a]];
}

export function quitarAlianza(alianzas, a, b) {
  return alianzas.filter(([x, y]) => !((x === a && y === b) || (x === b && y === a)));
}

// Clave estable para identificar el tesoro compartido de un par de aliados,
// sin importar el orden en que se pasen los ids.
export function claveAlianza(a, b) {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

// Minijuego al romper una alianza por traición: piedra, papel o tijera en
// vivo entre los dos ex aliados. Devuelve "a", "b" o "empate".
export function resolverPiedraPapelTijera(eleccionA, eleccionB) {
  if (eleccionA === eleccionB) return "empate";
  const leGanaA = { piedra: "tijera", papel: "piedra", tijera: "papel" };
  return leGanaA[eleccionA] === eleccionB ? "a" : "b";
}

// Un aliado que asalta a su aliado rompe la alianza en el acto: se detecta
// antes de resolver la ronda para poder narrar la traición por separado del
// resultado del asalto en sí.
export function resolverTraiciones(alianzas, acciones) {
  const traiciones = [];
  const alianzasRestantes = [];
  for (const [a, b] of alianzas) {
    const accionA = acciones[a];
    const accionB = acciones[b];
    const aTraiciona = accionA?.tipo === "asaltar" && accionA.objetivoId === b;
    const bTraiciona = accionB?.tipo === "asaltar" && accionB.objetivoId === a;
    if (aTraiciona) traiciones.push({ tipo: "traicion_aliado", atacanteId: a, objetivoId: b });
    if (bTraiciona) traiciones.push({ tipo: "traicion_aliado", atacanteId: b, objetivoId: a });
    if (!aTraiciona && !bTraiciona) alianzasRestantes.push([a, b]);
  }
  return { traiciones, alianzasRestantes };
}

// ---------------------------------------------------------------------------
// Resolución de ronda: orden determinista fijo
//   1) fijar defensores  2) asaltos/incendios  2.5) envíos de oro entre
//   aliados  3) construcciones  4) cosechas  5) bono a quien defendió
// `profeciaActiva` es null o { id, leaderId } (leaderId solo si id === 'traicion_corte').
// `alianzas` son las alianzas vigentes AL CERRAR la ronda (ya sin las que se
// rompieron por traición esta misma ronda, ver resolverTraiciones): habilitan
// el bono de asalto en pinza, el envío de oro y el bono de defensa conjunta.
// `tesoros` es el objeto { claveAlianza: monto } que se muta en el lugar: el
// botín de cada asalto en pinza se acumula ahí en vez de ir al oro visible.
// ---------------------------------------------------------------------------
export function resolverRonda(jugadores, acciones, profeciaActiva = null, alianzas = [], tesoros = {}) {
  const eventos = [];
  const porId = new Map(jugadores.map((j) => [j.id, j]));
  const obtenerAccion = (id) => acciones[id] || { tipo: "cosechar" };
  const orden = [...jugadores].sort((a, b) => a.id - b.id);

  const cosechaX2 = profeciaActiva?.id === "cosecha_dorada";
  const cosechaMitad = profeciaActiva?.id === "tormenta_negra";
  const descuentoConstruccion = profeciaActiva?.id === "gremio_constructores" ? 2 : 0;
  const asaltosFallan = profeciaActiva?.id === "tregua_sagrada";
  const liderSinBloqueo = profeciaActiva?.id === "traicion_corte" ? profeciaActiva.leaderId : null;

  // 1) Fijar defensores. "Defender" protege por defecto a quien lo elige,
  // pero puede apuntar a un aliado en su lugar: lo protege a ÉL, dejando
  // expuesto a quien decidió cubrirlo (protectorDe guarda quién hizo qué).
  const defensores = new Set();
  const protectorDe = new Map(); // protegidoId -> quien ejecutó la acción de defender
  for (const j of orden) {
    const acc = obtenerAccion(j.id);
    if (acc.tipo !== "defender") continue;
    const protegidoId = acc.objetivoId ?? j.id;
    defensores.add(protegidoId);
    protectorDe.set(protegidoId, j.id);
  }
  const bloqueaEfectivamente = (id) => defensores.has(id) && id !== liderSinBloqueo;

  // 2) Asaltos e incendios (orden por id de atacante)
  const asaltantesPorObjetivo = new Map();
  for (const j of orden) {
    const acc = obtenerAccion(j.id);
    if (acc.tipo !== "asaltar") continue;
    const lista = asaltantesPorObjetivo.get(acc.objetivoId) || [];
    lista.push(j.id);
    asaltantesPorObjetivo.set(acc.objetivoId, lista);
  }

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
      if (acc.asedio) {
        atacante.asedioUsado = true;
        eventos.push({ tipo: "asedio_desperdiciado", atacanteId: atacante.id, objetivoId: objetivo.id });
      }
    } else {
      const ambicioso = atacante.castillo >= ETAPA_AMBICION;
      const companeros = (asaltantesPorObjetivo.get(objetivo.id) || []).filter((id) => id !== atacante.id);
      const aliadoEnPinza = companeros.find((id) => existeAlianza(alianzas, atacante.id, id));
      const enPinza = aliadoEnPinza != null;
      const roboBase = objetivo.muralla ? ROBO_CON_MURALLA : ROBO_NORMAL;
      let robo = roboBase;
      if (ambicioso) robo *= MULTIPLICADOR_AMBICION;
      if (enPinza) robo = Math.floor(robo * MULTIPLICADOR_PINZA);
      robo = Math.min(robo, objetivo.oro);
      objetivo.oro -= robo;
      if (enPinza) {
        // El botín en pinza no se ve reflejado en el oro público: se guarda
        // oculto en el tesoro compartido de la alianza.
        const clave = claveAlianza(atacante.id, aliadoEnPinza);
        tesoros[clave] = (tesoros[clave] || 0) + robo;
      } else {
        atacante.oro += robo;
      }
      eventos.push({
        tipo: "asalto_exitoso",
        atacanteId: atacante.id,
        objetivoId: objetivo.id,
        robo,
        muralla: objetivo.muralla,
        ambicioso,
        enPinza,
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
      if (acc.asedio) {
        atacante.asedioUsado = true;
        if (objetivo.castillo > 0) {
          objetivo.castillo -= 1;
          eventos.push({ tipo: "asedio_exitoso", atacanteId: atacante.id, objetivoId: objetivo.id, etapaNueva: objetivo.castillo });
        } else {
          eventos.push({ tipo: "asedio_sin_efecto", atacanteId: atacante.id, objetivoId: objetivo.id });
        }
      }
    }
  }

  // 2.5) Envíos de oro entre aliados (después de robos, con el oro real
  // disponible; antes de construcciones, para que el receptor pueda usarlo)
  for (const j of orden) {
    const acc = obtenerAccion(j.id);
    if (acc.tipo !== "enviar_oro") continue;
    const receptor = porId.get(acc.objetivoId);
    if (!receptor || receptor.id === j.id || !existeAlianza(alianzas, j.id, receptor.id)) {
      eventos.push({ tipo: "envio_oro_fallido", jugadorId: j.id, objetivoId: acc.objetivoId });
      continue;
    }
    const cantidad = Math.max(0, Math.min(Math.floor(acc.cantidad), j.oro));
    if (cantidad <= 0) {
      eventos.push({ tipo: "envio_oro_fallido", jugadorId: j.id, objetivoId: receptor.id });
      continue;
    }
    j.oro -= cantidad;
    receptor.oro += cantidad;
    eventos.push({ tipo: "envio_oro", jugadorId: j.id, objetivoId: receptor.id, cantidad });
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

  // 5) Bono a quien defendió: a sí mismo (+ bono si un aliado también se
  // autodefendió esta ronda) o a un aliado (se lleva el bono normal por
  // cubrirlo, sin sumar el bono de defensa conjunta).
  for (const protegidoId of defensores) {
    const performerId = protectorDe.get(protegidoId);
    const performer = porId.get(performerId);
    const esAutoDefensa = performerId === protegidoId;
    if (esAutoDefensa) {
      const conjunta = [...defensores].some(
        (otroId) => otroId !== protegidoId && protectorDe.get(otroId) === otroId && existeAlianza(alianzas, protegidoId, otroId)
      );
      const bono = BONUS_DEFENDER + (conjunta ? BONUS_DEFENSA_CONJUNTA : 0);
      performer.oro += bono;
      eventos.push({ tipo: "defensa", jugadorId: protegidoId, liderSinBloqueo: protegidoId === liderSinBloqueo, conjunta, bono });
    } else {
      performer.oro += BONUS_DEFENDER;
      eventos.push({
        tipo: "defensa_aliado",
        jugadorId: performerId,
        objetivoId: protegidoId,
        liderSinBloqueo: protegidoId === liderSinBloqueo,
        bono: BONUS_DEFENDER,
      });
    }
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

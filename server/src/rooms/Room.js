import {
  MIN_JUGADORES,
  MAX_JUGADORES,
  RONDAS_PROFECIA,
  TIEMPO_VOTACION_MS,
  ANIMALES,
  ETAPA_AMBICION,
  INTERES_TESORO_ALIANZA,
  PORCENTAJE_TESORO_AL_REY,
  DUELO_ELECCION_TIMEOUT_MS,
} from "../config.js";
import { crearEstadoSala, crearJugador, jugadorPublico } from "../game/state.js";
import {
  elegirTresProfecias,
  resolverVotos,
  aplicarEfectoProfecia,
  resolverRonda,
  revisarFinPartida,
  armarPodio,
  costoDeItem,
  existeAlianza,
  agregarAlianza,
  quitarAlianza,
  claveAlianza,
  resolverTraiciones,
  resolverPiedraPapelTijera,
} from "../game/GameEngine.js";
import { narrarEventos } from "../game/narrativa.js";
import { generarPlayerToken } from "../utils/ids.js";
import {
  NOMBRES_BOTS,
  decidirAccionBot,
  decidirVotoBot,
  decidirRespuestaAlianzaBot,
  decidirPropuestaAlianzaBot,
  decidirEleccionDueloBot,
} from "../game/bot.js";
import { PLANTILLAS_MENSAJE_ALIANZA, PLANTILLA_REQUIERE_OBJETIVO } from "../game/mensajesAlianza.js";

const DEMORA_BOT_MIN_MS = 900;
const DEMORA_BOT_MAX_MS = 3200;

const DELAY_REVELACION_MS = 6500;
const DELAY_VOTACION_REVELADA_MS = 5000;

export class Room {
  constructor(code, io) {
    this.io = io;
    this.estado = crearEstadoSala(code);
    this.timers = {};
    this.timeoutsBots = [];
  }

  get code() {
    return this.estado.code;
  }

  tocarActividad() {
    this.estado.ultimaActividad = Date.now();
  }

  inactiva(msLimite) {
    return Date.now() - this.estado.ultimaActividad > msLimite;
  }

  emitirATodos(evento, payload) {
    this.io.to(this.estado.code).emit(evento, payload);
  }

  limpiarTimer(nombre) {
    if (this.timers[nombre]) {
      clearTimeout(this.timers[nombre]);
      this.timers[nombre] = null;
    }
  }

  destruir() {
    Object.keys(this.timers).forEach((n) => this.limpiarTimer(n));
    this.timeoutsBots.forEach((h) => clearTimeout(h));
    this.timeoutsBots = [];
  }

  jugadorPorId(id) {
    return this.estado.jugadores.find((j) => j.id === id);
  }
  jugadorPorToken(token) {
    return this.estado.jugadores.find((j) => j.token === token);
  }
  jugadorPorSocket(socketId) {
    return this.estado.jugadores.find((j) => j.socketId === socketId);
  }
  esHost(token) {
    return this.estado.hostToken === token;
  }

  // ---------------------------------------------------------------------
  // Jugadores
  // ---------------------------------------------------------------------
  agregarJugador({ nombre, icono, socketId }) {
    if (this.estado.fase !== "lobby") {
      throw new Error("La partida ya comenzó.");
    }
    if (this.estado.jugadores.length >= MAX_JUGADORES) {
      throw new Error("La sala está llena.");
    }
    const nombreLimpio = (nombre || "Jugador").trim().slice(0, 18) || "Jugador";
    const iconoFinal = ANIMALES.includes(icono) ? icono : ANIMALES[this.estado.jugadores.length % ANIMALES.length];
    const jugador = crearJugador({
      id: this.estado.siguienteId++,
      token: generarPlayerToken(),
      nombre: nombreLimpio,
      icono: iconoFinal,
    });
    jugador.socketId = socketId;
    this.estado.jugadores.push(jugador);
    if (!this.estado.hostToken) this.estado.hostToken = jugador.token;
    this.tocarActividad();
    return jugador;
  }

  agregarBot(indice) {
    if (this.estado.fase !== "lobby") throw new Error("La partida ya comenzó.");
    if (this.estado.jugadores.length >= MAX_JUGADORES) return null;
    const usados = new Set(this.estado.jugadores.map((j) => j.icono));
    const icono = ANIMALES.find((a) => !usados.has(a)) || ANIMALES[this.estado.jugadores.length % ANIMALES.length];
    const nombre = `CPU ${NOMBRES_BOTS[indice % NOMBRES_BOTS.length]}`;
    const jugador = crearJugador({ id: this.estado.siguienteId++, token: generarPlayerToken(), nombre, icono, esBot: true });
    this.estado.jugadores.push(jugador);
    this.tocarActividad();
    return jugador;
  }

  agregarBots(cantidad) {
    const agregados = [];
    for (let i = 0; i < cantidad; i++) {
      if (this.estado.jugadores.length >= MAX_JUGADORES) break;
      agregados.push(this.agregarBot(i));
    }
    return agregados;
  }

  agregarBotDesdeHost(token) {
    if (!this.esHost(token)) throw new Error("Solo el anfitrión puede agregar bots.");
    if (this.estado.jugadores.length >= MAX_JUGADORES) throw new Error("La sala está llena.");
    const bot = this.agregarBot(this.estado.jugadores.length);
    this.emitirSnapshot();
    return bot;
  }

  reconectar(token, socketId) {
    const jugador = this.jugadorPorToken(token);
    if (!jugador) return null;
    jugador.socketId = socketId;
    jugador.conectado = true;
    this.tocarActividad();
    return jugador;
  }

  desconectarSocket(socketId) {
    const jugador = this.jugadorPorSocket(socketId);
    if (!jugador) return;
    jugador.conectado = false;
    jugador.socketId = null;
    this.tocarActividad();
    this.emitirSnapshot();
  }

  // ---------------------------------------------------------------------
  // Alianzas: formación instantánea (fuera del ciclo de rondas) con
  // confirmación en tiempo real; romperlas por traición se resuelve al
  // cerrar la ronda (ver resolverRondaActual).
  // ---------------------------------------------------------------------
  aliadosDe(jugadorId) {
    const ids = new Set();
    for (const [a, b] of this.estado.alianzas) {
      if (a === jugadorId) ids.add(b);
      else if (b === jugadorId) ids.add(a);
    }
    return ids;
  }

  sonAliados(a, b) {
    return existeAlianza(this.estado.alianzas, a, b);
  }

  proponerAlianza(deId, objetivoId) {
    if (this.estado.fase !== "accion") throw new Error("Solo podés proponer alianzas durante la fase de acción.");
    if (deId === objetivoId) throw new Error("No podés aliarte con vos mismo.");
    const de = this.jugadorPorId(deId);
    const objetivo = this.jugadorPorId(objetivoId);
    if (!de || !objetivo) throw new Error("Jugador no encontrado.");
    if (this.sonAliados(deId, objetivoId)) throw new Error("Ya están aliados.");
    const yaPropuesta = this.estado.propuestasAlianza.some((p) => p.deId === deId && p.aId === objetivoId);
    if (yaPropuesta) return;

    this.estado.propuestasAlianza.push({ deId, aId: objetivoId });
    this.tocarActividad();

    if (objetivo.socketId) {
      this.io.to(objetivo.socketId).emit("alianza_propuesta", { deId, deNombre: de.nombre, deIcono: de.icono });
    }
    if (objetivo.esBot) {
      const demora = DEMORA_BOT_MIN_MS + Math.random() * DEMORA_BOT_MAX_MS;
      const handle = setTimeout(() => {
        const sigueEnPie = this.estado.propuestasAlianza.some((p) => p.deId === deId && p.aId === objetivoId);
        if (!sigueEnPie) return;
        this.responderAlianza(objetivoId, deId, decidirRespuestaAlianzaBot());
      }, demora);
      this.timeoutsBots.push(handle);
    }
  }

  responderAlianza(objetivoId, deId, aceptar) {
    const idx = this.estado.propuestasAlianza.findIndex((p) => p.deId === deId && p.aId === objetivoId);
    if (idx === -1) return;
    this.estado.propuestasAlianza.splice(idx, 1);
    const de = this.jugadorPorId(deId);
    const objetivo = this.jugadorPorId(objetivoId);
    if (!de || !objetivo) return;
    this.tocarActividad();

    if (aceptar) {
      this.estado.alianzas = agregarAlianza(this.estado.alianzas, deId, objetivoId);
      this.estado.historial.push(`🤝 ${de.icono} ${de.nombre} y ${objetivo.icono} ${objetivo.nombre} sellaron una alianza.`);
      this.emitirATodos("alianza_formada", { a: deId, b: objetivoId });
      this.emitirSnapshot();
    } else if (de.socketId) {
      this.io.to(de.socketId).emit("alianza_rechazada", { objetivoId, objetivoNombre: objetivo.nombre });
    }
  }

  // Romper la alianza "en buenos términos": a diferencia de la traición, acá
  // no hay minijuego — el tesoro compartido se reparte por igual y se anuncia.
  romperAlianzaFormal(jugadorId, objetivoId) {
    if (this.estado.fase !== "accion") throw new Error("Solo podés romper alianzas durante la fase de acción.");
    if (!this.sonAliados(jugadorId, objetivoId)) throw new Error("No están aliados.");
    const jugador = this.jugadorPorId(jugadorId);
    const objetivo = this.jugadorPorId(objetivoId);
    if (!jugador || !objetivo) throw new Error("Jugador no encontrado.");

    this.estado.alianzas = quitarAlianza(this.estado.alianzas, jugadorId, objetivoId);
    this.tocarActividad();
    this.resolverTesorosAfectados(jugadorId, objetivoId);
    this.estado.historial.push(`💔🤝 ${jugador.icono} ${jugador.nombre} y ${objetivo.icono} ${objetivo.nombre} rompieron su alianza en buenos términos.`);

    this.emitirATodos("alianza_rota", { a: jugadorId, b: objetivoId, formal: true });
    this.emitirSnapshot();
  }

  // Busca cualquier tesoro compartido cuyo grupo incluya a estos dos ids: al
  // romperse el vínculo entre ellos (formal o por traición), cualquier
  // camarilla que dependiera de esa confianza mutua deja de tener sentido.
  // Si `traidorId` viene seteado (ruptura por traición) y el grupo es de
  // exactamente 2 personas, no reparte acá: lo agrega a `duelosAIniciar` para
  // disputarlo a piedra, papel o tijera. Grupos de 3+ traicionados excluyen
  // al traidor del reparto; las rupturas en buenos términos (`traidorId`
  // ausente) reparten por igual entre todos los miembros.
  resolverTesorosAfectados(aId, bId, { traidorId = null, duelosAIniciar = [] } = {}) {
    for (const clave of Object.keys(this.estado.tesorosAlianza)) {
      const miembros = clave.split("-").map(Number);
      if (!miembros.includes(aId) || !miembros.includes(bId)) continue;
      const monto = this.estado.tesorosAlianza[clave];
      delete this.estado.tesorosAlianza[clave];
      if (!monto) continue;

      if (traidorId != null && miembros.length === 2) {
        duelosAIniciar.push({ aId: miembros[0], bId: miembros[1], monto });
        continue;
      }

      const impuesto = Math.floor(monto * PORCENTAJE_TESORO_AL_REY);
      const repartible = monto - impuesto;
      const beneficiarios = traidorId != null ? miembros.filter((id) => id !== traidorId) : miembros;
      const porCabeza = Math.floor(repartible / beneficiarios.length);
      const nombres = beneficiarios.map((id) => {
        const j = this.jugadorPorId(id);
        j.oro += porCabeza;
        return `${j.icono} ${j.nombre}`;
      });

      if (traidorId != null) {
        const traidor = this.jugadorPorId(traidorId);
        this.estado.historial.push(
          `🗡️💔 Traición: ${traidor.icono} ${traidor.nombre} pierde su parte del tesoro secreto del grupo (${monto} de oro) — ${nombres.join(
            ", "
          )} se reparten ${repartible} de oro (${porCabeza} c/u) y ${impuesto} fueron a la corona.`
        );
      } else {
        this.estado.historial.push(
          `💔🤝 Se disolvió un pacto de ${miembros.length} y su tesoro secreto (${monto} de oro): ${nombres.join(
            ", "
          )} se reparten ${repartible} de oro (${porCabeza} c/u) — ${impuesto} fueron a la corona.`
        );
      }
    }
    return duelosAIniciar;
  }

  // Reenvía a cada miembro de cada tesoro compartido vigente el monto total
  // del grupo (mismo valor para todos, ya que es un solo pozo).
  emitirTesorosAlianza() {
    for (const [clave, monto] of Object.entries(this.estado.tesorosAlianza)) {
      const miembros = clave.split("-").map(Number);
      for (const id of miembros) {
        const jugador = this.jugadorPorId(id);
        if (!jugador?.socketId) continue;
        for (const otroId of miembros) {
          if (otroId === id) continue;
          this.io.to(jugador.socketId).emit("tesoro_alianza", { conId: otroId, monto });
        }
      }
    }
  }

  // Chat entre aliados: mensajes rápidos y fijos (nunca texto libre del
  // cliente) para coordinar ataques conjuntos o avisar intenciones. Si viene
  // `paraId`, el mensaje es privado para ese aliado puntual (no le llega al
  // resto); si no, se manda a todos tus aliados actuales — así se puede
  // distinguir con quién se está hablando cuando hay varias alianzas.
  enviarMensajeAlianza(jugadorId, plantillaId, objetivoId, paraId) {
    const plantilla = PLANTILLAS_MENSAJE_ALIANZA[plantillaId];
    if (!plantilla) throw new Error("Mensaje inválido.");
    const aliados = this.aliadosDe(jugadorId);
    if (aliados.size === 0) throw new Error("No tenés aliados a quién avisarles.");
    const jugador = this.jugadorPorId(jugadorId);

    let para = null;
    let destinatarios = aliados;
    if (paraId != null && paraId !== "") {
      const paraIdNum = Number(paraId);
      if (!aliados.has(paraIdNum)) throw new Error("Ese jugador no es tu aliado.");
      para = this.jugadorPorId(paraIdNum);
      destinatarios = new Set([paraIdNum]);
    }

    let texto;
    if (plantillaId === PLANTILLA_REQUIERE_OBJETIVO) {
      const objetivo = this.jugadorPorId(Number(objetivoId));
      if (!objetivo) throw new Error("Objetivo no encontrado.");
      texto = plantilla(objetivo.nombre);
    } else {
      texto = plantilla();
    }

    const payload = {
      deId: jugadorId,
      deNombre: jugador.nombre,
      deIcono: jugador.icono,
      texto,
      ts: Date.now(),
      paraId: para?.id ?? null,
      paraNombre: para?.nombre ?? null,
    };
    this.tocarActividad();
    if (jugador.socketId) this.io.to(jugador.socketId).emit("mensaje_alianza", payload);
    for (const id of destinatarios) {
      const aliado = this.jugadorPorId(id);
      if (aliado?.socketId) this.io.to(aliado.socketId).emit("mensaje_alianza", payload);
    }
  }

  // ---------------------------------------------------------------------
  // Duelo de piedra/papel/tijera por el tesoro de una alianza rota por
  // traición: se arranca después de revelar la ronda, se resuelve en
  // cuanto ambos eligieron (o al azar si alguno no elige a tiempo).
  // ---------------------------------------------------------------------
  iniciarDueloTesoro(aId, bId, monto) {
    const clave = claveAlianza(aId, bId);
    this.estado.duelosTesoro[clave] = { aId, bId, monto, elecciones: {} };
    const a = this.jugadorPorId(aId);
    const b = this.jugadorPorId(bId);
    if (a?.socketId) this.io.to(a.socketId).emit("duelo_tesoro_iniciado", { conId: bId, monto });
    if (b?.socketId) this.io.to(b.socketId).emit("duelo_tesoro_iniciado", { conId: aId, monto });

    for (const jugador of [a, b]) {
      if (!jugador?.esBot) continue;
      const demora = DEMORA_BOT_MIN_MS + Math.random() * DEMORA_BOT_MAX_MS;
      const handle = setTimeout(() => this.elegirDuelo(jugador.id, decidirEleccionDueloBot()), demora);
      this.timeoutsBots.push(handle);
    }

    this.timers[`duelo_${clave}`] = setTimeout(() => this.forzarDuelo(clave), DUELO_ELECCION_TIMEOUT_MS);
  }

  elegirDuelo(jugadorId, eleccion) {
    if (!["piedra", "papel", "tijera"].includes(eleccion)) throw new Error("Elección inválida.");
    const entrada = Object.entries(this.estado.duelosTesoro).find(([, d]) => d.aId === jugadorId || d.bId === jugadorId);
    if (!entrada) throw new Error("No tenés ningún duelo pendiente.");
    const [clave, duelo] = entrada;
    if (duelo.elecciones[jugadorId]) return; // ya eligió
    duelo.elecciones[jugadorId] = eleccion;
    this.tocarActividad();
    if (duelo.elecciones[duelo.aId] && duelo.elecciones[duelo.bId]) {
      this.resolverDuelo(clave);
    }
  }

  forzarDuelo(clave) {
    const duelo = this.estado.duelosTesoro[clave];
    if (!duelo) return;
    for (const id of [duelo.aId, duelo.bId]) {
      if (!duelo.elecciones[id]) duelo.elecciones[id] = elegirAlAzarLocal(["piedra", "papel", "tijera"]);
    }
    this.resolverDuelo(clave);
  }

  resolverDuelo(clave) {
    const duelo = this.estado.duelosTesoro[clave];
    if (!duelo) return;
    this.limpiarTimer(`duelo_${clave}`);

    const eleccionA = duelo.elecciones[duelo.aId];
    const eleccionB = duelo.elecciones[duelo.bId];
    const resultado = resolverPiedraPapelTijera(eleccionA, eleccionB);

    if (resultado === "empate") {
      this.estado.historial.push(`🪨📄✂️ Empate (${eleccionA} vs ${eleccionB}) en el duelo por el tesoro secreto — se repite.`);
      this.emitirATodos("duelo_tesoro_empate", { a: duelo.aId, b: duelo.bId });
      this.iniciarDueloTesoro(duelo.aId, duelo.bId, duelo.monto);
      return;
    }

    delete this.estado.duelosTesoro[clave];
    const ganadorId = resultado === "a" ? duelo.aId : duelo.bId;
    const perdedorId = resultado === "a" ? duelo.bId : duelo.aId;
    const eleccionGanador = resultado === "a" ? eleccionA : eleccionB;
    const eleccionPerdedor = resultado === "a" ? eleccionB : eleccionA;
    const impuesto = Math.floor(duelo.monto * PORCENTAJE_TESORO_AL_REY);
    const premio = duelo.monto - impuesto;

    this.jugadorPorId(ganadorId).oro += premio;
    const ganador = this.jugadorPorId(ganadorId);
    const perdedor = this.jugadorPorId(perdedorId);
    this.estado.historial.push(
      `🗡️🪨📄✂️ Duelo por el tesoro secreto: ${ganador.icono} ${ganador.nombre} (${eleccionGanador}) le ganó a ${perdedor.icono} ${perdedor.nombre} (${eleccionPerdedor}) y se llevó ${premio} de oro — ${impuesto} fueron a la corona.`
    );
    this.emitirATodos("duelo_tesoro_resuelto", { ganadorId, perdedorId, premio, impuesto, eleccionGanador, eleccionPerdedor });
    this.emitirSnapshot();
  }

  programarBotsAlianza() {
    const bots = this.estado.jugadores.filter((j) => j.esBot);
    const limiteDemora = this.estado.configuracion.tiempoLimite
      ? Math.min(DEMORA_BOT_MAX_MS, this.estado.configuracion.tiempoLimite - 1000)
      : DEMORA_BOT_MAX_MS;
    for (const bot of bots) {
      const demora = DEMORA_BOT_MIN_MS + Math.random() * Math.max(limiteDemora - DEMORA_BOT_MIN_MS, 0);
      const handle = setTimeout(() => {
        if (this.estado.fase !== "accion") return;
        const aliados = this.aliadosDe(bot.id);
        const candidatos = this.estado.jugadores
          .filter((j) => j.id !== bot.id && !aliados.has(j.id))
          .filter(
            (j) =>
              !this.estado.propuestasAlianza.some(
                (p) => (p.deId === bot.id && p.aId === j.id) || (p.deId === j.id && p.aId === bot.id)
              )
          )
          .map((j) => j.id);
        const elegido = decidirPropuestaAlianzaBot(candidatos);
        if (elegido != null) {
          try {
            this.proponerAlianza(bot.id, elegido);
          } catch {
            // sin problema, se reintenta en otra ronda
          }
        }
      }, demora);
      this.timeoutsBots.push(handle);
    }
  }

  // ---------------------------------------------------------------------
  // Snapshot público (nunca incluye acciones/votos secretos de otros)
  // ---------------------------------------------------------------------
  snapshot() {
    const e = this.estado;
    const jugadores = e.jugadores.map((j) => {
      const pub = jugadorPublico(j);
      pub.esHost = j.token === e.hostToken;
      if (e.fase === "accion") pub.selloJugada = Boolean(e.accionesPendientes[j.id]);
      if (e.fase === "profecia") pub.voto = Boolean(e.profeciaActual?.votos?.[j.id]);
      return pub;
    });
    return {
      code: e.code,
      ronda: e.ronda,
      fase: e.fase,
      jugadores,
      configuracion: e.configuracion,
      deadlineAccion: e.deadlineAccion,
      profeciaEnVotacion:
        e.fase === "profecia" && e.profeciaActual ? { deadline: e.profeciaActual.deadline, opciones: ["A", "B", "C"] } : null,
      profeciaActiva: e.profeciaRondaActual
        ? {
            id: e.profeciaRondaActual.id,
            icono: e.profeciaRondaActual.icono,
            nombre: e.profeciaRondaActual.nombre,
            texto: e.profeciaRondaActual.texto,
          }
        : null,
      historial: e.historial,
      alianzas: e.alianzas,
      sueteMuerte: e.sueteMuerte,
      terminada: e.terminada,
      ganadorId: e.ganadorId,
      podio: e.podio,
    };
  }

  emitirSnapshot() {
    this.emitirATodos("snapshot_estado", this.snapshot());
  }

  // ---------------------------------------------------------------------
  // Flujo de partida
  // ---------------------------------------------------------------------
  empezar(token, { tiempoLimite } = {}) {
    if (!this.esHost(token)) throw new Error("Solo el anfitrión puede iniciar la partida.");
    if (this.estado.fase !== "lobby") throw new Error("La partida ya comenzó.");
    if (this.estado.jugadores.length < MIN_JUGADORES) throw new Error(`Se necesitan al menos ${MIN_JUGADORES} jugadores.`);
    if ([null, 60000, 30000].includes(tiempoLimite)) this.estado.configuracion.tiempoLimite = tiempoLimite ?? null;
    this.tocarActividad();
    this.iniciarRonda();
  }

  iniciarRonda() {
    this.estado.ronda += 1;
    this.estado.accionesPendientes = {};
    this.estado.propuestasAlianza = [];
    this.estado.profeciaRondaActual = null;
    if (RONDAS_PROFECIA.includes(this.estado.ronda)) {
      this.iniciarVotacionProfecia();
    } else {
      this.iniciarFaseAccion();
    }
  }

  iniciarVotacionProfecia() {
    this.estado.fase = "profecia";
    const opciones = elegirTresProfecias(this.estado.profeciaMazoUsado);
    opciones.forEach((o) => this.estado.profeciaMazoUsado.push(o.profecia.id));
    this.estado.profeciaActual = { opciones, votos: {}, deadline: Date.now() + TIEMPO_VOTACION_MS };

    this.emitirATodos("iniciar_votacion", {
      ronda: this.estado.ronda,
      deadline: this.estado.profeciaActual.deadline,
      opciones: ["A", "B", "C"],
    });

    for (const j of this.estado.jugadores) {
      if (j.torreOraculo && j.socketId) {
        this.io.to(j.socketId).emit(
          "contenido_oraculo",
          opciones.map((o) => ({ clave: o.clave, icono: o.profecia.icono, nombre: o.profecia.nombre, texto: o.profecia.texto }))
        );
      }
    }

    this.emitirSnapshot();
    this.limpiarTimer("votacion");
    this.timers.votacion = setTimeout(() => this.forzarVotosPendientes(), TIEMPO_VOTACION_MS);
    this.programarBotsVoto();
  }

  programarBotsVoto() {
    const bots = this.estado.jugadores.filter((j) => j.esBot);
    for (const bot of bots) {
      const demora = DEMORA_BOT_MIN_MS + Math.random() * Math.min(DEMORA_BOT_MAX_MS, TIEMPO_VOTACION_MS - 1000);
      const handle = setTimeout(() => {
        if (this.estado.fase !== "profecia" || this.estado.profeciaActual?.votos?.[bot.id]) return;
        try {
          this.votar(bot.id, decidirVotoBot());
        } catch {
          // se resuelve igual con forzarVotosPendientes si algo falla
        }
      }, demora);
      this.timeoutsBots.push(handle);
    }
  }

  votar(jugadorId, opcion) {
    if (this.estado.fase !== "profecia") throw new Error("No hay una votación en curso.");
    if (!["A", "B", "C"].includes(opcion)) throw new Error("Opción de voto inválida.");
    if (this.estado.profeciaActual.votos[jugadorId]) return; // ya votó, se ignora silenciosamente
    this.estado.profeciaActual.votos[jugadorId] = opcion;
    this.tocarActividad();
    const conectados = this.estado.jugadores.filter((j) => j.conectado);
    const todosVotaron = conectados.every((j) => this.estado.profeciaActual.votos[j.id]);
    if (todosVotaron) {
      this.resolverVotacion();
    } else {
      this.emitirSnapshot();
    }
  }

  forzarVotosPendientes() {
    if (this.estado.fase !== "profecia") return;
    for (const j of this.estado.jugadores) {
      if (!this.estado.profeciaActual.votos[j.id]) {
        this.estado.profeciaActual.votos[j.id] = elegirAlAzarLocal(["A", "B", "C"]);
      }
    }
    this.resolverVotacion();
  }

  resolverVotacion() {
    this.limpiarTimer("votacion");
    const { opciones, votos } = this.estado.profeciaActual;
    const { ganadora, conteo } = resolverVotos(votos);
    const elegida = opciones.find((o) => o.clave === ganadora).profecia;

    const { eventos, leaderId } = aplicarEfectoProfecia(this.estado.jugadores, elegida.id);
    this.estado.profeciaRondaActual = { id: elegida.id, leaderId, icono: elegida.icono, nombre: elegida.nombre, texto: elegida.texto };

    const detalleVotos = this.estado.jugadores.map((j) => ({ jugadorId: j.id, voto: votos[j.id] || null }));
    const jugadoresPorId = new Map(this.estado.jugadores.map((j) => [j.id, j]));
    const narracion = narrarEventos(eventos, jugadoresPorId);

    const frase = `🔮 El pergamino ganador fue "${elegida.icono} ${elegida.nombre}": ${elegida.texto}`;
    this.estado.historial.push(frase, ...narracion);

    this.emitirATodos("votacion_revelada", {
      ronda: this.estado.ronda,
      ganadora,
      conteo,
      detalleVotos,
      profecia: { id: elegida.id, icono: elegida.icono, nombre: elegida.nombre, texto: elegida.texto },
      narracion,
    });
    this.estado.profeciaActual = null;
    this.emitirSnapshot();

    this.limpiarTimer("avance");
    this.timers.avance = setTimeout(() => this.iniciarFaseAccion(), DELAY_VOTACION_REVELADA_MS);
  }

  iniciarFaseAccion() {
    this.estado.fase = "accion";
    this.estado.accionesPendientes = {};
    const tiempo = this.estado.configuracion.tiempoLimite;
    this.estado.deadlineAccion = tiempo ? Date.now() + tiempo : null;
    this.emitirSnapshot();
    this.limpiarTimer("accion");
    if (tiempo) {
      this.timers.accion = setTimeout(() => this.forzarAccionesPendientes(), tiempo);
    }
    this.programarBotsAccion();
    this.programarBotsAlianza();
  }

  programarBotsAccion() {
    const bots = this.estado.jugadores.filter((j) => j.esBot);
    const limiteDemora = this.estado.configuracion.tiempoLimite
      ? Math.min(DEMORA_BOT_MAX_MS, this.estado.configuracion.tiempoLimite - 1000)
      : DEMORA_BOT_MAX_MS;
    for (const bot of bots) {
      const demora = DEMORA_BOT_MIN_MS + Math.random() * Math.max(limiteDemora - DEMORA_BOT_MIN_MS, 0);
      const handle = setTimeout(() => {
        if (this.estado.fase !== "accion" || this.estado.accionesPendientes[bot.id]) return;
        try {
          const accion = decidirAccionBot(bot, this.estado.jugadores, this.aliadosDe(bot.id));
          this.jugarAccion(bot.id, accion);
        } catch {
          // se resuelve igual con forzarAccionesPendientes si algo falla
        }
      }, demora);
      this.timeoutsBots.push(handle);
    }
  }

  validarAccion(jugador, accion) {
    if (!accion || typeof accion !== "object") throw new Error("Acción inválida.");
    const { tipo } = accion;
    if (!["cosechar", "construir", "asaltar", "defender", "enviar_oro"].includes(tipo)) {
      throw new Error("Tipo de acción inválido.");
    }
    if (tipo === "construir") {
      if (!["granja", "muralla", "oraculo", "castillo"].includes(accion.item)) throw new Error("Construcción inválida.");
      if (costoDeItem(jugador, accion.item) == null) throw new Error("Esa construcción ya no está disponible.");
      return { tipo, item: accion.item };
    }
    if (tipo === "asaltar") {
      const objetivo = this.jugadorPorId(accion.objetivoId);
      if (!objetivo || objetivo.id === jugador.id) throw new Error("Objetivo de asalto inválido.");
      const antorcha = Boolean(accion.antorcha);
      if (antorcha && jugador.antorchaUsada) throw new Error("Ya usaste tu antorcha esta partida.");
      const asedio = Boolean(accion.asedio);
      if (asedio) {
        if (jugador.asedioUsado) throw new Error("Ya usaste tu asedio esta partida.");
        if (objetivo.castillo < ETAPA_AMBICION) throw new Error("Solo podés asediar un castillo en etapa 2 o más.");
      }
      return { tipo, objetivoId: objetivo.id, antorcha, asedio };
    }
    if (tipo === "enviar_oro") {
      const objetivo = this.jugadorPorId(accion.objetivoId);
      if (!objetivo || objetivo.id === jugador.id) throw new Error("Destino de envío inválido.");
      if (!this.sonAliados(jugador.id, objetivo.id)) throw new Error("Solo podés enviarle oro a un aliado.");
      const cantidad = Math.floor(Number(accion.cantidad));
      if (!Number.isFinite(cantidad) || cantidad <= 0) throw new Error("Cantidad de oro inválida.");
      return { tipo, objetivoId: objetivo.id, cantidad };
    }
    if (tipo === "defender") {
      if (accion.objetivoId == null) return { tipo };
      const objetivo = this.jugadorPorId(accion.objetivoId);
      if (!objetivo || objetivo.id === jugador.id) throw new Error("Objetivo de defensa inválido.");
      if (!this.sonAliados(jugador.id, objetivo.id)) throw new Error("Solo podés defender a un aliado.");
      return { tipo, objetivoId: objetivo.id };
    }
    return { tipo };
  }

  jugarAccion(jugadorId, accionCruda) {
    if (this.estado.fase !== "accion") throw new Error("No es momento de jugar una acción.");
    const jugador = this.jugadorPorId(jugadorId);
    if (!jugador) throw new Error("Jugador no encontrado.");
    if (this.estado.accionesPendientes[jugadorId]) return; // ya selló su jugada
    const accion = this.validarAccion(jugador, accionCruda);
    this.estado.accionesPendientes[jugadorId] = accion;
    this.tocarActividad();

    const conectados = this.estado.jugadores.filter((j) => j.conectado);
    const todosJugaron = conectados.every((j) => this.estado.accionesPendientes[j.id]);
    if (todosJugaron) {
      this.resolverRondaActual();
    } else {
      this.emitirSnapshot();
    }
  }

  forzarAccionesPendientes() {
    if (this.estado.fase !== "accion") return;
    for (const j of this.estado.jugadores) {
      if (!this.estado.accionesPendientes[j.id]) {
        this.estado.accionesPendientes[j.id] = { tipo: "cosechar" };
      }
    }
    this.resolverRondaActual();
  }

  resolverRondaActual() {
    this.limpiarTimer("accion");
    const jugadoresAntes = new Map(this.estado.jugadores.map((j) => [j.id, j.castillo]));

    // Interés del tesoro compartido: crece un poco cada ronda que el grupo
    // aguanta, antes de sumarle el botín en pinza de esta ronda. Cualquier
    // tesoro que sigue en pie ya tiene garantizado que todos sus miembros
    // siguen aliados entre sí (se disuelve al instante si se rompe algún
    // vínculo interno, ver resolverTesorosAfectados).
    for (const clave of Object.keys(this.estado.tesorosAlianza)) {
      if (this.estado.tesorosAlianza[clave] > 0) {
        this.estado.tesorosAlianza[clave] = Math.floor(this.estado.tesorosAlianza[clave] * (1 + INTERES_TESORO_ALIANZA));
      }
    }

    const { traiciones, alianzasRestantes } = resolverTraiciones(this.estado.alianzas, this.estado.accionesPendientes);
    this.estado.alianzas = alianzasRestantes;

    // El tesoro de un par traicionado no se reparte solo: se decide con un
    // duelo de piedra/papel/tijera arrancado después de revelar la ronda
    // (ver más abajo). Si el traidor y la víctima compartían un tesoro de
    // grupo más grande (3+), ese se resuelve al instante excluyendo al
    // traidor del reparto (ver resolverTesorosAfectados).
    const duelosAIniciar = [];
    for (const t of traiciones) {
      this.resolverTesorosAfectados(t.atacanteId, t.objetivoId, { traidorId: t.atacanteId, duelosAIniciar });
    }

    const { eventos: eventosCombate } = resolverRonda(
      this.estado.jugadores,
      this.estado.accionesPendientes,
      this.estado.profeciaRondaActual,
      this.estado.alianzas,
      this.estado.tesorosAlianza
    );
    const eventos = [...traiciones, ...eventosCombate];

    this.emitirTesorosAlianza();

    for (const j of this.estado.jugadores) {
      if (jugadoresAntes.get(j.id) < 2 && j.castillo >= 2) {
        eventos.push({ tipo: "alerta_panico", jugadorId: j.id });
      }
    }

    const jugadoresPorId = new Map(this.estado.jugadores.map((j) => [j.id, j]));
    const narracion = narrarEventos(eventos, jugadoresPorId);
    this.estado.historial.push(`— Ronda ${this.estado.ronda} —`, ...narracion);

    const fin = revisarFinPartida(this.estado.jugadores, this.estado.ronda);
    this.estado.sueteMuerte = fin.sueteMuerte;
    this.estado.fase = "revelacion";

    this.emitirATodos("ronda_revelada", {
      ronda: this.estado.ronda,
      eventos,
      narracion,
      profecia: this.estado.profeciaRondaActual,
      snapshot: this.snapshot(),
    });

    if (fin.terminada) {
      this.finalizar(fin.ganadorId);
      return;
    }

    for (const duelo of duelosAIniciar) {
      const a = this.jugadorPorId(duelo.aId);
      const b = this.jugadorPorId(duelo.bId);
      this.estado.historial.push(
        `🗡️💔 ¡El tesoro secreto (${duelo.monto} de oro) de ${a.icono} ${a.nombre} y ${b.icono} ${b.nombre} se disputa a piedra, papel o tijera!`
      );
      this.iniciarDueloTesoro(duelo.aId, duelo.bId, duelo.monto);
    }

    this.emitirSnapshot();
    this.limpiarTimer("avance");
    this.timers.avance = setTimeout(() => this.iniciarRonda(), DELAY_REVELACION_MS);
  }

  finalizar(ganadorId) {
    this.estado.terminada = true;
    this.estado.ganadorId = ganadorId;
    this.estado.fase = "fin";
    this.estado.podio = armarPodio(this.estado.jugadores);
    this.emitirATodos("fin_partida", {
      ganadorId,
      podio: this.estado.podio,
      ronda: this.estado.ronda,
    });
    this.emitirSnapshot();
  }

  forzarPendientes(token) {
    if (!this.esHost(token)) throw new Error("Solo el anfitrión puede forzar la ronda.");
    if (this.estado.fase === "profecia") this.forzarVotosPendientes();
    else if (this.estado.fase === "accion") this.forzarAccionesPendientes();
  }
}

function elegirAlAzarLocal(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}

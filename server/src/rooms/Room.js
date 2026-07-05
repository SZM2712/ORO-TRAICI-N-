import {
  MIN_JUGADORES,
  MAX_JUGADORES,
  RONDAS_PROFECIA,
  TIEMPO_VOTACION_MS,
  ANIMALES,
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
} from "../game/GameEngine.js";
import { narrarEventos } from "../game/narrativa.js";
import { generarPlayerToken } from "../utils/ids.js";
import { NOMBRES_BOTS, decidirAccionBot, decidirVotoBot } from "../game/bot.js";

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
          this.jugarAccion(bot.id, decidirAccionBot(bot, this.estado.jugadores));
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
    if (!["cosechar", "construir", "asaltar", "defender"].includes(tipo)) throw new Error("Tipo de acción inválido.");
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
      return { tipo, objetivoId: objetivo.id, antorcha };
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
    const { eventos } = resolverRonda(this.estado.jugadores, this.estado.accionesPendientes, this.estado.profeciaRondaActual);

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

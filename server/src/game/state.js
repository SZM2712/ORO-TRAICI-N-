import { ORO_INICIAL, GRANJAS_INICIALES } from "../config.js";

export function crearJugador({ id, token, nombre, icono, esBot = false }) {
  return {
    id,
    token,
    nombre,
    icono,
    esBot,
    conectado: true,
    socketId: null,
    oro: ORO_INICIAL,
    granjas: GRANJAS_INICIALES,
    granjasQuemadas: 0,
    muralla: false,
    torreOraculo: false,
    castillo: 0,
    antorchaUsada: false,
    asedioUsado: false,
  };
}

export function crearEstadoSala(code) {
  return {
    code,
    creadoEn: Date.now(),
    ultimaActividad: Date.now(),
    hostToken: null,
    jugadores: [], // crearJugador[]
    siguienteId: 1,
    ronda: 0,
    fase: "lobby", // lobby | profecia | accion | revelacion | fin
    configuracion: { tiempoLimite: null }, // null | 60000 | 30000
    accionesPendientes: {}, // jugadorId -> accion (secreta, nunca se transmite)
    deadlineAccion: null,
    profeciaMazoUsado: [], // ids de profecías ya usadas
    profeciaActual: null, // { opciones: [{clave,id}], votos:{}, deadline, ganador, leaderId }
    historial: [], // crónica del reino (texto)
    alianzas: [], // [idA, idB][] pares canónicos (idA < idB), públicos para toda la sala
    propuestasAlianza: [], // { deId, aId }[] pendientes de respuesta, privadas
    tesorosAlianza: {}, // claveAlianza(a,b) -> monto oculto, solo visible para esos dos jugadores
    sueteMuerte: false,
    terminada: false,
    ganadorId: null,
    podio: null,
  };
}

export function jugadorPublico(j) {
  return {
    id: j.id,
    nombre: j.nombre,
    icono: j.icono,
    esBot: Boolean(j.esBot),
    conectado: j.conectado,
    oro: j.oro,
    granjas: j.granjas,
    granjasQuemadas: j.granjasQuemadas,
    muralla: j.muralla,
    torreOraculo: j.torreOraculo,
    castillo: j.castillo,
    antorchaUsada: j.antorchaUsada,
    asedioUsado: j.asedioUsado,
    selloJugada: false, // se completa en Room al armar snapshot
  };
}

export function puntaje(j) {
  return j.castillo * 100 + j.oro;
}

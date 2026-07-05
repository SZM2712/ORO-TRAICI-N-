import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { socket, guardarSesion, leerSesion, borrarSesion, emitirConAck } from "../socket";

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [conectado, setConectado] = useState(false);
  const [sesion, setSesion] = useState(null); // { roomCode, playerToken, playerId, esHost }
  const [snapshot, setSnapshot] = useState(null);
  const [error, setError] = useState(null);
  const [votacionActual, setVotacionActual] = useState(null); // { deadline, opciones }
  const [contenidoOraculo, setContenidoOraculo] = useState(null); // [{clave,icono,nombre,texto}]
  const [votacionRevelada, setVotacionRevelada] = useState(null);
  const [rondaRevelada, setRondaRevelada] = useState(null);
  const [finPartida, setFinPartida] = useState(null);
  const [propuestaAlianzaRecibida, setPropuestaAlianzaRecibida] = useState(null); // { deId, deNombre, deIcono }
  const [tesorosAlianza, setTesorosAlianza] = useState({}); // { [aliadoId]: monto } — privado, solo lo que me llega a mí
  const [alianzaRechazadaId, setAlianzaRechazadaId] = useState(null); // objetivoId cuya propuesta acaban de rechazar
  const [dueloTesoro, setDueloTesoro] = useState(null); // { conId, monto } — duelo piedra/papel/tijera pendiente
  const [dueloResultado, setDueloResultado] = useState(null); // { gane, premio, impuesto, miEleccion, rivalEleccion }
  const intentoReconexion = useRef(false);
  const sesionRef = useRef(null);

  useEffect(() => {
    sesionRef.current = sesion;
  }, [sesion]);

  useEffect(() => {
    socket.connect();

    function alConectar() {
      setConectado(true);
      if (!intentoReconexion.current) {
        intentoReconexion.current = true;
        const previa = leerSesion();
        if (previa?.roomCode && previa?.playerToken) {
          emitirConAck("unirse", { roomCode: previa.roomCode, playerToken: previa.playerToken }).then((res) => {
            if (res.ok) {
              setSesion({ roomCode: res.roomCode, playerToken: res.playerToken, playerId: res.playerId });
            } else {
              borrarSesion();
            }
          });
        }
      }
    }
    function alDesconectar() {
      setConectado(false);
    }
    function alSnapshot(s) {
      setSnapshot(s);
    }
    function alError(e) {
      setError(e?.message || "Ocurrió un error.");
    }
    function alIniciarVotacion(payload) {
      setVotacionActual(payload);
      setContenidoOraculo(null);
      setVotacionRevelada(null);
    }
    function alContenidoOraculo(payload) {
      setContenidoOraculo(payload);
    }
    function alVotacionRevelada(payload) {
      setVotacionActual(null);
      setVotacionRevelada(payload);
    }
    function alRondaRevelada(payload) {
      setRondaRevelada(payload);
    }
    function alFinPartida(payload) {
      setFinPartida(payload);
    }
    function alAlianzaPropuesta(payload) {
      setPropuestaAlianzaRecibida(payload);
    }
    function alAlianzaRechazada(payload) {
      setError(`${payload?.objetivoNombre || "Tu rival"} rechazó tu propuesta de alianza.`);
      setAlianzaRechazadaId(payload?.objetivoId ?? null);
    }
    function alTesoroAlianza(payload) {
      setTesorosAlianza((prev) => ({ ...prev, [payload.conId]: payload.monto }));
    }
    function alDueloTesoroIniciado(payload) {
      setDueloTesoro(payload);
      setDueloResultado(null);
    }
    function alDueloTesoroEmpate(payload) {
      const miId = sesionRef.current?.playerId;
      if (miId == null || (payload.a !== miId && payload.b !== miId)) return;
      setError("Empate en el duelo por el tesoro — se repite.");
    }
    function alDueloTesoroResuelto(payload) {
      const miId = sesionRef.current?.playerId;
      if (miId == null) return;
      const soyGanador = payload.ganadorId === miId;
      const soyPerdedor = payload.perdedorId === miId;
      if (!soyGanador && !soyPerdedor) return;
      setDueloTesoro(null);
      setDueloResultado({
        gane: soyGanador,
        premio: payload.premio,
        impuesto: payload.impuesto,
        rivalId: soyGanador ? payload.perdedorId : payload.ganadorId,
        miEleccion: soyGanador ? payload.eleccionGanador : payload.eleccionPerdedor,
        rivalEleccion: soyGanador ? payload.eleccionPerdedor : payload.eleccionGanador,
      });
      setTimeout(() => setDueloResultado(null), 6000);
    }

    socket.on("connect", alConectar);
    socket.on("disconnect", alDesconectar);
    socket.on("snapshot_estado", alSnapshot);
    socket.on("error", alError);
    socket.on("iniciar_votacion", alIniciarVotacion);
    socket.on("contenido_oraculo", alContenidoOraculo);
    socket.on("votacion_revelada", alVotacionRevelada);
    socket.on("ronda_revelada", alRondaRevelada);
    socket.on("fin_partida", alFinPartida);
    socket.on("alianza_propuesta", alAlianzaPropuesta);
    socket.on("alianza_rechazada", alAlianzaRechazada);
    socket.on("tesoro_alianza", alTesoroAlianza);
    socket.on("duelo_tesoro_iniciado", alDueloTesoroIniciado);
    socket.on("duelo_tesoro_empate", alDueloTesoroEmpate);
    socket.on("duelo_tesoro_resuelto", alDueloTesoroResuelto);

    return () => {
      socket.off("connect", alConectar);
      socket.off("disconnect", alDesconectar);
      socket.off("snapshot_estado", alSnapshot);
      socket.off("error", alError);
      socket.off("iniciar_votacion", alIniciarVotacion);
      socket.off("contenido_oraculo", alContenidoOraculo);
      socket.off("votacion_revelada", alVotacionRevelada);
      socket.off("ronda_revelada", alRondaRevelada);
      socket.off("fin_partida", alFinPartida);
      socket.off("alianza_propuesta", alAlianzaPropuesta);
      socket.off("alianza_rechazada", alAlianzaRechazada);
      socket.off("tesoro_alianza", alTesoroAlianza);
      socket.off("duelo_tesoro_iniciado", alDueloTesoroIniciado);
      socket.off("duelo_tesoro_empate", alDueloTesoroEmpate);
      socket.off("duelo_tesoro_resuelto", alDueloTesoroResuelto);
    };
  }, []);

  const crearSala = useCallback(async ({ nombre, icono, vsMaquina, cantidadBots }) => {
    const res = await emitirConAck("crear_sala", { nombre, icono, vsMaquina, cantidadBots });
    if (res.ok) {
      guardarSesion({ roomCode: res.roomCode, playerToken: res.playerToken, playerId: res.playerId });
      setSesion({ roomCode: res.roomCode, playerToken: res.playerToken, playerId: res.playerId });
    }
    return res;
  }, []);

  const unirseASala = useCallback(async ({ roomCode, nombre, icono }) => {
    const res = await emitirConAck("unirse", { roomCode, nombre, icono });
    if (res.ok) {
      guardarSesion({ roomCode: res.roomCode, playerToken: res.playerToken, playerId: res.playerId });
      setSesion({ roomCode: res.roomCode, playerToken: res.playerToken, playerId: res.playerId });
    }
    return res;
  }, []);

  const salirDeSala = useCallback(() => {
    borrarSesion();
    setSesion(null);
    setSnapshot(null);
    setRondaRevelada(null);
    setFinPartida(null);
    setVotacionActual(null);
    setVotacionRevelada(null);
    setContenidoOraculo(null);
    setPropuestaAlianzaRecibida(null);
    setTesorosAlianza({});
    setDueloTesoro(null);
    setDueloResultado(null);
  }, []);

  const empezarPartida = useCallback((opciones) => emitirConAck("empezar", opciones), []);
  const jugarAccion = useCallback((accion) => emitirConAck("jugar_accion", accion), []);
  const forzarPendientes = useCallback(() => emitirConAck("forzar_pendientes", {}), []);
  const votarPergamino = useCallback((opcion) => emitirConAck("votar_pergamino", { opcion }), []);
  const agregarBot = useCallback(() => emitirConAck("agregar_bot", {}), []);
  const proponerAlianza = useCallback((objetivoId) => emitirConAck("proponer_alianza", { objetivoId }), []);
  const responderAlianza = useCallback((deId, aceptar) => {
    setPropuestaAlianzaRecibida(null);
    return emitirConAck("responder_alianza", { deId, aceptar });
  }, []);
  const romperAlianza = useCallback((objetivoId) => emitirConAck("romper_alianza", { objetivoId }), []);
  const elegirDuelo = useCallback((eleccion) => emitirConAck("elegir_duelo", { eleccion }), []);

  const miJugador = snapshot?.jugadores?.find((j) => j.id === sesion?.playerId) || null;
  const esHost = Boolean(miJugador?.esHost);

  const value = {
    conectado,
    sesion,
    snapshot,
    error,
    setError,
    votacionActual,
    contenidoOraculo,
    votacionRevelada,
    rondaRevelada,
    finPartida,
    propuestaAlianzaRecibida,
    tesorosAlianza,
    alianzaRechazadaId,
    limpiarAlianzaRechazada: () => setAlianzaRechazadaId(null),
    dueloTesoro,
    dueloResultado,
    miJugador,
    esHost,
    crearSala,
    unirseASala,
    salirDeSala,
    empezarPartida,
    jugarAccion,
    forzarPendientes,
    votarPergamino,
    agregarBot,
    proponerAlianza,
    responderAlianza,
    romperAlianza,
    elegirDuelo,
    limpiarRondaRevelada: () => setRondaRevelada(null),
    limpiarVotacionRevelada: () => setVotacionRevelada(null),
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame debe usarse dentro de <GameProvider>");
  return ctx;
}

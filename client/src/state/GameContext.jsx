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
  const intentoReconexion = useRef(false);

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

    socket.on("connect", alConectar);
    socket.on("disconnect", alDesconectar);
    socket.on("snapshot_estado", alSnapshot);
    socket.on("error", alError);
    socket.on("iniciar_votacion", alIniciarVotacion);
    socket.on("contenido_oraculo", alContenidoOraculo);
    socket.on("votacion_revelada", alVotacionRevelada);
    socket.on("ronda_revelada", alRondaRevelada);
    socket.on("fin_partida", alFinPartida);

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
    };
  }, []);

  const crearSala = useCallback(async ({ nombre, icono }) => {
    const res = await emitirConAck("crear_sala", { nombre, icono });
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
  }, []);

  const empezarPartida = useCallback((opciones) => emitirConAck("empezar", opciones), []);
  const jugarAccion = useCallback((accion) => emitirConAck("jugar_accion", accion), []);
  const forzarPendientes = useCallback(() => emitirConAck("forzar_pendientes", {}), []);
  const votarPergamino = useCallback((opcion) => emitirConAck("votar_pergamino", { opcion }), []);

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
    miJugador,
    esHost,
    crearSala,
    unirseASala,
    salirDeSala,
    empezarPartida,
    jugarAccion,
    forzarPendientes,
    votarPergamino,
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

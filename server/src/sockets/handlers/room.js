function unirASalaSocket(socket, sala, jugador) {
  socket.join(sala.code);
  socket.data.roomCode = sala.code;
  socket.data.playerId = jugador.id;
  socket.data.playerToken = jugador.token;
}

export function registrarHandlersSala(io, socket, roomManager) {
  socket.on("crear_sala", (payload, ack) => {
    try {
      const sala = roomManager.crearSala();
      const jugador = sala.agregarJugador({ nombre: payload?.nombre, icono: payload?.icono, socketId: socket.id });
      unirASalaSocket(socket, sala, jugador);
      if (payload?.vsMaquina) {
        const cantidadBots = Math.min(Math.max(Number(payload.cantidadBots) || 2, 1), 7);
        sala.agregarBots(cantidadBots);
      }
      ack?.({
        ok: true,
        roomCode: sala.code,
        playerToken: jugador.token,
        playerId: jugador.id,
        hostToken: sala.estado.hostToken,
      });
      sala.emitirSnapshot();
    } catch (e) {
      ack?.({ ok: false, error: e.message });
    }
  });

  socket.on("unirse", (payload, ack) => {
    const sala = roomManager.obtener(payload?.roomCode);
    if (!sala) {
      ack?.({ ok: false, error: "No existe una sala con ese código." });
      return;
    }

    if (payload?.playerToken) {
      const jugador = sala.reconectar(payload.playerToken, socket.id);
      if (jugador) {
        unirASalaSocket(socket, sala, jugador);
        ack?.({
          ok: true,
          reconectado: true,
          roomCode: sala.code,
          playerToken: jugador.token,
          playerId: jugador.id,
          hostToken: sala.estado.hostToken,
        });
        sala.emitirSnapshot();
        return;
      }
    }

    try {
      const jugador = sala.agregarJugador({ nombre: payload?.nombre, icono: payload?.icono, socketId: socket.id });
      unirASalaSocket(socket, sala, jugador);
      ack?.({
        ok: true,
        roomCode: sala.code,
        playerToken: jugador.token,
        playerId: jugador.id,
        hostToken: sala.estado.hostToken,
      });
      sala.emitirSnapshot();
    } catch (e) {
      ack?.({ ok: false, error: e.message });
    }
  });

  socket.on("agregar_bot", (payload, ack) => {
    const sala = roomManager.obtener(socket.data.roomCode);
    if (!sala) return ack?.({ ok: false, error: "Sala no encontrada." });
    try {
      sala.agregarBotDesdeHost(socket.data.playerToken);
      ack?.({ ok: true });
    } catch (e) {
      ack?.({ ok: false, error: e.message });
      socket.emit("error", { message: e.message });
    }
  });

  socket.on("disconnect", () => {
    const sala = roomManager.obtener(socket.data.roomCode);
    sala?.desconectarSocket(socket.id);
  });
}

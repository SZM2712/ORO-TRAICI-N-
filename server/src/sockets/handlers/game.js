export function registrarHandlersJuego(io, socket, roomManager) {
  socket.on("empezar", (payload, ack) => {
    const sala = roomManager.obtener(socket.data.roomCode);
    if (!sala) return ack?.({ ok: false, error: "Sala no encontrada." });
    try {
      sala.empezar(socket.data.playerToken, payload || {});
      ack?.({ ok: true });
    } catch (e) {
      ack?.({ ok: false, error: e.message });
      socket.emit("error", { message: e.message });
    }
  });

  socket.on("jugar_accion", (payload, ack) => {
    const sala = roomManager.obtener(socket.data.roomCode);
    if (!sala) return ack?.({ ok: false, error: "Sala no encontrada." });
    try {
      sala.jugarAccion(socket.data.playerId, payload);
      ack?.({ ok: true });
    } catch (e) {
      ack?.({ ok: false, error: e.message });
      socket.emit("error", { message: e.message });
    }
  });

  socket.on("forzar_pendientes", (payload, ack) => {
    const sala = roomManager.obtener(socket.data.roomCode);
    if (!sala) return ack?.({ ok: false, error: "Sala no encontrada." });
    try {
      sala.forzarPendientes(socket.data.playerToken);
      ack?.({ ok: true });
    } catch (e) {
      ack?.({ ok: false, error: e.message });
      socket.emit("error", { message: e.message });
    }
  });
}

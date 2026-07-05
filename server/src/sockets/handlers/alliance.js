export function registrarHandlersAlianza(io, socket, roomManager) {
  socket.on("proponer_alianza", (payload, ack) => {
    const sala = roomManager.obtener(socket.data.roomCode);
    if (!sala) return ack?.({ ok: false, error: "Sala no encontrada." });
    try {
      sala.proponerAlianza(socket.data.playerId, Number(payload?.objetivoId));
      ack?.({ ok: true });
    } catch (e) {
      ack?.({ ok: false, error: e.message });
      socket.emit("error", { message: e.message });
    }
  });

  socket.on("responder_alianza", (payload, ack) => {
    const sala = roomManager.obtener(socket.data.roomCode);
    if (!sala) return ack?.({ ok: false, error: "Sala no encontrada." });
    try {
      sala.responderAlianza(socket.data.playerId, Number(payload?.deId), Boolean(payload?.aceptar));
      ack?.({ ok: true });
    } catch (e) {
      ack?.({ ok: false, error: e.message });
      socket.emit("error", { message: e.message });
    }
  });
}

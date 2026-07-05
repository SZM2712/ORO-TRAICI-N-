export function registrarHandlersProfecia(io, socket, roomManager) {
  socket.on("votar_pergamino", (payload, ack) => {
    const sala = roomManager.obtener(socket.data.roomCode);
    if (!sala) return ack?.({ ok: false, error: "Sala no encontrada." });
    try {
      sala.votar(socket.data.playerId, payload?.opcion);
      ack?.({ ok: true });
    } catch (e) {
      ack?.({ ok: false, error: e.message });
      socket.emit("error", { message: e.message });
    }
  });
}

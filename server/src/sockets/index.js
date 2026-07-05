import { registrarHandlersSala } from "./handlers/room.js";
import { registrarHandlersJuego } from "./handlers/game.js";
import { registrarHandlersProfecia } from "./handlers/prophecy.js";

export function registrarSockets(io, roomManager) {
  io.on("connection", (socket) => {
    socket.data.roomCode = null;
    socket.data.playerId = null;
    socket.data.playerToken = null;

    registrarHandlersSala(io, socket, roomManager);
    registrarHandlersJuego(io, socket, roomManager);
    registrarHandlersProfecia(io, socket, roomManager);
  });
}

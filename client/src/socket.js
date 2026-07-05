import { io } from "socket.io-client";

export const URL_SERVIDOR = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

export const socket = io(URL_SERVIDOR, {
  autoConnect: false,
  transports: ["websocket", "polling"],
});

const CLAVE_SESION = "oro_traicion_sesion";

export function guardarSesion({ roomCode, playerToken, playerId }) {
  localStorage.setItem(CLAVE_SESION, JSON.stringify({ roomCode, playerToken, playerId }));
}

export function leerSesion() {
  try {
    const crudo = localStorage.getItem(CLAVE_SESION);
    return crudo ? JSON.parse(crudo) : null;
  } catch {
    return null;
  }
}

export function borrarSesion() {
  localStorage.removeItem(CLAVE_SESION);
}

export function emitirConAck(evento, payload) {
  return new Promise((resolve) => {
    socket.emit(evento, payload, (respuesta) => resolve(respuesta || { ok: false, error: "Sin respuesta del servidor." }));
  });
}

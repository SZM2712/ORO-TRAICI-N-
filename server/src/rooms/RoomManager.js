import { Room } from "./Room.js";
import { generarCodigoSala } from "../utils/ids.js";
import { LIMPIEZA_SALA_MS } from "../config.js";

export class RoomManager {
  constructor(io) {
    this.io = io;
    this.salas = new Map(); // code -> Room
    this.intervaloLimpieza = setInterval(() => this.limpiarInactivas(), 10 * 60 * 1000);
    this.intervaloLimpieza.unref?.();
  }

  crearSala() {
    const code = generarCodigoSala((c) => this.salas.has(c));
    const sala = new Room(code, this.io);
    this.salas.set(code, sala);
    return sala;
  }

  obtener(code) {
    return this.salas.get((code || "").toUpperCase());
  }

  limpiarInactivas() {
    for (const [code, sala] of this.salas.entries()) {
      if (sala.inactiva(LIMPIEZA_SALA_MS)) {
        sala.destruir();
        this.salas.delete(code);
      }
    }
  }
}

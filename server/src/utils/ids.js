import { randomUUID } from "crypto";

const LETRAS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function generarCodigoSala(existe) {
  let codigo;
  do {
    codigo = Array.from({ length: 4 }, () => LETRAS[Math.floor(Math.random() * LETRAS.length)]).join("");
  } while (existe(codigo));
  return codigo;
}

export function generarPlayerToken() {
  return randomUUID();
}

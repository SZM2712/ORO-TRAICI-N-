// Toda la aleatoriedad del juego pasa por estas funciones para poder
// inyectar un `rng` determinista en los tests del motor.

export function elegirAlAzar(lista, rng = Math.random) {
  return lista[Math.floor(rng() * lista.length)];
}

export function barajar(lista, rng = Math.random) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

export function tomarN(lista, n, rng = Math.random) {
  return barajar(lista, rng).slice(0, n);
}

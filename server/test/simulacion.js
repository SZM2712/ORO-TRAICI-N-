// Script de demostración del motor: una partida simulada de 3 jugadores.
// Se corre con: node test/simulacion.js (desde /server)
// Ejercita en orden: construcción fallida por robo, antorcha bloqueada,
// antorcha exitosa y un empate de castillos resuelto en muerte súbita.
import { crearJugador } from "../src/game/state.js";
import { resolverRonda, revisarFinPartida } from "../src/game/GameEngine.js";
import { narrarEventos } from "../src/game/narrativa.js";

const jugadores = [
  crearJugador({ id: 1, token: "t1", nombre: "Ana", icono: "🦁" }),
  crearJugador({ id: 2, token: "t2", nombre: "Beto", icono: "🦊" }),
  crearJugador({ id: 3, token: "t3", nombre: "Cata", icono: "🐺" }),
];
const jugadoresPorId = new Map(jugadores.map((j) => [j.id, j]));

function jugarRonda(numero, acciones, profecia = null) {
  console.log(`\n===== RONDA ${numero} =====`);
  const { eventos } = resolverRonda(jugadores, acciones, profecia);
  for (const frase of narrarEventos(eventos, jugadoresPorId)) console.log(" · " + frase);
  console.log(
    "Estado:",
    jugadores.map((j) => `${j.icono}${j.nombre}: ${j.oro}oro/${j.granjas}granjas(${j.granjasQuemadas}cen)/castillo${j.castillo}${j.muralla ? "/muralla" : ""}`).join("  |  ")
  );
  return eventos;
}

console.log("⚔️  ORO & TRAICIÓN — partida simulada de 3 jugadores ⚔️");

// Ronda 1: Ana intenta construir una granja, pero Beto la asalta primero
// -> el oro se valida DESPUÉS del robo => construcción fallida por robo.
jugarRonda(1, {
  1: { tipo: "construir", item: "granja" },
  2: { tipo: "asaltar", objetivoId: 1, antorcha: false },
  3: { tipo: "cosechar" },
});

// Ronda 2: Ana se defiende; Beto la asalta con antorcha -> bloqueado,
// la antorcha de Beto se gasta en vano (sin incendio).
jugarRonda(2, {
  1: { tipo: "defender" },
  2: { tipo: "asaltar", objetivoId: 1, antorcha: true },
  3: { tipo: "cosechar" },
});

// Ronda 3: Ana ya no se defiende; Cata la asalta con su propia antorcha
// -> asalto exitoso + incendio real (cenizas permanentes).
jugarRonda(3, {
  1: { tipo: "cosechar" },
  2: { tipo: "cosechar" },
  3: { tipo: "asaltar", objetivoId: 1, antorcha: true },
});

// Rondas 4 en adelante: todos cosechan y construyen para avanzar castillos
// (economía normal del motor, sin atajos).
jugarRonda(4, { 1: { tipo: "cosechar" }, 2: { tipo: "cosechar" }, 3: { tipo: "cosechar" } });
jugarRonda(5, { 1: { tipo: "cosechar" }, 2: { tipo: "cosechar" }, 3: { tipo: "cosechar" } });

// Para demostrar el desempate final sin jugar 20 rondas reales, forzamos
// el tramo de cierre: dos jugadores llegan a castillo etapa 3 con el mismo oro.
console.log("\n(Se fuerza el estado para demostrar el tramo final de la partida)");
jugadoresPorId.get(1).castillo = 3;
jugadoresPorId.get(1).oro = 15;
jugadoresPorId.get(2).castillo = 3;
jugadoresPorId.get(2).oro = 15;

let fin = revisarFinPartida(jugadores, 14);
console.log(
  `\nRonda 14: Ana y Beto completan su castillo con ${jugadoresPorId.get(1).oro} oro cada uno ->`,
  fin.terminada ? `gana ${fin.ganadorId}` : "EMPATE EXACTO -> muerte súbita, sigue la partida"
);

// Ronda de muerte súbita: Beto cosecha y se despega en oro.
jugarRonda(15, { 1: { tipo: "cosechar" }, 2: { tipo: "cosechar" }, 3: { tipo: "cosechar" } }, null);
fin = revisarFinPartida(jugadores, 15);
console.log(
  `\nRonda 15 (muerte súbita): ` + (fin.terminada ? `🏆 ¡Gana el jugador #${fin.ganadorId}!` : "sigue empatado, otra ronda más...")
);

console.log("\nSimulación completa.");

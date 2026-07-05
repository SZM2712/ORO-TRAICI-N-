import { test } from "node:test";
import assert from "node:assert/strict";
import { crearJugador } from "../src/game/state.js";
import {
  resolverRonda,
  revisarFinPartida,
  determinarLider,
  existeAlianza,
  agregarAlianza,
  resolverTraiciones,
} from "../src/game/GameEngine.js";

function tresJugadores() {
  return [
    crearJugador({ id: 1, token: "t1", nombre: "Ana", icono: "🦁" }),
    crearJugador({ id: 2, token: "t2", nombre: "Beto", icono: "🦊" }),
    crearJugador({ id: 3, token: "t3", nombre: "Cata", icono: "🐺" }),
  ];
}

test("cosecha básica: 2 + 1 por granja", () => {
  const [j1, j2, j3] = tresJugadores();
  const { eventos } = resolverRonda([j1, j2, j3], { 1: { tipo: "cosechar" }, 2: { tipo: "cosechar" }, 3: { tipo: "cosechar" } });
  assert.equal(j1.oro, 5 + 3);
  assert.ok(eventos.some((e) => e.tipo === "cosecha" && e.jugadorId === 1 && e.cantidad === 3));
});

test("construcción fallida por robo: el asalto se resuelve antes que la compra", () => {
  const [j1, j2, j3] = tresJugadores();
  const acciones = {
    1: { tipo: "construir", item: "granja" }, // cuesta 3, J1 empieza con 5 de oro
    2: { tipo: "asaltar", objetivoId: 1, antorcha: false },
    3: { tipo: "cosechar" },
  };
  const { eventos } = resolverRonda([j1, j2, j3], acciones);

  assert.equal(j1.oro, 2, "5 de oro - 3 robados = 2, no le alcanza para la granja");
  assert.equal(j1.granjas, 1, "la granja NO se construyó");
  assert.equal(j2.oro, 8, "5 + 3 robados");
  assert.ok(eventos.some((e) => e.tipo === "construccion_fallida" && e.jugadorId === 1 && e.costo === 3 && e.oroDisponible === 2));
});

test("antorcha bloqueada por un defensor: se gasta en vano, sin incendio", () => {
  const [j1, j2, j3] = tresJugadores();
  const acciones = {
    1: { tipo: "defender" },
    2: { tipo: "asaltar", objetivoId: 1, antorcha: true },
    3: { tipo: "cosechar" },
  };
  const { eventos } = resolverRonda([j1, j2, j3], acciones);

  assert.equal(j2.antorchaUsada, true, "la antorcha se consume aunque falle");
  assert.equal(j1.granjasQuemadas, 0, "no hubo incendio: el ataque fue bloqueado");
  assert.equal(j2.oro, 5 - 2, "pagó 2 de tributo por ser bloqueado");
  assert.equal(j1.oro, 5 + 2 + 1, "recibió el tributo (2) + el bono de defensor (1)");
  assert.ok(eventos.some((e) => e.tipo === "antorcha_desperdiciada"));
  assert.ok(!eventos.some((e) => e.tipo === "incendio"));
});

test("antorcha exitosa: incendia una granja cuando el asalto no es bloqueado", () => {
  const [j1, j2, j3] = tresJugadores();
  const acciones = {
    1: { tipo: "cosechar" },
    2: { tipo: "asaltar", objetivoId: 1, antorcha: true },
    3: { tipo: "cosechar" },
  };
  const { eventos } = resolverRonda([j1, j2, j3], acciones);

  assert.equal(j2.antorchaUsada, true);
  assert.equal(j1.granjas, 0, "la única granja se quemó");
  assert.equal(j1.granjasQuemadas, 1, "queda como ceniza permanente");
  assert.ok(eventos.some((e) => e.tipo === "incendio" && e.objetivoId === 1));
});

test("tregua sagrada: los asaltos fallan y la antorcha NO se consume", () => {
  const [j1, j2, j3] = tresJugadores();
  const acciones = {
    1: { tipo: "cosechar" },
    2: { tipo: "asaltar", objetivoId: 1, antorcha: true },
    3: { tipo: "cosechar" },
  };
  const oroJ1Antes = j1.oro;
  const { eventos } = resolverRonda([j1, j2, j3], acciones, { id: "tregua_sagrada" });

  assert.equal(j2.antorchaUsada, false, "la tregua conserva la antorcha para más adelante");
  assert.equal(j1.granjas, 1);
  assert.equal(j1.oro, oroJ1Antes + 3, "J1 solo recibió su cosecha, ningún robo");
  assert.ok(eventos.some((e) => e.tipo === "asalto_bloqueado_profecia"));
});

test("cosecha dorada duplica y tormenta negra reduce a la mitad (redondeo abajo)", () => {
  const [j1] = tresJugadores();
  j1.granjas = 2; // base = 2 + 1*2 = 4
  const dorada = resolverRonda([j1], { 1: { tipo: "cosechar" } }, { id: "cosecha_dorada" });
  assert.ok(dorada.eventos.some((e) => e.tipo === "cosecha" && e.cantidad === 8));

  const [j2] = tresJugadores();
  j2.granjas = 1; // base = 2 + 1 = 3 -> mitad = 1 (piso)
  const tormenta = resolverRonda([j2], { 1: { tipo: "cosechar" } }, { id: "tormenta_negra" });
  assert.ok(tormenta.eventos.some((e) => e.tipo === "cosecha" && e.cantidad === 1));
});

test("traición en la corte: el líder no puede bloquear esta ronda", () => {
  const [j1, j2, j3] = tresJugadores();
  j1.castillo = 2; // líder indiscutido
  const acciones = {
    1: { tipo: "defender" },
    2: { tipo: "asaltar", objetivoId: 1, antorcha: false },
    3: { tipo: "cosechar" },
  };
  const { eventos } = resolverRonda([j1, j2, j3], acciones, { id: "traicion_corte", leaderId: 1 });

  assert.equal(j1.oro, 5 - 3 + 1, "lo asaltaron con éxito (perdió 3) y aun así cobra su bono de defensor (1)");
  assert.equal(j2.oro, 5 + 3);
  assert.ok(eventos.some((e) => e.tipo === "asalto_exitoso" && e.objetivoId === 1));
  assert.ok(eventos.some((e) => e.tipo === "defensa" && e.liderSinBloqueo === true));
});

test("muralla reduce el robo de 3 a 2", () => {
  const [j1, j2] = tresJugadores();
  j1.muralla = true;
  const { eventos } = resolverRonda([j1, j2], { 1: { tipo: "cosechar" }, 2: { tipo: "asaltar", objetivoId: 1, antorcha: false } });
  assert.equal(j1.oro, 5 - 2 + 3, "robo reducido a 2, más su cosecha de 3");
  assert.ok(eventos.some((e) => e.tipo === "asalto_exitoso" && e.robo === 2 && e.muralla === true));
});

test("ambición del trono: el atacante con castillo etapa 2+ roba el doble", () => {
  const [j1, j2] = tresJugadores();
  j1.oro = 10; // suficiente oro para no toparse con el límite del robo
  j2.castillo = 2; // j2 es quien asalta, con la corona
  const { eventos } = resolverRonda([j1, j2], { 1: { tipo: "cosechar" }, 2: { tipo: "asaltar", objetivoId: 1, antorcha: false } });
  assert.equal(j1.oro, 10 - 6 + 3, "le robaron el doble (6) en vez de 3, y aun así cosechó 3");
  assert.equal(j2.oro, 5 + 6);
  assert.ok(eventos.some((e) => e.tipo === "asalto_exitoso" && e.robo === 6 && e.ambicioso === true));
});

test("ambición del trono: no aplica si el atacante todavía no llegó a etapa 2", () => {
  const [j1, j2] = tresJugadores();
  j1.castillo = 2; // la víctima tiene la corona, pero el ATACANTE no
  const { eventos } = resolverRonda([j1, j2], { 1: { tipo: "cosechar" }, 2: { tipo: "asaltar", objetivoId: 1, antorcha: false } });
  assert.ok(eventos.some((e) => e.tipo === "asalto_exitoso" && e.robo === 3 && e.ambicioso === false));
});

test("fin de partida: empate exacto en castillo completo -> muerte súbita, luego se desempata", () => {
  const [j1, j2, j3] = tresJugadores();
  j1.castillo = 3;
  j1.oro = 10;
  j2.castillo = 3;
  j2.oro = 10;
  j3.castillo = 1;

  const empatado = revisarFinPartida([j1, j2, j3], 15);
  assert.equal(empatado.terminada, false);
  assert.equal(empatado.sueteMuerte, true);

  j1.oro = 12; // una ronda más de muerte súbita desempata
  const decidido = revisarFinPartida([j1, j2, j3], 16);
  assert.equal(decidido.terminada, true);
  assert.equal(decidido.ganadorId, 1);
});

test("límite de 20 rondas: gana mayor puntaje (etapas*100 + oro)", () => {
  const [j1, j2, j3] = tresJugadores();
  j1.castillo = 2;
  j1.oro = 50; // score 250
  j2.castillo = 2;
  j2.oro = 10; // score 210
  j3.castillo = 0;
  j3.oro = 3;

  const resultado = revisarFinPartida([j1, j2, j3], 20);
  assert.equal(resultado.terminada, true);
  assert.equal(resultado.ganadorId, 1);
});

test("determinarLider: castillo más avanzado, desempate por oro", () => {
  const [j1, j2, j3] = tresJugadores();
  j1.castillo = 1;
  j2.castillo = 2;
  j2.oro = 20;
  j3.castillo = 2;
  j3.oro = 5;
  const lider = determinarLider([j1, j2, j3]);
  assert.equal(lider.id, 2);
});

test("agregarAlianza: no duplica un par ya existente, en cualquier orden", () => {
  let alianzas = agregarAlianza([], 2, 1);
  assert.deepEqual(alianzas, [[1, 2]]);
  alianzas = agregarAlianza(alianzas, 1, 2);
  assert.deepEqual(alianzas, [[1, 2]], "no debe duplicar el mismo par");
  assert.ok(existeAlianza(alianzas, 1, 2));
  assert.ok(existeAlianza(alianzas, 2, 1));
  assert.ok(!existeAlianza(alianzas, 1, 3));
});

test("resolverTraiciones: asaltar a un aliado rompe la alianza y se marca como traición", () => {
  const alianzas = [[1, 2], [1, 3]];
  const acciones = {
    1: { tipo: "asaltar", objetivoId: 2 },
    2: { tipo: "cosechar" },
    3: { tipo: "defender" },
  };
  const { traiciones, alianzasRestantes } = resolverTraiciones(alianzas, acciones);
  assert.deepEqual(traiciones, [{ tipo: "traicion_aliado", atacanteId: 1, objetivoId: 2 }]);
  assert.deepEqual(alianzasRestantes, [[1, 3]], "la alianza 1-2 se rompe, la 1-3 sigue en pie");
});

test("resolverTraiciones: sin asaltos entre aliados, todas las alianzas siguen intactas", () => {
  const alianzas = [[1, 2]];
  const acciones = { 1: { tipo: "cosechar" }, 2: { tipo: "asaltar", objetivoId: 3 }, 3: { tipo: "defender" } };
  const { traiciones, alianzasRestantes } = resolverTraiciones(alianzas, acciones);
  assert.deepEqual(traiciones, []);
  assert.deepEqual(alianzasRestantes, [[1, 2]]);
});

test("asalto en pinza: dos aliados asaltando al mismo objetivo se llevan un bono cada uno", () => {
  const [j1, j2, j3] = tresJugadores();
  const alianzas = [[1, 2]];
  const acciones = {
    1: { tipo: "asaltar", objetivoId: 3, antorcha: false },
    2: { tipo: "asaltar", objetivoId: 3, antorcha: false },
    3: { tipo: "cosechar" },
  };
  const { eventos } = resolverRonda([j1, j2, j3], acciones, null, alianzas);

  const asaltoJ1 = eventos.find((e) => e.tipo === "asalto_exitoso" && e.atacanteId === 1);
  const asaltoJ2 = eventos.find((e) => e.tipo === "asalto_exitoso" && e.atacanteId === 2);
  assert.equal(asaltoJ1.enPinza, true);
  assert.equal(asaltoJ1.robo, 4, "3 de robo normal * 1.5 de bono en pinza, redondeado abajo");
  assert.equal(asaltoJ2.enPinza, true);
  assert.equal(asaltoJ2.robo, 1, "solo queda 1 de oro en la víctima tras el primer asalto");
  assert.equal(j3.oro, 5 - 4 - 1 + 3, "perdió 5 en total y cosechó 3");
});

test("asalto en pinza: no aplica si los dos atacantes no son aliados entre sí", () => {
  const [j1, j2, j3] = tresJugadores();
  const acciones = {
    1: { tipo: "asaltar", objetivoId: 3, antorcha: false },
    2: { tipo: "asaltar", objetivoId: 3, antorcha: false },
    3: { tipo: "cosechar" },
  };
  const { eventos } = resolverRonda([j1, j2, j3], acciones, null, []);
  assert.ok(eventos.every((e) => e.tipo !== "asalto_exitoso" || e.enPinza === false));
});

test("envío de oro entre aliados: se descuenta de uno y se suma al otro", () => {
  const [j1, j2, j3] = tresJugadores();
  const alianzas = [[1, 2]];
  const acciones = {
    1: { tipo: "enviar_oro", objetivoId: 2, cantidad: 3 },
    2: { tipo: "cosechar" },
    3: { tipo: "cosechar" },
  };
  const { eventos } = resolverRonda([j1, j2, j3], acciones, null, alianzas);
  assert.equal(j1.oro, 5 - 3, "envió 3 y no cosechó (eligió enviar oro en vez de cosechar)");
  assert.equal(j2.oro, 5 + 3 + 3, "recibió 3 y además cosechó 3");
  assert.ok(eventos.some((e) => e.tipo === "envio_oro" && e.jugadorId === 1 && e.objetivoId === 2 && e.cantidad === 3));
});

test("envío de oro falla si ya no son aliados", () => {
  const [j1, j2, j3] = tresJugadores();
  const acciones = { 1: { tipo: "enviar_oro", objetivoId: 3, cantidad: 3 }, 2: { tipo: "cosechar" }, 3: { tipo: "cosechar" } };
  const { eventos } = resolverRonda([j1, j2, j3], acciones, null, []);
  assert.equal(j1.oro, 5, "el envío no se concreta, no pierde el oro");
  assert.ok(eventos.some((e) => e.tipo === "envio_oro_fallido" && e.jugadorId === 1));
});

test("envío de oro se limita al oro disponible tras los robos de la misma ronda", () => {
  const [j1, j2, j3] = tresJugadores();
  const alianzas = [[1, 2]];
  const acciones = {
    1: { tipo: "enviar_oro", objetivoId: 2, cantidad: 10 },
    2: { tipo: "cosechar" },
    3: { tipo: "asaltar", objetivoId: 1, antorcha: false },
  };
  const { eventos } = resolverRonda([j1, j2, j3], acciones, null, alianzas);
  assert.equal(j1.oro, 0, "le robaron 3 (quedó con 2) y mandó los 2 que le quedaban");
  assert.equal(j2.oro, 5 + 2 + 3, "recibió 2 (no los 10 pedidos) y cosechó 3");
  assert.ok(eventos.some((e) => e.tipo === "envio_oro" && e.cantidad === 2));
});

test("defensa conjunta: dos aliados que defienden la misma ronda ganan un bono extra", () => {
  const [j1, j2, j3] = tresJugadores();
  const alianzas = [[1, 2]];
  const acciones = { 1: { tipo: "defender" }, 2: { tipo: "defender" }, 3: { tipo: "cosechar" } };
  const { eventos } = resolverRonda([j1, j2, j3], acciones, null, alianzas);
  assert.equal(j1.oro, 5 + 2, "bono normal (1) + bono de defensa conjunta (1)");
  assert.equal(j2.oro, 5 + 2);
  assert.ok(eventos.some((e) => e.tipo === "defensa" && e.jugadorId === 1 && e.conjunta === true && e.bono === 2));
});

test("defensa conjunta: no aplica si el aliado no también defendió", () => {
  const [j1, j2, j3] = tresJugadores();
  const alianzas = [[1, 2]];
  const acciones = { 1: { tipo: "defender" }, 2: { tipo: "cosechar" }, 3: { tipo: "cosechar" } };
  const { eventos } = resolverRonda([j1, j2, j3], acciones, null, alianzas);
  assert.equal(j1.oro, 5 + 1, "solo el bono normal de defensor");
  assert.ok(eventos.some((e) => e.tipo === "defensa" && e.jugadorId === 1 && e.conjunta === false && e.bono === 1));
});

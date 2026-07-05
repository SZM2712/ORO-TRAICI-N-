// Mazo de 10 profecías. `inmediata:true` = se aplica al revelarse el pergamino ganador,
// antes de la fase de acciones. Las demás son modificadores que el GameEngine usa
// durante la resolución de esa ronda (cosecha, construcción, asaltos, bloqueo).
export const MAZO_PROFECIAS = [
  {
    id: "cosecha_dorada",
    icono: "🌟",
    nombre: "Cosecha Dorada",
    texto: "Las cosechas de esta ronda rinden el doble.",
    favorable: true,
    inmediata: false,
  },
  {
    id: "piedad_rey",
    icono: "🎁",
    nombre: "Piedad del Rey",
    texto: "El jugador más pobre recibe 4 de oro al iniciar la ronda.",
    favorable: true,
    inmediata: true,
  },
  {
    id: "gremio_constructores",
    icono: "🛠️",
    nombre: "Gremio de Constructores",
    texto: "Toda construcción cuesta 2 menos esta ronda (mínimo 1).",
    favorable: true,
    inmediata: false,
  },
  {
    id: "tregua_sagrada",
    icono: "🕊️",
    nombre: "Tregua Sagrada",
    texto: "Todos los asaltos fallan esta ronda (sin robo ni tributo; la antorcha no se consume).",
    favorable: true,
    inmediata: false,
  },
  {
    id: "caravana_perdida",
    icono: "🐫",
    nombre: "Caravana Perdida",
    texto: "Un jugador al azar recibe 5 de oro.",
    favorable: true,
    inmediata: true,
  },
  {
    id: "peste_tesoreria",
    icono: "🐀",
    nombre: "Peste en la Tesorería",
    texto: "El más rico pierde 3 de oro al iniciar la ronda.",
    favorable: false,
    inmediata: true,
  },
  {
    id: "tormenta_negra",
    icono: "⛈️",
    nombre: "Tormenta Negra",
    texto: "Las cosechas de esta ronda rinden la mitad (redondeo hacia abajo).",
    favorable: false,
    inmediata: false,
  },
  {
    id: "rayo_cielo",
    icono: "⚡",
    nombre: "Rayo del Cielo",
    texto: "Se incendia una granja de un jugador al azar que tenga 2+ granjas.",
    favorable: false,
    inmediata: true,
  },
  {
    id: "impuesto_guerra",
    icono: "💸",
    nombre: "Impuesto de Guerra",
    texto: "Todos pagan 2 de oro a la corona.",
    favorable: false,
    inmediata: true,
  },
  {
    id: "traicion_corte",
    icono: "🐍",
    nombre: "Traición en la Corte",
    texto: "El líder (castillo más avanzado; desempate por oro) no puede bloquear esta ronda.",
    favorable: false,
    inmediata: false,
  },
  {
    id: "rebelion_popular",
    icono: "🔥👑",
    nombre: "Rebelión Popular",
    texto: "El pueblo se cansa de la ambición del líder: pierde una etapa de su castillo al iniciar la ronda.",
    favorable: false,
    inmediata: true,
  },
];

export function profeciaPorId(id) {
  return MAZO_PROFECIAS.find((p) => p.id === id);
}

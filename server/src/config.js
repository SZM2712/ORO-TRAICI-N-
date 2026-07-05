export const PUERTO = process.env.PORT || 3001;
export const ORIGEN_CLIENTE = process.env.CLIENT_ORIGIN || "http://localhost:5173";

export const MIN_JUGADORES = 3;
export const MAX_JUGADORES = 8;

export const ORO_INICIAL = 5;
export const GRANJAS_INICIALES = 1;

export const COSECHA_BASE = 2;
export const COSECHA_POR_GRANJA = 1;

export const COSTO_GRANJA = 3;
export const MAX_GRANJAS = 4;

export const COSTO_MURALLA = 5;
export const COSTO_ORACULO = 4;
export const COSTOS_CASTILLO = [7, 9, 11]; // etapa 1, 2, 3

export const ROBO_NORMAL = 3;
export const ROBO_CON_MURALLA = 2;
export const TRIBUTO_BLOQUEO = 2;
export const BONUS_DEFENDER = 1;

// Ambición del Trono: quien tenga el castillo en esta etapa o superior asalta
// con el doble de robo — un beneficio real para el líder, a propósito, para
// que el resto tenga una razón concreta para unirse contra él.
export const ETAPA_AMBICION = 2;
export const MULTIPLICADOR_AMBICION = 2;

// Asalto en pinza: si dos aliados asaltan al mismo objetivo en la misma
// ronda, ambos se llevan un botín extra — le da a las alianzas un propósito
// ofensivo (coordinarse contra un tercero), no solo defensivo.
export const MULTIPLICADOR_PINZA = 1.5;

// Defensa conjunta: si dos aliados defienden en la misma ronda, ambos ganan
// un poco más de oro que defendiendo solos.
export const BONUS_DEFENSA_CONJUNTA = 1;

// Tesoro compartido de una alianza: el botín de cada asalto en pinza no va
// al oro visible de cada atacante, sino a un fondo oculto de la alianza que
// crece un poco cada ronda que la alianza se mantiene en pie.
export const INTERES_TESORO_ALIANZA = 0.1;

// Minijuego al romper una alianza por traición: quien fue traicionado tiene
// más chances de quedarse con todo el tesoro compartido, como compensación.
export const PROBABILIDAD_TRAICIONADO_GANA_TESORO = 0.6;

export const LIMITE_RONDAS = 20;
export const RONDAS_PROFECIA = [1, 5, 10];
export const TIEMPO_VOTACION_MS = 30_000;

export const TIEMPOS_RONDA = { sin_limite: null, 60: 60_000, 30: 30_000 };

export const LIMPIEZA_SALA_MS = 2 * 60 * 60 * 1000; // 2 horas de inactividad

export const ANIMALES = ["🦁", "🦊", "🐺", "🐻", "🐯", "🦉", "🐗", "🦅", "🐢", "🐍"];

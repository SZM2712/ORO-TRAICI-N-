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

export const LIMITE_RONDAS = 20;
export const RONDAS_PROFECIA = [1, 5, 10];
export const TIEMPO_VOTACION_MS = 30_000;

export const TIEMPOS_RONDA = { sin_limite: null, 60: 60_000, 30: 30_000 };

export const LIMPIEZA_SALA_MS = 2 * 60 * 60 * 1000; // 2 horas de inactividad

export const ANIMALES = ["🦁", "🦊", "🐺", "🐻", "🐯", "🦉", "🐗", "🦅", "🐢", "🐍"];

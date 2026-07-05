import { useCallback, useEffect, useRef, useState } from "react";
import { Howl } from "howler";

// Sonidos cortos opcionales, servidos desde client/public/sounds/ (no desde
// src/) para que sobrevivan al build de producción, no solo al dev server.
// Si algún archivo no existe todavía, Howler simplemente falla en silencio y
// el juego sigue funcionando sin audio.
const ARCHIVOS = {
  moneda: "/sounds/moneda.mp3",
  espadas: "/sounds/espadas.mp3",
  fuego: "/sounds/fuego.mp3",
  fanfarria: "/sounds/fanfarria.mp3",
  mensaje: "/sounds/mensaje.mp3",
};

const RUTA_MUSICA_FONDO = "/sounds/musica-fondo.mp3";
const VOLUMEN_MUSICA = 0.22;
const CLAVE_MUTE = "oro_traicion_mute";

// La música de fondo es una única instancia global (no una por hook): así
// cualquier pantalla puede iniciarla/detenerla/mutearla sin tener que
// sincronizar estado entre múltiples llamadas a useSonidos().
let musicaFondo = null;
function obtenerMusicaFondo() {
  if (!musicaFondo) {
    musicaFondo = new Howl({ src: [RUTA_MUSICA_FONDO], loop: true, volume: 0, onloaderror: () => {} });
  }
  return musicaFondo;
}

export function iniciarMusica() {
  const m = obtenerMusicaFondo();
  m.mute(localStorage.getItem(CLAVE_MUTE) === "1");
  if (!m.playing()) {
    m.play();
    m.fade(0, VOLUMEN_MUSICA, 1200);
  }
}

export function detenerMusica() {
  if (!musicaFondo?.playing()) return;
  musicaFondo.fade(VOLUMEN_MUSICA, 0, 800);
  setTimeout(() => musicaFondo?.stop(), 850);
}

export function useSonidos() {
  const howls = useRef({});
  const [silenciado, setSilenciado] = useState(() => localStorage.getItem(CLAVE_MUTE) === "1");

  useEffect(() => {
    for (const [nombre, src] of Object.entries(ARCHIVOS)) {
      howls.current[nombre] = new Howl({ src: [src], volume: 0.5, onloaderror: () => {} });
    }
    return () => {
      Object.values(howls.current).forEach((h) => h.unload());
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(CLAVE_MUTE, silenciado ? "1" : "0");
    obtenerMusicaFondo().mute(silenciado);
  }, [silenciado]);

  const reproducir = useCallback(
    (nombre) => {
      if (silenciado) return;
      howls.current[nombre]?.play();
    },
    [silenciado]
  );

  const alternarMute = useCallback(() => setSilenciado((s) => !s), []);

  return { reproducir, silenciado, alternarMute };
}

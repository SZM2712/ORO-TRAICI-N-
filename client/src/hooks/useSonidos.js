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

const CLAVE_MUTE = "oro_traicion_mute";

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

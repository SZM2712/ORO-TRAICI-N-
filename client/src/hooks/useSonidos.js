import { useCallback, useEffect, useRef, useState } from "react";
import { Howl } from "howler";

// Sonidos cortos opcionales. Si los archivos no existen todavía (los agrega
// el usuario en /assets/sounds), Howler simplemente falla en silencio y el
// juego sigue funcionando sin audio.
const ARCHIVOS = {
  moneda: "/src/assets/sounds/moneda.mp3",
  espadas: "/src/assets/sounds/espadas.mp3",
  fuego: "/src/assets/sounds/fuego.mp3",
  fanfarria: "/src/assets/sounds/fanfarria.mp3",
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

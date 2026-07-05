import React, { useEffect } from "react";
import { useGame } from "./state/GameContext.jsx";
import InicioScreen from "./screens/InicioScreen.jsx";
import LobbyScreen from "./screens/LobbyScreen.jsx";
import JuegoScreen from "./screens/JuegoScreen.jsx";
import VictoriaScreen from "./screens/VictoriaScreen.jsx";
import ErrorToast from "./components/ErrorToast.jsx";
import { iniciarMusica, detenerMusica } from "./hooks/useSonidos.js";

export default function App() {
  const { sesion, snapshot, conectado } = useGame();

  // Música de fondo en loop mientras haya una partida abierta (lobby, en
  // curso o pantalla final); se detiene al volver a la pantalla de inicio.
  const enPartida = Boolean(sesion && snapshot);
  useEffect(() => {
    if (enPartida) iniciarMusica();
    else detenerMusica();
  }, [enPartida]);

  let pantalla;
  if (!sesion || !snapshot) {
    pantalla = <InicioScreen />;
  } else if (snapshot.fase === "lobby") {
    pantalla = <LobbyScreen />;
  } else if (snapshot.fase === "fin") {
    pantalla = <VictoriaScreen />;
  } else {
    pantalla = <JuegoScreen />;
  }

  return (
    <div className="min-h-screen w-full max-w-[480px] mx-auto flex flex-col relative">
      {!conectado && sesion && (
        <div className="bg-sangre/90 text-crema text-center text-xs py-1 font-mono tracking-wide">
          Reconectando con el reino…
        </div>
      )}
      {pantalla}
      <ErrorToast />
    </div>
  );
}

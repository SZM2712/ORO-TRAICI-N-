import React, { useEffect, useState } from "react";
import { useGame } from "../state/GameContext.jsx";
import Aldea from "../components/Aldea.jsx";
import AldeaMiniatura from "../components/AldeaMiniatura.jsx";
import PanelAcciones from "../components/PanelAcciones.jsx";
import BarraCastilloGlobal from "../components/BarraCastilloGlobal.jsx";
import IndicadorSellado from "../components/IndicadorSellado.jsx";
import CronicaReino from "../components/CronicaReino.jsx";
import AlertaPanico from "../components/AlertaPanico.jsx";
import ModalRevelacion from "../components/ModalRevelacion.jsx";
import ModalVotacionPergaminos from "../components/ModalVotacionPergaminos.jsx";
import BotonMute from "../components/BotonMute.jsx";
import { useSonidos } from "../hooks/useSonidos.js";

export default function JuegoScreen() {
  const {
    snapshot,
    miJugador,
    votacionActual,
    contenidoOraculo,
    votacionRevelada,
    rondaRevelada,
    finPartida,
    jugarAccion,
    votarPergamino,
    forzarPendientes,
    esHost,
    limpiarRondaRevelada,
    limpiarVotacionRevelada,
    setError,
  } = useGame();
  const { reproducir, silenciado, alternarMute } = useSonidos();

  const [borrador, setBorrador] = useState({ tipo: null });
  const [enviando, setEnviando] = useState(false);
  const [alertaPanico, setAlertaPanico] = useState(null);

  useEffect(() => {
    setBorrador({ tipo: null });
  }, [snapshot.ronda, snapshot.fase]);

  useEffect(() => {
    if (snapshot.fase !== "profecia") limpiarVotacionRevelada();
  }, [snapshot.fase]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!rondaRevelada) return;
    const tipos = new Set(rondaRevelada.eventos.map((e) => e.tipo));
    if (tipos.has("asalto_exitoso") || tipos.has("asalto_bloqueado")) reproducir("espadas");
    if (tipos.has("incendio")) reproducir("fuego");
    if (tipos.has("cosecha")) reproducir("moneda");
    const panico = rondaRevelada.eventos.find((e) => e.tipo === "alerta_panico");
    if (panico) {
      const jugador = snapshot.jugadores.find((j) => j.id === panico.jugadorId);
      setAlertaPanico(jugador ? { ...jugador, _t: Date.now() } : null);
    }
  }, [rondaRevelada]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!miJugador) return <div className="flex-1 flex items-center justify-center text-crema/50">Cargando aldea…</div>;

  const rivales = snapshot.jugadores.filter((j) => j.id !== miJugador.id);

  const alTocarRival = (jugador) => {
    if (borrador.tipo !== "asaltar" || miJugador.selloJugada) return;
    setBorrador((b) => ({ ...b, objetivoId: jugador.id }));
  };

  const onSellar = async () => {
    setEnviando(true);
    const res = await jugarAccion(borrador);
    setEnviando(false);
    if (!res.ok) setError(res.error);
  };

  const onVotar = async (opcion) => {
    const res = await votarPergamino(opcion);
    if (!res.ok) setError(res.error);
  };

  const mostrandoModalProfecia = Boolean(votacionActual || votacionRevelada);

  return (
    <div className="flex-1 flex flex-col gap-4 px-4 py-4 pb-8">
      <header className="flex items-center justify-between">
        <div className="text-xs font-mono text-crema/50">
          Sala {snapshot.code} · Ronda {snapshot.ronda}
          {snapshot.sueteMuerte && <span className="text-sangre"> · MUERTE SÚBITA</span>}
        </div>
        <div className="flex items-center gap-2">
          {esHost && snapshot.fase !== "revelacion" && (
            <button onClick={() => forzarPendientes()} className="text-[10px] font-mono text-crema/40 underline">
              forzar pendientes
            </button>
          )}
          <BotonMute silenciado={silenciado} alternarMute={alternarMute} />
        </div>
      </header>

      <BarraCastilloGlobal jugadores={snapshot.jugadores} />

      {snapshot.profeciaActiva && (
        <div className="bg-acero/15 border border-acero/40 rounded-lg px-3 py-2 text-xs text-acero text-center">
          🔮 {snapshot.profeciaActiva.icono} <strong>{snapshot.profeciaActiva.nombre}</strong>: {snapshot.profeciaActiva.texto}
        </div>
      )}

      <section>
        <p className="text-[10px] uppercase tracking-widest text-crema/40 font-mono mb-1">Tu aldea</p>
        <div className="bg-panel/60 rounded-xl p-3 border border-white/10">
          <Aldea
            granjas={miJugador.granjas}
            quemadas={miJugador.granjasQuemadas}
            muralla={miJugador.muralla}
            castillo={miJugador.castillo}
          />
          <div className="flex items-center justify-around mt-2 text-sm font-mono text-oro">
            <span>💰 {miJugador.oro}</span>
            <span>🌾 {miJugador.granjas}</span>
            <span>🏰 {miJugador.castillo}/3</span>
            {miJugador.muralla && <span>🧱</span>}
            {miJugador.torreOraculo && <span>🔮</span>}
          </div>
        </div>
      </section>

      <section>
        <p className="text-[10px] uppercase tracking-widest text-crema/40 font-mono mb-1">Aldeas rivales</p>
        <div className="grid grid-cols-2 gap-2">
          {rivales.map((j) => (
            <AldeaMiniatura
              key={j.id}
              jugador={j}
              seleccionado={borrador.objetivoId === j.id}
              onClick={() => alTocarRival(j)}
              deshabilitado={borrador.tipo !== "asaltar" || miJugador.selloJugada}
            />
          ))}
        </div>
      </section>

      <IndicadorSellado jugadores={snapshot.jugadores} />

      <PanelAcciones
        miJugador={miJugador}
        profeciaActiva={snapshot.profeciaActiva}
        borrador={borrador}
        setBorrador={setBorrador}
        onSellar={onSellar}
        sellado={Boolean(miJugador.selloJugada)}
        enviando={enviando}
      />

      <CronicaReino historial={snapshot.historial} />

      {alertaPanico && <AlertaPanico jugador={alertaPanico} />}

      {mostrandoModalProfecia && (
        <ModalVotacionPergaminos
          votacionActual={votacionActual}
          contenidoOraculo={contenidoOraculo}
          votacionRevelada={votacionRevelada}
          jugadores={snapshot.jugadores}
          onVotar={onVotar}
        />
      )}

      {!mostrandoModalProfecia && !finPartida && (
        <ModalRevelacion rondaRevelada={rondaRevelada} onCerrar={limpiarRondaRevelada} />
      )}
    </div>
  );
}

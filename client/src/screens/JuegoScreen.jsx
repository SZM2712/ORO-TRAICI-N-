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
import ModalPropuestaAlianza from "../components/ModalPropuestaAlianza.jsx";
import BotonMute from "../components/BotonMute.jsx";
import { useSonidos } from "../hooks/useSonidos.js";
import { ETAPA_AMBICION } from "../utils/format.js";

export default function JuegoScreen() {
  const {
    snapshot,
    miJugador,
    votacionActual,
    contenidoOraculo,
    votacionRevelada,
    rondaRevelada,
    finPartida,
    propuestaAlianzaRecibida,
    tesorosAlianza,
    alianzaRechazadaId,
    limpiarAlianzaRechazada,
    jugarAccion,
    votarPergamino,
    forzarPendientes,
    proponerAlianza,
    responderAlianza,
    romperAlianza,
    esHost,
    limpiarRondaRevelada,
    limpiarVotacionRevelada,
    setError,
  } = useGame();
  const { reproducir, silenciado, alternarMute } = useSonidos();

  const [borrador, setBorrador] = useState({ tipo: null });
  const [enviando, setEnviando] = useState(false);
  const [alertaPanico, setAlertaPanico] = useState(null);
  const [propuestasEnviadas, setPropuestasEnviadas] = useState(new Set());

  useEffect(() => {
    setBorrador({ tipo: null });
  }, [snapshot.ronda, snapshot.fase]);

  useEffect(() => {
    setPropuestasEnviadas(new Set());
  }, [snapshot.ronda]);

  useEffect(() => {
    if (alianzaRechazadaId == null) return;
    setPropuestasEnviadas((prev) => {
      const copia = new Set(prev);
      copia.delete(alianzaRechazadaId);
      return copia;
    });
    limpiarAlianzaRechazada();
  }, [alianzaRechazadaId]); // eslint-disable-line react-hooks/exhaustive-deps

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
  const misAliadosIds = new Set(
    (snapshot.alianzas || [])
      .filter(([a, b]) => a === miJugador.id || b === miJugador.id)
      .map(([a, b]) => (a === miJugador.id ? b : a))
  );
  const apuntandoAAliado = borrador.tipo === "asaltar" && borrador.objetivoId && misAliadosIds.has(borrador.objetivoId);
  const objetivoAsalto = rivales.find((r) => r.id === borrador.objetivoId);
  const objetivoEsAmbicioso = borrador.tipo === "asaltar" && Boolean(objetivoAsalto && objetivoAsalto.castillo >= ETAPA_AMBICION);

  const alTocarRival = (jugador) => {
    if (miJugador.selloJugada) return;
    if (borrador.tipo === "asaltar") {
      const esAmbicioso = jugador.castillo >= ETAPA_AMBICION;
      setBorrador((b) => ({ ...b, objetivoId: jugador.id, asedio: esAmbicioso ? b.asedio : false }));
    } else if ((borrador.tipo === "enviar_oro" || borrador.tipo === "defender") && misAliadosIds.has(jugador.id)) {
      setBorrador((b) => ({ ...b, objetivoId: jugador.id }));
    }
  };

  const alProponerAlianza = async (objetivoId) => {
    setPropuestasEnviadas((prev) => new Set(prev).add(objetivoId));
    const res = await proponerAlianza(objetivoId);
    if (!res.ok) {
      setError(res.error);
      setPropuestasEnviadas((prev) => {
        const copia = new Set(prev);
        copia.delete(objetivoId);
        return copia;
      });
    }
  };

  const alRomperAlianza = async (objetivoId) => {
    const res = await romperAlianza(objetivoId);
    if (!res.ok) setError(res.error);
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
        <div className={`bg-panel/60 rounded-xl p-3 border ${miJugador.castillo >= ETAPA_AMBICION ? "border-oro/60" : "border-white/10"}`}>
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
          {miJugador.castillo >= ETAPA_AMBICION && (
            <p className="text-[10px] text-oro text-center mt-1">👑 Asaltás con el doble de botín — pero todos van a ir por vos.</p>
          )}
        </div>
      </section>

      <section>
        <p className="text-[10px] uppercase tracking-widest text-crema/40 font-mono mb-1">Aldeas rivales</p>
        <div className="grid grid-cols-2 gap-2">
          {rivales.map((j) => {
            const esAliado = misAliadosIds.has(j.id);
            const propuestaEnviada = propuestasEnviadas.has(j.id);
            const tesoro = tesorosAlianza[j.id] || 0;
            return (
              <div key={j.id} className="flex flex-col gap-1">
                <AldeaMiniatura
                  jugador={j}
                  seleccionado={borrador.objetivoId === j.id}
                  onClick={() => alTocarRival(j)}
                  deshabilitado={
                    miJugador.selloJugada ||
                    (borrador.tipo === "asaltar"
                      ? false
                      : borrador.tipo === "enviar_oro" || borrador.tipo === "defender"
                      ? !esAliado
                      : true)
                  }
                  esAliado={esAliado}
                  tesoro={esAliado ? tesoro : 0}
                />
                {snapshot.fase === "accion" && !esAliado && !miJugador.selloJugada && (
                  <button
                    onClick={() => alProponerAlianza(j.id)}
                    disabled={propuestaEnviada}
                    className="text-[10px] rounded-lg py-1 border border-acero/50 text-acero disabled:opacity-40 disabled:text-crema/40 active:scale-95"
                  >
                    {propuestaEnviada ? "Propuesta enviada…" : "🤝 Proponer alianza"}
                  </button>
                )}
                {snapshot.fase === "accion" && esAliado && (
                  <button
                    onClick={() => alRomperAlianza(j.id)}
                    className="text-[10px] rounded-lg py-1 border border-sangre/50 text-sangre active:scale-95"
                  >
                    💔 Romper alianza
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <IndicadorSellado jugadores={snapshot.jugadores} />

      {apuntandoAAliado && (
        <p className="text-xs text-sangre text-center -mt-2">⚠️ Es tu aliado: asaltarlo rompe la alianza y queda marcado como traición.</p>
      )}

      <PanelAcciones
        miJugador={miJugador}
        profeciaActiva={snapshot.profeciaActiva}
        borrador={borrador}
        setBorrador={setBorrador}
        onSellar={onSellar}
        sellado={Boolean(miJugador.selloJugada)}
        enviando={enviando}
        hayAliados={misAliadosIds.size > 0}
        objetivoEsAmbicioso={objetivoEsAmbicioso}
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

      <ModalPropuestaAlianza propuesta={propuestaAlianzaRecibida} onResponder={responderAlianza} />
    </div>
  );
}

import React, { useEffect, useRef, useState } from "react";
import { useGame } from "../state/GameContext.jsx";
import MapaReino from "../components/MapaReino.jsx";
import FichaAldea from "../components/FichaAldea.jsx";
import PanelAcciones from "../components/PanelAcciones.jsx";
import BarraCastilloGlobal from "../components/BarraCastilloGlobal.jsx";
import IndicadorSellado from "../components/IndicadorSellado.jsx";
import CronicaReino from "../components/CronicaReino.jsx";
import AlertaPanico from "../components/AlertaPanico.jsx";
import ModalRevelacion from "../components/ModalRevelacion.jsx";
import ModalVotacionPergaminos from "../components/ModalVotacionPergaminos.jsx";
import ModalPropuestaAlianza from "../components/ModalPropuestaAlianza.jsx";
import ModalDueloTesoro from "../components/ModalDueloTesoro.jsx";
import PanelChatAlianza from "../components/PanelChatAlianza.jsx";
import BotonMute from "../components/BotonMute.jsx";
import ModalTutorial from "../components/ModalTutorial.jsx";
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
    dueloTesoro,
    dueloResultado,
    elegirDuelo,
    mensajesAlianza,
    enviarMensajeAlianza,
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
  const [fichaSeleccionadaId, setFichaSeleccionadaId] = useState(null);
  const [mostrarTutorial, setMostrarTutorial] = useState(false);

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

  const cantidadMensajesAnterior = useRef(0);
  useEffect(() => {
    const nuevos = mensajesAlianza.slice(cantidadMensajesAnterior.current);
    cantidadMensajesAnterior.current = mensajesAlianza.length;
    if (miJugador && nuevos.some((m) => m.deId !== miJugador.id)) reproducir("mensaje");
  }, [mensajesAlianza]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const puedeElegirComoObjetivo = (jugador) => {
    if (miJugador.selloJugada) return false;
    if (borrador.tipo === "asaltar") return true;
    if (borrador.tipo === "enviar_oro" || borrador.tipo === "defender") return misAliadosIds.has(jugador.id);
    return false;
  };

  // Tocar cualquier aldea en el mapa siempre la abre en la ficha de abajo
  // (para poder inspeccionarla); si además es un objetivo válido para la
  // acción en curso, también la marca como objetivo.
  const alSeleccionarAldea = (jugador) => {
    setFichaSeleccionadaId(jugador.id);
    if (jugador.id === miJugador.id || !puedeElegirComoObjetivo(jugador)) return;
    if (borrador.tipo === "asaltar") {
      const esAmbicioso = jugador.castillo >= ETAPA_AMBICION;
      setBorrador((b) => ({ ...b, objetivoId: jugador.id, asedio: esAmbicioso ? b.asedio : false }));
    } else {
      setBorrador((b) => ({ ...b, objetivoId: jugador.id }));
    }
  };

  const jugadorFicha = snapshot.jugadores.find((j) => j.id === fichaSeleccionadaId) || miJugador;

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

  const alEnviarMensajeAlianza = async (plantillaId, objetivoId, paraId) => {
    const res = await enviarMensajeAlianza(plantillaId, objetivoId, paraId);
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
          <button onClick={() => setMostrarTutorial(true)} className="text-xs text-acero font-mono" aria-label="Cómo jugar">
            ❓
          </button>
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
        <p className="text-[10px] uppercase tracking-widest text-crema/40 font-mono mb-1">Mapa del reino</p>
        <MapaReino
          jugadores={snapshot.jugadores}
          miId={miJugador.id}
          alianzas={snapshot.alianzas || []}
          misAliadosIds={misAliadosIds}
          tesorosAlianza={tesorosAlianza}
          seleccionadoId={jugadorFicha.id}
          objetivoId={borrador.objetivoId}
          onSeleccionar={alSeleccionarAldea}
          puedeElegir={puedeElegirComoObjetivo}
        />
      </section>

      <FichaAldea
        jugador={jugadorFicha}
        esYo={jugadorFicha.id === miJugador.id}
        esAliado={misAliadosIds.has(jugadorFicha.id)}
        tesoro={tesorosAlianza[jugadorFicha.id] || 0}
        propuestaEnviada={propuestasEnviadas.has(jugadorFicha.id)}
        puedeProponer={snapshot.fase === "accion" && !misAliadosIds.has(jugadorFicha.id) && !miJugador.selloJugada}
        puedeRomper={snapshot.fase === "accion" && misAliadosIds.has(jugadorFicha.id)}
        onProponer={alProponerAlianza}
        onRomper={alRomperAlianza}
      />

      <PanelChatAlianza
        aliados={rivales.filter((r) => misAliadosIds.has(r.id))}
        rivales={rivales.filter((r) => !misAliadosIds.has(r.id))}
        mensajes={mensajesAlianza}
        miJugadorId={miJugador.id}
        onEnviar={alEnviarMensajeAlianza}
      />

      <IndicadorSellado jugadores={snapshot.jugadores} />

      {apuntandoAAliado && (
        <p className="text-xs text-sangre text-center -mt-2">
          ⚠️ Es tu aliado: asaltarlo rompe la alianza y queda marcado como traición.{" "}
          {tesorosAlianza[borrador.objetivoId] > 0
            ? `Se van a disputar a piedra, papel o tijera los ${tesorosAlianza[borrador.objetivoId]} de oro del tesoro secreto.`
            : "Todavía no tienen tesoro secreto en común (hace falta un asalto en pinza antes), así que no hay nada que disputar."}
        </p>
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
      <ModalDueloTesoro
        dueloTesoro={dueloTesoro}
        dueloResultado={dueloResultado}
        jugadores={snapshot.jugadores}
        onElegir={elegirDuelo}
      />
      {mostrarTutorial && <ModalTutorial onCerrar={() => setMostrarTutorial(false)} />}
    </div>
  );
}

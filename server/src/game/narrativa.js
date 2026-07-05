const NOMBRE_ITEM = {
  granja: "una Granja 🌾",
  muralla: "una Muralla 🧱",
  oraculo: "la Torre del Oráculo 🔮",
  castillo: "una etapa del Castillo 🏰",
};

function tag(j) {
  return `${j.icono} ${j.nombre}`;
}

// Convierte los eventos estructurados del motor en frases dramáticas en español.
// Se genera en el servidor porque es quien conoce nombre/ícono de cada jugador
// y evita duplicar esa lógica de narración en el cliente.
export function narrarEventos(eventos, jugadoresPorId) {
  const frases = [];
  for (const ev of eventos) {
    const j = (id) => jugadoresPorId.get(id);
    switch (ev.tipo) {
      case "asalto_exitoso":
        frases.push(
          `${tag(j(ev.atacanteId))} asaltó a ${tag(j(ev.objetivoId))} y robó ${ev.robo} de oro${
            ev.muralla ? " (la muralla amortiguó el golpe)" : ""
          }${ev.ambicioso ? " 👑 (¡su ambición por el trono duplicó el botín!)" : ""}${
            ev.enPinza ? " 🤝⚔️ (asalto en pinza junto a su aliado: botín extra)" : ""
          }.`
        );
        break;
      case "incendio":
        frases.push(`🔥 ¡Y le incendió una granja a ${tag(j(ev.objetivoId))}!`);
        break;
      case "antorcha_sin_objetivo":
        frases.push(`🔥 La antorcha de ${tag(j(ev.atacanteId))} no encontró granjas que quemar.`);
        break;
      case "asalto_bloqueado":
        frases.push(
          `🛡️ ${tag(j(ev.objetivoId))} bloqueó el asalto de ${tag(j(ev.atacanteId))}, que pagó ${ev.tributo} de tributo.`
        );
        break;
      case "antorcha_desperdiciada":
        frases.push(`🔥 La antorcha de ${tag(j(ev.atacanteId))} se apagó contra el escudo — se gastó en vano.`);
        break;
      case "asalto_bloqueado_profecia":
        frases.push(`🕊️ La Tregua Sagrada frenó el asalto de ${tag(j(ev.atacanteId))} a ${tag(j(ev.objetivoId))}.`);
        break;
      case "construccion_exitosa":
        frases.push(
          `🔨 ${tag(j(ev.jugadorId))} construyó ${NOMBRE_ITEM[ev.item]}${
            ev.item === "castillo" ? ` (etapa ${ev.nuevaEtapaCastillo})` : ""
          } por ${ev.costo} de oro.`
        );
        break;
      case "construccion_fallida":
        frases.push(
          `💔 ${tag(j(ev.jugadorId))} quiso construir ${NOMBRE_ITEM[ev.item]} pero el oro no le alcanzó tras los asaltos (tenía ${
            ev.oroDisponible
          }, necesitaba ${ev.costo}).`
        );
        break;
      case "construccion_invalida":
        frases.push(`⚠️ ${tag(j(ev.jugadorId))} intentó una construcción que ya no era posible.`);
        break;
      case "cosecha":
        frases.push(`🌾 ${tag(j(ev.jugadorId))} cosechó ${ev.cantidad} de oro.`);
        break;
      case "defensa":
        frases.push(
          `🛡️ ${tag(j(ev.jugadorId))} se atrincheró y ganó ${ev.bono} de oro${
            ev.conjunta ? " 🤝 (defensa conjunta con su aliado)" : ""
          }${ev.liderSinBloqueo ? " (¡pero la Traición en la Corte le impidió bloquear!)" : ""}.`
        );
        break;
      case "profecia_piedad_rey":
        frases.push(`🎁 La Piedad del Rey le dio ${ev.cantidad} de oro al más pobre: ${tag(j(ev.jugadorId))}.`);
        break;
      case "profecia_peste":
        frases.push(`🐀 La Peste en la Tesorería le quitó ${ev.cantidad} de oro al más rico: ${tag(j(ev.jugadorId))}.`);
        break;
      case "profecia_caravana":
        frases.push(`🐫 Una Caravana Perdida le regaló ${ev.cantidad} de oro a ${tag(j(ev.jugadorId))}.`);
        break;
      case "profecia_rayo":
        frases.push(`⚡ El Rayo del Cielo incendió una granja de ${tag(j(ev.jugadorId))}.`);
        break;
      case "profecia_rayo_sin_efecto":
        frases.push(`⚡ El Rayo del Cielo buscó una aldea con 2+ granjas... y no encontró ninguna.`);
        break;
      case "profecia_impuesto":
        frases.push(`💸 ${tag(j(ev.jugadorId))} pagó ${ev.cantidad} de oro de Impuesto de Guerra.`);
        break;
      case "profecia_traicion":
        frases.push(`🐍 La Traición en la Corte marcó a ${tag(j(ev.jugadorId))} como líder: no podrá bloquear esta ronda.`);
        break;
      case "envio_oro":
        frases.push(`🎁 ${tag(j(ev.jugadorId))} le envió ${ev.cantidad} de oro a su aliado ${tag(j(ev.objetivoId))}.`);
        break;
      case "envio_oro_fallido":
        frases.push(`💔 ${tag(j(ev.jugadorId))} quiso enviarle oro a un aliado, pero la alianza ya no existe.`);
        break;
      case "traicion_aliado":
        frases.push(`🗡️💔 ¡TRAICIÓN! ${tag(j(ev.atacanteId))} rompió su alianza con ${tag(j(ev.objetivoId))} y lo asaltó.`);
        break;
      case "alerta_panico":
        frases.push(`🚨 ¡El castillo de ${tag(j(ev.jugadorId))} llegó a la etapa 2!`);
        break;
      default:
        break;
    }
  }
  return frases;
}

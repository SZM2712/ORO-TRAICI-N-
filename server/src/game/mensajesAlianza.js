// Chat entre aliados: mensajes rápidos y fijos (no texto libre) para poder
// coordinar ataques conjuntos sin depender de moderación de contenido. El
// texto final siempre lo arma el servidor, nunca el cliente.
export const PLANTILLAS_MENSAJE_ALIANZA = {
  atacar_juntos: (objetivoNombre) => `⚔️ ¿Atacamos juntos a ${objetivoNombre}?`,
  defender_ronda: () => "🛡️ Yo defiendo esta ronda.",
  necesito_oro: () => "💰 Necesito oro, ¿me ayudás?",
  no_atacar: () => "🤝 No me ataques, seguimos aliados.",
  construyendo: () => "🏗️ Estoy construyendo, cúbranme.",
  cuidado_traicion: () => "⚠️ Cuidado, alguien nos puede traicionar.",
};

// Solo esta plantilla necesita un objetivo (un rival, no un aliado).
export const PLANTILLA_REQUIERE_OBJETIVO = "atacar_juntos";

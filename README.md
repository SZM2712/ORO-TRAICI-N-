# ORO & TRAICIÓN: La Era de las Aldeas ⚔️🏰

Juego de estrategia psicológica por rondas simultáneas para 3–8 jugadores, jugado desde el celular. Cada jugador construye su aldea en secreto, asalta a sus rivales y vota profecías a ciegas — gana quien primero complete su castillo.

Este juego convive en el mismo repositorio que el sitio estático de la Quiniela Mundial 2026 (`index.html`, `css/`, `js/` en la raíz), pero es un proyecto totalmente independiente dentro de `/client` y `/server`.

## Estructura del proyecto

```
/client   → React + Vite + Tailwind (frontend, mobile-first)
/server   → Node + Express + Socket.IO (backend autoritativo, en memoria)
```

El servidor es la única fuente de verdad: calcula el estado, resuelve las rondas y decide toda la aleatoriedad (sorteo de profecías, desempates, votos automáticos). El cliente solo envía intenciones y pinta lo que el servidor le manda.

## Requisitos

- Node.js 18+ (se probó con Node 22)
- npm 9+

## Desarrollo local

Desde la raíz del repo:

```bash
npm install        # instala client + server (usa npm workspaces)
npm run dev         # levanta server (puerto 3001) y client (puerto 5173) juntos
```

Abrí `http://localhost:5173` en varias pestañas o celulares de la misma red (usando la IP de tu máquina) para simular varios jugadores.

Variables de entorno:

- `client/.env` → `VITE_SERVER_URL=http://localhost:3001` (o la URL pública del backend)
- `server/.env` → `PORT=3001`, `CLIENT_ORIGIN=http://localhost:5173` (podés poner varios orígenes separados por coma)

Copiá los `.env.example` de cada carpeta como punto de partida.

### Scripts útiles

| Comando | Qué hace |
|---|---|
| `npm run dev` | Corre client y server en paralelo (concurrently) |
| `npm run dev:server` | Solo el backend, con `--watch` |
| `npm run dev:client` | Solo el frontend (Vite) |
| `npm run build` | Build de producción del cliente |
| `npm run test` | Corre los tests del motor (`server/test`) |

## Verificar el motor del juego

El motor de reglas (`server/src/game/GameEngine.js`) es puro y determinista: dado un estado de jugadores y las acciones de la ronda, siempre resuelve igual. Se puede probar sin levantar sockets ni React.

```bash
cd server
npm test                 # suite de tests (node --test): 11 casos, incluye
                          # construcción fallida por robo, antorcha bloqueada,
                          # antorcha exitosa, tregua sagrada, traición en la
                          # corte, muralla, empate de castillos y límite de rondas.

node test/simulacion.js  # partida simulada narrada de 3 jugadores por consola
```

## Assets SVG

La carpeta `client/src/assets/svg/` está lista para recibir los 15 archivos finales:

```
aldea-fondo.svg, granja.svg, granja-fuego.svg, granja-cenizas.svg, muralla.svg,
castillo-etapa1.svg, castillo-etapa2.svg, castillo-etapa3.svg, moneda.svg,
antorcha.svg, escudo.svg, corona.svg, pergamino-sellado.svg,
pergamino-abierto.svg, torre-oraculo.svg
```

Mientras tanto, `client/src/components/Aldea.jsx` dibuja un placeholder con **la misma API** que van a usar los SVG definitivos:

```jsx
<Aldea granjas={n} quemadas={n} muralla={bool} castillo={0|1|2|3} fuego={bool} noche={bool} />
```

Cuando tengas los archivos, soltalos en `assets/svg/`, descomentá los imports en `assets/svg/index.js` y reemplazá el contenido de `Aldea.jsx` por las capas reales — el resto de la UI no necesita cambios.

## Sonidos

`client/src/hooks/useSonidos.js` ya está listo para reproducirlos; si el archivo no existe todavía, falla en silencio y el juego sigue andando sin audio. Van en `client/public/sounds/` —no en `src/`, para que el build de producción los sirva igual que en desarrollo— (formato mp3):

| Archivo | Cuándo suena | Estilo sugerido | Duración |
|---|---|---|---|
| `moneda.mp3` | Al cosechar oro | Tintineo de monedas, ligero (suena seguido) | ~0.3–0.6s |
| `espadas.mp3` | Al asaltar (exitoso o bloqueado) | Choque de espadas, contundente | ~0.4–0.8s |
| `fuego.mp3` | Al incendiar una granja (antorcha) | Crepitar de fuego / whoosh | ~0.5–1s |
| `fanfarria.mp3` | Al terminar la partida | Fanfarria triunfal, una sola vez | ~2–4s |
| `mensaje.mp3` | Al recibir un mensaje del chat de aliados | Notificación corta y sutil | ~0.2–0.4s |
| `musica-fondo.mp3` | Música ambiente en loop mientras hay una partida abierta (lobby, juego o pantalla final) | Medieval instrumental (laúd/cuerdas), que cierre en loop sin corte brusco | sin límite fijo, pensada para repetirse |

Ya están cargados los 5 efectos y la música de fondo grabados por el equipo.

## Reglas implementadas (resumen)

- Estado inicial: 5 de oro, 1 granja, sin muralla, castillo etapa 0.
- Acciones secretas por ronda: Cosechar 🌾, Construir 🔨, Asaltar ⚔️ (con antorcha 🔥 opcional, una vez por partida), Defender 🛡️, Enviar oro 🎁 (solo a un aliado).
- Orden de resolución fijo: defensores → asaltos/incendios → envíos de oro entre aliados → construcciones (el oro se valida **después** de los robos) → cosechas → +1 al defensor (+1 extra si el aliado también defendió).
- **Revelación animada (`ModalRevelacion.jsx`):** los eventos de la ronda ya no aparecen todos juntos en una lista — se muestran de a uno, con los íconos de los jugadores involucrados y una mini escena animada en el medio (⚔️ asalto, 🛡️ bloqueo, 🔥 incendio, 🔨 construcción, etc.), sonido incluido. Los resultados de combate (asalto exitoso/bloqueado, asedio) tienen una breve "tirada" visual (el ícono titila entre ⚔️ y 🛡️ antes de asentarse) — puro teatro, el resultado ya está decidido en el servidor, es solo para darle suspenso al momento de revelarlo. Hay una barra de progreso, un botón "Siguiente" para avanzar manualmente y un "Saltar todo" para quienes prefieren ver la lista completa de una.
- **Indicador de sellado con tensión:** mientras un jugador no selló su jugada, `IndicadorSellado.jsx` le anima tres puntitos tipo "escribiendo…" en vez de mostrar directamente el candado, para que la espera se sienta menos vacía.
- Profecías en las rondas 1, 5 y 10: 3 pergaminos sellados A/B/C, votación a ciegas de 30 s, mayoría gana (empate al azar del servidor), los dueños de la Torre del Oráculo ven el contenido real en privado.
- Fin de partida: castillo etapa 3 completo gana; empate exacto → muerte súbita; límite de 20 rondas → gana mayor puntaje (`etapas×100 + oro`), empate en la cima → muerte súbita.
- Reconexión: el cliente guarda `{roomCode, playerToken}` en `localStorage` y se reincorpora con su estado intacto al reconectar.
- Anti-bloqueo: tiempo por ronda configurable por el anfitrión (sin límite / 60 s / 30 s) y botón de "forzar pendientes".
- Salas en memoria, se limpian solas tras 2 h de inactividad (no hay base de datos).
- **Mapa del Reino:** todas las aldeas (la tuya incluida) se muestran juntas como fichas sobre un mapa ilustrado (`MapaReino.jsx`), en posiciones fijas por cantidad de jugadores en vez de en una grilla de tarjetas. El terreno es una escena en capas dibujada a mano en SVG —cielo estrellado con luna, montañas y colinas con sombreado en gradiente, un río con brillo animado, bosques y rocas, una rosa de los vientos y un marco tipo pergamino con viñeta en los bordes— sin depender de ningún asset externo. Las alianzas vigentes se dibujan como líneas doradas animadas ("marcha de hormigas") entre las aldeas conectadas, visibles para todos (no solo las tuyas). Las fichas son medallones con degradé, sombra propia y un brillo pulsante para quien tiene la Ambición del Trono o está seleccionado/marcado como objetivo. Tocar cualquier ficha —la propia o una rival— la abre en una ficha de detalle debajo del mapa (`FichaAldea.jsx`) con la ilustración de la aldea, sus estadísticas y, si es un rival, los botones de proponer/romper alianza; si además hay una acción en curso (Asaltar, Defender, Enviar oro) que la acepte como objetivo, tocarla también la marca como tal.
- **Alianzas:** durante la fase de acción, cualquier jugador puede tocar "🤝 Proponer alianza" en la tarjeta de un rival; si el otro acepta (confirmación en tiempo real, no espera al cierre de la ronda), quedan aliados — visible para toda la sala en la Crónica del Reino y con una insignia "🤝 aliado" en las tarjetas. Cada alianza es un vínculo bilateral independiente: un jugador puede tener varias a la vez con distintos rivales (útil en partidas de 5+ jugadores para armar bandos), sin que eso obligue a que esos aliados lo sean también entre sí. Tener una alianza da varios beneficios reales mientras dura:
  - **Asalto en pinza + tesoro oculto (con camarillas):** si dos o más aliados mutuos asaltan al mismo objetivo en la misma ronda, el botín de esa pinza (con el bono `MULTIPLICADOR_PINZA`, 1.5×, ya incluido) no va al oro visible de nadie — se acumula oculto en un solo tesoro compartido del grupo (no fragmentado en pares), visible solo para sus miembros (evento privado `tesoro_alianza`, badge "🔒💰" en la tarjeta). Si los atacantes no son todos mutuamente aliados entre sí, se agrupan en la mayor camarilla completa posible y el resto ataca solo. Ese tesoro crece un `INTERES_TESORO_ALIANZA` (10%) cada ronda que el grupo se mantenga íntegro.
  - **Defender a un aliado:** "Defender" puede apuntar a un aliado en vez de a vos mismo — lo protege a ÉL de asaltos esta ronda, pero vos quedás expuesto (es un sacrificio, no un bono gratis). Si los dos se autodefienden la misma ronda (defensa conjunta), ambos ganan `BONUS_DEFENSA_CONJUNTA` de oro extra.
  - **Envío de oro:** acción secreta "🎁 Enviar oro" para transferirle parte de tu oro a un aliado (se resuelve después de los robos y antes de las construcciones, así lo puede usar esa misma ronda). Si la alianza se rompió esa ronda, el envío falla y el oro no sale de tu bolsillo.
  - **Chat de aliados 💬:** panel colapsable con mensajes rápidos predefinidos (no texto libre, para no depender de moderación de contenido) — "Defiendo esta ronda", "Necesito oro", "No me ataques", "Estoy construyendo", "Cuidado, traición" y "¿Atacamos juntos a X?" (con selector de rival) para coordinar una pinza. Un selector "Para:" deja elegir si el mensaje va a todos tus aliados actuales o a uno puntual (privado, no le llega al resto) — así se distingue con quién estás hablando cuando tenés varias alianzas a la vez; cada mensaje en el feed muestra "→ nombre" cuando fue dirigido. Si el panel está cerrado, un contador de no leídos aparece junto al título y se limpia al abrirlo; los mensajes de otros también reproducen un sonido corto (clave `mensaje` en `useSonidos`).
  - **Romper un vínculo:** rompe solo esa relación puntual (el resto de tus alianzas sigue en pie), de dos formas, con consecuencias distintas para cualquier tesoro compartido que dependiera de esa confianza mutua. En ambas, un `PORCENTAJE_TESORO_AL_REY` (20%) del tesoro se pierde como impuesto a la corona antes de repartir el resto — el precio de romper el pacto:
    - **Formal** ("💔 Romper alianza", disponible en cualquier momento de la fase de acción): descontado el impuesto, el resto se reparte por igual entre todos los miembros del tesoro afectado (2 en un par, más en una camarilla) y se anuncia en la crónica.
    - **Por traición** (uno asalta al otro): el vínculo se rompe en el acto, marcado como traición ("🗡️💔 ¡TRAICIÓN!"). Si el tesoro afectado era de un par, no se lo queda automáticamente quien atacó primero: se juega en vivo un duelo de piedra, papel o tijera entre los dos ex aliados (modal `elegir_duelo`, con demora simulada si es un bot y un failsafe de `DUELO_ELECCION_TIMEOUT_MS` que elige al azar si alguien no responde a tiempo); en caso de empate se repite el duelo hasta que haya un ganador, que se lleva el resto completo. Si el tesoro era de una camarilla de 3 o más, el traidor queda excluido del reparto como penalización: el resto de los miembros se divide el resto en partes iguales, sin minijuego.
- **Ambición del Trono:** quien tenga el castillo en etapa 2 o 3 asalta con el doble de botín (👑, ver `ETAPA_AMBICION`/`MULTIPLICADOR_AMBICION` en `config.js`) mientras se mantenga ahí — un beneficio real y a propósito para el líder, para darle al resto una razón concreta (envidia, miedo) para unirse contra él antes de que termine su castillo. La alerta de "castillo en etapa 2" ahora avisa explícitamente de esto, y las tarjetas de todos los jugadores muestran la corona mientras dure.
- **Robar castillos:** hay dos formas de bajarle una etapa de castillo a otro jugador (nunca te la quedás vos, solo lo debilita):
  - **Asedio 🏰💥:** al asaltar a alguien con el castillo en etapa 2 o más, podés marcar la opción "Asedio" — es de una sola vez por partida (como la antorcha). Si el asalto no es bloqueado, además del robo normal, el objetivo pierde una etapa de castillo. Si te bloquean, el asedio se gasta en vano igual.
  - **Rebelión Popular (profecía) 🔥👑:** nueva carta del mazo de profecías; al salir sorteada, el líder (castillo más avanzado del momento) pierde una etapa de castillo al iniciar la ronda, sin que nadie tenga que gastar su asedio.
- **Modo de prueba contra la máquina:** en la pantalla de inicio se elige el total de jugadores (3 a 8, vos incluido) y el botón "🤖 Probar contra la máquina" crea la sala con esa cantidad de bots (`CPU ...`) para poder probar el juego sin necesitar más gente. Los bots juegan, votan y también proponen/responden alianzas solos con una IA simple (prioriza construir, prefiere no traicionar a un aliado salvo que no tenga otro objetivo), con una demora aleatoria de 1–3 s para que se sienta natural.
- **Bots en salas normales:** también desde el lobby de una sala creada con "Crear Sala" (con gente real), el anfitrión puede tocar "🤖 Agregar bot" las veces que quiera mientras la sala no esté llena, para completar el mínimo de 3 jugadores o sumar rivales extra sin depender de que se una más gente.
- **Tutorial (`ModalTutorial.jsx`):** un carrusel de 6 pasos (objetivo, acciones por ronda, alianzas, traición, profecías, mapa) que aparece solo la primera vez que alguien entra al lobby (guardado en `localStorage`, clave `oro_traicion_tutorial_visto`) y se puede reabrir en cualquier momento con el botón "❓ Cómo jugar" del lobby o de la pantalla de juego.

## Despliegue

### Todo en Render (recomendado): un solo Blueprint

Este repo trae `render.yaml` en la raíz, que define los dos servicios (backend + frontend) de una:

1. En [Render](https://dashboard.render.com), **New +** → **Blueprint**.
2. Conectá tu cuenta de GitHub y elegí este repo (`SZM2712/ORO-TRAICI-N-`).
3. Render lee `render.yaml` solo y te propone crear:
   - `oro-y-traicion-server` (Web Service, Node, carpeta `server/`)
   - `oro-y-traicion-client` (Static Site, carpeta `client/`, build con Vite)
4. Click en **Apply** — listo, quedan las dos URLs públicas (`https://oro-y-traicion-server.onrender.com` y `https://oro-y-traicion-client.onrender.com`) ya conectadas entre sí (`CLIENT_ORIGIN` y `VITE_SERVER_URL` vienen precargadas en el YAML).

> Si Render te avisa que alguno de esos dos nombres ya está tomado por otra cuenta, te asigna uno con sufijo random — en ese caso hay que entrar a **Settings → Environment** de cada servicio y actualizar `CLIENT_ORIGIN` (en el server) y `VITE_SERVER_URL` (en el client) con las URLs reales, y volver a desplegar.

> El plan gratuito de Render "duerme" el backend tras 15 min de inactividad: la primera conexión después de un rato puede tardar unos segundos en despertar — es normal.

### Alternativa: backend en Fly.io + frontend en Netlify

Si preferís repartir los servicios en otras plataformas:

**Backend (Fly.io):** `fly launch` desde `/server`, exponiendo el puerto de `PORT`, y `fly secrets set CLIENT_ORIGIN=https://tu-juego.netlify.app`.

**Frontend (Netlify):**
1. Nuevo sitio desde este repo, *Base directory*: `client`.
2. Build command: `npm run build` — Publish directory: `client/dist`.
3. Variable de entorno `VITE_SERVER_URL` con la URL pública del backend.
4. El archivo `client/public/_redirects` ya está listo para que las rutas del SPA funcionen en Netlify.

Con eso, cualquiera puede entrar desde su celular a la URL de Netlify, crear o unirse a una sala con el código de 4 letras, y jugar en tiempo real.

## Eventos de Socket.IO

| Evento | Dirección | Descripción |
|---|---|---|
| `crear_sala` | cliente → servidor | Crea una sala nueva (ack con `roomCode`, `playerToken`, `playerId`). Con `{ vsMaquina: true, cantidadBots }` agrega bots automáticos a la sala |
| `unirse` | cliente → servidor | Se une a una sala, o se reconecta si manda `playerToken` |
| `agregar_bot` | cliente → servidor | El anfitrión agrega un bot más a la sala (solo en el lobby) |
| `empezar` | cliente → servidor | El anfitrión inicia la partida |
| `jugar_accion` | cliente → servidor | Envía la jugada secreta de la ronda |
| `forzar_pendientes` | cliente → servidor | El anfitrión fuerza a los jugadores pendientes (Cosechar / voto al azar) |
| `votar_pergamino` | cliente → servidor | Voto secreto por A, B o C |
| `proponer_alianza` | cliente → servidor | Propone una alianza a otro jugador (solo en fase de acción) |
| `responder_alianza` | cliente → servidor | Acepta o rechaza una propuesta de alianza recibida |
| `romper_alianza` | cliente → servidor | Rompe un vínculo de alianza formalmente (reparte por igual el tesoro afectado, menos el impuesto a la corona, solo en fase de acción) |
| `elegir_duelo` | cliente → servidor | Elige piedra, papel o tijera en un duelo pendiente por el tesoro de un par traicionado |
| `mensaje_alianza` | cliente → servidor | Envía un mensaje rápido predefinido; sin `paraId` va a todos tus aliados actuales, con `paraId` es privado para ese aliado puntual (y opcionalmente con un rival como `objetivoId`, para "¿Atacamos juntos?") |
| `snapshot_estado` | servidor → sala | Estado público completo (nunca incluye jugadas/votos secretos ajenos, ni tesoros), incluye `alianzas` |
| `alianza_propuesta` | servidor → jugador (privado) | Notifica al destinatario de una propuesta de alianza |
| `alianza_rechazada` | servidor → jugador (privado) | Avisa al proponente que su propuesta fue rechazada |
| `tesoro_alianza` | servidor → miembros del grupo (privado) | Monto total del tesoro compartido vigente con ese aliado (mismo monto para todo el grupo si son 3+), tras un asalto en pinza o el interés de la ronda |
| `mensaje_alianza` | servidor → destinatarios (privado) | Mensaje rápido de chat recibido: quién lo mandó, el texto ya armado y `paraId`/`paraNombre` si fue dirigido a un aliado puntual (`null` si fue a todos) |
| `duelo_tesoro_iniciado` | servidor → los 2 ex aliados (privado) | Arranca el duelo de piedra/papel/tijera por el tesoro de una alianza rota por traición |
| `duelo_tesoro_empate` | servidor → sala | Empate en el duelo — se repite automáticamente |
| `duelo_tesoro_resuelto` | servidor → sala | Resultado del duelo: ganador, perdedor, premio, impuesto a la corona y elección de cada uno |
| `iniciar_votacion` | servidor → sala | Arranca la votación de profecías de la ronda |
| `contenido_oraculo` | servidor → jugador (privado) | Contenido real de los 3 pergaminos, solo para dueños de la Torre del Oráculo |
| `votacion_revelada` | servidor → sala | Pergamino ganador, conteo y quién votó qué |
| `alianza_formada` | servidor → sala | Avisa que una alianza se formó (también se registra en la Crónica del Reino) |
| `alianza_rota` | servidor → sala | Avisa que un vínculo de alianza terminó (formal o por traición); el reparto del tesoro, si había, se narra en la Crónica del Reino |
| `ronda_revelada` | servidor → sala | Eventos y narración dramática de la ronda resuelta |
| `fin_partida` | servidor → sala | Ganador y podio final |
| `error` | servidor → cliente | Mensaje de error puntual (acción inválida, sala llena, etc.) |

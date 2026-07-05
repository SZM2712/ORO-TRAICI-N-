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

## Reglas implementadas (resumen)

- Estado inicial: 5 de oro, 1 granja, sin muralla, castillo etapa 0.
- Acciones secretas por ronda: Cosechar 🌾, Construir 🔨, Asaltar ⚔️ (con antorcha 🔥 opcional, una vez por partida), Defender 🛡️, Enviar oro 🎁 (solo a un aliado).
- Orden de resolución fijo: defensores → asaltos/incendios → envíos de oro entre aliados → construcciones (el oro se valida **después** de los robos) → cosechas → +1 al defensor (+1 extra si el aliado también defendió).
- Profecías en las rondas 1, 5 y 10: 3 pergaminos sellados A/B/C, votación a ciegas de 30 s, mayoría gana (empate al azar del servidor), los dueños de la Torre del Oráculo ven el contenido real en privado.
- Fin de partida: castillo etapa 3 completo gana; empate exacto → muerte súbita; límite de 20 rondas → gana mayor puntaje (`etapas×100 + oro`), empate en la cima → muerte súbita.
- Reconexión: el cliente guarda `{roomCode, playerToken}` en `localStorage` y se reincorpora con su estado intacto al reconectar.
- Anti-bloqueo: tiempo por ronda configurable por el anfitrión (sin límite / 60 s / 30 s) y botón de "forzar pendientes".
- Salas en memoria, se limpian solas tras 2 h de inactividad (no hay base de datos).
- **Alianzas:** durante la fase de acción, cualquier jugador puede tocar "🤝 Proponer alianza" en la tarjeta de un rival; si el otro acepta (confirmación en tiempo real, no espera al cierre de la ronda), quedan aliados — visible para toda la sala en la Crónica del Reino y con una insignia "🤝 aliado" en las tarjetas. Un jugador puede tener varias alianzas simultáneas. No hay bloqueo automático de asaltos: si alguno de los dos asalta al otro, la alianza se rompe en el acto y el asalto se resuelve igual, marcado como traición ("🗡️💔 ¡TRAICIÓN!") en la crónica. Tener una alianza da tres beneficios reales mientras dura:
  - **Asalto en pinza:** si vos y tu aliado asaltan al mismo objetivo en la misma ronda, ambos se llevan un `MULTIPLICADOR_PINZA` (1.5×) extra de botín — le da a la alianza un propósito ofensivo para derribar juntos a un rival fuerte (o al líder ambicioso).
  - **Envío de oro:** nueva acción secreta "🎁 Enviar oro" para transferirle parte de tu oro a un aliado (se resuelve después de los robos y antes de las construcciones, así lo puede usar esa misma ronda). Si la alianza se rompió esa ronda, el envío falla y el oro no sale de tu bolsillo.
  - **Defensa conjunta:** si vos y tu aliado eligen "Defender" en la misma ronda, ambos ganan `BONUS_DEFENSA_CONJUNTA` de oro extra además del bono normal de defensor.
- **Ambición del Trono:** quien tenga el castillo en etapa 2 o 3 asalta con el doble de botín (👑, ver `ETAPA_AMBICION`/`MULTIPLICADOR_AMBICION` en `config.js`) mientras se mantenga ahí — un beneficio real y a propósito para el líder, para darle al resto una razón concreta (envidia, miedo) para unirse contra él antes de que termine su castillo. La alerta de "castillo en etapa 2" ahora avisa explícitamente de esto, y las tarjetas de todos los jugadores muestran la corona mientras dure.
- **Robar castillos:** hay dos formas de bajarle una etapa de castillo a otro jugador (nunca te la quedás vos, solo lo debilita):
  - **Asedio 🏰💥:** al asaltar a alguien con el castillo en etapa 2 o más, podés marcar la opción "Asedio" — es de una sola vez por partida (como la antorcha). Si el asalto no es bloqueado, además del robo normal, el objetivo pierde una etapa de castillo. Si te bloquean, el asedio se gasta en vano igual.
  - **Rebelión Popular (profecía) 🔥👑:** nueva carta del mazo de profecías; al salir sorteada, el líder (castillo más avanzado del momento) pierde una etapa de castillo al iniciar la ronda, sin que nadie tenga que gastar su asedio.
- **Modo de prueba contra la máquina:** en la pantalla de inicio se elige el total de jugadores (3 a 8, vos incluido) y el botón "🤖 Probar contra la máquina" crea la sala con esa cantidad de bots (`CPU ...`) para poder probar el juego sin necesitar más gente. Los bots juegan, votan y también proponen/responden alianzas solos con una IA simple (prioriza construir, prefiere no traicionar a un aliado salvo que no tenga otro objetivo), con una demora aleatoria de 1–3 s para que se sienta natural.
- **Bots en salas normales:** también desde el lobby de una sala creada con "Crear Sala" (con gente real), el anfitrión puede tocar "🤖 Agregar bot" las veces que quiera mientras la sala no esté llena, para completar el mínimo de 3 jugadores o sumar rivales extra sin depender de que se una más gente.

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
| `snapshot_estado` | servidor → sala | Estado público completo (nunca incluye jugadas/votos secretos ajenos), incluye `alianzas` |
| `alianza_propuesta` | servidor → jugador (privado) | Notifica al destinatario de una propuesta de alianza |
| `alianza_rechazada` | servidor → jugador (privado) | Avisa al proponente que su propuesta fue rechazada |
| `iniciar_votacion` | servidor → sala | Arranca la votación de profecías de la ronda |
| `contenido_oraculo` | servidor → jugador (privado) | Contenido real de los 3 pergaminos, solo para dueños de la Torre del Oráculo |
| `votacion_revelada` | servidor → sala | Pergamino ganador, conteo y quién votó qué |
| `alianza_formada` | servidor → sala | Avisa que una alianza se formó (también se registra en la Crónica del Reino) |
| `ronda_revelada` | servidor → sala | Eventos y narración dramática de la ronda resuelta |
| `fin_partida` | servidor → sala | Ganador y podio final |
| `error` | servidor → cliente | Mensaje de error puntual (acción inválida, sala llena, etc.) |

import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { PUERTO, ORIGEN_CLIENTE } from "./config.js";
import { RoomManager } from "./rooms/RoomManager.js";
import { registrarSockets } from "./sockets/index.js";

const origenes = ORIGEN_CLIENTE.split(",").map((o) => o.trim());

const app = express();
app.use(cors({ origin: origenes }));
app.get("/", (_req, res) => res.json({ ok: true, juego: "ORO & TRAICIÓN: La Era de las Aldeas" }));
app.get("/salud", (_req, res) => res.json({ ok: true }));

const servidor = http.createServer(app);
const io = new Server(servidor, {
  cors: { origin: origenes, methods: ["GET", "POST"] },
});

const roomManager = new RoomManager(io);
registrarSockets(io, roomManager);

servidor.listen(PUERTO, () => {
  console.log(`⚔️  ORO & TRAICIÓN escuchando en el puerto ${PUERTO}`);
});

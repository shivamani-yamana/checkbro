import { WebSocketServer } from "ws";
import { GameManager } from "./GameManager";

const wss = new WebSocketServer({ port: 8080 });
const gameManager = new GameManager();

wss.on("connection", (ws) => {
  console.log("Client connected");
  gameManager.addUserToGame(ws);

  ws.on("close", () => {
    console.log("Client disconnected");
    gameManager.removeUserFromGame(ws);
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
    gameManager.removeUserFromGame(ws);
  });
});

console.log("WebSocket server started on port 8080");

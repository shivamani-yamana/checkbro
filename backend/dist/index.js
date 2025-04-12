"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const GameManager_1 = require("./GameManager");
const wss = new ws_1.WebSocketServer({ port: 8080 });
const gameManager = new GameManager_1.GameManager();
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

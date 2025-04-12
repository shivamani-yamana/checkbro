"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameManager = void 0;
const Game_1 = require("./Game");
const messages_1 = require("./messages");
const uuid_1 = require("uuid");
const ws_1 = require("ws");
class GameManager {
    constructor() {
        this.clients = [];
        this.HEART_BEAT_INTERVAL = 30000; // 30 seconds
        this.HEART_BEAT_TIMEOUT = 35000; // 35 seconds
        this.games = [];
        this.pendingUser = null;
        setInterval(() => {
            this.checkConnections();
        }, this.HEART_BEAT_INTERVAL);
    }
    addUserToGame(user) {
        const clientId = (0, uuid_1.v4)();
        const client = {
            id: clientId,
            socket: user,
            lastPing: Date.now(),
        };
        this.clients.push(client);
        user.send(JSON.stringify({
            type: "connection_established",
            payload: {
                clientId: clientId,
            },
        }));
        console.log("New user connected:", clientId);
        this.addHandlerToGame(client);
        this.startHeartbeat(client);
    }
    removeUserFromGame(user) {
        const clientIndex = this.clients.findIndex((c) => c.socket === user);
        if (clientIndex !== -1) {
            const client = this.clients[clientIndex];
            console.log("User disconnected:", client.id);
            if (this.pendingUser && this.pendingUser.socket === user) {
                this.pendingUser = null;
                console.log("Pending user disconnected, waiting for another player!");
            }
            this.games = this.games.filter((game) => {
                if (game.player1 === user || game.player2 === user) {
                    const otherPlayer = game.player1 === user ? game.player2 : game.player1;
                    otherPlayer.send(JSON.stringify({
                        type: "opponent_disconnected",
                        payload: {},
                    }));
                    return false; // Remove the game from the list
                }
                return true;
            });
            this.clients.splice(clientIndex, 1); // Remove the client from the list
        }
    }
    // Method to start heartbeat for a client
    startHeartbeat(client) {
        const sendHeartbeat = () => {
            if (client.socket.readyState === ws_1.WebSocket.OPEN) {
                client.socket.send(JSON.stringify({ type: "ping" }));
            }
        };
        // Send heartbeat every interval
        const heartbeatInterval = setInterval(sendHeartbeat, this.HEART_BEAT_INTERVAL);
        // Clean up on close
        client.socket.on("close", () => {
            clearInterval(heartbeatInterval);
            this.removeUserFromGame(client.socket);
        });
    }
    // Method to check for stale connections
    checkConnections() {
        const now = Date.now();
        const staleClients = this.clients.filter((client) => now - client.lastPing > this.HEART_BEAT_TIMEOUT);
        // Close stale connections
        staleClients.forEach((client) => {
            console.log(`Client ${client.id} timed out`);
            client.socket.terminate();
            this.removeUserFromGame(client.socket);
        });
    }
    addHandlerToGame(client) {
        client.socket.on("message", (data) => {
            try {
                const message = JSON.parse(data.toString());
                // Update last ping time for any message
                client.lastPing = Date.now();
                // Handle pong responses
                if (message.type === "pong") {
                    return;
                }
                if (message.type === messages_1.INIT_GAME) {
                    // Don't match with yourself - check client IDs!
                    if (this.pendingUser && this.pendingUser.id !== client.id) {
                        const game = new Game_1.Game(this.pendingUser.socket, client.socket);
                        this.games.push(game);
                        // Notify players about the game start with assigned colors
                        this.pendingUser.socket.send(JSON.stringify({
                            type: messages_1.INIT_GAME,
                            payload: { color: "white" },
                        }));
                        client.socket.send(JSON.stringify({
                            type: messages_1.INIT_GAME,
                            payload: { color: "black" },
                        }));
                        this.pendingUser = null;
                        console.log("New game created with pending user!");
                    }
                    else {
                        // Only set as pending if not already pending
                        if (this.pendingUser && this.pendingUser.id === client.id) {
                            console.log("Client already waiting for opponent");
                        }
                        else {
                            this.pendingUser = client;
                            console.log(`Client ${client.id} waiting for another player!`);
                        }
                    }
                }
                if (message.type === messages_1.MOVE) {
                    const game = this.games.find((g) => g.player1 === client.socket || g.player2 === client.socket);
                    if (game) {
                        game.makeMove(client.socket, message.move);
                    }
                }
            }
            catch (e) {
                console.error("Error processing message", e);
            }
        });
    }
}
exports.GameManager = GameManager;

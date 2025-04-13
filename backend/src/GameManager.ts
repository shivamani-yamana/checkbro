import { Game } from "./Game";
import {
  CONNECTION_ESTABLISHED,
  DRAW_ACCEPTED,
  DRAW_DECLINED,
  DRAW_OFFER,
  GAME_OVER,
  INIT_GAME,
  MOVE,
  OFFER_DRAW,
  OPPONENT_DISCONNECTED,
  PING,
  PONG,
  RESIGN,
} from "./messages";
import { v4 as uuidv4 } from "uuid";
import { WebSocket } from "ws";

interface ClientConnection {
  id: string;
  socket: WebSocket;
  lastPing: number;
}

export class GameManager {
  private games: Game[];
  private clients: ClientConnection[] = [];
  private pendingUser: ClientConnection | null;
  private pendingUserName: string | null;

  private HEART_BEAT_INTERVAL = 30000; // 30 seconds
  private HEART_BEAT_TIMEOUT = 35000; // 35 seconds

  constructor() {
    this.games = [];
    this.pendingUser = null;
    this.pendingUserName = null;
    setInterval(() => {
      this.checkConnections();
    }, this.HEART_BEAT_INTERVAL);
  }

  addUserToGame(user: WebSocket) {
    const clientId = uuidv4();

    const client = {
      id: clientId,
      socket: user,
      lastPing: Date.now(),
    };

    this.clients.push(client);
    user.send(
      JSON.stringify({
        type: CONNECTION_ESTABLISHED,
        payload: {
          clientId: clientId,
        },
      })
    );

    console.log("New user connected:", clientId);
    this.addHandlerToGame(client);

    this.startHeartbeat(client);
  }
  removeUserFromGame(user: WebSocket) {
    const clientIndex = this.clients.findIndex((c) => c.socket === user);

    if (clientIndex !== -1) {
      const client = this.clients[clientIndex];
      console.log("User disconnected:", client.id);

      if (this.pendingUser && this.pendingUser.socket === client.socket) {
        this.pendingUser = null;
        console.log("Pending user disconnected, waiting for another player!");
      }

      this.games = this.games.filter((game) => {
        if (game.player1 === user || game.player2 === user) {
          const otherPlayer =
            game.player1 === user ? game.player2 : game.player1;
          otherPlayer.send(
            JSON.stringify({
              type: OPPONENT_DISCONNECTED,
              payload: {
                winner: otherPlayer === game.player1 ? "white" : "black",
              },
            })
          );
          return false; // Remove the game from the list
        }
        return true;
      });
      this.clients.splice(clientIndex, 1); // Remove the client from the list
    }
  }

  // Method to start heartbeat for a client
  private startHeartbeat(client: ClientConnection) {
    const sendHeartbeat = () => {
      if (client.socket.readyState === WebSocket.OPEN) {
        client.socket.send(JSON.stringify({ type: PING }));
      }
    };

    // Send heartbeat every interval
    const heartbeatInterval = setInterval(
      sendHeartbeat,
      this.HEART_BEAT_INTERVAL
    );

    // Clean up on close
    client.socket.on("close", () => {
      clearInterval(heartbeatInterval);
      this.removeUserFromGame(client.socket);
    });
  }

  // Method to check for stale connections
  private checkConnections() {
    const now = Date.now();
    const staleClients = this.clients.filter(
      (client) => now - client.lastPing > this.HEART_BEAT_TIMEOUT
    );

    // Close stale connections
    staleClients.forEach((client) => {
      console.log(`Client ${client.id} timed out`);
      client.socket.terminate();
      this.removeUserFromGame(client.socket);
    });
  }

  private addHandlerToGame(client: ClientConnection) {
    client.socket.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());

        // Update last ping time for any message
        client.lastPing = Date.now();

        // Handle pong responses
        if (message.type === PONG) {
          return;
        }

        if (message.type === INIT_GAME) {
          // Filter to remove games that are over
          this.games = this.games.filter((game) => !game.isGameOver); // Remove finished games

          // Don't match with yourself - check client IDs!
          if (this.pendingUser && this.pendingUser.id !== client.id) {
            const game = new Game(this.pendingUser.socket, client.socket);
            this.games.push(game);

            const player1Name = message.payload?.playerName || null;
            const player2Name = this.pendingUserName || null;

            console.log(`Matched ${this.pendingUser.id} with ${client.id}`);

            // Notify players about the game start with assigned colors
            this.pendingUser.socket.send(
              JSON.stringify({
                type: INIT_GAME,
                payload: { color: "white" },
                opponentName: player1Name,
              })
            );

            client.socket.send(
              JSON.stringify({
                type: INIT_GAME,
                payload: { color: "black" },
                opponentName: player2Name,
              })
            );
            this.pendingUser = null;
            this.pendingUserName = null; // Reset pending user name

            console.log("New game created with pending user!");
          } else {
            // Only set as pending if not already pending
            if (this.pendingUser && this.pendingUser.id === client.id) {
              console.log("Client already waiting for opponent");
            } else {
              const existingGame = this.games.find((game) => {
                return (
                  (game.player1 === client.socket ||
                    game.player2 === client.socket) &&
                  !game.isGameOver
                );
              });

              if (existingGame) {
                console.log(`Client ${client.id} is already in a game`);
              } else {
                this.pendingUser = client;
                this.pendingUserName = message.payload?.playerName || null; // Store the player's name
                console.log(`Client ${client.id} waiting for another player!`);

                // Log all waiting players for debugging
                console.log(`Current pending user: ${this.pendingUser?.id}`);
              }
            }
          }
        }
        if (message.type === MOVE) {
          const game = this.games.find(
            (g) => g.player1 === client.socket || g.player2 === client.socket
          );
          if (game) {
            game.makeMove(client.socket, message.move);
          }
        }
        if (message.type === RESIGN) {
          let otherPlayer: WebSocket | null = null;
          const game = this.games.find((g) => {
            if (g.player1 === client.socket) {
              otherPlayer = g.player2;
              return true;
            } else if (g.player2 === client.socket) {
              otherPlayer = g.player1;
              return true;
            } else {
              return false;
            }
          });

          if (game) {
            const resignMessage = JSON.stringify({
              type: RESIGN,
              payload: {
                winner: client.socket === game.player1 ? "black" : "white",
              },
            });
            game.player1.send(resignMessage);
            game.player2.send(resignMessage);

            game.isGameOver = true; // Mark the game as over
            this.games = this.games.filter((g) => g !== game); // Remove the game from the list
          }
        }
        if (message.type === OFFER_DRAW) {
          const game = this.games.find((g) => {
            return g.player1 === client.socket || g.player2 === client.socket;
          });
          if (game) {
            const drawRequest = JSON.stringify({
              type: DRAW_OFFER,
              payload: {
                player: client.socket === game.player1 ? "white" : "black",
              },
            });
            const otherPlayer =
              game.player1 === client.socket ? game.player2 : game.player1;
            otherPlayer.send(drawRequest);
          }
        }
        if (message.type === DRAW_ACCEPTED) {
          const game = this.games.find((g) => {
            return g.player1 === client.socket || g.player2 === client.socket;
          });
          if (game) {
            const responseMessage = JSON.stringify({
              type: GAME_OVER,
              payload: {
                winner: "draw",
                winType: "draw",
              },
            });

            game.player1.send(responseMessage);
            game.player2.send(responseMessage);

            game.isGameOver = true; // Mark the game as over
            this.games = this.games.filter((g) => g !== game); // Remove the game from the list
          }
        }
        if (message.type === DRAW_DECLINED) {
          const game = this.games.find((g) => {
            return g.player1 === client.socket || g.player2 === client.socket;
          });
          if (game) {
            const drawDeclinedResponse = JSON.stringify({
              type: DRAW_DECLINED,
              payload: {},
            });
            game.player1.send(drawDeclinedResponse);
            game.player2.send(drawDeclinedResponse);
          }
        }
      } catch (e) {
        console.error("Error processing message", e);
      }
    });
  }
}

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
  OPPONENT_DISCONNECTED_TEMP,
  OPPONENT_RECONNECTED,
  PING,
  PONG,
  RECONNECT_REQUEST,
  RECONNECTION_FAILED,
  RECONNECTION_SUCCESSFUL,
  RECONNECTION_TOKEN,
  RESIGN,
} from "./messages";
import { v4 as uuidv4 } from "uuid";
import { WebSocket } from "ws";
import jwt from "jsonwebtoken";

// Logger class to control log levels
enum LogLevel {
  ERROR = 0,
  INFO = 1,
  DEBUG = 2,
}

class Logger {
  private static level: LogLevel = LogLevel.INFO; // Default to INFO level

  static setLogLevel(level: LogLevel) {
    this.level = level;
  }

  static error(message: string, ...data: any[]) {
    console.error(`[ERROR] ${message}`, ...data);
  }

  static info(message: string, ...data: any[]) {
    if (this.level >= LogLevel.INFO) {
      console.log(`[INFO] ${message}`, ...data);
    }
  }

  static debug(message: string, ...data: any[]) {
    if (this.level >= LogLevel.DEBUG) {
      console.log(`[DEBUG] ${message}`, ...data);
    }
  }
}

// Set log level from environment variable or default to INFO
const logLevel = process.env.LOG_LEVEL?.toUpperCase();
if (logLevel === "DEBUG") {
  Logger.setLogLevel(LogLevel.DEBUG);
} else if (logLevel === "ERROR") {
  Logger.setLogLevel(LogLevel.ERROR);
} else {
  Logger.setLogLevel(LogLevel.INFO);
}

interface ClientConnection {
  id: string;
  socket: WebSocket;
  lastPing: number;
  lastTokenIssue: number | null;
}

interface DisconnectedClient {
  timestamp: number;
  gameId: string;
  playerColor: "white" | "black" | null;
  playerName: string | null;
  token: string;
  disconnectionTimer?: NodeJS.Timeout; // Add timer reference for automatic game ending
}

interface TokenPayload {
  clientId: string;
  gameId: string;
  playerColor: "white" | "black";
  playerName: string;
}

export class GameManager {
  private JWT_SECRET: string | undefined;
  // Updated to 2 minutes (120 seconds)
  private readonly RECONNECTION_TIMEOUT = 120 * 1000; // 2 minutes

  private games: Game[];
  private clients: ClientConnection[] = [];
  private pendingUser: ClientConnection | null;
  private pendingUserName: string | null;
  private disconnectedClients: Map<string, DisconnectedClient> = new Map();

  private HEART_BEAT_INTERVAL = 30000; // 30 seconds
  private HEART_BEAT_TIMEOUT = 60000; //60 seconds

  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET;
    if (!this.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }
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
      lastTokenIssue: null,
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

    Logger.info("New user connected:", clientId);
    this.addHandlerToGame(client);

    this.startHeartbeat(client);
  }
  removeUserFromGame(user: WebSocket) {
    const clientIndex = this.clients.findIndex((c) => c.socket === user);

    if (clientIndex !== -1) {
      const client = this.clients[clientIndex];
      Logger.info("User disconnected:", client.id);

      let gameFound = false;
      let gameId = null;
      let playerColor = null;
      let playerName = null;

      for (const game of this.games) {
        if (game.player1 === user) {
          gameFound = true;
          gameId = game.gameId;
          playerColor = "white";
          playerName = game.player1Name;

          if (game.player2.readyState === WebSocket.OPEN) {
            game.player2.send(
              JSON.stringify({
                type: OPPONENT_DISCONNECTED_TEMP,
                payload: {
                  reconnectionWindowSeconds: this.RECONNECTION_TIMEOUT / 1000,
                },
              })
            );
          }
          break;
        } else if (game.player2 === user) {
          gameFound = true;
          gameId = game.gameId;
          playerColor = "black";
          playerName = game.player2Name;
          if (game.player1.readyState === WebSocket.OPEN) {
            game.player1.send(
              JSON.stringify({
                type: OPPONENT_DISCONNECTED_TEMP,
                payload: {
                  reconnectionWindowSeconds: this.RECONNECTION_TIMEOUT / 1000,
                },
              })
            );
          }
          break;
        }
      }

      if (gameFound && gameId && playerColor && playerName) {
        const payload = {
          clientId: client.id,
          gameId,
          playerColor,
          playerName,
        };

        // Create a timer to end the game if player doesn't reconnect within 2 minutes
        const disconnectionTimer = setTimeout(() => {
          const reconnectInfo = this.disconnectedClients.get(client.id);
          if (reconnectInfo) {
            Logger.info(`Reconnection window expired for client ${client.id}`);

            // Find the game
            const game = this.games.find(
              (g) => g.gameId === reconnectInfo.gameId
            );

            if (game) {
              // Set opposite player as winner due to disconnection
              const winner = playerColor === "white" ? "black" : "white";
              const gameOverMessage = JSON.stringify({
                type: GAME_OVER,
                payload: {
                  winner: winner,
                  winType: "disconnection", // Add a new win type
                },
              });

              // Notify the remaining player about win by disconnection
              const opponentSocket =
                playerColor === "white" ? game.player2 : game.player1;

              if (opponentSocket.readyState === WebSocket.OPEN) {
                opponentSocket.send(gameOverMessage);
              }

              // Remove the game
              this.games = this.games.filter(
                (g) => g.gameId !== reconnectInfo.gameId
              );
            }

            // Remove from disconnected clients list
            this.disconnectedClients.delete(client.id);
          }
        }, this.RECONNECTION_TIMEOUT);

        // Issue a single-use JWT token with a longer expiry just for reconnection
        if (
          this.JWT_SECRET &&
          (playerColor === "white" || playerColor === "black")
        ) {
          const token = jwt.sign(payload, this.JWT_SECRET, {
            expiresIn: this.RECONNECTION_TIMEOUT / 1000, // Convert to seconds
          });

          this.disconnectedClients.set(client.id, {
            timestamp: Date.now(),
            gameId,
            playerColor,
            playerName,
            token,
            disconnectionTimer, // Store timer reference for clearing later
          });

          Logger.info(
            `Client ${client.id} added to disconnected clients with reconnection token`
          );

          try {
            if (user.readyState === WebSocket.OPEN) {
              user.send(
                JSON.stringify({
                  type: RECONNECTION_TOKEN,
                  payload: {
                    token,
                    expiresIn: this.RECONNECTION_TIMEOUT / 1000,
                  },
                })
              );
            }
          } catch (e) {
            Logger.error("Error sending reconnection token", e);
          }
        }
      } else if (
        this.pendingUser &&
        this.pendingUser.socket === client.socket
      ) {
        this.pendingUser = null;
        this.pendingUserName = null;
        Logger.info("Pending user disconnected, waiting for another player");
      }

      this.clients.splice(clientIndex, 1);
    }
  }

  // In the handleReconnectingClient method:
  public handleReconnectingClient(token: string, newClient: ClientConnection) {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET || "") as TokenPayload;
      const { clientId, gameId, playerColor, playerName } = decoded;

      Logger.info(
        `Attempting to reconnect client ${clientId} to game ${gameId}`
      );

      // First check if we have this client in disconnectedClients map
      const disconnectedInfo = this.disconnectedClients.get(clientId);

      if (!disconnectedInfo) {
        Logger.info(
          `Client ${clientId} not found in disconnected clients list`
        );

        // As a fallback, try to find the game directly by gameId
        const game = this.games.find((g) => g.gameId === gameId);

        if (!game) {
          Logger.info(`Game ${gameId} not found`);
          newClient.socket.send(
            JSON.stringify({
              type: RECONNECTION_FAILED,
              payload: {
                reason: "Game no longer exists or has ended",
              },
            })
          );
          return;
        }

        // If game exists but client not in disconnected list, allow reconnection as a courtesy
        Logger.info(
          `Game ${gameId} found, allowing reconnection even though client not in disconnected list`
        );
      } else {
        Logger.info(`Found disconnected client info for ${clientId}`);

        // Clear the disconnection timer
        if (disconnectedInfo.disconnectionTimer) {
          clearTimeout(disconnectedInfo.disconnectionTimer);
        }
      }

      // Find the game - either from disconnected info or directly by ID
      const game = this.games.find(
        (g) => g.gameId === (disconnectedInfo?.gameId || gameId)
      );

      if (!game) {
        Logger.info(`Game with ID ${gameId} no longer exists`);
        newClient.socket.send(
          JSON.stringify({
            type: RECONNECTION_FAILED,
            payload: {
              reason: "Game no longer exists or has ended",
            },
          })
        );

        // Clean up the disconnected client record
        if (disconnectedInfo) {
          this.disconnectedClients.delete(clientId);
        }
        return;
      }

      // Check if game is already over
      if (game.isGameOver) {
        Logger.info(`Game ${gameId} is already over`);
        newClient.socket.send(
          JSON.stringify({
            type: RECONNECTION_FAILED,
            payload: {
              reason: "Game has already ended",
            },
          })
        );

        // Clean up the disconnected client record
        if (disconnectedInfo) {
          this.disconnectedClients.delete(clientId);
        }
        return;
      }

      // Update the game with the new socket
      if (playerColor === "white") {
        game.player1 = newClient.socket;

        // Notify opponent
        if (game.player2.readyState === WebSocket.OPEN) {
          game.player2.send(
            JSON.stringify({
              type: OPPONENT_RECONNECTED,
            })
          );
        }
      } else if (playerColor === "black") {
        game.player2 = newClient.socket;

        // Notify opponent
        if (game.player1.readyState === WebSocket.OPEN) {
          game.player1.send(
            JSON.stringify({
              type: OPPONENT_RECONNECTED,
            })
          );
        }
      }

      // Update clientId
      newClient.id = clientId;
      this.clients.push(newClient);

      // Clean up disconnected client record
      if (disconnectedInfo) {
        this.disconnectedClients.delete(clientId);
      }

      const opponentName =
        playerColor === "white" ? game.player2Name : game.player1Name;

      // Send successful reconnection with game state
      newClient.socket.send(
        JSON.stringify({
          type: RECONNECTION_SUCCESSFUL,
          payload: {
            gameState: game.getGameState(),
            color: playerColor,
            opponentName,
          },
        })
      );

      this.startHeartbeat(newClient);

      Logger.info(
        `Client ${clientId} successfully reconnected to game ${gameId}`
      );
    } catch (err) {
      Logger.error(`Error handling reconnecting client:`, err);

      let reason = "Invalid or expired reconnection token";
      if (err instanceof jwt.JsonWebTokenError) {
        reason = "Token verification failed";
      } else if (err instanceof jwt.TokenExpiredError) {
        reason = "Reconnection token has expired";
      }

      newClient.socket.send(
        JSON.stringify({
          type: RECONNECTION_FAILED,
          payload: {
            reason,
          },
        })
      );
    }
  }

  // Method to start heartbeat for a client
  private startHeartbeat(client: ClientConnection) {
    // Add a delay before starting heartbeat to allow connection to stabilize
    setTimeout(() => {
      // Only start heartbeat if socket is still open
      if (client.socket.readyState !== WebSocket.OPEN) {
        Logger.debug(
          `Not starting heartbeat for client ${client.id} - socket not open anymore`
        );
        return;
      }

      const sendHeartbeat = () => {
        if (client.socket.readyState === WebSocket.OPEN) {
          try {
            client.socket.send(JSON.stringify({ type: PING }));
            Logger.debug(`Sent PING heartbeat to client ${client.id}`);
          } catch (error) {
            Logger.error("Error sending heartbeat:", error);
          }
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
        Logger.debug(
          `Heartbeat stopped for client ${client.id} due to connection close`
        );
      });

      Logger.debug(`Started heartbeat for client ${client.id}`);
    }, 3000); // 3-second delay before starting heartbeat
  }

  // Method to check for stale connections
  private checkConnections() {
    const now = Date.now();
    const staleClients = this.clients.filter(
      (client) => now - client.lastPing > this.HEART_BEAT_TIMEOUT
    );

    // Close stale connections
    staleClients.forEach((client) => {
      Logger.info(`Client ${client.id} timed out`);
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
        if (message.type === RECONNECT_REQUEST) {
          const token = message.payload.token;
          this.handleReconnectingClient(token, client);
        }
        if (message.type === INIT_GAME) {
          // Filter to remove games that are over
          this.games = this.games.filter((game) => !game.isGameOver); // Remove finished games

          // Don't match with yourself - check client IDs!
          if (
            this.pendingUser &&
            this.pendingUserName &&
            this.pendingUser.id !== client.id
          ) {
            const game = new Game(
              this.pendingUser.socket,
              client.socket,
              this.pendingUserName,
              message.payload.playername
            );
            this.games.push(game);
            this.persistGame(game);

            const player1Name = message.payload?.playerName || null;
            const player2Name = this.pendingUserName || null;

            Logger.info(`Matched ${this.pendingUser.id} with ${client.id}`);

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

            this.issueReconnectionToken(client);
            this.issueReconnectionToken(this.pendingUser);

            this.pendingUser = null;
            this.pendingUserName = null; // Reset pending user name

            Logger.info("New game created with pending user!");
          } else {
            // Only set as pending if not already pending
            if (this.pendingUser && this.pendingUser.id === client.id) {
              Logger.info("Client already waiting for opponent");
            } else {
              const existingGame = this.games.find((game) => {
                return (
                  (game.player1 === client.socket ||
                    game.player2 === client.socket) &&
                  !game.isGameOver
                );
              });

              if (existingGame) {
                Logger.info(`Client ${client.id} is already in a game`);
              } else {
                this.pendingUser = client;
                this.pendingUserName = message.payload.playerName; // Store the player's name
                Logger.info(`Client ${client.id} waiting for another player!`);

                // Log all waiting players for debugging
                Logger.debug(`Current pending user: ${this.pendingUser?.id}`);
              }
            }
          }
        }
        if (message.type === MOVE) {
          const game = this.games.find(
            (g) => g.player1 === client.socket || g.player2 === client.socket
          );
          if (game) {
            // Check if move data is in the expected format and location
            const moveData = message.move || message.payload;

            // Additional validation to ensure the move is properly formatted
            if (
              !moveData ||
              typeof moveData !== "object" ||
              !moveData.from ||
              !moveData.to
            ) {
              // Logger.error("Invalid move format received:", moveData);
              return;
            }

            // Log the move data to help with debugging
            // Logger.debug(
            //   "Processing move in GameManager:",
            //   JSON.stringify(moveData)
            // );

            // Ensure promotion data is correctly passed if it exists
            // if (moveData.promotion) {
            //   Logger.debug(`Pawn promotion detected to: ${moveData.promotion}`);
            // }

            game.makeMove(client.socket, moveData);
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
        Logger.error("Error processing message", e);
      }
    });
  }

  private issueReconnectionToken(client: ClientConnection) {
    if (!this.JWT_SECRET) {
      Logger.error("Cannot issue token: JWT_SECRET is not configured");
      return;
    }

    // Find game for this client
    const game = this.games.find((g) => {
      return g.player1 === client.socket || g.player2 === client.socket;
    });

    if (!game) {
      Logger.info(`Client ${client.id} is not currently in a game`);
      return;
    }

    // Determine player color and game info
    const playerColor = game.player1 === client.socket ? "white" : "black";
    const playerName =
      game.player1 === client.socket ? game.player1Name : game.player2Name;

    // Create token payload
    const payload = {
      clientId: client.id,
      gameId: game.gameId,
      playerColor,
      playerName,
    };

    // Only issue new token if we haven't recently issued one (rate limiting)
    const now = Date.now();
    const TOKEN_RATE_LIMIT = 30 * 1000; // 30 seconds between token issues

    if (
      client.lastTokenIssue &&
      now - client.lastTokenIssue < TOKEN_RATE_LIMIT
    ) {
      Logger.info(`Token issue rate limited for client ${client.id}`);
      return;
    }

    // Issue a token with standard expiry
    const token = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.RECONNECTION_TIMEOUT / 1000, // Convert to seconds
    });

    // Store the timestamp of when we issued this token
    client.lastTokenIssue = now;

    Logger.info(`Issuing reconnection token to client ${client.id}`);

    // Send the token to the client
    if (client.socket.readyState === WebSocket.OPEN) {
      client.socket.send(
        JSON.stringify({
          type: RECONNECTION_TOKEN,
          payload: {
            token,
            expiresIn: this.RECONNECTION_TIMEOUT / 1000,
          },
        })
      );
    }
  }

  private persistGame(game: Game) {
    // Simple console log for now, but could be expanded to persist to a database
    // console.log(`Game created with ID: ${game.gameId}`);
    // console.log(`Player 1: ${game.player1Name}, Player 2: ${game.player2Name}`);
    Logger.info(
      `Game created: ${game.gameId} (${game.player1Name} vs ${game.player2Name})`
    );
  }
}

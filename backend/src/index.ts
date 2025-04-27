import { WebSocketServer } from "ws";
import { GameManager } from "./GameManager";
import dotenv from "dotenv";

dotenv.config();

// Logger class to control log levels (simplified version of what's in GameManager)
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

// Define allowed origins
const allowedOrigins = ["http://localhost:3000", "https://checkbro.vercel.app"];

const wss = new WebSocketServer({
  port: 8080,
  verifyClient: (info, done) => {
    const origin = info.origin;
    if (allowedOrigins.includes(origin)) {
      Logger.info(`Connection from allowed origin: ${origin}`);
      done(true); // Accept the connection
    } else {
      Logger.error(`Blocked connection from origin: ${origin}`);
      done(false); // Reject the connection
    }
  },
});
const gameManager = new GameManager();

wss.on("connection", (ws) => {
  Logger.info("Client connected");
  gameManager.addUserToGame(ws);

  ws.on("close", () => {
    Logger.info("Client disconnected");
    gameManager.removeUserFromGame(ws);
  });

  ws.on("error", (error) => {
    Logger.error("WebSocket error:", error);
    gameManager.removeUserFromGame(ws);
  });
});

Logger.info("WebSocket server started on port 8080");

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const GameManager_1 = require("./GameManager");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Logger class to control log levels (simplified version of what's in GameManager)
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 2] = "DEBUG";
})(LogLevel || (LogLevel = {}));
class Logger {
    static setLogLevel(level) {
        this.level = level;
    }
    static error(message, ...data) {
        console.error(`[ERROR] ${message}`, ...data);
    }
    static info(message, ...data) {
        if (this.level >= LogLevel.INFO) {
            console.log(`[INFO] ${message}`, ...data);
        }
    }
    static debug(message, ...data) {
        if (this.level >= LogLevel.DEBUG) {
            console.log(`[DEBUG] ${message}`, ...data);
        }
    }
}
Logger.level = LogLevel.INFO; // Default to INFO level
// Set log level from environment variable or default to INFO
const logLevel = (_a = process.env.LOG_LEVEL) === null || _a === void 0 ? void 0 : _a.toUpperCase();
if (logLevel === "DEBUG") {
    Logger.setLogLevel(LogLevel.DEBUG);
}
else if (logLevel === "ERROR") {
    Logger.setLogLevel(LogLevel.ERROR);
}
else {
    Logger.setLogLevel(LogLevel.INFO);
}
// Define the port from environment variable or default to 8080
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;
// Define allowed origins
const allowedOrigins = ["http://localhost:3000", "https://checkbro.vercel.app"];
const wss = new ws_1.WebSocketServer({
    port: PORT,
    verifyClient: (info, done) => {
        const origin = info.origin;
        Logger.debug(`Connection attempt from origin: ${origin}`);
        // In production, strictly validate origins
        if (allowedOrigins.includes(origin)) {
            Logger.info(`Connection from allowed origin: ${origin}`);
            done(true); // Accept the connection
        }
        else {
            Logger.error(`Blocked connection from origin: ${origin}`);
            done(false, 403, "Forbidden origin"); // Reject with status
        }
    },
});
const gameManager = new GameManager_1.GameManager();
wss.on("connection", (ws, req) => {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const origin = req.headers.origin;
    Logger.info(`Client connected from ${ip} with origin: ${origin}`);
    // Track connection time for debugging
    const connectionStartTime = Date.now();
    gameManager.addUserToGame(ws);
    ws.on("close", (code, reason) => {
        const connectionDuration = Date.now() - connectionStartTime;
        Logger.info(`Client disconnected after ${connectionDuration}ms with code: ${code}, reason: ${reason || "No reason provided"}`);
        gameManager.removeUserFromGame(ws);
    });
    ws.on("error", (error) => {
        Logger.error(`WebSocket error after ${Date.now() - connectionStartTime}ms:`, error);
        gameManager.removeUserFromGame(ws);
    });
});
Logger.info(`WebSocket server started on port ${PORT}`);

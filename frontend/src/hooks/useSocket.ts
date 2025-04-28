import {
  CLIENT_DISCONNECT,
  CONNECTION_ESTABLISHED,
  PING,
  PONG,
  RECONNECT_REQUEST,
  RECONNECTION_FAILED,
  RECONNECTION_SUCCESSFUL,
  RECONNECTION_TOKEN,
  RECONNECTION_TOKEN_EXPIRY,
} from "@/lib/messages";
import { useState, useEffect, useRef, useCallback } from "react";

// Logger for frontend with different levels
enum LogLevel {
  ERROR = 0,
  INFO = 1,
  DEBUG = 2,
}

class FrontendLogger {
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

// Set log level based on environment
if (import.meta.env.MODE === "development") {
  FrontendLogger.setLogLevel(LogLevel.DEBUG);
} else {
  FrontendLogger.setLogLevel(LogLevel.INFO);
}

export interface WebSocketMessage {
  type: string;
  payload?: any;
}

export type MessageHandler = (message: WebSocketMessage) => void;

interface UseSocketProps {
  setGameState?: (state: string) => void;
  setReconnecting?: (isReconnecting: boolean) => void;
  onMessage?: MessageHandler; // Add callback for message handling
}

export const useSocket = (props: UseSocketProps = {}) => {
  const { setGameState, setReconnecting, onMessage } = props;
  const hasInitialized = useRef(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [hasReconnectionToken, setHasReconnectionToken] =
    useState<boolean>(false);

  // Track if a page just loaded/reloaded to prevent automatic token clearing
  const isInitialMount = useRef(true);
  // Track if this is a page reload
  const isPageReload = useRef(
    typeof performance !== "undefined" &&
      performance.navigation &&
      performance.navigation.type === 1
  );

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectionAttempts = useRef(0);
  const reconnectingToken = useRef<string | null>(
    localStorage.getItem(RECONNECTION_TOKEN)
  );
  const reconnectingTokenExpiry = useRef<number | null>(
    Number(localStorage.getItem(RECONNECTION_TOKEN_EXPIRY)) || null
  );
  // Add a flag to track if reconnection was successful
  const reconnectionSuccessful = useRef(false);

  const clearReconnectionTokens = useCallback(() => {
    // Don't clear tokens on initial page load/reload
    if (isInitialMount.current) {
      // console.log("Skipping token clearing during initial page load");
      FrontendLogger.debug("Skipping token clearing during initial page load");
      return;
    }

    // console.log("Clearing reconnection tokens");
    FrontendLogger.info("Clearing reconnection tokens");
    localStorage.removeItem(RECONNECTION_TOKEN);
    localStorage.removeItem(RECONNECTION_TOKEN_EXPIRY);
    reconnectingToken.current = null;
    reconnectingTokenExpiry.current = null;
    setHasReconnectionToken(false);
    if (setReconnecting) {
      // console.log(
      //   "Setting reconnecting state to false in clearReconnectionTokens"
      // );
      FrontendLogger.debug(
        "Setting reconnecting state to false in clearReconnectionTokens"
      );
      setReconnecting(false);
    }
  }, [setReconnecting]);

  // Special effect for page reload reconnection
  useEffect(() => {
    // Check if this is a page reload and we have a valid token
    const token = localStorage.getItem(RECONNECTION_TOKEN);
    const expiry = Number(localStorage.getItem(RECONNECTION_TOKEN_EXPIRY));

    // Add a small buffer to ensure token doesn't appear expired immediately after reload
    const isValid = token && expiry && expiry > Date.now() - 2000;

    if (isValid) {
      // console.log(
      //   `Found reconnection token on page load, expires in ${Math.floor(
      //     (expiry - Date.now()) / 1000
      //   )}s`
      // );
      FrontendLogger.info(
        `Found reconnection token on page load, expires in ${Math.floor(
          (expiry - Date.now()) / 1000
        )}s`
      );
      reconnectingToken.current = token;
      reconnectingTokenExpiry.current = expiry;

      // IMPORTANT: Force show the reconnection UI on page reload
      setHasReconnectionToken(true);
      // Set reconnecting state to true to show automatic reconnecting UI
      if (setReconnecting) {
        // console.log(
        //   "Setting reconnecting state to true on page load with valid token"
        // );
        FrontendLogger.debug(
          "Setting reconnecting state to true on page load with valid token"
        );
        setReconnecting(true);
      }
    } else if (token || expiry) {
      // console.log("Found invalid reconnection token on page load");
      FrontendLogger.debug("Found invalid reconnection token on page load");
    }

    // Turn off the initial mount flag after a short delay
    const timer = setTimeout(() => {
      isInitialMount.current = false;
    }, 2000); // 2-second grace period

    return () => clearTimeout(timer);
  }, [setReconnecting]);

  const connectWebSocket = useCallback(() => {
    // Verify token expiry but don't clear during connection attempt
    if (reconnectingTokenExpiry.current) {
      const timeLeft = reconnectingTokenExpiry.current - Date.now();
      // Add a small buffer to expire time to handle clock skew/timing issues
      if (timeLeft < -5000) {
        // Only consider it expired if it's more than 5 seconds past
        // console.log(
        //   "Token significantly expired, will be cleared after connection attempt"
        // );
        FrontendLogger.debug(
          "Token significantly expired, will be cleared after connection attempt"
        );
      } else if (timeLeft < 0) {
        // console.log(
        //   "Token just expired (within tolerance), still attempting reconnection"
        // );
        FrontendLogger.debug(
          "Token just expired (within tolerance), still attempting reconnection"
        );
        // Treat as valid for reconnection attempts
      } else {
        // console.log(
        //   `Valid token found, expires in ${Math.round(timeLeft / 1000)}s`
        // );
        FrontendLogger.debug(
          `Valid token found, expires in ${Math.round(timeLeft / 1000)}s`
        );
      }
    } else {
      // console.log("No reconnection token found");
      FrontendLogger.debug("No reconnection token found");
    }

    setIsConnecting(true);
    const socketUrl = import.meta.env.VITE_WEBSOCKET_URL;
    const ws = new WebSocket(socketUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      // console.log("Connected to server");
      FrontendLogger.info("Connected to server");
      reconnectionAttempts.current = 0;
      setIsConnecting(false);

      // Check if we need to attempt reconnection
      // const token = localStorage.getItem(RECONNECTION_TOKEN);
      // const expiry = Number(localStorage.getItem(RECONNECTION_TOKEN_EXPIRY));

      // Include a small buffer time for expiry
      // const isValid = token && expiry && expiry > Date.now() - 5000;

      // // After page reload, always try to reconnect if token exists
      // if (isValid) {
      //   // console.log("Valid token found, sending reconnection request");
      //   FrontendLogger.info("Valid token found, sending reconnection request");
      //   ws.send(
      //     JSON.stringify({
      //       type: RECONNECT_REQUEST,
      //       payload: { token: token },
      //     })
      //   );

      //   // Leave UI visible until server confirms or rejects reconnection
      // } else if (token || expiry) {
      //   // Only clear invalid tokens after we're connected and not on reload
      //   if (!isInitialMount.current) {
      //     // console.log("Clearing invalid token after successful connection");
      //     FrontendLogger.debug(
      //       "Clearing invalid token after successful connection"
      //     );
      //     clearReconnectionTokens();
      //   }
      // }

      setSocket(ws);
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        // Forward message to game context if callback is provided
        if (onMessage) {
          onMessage(data);
        }

        // Handle connection-specific messages
        if (data.type === CONNECTION_ESTABLISHED) {
          setClientId(data.payload.clientId);
          // console.log("Received client ID:", data.payload.clientId);
          FrontendLogger.info("Received client ID:", data.payload.clientId);
        }

        if (data.type === RECONNECTION_TOKEN) {
          const { token, expiresIn } = data.payload;
          if (!token || !expiresIn) {
            // console.error("Invalid reconnection token data", data.payload);
            FrontendLogger.error(
              "Invalid reconnection token data",
              data.payload
            );
            return;
          }

          const expiry = Date.now() + expiresIn * 1000;
          // console.log(`Received reconnection token, expires in ${expiresIn}s`);
          FrontendLogger.debug(
            `Received reconnection token, expires in ${expiresIn}s`
          );
          localStorage.setItem(RECONNECTION_TOKEN, token);
          localStorage.setItem(RECONNECTION_TOKEN_EXPIRY, String(expiry));
          reconnectingToken.current = token;
          reconnectingTokenExpiry.current = expiry;
        }

        // Handle reconnection responses
        if (data.type === RECONNECTION_SUCCESSFUL) {
          // console.log("Reconnection successful, clearing reconnection UI");
          FrontendLogger.info(
            "Reconnection successful, clearing reconnection UI"
          );
          reconnectionSuccessful.current = true;

          // console.log(data.payload.gameState);
          FrontendLogger.debug("Game state:", data.payload.gameState);

          // Important: Set game state first before clearing tokens
          setGameState?.("playing");

          // Use a short delay to ensure the game state is fully updated before removing UI
          setTimeout(() => {
            // console.log("Delayed token clearing after successful reconnection");
            FrontendLogger.debug(
              "Delayed token clearing after successful reconnection"
            );
            if (setReconnecting) {
              // console.log(
              //   "Setting reconnecting state to false after successful reconnection"
              // );
              FrontendLogger.debug(
                "Setting reconnecting state to false after successful reconnection"
              );
              setReconnecting(false);
            }
            // Don't clear tokens on initial page load
            if (!isInitialMount.current) {
              clearReconnectionTokens();
            } else {
              // console.log(
              //   "In initial mount, skipping token clearing but updating UI"
              // );
              FrontendLogger.debug(
                "In initial mount, skipping token clearing but updating UI"
              );
              if (setReconnecting) {
                setReconnecting(false);
              }
            }
          }, 500);
        } else if (data.type === RECONNECTION_FAILED) {
          // console.log(
          //   "Reconnection failed:",
          //   data.payload?.reason || "Unknown reason"
          // );
          FrontendLogger.error(
            "Reconnection failed:",
            data.payload?.reason || "Unknown reason"
          );
          reconnectionSuccessful.current = false;

          // Don't immediately clear token during initial mount to avoid race conditions
          setTimeout(() => {
            if (!isInitialMount.current) {
              // console.log("Clearing reconnection UI after failed reconnection");
              FrontendLogger.debug(
                "Clearing reconnection UI after failed reconnection"
              );
              if (setReconnecting) {
                // console.log(
                //   "Setting reconnecting state to false after failed reconnection"
                // );
                FrontendLogger.debug(
                  "Setting reconnecting state to false after failed reconnection"
                );
                setReconnecting(false);
              }
              clearReconnectionTokens();
            } else {
              // console.log(
              //   "Still in initial mount, not clearing reconnection UI yet"
              // );
              FrontendLogger.debug(
                "Still in initial mount, not clearing reconnection UI yet"
              );
            }
          }, 2000);
        }

        if (data.type === PING) {
          ws.send(JSON.stringify({ type: PONG }));
        }
      } catch (e) {
        // console.error("Error parsing message", e);
        FrontendLogger.error("Error parsing message", e);
      }
    };

    ws.onerror = (error) => {
      // console.error("WebSocket error:", error);
      FrontendLogger.error("WebSocket error:", error);
    };

    ws.onclose = (event) => {
      // console.log("Disconnected from server");
      FrontendLogger.info(
        `Disconnected from server with code: ${event.code}, reason: ${
          event.reason || "No reason provided"
        }`
      );
      setSocket(null);
      socketRef.current = null;
      setIsConnecting(false);

      // More reliable page reload/visibility detection
      const isPageHidden = document.visibilityState === "hidden";

      // Better reload detection by checking document readyState
      const isRecentlyLoaded =
        document.readyState !== "complete" ||
        Date.now() - performance.timeOrigin < 5000;

      const token = localStorage.getItem(RECONNECTION_TOKEN);
      const expiry = Number(localStorage.getItem(RECONNECTION_TOKEN_EXPIRY));
      const isValid = token && expiry && expiry > Date.now();

      if (isValid) {
        // If this is during a page reload or tab switch, preserve the token
        if (isPageHidden || isRecentlyLoaded || isInitialMount.current) {
          // console.log(
          //   "Page reload/hidden detected, preserving reconnection token"
          // );
          FrontendLogger.debug(
            "Page reload/hidden detected, preserving reconnection token"
          );
          return;
        }

        // Show reconnecting UI automatically when we have a valid token
        setHasReconnectionToken(true);
        if (setReconnecting) {
          setReconnecting(true);
        }

        // Attempt automatic reconnection for normal disconnections
        if (reconnectionAttempts.current >= 10) {
          // console.warn("Max reconnection attempts reached. Giving up.");
          FrontendLogger.error("Max reconnection attempts reached. Giving up.");
          return;
        }

        reconnectionAttempts.current++;
        const delay = Math.min(10000, 500 * 2 ** reconnectionAttempts.current);
        // console.log(
        //   `Attempting reconnection in ${delay}ms (attempt #${reconnectionAttempts.current})`
        // );
        FrontendLogger.info(
          `Attempting reconnection in ${delay}ms (attempt #${reconnectionAttempts.current})`
        );
        setTimeout(connectWebSocket, delay);
      } else if (token || expiry) {
        // Don't clear invalid tokens during initial page load
        if (!isInitialMount.current) {
          // console.log("Invalid token detected during disconnect, clearing");
          FrontendLogger.debug(
            "Invalid token detected during disconnect, clearing"
          );
          clearReconnectionTokens();
        }
      }
    };
  }, [clearReconnectionTokens, hasReconnectionToken, onMessage, setGameState]);

  // Manual reconnection function (called from UI)
  const reconnect = useCallback(() => {
    if (!isConnecting && !socket) {
      // console.log("Manual reconnection initiated");
      FrontendLogger.info("Manual reconnection initiated");
      // Show reconnecting UI when manual reconnection is triggered
      if (setReconnecting) {
        setReconnecting(true);
      }
      reconnectionAttempts.current = 0;
      connectWebSocket();
    }
  }, [connectWebSocket, isConnecting, socket, setReconnecting]);

  // Initialize connection on component mount
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      connectWebSocket();
    }

    // Add visibility change listener for tab switching
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // console.log("Tab became visible, checking connection status");
        FrontendLogger.debug("Tab became visible, checking connection status");

        // Wait a short moment to see if WebSocket recovers automatically
        setTimeout(() => {
          // Only run socket checks if we're not showing reconnection UI already
          if (!hasReconnectionToken) {
            const isSocketOpen = socket && socket.readyState === WebSocket.OPEN;
            const isSocketRefOpen =
              socketRef.current &&
              socketRef.current.readyState === WebSocket.OPEN;

            if (!isSocketOpen && !isSocketRefOpen) {
              // Check if we have a valid reconnection token
              const token = localStorage.getItem(RECONNECTION_TOKEN);
              const expiry = Number(
                localStorage.getItem(RECONNECTION_TOKEN_EXPIRY)
              );
              const isValid = token && expiry && expiry > Date.now();

              if (isValid) {
                // console.log(
                //   "Socket disconnected after tab switch, showing reconnect UI"
                // );
                FrontendLogger.info(
                  "Socket disconnected after tab switch, showing reconnect UI"
                );
                setHasReconnectionToken(true);
              }
            } else {
              // console.log(
              //   "Socket is connected after tab switch, no need for reconnection UI"
              // );
              FrontendLogger.debug(
                "Socket is connected after tab switch, no need for reconnection UI"
              );
            }
          }
        }, 1000);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      // console.log("Cleaning up socket connection");
      FrontendLogger.debug("Cleaning up socket connection");
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      if (
        socketRef.current &&
        socketRef.current.readyState === WebSocket.OPEN
      ) {
        socketRef.current.close();
      }
      socketRef.current = null;
    };
  }, [connectWebSocket, socket, hasReconnectionToken]);

  // Handle page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Set a flag to indicate this is a reload
      isPageReload.current = true;

      if (
        socketRef.current &&
        socketRef.current.readyState === WebSocket.OPEN
      ) {
        socketRef.current.send(JSON.stringify({ type: CLIENT_DISCONNECT }));
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Helper method to send messages
  const sendMessage = useCallback(
    (messageType: string, payload?: any) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: messageType,
            payload: payload || {},
          })
        );
        return true;
      }
      // console.error(
      //   `Cannot send message ${messageType}, socket is not connected`
      // );
      FrontendLogger.error(
        `Cannot send message ${messageType}, socket is not connected`
      );
      return false;
    },
    [socket]
  );

  return {
    socket,
    isConnecting,
    reconnect,
    clientId,
    hasReconnectionToken,
    sendMessage, // Add helper method
    isReconnected: reconnectionSuccessful.current,
  };
};

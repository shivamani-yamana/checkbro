import {
  CLIENT_DISCONNECT,
  CONNECTION_ESTABLISHED,
  PING,
  PONG,
  // RECONNECT_REQUEST,
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

// Create a singleton instance ID to track if the hook is reused
let SINGLETON_INSTANCE_CREATED = false;

export const useSocket = (props: UseSocketProps = {}) => {
  const { setGameState, setReconnecting, onMessage } = props;

  // Add instance tracking to debug multiple hook creations
  const instanceId = useRef(
    `socket-instance-${Math.random().toString(36).substring(2, 9)}`
  );

  // Flag to indicate if this instance has already initialized a socket
  const hasInitialized = useRef(false);

  // Warn about multiple hook instances which can cause connection issues
  useEffect(() => {
    if (SINGLETON_INSTANCE_CREATED) {
      FrontendLogger.error(
        `Multiple useSocket instances detected. This can cause socket disconnections. Current instance: ${instanceId.current}`
      );
    } else {
      SINGLETON_INSTANCE_CREATED = true;
      FrontendLogger.debug(`useSocket instance created: ${instanceId.current}`);
    }

    return () => {
      if (instanceId.current) {
        SINGLETON_INSTANCE_CREATED = false;
        FrontendLogger.debug(
          `useSocket instance destroyed: ${instanceId.current}`
        );
      }
    };
  }, []);

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
  // Track connection attempts to avoid race conditions
  const connectionAttemptId = useRef<string | null>(null);

  const clearReconnectionTokens = useCallback(() => {
    // Don't clear tokens on initial page load/reload
    if (isInitialMount.current) {
      FrontendLogger.debug("Skipping token clearing during initial page load");
      return;
    }

    FrontendLogger.info("Clearing reconnection tokens");
    localStorage.removeItem(RECONNECTION_TOKEN);
    localStorage.removeItem(RECONNECTION_TOKEN_EXPIRY);
    reconnectingToken.current = null;
    reconnectingTokenExpiry.current = null;
    setHasReconnectionToken(false);
    if (setReconnecting) {
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
        FrontendLogger.debug(
          "Setting reconnecting state to true on page load with valid token"
        );
        setReconnecting(true);
      }
    } else if (token || expiry) {
      FrontendLogger.debug("Found invalid reconnection token on page load");
    }

    // Turn off the initial mount flag after a short delay
    const timer = setTimeout(() => {
      isInitialMount.current = false;
    }, 2000); // 2-second grace period

    return () => clearTimeout(timer);
  }, [setReconnecting]);

  const connectWebSocket = useCallback(() => {
    // Generate a unique ID for this connection attempt
    const currentConnectionAttemptId = `conn-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}`;
    connectionAttemptId.current = currentConnectionAttemptId;

    FrontendLogger.debug(
      `Starting connection attempt: ${currentConnectionAttemptId}`
    );

    // Verify token expiry but don't clear during connection attempt
    if (reconnectingTokenExpiry.current) {
      const timeLeft = reconnectingTokenExpiry.current - Date.now();
      // Add a small buffer to expire time to handle clock skew/timing issues
      if (timeLeft < -5000) {
        // Only consider it expired if it's more than 5 seconds past
        FrontendLogger.debug(
          "Token significantly expired, will be cleared after connection attempt"
        );
      } else if (timeLeft < 0) {
        FrontendLogger.debug(
          "Token just expired (within tolerance), still attempting reconnection"
        );
        // Treat as valid for reconnection attempts
      } else {
        FrontendLogger.debug(
          `Valid token found, expires in ${Math.round(timeLeft / 1000)}s`
        );
      }
    } else {
      FrontendLogger.debug("No reconnection token found");
    }

    // Only set connecting state if no socket exists
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setIsConnecting(true);
    } else {
      FrontendLogger.debug(
        "Socket already exists, reusing existing connection"
      );
      return;
    }

    const socketUrl = import.meta.env.VITE_WEBSOCKET_URL;
    const ws = new WebSocket(socketUrl);

    // Track when socket was created to debug connection timing issues
    const connectionStartTime = Date.now();

    // Store socket reference for cleanup
    socketRef.current = ws;

    ws.onopen = () => {
      // Verify this is still the active connection attempt
      if (connectionAttemptId.current !== currentConnectionAttemptId) {
        FrontendLogger.debug(
          `Ignoring outdated connection attempt: ${currentConnectionAttemptId}`
        );
        ws.close();
        return;
      }

      const connectionTime = Date.now() - connectionStartTime;
      FrontendLogger.info(`Connected to server (took ${connectionTime}ms)`);

      // Send a hello message immediately to establish identity
      try {
        ws.send(
          JSON.stringify({
            type: "CLIENT_HELLO",
            payload: {
              clientType: "player",
              timestamp: Date.now(),
              reconnect: reconnectingToken.current ? true : false,
            },
          })
        );
        FrontendLogger.debug("Sent initial CLIENT_HELLO message");
      } catch (err) {
        FrontendLogger.error("Failed to send initial hello message", err);
      }

      reconnectionAttempts.current = 0;
      setIsConnecting(false);
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
          FrontendLogger.info("Received client ID:", data.payload.clientId);
        }

        if (data.type === RECONNECTION_TOKEN) {
          const { token, expiresIn } = data.payload;
          if (!token || !expiresIn) {
            FrontendLogger.error(
              "Invalid reconnection token data",
              data.payload
            );
            return;
          }

          const expiry = Date.now() + expiresIn * 1000;
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
          FrontendLogger.info(
            "Reconnection successful, clearing reconnection UI"
          );
          reconnectionSuccessful.current = true;

          FrontendLogger.debug("Game state:", data.payload.gameState);

          // Important: Set game state first before clearing tokens
          setGameState?.("playing");

          // Use a short delay to ensure the game state is fully updated before removing UI
          setTimeout(() => {
            FrontendLogger.debug(
              "Delayed token clearing after successful reconnection"
            );
            if (setReconnecting) {
              FrontendLogger.debug(
                "Setting reconnecting state to false after successful reconnection"
              );
              setReconnecting(false);
            }
            // Don't clear tokens on initial page load
            if (!isInitialMount.current) {
              clearReconnectionTokens();
            } else {
              FrontendLogger.debug(
                "In initial mount, skipping token clearing but updating UI"
              );
              if (setReconnecting) {
                setReconnecting(false);
              }
            }
          }, 500);
        } else if (data.type === RECONNECTION_FAILED) {
          FrontendLogger.error(
            "Reconnection failed:",
            data.payload?.reason || "Unknown reason"
          );
          reconnectionSuccessful.current = false;

          // Don't immediately clear token during initial mount to avoid race conditions
          setTimeout(() => {
            if (!isInitialMount.current) {
              FrontendLogger.debug(
                "Clearing reconnection UI after failed reconnection"
              );
              if (setReconnecting) {
                FrontendLogger.debug(
                  "Setting reconnecting state to false after failed reconnection"
                );
                setReconnecting(false);
              }
              clearReconnectionTokens();
            } else {
              FrontendLogger.debug(
                "Still in initial mount, not clearing reconnection UI yet"
              );
            }
          }, 2000);
        }

        if (data.type === PING) {
          FrontendLogger.debug("Received PING, sending PONG");
          ws.send(JSON.stringify({ type: PONG }));
        }
      } catch (e) {
        FrontendLogger.error("Error parsing message", e);
      }
    };

    ws.onerror = (error) => {
      FrontendLogger.error("WebSocket error:", error);
    };

    ws.onclose = (event) => {
      const connectionDuration = Date.now() - connectionStartTime;
      FrontendLogger.info(
        `Disconnected from server after ${connectionDuration}ms with code: ${
          event.code
        }, reason: ${event.reason || "No reason provided"}`
      );

      // Verify this matches the current connection attempt
      if (connectionAttemptId.current !== currentConnectionAttemptId) {
        FrontendLogger.debug(
          `Ignoring close event for outdated connection: ${currentConnectionAttemptId}`
        );
        return;
      }

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
          FrontendLogger.error("Max reconnection attempts reached. Giving up.");
          return;
        }

        reconnectionAttempts.current++;
        const delay = Math.min(10000, 500 * 2 ** reconnectionAttempts.current);
        FrontendLogger.info(
          `Attempting reconnection in ${delay}ms (attempt #${reconnectionAttempts.current})`
        );

        setTimeout(() => {
          // Only attempt reconnection if we're still the active instance
          if (SINGLETON_INSTANCE_CREATED && instanceId.current) {
            connectWebSocket();
          }
        }, delay);
      } else if (token || expiry) {
        // Don't clear invalid tokens during initial page load
        if (!isInitialMount.current) {
          FrontendLogger.debug(
            "Invalid token detected during disconnect, clearing"
          );
          clearReconnectionTokens();
        }
      }
    };
  }, [clearReconnectionTokens, setGameState, onMessage]);

  // Manual reconnection function (called from UI)
  const reconnect = useCallback(() => {
    if (!isConnecting && !socket) {
      FrontendLogger.info("Manual reconnection initiated");
      // Show reconnecting UI when manual reconnection is triggered
      if (setReconnecting) {
        setReconnecting(true);
      }
      reconnectionAttempts.current = 0;
      connectWebSocket();
    }
  }, [connectWebSocket, isConnecting, socket, setReconnecting]);

  // Initialize connection on component mount - ONLY ONCE
  useEffect(() => {
    FrontendLogger.debug(
      `Socket initialization effect running (${instanceId.current})`
    );

    if (!hasInitialized.current) {
      hasInitialized.current = true;
      FrontendLogger.debug("First initialization, connecting WebSocket");
      connectWebSocket();
    }

    // Add visibility change listener for tab switching
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
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
                FrontendLogger.info(
                  "Socket disconnected after tab switch, showing reconnect UI"
                );
                setHasReconnectionToken(true);
              }
            } else {
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
      FrontendLogger.debug(
        `Cleaning up socket instance (${instanceId.current})`
      );
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      if (
        socketRef.current &&
        socketRef.current.readyState === WebSocket.OPEN
      ) {
        socketRef.current.close();
      }
      socketRef.current = null;
    };
  }, []);

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
    sendMessage,
    isReconnected: reconnectionSuccessful.current,
  };
};

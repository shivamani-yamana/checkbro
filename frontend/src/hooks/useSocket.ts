import { useState, useEffect, useRef } from "react";

export const useSocket = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [, setClientId] = useState<string | null>(null);

  // Use ref to maintain a stable reference to the socket
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Create WebSocket connection
    // const ws = new WebSocket("wss://checkbro.onrender.com");
    // For Vite, we use import.meta.env instead of process.env
    const socketUrl =
      import.meta.env.VITE_WEBSOCKET_URL || "ws://localhost:8000";
    const ws = new WebSocket(socketUrl);

    socketRef.current = ws;

    // Connection opened
    ws.onopen = () => {
      console.log("Connected to server");
      setSocket(ws);
    };

    // Handle incoming messages
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Handle connection established message to get client ID
        if (data.type === "connection_established") {
          setClientId(data.payload.clientId);
          console.log("Received client ID:", data.payload.clientId);
        }

        // Respond to server heartbeats
        if (data.type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }));
        }
      } catch (e) {
        console.error("Error parsing message", e);
      }
    };

    // Handle errors and disconnections
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("Disconnected from server");
      setSocket(null);
      socketRef.current = null;
    };

    // Cleanup on unmount
    return () => {
      console.log("Cleaning up socket connection");
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      socketRef.current = null;
    };
  }, []);

  // Also send a beforeunload message
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (
        socketRef.current &&
        socketRef.current.readyState === WebSocket.OPEN
      ) {
        socketRef.current.send(
          JSON.stringify({
            type: "client_disconnect",
          })
        );
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return socket;
};

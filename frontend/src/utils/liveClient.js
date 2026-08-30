const CLOUD_RUN_WS_URL = "wss://agent-mentor-live-277455806902.us-central1.run.app/ws/live";

export class LiveClient {
  constructor({ onMessage = () => {}, onStatusChange = () => {} } = {}) {
    this.ws = null;
    this.onMessage = onMessage;
    this.onStatusChange = onStatusChange;
    this.pingInterval = null;
    this.frameInterval = null;
  }

  connect(wsUrl = CLOUD_RUN_WS_URL) {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.onStatusChange("connecting");

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log("WebSocket connected to Cloud Run Gateway.");
        this.onStatusChange("connected");

        this.pingInterval = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: "ping" }));
          }
        }, 20000);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.onMessage(data);
        } catch (err) {
          console.error("Failed to parse incoming WebSocket message:", err);
        }
      };

      this.ws.onclose = () => {
        console.log("WebSocket connection closed.");
        this.onStatusChange("disconnected");
        this.cleanupTimers();
      };

      this.ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        this.onStatusChange("error");
      };
    } catch (err) {
      console.error("WebSocket initialization failure:", err);
      this.onStatusChange("error");
    }
  }

  stop() {
    this.stopFrameStreaming();
    this.cleanupTimers();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.onStatusChange("disconnected");
  }

  startFrameStreaming(getCanvasBlobCallback) {
    if (this.frameInterval) clearInterval(this.frameInterval);
    this.frameInterval = setInterval(async () => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
      if (typeof getCanvasBlobCallback !== "function") return;
      try {
        const base64Data = await getCanvasBlobCallback();
        if (base64Data) {
          this.ws.send(JSON.stringify({ type: "canvas_frame", data: base64Data }));
        }
      } catch (e) {
        console.error("Canvas frame capture error:", e);
      }
    }, 1000);
  }

  stopFrameStreaming() {
    if (this.frameInterval) {
      clearInterval(this.frameInterval);
      this.frameInterval = null;
    }
  }

  cleanupTimers() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.frameInterval) clearInterval(this.frameInterval);
    this.pingInterval = null;
    this.frameInterval = null;
  }

  sendMessage(text) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "text", text }));
    }
  }
}

export const liveClient = new LiveClient();
// Replace with your actual Cloud Run URL
const CLOUD_RUN_WS_URL = "wss://agent-mentor-live-277455806902.us-central1.run.app/ws/live";

export class LiveClient {
  constructor({ onAudioData, onToolCall, onStatusChange }) {
    this.ws = null;
    this.audioContext = null;
    this.mediaStream = null;
    this.audioInput = null;
    this.processor = null;
    this.onAudioData = onAudioData;
    this.onToolCall = onToolCall;
    this.onStatusChange = onStatusChange;
    this.frameInterval = null;
  }

  async connect(wsUrl = CLOUD_RUN_WS_URL) {
    this.ws = new WebSocket(wsUrl);
    this.onStatusChange("connecting");

    this.ws.onopen = async () => {
      this.onStatusChange("connected");
      await this.initMicrophone();
    };

    this.ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "audio") {
          this.playAudioChunk(payload.data);
        } else if (payload.type === "tool_call") {
          this.onToolCall(payload.function, payload.args);
        }
      } catch (err) {
        console.error("Error handling live message:", err);
      }
    };

    this.ws.onclose = () => {
      this.onStatusChange("disconnected");
      this.stop();
    };

    this.ws.onerror = (err) => {
      console.error("WebSocket error:", err);
      this.onStatusChange("error");
    };
  }

  async initMicrophone() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000,
      });
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, sampleRate: 16000 },
      });

      this.audioInput = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          const floatData = e.inputBuffer.getChannelData(0);
          const pcm16 = new Int16Array(floatData.length);
          for (let i = 0; i < floatData.length; i++) {
            const s = Math.max(-1, Math.min(1, floatData[i]));
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }
          const b64Data = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
          this.ws.send(JSON.stringify({ type: "audio", data: b64Data }));
        }
      };

      this.audioInput.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
    } catch (err) {
      console.error("Microphone access error:", err);
    }
  }

  startFrameStreaming(getCanvasBlob) {
    this.frameInterval = setInterval(async () => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN && getCanvasBlob) {
        const blob = await getCanvasBlob();
        if (blob) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64Data = reader.result.split(",")[1];
            this.ws.send(JSON.stringify({ type: "image", data: base64Data }));
          };
          reader.readAsDataURL(blob);
        }
      }
    }, 1000);
  }

  playAudioChunk(b64Audio) {
    try {
      const binary = atob(b64Audio);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const pcm16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768.0;
      }

      if (this.audioContext) {
        const audioBuffer = this.audioContext.createBuffer(1, float32.length, 16000);
        audioBuffer.copyToChannel(float32, 0);
        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.audioContext.destination);
        source.start();
      }
    } catch (err) {
      console.error("Error playing audio chunk:", err);
    }
  }

  stop() {
    if (this.frameInterval) clearInterval(this.frameInterval);
    if (this.processor) this.processor.disconnect();
    if (this.audioInput) this.audioInput.disconnect();
    if (this.mediaStream) this.mediaStream.getTracks().forEach((t) => t.stop());
    if (this.audioContext && this.audioContext.state !== "closed") this.audioContext.close();
    if (this.ws) this.ws.close();
  }
}
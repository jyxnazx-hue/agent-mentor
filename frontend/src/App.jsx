import React, { useState, useEffect, useRef } from "react";
import CanvasWorkspace from "./components/CanvasWorkspace";
import { liveClient } from "./utils/liveClient";

export default function App() {
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [messages, setMessages] = useState([]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [metrics, setMetrics] = useState({
    notes: 0,
    flashcards: 0,
    checklist: 0,
  });

  const liveClientRef = useRef(liveClient);

  useEffect(() => {
    // 1. Bind event handlers
    liveClientRef.current.onStatusChange = (status) => {
      setConnectionStatus(status);
    };

    liveClientRef.current.onMessage = (msg) => {
      if (msg.type === "text") {
        setMessages((prev) => [...prev, { sender: "agent", text: msg.data }]);
      } else if (msg.type === "tool_call") {
        handleAgentTool(msg.function, msg.args);
      }
    };

    // 2. Connect to Cloud Run WebSocket on mount
    liveClientRef.current.connect();

    return () => {
      liveClientRef.current.stop();
    };
  }, []);

  const handleAgentTool = (funcName, args) => {
    if (funcName === "generate_flashcard") {
      setMetrics((m) => ({ ...m, flashcards: m.flashcards + 1 }));
    } else if (funcName === "update_checklist") {
      setMetrics((m) => ({ ...m, checklist: m.checklist + 1 }));
    } else if (funcName === "synthesize_notes") {
      setMetrics((m) => ({ ...m, notes: m.notes + 1 }));
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputPrompt.trim()) return;

    setMessages((prev) => [...prev, { sender: "user", text: inputPrompt }]);
    liveClientRef.current.sendMessage(inputPrompt);
    setInputPrompt("");
  };

  return (
    <div className="flex h-screen w-screen bg-[#0a0a0c] text-white select-none">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-neutral-800 p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 font-bold text-lg mb-6">
            <span className="p-1 bg-white text-black rounded text-xs font-mono">AM</span>
            agent-mentor
          </div>
          <div className="space-y-2">
            <div className="text-xs uppercase text-neutral-500 font-semibold tracking-wider">Chapters & Units</div>
            <div className="p-2 bg-neutral-900 rounded border border-neutral-700 text-sm">1. Vector Fields & Flux</div>
            <div className="p-2 bg-neutral-900/40 rounded border border-neutral-800/60 text-sm text-neutral-400">2. Green's & Stokes' Theorem</div>
            <div className="p-2 bg-neutral-900/40 rounded border border-neutral-800/60 text-sm text-neutral-400">3. Divergence Theorem</div>
          </div>
        </div>

        {/* Study Compass Counters */}
        <div className="space-y-2 text-xs border-t border-neutral-800 pt-4 text-neutral-400">
          <div className="flex justify-between"><span>Notes Synthesized</span><span className="font-mono text-white">{metrics.notes}</span></div>
          <div className="flex justify-between"><span>Cards Generated</span><span className="font-mono text-white">{metrics.flashcards}</span></div>
          <div className="flex justify-between"><span>Checklist Pending</span><span className="font-mono text-white">{metrics.checklist}</span></div>
        </div>
      </aside>

      {/* Main Canvas Area */}
      <main className="flex-1 flex flex-col">
        <header className="h-14 border-b border-neutral-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium bg-neutral-800 px-3 py-1 rounded">Calculus III</span>
            <span className="text-sm font-medium text-neutral-400 px-3 py-1">Computational Physics</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${connectionStatus === "connected" ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-neutral-600"}`} />
            <span className="text-xs text-neutral-400 capitalize">{connectionStatus}</span>
          </div>
        </header>

        <div className="flex-1 relative">
          <CanvasWorkspace liveClientRef={liveClientRef} />
        </div>
      </main>

      {/* Agent Chat & Live Panel */}
      <aside className="w-80 border-l border-neutral-800 flex flex-col justify-between bg-neutral-950/60">
        <div className="p-4 border-b border-neutral-800 font-semibold text-sm flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          GEMINI LIVE AGENT
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages.map((msg, idx) => (
            <div key={idx} className={`p-3 rounded-lg text-sm ${msg.sender === "user" ? "bg-neutral-800 ml-6 text-right" : "bg-neutral-900 border border-neutral-800 mr-6"}`}>
              {msg.text}
            </div>
          ))}
        </div>

        <form onSubmit={handleSendMessage} className="p-4 border-t border-neutral-800 flex gap-2">
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Ask a question or type instructions..."
            className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-neutral-600"
          />
          <button type="submit" className="bg-white text-black px-4 py-2 rounded text-sm font-medium hover:bg-neutral-200 transition">
            Send
          </button>
        </form>
      </aside>
    </div>
  );
}
import React, { useState, useEffect, useRef } from "react";
import { 
  Home, Plus, ChevronLeft, ChevronRight,
  MessageSquare, Search, Upload, FileText, Layers, CheckSquare, 
  HelpCircle, Mic, Send, X, Compass, History, BookOpen, Clock
} from "lucide-react";
import CanvasWorkspace from "./components/CanvasWorkspace";
import WorkspaceModals from "./components/WorkspaceModals";
import { LiveClient } from "./utils/liveClient";

export default function App() {
  const [subjects, setSubjects] = useState(["Calculus III", "HPC Systems", "Computational Physics"]);
  const [activeSubject, setActiveSubject] = useState("Calculus III");
  
  // Chapter & Notes State
  const [chapters, setChapters] = useState([
    { id: 1, title: "1. Vector Fields & Flux" },
    { id: 2, title: "2. Green's & Stokes' Theorem" },
    { id: 3, title: "3. Divergence Theorem" }
  ]);
  const [editingChapterId, setEditingChapterId] = useState(null);
  const [editTitleText, setEditTitleText] = useState("");
  const [isChapterCollapsed, setIsChapterCollapsed] = useState(false);

  // Modals & Panels
  const [activeModal, setActiveModal] = useState(null); // 'search'|'upload'|'notes'|'cards'|'checklist'|'quiz'|'compass'
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");

  // Dynamic Session Data
  const [highlightBoxes, setHighlightBoxes] = useState([]);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [textInput, setTextInput] = useState("");
  const [checklist, setChecklist] = useState([]);
  const [flashcards, setFlashcards] = useState([]);
  const [notes, setNotes] = useState([]);
  const [sessionMinutes, setSessionMinutes] = useState(0);

  const liveClientRef = useRef(null);
  const aiWriterRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setSessionMinutes(prev => prev + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    liveClientRef.current = new LiveClient({
      onAudioData: () => {},
      onStatusChange: setConnectionStatus,
      onToolCall: (funcName, args) => {
        if (funcName === "calculate_screen_coordinates") {
          setHighlightBoxes([args.box_2d || [200, 100, 400, 900]]);
        } else if (funcName === "update_checklist") {
          setChecklist((prev) => [...prev, { ...args, id: Date.now() }]);
        } else if (funcName === "generate_flashcard") {
          setFlashcards((prev) => [...prev, { ...args, id: Date.now() }]);
        } else if (funcName === "trigger_whiteboard_write") {
          if (aiWriterRef.current) aiWriterRef.current(args.steps || []);
        }
      },
    });

    liveClientRef.current.connect();
    return () => liveClientRef.current.stop();
  }, []);

  const handleAddChapter = () => {
    const newId = chapters.length + 1;
    const newChap = { id: newId, title: `${newId}. New Unit` };
    setChapters([...chapters, newChap]);
    setEditingChapterId(newId);
    setEditTitleText(newChap.title);
  };

  const handleSaveChapterTitle = (id) => {
    setChapters(chapters.map(c => c.id === id ? { ...c, title: editTitleText } : c));
    setEditingChapterId(null);
  };

  const handleSendChat = () => {
    if (!textInput.trim()) return;
    const userMsg = { 
      sender: "user", 
      text: textInput, 
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    };
    setConversationHistory(prev => [...prev, userMsg]);
    if (liveClientRef.current?.ws) {
      liveClientRef.current.ws.send(JSON.stringify({ type: "text", text: textInput }));
    }
    setTextInput("");
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-white text-slate-900 font-sans overflow-hidden select-none">
      {/* 1. Header with Home, Branding, Subject Tabs & Connection */}
      <header className="h-12 px-6 flex items-center justify-between border-b border-slate-100 bg-white z-30">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2.5">
            <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-800 transition-colors">
              <Home className="w-4 h-4" />
            </button>
            <span className="font-semibold text-xs text-slate-900 tracking-tight">agent-mentor</span>
          </div>

          {/* Floating Subject Tabs */}
          <div className="flex items-center space-x-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
            {subjects.map((subj) => (
              <button
                key={subj}
                onClick={() => setActiveSubject(subj)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeSubject === subj
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {subj}
              </button>
            ))}
            <button 
              onClick={() => {
                const title = prompt("New Subject Tab Name:");
                if (title) setSubjects([...subjects, title]);
              }}
              className="p-1 rounded-lg text-slate-500 hover:bg-slate-200/60"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Live Status Indicator */}
        <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-500">
          <span className={`w-2 h-2 rounded-full ${connectionStatus === "connected" ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
          <span>{connectionStatus === "connected" ? "Gemini Live Active" : "Disconnected"}</span>
        </div>
      </header>

      {/* 2. Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar (Chapters, Notes & Session Stats) */}
        <aside className={`border-r border-slate-100 bg-white transition-all duration-200 flex flex-col justify-between ${isChapterCollapsed ? "w-12" : "w-64"}`}>
          <div>
            {/* Top Collapsible Control Header */}
            <div className="p-3 border-b border-slate-100 flex items-center justify-between">
              {!isChapterCollapsed ? (
                <>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Chapters & Units</span>
                  <div className="flex items-center space-x-1">
                    <button onClick={handleAddChapter} className="p-1 rounded hover:bg-slate-100 text-slate-600" title="Add Chapter">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setIsChapterCollapsed(true)} className="p-1 rounded hover:bg-slate-100 text-slate-400">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <button onClick={() => setIsChapterCollapsed(false)} className="w-full flex justify-center text-slate-500 hover:bg-slate-100 p-1 rounded">
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Chapter Items with Double-Click Inline Rename */}
            {!isChapterCollapsed && (
              <div className="p-3 space-y-1.5">
                {chapters.map((chap) => (
                  <div 
                    key={chap.id} 
                    onDoubleClick={() => {
                      setEditingChapterId(chap.id);
                      setEditTitleText(chap.title);
                    }}
                    className="p-2.5 rounded-xl border border-slate-200/70 hover:border-slate-800 text-xs font-medium text-slate-800 transition-all cursor-pointer bg-white"
                  >
                    {editingChapterId === chap.id ? (
                      <input
                        type="text"
                        value={editTitleText}
                        onChange={(e) => setEditTitleText(e.target.value)}
                        onBlur={() => handleSaveChapterTitle(chap.id)}
                        onKeyDown={(e) => e.key === "Enter" && handleSaveChapterTitle(chap.id)}
                        className="w-full text-xs p-1 bg-slate-50 rounded border border-slate-200 outline-none"
                        autoFocus
                      />
                    ) : (
                      <span className="truncate block">{chap.title}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Session Stats */}
          {!isChapterCollapsed && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-2 text-[11px] font-mono text-slate-500">
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <BookOpen className="w-3 h-3 text-slate-400" />
                  <span>Notes Synthesized</span>
                </span>
                <span className="font-semibold text-slate-900">{notes.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <Layers className="w-3 h-3 text-slate-400" />
                  <span>Cards Generated</span>
                </span>
                <span className="font-semibold text-slate-900">{flashcards.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <CheckSquare className="w-3 h-3 text-slate-400" />
                  <span>Checklist Pending</span>
                </span>
                <span className="font-semibold text-slate-900">{checklist.filter(c => c.status !== "completed").length}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                <span className="flex items-center space-x-1.5">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Active Session</span>
                </span>
                <span className="font-semibold text-slate-900">{sessionMinutes}m</span>
              </div>
            </div>
          )}
        </aside>

        {/* Center Canvas Working Area */}
        <main className="flex-1 bg-white relative overflow-hidden">
          <CanvasWorkspace
            highlightBoxes={highlightBoxes}
            onLassoSelect={(points) => {
              const lassoMsg = { 
                sender: "user", 
                text: "[Targeted Area Selected]", 
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
              };
              setConversationHistory(prev => [...prev, lassoMsg]);
            }}
            registerGetBlob={(getter) => {
              if (liveClientRef.current) liveClientRef.current.startFrameStreaming(getter);
            }}
            registerAiWriter={(fn) => { aiWriterRef.current = fn; }}
          />
        </main>

        {/* 3. Centered-Right Floating Vertical Tools Dock */}
        <nav className="my-auto mr-4 flex flex-col space-y-1.5 bg-white/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-md z-30">
          <button onClick={() => setActiveModal("search")} className="p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all" title="Search (Ctrl+K)">
            <Search className="w-4 h-4" />
          </button>
          <button onClick={() => setActiveModal("upload")} className="p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all" title="Upload Materials">
            <Upload className="w-4 h-4" />
          </button>
          <button onClick={() => setActiveModal("compass")} className="p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all" title="Study Compass">
            <Compass className="w-4 h-4" />
          </button>
          <button onClick={() => setActiveModal("notes")} className="p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all" title="Session Notes">
            <FileText className="w-4 h-4" />
          </button>
          <button onClick={() => setActiveModal("cards")} className="p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all" title="Concept Cards">
            <Layers className="w-4 h-4" />
          </button>
          <button onClick={() => setActiveModal("checklist")} className="p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all" title="Review Checklist">
            <CheckSquare className="w-4 h-4" />
          </button>
          <button onClick={() => setActiveModal("quiz")} className="p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all" title="Diagnostic Quiz">
            <HelpCircle className="w-4 h-4" />
          </button>
        </nav>

        {/* 4. Bottom-Right Circular Agent Button */}
        {!isAiPanelOpen && (
          <button
            onClick={() => setIsAiPanelOpen(true)}
            className="absolute bottom-6 right-6 p-3.5 bg-slate-900 text-white rounded-full shadow-2xl hover:bg-slate-800 transition-all z-40"
            title="Open Gemini Live Agent"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
        )}

        {/* 5. Full-Height Floating Right Overlay Agent Panel */}
        {isAiPanelOpen && (
          <div className="absolute right-4 top-4 bottom-4 w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col justify-between p-4 z-40 animate-in fade-in duration-150">
            <div>
              {/* Agent Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${connectionStatus === "connected" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-900">Gemini Live Agent</span>
                </div>
                <div className="flex items-center space-x-1">
                  <button onClick={() => setConversationHistory([])} className="p-1 text-slate-400 hover:text-slate-700" title="Clear History">
                    <History className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setIsAiPanelOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Dynamic Conversation Stream */}
              <div className="h-[calc(100vh-190px)] overflow-y-auto py-3 space-y-3">
                {conversationHistory.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 text-xs space-y-1">
                    <p>Live session listening.</p>
                    <p className="text-[10px]">Speak into mic or type instructions below.</p>
                  </div>
                ) : (
                  conversationHistory.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                      <div className={`p-3 rounded-xl text-xs max-w-[85%] leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-slate-900 text-white"
                          : "bg-slate-50 text-slate-900 border border-slate-200"
                      }`}>
                        {msg.text}
                      </div>
                      <span className="text-[9px] font-mono text-slate-400 mt-1 px-1">{msg.timestamp}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Input & Voice Controls (Mic integrated inside input box) */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center space-x-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                  placeholder="Ask a question or type instructions..."
                  className="w-full bg-transparent text-xs px-2 outline-none text-slate-900 placeholder:text-slate-400"
                />
                <button 
                  className={`p-1.5 rounded-lg transition-colors ${connectionStatus === "connected" ? "text-slate-900 hover:bg-slate-200" : "text-slate-400"}`}
                  title="Voice Active"
                >
                  <Mic className="w-4 h-4" />
                </button>
                <button onClick={handleSendChat} className="p-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 6. Universal Modals */}
      <WorkspaceModals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        checklist={checklist}
        setChecklist={setChecklist}
        flashcards={flashcards}
        notes={notes}
        activeSubject={activeSubject}
      />
    </div>
  );
}
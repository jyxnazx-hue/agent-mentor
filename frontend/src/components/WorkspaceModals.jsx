import React from "react";
import { 
  X, Upload, CheckCircle2, Circle, Layers, FileText, 
  HelpCircle, Search, Compass, Network, ArrowRight
} from "lucide-react";

export default function WorkspaceModals({ 
  activeModal, 
  onClose, 
  checklist, 
  setChecklist, 
  flashcards, 
  notes,
  activeSubject 
}) {
  if (!activeModal) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            {activeModal === "search" && <Search className="w-4 h-4 text-slate-800" />}
            {activeModal === "upload" && <Upload className="w-4 h-4 text-slate-800" />}
            {activeModal === "notes" && <FileText className="w-4 h-4 text-slate-800" />}
            {activeModal === "cards" && <Layers className="w-4 h-4 text-slate-800" />}
            {activeModal === "checklist" && <CheckCircle2 className="w-4 h-4 text-slate-800" />}
            {activeModal === "quiz" && <HelpCircle className="w-4 h-4 text-slate-800" />}
            {activeModal === "compass" && <Compass className="w-4 h-4 text-slate-800" />}
            <h2 className="text-sm font-semibold capitalize text-slate-900">
              {activeModal === "compass" ? "Study Compass & Concept Graph" : `${activeModal} Hub`}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[65vh] overflow-y-auto">
          {activeModal === "search" && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search equations, concept notes, derivations, and transcripts..."
                  className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-800 transition-colors"
                  autoFocus
                />
              </div>
              <div className="flex space-x-2 pt-1 text-[11px] text-slate-500">
                <span className="px-2 py-1 bg-slate-100 rounded-md cursor-pointer hover:bg-slate-200">#StokesTheorem</span>
                <span className="px-2 py-1 bg-slate-100 rounded-md cursor-pointer hover:bg-slate-200">#HaloExchange</span>
                <span className="px-2 py-1 bg-slate-100 rounded-md cursor-pointer hover:bg-slate-200">#FluxIntegrals</span>
              </div>
            </div>
          )}

          {activeModal === "upload" && (
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center space-y-3 bg-slate-50/50">
              <Upload className="w-8 h-8 text-slate-400 mx-auto" />
              <div>
                <p className="text-xs font-medium text-slate-900">Upload PDF textbook chapters, notes, or assignment sheets</p>
                <p className="text-[11px] text-slate-500 mt-1">Multi-modal agent processes equations & diagrams in real time</p>
              </div>
              <input type="file" id="fileUpload" className="hidden" />
              <label 
                htmlFor="fileUpload" 
                className="inline-block px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg cursor-pointer transition-colors"
              >
                Choose Files
              </label>
            </div>
          )}

          {activeModal === "compass" && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900 flex items-center space-x-1.5">
                    <Network className="w-3.5 h-3.5" />
                    <span>Cross-Subject Knowledge Graph</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">{activeSubject}</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Concept links auto-generated during problem walkthroughs:
                </p>
                <div className="pt-2 flex flex-wrap gap-2">
                  <div className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs">
                    <span className="font-medium text-slate-800">Stokes' Theorem</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-600">Curl Circulation</span>
                  </div>
                  <div className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs">
                    <span className="font-medium text-slate-800">Halo Buffers</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-600">Boundary Stencils</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeModal === "checklist" && (
            <div className="space-y-2">
              {checklist.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-6">No active review items. Items populate as you solve problems.</p>
              ) : (
                checklist.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setChecklist(checklist.map(c => c.id === item.id ? { ...c, status: c.status === "completed" ? "pending" : "completed" } : c));
                    }}
                    className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:border-slate-800 transition-colors"
                  >
                    {item.status === "completed" ? (
                      <CheckCircle2 className="w-4 h-4 text-slate-900" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-400" />
                    )}
                    <div>
                      <p className={`text-xs font-medium ${item.status === "completed" ? "line-through text-slate-400" : "text-slate-900"}`}>
                        {item.topic}
                      </p>
                      <p className="text-[11px] text-slate-500">{item.action}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeModal === "cards" && (
            <div className="space-y-3">
              {flashcards.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-6">Definition cards are created dynamically during sessions.</p>
              ) : (
                flashcards.map((card) => (
                  <div key={card.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-900">{card.term}</span>
                      <span className="text-[10px] font-mono text-slate-400">{activeSubject}</span>
                    </div>
                    <p className="text-[11px] text-slate-600">{card.definition}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeModal === "notes" && (
            <div className="space-y-3">
              {notes.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-6">Session notes appear automatically here.</p>
              ) : (
                notes.map((note) => (
                  <div key={note.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <h3 className="text-xs font-semibold text-slate-900">{note.title}</h3>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{note.content}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeModal === "quiz" && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-slate-900">
                Diagnostic Check: What happens to halo buffer exchange overhead when mesh size scales faster than boundary surface area?
              </p>
              <div className="space-y-2 pt-1">
                {["Communication overhead ratio decreases (Surface-to-Volume ratio)", "Communication stalls linearly", "Network bandwidth saturates immediately"].map((opt, i) => (
                  <button key={i} className="w-full text-left p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs hover:border-slate-800 transition-colors">
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
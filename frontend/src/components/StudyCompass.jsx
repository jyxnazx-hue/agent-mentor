import React from "react";
import { CheckCircle2, Circle, Layers, Mic, Radio } from "lucide-react";

export default function StudyCompass({ checklist, flashcards, connectionStatus }) {
  return (
    <div className="w-80 h-full bg-cream-card border-l border-cream-border flex flex-col justify-between p-4">
      <div className="space-y-6 overflow-y-auto">
        {/* Real-time Status Indicator */}
        <div className="flex items-center justify-between pb-3 border-b border-cream-border">
          <div className="flex items-center space-x-2">
            <Radio className={`w-4 h-4 ${connectionStatus === "connected" ? "text-slate-primary animate-pulse" : "text-slate-muted"}`} />
            <span className="text-xs font-mono font-medium text-slate-primary uppercase">
              {connectionStatus === "connected" ? "Live Co-Pilot Active" : "Disconnected"}
            </span>
          </div>
          <Mic className="w-4 h-4 text-slate-secondary" />
        </div>

        {/* Dynamic Study Checklist */}
        <div>
          <h3 className="text-xs font-mono uppercase text-slate-muted tracking-wider mb-2">Review Checklist</h3>
          <div className="space-y-2">
            {checklist.length === 0 ? (
              <p className="text-xs text-slate-muted italic">No active items. AI will flag items during discussions.</p>
            ) : (
              checklist.map((item, idx) => (
                <div key={idx} className="flex items-start space-x-2 text-xs bg-cream-surface p-2.5 rounded-lg border border-cream-border">
                  {item.status === "completed" ? (
                    <CheckCircle2 className="w-4 h-4 text-slate-primary mt-0.5 flex-shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-muted mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <span className="font-medium text-slate-primary block">{item.topic}</span>
                    <span className="text-slate-secondary text-[11px]">{item.action}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Dynamic Flashcard Pockets */}
        <div>
          <h3 className="text-xs font-mono uppercase text-slate-muted tracking-wider mb-2 flex items-center justify-between">
            <span>Concept Cards</span>
            <Layers className="w-3.5 h-3.5" />
          </h3>
          <div className="space-y-2">
            {flashcards.length === 0 ? (
              <p className="text-xs text-slate-muted italic">Flashcards generated automatically from materials.</p>
            ) : (
              flashcards.map((card, idx) => (
                <div key={idx} className="bg-cream-surface p-3 rounded-lg border border-cream-border text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-primary">{card.term}</span>
                    <span className="text-[10px] text-slate-muted font-mono">{card.subject}</span>
                  </div>
                  <p className="text-[11px] text-slate-secondary">{card.definition}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-cream-border text-center">
        <span className="text-[10px] text-slate-muted font-mono">AgentMentor • Gemini Live Enabled</span>
      </div>
    </div>
  );
}
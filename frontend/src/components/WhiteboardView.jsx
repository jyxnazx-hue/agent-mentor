import React, { useState } from "react";
import { Cpu, Sliders, Activity } from "lucide-react";

export default function WhiteboardView() {
  const [messageSize, setMessageSize] = useState(64); // KB
  const [bandwidth, setBandwidth] = useState(12); // GB/s
  const [latency, setLatency] = useState(1.4); // µs

  // Comm model: T = alpha + beta * L
  const transferTimeUs = (latency + (messageSize / (bandwidth * 1024 * 1024)) * 1e6).toFixed(2);

  return (
    <div className="w-full h-full bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between overflow-y-auto shadow-xs">
      <div>
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <Cpu className="w-5 h-5 text-slate-900" />
            <div>
              <h2 className="font-semibold text-sm text-slate-900">Distributed Memory &amp; Halo Exchange Simulation</h2>
              <p className="text-[11px] text-slate-500">Interactive Stencil Calculation &amp; Latency Curve</p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-mono text-slate-700">
            MPI Point-to-Point
          </span>
        </div>

        {/* Distributed Topology Diagram */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <span className="text-xs font-mono text-slate-600 font-medium">Worker Node 0</span>
            <div className="h-20 mt-2 bg-white rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-700">
              Domain Grid Block
            </div>
            <div className="h-5 mt-1.5 bg-slate-900 text-white rounded text-[10px] flex items-center justify-center font-mono">
              Send Halo Buffer ({messageSize} KB)
            </div>
          </div>

          <div className="flex flex-col items-center justify-center space-y-2">
            <Activity className="w-5 h-5 text-slate-400 animate-pulse" />
            <span className="text-xs font-mono font-semibold text-slate-900">{transferTimeUs} µs</span>
            <span className="text-[10px] text-slate-400 font-mono">Transfer Latency</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <span className="text-xs font-mono text-slate-600 font-medium">Worker Node 1</span>
            <div className="h-20 mt-2 bg-white rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-700">
              Domain Grid Block
            </div>
            <div className="h-5 mt-1.5 bg-slate-200 text-slate-800 rounded text-[10px] flex items-center justify-center font-mono">
              Receive Halo Buffer
            </div>
          </div>
        </div>

        {/* Real-time Parameter Sliders */}
        <div className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
          <div className="flex items-center space-x-2 pb-1 text-slate-700">
            <Sliders className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">Topology Parameters</span>
          </div>

          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-slate-600">Halo Message Size</span>
              <span className="font-mono font-semibold text-slate-900">{messageSize} KB</span>
            </div>
            <input
              type="range"
              min="4"
              max="512"
              value={messageSize}
              onChange={(e) => setMessageSize(Number(e.target.value))}
              className="w-full accent-slate-900 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-slate-600">Network Interconnect Bandwidth</span>
              <span className="font-mono font-semibold text-slate-900">{bandwidth} GB/s</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={bandwidth}
              onChange={(e) => setBandwidth(Number(e.target.value))}
              className="w-full accent-slate-900 cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 text-[11px] text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-mono">
        {`Total Time T_comm = α + β × L => ${latency} µs + (${messageSize} KB / ${bandwidth} GB/s) = ${transferTimeUs} µs`}
      </div>
    </div>
  );
}
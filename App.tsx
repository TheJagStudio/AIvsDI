import React from 'react';
import { useGeminiLive } from './hooks/useGeminiLive';
import Visualizer from './components/Visualizer';
import { ConnectionStatus } from './types';
import { 
  Mic, 
  Power, 
  Activity, 
  BookOpen, 
  Cpu, 
  CloudSun, 
  Database, 
  ScrollText, 
  Network
} from 'lucide-react';

export default function App() {
  const { connect, disconnect, status, error, outputAnalyser } = useGeminiLive();

  const handleToggleConnection = () => {
    if (status === ConnectionStatus.CONNECTED || status === ConnectionStatus.CONNECTING) {
      disconnect();
    } else {
      connect();
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
      
      {/* --- BACKGROUND DUALITY --- */}
      <div className="absolute inset-0 flex pointer-events-none z-0">
        
        {/* LEFT: AI Domain (Cold, Matrix, Grid) */}
        <div className="w-1/2 h-full relative bg-[#020617] border-r border-slate-800/50">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-cyan-950/20 to-transparent" />
          
          {/* Floating AI Artifacts */}
          <div className="absolute top-1/4 left-1/4 opacity-20 animate-float">
            <Cpu className="w-24 h-24 text-cyan-500" />
          </div>
          <div className="absolute bottom-1/3 left-1/3 opacity-10 animate-float-delayed">
            <Database className="w-16 h-16 text-cyan-400" />
          </div>
        </div>

        {/* RIGHT: Divine Domain (Warm, Gold, Rays) */}
        <div className="w-1/2 h-full relative bg-[#0f0a05]">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-transparent to-transparent" />
          {/* God Rays Simulation */}
          <div className="absolute top-0 right-0 w-full h-full bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent opacity-40" />
          
          {/* Floating DI Artifacts (Books/Scrolls from image) */}
          <div className="absolute top-1/3 right-1/4 opacity-20 animate-float">
            <BookOpen className="w-24 h-24 text-amber-500" />
          </div>
          <div className="absolute bottom-1/4 right-1/3 opacity-15 animate-float-delayed">
            <ScrollText className="w-20 h-20 text-amber-400" />
          </div>
          <div className="absolute top-20 right-20 opacity-10">
            <CloudSun className="w-32 h-32 text-amber-200" />
          </div>
        </div>
      </div>

      {/* --- MAIN INTERFACE --- */}
      <main className="relative z-10 w-full max-w-6xl px-6 flex flex-col items-center gap-10">
        
        {/* Title Header */}
        <header className="flex items-center justify-between w-full max-w-3xl">
          <div className="text-right flex-1 pr-8 hidden md:block">
            <h2 className="font-mono text-cyan-400 text-2xl tracking-tighter">ARTIFICIAL</h2>
            <p className="font-mono text-slate-500 text-xs">LOGIC // DATA // FUTURE</p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="bg-slate-900/80 backdrop-blur border border-slate-700 rounded-full px-4 py-1 flex items-center gap-2">
               <div className={`w-2 h-2 rounded-full ${status === ConnectionStatus.CONNECTED ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
               <span className="text-[10px] uppercase tracking-widest text-slate-300">
                 {status === ConnectionStatus.CONNECTED ? 'Debate Live' : 'System Idle'}
               </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white tracking-widest">
              VS
            </h1>
          </div>

          <div className="text-left flex-1 pl-8 hidden md:block">
            <h2 className="font-serif text-amber-400 text-2xl tracking-widest">DIVINE</h2>
            <p className="font-serif text-amber-700/80 text-xs">WISDOM // SOUL // ETERNAL</p>
          </div>
        </header>

        {/* Central Visualizer Portal */}
        <div className="relative group w-[340px] h-[340px] md:w-[450px] md:h-[450px] flex items-center justify-center">
          
          {/* Glowing Aura (Behind) */}
          <div className={`absolute inset-0 rounded-full blur-[60px] transition-opacity duration-1000 ${status === ConnectionStatus.CONNECTED ? 'opacity-40' : 'opacity-10'} bg-gradient-to-r from-cyan-500 to-amber-500`} />

          {/* Canvas Container */}
          <div className="absolute inset-0 z-10">
             <Visualizer analyser={outputAnalyser} isActive={status === ConnectionStatus.CONNECTED} />
          </div>

          {/* Center Avatar / Icon (The "Swami vs Bot") */}
          <div className="relative z-20 w-32 h-32 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center shadow-2xl overflow-hidden">
             {/* Split Icon */}
             <div className="absolute inset-0 flex">
                <div className="w-1/2 h-full bg-cyan-950/30 flex items-center justify-center border-r border-slate-800">
                   <Network className="w-8 h-8 text-cyan-500/80" />
                </div>
                <div className="w-1/2 h-full bg-amber-950/30 flex items-center justify-center">
                   <Activity className="w-8 h-8 text-amber-500/80" />
                </div>
             </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="z-30 mt-4">
          <button
            onClick={handleToggleConnection}
            disabled={status === ConnectionStatus.CONNECTING}
            className={`
              relative flex items-center justify-center w-24 h-24 rounded-full transition-all duration-500
              ${status === ConnectionStatus.CONNECTED 
                ? 'bg-red-500/10 border border-red-500/30 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]' 
                : 'bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-600 text-slate-300 hover:scale-105 hover:border-slate-400 shadow-[0_0_30px_rgba(255,255,255,0.05)]'}
            `}
          >
            {status === ConnectionStatus.CONNECTING ? (
              <div className="absolute inset-0 rounded-full border-t-2 border-white animate-spin" />
            ) : status === ConnectionStatus.CONNECTED ? (
              <Power className="w-8 h-8" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </button>
          
          <div className="mt-4 text-center">
             <p className="text-xs text-slate-500 font-mono uppercase tracking-widest text-center">
               {status === ConnectionStatus.CONNECTED ? 'End Transmission' : 'Initiate Debate'}
             </p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="absolute bottom-8 px-6 py-3 bg-red-950/80 border border-red-800 rounded text-red-200 text-sm font-mono backdrop-blur">
            [ERROR]: {error}
          </div>
        )}

      </main>
      
      {/* Footer Decoration */}
      <div className="absolute bottom-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-slate-900 to-amber-500" />
    </div>
  );
}
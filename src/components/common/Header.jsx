import React from 'react';
import { MapPin, Smartphone, Truck, ShieldAlert, Cpu } from 'lucide-react';

export default function Header({ currentTab, setCurrentTab, isHardwareSimulated, setIsHardwareSimulated }) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top Banner: Hackathon Context & Security Warning */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1 px-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white tracking-wide">SIME DARBY PROPERTY HACKATHON</span>
          <span className="text-slate-500">|</span>
          <span className="text-amber-400 font-medium">Township of Tomorrow (People Theme)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 bg-red-950/80 text-red-300 border border-red-800/80 px-2 py-0.5 rounded text-[10px] font-mono font-semibold">
            <ShieldAlert className="w-3 h-3 text-red-400" />
            DEMO ONLY - NOT PRODUCTION SECURITY
          </span>
          <button
            onClick={() => setIsHardwareSimulated(!isHardwareSimulated)}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
              isHardwareSimulated 
                ? 'bg-amber-900/60 text-amber-200 border border-amber-700/60 hover:bg-amber-800/60' 
                : 'bg-emerald-900/60 text-emerald-200 border border-emerald-700/60 hover:bg-emerald-800/60'
            }`}
            title="Toggle between hardware relay simulation and physical ESP32 Wi-Fi MQTT link"
          >
            <Cpu className="w-3 h-3" />
            <span>Hardware: {isHardwareSimulated ? 'Simulated' : 'ESP32 Live'}</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              E
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-base sm:text-lg tracking-tight">ElminaParcel</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">MVP</span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Carrier-Neutral Township Pickup Network</p>
            </div>
          </div>

          {/* 3 Core Tabs (Removed Settings tab as requested) */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setCurrentTab('planner')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                currentTab === 'planner'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Planner</span>
            </button>

            <button
              onClick={() => setCurrentTab('resident')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                currentTab === 'resident'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Resident</span>
            </button>

            <button
              onClick={() => setCurrentTab('courier')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                currentTab === 'courier'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Courier</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}

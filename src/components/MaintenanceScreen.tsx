import React from 'react';
import { useApp } from '../context/AppContext';
import { FuinjutsuKekkaiSeal, KonohaLeafIcon, DiscordIcon } from './KonohaIcons';
import { Lock, Clock, LogOut } from 'lucide-react';

export const MaintenanceScreen: React.FC = () => {
  const { systemSettings, currentUser, logout } = useApp();

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden bg-ninja-grid">
      {/* Red mystical glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-900/15 blur-[140px] pointer-events-none rounded-full" />

      <div className="w-full max-w-lg z-10 text-center">
        
        {/* Animated Kekkai Seal */}
        <div className="flex justify-center mb-6">
          <div className="relative p-3 rounded-full bg-neutral-900/80 border border-red-900/50 shadow-2xl shadow-red-950/40">
            <FuinjutsuKekkaiSeal className="w-28 h-28 text-red-500" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Lock className="w-6 h-6 text-red-400" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="font-cinzel text-2xl sm:text-3xl font-extrabold text-neutral-100 tracking-wide uppercase">
          Archives Sous Scellé
        </h1>
        
        <p className="text-xs text-red-400 font-semibold tracking-wider uppercase mt-1">
          Barrière de Protection Fūinjutsu Active
        </p>

        <div className="mt-6 bg-neutral-900/90 border border-red-900/40 rounded-xl p-6 text-left backdrop-blur-md shadow-2xl">
          
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-800 text-xs font-semibold text-neutral-300">
            <KonohaLeafIcon className="w-4 h-4 text-red-500" />
            <span>Décret du Bureau Disciplinaire · Zenkai RP</span>
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <span className="text-[11px] font-mono uppercase text-neutral-500 block">
                Motif du verrouillage
              </span>
              <p className="text-sm text-neutral-200 mt-0.5 leading-relaxed font-medium">
                {systemSettings.maintenanceReason}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2 text-xs text-amber-400/90">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{systemSettings.maintenanceEstimatedReopen}</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-[11px] text-neutral-500">
              Session active : <span className="text-neutral-300 font-medium">{currentUser?.ninjaName || 'Visiteur'}</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={logout}
                className="w-full sm:w-auto px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-md border border-neutral-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Changer de compte</span>
              </button>
            </div>
          </div>

        </div>

        {/* Discord Server Link / Zenkai RP */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-neutral-400">
          <span>Pour toute urgence opérationnelle, contactez le staff sur</span>
          <span className="inline-flex items-center gap-1 text-[#5865F2] font-semibold">
            <DiscordIcon className="w-3.5 h-3.5" />
            Discord Zenkai RP
          </span>
        </div>

      </div>
    </div>
  );
};

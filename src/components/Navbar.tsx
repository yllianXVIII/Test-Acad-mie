import React from 'react';
import { useApp } from '../context/AppContext';
import { KonohaLeafIcon, GoogleIcon, GmailIcon } from './KonohaIcons';
import { Shield, BookOpen, Users, Lock, LogOut, AlertTriangle } from 'lucide-react';

interface NavbarProps {
  currentTab: 'logs' | 'students' | 'documents' | 'admin';
  onSelectTab: (tab: 'logs' | 'students' | 'documents' | 'admin') => void;
  onOpenLoginModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab, onOpenLoginModal }) => {
  const { currentUser, logout, canAccessAdmin, isPrimaryAdmin, systemSettings } = useApp();

  return (
    <header className="sticky top-0 z-40 w-full bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800">
      {/* Maintenance alert notice for admins if maintenance is ON */}
      {systemSettings.maintenanceMode && (
        <div className="bg-red-950/80 border-b border-red-800/80 px-4 py-1.5 text-xs text-red-200 flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-4xl truncate">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="font-semibold text-red-300">PROTOCOLE MAINTENANCE ACTIF</span>
            <span aria-hidden="true" className="text-red-500">·</span>
            <span className="truncate text-red-300/80">{systemSettings.maintenanceReason}</span>
          </div>
          <span className="text-[11px] font-mono text-red-400 shrink-0">
            Visible uniquement par la Direction
          </span>
        </div>
      )}

      {/* Main Top Bar Contract: 3 zones */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => onSelectTab('logs')}
            className="flex items-center gap-2.5 text-left group focus-visible:outline-none"
          >
            <div className="w-9 h-9 rounded-lg bg-red-950/60 border border-red-800/80 flex items-center justify-center text-red-400 group-hover:text-red-300 group-hover:border-red-600 transition-colors shadow-sm">
              <KonohaLeafIcon className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <span className="font-cinzel text-base sm:text-lg font-bold tracking-wide text-neutral-100 block leading-tight">
                Bureau Disciplinaire
              </span>
              <span className="text-[11px] font-medium text-neutral-400 block leading-none tracking-normal">
                Académie de Konoha <span className="text-red-500">·</span> Zenkai RP
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: 4 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => onSelectTab('logs')}
            className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-2 ${
              currentTab === 'logs'
                ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
            }`}
          >
            <Shield className="w-4 h-4 text-red-500" />
            <span>Registre des Infractions</span>
          </button>

          <button
            onClick={() => onSelectTab('students')}
            className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-2 ${
              currentTab === 'students'
                ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
            }`}
          >
            <Users className="w-4 h-4 text-neutral-400" />
            <span>Dossiers Élèves</span>
          </button>

          <button
            onClick={() => onSelectTab('documents')}
            className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-2 ${
              currentTab === 'documents'
                ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
            }`}
          >
            <BookOpen className="w-4 h-4 text-neutral-400" />
            <span>Textes & Barèmes</span>
          </button>

          {canAccessAdmin && (
            <button
              onClick={() => onSelectTab('admin')}
              className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-2 ${
                currentTab === 'admin'
                  ? 'bg-red-950/80 text-red-200 border border-red-800/80 shadow-sm'
                  : 'text-red-400 hover:text-red-200 hover:bg-red-950/30'
              }`}
            >
              <Lock className="w-4 h-4 text-red-500" />
              <span>Panel Administration</span>
            </button>
          )}
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Officer Gmail & Shinobi Identity */}
              <div className="flex items-center gap-2.5 pl-3 border-l border-neutral-800">
                <div className="relative">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.ninjaName}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full border border-neutral-700 object-cover"
                  />
                  {isPrimaryAdmin && (
                    <span 
                      title="Compte Administrateur Principal"
                      className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full border border-neutral-900 flex items-center justify-center text-[7px] text-white font-bold"
                    >
                      ★
                    </span>
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="text-xs font-semibold text-neutral-200 truncate max-w-[140px]">
                      {currentUser.ninjaName}
                    </span>
                    {isPrimaryAdmin ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 font-mono font-semibold">
                        Admin Principal
                      </span>
                    ) : (
                      <span className="text-[10px] text-neutral-400 font-mono">
                        ({currentUser.ninjaRank})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-neutral-400 mt-1 leading-none font-mono">
                    <GmailIcon className="w-3 h-3 shrink-0" />
                    <span className="truncate max-w-[150px]">{currentUser.email}</span>
                  </div>
                </div>
              </div>

              {/* Logout button */}
              <button
                onClick={logout}
                title="Déconnexion de session"
                className="p-2 text-neutral-400 hover:text-red-400 hover:bg-neutral-900 rounded-lg transition-colors focus-visible:outline-none cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLoginModal}
              className="px-4 py-2 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <GoogleIcon className="w-4 h-4" />
              <span>Connexion Gmail</span>
            </button>
          )}
        </div>

      </div>

      {/* Mobile navigation row */}
      <div className="flex md:hidden items-center justify-around px-2 py-2 border-t border-neutral-800/80 bg-neutral-950 text-xs">
        <button
          onClick={() => onSelectTab('logs')}
          className={`px-2.5 py-1.5 rounded flex items-center gap-1.5 ${
            currentTab === 'logs' ? 'text-red-400 font-semibold bg-neutral-900' : 'text-neutral-400'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Infractions</span>
        </button>
        <button
          onClick={() => onSelectTab('students')}
          className={`px-2.5 py-1.5 rounded flex items-center gap-1.5 ${
            currentTab === 'students' ? 'text-red-400 font-semibold bg-neutral-900' : 'text-neutral-400'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Élèves</span>
        </button>
        <button
          onClick={() => onSelectTab('documents')}
          className={`px-2.5 py-1.5 rounded flex items-center gap-1.5 ${
            currentTab === 'documents' ? 'text-red-400 font-semibold bg-neutral-900' : 'text-neutral-400'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Textes</span>
        </button>
        {canAccessAdmin && (
          <button
            onClick={() => onSelectTab('admin')}
            className={`px-2.5 py-1.5 rounded flex items-center gap-1.5 ${
              currentTab === 'admin' ? 'text-red-400 font-semibold bg-red-950/40' : 'text-red-500/80'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        )}
      </div>
    </header>
  );
};

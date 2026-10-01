import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { GmailLoginScreen } from './components/GmailLoginScreen';
import { MaintenanceScreen } from './components/MaintenanceScreen';
import { DisciplinaryLogsView } from './components/DisciplinaryLogsView';
import { StudentListView } from './components/StudentListView';
import { DocumentsView } from './components/DocumentsView';
import { AdminPanel } from './components/AdminPanel';
import { KonohaLeafIcon, DisciplinarySealStamp } from './components/KonohaIcons';

function AppContent() {
  const { currentUser, isMaintenanceActiveForUser } = useApp();
  const [currentTab, setCurrentTab] = useState<'logs' | 'students' | 'documents' | 'admin'>('logs');

  // If no user is authenticated via Gmail, show login portal
  if (!currentUser) {
    return <GmailLoginScreen />;
  }

  // If maintenance mode is activated and user is not admin/direction, display maintenance barrier
  if (isMaintenanceActiveForUser) {
    return <MaintenanceScreen />;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between selection:bg-red-900/60 selection:text-red-100 bg-ninja-grid">
      <div>
        <Navbar currentTab={currentTab} onSelectTab={setCurrentTab} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {currentTab === 'logs' && <DisciplinaryLogsView />}
          {currentTab === 'students' && <StudentListView />}
          {currentTab === 'documents' && <DocumentsView />}
          {currentTab === 'admin' && <AdminPanel />}
        </main>
      </div>

      {/* Quiet, clean official Konoha footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950/80 py-6 px-4 text-xs text-neutral-500 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <KonohaLeafIcon className="w-4 h-4 text-red-600/70" />
            <span className="font-semibold text-neutral-400">
              Académie de Konoha · Bureau Disciplinaire
            </span>
            <span aria-hidden="true" className="text-neutral-700">·</span>
            <span>Serveur Zenkai Naruto RP</span>
          </div>

          <div className="flex items-center gap-4 text-neutral-500 text-[11px] font-mono">
            <span>Sceau n°719-KNH</span>
            <span aria-hidden="true">·</span>
            <span>木ノ葉隠れの里 · 規律部</span>
            <span aria-hidden="true">·</span>
            <span>An 64 après la fondation</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

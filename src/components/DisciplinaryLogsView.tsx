import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { GravityLevel, LogStatus, DisciplinaryLog } from '../types';
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Clock, 
  Trash2, 
  ExternalLink,
  ShieldAlert,
  AlertTriangle,
  Ban,
  Calendar
} from 'lucide-react';
import { NewDisciplinaryReportModal } from './NewDisciplinaryReportModal';
import { StudentDossierModal } from './StudentDossierModal';
import { getSanctionTimeRemaining } from '../lib/rpDuration';

export const DisciplinaryLogsView: React.FC = () => {
  const { logs, deleteLog, resetStudentDatabase, canApproveOrClassify, canCreateReport, currentUser } = useApp();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGravity, setSelectedGravity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedClan, setSelectedClan] = useState<string>('all');

  // Modals
  const [isNewReportModalOpen, setIsNewReportModalOpen] = useState(false);
  const [selectedStudentForDossier, setSelectedStudentForDossier] = useState<string | null>(null);
  const [logToDelete, setLogToDelete] = useState<DisciplinaryLog | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Search
      const matchSearch =
        !searchTerm.trim() ||
        log.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.studentRegistrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.infractionType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.reportedBy.ninjaName.toLowerCase().includes(searchTerm.toLowerCase());

      // Gravity
      const matchGravity = selectedGravity === 'all' || log.gravity === selectedGravity;

      // Status
      const matchStatus = selectedStatus === 'all' || log.status === selectedStatus;

      // Clan
      const matchClan = selectedClan === 'all' || log.studentClan === selectedClan;

      return matchSearch && matchGravity && matchStatus && matchClan;
    });
  }, [logs, searchTerm, selectedGravity, selectedStatus, selectedClan]);

  // Unique clans for filter dropdown
  const uniqueClans = useMemo(() => {
    return Array.from(new Set(logs.map(l => l.studentClan))).sort();
  }, [logs]);

  // Aggregate Metrics (Anti-slop clean presentation)
  const activeInfractionsCount = logs.filter(l => l.status === 'en_cours' || l.status === 'sanctionne').length;
  const criticalCasesCount = logs.filter(l => l.gravity === 'Rang A' || l.gravity === 'Rang S').length;
  const activeBansCount = logs.filter(l => l.examBan?.enabled && (l.status === 'en_cours' || l.status === 'sanctionne')).length;
  const resolvedCount = logs.filter(l => l.status === 'cloture').length;

  const handleDelete = (log: DisciplinaryLog) => {
    setLogToDelete(log);
  };

  const confirmDeleteLog = () => {
    if (logToDelete) {
      deleteLog(logToDelete.id, `Suppression manuelle par ${currentUser?.ninjaName}`);
      setLogToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="font-cinzel text-xl sm:text-2xl font-bold text-neutral-100 tracking-wide uppercase">
            Registre des Infractions & Sanctions
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Archivage officiel du bureau pour les élèves de l'Académie de Konoha · Zenkai RP
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canApproveOrClassify && logs.length > 0 && (
            <button
              onClick={() => setIsResetConfirmOpen(true)}
              className="px-3.5 py-2.5 bg-neutral-900 hover:bg-red-950/60 border border-neutral-700 hover:border-red-800 text-neutral-300 hover:text-red-300 text-xs sm:text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              title="Vider intégralement la base de données des élèves"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
              <span>Vider la base des élèves (0)</span>
            </button>
          )}

          {canCreateReport && (
            <button
              onClick={() => setIsNewReportModalOpen(true)}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md shadow-red-950/40 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Rapport Disciplinaire</span>
            </button>
          )}
        </div>
      </div>

      {/* Metric Strip (Clean Unboxed Layout, Zero Pill Sandwiches) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
        <div>
          <span className="text-[11px] font-mono text-neutral-500 uppercase block">
            Dossiers en cours
          </span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-neutral-100 tabular-nums">
            {activeInfractionsCount}
          </span>
          <div className="text-[11px] text-amber-500 mt-0.5">En cours d'instruction ou purge</div>
        </div>

        <div>
          <span className="text-[11px] font-mono text-neutral-500 uppercase block">
            Cas Majeurs (Rang A / S)
          </span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-red-400 tabular-nums">
            {criticalCasesCount}
          </span>
          <div className="text-[11px] text-neutral-400 mt-0.5">Surveillance spéciale Anbu</div>
        </div>

        <div>
          <span className="text-[11px] font-mono text-neutral-500 uppercase block">
            Interdictions actives
          </span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-neutral-100 tabular-nums">
            {activeBansCount}
          </span>
          <div className="text-[11px] text-neutral-400 mt-0.5">1j IRL = 1 mois RP · 1 sem = 1 an RP</div>
        </div>

        <div>
          <span className="text-[11px] font-mono text-neutral-500 uppercase block">
            Sanctions purgées
          </span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 tabular-nums">
            {resolvedCount}
          </span>
          <div className="text-[11px] text-neutral-400 mt-0.5">Dossiers classés conformes</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Live Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Rechercher par élève, matricule, officier, mot-clé d'infraction..."
              className="w-full pl-9 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs sm:text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-red-600"
            />
          </div>

          {/* Clan Filter Dropdown */}
          <div className="w-full md:w-56 shrink-0">
            <select
              value={selectedClan}
              onChange={e => setSelectedClan(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs sm:text-sm text-neutral-200 focus:outline-none focus:border-red-600"
            >
              <option value="all">Tous les Clans / Familles</option>
              {uniqueClans.map(clan => (
                <option key={clan} value={clan}>{clan}</option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="w-full md:w-48 shrink-0">
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs sm:text-sm text-neutral-200 focus:outline-none focus:border-red-600"
            >
              <option value="all">Tous les statuts</option>
              <option value="en_cours">En instruction</option>
              <option value="sanctionne">Sanction active</option>
              <option value="cloture">Clôturé / Purgé</option>
              <option value="recours">Recours en appel</option>
            </select>
          </div>
        </div>

        {/* Gravity Segmented Filter Bar (Functional Interactive Tabs) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-neutral-500 text-[11px] font-mono uppercase mr-1 hidden sm:inline">
            Gravité :
          </span>

          {[
            { id: 'all', label: 'Toutes gravités' },
            { id: 'Rang D', label: 'Rang D (Mineur)' },
            { id: 'Rang C', label: 'Rang C (Moyen)' },
            { id: 'Rang B', label: 'Rang B (Grave)' },
            { id: 'Rang A', label: 'Rang A (Majeur)' },
            { id: 'Rang S', label: 'Rang S (Critique)' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedGravity(item.id)}
              className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
                selectedGravity === item.id
                  ? 'bg-neutral-800 text-neutral-100 shadow-sm border border-neutral-700'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Disciplinary Logs Table / Grid */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950/80 text-neutral-400 uppercase font-mono text-[10px] tracking-wider border-b border-neutral-800">
              <tr>
                <th className="py-3 px-4">Dossier & Date</th>
                <th className="py-3 px-4">Élève & Clan</th>
                <th className="py-3 px-4">Infraction Constatée</th>
                <th className="py-3 px-4">Gravité</th>
                <th className="py-3 px-4">Sanction & Retenue</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4">Officier</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-800/80">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-neutral-500">
                    <div className="w-14 h-14 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-center text-neutral-600 mx-auto mb-3">
                      <FileText className="w-7 h-7" />
                    </div>
                    <p className="text-base font-cinzel font-bold text-neutral-300">Registre Disciplinaire Vierge</p>
                    <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                      {logs.length === 0 
                        ? "Tous les anciens dossiers ont été archivés. Aucun procès-verbal d'élève n'est actuellement consigné."
                        : "Aucun dossier ne correspond à vos filtres de recherche."}
                    </p>
                    {canCreateReport && (
                      <button
                        onClick={() => setIsNewReportModalOpen(true)}
                        className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-2 shadow-md shadow-red-950/40 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Rédiger un Procès-Verbal</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const gravityStyle =
                    log.gravity === 'Rang S' ? 'text-red-400 bg-red-950/40 border border-red-800/60' :
                    log.gravity === 'Rang A' ? 'text-red-300 bg-red-950/30 border border-red-800/50' :
                    log.gravity === 'Rang B' ? 'text-orange-400 bg-orange-950/30 border border-orange-800/50' :
                    log.gravity === 'Rang C' ? 'text-amber-400 bg-amber-950/30 border border-amber-800/50' :
                    'text-blue-400 bg-blue-950/30 border border-blue-800/50';

                  const statusStyle =
                    log.status === 'cloture' ? 'text-emerald-400' :
                    log.status === 'sanctionne' ? 'text-amber-400' :
                    log.status === 'recours' ? 'text-purple-400' :
                    'text-neutral-400';

                  return (
                    <tr 
                      key={log.id}
                      className="hover:bg-neutral-800/50 transition-colors group"
                    >
                      {/* ID & Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono font-semibold text-neutral-200 block">
                          {log.id}
                        </span>
                        <span className="text-[11px] text-neutral-500 block mt-0.5">
                          {log.konohaDate}
                        </span>
                      </td>

                      {/* Student & Clan */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedStudentForDossier(log.studentName)}
                          className="font-bold text-neutral-100 hover:text-red-400 transition-colors block text-left"
                        >
                          {log.studentName}
                        </button>
                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 mt-0.5">
                          <span className="text-red-400/90 font-medium">Clan {log.studentClan}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono text-neutral-500">{log.studentRegistrationNumber}</span>
                        </div>
                      </td>

                      {/* Infraction Category & snippet */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <span className="font-semibold text-neutral-200 block truncate">
                          {log.infractionType}
                        </span>
                        <span className="text-[11px] text-neutral-400 block truncate mt-0.5">
                          {log.description}
                        </span>
                      </td>

                      {/* Gravity */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono font-bold ${gravityStyle}`}>
                          {log.gravity}
                        </span>
                      </td>

                      {/* Sanction applied & duration */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <span className="text-neutral-200 block truncate" title={log.sanctionApplied}>
                          {log.sanctionApplied}
                        </span>
                        {log.examBan?.enabled && (
                          <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-950/80 border border-red-800 text-[10px] text-red-300 font-semibold">
                            <Ban className="w-3 h-3 text-red-400 shrink-0" />
                            <span>Interdiction examen : {log.examBan.duration}</span>
                          </div>
                        )}
                        {log.sanctionPeriodText && (
                          <div className="text-[10px] text-emerald-400 font-mono mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-red-400 shrink-0" />
                            <span>{log.sanctionPeriodText}</span>
                          </div>
                        )}
                        {(() => {
                          const remaining = getSanctionTimeRemaining(log.endDateIRL || log.examBan?.endDateIRL);
                          if (log.status === 'en_cours' || log.status === 'sanctionne') {
                            return (
                              <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-mono border ${remaining.badgeClass}`}>
                                {remaining.text}
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            log.status === 'cloture' ? 'bg-emerald-500' :
                            log.status === 'sanctionne' ? 'bg-amber-500' :
                            log.status === 'recours' ? 'bg-purple-500' :
                            'bg-neutral-500'
                          }`} />
                          <span className={`font-medium ${statusStyle}`}>
                            {log.status === 'cloture' ? 'Purgé / Clôturé' :
                             log.status === 'sanctionne' ? 'En exécution' :
                             log.status === 'recours' ? 'Recours en appel' :
                             'En instruction'}
                          </span>
                        </div>
                        {log.summonsIssued && (
                          <span className="text-[10px] text-red-400 block mt-0.5">
                            Convocation clan requise
                          </span>
                        )}
                      </td>

                      {/* Officer */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-neutral-300">
                        <span className="block font-medium">{log.reportedBy.ninjaName}</span>
                        <span className="text-[10px] text-neutral-500 font-mono block">
                          {log.reportedBy.email || log.reportedBy.role}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedStudentForDossier(log.studentName)}
                            className="p-1.5 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded transition-colors"
                            title="Ouvrir le dossier complet"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          
                          {canApproveOrClassify && (
                            <button
                              onClick={() => handleDelete(log)}
                              className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded transition-colors"
                              title="Retirer ce rapport (Admin)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <NewDisciplinaryReportModal
        isOpen={isNewReportModalOpen}
        onClose={() => setIsNewReportModalOpen(false)}
      />

      {selectedStudentForDossier && (
        <StudentDossierModal
          studentName={selectedStudentForDossier}
          isOpen={!!selectedStudentForDossier}
          onClose={() => setSelectedStudentForDossier(null)}
        />
      )}

      {/* Confirmation Modal for deletion */}
      {logToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-500">
              <div className="w-10 h-10 rounded-full bg-red-950 border border-red-800 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-100 font-cinzel">
                  Supprimer ce Rapport ?
                </h3>
                <span className="text-xs text-neutral-400 font-mono">
                  Réf. {logToDelete.id}
                </span>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              Confirmez-vous le retrait définitif du rapport concernant l'élève <strong>{logToDelete.studentName}</strong> (Infraction : <em>{logToDelete.infractionType}</em>) ? Cette action sera consignée au Journal d'Audit officiel.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setLogToDelete(null)}
                className="px-4 py-2 text-xs text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDeleteLog}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-md cursor-pointer"
              >
                Confirmer la suppression
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Student Database Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-neutral-900 border border-red-800/80 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-950/80 border border-red-800 flex items-center justify-center text-red-500 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-neutral-100 font-cinzel">
                Vider la base de données des élèves ?
              </h3>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                Cette opération va supprimer l'intégralité des <strong>{logs.length} rapport(s)</strong> et remettre le registre des élèves complètement à zéro (0 élève).
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  resetStudentDatabase();
                  setIsResetConfirmOpen(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-red-950/50"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirmer la remise à zéro</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

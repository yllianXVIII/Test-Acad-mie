import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Search, UserCheck, AlertTriangle, ExternalLink, Plus, Trash2, Ban } from 'lucide-react';
import { StudentDossierModal } from './StudentDossierModal';
import { NewDisciplinaryReportModal } from './NewDisciplinaryReportModal';

export const StudentListView: React.FC = () => {
  const { logs, students, resetStudentDatabase, canApproveOrClassify, canCreateReport } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentForDossier, setSelectedStudentForDossier] = useState<string | null>(null);
  const [isNewReportModalOpen, setIsNewReportModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Group logs by student as fallback/realtime mirror
  const studentMap = useMemo(() => {
    const map = new Map<string, {
      name: string;
      clan: string;
      class: string;
      reg: string;
      totalInfractions: number;
      activeSanctions: number;
      highestGravity: string;
      lastInfractionDate: string;
      hasExamBan?: boolean;
      examBanDuration?: string;
      activeSanctionPeriodText?: string;
    }>();

    logs.forEach(log => {
      const key = log.studentName;
      const existing = map.get(key);

      const isCurrentActive = log.status === 'en_cours' || log.status === 'sanctionne';
      const hasBan = log.examBan?.enabled;

      if (!existing) {
        map.set(key, {
          name: log.studentName,
          clan: log.studentClan,
          class: log.studentClass,
          reg: log.studentRegistrationNumber,
          totalInfractions: 1,
          activeSanctions: isCurrentActive ? 1 : 0,
          highestGravity: log.gravity,
          lastInfractionDate: log.konohaDate,
          hasExamBan: hasBan,
          examBanDuration: log.examBan?.duration,
          activeSanctionPeriodText: log.sanctionPeriodText
        });
      } else {
        existing.totalInfractions += 1;
        if (isCurrentActive) existing.activeSanctions += 1;
        if (hasBan) {
          existing.hasExamBan = true;
          existing.examBanDuration = log.examBan?.duration;
        }
        if (log.sanctionPeriodText && isCurrentActive) {
          existing.activeSanctionPeriodText = log.sanctionPeriodText;
        }
        // Gravity comparison
        const rankWeights: Record<string, number> = {
          'Rang S': 5,
          'Rang A': 4,
          'Rang B': 3,
          'Rang C': 2,
          'Rang D': 1
        };
        if ((rankWeights[log.gravity] || 0) > (rankWeights[existing.highestGravity] || 0)) {
          existing.highestGravity = log.gravity;
        }
      }
    });

    return Array.from(map.values());
  }, [logs]);

  // Merge Firestore students collection with computed map
  const displayStudents = useMemo(() => {
    if (students && students.length > 0) {
      return students.map(s => ({
        id: s.id,
        name: s.name,
        clan: s.clan,
        class: s.class,
        reg: s.registrationNumber,
        photoUrl: s.photoUrl || s.avatar,
        avatar: s.avatar || s.photoUrl,
        age: s.age,
        chakraNature: s.chakraNature,
        mentor: s.mentor,
        totalInfractions: s.totalInfractions,
        activeSanctions: s.activeSanctions,
        highestGravity: s.highestGravity,
        lastInfractionDate: s.lastInfractionDate,
        hasExamBan: s.hasExamBan,
        examBanDuration: s.examBanDuration,
        activeSanctionPeriodText: s.activeSanctionPeriodText
      }));
    }
    return studentMap.map(s => ({
      ...s,
      photoUrl: undefined,
      avatar: undefined,
      age: undefined,
      chakraNature: undefined,
      mentor: undefined
    }));
  }, [students, studentMap]);

  const filteredStudents = useMemo(() => {
    return displayStudents.filter(s => 
      !searchTerm.trim() ||
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.clan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.reg.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [displayStudents, searchTerm]);

  return (
    <div className="space-y-6">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="font-cinzel text-xl sm:text-2xl font-bold text-neutral-100 tracking-wide uppercase">
            Dossiers Disciplinaires des Élèves
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Fiches de suivi des antécédents, dossiers disciplinaires et interdictions (1j IRL = 1 mois RP · 1 sem = 1 an RP)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canApproveOrClassify && displayStudents.length > 0 && (
            <button
              onClick={() => setIsResetConfirmOpen(true)}
              className="px-3.5 py-2 bg-neutral-900 hover:bg-red-950/60 border border-neutral-700 hover:border-red-800 text-neutral-300 hover:text-red-300 text-xs sm:text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              title="Vider la base de données de tous les élèves"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
              <span>Vider la base des élèves (0)</span>
            </button>
          )}

          {canCreateReport && (
            <button
              onClick={() => setIsNewReportModalOpen(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md shadow-red-950/40 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Rapport</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Rechercher un élève, un clan noble (Uchiha, Hyūga, Uzumaki...) ou un matricule..."
          className="w-full pl-9 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs sm:text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-red-600"
        />
      </div>

      {/* Grid of Student Dossier Cards */}
      {filteredStudents.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-center text-neutral-600 mx-auto mb-3">
            <UserCheck className="w-7 h-7" />
          </div>
          <h3 className="font-cinzel text-lg font-bold text-neutral-200">
            Aucun Dossier Élève Actif
          </h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
            {displayStudents.length === 0 
              ? "Tous les anciens dossiers ont été purgés et retirés. Aucun élève ne fait actuellement l'objet d'un rapport disciplinaire en base de données."
              : "Aucun élève ne correspond à votre recherche."}
          </p>
          {canCreateReport && (
            <button
              onClick={() => setIsNewReportModalOpen(true)}
              className="mt-5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-2 shadow-md shadow-red-950/40 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Rédiger un Procès-Verbal</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => {
            const hasActiveSanctions = student.activeSanctions > 0;
            const isCritical = student.highestGravity === 'Rang A' || student.highestGravity === 'Rang S';

            return (
              <div
                key={student.reg}
                className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-neutral-700 transition-colors flex flex-col justify-between"
              >
                <div>
                  {/* Header with Photo */}
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-neutral-950 border border-neutral-700 flex items-center justify-center shrink-0 shadow-sm">
                      {student.photoUrl ? (
                        <img 
                          src={student.photoUrl} 
                          alt={student.name} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full bg-neutral-900 text-neutral-400 font-cinzel font-bold text-xs">
                          {student.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-base text-neutral-100 truncate font-cinzel">
                          {student.name}
                        </h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                          isCritical
                            ? 'text-red-400 bg-red-950/50 border border-red-800/80'
                            : 'text-neutral-400 bg-neutral-800 border border-neutral-700'
                        }`}>
                          {student.highestGravity}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-neutral-400 mt-0.5">
                        <span className="text-red-400 font-semibold truncate">Clan {student.clan}</span>
                        <span aria-hidden="true" className="text-neutral-600">·</span>
                        <span className="font-mono text-neutral-500 text-[11px]">{student.reg}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-neutral-300 font-medium truncate">Rang : {student.class}</span>
                    {student.photoUrl ? (
                      <span className="text-emerald-400 font-mono text-[10px] flex items-center gap-1 shrink-0 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Photo importée
                      </span>
                    ) : (
                      <span className="text-amber-400/90 font-mono text-[10px] flex items-center gap-1 shrink-0 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        Fiche à compléter
                      </span>
                    )}
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-neutral-800/80 text-center">
                    <div className="bg-neutral-950/60 p-2 rounded">
                      <span className="text-[10px] font-mono text-neutral-500 uppercase block">Rapports</span>
                      <span className="font-mono font-bold text-sm text-neutral-200">{student.totalInfractions}</span>
                    </div>
                    <div className="bg-neutral-950/60 p-2 rounded">
                      <span className="text-[10px] font-mono text-neutral-500 uppercase block">En cours</span>
                      <span className={`font-mono font-bold text-sm ${hasActiveSanctions ? 'text-amber-400' : 'text-neutral-400'}`}>
                        {student.activeSanctions}
                      </span>
                    </div>
                    <div className="bg-neutral-950/60 p-2 rounded">
                      <span className="text-[10px] font-mono text-neutral-500 uppercase block">Durée RP</span>
                      <span className={`font-mono font-bold text-xs truncate block ${student.hasExamBan ? 'text-red-400' : 'text-neutral-400'}`}>
                        {student.hasExamBan ? student.examBanDuration?.split('(')[0]?.trim() || '1 an RP' : 'Aucune'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 text-[11px] text-neutral-400 flex items-center justify-between">
                    <span>Dernier constat :</span>
                    <span className="text-neutral-300 font-medium">{student.lastInfractionDate}</span>
                  </div>

                  {student.hasExamBan && (
                    <div className="mt-2.5 p-2 rounded bg-red-950/80 border border-red-800 text-[10px] text-red-300 font-semibold space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Ban className="w-3 h-3 text-red-400 shrink-0" />
                        <span>Interdiction d'examen : {student.examBanDuration || '1 an RP (7j IRL)'}</span>
                      </div>
                      {student.activeSanctionPeriodText && (
                        <div className="text-[9px] text-neutral-400 font-mono">
                          {student.activeSanctionPeriodText}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Action */}
                <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between">
                  <span className="text-[11px] text-neutral-500">
                    {hasActiveSanctions ? 'Sanction en exécution' : 'Livret régularisé'}
                  </span>

                  <button
                    onClick={() => setSelectedStudentForDossier(student.name)}
                    className="px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Consulter le livret</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {selectedStudentForDossier && (
        <StudentDossierModal
          studentName={selectedStudentForDossier}
          isOpen={!!selectedStudentForDossier}
          onClose={() => setSelectedStudentForDossier(null)}
        />
      )}

      <NewDisciplinaryReportModal
        isOpen={isNewReportModalOpen}
        onClose={() => setIsNewReportModalOpen(false)}
      />

      {/* Reset Student Database Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-neutral-900 border border-red-800/80 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-950/80 border border-red-800 flex items-center justify-center text-red-500 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-neutral-100 font-cinzel">
                Vider la base des élèves ?
              </h3>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                Cette action va réinitialiser entièrement le registre des élèves et effacer l'intégralité des <strong>{logs.length} rapport(s)</strong> pour remettre la base à zéro (0 élève).
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

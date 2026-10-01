import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { DisciplinaryLog, LogStatus } from '../types';
import { 
  X, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  Printer, 
  Check, 
  User, 
  Ban, 
  Sparkles, 
  Upload, 
  Camera, 
  Trash2, 
  Edit3, 
  Save, 
  Image as ImageIcon,
  Flame,
  Shield,
  Phone,
  BookOpen,
  RefreshCw,
  Calendar
} from 'lucide-react';
import { KonohaLeafIcon, DisciplinarySealStamp } from './KonohaIcons';
import { getSanctionTimeRemaining } from '../lib/rpDuration';

interface StudentDossierModalProps {
  studentName: string;
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'sanctions' | 'fiche';
}

export const STUDENT_RANKS = [
  'Apprenti Genin',
  'Genin',
  'Genin Confirmé'
] as const;

export const generateRandomMatricule = (): string => {
  const num = Math.floor(1000 + Math.random() * 9000);
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return `STU-KNH-${num}-${letter}`;
};

const CHAKRA_NATURES = [
  'Non révélée / Inconnue',
  'Katon (Feu)',
  'Fūton (Vent)',
  'Raiton (Foudre)',
  'Doton (Terre)',
  'Suiton (Eau)',
  'In (Yin)',
  'Yô (Yang)',
  'Double affinité'
];

export const StudentDossierModal: React.FC<StudentDossierModalProps> = ({ 
  studentName, 
  isOpen, 
  onClose,
  initialTab = 'sanctions'
}) => {
  const { logs, updateLog, canApproveOrClassify, currentUser, students, updateStudent } = useApp();

  const studentLogs = logs.filter(l => l.studentName.toLowerCase().trim() === studentName.toLowerCase().trim());
  const primaryLog = studentLogs[0];

  // Matched student from the real Firestore /students collection
  const studentRecord = students.find(
    s => s.name.toLowerCase().trim() === studentName.toLowerCase().trim() ||
         (primaryLog && s.registrationNumber === primaryLog.studentRegistrationNumber)
  );

  const [activeTab, setActiveTab] = useState<'sanctions' | 'fiche'>(initialTab);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<LogStatus>('en_cours');
  const [printSuccess, setPrintSuccess] = useState(false);

  // Fiche élève editable state
  const [isEditingFiche, setIsEditingFiche] = useState(false);
  const [photoInput, setPhotoInput] = useState<string>('');
  const [photoUrlInput, setPhotoUrlInput] = useState<string>('');
  const [ageInput, setAgeInput] = useState<string>('');
  const [clanInput, setClanInput] = useState<string>('');
  const [classInput, setClassInput] = useState<string>('Apprenti Genin');
  const [registrationNumberInput, setRegistrationNumberInput] = useState<string>('');
  const [chakraNatureInput, setChakraNatureInput] = useState<string>('');
  const [mentorInput, setMentorInput] = useState<string>('');
  const [guardianNameInput, setGuardianNameInput] = useState<string>('');
  const [guardianContactInput, setGuardianContactInput] = useState<string>('');
  const [notesInput, setNotesInput] = useState<string>('');
  
  const [isSavingFiche, setIsSavingFiche] = useState(false);
  const [ficheSaveSuccess, setFicheSaveSuccess] = useState(false);
  const [ficheError, setFicheError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const normalizeRank = (val?: string): string => {
    if (!val) return 'Apprenti Genin';
    if (val.includes('Confirmé')) return 'Genin Confirmé';
    if (val.includes('Apprenti')) return 'Apprenti Genin';
    if (val.includes('Genin')) return 'Genin';
    return 'Apprenti Genin';
  };

  // Sync state with current student record
  useEffect(() => {
    if (studentRecord) {
      setPhotoInput(studentRecord.photoUrl || studentRecord.avatar || '');
      setAgeInput(studentRecord.age || '');
      setClanInput(studentRecord.clan || primaryLog?.studentClan || '');
      setClassInput(normalizeRank(studentRecord.class || primaryLog?.studentClass));
      setRegistrationNumberInput(studentRecord.registrationNumber || primaryLog?.studentRegistrationNumber || generateRandomMatricule());
      setChakraNatureInput(studentRecord.chakraNature || 'Non révélée / Inconnue');
      setMentorInput(studentRecord.mentor || '');
      setGuardianNameInput(studentRecord.guardianName || '');
      setGuardianContactInput(studentRecord.guardianContact || '');
      setNotesInput(studentRecord.disciplinaryNotes || '');
    } else if (primaryLog) {
      setClanInput(primaryLog.studentClan);
      setClassInput(normalizeRank(primaryLog.studentClass));
      setRegistrationNumberInput(primaryLog.studentRegistrationNumber || generateRandomMatricule());
    }
  }, [studentRecord, primaryLog]);

  if (!isOpen || !primaryLog) return null;

  const totalSanctions = studentLogs.length;
  const activeLogs = studentLogs.filter(l => l.status === 'en_cours' || l.status === 'sanctionne');

  // Log status editing
  const startEdit = (log: DisciplinaryLog) => {
    setEditingLogId(log.id);
    setSelectedStatus(log.status);
  };

  const saveEdit = (logId: string) => {
    updateLog(logId, {
      status: selectedStatus
    });
    setEditingLogId(null);
  };

  const handlePrint = () => {
    setPrintSuccess(true);
    setTimeout(() => setPrintSuccess(false), 2500);
  };

  // Image file upload & client-side compression for database storage
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFicheError('Veuillez sélectionner un fichier image valide (JPG, PNG, WebP).');
      return;
    }

    setFicheError('');
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        // Offscreen canvas resize to max 360x360 for light & fast database storage
        const canvas = document.createElement('canvas');
        const maxDim = 360;
        let w = img.width;
        let h = img.height;
        if (w > h) {
          if (w > maxDim) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          }
        } else {
          if (h > maxDim) {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, w, h);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
        setPhotoInput(compressedBase64);
      };
      img.src = readerEvent.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Handle URL photo input apply
  const handleApplyPhotoUrl = () => {
    if (photoUrlInput.trim()) {
      setPhotoInput(photoUrlInput.trim());
      setPhotoUrlInput('');
    }
  };

  // Save the student fiche
  const handleSaveFiche = async () => {
    setIsSavingFiche(true);
    setFicheError('');

    try {
      const studentId = studentRecord?.id || (primaryLog.studentName + '-' + primaryLog.studentRegistrationNumber).toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      
      await updateStudent(studentId, {
        photoUrl: photoInput.trim() || undefined,
        avatar: photoInput.trim() || undefined,
        age: ageInput.trim() || undefined,
        clan: clanInput.trim() || primaryLog.studentClan,
        class: classInput.trim() || primaryLog.studentClass,
        registrationNumber: registrationNumberInput.trim() || primaryLog.studentRegistrationNumber,
        chakraNature: chakraNatureInput.trim() || undefined,
        mentor: mentorInput.trim() || undefined,
        guardianName: guardianNameInput.trim() || undefined,
        guardianContact: guardianContactInput.trim() || undefined,
        disciplinaryNotes: notesInput.trim() || undefined
      });

      setFicheSaveSuccess(true);
      setIsEditingFiche(false);
      setTimeout(() => setFicheSaveSuccess(false), 3000);
    } catch {
      setFicheError('Une erreur est survenue lors de l\'enregistrement de la fiche élève.');
    } finally {
      setIsSavingFiche(false);
    }
  };

  const effectivePhoto = photoInput || studentRecord?.photoUrl || studentRecord?.avatar;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden my-8 animate-fadeIn">
        
        {/* Hidden file input for picture upload */}
        <input 
          type="file" 
          ref={fileInputRef} 
          accept="image/*" 
          onChange={handleImageUpload} 
          className="hidden" 
        />

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-950/80 border border-red-800/80 flex items-center justify-center text-red-500 shadow-sm">
              <KonohaLeafIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-cinzel text-lg font-bold text-neutral-100 uppercase tracking-wide">
                  Dossier & Fiche Élève
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                  {primaryLog.studentRegistrationNumber}
                </span>
                {effectivePhoto ? (
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300">
                    Photo d'Identité Active
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/80 text-amber-300">
                    Photo à Importer
                  </span>
                )}
              </div>
              <span className="text-xs text-neutral-400">
                Académie Shinobi de Konoha · Registre Persistant Firestore
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-md transition-colors cursor-pointer"
              title="Exporter / Imprimer le procès-verbal"
            >
              {printSuccess ? <Check className="w-5 h-5 text-emerald-400" /> : <Printer className="w-5 h-5" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-md transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Student Profile Identity Card (With Photo & Quick Edit) */}
        <div className="p-6 bg-neutral-950/70 border-b border-neutral-800 relative">
          <div className="absolute right-6 top-4 hidden md:block opacity-70 pointer-events-none">
            <DisciplinarySealStamp size="sm" label="DOSSIER ÉLÈVE" sublabel="KONOHA ACADÉMIE" />
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-5">
            {/* Student Photo with Camera/Upload Trigger */}
            <div className="relative group shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-neutral-900 border-2 border-neutral-700 flex items-center justify-center text-neutral-500 shadow-lg">
                {effectivePhoto ? (
                  <img 
                    src={effectivePhoto} 
                    alt={primaryLog.studentName} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-neutral-500">
                    <User className="w-8 h-8 text-neutral-400" />
                    <span className="text-[9px] font-mono mt-0.5 text-neutral-500">Sans photo</span>
                  </div>
                )}
              </div>

              {/* Upload trigger button overlaid */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('fiche');
                  setIsEditingFiche(true);
                  fileInputRef.current?.click();
                }}
                className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-md transition-all cursor-pointer group-hover:scale-110"
                title="Importer / Modifier la photo de l'élève"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-xl sm:text-2xl font-bold text-neutral-100 font-cinzel">
                  {primaryLog.studentName}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('fiche');
                    setIsEditingFiche(!isEditingFiche);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer border border-neutral-700"
                >
                  <Edit3 className="w-3.5 h-3.5 text-red-400" />
                  <span>{isEditingFiche ? 'Masquer l\'éditeur' : 'Remplir / Modifier la fiche'}</span>
                </button>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
                <span className="font-semibold text-red-400">Clan {studentRecord?.clan || primaryLog.studentClan}</span>
                <span aria-hidden="true" className="text-neutral-600">·</span>
                <span className="text-neutral-300 font-medium">Rang : {studentRecord?.class || primaryLog.studentClass}</span>
                <span aria-hidden="true" className="text-neutral-600">·</span>
                <span className="font-mono text-neutral-400">Matricule: {studentRecord?.registrationNumber || primaryLog.studentRegistrationNumber}</span>
                {studentRecord?.age && (
                  <>
                    <span aria-hidden="true" className="text-neutral-600">·</span>
                    <span className="text-neutral-300 font-medium">Âge : {studentRecord.age}</span>
                  </>
                )}
                {studentRecord?.chakraNature && studentRecord.chakraNature !== 'Non révélée / Inconnue' && (
                  <>
                    <span aria-hidden="true" className="text-neutral-600">·</span>
                    <span className="text-amber-400 font-medium flex items-center gap-1">
                      <Flame className="w-3 h-3 text-orange-500" />
                      {studentRecord.chakraNature}
                    </span>
                  </>
                )}
              </div>

              {/* Status summary metrics */}
              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs border-t border-neutral-800/80 mt-2">
                <div className="flex items-center gap-1.5 text-neutral-300">
                  <span className="font-mono font-bold text-sm text-neutral-100">{totalSanctions}</span>
                  <span className="text-neutral-500">infractions consignées</span>
                </div>
                <span aria-hidden="true" className="text-neutral-700">|</span>
                <div className="flex items-center gap-1.5 text-amber-400">
                  <span className="font-mono font-bold text-sm">{activeLogs.length}</span>
                  <span className="text-amber-400/80">en cours de purge</span>
                </div>
                <span aria-hidden="true" className="text-neutral-700">|</span>
                <div className="flex items-center gap-1.5">
                  <Ban className="w-3.5 h-3.5 text-red-400" />
                  <span className="font-mono font-bold text-xs text-red-300">
                    {studentRecord?.hasExamBan 
                      ? `${studentRecord.examBanDuration || '1 an RP'}` 
                      : 'Aucune interdiction active'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success / Notification banner */}
        {ficheSaveSuccess && (
          <div className="px-6 py-2.5 bg-emerald-950/80 border-b border-emerald-800 text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>La fiche élève et la photo ont été enregistrées avec succès dans la base de données.</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="px-6 border-b border-neutral-800 bg-neutral-950 flex items-center gap-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('sanctions')}
            className={`py-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'sanctions'
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Historique des Infractions & Sanctions ({studentLogs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fiche')}
            className={`py-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'fiche'
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Fiche Individuelle & Photo d'Identité</span>
            {effectivePhoto ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* Tab 1: Sanctions History */}
        {activeTab === 'sanctions' && (
          <div className="p-6 max-h-[55vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider font-cinzel">
                Procès-Verbaux Consignés à l'Académie
              </h4>
              <span className="text-xs text-neutral-500 font-mono">
                {studentLogs.length} dossier{studentLogs.length > 1 ? 's' : ''} au livret
              </span>
            </div>

            {studentLogs.map((log) => {
              const isEditing = editingLogId === log.id;
              const gravityColor = 
                log.gravity === 'Rang S' ? 'text-red-400 border-red-800 bg-red-950/40' :
                log.gravity === 'Rang A' ? 'text-red-400 border-red-800/60 bg-red-950/30' :
                log.gravity === 'Rang B' ? 'text-orange-400 border-orange-800/60 bg-orange-950/20' :
                log.gravity === 'Rang C' ? 'text-amber-400 border-amber-800/60 bg-amber-950/20' :
                'text-blue-400 border-blue-800/60 bg-blue-950/20';

              return (
                <div 
                  key={log.id} 
                  className="p-4 rounded-lg bg-neutral-950/80 border border-neutral-800 transition-colors"
                >
                  {/* Header line */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-800/80">
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded border ${gravityColor}`}>
                        {log.gravity}
                      </span>
                      <span className="text-sm font-semibold text-neutral-200">
                        {log.infractionType}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-neutral-400">
                      <span>{log.konohaDate}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-neutral-500">{log.id}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-neutral-300 mt-2.5 leading-relaxed">
                    {log.description}
                  </p>

                  {/* Evidence */}
                  {log.evidence && (
                    <div className="mt-2 text-[11px] text-neutral-400 bg-neutral-900/60 p-2 rounded border border-neutral-800">
                      <span className="font-semibold text-neutral-300">Éléments matériels / Témoins : </span>
                      {log.evidence}
                    </div>
                  )}

                  {/* Sanction Details */}
                  <div className="mt-3 pt-3 border-t border-neutral-800/80 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs">
                    <div className="flex-1">
                      <span className="text-[11px] text-neutral-500 block uppercase font-mono">
                        Sanction(s) prononcée(s)
                      </span>
                      {log.sanctionsList && log.sanctionsList.length > 0 ? (
                        <div className="space-y-1 mt-1">
                          {log.sanctionsList.map((punishment, pIdx) => (
                            <div key={pIdx} className="flex items-start gap-1.5 text-neutral-200">
                              <span className="text-red-400 font-mono text-[11px] leading-tight">•</span>
                              <span className="leading-tight">{punishment}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-neutral-200 font-medium block mt-0.5">{log.sanctionApplied}</span>
                      )}

                      {/* Exam Ban Notice */}
                      {log.examBan?.enabled && (
                        <div className="mt-2.5 p-2 rounded-lg bg-red-950/40 border border-red-800/60 text-xs">
                          <div className="flex items-center gap-1.5 text-red-300 font-semibold">
                            <Ban className="w-3.5 h-3.5 text-red-400" />
                            <span>Interdiction de passage d'examen : <strong>{log.examBan.duration}</strong></span>
                          </div>
                          {log.examBan.reductionTask && (
                            <div className="mt-1 text-[11px] text-neutral-300 flex items-start gap-1.5">
                              <Sparkles className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                              <span><strong>Tâche de réduction :</strong> {log.examBan.reductionTask}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {log.summonsIssued && (
                        <span className="inline-block mt-2 text-[10px] text-red-400 font-medium px-2 py-0.5 rounded bg-red-950/60 border border-red-800/60">
                          Convocation Clan Émise
                        </span>
                      )}

                      {/* Special RP / IRL Duration Period */}
                      {(log.sanctionPeriodText || log.durationRP) && (
                        <div className="mt-2.5 p-2 rounded-lg bg-neutral-900/90 border border-neutral-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-1.5 text-neutral-300 font-mono text-[11px]">
                            <Calendar className="w-3.5 h-3.5 text-red-400 shrink-0" />
                            <span className="font-semibold text-neutral-200">Période IRL :</span>
                            <span className="text-emerald-400 font-semibold">{log.sanctionPeriodText}</span>
                            {log.durationRP && (
                              <span className="text-neutral-400 font-sans">({log.durationRP})</span>
                            )}
                          </div>
                          {(() => {
                            const remaining = getSanctionTimeRemaining(log.endDateIRL || log.examBan?.endDateIRL);
                            return (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${remaining.badgeClass}`}>
                                {remaining.text}
                              </span>
                            );
                          })()}
                        </div>
                      )}
                    </div>

                    {/* Status & Edit Form */}
                    <div className="flex items-center gap-3 shrink-0">
                      {isEditing ? (
                        <div className="flex items-center gap-2 bg-neutral-900 p-2 rounded border border-neutral-700">
                          <select
                            value={selectedStatus}
                            onChange={e => setSelectedStatus(e.target.value as LogStatus)}
                            className="px-2 py-1 bg-neutral-950 border border-neutral-700 rounded text-xs text-neutral-200 focus:outline-none"
                          >
                            <option value="en_cours">En cours</option>
                            <option value="sanctionne">Sanctionné</option>
                            <option value="cloture">Clôturé / Purgé</option>
                            <option value="recours">Recours</option>
                          </select>

                          <button
                            onClick={() => saveEdit(log.id)}
                            className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded cursor-pointer"
                          >
                            Valider
                          </button>
                          <button
                            onClick={() => setEditingLogId(null)}
                            className="px-2 py-1 text-xs text-neutral-400 hover:text-neutral-200 cursor-pointer"
                          >
                            Annuler
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                            log.status === 'cloture' ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/60' :
                            log.status === 'sanctionne' ? 'text-amber-400 bg-amber-950/40 border border-amber-800/60' :
                            log.status === 'recours' ? 'text-purple-400 bg-purple-950/40 border border-purple-800/60' :
                            'text-neutral-300 bg-neutral-800 border border-neutral-700'
                          }`}>
                            {log.status === 'cloture' ? 'Sanction Clôturée / Purgée' :
                             log.status === 'sanctionne' ? 'En Exécution' :
                             log.status === 'recours' ? 'Recours en cours' : 'En Instruction'}
                          </span>

                          {canApproveOrClassify && (
                            <button
                              onClick={() => startEdit(log)}
                              className="px-2 py-1 text-xs text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                            >
                              Modifier
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reporting officer signature */}
                  <div className="mt-2 text-[10px] text-neutral-500 flex items-center justify-between font-mono">
                    <span>Rapporteur : {log.reportedBy.ninjaName} ({log.reportedBy.role})</span>
                    {log.approvedBy && (
                      <span>Validé par : {log.approvedBy.ninjaName} ({log.approvedBy.role})</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Fiche Élève & Photo d'Identité */}
        {activeTab === 'fiche' && (
          <div className="p-6 max-h-[58vh] overflow-y-auto space-y-6">
            
            {ficheError && (
              <div className="p-3 bg-red-950/70 border border-red-800 rounded-lg text-xs text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{ficheError}</span>
              </div>
            )}

            {/* Photo Importation Section */}
            <div className="p-5 rounded-xl bg-neutral-950 border border-neutral-800">
              <h4 className="text-xs font-bold text-neutral-200 uppercase tracking-wider font-cinzel mb-3 flex items-center gap-2">
                <Camera className="w-4 h-4 text-red-500" />
                <span>Photo d'Identité Officielle de l'Aspirant</span>
              </h4>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                {/* Photo Preview Canvas */}
                <div className="relative group shrink-0">
                  <div className="w-28 h-28 rounded-2xl overflow-hidden bg-neutral-900 border-2 border-dashed border-neutral-700 flex items-center justify-center shadow-inner">
                    {photoInput ? (
                      <img 
                        src={photoInput} 
                        alt="Aperçu élève" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-3 text-neutral-500">
                        <ImageIcon className="w-8 h-8 mx-auto mb-1 text-neutral-600" />
                        <span className="text-[10px] block font-mono">Aucune photo</span>
                      </div>
                    )}
                  </div>

                  {photoInput && (
                    <button
                      type="button"
                      onClick={() => setPhotoInput('')}
                      className="absolute -top-2 -right-2 p-1.5 rounded-full bg-neutral-900 border border-neutral-700 text-red-400 hover:text-red-300 shadow-md cursor-pointer"
                      title="Retirer la photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Import actions & URL paste */}
                <div className="flex-1 w-full space-y-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-sm shadow-red-950/40"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Importer depuis l'ordinateur</span>
                    </button>

                    {photoInput && (
                      <button
                        type="button"
                        onClick={() => setPhotoInput('')}
                        className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-red-300 text-xs font-medium rounded-lg transition-colors border border-neutral-800 cursor-pointer"
                      >
                        Effacer la photo
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-neutral-500">
                    Formats acceptés : JPG, PNG, WebP. L'image sera automatiquement dimensionnée et optimisée pour la base de données de l'Académie.
                  </p>

                  {/* Or image URL input */}
                  <div className="pt-2 border-t border-neutral-800/80">
                    <span className="block text-[11px] text-neutral-400 mb-1 font-mono">
                      Ou coller une URL d'image directe :
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={photoUrlInput}
                        onChange={e => setPhotoUrlInput(e.target.value)}
                        placeholder="https://.../photo-eleve.jpg"
                        className="flex-1 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-red-600 font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPhotoUrl}
                        className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        Appliquer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* General Info & Shinobi Attributes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Clan / Lignée
                </label>
                <input
                  type="text"
                  value={clanInput}
                  onChange={e => setClanInput(e.target.value)}
                  placeholder="ex: Uchiha, Hyūga, Senju, Civil..."
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Rang Shinobi <span className="text-red-500">*</span>
                </label>
                <select
                  value={classInput}
                  onChange={e => setClassInput(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-red-600"
                >
                  {STUDENT_RANKS.map(rank => (
                    <option key={rank} value={rank}>{rank}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-neutral-300">
                    Numéro de Matricule
                  </label>
                  <button
                    type="button"
                    onClick={() => setRegistrationNumberInput(generateRandomMatricule())}
                    className="text-[10px] text-red-400 hover:text-red-300 font-mono flex items-center gap-1 cursor-pointer transition-colors"
                    title="Générer un matricule aléatoire"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Aléatoire</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={registrationNumberInput}
                  onChange={e => setRegistrationNumberInput(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 font-mono focus:outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Âge de l'aspirant
                </label>
                <input
                  type="text"
                  value={ageInput}
                  onChange={e => setAgeInput(e.target.value)}
                  placeholder="ex: 12 ans"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Nature de Chakra dominante
                </label>
                <select
                  value={chakraNatureInput}
                  onChange={e => setChakraNatureInput(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-red-600"
                >
                  {CHAKRA_NATURES.map((nature, idx) => (
                    <option key={idx} value={nature}>{nature}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Tuteur légal / Représentant de Clan
                </label>
                <input
                  type="text"
                  value={guardianNameInput}
                  onChange={e => setGuardianNameInput(e.target.value)}
                  placeholder="ex: Hiashi Hyūga / Délégué civil"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Contact ou Quartier de résidence
                </label>
                <input
                  type="text"
                  value={guardianContactInput}
                  onChange={e => setGuardianContactInput(e.target.value)}
                  placeholder="ex: Enclave Uchiha, Allée des Saules #4"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-red-600"
                />
              </div>
            </div>

            {/* Mentor / Sensei */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Instructeur référent / Sensei assigné
              </label>
              <input
                type="text"
                value={mentorInput}
                onChange={e => setMentorInput(e.target.value)}
                placeholder="ex: Chûnin Iruka Umino"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-red-600"
              />
            </div>

            {/* Disciplinary & Pedagogical Observations */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Observations Pédagogiques & Suivi Comportemental
              </label>
              <textarea
                rows={4}
                value={notesInput}
                onChange={e => setNotesInput(e.target.value)}
                placeholder="Notes de surveillance, tendances au chahut, respect des consignes du dojo, potentiel en Ninjutsu/Taijutsu..."
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-red-600 leading-relaxed"
              />
            </div>

            {/* Save Button */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleSaveFiche}
                disabled={isSavingFiche}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-red-950/50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingFiche ? 'Enregistrement Firestore...' : 'Enregistrer la Fiche Élève & Photo'}</span>
              </button>
            </div>

          </div>
        )}

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-mono text-[11px]">Base de Données Firestore Synchronisée</span>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'sanctions' && (
              <button
                type="button"
                onClick={() => setActiveTab('fiche')}
                className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                Compléter la Fiche Élève
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition-colors font-medium cursor-pointer"
            >
              Fermer le dossier
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { GravityLevel, LogStatus } from '../types';
import { X, AlertCircle, Save, Plus, Minus, Ban, Clock, Sparkles, RefreshCw, Calendar } from 'lucide-react';
import { KonohaLeafIcon } from './KonohaIcons';
import { RP_DURATION_SCALE, calculateSanctionDates } from '../lib/rpDuration';

interface NewDisciplinaryReportModalProps {
  isOpen: boolean;
  onClose: () => void;
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

const CLANS = [
  'Civil / Sans Clan',
  'Uchiha',
  'Hyūga',
  'Nara',
  'Akimichi',
  'Senju',
];

const INFRACTION_TYPES = [
  'Dégradation de monuments & biens du village',
  'Usage non autorisé de Ninjutsu élémentaire ou destructeur',
  'Bagarre non réglementaire au dojo sans instructeur',
  'Insolence et refus d\'obtempérer à un Chûnin',
  'Tricherie aux examens théoriques scellés',
  'Trafic ou port d\'armes / explosifs prohibés',
  'Absences répétées & somnolence délibérée',
  'Fuite ou franchissement non autorisé des grilles de l\'Académie',
  'Atteinte à l\'ordre public shinobi (Rang S)'
];

const SUGGESTED_PUNISHMENTS = [
  'Nettoyage et remise en état surveillés du dojo d\'entraînement',
  'Entretien minutieux des stèles commémoratives sous garde d\'un Chûnin',
  'Copie manuscrite de l\'intégralité du Règlement Intérieur',
  'Travaux d\'intérêt collectif au bénéfice du village de Konoha',
  'Interdiction temporaire d\'accès aux terrains d\'entraînement',
  'Suspension des privilèges de cantine et sorties libres',
  'Avertissement solennel consigné au livret d\'aspirant shinobi'
];

export const NewDisciplinaryReportModal: React.FC<NewDisciplinaryReportModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, addLog, logs, canCreateReport } = useApp();

  const [studentName, setStudentName] = useState('');
  const [studentClan, setStudentClan] = useState('Civil / Sans Clan');
  const [studentClass, setStudentClass] = useState<string>('Apprenti Genin');
  const [studentRegistrationNumber, setStudentRegistrationNumber] = useState<string>(() => generateRandomMatricule());

  // Generate a fresh random matricule when modal opens if not selecting existing student
  useEffect(() => {
    if (isOpen && !studentName.trim()) {
      setStudentRegistrationNumber(generateRandomMatricule());
      setStudentClass('Apprenti Genin');
    }
  }, [isOpen]);
  const [infractionType, setInfractionType] = useState(INFRACTION_TYPES[0]);
  const [gravity, setGravity] = useState<GravityLevel>('Rang C');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState('');

  // Dynamic Punishments List (+ / -)
  const [punishments, setPunishments] = useState<string[]>([
    'Nettoyage et remise en état surveillés du dojo d\'entraînement'
  ]);

  // Special Duration System (1 jour IRL = 1 mois RP, 1 semaine IRL = 1 an RP)
  const [selectedDurationValue, setSelectedDurationValue] = useState<string>('1_an');
  const [startDateInput, setStartDateInput] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // Exam Ban configuration
  const [hasExamBan, setHasExamBan] = useState<boolean>(false);
  const [examBanReductionTask, setExamBanReductionTask] = useState<string>('');

  const [status, setStatus] = useState<LogStatus>('en_cours');
  const [summonsIssued, setSummonsIssued] = useState(false);
  const [formError, setFormError] = useState('');

  // Calculate dates according to official scale
  const currentDurationOption = useMemo(() => {
    return RP_DURATION_SCALE.find(d => d.value === selectedDurationValue) || RP_DURATION_SCALE[6]; // 1 an RP (7 jours IRL)
  }, [selectedDurationValue]);

  const calculatedDates = useMemo(() => {
    const start = startDateInput ? new Date(startDateInput) : new Date();
    return calculateSanctionDates(start, currentDurationOption.irlDays);
  }, [startDateInput, currentDurationOption]);

  if (!isOpen) return null;

  if (!canCreateReport) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl text-center">
          <div className="w-12 h-12 rounded-full bg-red-950/80 border border-red-800 flex items-center justify-center text-red-400 mx-auto mb-4">
            <Ban className="w-6 h-6" />
          </div>
          <h3 className="font-cinzel text-lg font-bold text-neutral-100 uppercase tracking-wide mb-2">
            Habilitation Disciplinaire Requise
          </h3>
          <p className="text-xs text-neutral-400 leading-relaxed mb-6">
            Conformément aux décrets de l'Académie de Konoha, seuls les détenteurs des postes suivants sont habilités à rédiger des dossiers et prononcer des sanctions :
          </p>
          <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 text-left text-xs font-mono space-y-2 mb-6 text-neutral-300">
            <div className="flex items-center gap-2 text-red-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span>Responsable Disciplinaire</span>
            </div>
            <div className="flex items-center gap-2 text-red-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span>Co-Responsable Disciplinaire</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-300">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Membre Disciplinaire</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-300">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Membre en Probation Disciplinaire</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  // Add punishment row (+)
  const handleAddPunishment = () => {
    setPunishments(prev => [...prev, '']);
  };

  // Remove punishment row (-)
  const handleRemovePunishment = (index: number) => {
    setPunishments(prev => prev.filter((_, i) => i !== index));
  };

  // Update punishment text
  const handleUpdatePunishment = (index: number, value: string) => {
    setPunishments(prev => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  // Add preset punishment
  const handleAddPreset = (preset: string) => {
    if (punishments.length === 1 && punishments[0].trim() === '') {
      setPunishments([preset]);
    } else {
      setPunishments(prev => [...prev, preset]);
    }
  };

  // Existing students from logs if any
  const existingStudents = Array.from(new Set(logs.map(l => l.studentName)));

  const handleSelectExistingStudent = (name: string) => {
    if (!name) return;
    const foundLog = logs.find(l => l.studentName === name);
    if (foundLog) {
      setStudentName(foundLog.studentName);
      setStudentClan(foundLog.studentClan);
      setStudentClass(foundLog.studentClass);
      setStudentRegistrationNumber(foundLog.studentRegistrationNumber);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!studentName.trim()) {
      setFormError('Veuillez renseigner le nom complet de l\'élève.');
      return;
    }

    if (!description.trim()) {
      setFormError('Veuillez détailler les faits reprochés.');
      return;
    }

    const validPunishments = punishments.map(p => p.trim()).filter(Boolean);
    if (validPunishments.length === 0 && !hasExamBan) {
      setFormError('Veuillez ajouter au moins une punition avec le bouton (+) ou activer une interdiction d\'examen.');
      return;
    }

    // Build combined readable sanction text
    const parts: string[] = [...validPunishments];
    if (hasExamBan) {
      const banDetails = `Interdiction d'examen (${currentDurationOption.rpLabel} · ${currentDurationOption.irlDays}j IRL - ${calculatedDates.periodText})${
        examBanReductionTask.trim() ? ` [Tâche de réduction: ${examBanReductionTask.trim()}]` : ''
      }`;
      parts.push(banDetails);
    }
    const combinedSanctions = parts.join(' • ');

    addLog({
      studentName: studentName.trim(),
      studentClan,
      studentClass,
      studentRegistrationNumber,
      infractionType,
      gravity,
      description: description.trim(),
      evidence: evidence.trim() || 'Constat direct de l\'instructeur verbalisateur.',
      sanctionApplied: combinedSanctions,
      sanctionsList: validPunishments,
      durationRP: currentDurationOption.rpLabel,
      durationIRLDays: currentDurationOption.irlDays,
      startDateIRL: calculatedDates.startDateISO,
      endDateIRL: calculatedDates.endDateISO,
      sanctionPeriodText: calculatedDates.periodText,
      examBan: hasExamBan ? {
        enabled: true,
        duration: `${currentDurationOption.rpLabel} (${currentDurationOption.irlDays}j IRL)`,
        rpDuration: currentDurationOption.rpLabel,
        irlDays: currentDurationOption.irlDays,
        startDateIRL: calculatedDates.startDateISO,
        endDateIRL: calculatedDates.endDateISO,
        reductionTask: examBanReductionTask.trim()
      } : undefined,
      status,
      reportedBy: {
        id: currentUser?.id || 'agent-0',
        ninjaName: currentUser?.ninjaName || 'Instructeur Inconnu',
        email: currentUser?.email || 'yllianxviii@gmail.com',
        discordTag: currentUser?.discordTag || '',
        role: currentUser?.posts?.[0] || currentUser?.ninjaRank || 'Direction'
      },
      summonsIssued
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-950/80 border border-red-800/80 flex items-center justify-center text-red-500">
              <KonohaLeafIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-cinzel text-base font-bold text-neutral-100 uppercase tracking-wide">
                Nouveau Procès-Verbal Disciplinaire
              </h2>
              <span className="text-xs text-neutral-400">
                Officier verbalisateur : <span className="text-neutral-200 font-medium">{currentUser?.ninjaName}</span> ({currentUser?.ninjaRank}{currentUser?.posts?.[0] ? ` · ${currentUser.posts[0]}` : ''})
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          
          {/* Quick Preload Select if existing students exist */}
          {existingStudents.length > 0 && (
            <div className="p-3 bg-neutral-950/60 border border-neutral-800/80 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>Sélectionner un élève déjà fiché au registre :</span>
              </div>
              <select
                onChange={e => handleSelectExistingStudent(e.target.value)}
                defaultValue=""
                className="px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-200 focus:outline-none focus:border-red-600"
              >
                <option value="">Sélectionner dans les dossiers actifs...</option>
                {existingStudents.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Student Identity Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Nom complet de l'élève <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={studentName}
                onChange={e => setStudentName(e.target.value)}
                placeholder="Ex: Naruto Uzumaki, Sasuke Uchiha..."
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-red-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Clan / Lignée noble <span className="text-red-500">*</span>
              </label>
              <select
                value={studentClan}
                onChange={e => setStudentClan(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-100 focus:outline-none focus:border-red-600"
              >
                {CLANS.map(clan => (
                  <option key={clan} value={clan}>{clan}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Rang <span className="text-red-500">*</span>
              </label>
              <select
                value={studentClass}
                onChange={e => setStudentClass(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-100 focus:outline-none focus:border-red-600"
              >
                {STUDENT_RANKS.map(rank => (
                  <option key={rank} value={rank}>{rank}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-neutral-300">
                  Numéro de Matricule Académie
                </label>
                <button
                  type="button"
                  onClick={() => setStudentRegistrationNumber(generateRandomMatricule())}
                  className="text-[10px] text-red-400 hover:text-red-300 font-mono flex items-center gap-1 cursor-pointer transition-colors"
                  title="Générer un nouveau matricule aléatoire"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Aléatoire</span>
                </button>
              </div>
              <input
                type="text"
                value={studentRegistrationNumber}
                onChange={e => setStudentRegistrationNumber(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-100 font-mono focus:outline-none focus:border-red-600"
              />
            </div>
          </div>

          <div className="border-t border-neutral-800/80 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Catégorie d'Infraction <span className="text-red-500">*</span>
              </label>
              <select
                value={infractionType}
                onChange={e => setInfractionType(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-100 focus:outline-none focus:border-red-600"
              >
                {INFRACTION_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Gravité de l'Infraction (Barème Konoha) <span className="text-red-500">*</span>
              </label>
              <select
                value={gravity}
                onChange={e => setGravity(e.target.value as GravityLevel)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm font-semibold focus:outline-none focus:border-red-600"
                style={{
                  color: gravity === 'Rang S' ? '#ef4444' : gravity === 'Rang A' ? '#f87171' : gravity === 'Rang B' ? '#fb923c' : gravity === 'Rang C' ? '#fbbf24' : '#60a5fa'
                }}
              >
                <option value="Rang D">Rang D — Infraction mineure (Retard, bavardage)</option>
                <option value="Rang C">Rang C — Infraction moyenne (Bagarre dojo, chahut)</option>
                <option value="Rang B">Rang B — Infraction grave (Ninjutsu offensif, dégradation)</option>
                <option value="Rang A">Rang A — Infraction majeure (Trafic, Kinjutsu, blessures)</option>
                <option value="Rang S">Rang S — Atteinte critique à la sûreté de Konoha</option>
              </select>
            </div>
          </div>

          {/* Description & Evidence */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Description circonstanciée des faits <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Rédigez l'exposé des faits constatés par l'officier de surveillance ou l'instructeur..."
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-red-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Pièces à conviction, témoins et éléments matériels
            </label>
            <input
              type="text"
              value={evidence}
              onChange={e => setEvidence(e.target.value)}
              placeholder="Ex: Armes saisies, parchemins altérés, déposition de l'instructeur..."
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-red-600"
            />
          </div>

          {/* DYNAMIC PUNISHMENTS SECTION (+ / -) */}
          <div className="border-t border-neutral-800/80 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-neutral-200 uppercase tracking-wide font-cinzel">
                  Punitions & Peines Disciplinaires
                </label>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Ajoutez plusieurs sanctions avec le bouton <strong className="text-emerald-400">(+)</strong> et retirez-en avec <strong className="text-red-400">(-)</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddPunishment}
                className="px-3 py-1.5 bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter une punition (+)</span>
              </button>
            </div>

            {/* List of Punishments with Inputs and (-) buttons */}
            <div className="space-y-2.5">
              {punishments.map((punishment, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-neutral-800 text-neutral-400 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>

                  <input
                    type="text"
                    value={punishment}
                    onChange={e => handleUpdatePunishment(idx, e.target.value)}
                    placeholder={`Punition n°${idx + 1} (ex: 10h de nettoyage du dojo nord, corvée de parchemins...)`}
                    className="flex-1 px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-red-600"
                  />

                  <button
                    type="button"
                    onClick={() => handleRemovePunishment(idx)}
                    disabled={punishments.length === 1 && !hasExamBan && punishment.trim() === ''}
                    title="Retirer cette punition (-)"
                    className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg border border-neutral-800 hover:border-red-800/60 transition-colors cursor-pointer shrink-0"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Suggestions presets */}
            <div className="pt-1">
              <span className="text-[11px] text-neutral-500 font-mono block mb-1.5">
                Suggestions rapides de sanctions Konoha :
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_PUNISHMENTS.map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleAddPreset(sug)}
                    className="px-2 py-1 rounded bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-[11px] text-neutral-300 transition-colors cursor-pointer text-left"
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* EXAM BAN SECTION (Interdiction d'examen: 3 à 6 mois, 1 à 5 ans + Tâche de réduction) */}
          <div className="border-t border-neutral-800/80 pt-4">
            <div className={`p-4 rounded-xl border transition-all ${
              hasExamBan 
                ? 'bg-red-950/20 border-red-800/70 shadow-lg shadow-red-950/20' 
                : 'bg-neutral-950/40 border-neutral-800'
            }`}>
              {/* Header Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    hasExamBan ? 'bg-red-600 text-white' : 'bg-neutral-800 text-neutral-400'
                  }`}>
                    <Ban className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-neutral-100 font-cinzel">
                      Interdiction de Passage d'Examen (Genin / Chunin)
                    </h4>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Bloque temporairement l'accès de l'élève aux épreuves officielles de graduation
                    </p>
                  </div>
                </div>

                {/* Toggle Button */}
                <button
                  type="button"
                  onClick={() => setHasExamBan(!hasExamBan)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    hasExamBan
                      ? 'bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-950/50'
                      : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                  }`}
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>{hasExamBan ? 'Interdiction Activée' : 'Activer l\'interdiction'}</span>
                </button>
              </div>

              {/* Conditional Exam Ban Settings */}
              {hasExamBan && (
                <div className="mt-4 pt-4 border-t border-red-900/40 space-y-3 animate-fadeIn">
                  
                  {/* Task to reduce the exam ban duration */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-200 mb-1.5 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Tâche ou Mission pour réduire la durée d'interdiction d'examen</span>
                    </label>
                    <textarea
                      rows={2}
                      value={examBanReductionTask}
                      onChange={e => setExamBanReductionTask(e.target.value)}
                      placeholder="Ex: Accomplir des missions de surveillance au dojo ou assistance académique pour réduire la durée de moitié..."
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-xs sm:text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-red-500"
                    />
                    <span className="text-[11px] text-neutral-400 mt-1 block">
                      Condition ou action de rédemption permettant d'alléger ou lever l'interdiction de graduation.
                    </span>
                  </div>

                </div>
              )}
            </div>
          </div>

          {/* Special Duration Scale System (1j IRL = 1 mois RP, 1 sem IRL = 1 an RP) */}
          <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <label className="text-xs font-bold text-neutral-200 uppercase tracking-wide font-cinzel flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-500" />
                <span>Durée de la Sanction & Échelle RP / IRL</span>
              </label>
              <span className="text-[11px] font-mono text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-800/60 w-fit">
                1j IRL = 1 mois RP · 1 sem = 1 an RP
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                  Durée de la sanction / interdiction
                </label>
                <select
                  value={selectedDurationValue}
                  onChange={e => setSelectedDurationValue(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs sm:text-sm text-neutral-100 font-semibold focus:outline-none focus:border-red-500 cursor-pointer"
                >
                  <optgroup label="Échelle en Mois (1 jour IRL = 1 mois RP)">
                    {RP_DURATION_SCALE.slice(0, 6).map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Échelle en Années (1 semaine IRL = 1 an RP)">
                    {RP_DURATION_SCALE.slice(6).map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                  Date de début IRL
                </label>
                <input
                  type="date"
                  value={startDateInput}
                  onChange={e => setStartDateInput(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs sm:text-sm text-neutral-100 font-mono focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            {/* Live Calculation Preview Banner */}
            <div className="p-3 rounded-lg bg-neutral-900/90 border border-neutral-800 text-xs space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-neutral-400">Période IRL calculée :</span>
                <span className="font-mono font-bold text-emerald-400 text-xs sm:text-sm">
                  {calculatedDates.periodText}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between text-[11px] text-neutral-400 pt-1.5 border-t border-neutral-800">
                <span>Équivalence en jeu : <strong className="text-neutral-200">{currentDurationOption.rpLabel}</strong></span>
                <span>Durée IRL effective : <strong className="text-neutral-200">{currentDurationOption.irlDays} jour{currentDurationOption.irlDays > 1 ? 's' : ''} IRL</strong></span>
              </div>
            </div>
          </div>

          {/* Status & Summons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-neutral-800/80 pt-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Statut initial du dossier
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as LogStatus)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-100 focus:outline-none focus:border-red-600"
              >
                <option value="en_cours">En cours d'instruction</option>
                <option value="sanctionne">Sanction active / en exécution</option>
                <option value="cloture">Classé sans suite / Purgé</option>
                <option value="recours">Recours déposé (Conseil/Clan)</option>
              </select>
            </div>

            <div className="flex items-center">
              <div className="w-full flex items-center gap-3 p-3 bg-neutral-950/60 rounded-lg border border-neutral-800">
                <input
                  type="checkbox"
                  id="summonsToggle"
                  checked={summonsIssued}
                  onChange={e => setSummonsIssued(e.target.checked)}
                  className="w-4 h-4 rounded bg-neutral-950 border-neutral-700 text-red-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <label htmlFor="summonsToggle" className="text-xs text-neutral-300 cursor-pointer select-none">
                  <span className="font-semibold block text-neutral-200">Convocation officielle de Clan</span>
                  <span className="text-neutral-400 text-[11px]">Notifier le chef de clan ou tuteur légal</span>
                </label>
              </div>
            </div>
          </div>

          {/* Form Error Banner */}
          {formError && (
            <div className="p-3 rounded-lg bg-red-950/80 border border-red-800 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{formError}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2 shadow-md shadow-red-950/40 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Apposer le Sceau & Enregistrer</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

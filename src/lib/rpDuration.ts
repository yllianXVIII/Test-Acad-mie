/**
 * Système de Durée Spéciale de l'Académie de Konoha :
 * 
 * Échelle officielle :
 * 1 jour IRL = 1 mois RP
 * 2 jours IRL = 2 mois RP
 * 3 jours IRL = 3 mois RP
 * 4 jours IRL = 4 mois RP
 * 5 jours IRL = 5 mois RP
 * 6 jours IRL = 6 mois RP
 * 1 semaine IRL (7 jours) = 1 an RP
 * 2 semaines IRL (14 jours) = 2 ans RP
 * 3 semaines IRL (21 jours) = 3 ans RP
 * 
 * Exemple : 1 an d'interdiction d'examen = 7 jours IRL.
 * Si appliqué le 01/10/2026 -> levée le 08/10/2026 inclus.
 */

export interface RPDurationOption {
  value: string;
  rpLabel: string;
  irlDays: number;
  label: string;
  summary: string;
}

export const RP_DURATION_SCALE: RPDurationOption[] = [
  { value: '1_mois', rpLabel: '1 mois RP', irlDays: 1, label: '1 mois RP (1 jour IRL)', summary: '1 mois RP · 1j IRL' },
  { value: '2_mois', rpLabel: '2 mois RP', irlDays: 2, label: '2 mois RP (2 jours IRL)', summary: '2 mois RP · 2j IRL' },
  { value: '3_mois', rpLabel: '3 mois RP', irlDays: 3, label: '3 mois RP (3 jours IRL)', summary: '3 mois RP · 3j IRL' },
  { value: '4_mois', rpLabel: '4 mois RP', irlDays: 4, label: '4 mois RP (4 jours IRL)', summary: '4 mois RP · 4j IRL' },
  { value: '5_mois', rpLabel: '5 mois RP', irlDays: 5, label: '5 mois RP (5 jours IRL)', summary: '5 mois RP · 5j IRL' },
  { value: '6_mois', rpLabel: '6 mois RP', irlDays: 6, label: '6 mois RP (6 jours IRL)', summary: '6 mois RP · 6j IRL' },
  { value: '1_an', rpLabel: '1 an RP', irlDays: 7, label: '1 an RP (1 semaine IRL / 7 jours)', summary: '1 an RP · 7j IRL' },
  { value: '2_ans', rpLabel: '2 ans RP', irlDays: 14, label: '2 ans RP (2 semaines IRL / 14 jours)', summary: '2 ans RP · 14j IRL' },
  { value: '3_ans', rpLabel: '3 ans RP', irlDays: 21, label: '3 ans RP (3 semaines IRL / 21 jours)', summary: '3 ans RP · 21j IRL' },
];

/**
 * Calcule la période IRL exacte (début, fin incluse) selon les jours IRL.
 * Ex: Début 01/10 + 7 jours = fin 08/10 inclus.
 */
export function calculateSanctionDates(startDateInput: Date | string, irlDays: number) {
  const start = typeof startDateInput === 'string' ? new Date(startDateInput) : new Date(startDateInput.getTime());
  const validStart = isNaN(start.getTime()) ? new Date() : start;
  
  // Date de fin = début + irlDays (24h par jour)
  const end = new Date(validStart.getTime() + irlDays * 24 * 60 * 60 * 1000);
  
  const formatDateFr = (d: Date) => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const startFormatted = formatDateFr(validStart);
  const endFormatted = formatDateFr(end);
  const periodText = `Du ${startFormatted} au ${endFormatted} inclus`;

  return {
    startDateISO: validStart.toISOString(),
    endDateISO: end.toISOString(),
    startFormatted,
    endFormatted,
    periodText
  };
}

/**
 * Analyse le statut restant d'une interdiction ou sanction IRL
 */
export function getSanctionTimeRemaining(endDateISO?: string): {
  isExpired: boolean;
  text: string;
  badgeClass: string;
  daysRemaining: number;
  hoursRemaining: number;
} {
  if (!endDateISO) {
    return {
      isExpired: false,
      text: 'Durée non définie',
      badgeClass: 'text-neutral-400 bg-neutral-800 border-neutral-700',
      daysRemaining: 0,
      hoursRemaining: 0
    };
  }

  const end = new Date(endDateISO);
  if (isNaN(end.getTime())) {
    return {
      isExpired: false,
      text: 'Date indéterminée',
      badgeClass: 'text-neutral-400 bg-neutral-800 border-neutral-700',
      daysRemaining: 0,
      hoursRemaining: 0
    };
  }

  const now = new Date();
  const diffMs = end.getTime() - now.getTime();

  if (diffMs <= 0) {
    return {
      isExpired: true,
      text: `Purgée / Expirée`,
      badgeClass: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/80',
      daysRemaining: 0,
      hoursRemaining: 0
    };
  }

  const totalHours = Math.ceil(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  let remainingText = '';
  if (days > 0) {
    remainingText = `${days}j ${hours}h IRL restant${days > 1 ? 's' : ''}`;
  } else {
    remainingText = `${hours}h IRL restant${hours > 1 ? 'es' : 'e'}`;
  }

  return {
    isExpired: false,
    text: remainingText,
    badgeClass: 'text-amber-400 bg-amber-950/60 border-amber-800/80',
    daysRemaining: days,
    hoursRemaining: hours
  };
}

/**
 * Trouve l'option de durée par texte ou valeur par défaut
 */
export function findRPOptionByText(text?: string): RPDurationOption {
  if (!text) return RP_DURATION_SCALE[0];
  const cleaned = text.toLowerCase().trim();
  
  if (cleaned.includes('3 an') || cleaned.includes('21 jour') || cleaned.includes('3 semaine')) {
    return RP_DURATION_SCALE[8];
  }
  if (cleaned.includes('2 an') || cleaned.includes('14 jour') || cleaned.includes('2 semaine')) {
    return RP_DURATION_SCALE[7];
  }
  if (cleaned.includes('1 an') || cleaned.includes('1an') || cleaned.includes('7 jour') || cleaned.includes('1 semaine') || cleaned.includes('une semaine')) {
    return RP_DURATION_SCALE[6]; // 1 an RP (7 jours IRL)
  }
  if (cleaned.includes('6 mois') || cleaned.includes('6 jour')) {
    return RP_DURATION_SCALE[5];
  }
  if (cleaned.includes('5 mois') || cleaned.includes('5 jour')) {
    return RP_DURATION_SCALE[4];
  }
  if (cleaned.includes('4 mois') || cleaned.includes('4 jour')) {
    return RP_DURATION_SCALE[3];
  }
  if (cleaned.includes('3 mois') || cleaned.includes('3 jour')) {
    return RP_DURATION_SCALE[2];
  }
  if (cleaned.includes('2 mois') || cleaned.includes('2 jour')) {
    return RP_DURATION_SCALE[1];
  }
  return RP_DURATION_SCALE[0]; // 1 mois RP (1 jour IRL)
}

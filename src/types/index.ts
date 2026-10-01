export type UserRole = 
  | 'direction'                 // Direction de l'Académie (Hokage, Conseillers, Directeur) -> Accès Admin total
  | 'responsable_disciplinaire' // Responsable du Pôle Disciplinaire -> Accès Admin total
  | 'admin_serveur'             // Administrateur Zenkai RP -> Accès Admin total
  | 'instructeur_chunin'        // Chûnin Instructeur -> Accès Logs, Dossiers, Création de rapports
  | 'agent_surveillance';       // Agent de Surveillance -> Accès Consultation & Rédaction de rapports

export type NinjaRank = 
  | 'Apprenti Genin'
  | 'Genin'
  | 'Genin Confirmé'
  | 'Chunin'
  | 'Konin'
  | 'Tokubetsu Jonin'
  | 'Jonin'
  | 'Sanin'
  | 'Hokage';

export type AcademyPost = 
  | 'Directeur'
  | 'Directeur Adjoint'
  | 'Responsable Professeur'
  | 'Co-Responsable Professeur'
  | 'Responsable Examinateur'
  | 'Co-Responsable Examinateur'
  | 'Responsable Disciplinaire'
  | 'Co-Responsable Disciplinaire'
  | 'Responsable Coordination'
  | 'Co-Responsable Coordination'
  | 'Membre Disciplinaire'
  | 'Membre en Probation Disciplinaire'
  | 'Examinateur'
  | 'Examinateur Apprenti'
  | 'Professeur'
  | 'Professeur Apprenti'
  | 'Coordinateur'
  | string;

export type GravityLevel = 
  | 'Rang D' // Infraction mineure (Retard, bavardage, oubli de matériel)
  | 'Rang C' // Infraction moyenne (Bagarre de dojo, chahut, désobéissance)
  | 'Rang B' // Infraction grave (Usage Ninjutsu offensif interdit, vandalisme)
  | 'Rang A' // Infraction majeure (Kinjutsu, blessures corporelles graves, fuite)
  | 'Rang S'; // Atteinte à la sûreté du village / Haute trahison académique

export type LogStatus = 
  | 'en_cours'   // En cours d'instruction
  | 'sanctionne' // Sanction active / en exécution
  | 'cloture'    // Sanction purgée / dossier classé
  | 'recours';   // Recours auprès du chef de clan ou de la direction

export interface UserProfile {
  id: string;
  email: string;
  ninjaName: string;
  avatar: string;
  role: UserRole;
  ninjaRank: NinjaRank;
  posts: string[];
  department: string;
  matricule: string;
  password?: string;
  isPrimaryAdmin?: boolean;
  discordTag?: string;
  discordId?: string;
}

export interface StaffMember {
  id: string;
  email: string;
  ninjaName: string;
  avatar: string;
  role: UserRole;
  ninjaRank: NinjaRank;
  posts: string[];
  status: 'actif' | 'suspendu' | 'en_mission';
  joinedDate: string;
  assignedCasesCount: number;
  contactNote?: string;
  password?: string;
  isPrimaryAdmin?: boolean;
  discordTag?: string;
  discordId?: string;
}

export interface StudentRecord {
  id: string;
  name: string;
  clan: string;
  class: string;
  registrationNumber: string;
  avatar?: string;
  photoUrl?: string;
  age?: string;
  chakraNature?: string;
  mentor?: string;
  guardianName?: string;
  guardianContact?: string;
  disciplinaryNotes?: string;
  totalInfractions: number;
  activeSanctions: number;
  remainingHours?: number;
  highestGravity: string;
  hasExamBan?: boolean;
  examBanDuration?: string;
  examBanReductionTask?: string;
  examBanEndDateIRL?: string;
  activeSanctionPeriodText?: string;
  lastInfractionDate: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DisciplinaryLog {
  id: string;
  studentName: string;
  studentClan: string;
  studentClass: string;
  studentRegistrationNumber: string;
  infractionType: string;
  gravity: GravityLevel;
  description: string;
  evidence: string;
  sanctionApplied: string;
  status: LogStatus;
  reportedBy: {
    id: string;
    ninjaName: string;
    email?: string;
    discordTag?: string;
    role: string;
  };
  approvedBy?: {
    ninjaName: string;
    role: string;
  };
  konohaDate: string;
  createdAt: string;
  updatedAt: string;
  summonsIssued: boolean; // Convocation du tuteur ou chef de clan
  choreHoursTotal?: number;
  choreHoursRemaining?: number;
  // Durée spéciale RP <-> IRL
  durationRP?: string; // ex: "1 an RP"
  durationIRLDays?: number; // ex: 7
  startDateIRL?: string;
  endDateIRL?: string;
  sanctionPeriodText?: string; // ex: "Du 01/10/2026 au 08/10/2026 inclus"
  sanctionsList?: string[]; // Liste des punitions appliquées
  examBan?: {
    enabled: boolean;
    duration: string; // ex: "1 an RP (7 jours IRL)"
    rpDuration?: string; // ex: "1 an RP"
    irlDays?: number; // ex: 7
    startDateIRL?: string;
    endDateIRL?: string;
    reductionTask?: string; // Tâche pour réduire la durée
  };
}

export interface AcademyDocument {
  id: string;
  title: string;
  category: 'reglement' | 'procedure' | 'bareme' | 'formulaire' | 'protocole_urgence';
  clearanceRequired: 'tous_membres' | 'instructeurs_et_plus' | 'admin_direction';
  lastUpdated: string;
  version: string;
  author: string;
  summary: string;
  content: string;
  tags: string[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  konohaTime: string;
  actorEmail?: string;
  actorDiscordTag?: string;
  actorNinjaName: string;
  actorRole: string;
  actionType: 
    | 'CREATION_RAPPORT'
    | 'MODIFICATION_STATUT'
    | 'GESTION_PERSONNEL'
    | 'MAINTENANCE_ACTIVE'
    | 'MAINTENANCE_DESACTIVE'
    | 'DOCUMENT_AJOUT'
    | 'DOCUMENT_MODIFICATION'
    | 'DOCUMENT_SUPPRESSION'
    | 'SUPPRESSION_RAPPORT';
  details: string;
  targetRef?: string;
}

export interface SystemSettings {
  maintenanceMode: boolean;
  maintenanceReason: string;
  maintenanceEstimatedReopen: string;
  maintenanceActivatedBy: string;
  serverName: string;
  villageName: string;
  academySealNumber: string;
}

import { 
  UserProfile, 
  StaffMember, 
  DisciplinaryLog, 
  AcademyDocument, 
  AuditLog, 
  SystemSettings 
} from '../types';

export const PRIMARY_ADMIN_EMAIL = 'admin@gmail.com';
export const PRIMARY_ADMIN_PASSWORD = 'Allkiki2008@';

export const SHINOBI_RANKS = [
  'Apprenti Genin',
  'Genin',
  'Genin Confirmé',
  'Chunin',
  'Konin',
  'Tokubetsu Jonin',
  'Jonin',
  'Sanin',
  'Hokage'
] as const;

export const DEFAULT_ACADEMY_POSTS: string[] = [
  'Directeur',
  'Directeur Adjoint',
  'Responsable Professeur',
  'Co-Responsable Professeur',
  'Responsable Examinateur',
  'Co-Responsable Examinateur',
  'Responsable Disciplinaire',
  'Co-Responsable Disciplinaire',
  'Responsable Coordination',
  'Co-Responsable Coordination',
  'Membre Disciplinaire',
  'Membre en Probation Disciplinaire',
  'Examinateur',
  'Examinateur Apprenti',
  'Professeur',
  'Professeur Apprenti',
  'Coordinateur'
];

// Utilisateur administrateur principal préconfiguré
export const PRIMARY_ADMIN_USER: UserProfile = {
  id: 'staff-4453',
  email: PRIMARY_ADMIN_EMAIL,
  password: PRIMARY_ADMIN_PASSWORD,
  ninjaName: 'ADMIN',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
  role: 'direction',
  ninjaRank: 'Hokage',
  posts: ['Directeur', 'Responsable Disciplinaire'],
  department: 'Direction Centrale & Pôle Disciplinaire Zenkai RP',
  matricule: 'DIR-001',
  isPrimaryAdmin: true,
  discordTag: 'Admin#0001'
};

// Initial staff list: Primary admin and Yuki Orito as standard user
export const INITIAL_STAFF_MEMBERS: StaffMember[] = [
  {
    id: 'staff-4453',
    email: PRIMARY_ADMIN_EMAIL,
    password: PRIMARY_ADMIN_PASSWORD,
    ninjaName: 'ADMIN',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    role: 'direction',
    ninjaRank: 'Hokage',
    posts: ['Directeur', 'Responsable Disciplinaire'],
    status: 'actif',
    joinedDate: 'An 64 - Promotion Active',
    assignedCasesCount: 0,
    contactNote: 'Administrateur Principal & Direction de l\'Académie',
    isPrimaryAdmin: true,
    discordTag: 'Admin#0001'
  },
  {
    id: 'staff-admin-yllian',
    email: 'yllianxviii@gmail.com',
    password: 'Allkiki2008@',
    ninjaName: 'Yuki Orito',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    role: 'instructeur_chunin',
    ninjaRank: 'Genin Confirmé',
    posts: ['Professeur'],
    status: 'actif',
    joinedDate: 'An 64 - Fondateur',
    assignedCasesCount: 0,
    contactNote: 'Utilisateur standard',
    isPrimaryAdmin: false,
    discordTag: 'Yllian#0001'
  }
];

// Initial disciplinary logs: totally empty, all old dossiers removed
export const INITIAL_DISCIPLINARY_LOGS: DisciplinaryLog[] = [];

// Official Academy Documents & decrees
export const INITIAL_DOCUMENTS: AcademyDocument[] = [
  {
    id: 'DOC-KNH-001',
    title: 'Code de Discipline & Règles Générales de l\'Académie',
    category: 'reglement',
    clearanceRequired: 'tous_membres',
    lastUpdated: 'An 64 - Révision Direction',
    version: 'v4.2',
    author: 'Direction de l\'Académie (Yllian)',
    summary: 'Règles fondamentales de tenue, de respect des instructeurs et de protection de la Volonté du Feu dans l\'enceinte de Konoha.',
    content: `# RÈGLEMENT INTÉRIEUR DU CORPS DES ÉLÈVES DE L'ACADÉMIE DE KONOHA
*Décret de la Direction - Sceau officiel n°71-KNH*

## Article 1 : Sanctuaire de la Volonté du Feu
L'Académie est un lieu d'apprentissage et de camaraderie fraternelle. Tout acte visant à attenter à l'intégrité physique d'un camarade de village en dehors des règles strictes du Kumite supervisé est passible de sanctions immédiates.

## Article 2 : Port et utilisation des armes ninja (Bukijutsu)
- Les kunaïs et shurikens ne doivent quitter les étuis que sur ordre explicite d'un Chûnin ou Jônin instructeur.
- Le port de parchemins explosifs de classe 3 et supérieure est strictement interdit aux élèves non diplômés.

## Article 3 : Usage des techniques secrètes (Hiden & Ninjutsu)
Il est strictement interdit de faire usage de techniques héréditaires de clan ou de Ninjutsu de rang C ou supérieur dans les couloirs, réfectoires, toits ou cours de récréation sans présence d'un enseignant titulaire.

## Article 4 : Dégradation des biens du village
Tout graffiti, altération de mobilier ou profanation de monument officiel (y compris les effigies des Hokage) donnera lieu à des corvées de nettoyage obligatoires et à une retenue sur solde des tuteurs.`,
    tags: ['Règlement', 'Général', 'Volonté du Feu', 'Bukijutsu']
  },
  {
    id: 'DOC-KNH-002',
    title: 'Barème Officiel des Sanctions Disciplinaires - Zenkai RP',
    category: 'bareme',
    clearanceRequired: 'instructeurs_et_plus',
    lastUpdated: 'An 64 - Décret Disciplinaire',
    version: 'v3.0',
    author: 'Direction & Pôle Disciplinaire',
    summary: 'Grille d\'application des peines selon le Rang de l\'infraction commise par l\'aspirant ninja.',
    content: `# BARÈME OFFICIEL D'APPLICATION DES SANCTIONS
*Pôle Disciplinaire de l'Académie Shinobi - Serveur Zenkai RP*

## ÉCHELLE OFFICIELLE DE CONVERSION TEMPORELLE :
- **1 jour IRL = 1 mois RP**
- **2 jours IRL = 2 mois RP**
- **3 jours IRL = 3 mois RP**
- **4 jours IRL = 4 mois RP**
- **5 jours IRL = 5 mois RP**
- **6 jours IRL = 6 mois RP**
- **1 semaine IRL (7 jours) = 1 an RP**

*Exemple pratique :* Une interdiction d'examen prononcée pour une durée d'1 an RP équivaut à 7 jours IRL. Si la sanction débute le 01/10/2026, elle court du 01/10 au 08/10 inclus.

---

### Rang D (Infraction Mineure)
- **Motifs types :** Retard sans justificatif, chahut modéré, oubli de matériel d'exercice, tricherie mineure à l'oral.
- **Sanctions applicables :** Avertissement consigné au livret d'aspirant, copie manuscrite du Règlement, interdiction de sortie (1 à 2 mois RP · 1 à 2 jours IRL).

### Rang C (Infraction Moyenne)
- **Motifs types :** Bagarre non autorisée, désobéissance formelle à un Chûnin, vol de matériel pédagogique, fuite de classe.
- **Sanctions applicables :** Travaux d'intérêt collectif au dojo, suspension des privilèges de cantine, interdiction temporaire d'examen (3 à 6 mois RP · 3 à 6 jours IRL), convocation obligatoire du tuteur de clan.

### Rang B (Infraction Grave)
- **Motifs types :** Usage imprudent de Ninjutsu destructeur, dégradation de monuments historiques, blessure physique volontaire.
- **Sanctions applicables :** Nettoyage surveillé des stèles du village, interdiction d'accès aux terrains d'entraînement, interdiction d'examen (1 an RP · 1 semaine IRL), mention négative au dossier Genin.

### Rang A (Infraction Majeure)
- **Motifs types :** Trafic d'explosifs, vol de parchemins interdits de rang mineur, récidive de violence aggravée, tentative de fuite du village.
- **Sanctions applicables :** Suspension temporaire de formation shinobi (2 ans RP · 2 semaines IRL), mise sous surveillance Anbu discrète, comparution devant le Conseil restreint de l'Académie.

### Rang S (Atteinte Critique)
- **Motifs types :** Kinjutsu prohibé, compromission de la sécurité de Konoha, rébellion contre l'autorité du village.
- **Sanctions applicables :** Exclusion définitive de la filière shinobi (3 ans RP à perpétuité), scellement partiel ou total du chakra par la division de Fūinjutsu, transfert à la Police Militaire de Konoha.`,
    tags: ['Barème', 'Sanctions', 'Rangs Shinobi', 'Fūinjutsu']
  },
  {
    id: 'DOC-KNH-003',
    title: 'Protocole d\'Audition & Convocation des Tuteurs de Clan',
    category: 'procedure',
    clearanceRequired: 'instructeurs_et_plus',
    lastUpdated: 'An 64 - Pôle Juridique',
    version: 'v2.1',
    author: 'Direction & Conseil des Anciens',
    summary: 'Démarches légales et protocolaires lors de la convocation d\'un chef de clan noble ou d\'un représentant civil.',
    content: `# PROTOCOLE DE CONVOCATION DU PÔLE DISCIPLINAIRE
*Académie de Konoha - Section Relations Claniques*

1. **Notification formelle :**
   Toute sanction de Rang C ou supérieure impliquant un élève issu d'un clan noble (Uchiha, Hyūga, Nara, Akimichi, Yamanaka, Aburame, Inuzuka, Sarutobi) doit faire l'objet d'une lettre frappée du Sceau de Cire de l'Académie expédiée par messager ninja.

2. **Présence à l'audition :**
   Le tuteur légal ou un délégué officiel du clan assiste à l'entretien sans possibilité d'interrompre l'instructeur rapporteur durant l'exposé des faits.

3. **Recours en appel :**
   Un recours peut être déposé dans les 48 heures ninja auprès du bureau du Responsable Disciplinaire ou directement à la Direction de l'Académie.`,
    tags: ['Procédure', 'Clans', 'Convocation', 'Audition']
  },
  {
    id: 'DOC-KNH-004',
    title: 'Protocole Kekkai : Alerte & Confinement de l\'Académie',
    category: 'protocole_urgence',
    clearanceRequired: 'admin_direction',
    lastUpdated: 'An 64 - Division Sécurité',
    version: 'v1.8',
    author: 'Direction & Division Fūinjutsu',
    summary: 'Consignes de confinement d\'urgence, activation de la barrière de protection et évacuation vers les abris de roche.',
    content: `# PROTOCOLE DE SCELLEMENT D'URGENCE (KEKKAI JUTSU)
*Mesures spéciales de sûreté en cas d'intrusion ennemie ou d'incident chakra de classe rouge*

- Étape 1 : Déclenchement de la cloche d'alarme de niveau 4.
- Étape 2 : Confinement de tous les élèves dans les dojos souterrains scellés par Fūinjutsu.
- Étape 3 : Fermeture hermétique des grilles nord et est de l'Académie par les Chûnin de garde.
- Étape 4 : Déploiement immédiat de l'équipe d'intervention d'urgence sous commandement de la Direction.`,
    tags: ['Sécurité', 'Urgence', 'Kekkai', 'Confinement']
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'AUD-001',
    timestamp: new Date().toISOString(),
    konohaTime: 'An 64 - Initialisation du Registre',
    actorEmail: PRIMARY_ADMIN_EMAIL,
    actorNinjaName: 'Yllian (Direction)',
    actorRole: 'Direction de l\'Académie & Admin Principal',
    actionType: 'MODIFICATION_STATUT',
    details: 'Initialisation sécurisée du portail du Bureau Disciplinaire. Tous les anciens dossiers ont été purgés et le compte admin principal yllianxviii@gmail.com a été activé avec les pleins pouvoirs.'
  }
];

export const INITIAL_SYSTEM_SETTINGS: SystemSettings = {
  maintenanceMode: false,
  maintenanceReason: 'Archivage rituel des dossiers et renouvellement du Kekkai de protection de l\'Académie.',
  maintenanceEstimatedReopen: 'Réouverture estimée dans 45 minutes.',
  maintenanceActivatedBy: 'Direction de l\'Académie (Yllian)',
  serverName: 'Zenkai - Naruto RP',
  villageName: 'Village Caché de Konoha (木ノ葉隠れの里)',
  academySealNumber: 'SEAL-KNH-ACADEMY-719'
};

// Preset users list: contains only the primary admin
export const PRESET_USERS: UserProfile[] = [PRIMARY_ADMIN_USER];

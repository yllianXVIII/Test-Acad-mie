import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  UserProfile, 
  StaffMember, 
  DisciplinaryLog, 
  StudentRecord,
  AcademyDocument, 
  AuditLog, 
  SystemSettings, 
  UserRole,
  NinjaRank
} from '../types';
import { 
  INITIAL_STAFF_MEMBERS, 
  INITIAL_DISCIPLINARY_LOGS, 
  INITIAL_DOCUMENTS, 
  INITIAL_AUDIT_LOGS, 
  INITIAL_SYSTEM_SETTINGS, 
  PRESET_USERS,
  PRIMARY_ADMIN_EMAIL,
  PRIMARY_ADMIN_PASSWORD,
  PRIMARY_ADMIN_USER,
  DEFAULT_ACADEMY_POSTS
} from '../data/mockData';
import {
  seedInitialAdmin,
  saveUserToDb,
  updateUserInDb,
  deleteUserFromDb,
  subscribeToUsers,
  addSanctionToDb,
  updateSanctionInDb,
  deleteSanctionFromDb,
  clearAllSanctionsAndStudentsFromDb,
  subscribeToSanctions,
  subscribeToStudents,
  updateStudentInDb,
  saveAcademyPostsToDb,
  subscribeToAcademyPosts
} from '../lib/firebase';

interface AppContextType {
  currentUser: UserProfile | null;
  primaryAdminEmail: string;
  isPrimaryAdmin: boolean;
  loginWithGmail: (email: string, password: string, rememberMe?: boolean, ninjaName?: string) => Promise<{ success: boolean; error?: string }>;
  loginAsPrimaryAdmin: (password: string, rememberMe?: boolean) => { success: boolean; error?: string };
  loginWithPreset: (presetId: string) => void;
  loginCustomDiscord?: (custom: {
    discordTag?: string;
    email?: string;
    discordId?: string;
    ninjaName: string;
    role: UserRole;
    avatar?: string;
  }) => void;
  logout: () => void;

  // Academy Posts
  academyPosts: string[];
  addAcademyPost: (postName: string) => void;
  removeAcademyPost: (postName: string) => void;
  addPostToStaffMember: (staffId: string, postName: string) => void;
  removePostFromStaffMember: (staffId: string, postName: string) => void;

  // Logs (Sanctions)
  logs: DisciplinaryLog[];
  addLog: (newLog: Omit<DisciplinaryLog, 'id' | 'createdAt' | 'updatedAt' | 'konohaDate'>) => Promise<DisciplinaryLog>;
  updateLog: (id: string, updates: Partial<DisciplinaryLog>) => Promise<void>;
  deleteLog: (id: string, reason?: string) => Promise<void>;
  resetStudentDatabase: () => Promise<void>;

  // Students Directory (Synced automatically on sanction)
  students: StudentRecord[];
  updateStudent: (studentId: string, updates: Partial<StudentRecord>) => Promise<void>;

  // Staff (Comptes ayant accès au site)
  staff: StaffMember[];
  addStaffMember: (member: Omit<StaffMember, 'id' | 'assignedCasesCount'>) => Promise<void>;
  updateStaffMember: (id: string, updates: Partial<StaffMember>) => Promise<void>;
  removeStaffMember: (id: string, reason?: string) => Promise<void>;

  // Documents
  documents: AcademyDocument[];
  addDocument: (doc: Omit<AcademyDocument, 'id' | 'lastUpdated'>) => void;
  updateDocument: (id: string, updates: Partial<AcademyDocument>) => void;
  deleteDocument: (id: string) => void;

  // System & Maintenance
  systemSettings: SystemSettings;
  updateSystemSettings: (updates: Partial<SystemSettings>) => void;

  // Audit Logs
  auditLogs: AuditLog[];
  recordAudit: (actionType: AuditLog['actionType'], details: string, targetRef?: string) => void;

  // Permissions
  canAccessAdmin: boolean;
  canApproveOrClassify: boolean;
  canManageStaff: boolean;
  canCreateReport: boolean;
  isMaintenanceActiveForUser: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Academy Posts catalog (Synced with Firestore)
  const [academyPosts, setAcademyPosts] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('zenkai_konoha_v3_posts');
      if (saved) {
        const parsed: string[] = JSON.parse(saved);
        return Array.from(new Set([...DEFAULT_ACADEMY_POSTS, ...parsed]));
      }
      return DEFAULT_ACADEMY_POSTS;
    } catch {
      return DEFAULT_ACADEMY_POSTS;
    }
  });

  // Current authenticated user
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const isLocalActive = localStorage.getItem('zenkai_konoha_v3_session_active') === 'true';
      const isSessionActive = sessionStorage.getItem('zenkai_konoha_v3_session_active') === 'true';
      if (!isLocalActive && !isSessionActive) {
        return null;
      }
      const saved = localStorage.getItem('zenkai_konoha_v3_user') || sessionStorage.getItem('zenkai_konoha_v3_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.posts) parsed.posts = ['Directeur', 'Responsable Disciplinaire'];
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  // Disciplinary logs (Sanctions) - Synced with Firestore
  const [logs, setLogs] = useState<DisciplinaryLog[]>(() => {
    try {
      const saved = localStorage.getItem('zenkai_konoha_v3_logs');
      return saved ? JSON.parse(saved) : INITIAL_DISCIPLINARY_LOGS;
    } catch {
      return INITIAL_DISCIPLINARY_LOGS;
    }
  });

  // Students Directory - Synced with Firestore
  const [students, setStudents] = useState<StudentRecord[]>(() => {
    try {
      const saved = localStorage.getItem('zenkai_konoha_v3_students');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Staff members (Comptes avec accès) - Synced with Firestore
  const [staff, setStaff] = useState<StaffMember[]>(() => {
    try {
      const saved = localStorage.getItem('zenkai_konoha_v3_staff');
      if (saved) {
        const parsed: StaffMember[] = JSON.parse(saved);
        return parsed.map(m => ({
          ...m,
          posts: m.posts && Array.isArray(m.posts) ? m.posts : ['Membre Disciplinaire']
        }));
      }
      return INITIAL_STAFF_MEMBERS;
    } catch {
      return INITIAL_STAFF_MEMBERS;
    }
  });

  // Documents
  const [documents, setDocuments] = useState<AcademyDocument[]>(() => {
    try {
      const saved = localStorage.getItem('zenkai_konoha_v3_docs');
      return saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
    } catch {
      return INITIAL_DOCUMENTS;
    }
  });

  // Audit logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const saved = localStorage.getItem('zenkai_konoha_v3_audit');
      return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  });

  // System settings
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => {
    try {
      const saved = localStorage.getItem('zenkai_konoha_v3_settings');
      return saved ? JSON.parse(saved) : INITIAL_SYSTEM_SETTINGS;
    } catch {
      return INITIAL_SYSTEM_SETTINGS;
    }
  });

  /* =========================================================================
     FIREBASE FIRESTORE REAL-TIME SYNCHRONIZATION
     ========================================================================= */

  useEffect(() => {
    // 1. Ensure primary admin exists in Firestore
    seedInitialAdmin();

    // 2. Real-time subscription to accounts (/users)
    const unsubUsers = subscribeToUsers((firebaseStaff) => {
      if (firebaseStaff && firebaseStaff.length > 0) {
        setStaff(firebaseStaff);
      }
    });

    // 3. Real-time subscription to sanctions (/sanctions)
    const unsubSanctions = subscribeToSanctions((firebaseSanctions) => {
      setLogs(firebaseSanctions);
    });

    // 4. Real-time subscription to students (/students)
    const unsubStudents = subscribeToStudents((firebaseStudents) => {
      setStudents(firebaseStudents);
    });

    // 5. Real-time subscription to academy posts (/academy_config)
    const unsubPosts = subscribeToAcademyPosts((firebasePosts) => {
      if (firebasePosts && firebasePosts.length > 0) {
        setAcademyPosts(firebasePosts);
      }
    });

    return () => {
      unsubUsers();
      unsubSanctions();
      unsubStudents();
      unsubPosts();
    };
  }, []);

  // Persist fallback cache in localStorage
  useEffect(() => {
    localStorage.setItem('zenkai_konoha_v3_posts', JSON.stringify(academyPosts));
  }, [academyPosts]);

  useEffect(() => {
    if (currentUser) {
      if (localStorage.getItem('zenkai_konoha_v3_session_active') === 'true') {
        localStorage.setItem('zenkai_konoha_v3_user', JSON.stringify(currentUser));
      } else if (sessionStorage.getItem('zenkai_konoha_v3_session_active') === 'true') {
        sessionStorage.setItem('zenkai_konoha_v3_user', JSON.stringify(currentUser));
      } else {
        localStorage.setItem('zenkai_konoha_v3_user', JSON.stringify(currentUser));
      }
    } else {
      localStorage.removeItem('zenkai_konoha_v3_user');
      sessionStorage.removeItem('zenkai_konoha_v3_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('zenkai_konoha_v3_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('zenkai_konoha_v3_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('zenkai_konoha_v3_staff', JSON.stringify(staff));
  }, [staff]);

  useEffect(() => {
    localStorage.setItem('zenkai_konoha_v3_docs', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem('zenkai_konoha_v3_audit', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('zenkai_konoha_v3_settings', JSON.stringify(systemSettings));
  }, [systemSettings]);

  // Record audit log
  const recordAudit = (actionType: AuditLog['actionType'], details: string, targetRef?: string) => {
    const newEntry: AuditLog = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      konohaTime: `An 64 - ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
      actorEmail: currentUser?.email || 'anonyme@konoha.ninja',
      actorDiscordTag: currentUser?.discordTag || '',
      actorNinjaName: currentUser?.ninjaName || 'Officier',
      actorRole: currentUser?.posts?.join(', ') || (currentUser ? formatRoleLabel(currentUser.role) : 'Visiteur'),
      actionType,
      details,
      targetRef
    };
    setAuditLogs(prev => [newEntry, ...prev]);
  };

  /* =========================================================================
     AUTH ACTIONS (STRICT SECURE LOGIN)
     ========================================================================= */

  const primaryAdminStaff = staff.find(s => s.isPrimaryAdmin) || staff.find(s => s.email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase());
  const currentPrimaryAdminEmail = primaryAdminStaff?.email || PRIMARY_ADMIN_EMAIL;
  const isPrimaryAdmin = currentUser?.isPrimaryAdmin === true || currentUser?.email?.toLowerCase().trim() === currentPrimaryAdminEmail.toLowerCase().trim();

  const loginAsPrimaryAdmin = (passwordInput: string, rememberMe: boolean = true): { success: boolean; error?: string } => {
    const adminStaff = staff.find(s => s.isPrimaryAdmin || s.email.toLowerCase() === currentPrimaryAdminEmail.toLowerCase());
    const expectedPassword = adminStaff?.password || PRIMARY_ADMIN_PASSWORD;

    if (!passwordInput || passwordInput.trim() !== expectedPassword) {
      recordAudit('MODIFICATION_STATUT', `Échec d'authentification : mot de passe erroné sur le compte administrateur principal (${currentPrimaryAdminEmail})`);
      return { 
        success: false, 
        error: 'Identifiants invalides.' 
      };
    }

    const adminUser: UserProfile = {
      id: adminStaff?.id || PRIMARY_ADMIN_USER.id,
      email: currentPrimaryAdminEmail,
      ninjaName: adminStaff?.ninjaName || PRIMARY_ADMIN_USER.ninjaName,
      avatar: adminStaff?.avatar || PRIMARY_ADMIN_USER.avatar,
      role: 'direction',
      ninjaRank: adminStaff?.ninjaRank || 'Hokage',
      posts: adminStaff?.posts && adminStaff.posts.length > 0 ? adminStaff.posts : ['Directeur', 'Responsable Disciplinaire'],
      department: 'Direction Centrale & Pôle Disciplinaire Zenkai RP',
      matricule: 'DIR-001',
      password: expectedPassword,
      isPrimaryAdmin: true,
      discordTag: adminStaff?.discordTag || 'Admin#0001'
    };

    setCurrentUser(adminUser);
    if (rememberMe) {
      localStorage.setItem('zenkai_konoha_v3_session_active', 'true');
      localStorage.setItem('zenkai_konoha_v3_user', JSON.stringify(adminUser));
      sessionStorage.removeItem('zenkai_konoha_v3_session_active');
      sessionStorage.removeItem('zenkai_konoha_v3_user');
    } else {
      sessionStorage.setItem('zenkai_konoha_v3_session_active', 'true');
      sessionStorage.setItem('zenkai_konoha_v3_user', JSON.stringify(adminUser));
      localStorage.removeItem('zenkai_konoha_v3_session_active');
      localStorage.removeItem('zenkai_konoha_v3_user');
    }
    recordAudit('MODIFICATION_STATUT', `Connexion sécurisée réussie : ${currentPrimaryAdminEmail} (Direction Suprême)`);
    return { success: true };
  };

  const loginWithGmail = async (
    emailInput: string, 
    passwordInput: string, 
    rememberMe: boolean = true,
    ninjaNameInput?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = emailInput ? emailInput.trim().toLowerCase() : '';
    
    if (!cleanEmail) {
      return { success: false, error: 'Veuillez renseigner votre adresse email.' };
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return { success: false, error: 'Format d\'adresse email invalide (ex: utilisateur@gmail.com).' };
    }

    if (!passwordInput || passwordInput.trim().length === 0) {
      return { success: false, error: 'Veuillez renseigner votre mot de passe.' };
    }

    // Check if this is the primary admin email
    if (cleanEmail === currentPrimaryAdminEmail.toLowerCase().trim() || cleanEmail === PRIMARY_ADMIN_EMAIL.toLowerCase().trim()) {
      return loginAsPrimaryAdmin(passwordInput, rememberMe);
    }

    if (passwordInput.trim().length < 4) {
      return { success: false, error: 'Le mot de passe doit comporter au moins 4 caractères.' };
    }

    const persistSession = (user: UserProfile) => {
      setCurrentUser(user);
      if (rememberMe) {
        localStorage.setItem('zenkai_konoha_v3_session_active', 'true');
        localStorage.setItem('zenkai_konoha_v3_user', JSON.stringify(user));
        sessionStorage.removeItem('zenkai_konoha_v3_session_active');
        sessionStorage.removeItem('zenkai_konoha_v3_user');
      } else {
        sessionStorage.setItem('zenkai_konoha_v3_session_active', 'true');
        sessionStorage.setItem('zenkai_konoha_v3_user', JSON.stringify(user));
        localStorage.removeItem('zenkai_konoha_v3_session_active');
        localStorage.removeItem('zenkai_konoha_v3_user');
      }
    };

    // Check if user exists in Firestore staff collection
    const existingStaff = staff.find(s => s.email.toLowerCase().trim() === cleanEmail);

    if (existingStaff) {
      if (existingStaff.password && existingStaff.password !== passwordInput.trim()) {
        recordAudit('MODIFICATION_STATUT', `Échec d'authentification pour ${cleanEmail} : mot de passe incorrect`);
        return { success: false, error: 'Identifiants invalides.' };
      }

      if (!existingStaff.password) {
        await updateUserInDb(existingStaff.id, { password: passwordInput.trim() });
      }

      const user: UserProfile = {
        id: existingStaff.id,
        email: existingStaff.email,
        ninjaName: ninjaNameInput?.trim() || existingStaff.ninjaName,
        avatar: existingStaff.avatar,
        role: existingStaff.role,
        ninjaRank: existingStaff.ninjaRank,
        posts: existingStaff.posts || ['Membre Disciplinaire'],
        department: 'Bureau Disciplinaire Zenkai',
        matricule: `KNH-${Math.floor(100 + Math.random() * 900)}`,
        discordTag: existingStaff.discordTag,
        discordId: existingStaff.discordId,
        password: passwordInput.trim(),
        isPrimaryAdmin: false
      };
      persistSession(user);
      recordAudit('MODIFICATION_STATUT', `Connexion sécurisée de l'officier : ${user.ninjaName} (${user.email})`);
      return { success: true };
    } else {
      // New member registering
      const defaultName = ninjaNameInput?.trim() || cleanEmail.split('@')[0];
      const newStaffMember: StaffMember = {
        id: `staff-${Date.now()}`,
        email: cleanEmail,
        ninjaName: defaultName,
        avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80`,
        role: 'instructeur_chunin',
        ninjaRank: 'Chunin',
        posts: ['Membre Disciplinaire'],
        status: 'actif',
        joinedDate: 'An 64 - Session Récente',
        assignedCasesCount: 0,
        contactNote: 'Enregistré via portail disciplinaire',
        password: passwordInput.trim(),
        isPrimaryAdmin: false
      };

      // Persist to real Firestore database
      await saveUserToDb(newStaffMember);

      const newUser: UserProfile = {
        ...newStaffMember,
        department: 'Corps Enseignant & Pôle Disciplinaire',
        matricule: `KNH-${Math.floor(100 + Math.random() * 900)}`
      };
      persistSession(newUser);

      recordAudit('MODIFICATION_STATUT', `Nouvelle inscription enregistrée en base de données : ${newUser.ninjaName} (${cleanEmail})`);
      return { success: true };
    }
  };

  const loginWithPreset = (presetId: string) => {
    const found = PRESET_USERS.find(u => u.id === presetId);
    if (found) {
      setCurrentUser(found);
      localStorage.setItem('zenkai_konoha_v3_session_active', 'true');
      localStorage.setItem('zenkai_konoha_v3_user', JSON.stringify(found));
      recordAudit('MODIFICATION_STATUT', `Connexion sous l'identité de ${found.ninjaName} (${found.email})`);
    }
  };

  const loginCustomDiscord = (custom: {
    discordTag?: string;
    email?: string;
    discordId?: string;
    ninjaName: string;
    role: UserRole;
    avatar?: string;
  }) => {
    const emailToUse = custom.email || `${custom.ninjaName.toLowerCase().replace(/\s+/g, '')}@gmail.com`;
    loginWithGmail(emailToUse, '1234admin', true, custom.ninjaName);
  };

  const logout = () => {
    if (currentUser) {
      recordAudit('MODIFICATION_STATUT', `Déconnexion de session de ${currentUser.ninjaName} (${currentUser.email})`);
    }
    localStorage.removeItem('zenkai_konoha_v3_session_active');
    localStorage.removeItem('zenkai_konoha_v3_user');
    sessionStorage.removeItem('zenkai_konoha_v3_session_active');
    sessionStorage.removeItem('zenkai_konoha_v3_user');
    setCurrentUser(null);
  };

  /* =========================================================================
     SANCTIONS & STUDENTS DATABASE OPERATIONS (FIRESTORE)
     ========================================================================= */

  // Remise à zéro complète de la base de données des élèves et des sanctions
  const resetStudentDatabase = async () => {
    const count = logs.length;
    // Clear Firestore database
    await clearAllSanctionsAndStudentsFromDb();

    // Reset local states
    setLogs([]);
    setStudents([]);
    localStorage.removeItem('zenkai_konoha_v3_logs');
    localStorage.removeItem('zenkai_konoha_v3_students');

    recordAudit(
      'MODIFICATION_STATUT', 
      `Remise à zéro complète de la base de données Firestore des élèves et des sanctions (${count} dossier(s) purgé(s)).`
    );
  };

  // Add Log (Sanction) & sync student in Firestore
  const addLog = async (newLogData: Omit<DisciplinaryLog, 'id' | 'createdAt' | 'updatedAt' | 'konohaDate'>): Promise<DisciplinaryLog> => {
    if (!canCreateReport) {
      throw new Error("Accès refusé : Seuls les membres du Pôle Disciplinaire (Responsable, Co-Responsable, Membre ou Membre en Probation) sont autorisés à créer des dossiers et sanctions.");
    }

    const id = `LOG-KNH-${Math.floor(888 + Math.random() * 1000)}`;
    const now = new Date();
    const konohaDate = `An 64 - ${now.getDate()}e Jour du Mois des Feuilles`;
    
    const created: DisciplinaryLog = {
      ...newLogData,
      id,
      konohaDate,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    // Update local state immediately
    setLogs(prev => [created, ...prev]);

    // Save to Firestore & sync student record
    await addSanctionToDb(created);

    recordAudit(
      'CREATION_RAPPORT',
      `Nouveau rapport consigné en base de données pour l'élève ${created.studentName} (${created.infractionType} - ${created.gravity}). Rédacteur : ${currentUser?.ninjaName}`,
      id
    );
    return created;
  };

  // Update Log (Sanction) in Firestore
  const updateLog = async (id: string, updates: Partial<DisciplinaryLog>): Promise<void> => {
    setLogs(prev => prev.map(log => {
      if (log.id === id) {
        return { ...log, ...updates, updatedAt: new Date().toISOString() };
      }
      return log;
    }));

    await updateSanctionInDb(id, updates);
    recordAudit('MODIFICATION_STATUT', `Mise à jour en base de données du dossier ${id}`, id);
  };

  // Delete Log (Sanction) from Firestore
  const deleteLog = async (id: string, reason?: string): Promise<void> => {
    setLogs(prev => prev.filter(log => log.id !== id));
    await deleteSanctionFromDb(id);
    recordAudit('SUPPRESSION_RAPPORT', `Suppression en base de données du dossier ${id}. Motif: ${reason || 'Décret de la Direction'}`, id);
  };

  // Update Student Profile (Photo, identity, notes, mentor, chakra nature)
  const updateStudent = async (studentId: string, updates: Partial<StudentRecord>): Promise<void> => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s));
    await updateStudentInDb(studentId, updates);
    const target = students.find(s => s.id === studentId);
    recordAudit(
      'MODIFICATION_STATUT',
      `Mise à jour de la fiche élève de ${target?.name || studentId}${updates.photoUrl ? ' (Photo d\'identité importée)' : ''}`
    );
  };

  /* =========================================================================
     STAFF ACCOUNTS (FIRESTORE)
     ========================================================================= */

  const addStaffMember = async (memberData: Omit<StaffMember, 'id' | 'assignedCasesCount'>): Promise<void> => {
    const id = `staff-${Date.now().toString().slice(-4)}`;
    const newMember: StaffMember = {
      ...memberData,
      posts: memberData.posts && memberData.posts.length > 0 ? memberData.posts : ['Membre Disciplinaire'],
      id,
      assignedCasesCount: 0
    };

    setStaff(prev => [...prev, newMember]);
    await saveUserToDb(newMember);

    recordAudit('GESTION_PERSONNEL', `Création d'un compte en base de données : ${newMember.ninjaName} (${newMember.email}) - Postes: ${newMember.posts.join(', ')}.`);
  };

  const updateStaffMember = async (id: string, updates: Partial<StaffMember>): Promise<void> => {
    setStaff(prev => prev.map(m => {
      if (m.id === id) {
        if (m.isPrimaryAdmin || m.email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase()) {
          return {
            ...m,
            ...updates,
            email: PRIMARY_ADMIN_EMAIL,
            role: 'direction',
            isPrimaryAdmin: true
          };
        }
        return { ...m, ...updates };
      }
      return m;
    }));

    if (currentUser?.id === id) {
      setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
    }

    await updateUserInDb(id, updates);
    recordAudit('GESTION_PERSONNEL', `Mise à jour en base de données de l'officier ${id}`);
  };

  const removeStaffMember = async (id: string, reason?: string): Promise<void> => {
    const member = staff.find(m => m.id === id);
    if (member?.isPrimaryAdmin || member?.email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase()) {
      return;
    }
    setStaff(prev => prev.filter(m => m.id !== id));
    await deleteUserFromDb(id);
    recordAudit('GESTION_PERSONNEL', `Suppression du compte en base de données pour ${member?.ninjaName || id} (${member?.email}). Motif: ${reason || 'Décision administrative'}`);
  };

  /* =========================================================================
     ACADEMY POSTS (FIRESTORE)
     ========================================================================= */

  const addAcademyPost = (postName: string) => {
    const trimmed = postName.trim();
    if (!trimmed || academyPosts.includes(trimmed)) return;
    const updated = [...academyPosts, trimmed];
    setAcademyPosts(updated);
    saveAcademyPostsToDb(updated);
    recordAudit('GESTION_PERSONNEL', `Création d'un nouveau poste : "${trimmed}"`);
  };

  const removeAcademyPost = (postName: string) => {
    const updated = academyPosts.filter(p => p !== postName);
    setAcademyPosts(updated);
    saveAcademyPostsToDb(updated);

    // Also update staff
    setStaff(prev => prev.map(m => ({
      ...m,
      posts: (m.posts || []).filter(p => p !== postName)
    })));

    recordAudit('GESTION_PERSONNEL', `Suppression du poste de l'Académie : "${postName}"`);
  };

  const addPostToStaffMember = (staffId: string, postName: string) => {
    const trimmed = postName.trim();
    if (!trimmed) return;
    let updatedPosts: string[] = [];
    setStaff(prev => prev.map(m => {
      if (m.id === staffId) {
        const currentPosts = m.posts || [];
        if (currentPosts.includes(trimmed)) return m;
        updatedPosts = [...currentPosts, trimmed];
        return { ...m, posts: updatedPosts };
      }
      return m;
    }));

    if (updatedPosts.length > 0) {
      updateUserInDb(staffId, { posts: updatedPosts });
    }

    if (currentUser?.id === staffId) {
      setCurrentUser(prev => prev ? {
        ...prev,
        posts: (prev.posts || []).includes(trimmed) ? prev.posts : [...(prev.posts || []), trimmed]
      } : null);
    }

    const member = staff.find(m => m.id === staffId);
    recordAudit('GESTION_PERSONNEL', `Attribution du poste "${trimmed}" à ${member?.ninjaName || staffId}`);
  };

  const removePostFromStaffMember = (staffId: string, postName: string) => {
    let updatedPosts: string[] = [];
    setStaff(prev => prev.map(m => {
      if (m.id === staffId) {
        updatedPosts = (m.posts || []).filter(p => p !== postName);
        return { ...m, posts: updatedPosts };
      }
      return m;
    }));

    if (updatedPosts) {
      updateUserInDb(staffId, { posts: updatedPosts });
    }

    if (currentUser?.id === staffId) {
      setCurrentUser(prev => prev ? {
        ...prev,
        posts: (prev.posts || []).filter(p => p !== postName)
      } : null);
    }

    const member = staff.find(m => m.id === staffId);
    recordAudit('GESTION_PERSONNEL', `Retrait du poste "${postName}" pour ${member?.ninjaName || staffId}`);
  };

  /* =========================================================================
     DOCUMENTS & MAINTENANCE
     ========================================================================= */

  const addDocument = (docData: Omit<AcademyDocument, 'id' | 'lastUpdated'>) => {
    const id = `DOC-KNH-${Math.floor(100 + Math.random() * 900)}`;
    const newDoc: AcademyDocument = {
      ...docData,
      id,
      lastUpdated: 'An 64 - Décret Récent'
    };
    setDocuments(prev => [newDoc, ...prev]);
    recordAudit('DOCUMENT_AJOUT', `Publication d'un document officiel : ${newDoc.title}`, id);
  };

  const updateDocument = (id: string, updates: Partial<AcademyDocument>) => {
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, ...updates, lastUpdated: 'An 64 - Révision Récente' } : d));
    recordAudit('DOCUMENT_MODIFICATION', `Mise à jour du document officiel ${id}`, id);
  };

  const deleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
    recordAudit('DOCUMENT_SUPPRESSION', `Suppression du document ${id}`, id);
  };

  const updateSystemSettings = (updates: Partial<SystemSettings>) => {
    setSystemSettings(prev => ({ ...prev, ...updates }));
    recordAudit('MODIFICATION_STATUT', 'Mise à jour des paramètres système et statut de maintenance');
  };

  // Authorization flags
  const hasLeadershipPost = currentUser?.posts?.some(p => {
    const low = p.toLowerCase();
    return low === 'directeur' ||
           low === 'directeur adjoint' ||
           low.startsWith('responsable ') ||
           low.startsWith('co-responsable ') ||
           low.includes('responsable');
  });

  // Seules les personnes ayant l'un de ces 4 postes disciplinaires peuvent créer des dossiers et sanctions:
  // - Responsable Disciplinaire
  // - Co-Responsable Disciplinaire
  // - Membre Disciplinaire
  // - Membre en Probation Disciplinaire
  const DISCIPLINARY_CREATOR_POSTS = [
    'responsable disciplinaire',
    'co-responsable disciplinaire',
    'co responsable disciplinaire',
    'membre disciplinaire',
    'membre en probation disciplinaire'
  ];

  const hasDisciplinaryCreatorPost = (posts?: string[]): boolean => {
    if (!posts || !Array.isArray(posts)) return false;
    return posts.some(p => {
      const clean = p.toLowerCase().trim();
      return DISCIPLINARY_CREATOR_POSTS.some(auth => clean === auth || clean.includes(auth));
    });
  };

  const canCreateReport = hasDisciplinaryCreatorPost(currentUser?.posts) || 
                          currentUser?.role === 'responsable_disciplinaire';

  const canAccessAdmin = isPrimaryAdmin || 
                         hasLeadershipPost ||
                         currentUser?.role === 'direction' || 
                         currentUser?.role === 'responsable_disciplinaire' || 
                         currentUser?.role === 'admin_serveur';

  const canApproveOrClassify = canAccessAdmin;
  const canManageStaff = canAccessAdmin;

  const isMaintenanceActiveForUser = systemSettings.maintenanceMode && !canAccessAdmin;

  return (
    <AppContext.Provider value={{
      currentUser,
      primaryAdminEmail: currentPrimaryAdminEmail,
      isPrimaryAdmin,
      loginWithGmail,
      loginAsPrimaryAdmin,
      loginWithPreset,
      loginCustomDiscord,
      logout,
      academyPosts,
      addAcademyPost,
      removeAcademyPost,
      addPostToStaffMember,
      removePostFromStaffMember,
      logs,
      addLog,
      updateLog,
      deleteLog,
      resetStudentDatabase,
      students,
      updateStudent,
      staff,
      addStaffMember,
      updateStaffMember,
      removeStaffMember,
      documents,
      addDocument,
      updateDocument,
      deleteDocument,
      systemSettings,
      updateSystemSettings,
      auditLogs,
      recordAudit,
      canAccessAdmin,
      canApproveOrClassify,
      canManageStaff,
      canCreateReport,
      isMaintenanceActiveForUser
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

function formatRoleLabel(role: UserRole): string {
  switch (role) {
    case 'direction': return 'Direction de l\'Académie';
    case 'responsable_disciplinaire': return 'Responsable Pôle Disciplinaire';
    case 'admin_serveur': return 'Administrateur Zenkai';
    case 'instructeur_chunin': return 'Chûnin Instructeur';
    case 'agent_surveillance': return 'Agent de Surveillance';
  }
}

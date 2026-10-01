import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  getDocFromServer 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { StaffMember, DisciplinaryLog, StudentRecord } from '../types';
import { PRIMARY_ADMIN_EMAIL, PRIMARY_ADMIN_PASSWORD, PRIMARY_ADMIN_USER, DEFAULT_ACADEMY_POSTS } from '../data/mockData';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with configured databaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Test server connection on startup as mandated by the Firebase skill
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('the client is offline')) {
      console.warn('Firestore is currently running offline or connecting.');
    }
    return true;
  }
}
testFirestoreConnection();

/* =========================================================================
   1. GESTION DES COMPTES (COLLECTION: /users)
   Les comptes ayant accès au site (Instructeurs, Direction, Surveillance)
   ========================================================================= */

const USERS_COLLECTION = 'users';

// Seed initial primary admin if collection is empty or admin missing
export async function seedInitialAdmin(): Promise<void> {
  try {
    const adminDocRef = doc(db, USERS_COLLECTION, PRIMARY_ADMIN_USER.id);
    const snap = await getDoc(adminDocRef);
    if (!snap.exists()) {
      const initialAdminData: StaffMember = {
        id: PRIMARY_ADMIN_USER.id,
        email: PRIMARY_ADMIN_EMAIL,
        password: PRIMARY_ADMIN_PASSWORD,
        ninjaName: PRIMARY_ADMIN_USER.ninjaName,
        avatar: PRIMARY_ADMIN_USER.avatar,
        role: PRIMARY_ADMIN_USER.role,
        ninjaRank: PRIMARY_ADMIN_USER.ninjaRank,
        posts: PRIMARY_ADMIN_USER.posts,
        status: 'actif',
        joinedDate: 'An 64 - Fondateur',
        assignedCasesCount: 0,
        contactNote: 'Administrateur Principal & Direction de l\'Académie',
        isPrimaryAdmin: true,
        discordTag: PRIMARY_ADMIN_USER.discordTag
      };
      await setDoc(adminDocRef, initialAdminData);
    }
  } catch (err) {
    console.error('Erreur lors de l\'initialisation de l\'admin Firestore:', err);
  }
}

// Fetch all staff accounts from Firestore
export async function fetchUsersFromDb(): Promise<StaffMember[]> {
  try {
    const querySnapshot = await getDocs(collection(db, USERS_COLLECTION));
    const list: StaffMember[] = [];
    querySnapshot.forEach((d) => {
      list.push(d.data() as StaffMember);
    });
    return list;
  } catch (err) {
    console.error('Erreur fetch users Firestore:', err);
    return [];
  }
}

// Subscribe to real-time updates for accounts
export function subscribeToUsers(callback: (users: StaffMember[]) => void) {
  return onSnapshot(collection(db, USERS_COLLECTION), (snap) => {
    const list: StaffMember[] = [];
    snap.forEach((d) => {
      list.push(d.data() as StaffMember);
    });
    callback(list);
  }, (err) => {
    console.warn('Realtime users error:', err);
  });
}

// Save or add an account to Firestore
export async function saveUserToDb(user: StaffMember): Promise<void> {
  const userDocRef = doc(db, USERS_COLLECTION, user.id);
  await setDoc(userDocRef, user, { merge: true });
}

// Update an account in Firestore
export async function updateUserInDb(userId: string, updates: Partial<StaffMember>): Promise<void> {
  const userDocRef = doc(db, USERS_COLLECTION, userId);
  await updateDoc(userDocRef, updates);
}

// Delete an account from Firestore
export async function deleteUserFromDb(userId: string): Promise<void> {
  const userDocRef = doc(db, USERS_COLLECTION, userId);
  await deleteDoc(userDocRef);
}

/* =========================================================================
   2. GESTION DES SANCTIONS & RAPPORTS (COLLECTION: /sanctions)
   ========================================================================= */

const SANCTIONS_COLLECTION = 'sanctions';

// Fetch all sanctions from Firestore
export async function fetchSanctionsFromDb(): Promise<DisciplinaryLog[]> {
  try {
    const querySnapshot = await getDocs(collection(db, SANCTIONS_COLLECTION));
    const list: DisciplinaryLog[] = [];
    querySnapshot.forEach((d) => {
      list.push(d.data() as DisciplinaryLog);
    });
    return list;
  } catch (err) {
    console.error('Erreur fetch sanctions Firestore:', err);
    return [];
  }
}

// Subscribe to real-time updates for sanctions
export function subscribeToSanctions(callback: (sanctions: DisciplinaryLog[]) => void) {
  return onSnapshot(collection(db, SANCTIONS_COLLECTION), (snap) => {
    const list: DisciplinaryLog[] = [];
    snap.forEach((d) => {
      list.push(d.data() as DisciplinaryLog);
    });
    // Sort latest first
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(list);
  }, (err) => {
    console.warn('Realtime sanctions error:', err);
  });
}

// Add a sanction and automatically sync the student to /students collection
export async function addSanctionToDb(log: DisciplinaryLog): Promise<void> {
  const logDocRef = doc(db, SANCTIONS_COLLECTION, log.id);
  await setDoc(logDocRef, log);

  // Sync to /students collection
  await syncStudentRecord(log);
}

// Update a sanction and sync student
export async function updateSanctionInDb(id: string, updates: Partial<DisciplinaryLog>): Promise<void> {
  const logDocRef = doc(db, SANCTIONS_COLLECTION, id);
  await updateDoc(logDocRef, updates);

  // Re-fetch all logs for that student to update their summary
  const snap = await getDoc(logDocRef);
  if (snap.exists()) {
    const fullLog = snap.data() as DisciplinaryLog;
    await syncStudentRecord(fullLog);
  }
}

// Delete a sanction from Firestore
export async function deleteSanctionFromDb(id: string): Promise<void> {
  const logDocRef = doc(db, SANCTIONS_COLLECTION, id);
  const snap = await getDoc(logDocRef);
  let studentName = '';
  if (snap.exists()) {
    studentName = snap.data()?.studentName;
  }

  await deleteDoc(logDocRef);

  if (studentName) {
    await recalculateStudent(studentName);
  }
}

// Clear all sanctions and all students from Firestore
export async function clearAllSanctionsAndStudentsFromDb(): Promise<void> {
  const batch = writeBatch(db);

  // Delete all sanctions
  const sanctionsSnap = await getDocs(collection(db, SANCTIONS_COLLECTION));
  sanctionsSnap.forEach((d) => {
    batch.delete(d.ref);
  });

  // Delete all students
  const studentsSnap = await getDocs(collection(db, STUDENTS_COLLECTION));
  studentsSnap.forEach((d) => {
    batch.delete(d.ref);
  });

  await batch.commit();
}

/* =========================================================================
   3. GESTION DES ÉLÈVES (COLLECTION: /students)
   Liste d'élèves automatiquement enregistrée et mise à jour lors d'une sanction
   ========================================================================= */

const STUDENTS_COLLECTION = 'students';

function getStudentDocId(name: string, reg: string): string {
  const clean = (name + '-' + reg).toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 80);
  return clean || 'student-' + Date.now();
}

// Fetch all students from Firestore
export async function fetchStudentsFromDb(): Promise<StudentRecord[]> {
  try {
    const querySnapshot = await getDocs(collection(db, STUDENTS_COLLECTION));
    const list: StudentRecord[] = [];
    querySnapshot.forEach((d) => {
      list.push(d.data() as StudentRecord);
    });
    return list;
  } catch (err) {
    console.error('Erreur fetch students Firestore:', err);
    return [];
  }
}

// Subscribe to real-time updates for students
export function subscribeToStudents(callback: (students: StudentRecord[]) => void) {
  return onSnapshot(collection(db, STUDENTS_COLLECTION), (snap) => {
    const list: StudentRecord[] = [];
    snap.forEach((d) => {
      list.push(d.data() as StudentRecord);
    });
    callback(list);
  }, (err) => {
    console.warn('Realtime students error:', err);
  });
}

// Update a student record (photo, age, notes, chakra nature, mentor, etc.) in Firestore
export async function updateStudentInDb(studentId: string, updates: Partial<StudentRecord>): Promise<void> {
  try {
    const studentDocRef = doc(db, STUDENTS_COLLECTION, studentId);
    await setDoc(studentDocRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error('Erreur updateStudentInDb:', err);
    throw err;
  }
}

// Sync student record when a sanction is added/modified
export async function syncStudentRecord(log: DisciplinaryLog): Promise<void> {
  try {
    const studentId = getStudentDocId(log.studentName, log.studentRegistrationNumber);
    const studentDocRef = doc(db, STUDENTS_COLLECTION, studentId);
    
    // Check existing student document to preserve imported photo and filled notes
    const existingSnap = await getDoc(studentDocRef);
    const existingData = existingSnap.exists() ? (existingSnap.data() as StudentRecord) : undefined;

    // Fetch all existing sanctions for this student to calculate exact aggregates
    const sanctionsSnap = await getDocs(collection(db, SANCTIONS_COLLECTION));
    const studentSanctions: DisciplinaryLog[] = [];
    sanctionsSnap.forEach((d) => {
      const data = d.data() as DisciplinaryLog;
      if (data.studentName.toLowerCase().trim() === log.studentName.toLowerCase().trim()) {
        studentSanctions.push(data);
      }
    });

    // If log was just created and not in query yet
    if (!studentSanctions.some(s => s.id === log.id)) {
      studentSanctions.push(log);
    }

    const rankWeights: Record<string, number> = {
      'Rang S': 5,
      'Rang A': 4,
      'Rang B': 3,
      'Rang C': 2,
      'Rang D': 1
    };

    let highestGravity = log.gravity;
    let activeSanctionsCount = 0;
    let hasExamBan = false;
    let examBanDuration = '';
    let examBanReductionTask = '';
    let examBanEndDateIRL = '';
    let activeSanctionPeriodText = '';
    let latestDate = log.konohaDate;

    studentSanctions.forEach(s => {
      if ((rankWeights[s.gravity] || 0) > (rankWeights[highestGravity] || 0)) {
        highestGravity = s.gravity;
      }
      if (s.status === 'en_cours' || s.status === 'sanctionne') {
        activeSanctionsCount += 1;
        if (s.sanctionPeriodText) {
          activeSanctionPeriodText = s.sanctionPeriodText;
        }
      }
      if (s.examBan?.enabled) {
        hasExamBan = true;
        examBanDuration = s.examBan.duration;
        examBanReductionTask = s.examBan.reductionTask || '';
        if (s.examBan.endDateIRL) {
          examBanEndDateIRL = s.examBan.endDateIRL;
        }
      }
    });

    const studentRecord: StudentRecord = {
      id: studentId,
      name: log.studentName,
      clan: log.studentClan,
      class: log.studentClass,
      registrationNumber: log.studentRegistrationNumber,
      avatar: existingData?.avatar || existingData?.photoUrl || undefined,
      photoUrl: existingData?.photoUrl || existingData?.avatar || undefined,
      age: existingData?.age || undefined,
      chakraNature: existingData?.chakraNature || undefined,
      mentor: existingData?.mentor || undefined,
      guardianName: existingData?.guardianName || undefined,
      guardianContact: existingData?.guardianContact || undefined,
      disciplinaryNotes: existingData?.disciplinaryNotes || undefined,
      totalInfractions: studentSanctions.length,
      activeSanctions: activeSanctionsCount,
      remainingHours: 0,
      highestGravity,
      hasExamBan,
      examBanDuration: hasExamBan ? examBanDuration : undefined,
      examBanReductionTask: hasExamBan ? examBanReductionTask : undefined,
      examBanEndDateIRL: hasExamBan ? examBanEndDateIRL : undefined,
      activeSanctionPeriodText: activeSanctionPeriodText || undefined,
      lastInfractionDate: latestDate,
      createdAt: existingData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(studentDocRef, studentRecord, { merge: true });
  } catch (err) {
    console.error('Erreur syncStudentRecord:', err);
  }
}

// Recalculate student after a sanction is deleted
async function recalculateStudent(studentName: string): Promise<void> {
  try {
    const sanctionsSnap = await getDocs(collection(db, SANCTIONS_COLLECTION));
    const remainingForStudent: DisciplinaryLog[] = [];
    sanctionsSnap.forEach((d) => {
      const data = d.data() as DisciplinaryLog;
      if (data.studentName.toLowerCase().trim() === studentName.toLowerCase().trim()) {
        remainingForStudent.push(data);
      }
    });

    if (remainingForStudent.length === 0) {
      // Remove student document if no more infractions exist
      const studentsSnap = await getDocs(collection(db, STUDENTS_COLLECTION));
      studentsSnap.forEach((d) => {
        const student = d.data() as StudentRecord;
        if (student.name.toLowerCase().trim() === studentName.toLowerCase().trim()) {
          deleteDoc(d.ref);
        }
      });
    } else {
      // Re-sync with first remaining log
      await syncStudentRecord(remainingForStudent[0]);
    }
  } catch (err) {
    console.error('Erreur recalculateStudent:', err);
  }
}

/* =========================================================================
   4. CONFIGURATION DES POSTES DE L'ACADÉMIE (COLLECTION: /academy_config)
   ========================================================================= */

const CONFIG_COLLECTION = 'academy_config';
const POSTS_DOC_ID = 'posts';

export async function saveAcademyPostsToDb(posts: string[]): Promise<void> {
  try {
    await setDoc(doc(db, CONFIG_COLLECTION, POSTS_DOC_ID), {
      posts,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Erreur saveAcademyPostsToDb:', err);
  }
}

export function subscribeToAcademyPosts(callback: (posts: string[]) => void) {
  return onSnapshot(doc(db, CONFIG_COLLECTION, POSTS_DOC_ID), (snap) => {
    if (snap.exists() && snap.data()?.posts && Array.isArray(snap.data()?.posts)) {
      callback(snap.data().posts);
    } else {
      callback(DEFAULT_ACADEMY_POSTS);
    }
  }, (err) => {
    console.warn('Realtime academy posts error:', err);
    callback(DEFAULT_ACADEMY_POSTS);
  });
}

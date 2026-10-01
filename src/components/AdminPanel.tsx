import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StaffMember, UserRole, NinjaRank, AuditLog } from '../types';
import { SHINOBI_RANKS } from '../data/mockData';
import { 
  Users, 
  ShieldAlert, 
  Settings, 
  FileText, 
  History, 
  Plus, 
  UserCheck, 
  UserX, 
  Lock, 
  AlertTriangle, 
  Check, 
  Trash2, 
  Edit2, 
  Eye, 
  EyeOff,
  KeyRound,
  X,
  Power,
  Shield,
  Star,
  Briefcase,
  Minus,
  Sparkles,
  Award
} from 'lucide-react';
import { KonohaLeafIcon, GoogleIcon, GmailIcon, FuinjutsuKekkaiSeal, DisciplinarySealStamp } from './KonohaIcons';

export const AdminPanel: React.FC = () => {
  const { 
    currentUser, 
    primaryAdminEmail,
    canAccessAdmin, 
    staff, 
    addStaffMember, 
    updateStaffMember, 
    removeStaffMember, 
    academyPosts,
    addAcademyPost,
    removeAcademyPost,
    addPostToStaffMember,
    removePostFromStaffMember,
    systemSettings, 
    updateSystemSettings, 
    auditLogs,
    documents,
    logs,
    resetStudentDatabase
  } = useApp();

  const [activeAdminTab, setActiveAdminTab] = useState<'personnel' | 'postes' | 'maintenance' | 'audit' | 'overview'>('personnel');

  // Staff modal state
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [editingStaffMember, setEditingStaffMember] = useState<StaffMember | null>(null);

  // New Staff form state
  const [newEmail, setNewEmail] = useState('');
  const [newNinjaName, setNewNinjaName] = useState('');
  const [newNinjaRank, setNewNinjaRank] = useState<NinjaRank>('Chunin');
  const [newRole, setNewRole] = useState<UserRole>('instructeur_chunin');
  const [newSelectedPosts, setNewSelectedPosts] = useState<string[]>(['Membre Disciplinaire']);
  const [newPassword, setNewPassword] = useState('1234admin');
  const [newNote, setNewNote] = useState('');
  const [newAvatar, setNewAvatar] = useState('');
  const [formError, setFormError] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Dedicated Password modification modal state
  const [passwordModalMember, setPasswordModalMember] = useState<StaffMember | null>(null);
  const [userNewPassword, setUserNewPassword] = useState('');
  const [userConfirmPassword, setUserConfirmPassword] = useState('');
  const [showUserPassword, setShowUserPassword] = useState(false);
  const [passwordModalError, setPasswordModalError] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Quick post assignment dropdown for a staff row
  const [quickAddPostStaffId, setQuickAddPostStaffId] = useState<string | null>(null);

  // In-app confirmation dialog (replaces window.confirm/alert)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    isDangerous?: boolean;
    onConfirm: () => void;
  } | null>(null);

  // In-app notification toast
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // New academy post creation state
  const [customPostName, setCustomPostName] = useState('');
  const [postFeedback, setPostFeedback] = useState('');

  // Maintenance form state
  const [tempMaintenanceReason, setTempMaintenanceReason] = useState(systemSettings.maintenanceReason);
  const [tempReopenTime, setTempReopenTime] = useState(systemSettings.maintenanceEstimatedReopen);
  const [maintenanceSavedFeedback, setMaintenanceSavedFeedback] = useState(false);

  // Audit filter state
  const [auditFilter, setAuditFilter] = useState<string>('all');

  // If user is not authorized, block with authentic Konoha Security denial
  if (!canAccessAdmin) {
    return (
      <div className="py-16 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-full bg-red-950/80 border border-red-800 flex items-center justify-center text-red-500 mx-auto mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="font-cinzel text-2xl font-bold text-neutral-100 uppercase tracking-wide">
          Accès Refusé · Sceau Kekkai Actif
        </h2>
        <p className="text-sm text-neutral-400 mt-2 leading-relaxed">
          Le Panel d'Administration est formellement restreint à la <strong className="text-red-400">Direction de l'Académie</strong>, aux <strong className="text-red-400">Responsables & Co-Responsables</strong> et aux administrateurs autorisés.
        </p>
        <div className="mt-4 p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-400">
          Votre compte : <span className="text-neutral-200 font-semibold">{currentUser?.email}</span> ({currentUser?.ninjaRank || 'Visiteur'})
          {currentUser?.posts && currentUser.posts.length > 0 && (
            <div className="mt-1 text-neutral-300">
              Postes actuels : {currentUser.posts.join(', ')}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Handle Staff Save
  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = newEmail.trim().toLowerCase();
    const cleanName = newNinjaName.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setFormError('Veuillez saisir une adresse email valide.');
      return;
    }
    if (!cleanName) {
      setFormError('Veuillez renseigner le nom Shinobi du personnage.');
      return;
    }
    if (newSelectedPosts.length === 0) {
      setFormError('Veuillez attribuer au moins un poste au sein de l\'Académie.');
      return;
    }

    setFormError('');

    if (editingStaffMember) {
      const isTargetPrimary = editingStaffMember.isPrimaryAdmin || editingStaffMember.email.toLowerCase() === primaryAdminEmail.toLowerCase();

      const updates: Partial<StaffMember> = {
        email: isTargetPrimary ? primaryAdminEmail : cleanEmail,
        ninjaName: cleanName,
        ninjaRank: newNinjaRank,
        posts: newSelectedPosts,
        role: isTargetPrimary ? 'direction' : newRole,
        contactNote: newNote.trim() || undefined,
        avatar: newAvatar.trim() || editingStaffMember.avatar
      };

      if (newPassword.trim()) {
        if (newPassword.trim().length < 4) {
          setFormError('Le nouveau mot de passe doit comporter au moins 4 caractères.');
          return;
        }
        updates.password = newPassword.trim();
      }

      updateStaffMember(editingStaffMember.id, updates);
      setNotification({
        type: 'success',
        message: `L'officier ${cleanName} a été mis à jour avec succès.${newPassword.trim() ? ' Mot de passe modifié.' : ''}`
      });
    } else {
      // Check for duplicate email
      if (staff.some(s => s.email.toLowerCase() === cleanEmail)) {
        setFormError('Un officier avec cette adresse email existe déjà.');
        return;
      }

      if (!newPassword.trim() || newPassword.trim().length < 4) {
        setFormError('Le mot de passe initial doit comporter au moins 4 caractères.');
        return;
      }

      addStaffMember({
        email: cleanEmail,
        password: newPassword.trim(),
        ninjaName: cleanName,
        ninjaRank: newNinjaRank,
        posts: newSelectedPosts,
        role: newRole,
        status: 'actif',
        joinedDate: 'An 64 - Promotion Active',
        contactNote: newNote.trim() || 'Affectation standard du bureau',
        avatar: newAvatar.trim() || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        isPrimaryAdmin: false
      });
      setNotification({
        type: 'success',
        message: `L'officier ${cleanName} (${cleanEmail}) a été créé avec succès en base de données.`
      });
    }

    setIsAddStaffModalOpen(false);
    setEditingStaffMember(null);
  };

  const handleOpenEditStaff = (member: StaffMember) => {
    setEditingStaffMember(member);
    setNewEmail(member.email);
    setNewNinjaName(member.ninjaName);
    setNewNinjaRank(member.ninjaRank);
    setNewRole(member.role);
    setNewSelectedPosts(member.posts && member.posts.length > 0 ? member.posts : ['Membre Disciplinaire']);
    setNewPassword('');
    setShowEditPassword(false);
    setNewNote(member.contactNote || '');
    setNewAvatar(member.avatar);
    setFormError('');
    setIsAddStaffModalOpen(true);
  };

  // Dedicated Password Modal Handlers
  const handleOpenPasswordModal = (member: StaffMember) => {
    setPasswordModalMember(member);
    setUserNewPassword('');
    setUserConfirmPassword('');
    setShowUserPassword(false);
    setPasswordModalError('');
  };

  const handleSaveUserPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalMember) return;

    const cleanPass = userNewPassword.trim();
    if (!cleanPass || cleanPass.length < 4) {
      setPasswordModalError('Le mot de passe doit comporter au moins 4 caractères.');
      return;
    }

    if (cleanPass !== userConfirmPassword.trim()) {
      setPasswordModalError('Les deux mots de passe saisis ne correspondent pas.');
      return;
    }

    setIsSavingPassword(true);
    setPasswordModalError('');

    try {
      await updateStaffMember(passwordModalMember.id, {
        password: cleanPass
      });

      setNotification({
        type: 'success',
        message: `Le mot de passe de ${passwordModalMember.ninjaName} (${passwordModalMember.email}) a été modifié avec succès dans la base de données.`
      });

      setPasswordModalMember(null);
    } catch {
      setPasswordModalError('Une erreur est survenue lors de la mise à jour du mot de passe.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleRemoveStaff = (member: StaffMember) => {
    if (member.isPrimaryAdmin || member.email.toLowerCase() === primaryAdminEmail.toLowerCase()) {
      setNotification({
        type: 'error',
        message: "Action interdite : Le compte de l'administrateur principal est protégé et inviolable."
      });
      setTimeout(() => setNotification(null), 4000);
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: "Révoquer l'accès d'un Officier",
      message: `Êtes-vous sûr de vouloir révoquer l'accès de l'officier ${member.ninjaName} (${member.email}) ? Cette action sera consignée au Registre d'Audit.`,
      confirmText: "Révoquer l'officier",
      isDangerous: true,
      onConfirm: () => {
        removeStaffMember(member.id);
        setConfirmDialog(null);
        setNotification({
          type: 'success',
          message: `L'officier ${member.ninjaName} a été révoqué avec succès.`
        });
        setTimeout(() => setNotification(null), 3500);
      }
    });
  };

  // Handle Maintenance Toggle & Update
  const handleToggleMaintenance = () => {
    const nextState = !systemSettings.maintenanceMode;
    updateSystemSettings({
      maintenanceMode: nextState,
      maintenanceReason: tempMaintenanceReason.trim() || systemSettings.maintenanceReason,
      maintenanceEstimatedReopen: tempReopenTime.trim() || systemSettings.maintenanceEstimatedReopen,
      maintenanceActivatedBy: currentUser?.ninjaName || 'Administration'
    });
  };

  const handleSaveMaintenanceSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSystemSettings({
      maintenanceReason: tempMaintenanceReason.trim() || systemSettings.maintenanceReason,
      maintenanceEstimatedReopen: tempReopenTime.trim() || systemSettings.maintenanceEstimatedReopen
    });
    setMaintenanceSavedFeedback(true);
    setTimeout(() => setMaintenanceSavedFeedback(false), 2500);
  };

  // Add custom Academy Post (+)
  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customPostName.trim();
    if (!clean) return;
    if (academyPosts.includes(clean)) {
      setPostFeedback('Ce poste existe déjà dans le registre de l\'Académie.');
      return;
    }
    addAcademyPost(clean);
    setCustomPostName('');
    setPostFeedback(`Poste "${clean}" ajouté avec succès (+)`);
    setTimeout(() => setPostFeedback(''), 3000);
  };

  // Delete Academy Post (-)
  const handleDeletePost = (postName: string) => {
    const assignedCount = staff.filter(s => (s.posts || []).includes(postName)).length;
    let message = `Retirer définitivement le poste "${postName}" de l'Académie ?`;
    if (assignedCount > 0) {
      message += ` Attention : ce poste est actuellement assigné à ${assignedCount} officier(s) dont l'affectation sera automatiquement retirée.`;
    }

    setConfirmDialog({
      isOpen: true,
      title: "Supprimer un Poste de l'Académie (-)",
      message,
      confirmText: "Supprimer le poste (-)",
      isDangerous: true,
      onConfirm: () => {
        removeAcademyPost(postName);
        setConfirmDialog(null);
        setNotification({
          type: 'success',
          message: `Le poste "${postName}" a été retiré de l'Académie.`
        });
        setTimeout(() => setNotification(null), 3000);
      }
    });
  };

  // Filtered Audit logs
  const filteredAuditLogs = auditLogs.filter(log => {
    if (auditFilter === 'all') return true;
    return log.actionType === auditFilter;
  });

  // Post category style helper
  const getPostBadgeColor = (postName: string) => {
    const low = postName.toLowerCase();
    if (low === 'directeur' || low === 'directeur adjoint') {
      return 'bg-red-950 text-red-300 border-red-800';
    }
    if (low.startsWith('responsable ')) {
      return 'bg-amber-950/80 text-amber-300 border-amber-800';
    }
    if (low.startsWith('co-responsable ')) {
      return 'bg-orange-950/80 text-orange-300 border-orange-800';
    }
    if (low.includes('disciplinaire')) {
      return 'bg-rose-950/60 text-rose-300 border-rose-800/60';
    }
    if (low.includes('examinateur')) {
      return 'bg-purple-950/60 text-purple-300 border-purple-800/60';
    }
    if (low.includes('professeur')) {
      return 'bg-blue-950/60 text-blue-300 border-blue-800/60';
    }
    if (low.includes('coordinat')) {
      return 'bg-teal-950/60 text-teal-300 border-teal-800/60';
    }
    return 'bg-neutral-800 text-neutral-300 border-neutral-700';
  };

  const renderPostCard = (postName: string) => {
    const assignedOfficers = staff.filter(s => (s.posts || []).includes(postName));
    const isLeadership = postName === 'Directeur' || 
                         postName === 'Directeur Adjoint' || 
                         postName.startsWith('Responsable ') || 
                         postName.startsWith('Co-Responsable ');

    return (
      <div
        key={postName}
        className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition-colors flex items-center justify-between group"
      >
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-1.5">
            <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${
              postName === 'Directeur' || postName === 'Directeur Adjoint' ? 'bg-red-500' :
              postName.startsWith('Responsable ') ? 'bg-amber-500' :
              postName.startsWith('Co-Responsable ') ? 'bg-orange-500' :
              'bg-emerald-500'
            }`} />
            <span className="font-semibold text-xs sm:text-sm text-neutral-100 truncate">
              {postName}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] font-mono text-neutral-400">
              {assignedOfficers.length} titulaire(s)
            </span>
            {isLeadership && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-800 font-mono">
                Admin
              </span>
            )}
            {assignedOfficers.length > 0 && (
              <span className="text-[10px] text-neutral-500 truncate max-w-[120px]">
                ({assignedOfficers.map(o => o.ninjaName).slice(0, 2).join(', ')}{assignedOfficers.length > 2 ? '...' : ''})
              </span>
            )}
          </div>
        </div>

        {/* Remove post button (-) */}
        <button
          onClick={() => handleDeletePost(postName)}
          title={`Retirer le poste "${postName}" de l'Académie (-)`}
          className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-neutral-900 rounded transition-colors shrink-0 cursor-pointer flex items-center gap-1"
        >
          <Minus className="w-3.5 h-3.5" />
          <span className="text-[10px] hidden group-hover:inline">Retirer (-)</span>
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Administrative Clearance */}
      <div className="bg-gradient-to-r from-neutral-900 via-red-950/30 to-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
          <DisciplinarySealStamp size="lg" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 relative">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-950/80 border border-red-800 flex items-center justify-center text-red-500 shadow-inner">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-cinzel text-xl sm:text-2xl font-bold text-neutral-100 tracking-wide uppercase">
                  Panel d'Administration
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-800 font-semibold uppercase">
                  Niveau Direction & Responsables
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Gestion des postes d'académie (+/-), contrôle du personnel shinobi, barrière Kekkai et traçabilité globale.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-neutral-400 block">Opérateur connecté :</span>
              <div className="flex items-center gap-1.5 justify-end">
                <span className="text-xs font-bold text-neutral-200">{currentUser?.ninjaName}</span>
                {currentUser?.email.toLowerCase() === primaryAdminEmail.toLowerCase() && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 font-mono font-semibold">
                    Admin Principal
                  </span>
                )}
              </div>
              <span className="text-[11px] text-neutral-500 font-mono block">
                {currentUser?.email}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-800 text-xs sm:text-sm overflow-x-auto pb-px">
        <button
          onClick={() => setActiveAdminTab('personnel')}
          className={`px-4 py-2.5 rounded-t-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeAdminTab === 'personnel'
              ? 'bg-neutral-900 text-neutral-100 border-t-2 border-red-500 font-semibold'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50'
          }`}
        >
          <Users className="w-4 h-4 text-neutral-400" />
          <span>Gestion du Personnel ({staff.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('postes')}
          className={`px-4 py-2.5 rounded-t-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeAdminTab === 'postes'
              ? 'bg-neutral-900 text-neutral-100 border-t-2 border-red-500 font-semibold'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50'
          }`}
        >
          <Briefcase className="w-4 h-4 text-neutral-400" />
          <span>Postes de l'Académie ({academyPosts.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('maintenance')}
          className={`px-4 py-2.5 rounded-t-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeAdminTab === 'maintenance'
              ? 'bg-neutral-900 text-neutral-100 border-t-2 border-red-500 font-semibold'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50'
          }`}
        >
          <Power className={`w-4 h-4 ${systemSettings.maintenanceMode ? 'text-red-500 animate-pulse' : 'text-neutral-400'}`} />
          <span>Mode Maintenance & Kekkai {systemSettings.maintenanceMode && <span className="text-[10px] text-red-400">(Actif)</span>}</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('audit')}
          className={`px-4 py-2.5 rounded-t-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeAdminTab === 'audit'
              ? 'bg-neutral-900 text-neutral-100 border-t-2 border-red-500 font-semibold'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50'
          }`}
        >
          <History className="w-4 h-4 text-neutral-400" />
          <span>Journal d'Audit Global ({auditLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('overview')}
          className={`px-4 py-2.5 rounded-t-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeAdminTab === 'overview'
              ? 'bg-neutral-900 text-neutral-100 border-t-2 border-red-500 font-semibold'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50'
          }`}
        >
          <Eye className="w-4 h-4 text-neutral-400" />
          <span>Vue d'Ensemble</span>
        </button>
      </div>

      {/* TAB 1: GESTION DU PERSONNEL */}
      {activeAdminTab === 'personnel' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-neutral-200 uppercase font-cinzel tracking-wider">
                Membres Accrédités du Bureau & Enseignants
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Affectez ou retirez des postes avec les boutons <strong className="text-emerald-400">+</strong> et <strong className="text-red-400">-</strong> pour chaque officier
              </p>
            </div>

            <button
              onClick={() => {
                setEditingStaffMember(null);
                setNewEmail('');
                setNewNinjaName('');
                setNewNinjaRank('Chunin');
                setNewRole('instructeur_chunin');
                setNewSelectedPosts(['Membre Disciplinaire']);
                setNewNote('');
                setNewAvatar('');
                setFormError('');
                setIsAddStaffModalOpen(true);
              }}
              className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-red-950/40 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Affecter un Nouvel Officier</span>
            </button>
          </div>

          {/* Staff Table */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-950/80 text-neutral-400 uppercase font-mono text-[10px] tracking-wider border-b border-neutral-800">
                  <tr>
                    <th className="py-3 px-4">Officier & Identité RP</th>
                    <th className="py-3 px-4">Compte Gmail</th>
                    <th className="py-3 px-4">Grade Shinobi (9 Rangs)</th>
                    <th className="py-3 px-4">Postes au sein de l'Académie (+ / -)</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-neutral-800/80">
                  {staff.map((member) => {
                    const isPrimary = member.isPrimaryAdmin || member.email.toLowerCase() === primaryAdminEmail.toLowerCase();
                    const memberPosts = member.posts && member.posts.length > 0 ? member.posts : ['Membre Disciplinaire'];
                    const unassignedPosts = academyPosts.filter(p => !memberPosts.includes(p));

                    return (
                      <tr 
                        key={member.id} 
                        className={`hover:bg-neutral-800/40 transition-colors ${
                          isPrimary ? 'bg-red-950/15' : ''
                        }`}
                      >
                        {/* Avatar & Name */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <img
                                src={member.avatar}
                                alt={member.ninjaName}
                                referrerPolicy="no-referrer"
                                className="w-9 h-9 rounded-full border border-neutral-700 object-cover"
                              />
                              {isPrimary && (
                                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-600 rounded-full border border-neutral-900 flex items-center justify-center text-[8px] text-white font-bold">
                                  ★
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-neutral-100 block">
                                  {member.ninjaName}
                                </span>
                                {isPrimary && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 font-mono font-semibold">
                                    Admin Principal
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-neutral-500 block">
                                {member.joinedDate}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-neutral-200">
                            <GmailIcon className="w-3.5 h-3.5 text-red-400 shrink-0" />
                            <span className="font-mono">{member.email}</span>
                          </div>
                          {member.contactNote && (
                            <span className="text-[10px] text-neutral-500 block mt-0.5 truncate max-w-[180px]">
                              {member.contactNote}
                            </span>
                          )}
                        </td>

                        {/* Shinobi Rank */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-950 border border-neutral-800 text-neutral-200 font-mono font-medium">
                            <Award className="w-3 h-3 text-red-400" />
                            <span>{member.ninjaRank}</span>
                          </span>
                        </td>

                        {/* Academy Posts (with + and -) */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap items-center gap-1.5 max-w-md">
                            {memberPosts.map((post) => (
                              <span
                                key={post}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${getPostBadgeColor(post)}`}
                              >
                                <span>{post}</span>
                                {(!isPrimary || memberPosts.length > 1) && (
                                  <button
                                    onClick={() => removePostFromStaffMember(member.id, post)}
                                    title={`Retirer le poste "${post}" (-) `}
                                    className="hover:text-red-400 ml-0.5 p-0.5 rounded hover:bg-black/40 transition-colors cursor-pointer"
                                  >
                                    <Minus className="w-2.5 h-2.5" />
                                  </button>
                                )}
                              </span>
                            ))}

                            {/* Quick Add Post Button (+) */}
                            <div className="relative inline-block">
                              <button
                                onClick={() => setQuickAddPostStaffId(quickAddPostStaffId === member.id ? null : member.id)}
                                title="Attribuer un poste supplémentaire (+)"
                                className="px-1.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded border border-neutral-700 text-[11px] font-bold flex items-center gap-0.5 cursor-pointer"
                              >
                                <Plus className="w-3 h-3 text-emerald-400" />
                                <span>Ajouter</span>
                              </button>

                              {/* Dropdown for quick post addition */}
                              {quickAddPostStaffId === member.id && (
                                <div className="absolute left-0 mt-1 w-56 bg-neutral-950 border border-neutral-700 rounded-lg shadow-2xl py-1 z-30 max-h-48 overflow-y-auto">
                                  <div className="px-2.5 py-1 text-[10px] font-mono text-neutral-500 uppercase border-b border-neutral-800">
                                    Choisir un poste à attribuer :
                                  </div>
                                  {unassignedPosts.length === 0 ? (
                                    <div className="px-3 py-2 text-[11px] text-neutral-500 italic">
                                      Tous les postes sont déjà assignés.
                                    </div>
                                  ) : (
                                    unassignedPosts.map((p) => (
                                      <button
                                        key={p}
                                        onClick={() => {
                                          addPostToStaffMember(member.id, p);
                                          setQuickAddPostStaffId(null);
                                        }}
                                        className="w-full text-left px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white flex items-center justify-between group"
                                      >
                                        <span className="truncate">{p}</span>
                                        <Plus className="w-3 h-3 text-emerald-400 opacity-0 group-hover:opacity-100" />
                                      </button>
                                    ))
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`text-[11px] font-medium flex items-center gap-1.5 ${
                            member.status === 'actif' ? 'text-emerald-400' :
                            member.status === 'en_mission' ? 'text-blue-400' :
                            'text-neutral-500'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              member.status === 'actif' ? 'bg-emerald-500' :
                              member.status === 'en_mission' ? 'bg-blue-500' :
                              'bg-neutral-500'
                            }`} />
                            {member.status === 'actif' ? 'Actif' :
                             member.status === 'en_mission' ? 'En mission' :
                             'Suspendu'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenPasswordModal(member)}
                              className="p-1.5 text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                              title={`Modifier le mot de passe de ${member.ninjaName}`}
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEditStaff(member)}
                              className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                              title="Modifier l'officier et ses postes"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {isPrimary ? (
                              <span 
                                title="Le compte administrateur principal est inviolable"
                                className="p-1.5 text-neutral-600 cursor-not-allowed"
                              >
                                <Lock className="w-3.5 h-3.5" />
                              </span>
                            ) : (
                              <button
                                onClick={() => handleRemoveStaff(member)}
                                className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                                title="Révoquer l'officier"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GESTION DES POSTES DE L'ACADÉMIE (+ / -) */}
      {activeAdminTab === 'postes' && (
        <div className="space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
              <div>
                <h3 className="font-cinzel text-lg font-bold text-neutral-100 uppercase tracking-wide flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-red-500" />
                  <span>Répertoire des Postes de l'Académie</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Créez de nouveaux postes avec le bouton <strong className="text-emerald-400">(+)</strong> ou supprimez des postes existants avec le bouton <strong className="text-red-400">(-)</strong>.
                  <br />
                  <span className="text-amber-400 font-medium">Règle de hiérarchie : Tous les Responsables sont égaux entre eux, et tous les Co-Responsables sont égaux entre eux.</span>
                </p>
              </div>

              {/* Form to add a new post with + */}
              <form onSubmit={handleCreatePost} className="flex items-center gap-2 w-full md:w-auto">
                <input
                  type="text"
                  value={customPostName}
                  onChange={e => setCustomPostName(e.target.value)}
                  placeholder="Nom du nouveau poste..."
                  className="px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs sm:text-sm text-neutral-100 focus:outline-none focus:border-red-600 min-w-[220px]"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter (+)</span>
                </button>
              </form>
            </div>

            {postFeedback && (
              <div className="mt-3 p-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-emerald-400">
                {postFeedback}
              </div>
            )}

            {/* List of all Academy Posts organized by poles */}
            <div className="mt-6 space-y-6">
              
              {/* Section 1: Direction de l'Académie */}
              <div>
                <div className="flex items-center gap-2 mb-2 pb-1 border-b border-neutral-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <h4 className="text-xs font-mono uppercase text-red-300 font-bold tracking-wider">
                    1. Direction de l'Académie (Commandement Suprême)
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {academyPosts
                    .filter(p => p === 'Directeur' || p === 'Directeur Adjoint')
                    .map(postName => renderPostCard(postName))}
                </div>
              </div>

              {/* Section 2: Pôle Responsables (Égaux entre eux) */}
              <div>
                <div className="flex items-center justify-between mb-2 pb-1 border-b border-neutral-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <h4 className="text-xs font-mono uppercase text-amber-300 font-bold tracking-wider">
                      2. Pôle des Responsables (Égalité stricte de rang & prérogatives)
                    </h4>
                  </div>
                  <span className="text-[10px] text-amber-400 font-mono">
                    Responsables égaux
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {academyPosts
                    .filter(p => p.startsWith('Responsable ') || (p.toLowerCase().includes('responsable') && !p.toLowerCase().includes('co-')))
                    .map(postName => renderPostCard(postName))}
                </div>
              </div>

              {/* Section 3: Pôle Co-Responsables (Égaux entre eux) */}
              <div>
                <div className="flex items-center justify-between mb-2 pb-1 border-b border-neutral-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                    <h4 className="text-xs font-mono uppercase text-orange-300 font-bold tracking-wider">
                      3. Pôle des Co-Responsables (Égalité stricte de rang & prérogatives)
                    </h4>
                  </div>
                  <span className="text-[10px] text-orange-400 font-mono">
                    Co-Resp égaux
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {academyPosts
                    .filter(p => p.startsWith('Co-Responsable ') || p.toLowerCase().includes('co-responsable'))
                    .map(postName => renderPostCard(postName))}
                </div>
              </div>

              {/* Section 4: Membres Disciplinaires & Corps Enseignant */}
              <div>
                <div className="flex items-center gap-2 mb-2 pb-1 border-b border-neutral-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <h4 className="text-xs font-mono uppercase text-emerald-300 font-bold tracking-wider">
                    4. Corps Opérationnel, Disciplinaire & Enseignement
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {academyPosts
                    .filter(p => {
                      const low = p.toLowerCase();
                      return !low.includes('directeur') && 
                             !low.includes('responsable') &&
                             [
                               'membre disciplinaire',
                               'membre en probation disciplinaire',
                               'examinateur',
                               'examinateur apprenti',
                               'professeur',
                               'professeur apprenti',
                               'coordinateur'
                             ].includes(low);
                    })
                    .map(postName => renderPostCard(postName))}
                </div>
              </div>

              {/* Section 5: Postes Additionnels Personnalisés */}
              {academyPosts.some(p => {
                const low = p.toLowerCase();
                const isKnown = low === 'directeur' || 
                                low === 'directeur adjoint' || 
                                low.includes('responsable') ||
                                [
                                  'membre disciplinaire',
                                  'membre en probation disciplinaire',
                                  'examinateur',
                                  'examinateur apprenti',
                                  'professeur',
                                  'professeur apprenti',
                                  'coordinateur'
                                ].includes(low);
                return !isKnown;
              }) && (
                <div>
                  <div className="flex items-center gap-2 mb-2 pb-1 border-b border-neutral-800">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    <h4 className="text-xs font-mono uppercase text-purple-300 font-bold tracking-wider">
                      5. Postes Personnalisés Additionnels
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {academyPosts
                      .filter(p => {
                        const low = p.toLowerCase();
                        return low !== 'directeur' && 
                               low !== 'directeur adjoint' && 
                               !low.includes('responsable') &&
                               ![
                                 'membre disciplinaire',
                                 'membre en probation disciplinaire',
                                 'examinateur',
                                 'examinateur apprenti',
                                 'professeur',
                                 'professeur apprenti',
                                 'coordinateur'
                               ].includes(low);
                      })
                      .map(postName => renderPostCard(postName))}
                  </div>
                </div>
              )}

            </div>

            {/* Explanatory note about equality */}
            <div className="mt-8 p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 text-xs text-neutral-400 space-y-2">
              <div className="flex items-center gap-2 text-neutral-200 font-semibold">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Principe d'Égalité des Responsables & Co-Responsables :</span>
              </div>
              <p className="leading-relaxed">
                • <strong>Pôle Responsables :</strong> Les postes de <em>Responsable Professeur</em>, <em>Responsable Examinateur</em>, <em>Responsable Disciplinaire</em> et <em>Responsable Coordination</em> disposent tous de prérogatives égales d'accès administratif et de supervision.
                <br />
                • <strong>Pôle Co-Responsables :</strong> Les postes de <em>Co-Responsable Professeur</em>, <em>Co-Responsable Examinateur</em>, <em>Co-Responsable Disciplinaire</em> et <em>Co-Responsable Coordination</em> sont également équivalents entre eux en termes d'accréditation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MODE MAINTENANCE & KEKKAI */}
      {activeAdminTab === 'maintenance' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Controls (Left 7 cols) */}
          <div className="lg:col-span-7 bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl space-y-6">
            
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-neutral-800">
              <div>
                <h3 className="font-cinzel text-lg font-bold text-neutral-100 uppercase tracking-wide">
                  Contrôle du Kekkai de Maintenance
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Verrouille l'accès au portail disciplinaire pour les non-administrateurs avec le sceau de protection des Cinq Éléments
                </p>
              </div>

              {/* Master Power Toggle Button */}
              <button
                onClick={handleToggleMaintenance}
                className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                  systemSettings.maintenanceMode
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-950/60'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                }`}
              >
                <Power className="w-4 h-4" />
                <span>{systemSettings.maintenanceMode ? 'Désactiver le Kekkai' : 'Activer la Maintenance'}</span>
              </button>
            </div>

            {/* Status indicator box */}
            <div className={`p-4 rounded-xl border flex items-center justify-between ${
              systemSettings.maintenanceMode 
                ? 'bg-red-950/40 border-red-800 text-red-200' 
                : 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  systemSettings.maintenanceMode ? 'bg-red-500 animate-ping' : 'bg-emerald-500'
                }`} />
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider block font-mono">
                    {systemSettings.maintenanceMode ? 'Barrière Kekkai Active · Accès Restreint' : 'Portail Ouvert · Tous Accrédités'}
                  </span>
                  <span className="text-[11px] text-neutral-400 block mt-0.5">
                    {systemSettings.maintenanceMode 
                      ? 'Les utilisateurs ordinaires sont redirigés vers l\'écran de scellement.' 
                      : 'L\'accès aux registres et dossiers d\'élèves fonctionne normalement.'}
                  </span>
                </div>
              </div>

              <span className="text-[11px] font-mono text-neutral-400">
                {systemSettings.maintenanceActivatedBy}
              </span>
            </div>

            {/* Customization Form */}
            <form onSubmit={handleSaveMaintenanceSettings} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Motif officiel de scellement (Affiché aux élèves et instructeurs) *
                </label>
                <textarea
                  rows={3}
                  value={tempMaintenanceReason}
                  onChange={e => setTempMaintenanceReason(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs sm:text-sm text-neutral-100 focus:outline-none focus:border-red-600"
                  placeholder="Ex: Archivage rituel des dossiers et renouvellement du sceau protecteur..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Délai ou message de réouverture estimé
                </label>
                <input
                  type="text"
                  value={tempReopenTime}
                  onChange={e => setTempReopenTime(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs sm:text-sm text-neutral-100 focus:outline-none focus:border-red-600"
                  placeholder="Ex: Réouverture estimée dans 45 minutes / après l'examen Chûnin."
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-emerald-400">
                  {maintenanceSavedFeedback && 'Paramètres de maintenance enregistrés avec succès !'}
                </span>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg transition-colors border border-neutral-700 cursor-pointer"
                >
                  Enregistrer les motifs
                </button>
              </div>
            </form>

          </div>

          {/* Real-time Preview (Right 5 cols) */}
          <div className="lg:col-span-5 bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-800">
              <Eye className="w-4 h-4 text-neutral-400" />
              <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider font-mono">
                Aperçu en Direct de l'Écran de Maintenance
              </span>
            </div>

            <div className="p-4 rounded-lg bg-neutral-950 border border-red-900/40 text-center relative overflow-hidden">
              <div className="flex justify-center mb-3">
                <FuinjutsuKekkaiSeal className="w-16 h-16 text-red-500" />
              </div>
              <h4 className="font-cinzel text-sm font-bold text-neutral-100 uppercase">
                Archives Sous Scellé
              </h4>
              <p className="text-[10px] text-red-400 font-semibold mt-0.5 uppercase tracking-wider">
                Barrière Fūinjutsu Active
              </p>

              <div className="mt-4 p-3 bg-neutral-900/90 rounded border border-neutral-800 text-left text-xs">
                <span className="text-[10px] font-mono uppercase text-neutral-500 block">
                  Motif
                </span>
                <p className="text-neutral-300 text-xs mt-0.5 leading-relaxed line-clamp-3">
                  {tempMaintenanceReason}
                </p>
                <div className="mt-2 text-[11px] text-amber-400 font-medium">
                  {tempReopenTime}
                </div>
              </div>
            </div>
          </div>

          {/* Base de Données des Élèves - Remise à zéro */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl col-span-1 lg:col-span-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-950/80 border border-red-800 flex items-center justify-center text-red-500 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-cinzel text-sm font-bold text-neutral-100 uppercase tracking-wide">
                    Base de Données & Registre des Élèves
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    Dossiers enregistrés actuellement : <strong className="text-neutral-200">{logs.length}</strong> rapport(s) disciplinaire(s).
                  </p>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Permet de vider intégralement la base de données et remettre le nombre d'élèves répertoriés à zéro (0).
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setConfirmDialog({
                    isOpen: true,
                    title: "Vider la base des élèves (Remise à zéro)",
                    message: `Confirmez-vous la purge totale de la base de données des élèves ? Les ${logs.length} rapport(s) disciplinaire(s) seront définitivement effacés et le registre sera remis à zéro.`,
                    confirmText: "Purger & Remettre à zéro",
                    isDangerous: true,
                    onConfirm: () => {
                      resetStudentDatabase();
                      setNotification({
                        type: 'success',
                        message: "L'ensemble des dossiers élèves a été purgé avec succès. La base est désormais à zéro (0 élève)."
                      });
                    }
                  });
                }}
                className="px-4 py-2 bg-red-600/90 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md shadow-red-950/40 cursor-pointer shrink-0"
              >
                <Trash2 className="w-4 h-4" />
                <span>Vider la base des élèves (0)</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* TAB 4: JOURNAL D'AUDIT GLOBAL */}
      {activeAdminTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-neutral-200 uppercase font-cinzel tracking-wider">
                Registre Immuable des Actions Disciplinaires
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Traçabilité des connexions, attributions de postes (+/-), sanctions et modifications
              </p>
            </div>

            {/* Filter by action type */}
            <select
              value={auditFilter}
              onChange={e => setAuditFilter(e.target.value)}
              className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none focus:border-red-600"
            >
              <option value="all">Toutes les actions</option>
              <option value="CREATION_RAPPORT">Création de Rapport</option>
              <option value="MODIFICATION_STATUT">Statuts & Connexions</option>
              <option value="GESTION_PERSONNEL">Gestion Personnel & Postes</option>
              <option value="MAINTENANCE_ACTIVE">Activation Maintenance</option>
              <option value="MAINTENANCE_DESACTIVE">Levée Maintenance</option>
              <option value="DOCUMENT_AJOUT">Ajout de Document</option>
              <option value="SUPPRESSION_RAPPORT">Suppression de Rapport</option>
            </select>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-950/80 text-neutral-400 uppercase font-mono text-[10px] tracking-wider border-b border-neutral-800">
                  <tr>
                    <th className="py-3 px-4">Horodatage Konoha</th>
                    <th className="py-3 px-4">Auteur Shinobi / Gmail</th>
                    <th className="py-3 px-4">Type d'Action</th>
                    <th className="py-3 px-4">Détails de l'Opération</th>
                    <th className="py-3 px-4 text-right">Réf. Cible</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-neutral-800/80">
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-neutral-500">
                        Aucun événement correspondant aux critères.
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-neutral-800/40 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-mono text-neutral-300 block">{log.konohaTime}</span>
                          <span className="text-[10px] text-neutral-500 font-mono block">
                            {new Date(log.timestamp).toLocaleDateString('fr-FR')}
                          </span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-semibold text-neutral-200 block">{log.actorNinjaName}</span>
                          <div className="flex items-center gap-1 text-[11px] text-neutral-500 font-mono">
                            <GmailIcon className="w-3 h-3 text-red-400" />
                            <span>{log.actorEmail || 'admin@zenkai.fr'}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-300">
                            {log.actionType}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-neutral-300 max-w-md">
                          {log.details}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap text-right font-mono text-neutral-500">
                          {log.targetRef || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: VUE D'ENSEMBLE & MÉTRIQUES */}
      {activeAdminTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
              <span className="text-[11px] font-mono uppercase text-neutral-500 block">Dossiers Disciplinaires</span>
              <span className="text-2xl font-bold text-neutral-100 font-cinzel mt-1 block">{logs.length}</span>
              <span className="text-xs text-neutral-400 mt-1 block">Registre actif</span>
            </div>

            <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
              <span className="text-[11px] font-mono uppercase text-neutral-500 block">Officiers Accrédités</span>
              <span className="text-2xl font-bold text-neutral-100 font-cinzel mt-1 block">{staff.length}</span>
              <span className="text-xs text-neutral-400 mt-1 block">Comptes Gmail configurés</span>
            </div>

            <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
              <span className="text-[11px] font-mono uppercase text-neutral-500 block">Postes Académiques</span>
              <span className="text-2xl font-bold text-neutral-100 font-cinzel mt-1 block">{academyPosts.length}</span>
              <span className="text-xs text-neutral-400 mt-1 block">Postes gérables (+ / -)</span>
            </div>

            <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
              <span className="text-[11px] font-mono uppercase text-neutral-500 block">État du Kekkai</span>
              <span className={`text-xl font-bold mt-1 block ${systemSettings.maintenanceMode ? 'text-red-400' : 'text-emerald-400'}`}>
                {systemSettings.maintenanceMode ? 'Maintenance Active' : 'Opérationnel'}
              </span>
              <span className="text-xs text-neutral-400 mt-1 block">Sécurité de l'Académie</span>
            </div>
          </div>

          <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl">
            <h3 className="font-cinzel text-base font-bold text-neutral-100 uppercase tracking-wide mb-2">
              Configuration de la Session Administrateur
            </h3>
            <div className="space-y-2 text-xs text-neutral-400">
              <p>• <strong>Compte Administrateur Principal :</strong> <span className="text-red-300 font-mono">{primaryAdminEmail}</span></p>
              <p>• <strong>Sceau d'Académie :</strong> <span className="font-mono">{systemSettings.academySealNumber}</span></p>
              <p>• <strong>Serveur :</strong> {systemSettings.serverName} ({systemSettings.villageName})</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT STAFF MEMBER */}
      {isAddStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
              <h2 className="font-cinzel text-base font-bold text-neutral-100 uppercase tracking-wide">
                {editingStaffMember ? 'Modifier les Postes & Prérogatives' : 'Affecter un Nouvel Officier'}
              </h2>
              <button
                onClick={() => setIsAddStaffModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-950/60 border border-red-800 rounded-lg text-xs text-red-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Adresse Google / Gmail *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                    <GmailIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    disabled={editingStaffMember?.isPrimaryAdmin || editingStaffMember?.email.toLowerCase() === primaryAdminEmail.toLowerCase()}
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="ex: instructeur@gmail.com"
                    className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-100 focus:outline-none focus:border-red-600 disabled:opacity-60"
                  />
                </div>
                {editingStaffMember?.isPrimaryAdmin && (
                  <span className="text-[11px] text-amber-400 mt-1 block">
                    L'adresse de l'administrateur principal ne peut pas être altérée.
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Nom Shinobi du personnage (RP) *
                </label>
                <input
                  type="text"
                  required
                  value={newNinjaName}
                  onChange={e => setNewNinjaName(e.target.value)}
                  placeholder="Ex: Shikaku Nara"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-100 focus:outline-none focus:border-red-600"
                />
              </div>

              {/* Password field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-neutral-300">
                    {editingStaffMember ? 'Nouveau mot de passe' : 'Mot de passe initial *'}
                  </label>
                  {editingStaffMember && (
                    <span className="text-[10px] text-neutral-500">Laisser vide pour ne pas modifier</span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    required={!editingStaffMember}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder={editingStaffMember ? "Conserver le mot de passe actuel..." : "Définir le mot de passe (min. 4 car.)"}
                    className="w-full px-3 py-2 pr-10 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-100 font-mono placeholder-neutral-600 focus:outline-none focus:border-red-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-200 cursor-pointer"
                    title={showEditPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Shinobi Rank (9 specified ranks) */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Grade Shinobi (9 Rangs Officiels) *
                </label>
                <select
                  value={newNinjaRank}
                  onChange={e => setNewNinjaRank(e.target.value as NinjaRank)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-100 focus:outline-none focus:border-red-600 font-mono"
                >
                  {SHINOBI_RANKS.map(rank => (
                    <option key={rank} value={rank}>{rank}</option>
                  ))}
                </select>
              </div>

              {/* Academy Posts Selector with + / - */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center justify-between">
                  <span>Postes au sein de l'Académie *</span>
                  <span className="text-[10px] text-neutral-500 font-normal">
                    Sélectionnez les postes occupés par cet officier
                  </span>
                </label>

                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg max-h-48 overflow-y-auto space-y-1.5">
                  {academyPosts.map(post => {
                    const isSelected = newSelectedPosts.includes(post);

                    return (
                      <div
                        key={post}
                        onClick={() => {
                          if (isSelected) {
                            setNewSelectedPosts(prev => prev.filter(p => p !== post));
                          } else {
                            setNewSelectedPosts(prev => [...prev, post]);
                          }
                        }}
                        className={`flex items-center justify-between p-2 rounded text-xs cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-neutral-800 text-neutral-100 border border-neutral-700'
                            : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[9px] ${
                            isSelected ? 'bg-red-600 border-red-500 text-white' : 'border-neutral-700'
                          }`}>
                            {isSelected && <Check className="w-2.5 h-2.5" />}
                          </div>
                          <span>{post}</span>
                        </div>

                        <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                          isSelected ? 'bg-red-950 text-red-300' : 'bg-neutral-900 text-neutral-500'
                        }`}>
                          {isSelected ? '(-) Retirer' : '(+) Assigner'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Affectation / Note interne
                </label>
                <input
                  type="text"
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  placeholder="Ex: Responsable des épreuves pratiques et de la logistique"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-100 focus:outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  URL Avatar Photo (Optionnel)
                </label>
                <input
                  type="url"
                  value={newAvatar}
                  onChange={e => setNewAvatar(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-100 focus:outline-none focus:border-red-600"
                />
              </div>

              <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddStaffModalOpen(false)}
                  className="px-4 py-2 text-xs text-neutral-400 hover:text-neutral-200 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-md cursor-pointer"
                >
                  Enregistrer l'officier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CHANGER LE MOT DE PASSE DE L'UTILISATEUR */}
      {passwordModalMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden my-8 animate-fadeIn">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-800/80 flex items-center justify-center text-amber-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-cinzel text-sm font-bold text-neutral-100 uppercase tracking-wide">
                    Modifier le Mot de Passe
                  </h3>
                  <span className="text-[11px] text-neutral-400 font-mono">
                    Accréditation Sécurisée · Base Firestore
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPasswordModalMember(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Identity Details */}
            <div className="p-4 bg-neutral-950/60 border-b border-neutral-800 flex items-center gap-3">
              <img
                src={passwordModalMember.avatar}
                alt={passwordModalMember.ninjaName}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full border border-neutral-700 object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-neutral-100 truncate">
                    {passwordModalMember.ninjaName}
                  </span>
                  {passwordModalMember.isPrimaryAdmin && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 font-mono font-semibold">
                      Admin Principal
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-mono mt-0.5 truncate">
                  <GmailIcon className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span className="truncate">{passwordModalMember.email}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveUserPassword} className="p-6 space-y-4">
              {passwordModalError && (
                <div className="p-3 bg-red-950/60 border border-red-800 rounded-lg text-xs text-red-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{passwordModalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Nouveau mot de passe <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showUserPassword ? 'text' : 'password'}
                    required
                    minLength={4}
                    value={userNewPassword}
                    onChange={e => {
                      setUserNewPassword(e.target.value);
                      if (passwordModalError) setPasswordModalError('');
                    }}
                    placeholder="Saisissez le nouveau mot de passe..."
                    className="w-full px-3 py-2 pr-10 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-100 font-mono placeholder-neutral-600 focus:outline-none focus:border-red-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowUserPassword(!showUserPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-200 cursor-pointer"
                    title={showUserPassword ? "Masquer" : "Afficher"}
                  >
                    {showUserPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[11px] text-neutral-500 mt-1 block">
                  Doit comporter au moins 4 caractères.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Confirmer le nouveau mot de passe <span className="text-red-500">*</span>
                </label>
                <input
                  type={showUserPassword ? 'text' : 'password'}
                  required
                  minLength={4}
                  value={userConfirmPassword}
                  onChange={e => {
                    setUserConfirmPassword(e.target.value);
                    if (passwordModalError) setPasswordModalError('');
                  }}
                  placeholder="Répétez le nouveau mot de passe..."
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-100 font-mono placeholder-neutral-600 focus:outline-none focus:border-red-600"
                />
              </div>

              <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPasswordModalMember(null)}
                  className="px-4 py-2 text-xs text-neutral-400 hover:text-neutral-200 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{isSavingPassword ? 'Enregistrement...' : 'Mettre à jour le mot de passe'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification Banner */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-bounce-subtle">
          <div className={`p-4 rounded-xl shadow-2xl border flex items-center justify-between gap-3 ${
            notification.type === 'error' ? 'bg-red-950 border-red-800 text-red-200' :
            notification.type === 'success' ? 'bg-emerald-950 border-emerald-800 text-emerald-200' :
            'bg-neutral-900 border-neutral-700 text-neutral-200'
          }`}>
            <span className="text-xs font-medium leading-relaxed">
              {notification.message}
            </span>
            <button
              onClick={() => setNotification(null)}
              className="text-xs opacity-60 hover:opacity-100 p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* In-app Confirmation Modal (replaces window.confirm/alert) */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-500">
              <div className="w-10 h-10 rounded-full bg-red-950 border border-red-800 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-base font-bold text-neutral-100 font-cinzel">
                {confirmDialog.title}
              </h3>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              {confirmDialog.message}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 text-xs text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors shadow-md cursor-pointer ${
                  confirmDialog.isDangerous
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {confirmDialog.confirmText || 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AcademyDocument } from '../types';
import { BookOpen, Plus, FileText, Lock, Calendar, Tag, ShieldCheck, Edit3, Trash2, X, Check } from 'lucide-react';
import { KonohaLeafIcon, DisciplinarySealStamp } from './KonohaIcons';

export const DocumentsView: React.FC = () => {
  const { documents, canAccessAdmin, addDocument, updateDocument, deleteDocument, currentUser } = useApp();

  const [selectedDocId, setSelectedDocId] = useState<string>(documents[0]?.id || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Modal for creating/editing document
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<AcademyDocument | null>(null);
  const [docToDelete, setDocToDelete] = useState<AcademyDocument | null>(null);

  // Form state
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState<AcademyDocument['category']>('reglement');
  const [docClearance, setDocClearance] = useState<AcademyDocument['clearanceRequired']>('tous_membres');
  const [docVersion, setDocVersion] = useState('v1.0');
  const [docSummary, setDocSummary] = useState('');
  const [docContent, setDocContent] = useState('');
  const [docTags, setDocTags] = useState('');

  const activeDoc = documents.find(d => d.id === selectedDocId) || documents[0];

  const filteredDocs = documents.filter(d => 
    selectedCategory === 'all' || d.category === selectedCategory
  );

  const handleOpenNewDoc = () => {
    setEditingDoc(null);
    setDocTitle('');
    setDocCategory('reglement');
    setDocClearance('tous_membres');
    setDocVersion('v1.0');
    setDocSummary('');
    setDocContent('');
    setDocTags('Académie, Discipline, Konoha');
    setIsEditorModalOpen(true);
  };

  const handleOpenEditDoc = (doc: AcademyDocument) => {
    setEditingDoc(doc);
    setDocTitle(doc.title);
    setDocCategory(doc.category);
    setDocClearance(doc.clearanceRequired);
    setDocVersion(doc.version);
    setDocSummary(doc.summary);
    setDocContent(doc.content);
    setDocTags(doc.tags.join(', '));
    setIsEditorModalOpen(true);
  };

  const handleSaveDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim() || !docContent.trim()) return;

    const tagsArray = docTags.split(',').map(t => t.trim()).filter(Boolean);

    if (editingDoc) {
      updateDocument(editingDoc.id, {
        title: docTitle.trim(),
        category: docCategory,
        clearanceRequired: docClearance,
        version: docVersion.trim(),
        summary: docSummary.trim(),
        content: docContent.trim(),
        tags: tagsArray
      });
    } else {
      addDocument({
        title: docTitle.trim(),
        category: docCategory,
        clearanceRequired: docClearance,
        version: docVersion.trim(),
        author: currentUser?.ninjaName ? `${currentUser.ninjaName} (${currentUser.ninjaRank})` : 'Direction de l\'Académie',
        summary: docSummary.trim(),
        content: docContent.trim(),
        tags: tagsArray
      });
    }

    setIsEditorModalOpen(false);
  };

  const handleDeleteDoc = (doc: AcademyDocument) => {
    setDocToDelete(doc);
  };

  const confirmDeleteDoc = () => {
    if (docToDelete) {
      deleteDocument(docToDelete.id);
      if (selectedDocId === docToDelete.id && documents.length > 1) {
        setSelectedDocId(documents.find(d => d.id !== docToDelete.id)?.id || '');
      }
      setDocToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="font-cinzel text-xl sm:text-2xl font-bold text-neutral-100 tracking-wide uppercase">
            Textes Officiels & Barèmes Disciplinaires
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Décrets de l'Hokage, grille des sanctions Zenkai RP et protocoles de l'Académie
          </p>
        </div>

        {canAccessAdmin && (
          <button
            onClick={handleOpenNewDoc}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md shadow-red-950/40 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un Document Officiel</span>
          </button>
        )}
      </div>

      {/* Category Pills (Functional Interactive Tabs) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'all', label: 'Tous les textes' },
          { id: 'reglement', label: 'Règlements Intérieurs' },
          { id: 'bareme', label: 'Barèmes des Sanctions' },
          { id: 'procedure', label: 'Procédures Claniques' },
          { id: 'protocole_urgence', label: 'Sécurité & Kekkai' }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat.id
                ? 'bg-neutral-800 text-neutral-100 shadow-sm border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Two Column Layout: Documents Sidebar + Document Reader */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Document List (Left 4 cols) */}
        <div className="lg:col-span-4 space-y-2.5">
          {filteredDocs.map(doc => {
            const isSelected = activeDoc?.id === doc.id;
            
            return (
              <div
                key={doc.id}
                onClick={() => setSelectedDocId(doc.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer text-left ${
                  isSelected
                    ? 'bg-neutral-900 border-red-800/80 shadow-lg shadow-red-950/20'
                    : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                    doc.category === 'bareme' ? 'text-amber-400 bg-amber-950/40 border border-amber-800/50' :
                    doc.category === 'protocole_urgence' ? 'text-red-400 bg-red-950/40 border border-red-800/50' :
                    'text-neutral-400 bg-neutral-800 border border-neutral-700'
                  }`}>
                    {doc.version} · {doc.category}
                  </span>
                  
                  <span className="text-[10px] font-mono text-neutral-500">
                    {doc.id}
                  </span>
                </div>

                <h3 className={`font-semibold text-sm mt-2 leading-snug ${
                  isSelected ? 'text-neutral-100' : 'text-neutral-300'
                }`}>
                  {doc.title}
                </h3>

                <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                  {doc.summary}
                </p>

                <div className="mt-3 pt-2 border-t border-neutral-800/60 flex items-center justify-between text-[11px] text-neutral-500">
                  <span>{doc.lastUpdated}</span>
                  {canAccessAdmin && isSelected && (
                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleOpenEditDoc(doc)}
                        className="p-1 hover:text-neutral-200 rounded"
                        title="Modifier"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteDoc(doc)}
                        className="p-1 hover:text-red-400 rounded"
                        title="Archiver"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Document Reader Area (Right 8 cols) */}
        <div className="lg:col-span-8 bg-neutral-900 border border-neutral-800 rounded-xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          {activeDoc ? (
            <div>
              {/* Document Header */}
              <div className="border-b border-neutral-800 pb-5 mb-6">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-400 mb-2">
                  <div className="flex items-center gap-2">
                    <KonohaLeafIcon className="w-4 h-4 text-red-500" />
                    <span className="font-semibold text-red-400 uppercase font-cinzel">
                      Archives Officielles de Konoha
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-neutral-500">{activeDoc.id}</span>
                  </div>

                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-300">
                    Niveau requis : {activeDoc.clearanceRequired.replace('_', ' ')}
                  </span>
                </div>

                <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-neutral-100 tracking-wide">
                  {activeDoc.title}
                </h2>

                <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-neutral-400">
                  <div>
                    Auteur : <strong className="text-neutral-200">{activeDoc.author}</strong>
                  </div>
                  <span aria-hidden="true" className="text-neutral-700">|</span>
                  <div>
                    Mise à jour : <strong className="text-neutral-200">{activeDoc.lastUpdated}</strong>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap items-center gap-1.5 mt-3">
                  {activeDoc.tags.map(tag => (
                    <span 
                      key={tag} 
                      className="text-[11px] text-neutral-400 font-mono"
                    >
                      #{tag} <span className="text-neutral-600">/</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Document Content */}
              <div className="prose prose-invert max-w-none text-neutral-300 text-xs sm:text-sm leading-relaxed space-y-4 whitespace-pre-line font-sans">
                {activeDoc.content}
              </div>

              {/* Watermark Seal Stamp at bottom right */}
              <div className="mt-8 pt-6 border-t border-neutral-800/80 flex items-center justify-between">
                <div className="text-xs text-neutral-500">
                  Document sous sceau de la Direction de l'Académie · Sceau n°719-KNH
                </div>
                <DisciplinarySealStamp size="sm" label="TEXTE OFFICIEL" sublabel="KONOHA DÉCRET" />
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-neutral-500">
              <BookOpen className="w-10 h-10 mx-auto mb-2 text-neutral-600" />
              <p className="text-sm">Aucun document sélectionné</p>
            </div>
          )}
        </div>

      </div>

      {/* Editor Modal for Adding / Editing Official Documents */}
      {isEditorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
              <h2 className="font-cinzel text-base font-bold text-neutral-100 uppercase tracking-wide">
                {editingDoc ? 'Modifier le Document Officiel' : 'Rédiger un Document Officiel'}
              </h2>
              <button
                onClick={() => setIsEditorModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDoc} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Titre du décret ou règlement *
                </label>
                <input
                  type="text"
                  required
                  value={docTitle}
                  onChange={e => setDocTitle(e.target.value)}
                  placeholder="Ex: Barème des heures de colle pour Ninjutsu interdit"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-100 focus:outline-none focus:border-red-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Catégorie
                  </label>
                  <select
                    value={docCategory}
                    onChange={e => setDocCategory(e.target.value as AcademyDocument['category'])}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-100 focus:outline-none"
                  >
                    <option value="reglement">Règlement Intérieur</option>
                    <option value="bareme">Barème Disciplinaire</option>
                    <option value="procedure">Procédure</option>
                    <option value="protocole_urgence">Sécurité & Kekkai</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Accréditation
                  </label>
                  <select
                    value={docClearance}
                    onChange={e => setDocClearance(e.target.value as AcademyDocument['clearanceRequired'])}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-100 focus:outline-none"
                  >
                    <option value="tous_membres">Tous membres</option>
                    <option value="instructeurs_et_plus">Instructeurs & Sup.</option>
                    <option value="admin_direction">Direction / Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Version
                  </label>
                  <input
                    type="text"
                    value={docVersion}
                    onChange={e => setDocVersion(e.target.value)}
                    placeholder="v1.0"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-100 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Résumé en une phrase *
                </label>
                <input
                  type="text"
                  required
                  value={docSummary}
                  onChange={e => setDocSummary(e.target.value)}
                  placeholder="Exposé succinct des prérogatives et directives..."
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Contenu textuel officiel *
                </label>
                <textarea
                  required
                  rows={8}
                  value={docContent}
                  onChange={e => setDocContent(e.target.value)}
                  placeholder="Rédigez les articles, décrets et sanctions..."
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-100 font-mono focus:outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Tags (séparés par des virgules)
                </label>
                <input
                  type="text"
                  value={docTags}
                  onChange={e => setDocTags(e.target.value)}
                  placeholder="Règlement, Dojo, Sanctions"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-100 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditorModalOpen(false)}
                  className="px-4 py-2 text-xs text-neutral-400 hover:text-neutral-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg"
                >
                  Enregistrer le document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for document deletion */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-500">
              <div className="w-10 h-10 rounded-full bg-red-950 border border-red-800 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-100 font-cinzel">
                  Supprimer ce Texte Officiel ?
                </h3>
                <span className="text-xs text-neutral-400 font-mono">
                  Réf. {docToDelete.id}
                </span>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              Confirmez-vous la suppression définitive du document <strong>"{docToDelete.title}"</strong> (Catégorie : <em>{docToDelete.category}</em>) ? Cette action retirera le parchemin des archives officielles de Konoha.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="px-4 py-2 text-xs text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDeleteDoc}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-md cursor-pointer"
              >
                Confirmer la suppression
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

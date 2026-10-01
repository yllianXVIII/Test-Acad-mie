import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { KonohaLeafIcon, GmailIcon, DisciplinarySealStamp } from './KonohaIcons';
import { Lock, ArrowRight, AlertCircle, Eye, EyeOff, ShieldCheck, Check } from 'lucide-react';

export const GmailLoginScreen: React.FC = () => {
  const { loginWithGmail } = useApp();
  
  // Mandatory email and password state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Strict validation
    if (!cleanEmail) {
      setErrorMessage("Veuillez renseigner votre adresse email obligatoirement.");
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage("Format d'adresse email invalide (ex: utilisateur@gmail.com).");
      return;
    }

    if (!cleanPassword) {
      setErrorMessage("Veuillez renseigner votre mot de passe obligatoirement.");
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await loginWithGmail(cleanEmail, cleanPassword, rememberMe);
      if (!res.success) {
        setErrorMessage(res.error || 'Identifiants incorrects.');
      }
    } catch {
      setErrorMessage('Une erreur est survenue lors de la tentative de connexion.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden bg-ninja-grid">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[380px] bg-red-900/12 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-10 opacity-20 pointer-events-none hidden lg:block">
        <DisciplinarySealStamp size="lg" />
      </div>

      <div className="w-full max-w-md z-10">
        
        {/* Header Badge & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 text-red-500 mb-4 shadow-xl shadow-red-950/30">
            <KonohaLeafIcon className="w-9 h-9 text-red-500" />
          </div>
          
          <h1 className="font-cinzel text-2xl sm:text-3xl font-extrabold text-neutral-100 tracking-wide uppercase">
            Bureau Disciplinaire
          </h1>
          
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-neutral-400 mt-2 font-medium">
            <span>Académie de Konoha</span>
            <span aria-hidden="true" className="text-red-500">·</span>
            <span>Serveur Zenkai RP</span>
            <span aria-hidden="true" className="text-red-500">·</span>
            <span className="text-neutral-500">木ノ葉隠れの里</span>
          </div>

          <div className="mt-3.5 inline-flex items-center gap-2 px-3 py-1 bg-red-950/40 border border-red-900/60 rounded-md text-xs text-red-300">
            <Lock className="w-3.5 h-3.5 text-red-400" />
            <span>Portail d'Accès Sécurisé · Authentification requise</span>
          </div>
        </div>

        {/* Clean, unassisted Login Container */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-6 sm:p-8 backdrop-blur-md shadow-2xl">
          
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-neutral-200 mb-1.5">
                Adresse Email <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <GmailIcon className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="votre-adresse@gmail.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-red-600 transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-neutral-200 mb-1.5">
                Mot de passe <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="Saisissez votre mot de passe..."
                  className="w-full pl-3 pr-10 py-2.5 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-neutral-100 placeholder-neutral-500 font-mono focus:outline-none focus:border-red-600 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-200 cursor-pointer"
                  title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Stay Logged In (Rester connecté) Checkbox */}
            <div className="pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                <div 
                  onClick={() => setRememberMe(!rememberMe)}
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                    rememberMe 
                      ? 'bg-red-600 border-red-500 text-white' 
                      : 'bg-neutral-950 border-neutral-700 group-hover:border-neutral-500'
                  }`}
                >
                  {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span 
                  onClick={() => setRememberMe(!rememberMe)}
                  className="text-xs text-neutral-300 group-hover:text-neutral-100 transition-colors"
                >
                  Rester connecté sur ce terminal
                </span>
              </label>
              <p className="text-[11px] text-neutral-500 pl-6 mt-0.5">
                Maintient la session active sur cet appareil jusqu'à déconnexion manuelle.
              </p>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-950/80 border border-red-800 text-xs text-red-300 flex items-center gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-50 text-white font-semibold text-sm rounded-lg transition-all shadow-lg shadow-red-950/50 flex items-center justify-center gap-2.5 group cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-white" />
                <span>{isLoading ? 'Vérification...' : 'Se connecter au Bureau Disciplinaire'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

          </form>

          {/* Footer note */}
          <div className="mt-6 pt-5 border-t border-neutral-800 text-center">
            <p className="text-[11px] text-neutral-500 font-mono">
              Base de Données Firestore Synchronisée · Zenkai RP
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SetupPage() {
  const navigate = useNavigate();
  const { isInstalled, isLoading, initializeAdmin, checkInstallationStatus } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [alreadyInstalled, setAlreadyInstalled] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isInstalled) {
      navigate('/login', { replace: true });
    }
  }, [isInstalled, isLoading, navigate]);

  const validate = () => {
    const errors = {};
    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName) {
      errors.name = 'Le nom de l’administrateur est obligatoire.';
    } else if (cleanName.length < 2) {
      errors.name = 'Le nom doit contenir au moins 2 caractères.';
    }

    if (!cleanEmail) {
      errors.email = 'L’adresse e-mail est obligatoire.';
    } else if (!emailRegex.test(cleanEmail)) {
      errors.email = 'Format d’adresse e-mail invalide.';
    }

    if (!password) {
      errors.password = 'Le mot de passe est obligatoire.';
    } else if (password.length < 8) {
      errors.password = 'Le mot de passe doit contenir au moins 8 caractères.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'La confirmation du mot de passe est obligatoire.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas.';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setAlreadyInstalled(false);

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const result = await initializeAdmin({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      if (result?.user?.role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    } catch (err) {
      if (err.status === 409 || err.status === 403) {
        setAlreadyInstalled(true);
        await checkInstallationStatus();
      }
      setServerError(err.message || 'Impossible d’initialiser le compte administrateur.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
        <p>Vérification de l’état d’installation...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <h1 className="text-2xl font-bold mb-1">Initialisation FactoryFlow</h1>
        <p className="text-sm text-slate-400 mb-6">
          Création du premier compte Administrateur lors du premier démarrage.
        </p>

        {serverError && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300"
          >
            <p>{serverError}</p>
            {alreadyInstalled && (
              <Link to="/login" className="mt-2 inline-block underline font-medium text-red-200">
                Aller à la page de connexion
              </Link>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor="setup-name" className="block text-sm font-medium mb-1">
              Nom complet
            </label>
            <input
              id="setup-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
            />
            {fieldErrors.name && (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="setup-email" className="block text-sm font-medium mb-1">
              Adresse e-mail
            </label>
            <input
              id="setup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
            />
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="setup-password" className="block text-sm font-medium mb-1">
              Mot de passe
            </label>
            <input
              id="setup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
            />
            {fieldErrors.password && (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.password}</p>
            )}
          </div>

          <div>
            <label htmlFor="setup-confirm-password" className="block text-sm font-medium mb-1">
              Confirmer le mot de passe
            </label>
            <input
              id="setup-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={submitting}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
            />
            {fieldErrors.confirmPassword && (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 py-2.5 text-sm font-semibold text-white transition"
          >
            {submitting ? 'Initialisation en cours...' : 'Créer le compte Administrateur'}
          </button>
        </form>
      </div>
    </div>
  );
}
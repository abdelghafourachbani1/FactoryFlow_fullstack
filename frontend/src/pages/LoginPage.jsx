import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, role, isInstalled, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isInstalled === false) {
      navigate('/setup', { replace: true });
      return;
    }

    if (!isLoading && isAuthenticated && role) {
      const target =
        location.state?.from?.pathname ||
        (role === 'ADMIN' ? '/admin/dashboard' : '/operator/orders');
      navigate(target, { replace: true });
    }
  }, [isLoading, isInstalled, isAuthenticated, role, location.state, navigate]);

  const validate = () => {
    const errors = {};
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      errors.email = 'L’adresse e-mail est obligatoire.';
    } else if (!emailRegex.test(cleanEmail)) {
      errors.email = 'Veuillez saisir une adresse e-mail valide.';
    }

    if (!password) {
      errors.password = 'Le mot de passe est obligatoire.';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const loggedUser = await login({
        email: email.trim().toLowerCase(),
        password,
      });

      const target =
        location.state?.from?.pathname ||
        (loggedUser.role === 'ADMIN' ? '/admin/dashboard' : '/operator/orders');
      navigate(target, { replace: true });
    } catch (err) {
      setServerError(err.message || 'Identifiants invalides.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <h1 className="text-2xl font-bold mb-1">FactoryFlow</h1>
        <p className="text-sm text-slate-400 mb-6">
          Connexion à l’espace Administrateur ou Opérateur.
        </p>

        {serverError && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300"
          >
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium mb-1">
              Adresse e-mail
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
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
            <label htmlFor="login-password" className="block text-sm font-medium mb-1">
              Mot de passe
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
            />
            {fieldErrors.password && (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 py-2.5 text-sm font-semibold text-white transition"
          >
            {submitting ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
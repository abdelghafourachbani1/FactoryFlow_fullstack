import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

export default function ForbiddenPage() {
  const { role, isAuthenticated } = useAuth();

  const homePath =
    role?.toUpperCase() === 'ADMIN'
      ? '/admin/dashboard'
      : role?.toUpperCase() === 'OPERATOR'
        ? '/operator/orders'
        : '/login';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4">
      <div className="max-w-md w-full rounded-xl border border-slate-800 bg-slate-900 p-6 text-center shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-amber-400 mb-2">
          Erreur 403
        </p>
        <h1 className="text-2xl font-bold mb-2">Accès refusé</h1>
        <p className="text-sm text-slate-400 mb-6">
          Vous ne disposez pas des permissions nécessaires pour accéder à cette section.
        </p>
        <Link
          to={isAuthenticated ? homePath : '/login'}
          className="inline-block rounded-lg bg-sky-600 hover:bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition"
        >
          {isAuthenticated ? 'Retour à mon espace' : 'Aller à la connexion'}
        </Link>
      </div>
    </div>
  );
}
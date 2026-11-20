import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

export default function NotFoundPage() {
  const { isAuthenticated, role } = useAuth();

  const targetPath = !isAuthenticated
    ? '/login'
    : role?.toUpperCase() === 'ADMIN'
      ? '/admin/dashboard'
      : '/operator/orders';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4">
      <div className="max-w-md w-full rounded-xl border border-slate-800 bg-slate-900 p-6 text-center shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-sky-400 mb-2">
          Erreur 404
        </p>
        <h1 className="text-2xl font-bold mb-2">Page introuvable</h1>
        <p className="text-sm text-slate-400 mb-6">
          L’adresse demandée n’existe pas ou a été déplacée.
        </p>
        <Link
          to={targetPath}
          className="inline-block rounded-lg bg-sky-600 hover:bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition"
        >
          Retourner à l’accueil
        </Link>
      </div>
    </div>
  );
}
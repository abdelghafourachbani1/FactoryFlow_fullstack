import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

export default function RoleRoute({ allowedRoles = [] }) {
  const { role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
        <p>Vérification des droits d’accès...</p>
      </div>
    );
  }

  const normalizedRole = typeof role === 'string' ? role.toUpperCase() : '';
  const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase());

  if (!normalizedAllowed.includes(normalizedRole)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
}
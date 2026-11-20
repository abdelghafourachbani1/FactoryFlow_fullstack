import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';

const ADMIN_LINKS = [
  { to: '/admin/dashboard', label: 'Tableau de bord' },
  { to: '/admin/raw-materials', label: 'Matières premières' },
  { to: '/admin/products', label: 'Produits' },
  { to: '/admin/orders', label: 'Ordres de fabrication' },
];

const OPERATOR_LINKS = [
  { to: '/operator/orders', label: 'Mes ordres affectés' },
  { to: '/operator/history', label: 'Historique terminés' },
];

export default function MainLayout() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const normalizedRole = typeof role === 'string' ? role.toUpperCase() : '';
  const navLinks = normalizedRole === 'ADMIN' ? ADMIN_LINKS : OPERATOR_LINKS;

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Barre supérieure mobile */}
      <header className="md:hidden flex items-center justify-between border-b border-slate-800 bg-slate-900/95 backdrop-blur px-4 py-3 sticky top-0 z-30">
        <span className="text-lg font-bold tracking-tight text-sky-400">
          FactoryFlow
        </span>
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-expanded={mobileMenuOpen}
          aria-label="Ouvrir ou fermer le menu"
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-700"
        >
          {mobileMenuOpen ? 'Fermer' : 'Menu'}
        </button>
      </header>

      {/* Overlay mobile */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
        />
      )}

      {/* Sidebar responsive */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 shrink-0 border-r border-slate-800 bg-slate-900 flex flex-col justify-between transition-transform duration-200 ease-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-5">
          <div className="hidden md:flex items-center justify-between mb-6">
            <div>
              <span className="text-xl font-bold tracking-tight text-sky-400">
                FactoryFlow
              </span>
              <p className="text-xs text-slate-400 mt-0.5">Production & Stocks</p>
            </div>
          </div>

          <nav aria-label="Navigation principale" className="space-y-1">
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-sky-600/20 text-sky-300 border border-sky-500/40'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Infos session + Déconnexion */}
        <div className="border-t border-slate-800 p-4 space-y-3 bg-slate-900/80">
          <div className="rounded-lg bg-slate-800/70 p-3">
            <p className="text-sm font-semibold text-white truncate">
              {user?.name || user?.email || 'Utilisateur'}
            </p>
            <span className="mt-1 inline-block rounded bg-slate-700 px-2 py-0.5 text-xs font-medium text-sky-300">
              {normalizedRole || 'SESSION'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-lg border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 px-3 py-2 text-sm font-medium text-red-300 transition"
          >
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Zone de contenu principale */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
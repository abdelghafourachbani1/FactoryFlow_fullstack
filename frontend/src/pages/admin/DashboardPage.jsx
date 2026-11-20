import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ordersService } from '../../services/ordersService';
import { productsService } from '../../services/productsService';
import { rawMaterialsService } from '../../services/rawMaterialsService';

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function normalizeStatus(status) {
  const raw = String(status || '').trim().toUpperCase();
  if (raw === 'PLANNED' || raw === 'PLANIFIÉ' || raw === 'PLANIFIE') {
    return 'PLANIFIE';
  }
  if (raw === 'IN_PROGRESS' || raw === 'EN_COURS' || raw === 'EN COURS') {
    return 'EN_COURS';
  }
  if (raw === 'COMPLETED' || raw === 'TERMINÉ' || raw === 'TERMINE') {
    return 'TERMINE';
  }
  if (raw === 'CANCELLED' || raw === 'CANCELED' || raw === 'ANNULÉ' || raw === 'ANNULE') {
    return 'ANNULE';
  }
  return raw || 'AUTRE';
}

const STATUS_META = [
  {
    key: 'PLANIFIE',
    label: 'Planifiés',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  },
  {
    key: 'EN_COURS',
    label: 'En cours',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  },
  {
    key: 'TERMINE',
    label: 'Terminés',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  },
  {
    key: 'ANNULE',
    label: 'Annulés',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  },
];

export default function DashboardPage() {
  const [products, setProducts] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [productsRes, materialsRes, ordersRes] = await Promise.all([
        productsService.getAll(),
        rawMaterialsService.getAll(),
        ordersService.getAll(),
      ]);

      setProducts(normalizeList(productsRes));
      setRawMaterials(normalizeList(materialsRes));
      setOrders(normalizeList(ordersRes));
    } catch (err) {
      setError(err.message || 'Impossible de charger les indicateurs du tableau de bord.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const orderStatsByStatus = useMemo(() => {
    const counts = {
      PLANIFIE: 0,
      EN_COURS: 0,
      TERMINE: 0,
      ANNULE: 0,
      AUTRE: 0,
    };

    orders.forEach((order) => {
      const key = normalizeStatus(order.status || order.state);
      if (Object.prototype.hasOwnProperty.call(counts, key)) {
        counts[key] += 1;
      } else {
        counts.AUTRE += 1;
      }
    });

    return counts;
  }, [orders]);

  const lowStockMaterials = useMemo(() => {
    return rawMaterials.filter((item) => {
      const currentStock = Number(item.stock ?? item.currentStock ?? 0);
      const threshold = Number(item.alertThreshold ?? item.minStock ?? 0);
      return currentStock <= threshold;
    });
  }, [rawMaterials]);

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Tableau de bord Administrateur</h1>
          <p className="text-sm text-slate-400 mt-1">
            Vue synthétique du catalogue, de l’état des stocks et des ordres de fabrication.
          </p>
        </div>

        <button
          type="button"
          onClick={loadDashboardData}
          disabled={loading}
          className="self-start sm:self-auto rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 px-3.5 py-2 text-sm font-medium text-slate-200 transition"
        >
          {loading ? 'Actualisation...' : 'Actualiser'}
        </button>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300 flex items-center justify-between gap-4"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={loadDashboardData}
            className="rounded bg-red-500/20 hover:bg-red-500/30 px-3 py-1 text-xs font-semibold text-red-200"
          >
            Réessayer
          </button>
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-400">
          Chargement des indicateurs du tableau de bord...
        </div>
      ) : (
        <>
          {/* Cartes totaux principaux */}
          <section
            aria-label="Indicateurs globaux"
            className="grid grid-cols-1 sm:grid-cols-3 gap-5"
          >
            <div className="rounded-xl border border-slate-800 bg-slate-900/90 backdrop-blur p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Produits
              </p>
              <p className="mt-2 text-3xl font-bold text-white">{products.length}</p>
              <Link
                to="/admin/products"
                className="mt-3 inline-block text-xs font-medium text-sky-400 hover:underline"
              >
                Gérer les produits →
              </Link>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/90 backdrop-blur p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Matières premières
              </p>
              <p className="mt-2 text-3xl font-bold text-white">{rawMaterials.length}</p>
              <Link
                to="/admin/raw-materials"
                className="mt-3 inline-block text-xs font-medium text-sky-400 hover:underline"
              >
                Gérer les matières →
              </Link>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/90 backdrop-blur p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Ordres de fabrication
              </p>
              <p className="mt-2 text-3xl font-bold text-white">{orders.length}</p>
              <Link
                to="/admin/orders"
                className="mt-3 inline-block text-xs font-medium text-sky-400 hover:underline"
              >
                Voir tous les ordres →
              </Link>
            </div>
          </section>

          {/* Répartition des ordres par statut + Alertes stock bas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Répartition par statut */}
            <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <h2 className="text-lg font-semibold text-white mb-4">
                Répartition des ordres par statut
              </h2>

              {orders.length === 0 ? (
                <p className="text-sm text-slate-400 py-4">
                  Aucun ordre de fabrication enregistré pour le moment.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {STATUS_META.map((item) => {
                    const count = orderStatsByStatus[item.key] ?? 0;
                    const percentage =
                      orders.length > 0
                        ? Math.round((count / orders.length) * 100)
                        : 0;

                    return (
                      <div
                        key={item.key}
                        className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 flex items-center justify-between"
                      >
                        <div>
                          <span
                            className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${item.badgeClass}`}
                          >
                            {item.label}
                          </span>
                          <p className="mt-2 text-2xl font-bold text-white">{count}</p>
                        </div>
                        <span className="text-sm font-semibold text-slate-400">
                          {percentage}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Alertes matières sous leur seuil */}
            <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">
                  Alertes matières sous leur seuil
                </h2>
                <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
                  {lowStockMaterials.length} alerte(s)
                </span>
              </div>

              {lowStockMaterials.length === 0 ? (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
                  Toutes les matières premières ont un stock supérieur à leur seuil d’alerte.
                </div>
              ) : (
                <ul className="divide-y divide-slate-800/80">
                  {lowStockMaterials.map((mat) => {
                    const id = mat.id || mat._id;
                    const currentStock = Number(mat.stock ?? mat.currentStock ?? 0);
                    const threshold = Number(mat.alertThreshold ?? mat.minStock ?? 0);

                    return (
                      <li
                        key={id}
                        className="py-3 flex items-center justify-between gap-3 text-sm"
                      >
                        <div>
                          <p className="font-medium text-white">
                            {mat.name}{' '}
                            <span className="font-mono text-xs text-slate-400">
                              ({mat.reference})
                            </span>
                          </p>
                          <p className="text-xs text-amber-300 mt-0.5">
                            Stock : {currentStock} {mat.unit} / Seuil : {threshold}{' '}
                            {mat.unit}
                          </p>
                        </div>

                        <Link
                          to="/admin/raw-materials"
                          className="shrink-0 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-200 transition"
                        >
                          Approvisionner
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
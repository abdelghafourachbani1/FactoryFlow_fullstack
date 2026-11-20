import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ordersService } from '../../services/ordersService';
import { productsService } from '../../services/productsService';

const PAGE_SIZE = 6;

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'PLANIFIE', label: 'Planifié' },
  { value: 'EN_COURS', label: 'En cours' },
  { value: 'TERMINE', label: 'Terminé' },
  { value: 'ANNULE', label: 'Annulé' },
];

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.orders)) return payload.orders;
  return [];
}

export function normalizeOrderStatus(status) {
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

function getStatusBadge(status) {
  const normalized = normalizeOrderStatus(status);
  switch (normalized) {
    case 'PLANIFIE':
      return {
        label: 'Planifié',
        className: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
      };
    case 'EN_COURS':
      return {
        label: 'En cours',
        className: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      };
    case 'TERMINE':
      return {
        label: 'Terminé',
        className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      };
    case 'ANNULE':
      return {
        label: 'Annulé',
        className: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      };
    default:
      return {
        label: status || 'Inconnu',
        className: 'bg-slate-700/50 text-slate-300 border-slate-600',
      };
  }
}

function extractOrderItems(order) {
  return (
    order.items ||
    order.products ||
    order.orderItems ||
    order.lines ||
    []
  );
}

function getOrderDateValue(order) {
  const rawDate = order.createdAt || order.plannedDate || order.date || order.updatedAt;
  if (!rawDate) return null;
  const parsed = new Date(rawDate);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtres & recherche
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [ordersRes, productsRes] = await Promise.all([
        ordersService.getAll(),
        productsService.getAll(),
      ]);
      setOrders(normalizeList(ordersRes));
      setProducts(normalizeList(productsRes));
    } catch (err) {
      setError(err.message || 'Impossible de charger les ordres de fabrication.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setProductFilter('');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    const startBoundary = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const endBoundary = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null;

    return orders.filter((order) => {
      // Filtre statut
      if (statusFilter) {
        const currentStatus = normalizeOrderStatus(order.status || order.state);
        if (currentStatus !== statusFilter) return false;
      }

      const items = extractOrderItems(order);

      // Filtre produit
      if (productFilter) {
        const hasProduct = items.some((item) => {
          const itemProdId = String(
            item.productId ||
              item.product?.id ||
              item.product?._id ||
              item.id ||
              ''
          );
          return itemProdId === String(productFilter);
        });
        if (!hasProduct) return false;
      }

      // Filtre période
      if (startBoundary || endBoundary) {
        const orderDate = getOrderDateValue(order);
        if (!orderDate) return false;
        if (startBoundary && orderDate < startBoundary) return false;
        if (endBoundary && orderDate > endBoundary) return false;
      }

      // Recherche (référence/id ordre, opérateur, produits)
      if (q) {
        const ref = String(order.reference || order.code || order.id || order._id || '').toLowerCase();
        const operatorName = String(
          order.operator?.name ||
            order.operator?.email ||
            order.assignedTo?.name ||
            order.operatorName ||
            ''
        ).toLowerCase();

        const matchesProductText = items.some((item) => {
          const pName = String(item.product?.name || item.productName || item.name || '').toLowerCase();
          const pRef = String(item.product?.reference || item.reference || '').toLowerCase();
          return pName.includes(q) || pRef.includes(q);
        });

        if (!ref.includes(q) && !operatorName.includes(q) && !matchesProductText) {
          return false;
        }
      }

      return true;
    });
  }, [orders, search, statusFilter, productFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedOrders = useMemo(() => {
    const startIndex = (safePage - 1) * PAGE_SIZE;
    return filteredOrders.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredOrders, safePage]);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Ordres de fabrication</h1>
          <p className="text-sm text-slate-400 mt-1">
            Consultez, recherchez et filtrez l’ensemble des ordres de production.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 px-3.5 py-2 text-sm font-medium text-slate-200 transition"
          >
            {loading ? 'Chargement...' : 'Actualiser'}
          </button>
        </div>
      </div>

      {/* Barre de recherche & filtres */}
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <label htmlFor="orders-search" className="block text-xs font-medium text-slate-400 mb-1">
              Recherche (référence, opérateur, produit)
            </label>
            <input
              id="orders-search"
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Ex. OF-2026, produit..."
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label htmlFor="orders-status" className="block text-xs font-medium text-slate-400 mb-1">
              Statut
            </label>
            <select
              id="orders-status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="orders-product" className="block text-xs font-medium text-slate-400 mb-1">
              Produit
            </label>
            <select
              id="orders-product"
              value={productFilter}
              onChange={(e) => {
                setProductFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
            >
              <option value="">Tous les produits</option>
              {products.map((prod) => {
                const pid = String(prod.id || prod._id);
                return (
                  <option key={pid} value={pid}>
                    {prod.reference ? `${prod.reference} — ` : ''}
                    {prod.name}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleResetFilters}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-2 text-sm font-medium text-slate-200 transition"
            >
              Réinitialiser
            </button>
          </div>
        </div>

        {/* Filtres de période */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          <div>
            <label htmlFor="orders-date-from" className="block text-xs font-medium text-slate-400 mb-1">
              Période : date de début
            </label>
            <input
              id="orders-date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label htmlFor="orders-date-to" className="block text-xs font-medium text-slate-400 mb-1">
              Période : date de fin
            </label>
            <input
              id="orders-date-to"
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
            />
          </div>
        </div>
      </section>

      {/* Erreur */}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      {/* Tableau des ordres */}
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            Résultats ({filteredOrders.length})
          </h2>
          <span className="text-xs text-slate-400">
            Page {safePage} sur {totalPages}
          </span>
        </div>

        {loading ? (
          <p className="text-sm text-slate-400 py-8 text-center">
            Chargement des ordres de fabrication...
          </p>
        ) : paginatedOrders.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">
            Aucun ordre ne correspond aux critères sélectionnés.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 pr-4">Référence / ID</th>
                  <th className="py-2.5 pr-4">Statut</th>
                  <th className="py-2.5 pr-4">Produits & Quantités</th>
                  <th className="py-2.5 pr-4">Opérateur</th>
                  <th className="py-2.5 pr-4">Date</th>
                  <th className="py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {paginatedOrders.map((order) => {
                  const id = String(order.id || order._id);
                  const badge = getStatusBadge(order.status || order.state);
                  const items = extractOrderItems(order);
                  const orderDate = getOrderDateValue(order);
                  const operatorLabel =
                    order.operator?.name ||
                    order.operator?.email ||
                    order.assignedTo?.name ||
                    order.operatorName ||
                    'Non affecté';

                  return (
                    <tr key={id} className="hover:bg-slate-800/40 align-top">
                      <td className="py-3 pr-4 font-mono text-xs text-sky-300">
                        {order.reference || order.code || id}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        {items.length === 0 ? (
                          <span className="text-xs text-slate-500">Aucun produit</span>
                        ) : (
                          <ul className="space-y-1 text-xs text-slate-300">
                            {items.map((line, idx) => {
                              const pName =
                                line.product?.name ||
                                line.productName ||
                                line.name ||
                                'Produit';
                              const qty = line.quantity ?? line.qty ?? 0;
                              return (
                                <li key={idx}>
                                  <span className="font-semibold text-white">
                                    {qty}×
                                  </span>{' '}
                                  {pName}
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-slate-300">{operatorLabel}</td>
                      <td className="py-3 pr-4 text-slate-400 text-xs">
                        {orderDate ? orderDate.toLocaleDateString('fr-FR') : '-'}
                      </td>
                      <td className="py-3 text-right whitespace-nowrap">
                        <Link
                          to={`/admin/orders/${id}`}
                          className="rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-medium text-sky-300 transition"
                        >
                          Détails
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Contrôles de pagination */}
        {!loading && filteredOrders.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 px-3.5 py-1.5 text-xs font-medium text-slate-200"
            >
              Précédent
            </button>

            <span className="text-xs text-slate-400">
              Page {safePage} / {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 px-3.5 py-1.5 text-xs font-medium text-slate-200"
            >
              Suivant
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
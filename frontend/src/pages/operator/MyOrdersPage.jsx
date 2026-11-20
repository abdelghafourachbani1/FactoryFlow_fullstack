import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ordersService } from '../../services/ordersService';

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.orders)) return payload.orders;
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
  if (
    raw === 'CANCELLED' ||
    raw === 'CANCELED' ||
    raw === 'ANNULÉ' ||
    raw === 'ANNULE'
  ) {
    return 'ANNULE';
  }
  return raw || 'AUTRE';
}

function getStatusBadge(status) {
  const normalized = normalizeStatus(status);
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
  return order.items || order.products || order.orderItems || order.lines || [];
}

function isAssignedToCurrentUser(order, user) {
  if (!user) return true;
  const userId = String(user.id || user._id || '');
  const userEmail = String(user.email || '').toLowerCase();

  const assignedId = String(
    order.operatorId ||
      order.assignedToId ||
      order.operator?.id ||
      order.operator?._id ||
      order.assignedTo?.id ||
      order.assignedTo?._id ||
      ''
  );
  const assignedEmail = String(
    order.operator?.email || order.assignedTo?.email || ''
  ).toLowerCase();

  if (!assignedId && !assignedEmail) return true;
  if (userId && assignedId && userId === assignedId) return true;
  if (userEmail && assignedEmail && userEmail === assignedEmail) return true;
  return false;
}

export default function MyOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stockError, setStockError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Confirmation avant démarrage d'un ordre planifié
  const [pendingStartOrder, setPendingStartOrder] = useState(null);
  const [actionOrderId, setActionOrderId] = useState(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let data;
      try {
        data = await ordersService.getMyOrders();
      } catch {
        data = await ordersService.getAll();
      }
      const list = normalizeList(data).filter((o) =>
        isAssignedToCurrentUser(o, user)
      );
      setOrders(list);
    } catch (err) {
      setError(
        err.message || 'Impossible de charger vos ordres de fabrication.'
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Ordres actifs (Planifié ou En cours) pour la vue principale
  const activeOrders = useMemo(() => {
    return orders.filter((order) => {
      const st = normalizeStatus(order.status || order.state);
      return st !== 'TERMINE';
    });
  }, [orders]);

  const handleConfirmStart = async () => {
    if (!pendingStartOrder) return;
    const targetId = String(pendingStartOrder.id || pendingStartOrder._id);

    setStockError('');
    setSuccessMessage('');
    setActionOrderId(targetId);

    try {
      const updated = await ordersService.startOrder(targetId);
      const nextStatus =
        updated?.status || updated?.data?.status || 'EN_COURS';

      setOrders((prev) =>
        prev.map((ord) => {
          const oid = String(ord.id || ord._id);
          if (oid !== targetId) return ord;
          return {
            ...(updated?.data || updated || ord),
            status: nextStatus,
          };
        })
      );

      setPendingStartOrder(null);
      setSuccessMessage(
        'Ordre démarré avec succès : les matières premières nécessaires ont été consommées.'
      );
      await loadOrders();
    } catch (err) {
      setPendingStartOrder(null);
      setStockError(
        err.message ||
          'Démarrage refusé : stock de matières premières insuffisant. Aucun stock n’a été déduit.'
      );
      await loadOrders();
    } finally {
      setActionOrderId(null);
    }
  };

  const handleCompleteOrder = async (order) => {
    const targetId = String(order.id || order._id);
    setStockError('');
    setSuccessMessage('');
    setActionOrderId(targetId);

    try {
      const updated = await ordersService.completeOrder(targetId);
      const nextStatus =
        updated?.status || updated?.data?.status || 'TERMINE';

      // Mise à jour immédiate du statut dans l'état local
      setOrders((prev) =>
        prev.map((ord) => {
          const oid = String(ord.id || ord._id);
          if (oid !== targetId) return ord;
          return {
            ...(updated?.data || updated || ord),
            status: nextStatus,
          };
        })
      );

      setSuccessMessage(
        'Ordre marqué comme Terminé. Il est désormais visible dans l’historique.'
      );
    } catch (err) {
      setError(err.message || 'Impossible de clôturer cet ordre.');
    } finally {
      setActionOrderId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Mes ordres affectés</h1>
          <p className="text-sm text-slate-400 mt-1">
            Démarrez les ordres planifiés après vérification des stocks et clôturez les ordres en cours.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/operator/history"
            className="rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-3.5 py-2 text-sm font-medium text-slate-200 transition"
          >
            Historique terminés
          </Link>
          <button
            type="button"
            onClick={loadOrders}
            disabled={loading}
            className="rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 px-3.5 py-2 text-sm font-medium text-slate-200 transition"
          >
            {loading ? 'Actualisation...' : 'Actualiser'}
          </button>
        </div>
      </div>

      {successMessage && (
        <div
          role="status"
          className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-sm text-emerald-300"
        >
          {successMessage}
        </div>
      )}

      {stockError && (
        <div
          role="alert"
          className="rounded-lg border border-amber-500/50 bg-amber-500/15 p-4 text-sm text-amber-200"
        >
          <p className="font-semibold">Impossible de démarrer l’ordre</p>
          <p className="mt-1">{stockError}</p>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-500/40 bg-red-500/10 p-3.5 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      {/* Boîte de confirmation de démarrage */}
      {pendingStartOrder && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-start-title"
          className="rounded-xl border border-sky-500/40 bg-slate-900 p-5 shadow-xl space-y-4"
        >
          <h2 id="confirm-start-title" className="text-base font-semibold text-white">
            Confirmer le démarrage de l’ordre{' '}
            <span className="font-mono text-sky-300">
              {pendingStartOrder.reference ||
                pendingStartOrder.code ||
                pendingStartOrder.id ||
                pendingStartOrder._id}
            </span>
          </h2>
          <p className="text-sm text-slate-300">
            Le démarrage vérifiera la disponibilité des matières premières, déduira les quantités requises du stock et passera l’ordre au statut <strong>En cours</strong>.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleConfirmStart}
              disabled={Boolean(actionOrderId)}
              className="rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 px-4 py-2 text-sm font-semibold text-white transition"
            >
              {actionOrderId ? 'Démarrage...' : 'Confirmer le démarrage'}
            </button>
            <button
              type="button"
              onClick={() => setPendingStartOrder(null)}
              disabled={Boolean(actionOrderId)}
              className="rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Liste des ordres affectés */}
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        {loading ? (
          <p className="text-sm text-slate-400 py-8 text-center">
            Chargement de vos ordres affectés...
          </p>
        ) : activeOrders.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">
            Aucun ordre planifié ou en cours ne vous est affecté actuellement.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 pr-4">Référence / ID</th>
                  <th className="py-2.5 pr-4">Statut</th>
                  <th className="py-2.5 pr-4">Produits & Quantités</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {activeOrders.map((order) => {
                  const id = String(order.id || order._id);
                  const statusKey = normalizeStatus(order.status || order.state);
                  const badge = getStatusBadge(statusKey);
                  const items = extractOrderItems(order);
                  const isBusy = actionOrderId === id;

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
                          <span className="text-xs text-slate-500">
                            Aucun produit
                          </span>
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
                      <td className="py-3 text-right space-x-2 whitespace-nowrap">
                        <Link
                          to={`/operator/orders/${id}`}
                          className="inline-block rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition"
                        >
                          Détail
                        </Link>

                        {statusKey === 'PLANIFIE' && (
                          <button
                            type="button"
                            onClick={() => {
                              setStockError('');
                              setPendingStartOrder(order);
                            }}
                            disabled={Boolean(actionOrderId)}
                            className="rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 px-3 py-1.5 text-xs font-semibold text-white transition"
                          >
                            {isBusy ? 'Démarrage...' : 'Démarrer'}
                          </button>
                        )}

                        {statusKey === 'EN_COURS' && (
                          <button
                            type="button"
                            onClick={() => handleCompleteOrder(order)}
                            disabled={Boolean(actionOrderId)}
                            className="rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-3 py-1.5 text-xs font-semibold text-white transition"
                          >
                            {isBusy ? 'Clôture...' : 'Terminer'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
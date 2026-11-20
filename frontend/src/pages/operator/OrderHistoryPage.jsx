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

function isCompletedOrder(order) {
  const raw = String(order.status || order.state || '')
    .trim()
    .toUpperCase();
  return raw === 'COMPLETED' || raw === 'TERMINÉ' || raw === 'TERMINE';
}

function extractOrderItems(order) {
  return order.items || order.products || order.orderItems || order.lines || [];
}

export default function OrderHistoryPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let data;
      try {
        data = await ordersService.getMyOrders();
      } catch {
        data = await ordersService.getAll();
      }
      setOrders(normalizeList(data));
    } catch (err) {
      setError(
        err.message || 'Impossible de charger l’historique des ordres terminés.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const completedOrders = useMemo(() => {
    const userId = String(user?.id || user?._id || '');
    const userEmail = String(user?.email || '').toLowerCase();

    return orders.filter((order) => {
      if (!isCompletedOrder(order)) return false;
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
    });
  }, [orders, user]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Historique des ordres terminés
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Consultez les ordres de fabrication clôturés qui vous étaient affectés.
          </p>
        </div>

        <Link
          to="/operator/orders"
          className="self-start sm:self-auto rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-2 text-sm font-medium text-slate-200 transition"
        >
          ← Retour à mes ordres
        </Link>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-500/40 bg-red-500/10 p-3.5 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        {loading ? (
          <p className="text-sm text-slate-400 py-8 text-center">
            Chargement de l’historique...
          </p>
        ) : completedOrders.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">
            Aucun ordre terminé dans votre historique pour le moment.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 pr-4">Référence / ID</th>
                  <th className="py-2.5 pr-4">Statut</th>
                  <th className="py-2.5 pr-4">Produits & Quantités</th>
                  <th className="py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {completedOrders.map((order) => {
                  const id = String(order.id || order._id);
                  const items = extractOrderItems(order);

                  return (
                    <tr key={id} className="hover:bg-slate-800/40 align-top">
                      <td className="py-3 pr-4 font-mono text-xs text-sky-300">
                        {order.reference || order.code || id}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="inline-block rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
                          Terminé
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
                      <td className="py-3 text-right whitespace-nowrap">
                        <Link
                          to={`/operator/orders/${id}`}
                          className="rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-medium text-sky-300 transition"
                        >
                          Détail
                        </Link>
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
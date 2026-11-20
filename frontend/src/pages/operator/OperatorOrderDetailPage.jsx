import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ordersService } from '../../services/ordersService';

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

function getStatusLabel(status) {
  switch (normalizeStatus(status)) {
    case 'PLANIFIE':
      return 'Planifié';
    case 'EN_COURS':
      return 'En cours';
    case 'TERMINE':
      return 'Terminé';
    case 'ANNULE':
      return 'Annulé';
    default:
      return status || 'Inconnu';
  }
}

export default function OperatorOrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stockError, setStockError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmStart, setConfirmStart] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadOrder = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const res = await ordersService.getById(id);
      setOrder(res?.data || res?.order || res);
    } catch (err) {
      setError(err.message || 'Impossible de charger le détail de l’ordre.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handleStart = async () => {
    if (!id) return;
    setStockError('');
    setSuccessMessage('');
    setSubmitting(true);
    try {
      const updated = await ordersService.startOrder(id);
      setOrder((prev) => ({
        ...(prev || {}),
        ...(updated?.data || updated || {}),
        status: updated?.status || updated?.data?.status || 'EN_COURS',
      }));
      setConfirmStart(false);
      setSuccessMessage('Ordre démarré avec succès.');
      await loadOrder();
    } catch (err) {
      setConfirmStart(false);
      setStockError(
        err.message ||
          'Démarrage refusé : stock insuffisant. Aucun stock n’a été déduit.'
      );
      await loadOrder();
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (!id) return;
    setStockError('');
    setSuccessMessage('');
    setSubmitting(true);
    try {
      const updated = await ordersService.completeOrder(id);
      setOrder((prev) => ({
        ...(prev || {}),
        ...(updated?.data || updated || {}),
        status: updated?.status || updated?.data?.status || 'TERMINE',
      }));
      setSuccessMessage('Ordre clôturé avec le statut Terminé.');
    } catch (err) {
      setError(err.message || 'Impossible de clôturer cet ordre.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-400">
        Chargement du détail de l’ordre...
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="space-y-4">
        <div
          role="alert"
          className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300"
        >
          {error}
        </div>
        <Link
          to="/operator/orders"
          className="inline-block text-sm text-sky-400 hover:underline"
        >
          ← Retour à mes ordres
        </Link>
      </div>
    );
  }

  const statusKey = normalizeStatus(order?.status || order?.state);
  const items =
    order?.items || order?.products || order?.orderItems || order?.lines || [];
  const requirements =
    order?.materialRequirements ||
    order?.requirements ||
    order?.rawMaterialRequirements ||
    [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/operator/orders"
            className="text-xs text-sky-400 hover:underline"
          >
            ← Retour à mes ordres
          </Link>
          <h1 className="text-2xl font-bold text-white mt-1">
            Ordre {order?.reference || order?.code || id}
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Statut actuel : <strong>{getStatusLabel(statusKey)}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {statusKey === 'PLANIFIE' && !confirmStart && (
            <button
              type="button"
              onClick={() => {
                setStockError('');
                setConfirmStart(true);
              }}
              disabled={submitting}
              className="rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 px-4 py-2 text-sm font-semibold text-white transition"
            >
              Démarrer l’ordre
            </button>
          )}

          {statusKey === 'EN_COURS' && (
            <button
              type="button"
              onClick={handleComplete}
              disabled={submitting}
              className="rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2 text-sm font-semibold text-white transition"
            >
              {submitting ? 'Clôture...' : 'Terminer l’ordre'}
            </button>
          )}
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
          <p className="font-semibold">Stock insuffisant</p>
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

      {confirmStart && (
        <div
          role="dialog"
          className="rounded-xl border border-sky-500/40 bg-slate-900 p-4 space-y-3"
        >
          <p className="text-sm text-white font-medium">
            Confirmez-vous le démarrage de cet ordre de fabrication ?
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleStart}
              disabled={submitting}
              className="rounded-lg bg-sky-600 hover:bg-sky-500 px-4 py-2 text-xs font-semibold text-white"
            >
              {submitting ? 'Démarrage...' : 'Oui, démarrer'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmStart(false)}
              disabled={submitting}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="text-base font-semibold text-white mb-3">
          Produits et quantités demandées
        </h2>
        {items.length === 0 ? (
          <p className="text-sm text-slate-400">Aucun produit associé.</p>
        ) : (
          <ul className="divide-y divide-slate-800/80 text-sm">
            {items.map((line, idx) => (
              <li key={idx} className="py-2.5 flex items-center justify-between">
                <span className="font-medium text-white">
                  {line.product?.name || line.productName || line.name || 'Produit'}
                </span>
                <span className="font-mono text-sky-300">
                  Quantité : {line.quantity ?? line.qty ?? 0}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {requirements.length > 0 && (
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-base font-semibold text-white mb-3">
            Besoins en matières premières
          </h2>
          <ul className="divide-y divide-slate-800/80 text-sm">
            {requirements.map((req, idx) => (
              <li key={idx} className="py-2.5 flex items-center justify-between">
                <span className="text-slate-200">
                  {req.rawMaterial?.name || req.name || req.rawMaterialId}
                </span>
                <span className="font-mono text-slate-300">
                  {req.requiredQuantity ?? req.quantity ?? 0} {req.unit || ''}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
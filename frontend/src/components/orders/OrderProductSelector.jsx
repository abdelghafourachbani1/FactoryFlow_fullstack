// src/components/orders/OrderProductSelector.jsx
import { useMemo } from 'react';

export default function OrderProductSelector({
  items,
  products,
  lineErrors = {},
  disabled = false,
  onAddLine,
  onRemoveLine,
  onChangeLine,
}) {
  const selectedProductIds = useMemo(() => {
    return new Set(
      items.map((line) => String(line.productId || '').trim()).filter(Boolean)
    );
  }, [items]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-200">
          Produits de l’ordre (min. 1, sans doublon)
        </span>
        <button
          type="button"
          onClick={onAddLine}
          disabled={disabled || items.length >= products.length}
          className="rounded-lg border border-sky-500/40 bg-sky-600/20 hover:bg-sky-600/30 disabled:opacity-40 px-3 py-1.5 text-xs font-medium text-sky-300"
        >
          + Ajouter un produit
        </button>
      </div>

      <div className="space-y-3">
        {items.map((line, index) => {
          const error = lineErrors[index] || {};

          return (
            <div
              key={index}
              className="grid grid-cols-1 sm:grid-cols-12 gap-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3 items-start"
            >
              <div className="sm:col-span-7">
                <label
                  htmlFor={`order-prod-${index}`}
                  className="block text-xs text-slate-400 mb-1"
                >
                  Produit
                </label>
                <select
                  id={`order-prod-${index}`}
                  value={line.productId}
                  onChange={(e) => onChangeLine(index, 'productId', e.target.value)}
                  disabled={disabled}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                >
                  <option value="">-- Sélectionner un produit --</option>
                  {products.map((prod) => {
                    const prodId = String(prod.id || prod._id);
                    const isDuplicateElsewhere =
                      selectedProductIds.has(prodId) &&
                      String(line.productId) !== prodId;

                    return (
                      <option
                        key={prodId}
                        value={prodId}
                        disabled={isDuplicateElsewhere}
                      >
                        {prod.reference ? `${prod.reference} — ` : ''}
                        {prod.name}
                        {isDuplicateElsewhere ? ' [Déjà ajouté]' : ''}
                      </option>
                    );
                  })}
                </select>
                {error.productId && (
                  <p className="mt-1 text-xs text-red-400">{error.productId}</p>
                )}
              </div>

              <div className="sm:col-span-3">
                <label
                  htmlFor={`order-qty-${index}`}
                  className="block text-xs text-slate-400 mb-1"
                >
                  Quantité (&gt; 0)
                </label>
                <input
                  id={`order-qty-${index}`}
                  type="number"
                  min="1"
                  step="any"
                  value={line.quantity}
                  onChange={(e) => onChangeLine(index, 'quantity', e.target.value)}
                  disabled={disabled}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                />
                {error.quantity && (
                  <p className="mt-1 text-xs text-red-400">{error.quantity}</p>
                )}
              </div>

              <div className="sm:col-span-2 sm:pt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => onRemoveLine(index)}
                  disabled={disabled || items.length <= 1}
                  className="rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-30 px-3 py-2 text-xs font-medium text-red-300"
                >
                  Retirer
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
// src/components/orders/OrderRequirementsSummary.jsx
export default function OrderRequirementsSummary({ requirements = [] }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">
          Besoins agrégés en matières premières
        </h3>
        <span className="text-xs text-slate-400">Calcul automatique</span>
      </div>

      {requirements.length === 0 ? (
        <p className="text-xs text-slate-400 py-2">
          Sélectionnez au moins un produit avec une quantité supérieure à 0 pour visualiser les besoins totaux.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2 pr-3">Matière première</th>
                <th className="py-2 pr-3">Besoin total</th>
                <th className="py-2 pr-3">Stock dispo</th>
                <th className="py-2 text-right">Disponibilité</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {requirements.map((req) => (
                <tr key={req.rawMaterialId}>
                  <td className="py-2 pr-3 font-medium text-white">
                    {req.reference ? `[${req.reference}] ` : ''}
                    {req.name}
                  </td>
                  <td className="py-2 pr-3 font-mono text-sky-300">
                    {req.requiredQuantity} {req.unit}
                  </td>
                  <td className="py-2 pr-3 font-mono text-slate-300">
                    {req.availableStock} {req.unit}
                  </td>
                  <td className="py-2 text-right">
                    {req.isSufficient ? (
                      <span className="inline-block rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-emerald-300">
                        Suffisant
                      </span>
                    ) : (
                      <span className="inline-block rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-amber-300">
                        Stock insuffisant
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
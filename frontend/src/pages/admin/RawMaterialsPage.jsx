import { useCallback, useEffect, useMemo, useState } from 'react';
import { rawMaterialsService } from '../../services/rawMaterialsService';
import {
  validateRawMaterialForm,
  validateStockEntryForm,
} from '../../utils/validators';

const INITIAL_MATERIAL_FORM = {
  reference: '',
  name: '',
  unit: 'kg',
  stock: '0',
  alertThreshold: '0',
};

const INITIAL_ENTRY_FORM = {
  materialId: '',
  quantity: '',
  note: '',
};

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

export default function RawMaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [movements, setMovements] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedMaterialId, setSelectedMaterialId] = useState('');

  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [loadingMovements, setLoadingMovements] = useState(true);
  const [pageError, setPageError] = useState('');
  const [movementsError, setMovementsError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Formulaire Création / Édition matière première
  const [editingId, setEditingId] = useState(null);
  const [materialForm, setMaterialForm] = useState(INITIAL_MATERIAL_FORM);
  const [materialErrors, setMaterialErrors] = useState({});
  const [savingMaterial, setSavingMaterial] = useState(false);

  // Formulaire Entrée de stock
  const [entryForm, setEntryForm] = useState(INITIAL_ENTRY_FORM);
  const [entryErrors, setEntryErrors] = useState({});
  const [savingEntry, setSavingEntry] = useState(false);

  const loadMaterials = useCallback(async (searchQuery = '') => {
    setLoadingMaterials(true);
    setPageError('');
    try {
      const data = await rawMaterialsService.getAll(searchQuery);
      const list = normalizeList(data);
      setMaterials(list);
    } catch (err) {
      setPageError(err.message || 'Impossible de charger les matières premières.');
    } finally {
      setLoadingMaterials(false);
    }
  }, []);

  const loadMovements = useCallback(async (materialId = '') => {
    setLoadingMovements(true);
    setMovementsError('');
    try {
      const data = await rawMaterialsService.getMovements(materialId);
      setMovements(normalizeList(data));
    } catch (err) {
      setMovementsError(err.message || 'Impossible de charger l’historique des mouvements.');
    } finally {
      setLoadingMovements(false);
    }
  }, []);

  useEffect(() => {
    loadMaterials();
    loadMovements();
  }, [loadMaterials, loadMovements]);

  // Filtrage local complémentaire si l'API renvoie tout le catalogue
  const filteredMaterials = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return materials;
    return materials.filter((item) => {
      const ref = String(item.reference || '').toLowerCase();
      const name = String(item.name || '').toLowerCase();
      return ref.includes(q) || name.includes(q);
    });
  }, [materials, search]);

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    await loadMaterials(search);
  };

  const handleResetMaterialForm = () => {
    setEditingId(null);
    setMaterialForm(INITIAL_MATERIAL_FORM);
    setMaterialErrors({});
  };

  const handleEditClick = (item) => {
    setSuccessMessage('');
    setEditingId(item.id || item._id);
    setMaterialForm({
      reference: item.reference || '',
      name: item.name || '',
      unit: item.unit || 'kg',
      stock: String(item.stock ?? item.currentStock ?? 0),
      alertThreshold: String(item.alertThreshold ?? item.minStock ?? 0),
    });
    setMaterialErrors({});
  };

  const handleMaterialSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setPageError('');

    const errors = validateRawMaterialForm(materialForm);
    setMaterialErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const payload = {
      reference: materialForm.reference.trim(),
      name: materialForm.name.trim(),
      unit: materialForm.unit.trim(),
      stock: Number(materialForm.stock),
      alertThreshold: Number(materialForm.alertThreshold),
    };

    setSavingMaterial(true);
    try {
      if (editingId) {
        await rawMaterialsService.update(editingId, payload);
        setSuccessMessage('Matière première mise à jour avec succès.');
      } else {
        await rawMaterialsService.create(payload);
        setSuccessMessage('Matière première créée avec succès.');
      }

      handleResetMaterialForm();
      await Promise.all([
        loadMaterials(search),
        loadMovements(selectedMaterialId),
      ]);
    } catch (err) {
      setPageError(
        err.message ||
          'Erreur lors de l’enregistrement (vérifiez l’unicité de la référence).'
      );
    } finally {
      setSavingMaterial(false);
    }
  };

  const handleSelectMaterialForEntry = (item) => {
    const id = item.id || item._id;
    setSuccessMessage('');
    setEntryForm((prev) => ({
      ...prev,
      materialId: String(id),
    }));
    setEntryErrors({});
  };

  const handleStockEntrySubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setPageError('');

    const errors = validateStockEntryForm(entryForm);
    setEntryErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const payload = {
      quantity: Number(entryForm.quantity),
      type: 'IN',
      ...(entryForm.note.trim() ? { note: entryForm.note.trim() } : {}),
    };

    setSavingEntry(true);
    try {
      await rawMaterialsService.addStockEntry(entryForm.materialId, payload);
      setSuccessMessage('Entrée de stock enregistrée avec succès.');
      setEntryForm((prev) => ({
        ...prev,
        quantity: '',
        note: '',
      }));
      setEntryErrors({});

      await Promise.all([
        loadMaterials(search),
        loadMovements(selectedMaterialId),
      ]);
    } catch (err) {
      setPageError(err.message || 'Impossible d’enregistrer l’entrée de stock.');
    } finally {
      setSavingEntry(false);
    }
  };

  const handleFilterMovementsByMaterial = async (materialId) => {
    setSelectedMaterialId(materialId);
    await loadMovements(materialId);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Matières premières & Stocks</h1>
        <p className="text-sm text-slate-400 mt-1">
          Gestion du catalogue des matières premières, entrées de stock et suivi des mouvements.
        </p>
      </div>

      {successMessage && (
        <div
          role="status"
          className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-300"
        >
          {successMessage}
        </div>
      )}

      {pageError && (
        <div
          role="alert"
          className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300"
        >
          {pageError}
        </div>
      )}

      {/* Formulaires : Création/Édition matière + Entrée de stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              {editingId ? 'Modifier une matière première' : 'Nouvelle matière première'}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={handleResetMaterialForm}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                Annuler l’édition
              </button>
            )}
          </div>

          <form onSubmit={handleMaterialSubmit} noValidate className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="rm-ref" className="block text-sm font-medium mb-1">
                  Référence unique
                </label>
                <input
                  id="rm-ref"
                  type="text"
                  value={materialForm.reference}
                  onChange={(e) =>
                    setMaterialForm({ ...materialForm, reference: e.target.value })
                  }
                  disabled={savingMaterial}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
                />
                {materialErrors.reference && (
                  <p className="mt-1 text-xs text-red-400">{materialErrors.reference}</p>
                )}
              </div>

              <div>
                <label htmlFor="rm-unit" className="block text-sm font-medium mb-1">
                  Unité
                </label>
                <input
                  id="rm-unit"
                  type="text"
                  value={materialForm.unit}
                  onChange={(e) =>
                    setMaterialForm({ ...materialForm, unit: e.target.value })
                  }
                  disabled={savingMaterial}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
                />
                {materialErrors.unit && (
                  <p className="mt-1 text-xs text-red-400">{materialErrors.unit}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="rm-name" className="block text-sm font-medium mb-1">
                Désignation
              </label>
              <input
                id="rm-name"
                type="text"
                value={materialForm.name}
                onChange={(e) =>
                  setMaterialForm({ ...materialForm, name: e.target.value })
                }
                disabled={savingMaterial}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
              />
              {materialErrors.name && (
                <p className="mt-1 text-xs text-red-400">{materialErrors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="rm-stock" className="block text-sm font-medium mb-1">
                  Stock initial (≥ 0)
                </label>
                <input
                  id="rm-stock"
                  type="number"
                  min="0"
                  step="any"
                  value={materialForm.stock}
                  onChange={(e) =>
                    setMaterialForm({ ...materialForm, stock: e.target.value })
                  }
                  disabled={savingMaterial || Boolean(editingId)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm disabled:opacity-60"
                />
                {materialErrors.stock && (
                  <p className="mt-1 text-xs text-red-400">{materialErrors.stock}</p>
                )}
              </div>

              <div>
                <label htmlFor="rm-threshold" className="block text-sm font-medium mb-1">
                  Seuil d’alerte (≥ 0)
                </label>
                <input
                  id="rm-threshold"
                  type="number"
                  min="0"
                  step="any"
                  value={materialForm.alertThreshold}
                  onChange={(e) =>
                    setMaterialForm({
                      ...materialForm,
                      alertThreshold: e.target.value,
                    })
                  }
                  disabled={savingMaterial}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
                />
                {materialErrors.alertThreshold && (
                  <p className="mt-1 text-xs text-red-400">
                    {materialErrors.alertThreshold}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={savingMaterial}
              className="rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 px-4 py-2 text-sm font-semibold text-white transition"
            >
              {savingMaterial
                ? 'Enregistrement...'
                : editingId
                  ? 'Mettre à jour'
                  : 'Créer la matière'}
            </button>
          </form>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-lg font-semibold text-white mb-4">
            Enregistrer une entrée de stock
          </h2>

          <form onSubmit={handleStockEntrySubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="entry-material" className="block text-sm font-medium mb-1">
                Matière première
              </label>
              <select
                id="entry-material"
                value={entryForm.materialId}
                onChange={(e) =>
                  setEntryForm({ ...entryForm, materialId: e.target.value })
                }
                disabled={savingEntry}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
              >
                <option value="">-- Sélectionner une matière --</option>
                {materials.map((m) => {
                  const id = m.id || m._id;
                  return (
                    <option key={id} value={id}>
                      {m.reference} — {m.name} ({m.stock ?? m.currentStock ?? 0} {m.unit})
                    </option>
                  );
                })}
              </select>
              {entryErrors.materialId && (
                <p className="mt-1 text-xs text-red-400">{entryErrors.materialId}</p>
              )}
            </div>

            <div>
              <label htmlFor="entry-quantity" className="block text-sm font-medium mb-1">
                Quantité d’entrée (&gt; 0)
              </label>
              <input
                id="entry-quantity"
                type="number"
                min="0.01"
                step="any"
                value={entryForm.quantity}
                onChange={(e) =>
                  setEntryForm({ ...entryForm, quantity: e.target.value })
                }
                disabled={savingEntry}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
              />
              {entryErrors.quantity && (
                <p className="mt-1 text-xs text-red-400">{entryErrors.quantity}</p>
              )}
            </div>

            <div>
              <label htmlFor="entry-note" className="block text-sm font-medium mb-1">
                Référence bon / commentaire (optionnel)
              </label>
              <input
                id="entry-note"
                type="text"
                value={entryForm.note}
                onChange={(e) =>
                  setEntryForm({ ...entryForm, note: e.target.value })
                }
                disabled={savingEntry}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={savingEntry}
              className="rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2 text-sm font-semibold text-white transition"
            >
              {savingEntry ? 'Ajout en cours...' : 'Valider l’entrée de stock'}
            </button>
          </form>
        </section>
      </div>

      {/* Catalogue & recherche */}
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-white">Catalogue des matières premières</h2>

          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              type="search"
              placeholder="Rechercher par référence ou nom..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Rechercher une matière première"
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm"
            />
            <button
              type="submit"
              className="rounded-lg bg-slate-700 hover:bg-slate-600 px-3 py-1.5 text-sm font-medium"
            >
              Rechercher
            </button>
          </form>
        </div>

        {loadingMaterials ? (
          <p className="text-sm text-slate-400 py-6">Chargement des matières premières...</p>
        ) : filteredMaterials.length === 0 ? (
          <p className="text-sm text-slate-400 py-6">
            Aucune matière première trouvée.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 pr-4">Référence</th>
                  <th className="py-2.5 pr-4">Désignation</th>
                  <th className="py-2.5 pr-4">Stock actuel</th>
                  <th className="py-2.5 pr-4">Seuil</th>
                  <th className="py-2.5 pr-4">État</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredMaterials.map((item) => {
                  const id = item.id || item._id;
                  const currentStock = Number(item.stock ?? item.currentStock ?? 0);
                  const threshold = Number(item.alertThreshold ?? item.minStock ?? 0);
                  const isLow = currentStock <= threshold;

                  return (
                    <tr key={id} className="hover:bg-slate-800/40">
                      <td className="py-3 pr-4 font-mono text-xs text-sky-300">
                        {item.reference}
                      </td>
                      <td className="py-3 pr-4 font-medium text-white">{item.name}</td>
                      <td className="py-3 pr-4">
                        {currentStock} {item.unit}
                      </td>
                      <td className="py-3 pr-4">
                        {threshold} {item.unit}
                      </td>
                      <td className="py-3 pr-4">
                        {isLow ? (
                          <span className="inline-block rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-xs font-medium text-amber-300">
                            Alerte stock bas
                          </span>
                        ) : (
                          <span className="inline-block rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
                            OK
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleEditClick(item)}
                          className="rounded bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-xs font-medium"
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectMaterialForEntry(item)}
                          className="rounded bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 px-2.5 py-1 text-xs font-medium text-emerald-300"
                        >
                          + Stock
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFilterMovementsByMaterial(String(id))}
                          className="rounded bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/40 px-2.5 py-1 text-xs font-medium text-sky-300"
                        >
                          Mouvements
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Historique des mouvements */}
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-white">
            Historique des mouvements de stock
          </h2>

          {selectedMaterialId && (
            <button
              type="button"
              onClick={() => handleFilterMovementsByMaterial('')}
              className="self-start sm:self-auto text-xs text-sky-400 hover:underline"
            >
              Afficher tous les mouvements
            </button>
          )}
        </div>

        {movementsError ? (
          <div
            role="alert"
            className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300"
          >
            {movementsError}
          </div>
        ) : loadingMovements ? (
          <p className="text-sm text-slate-400 py-4">Chargement de l’historique...</p>
        ) : movements.length === 0 ? (
          <p className="text-sm text-slate-400 py-4">
            Aucun mouvement enregistré pour le moment.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Matière</th>
                  <th className="py-2 pr-4">Quantité</th>
                  <th className="py-2">Détail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {movements.map((mv, index) => (
                  <tr key={mv.id || mv._id || index}>
                    <td className="py-2.5 pr-4 text-slate-300">
                      {mv.createdAt
                        ? new Date(mv.createdAt).toLocaleString('fr-FR')
                        : '-'}
                    </td>
                    <td className="py-2.5 pr-4 font-medium">{mv.type || 'MOUVEMENT'}</td>
                    <td className="py-2.5 pr-4">
                      {mv.rawMaterial?.name ||
                        mv.materialName ||
                        mv.rawMaterialId ||
                        '-'}
                    </td>
                    <td className="py-2.5 pr-4 font-mono">{mv.quantity ?? '-'}</td>
                    <td className="py-2.5 text-slate-400">{mv.note || mv.reason || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
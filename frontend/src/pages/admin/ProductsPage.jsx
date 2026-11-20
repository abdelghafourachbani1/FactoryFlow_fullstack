import { useCallback, useEffect, useMemo, useState } from 'react';
import { productsService } from '../../services/productsService';
import { rawMaterialsService } from '../../services/rawMaterialsService';
import { validateProductForm } from '../../utils/validators';

const createEmptyLine = () => ({
  rawMaterialId: '',
  quantity: '',
});

const INITIAL_PRODUCT_FORM = {
  reference: '',
  name: '',
  description: '',
  composition: [createEmptyLine()],
};

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_PRODUCT_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async (searchQuery = '') => {
    setLoading(true);
    setPageError('');
    try {
      const [productsRes, materialsRes] = await Promise.all([
        productsService.getAll(searchQuery),
        rawMaterialsService.getAll(),
      ]);
      setProducts(normalizeList(productsRes));
      setRawMaterials(normalizeList(materialsRes));
    } catch (err) {
      setPageError(err.message || 'Impossible de charger les produits et matières premières.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Index des matières premières pour résoudre les libellés rapidement
  const materialsById = useMemo(() => {
    const map = new Map();
    rawMaterials.forEach((m) => {
      const id = String(m.id || m._id);
      map.set(id, m);
    });
    return map;
  }, [rawMaterials]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const ref = String(p.reference || '').toLowerCase();
      const name = String(p.name || '').toLowerCase();
      return ref.includes(q) || name.includes(q);
    });
  }, [products, search]);

  const selectedMaterialIds = useMemo(() => {
    return new Set(
      form.composition
        .map((line) => String(line.rawMaterialId || '').trim())
        .filter(Boolean)
    );
  }, [form.composition]);

  const handleAddCompositionLine = () => {
    setForm((prev) => ({
      ...prev,
      composition: [...prev.composition, createEmptyLine()],
    }));
  };

  const handleRemoveCompositionLine = (indexToRemove) => {
    setForm((prev) => {
      if (prev.composition.length <= 1) return prev;
      return {
        ...prev,
        composition: prev.composition.filter((_, idx) => idx !== indexToRemove),
      };
    });
    setFormErrors((prev) => ({ ...prev, lineErrors: undefined }));
  };

  const handleLineChange = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      composition: prev.composition.map((line, idx) =>
        idx === index ? { ...line, [field]: value } : line
      ),
    }));
  };

  const handleResetForm = () => {
    setEditingId(null);
    setForm({
      reference: '',
      name: '',
      description: '',
      composition: [createEmptyLine()],
    });
    setFormErrors({});
  };

  const handleEditClick = (product) => {
    setSuccessMessage('');
    setPageError('');
    setEditingId(product.id || product._id);

    // Supporte les différents formats backend : composition / materials / bom / ingredients
    const rawLines =
      product.composition ||
      product.materials ||
      product.rawMaterials ||
      product.bom ||
      [];

    const mappedLines =
      rawLines.length > 0
        ? rawLines.map((item) => ({
            rawMaterialId: String(
              item.rawMaterialId ||
                item.materialId ||
                item.rawMaterial?.id ||
                item.rawMaterial?._id ||
                item.material?._id ||
                item.material?.id ||
                ''
            ),
            quantity: String(item.quantity ?? item.unitQuantity ?? ''),
          }))
        : [createEmptyLine()];

    setForm({
      reference: product.reference || '',
      name: product.name || '',
      description: product.description || '',
      composition: mappedLines,
    });
    setFormErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setPageError('');

    const errors = validateProductForm(form);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const payload = {
      reference: form.reference.trim(),
      name: form.name.trim(),
      ...(form.description.trim() ? { description: form.description.trim() } : {}),
      composition: form.composition.map((line) => ({
        rawMaterialId: line.rawMaterialId,
        quantity: Number(line.quantity),
      })),
    };

    setSaving(true);
    try {
      if (editingId) {
        await productsService.update(editingId, payload);
        setSuccessMessage('Produit mis à jour avec succès.');
      } else {
        await productsService.create(payload);
        setSuccessMessage('Produit créé avec succès.');
      }

      handleResetForm();
      await loadData(search);
    } catch (err) {
      setPageError(
        err.message ||
          'Erreur lors de l’enregistrement du produit (vérifiez la référence unique).'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    await loadData(search);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Produits & Composition</h1>
        <p className="text-sm text-slate-400 mt-1">
          Définissez les produits fabriqués et leur nomenclature (matières premières et quantités unitaires).
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

      {/* Formulaire création / modification produit */}
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            {editingId ? 'Modifier le produit' : 'Nouveau produit'}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={handleResetForm}
              className="text-xs text-slate-400 hover:text-white underline"
            >
              Annuler l’édition
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="prod-ref" className="block text-sm font-medium mb-1">
                Référence unique
              </label>
              <input
                id="prod-ref"
                type="text"
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
                disabled={saving}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
              />
              {formErrors.reference && (
                <p className="mt-1 text-xs text-red-400">{formErrors.reference}</p>
              )}
            </div>

            <div>
              <label htmlFor="prod-name" className="block text-sm font-medium mb-1">
                Nom du produit
              </label>
              <input
                id="prod-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                disabled={saving}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
              />
              {formErrors.name && (
                <p className="mt-1 text-xs text-red-400">{formErrors.name}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="prod-desc" className="block text-sm font-medium mb-1">
              Description (optionnelle)
            </label>
            <input
              id="prod-desc"
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              disabled={saving}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
            />
          </div>

          {/* Composition dynamique */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-200">
                Composition en matières premières (min. 1, sans doublon)
              </span>
              <button
                type="button"
                onClick={handleAddCompositionLine}
                disabled={saving || form.composition.length >= rawMaterials.length}
                className="rounded-lg border border-sky-500/40 bg-sky-600/20 hover:bg-sky-600/30 disabled:opacity-40 px-3 py-1.5 text-xs font-medium text-sky-300"
              >
                + Ajouter une matière
              </button>
            </div>

            {formErrors.composition && (
              <p className="text-xs text-red-400">{formErrors.composition}</p>
            )}

            <div className="space-y-3">
              {form.composition.map((line, index) => {
                const lineError = formErrors.lineErrors?.[index] || {};
                const selectedMat = materialsById.get(String(line.rawMaterialId));

                return (
                  <div
                    key={index}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3 items-start"
                  >
                    <div className="sm:col-span-7">
                      <label
                        htmlFor={`comp-mat-${index}`}
                        className="block text-xs text-slate-400 mb-1"
                      >
                        Matière première
                      </label>
                      <select
                        id={`comp-mat-${index}`}
                        value={line.rawMaterialId}
                        onChange={(e) =>
                          handleLineChange(index, 'rawMaterialId', e.target.value)
                        }
                        disabled={saving}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
                      >
                        <option value="">-- Choisir une matière --</option>
                        {rawMaterials.map((mat) => {
                          const matId = String(mat.id || mat._id);
                          const alreadyChosenElsewhere =
                            selectedMaterialIds.has(matId) &&
                            String(line.rawMaterialId) !== matId;

                          return (
                            <option
                              key={matId}
                              value={matId}
                              disabled={alreadyChosenElsewhere}
                            >
                              {mat.reference} — {mat.name} ({mat.unit})
                              {alreadyChosenElsewhere ? ' [Déjà sélectionnée]' : ''}
                            </option>
                          );
                        })}
                      </select>
                      {lineError.rawMaterialId && (
                        <p className="mt-1 text-xs text-red-400">
                          {lineError.rawMaterialId}
                        </p>
                      )}
                    </div>

                    <div className="sm:col-span-3">
                      <label
                        htmlFor={`comp-qty-${index}`}
                        className="block text-xs text-slate-400 mb-1"
                      >
                        Qté unitaire {selectedMat?.unit ? `(${selectedMat.unit})` : ''}
                      </label>
                      <input
                        id={`comp-qty-${index}`}
                        type="number"
                        min="0.0001"
                        step="any"
                        value={line.quantity}
                        onChange={(e) =>
                          handleLineChange(index, 'quantity', e.target.value)
                        }
                        disabled={saving}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
                      />
                      {lineError.quantity && (
                        <p className="mt-1 text-xs text-red-400">{lineError.quantity}</p>
                      )}
                    </div>

                    <div className="sm:col-span-2 sm:pt-6 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveCompositionLine(index)}
                        disabled={saving || form.composition.length <= 1}
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

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 px-5 py-2.5 text-sm font-semibold text-white transition"
          >
            {saving
              ? 'Enregistrement...'
              : editingId
                ? 'Mettre à jour le produit'
                : 'Créer le produit'}
          </button>
        </form>
      </section>

      {/* Liste des produits */}
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-white">Catalogue des produits</h2>

          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              type="search"
              placeholder="Rechercher par référence ou nom..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Rechercher un produit"
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

        {loading ? (
          <p className="text-sm text-slate-400 py-6">Chargement des produits...</p>
        ) : filteredProducts.length === 0 ? (
          <p className="text-sm text-slate-400 py-6">Aucun produit enregistré.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 pr-4">Référence</th>
                  <th className="py-2.5 pr-4">Nom</th>
                  <th className="py-2.5 pr-4">Composition</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredProducts.map((product) => {
                  const id = product.id || product._id;
                  const lines =
                    product.composition ||
                    product.materials ||
                    product.rawMaterials ||
                    product.bom ||
                    [];

                  return (
                    <tr key={id} className="hover:bg-slate-800/40 align-top">
                      <td className="py-3 pr-4 font-mono text-xs text-sky-300">
                        {product.reference}
                      </td>
                      <td className="py-3 pr-4">
                        <p className="font-medium text-white">{product.name}</p>
                        {product.description && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            {product.description}
                          </p>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {lines.length === 0 ? (
                          <span className="text-xs text-slate-500">Aucune composition</span>
                        ) : (
                          <ul className="space-y-1 text-xs text-slate-300">
                            {lines.map((line, idx) => {
                              const matId = String(
                                line.rawMaterialId ||
                                  line.materialId ||
                                  line.rawMaterial?.id ||
                                  line.rawMaterial?._id ||
                                  line.material?._id ||
                                  line.material?.id ||
                                  ''
                              );
                              const mat =
                                line.rawMaterial ||
                                line.material ||
                                materialsById.get(matId);
                              const matLabel = mat
                                ? `${mat.reference ? `[${mat.reference}] ` : ''}${mat.name}`
                                : matId;
                              const unit = mat?.unit || '';

                              return (
                                <li key={idx}>
                                  <span className="font-medium text-white">
                                    {line.quantity ?? line.unitQuantity} {unit}
                                  </span>{' '}
                                  de {matLabel}
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </td>
                      <td className="py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleEditClick(product)}
                          className="rounded bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200"
                        >
                          Modifier
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
    </div>
  );
}
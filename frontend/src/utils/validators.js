export function validateProductForm(values) {
  const errors = {};
  const reference = values.reference.trim();
  const name = values.name.trim();
  const lines = Array.isArray(values.composition) ? values.composition : [];

  if (!reference) {
    errors.reference = 'La référence du produit est obligatoire.';
  }

  if (!name) {
    errors.name = 'Le nom du produit est obligatoire.';
  }

  if (lines.length === 0) {
    errors.composition = 'Un produit doit contenir au moins une matière première.';
    return errors;
  }

  const seenMaterialIds = new Set();
  const lineErrors = {};

  lines.forEach((line, index) => {
    const currentLineError = {};
    const materialId = String(line.rawMaterialId || '').trim();
    const quantity = Number(line.quantity);

    if (!materialId) {
      currentLineError.rawMaterialId = 'Sélectionnez une matière première.';
    } else if (seenMaterialIds.has(materialId)) {
      currentLineError.rawMaterialId = 'Cette matière première est déjà présente dans la composition.';
    } else {
      seenMaterialIds.add(materialId);
    }

    if (line.quantity === '' || Number.isNaN(quantity) || quantity <= 0) {
      currentLineError.quantity = 'La quantité unitaire doit être strictement supérieure à 0.';
    }

    if (Object.keys(currentLineError).length > 0) {
      lineErrors[index] = currentLineError;
    }
  });

  if (Object.keys(lineErrors).length > 0) {
    errors.lineErrors = lineErrors;
  }

  return errors;
}
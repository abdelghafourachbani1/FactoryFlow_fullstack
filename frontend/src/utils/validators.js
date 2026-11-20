export function validateCreateOrderForm(values) {
  const errors = {};
  const items = Array.isArray(values.items) ? values.items : [];

  if (!String(values.operatorId || '').trim()) {
    errors.operatorId = 'Veuillez sélectionner un opérateur.';
  }

  if (items.length === 0) {
    errors.items = 'L’ordre doit contenir au moins un produit.';
    return errors;
  }

  const seenProductIds = new Set();
  const lineErrors = {};

  items.forEach((line, index) => {
    const currentLineError = {};
    const productId = String(line.productId || '').trim();
    const quantity = Number(line.quantity);

    if (!productId) {
      currentLineError.productId = 'Sélectionnez un produit.';
    } else if (seenProductIds.has(productId)) {
      currentLineError.productId = 'Ce produit est déjà présent dans cet ordre.';
    } else {
      seenProductIds.add(productId);
    }

    if (line.quantity === '' || Number.isNaN(quantity) || quantity <= 0) {
      currentLineError.quantity = 'La quantité doit être strictement supérieure à 0.';
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
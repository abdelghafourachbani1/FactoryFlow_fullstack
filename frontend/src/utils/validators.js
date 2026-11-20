export function validateRawMaterialForm(values) {
  const errors = {};
  const reference = values.reference.trim();
  const name = values.name.trim();
  const unit = values.unit.trim();
  const initialStock = Number(values.stock);
  const alertThreshold = Number(values.alertThreshold);

  if (!reference) {
    errors.reference = 'La référence est obligatoire.';
  }

  if (!name) {
    errors.name = 'Le libellé de la matière première est obligatoire.';
  }

  if (!unit) {
    errors.unit = 'L’unité (ex. kg, L, unité) est obligatoire.';
  }

  if (values.stock === '' || Number.isNaN(initialStock) || initialStock < 0) {
    errors.stock = 'Le stock initial doit être supérieur ou égal à 0.';
  }

  if (
    values.alertThreshold === '' ||
    Number.isNaN(alertThreshold) ||
    alertThreshold < 0
  ) {
    errors.alertThreshold = 'Le seuil d’alerte doit être supérieur ou égal à 0.';
  }

  return errors;
}

export function validateStockEntryForm(values) {
  const errors = {};
  const quantity = Number(values.quantity);

  if (!values.materialId) {
    errors.materialId = 'Veuillez sélectionner une matière première.';
  }

  if (values.quantity === '' || Number.isNaN(quantity) || quantity <= 0) {
    errors.quantity = 'La quantité d’entrée doit être strictement supérieure à 0.';
  }

  return errors;
}
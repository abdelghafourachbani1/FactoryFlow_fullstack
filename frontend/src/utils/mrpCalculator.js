// src/utils/mrpCalculator.js

function extractProductComposition(product) {
  if (!product) return [];
  return (
    product.composition ||
    product.materials ||
    product.rawMaterials ||
    product.bom ||
    []
  );
}

function getMaterialId(line) {
  return String(
    line.rawMaterialId ||
      line.materialId ||
      line.rawMaterial?.id ||
      line.rawMaterial?._id ||
      line.material?.id ||
      line.material?._id ||
      ''
  );
}

/**
 * Calcule les besoins agrégés en matières premières pour un ordre multi-produits.
 * @param {Array<{ productId: string, quantity: number|string }>} orderItems
 * @param {Array<object>} productsCatalog
 * @param {Array<object>} rawMaterialsCatalog
 */
export function calculateOrderRequirements(
  orderItems = [],
  productsCatalog = [],
  rawMaterialsCatalog = []
) {
  const productsMap = new Map();
  productsCatalog.forEach((p) => {
    productsMap.set(String(p.id || p._id), p);
  });

  const materialsMap = new Map();
  rawMaterialsCatalog.forEach((m) => {
    materialsMap.set(String(m.id || m._id), m);
  });

  const aggregated = new Map();

  orderItems.forEach((orderLine) => {
    const prodId = String(orderLine.productId || '');
    const orderQty = Number(orderLine.quantity);

    if (!prodId || Number.isNaN(orderQty) || orderQty <= 0) {
      return;
    }

    const product = productsMap.get(prodId);
    if (!product) return;

    const composition = extractProductComposition(product);

    composition.forEach((compLine) => {
      const matId = getMaterialId(compLine);
      const unitQty = Number(compLine.quantity ?? compLine.unitQuantity ?? 0);

      if (!matId || Number.isNaN(unitQty) || unitQty <= 0) {
        return;
      }

      const requiredQty = orderQty * unitQty;
      const catalogMaterial = materialsMap.get(matId);
      const embeddedMaterial = compLine.rawMaterial || compLine.material || {};

      const existing = aggregated.get(matId);
      if (existing) {
        existing.requiredQuantity += requiredQty;
      } else {
        const availableStock = Number(
          catalogMaterial?.stock ??
            catalogMaterial?.currentStock ??
            embeddedMaterial?.stock ??
            0
        );

        aggregated.set(matId, {
          rawMaterialId: matId,
          reference:
            catalogMaterial?.reference || embeddedMaterial?.reference || '',
          name:
            catalogMaterial?.name ||
            embeddedMaterial?.name ||
            `Matière ${matId}`,
          unit: catalogMaterial?.unit || embeddedMaterial?.unit || '',
          requiredQuantity: requiredQty,
          availableStock,
        });
      }
    });
  });

  return Array.from(aggregated.values()).map((entry) => ({
    ...entry,
    requiredQuantity: Number(entry.requiredQuantity.toFixed(6)),
    isSufficient: entry.availableStock >= entry.requiredQuantity,
  }));
}
// src/hooks/useOrderRequirements.js
import { useMemo } from 'react';
import { calculateOrderRequirements } from '../utils/mrpCalculator';

export function useOrderRequirements(orderItems, productsCatalog, rawMaterialsCatalog) {
  return useMemo(
    () =>
      calculateOrderRequirements(
        orderItems,
        productsCatalog,
        rawMaterialsCatalog
      ),
    [orderItems, productsCatalog, rawMaterialsCatalog]
  );
}
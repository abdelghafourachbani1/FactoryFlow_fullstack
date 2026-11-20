import api from './api';

export const rawMaterialsService = {
  async getAll(search = '') {
    const params = search.trim() ? { search: search.trim() } : {};
    const response = await api.get('/raw-materials', { params });
    return response.data;
  },

  async create(payload) {
    const response = await api.post('/raw-materials', payload);
    return response.data;
  },

  async update(id, payload) {
    const response = await api.put(`/raw-materials/${id}`, payload);
    return response.data;
  },

  async addStockEntry(id, payload) {
    // Exemple d'endpoint : POST /raw-materials/:id/stock-entries ou /stock/in
    const response = await api.post(`/raw-materials/${id}/stock-entries`, payload);
    return response.data;
  },

  async getMovements(materialId = '') {
    const params = materialId ? { rawMaterialId: materialId } : {};
    const response = await api.get('/stock-movements', { params });
    return response.data;
  },
};
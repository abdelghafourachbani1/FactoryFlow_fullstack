import api from './api';

export const productsService = {
  async getAll(search = '') {
    const params = search.trim() ? { search: search.trim() } : {};
    const response = await api.get('/products', { params });
    return response.data;
  },

  async create(payload) {
    const response = await api.post('/products', payload);
    return response.data;
  },

  async update(id, payload) {
    const response = await api.put(`/products/${id}`, payload);
    return response.data;
  },
};
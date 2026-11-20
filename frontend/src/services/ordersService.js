import api from './api';

export const ordersService = {
  async getAll(params = {}) {
    const response = await api.get('/orders', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },
};
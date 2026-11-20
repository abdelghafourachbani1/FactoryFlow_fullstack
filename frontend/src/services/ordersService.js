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

  async create(payload) {
    const response = await api.post('/orders', payload);
    return response.data;
  },

  async getOperators() {
    // Adapte selon ta route backend (ex: '/users?role=OPERATOR' ou '/operators')
    const response = await api.get('/users', { params: { role: 'OPERATOR' } });
    return response.data;
  },
};
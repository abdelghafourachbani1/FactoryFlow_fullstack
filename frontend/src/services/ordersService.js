import api from './api';

export const ordersService = {
  async getAll(params = {}) {
    const response = await api.get('/orders', { params });
    return response.data;
  },

  async getMyOrders(params = {}) {
    // Adapte selon ton backend (ex: '/orders/my' ou '/orders?mine=true')
    const response = await api.get('/orders/my', { params });
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

  async startOrder(id) {
    // Adapte selon ta route backend (ex: PATCH /orders/:id/start ou POST /orders/:id/start)
    const response = await api.patch(`/orders/${id}/start`);
    return response.data;
  },

  async completeOrder(id) {
    // Adapte selon ta route backend (ex: PATCH /orders/:id/complete ou POST /orders/:id/complete)
    const response = await api.patch(`/orders/${id}/complete`);
    return response.data;
  },

  async getOperators() {
    const response = await api.get('/users', { params: { role: 'OPERATOR' } });
    return response.data;
  },
};
import api from './api';

export const authService = {
  async login(credentials) {
    // Vérifie le chemin exact dans ta doc backend (ex: '/auth/login' ou '/login')
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
};
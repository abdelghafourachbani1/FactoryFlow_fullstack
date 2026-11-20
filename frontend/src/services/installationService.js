import api from './api';

export const installationService = {
  async getStatus() {
    const response = await api.get('/installation/status');
    return response.data;
  },

  async initializeFirstAdmin(payload) {
    // Vérifie le chemin exact dans ta doc backend (ex: '/installation/init' ou '/installation')
    const response = await api.post('/installation/init', payload);
    return response.data;
  },
};
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { setBearerToken, setUnauthorizedHandler } from '../services/api';
import { authService } from '../services/authService';
import { installationService } from '../services/installationService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isInstalled, setIsInstalled] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setBearerToken(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
    });
  }, [logout]);

  const checkInstallationStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await installationService.getStatus();
      // Adapte selon la clé renvoyée par ton backend : data.installed / data.isInstalled
      const installed = Boolean(data?.installed ?? data?.isInstalled ?? false);
      setIsInstalled(installed);
      return installed;
    } catch {
      // En cas d'erreur sur le check initial, on laisse l'écran d'erreur/connexion gérable
      setIsInstalled(true);
      return true;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkInstallationStatus();
  }, [checkInstallationStatus]);

  const login = useCallback(async (credentials) => {
    const data = await authService.login(credentials);
    const receivedToken = data?.token || data?.accessToken || null;
    const receivedUser = data?.user || null;

    if (!receivedToken || !receivedUser) {
      throw new Error('Réponse de connexion invalide reçue du serveur');
    }

    setToken(receivedToken);
    setUser(receivedUser);
    setBearerToken(receivedToken);

    return receivedUser;
  }, []);

  const initializeAdmin = useCallback(async (payload) => {
    const data = await installationService.initializeFirstAdmin(payload);
    setIsInstalled(true);

    // Si le backend retourne directement un token + user à l'initialisation :
    if (data?.token && data?.user) {
      setToken(data.token);
      setUser(data.user);
      setBearerToken(data.token);
    }

    return data;
  }, []);

  const role = user?.role || null;
  const isAuthenticated = Boolean(token && user);

  const value = useMemo(
    () => ({
      user,
      token,
      role,
      isAuthenticated,
      isInstalled,
      isLoading,
      login,
      logout,
      initializeAdmin,
      checkInstallationStatus,
    }),
    [
      user,
      token,
      role,
      isAuthenticated,
      isInstalled,
      isLoading,
      login,
      logout,
      initializeAdmin,
      checkInstallationStatus,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
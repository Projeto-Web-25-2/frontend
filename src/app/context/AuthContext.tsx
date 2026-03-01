import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from 'react';
import { authService } from '../services';
import type { UserResponse } from '../services';

interface AuthContextType {
  user: UserResponse | null;
  accessToken: string | null;
  refreshToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (fullName: string, email: string, password: string, cpf: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'compia.auth';

interface PersistedAuthState {
  accessToken: string;
  refreshToken: string | null;
  user: UserResponse;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearAuthState = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  const persistAuthState = useCallback(
    (nextAccessToken: string, nextRefreshToken: string | null, profile: UserResponse) => {
      setUser(profile);
      setAccessToken(nextAccessToken);
      setRefreshToken(nextRefreshToken);
      const payload: PersistedAuthState = {
        accessToken: nextAccessToken,
        refreshToken: nextRefreshToken,
        user: profile,
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
    },
    []
  );

  const fetchAndPersistProfile = useCallback(
    async (token: string, currentRefreshToken: string | null) => {
      const profile = await authService.getProfile(token);
      persistAuthState(token, currentRefreshToken, {
        ...profile,
        role: profile.role,
      });
    },
    [persistAuthState]
  );

  const bootstrapAuth = useCallback(async () => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) {
      setIsLoading(false);
      return;
    }

    try {
      const parsed: PersistedAuthState = JSON.parse(stored);
      setUser(parsed.user);
      setAccessToken(parsed.accessToken);
      setRefreshToken(parsed.refreshToken ?? null);

      try {
        await fetchAndPersistProfile(parsed.accessToken, parsed.refreshToken ?? null);
      } catch (profileError) {
        if (parsed.refreshToken) {
          try {
            const { access_token } = await authService.refreshToken(parsed.refreshToken);
            await fetchAndPersistProfile(access_token, parsed.refreshToken);
          } catch (refreshError) {
            console.error('Erro ao atualizar sessão', refreshError);
            clearAuthState();
          }
        } else {
          clearAuthState();
        }
      }
    } catch (error) {
      console.error('Erro ao carregar sessão', error);
      clearAuthState();
    } finally {
      setIsLoading(false);
    }
  }, [clearAuthState, fetchAndPersistProfile]);

  useEffect(() => {
    bootstrapAuth();
  }, [bootstrapAuth]);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await authService.login({ email, password });
      await fetchAndPersistProfile(response.access_token, response.refresh_token);
    },
    [fetchAndPersistProfile]
  );

  const signup = useCallback(
    async (fullName: string, email: string, password: string, cpf: string) => {
      await authService.signup({
        full_name: fullName,
        email,
        password,
        cpf,
      });
      await login(email, password);
    },
    [login]
  );

  const logout = useCallback(async () => {
    if (accessToken) {
      try {
        await authService.logout(accessToken);
      } catch (error) {
        console.error('Erro ao sair', error);
      }
    }
    clearAuthState();
  }, [accessToken, clearAuthState]);

  const refreshProfile = useCallback(async () => {
    if (!accessToken) return;
    try {
      await fetchAndPersistProfile(accessToken, refreshToken);
    } catch (error) {
      if (refreshToken) {
        try {
          const { access_token } = await authService.refreshToken(refreshToken);
          await fetchAndPersistProfile(access_token, refreshToken);
        } catch (refreshError) {
          console.error('Erro ao renovar token', refreshError);
          clearAuthState();
        }
      } else {
        clearAuthState();
      }
    }
  }, [accessToken, refreshToken, fetchAndPersistProfile, clearAuthState]);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        login,
        signup,
        logout,
        refreshProfile,
        isAuthenticated: !!user && !!accessToken,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

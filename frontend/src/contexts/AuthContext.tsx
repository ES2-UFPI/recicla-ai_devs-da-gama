
import { useState, useEffect } from 'react';
import type { AuthContextType, User, LoginCredentials, RegisterData, AuthResponse } from '../types/auth';
import { AuthContext } from './AuthContext';
import api from '../services/api';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Valida sessão via cookie httpOnly ao carregar a aplicação
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<User>('/auth/me');
        setUser(data);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Login usando cookie httpOnly
  async function login(credentials: LoginCredentials) {
    setIsLoading(true);
    try {
      await api.post<AuthResponse | unknown>('/auth/login', credentials);
      // Cookie httpOnly é definido pelo backend. Buscar usuário atual.
      const { data: me } = await api.get<User>('/auth/me');
      setUser(me);
    } catch {
      throw new Error('Credenciais inválidas');
    } finally {
      setIsLoading(false);
    }
  }

  // Registro usando cookie httpOnly
  async function register(data: RegisterData) {
    setIsLoading(true);
    try {
      await api.post<AuthResponse | unknown>('/auth/register', data);
      // Dependendo da sua regra de negócio, o backend pode já autenticar após registro
      try {
        const { data: me } = await api.get<User>('/auth/me');
        setUser(me);
      } catch {
        // Caso não autentique automaticamente, usuário permanece deslogado
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Logout via backend e limpa estado local
  async function logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // mesmo em erro de rede, limpar estado local
    } finally {
      setUser(null);
    }
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
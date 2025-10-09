
import { useState, useEffect } from 'react';
import type { AuthContextType, User, LoginCredentials, RegisterData } from '../types/auth';
import { cookies } from '../utils/cookies';
import { AuthContext } from './AuthContext';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verifica se existe token ao carregar a aplicação
  useEffect(() => {
    const token = cookies.getToken();
    
    if (token) {
      // TODO: Quando backend estiver pronto, validar o token com a API
      // Por enquanto, usar dados mock
      const mockUser: User = {
        id: '1',
        name: 'Demo User',
        email: 'demo@recicla.ai',
        telefone: '(86) 99999-9999',
        role: 'produtor',
        estado: 'PI',
        cidade: 'Teresina',
      };
      setUser(mockUser);
    }
    
    setIsLoading(false);
  }, []);

  // Login (MOCK - substitua pela chamada real à API)
  async function login(credentials: LoginCredentials) {
    setIsLoading(true);
    // Simulação de delay de rede
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Validação mock (substitua pela chamada real)
    if (credentials.email === 'demo@recicla.ai' && credentials.password === '12345678') {
      const mockToken = 'mock-jwt-token-12345';
      const mockUser: User = {
        id: '1',
        name: 'Demo User',
        email: 'demo@recicla.ai',
        telefone: '(86) 99999-9999',
        role: 'produtor',
        estado: 'PI',
        cidade: 'Teresina',
      };
      cookies.setToken(mockToken);
      setUser(mockUser);
    } else {
      setIsLoading(false);
      throw new Error('Credenciais inválidas');
    }
    setIsLoading(false);
  }

  // Registro (MOCK - substitua pela chamada real à API)
  async function register(data: RegisterData) {
    setIsLoading(true);
    // Simulação de delay de rede
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Mock de registro bem-sucedido
    const mockToken = 'mock-jwt-token-67890';
    const mockUser: User = {
      id: '2',
      name: data.name,
      email: data.email,
      telefone: data.telefone,
      role: data.role as 'produtor' | 'coletor' | 'receptor',
      estado: data.estado,
      cidade: data.cidade,
    };
    cookies.setToken(mockToken);
    setUser(mockUser);
    setIsLoading(false);
  }

  // Logout
  function logout() {
    cookies.removeToken();
    setUser(null);
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
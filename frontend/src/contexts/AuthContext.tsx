
import { useState, useEffect } from 'react';
import type { AuthContextType, User, LoginCredentials, RegisterData } from '../types/auth';
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
        const { data } = await api.get<{ name: string; email: string; role_id: string }>('/auth/me');
        setUser(mapUserFromMe(data));
      } catch {
        // Usuário não autenticado ou sessão expirada - comportamento esperado
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
      // Backend espera { credential, password }
      await api.post('/auth/login', {
        credential: credentials.email,
        password: credentials.password,
      });
      // Cookie httpOnly é definido pelo backend. Buscar usuário atual.
      const { data: me } = await api.get<{ name: string; email: string; role_id: string }>('/auth/me');
      setUser(mapUserFromMe(me));
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
      // O backend atual expõe criação de usuário em /users (não autentica automaticamente)
      // Mapear RegisterData -> UserCreate (backend): name, email, phone, password, role_id, cidade_id, estado_id
      await api.post('/users', {
        name: data.name,
        email: data.email,
        phone: data.telefone,
        password: data.senha,
        role_id: data.role,
        cidade_id: data.cidade,
        estado_id: data.estado,
      });
      // Após cadastro, opcionalmente fazer login automático
      try {
        await login({ email: data.email, password: data.senha });
      } catch {
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

// Helpers
function mapUserFromMe(me: { name: string; email: string; role_id: string }): User {
  // Backend retorna apenas name, email, role_id no /auth/me atualmente.
  // Preenchemos campos adicionais com valores vazios até que endpoints de perfil estejam disponíveis.
  return {
    id: '',
    name: me.name,
    email: me.email,
    telefone: '',
    role: mapRoleIdToRole(me.role_id),
    estado: '',
    cidade: '',
  };
}

function mapRoleIdToRole(roleId: string): User['role'] {
  // Adeque este mapeamento quando os role_ids reais forem definidos.
  const normalized = roleId?.toLowerCase?.() ?? '';
  if (normalized.includes('prod')) return 'produtor';
  if (normalized.includes('col')) return 'coletor';
  if (normalized.includes('rec')) return 'receptor';
  // default
  return 'produtor';
}
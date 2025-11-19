
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
        // Tenta buscar usuário atual
        // O interceptor do axios tentará refresh automaticamente se o access_token estiver expirado
        const { data } = await api.get<UserMeResponse>('/auth/me');
        setUser(mapUserFromMe(data));
      } catch {
        // Se falhou mesmo após tentativa de refresh, usuário não está autenticado
        // Isso pode acontecer se:
        // 1. Não há tokens (primeira visita)
        // 2. Access token expirado E refresh token também expirado/inválido
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Login usando cookie httpOnly
  async function login(credentials: LoginCredentials) {
    // Backend espera { credential, password }
    await api.post('/auth/login', {
      credential: credentials.email,
      password: credentials.password,
    });
    // Cookie httpOnly é definido pelo backend. Buscar usuário atual.
    const { data: me } = await api.get<UserMeResponse>('/auth/me');
    setUser(mapUserFromMe(me));
    // ⚠️ IMPORTANTE: Não manipular isLoading aqui!
    // O componente de Login já gerencia seu próprio loading state.
    // Se houver erro, ele propaga automaticamente para o componente tratar.
  }

  // Registro usando cookie httpOnly
  async function register(data: RegisterData) {
    // O backend atual expõe criação de usuário em /users (não autentica automaticamente)
    // Mapear RegisterData -> UserCreate (backend): name, email, phone, password, role_id, cidade_id, estado_id
    const payload: any = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: data.password,
      role_id: data.role_id,
      cidade_id: data.cidade_id,
      estado_id: data.estado_id,
    };

    // Adicionar campos específicos de cada role
    if (data.addresses) {
      payload.addresses = data.addresses;
    }
    if (data.is_business !== undefined) {
      payload.is_business = data.is_business;
    }
    if (data.cnpj) {
      payload.cnpj = data.cnpj;
    }
    if (data.points !== undefined) {
      payload.points = data.points;
    }
    if (data.ranking !== undefined) {
      payload.ranking = data.ranking;
    }
    if (data.inventory !== undefined) {
      payload.inventory = data.inventory;
    }
    if (data.accepted_material !== undefined) {
      payload.accepted_material = data.accepted_material;
    }

    await api.post('/users', payload);
    // Após cadastro, opcionalmente fazer login automático
    try {
      await login({ email: data.email, password: data.password });
    } catch {
      setUser(null);
    }
    // ⚠️ IMPORTANTE: Não manipular isLoading aqui!
    // O componente CadastroForm já gerencia seu próprio loading state.
    // Se houver erro, ele propaga automaticamente para o componente tratar.
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
interface UserMeResponse {
  id: string;
  name: string;
  email: string;
  role_id: string;
  telefone?: string;
  cidade_id?: string;
  estado_id?: string;
  points?: number;
  ranking?: number;
}

function mapUserFromMe(me: UserMeResponse): User {
  return {
    id: me.id,
    name: me.name,
    email: me.email,
    telefone: me.telefone,
    role: mapRoleIdToRole(me.role_id),
    estado: me.estado_id || '',
    cidade: me.cidade_id || '',
    points: me.points,
    ranking: me.ranking,
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
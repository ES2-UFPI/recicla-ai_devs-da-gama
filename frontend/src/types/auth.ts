// Tipos relacionados à autenticação
import type { Endereco } from './endereco';

export interface User {
  id: string;
  name: string;
  email: string;
  telefone?: string;
  role: 'produtor' | 'coletor' | 'receptor';
  estado: string; // estado_id retornado pela API
  cidade: string; // cidade_id retornado pela API
  points?: number; // Pontuação do produtor (ranking)
  ranking?: number; // Posição no ranking geral
  // Adicione outros campos conforme o backend definir
  // Ex: avatar?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// Dados enviados para o backend ao cadastrar usuário
// Suporta os 3 tipos de usuário (builder pattern)
export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role_id: 'produtor' | 'coletor' | 'receptor';
  cidade_id: string;
  estado_id: string;
  
  // Campos específicos de Produtor
  addresses?: Endereco[];
  is_business?: boolean;
  cnpj?: string;
  points?: number;
  ranking?: number;
  
  // Campo específico de Coletor
  inventory?: string[];
  
  // Campo específico de Receptor
  accepted_material?: string[];
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}
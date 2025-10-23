// Tipos relacionados à autenticação

export interface User {
  id: string;
  name: string;
  email: string;
  telefone: string;
  role: 'produtor' | 'coletor' | 'receptor';
  estado: string;
  cidade: string;
  // Adicione outros campos conforme o backend definir
  // Ex: avatar?: string; role?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// Dados enviados para o backend ao cadastrar usuário
export interface RegisterData {
  name: string;
  email: string;
  senha: string;
  telefone: string;
  role: string;
  cidade: string;
  estado: string;
  // Não incluir campos de UI como confirmacaoSenha aqui
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
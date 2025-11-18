import type { Endereco } from '../../types/endereco';

export type RoleType = 'produtor' | 'coletor' | 'receptor';

export type BuilderStep = 'select-type' | 'form';

export interface UserTypeOption {
  value: RoleType;
  title: string;
  description: string;
  icon: string;
  color: string;
}

// Dados comuns a todos os usuários
export interface BaseUserData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role_id: RoleType;
  cidade_id: string;
  estado_id: string;
}

// Dados específicos de Produtor
export interface ProdutorData extends BaseUserData {
  role_id: 'produtor';
  addresses: Endereco[];
  is_business: boolean;
  cnpj?: string;
  points?: number;
  ranking?: number;
}

// Dados específicos de Coletor
export interface ColetorData extends BaseUserData {
  role_id: 'coletor';
  inventory?: string[];
  addresses?: Endereco[];
}

// Dados específicos de Receptor
export interface ReceptorData extends BaseUserData {
  role_id: 'receptor';
  addresses: Endereco[];
  accepted_material: string[];
}

// Union type para representar qualquer tipo de usuário
export type UserBuilderData = ProdutorData | ColetorData | ReceptorData;

// Estado do formulário com campos de UI (senha confirmação, etc)
export interface FormUIState {
  confirmacaoSenha: string;
  estadoSigla: string; // UF selecionada
  cidadeNome: string; // Nome da cidade selecionada
}

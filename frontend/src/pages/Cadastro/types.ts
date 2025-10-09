export type Role = { value: string; label: string };

// Tipos específicos do formulário de cadastro (inclui campos de UI)
export interface CadastroFormData {
  nome: string;
  email: string;
  telefone: string;
  senha: string;
  confirmacaoSenha: string;
  role: string;
  cidade: string;
  estado: string;
}

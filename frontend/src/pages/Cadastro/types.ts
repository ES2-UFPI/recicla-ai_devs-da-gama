export type Role = { value: string; label: string };

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

// Funções de validação para o formulário de cadastro

export function validateNome(nome: string): string {
  if (!nome.trim()) return 'Nome é obrigatório.';
  if (nome.trim().length < 3) return 'Nome deve ter pelo menos 3 letras.';
  if (!/^[A-Za-zÀ-ÿ\s]+$/.test(nome)) return 'Nome deve conter apenas letras.';
  return '';
}

export function validateEmail(email: string): string {
  if (!email.trim()) return 'E-mail é obrigatório.';
  if (!/^[\w-.]+@[\w-]+\.[\w-.]+$/.test(email)) return 'E-mail inválido.';
  return '';
}

export function validateTelefone(telefone: string): string {
  const onlyDigits = telefone.replace(/\D/g, '');
  if (!onlyDigits) return 'Telefone é obrigatório.';
  if (onlyDigits.length < 10) return 'Telefone deve ter pelo menos 10 dígitos.';
  return '';
}

export function validateSenha(senha: string): string {
  if (!senha) return 'Senha é obrigatória.';
  if (senha.length < 8) return 'Senha deve ter pelo menos 8 caracteres.';
  if (!/[A-Za-z]/.test(senha) || !/\d/.test(senha)) return 'Senha deve conter pelo menos uma letra e um número.';
  return '';
}

export function validateConfirmacaoSenha(senha: string, confirmacao: string): string {
  if (!confirmacao) return 'Confirme a senha.';
  if (confirmacao.length < 8) return 'Confirmação deve ter pelo menos 8 caracteres.';
  if (!/[A-Za-z]/.test(confirmacao) || !/\d/.test(confirmacao)) return 'Confirmação deve conter pelo menos uma letra e um número.';
  if (senha !== confirmacao) return 'As senhas não coincidem.';
  return '';
}

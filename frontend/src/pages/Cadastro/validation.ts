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
  if (!/[A-Z]/.test(senha)) return 'Senha deve conter pelo menos uma letra maiúscula.';
  if (!/\d/.test(senha)) return 'Senha deve conter pelo menos um número.';
  if (!/[!@#$%&*]/.test(senha)) return 'Senha deve conter pelo menos um caractere especial (!@#$%&*).';
  return '';
}

export function validateConfirmacaoSenha(senha: string, confirmacao: string): string {
  if (!confirmacao) return 'Confirme a senha.';
  if (senha !== confirmacao) return 'As senhas não coincidem.';
  return '';
}

export function validateCNPJ(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, '');
  
  if (!cleaned) return 'CNPJ é obrigatório.';
  if (cleaned.length !== 14) return 'CNPJ deve ter 14 dígitos.';
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleaned)) return 'CNPJ inválido.';
  
  // Validação dos dígitos verificadores
  let soma = 0;
  let peso = 5;
  
  // Primeiro dígito verificador
  for (let i = 0; i < 12; i++) {
    soma += parseInt(cleaned.charAt(i)) * peso;
    peso = peso === 2 ? 9 : peso - 1;
  }
  
  let digito1 = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (digito1 !== parseInt(cleaned.charAt(12))) return 'CNPJ inválido.';
  
  // Segundo dígito verificador
  soma = 0;
  peso = 6;
  
  for (let i = 0; i < 13; i++) {
    soma += parseInt(cleaned.charAt(i)) * peso;
    peso = peso === 2 ? 9 : peso - 1;
  }
  
  let digito2 = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (digito2 !== parseInt(cleaned.charAt(13))) return 'CNPJ inválido.';
  
  return '';
}

export function validateEndereco(endereco: {
  cep: string;
  logradouro: string;
  numero: string;
  latitude: string;
  longitude: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  
  if (!endereco.cep || endereco.cep.replace(/\D/g, '').length !== 8) {
    errors.cep = 'CEP inválido';
  }
  
  if (!endereco.logradouro?.trim()) {
    errors.logradouro = 'Logradouro é obrigatório';
  }
  
  if (!endereco.numero?.trim()) {
    errors.numero = 'Número é obrigatório';
  }
  
  if (!endereco.latitude || !endereco.longitude) {
    errors.latitude = 'Localização não foi encontrada';
  }
  
  return errors;
}

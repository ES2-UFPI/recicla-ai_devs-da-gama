// Validação de e-mail para o Login
export function validateEmail(email: string): string {
  if (!email.trim()) return 'E-mail é obrigatório.';
  if (!/^[\w-.]+@[\w-]+\.[\w-.]+$/.test(email)) return 'E-mail inválido.';
  return '';
}

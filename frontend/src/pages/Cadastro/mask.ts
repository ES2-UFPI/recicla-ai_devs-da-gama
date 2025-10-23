// Função utilitária para máscara de telefone
export function maskTelefone(value: string): string {
  let digits = value.replace(/\D/g, '');
  if (digits.length > 11) digits = digits.slice(0, 11);
  if (digits.length > 10) {
    // Celular: (XX) XXXXX-XXXX (11 dígitos)
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (digits.length > 6) {
    // Fixo: (XX) XXXX-XXXX (10 dígitos)
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
  } else if (digits.length > 2) {
    return digits.replace(/(\d{2})(\d{0,4})/, '($1) $2');
  } else {
    return digits.replace(/(\d{0,2})/, '($1');
  }
}

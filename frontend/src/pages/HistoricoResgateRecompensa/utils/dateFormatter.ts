export function formatarData(data: string): string {
  // Converte de UTC para timezone local do usuário
  return new Date(data).toLocaleString('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

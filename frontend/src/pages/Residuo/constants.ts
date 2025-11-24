import type { ResiduoStatus, UnidadeMedida } from '../../types/residuo';
import type { ChipProps } from '@mui/material';

export const statusColor: Record<ResiduoStatus, ChipProps['color']> = {
  DISPONIVEL: 'secondary',
  AGENDADO: 'warning',
  COLETADO: 'info',
  ENTREGUE: 'success',
  CANCELADO: 'error',
  REJEITADO: 'error',
  RESERVADO: 'primary',
};

// Cores padronizadas de reciclagem (seguindo convenção internacional)
export const categoriaColor: Record<string, string> = {
  papel: '#2196F3', // Azul
  plastico: '#F44336', // Vermelho
  plástico: '#F44336', // Vermelho (com acento)
  vidro: '#4CAF50', // Verde
  metal: '#FFC107', // Amarelo
  eletronico: '#FF9800', // Laranja
  eletrônico: '#FF9800', // Laranja (com acento)
};

// Backend só aceita 'kg' ou 'unidade'
export const unidades: UnidadeMedida[] = ['kg', 'unidade'];

/**
 * Formata uma data ISO (UTC) para exibição no horário local de Brasília
 * @param iso - String ISO em UTC (ex: "2025-10-22T13:00:00.000Z")
 * @returns String formatada no horário local (ex: "22/10/2025 às 10:00")
 */
export const formatarData = (iso: string) => {
  const date = new Date(iso);
  // Formatar usando toLocaleString para garantir conversão correta de timezone
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).replace(',', ' às');
};

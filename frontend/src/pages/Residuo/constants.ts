import { ptBR } from 'date-fns/locale';
import { format } from 'date-fns';
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
  organico: '#795548', // Marrom
  orgânico: '#795548', // Marrom (com acento)
  eletronico: '#FF9800', // Laranja
  eletrônico: '#FF9800', // Laranja (com acento)
};

// Backend só aceita 'kg' ou 'unidade'
export const unidades: UnidadeMedida[] = ['kg', 'unidade'];

export const formatarData = (iso: string) =>
  format(new Date(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

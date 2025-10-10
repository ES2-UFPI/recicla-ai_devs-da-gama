import { ptBR } from 'date-fns/locale';
import { format } from 'date-fns';
import type { ResiduoStatus, UnidadeMedida } from '../../types/residuo';
import type { ChipProps } from '@mui/material';

export const statusColor: Record<ResiduoStatus, ChipProps['color']> = {
  CRIADO: 'secondary',
  AGENDADO: 'warning',
  COLETADO: 'info',
  ENTREGUE: 'success',
};

// Cores padronizadas de reciclagem (seguindo convenção internacional)
export const categoriaColor: Record<string, string> = {
  papel: '#2196F3', // Azul
  plastico: '#F44336', // Vermelho
  vidro: '#4CAF50', // Verde
  metal: '#FFC107', // Amarelo
  organico: '#795548', // Marrom
  eletronico: '#FF9800', // Laranja (mantido para futuros dados)
};

export const unidades: UnidadeMedida[] = ['unidade', 'kg', 'g', 'L', 'mL'];

export const formatarData = (iso: string) =>
  format(new Date(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

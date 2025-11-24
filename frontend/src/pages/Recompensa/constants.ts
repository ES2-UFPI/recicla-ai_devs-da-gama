import type { TipoRecompensa } from './types';

export const ITEMS_PER_PAGE = 18;
export const FALLBACK_IMAGE = '/reciclaAi-logo.png';

export const tipoLabels: Record<TipoRecompensa, string> = {
  produto: 'Produto',
  desconto: 'Desconto',
  voucher: 'Voucher',
  cupom: 'Cupom',
  todos: 'Todos',
};

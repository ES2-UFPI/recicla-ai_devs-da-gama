import api from './api';

/**
 * Interface para cada entrada do relatório por categoria
 */
export interface CategoryQuantity {
  categoria: string;
  tipo_medida: 'kg' | 'unidade';
  quantidade: number;
}

/**
 * Interface para resposta do relatório
 */
export interface RelatorioResponse {
  by_category: CategoryQuantity[];
}

/**
 * Serviço para operações relacionadas a relatórios
 */
export const relatorioService = {
  /**
   * Busca o relatório do usuário autenticado
   * Disponível para produtores e receptores
   */
  async getMyReport(): Promise<RelatorioResponse> {
    const response = await api.get<RelatorioResponse>('/users/me/report');
    return response.data;
  },
};

import api from './api';

export interface Recompensa {
  id: string;
  nome: string;
  tipo: 'produto' | 'desconto' | 'voucher' | 'cupom';
  descricao: string;
  pontos_necessarios: number;
  foto_url?: string;
  estoque: number;
  parceiro?: string;
  data_cadastro: string;
  ativo: boolean;
}

export interface ResgateResponse {
  id: string;
  user_id: string;
  recompensa_id: string;
  pontos_gastos: number;
  data_resgate: string;
}

class RecompensaService {
  /**
   * Lista recompensas ativas com filtros e paginação
   */
  async getRecompensasAtivas(params?: {
    com_estoque?: boolean;
    skip?: number;
    limit?: number;
  }): Promise<Recompensa[]> {
    const { data } = await api.get<Recompensa[]>('/recompensas/ativas', { params });
    return data;
  }

  /**
   * Obtém detalhes de uma recompensa específica
   */
  async getRecompensa(id: string): Promise<Recompensa> {
    const { data } = await api.get<Recompensa>(`/recompensas/${id}`);
    return data;
  }

  /**
   * Resgata uma recompensa
   */
  async resgatarRecompensa(recompensaId: string): Promise<ResgateResponse> {
    const { data } = await api.post<ResgateResponse>(`/recompensas/${recompensaId}/resgatar`);
    return data;
  }

  /**
   * Lista resgates do usuário autenticado
   */
  async getMeusResgates(params?: {
    skip?: number;
    limit?: number;
  }): Promise<ResgateResponse[]> {
    const { data } = await api.get<ResgateResponse[]>('/recompensas/meus-resgates', { params });
    return data;
  }
}

export default new RecompensaService();

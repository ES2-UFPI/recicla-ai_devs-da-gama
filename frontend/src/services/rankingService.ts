import api from './api';

/**
 * Interface para entrada de ranking retornada pela API
 */
export interface RankingEntry {
  user_id: string;
  name: string | null;
  cidade_id: string | null;
  estado_id: string | null;
  points: number;
  position: number | null;
}

/**
 * Interface para resposta de ranking da API
 */
export interface RankingResponse {
  level: string; // 'global' | 'estado' | 'cidade'
  code: string | null; // código do estado ou cidade
  cidade_nome: string | null; // nome da cidade (quando level=cidade)
  estado_nome: string | null; // nome do estado (quando level=estado)
  total: number;
  top: RankingEntry[];
}

/**
 * Tipo de ranking disponível
 */
export type RankingLevel = 'global' | 'estado' | 'cidade';

/**
 * Serviço para operações relacionadas ao ranking
 */
class RankingService {
  /**
   * Busca o ranking por nível
   * @param level - Nível do ranking ('global', 'estado', 'cidade')
   * @param code - Código do estado ou cidade (obrigatório para 'estado' e 'cidade')
   * @param limit - Número de resultados no top (padrão: 10)
   */
  async getRanking(
    level: RankingLevel,
    code?: string,
    limit: number = 10
  ): Promise<RankingResponse> {
    const params: Record<string, string | number> = { level, limit };
    if (code) {
      params.code = code;
    }

    const response = await api.get<RankingResponse>('/rankings/', { params });
    return response.data;
  }

  /**
   * Busca a posição do usuário no ranking
   * @param userId - ID do usuário
   * @param level - Nível do ranking ('global', 'estado', 'cidade')
   * @param code - Código do estado ou cidade (obrigatório para 'estado' e 'cidade')
   */
  async getUserPosition(
    userId: string,
    level: RankingLevel,
    code?: string
  ): Promise<number> {
    const params: Record<string, string> = { level };
    if (code) {
      params.code = code;
    }

    const response = await api.get<{ position: number }>(
      `/rankings/position/${userId}`,
      { params }
    );
    return response.data.position;
  }

  /**
   * Força recalculação do ranking (admin/cron)
   * @param level - Nível do ranking ('global', 'estado', 'cidade')
   * @param code - Código do estado ou cidade (obrigatório para 'estado' e 'cidade')
   * @param limit - Número de resultados no top (padrão: 10)
   */
  async refreshRanking(
    level: RankingLevel,
    code?: string,
    limit: number = 10
  ): Promise<RankingResponse> {
    const params: Record<string, string | number> = { level, limit };
    if (code) {
      params.code = code;
    }

    const response = await api.post<RankingResponse>('/rankings/refresh', null, {
      params,
    });
    return response.data;
  }
}

export default new RankingService();

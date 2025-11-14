/**
 * Serviço para gerenciar entregas de resíduos para receptoras
 */

import api from './api';
import type {
  BuscarReceptorasRequest,
  ReceptoraComDistancia,
  EntregaCreate,
  EntregaResponse,
  EntregaSumario,
} from '../types/entrega';

export const entregaService = {
  /**
   * Buscar receptoras próximas da localização do coletor
   * @param params Filtros de busca (latitude, longitude, raio, materiais_aceitos)
   * @returns Lista de receptoras com distância calculada
   */
  async buscarReceptorasProximas(
    params: BuscarReceptorasRequest
  ): Promise<ReceptoraComDistancia[]> {
    const response = await api.post<ReceptoraComDistancia[]>(
      '/entregas/buscar-receptoras',
      params
    );
    return response.data;
  },

  /**
   * Criar uma nova entrega de resíduos para uma receptora
   * @param data Dados da entrega (receptora_id, residuos_id, observacoes)
   * @returns Dados da entrega criada
   */
  async criarEntrega(data: EntregaCreate): Promise<EntregaResponse> {
    const response = await api.post<EntregaResponse>('/entregas', data);
    return response.data;
  },

  /**
   * Listar entregas do coletor autenticado
   * @param skip Número de registros a pular (paginação)
   * @param limit Número máximo de registros a retornar
   * @returns Lista de entregas
   */
  async listarEntregas(skip = 0, limit = 100): Promise<EntregaResponse[]> {
    const response = await api.get<EntregaResponse[]>('/entregas', {
      params: { skip, limit },
    });
    return response.data;
  },

  /**
   * Obter sumário de entregas por categoria
   * @returns Estatísticas agregadas de entregas
   */
  async obterSumarioEntregas(): Promise<EntregaSumario[]> {
    const response = await api.get<EntregaSumario[]>('/entregas/sumario');
    return response.data;
  },
};

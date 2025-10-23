import api from './api';

/**
 * Estrutura da categoria retornada pelo backend
 */
export interface Categoria {
  tipo: string;
  descricao: string;
  preco_por_kg: number;
  preco_por_unidade?: number;
}

/**
 * Estrutura do resíduo retornada pela API
 * Corresponde ao ResidueResponse do backend
 */
export interface ResiduoDetalhado {
  id: string;
  produtorId: string;
  categoriaId: string;
  quantidade: number;
  tipo_medida: string;
  foto?: string;
  status: string;
  valorEstimado: number;
  dataCadastro: string;
  // Nota: categoria não vem populada pela API, apenas categoriaId
  // Se necessário buscar categoria, usar o serviço de categorias
}

class ResiduoService {
  /**
   * Busca detalhes de um resíduo (endpoint para coletores)
   * Coletores podem visualizar informações de qualquer resíduo para fins de coleta
   */
  async buscarResiduoColetor(residuoId: string): Promise<ResiduoDetalhado> {
    try {
      const response = await api.get<ResiduoDetalhado>(`/residuos/coletor/${residuoId}`);
      return response.data;
    } catch (error) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { detail?: string } }; message?: string };
        console.error(`Erro ao buscar resíduo ${residuoId}:`, axiosError.response?.data || axiosError.message);
        throw new Error(axiosError.response?.data?.detail || `Erro ao buscar resíduo ${residuoId}`);
      }
      console.error(`Erro ao buscar resíduo ${residuoId}:`, error);
      throw new Error(`Erro ao buscar resíduo ${residuoId}`);
    }
  }

  /**
   * Busca detalhes de múltiplos resíduos (para coletores)
   */
  async buscarResiduosColetor(residuosIds: string[]): Promise<ResiduoDetalhado[]> {
    try {
      const promises = residuosIds.map(id => this.buscarResiduoColetor(id));
      const resultados = await Promise.allSettled(promises);
      
      // Filtra apenas os resíduos que foram carregados com sucesso
      return resultados
        .filter((result): result is PromiseFulfilledResult<ResiduoDetalhado> => result.status === 'fulfilled')
        .map(result => result.value);
    } catch (error) {
      console.error('Erro ao buscar múltiplos resíduos:', error);
      throw error;
    }
  }
}

export const residuoService = new ResiduoService();

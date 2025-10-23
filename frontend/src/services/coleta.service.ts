import api from './api';

export interface LocalColeta {
  address_id: number;
  apelido?: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  latitude?: string;
  longitude?: string;
}

export interface Coleta {
  id: string;
  agendamento_id: string;
  produtor_id: string;
  coletor_id: string;
  residuos_id: string[];
  data_hora: string;
  local: LocalColeta;
  observacoes?: string;
  estado: 'PENDENTE' | 'EM_ANDAMENTO' | 'CANCELADA';
}

export interface AceitarColetaRequest {
  agendamento_id: string;
  residuos_ids: string[];
}

export interface ColetarResiduoRequest {
  residuos_ids: string[];
  observacao?: string;
}

export interface RejeitarResiduoRequest {
  residuos_ids: string[];
  motivo: string;
}

export interface CancelarColetaRequest {
  motivo?: string;
}

class ColetaService {
  /**
   * Aceita uma coleta
   */
  async aceitarColeta(data: AceitarColetaRequest): Promise<Coleta> {
    try {
      console.log('Enviando dados para aceitar coleta:', data);
      const response = await api.post<Coleta>('/coletas/aceitar', data);
      console.log('Resposta ao aceitar coleta:', response.data);
      return response.data;
    } catch (error) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { detail?: string } }; message?: string };
        console.error('Erro ao aceitar coleta:', axiosError.response?.data || axiosError.message);
        throw new Error(axiosError.response?.data?.detail || 'Erro ao aceitar coleta');
      }
      console.error('Erro ao aceitar coleta:', error);
      throw new Error('Erro ao aceitar coleta');
    }
  }

  /**
   * Inicia uma coleta (coletor chegou no local)
   */
  async iniciarColeta(coletaId: string): Promise<Coleta> {
    const response = await api.patch<Coleta>(`/coletas/${coletaId}/iniciar`);
    return response.data;
  }

  /**
   * Marca resíduos como coletados
   */
  async coletarResiduos(coletaId: string, data: ColetarResiduoRequest): Promise<Coleta> {
    const response = await api.patch<Coleta>(`/coletas/${coletaId}/coletar-residuo`, data);
    return response.data;
  }

  /**
   * Rejeita resíduos
   */
  async rejeitarResiduos(coletaId: string, data: RejeitarResiduoRequest): Promise<Coleta> {
    const response = await api.patch<Coleta>(`/coletas/${coletaId}/rejeitar-residuo`, data);
    return response.data;
  }

  /**
   * Cancela coleta antes de chegar ao local
   */
  async cancelarAntesLocal(coletaId: string, data?: CancelarColetaRequest): Promise<Coleta> {
    const response = await api.post<Coleta>(`/coletas/${coletaId}/cancelar-antes-local`, data || {});
    return response.data;
  }

  /**
   * Cancela coleta após chegar ao local
   */
  async cancelarAposLocal(coletaId: string, data?: CancelarColetaRequest): Promise<Coleta> {
    const response = await api.post<Coleta>(`/coletas/${coletaId}/cancelar`, data || {});
    return response.data;
  }

  /**
   * Lista coletas do coletor autenticado
   */
  async listarMinhasColetas(params?: {
    estado?: 'PENDENTE' | 'EM_ANDAMENTO' | 'CANCELADA';
    limit?: number;
    skip?: number;
  }): Promise<Coleta[]> {
    const response = await api.get<Coleta[]>('/coletas/minhas', { params });
    return response.data;
  }

  /**
   * Busca coleta ativa (EM_ANDAMENTO)
   */
  async buscarColetaAtiva(): Promise<Coleta | null> {
    try {
      const coletas = await this.listarMinhasColetas({ estado: 'EM_ANDAMENTO', limit: 1 });
      return coletas.length > 0 ? coletas[0] : null;
    } catch (error) {
      console.error('Erro ao buscar coleta ativa:', error);
      return null;
    }
  }

  /**
   * Busca coleta pendente (PENDENTE)
   */
  async buscarColetaPendente(): Promise<Coleta | null> {
    try {
      const coletas = await this.listarMinhasColetas({ estado: 'PENDENTE', limit: 1 });
      return coletas.length > 0 ? coletas[0] : null;
    } catch (error) {
      console.error('Erro ao buscar coleta pendente:', error);
      return null;
    }
  }
}

export const coletaService = new ColetaService();

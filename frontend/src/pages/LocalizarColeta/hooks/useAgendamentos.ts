import { useState, useCallback } from 'react';
import api from '../../../services/api';

interface LocalEndereco {
  address_id: number;
  apelido?: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  latitude?: string;
  longitude?: string;
}

interface DisponibilidadeSlot {
  data: string;
  hora_inicio: string;
  hora_fim: string;
}

interface Residuo {
  id: string;
  categoriaId: string;
  categoria?: {
    id: string;
    tipo: string;
    descricao: string;
    preco_por_kg: number;
    preco_por_unidade?: number;
  };
  quantidade: number;
  tipo_medida: string;
  foto?: string;
  status: string;
}

export interface Agendamento {
  id?: string;
  _id?: string;
  produtorId: string;
  residuosId: string[];
  disponibilidade: DisponibilidadeSlot[];
  local: LocalEndereco;
  status: string;
  observacoes?: string;
  distancia_km: number;
  residuos: Residuo[];
  coleta_integral: boolean;
}

interface BuscarAgendamentosParams {
  latitude: number;
  longitude: number;
  raio: number;
  data_busca: string;
  hora_busca: string;
  categorias_ids?: string[];
}

export const useAgendamentos = () => {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarAgendamentosDisponiveis = useCallback(async (params: BuscarAgendamentosParams) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post<Agendamento[]>('/schedules/disponiveis', params);
      console.log('Resposta da API (agendamentos):', response.data);
      
      // Normaliza os IDs (converte _id para id se necessário)
      const agendamentosNormalizados = response.data.map(agendamento => ({
        ...agendamento,
        id: agendamento.id || agendamento._id || '',
      }));
      
      setAgendamentos(agendamentosNormalizados);
      return agendamentosNormalizados;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao buscar agendamentos';
      setError(errorMsg);
      console.error('Erro ao buscar agendamentos:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    agendamentos,
    loading,
    error,
    buscarAgendamentosDisponiveis,
  };
};

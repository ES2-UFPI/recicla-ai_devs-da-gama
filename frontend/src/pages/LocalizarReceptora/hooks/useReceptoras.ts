/**
 * Hook useReceptoras
 * 
 * Gerencia o estado e operações relacionadas às receptoras.
 * Atualmente utiliza dados MOCK, mas está preparado para integração com API.
 * 
 * TODO: Quando a API de receptoras estiver pronta:
 * - Substituir MOCK_RECEPTORAS por chamada HTTP
 * - Ajustar interfaces conforme schema do backend
 * - Implementar filtros no backend
 */

import { useState, useCallback } from 'react';

/**
 * Horário de funcionamento da receptora
 */
interface HorarioFuncionamento {
  dia_semana: string;
  hora_inicio: string;
  hora_fim: string;
  aberto: boolean;
}

/**
 * Interface que representa uma receptora
 */
export interface Receptora {
  id: string;
  nome: string;
  descricao?: string;
  endereco: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cep: string;
    cidade: string;
    estado: string;
    latitude: string;
    longitude: string;
  };
  materiais_aceitos: string[];
  horario_funcionamento: HorarioFuncionamento[];
  telefone?: string;
  email?: string;
  responsavel?: string;
  observacoes?: string;
  ativo: boolean;
  distancia_km?: number;
}

interface BuscarReceptorasParams {
  latitude: number;
  longitude: number;
  raio: number;
  categorias_ids?: string[];
}

const MOCK_RECEPTORAS: Receptora[] = [
  {
    id: 'receptora001',
    nome: 'EcoPonto Central',
    descricao: 'Centro de reciclagem com ampla estrutura.',
    endereco: {
      logradouro: 'Av. Frei Serafim',
      numero: '1500',
      complemento: 'Próximo ao Shopping',
      bairro: 'Centro',
      cep: '64000-100',
      cidade: 'Teresina',
      estado: 'PI',
      latitude: '-5.0892',
      longitude: '-42.8019',
    },
    materiais_aceitos: ['68f01f938fe830786876ccd4', '68f01f938fe830786876ccd6', '68f01f938fe830786876ccd7', '68f01f938fe830786876ccd5'],
    horario_funcionamento: [
      { dia_semana: 'Segunda', hora_inicio: '08:00', hora_fim: '18:00', aberto: true },
      { dia_semana: 'Terça', hora_inicio: '08:00', hora_fim: '18:00', aberto: true },
      { dia_semana: 'Quarta', hora_inicio: '08:00', hora_fim: '18:00', aberto: true },
      { dia_semana: 'Quinta', hora_inicio: '08:00', hora_fim: '18:00', aberto: true },
      { dia_semana: 'Sexta', hora_inicio: '08:00', hora_fim: '18:00', aberto: true },
      { dia_semana: 'Sábado', hora_inicio: '08:00', hora_fim: '12:00', aberto: true },
      { dia_semana: 'Domingo', hora_inicio: '', hora_fim: '', aberto: false },
    ],
    telefone: '(86) 3221-5500',
    email: 'contato@ecopontocentral.com.br',
    responsavel: 'Maria Silva',
    observacoes: 'Aceita grandes volumes. Agendar previamente para cargas acima de 100kg.',
    ativo: true,
  },
  {
    id: 'receptora002',
    nome: 'Recicladora do Piauí',
    descricao: 'Especializada em metais e eletrônicos.',
    endereco: {
      logradouro: 'Rua São Pedro',
      numero: '850',
      bairro: 'São Pedro',
      cep: '64001-120',
      cidade: 'Teresina',
      estado: 'PI',
      latitude: '-5.0820',
      longitude: '-42.8050',
    },
    materiais_aceitos: ['68f01f938fe830786876ccd7', '68f01f938fe830786876ccd8', '68f01f938fe830786876ccd4'],
    horario_funcionamento: [
      { dia_semana: 'Segunda', hora_inicio: '07:00', hora_fim: '17:00', aberto: true },
      { dia_semana: 'Terça', hora_inicio: '07:00', hora_fim: '17:00', aberto: true },
      { dia_semana: 'Quarta', hora_inicio: '07:00', hora_fim: '17:00', aberto: true },
      { dia_semana: 'Quinta', hora_inicio: '07:00', hora_fim: '17:00', aberto: true },
      { dia_semana: 'Sexta', hora_inicio: '07:00', hora_fim: '17:00', aberto: true },
      { dia_semana: 'Sábado', hora_inicio: '', hora_fim: '', aberto: false },
      { dia_semana: 'Domingo', hora_inicio: '', hora_fim: '', aberto: false },
    ],
    telefone: '(86) 3225-7800',
    responsavel: 'João Santos',
    observacoes: 'Pagamento à vista no momento da entrega.',
    ativo: true,
  },
  {
    id: 'receptora003',
    nome: 'Cooperativa Verde Vida',
    descricao: 'Cooperativa focada em papel e papelão.',
    endereco: {
      logradouro: 'Av. Maranhão',
      numero: '2300',
      complemento: 'Galpão 5',
      bairro: 'Marquês',
      cep: '64002-300',
      cidade: 'Teresina',
      estado: 'PI',
      latitude: '-5.1000',
      longitude: '-42.7900',
    },
    materiais_aceitos: ['68f01f938fe830786876ccd6', '68f01f938fe830786876ccd4'],
    horario_funcionamento: [
      { dia_semana: 'Segunda', hora_inicio: '08:00', hora_fim: '17:00', aberto: true },
      { dia_semana: 'Terça', hora_inicio: '08:00', hora_fim: '17:00', aberto: true },
      { dia_semana: 'Quarta', hora_inicio: '08:00', hora_fim: '17:00', aberto: true },
      { dia_semana: 'Quinta', hora_inicio: '08:00', hora_fim: '17:00', aberto: true },
      { dia_semana: 'Sexta', hora_inicio: '08:00', hora_fim: '17:00', aberto: true },
      { dia_semana: 'Sábado', hora_inicio: '08:00', hora_fim: '13:00', aberto: true },
      { dia_semana: 'Domingo', hora_inicio: '', hora_fim: '', aberto: false },
    ],
    telefone: '(86) 3223-4400',
    email: 'cooperativa@verdevida.org.br',
    responsavel: 'Ana Paula',
    observacoes: 'Necessário separar os materiais por tipo antes da entrega.',
    ativo: true,
  },
  {
    id: 'receptora004',
    nome: 'Recicle Mais',
    descricao: 'Ponto de coleta de vidros e plásticos.',
    endereco: {
      logradouro: 'Rua Coelho de Resende',
      numero: '1420',
      bairro: 'Centro',
      cep: '64000-250',
      cidade: 'Teresina',
      estado: 'PI',
      latitude: '-5.0950',
      longitude: '-42.8100',
    },
    materiais_aceitos: ['68f01f938fe830786876ccd5', '68f01f938fe830786876ccd4'],
    horario_funcionamento: [
      { dia_semana: 'Segunda', hora_inicio: '09:00', hora_fim: '18:00', aberto: true },
      { dia_semana: 'Terça', hora_inicio: '09:00', hora_fim: '18:00', aberto: true },
      { dia_semana: 'Quarta', hora_inicio: '09:00', hora_fim: '18:00', aberto: true },
      { dia_semana: 'Quinta', hora_inicio: '09:00', hora_fim: '18:00', aberto: true },
      { dia_semana: 'Sexta', hora_inicio: '09:00', hora_fim: '18:00', aberto: true },
      { dia_semana: 'Sábado', hora_inicio: '09:00', hora_fim: '14:00', aberto: true },
      { dia_semana: 'Domingo', hora_inicio: '', hora_fim: '', aberto: false },
    ],
    telefone: '(86) 3229-1100',
    email: 'contato@reciclemais.com',
    ativo: true,
  },
  {
    id: 'receptora005',
    nome: 'Ecotech Reciclagem',
    descricao: 'Especializada em eletrônicos e baterias.',
    endereco: {
      logradouro: 'Av. Jóquei Clube',
      numero: '3850',
      bairro: 'Jóquei',
      cep: '64048-000',
      cidade: 'Teresina',
      estado: 'PI',
      latitude: '-5.0700',
      longitude: '-42.7950',
    },
    materiais_aceitos: ['68f01f938fe830786876ccd8'],
    horario_funcionamento: [
      { dia_semana: 'Segunda', hora_inicio: '08:00', hora_fim: '17:30', aberto: true },
      { dia_semana: 'Terça', hora_inicio: '08:00', hora_fim: '17:30', aberto: true },
      { dia_semana: 'Quarta', hora_inicio: '08:00', hora_fim: '17:30', aberto: true },
      { dia_semana: 'Quinta', hora_inicio: '08:00', hora_fim: '17:30', aberto: true },
      { dia_semana: 'Sexta', hora_inicio: '08:00', hora_fim: '17:30', aberto: true },
      { dia_semana: 'Sábado', hora_inicio: '', hora_fim: '', aberto: false },
      { dia_semana: 'Domingo', hora_inicio: '', hora_fim: '', aberto: false },
    ],
    telefone: '(86) 3234-5600',
    email: 'contato@ecotech.com.br',
    responsavel: 'Carlos Eduardo',
    observacoes: 'Certificado de descarte para empresas disponível.',
    ativo: true,
  },
];

function calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const useReceptoras = () => {
  const [receptoras, setReceptoras] = useState<Receptora[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarReceptorasProximas = useCallback(async (params: BuscarReceptorasParams) => {
    setLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      let resultado = [...MOCK_RECEPTORAS];

      resultado = resultado.filter(r => r.ativo);

      resultado = resultado
        .map(receptora => {
          const lat = parseFloat(receptora.endereco.latitude);
          const lng = parseFloat(receptora.endereco.longitude);
          const distancia = calcularDistancia(params.latitude, params.longitude, lat, lng);

          return { ...receptora, distancia_km: distancia };
        })
        .filter(receptora => receptora.distancia_km! <= params.raio);

      if (params.categorias_ids && params.categorias_ids.length > 0) {
        resultado = resultado.filter(receptora =>
          params.categorias_ids!.some(catId => receptora.materiais_aceitos.includes(catId))
        );
      }

      resultado.sort((a, b) => (a.distancia_km || 0) - (b.distancia_km || 0));

      setReceptoras(resultado);
      return resultado;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao buscar receptoras';
      setError(errorMsg);
      console.error('Erro ao buscar receptoras:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const buscarReceptoraPorId = useCallback(async (id: string): Promise<Receptora | null> => {
    setLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const receptora = MOCK_RECEPTORAS.find(r => r.id === id);
      return receptora || null;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao buscar receptora';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    receptoras,
    loading,
    error,
    buscarReceptorasProximas,
    buscarReceptoraPorId,
  };
};

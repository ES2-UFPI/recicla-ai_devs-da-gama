/**
 * Adapter para Entregas
 * 
 * Este adapter segue o padrão Adapter Design Pattern para abstrair a fonte de dados.
 * Atualmente utiliza dados MOCK para desenvolvimento, mas está preparado para
 * ser facilmente conectado à API real no futuro.
 * 
 * COMO CONECTAR À API REAL:
 * 1. Importar o serviço de API (ex: import { api } from '../../services/api')
 * 2. Substituir o método listarMinhasEntregas() para fazer a chamada HTTP
 * 3. Ajustar a interface Entrega se necessário para match com o backend
 * 4. Manter a mesma assinatura de métodos para não quebrar componentes
 * 
 * Exemplo de migração:
 * ```typescript
 * async listarMinhasEntregas(): Promise<Entrega[]> {
 *   const response = await api.get('/entregas/minhas');
 *   return response.data;
 * }
 * ```
 */

/**
 * Interface que representa um resíduo entregue
 */
export interface ResiduoEntregue {
  id: string;
  categoriaId: string;
  quantidade: number;
  tipo_medida: 'kg' | 'unidade';
  valorEstimado: number;
}

/**
 * Interface que representa uma receptora (ponto de coleta)
 */
export interface Receptora {
  id: string;
  nome: string;
  endereco: {
    logradouro: string;
    numero: string;
    complemento?: string;
    cep: string;
    cidade: string;
    estado: string;
    latitude: string;
    longitude: string;
  };
  materiais_aceitos: string[];
  telefone?: string;
  email?: string;
}

/**
 * Interface principal que representa uma entrega completa
 */
export interface Entrega {
  id: string;
  coletor_id: string;
  receptora: Receptora;
  residuos: ResiduoEntregue[];
  data_entrega: string; // ISO 8601 format
  observacoes?: string;
  status: 'ENTREGUE'; // Status sempre ENTREGUE nesta lista
}

/**
 * Dados MOCK para desenvolvimento
 * Representa entregas já realizadas pelo coletor
 */
const MOCK_ENTREGAS: Entrega[] = [
  {
    id: '674a1b2c3d4e5f6g7h8i9j0k',
    coletor_id: 'coletor123',
    receptora: {
      id: 'receptora001',
      nome: 'EcoPonto Central',
      endereco: {
        logradouro: 'Av. Frei Serafim',
        numero: '1500',
        complemento: 'Próximo ao Shopping',
        cep: '64000-100',
        cidade: 'Teresina',
        estado: 'PI',
        latitude: '-5.0892',
        longitude: '-42.8019',
      },
      materiais_aceitos: ['Plástico', 'Papel', 'Metal', 'Vidro'],
      telefone: '(86) 3221-5500',
      email: 'contato@ecopontocentral.com.br',
    },
    residuos: [
      {
        id: 'res001',
        categoriaId: '691539406ac616e0bcb1141d', // Plástico
        quantidade: 15.5,
        tipo_medida: 'kg',
        valorEstimado: 31.0,
      },
      {
        id: 'res002',
        categoriaId: '691539406ac616e0bcb1141f', // Papel
        quantidade: 20.0,
        tipo_medida: 'kg',
        valorEstimado: 24.0,
      },
      {
        id: 'res003',
        categoriaId: '691539406ac616e0bcb1141d', // Plástico
        quantidade: 50,
        tipo_medida: 'unidade',
        valorEstimado: 5.0,
      },
    ],
    data_entrega: '2025-11-10T14:30:00Z',
    observacoes: 'Material em bom estado, sem contaminação.',
    status: 'ENTREGUE',
  },
  {
    id: '784b2c3d4e5f6g7h8i9j0k1l',
    coletor_id: 'coletor123',
    receptora: {
      id: 'receptora002',
      nome: 'Recicladora do Piauí',
      endereco: {
        logradouro: 'Rua São Pedro',
        numero: '850',
        cep: '64001-120',
        cidade: 'Teresina',
        estado: 'PI',
        latitude: '-5.0820',
        longitude: '-42.8050',
      },
      materiais_aceitos: ['Plástico', 'Metal', 'Eletrônico'],
      telefone: '(86) 3225-7800',
    },
    residuos: [
      {
        id: 'res004',
        categoriaId: '691539406ac616e0bcb11420', // Metal
        quantidade: 30.0,
        tipo_medida: 'kg',
        valorEstimado: 90.0,
      },
      {
        id: 'res005',
        categoriaId: '691539406ac616e0bcb1141e', // Vidro
        quantidade: 100,
        tipo_medida: 'unidade',
        valorEstimado: 20.0,
      },
    ],
    data_entrega: '2025-11-08T09:15:00Z',
    observacoes: undefined,
    status: 'ENTREGUE',
  },
  {
    id: '894c3d4e5f6g7h8i9j0k1l2m',
    coletor_id: 'coletor123',
    receptora: {
      id: 'receptora003',
      nome: 'Cooperativa Verde Vida',
      endereco: {
        logradouro: 'Av. Maranhão',
        numero: '2300',
        complemento: 'Galpão 5',
        cep: '64002-300',
        cidade: 'Teresina',
        estado: 'PI',
        latitude: '-5.1000',
        longitude: '-42.7900',
      },
      materiais_aceitos: ['Papel', 'Papelão', 'Plástico'],
      telefone: '(86) 3223-4400',
      email: 'cooperativa@verdevida.org.br',
    },
    residuos: [
      {
        id: 'res006',
        categoriaId: '691539406ac616e0bcb1141f', // Papel
        quantidade: 50.0,
        tipo_medida: 'kg',
        valorEstimado: 60.0,
      },
      {
        id: 'res007',
        categoriaId: '691539406ac616e0bcb1141f', // Papel
        quantidade: 80,
        tipo_medida: 'unidade',
        valorEstimado: 8.0,
      },
      {
        id: 'res008',
        categoriaId: '691539406ac616e0bcb1141d', // Plástico
        quantidade: 12.5,
        tipo_medida: 'kg',
        valorEstimado: 25.0,
      },
    ],
    data_entrega: '2025-11-05T16:45:00Z',
    observacoes: 'Entrega programada, material separado por categoria.',
    status: 'ENTREGUE',
  },
];

/**
 * Classe Adapter que encapsula a lógica de acesso aos dados
 * 
 * Benefícios do padrão:
 * - Desacopla a UI da fonte de dados
 * - Facilita testes unitários (pode mockar o adapter)
 * - Permite trocar a implementação sem afetar componentes
 * - Centraliza lógica de transformação de dados
 */
class EntregaAdapter {
  /**
   * Lista todas as entregas do coletor autenticado
   * 
   * NOTA: Atualmente retorna dados MOCK após um delay simulado
   * 
   * @returns Promise com array de entregas
   * 
   * TODO: Quando a API estiver pronta:
   * 1. Remover o setTimeout (delay simulado)
   * 2. Fazer chamada HTTP: const response = await api.get('/entregas/minhas')
   * 3. Retornar: return response.data
   * 4. Adicionar tratamento de erros específico da API
   */
  async listarMinhasEntregas(): Promise<Entrega[]> {
    // Simula delay de rede (remover quando conectar à API)
    return new Promise((resolve) => {
      setTimeout(() => {
        // Ordena por data mais recente primeiro
        const entregasOrdenadas = [...MOCK_ENTREGAS].sort((a, b) => {
          return new Date(b.data_entrega).getTime() - new Date(a.data_entrega).getTime();
        });
        resolve(entregasOrdenadas);
      }, 800); // 800ms de delay simulado
    });
  }

  /**
   * Busca uma entrega específica por ID
   * 
   * @param id - ID da entrega
   * @returns Promise com a entrega ou null se não encontrada
   * 
   * TODO: Quando a API estiver pronta:
   * - Implementar: const response = await api.get(`/entregas/${id}`)
   */
  async buscarEntregaPorId(id: string): Promise<Entrega | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const entrega = MOCK_ENTREGAS.find(e => e.id === id);
        resolve(entrega || null);
      }, 500);
    });
  }

  /**
   * Calcula estatísticas das entregas
   * Útil para dashboards e resumos
   * 
   * @returns Promise com estatísticas agregadas
   */
  async calcularEstatisticas(): Promise<{
    totalEntregas: number;
    totalResiduos: number;
    valorTotalEntregue: number;
    receptorasUnicas: number;
  }> {
    const entregas = await this.listarMinhasEntregas();
    
    const totalResiduos = entregas.reduce((sum, e) => sum + e.residuos.length, 0);
    const valorTotal = entregas.reduce((sum, e) => {
      return sum + e.residuos.reduce((sumRes, r) => sumRes + r.valorEstimado, 0);
    }, 0);
    
    const receptorasSet = new Set(entregas.map(e => e.receptora.id));

    return {
      totalEntregas: entregas.length,
      totalResiduos,
      valorTotalEntregue: valorTotal,
      receptorasUnicas: receptorasSet.size,
    };
  }
}

/**
 * Instância singleton do adapter
 * Exportar instância ao invés da classe facilita mock em testes
 */
export const entregaAdapter = new EntregaAdapter();

/**
 * Exporta também a classe para casos de uso avançados
 * (ex: herança, múltiplas instâncias com configurações diferentes)
 */
export { EntregaAdapter };

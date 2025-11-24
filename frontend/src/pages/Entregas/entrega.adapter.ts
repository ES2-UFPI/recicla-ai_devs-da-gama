/**
 * Adapter para Entregas
 * 
 * Este adapter segue o padrão Adapter Design Pattern para abstrair a fonte de dados.
 * Conecta à API real do backend e busca informações complementares (receptora, resíduos)
 * para montar a visualização completa das entregas.
 * 
 * Responsabilidades:
 * - Buscar entregas do backend
 * - Enriquecer com dados da receptora
 * - Enriquecer com dados dos resíduos
 * - Transformar para o formato esperado pela UI
 */

import { entregaService } from '../../services/entrega.service';
import api from '../../services/api';
import type { Residue } from '../../types/residue';
import type { ReceptoraInfo } from '../RealizarEntrega/types';

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
   * Busca da API e enriquece com dados de receptora e resíduos
   * 
   * @returns Promise com array de entregas completas
   */
  async listarMinhasEntregas(): Promise<Entrega[]> {
    try {
      // 1. Buscar entregas do backend
      const entregasBackend = await entregaService.listarEntregas();
      
      // 2. Enriquecer cada entrega com dados completos
      const entregasEnriquecidas = await Promise.all(
        entregasBackend.map(async (entregaBackend) => {
          try {
            // O backend retorna _id, mas precisamos normalizar para id
            const entregaId = (entregaBackend as { _id?: string; id?: string })._id || entregaBackend.id;
            
            // Buscar informações da receptora
            const receptoraResponse = await api.get<ReceptoraInfo>(
              `/entregas/receptora-info/${entregaBackend.receptora_id}`
            );
            const receptoraInfo = receptoraResponse.data;

            // Buscar informações de cada resíduo usando a rota do coletor
            const residuosPromises = entregaBackend.residuos_id.map(async (residuoId) => {
              try {
                const residuoResponse = await api.get<Residue>(
                  `/residuos/coletor/${residuoId}`
                );
                return residuoResponse.data;
              } catch (error) {
                console.error(`Erro ao buscar resíduo ${residuoId}:`, error);
                return null;
              }
            });

            const residuos = (await Promise.all(residuosPromises)).filter(
              (r): r is Residue => r !== null
            );

            // Transformar para o formato da UI
            const entrega: Entrega = {
              id: entregaId, // Usar o ID normalizado
              coletor_id: entregaBackend.coletor_id,
              receptora: {
                id: receptoraInfo.id,
                nome: receptoraInfo.name,
                endereco: {
                  logradouro: receptoraInfo.addresses?.[0]?.logradouro || 'Endereço não informado',
                  numero: receptoraInfo.addresses?.[0]?.numero || 'S/N',
                  complemento: receptoraInfo.addresses?.[0]?.complemento,
                  cep: receptoraInfo.addresses?.[0]?.cep || '',
                  cidade: receptoraInfo.addresses?.[0]?.cidade || '',
                  estado: receptoraInfo.addresses?.[0]?.estado || '',
                  latitude: receptoraInfo.addresses?.[0]?.latitude || '',
                  longitude: receptoraInfo.addresses?.[0]?.longitude || '',
                },
                materiais_aceitos: receptoraInfo.accepted_material || [],
                telefone: receptoraInfo.phone,
                email: receptoraInfo.email,
              },
              residuos: residuos.map((r) => ({
                id: r.id,
                categoriaId: r.categoriaId,
                quantidade: r.quantidade,
                tipo_medida: r.tipo_medida,
                valorEstimado: r.valorEstimado,
              })),
              data_entrega: entregaBackend.data_hora,
              observacoes: entregaBackend.observacoes,
              status: 'ENTREGUE',
            };

            return entrega;
          } catch (error) {
            console.error(`Erro ao enriquecer entrega ${entregaBackend.id}:`, error);
            return null;
          }
        })
      );

      // Filtrar entregas que falharam ao enriquecer e ordenar por data
      const entregasValidas = entregasEnriquecidas
        .filter((e): e is Entrega => e !== null)
        .sort((a, b) => {
          return new Date(b.data_entrega).getTime() - new Date(a.data_entrega).getTime();
        });

      return entregasValidas;
    } catch (error) {
      console.error('Erro ao listar entregas:', error);
      throw error;
    }
  }

  /**
   * Busca uma entrega específica por ID
   * 
   * @param id - ID da entrega
   * @returns Promise com a entrega ou null se não encontrada
   */
  async buscarEntregaPorId(id: string): Promise<Entrega | null> {
    try {
      const entregas = await this.listarMinhasEntregas();
      return entregas.find(e => e.id === id) || null;
    } catch (error) {
      console.error('Erro ao buscar entrega por ID:', error);
      return null;
    }
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

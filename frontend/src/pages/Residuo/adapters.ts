import type { Categoria } from '../../types/residuo';
import api from '../../services/api';
import mockData from './mock/residuos.json';
import type { ResiduosPort, ResiduoCreateInput, ResiduoDTO, ResiduoBackendDTO, CategoriaBackendDTO } from './types';

export class HttpResiduosAdapter implements ResiduosPort {
  /**
   * Converte categoria do backend (tipo) para frontend (nome)
   */
  private mapCategoriaFromBackend(cat: CategoriaBackendDTO): Categoria {
    return {
      id: cat.id,
      nome: cat.tipo, // Backend usa 'tipo', frontend usa 'nome'
      tipo: cat.tipo,
      preco_por_kg: cat.preco_por_kg,
      preco_por_unidade: cat.preco_por_unidade,
    };
  }

  /**
   * Converte resíduo do backend (tipo_medida) para frontend (unidade)
   */
  private mapResiduoFromBackend(res: ResiduoBackendDTO): ResiduoDTO {
    return {
      id: res.id,
      produtorId: res.produtorId,
      categoriaId: res.categoriaId,
      quantidade: res.quantidade,
      unidade: res.tipo_medida, // Backend usa 'tipo_medida', frontend usa 'unidade'
      foto: res.foto || '', // Backend pode retornar null
      valorEstimado: res.valorEstimado,
      status: res.status as ResiduoDTO['status'],
      dataCadastro: res.dataCadastro,
    };
  }

  async list(): Promise<{ residuos: ResiduoDTO[]; categorias: Categoria[] }> {
    const [catRes, resRes] = await Promise.all([
      api.get<CategoriaBackendDTO[]>('/categorias/ativas'), // Rota correta do backend
      api.get<ResiduoBackendDTO[]>('/residuos/meus-residuos'), // Rota correta do backend
    ]);
    
    // Mapear categorias do backend para frontend
    const categorias = (catRes.data ?? []).map(cat => this.mapCategoriaFromBackend(cat));
    
    // Mapear resíduos do backend para frontend
    const residuosBase = (resRes.data ?? []).map(res => this.mapResiduoFromBackend(res));
    
    // Buscar histórico de cada resíduo em paralelo
    const residuosComHistorico = await Promise.all(
      residuosBase.map(async (residuo) => {
        try {
          const historicoRes = await api.get<Array<{
            id: string;
            residuo_id: string;
            acao: string;
            usuario_id: string;
            data_acao: string;
            detalhes?: { descricao?: string; [key: string]: unknown };
          }>>(`/residuos/${residuo.id}/historico`);
          
          // Mapear histórico do backend para frontend
          const historico = (historicoRes.data ?? []).map(h => ({
            etapa: h.acao as ResiduoDTO['status'],
            dataHora: h.data_acao,
            descricao: h.detalhes?.descricao || `${h.acao}`,
          }));
          
          return { ...residuo, historico };
        } catch (error) {
          // Se falhar ao buscar histórico, retorna sem histórico (fallback no componente)
          console.warn(`Erro ao buscar histórico do resíduo ${residuo.id}:`, error);
          return residuo;
        }
      })
    );
    
    // Ordenar por mais recente
    const residuos = residuosComHistorico.sort(
      (a, b) => new Date(b.dataCadastro).getTime() - new Date(a.dataCadastro).getTime()
    );
    
    return { residuos, categorias };
  }

  async create(input: ResiduoCreateInput): Promise<ResiduoDTO> {
    /**
     * IMPORTANTE: Upload de Imagem
     * 
     * O backend atualmente aceita apenas uma URL de string no campo 'foto'.
     * Existem 3 abordagens possíveis:
     * 
     * 1. BACKEND ADICIONA ENDPOINT DE UPLOAD (Recomendado)
     *    - Criar POST /upload/foto que recebe multipart/form-data
     *    - Retorna { url: string } com a URL pública da imagem
     *    - Usar essa URL no campo 'foto' do resíduo
     * 
     * 2. BASE64 (Simples mas não recomendado para produção)
     *    - Converter File para base64 e enviar como string
     *    - Backend salva direto no MongoDB (aumenta muito o tamanho do doc)
     * 
     * 3. SERVIÇO EXTERNO (Complexo)
     *    - Upload para AWS S3, Cloudinary, etc.
     *    - Enviar URL pública para o backend
     * 
     * Por enquanto, enviamos null e o backend aceita (foto é opcional).
     * Quando implementar upload, trocar esta linha.
     */
    
    const payload = {
      quantidade: input.quantidade,
      tipo_medida: input.unidade, // Converter 'unidade' para 'tipo_medida'
      categoriaId: input.categoriaId,
      foto: null, // TODO: Implementar upload de imagem (ver comentário acima)
    };
    
    const response = await api.post<ResiduoBackendDTO>('/residuos', payload);
    return this.mapResiduoFromBackend(response.data);
  }
}

export class MockResiduosAdapter implements ResiduosPort {
  private categorias: Categoria[];
  private residuos: ResiduoDTO[];

  constructor() {
    const data = mockData as { categorias: Categoria[]; residuos: ResiduoDTO[] };
    this.categorias = data.categorias;
    this.residuos = [...data.residuos].sort(
      (a, b) => new Date(b.dataCadastro).getTime() - new Date(a.dataCadastro).getTime()
    );
  }

  async list(): Promise<{ residuos: ResiduoDTO[]; categorias: Categoria[] }> {
    return Promise.resolve({ residuos: this.residuos, categorias: this.categorias });
  }

  async create(input: ResiduoCreateInput): Promise<ResiduoDTO> {
    const now = new Date();
    const novo: ResiduoDTO = {
      id: `r-${Math.random().toString(36).slice(2, 8)}`,
      quantidade: input.quantidade,
      unidade: input.unidade,
      dataCadastro: now.toISOString(),
      foto: '/mock/residuos/placeholder.jpg',
      categoriaId: input.categoriaId,
      produtorId: 'u-1',
      status: 'DISPONIVEL', // Backend usa 'DISPONIVEL' não 'CRIADO'
      valorEstimado: input.quantidade * 2.5, // Mock: valor estimado fictício
      historico: [
        { etapa: 'DISPONIVEL', dataHora: now.toISOString(), descricao: 'Resíduo cadastrado (mock)' },
      ],
    };
    this.residuos = [novo, ...this.residuos];
    return Promise.resolve(novo);
  }
}

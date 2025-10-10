import type { Categoria } from '../../types/residuo';
import api from '../../services/api';
import mockData from './mock/residuos.json';
import type { ResiduosPort, ResiduoCreateInput, ResiduoDTO } from './types';

export class HttpResiduosAdapter implements ResiduosPort {
  async list(): Promise<{ residuos: ResiduoDTO[]; categorias: Categoria[] }> {
    const [catRes, resRes] = await Promise.all([
      api.get<Categoria[]>('/categorias'),
      api.get<ResiduoDTO[]>('/residuos'),
    ]);
    const residuosOrdenados = [...(resRes.data ?? [])].sort(
      (a, b) => new Date(b.dataCadastro).getTime() - new Date(a.dataCadastro).getTime()
    );
    return { residuos: residuosOrdenados, categorias: catRes.data ?? [] };
  }

  async create(input: ResiduoCreateInput): Promise<ResiduoDTO> {
    const formData = new FormData();
    formData.append('quantidade', String(input.quantidade));
    formData.append('unidade', input.unidade);
    formData.append('categoriaId', input.categoriaId);
    formData.append('foto', input.foto);
    const response = await api.post<ResiduoDTO>('/residuos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
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
      status: 'CRIADO',
      historico: [
        { etapa: 'CRIADO', dataHora: now.toISOString(), descricao: 'Resíduo cadastrado (mock)' },
      ],
    };
    this.residuos = [novo, ...this.residuos];
    return Promise.resolve(novo);
  }
}
